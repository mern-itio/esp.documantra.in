import axios from 'axios';
import type { AxiosInstance } from 'axios';

// Guest free-plan cache (frontend UX only; server is source of truth)
type FreePlanCache = { limitType: 'number' | 'unlimited'; limit: number | null; fetchedAt: number };
let freePlanCache: FreePlanCache = { limitType: 'number', limit: 10, fetchedAt: 0 };
const FREE_PLAN_TTL_MS = 5 * 60 * 1000;

const getFreePlanLimit = async (): Promise<FreePlanCache> => {
  const now = Date.now();
  if (now - freePlanCache.fetchedAt < FREE_PLAN_TTL_MS) return freePlanCache;
  const base = (import.meta as any).env?.VITE_SUBSCRIPTION_SERVICE_URL || 'http://localhost:2110';
  try {
    const res = await fetch(`${base}/public/plans/free-plan`);
    if (!res.ok) throw new Error('free-plan fetch failed');
    const data = await res.json();
    const limitType = (data?.limitType as any) === 'unlimited' ? 'unlimited' : 'number';
    const limit = limitType === 'number' ? (typeof data?.limit === 'number' ? data.limit : 10) : null;
    freePlanCache = { limitType, limit, fetchedAt: now };
  } catch {
    freePlanCache = { limitType: 'number', limit: 10, fetchedAt: now };
  }
  return freePlanCache;
};

// Guest operation counter (24h rolling window)
const getGuestOps = () => {
  try {
    const raw = localStorage.getItem('guest_ops');
    if (!raw) return { since: Date.now(), count: 0 };
    const parsed = JSON.parse(raw);
    const since = typeof parsed.since === 'number' ? parsed.since : Date.now();
    const count = typeof parsed.count === 'number' ? parsed.count : 0;
    if (Date.now() - since > 24 * 60 * 60 * 1000) return { since: Date.now(), count: 0 };
    return { since, count };
  } catch {
    return { since: Date.now(), count: 0 };
  }
};
const setGuestOps = (since: number, count: number) => {
  try { localStorage.setItem('guest_ops', JSON.stringify({ since, count })); } catch {}
};

const createApiInstance = (baseURL: string, serviceName: string): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' }
  });

  // Request Interceptor
  instance.interceptors.request.use(async (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }

    // Remove Content-Type header for FormData to let browser set it with boundary
    if (config.data instanceof FormData && config.headers) {
      delete (config.headers as any)['Content-Type'];
    }

    // Guest gating for PDF service operations before sending
    const isGuest = !token;
    const isPdfService = serviceName === 'PDF';
    const url = (config.url || '').toString();
    const method = (config.method || 'get').toLowerCase();
    const looksLikeOperation = url.startsWith('/pdf') || url.startsWith('/convert') || url.startsWith('/pdf-') || url.startsWith('/advanced-editor');
    const isMutating = method === 'post' || method === 'put' || method === 'patch';
    if (isGuest && isPdfService && looksLikeOperation && isMutating) {
      const free = await getFreePlanLimit();
      if (free.limitType === 'number') {
        const { since, count } = getGuestOps();
        if (count >= (free.limit ?? 10)) {
          const error: any = new Error('Free plan limit reached');
          error.response = { status: 429, data: { message: `Free plan limit reached. ${(free.limit ?? 10)} operations allowed per 24 hours for guests. Please log in to continue.` } };
          throw error;
        }
        setGuestOps(since, count + 1);
      }
    }

    // console.log(`${serviceName} API Request:`, { method: config.method?.toUpperCase(), url: config.url, fullUrl: `${config.baseURL}${config.url}` });
    return config;
  });

  // Response Interceptor
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error(`${serviceName} API Error:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        fullUrl: `${error.config?.baseURL}${error.config?.url}`
      });
      // Surface guest free-plan limit exceeded to users with toast
      if (error.response?.status === 429 && typeof window !== 'undefined') {
        const msg = error.response?.data?.message || 'Free plan limit reached. Please log in to continue.';
        try { window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: msg, type: 'error' } })); } catch {}
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Create service-specific API instances
export const authApi = createApiInstance(
  import.meta.env.VITE_AUTH_BASE_URL || 'http://165.22.215.73:2101',
  'Auth'
);

export const documentApi = createApiInstance(
  import.meta.env.VITE_DOCUMENT_BASE_URL || 'http://165.22.215.73:2102',
  'Document'
);

export const eSignApi = createApiInstance(
  import.meta.env.VITE_ESIGN_SERVICE_URL || 'http://165.22.215.73:2103',
  'E-Sign'
);

export const pdfApi = createApiInstance(
  import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104',
  'PDF'
);

export const apiServiceApi = createApiInstance(
  import.meta.env.VITE_API_SERVICE_URL || 'http://165.22.215.73:2105',
  'Api-Serivce'
);

export const templateServiceApi = createApiInstance(
  import.meta.env.VITE_TEMPLATE_SERVICE_URL || 'http://165.22.215.73:2106',
  'Template-Serivce'
);

export const subscriptionApi = createApiInstance(
  import.meta.env.VITE_SUBSCRIPTION_SERVICE_URL || 'http://localhost:2110',
  'Subscription-Service'
);