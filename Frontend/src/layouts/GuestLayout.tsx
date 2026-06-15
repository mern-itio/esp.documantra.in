import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/LandingPage/Header';
import ScrollToTop from '../components/common/ScrollToTop';
import Footer from '../components/LandingPage/Footer';

const GuestLayout: React.FC = () => {
  const location = useLocation();

const HIDE_HEADER_FOOTER_ROUTES: string[] = [
    '/login',
    '/signup',
    '/dashboard',
    '/documents',
    '/templates',
    '/profile',
    '/settings',
    '/sign-pdf-online/signer',
    '/sign-pdf-online/plan',
    '/tools'
];

const shouldHideHeaderFooter =
  HIDE_HEADER_FOOTER_ROUTES.some(
    (path) => location.pathname === path
  ) ||
  location.pathname === "/tools" ||
  location.pathname.startsWith("/pdf-") ||
  location.pathname.startsWith("/word-") ||
  location.pathname.startsWith("/excel-") ||
  location.pathname.startsWith("/powerpoint-") ||
  location.pathname.startsWith("/merge-") ||
  location.pathname.startsWith("/split-") ||
  location.pathname.startsWith("/compress-") ||
  location.pathname.startsWith("/rotate-") ||
  location.pathname.startsWith("/extract-") ||
  location.pathname.startsWith("/delete-") ||
  location.pathname.startsWith("/protect-") ||
  location.pathname.startsWith("/unlock-") ||
  location.pathname.startsWith("/watermark-") ||
  location.pathname.startsWith("/ocr-") ||
  location.pathname.startsWith("/validate-") ||
  location.pathname.startsWith("/redact-") ||
  location.pathname.startsWith("/repair-") ||
  location.pathname.startsWith("/img-") ||
  location.pathname.startsWith("/text-") ||
  location.pathname.startsWith("/html-");
  
  return (
    <div className="min-h-screen bg-[#F7F3EE]">
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
