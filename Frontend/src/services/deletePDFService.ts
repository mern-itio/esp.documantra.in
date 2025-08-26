import { pdfApi } from './apiHelper';
import { pdfService } from './pdfService';
import type { DeletePDFRequest, DeletePDFResponse } from '../types/deletePDF';
import type { PDFInfo } from '../types/common';

export const deletePDFService = {
  async deletePDF(request: DeletePDFRequest): Promise<DeletePDFResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('pages', JSON.stringify(request.pagesToDelete));

    const response = await pdfApi.post('/pdf-delete/delete-pages', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  async getPDFInfo(file: File): Promise<PDFInfo> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await pdfApi.post('/pdf-delete/info', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  async downloadDeletedPDF(filePath: string, filename: string): Promise<void> {
    try {
      await pdfService.downloadFile(filePath, filename);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error('Failed to download file');
    }
  },
};
