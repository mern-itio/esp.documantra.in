export interface FormatAnalysis {
  detectedFormat: string;
  confidence: number;
  fileType: string;
  characteristics: string[];
  metadata: {
    size: number;
    created: Date;
    modified: Date;
    extension: string;
    mimeType: string;
    pageCount?: number;
    hasImages?: boolean;
    hasText?: boolean;
    hasForms?: boolean;
    pageSize?: {
      width: number;
      height: number;
    };
  };
  quality: 'poor' | 'medium' | 'good' | 'high' | 'excellent';
  complexity: 'low' | 'medium' | 'high';
  recommendations?: ConversionRecommendations;
}

export interface ConversionRecommendations {
  targetFormats: string[];
  qualitySettings: {
    compressionLevel: 'low' | 'medium' | 'high';
    imageQuality: number;
    preserveMetadata: boolean;
  };
  optimizationTips: string[];
  warnings: string[];
}

export interface SmartConversionRequest {
  file: File;
  targetFormat: 'pdf' | 'word' | 'excel' | 'powerpoint' | 'html' | 'txt' | 'image';
  qualityLevel: 'auto' | 'high' | 'medium' | 'low';
  preserveLayout: boolean;
  optimizeForWeb: boolean;
  customSettings?: {
    compressionLevel?: 'low' | 'medium' | 'high';
    imageQuality?: number;
    removeMetadata?: boolean;
    linearize?: boolean;
    objectStreams?: 'disable' | 'preserve' | 'generate';
    compressionMethod?: 'auto' | 'jpeg' | 'flate';
    maxImageResolution?: number;
  };
}

export interface SmartConversionResponse {
  success: boolean;
  conversion: {
    sourceFormat: string;
    targetFormat: string;
    outputFilename: string;
    downloadUrl: string;
    originalSize: number;
    convertedSize: number;
    sizeChange: number;
    sizeChangePercent: string;
  };
  quality: QualityAnalysis;
  settings: ConversionSettings;
  message: string;
}

export interface BatchSmartConversionRequest {
  files: File[];
  targetFormat: 'pdf' | 'word' | 'excel' | 'powerpoint' | 'html' | 'txt' | 'image';
  qualityLevel: 'auto' | 'high' | 'medium' | 'low';
  preserveLayout: boolean;
  optimizeForWeb: boolean;
  customSettings?: {
    compressionLevel?: 'low' | 'medium' | 'high';
    imageQuality?: number;
    removeMetadata?: boolean;
    linearize?: boolean;
    objectStreams?: 'disable' | 'preserve' | 'generate';
    compressionMethod?: 'auto' | 'jpeg' | 'flate';
    maxImageResolution?: number;
  };
}

export interface BatchSmartConversionResponse {
  success: boolean;
  results: BatchConversionResult[];
  errors: BatchConversionError[];
  summary: {
    totalFiles: number;
    successful: number;
    failed: number;
  };
  message: string;
}

export interface BatchConversionResult {
  originalName: string;
  outputFilename: string;
  downloadUrl: string;
  originalSize: number;
  convertedSize: number;
  sizeChange: number;
  sizeChangePercent: string;
  quality: QualityAnalysis;
}

export interface BatchConversionError {
  filename: string;
  error: string;
}

export interface QualityAnalysis {
  quality: 'poor' | 'acceptable' | 'good' | 'excellent';
  fileSize: number;
  characteristics: string[];
  recommendations: string[];
}

export interface ConversionSettings {
  targetFormat: string;
  qualityLevel: string;
  preserveLayout: boolean;
  optimizeForWeb: boolean;
  customSettings: {
    compressionLevel?: string;
    imageQuality?: number;
    removeMetadata?: boolean;
    linearize?: boolean;
    objectStreams?: string;
    compressionMethod?: string;
    maxImageResolution?: number;
  };
}

export interface ConversionPreset {
  name: string;
  description: string;
  targetFormat: 'pdf' | 'word' | 'excel' | 'powerpoint' | 'html' | 'txt' | 'image';
  qualityLevel: 'high' | 'medium' | 'low';
  optimizeForWeb: boolean;
  preserveLayout: boolean;
  customSettings: {
    compressionLevel: 'low' | 'medium' | 'high';
    imageQuality: number;
    removeMetadata: boolean;
    linearize: boolean;
    objectStreams?: 'disable' | 'preserve' | 'generate';
    compressionMethod?: 'auto' | 'jpeg' | 'flate';
    maxImageResolution?: number;
  };
  useCase: string;
  estimatedTime: string;
  fileSizeImpact: string;
}

export interface FormatDetectionResponse {
  success: boolean;
  analysis: FormatAnalysis;
  recommendations: ConversionRecommendations;
  message: string;
}

export interface ConversionPresetsResponse {
  success: boolean;
  presets: {
    webOptimized: ConversionPreset;
    printQuality: ConversionPreset;
    archive: ConversionPreset;
    mobile: ConversionPreset;
  };
  message: string;
}

export interface SmartConversionState {
  selectedFile: File | null;
  formatAnalysis: FormatAnalysis | null;
  conversionResult: SmartConversionResponse | null;
  batchResults: BatchSmartConversionResponse | null;
  isAnalyzing: boolean;
  isConverting: boolean;
  isBatchConverting: boolean;
  error: string | null;
  selectedPreset: ConversionPreset | null;
  customSettings: SmartConversionRequest['customSettings'];
  targetFormat: SmartConversionRequest['targetFormat'];
  qualityLevel: SmartConversionRequest['qualityLevel'];
  preserveLayout: boolean;
  optimizeForWeb: boolean;
}

export interface ConversionProgress {
  fileIndex: number;
  totalFiles: number;
  currentFile: string;
  progress: number;
  status: 'analyzing' | 'converting' | 'completed' | 'error';
  message: string;
}

export interface SupportedFormat {
  extension: string;
  mimeType: string;
  name: string;
  category: 'document' | 'spreadsheet' | 'presentation' | 'image' | 'text' | 'vector';
  canConvertTo: string[];
  icon: string;
}

export const SUPPORTED_FORMATS: SupportedFormat[] = [
  // Documents
  { extension: '.pdf', mimeType: 'application/pdf', name: 'PDF', category: 'document', canConvertTo: ['word', 'excel', 'powerpoint', 'html', 'txt'], icon: '📄' },
  { extension: '.doc', mimeType: 'application/msword', name: 'Word (Legacy)', category: 'document', canConvertTo: ['pdf', 'excel'], icon: '📝' },
  { extension: '.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', name: 'Word', category: 'document', canConvertTo: ['pdf', 'excel'], icon: '📝' },
  { extension: '.rtf', mimeType: 'application/rtf', name: 'Rich Text', category: 'document', canConvertTo: ['pdf'], icon: '📄' },
  { extension: '.odt', mimeType: 'application/vnd.oasis.opendocument.text', name: 'OpenDocument Text', category: 'document', canConvertTo: ['pdf'], icon: '📄' },
  
  // Spreadsheets
  { extension: '.xls', mimeType: 'application/vnd.ms-excel', name: 'Excel (Legacy)', category: 'spreadsheet', canConvertTo: ['pdf', 'word'], icon: '📊' },
  { extension: '.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', name: 'Excel', category: 'spreadsheet', canConvertTo: ['pdf', 'word'], icon: '📊' },
  { extension: '.ods', mimeType: 'application/vnd.oasis.opendocument.spreadsheet', name: 'OpenDocument Spreadsheet', category: 'spreadsheet', canConvertTo: ['pdf'], icon: '📊' },
  
  // Presentations
  { extension: '.ppt', mimeType: 'application/vnd.ms-powerpoint', name: 'PowerPoint (Legacy)', category: 'presentation', canConvertTo: ['pdf'], icon: '📽️' },
  { extension: '.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', name: 'PowerPoint', category: 'presentation', canConvertTo: ['pdf'], icon: '📽️' },
  { extension: '.odp', mimeType: 'application/vnd.oasis.opendocument.presentation', name: 'OpenDocument Presentation', category: 'presentation', canConvertTo: ['pdf'], icon: '📽️' },
  
  // Images
  { extension: '.jpg', mimeType: 'image/jpeg', name: 'JPEG', category: 'image', canConvertTo: ['pdf'], icon: '🖼️' },
  { extension: '.jpeg', mimeType: 'image/jpeg', name: 'JPEG', category: 'image', canConvertTo: ['pdf'], icon: '🖼️' },
  { extension: '.png', mimeType: 'image/png', name: 'PNG', category: 'image', canConvertTo: ['pdf'], icon: '🖼️' },
  { extension: '.gif', mimeType: 'image/gif', name: 'GIF', category: 'image', canConvertTo: ['pdf'], icon: '🖼️' },
  { extension: '.bmp', mimeType: 'image/bmp', name: 'BMP', category: 'image', canConvertTo: ['pdf'], icon: '🖼️' },
  { extension: '.tiff', mimeType: 'image/tiff', name: 'TIFF', category: 'image', canConvertTo: ['pdf'], icon: '🖼️' },
  
  // Text
  { extension: '.txt', mimeType: 'text/plain', name: 'Plain Text', category: 'text', canConvertTo: ['pdf'], icon: '📄' },
  
  // HTML
  { extension: '.html', mimeType: 'text/html', name: 'HTML', category: 'text', canConvertTo: ['pdf'], icon: '🌐' },
  { extension: '.htm', mimeType: 'text/html', name: 'HTML', category: 'text', canConvertTo: ['pdf'], icon: '🌐' },
  
  // Vector
  { extension: '.svg', mimeType: 'image/svg+xml', name: 'SVG', category: 'image', canConvertTo: ['pdf'], icon: '🎨' },
  { extension: '.eps', mimeType: 'application/postscript', name: 'EPS', category: 'image', canConvertTo: ['pdf'], icon: '🎨' },
  { extension: '.ai', mimeType: 'application/illustrator', name: 'Illustrator', category: 'image', canConvertTo: ['pdf'], icon: '🎨' }
];

export const CONVERSION_PRESETS: ConversionPreset[] = [
  {
    name: 'Web Optimized',
    description: 'Optimized for web viewing and sharing',
    targetFormat: 'pdf',
    qualityLevel: 'medium',
    optimizeForWeb: true,
    preserveLayout: true,
    customSettings: {
      compressionLevel: 'high',
      imageQuality: 75,
      removeMetadata: true,
      linearize: true,
      objectStreams: 'generate',
      compressionMethod: 'auto',
      maxImageResolution: 150
    },
    useCase: 'Web sharing, email attachments, online viewing',
    estimatedTime: '30-60 seconds',
    fileSizeImpact: 'Significant reduction (50-80%)'
  },
  {
    name: 'Print Quality',
    description: 'High quality for professional printing',
    targetFormat: 'pdf',
    qualityLevel: 'high',
    optimizeForWeb: false,
    preserveLayout: true,
    customSettings: {
      compressionLevel: 'low',
      imageQuality: 95,
      removeMetadata: false,
      linearize: false,
      objectStreams: 'preserve',
      compressionMethod: 'auto',
      maxImageResolution: 300
    },
    useCase: 'Professional printing, archival, high-quality documents',
    estimatedTime: '60-120 seconds',
    fileSizeImpact: 'Minimal reduction (10-20%)'
  },
  {
    name: 'Archive',
    description: 'Long-term storage with maximum compression',
    targetFormat: 'pdf',
    qualityLevel: 'medium',
    optimizeForWeb: false,
    preserveLayout: true,
    customSettings: {
      compressionLevel: 'high',
      imageQuality: 85,
      removeMetadata: true,
      linearize: true,
      objectStreams: 'generate',
      compressionMethod: 'auto',
      maxImageResolution: 200
    },
    useCase: 'Long-term storage, backup, space optimization',
    estimatedTime: '45-90 seconds',
    fileSizeImpact: 'High reduction (60-85%)'
  },
  {
    name: 'Mobile Friendly',
    description: 'Optimized for mobile devices',
    targetFormat: 'pdf',
    qualityLevel: 'medium',
    optimizeForWeb: true,
    preserveLayout: true,
    customSettings: {
      compressionLevel: 'high',
      imageQuality: 70,
      removeMetadata: true,
      linearize: true,
      objectStreams: 'generate',
      compressionMethod: 'auto',
      maxImageResolution: 150
    },
    useCase: 'Mobile viewing, tablets, small screens',
    estimatedTime: '30-60 seconds',
    fileSizeImpact: 'High reduction (60-80%)'
  }
];
