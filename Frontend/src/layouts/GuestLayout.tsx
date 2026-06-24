import React from 'react';
import { Outlet } from 'react-router-dom';
import ScrollToTop from '../components/common/ScrollToTop';

const GuestLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F7F3EE]">
      <ScrollToTop />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default GuestLayout;
