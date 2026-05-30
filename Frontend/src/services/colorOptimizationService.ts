
import { pdfApi } from './apiHelper';
import type {
  ColorOptimizationRequest,
  ColorOptimizationResponse,
  ColorAnalysis,
  ColorOptimizationPresetsResponse,
  ColorOptimizationToolsResponse,
  ColorOptimizationRecommendationsResponse,
  ColorOptimizationPreviewResponse,
  BatchColorOptimizationRequest,
  BatchColorOptimizationResponse
} from '../types/colorOptimization';

const API_BASE_URL = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';

export const colorOptimizationService = {
  // Main color optimization endpoint
  async optimizeColors(data: ColorOptimizationRequest): Promise<ColorOptimizationResponse> {
    const formData = new FormData();
    formData.append('file', data.file);
    
    if (data.colorConversion !== undefined) {
      formData.append('colorConversion', data.colorConversion.toString());
    }
    if (data.profileOptimization !== undefined) {
      formData.append('profileOptimization', data.profileOptimization.toString());
    }
    if (data.gamutMapping !== undefined) {
      formData.append('gamutMapping', data.gamutMapping.toString());
    }
    if (data.targetColorSpace) {
      formData.append('targetColorSpace', data.targetColorSpace);
    }
    if (data.preserveTransparency !== undefined) {
      formData.append('preserveTransparency', data.preserveTransparency.toString());
    }
    if (data.dithering !== undefined) {
      formData.append('dithering', data.dithering.toString());
    }
    if (data.quality) {
      formData.append('quality', data.quality);
    }
    if (data.outputFormat) {
      formData.append('outputFormat', data.outputFormat);
    }

    const response = await pdfApi.post(`/pdf-color-optimization/optimize`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // PDF color analysis endpoint
  async analyzeColors(file: File): Promise<{ success: boolean; filename: string; analysis: ColorAnalysis }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await pdfApi.post(`/pdf-color-optimization/analyze`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Get color optimization presets
  async getPresets(): Promise<ColorOptimizationPresetsResponse> {
    const response = await pdfApi.get(`/pdf-color-optimization/presets`);
    return response.data;
  },

  // Check available tools
  async checkTools(): Promise<ColorOptimizationToolsResponse> {
    const response = await pdfApi.get(`/pdf-color-optimization/tools`);
    return response.data;
  },

  // Get optimization recommendations
  async getRecommendations(file: File): Promise<ColorOptimizationRecommendationsResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await pdfApi.post(`/pdf-color-optimization/recommendations`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Preview color optimization
  async previewColorOptimization(file: File, settings: Partial<ColorOptimizationRequest>): Promise<ColorOptimizationPreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.entries(settings).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    const response = await pdfApi.post(`/pdf-color-optimization/preview`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Batch color optimization
  async batchColorOptimization(data: BatchColorOptimizationRequest): Promise<BatchColorOptimizationResponse> {
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

    const response = await pdfApi.post(`/pdf-color-optimization/batch`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Download color optimized PDF
  downloadColorOptimizedPDF(filename: string): void {
    const downloadUrl = `${API_BASE_URL}/pdf-color-optimization/download/${filename}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

// Helper functions for UI
export const colorOptimizationHelpers = {
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

  // Get quality level color
  getQualityLevelColor(level: string): string {
    switch (level) {
      case 'low':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-green-600';
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

  // Get estimated savings improvement
  getEstimatedSavings(originalSavings: string, newSavings: string): string {
    const original = parseFloat(originalSavings.replace('%', ''));
    const improved = parseFloat(newSavings.replace('%', ''));
    const improvement = improved - original;
    return improvement > 0 ? `+${improvement.toFixed(1)}% better` : 'No improvement';
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
      web_optimized: 'Optimized for web viewing with sRGB color space',
      print_ready: 'Optimized for professional printing with CMYK color space',
      high_compression: 'Maximum file size reduction with balanced quality',
      quality_preserved: 'Maintains maximum quality with minimal optimization'
    };
    return descriptions[presetId] || 'Custom color optimization settings';
  },

  // Get quality level description
  getQualityLevelDescription(level: string): string {
    const descriptions: Record<string, string> = {
      low: 'Fastest processing, larger file size',
      medium: 'Balanced processing and file size',
      high: 'Slowest processing, smallest file size'
    };
    return descriptions[level] || 'Custom quality level';
  },

  // Get color space description
  getColorSpaceDescription(colorSpace: string): string {
    const descriptions: Record<string, string> = {
      rgb: 'RGB color space - ideal for web and screen viewing',
      cmyk: 'CMYK color space - ideal for professional printing',
      grayscale: 'Grayscale - removes all color information',
      auto: 'Automatic detection and optimization'
    };
    return descriptions[colorSpace] || 'Custom color space';
  }
};
