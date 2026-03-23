import React from 'react';
import { Outlet } from 'react-router-dom';
// import GiftWidget from '../components/common/GiftWidget';

const DashboardNoSidebarLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* <Header sidebarOpen={false} setSidebarOpen={() => {}} /> */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-2">
          <Outlet />
        </main>
        {/* <GiftWidget /> */}
      </div>
    </div>
  );
};

export default DashboardNoSidebarLayout;


