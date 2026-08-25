/** Aadhaar VSign is on only when admin Enable VSign is on (public /vsign-status). */
import { eSignApi } from '../services/apiHelper';

let cachedPublicStatus: { enabled: boolean; ready: boolean } | null = null;

export async function refreshVSignPublicStatus(): Promise<{ enabled: boolean; ready: boolean }> {
  try {
    const res = await eSignApi.get('/api/e-sign/public/vsign-status');
    const data = res.data || {};
    cachedPublicStatus = { enabled: Boolean(data.enabled), ready: Boolean(data.ready) };
    return cachedPublicStatus;
  } catch {
    /* keep last known status; default off so live draw-and-sign still works */
  }
  if (cachedPublicStatus) return cachedPublicStatus;
  cachedPublicStatus = { enabled: false, ready: false };
  return cachedPublicStatus;
}

export const isVSignEnabled = (): boolean => Boolean(cachedPublicStatus?.enabled);

export const isVSignReady = (): boolean => Boolean(cachedPublicStatus?.ready);

export const resolvePublicSignatureMethod = (
  envelopeSignatureType?: string,
  envelopeType?: string,
  recipientRequiresAadhaar = false,
): 'Digital_Signature' | 'aadhaarSignature' => {
  if (!isVSignEnabled()) return 'Digital_Signature';
  const type = String(envelopeSignatureType || '').toLowerCase();
  const envType = String(envelopeType || '').toLowerCase();
  const isQualified =
    type === 'qualified' || envType === 'qualified' || recipientRequiresAadhaar;
  return isQualified ? 'aadhaarSignature' : 'Digital_Signature';
};
