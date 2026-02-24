import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/LandingPage/Header';
import ScrollToTop from '../components/common/ScrollToTop';
import Footer from '../components/LandingPage/Footer';

const GuestLayout: React.FC = () => {
  const location = useLocation();


  const HIDE_HEADER_FOOTER_ROUTES: string[] = [
    '/signup',
    '/sign-pdf-online/signer',
    '/sign-pdf-online/plan',
  ];
  const shouldHideHeaderFooter = HIDE_HEADER_FOOTER_ROUTES.some((path) => location.pathname === path);
  
  return (
    <div className="min-h-screen bg-white">
      <ScrollToTop />
      {!shouldHideHeaderFooter && <Header />}
      <main>
        <Outlet />
      </main>
      {!shouldHideHeaderFooter && <Footer />}
    </div>
  );
};

export default GuestLayout;
