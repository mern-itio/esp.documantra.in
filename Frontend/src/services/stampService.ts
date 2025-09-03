import { pdfApi } from './apiHelper';
import type {
  StampRequest,
  StampResponse,
  StampStats,
  StampValidation,
  StampHistory,
  StampSettings,
  StampPreset,
  StampAnalytics,
  BatchStampRequest,
  BatchStampResponse,
  StampType,
  StampLibrary,
  DateFormat
} from '../types/stamps';

// Add Stamps Service
export const stampService = {
  // Main stamping function
  async addStamps(request: StampRequest): Promise<StampResponse> {
    try {
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('stampType', request.stampType.value);
      if (request.customText) {
        formData.append('customText', request.customText);
      }
      if (request.customImage) {
        formData.append('customImage', request.customImage);
      }
      formData.append('position', request.position);
      formData.append('pageNumber', request.pageNumber);
      formData.append('stampColor', request.stampColor);
      formData.append('stampSize', request.stampSize);
      formData.append('includeDate', String(request.includeDate || false));
      formData.append('dateFormat', request.dateFormat || 'MM/DD/YYYY');
      formData.append('opacity', String(request.opacity || 0.8));

      const response = await pdfApi.post('/pdf-stamps/add-stamps', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes timeout
      });

      return response.data;
    } catch (error) {
      console.error('Stamping failed:', error);
      throw error;
    }
  },

  // Get available stamp types
  async getStampTypes(): Promise<StampType[]> {
    try {
      const response = await pdfApi.get('/pdf-stamps/stamp-types');
      return response.data.stampTypes;
    } catch (error) {
      console.error('Failed to get stamp types:', error);
      throw error;
    }
  },

  // Batch stamping for multiple files
  async batchStamps(request: BatchStampRequest): Promise<BatchStampResponse> {
    try {
      const formData = new FormData();
      
      // Add all files
      request.files.forEach((file) => {
        formData.append(`files`, file);
      });
      
      formData.append('stampType', request.stampType.value);
      if (request.customText) {
        formData.append('customText', request.customText);
      }
      formData.append('position', request.position);
      formData.append('pageNumber', request.pageNumber);
      formData.append('stampColor', request.stampColor);
      formData.append('stampSize', request.stampSize);
      formData.append('includeDate', String(request.includeDate || false));
      formData.append('dateFormat', request.dateFormat || 'MM/DD/YYYY');
      formData.append('opacity', String(request.opacity || 0.8));

      const response = await pdfApi.post('/pdf-stamps/batch', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 600000, // 10 minutes timeout for batch operations
      });

      return response.data;
    } catch (error) {
      console.error('Batch stamping failed:', error);
      throw error;
    }
  },

  // Download stamped file
  async downloadFile(downloadUrl: string, filename: string): Promise<boolean> {
    try {
      const baseUrl = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';
      const fullUrl = `${baseUrl}${downloadUrl}`;

      console.log(`Downloading stamped file from: ${fullUrl}`);
      console.log(`Filename: ${filename}`);

      const response = await fetch(fullUrl);

      console.log(`Response status: ${response.status}`);
      console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Download failed: ${response.status} ${response.statusText}`);
        console.error(`Error response: ${errorText}`);
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log(`Blob size: ${blob.size} bytes`);
      console.log(`Blob type: ${blob.type}`);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log(`Stamped file downloaded successfully: ${filename}`);
      return true;
    } catch (error) {
      console.error('File download failed:', error);
      throw error;
    }
  },

  // Validate stamp request
  validateRequest(request: StampRequest): StampValidation {
    const errors: string[] = [];

    if (!request.file) {
      errors.push('File is required');
    }

    if (!request.stampType) {
      errors.push('Stamp type is required');
    }

    if (request.stampType.value === 'custom' && (!request.customText || request.customText.trim() === '')) {
      errors.push('Custom text is required when using custom stamp type');
    }

    if (request.customText && request.customText.length > 100) {
      errors.push('Custom text is too long (max 100 characters)');
    }

    // Check file type
    if (request.file && request.file.type !== 'application/pdf') {
      errors.push('Only PDF files are supported');
    }

    // Check file size (50MB limit)
    if (request.file && request.file.size > 50 * 1024 * 1024) {
      errors.push('File size exceeds 50MB limit');
    }

    // Validate opacity
    if (request.opacity !== undefined && (request.opacity < 0 || request.opacity > 1)) {
      errors.push('Opacity must be between 0 and 1');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      message: errors.length > 0 ? errors.join(', ') : undefined
    };
  },

  // Calculate statistics from results
  calculateStats(results: StampResponse): StampStats {
    return {
      totalStamps: results.stampDetails.totalStamps,
      pagesAffected: results.stampDetails.pagesStamped,
      stampType: 'custom', // Default value since stampType is not in StampDetails
      fileSizeIncrease: results.fileSize - results.originalFileSize
    };
  },

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Get stamp library
  getStampLibrary(): StampLibrary {
    return {
      categories: [
        {
          id: 'approval',
          name: 'Approval Stamps',
          description: 'Document approval and authorization stamps',
          stamps: [
            {
              id: 'approved',
              name: 'Approved',
              description: 'Document approved',
              type: 'approved',
              defaultColor: 'green',
              defaultSize: 'medium',
              defaultPosition: 'bottom-right',
              category: 'approval',
              tags: ['approval', 'authorized', 'official'],
              preview: 'APPROVED'
            },
            {
              id: 'signed',
              name: 'Signed',
              description: 'Document signed',
              type: 'signed',
              defaultColor: 'blue',
              defaultSize: 'medium',
              defaultPosition: 'bottom-right',
              category: 'approval',
              tags: ['signed', 'authorized', 'official'],
              preview: 'SIGNED'
            },
            {
              id: 'reviewed',
              name: 'Reviewed',
              description: 'Document reviewed',
              type: 'reviewed',
              defaultColor: 'blue',
              defaultSize: 'medium',
              defaultPosition: 'bottom-right',
              category: 'approval',
              tags: ['reviewed', 'checked', 'verified'],
              preview: 'REVIEWED'
            }
          ],
          icon: 'check-circle'
        },
        {
          id: 'status',
          name: 'Status Stamps',
          description: 'Document status and processing stamps',
          stamps: [
            {
              id: 'draft',
              name: 'Draft',
              description: 'Draft document',
              type: 'draft',
              defaultColor: 'gray',
              defaultSize: 'medium',
              defaultPosition: 'top-right',
              category: 'status',
              tags: ['draft', 'work-in-progress', 'temporary'],
              preview: 'DRAFT'
            },
            {
              id: 'urgent',
              name: 'Urgent',
              description: 'Urgent processing required',
              type: 'urgent',
              defaultColor: 'red',
              defaultSize: 'large',
              defaultPosition: 'top-center',
              category: 'status',
              tags: ['urgent', 'priority', 'immediate'],
              preview: 'URGENT'
            },
            {
              id: 'pending',
              name: 'Pending',
              description: 'Pending approval',
              type: 'pending',
              defaultColor: 'orange',
              defaultSize: 'medium',
              defaultPosition: 'top-right',
              category: 'status',
              tags: ['pending', 'waiting', 'approval'],
              preview: 'PENDING'
            },
            {
              id: 'rejected',
              name: 'Rejected',
              description: 'Document rejected',
              type: 'rejected',
              defaultColor: 'red',
              defaultSize: 'medium',
              defaultPosition: 'center',
              category: 'status',
              tags: ['rejected', 'declined', 'not-approved'],
              preview: 'REJECTED'
            }
          ],
          icon: 'clock'
        },
        {
          id: 'security',
          name: 'Security Stamps',
          description: 'Confidentiality and security stamps',
          stamps: [
            {
              id: 'confidential',
              name: 'Confidential',
              description: 'Confidential document',
              type: 'confidential',
              defaultColor: 'red',
              defaultSize: 'large',
              defaultPosition: 'center',
              category: 'security',
              tags: ['confidential', 'private', 'restricted'],
              preview: 'CONFIDENTIAL'
            },
            {
              id: 'received',
              name: 'Received',
              description: 'Document received',
              type: 'received',
              defaultColor: 'green',
              defaultSize: 'medium',
              defaultPosition: 'bottom-left',
              category: 'security',
              tags: ['received', 'acknowledged', 'delivered'],
              preview: 'RECEIVED'
            }
          ],
          icon: 'shield'
        }
      ],
      totalStamps: 8
    };
  },

  // Get date formats
  getDateFormats(): DateFormat[] {
    return [
      { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '12/25/2023' },
      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '25/12/2023' },
      { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2023-12-25' },
      { value: 'MMM DD, YYYY', label: 'MMM DD, YYYY', example: 'Dec 25, 2023' },
      { value: 'MMMM DD, YYYY', label: 'MMMM DD, YYYY', example: 'December 25, 2023' },
      { value: 'DD-MMM-YYYY', label: 'DD-MMM-YYYY', example: '25-Dec-2023' }
    ];
  },

  // Get default settings
  getDefaultSettings(): StampSettings {
    return {
      defaultStampColor: 'red',
      defaultStampSize: 'medium',
      defaultPosition: 'bottom-right',
      defaultIncludeDate: false,
      defaultDateFormat: 'MM/DD/YYYY',
      defaultOpacity: 0.8,
      autoSave: true
    };
  },

  // Get default presets
  getDefaultPresets(): StampPreset[] {
    return [
      {
        id: 'approval-stamp',
        name: 'Approval Stamp',
        description: 'Standard document approval stamp',
        stampType: { value: 'approved', label: 'Approved', description: 'Approval stamp' },
        position: 'bottom-right',
        stampColor: 'green',
        stampSize: 'medium',
        includeDate: true,
        dateFormat: 'MM/DD/YYYY',
        opacity: 0.8,
        category: 'approval',
        isDefault: true
      },
      {
        id: 'confidential-stamp',
        name: 'Confidential Stamp',
        description: 'Confidentiality stamp for sensitive documents',
        stampType: { value: 'confidential', label: 'Confidential', description: 'Confidentiality stamp' },
        position: 'center',
        stampColor: 'red',
        stampSize: 'large',
        includeDate: false,
        dateFormat: 'MM/DD/YYYY',
        opacity: 0.9,
        category: 'security',
        isDefault: true
      },
      {
        id: 'draft-stamp',
        name: 'Draft Stamp',
        description: 'Draft document stamp',
        stampType: { value: 'draft', label: 'Draft', description: 'Draft document stamp' },
        position: 'top-right',
        stampColor: 'gray',
        stampSize: 'medium',
        includeDate: true,
        dateFormat: 'MM/DD/YYYY',
        opacity: 0.7,
        category: 'status',
        isDefault: true
      },
      {
        id: 'urgent-stamp',
        name: 'Urgent Stamp',
        description: 'Urgent processing stamp',
        stampType: { value: 'urgent', label: 'Urgent', description: 'Urgent processing stamp' },
        position: 'top-center',
        stampColor: 'red',
        stampSize: 'large',
        includeDate: true,
        dateFormat: 'MM/DD/YYYY',
        opacity: 0.9,
        category: 'status',
        isDefault: true
      }
    ];
  },

  // Save to history
  saveToHistory(operation: StampHistory): void {
    try {
      const history = this.getHistory();
      history.unshift(operation);

      // Keep only last 50 operations
      if (history.length > 50) {
        history.splice(50);
      }

      localStorage.setItem('stampHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save to history:', error);
    }
  },

  // Get history
  getHistory(): StampHistory[] {
    try {
      const history = localStorage.getItem('stampHistory');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Failed to get history:', error);
      return [];
    }
  },

  // Clear history
  clearHistory(): void {
    try {
      localStorage.removeItem('stampHistory');
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  },

  // Save settings
  saveSettings(settings: StampSettings): void {
    try {
      localStorage.setItem('stampSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },

  // Get settings
  getSettings(): StampSettings {
    try {
      const settings = localStorage.getItem('stampSettings');
      return settings ? JSON.parse(settings) : this.getDefaultSettings();
    } catch (error) {
      console.error('Failed to get settings:', error);
      return this.getDefaultSettings();
    }
  },

  // Calculate analytics
  calculateAnalytics(): StampAnalytics {
    const history = this.getHistory();

    const totalStamps = history.reduce((sum, op) => sum + op.totalStamps, 0);

    const typeCounts = new Map<string, number>();
    const positionCounts = new Map<string, number>();
    const colorCounts = new Map<string, number>();

    history.forEach(op => {
      const typeCount = typeCounts.get(op.stampType) || 0;
      typeCounts.set(op.stampType, typeCount + 1);
    });

    const mostUsedStampTypes = Array.from(typeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const averageStampsPerDocument = history.length > 0
      ? totalStamps / history.length
      : 0;

    const mostCommonPositions = Array.from(positionCounts.entries())
      .map(([position, count]) => ({ position: position as any, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const mostCommonColors = Array.from(colorCounts.entries())
      .map(([color, count]) => ({ color: color as any, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalStamps,
      mostUsedStampTypes,
      averageStampsPerDocument,
      mostCommonPositions,
      mostCommonColors
    };
  },

  // Get preview of stamped PDF
  async getPreview(request: StampRequest): Promise<StampResponse> {
    try {
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('stampType', request.stampType.value);
      if (request.customText) {
        formData.append('customText', request.customText);
      }
      if (request.customImage) {
        formData.append('customImage', request.customImage);
      }
      formData.append('position', request.position);
      formData.append('pageNumber', request.pageNumber);
      formData.append('stampColor', request.stampColor);
      formData.append('stampSize', request.stampSize);
      formData.append('includeDate', String(request.includeDate || false));
      formData.append('dateFormat', request.dateFormat || 'MM/DD/YYYY');
      formData.append('opacity', String(request.opacity || 0.8));

      const response = await pdfApi.post('/pdf-stamps/preview-stamps', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes timeout
      });

      // Construct full URL for preview
      const baseURL = pdfApi.defaults.baseURL || 'http://localhost:2104';
      const previewUrl = response.data.previewUrl.startsWith('http') 
        ? response.data.previewUrl 
        : `${baseURL}${response.data.previewUrl}`;

      return {
        ...response.data,
        previewUrl
      };
    } catch (error: any) {
      console.error('Preview generation error:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate preview');
    }
  }
};

export default stampService;
