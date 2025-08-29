// Linearize PDF Types

export interface LinearizePDFRequest {
  file: File;
  webOptimization?: boolean;
  fastLoading?: boolean;
  streamingSupport?: boolean;
  compressionLevel?: 'low' | 'medium' | 'high';
  objectStreams?: 'generate' | 'disable';
  preserveMetadata?: boolean;
  preserveAnnotations?: boolean;
  preserveBookmarks?: boolean;
  outputFormat?: string;
  quality?: string;
}

export interface LinearizePDFResponse {
  success: boolean;
  message: string;
  filename: string;
  downloadUrl: string;
  originalSize: number;
  linearizedSize: number;
  sizeChange: number;
  sizeChangePercent: string;
  processingTime: number;
  optimization: {
    webOptimization: boolean;
    fastLoading: boolean;
    streamingSupport: boolean;
    compressionLevel: string;
    objectStreams: string;
  };
  analysis: {
    before: PDFAnalysis;
    after: PDFAnalysis;
    improvements: {
      totalObjects: number;
      webOptimized: boolean;
      streamingReady: boolean;
      fastLoading: boolean;
      optimizationRatio: number;
    };
  };
  webOptimization: {
    linearized: boolean;
    progressiveLoading: boolean;
    objectStreams: boolean;
    compressionLevel: string;
    estimatedLoadTime: string;
  };
}

export interface PDFAnalysis {
  totalObjects: number;
  totalPages: number;
  imageObjects: number;
  fontObjects: number;
  annotationObjects: number;
  metadataObjects: number;
  unusedObjects: number;
  compressedObjects: number;
  fileSize: number;
  structure: {
    hasBookmarks: boolean;
    hasAnnotations: boolean;
    hasImages: boolean;
    hasFonts: boolean;
    hasMetadata: boolean;
  };
  webOptimization: {
    isLinearized: boolean;
    hasObjectStreams: boolean;
    isCompressed: boolean;
    canOptimize: boolean;
  };
  streamingPotential: {
    canStream: boolean;
    estimatedLoadTime: string;
    progressiveLoading: boolean;
  };
}

export interface LinearizationPreset {
  id: string;
  name: string;
  description: string;
  compressionLevel: 'low' | 'medium' | 'high';
  objectStreams: boolean;
  progressiveLoading: boolean;
  webOptimization: boolean;
  streamingSupport: boolean;
  metadataPreservation: boolean;
  annotationsPreservation: boolean;
  bookmarksPreservation: boolean;
}

export interface LinearizationPresetsResponse {
  success: boolean;
  presets: LinearizationPreset[];
}

export interface LinearizationTool {
  available: boolean;
  version?: string;
  description: string;
}

export interface LinearizationToolsResponse {
  success: boolean;
  tools: {
    qpdf: LinearizationTool;
    pdfinfo: LinearizationTool;
    pdftk: LinearizationTool;
  };
  recommendations: string;
}

export interface LinearizationRecommendation {
  type: string;
  priority: string;
  title: string;
  description: string;
  estimatedLoadTime: string;
  action: string;
}

export interface LinearizationRecommendationsResponse {
  success: boolean;
  filename: string;
  analysis: PDFAnalysis;
  recommendations: LinearizationRecommendation[];
  suggestedPreset: string;
}

export interface LinearizationPreview {
  originalAnalysis: PDFAnalysis;
  previewAnalysis: PDFAnalysis;
  estimatedImprovements: {
    loadTimeReduction: number;
    loadTimeReductionPercent: string;
    webOptimized: boolean;
    streamingReady: boolean;
    fastLoading: boolean;
  };
  settings: {
    webOptimization: boolean;
    fastLoading: boolean;
    streamingSupport: boolean;
    compressionLevel: string;
    objectStreams: string;
  };
}

export interface LinearizationPreviewResponse {
  success: boolean;
  filename: string;
  preview: LinearizationPreview;
}

export interface BatchLinearizationRequest {
  files: File[];
  preset?: string;
  customSettings?: Partial<LinearizePDFRequest>;
}

export interface BatchLinearizationResult {
  filename: string;
  outputFilename: string;
  downloadUrl: string;
  originalSize: number;
  linearizedSize: number;
  sizeChange: number;
  sizeChangePercent: string;
  success: boolean;
}

export interface BatchLinearizationError {
  filename: string;
  error: string;
  success: boolean;
}

export interface BatchLinearizationResponse {
  success: boolean;
  message: string;
  results: BatchLinearizationResult[];
  errors: BatchLinearizationError[];
  summary: {
    totalFiles: number;
    successfulFiles: number;
    failedFiles: number;
    successRate: string;
  };
  settings: any;
}

export interface LinearizationSettings {
  webOptimization: boolean;
  fastLoading: boolean;
  streamingSupport: boolean;
  compressionLevel: 'low' | 'medium' | 'high';
  objectStreams: 'generate' | 'disable';
  preserveMetadata: boolean;
  preserveAnnotations: boolean;
  preserveBookmarks: boolean;
}

export interface LinearizationFormData {
  webOptimization: boolean;
  fastLoading: boolean;
  streamingSupport: boolean;
  compressionLevel: 'low' | 'medium' | 'high';
  objectStreams: 'generate' | 'disable';
  preserveMetadata: boolean;
  preserveAnnotations: boolean;
  preserveBookmarks: boolean;
}

export interface LinearizationStats {
  originalSize: number;
  linearizedSize: number;
  sizeChange: number;
  sizeChangePercent: string;
  processingTime: number;
  estimatedLoadTime: string;
}
