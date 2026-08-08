import { useEffect } from 'react';
import { isPublicSignOnlyApp } from '../../config/appMode';

export const PUBLIC_SIGN_META_TITLE =
  'DocuMantra | 100% Free E-Signature — Sign Documents Online';

export const PUBLIC_SIGN_META_DESCRIPTION =
  'Upload PDF and collect signatures with DocuMantra\'s 100% free e-signature. No sign-up required — sign documents online in minutes.';

const setMeta = (name: string, content: string, attribute: 'name' | 'property' = 'name') => {
  let tag = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, name);
    document.head.appendChild(tag);
  }
  tag.content = content;
};

/** SEO title + description for esign.documantra.in public sign flow. */
export default function PublicSignHead() {
  useEffect(() => {
    if (!isPublicSignOnlyApp()) return;

    document.title = PUBLIC_SIGN_META_TITLE;
    setMeta('description', PUBLIC_SIGN_META_DESCRIPTION);
    setMeta('og:title', PUBLIC_SIGN_META_TITLE, 'property');
    setMeta('og:description', PUBLIC_SIGN_META_DESCRIPTION, 'property');
    setMeta('twitter:title', PUBLIC_SIGN_META_TITLE, 'property');
    setMeta('twitter:description', PUBLIC_SIGN_META_DESCRIPTION, 'property');
  }, []);

  return null;
}
