import axios from 'axios';
import type { SetPermissionsRequest, SetPermissionsResponse, CurrentPermissionsResponse } from '../types/setPermissions';

class SetPermissionsService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';
  }

  async setPermissions(file: File, permissions: SetPermissionsRequest): Promise<SetPermissionsResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add all permission settings to form data
    Object.entries(permissions).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    const response = await axios.post(`${this.baseURL}/pdf-permissions/set-permissions`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async getCurrentPermissions(file: File): Promise<CurrentPermissionsResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${this.baseURL}/pdf-permissions/get-current-permissions`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // Open secure PDF in new tab instead of downloading
  async openSecurePDF(secureViewLink: string): Promise<void> {
    try {
      const fullUrl = secureViewLink.startsWith('http') 
        ? secureViewLink 
        : `${this.baseURL}${secureViewLink}`;
      
      // Open in new tab
      window.open(fullUrl, '_blank');
    } catch (error) {
      console.error('Error opening secure PDF:', error);
      throw new Error('Failed to open secure PDF');
    }
  }

  // Open secure PDF with simple view (for debugging)
  async openSecurePDFSimple(secureViewLink: string): Promise<void> {
    try {
      const fullUrl = secureViewLink.startsWith('http') 
        ? secureViewLink 
        : `${this.baseURL}${secureViewLink}`;
      
      // Add simple view parameter
      const simpleUrl = fullUrl + (fullUrl.includes('?') ? '&' : '?') + 'simple=true';
      
      // Open in new tab
      window.open(simpleUrl, '_blank');
    } catch (error) {
      console.error('Error opening secure PDF (simple view):', error);
      throw new Error('Failed to open secure PDF');
    }
  }

  // Download PDF directly (for testing)
  async downloadPDF(secureViewLink: string): Promise<void> {
    try {
      const fullUrl = secureViewLink.startsWith('http') 
        ? secureViewLink 
        : `${this.baseURL}${secureViewLink}`;
      
      // Convert view link to download link
      const downloadUrl = fullUrl.replace('/view/', '/download/');
      
      // Create download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'secure-document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw new Error('Failed to download PDF');
    }
  }

  // Revoke secure link
  async revokeSecureLink(token: string): Promise<void> {
    try {
      await axios.delete(`${this.baseURL}/pdf-permissions/revoke/${token}`);
    } catch (error) {
      console.error('Error revoking secure link:', error);
      throw new Error('Failed to revoke secure link');
    }
  }
}

export const setPermissionsService = new SetPermissionsService();
