import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { SubscriptionStorage } from './subscriptionService';

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
  import.meta.env.VITE_DOCUMENT_SERVICE_URL || 'http://165.22.215.73:2102',
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

// Centralized credit gating for PDF conversions
pdfApi.interceptors.request.use((config) => {
  try {
    const method = (config.method || 'get').toLowerCase();
    const url = String(config.url || '');
    const isConversion = method === 'post' && (/^\/pdf\//.test(url) || /^\/convert\//.test(url));
    if (!isConversion) return config;

    // Resolve current tool object id from cached slug->_id map; keep URLs clean
    let toolObjId: string | null = null;
    try {
      const path = window.location.pathname; // e.g., /pdf-tools/pdf-to-excel
      const slug = path.startsWith('/pdf-tools/') ? path.replace('/pdf-tools/', '').split('/')[0] : null;
      if (slug) {
        const raw = localStorage.getItem('toolCatalogIdMap');
        if (raw) {
          const map = JSON.parse(raw || '{}');
          toolObjId = map[slug] || null;
        }
      }
    } catch {}

    if (!toolObjId) return config; // if unknown, allow

    const plan: any = SubscriptionStorage.getPlan();
    const creditsBalance: number = plan?.creditsBalance ?? 0;
    const toolCosts: Array<{ toolId: string; credits: number }> = plan?.toolCosts ?? [];
    const required = toolCosts.find(tc => tc.toolId === toolObjId)?.credits ?? 0;

    if (required > 0 && creditsBalance < required) {
      try { window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: `Credit exhausted for this tool. Requires ${required}, you have ${creditsBalance}.`, type: 'error', cta: { label: 'View Pricing', href: '/#pricing' } } })); } catch {}
      try { window.dispatchEvent(new CustomEvent('app:open-plans-modal')); } catch {}
      const rejection: any = new Error('Insufficient credits');
      rejection.response = { status: 402, data: { message: 'Insufficient credits', required, creditsBalance } };
      return Promise.reject(rejection);
    }
  } catch {}
  return config;
});

// After successful conversion requests, record consumption in subscription service
pdfApi.interceptors.response.use((response) => {
  try {
    const method = (response.config.method || 'get').toLowerCase();
    const url = String(response.config.url || '');
    const isConversion = method === 'post' && (/^\/pdf\//.test(url) || /^\/convert\//.test(url) || /^\/smart-conversion\//.test(url));
    if (!isConversion) return response;

    // Resolve tool object id from slug map
    let toolObjId: string | null = null;
    const path = window.location.pathname;
    const slug = path.startsWith('/pdf-tools/') ? path.replace('/pdf-tools/', '').split('/')[0] : null;
    if (slug) {
      const raw = localStorage.getItem('toolCatalogIdMap');
      if (raw) {
        const map = JSON.parse(raw || '{}');
        toolObjId = map[slug] || null;
      }
    }

    // Fire and forget; do not block UI
    if (toolObjId) {
      try { subscriptionApi.post('/usage/consume', { toolId: toolObjId }); } catch {}

      // Update local credits balance immediately
      try {
        const plan: any = SubscriptionStorage.getPlan();
        const toolCosts: Array<{ toolId: string; credits: number }> = plan?.toolCosts || [];
        const required = toolCosts.find(tc => String(tc.toolId) === String(toolObjId))?.credits || 0;
        if (required > 0) {
          const newBalance = Math.max(0, (plan?.creditsBalance || 0) - required);
          SubscriptionStorage.updateCredits(newBalance);
          // Dispatch event to notify header and other components to refresh credits
          window.dispatchEvent(new CustomEvent('credits-updated'));
        }
      } catch {}
    }
  } catch {}
  return response;
}, (error) => Promise.reject(error));

// Centralized credit gating for document uploads
documentApi.interceptors.request.use((config) => {
  try {
    const method = (config.method || 'get').toLowerCase();
    const url = String(config.url || '');
    const isDocumentUpload = method === 'post' && /\/upload$/.test(url);
    if (!isDocumentUpload) return config;

    const plan: any = SubscriptionStorage.getPlan();
    const creditsBalance: number = plan?.creditsBalance ?? 0;
    const documentCosts = plan?.documentCosts;
    const required = documentCosts?.credits ?? 0;

    if (required > 0 && creditsBalance < required) {
      try { 
        window.dispatchEvent(new CustomEvent('app:toast', { 
          detail: { 
            message: `Insufficient credits for document upload. Requires ${required}, you have ${creditsBalance}.`, 
            type: 'error', 
            cta: { 
              label: 'View Plan', 
              action: () => {
                window.dispatchEvent(new CustomEvent('app:open-plans-modal'));
              }
            } 
          } 
        })); 
      } catch {}
      const rejection: any = new Error('Insufficient credits');
      rejection.response = { status: 402, data: { message: 'Insufficient credits', required, creditsBalance } };
      return Promise.reject(rejection);
    }
  } catch {}
  return config;
});

// After successful document upload, consume credits
documentApi.interceptors.response.use((response) => {
  try {
    const method = (response.config.method || 'get').toLowerCase();
    const url = String(response.config.url || '');
    const isDocumentUpload = method === 'post' && /\/upload$/.test(url);
    if (!isDocumentUpload) return response;

    // Get the plan to determine the cost
    const plan: any = SubscriptionStorage.getPlan();
    const documentCosts = plan?.documentCosts;
    const required = documentCosts?.credits ?? 0;

    // Fire and forget; do not block UI
    if (required > 0) {
      try { 
        subscriptionApi.post('/usage/consume', { action: 'document:upload', credits: required }); 
        
        // Update local balance
        if (plan) {
          const newBalance = (plan.creditsBalance || 0) - required;
          SubscriptionStorage.updateCredits(newBalance);
          // Dispatch event to notify header and other components to refresh credits
          window.dispatchEvent(new CustomEvent('credits-updated'));
        }
      } catch {}
    }
  } catch {}
  return response;
}, (error) => Promise.reject(error));

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

export const organizationApi = createApiInstance(
  import.meta.env.VITE_ORGANIZATION_SERVICE_URL || 'http://localhost:2111',
  'Organization-Service'
);