

import type {
  AddTextWatermarkRequest,
  AddImageWatermarkRequest,
  WatermarkPreviewRequest,
  WatermarkResponse,
  WatermarkPreviewResponse
} from '../types/addWatermark';
import { pdfApi } from './apiHelper';

class AddWatermarkService {
  private baseUrl = '/pdf-watermark';

  // Add text watermark
  async addTextWatermark(request: AddTextWatermarkRequest): Promise<WatermarkResponse> {
    const formData = new FormData();
    formData.append('pdf', request.file);
    formData.append('text', request.text);
    formData.append('position', request.position);
    formData.append('fontSize', request.fontSize.toString());
    formData.append('fontColor', request.fontColor);
    formData.append('opacity', request.opacity.toString());
    formData.append('rotation', request.rotation.toString());
    formData.append('startPage', request.startPage.toString());
    
    if (request.endPage) {
      formData.append('endPage', request.endPage.toString());
    }
    
    if (request.excludePages) {
      formData.append('excludePages', request.excludePages);
    }

    const response = await pdfApi.post(`${this.baseUrl}/text`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // Add image watermark
  async addImageWatermark(request: AddImageWatermarkRequest): Promise<WatermarkResponse> {
    const formData = new FormData();
    formData.append('pdf', request.pdfFile);
    formData.append('image', request.imageFile);
    formData.append('position', request.position);
    formData.append('opacity', request.opacity.toString());
    formData.append('rotation', request.rotation.toString());
    formData.append('scale', request.scale.toString());
    formData.append('startPage', request.startPage.toString());
    
    if (request.endPage) {
      formData.append('endPage', request.endPage.toString());
    }
    
    if (request.excludePages) {
      formData.append('excludePages', request.excludePages);
    }

    const response = await pdfApi.post(`${this.baseUrl}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // Preview watermark
  async previewWatermark(request: WatermarkPreviewRequest): Promise<WatermarkPreviewResponse> {
    const formData = new FormData();
    formData.append('pdf', request.file);
    formData.append('text', request.text);
    formData.append('position', request.position);
    formData.append('fontSize', request.fontSize.toString());
    formData.append('fontColor', request.fontColor);
    formData.append('opacity', request.opacity.toString());
    formData.append('rotation', request.rotation.toString());
    formData.append('previewPage', request.previewPage.toString());

    const response = await pdfApi.post(`${this.baseUrl}/preview`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // Download file
  async downloadFile(downloadUrl: string, filename: string): Promise<void> {
    try {
      const response = await pdfApi.get(downloadUrl, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      throw new Error('Failed to download file');
    }
  }

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Validate text watermark request
  validateTextWatermark(request: AddTextWatermarkRequest): { valid: boolean; message?: string } {
    if (!request.file) {
      return { valid: false, message: 'Please select a PDF file' };
    }
    if (!request.text || request.text.trim() === '') {
      return { valid: false, message: 'Watermark text is required' };
    }
    if (request.fontSize < 8 || request.fontSize > 200) {
      return { valid: false, message: 'Font size must be between 8 and 200' };
    }
    if (request.opacity < 0.1 || request.opacity > 1.0) {
      return { valid: false, message: 'Opacity must be between 0.1 and 1.0' };
    }
    if (request.startPage < 1) {
      return { valid: false, message: 'Start page must be at least 1' };
    }
    if (request.endPage && request.endPage < request.startPage) {
      return { valid: false, message: 'End page must be greater than or equal to start page' };
    }
    return { valid: true };
  }

  // Validate image watermark request
  validateImageWatermark(request: AddImageWatermarkRequest): { valid: boolean; message?: string } {
    if (!request.pdfFile) {
      return { valid: false, message: 'Please select a PDF file' };
    }
    if (!request.imageFile) {
      return { valid: false, message: 'Please select an image file' };
    }
    if (request.opacity < 0.1 || request.opacity > 1.0) {
      return { valid: false, message: 'Opacity must be between 0.1 and 1.0' };
    }
    if (request.scale < 0.1 || request.scale > 5.0) {
      return { valid: false, message: 'Scale must be between 0.1 and 5.0' };
    }
    if (request.startPage < 1) {
      return { valid: false, message: 'Start page must be at least 1' };
    }
    if (request.endPage && request.endPage < request.startPage) {
      return { valid: false, message: 'End page must be greater than or equal to start page' };
    }
    return { valid: true };
  }
}

export const addWatermarkService = new AddWatermarkService();
