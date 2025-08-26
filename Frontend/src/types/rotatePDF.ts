// Rotate PDF Types

export interface RotatePDFRequest {
  file: File;
  rotations: RotationData[];
}

export interface RotationData {
  page: number;
  angle: 90 | 180 | 270;
}

export interface RotatePDFResponse {
  success: boolean;
  message?: string;
  file?: {
    filename: string;
    path: string;
    size: number;
  };
  downloadUrl?: string;
  rotations?: RotationData[];
  totalRotations?: number;
  error?: string;
}

// PDFInfo is available from common types when needed

export interface RotatePageItem {
  id: string;
  pageNumber: number;
  currentRotation: number;
  selectedRotation: number;
}
