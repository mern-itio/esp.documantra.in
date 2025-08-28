import axios from 'axios';
import { pdfApi } from './apiHelper';
import type {
  RemoveUnusedObjectsRequest,
  RemoveUnusedObjectsResponse,
  ObjectAnalysis,
  CleanupRecommendationsResponse,
  CleanupPreviewResponse,
  BatchCleanupRequest,
  BatchCleanupResponse,
  CleanupPresetsResponse,
  CleanupToolsResponse
} from '../types/removeUnusedObjects';

class RemoveUnusedObjectsService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';
  }

  async removeUnusedObjects(request: RemoveUnusedObjectsRequest): Promise<RemoveUnusedObjectsResponse> {
    const formData = new FormData();
    formData.append('file', request.file);

    // Add boolean options
    if (request.objectAnalysis !== undefined) {
      formData.append('objectAnalysis', request.objectAnalysis.toString());
    }
    if (request.resourceCleanup !== undefined) {
      formData.append('resourceCleanup', request.resourceCleanup.toString());
    }
    if (request.structureOptimization !== undefined) {
      formData.append('structureOptimization', request.structureOptimization.toString());
    }
    if (request.aggressiveCleanup !== undefined) {
      formData.append('aggressiveCleanup', request.aggressiveCleanup.toString());
    }
    if (request.preserveMetadata !== undefined) {
      formData.append('preserveMetadata', request.preserveMetadata.toString());
    }
    if (request.preserveAnnotations !== undefined) {
      formData.append('preserveAnnotations', request.preserveAnnotations.toString());
    }
    if (request.preserveBookmarks !== undefined) {
      formData.append('preserveBookmarks', request.preserveBookmarks.toString());
    }

    // Add string options
    if (request.outputFormat) {
      formData.append('outputFormat', request.outputFormat);
    }
    if (request.quality) {
      formData.append('quality', request.quality);
    }

    const response = await pdfApi.post(`/pdf-remove-unused-objects/remove-unused-objects`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Construct full URL for download
    const downloadUrl = response.data.downloadUrl.startsWith('http') 
      ? response.data.downloadUrl 
      : `${this.baseURL}${response.data.downloadUrl}`;

    return {
      ...response.data,
      downloadUrl
    };
  }

  async analyzeObjects(file: File): Promise<{ success: boolean; filename: string; analysis: ObjectAnalysis }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await pdfApi.post(`/pdf-remove-unused-objects/analyze-objects`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async getCleanupPresets(): Promise<CleanupPresetsResponse> {
    try {
      const response = await pdfApi.get(`/pdf-remove-unused-objects/cleanup-presets`);
      return response.data;
    } catch (error) {
      console.error('Failed to get cleanup presets:', error);
      throw error;
    }
  }

  async checkCleanupTools(): Promise<CleanupToolsResponse> {
    try {
      const response = await pdfApi.get(`/pdf-remove-unused-objects/cleanup-tools`);
      return response.data;
    } catch (error) {
      console.error('Failed to check cleanup tools:', error);
      throw error;
    }
  }

  async getCleanupRecommendations(file: File): Promise<CleanupRecommendationsResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await pdfApi.post(`/pdf-remove-unused-objects/cleanup-recommendations`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get cleanup recommendations:', error);
      throw error;
    }
  }

  async previewCleanup(request: RemoveUnusedObjectsRequest): Promise<CleanupPreviewResponse> {
    try {
      const formData = new FormData();
      formData.append('file', request.file);

      // Add boolean options
      if (request.objectAnalysis !== undefined) {
        formData.append('objectAnalysis', request.objectAnalysis.toString());
      }
      if (request.resourceCleanup !== undefined) {
        formData.append('resourceCleanup', request.resourceCleanup.toString());
      }
      if (request.structureOptimization !== undefined) {
        formData.append('structureOptimization', request.structureOptimization.toString());
      }
      if (request.aggressiveCleanup !== undefined) {
        formData.append('aggressiveCleanup', request.aggressiveCleanup.toString());
      }
      if (request.preserveMetadata !== undefined) {
        formData.append('preserveMetadata', request.preserveMetadata.toString());
      }
      if (request.preserveAnnotations !== undefined) {
        formData.append('preserveAnnotations', request.preserveAnnotations.toString());
      }
      if (request.preserveBookmarks !== undefined) {
        formData.append('preserveBookmarks', request.preserveBookmarks.toString());
      }

      const response = await pdfApi.post(`/pdf-remove-unused-objects/preview-cleanup`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Failed to preview cleanup:', error);
      throw error;
    }
  }

  async batchCleanup(request: BatchCleanupRequest): Promise<BatchCleanupResponse> {
    try {
      const formData = new FormData();

      // Add files
      request.files.forEach((file) => {
        formData.append('files', file);
      });

      // Add preset
      if (request.preset) {
        formData.append('preset', request.preset);
      }

      // Add custom settings
      if (request.customSettings) {
        Object.entries(request.customSettings).forEach(([key, value]) => {
          if (value !== undefined) {
            formData.append(`customSettings[${key}]`, value.toString());
          }
        });
      }

      const response = await pdfApi.post(`/pdf-remove-unused-objects/batch-cleanup`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Construct full URLs for downloads
      const results = response.data.results.map((result: any) => ({
        ...result,
        downloadUrl: result.downloadUrl.startsWith('http') 
          ? result.downloadUrl 
          : `${this.baseURL}${result.downloadUrl}`
      }));

      return {
        ...response.data,
        results
      };
    } catch (error) {
      console.error('Failed to perform batch cleanup:', error);
      throw error;
    }
  }

  async downloadFile(url: string, filename: string): Promise<void> {
    try {
      const response = await axios.get(url, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      throw new Error('Failed to download file');
    }
  }

  // Helper method to get file size in readable format
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Helper method to calculate size reduction percentage
  calculateSizeReduction(originalSize: number, newSize: number): string {
    if (originalSize === 0) return '0%';
    const reduction = ((originalSize - newSize) / originalSize) * 100;
    return reduction.toFixed(1) + '%';
  }

  // Helper method to get risk level color
  getRiskLevelColor(riskLevel: string): string {
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  // Helper method to get priority color
  getPriorityColor(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  // Helper method to validate cleanup settings
  validateCleanupSettings(settings: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (settings.aggressiveCleanup && settings.preserveMetadata) {
      errors.push('Aggressive cleanup may remove metadata even when preserveMetadata is enabled');
    }

    if (settings.aggressiveCleanup && settings.preserveAnnotations) {
      errors.push('Aggressive cleanup may remove annotations even when preserveAnnotations is enabled');
    }

    if (settings.aggressiveCleanup && settings.preserveBookmarks) {
      errors.push('Aggressive cleanup may remove bookmarks even when preserveBookmarks is enabled');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const removeUnusedObjectsService = new RemoveUnusedObjectsService();
