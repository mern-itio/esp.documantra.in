import { eSignApi } from '../services/apiHelper';
import { getMemoryAccessToken } from './authSession';

type EsignDocRef = {
  id?: string;
  file?: File;
  url?: string | null;
  filePath?: string | null;
  signedFilePath?: string | null;
  name?: string;
};

const getAccessToken = (): string | null => getMemoryAccessToken();

const getEsignBaseUrl = (): string =>
  String(import.meta.env.VITE_ESIGN_SERVICE_URL || 'https://esp.documantra.in/esign').replace(
    /\/+$/,
    ''
  );

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
    return fromApi;
  }

  const base = getEsignBaseUrl();
  const name = doc.name || 'document.pdf';
  const params = new URLSearchParams();
  if (envelopeId) {
    params.set('envelopeId', envelopeId);
  }
  const query = params.toString() ? `?${params.toString()}` : '';
  return `${base}/uploads/${encodeURIComponent(name)}${query}`;
};

const buildDocumentViewUrl = (
  docId: string,
  options?: { envelopeId?: string; isPublicFlow?: boolean; filePath?: string | null }
): string => {
  const base = getEsignBaseUrl();
  const path = options?.isPublicFlow
    ? `/api/e-sign/public/documents/${docId}/view`
    : `/api/e-sign/documents/${docId}/view`;

  if (options?.isPublicFlow) {
    const params = new URLSearchParams();
    if (options.envelopeId) params.set('envelopeId', options.envelopeId);
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
    return query ? `${base}${path}?${query}` : `${base}${path}`;
  }

  return `${base}${path}`;
};

/**
 * react-pdf file prop: prefer authenticated document view when id is known.
 */
export const resolveEsignDocumentFileProp = (
  doc: EsignDocRef,
  options?: { envelopeId?: string; isPublicFlow?: boolean }
): string | File | { url: string; httpHeaders?: Record<string, string> } => {
  if (doc.file) {
    return doc.file;
  }

  if (doc.id) {
    const url = buildDocumentViewUrl(doc.id, {
      envelopeId: options?.envelopeId,
      isPublicFlow: options?.isPublicFlow,
      filePath: doc.filePath,
    });

    if (!options?.isPublicFlow) {
      const token = getAccessToken();
      if (token) {
        return { url, httpHeaders: { Authorization: `Bearer ${token}` } };
      }
      // Same-origin httpOnly cookie auth — browser sends cookies on direct URL fetch.
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
  options?: { envelopeId?: string; isPublicFlow?: boolean }
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
