import axios from 'axios';
import type { RemovePasswordRequest, RemovePasswordResponse, PasswordProtectionCheck } from '../types/removePassword';

class RemovePasswordService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';
  }

  async checkPasswordProtection(file: File): Promise<PasswordProtectionCheck> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${this.baseURL}/pdf-remove-password/check-protection`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async removePassword(request: RemovePasswordRequest): Promise<RemovePasswordResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('password', request.password);

    const response = await axios.post(`${this.baseURL}/pdf-remove-password/remove-password`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Construct full URL for download
    const baseURL = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';
    const downloadUrl = response.data.downloadUrl.startsWith('http') 
      ? response.data.downloadUrl 
      : `${baseURL}${response.data.downloadUrl}`;

    return {
      ...response.data,
      downloadUrl
    };
  }

  async downloadFile(url: string, filename: string): Promise<void> {
    try {
      const response = await axios.get(url, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      throw new Error('Failed to download file');
    }
  }

  // Helper method to validate password
  validatePassword(password: string): { valid: boolean; message: string; score: number } {
    if (!password) return { valid: false, message: 'Password cannot be empty', score: 0 };
    if (password.length < 1) return { valid: false, message: 'Password cannot be empty', score: 0 };

    // For remove password, we just need to ensure it's not empty
    return {
      valid: true,
      message: 'Password provided',
      score: 1
    };
  }

  // Helper method to get file size in readable format
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const removePasswordService = new RemovePasswordService();
