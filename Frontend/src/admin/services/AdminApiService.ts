

// Base API configuration
const API_BASE_URL =  import.meta.env.VITE_AUTH_BASE_URL || 'http://localhost:3001/api';
const ADMIN_API_BASE = `${API_BASE_URL}/admin`;

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Admin API Service Class
class AdminApiService {
  private getAuthHeaders(): HeadersInit {
    const adminToken = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to parse response',
      };
    }
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${ADMIN_API_BASE}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // ==================== AUTHENTICATION ====================
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return this.request('/auth/refresh', {
      method: 'POST',
    });
  }

  // ==================== USER MANAGEMENT ====================
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<any>>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.status) queryParams.append('status', params.status);

    const endpoint = queryParams.toString() ? `/users?${queryParams}` : '/users';
    return this.request(endpoint);
  }

  async getUserById(userId: string): Promise<ApiResponse<any>> {
    return this.request(`/users/${userId}`);
  }

  async updateUser(userId: string, userData: any): Promise<ApiResponse<any>> {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string): Promise<ApiResponse> {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async updateUserRole(userId: string, role: string): Promise<ApiResponse<any>> {
    return this.request(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  // ==================== DOCUMENT MANAGEMENT ====================
  async getDocuments(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
    userId?: string;
  }): Promise<ApiResponse<PaginatedResponse<any>>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.userId) queryParams.append('userId', params.userId);

    const endpoint = queryParams.toString() ? `/documents?${queryParams}` : '/documents';
    return this.request(endpoint);
  }

  async getDocumentById(documentId: string): Promise<ApiResponse<any>> {
    return this.request(`/documents/${documentId}`);
  }

  async updateDocumentStatus(documentId: string, status: string, reason?: string): Promise<ApiResponse<any>> {
    return this.request(`/documents/${documentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  }

  async deleteDocument(documentId: string): Promise<ApiResponse> {
    return this.request(`/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  async downloadDocument(documentId: string): Promise<Blob | null> {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${ADMIN_API_BASE}/documents/${documentId}/download`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      return await response.blob();
    } catch (error) {
      console.error('Download error:', error);
      return null;
    }
  }

  // ==================== E-SIGN MANAGEMENT ====================
  async getESigns(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    userId?: string;
  }): Promise<ApiResponse<PaginatedResponse<any>>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.userId) queryParams.append('userId', params.userId);

    const endpoint = queryParams.toString() ? `/e-signs?${queryParams}` : '/e-signs';
    return this.request(endpoint);
  }

  async getESignById(eSignId: string): Promise<ApiResponse<any>> {
    return this.request(`/e-signs/${eSignId}`);
  }

  async updateESignStatus(eSignId: string, status: string): Promise<ApiResponse<any>> {
    return this.request(`/e-signs/${eSignId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async cancelESign(eSignId: string, reason?: string): Promise<ApiResponse<any>> {
    return this.request(`/e-signs/${eSignId}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  // ==================== ANALYTICS ====================
  async getDashboardStats(): Promise<ApiResponse<any>> {
    return this.request('/analytics/dashboard');
  }

  async getUserAnalytics(params?: {
    period?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const endpoint = queryParams.toString() ? `/analytics/users?${queryParams}` : '/analytics/users';
    return this.request(endpoint);
  }

  async getDocumentAnalytics(params?: {
    period?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const endpoint = queryParams.toString() ? `/analytics/documents?${queryParams}` : '/analytics/documents';
    return this.request(endpoint);
  }

  // ==================== SYSTEM MANAGEMENT ====================
  async getSystemStatus(): Promise<ApiResponse<any>> {
    return this.request('/system/status');
  }

  async getApiKeys(): Promise<ApiResponse<any[]>> {
    return this.request('/system/api-keys');
  }

  async createApiKey(keyData: { name: string; permissions: string[] }): Promise<ApiResponse<any>> {
    return this.request('/system/api-keys', {
      method: 'POST',
      body: JSON.stringify(keyData),
    });
  }

  async deleteApiKey(keyId: string): Promise<ApiResponse> {
    return this.request(`/system/api-keys/${keyId}`, {
      method: 'DELETE',
    });
  }

  async getSecurityLogs(params?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<ApiResponse<PaginatedResponse<any>>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);

    const endpoint = queryParams.toString() ? `/system/security-logs?${queryParams}` : '/system/security-logs';
    return this.request(endpoint);
  }

  // ==================== SETTINGS ====================
  async getSettings(): Promise<ApiResponse<any>> {
    return this.request('/settings');
  }

  async updateSettings(settings: any): Promise<ApiResponse<any>> {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // ==================== NOTIFICATIONS ====================
  async getNotifications(): Promise<ApiResponse<any[]>> {
    return this.request('/notifications');
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse> {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse> {
    return this.request('/notifications/read-all', {
      method: 'PATCH',
    });
  }
}

// Export singleton instance
export const adminApiService = new AdminApiService();

// Export hook for using the service
export const useAdminApi = () => {
  // Return the service instance
  return adminApiService;
};

export default adminApiService;
