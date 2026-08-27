import { resolveServiceUrl } from '../utils/secureApiUrl';

// Environment Configuration
export const ENV_CONFIG = {
  API_BASE_URL: resolveServiceUrl(import.meta.env.VITE_API_BASE_URL, {
    productionPath: '/auth',
    localUrl: 'http://localhost:2101',
  }),
  PDF_SERVICE_URL: resolveServiceUrl(import.meta.env.VITE_PDF_SERVICE_URL, {
    productionPath: '/pdf',
    localUrl: 'http://localhost:2104',
  }),
  DOCUMENT_SERVICE_URL: resolveServiceUrl(import.meta.env.VITE_DOCUMENT_SERVICE_URL, {
    productionPath: '/document',
    localUrl: 'http://localhost:2102',
  }),
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
};

/** Developer / API Keys UI — hidden on live production builds unless explicitly enabled. */
export const ENABLE_DEVELOPER_UI =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEVELOPER === 'true';

// API Configuration
export const API_CONFIG = {
  BASE_URL: ENV_CONFIG.API_BASE_URL,
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
};
