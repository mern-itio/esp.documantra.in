import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { API_ENDPOINTS, apiRequest } from '../../services/api';
import { authApi } from '../../services/apiHelper';
import { SubscriptionService, SubscriptionStorage } from '../../services/subscriptionService';

interface User {
  id: string;
  email: string;
  fullname: string;
  type: string;
  plan: string;
  address?: string;
  company?: string;
  phone?: string;
  isFirstLogin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (userData: { fullname: string; email: string; phone: string; address: string; company: string; password: string; }) => Promise<void>;
  accountType: 'user' | 'organization';
  organizationId: string | null;
  organizationDetail: any | null;
  switchAccount: (accountType: 'user' | 'organization', organizationId?: string | null) => Promise<void>;
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
  const [accountType, setAccountType] = useState<'user' | 'organization'>(() => {
    const v = localStorage.getItem('accountType');
    return (v === 'organization' ? 'organization' : 'user');
  });
  const [organizationId, setOrganizationId] = useState<string | null>(() => {
    return localStorage.getItem('organizationId') || null;
  });
  const [organizationDetail, setOrganizationDetail] = useState<any | null>(() => {
    try {
      const v = localStorage.getItem('organizationDetail');
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  });

  // Check for existing authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);

        // Try to enrich missing fields from JWT payload (fullname/phone/address/company)
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const jwtFullname = payload?.data?.fullname || payload?.fullname;
          const jwtPhone = payload?.data?.phone || payload?.phone;
          const jwtAddress = payload?.data?.address || payload?.address;
          const jwtCompany = payload?.data?.company || payload?.company;

          const needsFullname = !parsedUser.fullname || parsedUser.fullname === parsedUser.email?.split('@')[0];
          const needsPhone = !parsedUser.phone && !!jwtPhone;
          const needsAddress = !parsedUser.address && !!jwtAddress;
          const needsCompany = !parsedUser.company && !!jwtCompany;

          if ((needsFullname && jwtFullname) || needsPhone || needsAddress || needsCompany) {
            const updatedUser = {
              ...parsedUser,
              fullname: needsFullname && jwtFullname ? jwtFullname : parsedUser.fullname,
              phone: needsPhone ? jwtPhone : parsedUser.phone,
              address: needsAddress ? jwtAddress : parsedUser.address,
              company: needsCompany ? jwtCompany : parsedUser.company,
            };
            localStorage.setItem('userData', JSON.stringify(updatedUser));
            setUser(updatedUser);
          } else {
            setUser(parsedUser);
          }
        } catch (jwtError) {
          // If JWT cannot be decoded, just use stored user
          console.warn('Could not decode JWT token on load:', jwtError);
          setUser(parsedUser);
        }
        
        setIsAuthenticated(true);
        // initialize accountType and organizationId from storage (if present)
        const storedAccountType = localStorage.getItem('accountType');
        const storedOrgId = localStorage.getItem('organizationId');
        if (storedAccountType === 'organization') setAccountType('organization');
        else setAccountType('user');
        setOrganizationId(storedOrgId || null);
        try {
          const storedOrgDetail = localStorage.getItem('organizationDetail');
          setOrganizationDetail(storedOrgDetail ? JSON.parse(storedOrgDetail) : null);
        } catch {
          setOrganizationDetail(null);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userData');
      }
    }
    setLoading(false);
  }, []);

  // Listen for subscription updates and update user plan
  useEffect(() => {
    const handleSubscriptionUpdate = (event: CustomEvent) => {
      const { planName } = event.detail;
      if (user) {
        const updatedUser = { ...user, plan: planName };
        setUser(updatedUser);
        // Also update localStorage
        const userData = localStorage.getItem('userData');
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            parsedUser.plan = planName;
            localStorage.setItem('userData', JSON.stringify(parsedUser));
          } catch (err) {
            console.warn('Failed to update userData:', err);
          }
        }
      }
    };

    window.addEventListener('subscription-updated', handleSubscriptionUpdate as EventListener);
    return () => {
      window.removeEventListener('subscription-updated', handleSubscriptionUpdate as EventListener);
    };
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      const data = await apiRequest(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      // Decode JWT token to get fullname, phone, address, company
      let fullname = email.split('@')[0]; // fallback
      let phone: string | undefined = undefined;
      let address: string | undefined = undefined;
      let company: string | undefined = undefined;
      
      try {
        const token = data.token;
        if (token) {
          // Decode JWT token (without verification for client-side)
          const payload = JSON.parse(atob(token.split('.')[1]));
          fullname = payload.data?.fullname || payload.fullname || fullname;
          phone = payload.data?.phone || payload.phone || phone;
          address = payload.data?.address || payload.address || address;
          company = payload.data?.company || payload.company || company;
        }
      } catch (jwtError) {
        console.warn('Could not decode JWT token:', jwtError);
        // Keep the fallback fullname
      }

      // Get address and company from API response or JWT, with fallback to empty string
      const userAddress = data.address || address || '';
      const userCompany = data.company || company || '';

      // Store authentication data, including isFirstLogin
      const initialUserData = {
        id: data.user_id,
        email: email,
        fullname: fullname,
        type: data.type,
        plan: data.plan || 'free',
        phone: data.phone || phone || '',
        address: userAddress,
        company: userCompany,
        isFirstLogin: data.isFirstLogin
      };

      localStorage.setItem('accessToken', data.token);
      localStorage.setItem('userData', JSON.stringify(initialUserData));
      // default to user account after login
      localStorage.setItem('accountType', 'user');
      localStorage.removeItem('organizationId');
      setAccountType('user');
      setOrganizationId(null);

      setUser(initialUserData);
      setIsAuthenticated(true);

      // Fetch and store subscription plan data right after login
      try {
        const subscriptionPlan = await SubscriptionService.getUserPlan();
        SubscriptionStorage.savePlan(subscriptionPlan);
        
        // Update user plan in userData localStorage and state, preserving all existing fields
        const updatedUserData = {
          ...initialUserData,
          plan: subscriptionPlan.name || subscriptionPlan.type || 'free'
        };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        setUser(updatedUserData);
      } catch (error) {
        console.error('Error fetching subscription plan after login:', error);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    // Clear authentication data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('accountType');
    localStorage.removeItem('organizationId');
    localStorage.removeItem('organizationDetail');
    
    // Clear subscription data
    SubscriptionStorage.clearPlan();
    
    setUser(null);
    setIsAuthenticated(false);
    setOrganizationDetail(null);
  };

  const switchAccount = async (newAccountType: 'user' | 'organization', orgId?: string | null) => {
    let dispatchedOrgId: string | null = orgId || null;
    let dispatchedOrgDetail: any | null = organizationDetail || null;

    try {
      const resp = await authApi.get(`/api/auth/switch-account/${newAccountType}/?orgId=${orgId}`).catch((e) => {
        console.warn('switch-account API failed, falling back to local-only switch', e?.message || e);
        return null;
      });

      if (resp && resp.data) {
        const d: any = resp.data;

        // Set account type
        const canonicalAccountType = newAccountType;
        localStorage.setItem('accountType', canonicalAccountType);
        setAccountType(canonicalAccountType === 'organization' ? 'organization' : 'user');
        const respOrgRoot = d?.organization || null;

        let organizationDetail: any = null;
        let resolvedOrgId: string | null = null;

        if (respOrgRoot) {
          // Case: nested wrapper: { organization: { organization: {...}, access: {...} } }
          if (respOrgRoot.organization && typeof respOrgRoot.organization === 'object') {
            organizationDetail = { ...respOrgRoot.organization };
            // if access/permissions provided alongside wrapper, attach them
            if (respOrgRoot.access) organizationDetail.access = respOrgRoot.access;
            if (respOrgRoot.permissions) organizationDetail.permissions = respOrgRoot.permissions;
          } else {
            // Case: merged shape or plain org object which may already include access/permissions
            organizationDetail = { ...respOrgRoot };
          }
        } else if (orgId) {
          organizationDetail = { id: orgId };
        }

        if (organizationDetail) {
          // Normalize id field
          resolvedOrgId = organizationDetail._id || organizationDetail.id || null;
          dispatchedOrgId = resolvedOrgId || dispatchedOrgId;
          dispatchedOrgDetail = organizationDetail;
          // Persist full organization detail (including access/permissions if present)
          localStorage.setItem('organizationDetail', JSON.stringify(organizationDetail));
          if (resolvedOrgId) localStorage.setItem('organizationId', resolvedOrgId);
          setOrganizationId(resolvedOrgId);
          setOrganizationDetail(organizationDetail);
        } else if (canonicalAccountType === 'user') {
          localStorage.removeItem('organizationDetail');
          localStorage.removeItem('organizationId');
          setOrganizationId(null);
          setOrganizationDetail(null);
        }
        // If no organizationDetail but orgId provided, ensure orgId persisted earlier in fallback branch
      } else {
        // Local-only switch
        localStorage.setItem('accountType', newAccountType);
        setAccountType(newAccountType);
        if (orgId) {
          localStorage.setItem('organizationId', orgId);
          setOrganizationId(orgId);
          dispatchedOrgId = orgId;
          dispatchedOrgDetail = organizationDetail || null;
        } else if (newAccountType === 'user') {
          localStorage.removeItem('organizationId');
          setOrganizationId(null);
          dispatchedOrgId = null;
          dispatchedOrgDetail = null;
        }
      }

      // Notify other parts of the app with resolved org info
      try { window.dispatchEvent(new CustomEvent('account-switched', { detail: { accountType: newAccountType, organizationId: (typeof dispatchedOrgId !== 'undefined' ? dispatchedOrgId : orgId || null), organizationDetail: (typeof dispatchedOrgDetail !== 'undefined' ? dispatchedOrgDetail : null) } })); } catch {}
    } catch (err) {
      console.error('Failed to switch account:', err);
      // best-effort local update
      localStorage.setItem('accountType', newAccountType);
      setAccountType(newAccountType);
      if (orgId) {
        localStorage.setItem('organizationId', orgId);
        setOrganizationId(orgId);
      }
    }
  };

  const signup = async (userData: { fullname: string; email: string; phone: string; address: string; company: string; password: string }) => {
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
    signup,
    accountType,
    organizationId,
    organizationDetail,
    switchAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
