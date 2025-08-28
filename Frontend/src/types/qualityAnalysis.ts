// Quality Analysis Types

export interface QualityAnalysisRequest {
  file: File;
  preset?: string;
}

export interface QualityAnalysisResponse {
  success: boolean;
  message: string;
  filename: string;
  analysis: QualityAnalysisT;
}

export interface QualityAnalysisT {
  qualityScore: QualityScore;
  totalPages: number;
  fileSize: number;
  structureAnalysis: StructureAnalysis;
  contentAnalysis: ContentAnalysis;
  performanceAnalysis: PerformanceAnalysis;
  optimizationSuggestions: OptimizationSuggestion[];
  timestamp: string;
}

export interface QualityScore {
  score: number;
  qualityLevel: 'excellent' | 'good' | 'fair' | 'below_average' | 'poor';
  breakdown: {
    structure: number;
    content: number;
    performance: number;
    size: number;
  };
}

export interface StructureAnalysis {
  isValid: boolean;
  hasErrors: boolean;
  errorDetails: string[];
  structureScore: number;
  details: string;
}

export interface ContentAnalysis {
  textQuality: number;
  imageQuality: number;
  fontQuality: number;
  contentScore: number;
}

export interface PerformanceAnalysis {
  loadTime: 'fast' | 'moderate' | 'slow' | 'unknown';
  compressionRatio: number;
  performanceScore: number;
  estimatedLoadTime: string;
}

export interface OptimizationSuggestion {
  type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedImprovement: string;
  action: string;
}

export interface QualityAnalysisPreset {
  id: string;
  name: string;
  description: string;
  includesStructure: boolean;
  includesContent: boolean;
  includesPerformance: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface QualityAnalysisPresetsResponse {
  success: boolean;
  presets: QualityAnalysisPreset[];
}

export interface BatchQualityAnalysisRequest {
  files: File[];
  preset?: string;
}

export interface BatchQualityAnalysisResult {
  filename: string;
  analysis: QualityAnalysisT;
  success: boolean;
}

export interface BatchQualityAnalysisError {
  filename: string;
  error: string;
  success: boolean;
}

export interface BatchQualityAnalysisResponse {
  success: boolean;
  message: string;
  results: BatchQualityAnalysisResult[];
  errors: BatchQualityAnalysisError[];
  summary: {
    totalFiles: number;
    successfulFiles: number;
    failedFiles: number;
    successRate: string;
    averageQualityScore: number;
  };
  preset?: string;
}

export interface QualityAnalysisSettings {
  preset: string;
  includesStructure: boolean;
  includesContent: boolean;
  includesPerformance: boolean;
}
