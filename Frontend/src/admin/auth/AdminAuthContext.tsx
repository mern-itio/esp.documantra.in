import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface AdminUser {
  id: string;
  fullname: string;
  email: string;
  role: string;
  permissions: string[];
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  adminToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateAdminUser: (user: AdminUser) => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing admin session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    const storedUser = localStorage.getItem('adminUser');
    
    if (storedToken && storedUser && storedUser !== 'undefined') {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && typeof parsed === 'object') {
          setAdminToken(storedToken);
          setAdminUser(parsed);
        } else {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
        }
      } catch {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      }
    } else {
      // Clean up any bad state like 'undefined' string
      if (storedUser === 'undefined') {
        localStorage.removeItem('adminUser');
      }
      if (storedToken && !storedUser) {
        // Token without user is not a valid admin session
        localStorage.removeItem('adminToken');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // TODO: Replace with actual admin API endpoint
      const response = await fetch('http://localhost:2101/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const token: string | undefined = (data && (data.token || data.accessToken)) as string | undefined;
        // Backend returns { status, message, admin_id, token, type }
        // Build a minimal user object if 'user' is not provided
        const userFromApi: any = (data && data.user) ? data.user : {
          id: data?.admin_id || '',
          fullname: '',
          email,
          role: 'admin',
          permissions: []
        };

        if (!token) {
          console.error('Admin login: token missing in response');
          return false;
        }

        setAdminToken(token);
        setAdminUser(userFromApi);

        // Store in localStorage
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminUser', JSON.stringify(userFromApi));

        return true;
      } else {
        console.error('Admin login failed');
        return false;
      }
    } catch (error) {
      console.error('Admin login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAdminUser(null);
    setAdminToken(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  };

  const updateAdminUser = (user: AdminUser) => {
    setAdminUser(user);
    localStorage.setItem('adminUser', JSON.stringify(user));
  };

  const isAuthenticated = !!adminToken && !!adminUser;

  const value: AdminAuthContextType = {
    adminUser,
    adminToken,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateAdminUser,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export default AdminAuthContext;
