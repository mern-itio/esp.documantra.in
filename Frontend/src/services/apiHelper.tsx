import axios from 'axios';
import type { AxiosInstance } from 'axios';

const createApiInstance = (baseURL: string, serviceName: string): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' }
  });

  // Request Interceptor
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // console.log(`${serviceName} API Request:`, {
    //   method: config.method?.toUpperCase(),
    //   url: config.url,
    //   fullUrl: `${config.baseURL}${config.url}`,
    //   headers: config.headers
    // });

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