import { eSignApi } from '../services/apiHelper';
import { getMemoryAccessToken } from './authSession';
import { resolveServiceUrl } from './secureApiUrl';

type EsignDocRef = {
  id?: string;
  file?: File;
  url?: string | null;
  filePath?: string | null;
  signedFilePath?: string | null;
  name?: string;
};

const getAccessToken = (): string | null => getMemoryAccessToken();

function isLocalDevHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  return host === 'localhost' || host === '127.0.0.1';
}

const getEsignBaseUrl = (): string => {
  if (isLocalDevHost()) {
    // Vite proxies /api/e-sign → local e-sign-service (2103)
    return '';
  }
  return resolveServiceUrl(import.meta.env.VITE_ESIGN_SERVICE_URL, {
    productionPath: '/esign',
    localUrl: 'http://localhost:2103',
  }).replace(/\/+$/, '');
};

/** Rewrite production/loopback e-sign URLs to same-origin proxy paths on localhost. */
function rewriteEsignUrlForLocal(url: string): string {
  if (!url || !isLocalDevHost()) return url;
  if (url.startsWith('/api/e-sign')) return url;

  try {
    const parsed = new URL(url, window.location.origin);
    const path = parsed.pathname;
    const search = parsed.search;

    const apiIdx = path.indexOf('/api/e-sign/');
    if (apiIdx >= 0) {
      return `${path.slice(apiIdx)}${search}`;
    }

    const uploadsIdx = path.indexOf('/uploads/');
    if (uploadsIdx >= 0) {
      return `/esign${path.slice(uploadsIdx)}${search}`;
    }
  } catch {
    return url;
  }

  return url;
}

/**
 * Resolve a browser-loadable URL for an e-sign document.
 * Prefer API-provided filePath (includes signed fileToken from M11).
 */
export const resolveEsignDocumentUrl = (
  doc: EsignDocRef,
  envelopeId?: string
): string => {
  const fromApi = doc.filePath || doc.signedFilePath || doc.url;
  if (fromApi) {
    return rewriteEsignUrlForLocal(fromApi);
  }

  const base = getEsignBaseUrl();
  const name = doc.name || 'document.pdf';
  const params = new URLSearchParams();
  if (envelopeId) {
    params.set('envelopeId', envelopeId);
  }
  const query = params.toString() ? `?${params.toString()}` : '';
  if (isLocalDevHost()) {
    return `/esign/uploads/${encodeURIComponent(name)}${query}`;
  }
  return `${base}/uploads/${encodeURIComponent(name)}${query}`;
};

const buildDocumentViewUrl = (
  docId: string,
  options?: {
    envelopeId?: string;
    recipientId?: string;
    isPublicFlow?: boolean;
    filePath?: string | null;
  }
): string => {
  const base = getEsignBaseUrl();
  const path = options?.isPublicFlow
    ? `/api/e-sign/public/documents/${docId}/view`
    : `/api/e-sign/documents/${docId}/view`;

  if (options?.isPublicFlow) {
    const params = new URLSearchParams();
    if (options.envelopeId) params.set('envelopeId', options.envelopeId);
    if (options.recipientId) params.set('recipientId', options.recipientId);
    if (options.filePath) {
      try {
        const parsed = new URL(options.filePath, window.location.origin);
        const fileToken = parsed.searchParams.get('fileToken');
        if (fileToken) params.set('fileToken', fileToken);
        const envelopeFromPath = parsed.searchParams.get('envelopeId');
        if (!options.envelopeId && envelopeFromPath) {
          params.set('envelopeId', envelopeFromPath);
        }
      } catch {
        // ignore malformed filePath
      }
    }
    const query = params.toString();
    const relative = query ? `${path}?${query}` : path;
    return rewriteEsignUrlForLocal(base ? `${base}${relative}` : relative);
  }

  const relative = path;
  return rewriteEsignUrlForLocal(base ? `${base}${relative}` : relative);
};

/**
 * react-pdf file prop: prefer authenticated document view when id is known.
 */
export const resolveEsignDocumentFileProp = (
  doc: EsignDocRef,
  options?: { envelopeId?: string; recipientId?: string; isPublicFlow?: boolean }
): string | File | { url: string; httpHeaders?: Record<string, string> } => {
  if (doc.file) {
    return doc.file;
  }

  if (doc.id) {
    const url = buildDocumentViewUrl(doc.id, {
      envelopeId: options?.envelopeId,
      recipientId: options?.recipientId,
      isPublicFlow: options?.isPublicFlow,
      filePath: doc.filePath,
    });

    if (!options?.isPublicFlow) {
      const token = getAccessToken();
      if (token) {
        return { url, httpHeaders: { Authorization: `Bearer ${token}` } };
      }
      return url;
    }

    return url;
  }

  return resolveEsignDocumentUrl(doc, options?.envelopeId);
};

/**
 * Fetch PDF bytes for canvas rendering (pdf.js).
 */
export const fetchEsignDocumentData = async (
  doc: EsignDocRef,
  options?: { envelopeId?: string; recipientId?: string; isPublicFlow?: boolean }
): Promise<ArrayBuffer> => {
  if (doc.file) {
    return doc.file.arrayBuffer();
  }

  if (doc.id) {
    const path = options?.isPublicFlow
      ? `/api/e-sign/public/documents/${doc.id}/view`
      : `/api/e-sign/documents/${doc.id}/view`;

    const params: Record<string, string> = {};
    if (options?.isPublicFlow) {
      if (options.envelopeId) params.envelopeId = options.envelopeId;
      if (options.recipientId) params.recipientId = options.recipientId;
      if (doc.filePath) {
        try {
          const parsed = new URL(doc.filePath, window.location.origin);
          const fileToken = parsed.searchParams.get('fileToken');
          if (fileToken) params.fileToken = fileToken;
        } catch {
          // ignore
        }
      }
    }

    const response = await eSignApi.get(path, {
      params: Object.keys(params).length ? params : undefined,
      responseType: 'arraybuffer',
    });
    return response.data;
  }

  const response = await fetch(resolveEsignDocumentUrl(doc, options?.envelopeId));
  if (!response.ok) {
    throw new Error(`Failed to load document (${response.status})`);
  }
  return response.arrayBuffer();
};
