import { pdfApi } from './apiHelper';

export interface Bookmark {
  id?: string;
  title: string;
  page: number;
  level: number;
  children?: Bookmark[];
  expanded?: boolean;
  custom?: boolean;
}

export interface BookmarkStructure {
  pages: number;
  complexity: 'low' | 'medium' | 'high';
  headings: Array<{
    pageNumber: number;
    width: number;
    height: number;
    potentialHeadings: any[];
  }>;
  patterns: any[];
  suggestions: any[];
}

export interface BookmarkSuggestion {
  title: string;
  page: number;
  confidence: number;
  type: 'automatic' | 'manual';
  reason: string;
}

export interface AutoDetectResult {
  originalFilename: string;
  processedFilename: string;
  downloadUrl: string;
  bookmarks: Bookmark[];
  structure: BookmarkStructure;
  statistics: {
    totalBookmarks: number;
    maxDepth: number;
    pages: number;
  };
}

export interface CustomBookmarksResult {
  originalFilename: string;
  processedFilename: string;
  downloadUrl: string;
  bookmarks: Bookmark[];
  statistics: {
    totalBookmarks: number;
    maxDepth: number;
    pages: number;
  };
}

export interface EditBookmarksResult {
  originalFilename: string;
  processedFilename: string;
  downloadUrl: string;
  bookmarks: Bookmark[];
  action: string;
  statistics: {
    totalBookmarks: number;
    maxDepth: number;
    pages: number;
  };
}

export interface ExistingBookmarksResult {
  originalFilename: string;
  bookmarks: Bookmark[];
  statistics: {
    totalBookmarks: number;
    maxDepth: number;
    pages: number;
  };
}

export interface StructureAnalysisResult {
  originalFilename: string;
  structure: BookmarkStructure;
  suggestions: BookmarkSuggestion[];
  statistics: {
    pages: number;
    potentialBookmarks: number;
    structureComplexity: string;
  };
}

export interface ServiceStatus {
  service: string;
  status: string;
  version: string;
  features: string[];
  capabilities: {
    maxFileSize: string;
    supportedFormats: string[];
    bookmarkTypes: string[];
    maxBookmarkDepth: number;
    maxBookmarksPerDocument: number;
  };
  timestamp: string;
}

export const pdfBookmarksService = {
  // Auto-detect and generate bookmarks from PDF structure
  async autoDetectBookmarks(file: File): Promise<AutoDetectResult> {
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await pdfApi.post('/pdf-bookmarks/auto-detect', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data.result;
      } else {
        throw new Error(response.data.error || 'Failed to auto-detect bookmarks');
      }
    } catch (error: any) {
      console.error('Error auto-detecting bookmarks:', error);
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.details || 
        error.message || 
        'Failed to auto-detect bookmarks'
      );
    }
  },

  // Create custom bookmarks with user-defined structure
  async createCustomBookmarks(file: File, bookmarks: Bookmark[]): Promise<CustomBookmarksResult> {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('bookmarks', JSON.stringify(bookmarks));
    
    console.log('📤 Sending bookmarks:', bookmarks);
    console.log('📤 Bookmarks JSON:', JSON.stringify(bookmarks));

    try {
      const response = await pdfApi.post('/pdf-bookmarks/create-custom', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data.result;
      } else {
        throw new Error(response.data.error || 'Failed to create custom bookmarks');
      }
    } catch (error: any) {
      console.error('Error creating custom bookmarks:', error);
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.details || 
        error.message || 
        'Failed to create custom bookmarks'
      );
    }
  },

  // Edit existing bookmarks (add, remove, modify)
  async editBookmarks(file: File, action: string, bookmarkData: any): Promise<EditBookmarksResult> {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('action', action);
    formData.append('bookmarkData', JSON.stringify(bookmarkData));

    try {
      const response = await pdfApi.post('/pdf-bookmarks/edit-bookmarks', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data.result;
      } else {
        throw new Error(response.data.error || 'Failed to edit bookmarks');
      }
    } catch (error: any) {
      console.error('Error editing bookmarks:', error);
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.details || 
        error.message || 
        'Failed to edit bookmarks'
      );
    }
  },

  // Get bookmark structure from existing PDF
  async getExistingBookmarks(file: File): Promise<ExistingBookmarksResult> {
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await pdfApi.post('/pdf-bookmarks/get-bookmarks', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data.result;
      } else {
        throw new Error(response.data.error || 'Failed to get existing bookmarks');
      }
    } catch (error: any) {
      console.error('Error getting existing bookmarks:', error);
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.details || 
        error.message || 
        'Failed to get existing bookmarks'
      );
    }
  },

  // Analyze PDF structure for bookmark suggestions
  async analyzeStructure(file: File): Promise<StructureAnalysisResult> {
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await pdfApi.post('/pdf-bookmarks/analyze-structure', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data.result;
      } else {
        throw new Error(response.data.error || 'Failed to analyze structure');
      }
    } catch (error: any) {
      console.error('Error analyzing structure:', error);
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.details || 
        error.message || 
        'Failed to analyze structure'
      );
    }
  },

  // Get service status and capabilities
  async getServiceStatus(): Promise<ServiceStatus> {
    try {
      const response = await pdfApi.get('/pdf-bookmarks/status');
      
      if (response.data.success) {
        return response.data.status;
      } else {
        throw new Error(response.data.error || 'Failed to get service status');
      }
    } catch (error: any) {
      console.error('Error getting service status:', error);
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.details || 
        error.message || 
        'Failed to get service status'
      );
    }
  },

  // Health check
  async healthCheck(): Promise<{ success: boolean; health: string; timestamp: string; uptime?: number }> {
    try {
      const response = await pdfApi.get('/pdf-bookmarks/health');
      return response.data;
    } catch (error: any) {
      console.error('Error checking health:', error);
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.details || 
        error.message || 
        'Failed to check health'
      );
    }
  }
};
