import axios from 'axios';
import type { CompressPDFRequest, CompressPDFResponse, CompressionTools } from '../types/compressPDF';
import { pdfApi } from './apiHelper';


export const compressPDFService = {
  async compressPDF(request: CompressPDFRequest): Promise<CompressPDFResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('compressionLevel', request.compressionLevel);
    
    if (request.imageQuality !== undefined) {
      formData.append('imageQuality', request.imageQuality.toString());
    }
    if (request.downscaleImages !== undefined) {
      formData.append('downscaleImages', request.downscaleImages.toString());
    }
    if (request.maxImageResolution !== undefined) {
      formData.append('maxImageResolution', request.maxImageResolution.toString());
    }
    if (request.removeMetadata !== undefined) {
      formData.append('removeMetadata', request.removeMetadata.toString());
    }
    if (request.linearize !== undefined) {
      formData.append('linearize', request.linearize.toString());
    }
    if (request.objectStreams !== undefined) {
      formData.append('objectStreams', request.objectStreams);
    }
    if (request.compressionMethod !== undefined) {
      formData.append('compressionMethod', request.compressionMethod);
    }
    if (request.customSettings) {
      if (request.customSettings.compressionLevel !== undefined) {
        formData.append('customSettings[compressionLevel]', request.customSettings.compressionLevel.toString());
      }
      if (request.customSettings.imageQuality !== undefined) {
        formData.append('customSettings[imageQuality]', request.customSettings.imageQuality.toString());
      }
      if (request.customSettings.objectStreams !== undefined) {
        formData.append('customSettings[objectStreams]', request.customSettings.objectStreams);
      }
    }

    try {
      const response = await pdfApi.post('/pdf-compress/compress', formData, {
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

  async checkCompressionTools(): Promise<CompressionTools> {
    try {
      const response = await pdfApi.get('/pdf-compress/tools');
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
      const response = await pdfApi.get(`/pdf-compress/download/${filename}`, {
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

  getCompressionPresets() {
    return [
      {
        id: 'web',
        name: 'Web Optimized',
        description: 'Best for web sharing and email',
        compressionLevel: 'high' as const,
        imageQuality: 72,
        downscaleImages: true,
        maxImageResolution: 72,
        removeMetadata: true,
        linearize: true,
        objectStreams: 'generate' as const,
        compressionMethod: 'auto' as const,
        estimatedReduction: '60-80%',
        useCase: 'Web sharing, email, online storage'
      },
      {
        id: 'email',
        name: 'Email Friendly',
        description: 'Balanced compression for email',
        compressionLevel: 'medium' as const,
        imageQuality: 85,
        downscaleImages: true,
        maxImageResolution: 150,
        removeMetadata: true,
        linearize: true,
        objectStreams: 'generate' as const,
        compressionMethod: 'auto' as const,
        estimatedReduction: '40-60%',
        useCase: 'Email attachments, general sharing'
      },
      {
        id: 'print',
        name: 'Print Quality',
        description: 'Maintains print quality',
        compressionLevel: 'low' as const,
        imageQuality: 95,
        downscaleImages: false,
        maxImageResolution: 300,
        removeMetadata: false,
        linearize: true,
        objectStreams: 'preserve' as const,
        compressionMethod: 'auto' as const,
        estimatedReduction: '20-40%',
        useCase: 'Printing, archiving, high quality'
      },
      {
        id: 'archive',
        name: 'Archive',
        description: 'Maximum compression for storage',
        compressionLevel: 'high' as const,
        imageQuality: 60,
        downscaleImages: true,
        maxImageResolution: 150,
        removeMetadata: true,
        linearize: true,
        objectStreams: 'generate' as const,
        compressionMethod: 'jpeg' as const,
        estimatedReduction: '70-90%',
        useCase: 'Long-term storage, backup'
      }
    ];
  }
};
