import { pdfApi } from './apiHelper';
import { pdfService } from './pdfService';
import type { InsertPDFRequest, InsertPDFResponse } from '../types/insertPDF';
import type { PDFInfo } from '../types/common';

export const insertPDFService = {
  /**
   * Insert pages into a PDF document
   */
  async insertPDF(request: InsertPDFRequest): Promise<InsertPDFResponse> {
    try {
      const formData = new FormData();
      
      // Add main document
      formData.append('mainDocument', request.mainDocument);
      
      // Add source documents if any
      if (request.sourceDocuments) {
        request.sourceDocuments.forEach((file) => {
          formData.append('sourceDocuments', file);
        });
      }
      
      // Add insertions as JSON string
      formData.append('insertions', JSON.stringify(request.insertions));
      
      const response = await pdfApi.post('/pdf-insert/insert-pages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error inserting PDF pages:', error);
      throw new Error('Failed to insert PDF pages');
    }
  },

  /**
   * Reorder pages from a single PDF document
   */
  async reorderPDF(document: File, pageOrder: number[]): Promise<InsertPDFResponse> {
    try {
      const formData = new FormData();
      formData.append('document', document);
      formData.append('pageOrder', JSON.stringify(pageOrder));
      
      const response = await pdfApi.post('/pdf-insert/reorder-pages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error reordering PDF pages:', error);
      throw new Error('Failed to reorder PDF pages');
    }
  },

  /**
   * Get PDF information
   */
  async getPDFInfo(file: File): Promise<PDFInfo> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await pdfApi.post('/pdf-insert/info', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting PDF info:', error);
      throw new Error('Failed to get PDF information');
    }
  },

  /**
   * Download the processed PDF
   */
  async downloadInsertedPDF(downloadUrl: string, filename: string): Promise<void> {
    try {
      await pdfService.downloadFile(downloadUrl, filename);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error('Failed to download file');
    }
  },

  /**
   * Test the service connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await pdfApi.get('/pdf-insert/test');
      return response.data.success;
    } catch (error) {
      console.error('Error testing connection:', error);
      return false;
    }
  }
};
