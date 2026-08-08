/** Hostnames that should only show the public sign wizard (not the marketing site). */
export const ESIGN_PUBLIC_HOSTS = new Set([
  'esign.documantra.in',
  'www.esign.documantra.in',
]);

export const ESIGN_PUBLIC_URL = (
  import.meta.env.VITE_PUBLIC_APP_URL || 'https://esign.documantra.in'
).replace(/\/$/, '');

export const PUBLIC_SIGN_EDITOR_PATH = '/public-sign/editor';

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

export function isPublicSignRoute(pathname?: string): boolean {
  const path =
    pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '');
  if (isEsignPublicHost() && path === '/') return true;
  return ESIGN_PUBLIC_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/** Canonical public-sign URL on esign.documantra.in (wizard lives at /). */
export function getEsignPublicSignUrl(
  pathname = '/public-sign',
  search = '',
  hash = '',
): string {
  const rest = pathname.replace(/^\/public-sign\/?/, '');
  const targetPath = rest ? `/public-sign/${rest.replace(/^\//, '')}` : '/';
  return `${ESIGN_PUBLIC_URL}${targetPath}${search}${hash}`;
}

/** Redirect esign host: wizard at /, legacy /public-sign → /. */
export function redirectEsignPublicHostIfNeeded(): void {
  if (typeof window === 'undefined' || !isEsignPublicHost()) return;

  const { pathname, search, hash } = window.location;
  if (pathname === '/e-sign/signer/thank-you') return;
  if (pathname === '/') return;
  if (pathname === '/public-sign') {
    window.location.replace(`/${search}${hash}`);
    return;
  }
  if (ESIGN_PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return;

  window.location.replace(`/${search}${hash}`);
}
