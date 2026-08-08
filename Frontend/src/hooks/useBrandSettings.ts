import { useEffect, useState } from 'react';
import { BRAND } from '../config/brand';
import {
  fetchDocumantraChrome,
  fallbackFooter,
  fallbackHeader,
} from '../services/documantraSiteContent';

export type BrandSettings = {
  name: string;
  supportEmail: string;
  privacyEmail: string;
  salesEmail: string;
};

const defaultSettings: BrandSettings = {
  name: fallbackHeader.siteName || BRAND.name,
  supportEmail: fallbackFooter.contactEmail || BRAND.supportEmail,
  privacyEmail: BRAND.privacyEmail,
  salesEmail: BRAND.salesEmail,
};

/** Load site name + contact email from documantra.in admin (Supabase CMS). */
export async function fetchBrandSettings(): Promise<BrandSettings> {
  try {
    const chrome = await fetchDocumantraChrome();
    return {
      name: chrome.header.siteName || BRAND.name,
      supportEmail: chrome.footer.contactEmail || BRAND.supportEmail,
      privacyEmail: BRAND.privacyEmail,
      salesEmail: BRAND.salesEmail,
    };
  } catch {
    return defaultSettings;
  }
}

export function useBrandSettings() {
  const [settings, setSettings] = useState<BrandSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchBrandSettings()
      .then((data) => {
        if (!cancelled) setSettings(data);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { ...settings, isLoading };
}
