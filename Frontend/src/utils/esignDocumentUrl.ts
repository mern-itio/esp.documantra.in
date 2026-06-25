/**
 * Resolve a browser-loadable URL for an e-sign document.
 * Prefer API-provided filePath (includes signed fileToken from M11).
 */
export const resolveEsignDocumentUrl = (
  doc: {
    filePath?: string | null;
    signedFilePath?: string | null;
    url?: string | null;
    name?: string;
  },
  envelopeId?: string
): string => {
  const fromApi = doc.filePath || doc.signedFilePath || doc.url;
  if (fromApi) {
    return fromApi;
  }

  const base = String(import.meta.env.VITE_ESIGN_SERVICE_URL || 'https://esp.documantra.in/esign').replace(
    /\/+$/,
    ''
  );
  const name = doc.name || 'document.pdf';
  const params = new URLSearchParams();
  if (envelopeId) {
    params.set('envelopeId', envelopeId);
  }
  const query = params.toString() ? `?${params.toString()}` : '';
  return `${base}/uploads/${encodeURIComponent(name)}${query}`;
};
