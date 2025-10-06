import { pdfApi } from './apiHelper';
import type {
  RedactRequest,
  RedactResponse,
  RedactPreview,
  RedactStats,
  RedactValidation,
  RedactHistory,
  RedactSettings,
  RedactPreset,
  RedactTemplate,
  RedactAnalytics,
  BatchRedactRequest,
  BatchRedactResponse,
  RedactionPatternDefinition
} from '../types/redact';

// Redact Content Service
export const redactService = {
  // Main redaction function
  async redactContent(request: RedactRequest): Promise<RedactResponse> {
    try {
      const formData = new FormData();
      formData.append('file', request.file);
      if (request.redactionTypes && request.redactionTypes.length > 0) {
        formData.append('redactionTypes', JSON.stringify(request.redactionTypes));
      }
      if (request.redactionType) {
        formData.append('redactionType', request.redactionType);
      }
      if (request.customPattern) {
        formData.append('customPattern', request.customPattern);
      }
      if (request.customPatterns && request.customPatterns.length > 0) {
        formData.append('customPatterns', JSON.stringify(request.customPatterns));
      }
      formData.append('redactionColor', request.redactionColor);
      formData.append('redactionMethod', request.redactionMethod);
      formData.append('preserveLayout', String(request.preserveLayout || true));
      formData.append('batchMode', String(request.batchMode || false));
      formData.append('complianceMode', String(request.complianceMode || false));

      const response = await pdfApi.post('/pdf-redact/redact', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes timeout
      });

      return response.data;
    } catch (error) {
      console.error('Redaction failed:', error);
      throw error;
    }
  },

  // Preview redaction without making changes
  async previewRedaction(request: Omit<RedactRequest, 'redactionColor' | 'redactionMethod' | 'preserveLayout' | 'batchMode' | 'complianceMode'>): Promise<RedactPreview> {
    try {
      const formData = new FormData();
      formData.append('file', request.file);
      if (request.redactionTypes && request.redactionTypes.length > 0) {
        formData.append('redactionTypes', JSON.stringify(request.redactionTypes));
      }
      if (request.redactionType) {
        formData.append('redactionType', request.redactionType);
      }
      if (request.customPattern) {
        formData.append('customPattern', request.customPattern);
      }
      if (request.customPatterns && request.customPatterns.length > 0) {
        formData.append('customPatterns', JSON.stringify(request.customPatterns));
      }

      const response = await pdfApi.post('/pdf-redact/preview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes timeout
      });

      return response.data;
    } catch (error) {
      console.error('Redaction preview failed:', error);
      throw error;
    }
  },

  // Batch redaction for multiple files
  async batchRedact(request: BatchRedactRequest): Promise<BatchRedactResponse> {
    try {
      const formData = new FormData();
      
      // Add all files
      request.files.forEach((file) => {
        formData.append(`files`, file);
      });
      
      formData.append('redactionType', request.redactionType);
      if (request.customPattern) {
        formData.append('customPattern', request.customPattern);
      }
      formData.append('redactionColor', request.redactionColor);
      formData.append('redactionMethod', request.redactionMethod);
      formData.append('preserveLayout', String(request.preserveLayout || true));
      formData.append('complianceMode', String(request.complianceMode || false));

      const response = await pdfApi.post('/pdf-redact/batch', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 600000, // 10 minutes timeout for batch operations
      });

      return response.data;
    } catch (error) {
      console.error('Batch redaction failed:', error);
      throw error;
    }
  },

  // Download redacted file
  async downloadFile(downloadUrl: string, filename: string): Promise<boolean> {
    try {
      const baseUrl = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';
      const fullUrl = `${baseUrl}${downloadUrl}`;

      console.log(`Downloading redacted file from: ${fullUrl}`);
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

      console.log(`Redacted file downloaded successfully: ${filename}`);
      return true;
    } catch (error) {
      console.error('File download failed:', error);
      throw error;
    }
  },

  // Validate redaction request
  validateRequest(request: RedactRequest): RedactValidation {
    const errors: string[] = [];

    if (!request.file) {
      errors.push('File is required');
    }

    if (!request.redactionType && (!request.redactionTypes || request.redactionTypes.length === 0)) {
      errors.push('At least one redaction type is required');
    }

    const includesCustom = (request.redactionType === 'custom') || (request.redactionTypes?.includes('custom'));
    if (includesCustom && (!request.customPattern && (!request.customPatterns || request.customPatterns.length === 0))) {
      errors.push('Custom pattern is required when selecting custom redaction type');
    }

    if (request.customPattern && request.customPattern.length > 1000) {
      errors.push('Custom pattern is too long (max 1000 characters)');
    }

    // Validate custom regex if provided
    if (includesCustom && request.customPattern) {
      try {
        new RegExp(request.customPattern);
      } catch (error) {
        errors.push('Invalid regular expression pattern');
      }
    }
    if (includesCustom && request.customPatterns && request.customPatterns.length > 0) {
      for (const patt of request.customPatterns) {
        try {
          // eslint-disable-next-line no-new
          new RegExp(patt);
        } catch (error) {
          errors.push('Invalid regular expression pattern in custom patterns');
          break;
        }
      }
    }

    // Check file type
    if (request.file && request.file.type !== 'application/pdf') {
      errors.push('Only PDF files are supported');
    }

    // Check file size (50MB limit)
    if (request.file && request.file.size > 50 * 1024 * 1024) {
      errors.push('File size exceeds 50MB limit');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      message: errors.length > 0 ? errors.join(', ') : undefined
    };
  },

  // Calculate statistics from results
  calculateStats(results: RedactResponse): RedactStats {
    return {
      totalRedactions: results.redactionDetails.totalRedactions,
      pagesAffected: results.redactionDetails.pagesProcessed,
      redactionType: 'custom', // Default value since redactionType is not in RedactionDetails
      fileSizeReduction: results.originalFileSize - results.fileSize
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

  // Get redaction pattern definitions
  getRedactionPatterns(): RedactionPatternDefinition[] {
    return [
      {
        type: 'ssn',
        name: 'Social Security Number',
        description: 'US Social Security Numbers (XXX-XX-XXXX format)',
        pattern: /\b\d{3}-?\d{2}-?\d{4}\b/g,
        example: '123-45-6789',
        category: 'identification'
      },
      {
        type: 'credit_card',
        name: 'Credit Card Number',
        description: 'Credit card numbers (16 digits with optional separators)',
        pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
        example: '1234-5678-9012-3456',
        category: 'financial'
      },
      {
        type: 'email',
        name: 'Email Address',
        description: 'Email addresses',
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        example: 'user@example.com',
        category: 'contact'
      },
      {
        type: 'phone',
        name: 'Phone Number',
        description: 'US phone numbers (various formats)',
        pattern: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
        example: '(555) 123-4567',
        category: 'contact'
      },
      {
        type: 'address',
        name: 'Street Address',
        description: 'Street addresses with common suffixes',
        pattern: /\b\d+\s+[A-Za-z0-9\s,.-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Place|Pl)\b/gi,
        example: '123 Main Street',
        category: 'personal'
      },
      {
        type: 'name',
        name: 'Full Name',
        description: 'Full names (First Last format)',
        pattern: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,
        example: 'John Smith',
        category: 'personal'
      },
      {
        type: 'date',
        name: 'Date',
        description: 'Dates in MM/DD/YYYY format',
        pattern: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g,
        example: '12/25/2023',
        category: 'personal'
      }
    ];
  },

  // Get default settings
  getDefaultSettings(): RedactSettings {
    return {
      defaultRedactionColor: 'black',
      defaultRedactionMethod: 'solid',
      defaultPreserveLayout: true,
      defaultComplianceMode: false,
      autoSave: true,
      maxPreviewMatches: 100
    };
  },

  // Get default presets
  getDefaultPresets(): RedactPreset[] {
    return [
      {
        id: 'gdpr-compliance',
        name: 'GDPR Compliance',
        description: 'Redact personal data for GDPR compliance',
        redactionType: 'all_sensitive',
        redactionColor: 'black',
        redactionMethod: 'solid',
        category: 'compliance',
        isDefault: true
      },
      {
        id: 'hipaa-compliance',
        name: 'HIPAA Compliance',
        description: 'Redact health information for HIPAA compliance',
        redactionType: 'all_sensitive',
        redactionColor: 'black',
        redactionMethod: 'solid',
        category: 'compliance',
        isDefault: true
      },
      {
        id: 'financial-documents',
        name: 'Financial Documents',
        description: 'Redact sensitive financial information',
        redactionType: 'credit_card',
        redactionColor: 'black',
        redactionMethod: 'solid',
        category: 'financial',
        isDefault: true
      },
      {
        id: 'personal-info',
        name: 'Personal Information',
        description: 'Redact personal identification information',
        redactionType: 'ssn',
        redactionColor: 'black',
        redactionMethod: 'solid',
        category: 'personal',
        isDefault: true
      }
    ];
  },

  // Get default templates
  getDefaultTemplates(): RedactTemplate[] {
    return [
      {
        id: 'legal-document-redaction',
        name: 'Legal Document Redaction',
        description: 'Comprehensive redaction for legal documents',
        operations: [
          {
            redactionType: 'ssn',
            redactionColor: 'black',
            redactionMethod: 'solid',
            order: 1,
            enabled: true
          },
          {
            redactionType: 'credit_card',
            redactionColor: 'black',
            redactionMethod: 'solid',
            order: 2,
            enabled: true
          },
          {
            redactionType: 'email',
            redactionColor: 'black',
            redactionMethod: 'solid',
            order: 3,
            enabled: true
          },
          {
            redactionType: 'phone',
            redactionColor: 'black',
            redactionMethod: 'solid',
            order: 4,
            enabled: true
          }
        ],
        category: 'legal',
        tags: ['legal', 'compliance', 'privacy']
      },
      {
        id: 'medical-record-redaction',
        name: 'Medical Record Redaction',
        description: 'HIPAA-compliant redaction for medical records',
        operations: [
          {
            redactionType: 'ssn',
            redactionColor: 'black',
            redactionMethod: 'solid',
            order: 1,
            enabled: true
          },
          {
            redactionType: 'name',
            redactionColor: 'black',
            redactionMethod: 'solid',
            order: 2,
            enabled: true
          },
          {
            redactionType: 'address',
            redactionColor: 'black',
            redactionMethod: 'solid',
            order: 3,
            enabled: true
          },
          {
            redactionType: 'phone',
            redactionColor: 'black',
            redactionMethod: 'solid',
            order: 4,
            enabled: true
          }
        ],
        category: 'medical',
        tags: ['medical', 'hipaa', 'privacy']
      }
    ];
  },

  // Save to history
  saveToHistory(operation: RedactHistory): void {
    try {
      const history = this.getHistory();
      history.unshift(operation);

      // Keep only last 50 operations
      if (history.length > 50) {
        history.splice(50);
      }

      localStorage.setItem('redactHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save to history:', error);
    }
  },

  // Get history
  getHistory(): RedactHistory[] {
    try {
      const history = localStorage.getItem('redactHistory');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Failed to get history:', error);
      return [];
    }
  },

  // Clear history
  clearHistory(): void {
    try {
      localStorage.removeItem('redactHistory');
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  },

  // Save settings
  saveSettings(settings: RedactSettings): void {
    try {
      localStorage.setItem('redactSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },

  // Get settings
  getSettings(): RedactSettings {
    try {
      const settings = localStorage.getItem('redactSettings');
      return settings ? JSON.parse(settings) : this.getDefaultSettings();
    } catch (error) {
      console.error('Failed to get settings:', error);
      return this.getDefaultSettings();
    }
  },

  // Save presets
  savePresets(presets: RedactPreset[]): void {
    try {
      localStorage.setItem('redactPresets', JSON.stringify(presets));
    } catch (error) {
      console.error('Failed to save presets:', error);
    }
  },

  // Get presets
  getPresets(): RedactPreset[] {
    try {
      const presets = localStorage.getItem('redactPresets');
      return presets ? JSON.parse(presets) : this.getDefaultPresets();
    } catch (error) {
      console.error('Failed to get presets:', error);
      return this.getDefaultPresets();
    }
  },

  // Save templates
  saveTemplates(templates: RedactTemplate[]): void {
    try {
      localStorage.setItem('redactTemplates', JSON.stringify(templates));
    } catch (error) {
      console.error('Failed to save templates:', error);
    }
  },

  // Get templates
  getTemplates(): RedactTemplate[] {
    try {
      const templates = localStorage.getItem('redactTemplates');
      return templates ? JSON.parse(templates) : this.getDefaultTemplates();
    } catch (error) {
      console.error('Failed to get templates:', error);
      return this.getDefaultTemplates();
    }
  },

  // Calculate analytics
  calculateAnalytics(): RedactAnalytics {
    const history = this.getHistory();

    const totalRedactions = history.reduce((sum, op) => sum + op.totalRedactions, 0);

    const patternCounts = new Map<string, number>();
    history.forEach(op => {
      const types = Array.isArray(op.redactionType) ? op.redactionType : [op.redactionType];
      types.forEach(t => {
        const key = String(t);
        const count = patternCounts.get(key) || 0;
        patternCounts.set(key, count + 1);
      });
    });

    const mostUsedPatterns = Array.from(patternCounts.entries())
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const averageRedactionsPerDocument = history.length > 0
      ? totalRedactions / history.length
      : 0;

    const complianceModeUsage = history.filter(op => op.totalRedactions > 0).length;
    const mostCommonRedactionTypes = Array.from(patternCounts.entries())
      .map(([type, count]) => ({ type: type as any, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalRedactions,
      mostUsedPatterns,
      averageRedactionsPerDocument,
      complianceModeUsage,
      mostCommonRedactionTypes
    };
  }
};

export default redactService;
