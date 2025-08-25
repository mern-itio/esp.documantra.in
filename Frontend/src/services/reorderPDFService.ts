import { pdfApi } from './apiHelper';
import { pdfService } from './pdfService';
import type { ReorderPDFRequest, ReorderPDFResponse } from '../types/reorderPDF';
import type { PDFInfo } from '../types/common';

export const reorderPDFService = {
  async reorderPDF(request: ReorderPDFRequest): Promise<ReorderPDFResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('order', JSON.stringify(request.order));

    const response = await pdfApi.post('/pdf-reorder/reorder-pages', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  async getPDFInfo(file: File): Promise<PDFInfo> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await pdfApi.post('/pdf-reorder/info', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  async downloadReorderedPDF(filePath: string, filename: string): Promise<void> {
    try {
      await pdfService.downloadFile(filePath, filename);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error('Failed to download file');
    }
  },
};
