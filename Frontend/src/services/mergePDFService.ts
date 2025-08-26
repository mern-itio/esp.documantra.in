import { pdfApi } from './apiHelper';
import type { PDFInfo } from '../types/common';

export interface MergePDFRequest {
  files: File[];
  orderedFilenames: string[];
  options?: {
    addBookmarks?: boolean;
    optimizeSize?: boolean;
    pageRanges?: string[];
  };
}

export interface MergePDFResponse {
  success: boolean;
  mergedFile?: {
    filename: string;
    size: number;
    pages: number;
    downloadUrl: string;
  };
  error?: string;
}

export const mergePDFService = {
  /**
   * Merge multiple PDF files into one document
   */
  async mergePDFs(request: MergePDFRequest): Promise<MergePDFResponse> {
    try {
      const formData = new FormData();
      
      // Add files
      request.files.forEach((file) => {
        formData.append('files', file);
      });
      
      // Add ordered filenames
      formData.append('orderedFilenames', JSON.stringify(request.orderedFilenames));
      
      // Add options if provided
      if (request.options) {
        formData.append('options', JSON.stringify(request.options));
      }

      const response = await pdfApi.post('/pdf-service/merge', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob', // Expect binary response
      });

      if (response.status === 200) {
        // Create a download link for the merged file
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        
        // Get file info from response headers if available
        const filename = response.headers['content-disposition']?.split('filename=')[1]?.replace(/"/g, '') || 'merged-document.pdf';
        const size = blob.size;
        
        return {
          success: true,
          mergedFile: {
            filename,
            size,
            pages: 0, // Page count would need to be determined client-side or from backend
            downloadUrl
          }
        };
      } else {
        throw new Error('Failed to merge PDFs');
      }
    } catch (error: any) {
      console.error('Error merging PDFs:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to merge PDFs'
      };
    }
  },

  /**
   * Get PDF file information (page count, size, etc.)
   */
  async getPDFInfo(file: File): Promise<PDFInfo> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await pdfApi.post('/pdf-service/info', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        return {
          pages: response.data.pages || 0,
          size: file.size,
          isValid: response.data.isValid || false
        };
      } else {
        throw new Error('Failed to get PDF info');
      }
    } catch (error: any) {
      console.error('Error getting PDF info:', error);
      // Return fallback info
      return {
        pages: 0,
        size: file.size,
        isValid: false
      };
    }
  },

  /**
   * Validate PDF file
   */
  async validatePDF(file: File): Promise<{ isValid: boolean; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await pdfApi.post('/pdf-service/validate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        return {
          isValid: response.data.isValid || false,
          error: response.data.error
        };
      } else {
        throw new Error('Failed to validate PDF');
      }
    } catch (error: any) {
      console.error('Error validating PDF:', error);
      return {
        isValid: false,
        error: 'Failed to validate PDF file'
      };
    }
  },

  /**
   * Download merged PDF file
   */
  downloadMergedPDF(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
