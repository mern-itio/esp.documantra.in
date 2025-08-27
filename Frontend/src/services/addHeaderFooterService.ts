import axios from 'axios';
import type { AddHeaderFooterRequest, HeaderFooterPreviewRequest, HeaderFooterResponse } from '../types/addHeaderFooter';

class AddHeaderFooterService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';
  }

  async addHeaderFooter(request: AddHeaderFooterRequest): Promise<HeaderFooterResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    
    if (request.headerText) {
      formData.append('headerText', request.headerText);
    }
    if (request.footerText) {
      formData.append('footerText', request.footerText);
    }
    if (request.headerPosition) {
      formData.append('headerPosition', request.headerPosition);
    }
    if (request.footerPosition) {
      formData.append('footerPosition', request.footerPosition);
    }
    if (request.fontSize) {
      formData.append('fontSize', request.fontSize.toString());
    }
    if (request.fontColor) {
      formData.append('fontColor', request.fontColor);
    }
    if (request.startPage) {
      formData.append('startPage', request.startPage.toString());
    }
    if (request.endPage) {
      formData.append('endPage', request.endPage.toString());
    }
    if (request.margin) {
      formData.append('margin', request.margin.toString());
    }
    if (request.customHeaderText) {
      formData.append('customHeaderText', request.customHeaderText);
    }
    if (request.customFooterText) {
      formData.append('customFooterText', request.customFooterText);
    }
    if (request.excludePages && request.excludePages.length > 0) {
      formData.append('excludePages', request.excludePages.join(','));
    }
    if (request.headerEnabled !== undefined) {
      formData.append('headerEnabled', request.headerEnabled.toString());
    }
    if (request.footerEnabled !== undefined) {
      formData.append('footerEnabled', request.footerEnabled.toString());
    }

    const response = await axios.post(`${this.baseURL}/pdf-header-footer/add-header-footer`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Construct full URLs for preview and download
    const baseURL = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';
    const previewUrl = response.data.previewUrl.startsWith('http') 
      ? response.data.previewUrl 
      : `${baseURL}${response.data.previewUrl}`;
    const downloadUrl = response.data.downloadUrl.startsWith('http') 
      ? response.data.downloadUrl 
      : `${baseURL}${response.data.downloadUrl}`;

    return {
      ...response.data,
      previewUrl,
      downloadUrl
    };
  }

  async getPreview(request: HeaderFooterPreviewRequest): Promise<HeaderFooterResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    
    if (request.headerText) {
      formData.append('headerText', request.headerText);
    }
    if (request.footerText) {
      formData.append('footerText', request.footerText);
    }
    if (request.headerPosition) {
      formData.append('headerPosition', request.headerPosition);
    }
    if (request.footerPosition) {
      formData.append('footerPosition', request.footerPosition);
    }
    if (request.fontSize) {
      formData.append('fontSize', request.fontSize.toString());
    }
    if (request.fontColor) {
      formData.append('fontColor', request.fontColor);
    }
    if (request.margin) {
      formData.append('margin', request.margin.toString());
    }
    if (request.customHeaderText) {
      formData.append('customHeaderText', request.customHeaderText);
    }
    if (request.customFooterText) {
      formData.append('customFooterText', request.customFooterText);
    }
    if (request.headerEnabled !== undefined) {
      formData.append('headerEnabled', request.headerEnabled.toString());
    }
    if (request.footerEnabled !== undefined) {
      formData.append('footerEnabled', request.footerEnabled.toString());
    }

    const response = await axios.post(`${this.baseURL}/pdf-header-footer/preview-header-footer`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Construct full URL for preview
    const baseURL = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';
    const previewUrl = response.data.previewUrl.startsWith('http') 
      ? response.data.previewUrl 
      : `${baseURL}${response.data.previewUrl}`;

    return {
      ...response.data,
      previewUrl
    };
  }

  async downloadFile(url: string, filename: string): Promise<void> {
    try {
      console.log('Downloading file from:', url);
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
      console.error('Error downloading file:', error);
      throw error;
    }
  }
}

export const addHeaderFooterService = new AddHeaderFooterService();
