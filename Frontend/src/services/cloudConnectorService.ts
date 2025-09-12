import { pdfApi } from './apiHelper';

export interface CloudService {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  lastSync?: string;
  storageUsed?: string;
  storageTotal?: string;
  accountEmail?: string;
  accountName?: string;
}

export interface CloudFile {
  id: string;
  fileId: string;
  name: string;
  type: 'pdf' | 'folder' | 'doc' | 'docx' | 'txt' | 'image';
  size: string;
  modified: string;
  service: string;
  synced: boolean;
  downloadUrl?: string;
  lastSyncDate?: string;
}

export interface AuthUrlResponse {
  authUrl: string;
  state: string;
}

export interface SyncResponse {
  filesSynced: number;
  lastSync: string;
  storageInfo: {
    used: string;
    total: string;
  };
}

class CloudConnectorService {

  // Get all available cloud services
  async getAvailableServices(): Promise<CloudService[]> {
    try {
      const response = await pdfApi.get('/cloud-connector/services');
      return response.data.data;
    } catch (error) {
      console.error('Error getting available services:', error);
      throw new Error('Failed to get available services');
    }
  }

  // Get user's connected services
  async getConnectedServices(): Promise<CloudService[]> {
    try {
      const response = await pdfApi.get('/cloud-connector/connected');
      return response.data.data;
    } catch (error) {
      console.error('Error getting connected services:', error);
      throw new Error('Failed to get connected services');
    }
  }

  // Get OAuth authorization URL for a service
  async getAuthUrl(serviceId: string): Promise<AuthUrlResponse> {
    try {
      const response = await pdfApi.get(`/cloud-connector/auth/${serviceId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting auth URL:', error);
      throw new Error('Failed to get authorization URL');
    }
  }

  // Connect to a cloud service (handles OAuth callback)
  async connectService(code: string, state: string): Promise<{ serviceId: string; serviceName: string; accountEmail: string; accountName: string }> {
    try {
      const response = await pdfApi.get('/cloud-connector/callback-api', {
        params: { code, state }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error connecting service:', error);
      throw new Error('Failed to connect service');
    }
  }

  // Disconnect a service
  async disconnectService(serviceId: string): Promise<void> {
    try {
      await pdfApi.delete(`/cloud-connector/disconnect/${serviceId}`);
    } catch (error) {
      console.error('Error disconnecting service:', error);
      throw new Error('Failed to disconnect service');
    }
  }

  // Sync files from a service
  async syncFiles(serviceId: string): Promise<SyncResponse> {
    try {
      const response = await pdfApi.post(`/cloud-connector/sync/${serviceId}`, {});
      return response.data.data;
    } catch (error) {
      console.error('Error syncing files:', error);
      throw new Error('Failed to sync files');
    }
  }

  // Get files from services
  async getFiles(serviceId?: string, folderId?: string): Promise<CloudFile[]> {
    try {
      const params: any = {};
      if (serviceId) params.serviceId = serviceId;
      if (folderId) params.folderId = folderId;
      
      const response = await pdfApi.get('/cloud-connector/files', { params });
      return response.data.data;
    } catch (error) {
      console.error('Error getting files:', error);
      throw new Error('Failed to get files');
    }
  }

  // Download file from cloud service
  async downloadFile(fileId: string): Promise<Blob> {
    try {
      const response = await pdfApi.get(`/cloud-connector/download/${fileId}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error('Failed to download file');
    }
  }

  // Helper method to initiate OAuth flow
  async initiateOAuthFlow(serviceId: string): Promise<void> {
    try {
      const { authUrl } = await this.getAuthUrl(serviceId);
      
      // Open OAuth window
      const oauthWindow = window.open(
        authUrl,
        'oauth',
        'width=600,height=600,scrollbars=yes,resizable=yes'
      );

      if (!oauthWindow) {
        throw new Error('Failed to open OAuth window. Please allow popups for this site.');
      }

      // Listen for message from OAuth window
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'OAUTH_SUCCESS') {
          window.removeEventListener('message', messageListener);
          oauthWindow.close();
          
          // Handle successful OAuth
          this.handleOAuthSuccess(event.data.code, event.data.state);
        } else if (event.data.type === 'OAUTH_ERROR') {
          window.removeEventListener('message', messageListener);
          oauthWindow.close();
          
          // Handle OAuth error
          throw new Error(event.data.error || 'OAuth failed');
        }
      };

      window.addEventListener('message', messageListener);

      // Note: We don't check window.closed due to COOP policy restrictions
      // The OAuth flow will complete via the message listener or user will manually close

    } catch (error) {
      console.error('Error initiating OAuth flow:', error);
      throw new Error('Failed to initiate OAuth flow');
    }
  }

  // Upload file to cloud service
  async uploadFile(serviceId: string, file: File, parentFolderId?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('serviceId', serviceId);
      formData.append('fileName', file.name);
      formData.append('fileData', file);
      if (parentFolderId) {
        formData.append('parentFolderId', parentFolderId);
      }

      const response = await pdfApi.post('/cloud-connector/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      
      // Extract error message from API response
      if (error.response?.data?.error) {
        return {
          success: false,
          error: error.response.data.error
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload file'
      };
    }
  }

  // Create folder in cloud service
  async createFolder(serviceId: string, folderName: string, parentFolderId?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await pdfApi.post('/cloud-connector/create-folder', {
        serviceId,
        folderName,
        parentFolderId: parentFolderId || 'root'
      });

      return response.data;
    } catch (error) {
      console.error('Error creating folder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create folder'
      };
    }
  }


  // Handle successful OAuth
  private async handleOAuthSuccess(code: string, state: string): Promise<void> {
    try {
      await this.connectService(code, state);
      // Emit success event or call callback
      window.dispatchEvent(new CustomEvent('cloudServiceConnected', { 
        detail: { code, state } 
      }));
    } catch (error) {
      console.error('Error handling OAuth success:', error);
      window.dispatchEvent(new CustomEvent('cloudServiceError', { 
        detail: { error: error instanceof Error ? error.message : 'Unknown error' } 
      }));
    }
  }
}

export const cloudConnectorService = new CloudConnectorService();
