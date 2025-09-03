export interface EditMetadataRequest {
  file: File;
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  trapped?: string;
  customProperties?: Record<string, string>;
}

export interface EditMetadataResponse {
  success: boolean;
  message: string;
  filename: string;
  downloadUrl: string;
  totalPages: number;
  fileSize: number;
  originalFileSize: number;
  metadataInfo: {
    updatedMetadata?: string;
  };
  appliedMetadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
    modificationDate?: string;
    trapped?: string;
    customProperties?: Record<string, string>;
  };
}

export interface MetadataCheckResponse {
  success: boolean;
  metadataFound: boolean;
  metadataInfo: {
    exifInfo?: string;
    qpdfInfo?: string;
    currentMetadata?: {
      title?: string;
      author?: string;
      subject?: string;
      keywords?: string;
      creator?: string;
      producer?: string;
      creationDate?: string;
      modificationDate?: string;
      trapped?: string;
    };
  };
  message: string;
}

export interface MetadataTemplate {
  id: string;
  name: string;
  description: string;
  category: 'basic' | 'professional' | 'academic' | 'legal' | 'custom';
  icon: string;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
    modificationDate?: string;
    trapped?: string;
    customProperties?: Record<string, string>;
  };
}

export interface BulkEditOptions {
  applyToAll: boolean;
  preserveExisting: boolean;
  overwriteMode: 'replace' | 'append' | 'prepend';
  customProperties: Record<string, string>;
}

export interface MetadataField {
  key: string;
  label: string;
  type: 'text' | 'date' | 'select' | 'textarea';
  placeholder?: string;
  options?: string[];
  required?: boolean;
  description?: string;
  category: 'basic' | 'advanced' | 'custom';
}
