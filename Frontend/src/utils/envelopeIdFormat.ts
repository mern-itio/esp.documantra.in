/** DocuSign-style envelope ID: 8-4-4-4-12 uppercase hex (Mongo IDs padded to 32). */
export function formatDocuMantraEnvelopeId(rawId?: string | null): string {
  const hex = String(rawId || '')
    .replace(/[^a-fA-F0-9]/g, '')
    .toLowerCase();
  if (!hex) return '—';
  const padded = (hex + '00000000').slice(0, 32).toUpperCase();
  return `${padded.slice(0, 8)}-${padded.slice(8, 12)}-${padded.slice(12, 16)}-${padded.slice(16, 20)}-${padded.slice(20, 32)}`;
}

export function docuMantraEnvelopeIdLabel(rawId?: string | null): string {
  return `DocuMantra Envelope ID: ${formatDocuMantraEnvelopeId(rawId)}`;
}
