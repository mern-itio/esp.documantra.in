import axios from 'axios';
import type { 
  GenerateCertificateRequest, 
  GenerateCertificateResponse,
  ListCertificatesResponse,
  DigitalSignatureRequest,
  DigitalSignatureResponse,
  VerifySignatureRequest,
  VerifySignatureResponse,
  TimestampAuthorityRequest,
  TimestampAuthorityResponse
} from '../types/digitalSignature';

class DigitalSignatureService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';
  }

  // Generate a new certificate
  async generateCertificate(request: GenerateCertificateRequest): Promise<GenerateCertificateResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/pdf-digital-signature/generate-certificate`, request);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to generate certificate');
    }
  }

  // List available certificates
  async listCertificates(): Promise<ListCertificatesResponse> {
    try {
      const response = await axios.get(`${this.baseURL}/pdf-digital-signature/list-certificates`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to list certificates');
    }
  }

  // Add digital signature to PDF
  async addDigitalSignature(request: DigitalSignatureRequest): Promise<DigitalSignatureResponse> {
    try {
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('privateKeyFile', request.privateKeyFile);
      formData.append('certificateFile', request.certificateFile);
      
      if (request.reason) formData.append('reason', request.reason);
      if (request.location) formData.append('location', request.location);
      if (request.contactInfo) formData.append('contactInfo', request.contactInfo);
      if (request.timestamp !== undefined) formData.append('timestamp', request.timestamp.toString());

      const response = await axios.post(`${this.baseURL}/pdf-digital-signature/add-signature`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Ensure download URL is absolute
      const baseURL = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';
      const downloadUrl = response.data.downloadUrl.startsWith('http')
        ? response.data.downloadUrl
        : `${baseURL}${response.data.downloadUrl}`;

      return { ...response.data, downloadUrl };
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to add digital signature');
    }
  }

  // Verify digital signature
  async verifyDigitalSignature(request: VerifySignatureRequest): Promise<VerifySignatureResponse> {
    try {
      const formData = new FormData();
      formData.append('file', request.file);

      const response = await axios.post(`${this.baseURL}/pdf-digital-signature/verify-signature`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to verify digital signature');
    }
  }

  // Get timestamp from authority
  async getTimestampAuthority(request: TimestampAuthorityRequest): Promise<TimestampAuthorityResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/pdf-digital-signature/timestamp-authority`, request);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to get timestamp');
    }
  }

  // Download signed PDF file
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
    } catch (error: any) {
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  // Validate certificate
  validateCertificate(certificate: any): { valid: boolean; message: string } {
    if (!certificate.commonName || certificate.commonName.trim() === '') {
      return { valid: false, message: 'Common name is required' };
    }
    
    if (!certificate.organization || certificate.organization.trim() === '') {
      return { valid: false, message: 'Organization is required' };
    }
    
    if (!certificate.country || certificate.country.trim() === '') {
      return { valid: false, message: 'Country is required' };
    }

    return { valid: true, message: 'Certificate details are valid' };
  }

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Generate hash for timestamp
  async generateHash(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Simple hash function (in production, use crypto.subtle.digest)
          let hash = 0;
          for (let i = 0; i < uint8Array.length; i++) {
            const char = uint8Array[i];
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
          }
          
          resolve(hash.toString(16));
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
}

export const digitalSignatureService = new DigitalSignatureService();
