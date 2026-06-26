/** Single source of truth for product branding across the frontend. */
export const BRAND = {
  name: 'Documantra',
  shortName: 'Documantra',
  domain: 'esp.documantra.in',
  supportEmail: 'support@documantra.in',
  logo: '/Logo.png',
  website: 'https://esp.documantra.in',
} as const;

export const APP_NAME = BRAND.name;
export const COMPANY_NAME = BRAND.name;
export const SUPPORT_EMAIL = BRAND.supportEmail;
export const API_BASE_URL = `${BRAND.website}/`;

export function formatEnvelopeSubject(documentName: string): string {
  const label = String(documentName || '').trim() || 'Document';
  return `Complete with ${BRAND.name}: ${label}`;
}

/** Replace legacy `{BRAND.name}` placeholders in static copy. */
export function brandText(template: string): string {
  return template.replace(/\{BRAND\.name\}/g, BRAND.name);
}
