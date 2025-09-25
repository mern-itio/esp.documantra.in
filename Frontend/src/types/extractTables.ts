export interface ExtractTablesRequest {
  files: File[];
  // detectionMethod: 'auto' | 'manual' | 'all';
  outputFormat: 'xlsx' | 'csv' | 'xls';
  preserveFormatting: boolean;
  extractHeaders: boolean;
  mergeTables: boolean;
  pageRange?: string;
  // language: string;
}

export interface ExtractTablesResponse {
  success: boolean;
  results: ExtractTablesResult[];
  errors: ExtractTablesError[];
  summary: {
    totalFiles: number;
    successfulFiles: number;
    failedFiles: number;
    // detectionMethod: string;
    outputFormat: string;
    preserveFormatting: boolean;
    extractHeaders: boolean;
    mergeTables: boolean;
  };
}

export interface ExtractTablesResult {
  filename: string;
  outputFilename: string;
  downloadUrl: string;
  originalSize: number;
  processedSize: number;
  tablesDetected: number;
  totalRows: number;
  totalColumns: number;
  pagesProcessed?: number;
  // detectionMethod: string;
  outputFormat: string;
  preserveFormatting: boolean;
  extractHeaders: boolean;
  mergeTables: boolean;
  processingTime: number;
  // language: string;
}

export interface ExtractTablesError {
  filename: string;
  error: string;
}

export interface ExtractTablesTools {
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

export interface ExtractTablesProgress {
  currentFile: number;
  totalFiles: number;
  currentFileName: string;
  percentage: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
}
