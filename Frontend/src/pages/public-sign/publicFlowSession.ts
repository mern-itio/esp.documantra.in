const TOKEN_KEY = 'publicFlowToken';
const ENVELOPE_KEY = 'publicFlowEnvelopeId';

export function setPublicFlowSession(envelopeId: string, token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(ENVELOPE_KEY, envelopeId);
}

export function clearPublicFlowSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(ENVELOPE_KEY);
}

export function getPublicFlowToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getPublicFlowEnvelopeId(): string | null {
  try {
    return sessionStorage.getItem(ENVELOPE_KEY);
  } catch {
    return null;
  }
}

export function hasAuthAccessToken(): boolean {
  try {
    const keys = ['accessToken', 'adminToken', 'userToken', 'token'];
    for (const k of keys) {
      if (localStorage.getItem(k)) return true;
    }
    const raw = localStorage.getItem('userData');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.accessToken || parsed?.token) return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function isPublicFlowEditorActive(
  envelopeId?: string | null
): boolean {
  const token = getPublicFlowToken();
  if (!token) return false;
  if (!envelopeId) return true;
  const stored = getPublicFlowEnvelopeId();
  return !stored || stored === envelopeId;
}
