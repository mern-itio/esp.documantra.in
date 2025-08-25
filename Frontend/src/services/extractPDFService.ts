import { pdfApi } from './apiHelper';
import type { 
  ExtractPagesRequest, 
  ExtractRangeRequest, 
  ExtractCustomRequest, 
  ExtractPDFResponse
} from '../types/extractPDF';
import type { PDFInfo } from '../types/common';

export const extractPDFService = {
  /**
   * Extract specific pages from a PDF file
   */
  async extractPages(request: ExtractPagesRequest): Promise<ExtractPDFResponse> {
    try {
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('pageNumbers', JSON.stringify(request.pageNumbers));
      
      if (request.outputName) {
        formData.append('outputName', request.outputName);
      }

      const response = await pdfApi.post('/pdf-extract/extract-pages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error('Failed to extract PDF pages');
      }
    } catch (error: any) {
      console.error('Error extracting PDF pages:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to extract PDF pages'
      };
    }
  },

  /**
   * Extract a range of pages from a PDF file
   */
  async extractRange(request: ExtractRangeRequest): Promise<ExtractPDFResponse> {
    try {
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('startPage', request.startPage.toString());
      formData.append('endPage', request.endPage.toString());
      
      if (request.outputName) {
        formData.append('outputName', request.outputName);
      }

      const response = await pdfApi.post('/pdf-extract/extract-range', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error('Failed to extract PDF page range');
      }
    } catch (error: any) {
      console.error('Error extracting PDF page range:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to extract PDF page range'
      };
    }
  },

  /**
   * Extract pages based on custom selection
   */
  async extractCustom(request: ExtractCustomRequest): Promise<ExtractPDFResponse> {
    try {
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('selections', JSON.stringify(request.selections));
      
      if (request.outputName) {
        formData.append('outputName', request.outputName);
      }

      const response = await pdfApi.post('/pdf-extract/extract-custom', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error('Failed to extract PDF custom selection');
      }
    } catch (error: any) {
      console.error('Error extracting PDF custom selection:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to extract PDF custom selection'
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

      const response = await pdfApi.post('/pdf-extract/info', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error('Failed to get PDF info');
      }
    } catch (error: any) {
      console.error('Error getting PDF info:', error);
      return { pages: 0, size: file.size, isValid: false };
    }
  },

  /**
   * Download an extracted PDF file
   */
  async downloadExtractedPDF(filename: string): Promise<void> {
    try {
      const response = await pdfApi.get(`/outputs/${filename}`, {
        responseType: 'blob',
      });

      if (response.status === 200) {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading extracted PDF:', error);
      throw error;
    }
  },
};
