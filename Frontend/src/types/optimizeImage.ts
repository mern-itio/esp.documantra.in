export interface OptimizeImageRequest {
  file: File;
  imageQuality?: number;
  maxResolution?: number;
  compressionLevel?: 'low' | 'medium' | 'high';
  formatConversion?: 'auto' | 'jpeg' | 'png' | 'webp';
  downscaleImages?: boolean;
  removeMetadata?: boolean;
  optimizeForWeb?: boolean;
  customSettings?: {
    imageQuality?: number;
    maxResolution?: number;
    formatConversion?: string;
  };
}

export interface OptimizeImageResponse {
  success: boolean;
  message: string;
  filename: string;
  downloadUrl: string;
  totalPages: number | string;
  fileSize: number;
  originalFileSize: number;
  sizeReduction: number;
  optimizationRatio: string;
  optimizationSettings: {
    imageQuality: number;
    maxResolution: number;
    compressionLevel: string;
    formatConversion: string;
    downscaleImages: boolean;
    removeMetadata: boolean;
    optimizeForWeb: boolean;
    toolsUsed: string;
  };
}

export interface OptimizationPreset {
  id: string;
  name: string;
  description: string;
  imageQuality: number;
  maxResolution: number;
  compressionLevel: 'low' | 'medium' | 'high';
  formatConversion: 'auto' | 'jpeg' | 'png' | 'webp';
  downscaleImages: boolean;
  removeMetadata: boolean;
  optimizeForWeb: boolean;
  estimatedReduction: string;
  useCase: string;
}

export interface OptimizationTools {
  success: boolean;
  tools: {
    ghostscript: { installed: boolean; version: string | null };
    imagemagick: { installed: boolean; version: string | null };
    qpdf: { installed: boolean; version: string | null };
  };
  recommendations: {
    ghostscript: string;
    imagemagick: string;
    qpdf: string;
  };
  error?: string;
  details?: string;
}
