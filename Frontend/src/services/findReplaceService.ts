import { pdfApi } from './apiHelper';
import type {
  FindReplaceRequest,
  FindReplaceResponse,
  // FindReplaceOptions,
  FindReplaceStats,
  FindReplacePreview,
  FindReplaceValidation,
  FindReplaceHistory,
  FindReplaceSettings,
  FindReplacePreset,
  FindReplaceTemplate,
  FindReplaceAnalytics
} from '../types/findReplace';

// Find & Replace Service
export const findReplaceService = {
  // Main find & replace function
  async findReplace(request: FindReplaceRequest): Promise<FindReplaceResponse> {
    try {
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('searchText', request.searchText);
      formData.append('replaceText', request.replaceText || '');
      formData.append('useRegex', String(request.useRegex || false));
      formData.append('caseSensitive', String(request.caseSensitive || false));
      formData.append('wholeWord', String(request.wholeWord || false));
      formData.append('replaceAll', String(request.replaceAll || false));
      if (request.selectedMatches && request.selectedMatches.length > 0) {
        formData.append('selectedMatches', JSON.stringify(request.selectedMatches));
      }

      const response = await pdfApi.post('/pdf-find-replace/find-replace', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes timeout
      });

      return response.data;
    } catch (error) {
      console.error('Find & Replace failed:', error);
      throw error;
    }
  },

  // Preview find & replace without making changes
  async previewFindReplace(request: Omit<FindReplaceRequest, 'replaceText' | 'replaceAll'>): Promise<FindReplacePreview> {
    try {
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('searchText', request.searchText);
      formData.append('useRegex', String(request.useRegex || false));
      formData.append('caseSensitive', String(request.caseSensitive || false));
      formData.append('wholeWord', String(request.wholeWord || false));

      const response = await pdfApi.post('/pdf-find-replace/preview-find-replace', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes timeout
      });

      return response.data;
    } catch (error) {
      console.error('Find & Replace preview failed:', error);
      throw error;
    }
  },

  // Download processed file
  async downloadFile(downloadUrl: string, filename: string): Promise<boolean> {
    try {
      const baseUrl = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';
      const fullUrl = `${baseUrl}${downloadUrl}`;

      console.log(`Downloading file from: ${fullUrl}`);

      const response = await fetch(fullUrl);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log(`File downloaded successfully: ${filename}`);
      return true;
    } catch (error) {
      console.error('File download failed:', error);
      throw error;
    }
  },

  // Validate find & replace request
  validateRequest(request: FindReplaceRequest): FindReplaceValidation {
    const errors: string[] = [];

    if (!request.file) {
      errors.push('File is required');
    }

    if (!request.searchText || request.searchText.trim() === '') {
      errors.push('Search text is required');
    }

    if (request.searchText && request.searchText.length > 1000) {
      errors.push('Search text is too long (max 1000 characters)');
    }

    if (request.replaceText && request.replaceText.length > 1000) {
      errors.push('Replace text is too long (max 1000 characters)');
    }

    // Validate regex if enabled
    if (request.useRegex && request.searchText) {
      try {
        new RegExp(request.searchText);
      } catch (error) {
        errors.push('Invalid regular expression pattern');
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
  calculateStats(results: FindReplaceResponse['findReplaceResults']): FindReplaceStats {
    return {
      totalMatches: results.totalMatches,
      totalReplacements: results.replacements.length,
      pagesAffected: results.pages.length,
      searchText: results.searchText,
      replaceText: results.replaceText
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

  // Format extracted text for display
  formatExtractedText(text: string, maxLength: number = 1000): string {
    if (text.length <= maxLength) {
      return text;
    }

    return text.substring(0, maxLength) + '...';
  },

  // Get default settings
  getDefaultSettings(): FindReplaceSettings {
    return {
      defaultCaseSensitive: false,
      defaultWholeWord: false,
      defaultUseRegex: false,
      maxPreviewMatches: 100,
      contextLength: 50,
      autoSave: true
    };
  },

  // Get default presets
  getDefaultPresets(): FindReplacePreset[] {
    return [
      {
        id: 'common-typos',
        name: 'Common Typos',
        description: 'Fix common spelling mistakes',
        searchText: 'teh|adn|taht|recieve|seperate',
        replaceText: 'the|and|that|receive|separate',
        options: {
          searchText: 'teh|adn|taht|recieve|seperate',
          replaceText: 'the|and|that|receive|separate',
          useRegex: true,
          caseSensitive: false,
          wholeWord: true,
          replaceAll: true
        },
        category: 'spelling',
        isDefault: true
      },
      {
        id: 'double-spaces',
        name: 'Double Spaces',
        description: 'Remove double spaces',
        searchText: '  +',
        replaceText: ' ',
        options: {
          searchText: '  +',
          replaceText: ' ',
          useRegex: true,
          caseSensitive: false,
          wholeWord: false,
          replaceAll: true
        },
        category: 'formatting',
        isDefault: true
      },
      {
        id: 'trailing-spaces',
        name: 'Trailing Spaces',
        description: 'Remove trailing spaces',
        searchText: ' +$',
        replaceText: '',
        options: {
          searchText: ' +$',
          replaceText: '',
          useRegex: true,
          caseSensitive: false,
          wholeWord: false,
          replaceAll: true
        },
        category: 'formatting',
        isDefault: true
      },
      {
        id: 'smart-quotes',
        name: 'Smart Quotes',
        description: 'Convert smart quotes to regular quotes',
        searchText: `["'„‚]`,
        replaceText: '"',
        options: {
          searchText: `["'„‚]`,
          replaceText: '"',
          useRegex: true,
          caseSensitive: false,
          wholeWord: false,
          replaceAll: true
        },
        category: 'formatting',
        isDefault: true
      }
    ];
  },

  // Get default templates
  getDefaultTemplates(): FindReplaceTemplate[] {
    return [
      {
        id: 'document-cleanup',
        name: 'Document Cleanup',
        description: 'Clean up common document formatting issues',
        operations: [
          {
            searchText: '  +',
            replaceText: ' ',
            options: {
              searchText: '  +',
              replaceText: ' ',
              useRegex: true,
              caseSensitive: false,
              wholeWord: false,
              replaceAll: true
            },
            order: 1,
            enabled: true
          },
          {
            searchText: ' +$',
            replaceText: '',
            options: {
              searchText: ' +$',
              replaceText: '',
              useRegex: true,
              caseSensitive: false,
              wholeWord: false,
              replaceAll: true
            },
            order: 2,
            enabled: true
          },
          {
            searchText: '^ +',
            replaceText: '',
            options: {
              searchText: '^ +',
              replaceText: '',
              useRegex: true,
              caseSensitive: false,
              wholeWord: false,
              replaceAll: true
            },
            order: 3,
            enabled: true
          }
        ],
        category: 'formatting',
        tags: ['cleanup', 'formatting', 'spaces']
      },
      {
        id: 'spelling-corrections',
        name: 'Spelling Corrections',
        description: 'Fix common spelling mistakes',
        operations: [
          {
            searchText: 'teh',
            replaceText: 'the',
            options: {
              searchText: 'teh',
              replaceText: 'the',
              useRegex: false,
              caseSensitive: false,
              wholeWord: true,
              replaceAll: true
            },
            order: 1,
            enabled: true
          },
          {
            searchText: 'adn',
            replaceText: 'and',
            options: {
              searchText: 'adn',
              replaceText: 'and',
              useRegex: false,
              caseSensitive: false,
              wholeWord: true,
              replaceAll: true
            },
            order: 2,
            enabled: true
          },
          {
            searchText: 'taht',
            replaceText: 'that',
            options: {
              searchText: 'taht',
              replaceText: 'that',
              useRegex: false,
              caseSensitive: false,
              wholeWord: true,
              replaceAll: true
            },
            order: 3,
            enabled: true
          }
        ],
        category: 'spelling',
        tags: ['spelling', 'corrections', 'typos']
      }
    ];
  },

  // Save to history
  saveToHistory(operation: FindReplaceHistory): void {
    try {
      const history = this.getHistory();
      history.unshift(operation);

      // Keep only last 50 operations
      if (history.length > 50) {
        history.splice(50);
      }

      localStorage.setItem('findReplaceHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save to history:', error);
    }
  },

  // Get history
  getHistory(): FindReplaceHistory[] {
    try {
      const history = localStorage.getItem('findReplaceHistory');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Failed to get history:', error);
      return [];
    }
  },

  // Clear history
  clearHistory(): void {
    try {
      localStorage.removeItem('findReplaceHistory');
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  },

  // Save settings
  saveSettings(settings: FindReplaceSettings): void {
    try {
      localStorage.setItem('findReplaceSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },

  // Get settings
  getSettings(): FindReplaceSettings {
    try {
      const settings = localStorage.getItem('findReplaceSettings');
      return settings ? JSON.parse(settings) : this.getDefaultSettings();
    } catch (error) {
      console.error('Failed to get settings:', error);
      return this.getDefaultSettings();
    }
  },

  // Save presets
  savePresets(presets: FindReplacePreset[]): void {
    try {
      localStorage.setItem('findReplacePresets', JSON.stringify(presets));
    } catch (error) {
      console.error('Failed to save presets:', error);
    }
  },

  // Get presets
  getPresets(): FindReplacePreset[] {
    try {
      const presets = localStorage.getItem('findReplacePresets');
      return presets ? JSON.parse(presets) : this.getDefaultPresets();
    } catch (error) {
      console.error('Failed to get presets:', error);
      return this.getDefaultPresets();
    }
  },

  // Save templates
  saveTemplates(templates: FindReplaceTemplate[]): void {
    try {
      localStorage.setItem('findReplaceTemplates', JSON.stringify(templates));
    } catch (error) {
      console.error('Failed to save templates:', error);
    }
  },

  // Get templates
  getTemplates(): FindReplaceTemplate[] {
    try {
      const templates = localStorage.getItem('findReplaceTemplates');
      return templates ? JSON.parse(templates) : this.getDefaultTemplates();
    } catch (error) {
      console.error('Failed to get templates:', error);
      return this.getDefaultTemplates();
    }
  },

  // Calculate analytics
  calculateAnalytics(): FindReplaceAnalytics {
    const history = this.getHistory();

    const totalSearches = history.length;
    const totalReplacements = history.reduce((sum, op) => sum + op.totalReplacements, 0);

    const patternCounts = new Map<string, number>();
    history.forEach(op => {
      const count = patternCounts.get(op.searchText) || 0;
      patternCounts.set(op.searchText, count + 1);
    });

    const mostUsedPatterns = Array.from(patternCounts.entries())
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const averageMatchesPerSearch = totalSearches > 0
      ? history.reduce((sum, op) => sum + op.totalMatches, 0) / totalSearches
      : 0;

    const successfulOperations = history.filter(op => op.totalReplacements > 0).length;
    const successRate = totalSearches > 0 ? (successfulOperations / totalSearches) * 100 : 0;
    const errorRate = 100 - successRate;

    return {
      totalSearches,
      totalReplacements,
      mostUsedPatterns,
      averageMatchesPerSearch,
      successRate,
      errorRate
    };
  },

  // Test tools installation
  async testToolsInstallation(): Promise<any> {
    try {
      const response = await pdfApi.get('/pdf-find-replace/test-tools');
      return response.data;
    } catch (error) {
      console.error('Failed to test tools installation:', error);
      throw error;
    }
  }
};

export default findReplaceService;
