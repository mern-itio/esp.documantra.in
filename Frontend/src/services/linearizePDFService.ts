
import { pdfApi } from './apiHelper';
import type {
  LinearizePDFRequest,
  LinearizePDFResponse,
  PDFAnalysis,
  LinearizationPresetsResponse,
  LinearizationToolsResponse,
  LinearizationRecommendationsResponse,
  LinearizationPreviewResponse,
  BatchLinearizationRequest,
  BatchLinearizationResponse
} from '../types/linearizePDF';

const API_BASE_URL = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';

export const linearizePDFService = {
  // Main linearization endpoint
  async linearizePDF(data: LinearizePDFRequest): Promise<LinearizePDFResponse> {
    const formData = new FormData();
    formData.append('file', data.file);
    
    if (data.webOptimization !== undefined) {
      formData.append('webOptimization', data.webOptimization.toString());
    }
    if (data.fastLoading !== undefined) {
      formData.append('fastLoading', data.fastLoading.toString());
    }
    if (data.streamingSupport !== undefined) {
      formData.append('streamingSupport', data.streamingSupport.toString());
    }
    if (data.compressionLevel) {
      formData.append('compressionLevel', data.compressionLevel);
    }
    if (data.objectStreams) {
      formData.append('objectStreams', data.objectStreams);
    }
    if (data.preserveMetadata !== undefined) {
      formData.append('preserveMetadata', data.preserveMetadata.toString());
    }
    if (data.preserveAnnotations !== undefined) {
      formData.append('preserveAnnotations', data.preserveAnnotations.toString());
    }
    if (data.preserveBookmarks !== undefined) {
      formData.append('preserveBookmarks', data.preserveBookmarks.toString());
    }
    if (data.outputFormat) {
      formData.append('outputFormat', data.outputFormat);
    }
    if (data.quality) {
      formData.append('quality', data.quality);
    }

    const response = await pdfApi.post(`/pdf-linearize/linearize`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // PDF analysis endpoint
  async analyzePDF(file: File): Promise<{ success: boolean; filename: string; analysis: PDFAnalysis }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await pdfApi.post(`/pdf-linearize/analyze`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Get linearization presets
  async getPresets(): Promise<LinearizationPresetsResponse> {
    const response = await pdfApi.get(`/pdf-linearize/presets`);
    return response.data;
  },

  // Check available tools
  async checkTools(): Promise<LinearizationToolsResponse> {
    const response = await pdfApi.get(`/pdf-linearize/tools`);
    return response.data;
  },

  // Get optimization recommendations
  async getRecommendations(file: File): Promise<LinearizationRecommendationsResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await pdfApi.post(`/pdf-linearize/recommendations`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Preview linearization
  async previewLinearization(file: File, settings: Partial<LinearizePDFRequest>): Promise<LinearizationPreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.entries(settings).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    const response = await pdfApi.post(`/pdf-linearize/preview`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Batch linearization
  async batchLinearization(data: BatchLinearizationRequest): Promise<BatchLinearizationResponse> {
    const formData = new FormData();
    
    data.files.forEach((file) => {
      formData.append('files', file);
    });
    
    if (data.preset) {
      formData.append('preset', data.preset);
    }
    
    if (data.customSettings) {
      Object.entries(data.customSettings).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });
    }

    const response = await pdfApi.post(`/pdf-linearize/batch`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Download linearized PDF
  downloadLinearizedPDF(filename: string): void {
    const downloadUrl = `${API_BASE_URL}/pdf-linearize/download/${filename}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

// Helper functions for UI
export const linearizePDFHelpers = {
  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Calculate size reduction percentage
  calculateSizeReduction(originalSize: number, newSize: number): string {
    const reduction = ((originalSize - newSize) / originalSize) * 100;
    return reduction.toFixed(2);
  },

  // Get compression level color
  getCompressionLevelColor(level: string): string {
    switch (level) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  },

  // Get optimization level badge color
  getOptimizationLevelColor(level: string): string {
    switch (level) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  },

  // Get recommendation priority color
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-[#F5F2EE]';
    }
  },

  // Format processing time
  formatProcessingTime(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(1)}s`;
    } else {
      return `${(milliseconds / 60000).toFixed(1)}m`;
    }
  },

  // Get estimated load time improvement
  getLoadTimeImprovement(originalTime: string, newTime: string): string {
    const original = parseFloat(originalTime.replace('s', ''));
    const improved = parseFloat(newTime.replace('s', ''));
    const improvement = ((original - improved) / original) * 100;
    return improvement > 0 ? `${improvement.toFixed(1)}% faster` : 'No improvement';
  },

  // Validate file size
  validateFileSize(file: File, maxSizeMB: number = 100): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  },

  // Get file type validation error
  getFileValidationError(file: File): string | null {
    if (file.type !== 'application/pdf') {
      return 'Only PDF files are allowed';
    }
    
    if (!this.validateFileSize(file)) {
      return 'File size must be less than 100MB';
    }
    
    return null;
  },

  // Get preset description
  getPresetDescription(presetId: string): string {
    const descriptions: Record<string, string> = {
      web_optimized: 'Best for web viewing with balanced optimization',
      fast_loading: 'Prioritizes loading speed over file size',
      streaming_ready: 'Optimized for progressive loading and streaming',
      custom: 'Configure your own settings'
    };
    return descriptions[presetId] || 'Custom optimization settings';
  },

  // Get compression level description
  getCompressionLevelDescription(level: string): string {
    const descriptions: Record<string, string> = {
      low: 'Fastest processing, larger file size',
      medium: 'Balanced processing and file size',
      high: 'Slowest processing, smallest file size'
    };
    return descriptions[level] || 'Custom compression level';
  }
};
