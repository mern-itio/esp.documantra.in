import React, { useState } from 'react';
import { Sidebar } from '../components/common/sidebar';
import { Header } from '../components/common/header';
import { useAuth } from '../components/AuthService/AuthContext';
import { Navigate } from 'react-router-dom';
import DashboardContent from '../pages/Dashboard/DashboardContent';
import CompliancePage from '../pages/Dashboard/CompliancePage';
import AuditTrailPage from '../pages/Dashboard/AuditTrailPage';
import RiskManagementPage from '../pages/Dashboard/RiskManagementPage';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = () => {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeView === 'dashboard' && <DashboardContent />}
          {activeView === 'compliance' && <CompliancePage />}
          {activeView === 'audit' && <AuditTrailPage />}
          {activeView === 'risk' && <RiskManagementPage />}
          {activeView !== 'dashboard' && activeView !== 'compliance' && activeView !== 'audit' && activeView !== 'risk' && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
                <p className="text-gray-600">This section is under development</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;