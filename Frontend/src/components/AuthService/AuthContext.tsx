import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { API_ENDPOINTS, apiRequest } from '../../services/api';
import { authApi } from '../../services/apiHelper';
import { SubscriptionService, SubscriptionStorage } from '../../services/subscriptionService';

/** Gateways may wrap payloads as `{ data: { token, ... } }` — normalize for signup verify. */
function unwrapAuthJson(raw: unknown): Record<string, any> {
  if (!raw || typeof raw !== 'object') return raw as Record<string, any>;
  const o = raw as Record<string, any>;
  if (o.data && typeof o.data === 'object' && (o.data.token || o.data.user_id)) {
    return { ...o, ...o.data };
  }
  return o;
}

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
  login: (email: string, password: string, recaptchaToken?: string) => Promise<void>;
  googleLogin: (credential: string, options?: { referrerUserId?: string }) => Promise<void>;
  logout: () => void;
  signup: (userData: { fullname: string; email: string; phone: string; address: string; company: string; password: string; recaptchaToken?: string; referrerUserId?: string }) => Promise<{ signupToken: string }>;
  sendSignupEmailOtp: (signupToken: string) => Promise<{ emailVerified: boolean; phoneVerified: boolean; canSendPhoneOtp: boolean }>;
  verifySignupEmailOtp: (signupToken: string, emailOtp: string) => Promise<{ emailVerified: boolean; phoneVerified: boolean; canSendPhoneOtp: boolean; loggedIn: boolean }>;
  sendSignupPhoneOtp: (signupToken: string) => Promise<{ emailVerified: boolean; phoneVerified: boolean; canSendPhoneOtp: boolean }>;
  verifySignupPhoneOtp: (signupToken: string, phoneOtp: string) => Promise<{ emailVerified: boolean; phoneVerified: boolean; canSendPhoneOtp: boolean; loggedIn: boolean }>;
  verifyTwoFaLogin: (twoFaToken: string, otp: string) => Promise<void>;
  getTwoFaRecoveryQuestions: (twoFaToken: string) => Promise<{ questions: string[]; emailChoices: Array<{ key: 'primary' | 'recovery'; label: string; masked: string }> }>;
  verifyTwoFaRecoveryAnswer: (twoFaToken: string, question: string, answer: string) => Promise<{ verified: boolean; question: string }>;
  verifyTwoFaRecoveryAnswers: (
    twoFaToken: string,
    answers: Array<{ question: string; answer: string }>,
    destination: 'primary' | 'recovery',
    options?: { verifyOnly?: boolean }
  ) => Promise<{ recoveryToken: string; destinationMasked: string; verified?: boolean }>;
  verifyTwoFaRecoveryOtp: (recoveryToken: string, otp: string) => Promise<void>;
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

  // Helper to hydrate auth state from localStorage (used on mount and when extension syncs auth).
  const hydrateFromLocalStorage = () => {
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

        // Verify session in background
       fetch(API_ENDPOINTS.AUTH.STATUS.replace('/status', '/me'), {
  headers: { 'Authorization': `Bearer ${token}` },
  cache: 'no-store'
}).then(async (res) => {

  if (res.status === 401 || res.status === 403) {

    const isPublicRoute =
      window.location.pathname.startsWith('/public-sign');

    if (isPublicRoute) return;

    console.warn('Session is invalid or revoked, logging out.');

    window.dispatchEvent(
      new CustomEvent('app:auth-logout')
    );
  }

}).catch(() => {});

      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userData');
      }
    }
  };

  // Check for existing authentication on component mount, window focus, and periodically
  useEffect(() => {
    hydrateFromLocalStorage();
    setLoading(false);

    const checkSession = () => {
      const token = localStorage.getItem('accessToken');
      if (token && document.visibilityState === 'visible') {
  fetch(API_ENDPOINTS.AUTH.STATUS.replace('/status', '/me'), {
    headers: { 'Authorization': `Bearer ${token}` },
    cache: 'no-store'
  }).then(async (res) => {

    if (res.status === 401 || res.status === 403) {

      const isPublicRoute =
        window.location.pathname.startsWith('/public-sign');

      if (isPublicRoute) return;

      console.warn('Session is invalid or revoked, logging out.');

      window.dispatchEvent(
        new CustomEvent('app:auth-logout')
      );
    }

  }).catch(() => {});
}
    };

    // Check on focus and visibility change
    window.addEventListener('visibilitychange', checkSession);
    window.addEventListener('focus', checkSession);

    // Also poll every 15 seconds to catch revocations even if the user is just staring at the screen
    const intervalId = setInterval(checkSession, 15000);

    return () => {
      window.removeEventListener('visibilitychange', checkSession);
      window.removeEventListener('focus', checkSession);
      clearInterval(intervalId);
    };
  }, []);

  // Listen for global auth logout events (e.g. from 401 interceptors or session revocation)
  useEffect(() => {
    const handleGlobalLogout = () => {
      logout();
    };
    window.addEventListener('app:auth-logout', handleGlobalLogout as EventListener);
    return () => {
      window.removeEventListener('app:auth-logout', handleGlobalLogout as EventListener);
    };
  }, []);

  // Also hydrate again when the extension syncs auth into localStorage.
  useEffect(() => {
    const handler = () => {
      hydrateFromLocalStorage();
    };
    window.addEventListener('dns-extension-auth-synced', handler as EventListener);
    return () => {
      window.removeEventListener('dns-extension-auth-synced', handler as EventListener);
    };
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

  class VerificationRequiredError extends Error {
    signupToken?: string;
    step?: 'email' | 'phone';
    emailVerified?: boolean;
    phoneVerified?: boolean;
    canSendPhoneOtp?: boolean;
    constructor(
      message: string,
      signupToken?: string,
      step?: 'email' | 'phone',
      emailVerified?: boolean,
      phoneVerified?: boolean,
      canSendPhoneOtp?: boolean
    ) {
      super(message);
      this.name = 'VerificationRequiredError';
      this.signupToken = signupToken;
      this.step = step;
      this.emailVerified = emailVerified;
      this.phoneVerified = phoneVerified;
      this.canSendPhoneOtp = canSendPhoneOtp;
    }
  }

  class TwoFaRequiredError extends Error {
    twoFaToken?: string;
    method?: 'email' | 'sms' | 'authenticator';
    recoveryAvailable?: boolean;
    constructor(message: string, twoFaToken?: string, method?: 'email' | 'sms' | 'authenticator', recoveryAvailable?: boolean) {
      super(message);
      this.name = 'TwoFaRequiredError';
      this.twoFaToken = twoFaToken;
      this.method = method;
      this.recoveryAvailable = recoveryAvailable;
    }
  }

  const getOrCreateDeviceId = () => {
    try {
      const existing = localStorage.getItem('deviceId');
      if (existing) return existing;
      const id = (crypto as any)?.randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem('deviceId', id);
      return id;
    } catch {
      return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
  };

  const applyLoginPayload = async (data: any) => {
    let fullname = '';
    let phone = data.phone || '';
    let address = '';
    let company = '';
    let email = '';
    try {
      const token = data.token;
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        fullname = payload.data?.fullname || payload.fullname || '';
        phone = payload.data?.phone || payload.phone || phone;
        address = payload.data?.address || payload.address || '';
        company = payload.data?.company || payload.company || '';
        email = payload.data?.email || payload.email || '';
      }
    } catch (jwtError) {
      console.warn('Could not decode JWT token:', jwtError);
    }
    const initialUserData = {
      id: data.user_id,
      email: data.email || email || '',
      fullname,
      type: data.type || 'user',
      plan: data.plan || 'free',
      phone,
      address: data.address || address || '',
      company: data.company || company || '',
      isFirstLogin: data.isFirstLogin
    };
    localStorage.setItem('accessToken', data.token);
    localStorage.setItem('userData', JSON.stringify(initialUserData));
    localStorage.setItem('accountType', 'user');
    localStorage.removeItem('organizationId');
    localStorage.removeItem('currentSupportTicket');
    setAccountType('user');
    setOrganizationId(null);
    setUser(initialUserData);
    setIsAuthenticated(true);

    try {
      const subscriptionPlan = await SubscriptionService.getUserPlan();
      SubscriptionStorage.savePlan(subscriptionPlan);
      const updatedUserData = { ...initialUserData, plan: subscriptionPlan.name || subscriptionPlan.type || 'free' };
      localStorage.setItem('userData', JSON.stringify(updatedUserData));
      setUser(updatedUserData);
    } catch (error) {
      console.error('Error fetching subscription plan after verify:', error);
    }
  };

  const login = async (email: string, password: string, recaptchaToken?: string) => {
    try {
      const deviceId = getOrCreateDeviceId();
      const resp = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, deviceId, deviceLabel: 'browser', recaptchaToken }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        if (resp.status === 403 && data?.code === 'VERIFICATION_REQUIRED') {
          throw new VerificationRequiredError(
            data?.message || 'Verification required',
            data?.signupToken,
            data?.step,
            data?.emailVerified,
            data?.phoneVerified,
            data?.canSendPhoneOtp
          );
        }
        if (resp.status === 403 && data?.code === 'TWO_FA_REQUIRED') {
          throw new TwoFaRequiredError(
            data?.message || 'Two-factor authentication required',
            data?.twoFaToken,
            data?.method,
            !!data?.recoveryAvailable
          );
        }
        throw new Error(data?.message || 'Login failed');
      }
      
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
      localStorage.removeItem('currentSupportTicket');
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

  const googleLogin = async (credential: string, options?: { referrerUserId?: string }) => {
    try {
      const deviceId = getOrCreateDeviceId();
      const ref = options?.referrerUserId?.trim();
      const resp = await fetch(API_ENDPOINTS.AUTH.GOOGLE_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: credential,
          deviceId,
          deviceLabel: 'browser',
          ...(ref ? { ref } : {}),
        }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data?.message || 'Google Login failed');
      }

      await applyLoginPayload({ ...data, token: data.token, user_id: data.user_id, email: data.email || '' });
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const verifyTwoFaLogin = async (twoFaToken: string, otp: string) => {
    const deviceId = getOrCreateDeviceId();
    const data = await apiRequest(API_ENDPOINTS.AUTH.VERIFY_2FA_LOGIN, {
      method: 'POST',
      body: JSON.stringify({ twoFaToken, otp: otp.trim(), deviceId, deviceLabel: 'browser' }),
    });
    await applyLoginPayload(data);
  };

  const getTwoFaRecoveryQuestions = async (twoFaToken: string) => {
    const data = await apiRequest(API_ENDPOINTS.AUTH.GET_2FA_RECOVERY_QUESTIONS, {
      method: 'POST',
      body: JSON.stringify({ twoFaToken }),
    });
    return {
      questions: Array.isArray(data?.questions) ? data.questions : [],
      emailChoices: Array.isArray(data?.emailChoices) ? data.emailChoices : [],
    };
  };

  const verifyTwoFaRecoveryAnswer = async (twoFaToken: string, question: string, answer: string) => {
    try {
      const resp = await authApi.post(API_ENDPOINTS.AUTH.VERIFY_2FA_RECOVERY_ANSWER, {
        twoFaToken,
        question,
        answer,
      });
      return {
        verified: !!resp?.data?.verified,
        question: String(resp?.data?.question || question),
      };
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message || 'Incorrect answer.'
      const wrongQuestions = Array.isArray(err?.response?.data?.wrongQuestions)
        ? err.response.data.wrongQuestions
        : [question]
      const wrapped: any = new Error(apiMessage)
      wrapped.wrongQuestions = wrongQuestions
      throw wrapped
    }
  };

  const verifyTwoFaRecoveryAnswers = async (
    twoFaToken: string,
    answers: Array<{ question: string; answer: string }>,
    destination: 'primary' | 'recovery',
    options?: { verifyOnly?: boolean }
  ) => {
    try {
      const resp = await authApi.post(API_ENDPOINTS.AUTH.VERIFY_2FA_RECOVERY_ANSWERS, {
        twoFaToken,
        answers,
        destination,
        verifyOnly: !!options?.verifyOnly,
      });
      const data = resp?.data || {};
      return {
        recoveryToken: String(data?.recoveryToken || ''),
        destinationMasked: String(data?.destinationMasked || ''),
        verified: !!data?.verified,
      };
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message || 'Could not verify security answers.'
      const wrongQuestions = Array.isArray(err?.response?.data?.wrongQuestions)
        ? err.response.data.wrongQuestions
        : []
      const wrapped: any = new Error(apiMessage)
      wrapped.wrongQuestions = wrongQuestions
      throw wrapped
    }
  };

  const verifyTwoFaRecoveryOtp = async (recoveryToken: string, otp: string) => {
    const deviceId = getOrCreateDeviceId();
    const data = await apiRequest(API_ENDPOINTS.AUTH.VERIFY_2FA_RECOVERY_OTP, {
      method: 'POST',
      body: JSON.stringify({ recoveryToken, otp: otp.trim(), deviceId, deviceLabel: 'browser' }),
    });
    await applyLoginPayload(data);
  };

  const logout = () => {
    // Clear authentication data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('accountType');
    localStorage.removeItem('organizationId');
    localStorage.removeItem('organizationDetail');
    localStorage.removeItem('currentSupportTicket');
    
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

  const signup = async (userData: { fullname: string; email: string; phone: string; address: string; company: string; password: string; recaptchaToken?: string; referrerUserId?: string }) => {
    const data = await apiRequest(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (!data.signupToken) throw new Error('Signup succeeded but no verification token received');
    return { signupToken: data.signupToken };
  };

  const sendSignupEmailOtp = async (signupToken: string) => {
    const data = await apiRequest(API_ENDPOINTS.AUTH.SIGNUP_SEND_EMAIL_OTP, {
      method: 'POST',
      body: JSON.stringify({ signupToken }),
    });
    return {
      emailVerified: !!data.emailVerified,
      phoneVerified: !!data.phoneVerified,
      canSendPhoneOtp: !!data.canSendPhoneOtp,
    };
  };

  const verifySignupEmailOtp = async (signupToken: string, emailOtp: string) => {
    const raw = await apiRequest(API_ENDPOINTS.AUTH.SIGNUP_VERIFY_EMAIL_OTP, {
      method: 'POST',
      body: JSON.stringify({ signupToken, emailOtp: emailOtp.trim() }),
    });
    const data = unwrapAuthJson(raw);
    if (data?.token) {
      await applyLoginPayload(data);
      return {
        emailVerified: true,
        phoneVerified: !!data.phoneVerified,
        canSendPhoneOtp: !!data.canSendPhoneOtp,
        loggedIn: true,
      };
    }
    return {
      emailVerified: !!data.emailVerified,
      phoneVerified: !!data.phoneVerified,
      canSendPhoneOtp: !!data.canSendPhoneOtp,
      loggedIn: false
    };
  };

  const sendSignupPhoneOtp = async (signupToken: string) => {
    const data = await apiRequest(API_ENDPOINTS.AUTH.SIGNUP_SEND_PHONE_OTP, {
      method: 'POST',
      body: JSON.stringify({ signupToken }),
    });
    return {
      emailVerified: !!data.emailVerified,
      phoneVerified: !!data.phoneVerified,
      canSendPhoneOtp: !!data.canSendPhoneOtp,
    };
  };

  const verifySignupPhoneOtp = async (signupToken: string, phoneOtp: string) => {
    const raw = await apiRequest(API_ENDPOINTS.AUTH.SIGNUP_VERIFY_PHONE_OTP, {
      method: 'POST',
      body: JSON.stringify({ signupToken, phoneOtp: phoneOtp.trim() }),
    });
    const data = unwrapAuthJson(raw);
    if (data?.token) {
      await applyLoginPayload(data);
      return {
        emailVerified: true,
        phoneVerified: !!data.phoneVerified,
        canSendPhoneOtp: !!data.canSendPhoneOtp,
        loggedIn: true,
      };
    }
    return {
      emailVerified: !!data.emailVerified,
      phoneVerified: !!data.phoneVerified,
      canSendPhoneOtp: !!data.canSendPhoneOtp,
      loggedIn: false
    };
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    login,
    googleLogin,
    logout,
    signup,
    sendSignupEmailOtp,
    verifySignupEmailOtp,
    sendSignupPhoneOtp,
    verifySignupPhoneOtp,
    verifyTwoFaLogin,
    getTwoFaRecoveryQuestions,
    verifyTwoFaRecoveryAnswer,
    verifyTwoFaRecoveryAnswers,
    verifyTwoFaRecoveryOtp,
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
