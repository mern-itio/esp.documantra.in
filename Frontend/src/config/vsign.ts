/** Enable Aadhaar VSign signing in public recipient flow. */
import { isPublicSignOnlyApp } from './appMode';

let cachedPublicStatus: { enabled: boolean; ready: boolean } | null = null;

export async function refreshVSignPublicStatus(): Promise<{ enabled: boolean; ready: boolean }> {
  try {
    const base = import.meta.env.VITE_ESIGN_SERVICE_URL || 'http://127.0.0.1:2103';
    const res = await fetch(`${String(base).replace(/\/+$/, '')}/api/e-sign/public/vsign-status`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      cachedPublicStatus = { enabled: Boolean(data.enabled), ready: Boolean(data.ready) };
      return cachedPublicStatus;
    }
  } catch {
    /* use env fallback */
  }
  return { enabled: import.meta.env.VITE_ENABLE_VSIGN === 'true', ready: false };
}

export const isVSignEnabled = (): boolean =>
  cachedPublicStatus?.enabled ?? import.meta.env.VITE_ENABLE_VSIGN === 'true';

export const isVSignReady = (): boolean =>
  cachedPublicStatus?.ready ?? false;

export const resolvePublicSignatureMethod = (
  envelopeSignatureType?: string,
  envelopeType?: string,
): 'Digital_Signature' | 'aadhaarSignature' => {
  const type = String(envelopeSignatureType || '').toLowerCase();
  const envType = String(envelopeType || '').toLowerCase();
  const isQualified = type === 'qualified' || envType === 'qualified';

  if (isVSignEnabled() || isPublicSignOnlyApp() || isQualified) {
    return 'aadhaarSignature';
  }
  return 'Digital_Signature';
};
