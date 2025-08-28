import axios from 'axios';
import type { 
  RemoveMetadataRequest, 
  RemoveMetadataResponse, 
  MetadataCheckResponse,
  MetadataCleaningPreset 
} from '../types/removeMetadata';

class RemoveMetadataService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';
  }

  async checkMetadata(file: File): Promise<MetadataCheckResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${this.baseURL}/pdf-remove-metadata/check-metadata`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async removeMetadata(request: RemoveMetadataRequest): Promise<RemoveMetadataResponse> {
    const formData = new FormData();
    formData.append('file', request.file);

    // Add all boolean options to form data
    Object.entries(request).forEach(([key, value]) => {
      if (key !== 'file' && typeof value === 'boolean') {
        formData.append(key, value.toString());
      }
    });

    const response = await axios.post(`${this.baseURL}/pdf-remove-metadata/remove-metadata`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Construct full URL for download
    const baseURL = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';
    const downloadUrl = response.data.downloadUrl.startsWith('http') 
      ? response.data.downloadUrl 
      : `${baseURL}${response.data.downloadUrl}`;

    return {
      ...response.data,
      downloadUrl
    };
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

  // Helper method to format size reduction
  formatSizeReduction(bytes: number): string {
    if (bytes <= 0) return '0 Bytes';
    return this.formatFileSize(bytes);
  }

  // Helper method to calculate size reduction percentage
  calculateSizeReductionPercentage(originalSize: number, newSize: number): number {
    if (originalSize === 0) return 0;
    return Math.round(((originalSize - newSize) / originalSize) * 100);
  }

  // Predefined cleaning presets
  getCleaningPresets(): MetadataCleaningPreset[] {
    return [
      {
        id: 'basic',
        name: 'Basic Cleaning',
        description: 'Remove common document metadata (author, title, creation date, etc.)',
        category: 'basic',
        icon: 'Shield',
        options: {
          removeDocumentInfo: true,
          removeProducer: true,
          removeCreator: true,
          removeCreationDate: true,
          removeModificationDate: true,
          removeKeywords: true,
          removeSubject: true,
          removeAuthor: true,
          removeTitle: true,
          removeTrapped: true
        }
      },
      {
        id: 'advanced',
        name: 'Advanced Cleaning',
        description: 'Remove extended metadata including XMP, color profiles, and viewer preferences',
        category: 'advanced',
        icon: 'ShieldCheck',
        options: {
          removeDocumentInfo: true,
          removeProducer: true,
          removeCreator: true,
          removeCreationDate: true,
          removeModificationDate: true,
          removeKeywords: true,
          removeSubject: true,
          removeAuthor: true,
          removeTitle: true,
          removeTrapped: true,
          removeXMPMetadata: true,
          removeICCProfiles: true,
          removeColorProfiles: true,
          removeOutputIntents: true,
          removePageLayout: true,
          removePageMode: true,
          removeViewerPreferences: true,
          removeOpenAction: true
        }
      },
      {
        id: 'comprehensive',
        name: 'Comprehensive Cleaning',
        description: 'Remove all possible metadata including structural information',
        category: 'comprehensive',
        icon: 'ShieldX',
        options: {
          removeDocumentInfo: true,
          removeProducer: true,
          removeCreator: true,
          removeCreationDate: true,
          removeModificationDate: true,
          removeKeywords: true,
          removeSubject: true,
          removeAuthor: true,
          removeTitle: true,
          removeTrapped: true,
          removeXMPMetadata: true,
          removeICCProfiles: true,
          removeColorProfiles: true,
          removeOutputIntents: true,
          removePageLayout: true,
          removePageMode: true,
          removeViewerPreferences: true,
          removeOpenAction: true,
          removeAdditionalStreams: true,
          removeStructureTree: true,
          removeMarkInfo: true,
          removeLang: true,
          removeSpiderInfo: true,
          removeCollection: true,
          removeNeedsRendering: true,
          removePieceInfo: true,
          removeOCProperties: true,
          removeDSS: true,
          removeAF: true,
          removeDests: true,
          removeNames: true,
          removeID: true,
          removeEncrypt: true,
          removeStructTreeRoot: true,
          removeCatalog: true,
          removeInfo: true,
          removeXRef: true,
          removeTrailer: true,
          removeRoot: true
        }
      },
      {
        id: 'privacy-focused',
        name: 'Privacy Focused',
        description: 'Remove all identifying information while preserving document structure',
        category: 'custom',
        icon: 'EyeOff',
        options: {
          removeDocumentInfo: true,
          removeProducer: true,
          removeCreator: true,
          removeCreationDate: true,
          removeModificationDate: true,
          removeKeywords: true,
          removeSubject: true,
          removeAuthor: true,
          removeTitle: true,
          removeTrapped: true,
          removeXMPMetadata: true,
          removeICCProfiles: false,
          removeColorProfiles: false,
          removeOutputIntents: false,
          removePageLayout: false,
          removePageMode: false,
          removeViewerPreferences: false,
          removeOpenAction: false,
          removeAdditionalStreams: false,
          removeStructureTree: false,
          removeMarkInfo: false,
          removeLang: false,
          removeSpiderInfo: true,
          removeCollection: true,
          removeNeedsRendering: false,
          removePieceInfo: true,
          removeOCProperties: false,
          removeDSS: false,
          removeAF: false,
          removeDests: false,
          removeNames: false,
          removeID: true,
          removeEncrypt: false,
          removeStructTreeRoot: false,
          removeCatalog: false,
          removeInfo: true,
          removeXRef: false,
          removeTrailer: false,
          removeRoot: false
        }
      },
      {
        id: 'minimal',
        name: 'Minimal Cleaning',
        description: 'Remove only the most basic document information',
        category: 'basic',
        icon: 'ShieldMinus',
        options: {
          removeDocumentInfo: true,
          removeProducer: false,
          removeCreator: false,
          removeCreationDate: false,
          removeModificationDate: false,
          removeKeywords: true,
          removeSubject: false,
          removeAuthor: false,
          removeTitle: false,
          removeTrapped: false
        }
      }
    ];
  }

  // Validate metadata removal request
  validateRequest(request: RemoveMetadataRequest): { valid: boolean; message?: string } {
    if (!request.file) {
      return { valid: false, message: 'Please select a PDF file' };
    }

    if (request.file.type !== 'application/pdf') {
      return { valid: false, message: 'Please select a valid PDF file' };
    }

    // Check if at least one cleaning option is selected
    const hasCleaningOptions = Object.entries(request).some(([key, value]) => {
      if (key === 'file') return false;
      return value === true;
    });

    if (!hasCleaningOptions) {
      return { valid: false, message: 'Please select at least one metadata item to remove' };
    }

    return { valid: true };
  }

  // Get metadata summary for display
  getMetadataSummary(metadataInfo: any): string[] {
    const summary: string[] = [];
    
    if (metadataInfo.qpdfInfo && !metadataInfo.qpdfInfo.includes('File is not encrypted')) {
      summary.push('PDF encryption info detected');
    }
    
    if (metadataInfo.exifInfo && metadataInfo.exifInfo.length > 0) {
      summary.push('Extended metadata found');
    }
    
    if (metadataInfo.pdfInfo && metadataInfo.pdfInfo.length > 0) {
      summary.push('PDF document info present');
    }
    
    if (summary.length === 0) {
      summary.push('No significant metadata detected');
    }
    
    return summary;
  }
}

export const removeMetadataService = new RemoveMetadataService();
