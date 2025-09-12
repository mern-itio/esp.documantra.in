import { pdfApi } from './apiHelper';
import type { 
  OptimizeFontRequest, 
  OptimizeFontResponse, 
  FontOptimizationPreset, 
  FontOptimizationTools,
  FontAnalysisResult 
} from '../types/optimizeFont';

// Optimize Font Service API functions
export const optimizeFontService = {
  // Optimize fonts in PDF
  async optimizeFont(request: OptimizeFontRequest): Promise<OptimizeFontResponse> {
    try {
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('fontSubsetting', request.fontSubsetting.toString());
      formData.append('fontOptimization', request.fontOptimization.toString());
      formData.append('embeddingControl', request.embeddingControl);

      // Add font subsetting options
      if (request.fontSubsettingOptions) {
        Object.entries(request.fontSubsettingOptions).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              formData.append(`fontSubsettingOptions[${key}]`, JSON.stringify(value));
            } else {
              formData.append(`fontSubsettingOptions[${key}]`, value.toString());
            }
          }
        });
      }

      // Add font optimization options
      if (request.fontOptimizationOptions) {
        Object.entries(request.fontOptimizationOptions).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(`fontOptimizationOptions[${key}]`, value.toString());
          }
        });
      }

      // Add embedding control options
      if (request.embeddingControlOptions) {
        Object.entries(request.embeddingControlOptions).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(`embeddingControlOptions[${key}]`, value.toString());
          }
        });
      }

      // Add output format and quality options
      if (request.outputFormat) {
        formData.append('outputFormat', request.outputFormat);
      }
      if (request.quality) {
        formData.append('quality', request.quality);
      }
      if (request.customQuality) {
        Object.entries(request.customQuality).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(`customQuality[${key}]`, value.toString());
          }
        });
      }

      const response = await pdfApi.post('/pdf-optimize-font/optimize-font', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Font optimization failed:', error);
      throw error;
    }
  },

  // Analyze fonts in PDF
  async analyzeFonts(file: File): Promise<FontAnalysisResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await pdfApi.post('/pdf-optimize-font/analyze-fonts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Font analysis failed:', error);
      throw error;
    }
  },

  // Get font optimization presets
  async getFontOptimizationPresets(): Promise<FontOptimizationPreset[]> {
    try {
      const response = await pdfApi.get('/pdf-optimize-font/font-optimization-presets');
      return response.data;
    } catch (error) {
      console.error('Failed to get font optimization presets:', error);
      throw error;
    }
  },

  // Check font optimization tools
  async checkFontOptimizationTools(): Promise<FontOptimizationTools> {
    try {
      const response = await pdfApi.get('/pdf-optimize-font/font-optimization-tools');
      return response.data;
    } catch (error) {
      console.error('Failed to check font optimization tools:', error);
      throw error;
    }
  },

  // Get font optimization recommendations
  async getFontOptimizationRecommendations(file: File): Promise<{
    recommendations: string[];
    estimatedSavings: number;
    priority: 'low' | 'medium' | 'high';
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await pdfApi.post('/pdf-optimize-font/font-optimization-recommendations', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get font optimization recommendations:', error);
      throw error;
    }
  },

  // Preview font optimization results
  async previewFontOptimization(request: OptimizeFontRequest): Promise<{
    estimatedFileSize: number;
    estimatedSizeReduction: number;
    estimatedProcessingTime: number;
    warnings: string[];
    compatibility: {
      web: boolean;
      print: boolean;
      mobile: boolean;
      accessibility: boolean;
    };
  }> {
    try {
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('fontSubsetting', request.fontSubsetting.toString());
      formData.append('fontOptimization', request.fontOptimization.toString());
      formData.append('embeddingControl', request.embeddingControl);

      // Add other options similar to optimizeFont method
      if (request.fontSubsettingOptions) {
        Object.entries(request.fontSubsettingOptions).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              formData.append(`fontSubsettingOptions[${key}]`, JSON.stringify(value));
            } else {
              formData.append(`fontSubsettingOptions[${key}]`, value.toString());
            }
          }
        });
      }

      if (request.fontOptimizationOptions) {
        Object.entries(request.fontOptimizationOptions).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(`fontOptimizationOptions[${key}]`, value.toString());
          }
        });
      }

      if (request.embeddingControlOptions) {
        Object.entries(request.embeddingControlOptions).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(`embeddingControlOptions[${key}]`, value.toString());
          }
        });
      }

      if (request.outputFormat) {
        formData.append('outputFormat', request.outputFormat);
      }
      if (request.quality) {
        formData.append('quality', request.quality);
      }

      const response = await pdfApi.post('/pdf-optimize-font/preview-font-optimization', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Font optimization preview failed:', error);
      throw error;
    }
  },

  // Batch optimize fonts
  async batchOptimizeFonts(files: File[], options: Omit<OptimizeFontRequest, 'file'>): Promise<{
    results: Array<{
      filename: string;
      success: boolean;
      message: string;
      downloadUrl?: string;
      sizeReduction?: number;
      error?: string;
    }>;
    summary: {
      totalFiles: number;
      successfulFiles: number;
      failedFiles: number;
      totalSizeReduction: number;
      averageSizeReduction: number;
    };
  }> {
    try {
      const formData = new FormData();
      
      // Add all files
      files.forEach((file) => {
        formData.append(`files`, file);
      });

      // Add options
      formData.append('fontSubsetting', options.fontSubsetting.toString());
      formData.append('fontOptimization', options.fontOptimization.toString());
      formData.append('embeddingControl', options.embeddingControl);

      // Add other options
      if (options.fontSubsettingOptions) {
        Object.entries(options.fontSubsettingOptions).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              formData.append(`fontSubsettingOptions[${key}]`, JSON.stringify(value));
            } else {
              formData.append(`fontSubsettingOptions[${key}]`, value.toString());
            }
          }
        });
      }

      if (options.fontOptimizationOptions) {
        Object.entries(options.fontOptimizationOptions).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(`fontOptimizationOptions[${key}]`, value.toString());
          }
        });
      }

      if (options.embeddingControlOptions) {
        Object.entries(options.embeddingControlOptions).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(`embeddingControlOptions[${key}]`, value.toString());
          }
        });
      }

      if (options.outputFormat) {
        formData.append('outputFormat', options.outputFormat);
      }
      if (options.quality) {
        formData.append('quality', options.quality);
      }

      const response = await pdfApi.post('/pdf-optimize-font/batch-optimize-fonts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Batch font optimization failed:', error);
      throw error;
    }
  }
};
