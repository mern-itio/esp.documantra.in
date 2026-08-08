import type { ApiType } from '../pages/ApiService/Explorer/types';
import { BRAND } from '../config/brand';

/** Canonical sign API paths (same as Backend api-service → e-sign proxy). */
export const DOCUMANTRA_SIGN_API_PREFIX = '/api/api-service/sign';

export function getDocuMantraApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1') {
      return `${window.location.origin}${DOCUMANTRA_SIGN_API_PREFIX}`;
    }
  }
  return `${BRAND.website.replace(/\/$/, '')}${DOCUMANTRA_SIGN_API_PREFIX}`;
}

export type DocuMantraApiEndpoint = ApiType & {
  slug: string;
  step: number;
  contentType?: 'json' | 'multipart';
  responseHint?: string;
  pathParams?: string[];
};

export const DOCUMANTRA_SIGN_ENDPOINTS: DocuMantraApiEndpoint[] = [
  {
    slug: 'upload-envelope',
    name: 'Upload envelope',
    endpoint: `${DOCUMANTRA_SIGN_API_PREFIX}/upload-envelope`,
    method: 'POST',
    step: 1,
    contentType: 'multipart',
    showFile: true,
    showBody: false,
    showEnvelopeId: false,
    bodyTemplate: '',
    description: 'Upload one or more PDF/DOC/DOCX files and create a draft envelope. Returns envelope and document IDs.',
    responseHint: '{ status, message, data: { envelopeId } } — fetch GET /envelope/:id for document ids',
  },
  {
    slug: 'add-recipients',
    name: 'Add recipients',
    endpoint: `${DOCUMANTRA_SIGN_API_PREFIX}/add-recipients`,
    method: 'POST',
    step: 2,
    contentType: 'json',
    showFile: false,
    showBody: true,
    showEnvelopeId: false,
    bodyTemplate: `{
  "envelopeId": "YOUR_ENVELOPE_ID",
  "recipients": [
    {
      "name": "Jane Signer",
      "email": "jane@example.com",
      "role": "signer",
      "order": 1,
      "status": "waiting",
      "authentication": "email"
    }
  ]
}`,
    description: 'Attach signers to the envelope. Use the envelopeId from the upload response.',
    responseHint: '{ recipients: [{ id, email, status }] }',
  },
  {
    slug: 'save-signature-fields',
    name: 'Place signature fields',
    endpoint: `${DOCUMANTRA_SIGN_API_PREFIX}/save-signature-fields`,
    method: 'POST',
    step: 3,
    contentType: 'json',
    showFile: false,
    showBody: true,
    showEnvelopeId: false,
    bodyTemplate: `{
  "envelopeId": "YOUR_ENVELOPE_ID",
  "signatureFields": [
    {
      "documentId": "YOUR_DOCUMENT_ID",
      "recipientId": "YOUR_RECIPIENT_ID",
      "page": 1,
      "x": 100,
      "y": 200,
      "width": 120,
      "height": 50,
      "type": "signature",
      "status": "pending"
    }
  ]
}`,
    description: 'Define where each signer signs on the document (coordinates are in PDF points).',
    responseHint: '{ success: true, fields: [...] }',
  },
  {
    slug: 'update-envelope',
    name: 'Update envelope',
    endpoint: `${DOCUMANTRA_SIGN_API_PREFIX}/update`,
    method: 'POST',
    step: 4,
    contentType: 'json',
    showFile: false,
    showBody: true,
    showEnvelopeId: false,
    bodyTemplate: `{
  "envelopeId": "YOUR_ENVELOPE_ID",
  "envelopeData": {
    "subject": "Please sign: Contract",
    "message": "Review and sign at your convenience.",
    "priority": "normal",
    "signingOrder": "In-Order",
    "reminderEnabled": true,
    "reminderInterval": 2,
    "requireAllSignatures": true,
    "allowDecline": false,
    "signatureType": "standard",
    "status": "draft"
  }
}`,
    description: 'Set subject, message, reminders, and signing options before send.',
    responseHint: '{ envelope: { id, subject, status } }',
  },
  {
    slug: 'send-envelope',
    name: 'Send envelope',
    endpoint: `${DOCUMANTRA_SIGN_API_PREFIX}/send/:envelopeId`,
    method: 'PUT',
    step: 5,
    showFile: false,
    showBody: false,
    showEnvelopeId: true,
    bodyTemplate: '',
    description: 'Send the envelope to all recipients. Replace :envelopeId in the path.',
    pathParams: ['envelopeId'],
    responseHint: '{ status: "sent", envelopeId }',
  },
  {
    slug: 'get-envelope',
    name: 'Get envelope status',
    endpoint: `${DOCUMANTRA_SIGN_API_PREFIX}/envelope/:envelopeId`,
    method: 'GET',
    step: 6,
    showFile: false,
    showBody: false,
    showEnvelopeId: true,
    bodyTemplate: '',
    description: 'Poll signing progress from your app UI (completed, pending, declined, etc.).',
    pathParams: ['envelopeId'],
    responseHint: '{ envelope: { status, recipients, documents } }',
  },
  {
    slug: 'get-signature-fields',
    name: 'Get signature fields',
    endpoint: `${DOCUMANTRA_SIGN_API_PREFIX}/signature/:documentId`,
    method: 'GET',
    step: 7,
    showFile: false,
    showBody: false,
    showEnvelopeId: false,
    showDocumentId: true,
    bodyTemplate: '',
    description: 'Retrieve placed fields for a document (useful for embedded signing UIs).',
    pathParams: ['documentId'],
    responseHint: '{ signatureFields: [...] }',
  },
  {
    slug: 'add-signature',
    name: 'Submit signature',
    endpoint: `${DOCUMANTRA_SIGN_API_PREFIX}/add-signature`,
    method: 'POST',
    step: 8,
    contentType: 'json',
    showFile: false,
    showBody: true,
    showEnvelopeId: false,
    bodyTemplate: `{
  "fieldId": "FIELD_ID",
  "signature": "BASE64_OR_SIGNATURE_PAYLOAD"
}`,
    description: 'Apply a captured signature to a field (embedded / custom signer UI flows).',
    responseHint: '{ success: true }',
  },
  {
    slug: 'initiate-recipient-auth',
    name: 'Initiate recipient auth',
    endpoint: `${DOCUMANTRA_SIGN_API_PREFIX}/initiate-recipient-auth`,
    method: 'POST',
    step: 9,
    contentType: 'json',
    showFile: false,
    showBody: true,
    showEnvelopeId: false,
    bodyTemplate: `{
  "envelopeId": "YOUR_ENVELOPE_ID",
  "recipientId": "YOUR_RECIPIENT_ID"
}`,
    description: 'Start OTP / verification for a recipient when authentication is required.',
    responseHint: '{ success: true }',
  },
];

/** Explorer sidebar uses the same list (ApiType shape). */
export const apiList: ApiType[] = DOCUMANTRA_SIGN_ENDPOINTS;

export const DOCUMANTRA_API_AUTH = {
  sandboxHeader: 'X-Sandbox-Api-Key',
  sessionNote:
    'Sign endpoints require an active DocuMantra session (httpOnly login cookie) plus your sandbox API key. Generate the key from the developer dashboard after login.',
  keyRoute: '/api-service/keys',
  explorerRoute: '/api-service/explorer',
  loginRoute: '/login',
  signupRoute: '/signup',
} as const;

export const INTEGRATION_STEPS = [
  {
    title: 'Create a DocuMantra account',
    detail: 'Sign up and log in to your dashboard.',
  },
  {
    title: 'Generate a Sandbox API key',
    detail: `Open API Keys (${DOCUMANTRA_API_AUTH.keyRoute}), create a sandbox key, and store it securely on your server.`,
  },
  {
    title: 'Authenticate your backend session',
    detail:
      'Log in via the Auth API or dashboard so your server holds a valid session cookie. Server-side calls must forward the session or use the same authenticated client.',
  },
  {
    title: 'Run the envelope workflow',
    detail: 'Upload → recipients → fields → update → send → poll status. Wire each step into your UI.',
  },
] as const;

export function buildCurlExample(
  endpoint: DocuMantraApiEndpoint,
  opts?: { sandboxKey?: string; envelopeId?: string; documentId?: string },
): string {
  const base = getDocuMantraApiBaseUrl();
  let path = endpoint.endpoint.replace(DOCUMANTRA_SIGN_API_PREFIX, '');
  if (opts?.envelopeId) path = path.replace(':envelopeId', opts.envelopeId).replace(':id', opts.envelopeId);
  if (opts?.documentId) path = path.replace(':documentId', opts.documentId).replace(':id', opts.documentId);

  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const lines = [`curl -X ${endpoint.method} "${url}" \\`, `  -H "X-Sandbox-Api-Key: ${opts?.sandboxKey || 'YOUR_SANDBOX_KEY'}" \\`, `  -H "Cookie: <your-documantra-session-cookie>"`];

  if (endpoint.contentType === 'multipart') {
    lines.push('  -F "files=@/path/to/contract.pdf"');
  } else if (endpoint.showBody && endpoint.bodyTemplate) {
    lines[lines.length - 1] += ' \\';
    lines.push(`  -H "Content-Type: application/json" \\`, `  -d '${endpoint.bodyTemplate.replace(/\n/g, ' ').replace(/'/g, "'\\''")}'`);
  }
  return lines.join('\n');
}

export function buildFetchExample(endpoint: DocuMantraApiEndpoint): string {
  const url = endpoint.endpoint.replace(':envelopeId', '${envelopeId}').replace(':documentId', '${documentId}');
  if (endpoint.contentType === 'multipart') {
    return `const form = new FormData();
form.append('files', pdfFile);

const res = await fetch('${url}', {
  method: '${endpoint.method}',
  credentials: 'include',
  headers: { '${DOCUMANTRA_API_AUTH.sandboxHeader}': process.env.DOCUMANTRA_SANDBOX_KEY! },
  body: form,
});
const data = await res.json();`;
  }
  return `const res = await fetch('${url}', {
  method: '${endpoint.method}',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    '${DOCUMANTRA_API_AUTH.sandboxHeader}': process.env.DOCUMANTRA_SANDBOX_KEY!,
  },
  body: JSON.stringify(${endpoint.bodyTemplate || '{}'}),
});
const data = await res.json();`;
}
