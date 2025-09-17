// Environment Configuration
export const ENV_CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  PDF_SERVICE_URL: import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104',
  DOCUMENT_SERVICE_URL: import.meta.env.VITE_DOCUMENT_SERVICE_URL || 'http://localhost:2102',
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
};

// API Configuration
export const API_CONFIG = {
  BASE_URL: ENV_CONFIG.API_BASE_URL,
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
};
