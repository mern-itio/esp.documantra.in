const ADMIN_TOKEN_KEY = 'documantra_admin_access_token';

export function getAdminAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminAccessToken(token: string): void {
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminAccessToken(): void {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

export async function adminLoginLocal(email: string, password: string): Promise<void> {
  const base =
    import.meta.env.VITE_AUTH_SERVICE_URL?.replace(/\/+$/, '') ||
    (import.meta.env.DEV ? '/auth' : 'http://127.0.0.1:2101');
  const res = await fetch(`${base}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Admin login failed');
  }
  if (data.token) {
    setAdminAccessToken(data.token);
  }
}
