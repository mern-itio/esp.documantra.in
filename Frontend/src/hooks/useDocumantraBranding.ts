import { useEffect, useState } from 'react';
import {
  DEFAULT_BRAND_FAVICON_URL,
  DEFAULT_BRAND_LOGO_URL,
  fetchBrandingAssets,
  type BrandingAssets,
} from '../services/documantraBranding';

export function useDocumantraBranding() {
  const [data, setData] = useState<BrandingAssets>({
    logoUrl: DEFAULT_BRAND_LOGO_URL,
    faviconUrl: DEFAULT_BRAND_FAVICON_URL,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchBrandingAssets()
      .then((assets) => {
        if (!cancelled) setData(assets);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading };
}
