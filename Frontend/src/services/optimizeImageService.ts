import axios from 'axios';
import type { OptimizeImageRequest, OptimizeImageResponse, OptimizationTools } from '../types/optimizeImage';
import { pdfApi } from './apiHelper';

export const optimizeImageService = {
  async optimizeImage(request: OptimizeImageRequest): Promise<OptimizeImageResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    
    if (request.imageQuality !== undefined) {
      formData.append('imageQuality', request.imageQuality.toString());
    }
    if (request.maxResolution !== undefined) {
      formData.append('maxResolution', request.maxResolution.toString());
    }
    if (request.compressionLevel !== undefined) {
      formData.append('compressionLevel', request.compressionLevel);
    }
    if (request.formatConversion !== undefined) {
      formData.append('formatConversion', request.formatConversion);
    }
    if (request.downscaleImages !== undefined) {
      formData.append('downscaleImages', request.downscaleImages.toString());
    }
    if (request.removeMetadata !== undefined) {
      formData.append('removeMetadata', request.removeMetadata.toString());
    }
    if (request.optimizeForWeb !== undefined) {
      formData.append('optimizeForWeb', request.optimizeForWeb.toString());
    }
    if (request.customSettings) {
      if (request.customSettings.imageQuality !== undefined) {
        formData.append('customSettings[imageQuality]', request.customSettings.imageQuality.toString());
      }
      if (request.customSettings.maxResolution !== undefined) {
        formData.append('customSettings[maxResolution]', request.customSettings.maxResolution.toString());
      }
      if (request.customSettings.formatConversion !== undefined) {
        formData.append('customSettings[formatConversion]', request.customSettings.formatConversion);
      }
    }

    try {
      const response = await pdfApi.post('/pdf-optimize-image/optimize', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes timeout for large files
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.details || error.message);
      }
      throw error;
    }
  },

  async checkOptimizationTools(): Promise<OptimizationTools> {
    try {
      const response = await pdfApi.get('/pdf-optimize-image/tools');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.details || error.message);
      }
      throw error;
    }
  },

  async downloadFile(filename: string): Promise<void> {
    try {
      const response = await pdfApi.get(`/pdf-optimize-image/download/${filename}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.details || error.message);
      }
      throw error;
    }
  },

  getOptimizationPresets() {
    return [
      {
        id: 'web',
        name: 'Web Optimized',
        description: 'Best for web sharing and email',
        imageQuality: 72,
        maxResolution: 72,
        compressionLevel: 'high' as const,
        formatConversion: 'auto' as const,
        downscaleImages: true,
        removeMetadata: true,
        optimizeForWeb: true,
        estimatedReduction: '70-85%',
        useCase: 'Web sharing, email, online storage'
      },
      {
        id: 'print',
        name: 'Print Quality',
        description: 'Maintains print quality',
        imageQuality: 95,
        maxResolution: 300,
        compressionLevel: 'low' as const,
        formatConversion: 'auto' as const,
        downscaleImages: false,
        removeMetadata: false,
        optimizeForWeb: false,
        estimatedReduction: '20-40%',
        useCase: 'Printing, archiving, high quality'
      },
      {
        id: 'mobile',
        name: 'Mobile Friendly',
        description: 'Optimized for mobile devices',
        imageQuality: 80,
        maxResolution: 150,
        compressionLevel: 'medium' as const,
        formatConversion: 'jpeg' as const,
        downscaleImages: true,
        removeMetadata: true,
        optimizeForWeb: true,
        estimatedReduction: '50-70%',
        useCase: 'Mobile apps, tablets, smartphones'
      },
      {
        id: 'archive',
        name: 'Archive',
        description: 'Maximum compression for storage',
        imageQuality: 60,
        maxResolution: 150,
        compressionLevel: 'high' as const,
        formatConversion: 'jpeg' as const,
        downscaleImages: true,
        removeMetadata: true,
        optimizeForWeb: true,
        estimatedReduction: '75-90%',
        useCase: 'Long-term storage, backup, cloud'
      }
    ];
  }
};
