export interface BatchOptimizationRequest {
  files: File[];
  preset: 'web_optimized' | 'print_optimized' | 'mobile_optimized' | 'archive_optimized' | 'custom';
  customSettings?: {
    compressionLevel?: 'low' | 'medium' | 'high';
    imageQuality?: number;
    downscaleImages?: boolean;
    maxImageResolution?: number;
    removeMetadata?: boolean;
    linearize?: boolean;
    objectStreams?: 'disable' | 'preserve' | 'generate';
    compressionMethod?: 'auto' | 'jpeg' | 'flate';
  };
  optimizationProfile?: 'balanced' | 'quality' | 'size' | 'speed';
}

export interface BatchOptimizationResponse {
  success: boolean;
  message: string;
  results: BatchOptimizationResult[];
  errors: BatchOptimizationError[];
  summary: {
    totalFiles: number;
    successfulFiles: number;
    failedFiles: number;
    totalOriginalSize: number;
    totalOptimizedSize: number;
    averageCompressionRatio: string;
  };
  batchDownloadUrl?: string;
  preset: string;
  settings: any;
}

export interface BatchOptimizationResult {
  filename: string;
  outputFilename: string;
  downloadUrl: string;
  originalSize: number;
  optimizedSize: number;
  sizeChange: number;
  sizeChangePercent: string;
  sizeReduction: number;
  compressionRatio: string;
  success: boolean;
  preset: string;
  settings: any;
}

export interface BatchOptimizationError {
  filename: string;
  error: string;
  success: boolean;
}

export interface OptimizationPreset {
  id: string;
  name: string;
  description: string;
  settings: {
    compressionLevel: 'low' | 'medium' | 'high';
    imageQuality: number;
    downscaleImages: boolean;
    maxImageResolution: number;
    removeMetadata: boolean;
    linearize: boolean;
    objectStreams: 'disable' | 'preserve' | 'generate';
    compressionMethod: 'auto' | 'jpeg' | 'flate';
    webOptimization?: boolean;
    fastLoading?: boolean;
    printOptimization?: boolean;
    highQuality?: boolean;
    mobileOptimization?: boolean;
    smallSize?: boolean;
    archiveOptimization?: boolean;
    balanced?: boolean;
  };
  estimatedReduction: string;
  useCase: string;
}

export interface OptimizationTools {
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

export interface BatchOptimizationProgress {
  currentFile: number;
  totalFiles: number;
  currentFileName: string;
  percentage: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
}
