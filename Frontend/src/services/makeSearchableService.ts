import { pdfApi } from "./apiHelper";
import type { 
  MakeSearchableRequest, 
  MakeSearchableResponse, 
  MakeSearchableTools 
} from '../types/makeSearchable';

export const makeSearchableService = {
  /**
   * Convert scanned PDFs to searchable documents
   */
  async makeSearchable(request: MakeSearchableRequest): Promise<MakeSearchableResponse> {
    const formData = new FormData();
    
    // Append files
    request.files.forEach((file) => {
      formData.append('files', file);
    });
    
    // Append settings
    formData.append('language', request.language);
    formData.append('accuracy', request.accuracy);
    formData.append('preserveLayout', request.preserveLayout.toString());
    formData.append('createInvisibleLayer', request.createInvisibleLayer.toString());
    formData.append('enhanceImage', request.enhanceImage.toString());
    formData.append('removeNoise', request.removeNoise.toString());

    const response = await pdfApi.post('/pdf-make-searchable/process', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes timeout for processing
    });

    return response.data;
  },

  /**
   * Check required tools availability
   */
  async checkTools(): Promise<MakeSearchableTools> {
    const response = await pdfApi.get('/pdf-make-searchable/tools');
    return response.data.tools;
  },

  /**
   * Download processed file
   */
  async downloadFile(filename: string): Promise<void> {
    try {
      const response = await pdfApi.get(`/pdf-make-searchable/download/${filename}`, {
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
   * Validate file type for make searchable
   */
  validateFileType(file: File): boolean {
    return file.type === 'application/pdf';
  },

  /**
   * Get file type icon
   */
  getFileTypeIcon(file: File): string {
    if (file.type === 'application/pdf') return '📄';
    return '📁';
  }
};
