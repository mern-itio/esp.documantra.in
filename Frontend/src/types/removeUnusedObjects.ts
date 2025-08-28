export interface RemoveUnusedObjectsRequest {
  file: File;
  objectAnalysis?: boolean;
  resourceCleanup?: boolean;
  structureOptimization?: boolean;
  aggressiveCleanup?: boolean;
  preserveMetadata?: boolean;
  preserveAnnotations?: boolean;
  preserveBookmarks?: boolean;
  outputFormat?: string;
  quality?: string;
}

export interface RemoveUnusedObjectsResponse {
  success: boolean;
  message: string;
  filename: string;
  downloadUrl: string;
  originalSize: number;
  cleanedSize: number;
  sizeReduction: number;
  sizeReductionPercent: string;
  processingTime: number;
  objectAnalysis: {
    before: ObjectAnalysis;
    after: ObjectAnalysis;
    improvements: {
      totalObjects: number;
      unusedObjects: number;
      compressedObjects: number;
      optimizationRatio: string;
    };
  };
  cleanupOptions: {
    objectAnalysis: boolean;
    resourceCleanup: boolean;
    structureOptimization: boolean;
    aggressiveCleanup: boolean;
    preserveMetadata: boolean;
    preserveAnnotations: boolean;
    preserveBookmarks: boolean;
  };
}

export interface ObjectAnalysis {
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
  optimizationPotential: {
    canRemoveUnusedObjects: boolean;
    canCompressObjects: boolean;
    canOptimizeStructure: boolean;
    estimatedSizeReduction: number;
  };
}

export interface CleanupPreset {
  id: string;
  name: string;
  description: string;
  settings: {
    objectAnalysis: boolean;
    resourceCleanup: boolean;
    structureOptimization: boolean;
    aggressiveCleanup: boolean;
    preserveMetadata: boolean;
    preserveAnnotations: boolean;
    preserveBookmarks: boolean;
  };
  estimatedReduction: string;
  riskLevel: string;
}

export interface CleanupTools {
  qpdf: {
    available: boolean;
    version: string;
    description: string;
  };
  pdfinfo: {
    available: boolean;
    description: string;
  };
  pdftk: {
    available: boolean;
    description: string;
  };
  recommendations: string;
}

export interface CleanupRecommendation {
  type: string;
  priority: string;
  title: string;
  description: string;
  estimatedReduction: string;
  action: string;
}

export interface CleanupRecommendationsResponse {
  success: boolean;
  filename: string;
  analysis: ObjectAnalysis;
  recommendations: CleanupRecommendation[];
  suggestedPreset: string;
}

export interface CleanupPreview {
  originalAnalysis: ObjectAnalysis;
  previewAnalysis: ObjectAnalysis;
  estimatedImprovements: {
    sizeReduction: number;
    sizeReductionPercent: string;
    objectsRemoved: number;
    compressionImprovement: number;
    structureOptimization: boolean;
  };
  settings: {
    objectAnalysis: boolean;
    resourceCleanup: boolean;
    structureOptimization: boolean;
    aggressiveCleanup: boolean;
    preserveMetadata: boolean;
    preserveAnnotations: boolean;
    preserveBookmarks: boolean;
  };
}

export interface CleanupPreviewResponse {
  success: boolean;
  filename: string;
  preview: CleanupPreview;
}

export interface BatchCleanupRequest {
  files: File[];
  preset?: string;
  customSettings?: Partial<RemoveUnusedObjectsRequest>;
}

export interface BatchCleanupResult {
  filename: string;
  outputFilename: string;
  downloadUrl: string;
  originalSize: number;
  cleanedSize: number;
  sizeReduction: number;
  sizeReductionPercent: string;
  success: boolean;
}

export interface BatchCleanupError {
  filename: string;
  error: string;
  success: boolean;
}

export interface BatchCleanupResponse {
  success: boolean;
  message: string;
  results: BatchCleanupResult[];
  errors: BatchCleanupError[];
  summary: {
    totalFiles: number;
    successfulFiles: number;
    failedFiles: number;
    successRate: string;
  };
  settings: any;
}

export interface CleanupPresetsResponse {
  success: boolean;
  presets: CleanupPreset[];
}

export interface CleanupToolsResponse {
  success: boolean;
  tools: CleanupTools;
  recommendations: string;
}
