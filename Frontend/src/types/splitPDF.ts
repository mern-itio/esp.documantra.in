// Split PDF Types

export interface SplitPDFRequest {
  file: File;
  mode: 'pages' | 'custom' | 'bookmarks' | 'size';
  pagesPerSplit?: number;
  maxSizeMB?: number;
  customRanges?: Array<{
    start: number;
    end: number;
    name?: string;
  }>;
}

export interface SplitPDFResponse {
  success: boolean;
  message?: string;
  splitInfo?: {
    mode: string;
    pagesPerSplit?: number;
    maxSizeMB?: number;
    ranges?: Array<{
      start: number;
      end: number;
      name?: string;
    }>;
  };
  files?: Array<{
    filename: string;
    path: string;
    size: number;
  }>;
  totalFiles?: number;
  error?: string;
}

// PDFInfo is available from common types when needed
