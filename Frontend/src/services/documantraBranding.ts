const SUPABASE_URL = (
  import.meta.env.VITE_DOCUMANTRA_SUPABASE_URL ||
  'https://tgkqdagmnbgmrtjpymbz.supabase.co'
).replace(/\/$/, '');

const SUPABASE_KEY =
  import.meta.env.VITE_DOCUMANTRA_SUPABASE_KEY ||
  'sb_publishable_GOc0CTdxDy_MG1BMbKkk5g_rvFOkQ-n';

const BUCKET = 'branding';

export const DEFAULT_BRAND_LOGO_URL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/logo.png`;
export const DEFAULT_BRAND_FAVICON_URL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/favicon.png`;

export type BrandingAssets = {
  logoUrl: string;
  faviconUrl: string;
};

function cacheBust(url: string, token?: string | null) {
  if (!token) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${encodeURIComponent(token)}`;
}

async function fetchBrandingAssetUrl(
  assetKey: 'logo' | 'favicon',
): Promise<string | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefix: '', limit: 100 }),
    });

    if (!res.ok) return null;
    const files = (await res.json()) as Array<{
      name: string;
      updated_at?: string;
      id?: string;
    }>;

    const match = files
      .filter((file) => file.name.startsWith(`${assetKey}.`))
      .sort((a, b) =>
        String(b.updated_at || '').localeCompare(String(a.updated_at || '')),
      )[0];

    if (!match) return null;

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${match.name}`;
    return cacheBust(publicUrl, match.updated_at || match.id);
  } catch {
    return null;
  }
}

export async function fetchBrandingAssets(): Promise<BrandingAssets> {
  const [logoUrl, faviconUrl] = await Promise.all([
    fetchBrandingAssetUrl('logo'),
    fetchBrandingAssetUrl('favicon'),
  ]);

  return {
    logoUrl: logoUrl || DEFAULT_BRAND_LOGO_URL,
    faviconUrl: faviconUrl || DEFAULT_BRAND_FAVICON_URL,
  };
}
