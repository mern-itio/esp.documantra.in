import { pdfApi } from './apiHelper';
import type { SplitPDFRequest, SplitPDFResponse } from '../types/splitPDF';
import type { PDFInfo } from '../types/common';

export const splitPDFService = {
  /**
   * Split a PDF file according to the specified mode
   */
  async splitPDF(request: SplitPDFRequest): Promise<SplitPDFResponse> {
    try {
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('mode', request.mode);
      
      if (request.pagesPerSplit) {
        formData.append('pagesPerSplit', request.pagesPerSplit.toString());
      }
      
      if (request.maxSizeMB) {
        formData.append('maxSizeMB', request.maxSizeMB.toString());
      }
      
      if (request.customRanges) {
        formData.append('customRanges', JSON.stringify(request.customRanges));
      }

      const response = await pdfApi.post('/pdf-split/split', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error('Failed to split PDF');
      }
    } catch (error: any) {
      console.error('Error splitting PDF:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to split PDF'
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

      const response = await pdfApi.post('/pdf-split/info', formData, {
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
   * Download a split PDF file
   */
  async downloadSplitPDF(filename: string): Promise<void> {
    try {
      const response = await pdfApi.get(`/outputs/${filename}`,  {
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
      console.error('Error downloading split PDF:', error);
      throw error;
    }
  },

  /**
   * Download ZIP file containing all split PDFs
   */
  async downloadZipFile(zipFile: { filename: string; downloadUrl: string }): Promise<void> {
    try {
      console.log('Downloading ZIP file:', zipFile);
      console.log('Download URL:', zipFile.downloadUrl);
      
      const response = await pdfApi.get(zipFile.downloadUrl, {
        responseType: 'blob',
      });

      console.log('Response status:', response.status);
      console.log('Response data type:', typeof response.data);
      console.log('Response data size:', response.data?.size);

      if (response.status === 200) {
        const blob = new Blob([response.data], { type: 'application/zip' });
        console.log('Created blob:', blob.size, 'bytes');
        
        const url = URL.createObjectURL(blob);
        console.log('Created object URL:', url);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = zipFile.filename;
        console.log('Created download link:', a.href, 'filename:', a.download);
        
        document.body.appendChild(a);
        console.log('Triggering download...');
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('Download triggered successfully');
      } else {
        console.error('Unexpected response status:', response.status);
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error downloading ZIP file:', error);
      throw error;
    }
  },

  /**
   * Download all split PDF files as a zip (legacy method for backward compatibility)
   */
  async downloadAllSplitPDFs(files: Array<{ filename: string; path: string }>): Promise<void> {
    try {
      // For now, we'll download files individually
      // In the future, we could implement a zip download endpoint
      for (const file of files) {
        await this.downloadSplitPDF(file.filename);
        // Add a small delay to prevent browser blocking multiple downloads
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Error downloading all split PDFs:', error);
      throw error;
    }
  }
};
