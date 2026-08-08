import { useEffect } from 'react';
import { getEsignPublicSignUrl } from '../../config/appMode';

/** Sends esp.documantra.in/public-sign traffic to esign.documantra.in. */
export default function RedirectToEsignPublic() {
  useEffect(() => {
    const { pathname, search, hash } = window.location;
    window.location.replace(getEsignPublicSignUrl(pathname, search, hash));
  }, []);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-[hsl(24,10%,40%)]">
      Redirecting to DocuMantra sign…
    </div>
  );
}
