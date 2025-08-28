import axios from 'axios';
import type { AddPasswordRequest, PasswordResponse } from '../types/addPassword';

class AddPasswordService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';
  }

  async addPassword(request: AddPasswordRequest): Promise<PasswordResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    
    if (request.ownerPassword) {
      formData.append('ownerPassword', request.ownerPassword);
    }
    if (request.userPassword) {
      formData.append('userPassword', request.userPassword);
    }
    if (request.permissions) {
      formData.append('permissions', request.permissions);
    }
    if (request.encryptionLevel) {
      formData.append('encryptionLevel', request.encryptionLevel);
    }

    const response = await axios.post(`${this.baseURL}/pdf-password/add-password`, formData, {
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

  // Helper method to validate password strength
  validatePassword(password: string): { valid: boolean; message: string; score: number } {
    if (!password) return { valid: false, message: 'Password cannot be empty', score: 0 };
    if (password.length < 6) return { valid: false, message: 'Password must be at least 6 characters long', score: 1 };
    if (password.length > 32) return { valid: false, message: 'Password cannot exceed 32 characters', score: 1 };

    let score = 1;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const messages = [
      'Very weak',
      'Weak',
      'Medium',
      'Strong',
      'Very strong'
    ];

    return {
      valid: true,
      message: messages[Math.min(score - 1, 4)],
      score: Math.min(score, 5)
    };
  }
}

export const addPasswordService = new AddPasswordService();
