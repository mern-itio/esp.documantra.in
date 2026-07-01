import { useState } from 'react';
import {
  ArrowUp,
  Mail,
  Menu,
  Shield,
  Smartphone,
  X,
} from 'lucide-react';
import { BRAND } from '../../config/brand';

const mainSite = 'https://documantra.in';

const navLinks = [
  { label: 'Product', href: `${mainSite}/#product` },
  { label: 'Features', href: `${mainSite}/#features` },
  { label: 'Pricing', href: `${mainSite}/pricing` },
  { label: 'Security', href: `${mainSite}/#security` },
  { label: 'API', href: `${mainSite}/#api` },
];

const footerGroups = [
  {
    category: 'Product',
    links: [
      { label: 'Features', href: `${mainSite}/#features` },
      { label: 'Pricing', href: `${mainSite}/pricing` },
      { label: 'Templates', href: `${mainSite}/templates` },
      { label: 'Public Sign', href: '/public-sign' },
    ],
  },
  {
    category: 'Resources',
    links: [
      { label: 'Blog', href: `${mainSite}/blog` },
      { label: 'Case Studies', href: `${mainSite}/case-studies` },
      { label: 'Guides', href: `${mainSite}/guides` },
    ],
  },
  {
    category: 'Company',
    links: [
      { label: 'About Us', href: `${mainSite}/about` },
      { label: 'Careers', href: `${mainSite}/careers` },
      { label: 'Contact', href: `${mainSite}/contact` },
    ],
  },
  {
    category: 'Legal',
    links: [
      { label: 'Privacy Policy', href: `${mainSite}/privacy` },
      { label: 'Terms of Service', href: `${mainSite}/terms` },
      { label: 'Cookie Policy', href: `${mainSite}/cookies` },
    ],
  },
];

const trustBadges = [
  'SOC 2 Type II Certified',
  'ISO 27001',
  'GDPR Compliant',
  '256-bit Encryption',
  'VAPT',
];

const socialLinks = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/documantra/' },
  { label: 'X', href: 'https://x.com/documantra_' },
  { label: 'YouTube', href: 'https://www.youtube.com/@documantra' },
  { label: 'Instagram', href: 'https://www.instagram.com/documantra' },
  { label: 'Email', href: `mailto:${BRAND.supportEmail}` },
];

const linkClass =
  'text-sm font-medium text-gray-600 transition-colors hover:text-gray-950';

export const PublicSignHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/70 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href={mainSite} className="group flex items-center gap-2.5">
          <span className="text-2xl font-bold tracking-tight text-gray-950 transition-transform group-hover:scale-[1.02]">
            DocuMantra
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className={linkClass}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href={`${mainSite}/contact`}
            className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-950"
          >
            Contact Sales
          </a>
          <a
            href="/public-sign"
            className="rounded-md bg-[#1B7A4B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#15633D]"
          >
            Get Started Free
          </a>
        </div>

        <button
          type="button"
          className="rounded-md p-2 md:hidden"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div
        className={`absolute left-0 right-0 top-24 border-b border-gray-200 bg-white transition-all duration-300 md:hidden ${
          isMenuOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`${linkClass} py-2`}
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 border-t border-gray-200 pt-4">
            <a
              href={`${mainSite}/contact`}
              className="rounded-md px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Contact Sales
            </a>
            <a
              href="/public-sign"
              className="rounded-md bg-[#1B7A4B] px-4 py-2 text-center text-sm font-semibold text-white hover:bg-[#15633D]"
            >
              Get Started Free
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
};

const BackToTop = () => (
  <button
    type="button"
    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    className="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-[#1B7A4B] text-white shadow-lg transition hover:bg-[#15633D]"
    aria-label="Back to top"
  >
    <ArrowUp className="h-4 w-4" />
  </button>
);

export const PublicSignFooter = () => {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="mb-10 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {footerGroups.map((group) => (
            <div key={group.category}>
              <h3 className="mb-4 text-sm font-bold text-gray-950">
                {group.category}
              </h3>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={`${group.category}-${link.label}`}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-600 transition-colors hover:text-gray-950"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 py-8">
          <div className="flex flex-wrap justify-center gap-3">
            {trustBadges.map((badge) => (
              <div
                key={badge}
                className="inline-flex items-center gap-2 rounded-full border border-[#1B7A4B]/15 bg-[#1B7A4B]/5 px-4 py-2 text-xs font-medium text-gray-600"
              >
                <Shield className="h-3.5 w-3.5 text-[#1B7A4B]" />
                {badge}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-8 border-t border-gray-200 py-8 lg:flex-row lg:items-center">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <span className="text-lg font-bold tracking-tight text-gray-950">
              DocuMantra
            </span>
            <div>
              <p className="max-w-xs text-sm text-gray-600">
                The free forever digital signature platform for modern businesses.
              </p>
              <a
                href={`mailto:${BRAND.supportEmail}`}
                className="mt-1 inline-block text-sm text-[#1B7A4B] hover:underline"
              >
                {BRAND.supportEmail}
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <a
              href={`${mainSite}/contact`}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
            >
              Contact us
            </a>
            <a
              href={`${mainSite}/pricing`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              <Smartphone className="h-4 w-4" />
              View plans
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 md:flex-row">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} DocuMantra. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-gray-600">
            <a href={`${mainSite}/privacy`} className="hover:text-gray-950">
              Privacy
            </a>
            <a href={`${mainSite}/terms`} className="hover:text-gray-950">
              Terms
            </a>
            <a href={`${mainSite}/cookies`} className="hover:text-gray-950">
              Cookies
            </a>
            <a href={`${mainSite}/sitemap`} className="hover:text-gray-950">
              Sitemap
            </a>
          </div>

          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-gray-950"
                aria-label={social.label}
              >
                {social.label === 'Email' ? (
                  <Mail size={18} />
                ) : (
                  social.label.slice(0, 1)
                )}
              </a>
            ))}
          </div>
        </div>
      </div>

      <BackToTop />
    </footer>
  );
};
