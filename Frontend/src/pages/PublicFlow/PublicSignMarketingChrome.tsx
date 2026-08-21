import { useEffect, useState } from 'react';
import {
  Apple,
  ArrowUp,
  Mail,
  Menu,
  Shield,
  Smartphone,
  X,
} from 'lucide-react';
import {
  type DocumantraChrome,
  type FooterContent,
  type NavLink,
  DOCUMANTRA_SITE,
  fetchDocumantraChrome,
  fallbackFooter,
  fallbackHeader,
  resolveDocumantraAsset,
  resolveDocumantraHref,
} from '../../services/documantraSiteContent';
import { BRAND } from '../../config/brand';
import '../../styles/documantra-chrome.css';

const primaryGreen = 'documantra-chrome-btn-primary';
const linkClass = 'documantra-chrome-link';
const chromeContainer = 'documantra-container';

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const YouTubeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919C8.416 2.175 8.796 2.163 12 2.163z" />
  </svg>
);

const PinterestIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z" />
  </svg>
);

const MediumIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
  </svg>
);

function useDocumantraChrome() {
  const [chrome, setChrome] = useState<DocumantraChrome>({
    header: fallbackHeader,
    footer: fallbackFooter,
    navLinks: fallbackHeader.navLinks,
  });

  useEffect(() => {
    let cancelled = false;
    fetchDocumantraChrome().then((data) => {
      if (!cancelled) setChrome(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return chrome;
}

const NavAnchor = ({
  link,
  mobile = false,
  onNavigate,
}: {
  link: NavLink;
  mobile?: boolean;
  onNavigate?: () => void;
}) => (
  <a
    href={resolveDocumantraHref(link.href)}
    className={`${linkClass}${mobile ? ' py-2' : ''}`}
    onClick={onNavigate}
  >
    {link.label}
  </a>
);

export const PublicSignHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { header, navLinks } = useDocumantraChrome();

  return (
    <header className="documantra-chrome-header sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-[hsl(40,33%,98%)]/60">
      <div className={`${chromeContainer} flex ${BRAND.showLogo ? 'h-28 justify-between' : 'h-14 justify-end'} items-center`}>
        {BRAND.showLogo ? (
          <a href={DOCUMANTRA_SITE} className="group flex items-center gap-2.5">
            <img
              src={resolveDocumantraAsset(header.logoUrl)}
              alt={header.siteName || 'DocuMantra'}
              className="h-24 w-auto max-w-[660px] object-contain transition-transform group-hover:scale-105"
            />
          </a>
        ) : (
          <span className="sr-only">{header.siteName || BRAND.name}</span>
        )}

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <NavAnchor key={`${link.label}-${link.href}`} link={link} />
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href={resolveDocumantraHref(header.secondaryCtaHref)}
            className="documantra-chrome-btn-ghost"
          >
            {header.secondaryCtaLabel}
          </a>
          <a
            href={resolveDocumantraHref(header.primaryCtaHref)}
            className={primaryGreen}
          >
            {header.primaryCtaLabel}
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
        className={`absolute left-0 right-0 ${BRAND.showLogo ? 'top-28' : 'top-14'} border-b border-[hsl(40,20%,88%)] bg-[hsl(40,33%,98%)] transition-all duration-300 ease-in-out md:hidden ${
          isMenuOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <nav className={`${chromeContainer} flex flex-col gap-4 py-4`}>
          {navLinks.map((link) => (
            <NavAnchor
              key={`mobile-${link.label}-${link.href}`}
              link={link}
              mobile
              onNavigate={() => setIsMenuOpen(false)}
            />
          ))}
          <div className="flex flex-col gap-2 border-t border-[hsl(40,20%,88%)] pt-4">
            <a
              href={resolveDocumantraHref(header.secondaryCtaHref)}
              className="documantra-chrome-btn-ghost w-full text-center"
            >
              {header.secondaryCtaLabel}
            </a>
            <a
              href={resolveDocumantraHref(header.primaryCtaHref)}
              className={`${primaryGreen} w-full text-center`}
            >
              {header.primaryCtaLabel}
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
    className="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(160,48%,21%)] text-[hsl(40,33%,98%)] shadow-lg transition hover:opacity-90"
    aria-label="Back to top"
  >
    <ArrowUp className="h-4 w-4" />
  </button>
);

const TrustBadges = ({ badges }: { badges: string[] }) => (
  <div className="border-t border-[hsl(40,20%,88%)] py-8">
    <div className="flex flex-wrap justify-center gap-3">
      {badges.filter(Boolean).map((badge) => (
        <div
          key={badge}
          className="inline-flex items-center gap-2 rounded-full border border-[hsl(160,48%,21%)]/10 bg-[hsl(160,48%,21%)]/5 px-4 py-2 text-xs font-medium text-[hsl(24,10%,40%)]"
        >
          <Shield className="h-3.5 w-3.5 text-[hsl(160,48%,21%)]" />
          {badge}
        </div>
      ))}
    </div>
  </div>
);

const AppStoreLinks = ({
  appStoreUrl,
  playStoreUrl,
}: {
  appStoreUrl: string;
  playStoreUrl: string;
}) => (
  <div className="flex flex-wrap items-center gap-3">
    {appStoreUrl ? (
      <a
        href={appStoreUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-[hsl(0,0%,18%)] px-4 py-2 text-xs font-medium text-[hsl(40,33%,98%)] transition hover:opacity-90"
      >
        <Apple className="h-4 w-4" />
        <span className="leading-tight">
          <span className="block text-[10px] opacity-80">Download on the</span>
          App Store
        </span>
      </a>
    ) : null}
    {playStoreUrl ? (
      <a
        href={playStoreUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-[hsl(0,0%,18%)] px-4 py-2 text-xs font-medium text-[hsl(40,33%,98%)] transition hover:opacity-90"
      >
        <Smartphone className="h-4 w-4" />
        <span className="leading-tight">
          <span className="block text-[10px] opacity-80">Get it on</span>
          Google Play
        </span>
      </a>
    ) : null}
  </div>
);

const buildSocialItems = (content: FooterContent) => {
  const whatsappUrl = content.whatsappNumber
    ? `https://wa.me/${content.whatsappNumber}?text=${encodeURIComponent(
        content.whatsappMessage || '',
      )}`
    : '';

  return [
    { icon: FacebookIcon, href: content.socialLinks.facebook, label: 'Facebook' },
    { icon: LinkedInIcon, href: content.socialLinks.linkedin, label: 'LinkedIn' },
    { icon: XIcon, href: content.socialLinks.twitter, label: 'X' },
    { icon: YouTubeIcon, href: content.socialLinks.youtube, label: 'YouTube' },
    { icon: InstagramIcon, href: content.socialLinks.instagram, label: 'Instagram' },
    { icon: PinterestIcon, href: content.socialLinks.pinterest, label: 'Pinterest' },
    { icon: MediumIcon, href: content.socialLinks.medium, label: 'Medium' },
    { icon: WhatsAppIcon, href: whatsappUrl, label: 'WhatsApp' },
    {
      icon: null,
      href: content.contactEmail ? `mailto:${content.contactEmail}` : '',
      label: 'Email',
      isLucide: true,
    },
  ].filter((item) => item.href && item.href !== '#');
};

export const PublicSignFooter = () => {
  const { footer, header } = useDocumantraChrome();
  const socialItems = buildSocialItems(footer);
  const whatsappUrl = footer.whatsappNumber
    ? `https://wa.me/${footer.whatsappNumber}?text=${encodeURIComponent(
        footer.whatsappMessage || '',
      )}`
    : '';

  return (
    <footer className="documantra-chrome-footer border-t">
      <div className={`${chromeContainer} py-12 md:py-16`}>
        <div className="mb-10 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {footer.linkGroups.map((group, groupIndex) => (
            <div key={`${group.category}-${groupIndex}`}>
              <h3 className="mb-4 text-sm font-bold text-[hsl(0,0%,18%)]">
                {group.category}
              </h3>
              <ul className="space-y-2.5">
                {(group.links || [])
                  .filter((link) => link.label)
                  .map((link, linkIndex) => (
                    <li key={`${group.category}-${link.label}-${linkIndex}`}>
                      <a
                        href={resolveDocumantraHref(link.href)}
                        className="inline-flex items-center gap-1.5 text-sm text-[hsl(24,10%,40%)] transition-colors hover:text-[hsl(0,0%,18%)]"
                      >
                        {link.label}
                        {link.badge ? (
                          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                            {link.badge}
                          </span>
                        ) : null}
                      </a>
                      {link.desc ? (
                        <span className="mt-0.5 block text-xs text-[hsl(24,10%,40%)]">
                          {link.desc}
                        </span>
                      ) : null}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>

        {footer.showTrustBadges ? (
          <TrustBadges badges={footer.trustBadges || []} />
        ) : null}

        <div className="flex flex-col items-start justify-between gap-8 border-t border-[hsl(40,20%,88%)] py-8 lg:flex-row lg:items-center">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            {BRAND.showLogo ? (
              <a href={DOCUMANTRA_SITE} className="group flex items-center gap-2.5">
                <img
                  src={resolveDocumantraAsset(header.logoUrl)}
                  alt="DocuMantra"
                  className="h-14 w-auto max-w-[280px] object-contain transition-transform group-hover:scale-105"
                />
              </a>
            ) : null}
            <div>
              <p className="max-w-xs text-sm text-[hsl(24,10%,40%)]">{footer.tagline}</p>
              {footer.contactEmail ? (
                <a
                  href={`mailto:${footer.contactEmail}`}
                  className="mt-1 inline-block text-sm text-[hsl(160,48%,21%)] hover:underline"
                >
                  {footer.contactEmail}
                </a>
              ) : null}
            </div>
          </div>

          <div className="flex w-full flex-col items-start gap-6 sm:w-auto sm:flex-row sm:items-center">
            <div>
              <p className="mb-2 text-sm font-medium text-[hsl(0,0%,18%)]">
                {footer.newsletterText}
              </p>
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  window.location.href = `mailto:${footer.contactEmail}?subject=Newsletter%20subscribe`;
                }}
              >
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="max-w-[240px] rounded-md border border-[hsl(40,20%,88%)] bg-[hsl(40,33%,99%)] px-3 py-2 text-sm"
                  required
                />
                <button type="submit" className={primaryGreen}>
                  Subscribe
                </button>
              </form>
            </div>
            <AppStoreLinks
              appStoreUrl={footer.appStoreUrl}
              playStoreUrl={footer.playStoreUrl}
            />
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-[hsl(40,20%,88%)] pt-8 md:flex-row">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <p className="text-sm text-[hsl(24,10%,40%)]">
              © {new Date().getFullYear()} {footer.copyright}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-[hsl(24,10%,40%)]">
              {(footer.bottomQuickLinks || []).map((link) => (
                <a
                  key={link.label}
                  href={resolveDocumantraHref(link.href)}
                  className="transition-colors hover:text-[hsl(0,0%,18%)]"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {socialItems.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(40,20%,94%)] text-[hsl(24,10%,40%)] transition hover:bg-[hsl(24,10%,40%)]/10 hover:text-[hsl(0,0%,18%)]"
                  aria-label={social.label}
                >
                  {social.isLucide ? <Mail size={18} /> : Icon ? <Icon /> : null}
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {footer.whatsappNumber ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-110"
          aria-label="Chat on WhatsApp"
        >
          <WhatsAppIcon />
        </a>
      ) : null}

      <BackToTop />
    </footer>
  );
};
