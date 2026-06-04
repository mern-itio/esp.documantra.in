const axios = require('axios');

// Extract bearer token from request headers
function getBearerToken(req) {
  const authHeader = req.headers && req.headers.authorization;
  if (!authHeader) return null;
  if (authHeader.startsWith('Bearer ')) return authHeader.split(' ')[1];
  return authHeader;
}

// Create an axios instance with default headers and baseURL
function createClient(req, { baseURL, extraHeaders } = {}) {
  const token = getBearerToken(req);
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  return axios.create({
    baseURL,
    headers,
    timeout: 30000,
  });
}

// Map service names to base URLs (env-configurable)
function getServiceBaseURL(serviceName) {
  switch (serviceName) {
    case 'auth':
      return process.env.AUTH_SERVICE_URL || 'https://esp.documantra.in/auth';
    case 'document':
      return process.env.DOCUMENT_SERVICE_URL || 'https://esp.documantra.in/document';
    case 'esign':
      return process.env.ESIGN_SERVICE_URL || 'https://esp.documantra.in/esign';
    case 'pdf':
      return process.env.PDF_SERVICE_URL || 'https://esp.documantra.in/pdf';
    case 'api':
      return process.env.API_SERVICE_URL || 'https://esp.documantra.in/service';
    case 'template':
      return process.env.TEMPLATE_SERVICE_URL || 'https://esp.documantra.in/template';
    case 'subscription':
      return process.env.SUBSCRIPTION_SERVICE_URL || 'https://esp.documantra.in/subscription';
    case 'organization':
      return process.env.ORGANIZATION_SERVICE_URL || 'https://esp.documantra.in/organization';
    case 'email':
      return process.env.EMAIL_SERVICE_URL || 'https://esp.documantra.in/email';
    default:
      return process.env.DEFAULT_SERVICE_URL || '';
  }
}

// Create a service-specific axios client with interceptors (similar to frontend)
function createServiceClient(req, serviceName) {
  const baseURL = getServiceBaseURL(serviceName);
  const token = getBearerToken(req);
  const instance = axios.create({
    baseURL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' }
  });

  instance.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Allow trusted internal admin calls without relying on end-user token
    if (
      config.url &&
      (config.url.startsWith('/admin') || config.url.startsWith('/api/template/admin'))
    ) {
      const internalKey = process.env.INTERNAL_ADMIN_API_KEY || process.env.ADMIN_ACCESS_TOKEN_SECRET;
      if (internalKey) {
        config.headers['x-internal-key'] = internalKey;
      }
    }
    // If sending FormData from server-side, let axios set proper headers
    if (config.data && typeof config.data === 'object' && config.data._isFormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      // Consistent logging like frontend helper
      // console.error can be noisy in production; adjust as needed
      console.error(`${serviceName} API Error:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
      });
      return Promise.reject(error);
    }
  );

  return instance;
}

// Unified request wrapper with consistent error shaping
async function apiRequest(req, {
  method = 'get',
  baseURL,
  url,
  data,
  params,
  headers,
  timeout,
} = {}) {
  const client = createClient(req, { baseURL, extraHeaders: headers });
  try {
    const response = await client.request({ method, url, data, params, timeout });
    return {
      ok: true,
      status: response.status,
      message: 'ok',
      data: response.data,
    };
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'Internal Server Error';
    return {
      ok: false,
      status,
      message,
      data: error.response?.data || null,
      error,
    };
  }
}

// Service-aware request wrapper
async function serviceRequest(req, serviceName, { method = 'get', url, data, params, headers, timeout } = {}) {
  const client = createServiceClient(req, serviceName);
  try {
    const response = await client.request({ method, url, data, params, headers, timeout });
    return { ok: true, status: response.status, message: 'ok', data: response.data };
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'Internal Server Error';
    return { ok: false, status, message, data: error.response?.data || null, error };
  }
}

// Convenience helpers for common verbs
function get(req, options) { return apiRequest(req, { ...options, method: 'get' }); }
function post(req, options) { return apiRequest(req, { ...options, method: 'post' }); }
function put(req, options) { return apiRequest(req, { ...options, method: 'put' }); }
function patch(req, options) { return apiRequest(req, { ...options, method: 'patch' }); }
function del(req, options) { return apiRequest(req, { ...options, method: 'delete' }); }

// Service-specific convenience helpers
function serviceGet(req, serviceName, options) { return serviceRequest(req, serviceName, { ...options, method: 'get' }); }
function servicePost(req, serviceName, options) { return serviceRequest(req, serviceName, { ...options, method: 'post' }); }
function servicePut(req, serviceName, options) { return serviceRequest(req, serviceName, { ...options, method: 'put' }); }
function servicePatch(req, serviceName, options) { return serviceRequest(req, serviceName, { ...options, method: 'patch' }); }
function serviceDel(req, serviceName, options) { return serviceRequest(req, serviceName, { ...options, method: 'delete' }); }

module.exports = {
  getBearerToken,
  createClient,
  getServiceBaseURL,
  createServiceClient,
  apiRequest,
  serviceRequest,
  get,
  post,
  put,
  patch,
  del,
  serviceGet,
  servicePost,
  servicePut,
  servicePatch,
  serviceDel,
};


