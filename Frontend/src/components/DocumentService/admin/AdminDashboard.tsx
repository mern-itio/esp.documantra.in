import React, { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { DocumentAdminDashboard } from './DocumentAdminDashboard';
import { DocumentDirectory } from './DocumentDirectory';
import { StorageManager } from './StorageManager';
import { CollaborationMonitor } from './CollaborationMonitor';
import { PermissionManager } from '../security/PermissionManager';
import { EnhancedDocumentAnalytics } from '../analytics/EnhancedDocumentAnalytics';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DocumentAdminDashboard />;
      case 'documents':
        return <DocumentDirectory />;
      case 'storage':
        return <StorageManager />;
      case 'collaboration':
        return <CollaborationMonitor />;
      case 'permissions':
        return <PermissionManager 
          permissions={[]}
          onGrantPermission={() => {}}
          onRevokePermission={() => {}}
          onUpdatePermission={() => {}}
        />;
      case 'analytics':
        return <EnhancedDocumentAnalytics />;
      case 'system':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">System Configuration</h1>
            <p className="text-gray-600">System configuration and maintenance tools will be available here.</p>
          </div>
        );
      default:
        return <DocumentAdminDashboard />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </AdminLayout>
  );
}