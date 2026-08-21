import React from 'react';
import { Outlet } from 'react-router-dom';
import ScrollToTop from '../components/common/ScrollToTop';

const GuestLayout: React.FC = () => {
  return (
    <div className="min-h-screen dm-main-bg">
      <ScrollToTop />
      <main className="relative min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default GuestLayout;
