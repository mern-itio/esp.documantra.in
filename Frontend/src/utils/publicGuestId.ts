const STORAGE_KEY = 'documantra-public-guest-id';
const COOKIE_KEY = 'publicGuestId';

function readGuestCookie(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${COOKIE_KEY}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : '';
}

function writeGuestCookie(id: string): void {
  if (typeof document === 'undefined' || !id) return;
  const hostname = window.location.hostname;
  const isDocumantra =
    hostname === 'documantra.in' || hostname.endsWith('.documantra.in');
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const domain = isDocumantra ? '; domain=.documantra.in' : '';
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(id)}; path=/; max-age=31536000; SameSite=Lax${secure}${domain}`;
}

export function getPublicGuestId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = localStorage.getItem(STORAGE_KEY) || readGuestCookie();
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    localStorage.setItem(STORAGE_KEY, id);
    writeGuestCookie(id);
    return id;
  } catch {
    return readGuestCookie();
  }
}

export function withPublicGuestHeaders(
  headers: Record<string, string> = {},
): Record<string, string> {
  const guestId = getPublicGuestId();
  if (!guestId) return headers;
  return { ...headers, 'x-public-guest-id': guestId };
}
