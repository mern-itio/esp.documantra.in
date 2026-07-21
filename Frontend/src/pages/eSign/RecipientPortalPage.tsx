import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Archive,
  ArrowUpRight,
  ChevronDown,
  Download,
  FileText,
  Forward,
  Inbox,
  Loader2,
  LogOut,
  Mail,
  Printer,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { eSignApi } from '../../services/apiHelper';
import BrandLogo from '../../components/BrandLogo';
import {
  CookieConsentBanner,
  CookiePreferenceCenter,
} from '../../components/common/CookiePreferenceCenter';

const PORTAL_TOKEN_KEY = 'recipientPortalToken';
const PORTAL_EMAIL_KEY = 'recipientPortalEmail';
const PORTAL_PREFILL_KEY = 'recipientPortalPrefillEmail';
const PORTAL_NAME_KEY = 'recipientPortalPrefillName';
const PORTAL_REFRESH_KEY = 'recipientPortalRefreshToken';

type PortalDocument = {
  envelopeId: string;
  recipientId: string;
  name: string;
  from: string;
  status: 'PENDING' | 'SIGNED' | 'DECLINED' | 'ARCHIVED';
  updatedAt?: string;
  signUrl: string;
};

type PortalStep = 'access' | 'consent' | 'verify' | 'documents';

const PREVIEW_ROWS = [
  { from: 'Mandeep Kaur', name: 'Phantom Compliance - Northgate Fintech Limited', status: 'SIGNED', date: 'Jul 3, 2026' },
  { from: 'Operations Team', name: 'Vendor Agreement - FY26', status: 'PENDING', date: 'Jul 1, 2026' },
  { from: 'Legal Desk', name: 'Mutual NDA - Partner Co.', status: 'SIGNED', date: 'Jun 28, 2026' },
];

function maskEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const [local, domain] = normalized.split('@');
  if (!local || !domain) return '***';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(local.length - visible.length, 1))}@${domain}`;
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function statusBadgeClass(status: PortalDocument['status'] | string) {
  switch (status) {
    case 'SIGNED':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    case 'DECLINED':
      return 'bg-rose-50 text-rose-700 ring-rose-200';
    case 'ARCHIVED':
      return 'bg-gray-100 text-gray-700 ring-gray-200';
    default:
      return 'bg-amber-50 text-amber-800 ring-amber-200';
  }
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
  }
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return '?';
}

function firstName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0] || trimmed;
}

function isJwtExpired(accessToken: string) {
  try {
    const segment = accessToken.split('.')[1];
    if (!segment) return true;
    const payload = JSON.parse(atob(segment.replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload?.exp) return true;
    return payload.exp * 1000 <= Date.now() + 60_000;
  } catch {
    return true;
  }
}

function clearPortalSession() {
  localStorage.removeItem(PORTAL_TOKEN_KEY);
  localStorage.removeItem(PORTAL_EMAIL_KEY);
  localStorage.removeItem(PORTAL_REFRESH_KEY);
}

const RecipientPortalPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [cookieCenterOpen, setCookieCenterOpen] = useState(false);
  const [step, setStep] = useState<PortalStep>('access');
  const [email, setEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<'inbox' | 'archived'>('inbox');
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [info, setInfo] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const [changeEmailMode, setChangeEmailMode] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sessionBootstrapping, setSessionBootstrapping] = useState(true);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const viewerIframeRef = useRef<HTMLIFrameElement>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState('');
  const [viewerTitle, setViewerTitle] = useState('');
  const [viewerStatus, setViewerStatus] = useState<PortalDocument['status'] | ''>('');
  const [viewerFiles, setViewerFiles] = useState<
    Array<{ id: string; name: string; viewUrl: string; remoteViewUrl?: string }>
  >([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [viewerDoc, setViewerDoc] = useState<PortalDocument | null>(null);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardEmail, setForwardEmail] = useState('');
  const [forwardName, setForwardName] = useState('');
  const [forwardMessage, setForwardMessage] = useState('');
  const [forwardBusy, setForwardBusy] = useState(false);
  const [forwardError, setForwardError] = useState('');
  const [forwardSuccess, setForwardSuccess] = useState('');

  const sessionEmail = useMemo(
    () => email.trim().toLowerCase() || localStorage.getItem(PORTAL_EMAIL_KEY) || '',
    [email],
  );

  const displayName = useMemo(() => {
    const fromState = recipientName.trim();
    if (fromState) return fromState;
    const fromStorage = (sessionStorage.getItem(PORTAL_NAME_KEY) || '').trim();
    if (fromStorage) return fromStorage;
    if (sessionEmail) {
      const local = sessionEmail.split('@')[0] || '';
      return local.replace(/[._-]+/g, ' ').trim() || sessionEmail;
    }
    return '';
  }, [recipientName, sessionEmail]);

  const hasKnownSignerSession = useMemo(
    () => Boolean(sessionEmail && (recipientName.trim() || sessionStorage.getItem(PORTAL_NAME_KEY))),
    [sessionEmail, recipientName],
  );

  const persistPortalSession = useCallback(
    (payload: {
      token: string;
      email: string;
      refreshToken?: string;
      recipientName?: string;
    }) => {
      const normalizedEmail = payload.email.trim().toLowerCase();
      localStorage.setItem(PORTAL_TOKEN_KEY, payload.token);
      localStorage.setItem(PORTAL_EMAIL_KEY, normalizedEmail);
      if (payload.refreshToken) {
        localStorage.setItem(PORTAL_REFRESH_KEY, payload.refreshToken);
      }
      setToken(payload.token);
      setEmail(normalizedEmail);
      setMaskedEmail(maskEmail(normalizedEmail));
      sessionStorage.setItem(PORTAL_PREFILL_KEY, normalizedEmail);
      if (payload.recipientName) {
        setRecipientName(payload.recipientName);
        sessionStorage.setItem(PORTAL_NAME_KEY, payload.recipientName);
      }
      setStep('documents');
    },
    [],
  );

  const tryRefreshSession = useCallback(
    async (preferredEmail?: string): Promise<string | null> => {
      const savedEmail = (preferredEmail || localStorage.getItem(PORTAL_EMAIL_KEY) || email)
        .trim()
        .toLowerCase();
      const savedRefresh = localStorage.getItem(PORTAL_REFRESH_KEY);
      if (!savedEmail || !savedRefresh) return null;

      try {
        const response = await eSignApi.post('/api/e-sign/public/recipient-portal/refresh-session', {
          email: savedEmail,
          refreshToken: savedRefresh,
        });
        const nextToken = response.data?.token;
        if (!nextToken) return null;
        persistPortalSession({
          token: nextToken,
          email: savedEmail,
          recipientName: response.data?.recipientName,
        });
        return nextToken;
      } catch {
        return null;
      }
    },
    [email, persistPortalSession],
  );

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const fromUrlEmail = (searchParams.get('email') || '').trim().toLowerCase();
      const fromStorageEmail = (sessionStorage.getItem(PORTAL_PREFILL_KEY) || '').trim().toLowerCase();
      const prefillEmail = fromUrlEmail || fromStorageEmail;

      const fromUrlName = (searchParams.get('name') || '').trim();
      const fromStorageName = (sessionStorage.getItem(PORTAL_NAME_KEY) || '').trim();
      const prefillName = fromUrlName || fromStorageName;

      if (prefillEmail) {
        setEmail(prefillEmail);
        setMaskedEmail(maskEmail(prefillEmail));
        sessionStorage.setItem(PORTAL_PREFILL_KEY, prefillEmail);
      }
      if (prefillName) {
        setRecipientName(prefillName);
        sessionStorage.setItem(PORTAL_NAME_KEY, prefillName);
      }

      const savedToken = localStorage.getItem(PORTAL_TOKEN_KEY);
      const savedEmail = (localStorage.getItem(PORTAL_EMAIL_KEY) || prefillEmail || '')
        .trim()
        .toLowerCase();
      const savedRefresh = localStorage.getItem(PORTAL_REFRESH_KEY);

      if (savedToken && savedEmail && !isJwtExpired(savedToken)) {
        persistPortalSession({ token: savedToken, email: savedEmail });
        if (mounted) setSessionBootstrapping(false);
        return;
      }

      if (savedEmail && savedRefresh) {
        const refreshedToken = await tryRefreshSession(savedEmail);
        if (refreshedToken && mounted) {
          setSessionBootstrapping(false);
          return;
        }
      }

      if (!mounted) return;
      if (prefillEmail) {
        setStep('consent');
        setChangeEmailMode(false);
      } else {
        setStep('access');
        setChangeEmailMode(true);
      }
      setSessionBootstrapping(false);
    };

    setSessionBootstrapping(true);
    bootstrap();
    return () => {
      mounted = false;
    };
  }, [searchParams, persistPortalSession, tryRefreshSession]);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadDocuments = useCallback(
    async (
      activeTab: 'inbox' | 'archived',
      activeToken?: string | null,
      allowRefresh = true,
    ) => {
      const authToken = activeToken || token || localStorage.getItem(PORTAL_TOKEN_KEY);
      if (!authToken) return;

      setListLoading(true);
      setError('');
      try {
        const response = await eSignApi.get('/api/e-sign/public/recipient-portal/documents', {
          params: { tab: activeTab },
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        setDocuments(response.data?.data || []);
        if (response.data?.maskedEmail) {
          setMaskedEmail(response.data.maskedEmail);
        }
        if (response.data?.recipientName) {
          setRecipientName(response.data.recipientName);
          sessionStorage.setItem(PORTAL_NAME_KEY, response.data.recipientName);
        }
      } catch (err: any) {
        const message =
          err?.response?.data?.message || 'Unable to load your documents right now.';
        if (err?.response?.status === 401 && allowRefresh) {
          const refreshedToken = await tryRefreshSession();
          if (refreshedToken) {
            await loadDocuments(activeTab, refreshedToken, false);
            return;
          }
          clearPortalSession();
          setToken(null);
          setStep(sessionEmail ? 'consent' : 'access');
        } else if (err?.response?.status === 401) {
          clearPortalSession();
          setToken(null);
          setStep(sessionEmail ? 'consent' : 'access');
        }
        setError(message);
      } finally {
        setListLoading(false);
      }
    },
    [token, sessionEmail, tryRefreshSession],
  );

  useEffect(() => {
    if (step === 'documents' && token) {
      loadDocuments(tab, token);
    }
  }, [step, tab, token, loadDocuments]);

  const requestCode = async (targetEmail?: string) => {
    const nextEmail = (targetEmail || email).trim().toLowerCase();
    if (!nextEmail) {
      setStep('access');
      setChangeEmailMode(true);
      setFormError('Enter your email address to continue.');
      return;
    }

    setLoading(true);
    setError('');
    setFormError('');
    setInfo('');
    try {
      const response = await eSignApi.post('/api/e-sign/public/recipient-portal/request-code', {
        email: nextEmail,
      });
      setEmail(nextEmail);
      sessionStorage.setItem(PORTAL_PREFILL_KEY, nextEmail);
      setMaskedEmail(response.data?.maskedEmail || maskEmail(nextEmail));
      setResendSeconds(Number(response.data?.resendAfterSeconds || 60));
      setInfo(
        response.data?.message ||
          'If this email has documents waiting, we sent a one-time sign-in code.',
      );
      setChangeEmailMode(false);
      setStep('verify');
    } catch (err: any) {
      const retryAfter = Number(err?.response?.data?.resendAfterSeconds || 0);
      if (retryAfter > 0) {
        setResendSeconds(retryAfter);
        setMaskedEmail(err?.response?.data?.maskedEmail || maskEmail(nextEmail));
        setStep('verify');
      }
      setFormError(err?.response?.data?.message || 'Unable to send access code.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!sessionEmail || !code.trim()) {
      setFormError('Enter the 6-digit code from your email.');
      return;
    }

    setLoading(true);
    setError('');
    setFormError('');
    try {
      const response = await eSignApi.post('/api/e-sign/public/recipient-portal/verify-code', {
        email: sessionEmail,
        code: code.trim(),
      });
      const nextToken = response.data?.token;
      if (!nextToken) {
        throw new Error('Missing portal session token');
      }
      persistPortalSession({
        token: nextToken,
        email: sessionEmail,
        refreshToken: response.data?.refreshToken,
        recipientName: response.data?.recipientName,
      });
      setCode('');
      setInfo('');
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    clearPortalSession();
    setToken(null);
    setDocuments([]);
    setCode('');
    setMaskedEmail(email ? maskEmail(email) : '');
    setStep(sessionEmail ? 'consent' : 'access');
    setError('');
    setFormError('');
    setInfo('');
    setChangeEmailMode(!sessionEmail);
    setUserMenuOpen(false);
    setViewerOpen(false);
    setViewerDoc(null);
  };

  const portalAuthHeaders = useCallback(() => {
    const authToken = token || localStorage.getItem(PORTAL_TOKEN_KEY);
    return authToken ? { Authorization: `Bearer ${authToken}` } : {};
  }, [token]);

  const openDocumentViewer = async (doc: PortalDocument) => {
    setViewerDoc(doc);
    setViewerOpen(true);
    setViewerLoading(true);
    setViewerError('');
    setViewerFiles((prev) => {
      prev.forEach((f) => {
        if (f.viewUrl.startsWith('blob:')) URL.revokeObjectURL(f.viewUrl);
      });
      return [];
    });
    setActiveFileIndex(0);
    setForwardOpen(false);
    setForwardError('');
    setForwardSuccess('');
    setViewerTitle(doc.name);
    setViewerStatus(doc.status);

    try {
      const response = await eSignApi.get(
        `/api/e-sign/public/recipient-portal/documents/${doc.envelopeId}/${doc.recipientId}/viewer`,
        { headers: portalAuthHeaders() },
      );
      const data = response.data?.data;
      const files = Array.isArray(data?.files) ? data.files : [];
      setViewerTitle(data?.title || doc.name);
      setViewerStatus((data?.documentStatus || doc.status) as PortalDocument['status']);

      if (!files.length) {
        setViewerError('No document file is available to preview yet.');
        return;
      }

      // Prefer authenticated blob URLs so preview/print work without leaving the portal.
      const resolved = await Promise.all(
        files.map(async (file: { id: string; name: string; viewUrl: string }) => {
          try {
            const fileRes = await eSignApi.get(
              `/api/e-sign/public/recipient-portal/documents/${doc.envelopeId}/${doc.recipientId}/files/${file.id}`,
              {
                headers: portalAuthHeaders(),
                responseType: 'blob',
              },
            );
            const blob = new Blob([fileRes.data], { type: 'application/pdf' });
            return {
              id: String(file.id),
              name: file.name || 'document.pdf',
              viewUrl: URL.createObjectURL(blob),
              remoteViewUrl: file.viewUrl,
            };
          } catch {
            return {
              id: String(file.id),
              name: file.name || 'document.pdf',
              viewUrl: file.viewUrl,
              remoteViewUrl: file.viewUrl,
            };
          }
        }),
      );
      setViewerFiles(resolved);
    } catch (err: any) {
      setViewerError(err?.response?.data?.message || 'Unable to open this document.');
    } finally {
      setViewerLoading(false);
    }
  };

  const closeDocumentViewer = () => {
    setViewerFiles((prev) => {
      prev.forEach((f) => {
        if (f.viewUrl.startsWith('blob:')) URL.revokeObjectURL(f.viewUrl);
      });
      return [];
    });
    setViewerOpen(false);
    setViewerDoc(null);
    setForwardOpen(false);
  };

  const activeViewerFile = viewerFiles[activeFileIndex] || null;

  const handleViewerPrint = () => {
    const url = activeViewerFile?.viewUrl;
    if (!url) return;
    const printWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (!printWindow) {
      setViewerError('Please allow pop-ups to print this document.');
      return;
    }
    const triggerPrint = () => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch {
        // Browser may block print until PDF finishes loading.
      }
    };
    printWindow.addEventListener('load', () => setTimeout(triggerPrint, 400));
    setTimeout(triggerPrint, 1200);
  };

  const handleViewerDownload = async () => {
    if (!viewerDoc || !activeViewerFile) return;
    try {
      if (activeViewerFile.viewUrl.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = activeViewerFile.viewUrl;
        link.download = activeViewerFile.name || 'document.pdf';
        document.body.appendChild(link);
        link.click();
        link.remove();
        return;
      }
      const response = await eSignApi.get(
        `/api/e-sign/public/recipient-portal/documents/${viewerDoc.envelopeId}/${viewerDoc.recipientId}/files/${activeViewerFile.id}`,
        {
          headers: portalAuthHeaders(),
          params: { download: 1 },
          responseType: 'blob',
        },
      );
      const blobUrl = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = activeViewerFile.name || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      setViewerError(err?.response?.data?.message || 'Download failed. Please try again.');
    }
  };

  const handleViewerForward = async () => {
    if (!viewerDoc) return;
    setForwardError('');
    setForwardSuccess('');

    if (viewerStatus !== 'PENDING') {
      const shareUrl =
        viewerDoc.signUrl ||
        `${window.location.origin}/e-sign/signer/${viewerDoc.envelopeId}/${viewerDoc.recipientId}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
        setForwardSuccess('Document link copied. You can paste it to send forward.');
      } catch {
        window.prompt('Copy this link to send forward:', shareUrl);
      }
      return;
    }

    if (!forwardOpen) {
      setForwardOpen(true);
      return;
    }

    if (!forwardEmail.trim() || !forwardName.trim()) {
      setForwardError('Enter the new recipient name and email.');
      return;
    }

    setForwardBusy(true);
    try {
      await eSignApi.post(
        '/api/e-sign/public/envelope/assign-to-someone-else',
        {
          envelopeId: viewerDoc.envelopeId,
          recipientId: viewerDoc.recipientId,
          newSignerName: forwardName.trim(),
          newSignerEmail: forwardEmail.trim().toLowerCase(),
          reason: forwardMessage.trim() || 'Forwarded from recipient portal',
        },
        { headers: portalAuthHeaders() },
      );
      setForwardSuccess('Document forwarded successfully.');
      setForwardOpen(false);
      setForwardEmail('');
      setForwardName('');
      setForwardMessage('');
      await loadDocuments(tab);
    } catch (err: any) {
      setForwardError(err?.response?.data?.message || 'Unable to forward this document.');
    } finally {
      setForwardBusy(false);
    }
  };

  const renderDocumentTable = (
    rows: Array<{ from: string; name: string; status: string; date: string; action?: React.ReactNode }>,
    blurred = false,
  ) => (
    <div className={`overflow-hidden ${blurred ? 'pointer-events-none select-none blur-[2px]' : ''}`}>
      <div className="hidden border-b border-gray-100 bg-gray-50/80 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 sm:grid sm:grid-cols-12 sm:gap-4">
        <div className="sm:col-span-3">From</div>
        <div className="sm:col-span-4">Name</div>
        <div className="sm:col-span-2">Status</div>
        <div className="sm:col-span-3">Date received</div>
      </div>
      <ul className="divide-y divide-gray-100">
        {rows.map((row, index) => (
          <li
            key={`${row.name}-${index}`}
            className="px-4 py-4 transition-colors hover:bg-gray-50/70 sm:px-6"
          >
            <div className="grid gap-3 sm:grid-cols-12 sm:items-center">
              <div className="sm:col-span-3">
                <p className="text-sm font-medium text-gray-900">{row.from}</p>
              </div>
              <div className="sm:col-span-4">
                <p className="truncate text-sm text-gray-700">{row.name}</p>
              </div>
              <div className="sm:col-span-2">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(row.status)}`}>
                  {row.status}
                </span>
              </div>
              <div className="sm:col-span-3 flex items-center justify-between gap-3">
                <span className="text-sm text-gray-500">{row.date}</span>
                {row.action}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  const isAuthenticated = step === 'documents' && !!token;
  const showUserMenu = Boolean(displayName || sessionEmail);

  const renderAccessOverlay = () => {
    if (step === 'consent' && !changeEmailMode) {
      return (
        <>
          <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-8 ring-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
            {displayName ? `Hi ${firstName(displayName)}` : 'Verify it\u2019s you'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            We&apos;ll send a one-time code to{' '}
            <strong className="text-gray-800">{maskedEmail || maskEmail(sessionEmail)}</strong>{' '}
            to open your document inbox. No password required.
          </p>
          <button
            type="button"
            onClick={() => requestCode(sessionEmail)}
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#248567] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1f7158] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Send verification code
          </button>
          <button
            type="button"
            onClick={() => {
              setChangeEmailMode(true);
              setFormError('');
            }}
            className="mt-4 text-sm font-medium text-[#4D0080] hover:underline"
          >
            Use a different email
          </button>
          {formError && <p className="mt-4 text-sm text-rose-600">{formError}</p>}
        </>
      );
    }

    if (step === 'access' || changeEmailMode) {
      return (
        <>
          <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-8 ring-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
            Your documents are secure
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Enter your email and we&apos;ll send a one-time code to access your signing inbox for free.
          </p>
          <div className="mt-6 space-y-4 text-left">
            <label className="block text-sm font-medium text-gray-700" htmlFor="portal-email">
              Email address
            </label>
            <input
              id="portal-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (formError) setFormError('');
              }}
              placeholder="you@company.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#248567] focus:ring-2 focus:ring-[#248567]/20"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => requestCode()}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#248567] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1f7158] disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Send verification code
            </button>
            {hasKnownSignerSession && (
              <button
                type="button"
                onClick={() => {
                  setChangeEmailMode(false);
                  setStep('consent');
                  setFormError('');
                }}
                className="w-full text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Back
              </button>
            )}
            {formError && <p className="text-sm text-rose-600">{formError}</p>}
          </div>
        </>
      );
    }

    if (step === 'verify') {
      return (
        <>
          <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-50 text-[#4D0080] ring-8 ring-white">
            <Mail className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">Check your email</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter the 6-digit code sent to{' '}
            <strong className="text-gray-800">{maskedEmail || maskEmail(sessionEmail)}</strong>
          </p>
          <input
            id="portal-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
              if (formError) setFormError('');
            }}
            placeholder="123456"
            className="mt-6 w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-lg tracking-[0.35em] outline-none focus:border-[#248567] focus:ring-2 focus:ring-[#248567]/20"
            disabled={loading}
          />
          {formError && <p className="mt-3 text-sm text-rose-600">{formError}</p>}
          {info && <p className="mt-3 text-sm text-emerald-700">{info}</p>}
          <button
            type="button"
            onClick={verifyCode}
            disabled={loading || code.trim().length < 6}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#248567] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1f7158] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
            Open my documents
          </button>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => requestCode(sessionEmail)}
              disabled={loading || resendSeconds > 0}
              className="inline-flex items-center justify-center gap-2 text-sm font-medium text-[#4D0080] disabled:text-gray-400"
            >
              <RefreshCw className="h-4 w-4" />
              {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend code'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep(hasKnownSignerSession ? 'consent' : 'access');
                setChangeEmailMode(false);
                setCode('');
                setError('');
                setFormError('');
                setInfo('');
              }}
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Change email
            </button>
          </div>
        </>
      );
    }

    return null;
  };

  if (sessionBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading your documents...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-8 w-auto sm:h-9" />
            <span className="hidden text-sm text-gray-400 sm:inline">/</span>
            <span className="hidden text-sm font-medium text-gray-600 sm:inline">My documents</span>
          </div>

          {showUserMenu && (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-3 text-sm text-gray-800 shadow-sm hover:bg-gray-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4D0080] text-xs font-semibold text-white">
                  {getInitials(displayName || sessionEmail)}
                </span>
                <span className="max-w-[140px] truncate font-medium">
                  {displayName ? firstName(displayName) : maskEmail(sessionEmail)}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-gray-900">{displayName || 'Recipient'}</p>
                    <p className="truncate text-xs text-gray-500">{maskedEmail || maskEmail(sessionEmail)}</p>
                  </div>
                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={signOut}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">My documents</h1>

        <div className="mt-6 border-b border-gray-200">
          <div className="flex gap-8">
            <button
              type="button"
              onClick={() => isAuthenticated && setTab('inbox')}
              className={`inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
                tab === 'inbox'
                  ? 'border-[#248567] text-[#248567]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Inbox className="h-4 w-4" />
              Inbox
            </button>
            <button
              type="button"
              onClick={() => isAuthenticated && setTab('archived')}
              className={`inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
                tab === 'archived'
                  ? 'border-[#248567] text-[#248567]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Archive className="h-4 w-4" />
              Archived
            </button>
          </div>
        </div>

        {error && isAuthenticated && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div
          className={`relative mt-6 rounded-xl border border-gray-200 bg-white shadow-sm ${
            isAuthenticated ? 'overflow-hidden' : 'min-h-[520px]'
          }`}
        >
          {!isAuthenticated ? (
            <>
              <div className="absolute inset-0 overflow-hidden rounded-xl">
                {renderDocumentTable(PREVIEW_ROWS, true)}
              </div>
              <div className="relative z-10 flex min-h-[520px] items-center justify-center bg-white/60 p-4 backdrop-blur-[1px] sm:p-6">
                <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white px-6 py-8 text-center shadow-2xl sm:px-8 sm:py-9">
                  {renderAccessOverlay()}
                </div>
              </div>
            </>
          ) : listLoading ? (
            <div className="flex items-center justify-center gap-2 px-6 py-20 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <FileText className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-900">
                {tab === 'inbox' ? 'No documents waiting for you' : 'No archived documents yet'}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Documents sent to this email will appear here.
              </p>
            </div>
          ) : (
            renderDocumentTable(
              documents.map((doc) => ({
                from: doc.from,
                name: doc.name,
                status: doc.status,
                date: formatDate(doc.updatedAt),
                action: (
                  <button
                    type="button"
                    onClick={() => void openDocumentViewer(doc)}
                    className="inline-flex items-center justify-center gap-1 rounded-md bg-[#248567] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1f7158]"
                  >
                    Open
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                ),
              })),
            )
          )}
        </div>
      </main>

      {viewerOpen && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{viewerTitle || 'Document'}</p>
              {viewerStatus ? (
                <p className="mt-0.5 text-xs text-gray-500">
                  Status: <span className="font-medium text-gray-700">{viewerStatus}</span>
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleViewerPrint}
                disabled={viewerLoading || !activeViewerFile}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <Printer className="h-3.5 w-3.5" />
                Print
              </button>
              <button
                type="button"
                onClick={() => void handleViewerDownload()}
                disabled={viewerLoading || !activeViewerFile}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
              <button
                type="button"
                onClick={() => void handleViewerForward()}
                disabled={viewerLoading || !viewerDoc}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <Forward className="h-3.5 w-3.5" />
                Send Forward
              </button>
              <button
                type="button"
                onClick={closeDocumentViewer}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
                aria-label="Close document"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {forwardOpen && viewerStatus === 'PENDING' && (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 sm:px-6">
              <div className="mx-auto grid max-w-4xl gap-2 sm:grid-cols-3">
                <input
                  value={forwardName}
                  onChange={(e) => setForwardName(e.target.value)}
                  placeholder="New recipient name"
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                />
                <input
                  value={forwardEmail}
                  onChange={(e) => setForwardEmail(e.target.value)}
                  placeholder="New recipient email"
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                />
                <input
                  value={forwardMessage}
                  onChange={(e) => setForwardMessage(e.target.value)}
                  placeholder="Optional message"
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="mx-auto mt-2 flex max-w-4xl items-center gap-2">
                <button
                  type="button"
                  disabled={forwardBusy}
                  onClick={() => void handleViewerForward()}
                  className="rounded-md bg-[#248567] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1f7158] disabled:opacity-50"
                >
                  {forwardBusy ? 'Sending…' : 'Confirm forward'}
                </button>
                <button
                  type="button"
                  onClick={() => setForwardOpen(false)}
                  className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700"
                >
                  Cancel
                </button>
                {forwardError ? <p className="text-xs text-rose-600">{forwardError}</p> : null}
              </div>
            </div>
          )}

          {forwardSuccess ? (
            <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-700 sm:px-6">
              {forwardSuccess}
            </div>
          ) : null}

          {viewerFiles.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto border-b border-gray-100 px-4 py-2 sm:px-6">
              {viewerFiles.map((file, idx) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setActiveFileIndex(idx)}
                  className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                    idx === activeFileIndex
                      ? 'bg-[#248567] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {file.name}
                </button>
              ))}
            </div>
          ) : null}

          <div className="relative min-h-0 flex-1 bg-gray-100">
            {viewerLoading ? (
              <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Opening document…
              </div>
            ) : viewerError ? (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-rose-600">
                {viewerError}
              </div>
            ) : activeViewerFile ? (
              <iframe
                ref={viewerIframeRef}
                title={viewerTitle || 'Document preview'}
                src={activeViewerFile.viewUrl}
                className="h-full w-full border-0 bg-white"
              />
            ) : null}
          </div>
        </div>
      )}

      <CookieConsentBanner onManage={() => setCookieCenterOpen(true)} />
      <CookiePreferenceCenter
        open={cookieCenterOpen}
        onClose={() => setCookieCenterOpen(false)}
      />
    </div>
  );
};

export default RecipientPortalPage;
