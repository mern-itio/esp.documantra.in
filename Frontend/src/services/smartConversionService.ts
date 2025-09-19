import type { 
  SmartConversionRequest, 
  SmartConversionResponse,
  BatchSmartConversionRequest,
  BatchSmartConversionResponse,
  FormatDetectionResponse,
  ConversionPresetsResponse
} from '../types/smartConversion';
import { pdfApi } from './apiHelper';

export const smartConversionService = {
  // Detect file format with AI analysis
  async detectFormat(file: File): Promise<FormatDetectionResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await pdfApi.post('/smart-conversion/detect-format', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 1 minute timeout
      });

      return response.data;
    } catch (error: any) {
      console.error('Format detection error:', error);
      throw new Error(error.response?.data?.message || 'Failed to detect file format');
    }
  },

  // Perform smart conversion
  async smartConvert(request: SmartConversionRequest): Promise<SmartConversionResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('targetFormat', request.targetFormat);
    formData.append('qualityLevel', request.qualityLevel);
    formData.append('preserveLayout', request.preserveLayout.toString());
    formData.append('optimizeForWeb', request.optimizeForWeb.toString());

    // Add custom settings if provided
    if (request.customSettings) {
      Object.entries(request.customSettings).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(`customSettings[${key}]`, value.toString());
        }
      });
    }

    try {
      const response = await pdfApi.post('/smart-conversion/convert', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes timeout for conversion
      });

      return response.data;
    } catch (error: any) {
      console.error('Smart conversion error:', error);
      throw new Error(error.response?.data?.message || 'Failed to perform smart conversion');
    }
  },

  // Perform batch smart conversion
  async batchSmartConvert(request: BatchSmartConversionRequest): Promise<BatchSmartConversionResponse> {
    const formData = new FormData();
    
    // Add all files
    request.    files.forEach((file) => {
      formData.append('files', file);
    });

    formData.append('targetFormat', request.targetFormat);
    formData.append('qualityLevel', request.qualityLevel);
    formData.append('preserveLayout', request.preserveLayout.toString());
    formData.append('optimizeForWeb', request.optimizeForWeb.toString());

    // Add custom settings if provided
    if (request.customSettings) {
      Object.entries(request.customSettings).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(`customSettings[${key}]`, value.toString());
        }
      });
    }

    try {
      const response = await pdfApi.post('/smart-conversion/batch-convert', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 600000, // 10 minutes timeout for batch conversion
      });

      return response.data;
    } catch (error: any) {
      console.error('Batch smart conversion error:', error);
      throw new Error(error.response?.data?.message || 'Failed to perform batch smart conversion');
    }
  },

  // Download converted file
  async downloadConvertedFile(filename: string): Promise<Blob> {
    try {
      const response = await pdfApi.get(`/smart-conversion/download/${filename}`, {
        responseType: 'blob',
        timeout: 120000, // 2 minutes timeout
      });

      return response.data;
    } catch (error: any) {
      console.error('Download error:', error);
      throw new Error(error.response?.data?.message || 'Failed to download converted file');
    }
  },

  // Get conversion presets
  async getConversionPresets(): Promise<ConversionPresetsResponse> {
    try {
      const response = await pdfApi.get('/smart-conversion/presets', {
        timeout: 30000, // 30 seconds timeout
      });

      return response.data;
    } catch (error: any) {
      console.error('Get presets error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get conversion presets');
    }
  },

  // Cleanup old files
  async cleanupOldFiles(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await pdfApi.post('/smart-conversion/cleanup', {}, {
        timeout: 30000, // 30 seconds timeout
      });

      return response.data;
    } catch (error: any) {
      console.error('Cleanup error:', error);
      throw new Error(error.response?.data?.message || 'Failed to cleanup old files');
    }
  },

  // Utility function to download file from blob
  downloadFileFromBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Utility function to format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Utility function to calculate size reduction percentage
  calculateSizeReduction(originalSize: number, newSize: number): number {
    if (originalSize === 0) return 0;
    return Math.round(((originalSize - newSize) / originalSize) * 100);
  },

  // Utility function to get file extension
  getFileExtension(filename: string): string {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  },

  // Utility function to get file type category
  getFileTypeCategory(filename: string): string {
    const extension = this.getFileExtension(filename).toLowerCase();
    
    const categories = {
      document: ['.pdf', '.doc', '.docx', '.rtf', '.odt', '.txt'],
      spreadsheet: ['.xls', '.xlsx', '.ods', '.csv'],
      presentation: ['.ppt', '.pptx', '.odp'],
      image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'],
      vector: ['.svg', '.eps', '.ai'],
      text: ['.txt', '.md', '.rtf']
    };

    for (const [category, extensions] of Object.entries(categories)) {
      if (extensions.includes(extension)) {
        return category;
      }
    }

    return 'unknown';
  },

  // Utility function to validate file for conversion
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/rtf',
      'application/rtf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/svg+xml',
      'application/postscript',
      'application/illustrator'
    ];

    const allowedExtensions = [
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.txt', '.rtf', '.odt', '.ods', '.odp',
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg', '.eps', '.ai'
    ];

    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 100MB limit' };
    }

    const extension = this.getFileExtension(file.name).toLowerCase();
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(extension)) {
      return { valid: false, error: 'Unsupported file type' };
    }

    return { valid: true };
  },

  // Utility function to get conversion time estimate
  getConversionTimeEstimate(fileSize: number, targetFormat: string, qualityLevel: string): string {
    const baseTime = Math.max(10, Math.ceil(fileSize / (1024 * 1024))); // Base time in seconds
    
    let multiplier = 1;
    if (qualityLevel === 'high') multiplier = 1.5;
    if (qualityLevel === 'low') multiplier = 0.7;
    
    if (targetFormat === 'pdf') multiplier *= 0.8;
    if (targetFormat === 'image') multiplier *= 1.2;
    
    const estimatedSeconds = Math.ceil(baseTime * multiplier);
    
    if (estimatedSeconds < 60) {
      return `${estimatedSeconds} seconds`;
    } else {
      const minutes = Math.ceil(estimatedSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  },

  // Utility function to get supported target formats for source format
  getSupportedTargetFormats(sourceFormat: string): string[] {
    const formatMap: { [key: string]: string[] } = {
      'pdf': ['word', 'excel', 'powerpoint', 'html', 'txt', 'image'],
      'word': ['pdf', 'excel'],
      'excel': ['pdf', 'word'],
      'powerpoint': ['pdf'],
      'text': ['pdf'],
      'html': ['pdf'],
      'image': ['pdf'],
      'unknown': ['pdf']
    };

    return formatMap[sourceFormat] || ['pdf'];
  }
};

export default smartConversionService;
