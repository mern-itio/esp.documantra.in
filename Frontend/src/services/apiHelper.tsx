import axios from 'axios';
import type { AxiosInstance } from 'axios';

const createApiInstance = (baseURL: string, serviceName: string, tokenKey: string = 'accessToken'): AxiosInstance => {

  const instance = axios.create({
    baseURL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' }
  });

  // Request Interceptor
  instance.interceptors.request.use(async (config) => {
    // Try multiple localStorage keys to maximize compatibility across auth flows
    let token: string | null = null;
    try {
      const keys = [tokenKey, 'adminToken', 'accessToken', 'userToken', 'token'];
      for (const k of keys) {
        const v = localStorage.getItem(k);
        if (v) { token = v; break; }
      }
    } catch {}
    if (!token) {
      // Try to read from userData payload if present
      try {
        const raw = localStorage.getItem('userData');
        if (raw) {
          const parsed = JSON.parse(raw);
          token = parsed?.accessToken || parsed?.token || parsed?.jwt || null;
        }
      } catch {}
    }
    if (token) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }

    // Remove Content-Type header for FormData to let browser set it with boundary
    if (config.data instanceof FormData && config.headers) {
      delete (config.headers as any)['Content-Type'];
    }
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
        const isUpgrade = !!error.response?.data?.upgrade;
        try { window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: msg, type: 'error', cta: isUpgrade ? { label: 'View Pricing', href: '/#pricing' } : undefined } })); } catch {}
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Create service-specific API instances
export const authApi = createApiInstance(
  import.meta.env.VITE_API_BASE_URL || 'http://165.22.215.73:2101',
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

export const adminServiceApi = createApiInstance(
  import.meta.env.VITE_ADMIN_SERVICE_URL || 'http://localhost:3100',
  'Admin-Service'
);

export const subscriptionApi = createApiInstance(
  import.meta.env.VITE_SUBSCRIPTION_SERVICE_URL || 'http://localhost:2110',
  'Subscription-Service'
);
export const adminApi = createApiInstance(
  import.meta.env.VITE_ADMIN_SERVICE_URL || 'http://localhost:3100',
  'Admin-Service',
  'adminToken'
);