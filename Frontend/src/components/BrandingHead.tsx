import { useEffect } from 'react';
import { useDocumantraBranding } from '../hooks/useDocumantraBranding';

/** Updates the document favicon from Supabase branding storage. */
export default function BrandingHead() {
  const { data } = useDocumantraBranding();

  useEffect(() => {
    const href = data?.faviconUrl;
    if (!href) return;

    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    link.type = href.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
    link.href = href;
  }, [data?.faviconUrl]);

  return null;
}
