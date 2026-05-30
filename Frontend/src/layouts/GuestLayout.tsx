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
];


  const shouldHideHeaderFooter = HIDE_HEADER_FOOTER_ROUTES.some((path) => location.pathname === path);
  
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
