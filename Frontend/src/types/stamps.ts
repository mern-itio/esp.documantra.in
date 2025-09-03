// Add Stamps Types

export interface StampRequest {
  file: File;
  stampType: StampType;
  customText?: string;
  customImage?: File;
  position: StampPosition;
  pageNumber: string;
  stampColor: StampColor;
  stampSize: StampSize;
  includeDate?: boolean;
  dateFormat?: string;
  opacity?: number;
}

export interface StampResponse {
  success: boolean;
  message: string;
  filename: string;
  downloadUrl: string;
  previewUrl?: string;
  originalFileSize: number;
  fileSize: number;
  stampDetails: StampDetails;
}

export interface StampDetails {
  totalStamps: number;
  pagesStamped: number;
  fallbackUsed?: boolean;
}

export interface StampType {
  value: string;
  label: string;
  description: string;
}

export interface StampOptions {
  stampType: StampType;
  customText: string;
  position: StampPosition;
  pageNumber: string;
  stampColor: StampColor;
  stampSize: StampSize;
  includeDate: boolean;
  dateFormat: string;
  opacity: number;
}

export interface StampStats {
  totalStamps: number;
  pagesAffected: number;
  stampType: string;
  fileSizeIncrease: number;
}

export interface StampValidation {
  valid: boolean;
  errors?: string[];
  message?: string;
}

export interface StampHistory {
  id: string;
  timestamp: string;
  filename: string;
  stampType: string;
  totalStamps: number;
  fileSize: number;
  downloadUrl: string;
}

export interface StampSettings {
  defaultStampColor: StampColor;
  defaultStampSize: StampSize;
  defaultPosition: StampPosition;
  defaultIncludeDate: boolean;
  defaultDateFormat: string;
  defaultOpacity: number;
  autoSave: boolean;
}

export interface StampPreset {
  id: string;
  name: string;
  description: string;
  stampType: StampType;
  customText?: string;
  position: StampPosition;
  stampColor: StampColor;
  stampSize: StampSize;
  includeDate: boolean;
  dateFormat: string;
  opacity: number;
  category: string;
  isDefault: boolean;
}

export interface StampTemplate {
  id: string;
  name: string;
  description: string;
  stamps: StampTemplateItem[];
  category: string;
  tags: string[];
}

export interface StampTemplateItem {
  stampType: StampType;
  customText?: string;
  position: StampPosition;
  stampColor: StampColor;
  stampSize: StampSize;
  includeDate: boolean;
  dateFormat: string;
  opacity: number;
  order: number;
  enabled: boolean;
}

export interface StampAnalytics {
  totalStamps: number;
  mostUsedStampTypes: Array<{ type: string; count: number }>;
  averageStampsPerDocument: number;
  mostCommonPositions: Array<{ position: StampPosition; count: number }>;
  mostCommonColors: Array<{ color: StampColor; count: number }>;
}

// Enums
export type StampTypeValue = 
  | 'approved'
  | 'confidential'
  | 'draft'
  | 'urgent'
  | 'reviewed'
  | 'signed'
  | 'received'
  | 'rejected'
  | 'pending'
  | 'custom';

export type StampPosition = 
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type StampColor = 
  | 'red'
  | 'blue'
  | 'green'
  | 'black'
  | 'gray'
  | 'orange'
  | 'purple';

export type StampSize = 
  | 'small'
  | 'medium'
  | 'large'
  | 'xlarge';

// Stamp Library Types
export interface StampLibrary {
  categories: StampCategory[];
  totalStamps: number;
}

export interface StampCategory {
  id: string;
  name: string;
  description: string;
  stamps: StampDefinition[];
  icon: string;
}

export interface StampDefinition {
  id: string;
  name: string;
  description: string;
  type: StampTypeValue;
  customText?: string;
  defaultColor: StampColor;
  defaultSize: StampSize;
  defaultPosition: StampPosition;
  category: string;
  tags: string[];
  preview: string;
}

// Date Format Types
export interface DateFormat {
  value: string;
  label: string;
  example: string;
}

// Batch Stamping Types
export interface BatchStampRequest {
  files: File[];
  stampType: StampType;
  customText?: string;
  position: StampPosition;
  pageNumber: string;
  stampColor: StampColor;
  stampSize: StampSize;
  includeDate?: boolean;
  dateFormat?: string;
  opacity?: number;
}

export interface BatchStampResponse {
  success: boolean;
  message: string;
  results: BatchStampResult[];
  totalFiles: number;
  successfulFiles: number;
  failedFiles: number;
}

export interface BatchStampResult {
  filename: string;
  success: boolean;
  message?: string;
  downloadUrl?: string;
  stampDetails?: StampDetails;
  error?: string;
}

// Preview Types
export interface StampPreview {
  success: boolean;
  totalStamps: number;
  pagesAffected: number[];
  stampPositions: StampPositionInfo[];
}

export interface StampPositionInfo {
  page: number;
  position: StampPosition;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  stampText: string;
  stampColor: StampColor;
  stampSize: StampSize;
}

// Advanced Stamping Types
export interface AdvancedStampOptions {
  multipleStamps: boolean;
  stampRotation: number;
  stampOpacity: number;
  customFont: string;
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'none';
  borderWidth: number;
  borderColor: StampColor;
  backgroundColor: StampColor;
  textColor: StampColor;
  shadowEnabled: boolean;
  shadowColor: StampColor;
  shadowOffset: {
    x: number;
    y: number;
  };
}

export interface MultiStampRequest {
  file: File;
  stamps: MultiStampItem[];
  pageNumber: string;
}

export interface MultiStampItem {
  stampType: StampType;
  customText?: string;
  position: StampPosition;
  stampColor: StampColor;
  stampSize: StampSize;
  includeDate: boolean;
  dateFormat: string;
  opacity: number;
  order: number;
  enabled: boolean;
}
