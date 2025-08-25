// Delete PDF Types

export interface DeletePDFRequest {
  file: File;
  pagesToDelete: number[];
}

export interface DeletePDFResponse {
  success: boolean;
  message?: string;
  file?: {
    filename: string;
    path: string;
    size: number;
  };
  downloadUrl?: string;
  deletedPages?: number[];
  remainingPages?: number;
  totalDeleted?: number;
  error?: string;
}

// PDFInfo is available from common types when needed

export interface DeletePageItem {
  id: string;
  pageNumber: number;
  isSelected: boolean;
}
