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
    <div className="flex h-screen bg-gray-100 overflow-visible">
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
        <main className="bg-card/95 flex-1 overflow-x-hidden overflow-y-auto p-2">
          <ScrollToTop />
          <Outlet />
        </main>
        {/* <GiftWidget /> */}
      </div>
    </div>
  );
};

export default DashboardLayout;