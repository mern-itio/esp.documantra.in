import React, { useState } from 'react';
import { AdminHeader, AdminSidebar } from './components';
import { useAdminAuth } from './auth';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const { adminUser, logout } = useAdminAuth();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <AdminHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          adminUser={adminUser ? {
            fullname: adminUser.fullname,
            email: adminUser.email,
            role: adminUser.role
          } : undefined}
          onLogout={logout}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
