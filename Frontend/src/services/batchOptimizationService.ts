import axios from 'axios';
import type { 
  BatchOptimizationRequest, 
  BatchOptimizationResponse, 
  OptimizationPreset, 
  OptimizationTools 
} from '../types/batchOptimization';
import { pdfApi } from './apiHelper';

export const batchOptimizationService = {
  async batchOptimize(request: BatchOptimizationRequest): Promise<BatchOptimizationResponse> {
    const formData = new FormData();
    
    // Add files
    request.files.forEach((file) => {
      formData.append('files', file);
    });
    
    // Add optimization settings
    formData.append('preset', request.preset);
    
    if (request.optimizationProfile) {
      formData.append('optimizationProfile', request.optimizationProfile);
    }
    
    if (request.customSettings) {
      Object.entries(request.customSettings).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(`customSettings[${key}]`, value.toString());
        }
      });
    }

    try {
      const response = await pdfApi.post('/pdf-batch-optimization/optimize', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 600000, // 10 minutes timeout for batch operations
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.details || error.message);
      }
      throw error;
    }
  },

  async getOptimizationPresets(): Promise<OptimizationPreset[]> {
    try {
      const response = await pdfApi.get('/pdf-batch-optimization/presets');
      return response.data.presets;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.details || error.message);
      }
      throw error;
    }
  },

  async checkOptimizationTools(): Promise<OptimizationTools> {
    try {
      const response = await pdfApi.get('/pdf-batch-optimization/tools');
      return response.data.tools;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.details || error.message);
      }
      throw error;
    }
  },

  async downloadFile(filename: string): Promise<void> {
    try {
      const response = await pdfApi.get(`/pdf-batch-optimization/download/${filename}`, {
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

  // Helper method to format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Helper method to calculate compression ratio
  calculateCompressionRatio(originalSize: number, optimizedSize: number): string {
    if (originalSize === 0) return '0%';
    const reduction = ((originalSize - optimizedSize) / originalSize) * 100;
    return reduction.toFixed(1) + '%';
  },

  // Helper method to get preset by ID
  getPresetById(presets: OptimizationPreset[], id: string): OptimizationPreset | undefined {
    return presets.find(preset => preset.id === id);
  },

  // Helper method to validate files
  validateFiles(files: File[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (files.length === 0) {
      errors.push('Please select at least one PDF file');
      return { valid: false, errors };
    }
    
    if (files.length > 10) {
      errors.push('Maximum 10 files allowed for batch processing');
      return { valid: false, errors };
    }
    
    for (const file of files) {
      if (file.type !== 'application/pdf') {
        errors.push(`${file.name} is not a PDF file`);
      }
      
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        errors.push(`${file.name} exceeds 100MB size limit`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
};
