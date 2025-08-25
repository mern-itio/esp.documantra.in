import { pdfApi } from './apiHelper';
import { pdfService } from './pdfService';
import type { CropPDFRequest, CropPDFResponse } from '../types/cropPDF';
import type { PDFInfo } from '../types/common';

export const cropPDFService = {
  async cropPDF(request: CropPDFRequest): Promise<CropPDFResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    
    // Transform the crop data to match backend expectations
    const flattenedCrops = request.crops.map(crop => ({
      page: crop.page,
      x: crop.cropArea.x,
      y: crop.cropArea.y,
      width: crop.cropArea.width,
      height: crop.cropArea.height
    }));
    
    formData.append('crops', JSON.stringify(flattenedCrops));

    const response = await pdfApi.post('/pdf-crop/crop-pages', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  async getPDFInfo(file: File): Promise<PDFInfo> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await pdfApi.post('/pdf-crop/info', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  async downloadCroppedPDF(filePath: string, filename: string): Promise<void> {
    try {
      await pdfService.downloadFile(filePath, filename);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error('Failed to download file');
    }
  },
};
