// Color Optimization Types

export interface ColorOptimizationRequest {
  file: File;
  colorConversion?: boolean; // Note: Not actually supported by qpdf, kept for UI compatibility
  profileOptimization?: boolean;
  gamutMapping?: boolean;
  targetColorSpace?: 'auto'; // Only 'auto' is supported by qpdf
  preserveTransparency?: boolean;
  dithering?: boolean;
  quality?: 'low' | 'medium' | 'high';
  outputFormat?: string;
}

export interface ColorOptimizationResponse {
  success: boolean;
  message: string;
  filename: string;
  downloadUrl: string;
  originalSize: number;
  optimizedSize: number;
  sizeChange: number;
  sizeChangePercent: string;
  processingTime: number;
  analysis: ColorAnalysis;
  settings: {
    colorConversion: boolean;
    profileOptimization: boolean;
    gamutMapping: boolean;
    targetColorSpace: string;
    preserveTransparency: boolean;
    dithering: boolean;
    quality: string;
    outputFormat: string;
  };
}

export interface ColorAnalysis {
  totalPages: number;
  totalObjects: number;
  colorObjects: number;
  imageObjects: number;
  fontObjects: number;
  fileSize: number;
  colorSpace: string;
  hasTransparency: boolean;
  colorProfile: string;
  optimizationPotential: {
    canConvertColors: boolean;
    canOptimizeProfiles: boolean;
    canMapGamut: boolean;
    estimatedSavings: string;
  };
}

export interface ColorOptimizationPreset {
  id: string;
  name: string;
  description: string;
  colorConversion: boolean; // Note: Not actually supported by qpdf, kept for UI compatibility
  profileOptimization: boolean;
  gamutMapping: boolean;
  targetColorSpace: 'auto'; // Only 'auto' is supported by qpdf
  preserveTransparency: boolean;
  dithering: boolean;
  quality: 'low' | 'medium' | 'high';
}

export interface ColorOptimizationPresetsResponse {
  success: boolean;
  presets: ColorOptimizationPreset[];
}

export interface ColorOptimizationTool {
  available: boolean;
  version?: string;
  description: string;
}

export interface ColorOptimizationToolsResponse {
  success: boolean;
  tools: {
    qpdf: ColorOptimizationTool;
    imagemagick: ColorOptimizationTool;
    ghostscript: ColorOptimizationTool;
  };
  recommendations: string[];
  status: 'ready' | 'partial';
}

export interface ColorOptimizationRecommendation {
  type: string;
  priority: string;
  title: string;
  description: string;
  estimatedSavings: string;
  action: string;
}

export interface ColorOptimizationRecommendationsResponse {
  success: boolean;
  filename: string;
  analysis: ColorAnalysis;
  recommendations: ColorOptimizationRecommendation[];
  suggestedPreset: string;
}

export interface ColorOptimizationPreview {
  originalAnalysis: ColorAnalysis;
  previewAnalysis: ColorAnalysis;
  estimatedImprovements: {
    fileSizeReduction: number;
    fileSizeReductionPercent: string;
    colorOptimized: boolean;
    profileOptimized: boolean;
    gamutMapped: boolean;
  };
  settings: {
    colorConversion: boolean;
    profileOptimization: boolean;
    gamutMapping: boolean;
    targetColorSpace: string;
    quality: string;
  };
}

export interface ColorOptimizationPreviewResponse {
  success: boolean;
  filename: string;
  preview: ColorOptimizationPreview;
}

export interface BatchColorOptimizationRequest {
  files: File[];
  preset?: string;
  customSettings?: Partial<ColorOptimizationRequest>;
}

export interface BatchColorOptimizationResult {
  filename: string;
  outputFilename: string;
  downloadUrl: string;
  originalSize: number;
  optimizedSize: number;
  sizeChange: number;
  sizeChangePercent: string;
  success: boolean;
  processingTime: number;
}

export interface BatchColorOptimizationError {
  filename: string;
  error: string;
  success: boolean;
}

export interface BatchColorOptimizationResponse {
  success: boolean;
  message: string;
  results: BatchColorOptimizationResult[];
  errors: BatchColorOptimizationError[];
  summary: {
    totalFiles: number;
    successfulFiles: number;
    failedFiles: number;
    successRate: string;
  };
  settings: any;
}

export interface ColorOptimizationSettings {
  colorConversion: boolean;
  profileOptimization: boolean;
  gamutMapping: boolean;
  targetColorSpace: 'rgb' | 'cmyk' | 'grayscale' | 'auto';
  preserveTransparency: boolean;
  dithering: boolean;
  quality: 'low' | 'medium' | 'high';
}
