/** Hostnames that should only show the public sign wizard (not the marketing site). */
export const ESIGN_PUBLIC_HOSTS = new Set([
  'esign.documantra.in',
  'www.esign.documantra.in',
]);

const ESIGN_PUBLIC_PATH_PREFIXES = [
  '/public-sign',
  '/e-sign/signer/',
  '/e-sign/preview/',
  '/e-sign/recipient-portal',
];

export const isEsignPublicHost = (hostname?: string): boolean => {
  const host = (
    hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '')
  ).toLowerCase();
  return ESIGN_PUBLIC_HOSTS.has(host);
};

/** True on esign.documantra.in (or when VITE_PUBLIC_SIGN_ONLY=true at build time). */
export const isPublicSignOnlyApp = (): boolean => {
  if (import.meta.env.VITE_PUBLIC_SIGN_ONLY === 'true') {
    return true;
  }
  return isEsignPublicHost();
};

/** Redirect marketing URLs on esign host to /public-sign before React mounts. */
export function redirectEsignPublicHostIfNeeded(): void {
  if (typeof window === 'undefined' || !isEsignPublicHost()) return;

  const { pathname, search, hash } = window.location;
  if (pathname === '/e-sign/signer/thank-you') return;
  if (ESIGN_PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return;
  if (pathname === '/public-sign') return;

  window.location.replace(`/public-sign${search}${hash}`);
}
