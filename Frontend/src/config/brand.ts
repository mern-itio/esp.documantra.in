import { DEFAULT_BRAND_LOGO_URL } from '../services/documantraBranding';

/** Single source of truth for product branding across the frontend. */
export const BRAND = {
  name: 'DocuMantra',
  shortName: 'DocuMantra',
  domain: 'esp.documantra.in',
  supportEmail: 'support@documantra.in',
  salesEmail: 'sales@documantra.in',
  privacyEmail: 'privacy@documantra.in',
  logo: DEFAULT_BRAND_LOGO_URL,
  website: 'https://esp.documantra.in',
  themeStorageKey: 'documantra-theme',
} as const;

/** @deprecated internal package scope — not user-facing brand */
export const LEGACY_PACKAGE_SCOPE = '@draftnsign';

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
