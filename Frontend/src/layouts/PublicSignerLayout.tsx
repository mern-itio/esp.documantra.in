
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import ScrollToTop from '../components/common/ScrollToTop';
import {
  CookieConsentBanner,
  CookiePreferenceCenter,
} from '../components/common/CookiePreferenceCenter';

const PublicSignerLayout: React.FC = () => {
  const [cookieCenterOpen, setCookieCenterOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <ScrollToTop />
      <Outlet />
      <CookieConsentBanner onManage={() => setCookieCenterOpen(true)} />
      <CookiePreferenceCenter
        open={cookieCenterOpen}
        onClose={() => setCookieCenterOpen(false)}
      />
    </div>
  );
};

export default PublicSignerLayout;
