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

export function isAadhaarVSignAuthMethodRecord(method: any): boolean {
  const type = String(method?.providerType || method?.config?.providerType || '').toLowerCase();
  if (type === 'aadhaar_vsign') return true;
  return /aadhaar\s*e?sign|vsign/i.test(String(method?.name || ''));
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
