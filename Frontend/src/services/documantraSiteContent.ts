/** Live header/footer/menu content from documantra.in (Supabase CMS). */

import {
  DEFAULT_BRAND_LOGO_URL,
  fetchBrandingAssets,
} from './documantraBranding';
import { ESIGN_PUBLIC_URL, isEsignPublicHost } from '../config/appMode';

export const DOCUMANTRA_SITE =
  (import.meta.env.VITE_DOCUMANTRA_SITE_URL || 'https://documantra.in').replace(
    /\/$/,
    '',
  );

const SUPABASE_URL =
  import.meta.env.VITE_DOCUMANTRA_SUPABASE_URL ||
  'https://tgkqdagmnbgmrtjpymbz.supabase.co';

const SUPABASE_KEY =
  import.meta.env.VITE_DOCUMANTRA_SUPABASE_KEY ||
  'sb_publishable_GOc0CTdxDy_MG1BMbKkk5g_rvFOkQ-n';

export type NavLink = { label: string; href: string };

export type FooterLink = {
  label: string;
  href: string;
  badge?: string;
  desc?: string;
};

export type FooterLinkGroup = {
  category: string;
  links: FooterLink[];
};

export type FooterContent = {
  newsletterText: string;
  tagline: string;
  copyright: string;
  showTrustBadges: boolean;
  appStoreUrl: string;
  playStoreUrl: string;
  contactEmail: string;
  whatsappNumber: string;
  whatsappMessage: string;
  socialLinks: Record<string, string>;
  trustBadges: string[];
  bottomQuickLinks: NavLink[];
  linkGroups: FooterLinkGroup[];
};

export type HeaderContent = {
  navLinks: NavLink[];
  logoUrl: string;
  siteName: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
};

const fallbackNavLinks: NavLink[] = [
  { label: 'Product', href: '#product' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Security', href: '#security' },
  { label: 'API', href: '#api' },
];

export const fallbackHeader: HeaderContent = {
  navLinks: fallbackNavLinks,
  logoUrl: DEFAULT_BRAND_LOGO_URL,
  siteName: 'DocuMantra',
  primaryCtaLabel: 'Get Started Free',
  primaryCtaHref: '/public-sign',
  secondaryCtaLabel: 'Contact Sales',
  secondaryCtaHref: '/contact',
};

export const fallbackFooter: FooterContent = {
  newsletterText: 'Subscribe to product updates',
  tagline: 'The free forever digital signature platform for modern businesses.',
  copyright: 'DocuMantra. All rights reserved.',
  showTrustBadges: true,
  appStoreUrl: 'https://apps.apple.com',
  playStoreUrl: 'https://play.google.com',
  contactEmail: 'connect@documantra.in',
  whatsappNumber: '918527723931',
  whatsappMessage:
    'Hello! I am interested in DocuMantra. Could you please help me get started?',
  socialLinks: {
    facebook: 'https://www.facebook.com/DocuMantra',
    linkedin: 'https://www.linkedin.com/company/documantra/',
    twitter: 'https://x.com/documantra_',
    youtube: 'https://www.youtube.com/@documantra',
    instagram: 'https://www.instagram.com/documantra',
    pinterest: 'https://in.pinterest.com/documantra/',
    medium: 'https://documantra.medium.com/',
  },
  trustBadges: [
    'SOC 2 Type II Certified',
    'ISO 27001',
    'GDPR Compliant',
    '256-bit Encryption',
    'VAPT',
  ],
  bottomQuickLinks: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Cookies', href: '/cookies' },
    { label: 'Sitemap', href: '/sitemap' },
  ],
  linkGroups: [
    {
      category: 'Product',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Templates', href: '/templates' },
        { label: 'Public Sign', href: '/public-sign' },
      ],
    },
    {
      category: 'Resources',
      links: [
        { label: 'Blog', href: '/blog' },
        { label: 'Case Studies', href: '/case-studies' },
        { label: 'Guides', href: '/guides' },
      ],
    },
    {
      category: 'Company',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Careers', href: '/careers' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    {
      category: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Cookie Policy', href: '/cookies' },
      ],
    },
  ],
};

const supabaseHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

async function supabaseSelect<T>(
  table: string,
  filter: string,
  select = '*',
): Promise<T | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?${filter}&select=${select}`,
      { headers: supabaseHeaders },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as T[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

const normalizeFooter = (value: Partial<FooterContent> | null): FooterContent => ({
  ...fallbackFooter,
  ...(value || {}),
  socialLinks: {
    ...fallbackFooter.socialLinks,
    ...(value?.socialLinks || {}),
  },
  trustBadges: Array.isArray(value?.trustBadges)
    ? value!.trustBadges
    : fallbackFooter.trustBadges,
  bottomQuickLinks: Array.isArray(value?.bottomQuickLinks)
    ? value!.bottomQuickLinks
    : fallbackFooter.bottomQuickLinks,
  linkGroups: Array.isArray(value?.linkGroups)
    ? value!.linkGroups
    : fallbackFooter.linkGroups,
});

/** Absolute URL for documantra.in assets and pages. Public sign lives on esign.documantra.in. */
export function resolveDocumantraHref(href: string): string {
  if (!href) return DOCUMANTRA_SITE;
  if (href.startsWith('http://') || href.startsWith('https://')) return href;
  if (href === '/public-sign' || href.startsWith('/public-sign/')) {
    if (typeof window !== 'undefined' && isEsignPublicHost()) {
      if (href === '/public-sign') return '/';
      if (href.startsWith('/public-sign/editor')) {
        return href.replace('/public-sign/editor', '/editor');
      }
      return href;
    }
    if (href === '/public-sign') {
      return `${ESIGN_PUBLIC_URL}/`;
    }
    if (href.startsWith('/public-sign/editor')) {
      return `${ESIGN_PUBLIC_URL}${href.replace('/public-sign/editor', '/editor')}`;
    }
    return `${ESIGN_PUBLIC_URL}${href}`;
  }
  if (href.startsWith('/')) return `${DOCUMANTRA_SITE}${href}`;
  if (href.startsWith('#')) return `${DOCUMANTRA_SITE}/${href}`;
  return `${DOCUMANTRA_SITE}/${href}`;
}

export function resolveDocumantraAsset(url?: string): string {
  if (!url || url === '/logo.png' || url === '/Logo.png') {
    return DEFAULT_BRAND_LOGO_URL;
  }
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${DOCUMANTRA_SITE}${url.startsWith('/') ? url : `/${url}`}`;
}

export type DocumantraChrome = {
  header: HeaderContent;
  footer: FooterContent;
  navLinks: NavLink[];
};

export async function fetchDocumantraChrome(): Promise<DocumantraChrome> {
  const [headerRow, footerRow, menuRow, themeRow, branding] = await Promise.all([
    supabaseSelect<{ content: Partial<HeaderContent> }>(
      'site_sections',
      'section_key=eq.header',
      'content',
    ),
    supabaseSelect<{ content: Partial<FooterContent> }>(
      'site_sections',
      'section_key=eq.footer',
      'content',
    ),
    supabaseSelect<{ items: NavLink[] }>(
      'menus',
      'location_key=eq.primary',
      'items',
    ),
    supabaseSelect<{ value: Partial<HeaderContent> }>(
      'settings',
      'setting_key=eq.theme',
      'value',
    ),
    fetchBrandingAssets(),
  ]);

  const theme = themeRow?.value || {};
  const headerDb = headerRow?.content || {};
  const header: HeaderContent = {
    ...fallbackHeader,
    ...theme,
    ...headerDb,
    logoUrl: branding.logoUrl || headerDb.logoUrl || theme.logoUrl || fallbackHeader.logoUrl,
    primaryCtaHref: '/public-sign',
    primaryCtaLabel:
      headerDb.primaryCtaLabel || theme.primaryCtaLabel || fallbackHeader.primaryCtaLabel,
    secondaryCtaHref:
      headerDb.secondaryCtaHref || theme.secondaryCtaHref || fallbackHeader.secondaryCtaHref,
    secondaryCtaLabel:
      headerDb.secondaryCtaLabel || theme.secondaryCtaLabel || fallbackHeader.secondaryCtaLabel,
  };

  const menuItems =
    Array.isArray(menuRow?.items) && menuRow.items.length
      ? menuRow.items
      : header.navLinks?.length
        ? header.navLinks
        : fallbackNavLinks;

  const footer = normalizeFooter(footerRow?.content || null);
  const productGroup = footer.linkGroups.find((g) => g.category === 'Product');
  if (productGroup && !productGroup.links.some((l) => l.label === 'Public Sign')) {
    productGroup.links.push({ label: 'Public Sign', href: '/public-sign' });
  }

  return {
    header,
    footer,
    navLinks: menuItems,
  };
}
