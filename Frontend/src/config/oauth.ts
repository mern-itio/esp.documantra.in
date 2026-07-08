/** @deprecated Prefer fetchFederatedLoginProviders() for runtime admin-configured client IDs. */
export const GOOGLE_CLIENT_ID = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

/** @deprecated Prefer isGoogleOAuthConfigured() from federatedLoginService with fetched providers. */
export const isGoogleOAuthConfigured = (): boolean =>
  Boolean(GOOGLE_CLIENT_ID) && !GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID');

export {
  fetchFederatedLoginProviders,
  getGoogleClientIdFromProviders,
  isGoogleOAuthConfigured as isGoogleOAuthConfiguredFromProviders,
} from '../services/federatedLoginService';
