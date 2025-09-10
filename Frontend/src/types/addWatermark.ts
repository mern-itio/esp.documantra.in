export interface AddTextWatermarkRequest {
  file: File;
  text: string;
  position: string;
  fontSize: number;
  fontColor: string;
  opacity: number;
  rotation: number;
  startPage: number;
  endPage?: number;
  excludePages?: string;
}

export interface AddImageWatermarkRequest {
  pdfFile: File;
  imageFile: File;
  position: string;
  opacity: number;
  rotation: number;
  scale: number;
  startPage: number;
  endPage?: number;
  excludePages?: string;
}

export interface WatermarkPreviewRequest {
  file: File;
  text: string;
  position: string;
  fontSize: number;
  fontColor: string;
  opacity: number;
  rotation: number;
  startPage?: number;
  endPage?: string;
  excludePages?: string;
  previewPage?: number; // Made optional for backward compatibility
}

export interface WatermarkResponse {
  success: boolean;
  message: string;
  filename: string;
  downloadUrl: string;
  fileSize: number;
  pagesProcessed: number;
}

export interface WatermarkPreviewResponse {
  success: boolean;
  message: string;
  filename: string;
  previewUrl: string;
  fileSize: number;
}

export interface WatermarkPosition {
  value: string;
  label: string;
  description: string;
}

export interface WatermarkPreset {
  value: string;
  label: string;
  description: string;
  text: string;
  fontSize: number;
  fontColor: string;
  opacity: number;
  rotation: number;
}
