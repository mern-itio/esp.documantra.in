import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { toolSettingsService } from './toolSettingsService';

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


// Authenticated user plan & counters (client-side UX guard)
const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('userData');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
};
const getUserOps = (userId: string) => {
  try {
    const raw = localStorage.getItem(`user_ops_${userId}`);
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
const setUserOps = (userId: string, since: number, count: number) => {
  try { localStorage.setItem(`user_ops_${userId}`, JSON.stringify({ since, count })); } catch {}
};

// Helper function to extract tool ID from PDF service URL
const extractToolIdFromUrl = (url: string): string | null => {
  // Common PDF tool URL patterns
  const patterns = [
    /\/pdf-tools\/([^\/\?]+)/,  // /pdf-tools/tool-name
    /\/pdf\/([^\/\?]+)/,        // /pdf/tool-name
    /\/pdf-([^\/\?]+)/,         // /pdf-toolname
    /\/convert\/([^\/\?]+)/,    // /convert/tool-name
    /\/advanced-editor\/([^\/\?]+)/, // /advanced-editor/tool-name
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const extractedId = match[1];
      // Fast path: if already a canonical tool id from mockPDFTools
      const canonicalIds = new Set([
        'pdf-to-word','word-to-pdf','pdf-to-excel','excel-to-pdf','pdf-to-powerpoint','powerpoint-to-pdf','pdf-to-img','img-to-pdf','pdf-to-text','text-to-pdf','pdf-to-html','html-to-pdf','pdf-to-epub','batch-conversion','smart-conversion',
        'pdf-editor','add-text','add-images','add-shapes','highlight-text','add-comments','draw-annotations','redact-content','add-stamps','find-replace','spell-check','edit-metadata',
        'merge-pdf','split-pdf','extract-pdf','delete-pdf','reorder-pdf','rotate-pdf','crop-pdf','insert-pdf','add-page-numbers','add-header-footer',
        'add-password','remove-password','digital-signature','set-permissions','add-watermark','remove-metadata','document-tracking',
        'compress-pdf','optimize-image','optimize-font','remove-unused-objects','linearize-pdf','color-optimization','quality-analysis','batch-optimization',
        'ocr','make-searchable','extract-tables','handwriting-recognition',
        'create-form','fill-form','form-recognition','calculate-fields',
        'pdf-info','pdf-validator','pdf-compare','pdf-repair','pdf-bookmarks','pdf-statistics'
      ]);
      if (canonicalIds.has(extractedId)) {
        return extractedId;
      }

      // Map common route patterns to tool IDs
      const routeToToolId: Record<string, string> = {
        // Word variants
        'to-doc': 'pdf-to-word',
        'to-docx': 'pdf-to-word',
        'to-word': 'pdf-to-word',
        'pdf-to-doc': 'pdf-to-word',
        'pdf-to-docx': 'pdf-to-word',
        // Word to PDF variants
        'doc-to-pdf': 'word-to-pdf',
        'docx-to-pdf': 'word-to-pdf',
        'word-to-pdf': 'word-to-pdf',
        // Excel/JPG/Text/PPT quick aliases
        'to-excel': 'pdf-to-excel',
        'to-jpg': 'pdf-to-jpg',
        'to-text': 'pdf-to-text',
        'to-ppt': 'pdf-to-powerpoint',
        // Common short routes to canonical ids
        'compress': 'compress-pdf',
        'merge': 'merge-pdf',
        'split': 'split-pdf',
        'delete-pages': 'delete-pdf',
        'extract-pages': 'extract-pdf',
        'protect-pdf': 'add-password',
        'unlock-pdf': 'remove-password',
        'watermark-pdf': 'add-watermark',
      };
      
      return routeToToolId[extractedId] || extractedId;
    }
  }
  
  return null;
};



const createApiInstance = (baseURL: string, serviceName: string, tokenKey: string = 'accessToken'): AxiosInstance => {

  const instance = axios.create({
    baseURL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' }
  });

  // Request Interceptor
  instance.interceptors.request.use(async (config) => {
    const token = localStorage.getItem(tokenKey);
    if (token) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }

    // Remove Content-Type header for FormData to let browser set it with boundary
    if (config.data instanceof FormData && config.headers) {
      delete (config.headers as any)['Content-Type'];
    }

    // Tool-specific access control for PDF service operations
    const isGuest = !token;
    const isPdfService = serviceName === 'PDF';
    const url = (config.url || '').toString();
    const method = (config.method || 'get').toLowerCase();
    const isMutating = method === 'post' || method === 'put' || method === 'patch';
    
    if (isPdfService && isMutating) {
      // Extract tool ID from URL
      const toolId = extractToolIdFromUrl(url);
      console.log(`[Frontend API] Extracted tool ID from URL ${url}:`, toolId);
      
      if (toolId) {
        // Get tool-specific settings
        const toolSettings = await toolSettingsService.getToolSettings(toolId);
        
        if (toolSettings && toolSettings.features && toolSettings.accessControl) {
          console.log(`[Frontend API] Tool settings found for ${toolId}:`, toolSettings.accessControl.allowedFor);
          const storedUser: any = getStoredUser();
          const userPlan = (storedUser?.plan || '').toLowerCase();
          const isAuthenticated = !!token;
          
          // Check if user can access this tool
          console.log(`[Frontend API] Checking access for tool ${toolId}, userPlan: ${userPlan}, isAuthenticated: ${isAuthenticated}`);
          const canAccess = toolSettingsService.canUserAccessTool(toolId, userPlan, isAuthenticated);
          console.log(`[Frontend API] Can access result: ${canAccess}`);
          
          if (!canAccess) {
            let errorMessage = 'Access denied to this tool.';
            if (toolSettings.features.requiresAuth && !isAuthenticated) {
              errorMessage = 'Please log in to access this tool.';
            } else if (toolSettings.features.requiresPremium && (userPlan !== 'pro' && userPlan !== 'custom')) {
              errorMessage = 'This tool requires a premium subscription.';
            } else if (toolSettings.accessControl.allowedFor === 'pro' && (userPlan !== 'pro' && userPlan !== 'custom')) {
              errorMessage = 'This tool is only available for pro/custom users.';
            }
            
            const error: any = new Error('Tool access denied');
            error.response = { 
              status: 403, 
              data: { 
                message: errorMessage,
                upgrade: toolSettings.features.requiresPremium
              } 
            };
            throw error;
          }
          
          // Check tool-specific limits
          const userLimits = toolSettingsService.getUserLimitForTool(toolId, userPlan, isAuthenticated);
          
          if (userLimits.limitType === 'number' && userLimits.limit !== null) {
            if (isGuest) {
              const { since, count } = getGuestOps();
              if (count >= userLimits.limit) {
                const error: any = new Error('Tool limit reached');
                error.response = { 
                  status: 429, 
                  data: { 
                    message: `Tool limit reached. ${userLimits.limit} operations allowed per ${userLimits.timeWindow} for guests. Please log in to continue.` 
                  } 
                };
                throw error;
              }
              setGuestOps(since, count + 1);
            } else {
              const userId = storedUser?.id || storedUser?._id;
              if (userId) {
                const { since, count } = getUserOps(userId);
                if (count >= userLimits.limit) {
                  const error: any = new Error('Tool limit reached');
                  error.response = { 
                    status: 429, 
                    data: { 
                      message: `Tool limit reached. ${userLimits.limit} operations allowed per ${userLimits.timeWindow}. Please upgrade to continue.`,
                      upgrade: true 
                    } 
                  };
                  throw error;
                }
                setUserOps(userId, since, count + 1);
              }
            }
          }
        } else {
          // Fallback to global free plan limits if no tool-specific settings
          const free = await getFreePlanLimit();
          if (isGuest) {
            if (free.limitType === 'number') {
              const { since, count } = getGuestOps();
              if (count >= (free.limit ?? 10)) {
                const error: any = new Error('Free plan limit reached');
                error.response = { status: 429, data: { message: `Free plan limit reached. ${(free.limit ?? 10)} operations allowed per 24 hours for guests. Please log in to continue.` } };
                throw error;
              }
              setGuestOps(since, count + 1);
            }
          } else {
            // Authenticated user: check subscription-based access
            const storedUser: any = getStoredUser();
            const userId = storedUser?.id || storedUser?._id;
            const userPlan = (storedUser?.plan || '').toLowerCase();
            
            if (userId) {
              // For users with pro/custom plans, allow unlimited access
              if (userPlan === 'pro' || userPlan === 'custom') {
                // Pro/Custom users have unlimited access - no client-side limiting
                return config;
              }
              
              // For free plan users or users without a plan, enforce limits
              if (userPlan === 'free' || userPlan === '' || userPlan == null) {
                if (free.limitType === 'number') {
                  const { since, count } = getUserOps(userId);
                  if (count >= (free.limit ?? 10)) {
                    const error: any = new Error('Free plan limit reached');
                    error.response = { status: 429, data: { message: `Free plan limit reached. ${(free.limit ?? 10)} operations allowed per 24 hours. Please upgrade to continue.`, upgrade: true } };
                    throw error;
                  }
                  setUserOps(userId, since, count + 1);
                }
              }
            }
          }
        }
      } else {
        // No recognizable toolId: still enforce global free plan limits
        const free = await getFreePlanLimit();
        if (isGuest) {
          if (free.limitType === 'number') {
            const { since, count } = getGuestOps();
            if (count >= (free.limit ?? 10)) {
              const error: any = new Error('Free plan limit reached');
              error.response = { status: 429, data: { message: `Free plan limit reached. ${(free.limit ?? 10)} operations allowed per 24 hours for guests. Please log in to continue.` } };
              throw error;
            }
            setGuestOps(since, count + 1);
          }
        } else {
          const storedUser: any = getStoredUser();
          const userId = storedUser?.id || storedUser?._id;
          const userPlan = (storedUser?.plan || '').toLowerCase();
          if (userId) {
            if (userPlan === 'pro' || userPlan === 'custom') {
              return config;
            }
            if (userPlan === 'free' || userPlan === '' || userPlan == null) {
              if (free.limitType === 'number') {
                const { since, count } = getUserOps(userId);
                if (count >= (free.limit ?? 10)) {
                  const error: any = new Error('Free plan limit reached');
                  error.response = { status: 429, data: { message: `Free plan limit reached. ${(free.limit ?? 10)} operations allowed per 24 hours. Please upgrade to continue.`, upgrade: true } };
                  throw error;
                }
                setUserOps(userId, since, count + 1);
              }
            }
          }
        }
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