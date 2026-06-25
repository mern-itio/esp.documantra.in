/** M14: httpOnly cookie auth — do not persist JWT in localStorage. */

let memoryAccessToken: string | null = null;

/** Short-lived in-memory token for WebSocket handshakes only (not localStorage). */
export const setMemoryAccessToken = (token: string | null) => {
  memoryAccessToken = token;
};

export const getMemoryAccessToken = (): string | null => memoryAccessToken;

export const AUTH_FETCH_INIT: RequestInit = {
  credentials: 'include',
};

export const clearLegacyAuthStorage = () => {
  memoryAccessToken = null;
  try {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('orgAccessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('userToken');
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

export const withAuthFetch = (init: RequestInit = {}): RequestInit => ({
  credentials: 'include',
  ...init,
  headers: {
    ...getAccountContextHeaders(),
    ...(init.headers || {}),
  },
});
