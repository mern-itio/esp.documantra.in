export interface MakeSearchableRequest {
  files: File[];
  language: string;
  accuracy: 'fast' | 'balanced' | 'accurate';
  preserveLayout: boolean;
  createInvisibleLayer: boolean;
  enhanceImage: boolean;
  removeNoise: boolean;
}

export interface MakeSearchableResponse {
  success: boolean;
  results: MakeSearchableResult[];
  errors: MakeSearchableError[];
  summary: {
    totalFiles: number;
    successfulFiles: number;
    failedFiles: number;
    language: string;
    accuracy: string;
    preserveLayout: boolean;
    createInvisibleLayer: boolean;
  };
}

export interface MakeSearchableResult {
  filename: string;
  outputFilename: string;
  downloadUrl: string;
  originalSize: number;
  processedSize: number;
  confidence: string;
  textLength: number;
  language: string;
  accuracy: string;
  preserveLayout: boolean;
  createInvisibleLayer: boolean;
}

export interface MakeSearchableError {
  filename: string;
  error: string;
}

export interface MakeSearchableTools {
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
  pdftk: {
    installed: boolean;
    version?: string;
    message: string;
  };
}

export interface MakeSearchableProgress {
  currentFile: number;
  totalFiles: number;
  currentFileName: string;
  percentage: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
}
