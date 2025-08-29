export interface OCRLanguage {
  code: string;
  name: string;
  confidence: number;
}

export interface OCRRequest {
  files: File[];
  language: string;
  accuracy: 'fast' | 'balanced' | 'accurate';
  outputFormat: 'pdf' | 'txt';
  options?: {
    autoDeskew?: boolean;
    removeNoise?: boolean;
    enhanceImage?: boolean;
    preserveFormatting?: boolean;
    createTextLayer?: boolean;
  };
}

export interface OCRResponse {
  success: boolean;
  results: OCRResult[];
  errors: OCRError[];
  summary: {
    totalFiles: number;
    successfulFiles: number;
    failedFiles: number;
    language: string;
    accuracy: string;
    outputFormat: string;
  };
}

export interface OCRResult {
  filename: string;
  outputFilename: string;
  downloadUrl: string;
  originalSize: number;
  processedSize: number;
  confidence: string;
  textLength: number;
  language: string;
  accuracy: string;
  outputFormat: string;
}

export interface OCRError {
  filename: string;
  error: string;
}

export interface OCRTools {
  tesseract: {
    installed: boolean;
    version?: string;
    message: string;
  };
  ghostscript: {
    installed: boolean;
    version?: string;
    message: string;
  };
  imagemagick: {
    installed: boolean;
    version?: string;
    message: string;
  };
}

export interface OCRProgress {
  currentFile: number;
  totalFiles: number;
  currentFileName: string;
  percentage: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
}
