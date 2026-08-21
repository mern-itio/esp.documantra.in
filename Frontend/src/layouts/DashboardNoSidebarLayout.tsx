import React from 'react';
import { Outlet } from 'react-router-dom';
// import GiftWidget from '../components/common/GiftWidget';

const DashboardNoSidebarLayout: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <main className="dm-main-bg flex-1 overflow-x-hidden overflow-y-auto p-3 md:p-5 lg:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(38,5,89,0.04),transparent_50%)]" />
          <div className="relative">
            <Outlet />
          </div>
        </main>
        {/* <GiftWidget /> */}
      </div>
    </div>
  );
};

export default DashboardNoSidebarLayout;
