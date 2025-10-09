import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout, AdminLogin, AdminDashboard, AdminDocumentManagement, AdminESignManagement, AdminSubscriptionManagement, AdminUserList } from './index';
import { useAdminAuth } from './auth';
import AdminUserDetail from './pages/AdminUserDetailPage';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" replace />;
};

const AdminRoutes: React.FC = () => {
  const { isAuthenticated } = useAdminAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="login" 
        element={isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin />} 
      />

      {/* Protected Routes */}
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="pdf-tools" element={<AdminDocumentManagement />} />
                <Route path="e-sign" element={<AdminESignManagement />} />
                <Route path="subscription" element={<AdminSubscriptionManagement />} />
                <Route path="users" element={<AdminUserList />} />
                <Route path="users/:id" element={<AdminUserDetail />} />
                <Route path="" element={<Navigate to="/admin/dashboard" replace />} />
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
};

export default AdminRoutes;
