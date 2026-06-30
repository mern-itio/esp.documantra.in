/** M14: httpOnly cookie auth — do not persist JWT in localStorage. */

const USER_PROFILE_SNAPSHOT_KEY = 'userProfileSnapshot';
const LEGACY_PROFILE_KEYS = [USER_PROFILE_SNAPSHOT_KEY, 'userData', 'accessToken'];

export type UserProfileSnapshot = {
  id: string;
  /** In-memory only — never written to sessionStorage/localStorage. */
  email?: string;
  fullname?: string;
  plan?: string;
  isFirstLogin?: boolean;
};

let memoryAccessToken: string | null = null;
let memoryUserProfile: UserProfileSnapshot | null = null;

/** Short-lived in-memory token for WebSocket handshakes only (not localStorage). */
export const setMemoryAccessToken = (token: string | null) => {
  memoryAccessToken = token;
};

export const getMemoryAccessToken = (): string | null => memoryAccessToken;

export const AUTH_FETCH_INIT: RequestInit = {
  credentials: 'include',
};

const purgeLegacyProfileStorage = () => {
  try {
    for (const key of LEGACY_PROFILE_KEYS) {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
};

/** Persist only non-sensitive session hint in memory (no browser storage). */
export const persistUserProfileSnapshot = (user: UserProfileSnapshot) => {
  if (!user?.id) return;
  memoryUserProfile = {
    id: user.id,
    isFirstLogin: user.isFirstLogin,
  };
  purgeLegacyProfileStorage();
};

export const getUserProfileSnapshot = (): UserProfileSnapshot | null => {
  if (memoryUserProfile?.id) return memoryUserProfile;

  // One-time migration: read legacy key, keep id only, then delete.
  try {
    const raw = sessionStorage.getItem(USER_PROFILE_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    sessionStorage.removeItem(USER_PROFILE_SNAPSHOT_KEY);
    if (parsed?.id) {
      memoryUserProfile = {
        id: String(parsed.id),
        isFirstLogin: parsed.isFirstLogin,
      };
      return memoryUserProfile;
    }
  } catch {
    purgeLegacyProfileStorage();
  }
  return null;
};

export const clearUserProfileSnapshot = () => {
  memoryUserProfile = null;
  purgeLegacyProfileStorage();
};

export const getCurrentUserId = (): string =>
  getUserProfileSnapshot()?.id || 'anonymous';

export const isLoggedInSnapshot = (): boolean =>
  Boolean(getUserProfileSnapshot()?.id);

export const clearLegacyAuthStorage = () => {
  memoryAccessToken = null;
  memoryUserProfile = null;
  purgeLegacyProfileStorage();
  try {
    localStorage.removeItem('orgAccessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('userToken');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('agentToken');
  } catch {
    // ignore
  }
};

export const getAccountContextHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};
  try {
    const acct = sessionStorage.getItem('accountType');
    const orgId = sessionStorage.getItem('organizationId');
    if (acct) headers['X-Account-Type'] = acct;
    if (orgId) headers['X-Organization-Id'] = orgId;
    const orgDetailRaw = sessionStorage.getItem('organizationDetail');
    if (orgDetailRaw) {
      const orgDetail = JSON.parse(orgDetailRaw);
      if (orgDetail?.createdBy) {
        headers['X-Organization-Owner-Id'] = String(orgDetail.createdBy);
      }
    }
  } catch {
    // ignore
  }
  return headers;
};

export const persistAccountContext = (accountType: string, organizationId?: string | null, organizationDetail?: unknown) => {
  try {
    sessionStorage.setItem('accountType', accountType);
    if (organizationId) sessionStorage.setItem('organizationId', organizationId);
    else sessionStorage.removeItem('organizationId');
    if (organizationDetail) {
      sessionStorage.setItem('organizationDetail', JSON.stringify(organizationDetail));
    } else {
      sessionStorage.removeItem('organizationDetail');
    }
  } catch {
    // ignore
  }
};

export const clearAccountContext = () => {
  try {
    sessionStorage.removeItem('accountType');
    sessionStorage.removeItem('organizationId');
    sessionStorage.removeItem('organizationDetail');
  } catch {
    // ignore
  }
};

/** In-memory token for admin/agent WebSocket handshakes (never localStorage). */
let memoryAdminAccessToken: string | null = null;

export const setMemoryAdminAccessToken = (token: string | null) => {
  memoryAdminAccessToken = token;
};

export const getMemoryAdminAccessToken = (): string | null => memoryAdminAccessToken;

export const withAuthFetch = (init: RequestInit = {}): RequestInit => ({
  credentials: 'include',
  ...init,
  headers: {
    ...getAccountContextHeaders(),
    ...(init.headers || {}),
  },
});

purgeLegacyProfileStorage();
