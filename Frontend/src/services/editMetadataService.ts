import axios from 'axios';
import type { 
  EditMetadataRequest, 
  EditMetadataResponse, 
  MetadataCheckResponse,
  MetadataTemplate,
  MetadataField
} from '../types/editMetadata';

class EditMetadataService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';
  }

  async getCurrentMetadata(file: File): Promise<MetadataCheckResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${this.baseURL}/pdf-edit-metadata/get-metadata`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async editMetadata(request: EditMetadataRequest): Promise<EditMetadataResponse> {
    const formData = new FormData();
    formData.append('file', request.file);

    // Add metadata fields to form data
    if (request.title) formData.append('title', request.title);
    if (request.author) formData.append('author', request.author);
    if (request.subject) formData.append('subject', request.subject);
    if (request.keywords) formData.append('keywords', request.keywords);
    if (request.creator) formData.append('creator', request.creator);
    if (request.producer) formData.append('producer', request.producer);
    if (request.creationDate) formData.append('creationDate', request.creationDate);
    if (request.modificationDate) formData.append('modificationDate', request.modificationDate);
    if (request.trapped) formData.append('trapped', request.trapped);
    
    // Add custom properties as JSON string
    if (request.customProperties && Object.keys(request.customProperties).length > 0) {
      formData.append('customProperties', JSON.stringify(request.customProperties));
    }

    const response = await axios.post(`${this.baseURL}/pdf-edit-metadata/edit-metadata`, formData, {
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

  // Predefined metadata templates
  getMetadataTemplates(): MetadataTemplate[] {
    return [
      {
        id: 'basic',
        name: 'Basic Document',
        description: 'Standard document metadata with basic information',
        category: 'basic',
        icon: 'FileText',
        metadata: {
          creator: 'PDF Editor',
          producer: 'PDF Service',
          trapped: 'False'
        }
      },
      {
        id: 'professional',
        name: 'Professional Document',
        description: 'Professional document with company branding',
        category: 'professional',
        icon: 'Briefcase',
        metadata: {
          creator: 'Professional PDF Editor',
          producer: 'Corporate PDF Service',
          trapped: 'False',
          customProperties: {
            'Company': 'Your Company Name',
            'Department': 'Your Department',
            'DocumentType': 'Professional'
          }
        }
      },
      {
        id: 'academic',
        name: 'Academic Paper',
        description: 'Academic document with scholarly metadata',
        category: 'academic',
        icon: 'GraduationCap',
        metadata: {
          creator: 'Academic PDF Editor',
          producer: 'Academic PDF Service',
          trapped: 'False',
          customProperties: {
            'Institution': 'Your University',
            'Department': 'Your Department',
            'DocumentType': 'Academic',
            'Version': '1.0'
          }
        }
      },
      {
        id: 'legal',
        name: 'Legal Document',
        description: 'Legal document with compliance metadata',
        category: 'legal',
        icon: 'Scale',
        metadata: {
          creator: 'Legal PDF Editor',
          producer: 'Legal PDF Service',
          trapped: 'True',
          customProperties: {
            'DocumentType': 'Legal',
            'Confidentiality': 'Confidential',
            'Version': '1.0',
            'ReviewDate': new Date().toISOString().split('T')[0]
          }
        }
      },
      {
        id: 'custom',
        name: 'Custom Template',
        description: 'Create your own custom metadata template',
        category: 'custom',
        icon: 'Settings',
        metadata: {}
      }
    ];
  }

  // Get metadata fields configuration
  getMetadataFields(): MetadataField[] {
    return [
      {
        key: 'title',
        label: 'Title',
        type: 'text',
        placeholder: 'Enter document title',
        description: 'The title of the document',
        category: 'basic',
        required: false
      },
      {
        key: 'author',
        label: 'Author',
        type: 'text',
        placeholder: 'Enter author name',
        description: 'The author of the document',
        category: 'basic',
        required: false
      },
      {
        key: 'subject',
        label: 'Subject',
        type: 'text',
        placeholder: 'Enter document subject',
        description: 'The subject of the document',
        category: 'basic',
        required: false
      },
      {
        key: 'keywords',
        label: 'Keywords',
        type: 'textarea',
        placeholder: 'Enter keywords (comma-separated)',
        description: 'Keywords describing the document content',
        category: 'basic',
        required: false
      },
      {
        key: 'creator',
        label: 'Creator',
        type: 'text',
        placeholder: 'Enter creator application',
        description: 'The application that created the document',
        category: 'basic',
        required: false
      },
      {
        key: 'producer',
        label: 'Producer',
        type: 'text',
        placeholder: 'Enter producer application',
        description: 'The application that produced the PDF',
        category: 'basic',
        required: false
      },
      {
        key: 'creationDate',
        label: 'Creation Date',
        type: 'date',
        placeholder: 'Select creation date',
        description: 'The date the document was created',
        category: 'basic',
        required: false
      },
      {
        key: 'modificationDate',
        label: 'Modification Date',
        type: 'date',
        placeholder: 'Select modification date',
        description: 'The date the document was last modified',
        category: 'basic',
        required: false
      },
      {
        key: 'trapped',
        label: 'Trapped',
        type: 'select',
        options: ['True', 'False', 'Unknown'],
        description: 'Whether the document is trapped for printing',
        category: 'advanced',
        required: false
      }
    ];
  }

  // Validate metadata editing request
  validateRequest(request: EditMetadataRequest): { valid: boolean; message?: string } {
    if (!request.file) {
      return { valid: false, message: 'Please select a PDF file' };
    }

    if (request.file.type !== 'application/pdf') {
      return { valid: false, message: 'Please select a valid PDF file' };
    }

    // Check if at least one metadata field is provided
    const hasMetadata = Object.entries(request).some(([key, value]) => {
      if (key === 'file') return false;
      if (key === 'customProperties') {
        return value && Object.keys(value).length > 0;
      }
      return value && value.toString().trim() !== '';
    });

    if (!hasMetadata) {
      return { valid: false, message: 'Please provide at least one metadata field to edit' };
    }

    return { valid: true };
  }

  // Get metadata summary for display
  getMetadataSummary(metadataInfo: any): string[] {
    const summary: string[] = [];
    
    if (metadataInfo.currentMetadata) {
      const current = metadataInfo.currentMetadata;
      if (current.title) summary.push(`Title: ${current.title}`);
      if (current.author) summary.push(`Author: ${current.author}`);
      if (current.subject) summary.push(`Subject: ${current.subject}`);
      if (current.keywords) summary.push(`Keywords: ${current.keywords}`);
      if (current.creator) summary.push(`Creator: ${current.creator}`);
      if (current.producer) summary.push(`Producer: ${current.producer}`);
    }
    
    if (summary.length === 0) {
      summary.push('No metadata found in this PDF');
    }
    
    return summary;
  }

  // Format date for display
  formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  }

  // Parse date from input
  parseDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return dateString;
    }
  }
}

export const editMetadataService = new EditMetadataService();
