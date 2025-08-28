import { pdfApi } from './apiHelper';
import type { 
  AddPageNumbersRequest, 
  AddPageNumbersResponse,
  PageNumberPreviewRequest,
  PageNumberPreviewResponse 
} from '../types/addPageNumbers';

export const addPageNumbersService = {
  async addPageNumbers(request: AddPageNumbersRequest): Promise<AddPageNumbersResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('position', request.position);
    formData.append('fontSize', request.fontSize.toString());
    formData.append('fontColor', request.fontColor);
    formData.append('startPage', request.startPage.toString());
    // Always send endPage field, even if it's undefined or empty
    formData.append('endPage', request.endPage ? request.endPage.toString() : '');
    formData.append('format', request.format);
    formData.append('margin', request.margin.toString());
    if (request.customText) {
      formData.append('customText', request.customText);
    }
    if (request.excludePages && request.excludePages.length > 0) {
      formData.append('excludePages', JSON.stringify(request.excludePages));
    }

    const response = await pdfApi.post('/pdf-page-numbers/add-page-numbers', formData, {
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
  },

  async getPreview(request: PageNumberPreviewRequest): Promise<PageNumberPreviewResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('position', request.position);
    formData.append('fontSize', request.fontSize.toString());
    formData.append('fontColor', request.fontColor);
    formData.append('format', request.format);
    formData.append('margin', request.margin.toString());

    const response = await pdfApi.post('/pdf-page-numbers/preview-page-numbers', formData, {
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
  },

  async downloadFile(downloadUrl: string, filename: string): Promise<void> {
    try {
      // Ensure we have a full URL
      const fullUrl = downloadUrl.startsWith('http') 
        ? downloadUrl 
        : `${import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104'}${downloadUrl}`;
      
      console.log('Downloading file from:', fullUrl);
      
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('File downloaded successfully:', filename);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};
