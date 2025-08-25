// Reorder PDF Types

export interface ReorderPDFRequest {
  file: File;
  order: number[];
}

export interface ReorderPDFResponse {
  success: boolean;
  message?: string;
  file?: {
    filename: string;
    path: string;
    size: number;
  };
  downloadUrl?: string;
  newOrder?: number[];
  totalPages?: number;
  error?: string;
}

// PDFInfo is available from common types when needed

export interface ReorderPageItem {
  id: string;
  pageNumber: number;
  originalIndex: number;
}
