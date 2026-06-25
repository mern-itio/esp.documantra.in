import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { getMemoryAdminAccessToken } from '../utils/authSession';

const createApiInstance = (baseURL: string, serviceName: string): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    timeout: 30000,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
  });

  // Request Interceptor — admin/agent JWT via httpOnly cookie; memory token for WS only.
  instance.interceptors.request.use(async (config) => {
    const token = getMemoryAdminAccessToken();
    if (token) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData && config.headers) {
      delete (config.headers as any)['Content-Type'];
    }
    return config;
  });

  // Response Interceptor
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error(`${serviceName} API Error:`, error);
      return Promise.reject(error);
    }
  );

  return instance;
};

const SUPPORT_SERVICE_URL = import.meta.env.VITE_SUPPORT_SERVICE_URL || 'http://localhost:2107';

export const supportApi = createApiInstance(
  SUPPORT_SERVICE_URL,
  'Support'
);

// Customer API calls
export const supportCustomerApi = {
  // Tickets
  createTicket: (data: { subject: string; category?: string; priority?: string; initialMessage: string; metadata?: any }) =>
    supportApi.post('/api/support-service/customer/tickets', data),
  
  getTickets: () =>
    supportApi.get('/api/support-service/customer/tickets'),
  
  getTicket: (ticketId: string) =>
    supportApi.get(`/api/support-service/customer/tickets/${ticketId}`),
  
  closeTicket: (ticketId: string) =>
    supportApi.post(`/api/support-service/customer/tickets/${ticketId}/close`),
  
  submitRating: (ticketId: string, data: { score: number; feedback?: string }) =>
    supportApi.post(`/api/support-service/customer/tickets/${ticketId}/rating`, data),
  
  // Messages
  getMessages: (ticketId: string) =>
    supportApi.get(`/api/support-service/customer/tickets/${ticketId}/messages`),
  
  uploadFile: (ticketId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('ticketId', ticketId);
    return supportApi.post(`/api/support-service/customer/tickets/${ticketId}/upload`, formData);
  }
};

// Public API calls (no auth required)
export const supportPublicApi = {
  createTicket: (data: { name: string; email: string; subject: string; category?: string; message: string }) =>
    supportApi.post('/api/support-service/public/queries', data),
};

// Agent API calls
export const supportAgentApi = {
  // Auth
  login: (data: { email: string; password: string }) =>
    supportApi.post('/api/support-service/agent/auth/login', data),
  
  // Profile
  getProfile: () =>
    supportApi.get('/api/support-service/agent/profile'),
  
  updateProfile: (data: { fullname?: string; avatar?: string }) =>
    supportApi.put('/api/support-service/agent/profile', data),
  
  updateStatus: (status: 'online' | 'offline' | 'away') =>
    supportApi.put('/api/support-service/agent/status', { status }),
  
  // Dashboard
  getDashboard: () =>
    supportApi.get('/api/support-service/agent/dashboard'),
  
  // Tickets
  getTickets: (status?: string) =>
    supportApi.get('/api/support-service/agent/tickets', { params: { status } }),
  
  getTicket: (ticketId: string) =>
    supportApi.get(`/api/support-service/agent/tickets/${ticketId}`),
  
  closeTicket: (ticketId: string) =>
    supportApi.post(`/api/support-service/agent/tickets/${ticketId}/close`),
  
  transferTicket: (ticketId: string, data: { toAgentId: string; reason?: string }) =>
    supportApi.post(`/api/support-service/agent/tickets/${ticketId}/transfer`, data),
  
  // Messages
  getMessages: (ticketId: string) =>
    supportApi.get(`/api/support-service/agent/tickets/${ticketId}/messages`),
  
  uploadFile: (ticketId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('ticketId', ticketId);
    return supportApi.post(`/api/support-service/agent/tickets/${ticketId}/upload`, formData);
  }
};

// Admin API calls
export const supportAdminApi = {
  // Agents
  getAllAgents: () =>
    supportApi.get('/api/support-service/admin/agents'),
  
  createAgent: (data: { email: string; password: string; fullname: string; role?: string }) =>
    supportApi.post('/api/support-service/admin/agents', data),
  
  updateAgent: (agentId: string, data: any) =>
    supportApi.put(`/api/support-service/admin/agents/${agentId}`, data),
  
  deleteAgent: (agentId: string) =>
    supportApi.delete(`/api/support-service/admin/agents/${agentId}`),
  
  // Tickets
  getAllTickets: (params?: any) =>
    supportApi.get('/api/support-service/admin/tickets', { params }),

  // Dashboard (separate from ticket center listing)
  getDashboardQueries: (params?: { limit?: number; source?: string }) =>
    supportApi.get('/api/support-service/admin/dashboard/queries', { params }),

  // Alias endpoint for dashboard query feed
  getQueries: (params?: { limit?: number; source?: string }) =>
    supportApi.get('/api/support-service/admin/queries', { params }),

  // Dedicated feed for Help & Support page submissions only
  getHelpSupportQueries: (params?: { limit?: number; page?: number }) =>
    supportApi.get('/api/support-service/admin/help-support/queries', { params }),

  closeHelpSupportQuery: (ticketId: string) =>
    supportApi.post(`/api/support-service/admin/help-support/queries/${ticketId}/close`),
  
  reassignTicket: (ticketId: string, data: { toAgentId: string }) =>
    supportApi.post(`/api/support-service/admin/tickets/${ticketId}/reassign`, data),
  
  // Analytics
  getAnalytics: (params?: { startDate?: string; endDate?: string }) =>
    supportApi.get('/api/support-service/admin/analytics', { params })
};

export { SUPPORT_SERVICE_URL };

