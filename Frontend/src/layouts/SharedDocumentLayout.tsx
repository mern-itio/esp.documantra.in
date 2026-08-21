import React from 'react';
import { Outlet } from 'react-router-dom';
import ScrollToTop from '../components/common/ScrollToTop';

const SharedDocumentLayout: React.FC = () => {
  return (
    <div className="min-h-screen dm-main-bg">
      <main className="relative w-full">
        <ScrollToTop />
        <Outlet />
      </main>
    </div>
  );
};

export default SharedDocumentLayout;
