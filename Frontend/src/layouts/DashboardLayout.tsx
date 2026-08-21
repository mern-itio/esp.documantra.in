import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/sidebar';
import Header from '../components/common/header';
import ScrollToTop from '../components/common/ScrollToTop';
// import GiftWidget from '../components/common/GiftWidget';

import { useSidebar } from '../context/SidebarContext';
const DashboardLayout: React.FC = () => {
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const [activeView, setActiveView] = React.useState('dashboard');
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar 
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <main className="relative flex-1 overflow-x-hidden overflow-y-auto dm-main-bg p-3 md:p-5 lg:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(21,94,75,0.05),transparent_50%)]" />
          <div className="relative min-h-0">
          <ScrollToTop />
          <Outlet />
          </div>
        </main>
        {/* <GiftWidget /> */}
      </div>
    </div>
  );
};

export default DashboardLayout;