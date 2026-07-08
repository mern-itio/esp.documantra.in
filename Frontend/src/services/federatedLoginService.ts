import { API_CONFIG } from '../config/environment';

export type FederatedProviderId = 'google' | 'facebook' | 'linkedin' | 'twitter';

export type PublicFederatedProvider = {
  provider: FederatedProviderId;
  label: string;
  clientId: string;
  callbackUrl: string;
  scopes: string;
};

let cachedProviders: PublicFederatedProvider[] | null = null;
let cacheExpiresAt = 0;
const CACHE_MS = 60_000;

export async function fetchFederatedLoginProviders(
  force = false
): Promise<PublicFederatedProvider[]> {
  if (!force && cachedProviders && Date.now() < cacheExpiresAt) {
    return cachedProviders;
  }
  const res = await fetch(`${API_CONFIG.BASE_URL}/federated-login-providers`, {
    method: 'GET',
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to load login providers');
  }
  cachedProviders = Array.isArray(data?.providers) ? data.providers : [];
  cacheExpiresAt = Date.now() + CACHE_MS;
  return cachedProviders;
}

export function getGoogleClientIdFromProviders(
  providers: PublicFederatedProvider[]
): string {
  const google = providers.find((p) => p.provider === 'google');
  return String(google?.clientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
}

export function isGoogleOAuthConfigured(providers: PublicFederatedProvider[]): boolean {
  const id = getGoogleClientIdFromProviders(providers);
  return Boolean(id) && !id.includes('YOUR_GOOGLE_CLIENT_ID');
}
