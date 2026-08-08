const STORAGE_KEY = 'documantra-public-guest-id';

export function getPublicGuestId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}

export function withPublicGuestHeaders(
  headers: Record<string, string> = {},
): Record<string, string> {
  const guestId = getPublicGuestId();
  if (!guestId) return headers;
  return { ...headers, 'x-public-guest-id': guestId };
}
