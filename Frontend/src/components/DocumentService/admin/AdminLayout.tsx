import React, { useState } from 'react';
import { 
  BarChart3, 
  FileText, 
  HardDrive, 
  Users, 
  Settings,
  Shield,
  Activity,
  Database,
  Menu,
  X
} from 'lucide-react';
import { useDocumentStore } from '../../store/documentStore';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const adminTabs = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    description: 'System overview and metrics'
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FileText,
    description: 'Document directory and management'
  },
  {
    id: 'storage',
    label: 'Storage',
    icon: HardDrive,
    description: 'Storage usage and quotas'
  },
  {
    id: 'collaboration',
    label: 'Collaboration',
    icon: Users,
    description: 'Real-time collaboration monitoring'
  },
  {
    id: 'permissions',
    label: 'Permissions',
    icon: Shield,
    description: 'Access control and security'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: Activity,
    description: 'Advanced analytics and reporting'
  },
  {
    id: 'system',
    label: 'System',
    icon: Settings,
    description: 'System configuration and maintenance'
  }
];

export function AdminLayout({ children, activeTab, onTabChange }: AdminLayoutProps) {
  const { currentUser } = useDocumentStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (currentUser.role !== 'super_admin' && currentUser.role !== 'team_admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Access Required</h3>
          <p className="text-gray-500">You need admin permissions to access this area.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Database className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
                <p className="text-xs text-gray-500">
                  {currentUser.role === 'super_admin' ? 'Super Admin' : 'Team Admin'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden h-8 w-8 p-0"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {adminTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{tab.label}</p>
                    <p className="text-xs text-gray-500 truncate">{tab.description}</p>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {currentUser.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {currentUser.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="h-8 w-8 p-0"
            >
              <Menu className="w-4 h-4" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">
              {adminTabs.find(tab => tab.id === activeTab)?.label || 'Admin'}
            </h1>
            <div className="w-8" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}