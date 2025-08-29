import { pdfApi } from "./apiHelper";
import type { 
  OCRRequest, 
  OCRResponse, 
  OCRLanguage, 
  OCRTools 
} from '../types/ocr';

export const ocrService = {
  /**
   * Perform OCR on uploaded files
   */
  async performOCR(request: OCRRequest): Promise<OCRResponse> {
    const formData = new FormData();
    
    // Append files
    request.files.forEach((file) => {
      formData.append('files', file);
    });
    
    // Append settings
    formData.append('language', request.language);
    formData.append('accuracy', request.accuracy);
    formData.append('outputFormat', request.outputFormat);
    
    // Append options if provided
    if (request.options) {
      Object.entries(request.options).forEach(([key, value]) => {
        formData.append(`options[${key}]`, value.toString());
      });
    }

    const response = await pdfApi.post('/pdf-ocr/process', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes timeout for OCR processing
    });

    return response.data;
  },

  /**
   * Get available OCR languages
   */
  async getAvailableLanguages(): Promise<OCRLanguage[]> {
    const response = await pdfApi.get('/pdf-ocr/languages');
    return response.data.languages;
  },

  /**
   * Check OCR tools availability
   */
  async checkOCRTools(): Promise<OCRTools> {
    const response = await pdfApi.get('/pdf-ocr/tools');
    return response.data.tools;
  },

  /**
   * Download processed file
   */
  async downloadFile(filename: string): Promise<void> {
    try {
      const response = await pdfApi.get(`/pdf-ocr/download/${filename}`, {
        responseType: 'blob',
      });

      // Create download link
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
  },

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Calculate confidence percentage
   */
  formatConfidence(confidence: string): string {
    const num = parseFloat(confidence);
    if (isNaN(num)) return 'N/A';
    return `${(num * 100).toFixed(1)}%`;
  },

  /**
   * Get language display name from code
   */
  getLanguageName(languages: OCRLanguage[], code: string): string {
    const language = languages.find(lang => lang.code === code);
    return language ? language.name : code;
  },

  /**
   * Validate file type for OCR
   */
  validateFileType(file: File): boolean {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/tiff',
      'image/bmp'
    ];
    
    return allowedTypes.includes(file.type);
  },

  /**
   * Get file type icon
   */
  getFileTypeIcon(file: File): string {
    if (file.type === 'application/pdf') return '📄';
    if (file.type.startsWith('image/')) return '🖼️';
    return '📁';
  }
};
