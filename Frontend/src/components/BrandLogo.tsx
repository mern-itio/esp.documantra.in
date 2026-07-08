import type { ImgHTMLAttributes } from 'react';
import { BRAND } from '../config/brand';
import { useDocumantraBranding } from '../hooks/useDocumantraBranding';
import { DEFAULT_BRAND_LOGO_URL } from '../services/documantraBranding';

type BrandLogoProps = ImgHTMLAttributes<HTMLImageElement>;

/** Product logo from Supabase branding storage (admin upload on documantra.in). */
export default function BrandLogo({
  alt,
  className,
  src,
  ...rest
}: BrandLogoProps) {
  const { data } = useDocumantraBranding();

  return (
    <img
      src={src || data.logoUrl || DEFAULT_BRAND_LOGO_URL}
      alt={alt ?? BRAND.name}
      className={className}
      {...rest}
    />
  );
}
