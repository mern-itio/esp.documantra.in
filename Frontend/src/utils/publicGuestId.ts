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

/** Read guest id only — never creates a new one (safe for claim/link flows). */
export function getExistingPublicGuestId(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(STORAGE_KEY) || readGuestCookie() || '';
  } catch {
    return readGuestCookie();
  }
}

/** Persist guest id from signup/login URL onto ESP after esign public send. */
export function persistPublicGuestId(guestId: string): void {
  const id = String(guestId || '').trim();
  if (!id || typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
  writeGuestCookie(id);
}

export function capturePublicGuestIdFromSearchParams(
  searchParams: URLSearchParams,
): void {
  const fromUrl = searchParams.get('guestId')?.trim();
  if (fromUrl) persistPublicGuestId(fromUrl);
}

export function getPublicGuestId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = getExistingPublicGuestId();
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(STORAGE_KEY, id);
    }
    writeGuestCookie(id);
    return id;
  } catch {
    return readGuestCookie();
  }
}

export function withPublicGuestHeaders(
  headers: Record<string, string> = {},
): Record<string, string> {
  const guestId = getExistingPublicGuestId();
  if (!guestId) return headers;
  return { ...headers, 'x-public-guest-id': guestId };
}

export function buildEspAuthUrl(
  websiteBase: string,
  path: 'signup' | 'login',
  redirectUrl?: string,
): string {
  const site = websiteBase.replace(/\/$/, '');
  const redirect = encodeURIComponent(
    redirectUrl ||
      (typeof window !== 'undefined'
        ? window.location.href
        : 'https://esign.documantra.in/sent'),
  );
  const guestId = getPublicGuestId();
  const guestQuery = guestId ? `&guestId=${encodeURIComponent(guestId)}` : '';
  return `${site}/${path}?redirect=${redirect}${guestQuery}`;
}
