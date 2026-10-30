import { subscriptionApi } from '../services/apiHelper';

export function parseRecipientAuthMethodIds(authentication: unknown): string[] {
  if (!authentication) return [];
  try {
    const parsed =
      typeof authentication === 'string' ? JSON.parse(authentication) : authentication;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item: any) => item?.authMethodId || item)
      .filter((id: any) => typeof id === 'string' && id.trim().length > 0);
  } catch {
    return typeof authentication === 'string' && authentication.length === 24
      ? [authentication]
      : [];
  }
}

export const STANDARD_SIGNATURE_METHOD_ID = '__standard_signature__';
export const DEFAULT_AADHAAR_AUTH_NAME = 'Aadhaar Based eSign';

export function getAadhaarAuthMethodName(methods?: any[] | null): string {
  const hit = (methods || []).find(isAadhaarVSignAuthMethodRecord);
  const name = String(hit?.name || '').trim();
  return name || DEFAULT_AADHAAR_AUTH_NAME;
}

export function isEmailOtpAuthMethodRecord(method: any): boolean {
  const type = String(method?.providerType || method?.config?.providerType || '').toLowerCase();
  if (type === 'email_otp' || type === 'email' || type.includes('email_otp')) return true;
  const name = String(method?.name || '').toLowerCase();
  if (/aadhaar|vsign|selfie|liveness/.test(name)) return false;
  return /email/.test(name);
}

export function findEmailOtpAuthMethod(methods?: any[] | null): any | null {
  return (methods || []).find(isEmailOtpAuthMethodRecord) || null;
}

export function stripSyntheticAuthMethodIds(ids: string[]): string[] {
  return (ids || [])
    .map((id) => String(id || '').trim())
    .filter((id) => id && id !== STANDARD_SIGNATURE_METHOD_ID);
}

export function isAadhaarVSignAuthMethodRecord(method: any): boolean {
  const type = String(method?.providerType || method?.config?.providerType || '').toLowerCase();
  if (type.includes('aadhaar') || type.includes('vsign')) return true;
  const name = String(method?.name || '').toLowerCase();
  if (/vsign/.test(name)) return true;
  return /aadhaar/.test(name) && /sign/.test(name);
}

export function authMethodListIncludesAadhaar(
  methodIds: string[],
  methodsPool: any[],
): boolean {
  if (!methodIds.length || !methodsPool.length) return false;
  return methodIds.some((id) => {
    const method = methodsPool.find((m: any) => {
      const mid = String(m?.id ?? m?._id ?? m?.authMethodId ?? '').trim();
      return mid === String(id).trim();
    });
    return method ? isAadhaarVSignAuthMethodRecord(method) : false;
  });
}

export async function recipientAuthenticationRequiresAadhaar(
  authentication: unknown,
  methodsPool?: any[],
): Promise<boolean> {
  const ids = parseRecipientAuthMethodIds(authentication);
  if (!ids.length) return false;
  if (methodsPool?.length) {
    return authMethodListIncludesAadhaar(ids, methodsPool);
  }
  try {
    const res = await subscriptionApi.post('/api/authproviders/bulk/details', {
      methodIds: ids,
    });
    const methods = res.data?.methods || [];
    return methods.some((m: any) => isAadhaarVSignAuthMethodRecord(m));
  } catch {
    return false;
  }
}
