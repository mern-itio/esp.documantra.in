/** True on esign.documantra.in (or when VITE_PUBLIC_SIGN_ONLY=true at build time). */
export const isPublicSignOnlyApp = (): boolean => {
  if (import.meta.env.VITE_PUBLIC_SIGN_ONLY === 'true') {
    return true;
  }
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'esign.documantra.in';
  }
  return false;
};
