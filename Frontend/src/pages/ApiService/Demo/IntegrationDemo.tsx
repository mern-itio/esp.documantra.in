import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Code2,
  Copy,
  ExternalLink,
  Key,
  Loader2,
  Monitor,
  Play,
  RefreshCw,
  Send,
  Upload,
  UserPlus,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiServiceApi } from '../../../services/apiHelper';
import { BRAND } from '../../../config/brand';
import {
  DOCUMANTRA_API_AUTH,
  DOCUMANTRA_SIGN_API_PREFIX,
  getDocuMantraApiBaseUrl,
} from '../../../data/documantraSignApi';
import DemoFieldPlacer, { type DemoPlacedField } from './DemoFieldPlacer';

const SANDBOX_KEY_STORAGE = 'documantra_demo_sandbox_key';
const DEMO_STATE_STORAGE = 'documantra_demo_workflow_state';

type StepId = 'setup' | 'upload' | 'recipients' | 'fields' | 'update' | 'send' | 'status';

type LogEntry = {
  id: string;
  step: string;
  ok: boolean;
  summary: string;
  detail?: unknown;
};

type WorkflowState = {
  envelopeId: string;
  documentId: string;
  recipientId: string;
  envelopeStatus: string;
  signLink: string;
};

const STEPS: { id: StepId; title: string; hint: string }[] = [
  { id: 'setup', title: 'API key + session', hint: 'Sandbox key + logged-in cookie' },
  { id: 'upload', title: 'Upload document', hint: 'PDF recommended (DOCX works without LibreOffice via text fallback)' },
  { id: 'recipients', title: 'Add signer', hint: 'Who will sign' },
  { id: 'fields', title: 'Signature fields', hint: 'Open document & place all fields' },
  { id: 'update', title: 'Envelope details', hint: 'Subject & message' },
  { id: 'send', title: 'Send', hint: 'Email to signer' },
  { id: 'status', title: 'Track status', hint: 'Poll from your UI' },
];

function maskKey(key: string): string {
  if (key.length <= 12) return '••••••••';
  return `${key.slice(0, 8)}••••${key.slice(-4)}`;
}

type ApiPayload = Record<string, unknown>;

function asRecord(value: unknown): ApiPayload | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as ApiPayload) : null;
}

/** Matches live api-service / e-sign response shapes ({ envelopeId } or { data: { envelopeId } }). */
function pickEnvelopeId(data: unknown): string {
  const root = asRecord(data);
  if (!root) return '';
  const nested = asRecord(root.data);
  const fromNested = nested?.envelopeId ?? nested?.id;
  if (fromNested != null && fromNested !== '') return String(fromNested);
  if (root.envelopeId != null && root.envelopeId !== '') return String(root.envelopeId);
  const envelope = asRecord(root.envelope);
  if (envelope?.id != null) return String(envelope.id);
  return '';
}

function pickDocumentId(data: unknown): string {
  const root = asRecord(data);
  if (!root) return '';
  for (const docs of [
    root.documents,
    asRecord(root.data)?.documents,
  ]) {
    const list = docs as Array<{ id?: string; _id?: string }> | undefined;
    const id = list?.[0]?.id ?? list?.[0]?._id;
    if (id) return String(id);
  }
  return '';
}

function pickRecipientId(data: unknown): string {
  const root = asRecord(data);
  if (!root) return '';
  const recipients = root.recipients as Array<{ id?: string }> | undefined;
  if (recipients?.[0]?.id) return String(recipients[0].id);
  const ids = root.recipientIds as Array<string | { toString(): string }> | undefined;
  if (ids?.[0]) return String(ids[0]);
  const links = root.signingLinks as Array<{ recipientId?: string }> | undefined;
  if (links?.[0]?.recipientId) return String(links[0].recipientId);
  const nestedRecipients = asRecord(root.data)?.recipients as Array<{ id?: string }> | undefined;
  if (nestedRecipients?.[0]?.id) return String(nestedRecipients[0].id);
  return '';
}

function pickEnvelopeStatus(data: unknown): string {
  const root = asRecord(data);
  if (!root) return 'unknown';
  const nested = asRecord(root.data);
  if (nested?.status) return String(nested.status);
  const envelope = asRecord(root.envelope);
  if (envelope?.status) return String(envelope.status);
  if (root.status && root.status !== 'success') return String(root.status);
  return 'unknown';
}

function pickSignLink(data: unknown, signerEmail?: string): string {
  const root = asRecord(data);
  if (!root) return '';
  const links = (root.signingLinks ?? asRecord(root.data)?.signingLinks) as
    | Array<{ signLink?: string; email?: string }>
    | undefined;
  if (!links?.length) return '';
  const normalizedEmail = signerEmail?.trim().toLowerCase();
  const match = normalizedEmail
    ? links.find((l) => l.email?.toLowerCase() === normalizedEmail)
    : links[0];
  return match?.signLink ? String(match.signLink) : '';
}

function normalizeEnvelopeStatus(status: string): string {
  return status.toLowerCase().trim().replace(/_/g, '-');
}

function isEnvelopeCompletedStatus(status: string): boolean {
  const normalized = normalizeEnvelopeStatus(status);
  return normalized === 'completed' || normalized === 'signed' || normalized === 'done';
}

function isEnvelopeSentStatus(status: string): boolean {
  const normalized = normalizeEnvelopeStatus(status);
  return (
    normalized === 'sent' ||
    normalized === 'in-progress' ||
    normalized === 'waiting' ||
    normalized === 'pending' ||
    normalized === 'partially-signed' ||
    normalized === 'partiallysigned'
  );
}

type WorkflowPhase = 'setup' | 'draft' | 'sent' | 'completed';

function resolveWorkflowPhase(state: WorkflowState): WorkflowPhase {
  if (!state.envelopeId) return 'setup';
  if (isEnvelopeCompletedStatus(state.envelopeStatus)) return 'completed';
  if (isEnvelopeSentStatus(state.envelopeStatus)) return 'sent';
  return 'draft';
}

function buildFetchSnippet(
  step: StepId,
  sandboxKey: string,
  state: WorkflowState,
  signerEmail: string,
  placedFields: DemoPlacedField[] = [],
): string {
  const base = getDocuMantraApiBaseUrl();
  const headers = `headers: {
    'X-Sandbox-Api-Key': '${sandboxKey || 'YOUR_SANDBOX_KEY'}',
    // Browser: credentials: 'include' forwards DocuMantra login cookie
    // Server: forward Cookie header from authenticated user
  }`;

  switch (step) {
    case 'upload':
      return `const form = new FormData();
form.append('files', pdfFile);

await fetch('${base}/upload-envelope', {
  method: 'POST',
  credentials: 'include',
  ${headers},
  body: form,
});`;
    case 'recipients':
      return `await fetch('${base}/add-recipients', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json', 'X-Sandbox-Api-Key': '${sandboxKey || 'YOUR_SANDBOX_KEY'}' },
  body: JSON.stringify({
    envelopeId: '${state.envelopeId || 'ENVELOPE_ID'}',
    recipients: [{
      name: 'Signer',
      email: '${signerEmail || 'signer@example.com'}',
      role: 'signer',
      order: 1,
      status: 'waiting',
      authentication: 'email',
    }],
  }),
});`;
    case 'fields': {
      const sampleFields =
        placedFields.length > 0
          ? placedFields.map((f) => ({
              documentId: state.documentId || 'DOCUMENT_ID',
              recipientId: state.recipientId || 'RECIPIENT_ID',
              page: f.page,
              x: f.x,
              y: f.y,
              width: f.width,
              height: f.height,
              type: f.type,
              label: f.label,
              status: 'pending',
            }))
          : [
              {
                documentId: state.documentId || 'DOCUMENT_ID',
                recipientId: state.recipientId || 'RECIPIENT_ID',
                page: 1,
                x: 100,
                y: 200,
                width: 240,
                height: 34,
                type: 'signature',
                status: 'pending',
              },
            ];
      return `await fetch('${base}/save-signature-fields', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json', 'X-Sandbox-Api-Key': '${sandboxKey || 'YOUR_SANDBOX_KEY'}' },
  body: JSON.stringify({
    envelopeId: '${state.envelopeId || 'ENVELOPE_ID'}',
    signatureFields: ${JSON.stringify(sampleFields, null, 4).replace(/\n/g, '\n    ')},
  }),
});`;
    }
    case 'update':
      return `await fetch('${base}/update', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json', 'X-Sandbox-Api-Key': '${sandboxKey || 'YOUR_SANDBOX_KEY'}' },
  body: JSON.stringify({
    envelopeId: '${state.envelopeId || 'ENVELOPE_ID'}',
    envelopeData: {
      subject: 'Please sign',
      message: 'Review and sign via ${BRAND.name}.',
      priority: 'normal',
      signingOrder: 'In-Order',
      status: 'draft',
    },
  }),
});`;
    case 'send':
      return `await fetch('${base}/send/${state.envelopeId || 'ENVELOPE_ID'}', {
  method: 'PUT',
  credentials: 'include',
  ${headers},
});`;
    case 'status':
      return `// Call from your dashboard UI every few seconds
await fetch('${base}/envelope/${state.envelopeId || 'ENVELOPE_ID'}', {
  method: 'GET',
  credentials: 'include',
  ${headers},
});`;
    default:
      return `// Every Sign API call needs:
// 1) DocuMantra login session (cookie)
// 2) Header: X-Sandbox-Api-Key: your sandbox key
// Never expose the key in public frontend — use your backend as proxy in production.`;
  }
}

export default function IntegrationDemo() {
  const [sandboxKey, setSandboxKey] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [signerName, setSignerName] = useState('Demo Signer');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeStep, setActiveStep] = useState<StepId>('setup');
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [state, setState] = useState<WorkflowState>({
    envelopeId: '',
    documentId: '',
    recipientId: '',
    envelopeStatus: '',
    signLink: '',
  });
  const [placedFields, setPlacedFields] = useState<DemoPlacedField[]>([]);

  const workflowPhase = useMemo(() => resolveWorkflowPhase(state), [state]);
  const isWorkflowLocked = workflowPhase === 'sent' || workflowPhase === 'completed';
  const canEditFields = workflowPhase === 'setup' || workflowPhase === 'draft';

  useEffect(() => {
    const fromSession = sessionStorage.getItem(SANDBOX_KEY_STORAGE);
    if (fromSession) setSandboxKey(fromSession);
    try {
      const raw = sessionStorage.getItem(DEMO_STATE_STORAGE);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<WorkflowState>;
        setState((prev) => ({
          envelopeId: saved.envelopeId || prev.envelopeId,
          documentId: saved.documentId || prev.documentId,
          recipientId: saved.recipientId || prev.recipientId,
          envelopeStatus: saved.envelopeStatus || prev.envelopeStatus,
          signLink: saved.signLink || prev.signLink,
        }));
        if (saved.envelopeId && isEnvelopeSentStatus(saved.envelopeStatus || '')) {
          setActiveStep('status');
        }
      }
    } catch {
      /* ignore corrupt session data */
    }
  }, []);

  useEffect(() => {
    if (!state.envelopeId || !sandboxKey.trim()) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiServiceApi.get(
          `${DOCUMANTRA_SIGN_API_PREFIX}/envelope/${state.envelopeId}`,
          { headers: { 'X-Sandbox-Api-Key': sandboxKey.trim() } },
        );
        if (cancelled) return;
        const status = pickEnvelopeStatus(res.data);
        const signLink = pickSignLink(res.data, signerEmail) || state.signLink;
        setState((prev) => ({
          ...prev,
          envelopeStatus: status !== 'unknown' ? status : prev.envelopeStatus,
          signLink: signLink || prev.signLink,
          documentId: prev.documentId || pickDocumentId(res.data),
          recipientId: prev.recipientId || pickRecipientId(res.data),
        }));
      } catch {
        /* envelope may not exist yet */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state.envelopeId, sandboxKey, signerEmail]);

  useEffect(() => {
    if (!state.envelopeId) return;
    sessionStorage.setItem(DEMO_STATE_STORAGE, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/api-service/health', { credentials: 'include' });
        if (!cancelled) setApiOnline(res.ok);
      } catch {
        if (!cancelled) setApiOnline(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistKey = useCallback((key: string) => {
    setSandboxKey(key);
    if (key.trim()) sessionStorage.setItem(SANDBOX_KEY_STORAGE, key.trim());
  }, []);

  const pushLog = useCallback((entry: Omit<LogEntry, 'id'>) => {
    setLogs((prev) => [{ ...entry, id: `${Date.now()}-${prev.length}` }, ...prev].slice(0, 12));
  }, []);

  const acceptFile = useCallback((file: File | null) => {
    if (!file) {
      setPdfFile(null);
      setFileError(null);
      return;
    }
    const validType = ['.pdf', '.doc', '.docx'].some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!validType) {
      setPdfFile(null);
      setFileError('Only PDF, DOC, and DOCX files are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPdfFile(null);
      setFileError('File must be 10 MB or smaller.');
      return;
    }
    setPdfFile(file);
    setFileError(null);
    setPlacedFields([]);
  }, []);

  const signHeaders = useMemo(
    () => ({ 'X-Sandbox-Api-Key': sandboxKey.trim() }),
    [sandboxKey],
  );

  const runUploadWith = async (current: WorkflowState) => {
    if (!pdfFile) throw new Error('Please select a PDF file');
    const form = new FormData();
    form.append('files', pdfFile);
    const res = await apiServiceApi.post(`${DOCUMANTRA_SIGN_API_PREFIX}/upload-envelope`, form, {
      headers: signHeaders,
    });
    const data = res.data;
    const envelopeId = pickEnvelopeId(data);
    if (!envelopeId) throw new Error('envelopeId not found in response');

    let documentId = pickDocumentId(data);
    if (!documentId) {
      const detailRes = await apiServiceApi.get(
        `${DOCUMANTRA_SIGN_API_PREFIX}/envelope/${envelopeId}`,
        { headers: signHeaders },
      );
      documentId = pickDocumentId(detailRes.data);
    }

    const next = { ...current, envelopeId, documentId };
    setState(next);
    return { data, next };
  };

  const runRecipientsWith = async (current: WorkflowState) => {
    if (!current.envelopeId) throw new Error('Complete the upload step first');
    if (!signerEmail.trim()) throw new Error('Enter signer email');
    const res = await apiServiceApi.post(
      `${DOCUMANTRA_SIGN_API_PREFIX}/add-recipients`,
      {
        envelopeId: current.envelopeId,
        recipients: [
          {
            name: signerName.trim() || 'Signer',
            email: signerEmail.trim(),
            role: 'signer',
            order: 1,
            status: 'waiting',
            authentication: 'email',
          },
        ],
      },
      { headers: signHeaders },
    );
    const data = res.data;
    const recipientId = pickRecipientId(data) || current.recipientId;
    const signLink = pickSignLink(data, signerEmail) || current.signLink;
    const next = { ...current, recipientId, signLink };
    setState(next);
    return { data, next };
  };

  const runFieldsWith = async (current: WorkflowState) => {
    const { envelopeId, documentId, recipientId } = current;
    if (!envelopeId || !documentId || !recipientId) {
      throw new Error('Complete upload and recipients steps first');
    }
    if (placedFields.length === 0) {
      throw new Error('Place at least one field on the document (signature required)');
    }
    if (!placedFields.some((f) => f.type === 'signature')) {
      throw new Error('Add at least one Signature field on the document');
    }
    const res = await apiServiceApi.post(
      `${DOCUMANTRA_SIGN_API_PREFIX}/save-signature-fields`,
      {
        envelopeId,
        signatureFields: placedFields.map((f) => ({
          documentId,
          recipientId,
          page: f.page,
          x: f.x,
          y: f.y,
          width: f.width,
          height: f.height,
          type: f.type,
          label: f.label,
          status: 'pending',
        })),
      },
      { headers: signHeaders },
    );
    return { data: res.data, next: current };
  };

  const runUpdateWith = async (current: WorkflowState) => {
    if (!current.envelopeId) throw new Error('Envelope ID missing');
    const res = await apiServiceApi.post(
      `${DOCUMANTRA_SIGN_API_PREFIX}/update`,
      {
        envelopeId: current.envelopeId,
        envelopeData: {
          subject: `Please sign — ${BRAND.name} demo`,
          message: 'This is a test envelope sent from your custom UI integration.',
          priority: 'normal',
          signingOrder: 'In-Order',
          reminderEnabled: true,
          reminderInterval: 2,
          requireAllSignatures: true,
          allowDecline: false,
          signatureType: 'standard',
          status: 'draft',
        },
      },
      { headers: signHeaders },
    );
    return { data: res.data, next: current };
  };

  const runSendWith = async (current: WorkflowState) => {
    if (!current.envelopeId) throw new Error('Envelope ID missing');
    const res = await apiServiceApi.put(
      `${DOCUMANTRA_SIGN_API_PREFIX}/send/${current.envelopeId}`,
      undefined,
      { headers: signHeaders },
    );
    const signLink = pickSignLink(res.data, signerEmail) || current.signLink;
    const status = pickEnvelopeStatus(res.data);
    const next = {
      ...current,
      signLink,
      envelopeStatus: status !== 'unknown' ? status : 'sent',
    };
    setState(next);
    return { data: res.data, next };
  };

  const runStatusWith = async (current: WorkflowState) => {
    if (!current.envelopeId) throw new Error('Envelope ID missing');
    const res = await apiServiceApi.get(
      `${DOCUMANTRA_SIGN_API_PREFIX}/envelope/${current.envelopeId}`,
      { headers: signHeaders },
    );
    const data = res.data;
    const status = pickEnvelopeStatus(data);
    const next = { ...current, envelopeStatus: status };
    setState(next);
    return { data, next };
  };

  const refreshStatus = async () => {
    const { data, next } = await runStatusWith(state);
    return { data, status: next.envelopeStatus };
  };

  const runUpload = async () => {
    const { data } = await runUploadWith(state);
    return data;
  };

  const runRecipients = async () => {
    const { data } = await runRecipientsWith(state);
    return data;
  };

  const runFields = async () => {
    const { data } = await runFieldsWith(state);
    return data;
  };

  const runUpdate = async () => {
    const { data } = await runUpdateWith(state);
    return data;
  };

  const runSend = async () => {
    const { data } = await runSendWith(state);
    return data;
  };

  const runStep = async (step: StepId) => {
    if (step === 'setup') {
      if (!sandboxKey.trim()) {
        toast.error('Paste your sandbox API key');
        return;
      }
      sessionStorage.setItem(SANDBOX_KEY_STORAGE, sandboxKey.trim());
      pushLog({ step: 'setup', ok: true, summary: 'Key saved — session cookie sent automatically by browser' });
      setActiveStep('upload');
      toast.success('Setup complete — upload a PDF next');
      return;
    }

    if (!sandboxKey.trim()) {
      toast.error('Enter your API key first');
      setActiveStep('setup');
      return;
    }

    setRunning(true);
    setActiveStep(step);
    try {
      let data: unknown;
      switch (step) {
        case 'upload':
          if (!pdfFile) {
            setFileError('Select a PDF (or DOC/DOCX) before running upload.');
            toast.error('Choose a document file first');
            setRunning(false);
            return;
          }
          data = await runUpload();
          pushLog({ step, ok: true, summary: 'Document uploaded', detail: data });
          setActiveStep('recipients');
          break;
        case 'recipients':
          data = await runRecipients();
          pushLog({ step, ok: true, summary: 'Signer added', detail: data });
          setActiveStep('fields');
          break;
        case 'fields':
          if (placedFields.length === 0) {
            toast.error('Open the document below and place fields first');
            setRunning(false);
            return;
          }
          if (!placedFields.some((f) => f.type === 'signature')) {
            toast.error('Add at least one Signature field on the PDF');
            setRunning(false);
            return;
          }
          data = await runFields();
          pushLog({
            step,
            ok: true,
            summary: `${placedFields.length} field(s) saved`,
            detail: data,
          });
          setActiveStep('update');
          break;
        case 'update':
          data = await runUpdate();
          pushLog({ step, ok: true, summary: 'Envelope updated', detail: data });
          setActiveStep('send');
          break;
        case 'send':
          data = await runSend();
          pushLog({ step, ok: true, summary: 'Envelope sent!', detail: data });
          setActiveStep('status');
          toast.success('Envelope sent to signer');
          break;
        case 'status': {
          const { data: statusData, status } = await refreshStatus();
          data = statusData;
          pushLog({ step, ok: true, summary: `Status: ${status || 'fetched'}`, detail: data });
          if (isEnvelopeCompletedStatus(status)) {
            toast.success('Envelope completed — all signatures collected');
          }
          break;
        }
        default:
          break;
      }
    } catch (err: unknown) {
      const ax = err as {
        response?: { data?: unknown; status?: number };
        message?: string;
        config?: { url?: string; baseURL?: string };
      };
      const failedUrl = ax.config?.url || `${DOCUMANTRA_SIGN_API_PREFIX}/upload-envelope`;
      const responseData = ax.response?.data as { message?: string; error?: string } | undefined;
      const detail = responseData?.message
        || responseData?.error
        || (ax.response?.data ? JSON.stringify(ax.response.data) : ax.message || 'Request failed');
      pushLog({
        step,
        ok: false,
        summary: ax.response?.status === 500 && apiOnline === false
          ? 'API service offline — run npm run dev:core in Backend (port 2105)'
          : `${detail} (${failedUrl})`,
        detail: ax.response?.data,
      });
      toast.error(
        ax.response?.status === 500 && apiOnline === false
          ? 'API service is not running — start Backend dev:core'
          : 'Step failed — see log below',
      );
    } finally {
      setRunning(false);
    }
  };

  const runFullFlow = async () => {
    if (!sandboxKey.trim()) {
      toast.error('Enter your API key');
      return;
    }
    if (!pdfFile) {
      toast.error('Select a PDF');
      return;
    }
    if (!signerEmail.trim()) {
      toast.error('Enter signer email');
      return;
    }
    setRunning(true);
    setLogs([]);
    let flowState = { ...state };
    const chain: { step: StepId; fn: (s: WorkflowState) => Promise<{ data: unknown; next: WorkflowState }> }[] = [
      { step: 'upload', fn: runUploadWith },
      { step: 'recipients', fn: runRecipientsWith },
      { step: 'fields', fn: runFieldsWith },
      { step: 'update', fn: runUpdateWith },
      { step: 'send', fn: runSendWith },
      { step: 'status', fn: runStatusWith },
    ];
    try {
      for (const { step, fn } of chain) {
        setActiveStep(step);
        if (
          step === 'fields' &&
          (placedFields.length === 0 || !placedFields.some((f) => f.type === 'signature'))
        ) {
          toast.error('Place fields on the PDF (include Signature), then run again');
          setRunning(false);
          return;
        }
        const { data, next } = await fn(flowState);
        flowState = next;
        pushLog({ step, ok: true, summary: `${step} OK`, detail: data });
      }
      toast.success('Full workflow complete!');
      setActiveStep('status');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: unknown }; message?: string };
      pushLog({
        step: activeStep,
        ok: false,
        summary: ax.response?.data ? JSON.stringify(ax.response.data) : ax.message || 'Failed',
        detail: ax.response?.data,
      });
      toast.error('Flow stopped — check the log');
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (workflowPhase === 'sent' || workflowPhase === 'completed') {
      setActiveStep('status');
    }
  }, [workflowPhase]);

  useEffect(() => {
    if (workflowPhase !== 'sent' || activeStep !== 'status' || running) return;
    const timer = window.setInterval(() => {
      refreshStatus()
        .then(({ status }) => {
          if (isEnvelopeCompletedStatus(status)) {
            toast.success('Envelope completed — all signatures collected');
          }
        })
        .catch(() => {
          /* ignore background poll errors */
        });
    }, 8000);
    return () => window.clearInterval(timer);
  }, [workflowPhase, activeStep, running, state.envelopeId]);

  const codeSnippet = buildFetchSnippet(activeStep, sandboxKey, state, signerEmail, placedFields);
  const canShowDocumentPanel = Boolean(pdfFile || state.documentId);
  const showFieldEditor = canShowDocumentPanel && canEditFields;
  const showFieldPreview = canShowDocumentPanel && isWorkflowLocked;
  const stepIndex = STEPS.findIndex((s) => s.id === activeStep);
  const sentStepIndex = STEPS.findIndex((s) => s.id === 'send');
  const primaryActionLabel =
    isWorkflowLocked || activeStep === 'status'
      ? workflowPhase === 'completed'
        ? 'Refresh status'
        : 'Check signing status'
      : activeStep === 'setup'
        ? 'Confirm & continue'
        : 'Run current step';

  const handlePrimaryAction = () => {
    if (isWorkflowLocked || activeStep === 'status') {
      void runStep('status');
      return;
    }
    void runStep(activeStep === 'setup' ? 'upload' : activeStep);
  };

  return (
    <div className="min-h-screen bg-[#F5F2EE] p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#155E4B] to-[#260559] p-6 text-white shadow-xl">
          <p className="text-xs font-bold uppercase tracking-widest text-white/70">Integration demo</p>
          <h1 className="mt-1 text-2xl font-bold md:text-3xl">Run the {BRAND.name} API from your UI</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/85 md:text-base">
            This page makes <strong>live API</strong> calls with your sandbox key — the same way you would from your
            website or app. Copy-ready code is shown for every step.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white/15 px-3 py-1">Session cookie (you are logged in)</span>
            <span className="rounded-full bg-white/15 px-3 py-1">Header: X-Sandbox-Api-Key</span>
            <Link to={DOCUMANTRA_API_AUTH.keyRoute} className="rounded-full bg-white/20 px-3 py-1 hover:bg-white/30">
              ← API Keys
            </Link>
          </div>
        </div>

        {apiOnline === false && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
            <strong>API service is offline.</strong> Start the backend from the{' '}
            <code className="rounded bg-red-100 px-1">Backend</code> folder:{' '}
            <code className="rounded bg-red-100 px-1">npm run dev:core</code> — ensure you see{' '}
            <code className="rounded bg-red-100 px-1">[api] starting on port 2105</code>, then refresh this page.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-2xl border border-[#E8E0D4] bg-[#F7F3EE] p-4 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#260559]">
                <Key className="h-4 w-4" /> Step 1 — Sandbox key
              </h2>
              <input
                type="password"
                value={sandboxKey}
                onChange={(e) => persistKey(e.target.value)}
                placeholder="Paste sandbox key from API Keys page"
                className="w-full rounded-xl border border-[#E8E0D4] px-3 py-2.5 font-mono text-sm"
              />
              {sandboxKey && (
                <p className="mt-2 text-xs text-gray-500">Saved: {maskKey(sandboxKey)}</p>
              )}
              <button
                type="button"
                onClick={() => runStep('setup')}
                className="mt-3 w-full rounded-xl bg-[#260559] py-2.5 text-sm font-semibold text-white hover:bg-[#260559]/90"
              >
                Confirm key
              </button>
            </div>

            <div className="rounded-2xl border border-[#E8E0D4] bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-bold text-gray-900">Workflow steps</h2>
              <ol className="space-y-2">
                {STEPS.map((s, i) => {
                  const done =
                    workflowPhase === 'completed'
                      ? true
                      : workflowPhase === 'sent'
                        ? i <= sentStepIndex
                        : i < stepIndex;
                  const current = s.id === activeStep;
                  return (
                    <li
                      key={s.id}
                      className={`flex items-start gap-2 rounded-xl px-2 py-1.5 text-sm ${
                        current ? 'bg-[#155E4B]/10 text-[#155E4B]' : 'text-gray-600'
                      }`}
                    >
                      {done ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      ) : (
                        <Circle className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
                      )}
                      <div>
                        <span className="font-medium">{s.title}</span>
                        <p className="text-xs opacity-80">{s.hint}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-3">
            <div className="rounded-2xl border-2 border-dashed border-[#155E4B]/30 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-[#260559]">
                <Monitor className="h-4 w-4" />
                Your custom UI (simulation)
              </div>
              <p className="mb-4 text-xs text-gray-500">
                Imagine this is your own app — the user clicks here and {BRAND.name} API calls run in the background.
              </p>

              <div className="space-y-3 rounded-xl bg-[#F5F2EE] p-4">
                <div>
                  <p className="mb-2 text-xs font-semibold text-gray-700">
                    <Upload className="mr-1 inline h-3.5 w-3.5" />
                    Document upload <span className="text-red-600">*</span>
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf"
                    className="sr-only"
                    onChange={(e) => acceptFile(e.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
                      pdfFile
                        ? 'border-emerald-400 bg-emerald-50/80'
                        : fileError
                          ? 'border-red-400 bg-red-50/50'
                          : 'border-[#155E4B]/40 bg-white hover:border-[#155E4B] hover:bg-[#155E4B]/5'
                    }`}
                  >
                    <Upload className={`h-8 w-8 ${pdfFile ? 'text-emerald-600' : 'text-[#155E4B]'}`} />
                    {pdfFile ? (
                      <>
                        <span className="text-sm font-semibold text-emerald-800">{pdfFile.name}</span>
                        <span className="text-xs text-emerald-700">
                          {(pdfFile.size / 1024).toFixed(1)} KB — click to change file
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-semibold text-[#260559]">Click to choose a file</span>
                        <span className="text-xs text-gray-500">PDF, DOC, or DOCX · max 10 MB</span>
                      </>
                    )}
                  </button>
                  {fileError && (
                    <p className="mt-2 text-xs font-medium text-red-600">{fileError}</p>
                  )}
                  {!pdfFile && activeStep === 'upload' && !fileError && (
                    <p className="mt-2 text-xs text-amber-700">
                      Required for step 2 — pick a document, then click Run current step.
                    </p>
                  )}
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-gray-700">
                    <UserPlus className="mr-1 inline h-3.5 w-3.5" />
                    Signer name
                    <input
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="text-xs font-semibold text-gray-700">
                    Signer email
                    <input
                      type="email"
                      value={signerEmail}
                      onChange={(e) => setSignerEmail(e.target.value)}
                      placeholder="signer@example.com"
                      className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                    />
                  </label>
                </div>

                {state.envelopeId && (
                  <div className="rounded-lg bg-white p-3 font-mono text-xs text-gray-600">
                    <div>envelopeId: {state.envelopeId}</div>
                    {state.documentId && <div>documentId: {state.documentId}</div>}
                    {state.recipientId && <div>recipientId: {state.recipientId}</div>}
                    {state.envelopeStatus && (
                      <div className="mt-1 flex items-center gap-2">
                        <span>status:</span>
                        <span
                          className={`rounded-full px-2 py-0.5 font-semibold ${
                            workflowPhase === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : workflowPhase === 'sent'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {state.envelopeStatus}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {workflowPhase === 'completed' && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                    <p className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="h-4 w-4" />
                      Envelope completed
                    </p>
                    <p className="mt-1 text-xs text-emerald-900/90">
                      All signatures are collected. Field placement is now read-only — use{' '}
                      <strong>Refresh status</strong> to poll again from your app.
                    </p>
                  </div>
                )}

                {workflowPhase === 'sent' && (
                  <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
                    <p className="font-semibold">Waiting for signer</p>
                    <p className="mt-1 text-xs text-sky-900/90">
                      Envelope is sent. Open the signer link below, then use{' '}
                      <strong>Check signing status</strong> to refresh until status becomes completed.
                    </p>
                  </div>
                )}

                {state.signLink && workflowPhase !== 'completed' && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                    <p className="font-semibold">Signer link (use if email did not arrive)</p>
                    <p className="mt-1 text-xs text-amber-900/90">
                      On localhost, sign-request emails are only sent when Mailgun or SMTP is configured.
                      In dev, the API still marks the envelope sent — open this link as the signer.
                    </p>
                    <a
                      href={state.signLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block break-all font-mono text-xs text-[#155E4B] underline"
                    >
                      {state.signLink}
                    </a>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    disabled={running || (!isWorkflowLocked && activeStep === 'upload' && !pdfFile)}
                    onClick={handlePrimaryAction}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#155E4B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#155E4B]/90 disabled:opacity-60"
                  >
                    {running ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isWorkflowLocked || activeStep === 'status' ? (
                      <RefreshCw className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {primaryActionLabel}
                  </button>
                  {!isWorkflowLocked && (
                  <button
                    type="button"
                    disabled={running}
                    onClick={runFullFlow}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#260559] px-4 py-2 text-sm font-semibold text-[#260559] hover:bg-[#260559]/5 disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                    Run full workflow
                  </button>
                  )}
                  {canEditFields && activeStep !== 'fields' && canShowDocumentPanel && (
                    <button
                      type="button"
                      onClick={() => setActiveStep('fields')}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#155E4B]/40 px-4 py-2 text-sm font-semibold text-[#155E4B] hover:bg-[#155E4B]/5"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Place fields on PDF
                    </button>
                  )}
                  {state.signLink && workflowPhase === 'sent' && (
                    <a
                      href={state.signLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open signer link
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
              <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
                <span className="flex items-center gap-2 text-xs text-gray-400">
                  <Code2 className="h-3.5 w-3.5" />
                  Code for your app (step: {activeStep})
                </span>
                <button
                  type="button"
                  className="text-xs text-gray-400 hover:text-white"
                  onClick={() => {
                    navigator.clipboard.writeText(codeSnippet);
                    toast.success('Code copied');
                  }}
                >
                  <Copy className="mr-1 inline h-3 w-3" />
                  Copy
                </button>
              </div>
              <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-emerald-100">
                <code>{codeSnippet}</code>
              </pre>
            </div>

            <div className="rounded-2xl border border-[#E8E0D4] bg-[#F7F3EE] p-4">
              <h3 className="mb-2 text-sm font-bold text-gray-900">Live API log</h3>
              {logs.length === 0 ? (
                <p className="text-sm text-gray-500">No calls yet — run a step above.</p>
              ) : (
                <ul className="max-h-48 space-y-2 overflow-y-auto text-xs">
                  {logs.map((log) => (
                    <li
                      key={log.id}
                      className={`rounded-lg px-3 py-2 ${log.ok ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'}`}
                    >
                      <span className="font-bold uppercase">{log.step}</span> — {log.summary}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <strong>Production tip:</strong> Do not expose your sandbox key in public frontend code. Store it on your
              server and proxy {BRAND.name} API calls — users only see your UI.
              <Link to="/api-documentation" className="ml-1 font-semibold text-[#155E4B] hover:underline">
                Full docs <ArrowRight className="inline h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {showFieldEditor && (
          <DemoFieldPlacer
            pdfFile={pdfFile}
            documentId={state.documentId}
            envelopeId={state.envelopeId}
            recipientLabel={signerName.trim() || signerEmail.trim() || undefined}
            fields={placedFields}
            onChange={setPlacedFields}
          />
        )}

        {showFieldPreview && (
          <DemoFieldPlacer
            pdfFile={pdfFile}
            documentId={state.documentId}
            envelopeId={state.envelopeId}
            recipientLabel={signerName.trim() || signerEmail.trim() || undefined}
            fields={placedFields}
            onChange={setPlacedFields}
            readOnly
            title={
              workflowPhase === 'completed'
                ? 'Document preview (completed)'
                : 'Document preview (sent — waiting for signature)'
            }
          />
        )}

        {activeStep === 'fields' && canEditFields && placedFields.length === 0 && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Step 4: drag fields from the left panel onto your document (or select a field type and click
            on the PDF). Include at least one <strong>Signature</strong> field, then click{' '}
            <strong>Run current step</strong>.
          </p>
        )}
      </div>
    </div>
  );
}
