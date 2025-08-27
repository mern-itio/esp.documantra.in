export interface CompressPDFRequest {
  file: File;
  compressionLevel: 'low' | 'medium' | 'high' | 'custom';
  imageQuality?: number;
  downscaleImages?: boolean;
  maxImageResolution?: number;
  removeMetadata?: boolean;
  linearize?: boolean;
  objectStreams?: 'disable' | 'preserve' | 'generate';
  compressionMethod?: 'auto' | 'jpeg' | 'flate';
  customSettings?: {
    compressionLevel?: number;
    imageQuality?: number;
    objectStreams?: string;
  };
}

export interface CompressPDFResponse {
  success: boolean;
  message: string;
  filename: string;
  downloadUrl: string;
  totalPages: number | string;
  fileSize: number;
  originalFileSize: number;
  sizeReduction: number;
  compressionRatio: string;
  compressionSettings: {
    compressionLevel: string;
    imageQuality: number;
    downscaleImages: boolean;
    maxImageResolution: number;
    removeMetadata: boolean;
    linearize: boolean;
    objectStreams: string;
    compressionMethod: string;
  };
}

export interface CompressionPreset {
  id: string;
  name: string;
  description: string;
  compressionLevel: 'low' | 'medium' | 'high' | 'custom';
  imageQuality: number;
  downscaleImages: boolean;
  maxImageResolution: number;
  removeMetadata: boolean;
  linearize: boolean;
  objectStreams: 'disable' | 'preserve' | 'generate';
  compressionMethod: 'auto' | 'jpeg' | 'flate';
  estimatedReduction: string;
  useCase: string;
}

export interface CompressionTools {
  qpdf: {
    installed: boolean;
    version?: string;
    message: string;
    error?: string;
  };
  ghostscript: {
    installed: boolean;
    version?: string;
    message: string;
    error?: string;
  };
}
