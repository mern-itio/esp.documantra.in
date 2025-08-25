// Extract PDF Types

export interface ExtractPagesRequest {
  file: File;
  pageNumbers: number[];
  outputName?: string;
}

export interface ExtractRangeRequest {
  file: File;
  startPage: number;
  endPage: number;
  outputName?: string;
}

export interface ExtractCustomRequest {
  file: File;
  selections: Array<{
    type: 'page' | 'range';
    value: number | { start: number; end: number };
  }>;
  outputName?: string;
}

export interface ExtractPDFResponse {
  success: boolean;
  message?: string;
  file?: {
    filename: string;
    path: string;
    size: number;
  };
  extractedPages?: number[];
  extractedRange?: { startPage: number; endPage: number };
  selections?: Array<{
    type: 'page' | 'range';
    value: number | { start: number; end: number };
  }>;
  totalPages?: number;
  error?: string;
}

// PDFInfo is available from common types when needed

export interface PageSelection {
  id: string;
  type: 'page' | 'range';
  value: number | { start: number; end: number };
  name?: string;
}
