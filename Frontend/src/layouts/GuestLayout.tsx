import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/LandingPage/Header';
import ScrollToTop from '../components/common/ScrollToTop';
import Footer from '../components/LandingPage/Footer';

const GuestLayout: React.FC = () => {
  const location = useLocation();

  const HIDE_FOOTER_ROUTES: string[] = [
    // Convert to PDF
    '/img-to-pdf', '/word-to-pdf', '/powerpoint-to-pdf', '/excel-to-pdf', '/html-to-pdf',
    // Convert from PDF
    '/pdf-to-word', '/pdf-to-powerpoint', '/pdf-to-excel', '/pdf-to-jpg', '/pdf-to-pdfa', '/pdf-to-text',
    // Organize
    '/merge-pdf', '/split-pdf', '/delete-pages', '/extract-pages', '/organize-pdf', '/scan-to-pdf',
    // Optimize
    '/compress-pdf', '/repair-pdf', '/ocr-pdf',
    // Edit
    '/rotate-pdf', '/add-page-numbers', '/watermark-pdf', '/crop-pdf', '/edit-pdf',
    // Security
    '/unlock-pdf', '/protect-pdf', '/sign-pdf', '/redact-pdf', '/compare-pdf',
  ];

  const shouldHideFooter = HIDE_FOOTER_ROUTES.some((path) => location.pathname.startsWith(path));
  return (
    <div className="min-h-screen bg-white">
      <ScrollToTop />
      <Header />
      <main>
        <Outlet />
      </main>
      {!shouldHideFooter && <Footer />}
    </div>
  );
};

export default GuestLayout;
