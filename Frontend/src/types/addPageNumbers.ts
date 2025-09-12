export interface AddPageNumbersRequest {
  file: File;
  position: 'top-left' | 'top-center' | 'top-right' | 
           'bottom-left' | 'bottom-center' | 'bottom-right' |
           'middle-left' | 'middle-right' | 'center';
  fontSize: number;
  fontColor: string;
  startPage: number;
  endPage?: number;
  format: string;
  margin: number;
  customText?: string;
  excludePages?: number[];
}

export interface AddPageNumbersResponse {
  success: boolean;
  message: string;
  filename: string;
  downloadUrl: string;
  totalPages: number;
  pagesModified: number;
}

export interface PageNumberPreviewRequest {
  file: File;
  position: 'top-left' | 'top-center' | 'top-right' | 
           'bottom-left' | 'bottom-center' | 'bottom-right' |
           'middle-left' | 'middle-right' | 'center';
  fontSize: number;
  fontColor: string;
  format: string;
  margin: number;
  excludePages?: number[];
}

export interface PageNumberPreviewResponse {
  success: boolean;
  message: string;
  filename: string;
  previewUrl: string;
  totalPages: number;
  sampleText: string;
}

export interface PageNumberPosition {
  value: string;
  label: string;
  description: string;
}

export interface PageNumberFormat {
  value: string;
  label: string;
  description: string;
}
