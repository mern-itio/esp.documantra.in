export interface AddHeaderFooterRequest {
  file: File;
  headerText?: string;
  footerText?: string;
  headerPosition?: string;
  footerPosition?: string;
  fontSize?: number;
  fontColor?: string;
  startPage?: number;
  endPage?: number;
  margin?: number;
  customHeaderText?: string;
  customFooterText?: string;
  excludePages?: number[];
  headerEnabled?: boolean;
  footerEnabled?: boolean;
}

export interface HeaderFooterPreviewRequest {
  file: File;
  headerText?: string;
  footerText?: string;
  headerPosition?: string;
  footerPosition?: string;
  fontSize?: number;
  fontColor?: string;
  startPage?: number;
  endPage?: string;
  margin?: number;
  customHeaderText?: string;
  customFooterText?: string;
  excludePages?: string;
  headerEnabled?: boolean;
  footerEnabled?: boolean;
}

export interface HeaderFooterResponse {
  success: boolean;
  message: string;
  filename: string;
  downloadUrl?: string;
  previewUrl: string;
  totalPages: number;
  pagesModified?: number;
  sampleText?: string;
}
