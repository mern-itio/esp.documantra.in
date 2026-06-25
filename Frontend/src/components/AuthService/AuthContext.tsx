import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { API_ENDPOINTS, apiRequest } from '../../services/api';
import { assertSecureApiUrl } from '../../utils/secureApiUrl';
import { authApi } from '../../services/apiHelper';
import { SubscriptionService, SubscriptionStorage } from '../../services/subscriptionService';
import {
  clearAccountContext,
  clearLegacyAuthStorage,
  clearUserProfileSnapshot,
  persistAccountContext,
  persistUserProfileSnapshot,
  setMemoryAccessToken,
  withAuthFetch,
} from '../../utils/authSession';

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
  dismissFirstLogin: () => void;
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
    const v = sessionStorage.getItem('accountType');
    return (v === 'organization' ? 'organization' : 'user');
  });
  const [organizationId, setOrganizationId] = useState<string | null>(() => {
    return sessionStorage.getItem('organizationId') || null;
  });
  const [organizationDetail, setOrganizationDetail] = useState<any | null>(() => {
    try {
      const v = sessionStorage.getItem('organizationDetail');
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  });

  const mapApiUserToState = (u: Record<string, any>): User => ({
    id: String(u.id || u._id || ''),
    email: u.email || '',
    fullname: u.fullname || '',
    type: u.type || 'user',
    plan: u.plan || 'free',
    phone: u.phone || '',
    address: u.address || '',
    company: u.company || '',
    isFirstLogin: u.isFirstLogin,
  });

  const syncUserState = (nextUser: User | null) => {
    setUser(nextUser);
    if (nextUser?.id) {
      persistUserProfileSnapshot({
        id: nextUser.id,
        email: nextUser.email,
        fullname: nextUser.fullname,
        plan: nextUser.plan,
        isFirstLogin: nextUser.isFirstLogin,
      });
    } else {
      clearUserProfileSnapshot();
    }
  };

  const hydrateFromSession = async () => {
    clearLegacyAuthStorage();
    try {
      const res = await fetch(API_ENDPOINTS.AUTH.ME, withAuthFetch({ cache: 'no-store' }));
      if (!res.ok) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }
      const body = await res.json();
      const u = body?.data;
      if (!u?.id && !u?._id) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }
      syncUserState(mapApiUserToState(u));
      setIsAuthenticated(true);
      const storedAccountType = sessionStorage.getItem('accountType');
      setAccountType(storedAccountType === 'organization' ? 'organization' : 'user');
      setOrganizationId(sessionStorage.getItem('organizationId') || null);
      try {
        const storedOrgDetail = sessionStorage.getItem('organizationDetail');
        setOrganizationDetail(storedOrgDetail ? JSON.parse(storedOrgDetail) : null);
      } catch {
        setOrganizationDetail(null);
      }
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    hydrateFromSession().finally(() => setLoading(false));

    const checkSession = () => {
      if (!isAuthenticated || document.visibilityState !== 'visible') return;
      fetch(API_ENDPOINTS.AUTH.ME, withAuthFetch({ cache: 'no-store' })).then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          const isPublicRoute = window.location.pathname.startsWith('/public-sign');
          if (isPublicRoute) return;
          console.warn('Session is invalid or revoked, logging out.');
          window.dispatchEvent(new CustomEvent('app:auth-logout'));
        }
      }).catch(() => {});
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
  }, [isAuthenticated]);

  useEffect(() => {
    const handleGlobalLogout = () => {
      logout();
    };
    window.addEventListener('app:auth-logout', handleGlobalLogout as EventListener);
    return () => {
      window.removeEventListener('app:auth-logout', handleGlobalLogout as EventListener);
    };
  }, []);

  // Re-check session when extension signals auth sync (cookie-based).
  useEffect(() => {
    const handler = () => {
      hydrateFromSession();
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
        syncUserState(updatedUser);
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
    clearLegacyAuthStorage();
    if (data?.token) {
      setMemoryAccessToken(data.token);
    }
    const initialUserData: User = {
      id: String(data.user_id || data.id || ''),
      email: data.email || '',
      fullname: data.fullname || data.email?.split('@')[0] || '',
      type: data.type || 'user',
      plan: data.plan || 'free',
      phone: data.phone || '',
      address: data.address || '',
      company: data.company || '',
      isFirstLogin: data.isFirstLogin,
    };
    persistAccountContext('user');
    localStorage.removeItem('currentSupportTicket');
    setAccountType('user');
    setOrganizationId(null);
    setOrganizationDetail(null);
    syncUserState(initialUserData);
    setIsAuthenticated(true);

    try {
      const subscriptionPlan = await SubscriptionService.getUserPlan();
      SubscriptionStorage.savePlan(subscriptionPlan);
      syncUserState({
        ...initialUserData,
        plan: subscriptionPlan.name || subscriptionPlan.type || 'free',
      });
    } catch (error) {
      console.error('Error fetching subscription plan after verify:', error);
    }
  };

  const login = async (email: string, password: string, recaptchaToken?: string) => {
    try {
      assertSecureApiUrl(API_ENDPOINTS.AUTH.LOGIN, 'Auth API');
      const deviceId = getOrCreateDeviceId();
      const resp = await fetch(API_ENDPOINTS.AUTH.LOGIN, withAuthFetch({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, deviceId, deviceLabel: 'browser', recaptchaToken }),
      }));

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
        if (resp.status === 403 && data?.code === 'TWO_FA_SETUP_REQUIRED') {
          const setupError = new Error(
            data?.message || 'Two-factor authentication is required for your account.'
          );
          setupError.name = 'TwoFaSetupRequiredError';
          (setupError as any).setupPath = data?.setupPath || '/account/security';
          throw setupError;
        }
        throw new Error(data?.message || 'Login failed');
      }

      await applyLoginPayload({ ...data, email });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const googleLogin = async (credential: string, options?: { referrerUserId?: string }) => {
    try {
      const deviceId = getOrCreateDeviceId();
      const ref = options?.referrerUserId?.trim();
      const resp = await fetch(API_ENDPOINTS.AUTH.GOOGLE_LOGIN, withAuthFetch({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: credential,
          deviceId,
          deviceLabel: 'browser',
          ...(ref ? { ref } : {}),
        }),
      }));

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
    fetch(API_ENDPOINTS.AUTH.LOGOUT, withAuthFetch({ method: 'POST' })).catch(() => {});

    clearLegacyAuthStorage();
    clearAccountContext();
    localStorage.removeItem('currentSupportTicket');

    SubscriptionStorage.clearPlan();

    syncUserState(null);
    setIsAuthenticated(false);
    setOrganizationDetail(null);
    setAccountType('user');
    setOrganizationId(null);
  };

  const dismissFirstLogin = () => {
    if (!user) return;
    syncUserState({ ...user, isFirstLogin: false });
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
        const canonicalAccountType = newAccountType;
        setAccountType(canonicalAccountType === 'organization' ? 'organization' : 'user');
        const respOrgRoot = d?.organization || null;

        let nextOrganizationDetail: any = null;
        let resolvedOrgId: string | null = null;

        if (respOrgRoot) {
          if (respOrgRoot.organization && typeof respOrgRoot.organization === 'object') {
            nextOrganizationDetail = { ...respOrgRoot.organization };
            if (respOrgRoot.access) nextOrganizationDetail.access = respOrgRoot.access;
            if (respOrgRoot.permissions) nextOrganizationDetail.permissions = respOrgRoot.permissions;
          } else {
            nextOrganizationDetail = { ...respOrgRoot };
          }
        } else if (orgId) {
          nextOrganizationDetail = { id: orgId };
        }

        if (nextOrganizationDetail) {
          resolvedOrgId = nextOrganizationDetail._id || nextOrganizationDetail.id || null;
          dispatchedOrgId = resolvedOrgId || dispatchedOrgId;
          dispatchedOrgDetail = nextOrganizationDetail;
          persistAccountContext(canonicalAccountType, resolvedOrgId, nextOrganizationDetail);
          setOrganizationId(resolvedOrgId);
          setOrganizationDetail(nextOrganizationDetail);
        } else if (canonicalAccountType === 'user') {
          persistAccountContext('user');
          setOrganizationId(null);
          setOrganizationDetail(null);
        }
      } else {
        persistAccountContext(newAccountType, orgId || null, organizationDetail || null);
        setAccountType(newAccountType);
        if (orgId) {
          setOrganizationId(orgId);
          dispatchedOrgId = orgId;
          dispatchedOrgDetail = organizationDetail || null;
        } else if (newAccountType === 'user') {
          setOrganizationId(null);
          dispatchedOrgId = null;
          dispatchedOrgDetail = null;
        }
      }

      try {
        window.dispatchEvent(new CustomEvent('account-switched', {
          detail: {
            accountType: newAccountType,
            organizationId: dispatchedOrgId,
            organizationDetail: dispatchedOrgDetail,
          },
        }));
      } catch {}
    } catch (err) {
      console.error('Failed to switch account:', err);
      persistAccountContext(newAccountType, orgId || null, organizationDetail || null);
      setAccountType(newAccountType);
      if (orgId) {
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
    if (data?.user_id || data?.token) {
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
    if (data?.user_id || data?.token) {
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
    switchAccount,
    dismissFirstLogin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
