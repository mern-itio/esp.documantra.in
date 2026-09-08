/** Canonical legal page paths — use these everywhere; never invent parallel URLs. */
export const LEGAL_PATHS = {
  termsOfUse: '/terms-of-use',
  privacyPolicy: '/privacy-policy',
  electronicRecordDisclosure: '/electronic-record-disclosure',
  cookiePolicy: '/cookie-policy',
} as const;

/** Legacy paths that must redirect to LEGAL_PATHS (no duplicate live pages). */
export const LEGAL_REDIRECTS: Record<string, string> = {
  '/terms': LEGAL_PATHS.termsOfUse,
  '/terms-of-service': LEGAL_PATHS.termsOfUse,
  '/privacy': LEGAL_PATHS.privacyPolicy,
  '/cookies': LEGAL_PATHS.cookiePolicy,
};
