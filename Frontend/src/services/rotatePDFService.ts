import { pdfApi } from './apiHelper';
import { pdfService } from './pdfService';
import type { RotatePDFRequest, RotatePDFResponse } from '../types/rotatePDF';
import type { PDFInfo } from '../types/common';

export const rotatePDFService = {
  async rotatePDF(request: RotatePDFRequest): Promise<RotatePDFResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('rotations', JSON.stringify(request.rotations));

    const response = await pdfApi.post('/pdf-rotate/rotate-pages', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  async getPDFInfo(file: File): Promise<PDFInfo> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await pdfApi.post('/pdf-rotate/info', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  async downloadRotatedPDF(filePath: string, filename: string): Promise<void> {
    try {
      await pdfService.downloadFile(filePath, filename);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error('Failed to download file');
    }
  },
};
