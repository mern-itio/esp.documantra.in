/** M14: httpOnly cookie auth — do not persist JWT in localStorage. */

const USER_PROFILE_SNAPSHOT_KEY = 'userProfileSnapshot';

export type UserProfileSnapshot = {
  id: string;
  email?: string;
  fullname?: string;
  plan?: string;
  isFirstLogin?: boolean;
};

let memoryAccessToken: string | null = null;

/** Short-lived in-memory token for WebSocket handshakes only (not localStorage). */
export const setMemoryAccessToken = (token: string | null) => {
  memoryAccessToken = token;
};

export const getMemoryAccessToken = (): string | null => memoryAccessToken;

export const AUTH_FETCH_INIT: RequestInit = {
  credentials: 'include',
};

export const persistUserProfileSnapshot = (user: UserProfileSnapshot) => {
  try {
    if (!user?.id) return;
    sessionStorage.setItem(USER_PROFILE_SNAPSHOT_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
};

export const getUserProfileSnapshot = (): UserProfileSnapshot | null => {
  try {
    const raw = sessionStorage.getItem(USER_PROFILE_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.id) return null;
    return parsed as UserProfileSnapshot;
  } catch {
    return null;
  }
};

export const clearUserProfileSnapshot = () => {
  try {
    sessionStorage.removeItem(USER_PROFILE_SNAPSHOT_KEY);
  } catch {
    // ignore
  }
};

export const getCurrentUserId = (): string =>
  getUserProfileSnapshot()?.id || 'anonymous';

export const isLoggedInSnapshot = (): boolean =>
  Boolean(getUserProfileSnapshot()?.id);

export const clearLegacyAuthStorage = () => {
  memoryAccessToken = null;
  clearUserProfileSnapshot();
  try {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userData');
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
