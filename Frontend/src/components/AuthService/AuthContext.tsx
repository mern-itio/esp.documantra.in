import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { API_ENDPOINTS, apiRequest } from '../../services/api';

interface User {
  id: string;
  email: string;
  fullname: string;
  type: string;
  plan: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (userData: { fullname: string; email: string; phone: string; password: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check for existing authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        
        // If fullname is just the email prefix, try to decode it from JWT
        if (parsedUser.fullname === parsedUser.email.split('@')[0]) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const jwtFullname = payload.data?.fullname || payload.fullname;
            if (jwtFullname && jwtFullname !== parsedUser.email.split('@')[0]) {
              // Update localStorage with correct fullname
              const updatedUser = { ...parsedUser, fullname: jwtFullname };
              localStorage.setItem('userData', JSON.stringify(updatedUser));
              setUser(updatedUser);
            } else {
              setUser(parsedUser);
            }
          } catch (jwtError) {
            console.warn('Could not decode JWT token on load:', jwtError);
            setUser(parsedUser);
          }
        } else {
          setUser(parsedUser);
        }
        
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userData');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await apiRequest(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      // Decode JWT token to get fullname
      let fullname = email.split('@')[0]; // fallback
      
      try {
        const token = data.token;
        if (token) {
          // Decode JWT token (without verification for client-side)
          const payload = JSON.parse(atob(token.split('.')[1]));
          fullname = payload.data?.fullname || payload.fullname || fullname;
        }
      } catch (jwtError) {
        console.warn('Could not decode JWT token:', jwtError);
        // Keep the fallback fullname
      }

      // Store authentication data
      localStorage.setItem('accessToken', data.token);
      localStorage.setItem('userData', JSON.stringify({
        id: data.user_id,
        email: email,
        fullname: fullname,
        type: data.type,
        plan: data.plan || 'free'
      }));
      
      setUser({
        id: data.user_id,
        email: email,
        fullname: fullname,
        type: data.type,
        plan: data.plan || 'free'
      });
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    // Clear authentication data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userData');
    
    setUser(null);
    setIsAuthenticated(false);
  };

  const signup = async (userData: { fullname: string; email: string; phone: string; password: string }) => {
    try {
      await apiRequest(API_ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      // After successful registration, automatically log in
      await login(userData.email, userData.password);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    signup
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
