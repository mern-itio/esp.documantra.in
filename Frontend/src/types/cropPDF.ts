// Crop PDF Types

export interface CropPDFRequest {
  file: File;
  crops: CropData[];
}

export interface CropData {
  page: number;
  cropArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface CropPDFResponse {
  success: boolean;
  message?: string;
  file?: {
    filename: string;
    path: string;
    size: number;
  };
  downloadUrl?: string;
  crops?: CropData[];
  totalCrops?: number;
  error?: string;
}

// PDFInfo is available from common types when needed

export interface CropPageItem {
  id: string;
  pageNumber: number;
  cropArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface CropSelection {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  width: number;
  height: number;
}
