export interface OptimizeFontRequest {
  file: File;
  fontSubsetting: boolean;
  fontOptimization: boolean;
  embeddingControl: 'full' | 'subset' | 'none';
  fontSubsettingOptions?: {
    includeAllGlyphs?: boolean;
    includeCommonLigatures?: boolean;
    includeDiscretionaryLigatures?: boolean;
    includeContextualAlternates?: boolean;
    includeKerning?: boolean;
    includeOpenTypeFeatures?: boolean;
    customGlyphs?: string[];
  };
  fontOptimizationOptions?: {
    removeUnusedFonts?: boolean;
    optimizeFontMetrics?: boolean;
    compressFontData?: boolean;
    optimizeFontHinting?: boolean;
    removeFontDuplicates?: boolean;
    optimizeFontSubsets?: boolean;
  };
  embeddingControlOptions?: {
    allowPrinting?: boolean;
    allowCopying?: boolean;
    allowEditing?: boolean;
    allowFormFilling?: boolean;
    allowAccessibility?: boolean;
    allowDocumentAssembly?: boolean;
    allowHighQualityPrinting?: boolean;
  };
  outputFormat?: 'pdf' | 'pdfa' | 'pdfx';
  quality?: 'low' | 'medium' | 'high' | 'custom';
  customQuality?: {
    compressionLevel?: number;
    imageQuality?: number;
    fontCompression?: number;
  };
}

export interface OptimizeFontResponse {
  success: boolean;
  message: string;
  filename: string;
  downloadUrl: string;
  totalPages: number | string;
  fileSize: number;
  originalFileSize: number;
  sizeReduction: number;
  compressionRatio: string;
  fontOptimizationResults: {
    fontsProcessed: number;
    fontsSubsetted: number;
    fontsOptimized: number;
    fontsEmbedded: number;
    fontsRemoved: number;
    totalFontSizeBefore: number;
    totalFontSizeAfter: number;
    fontSizeReduction: number;
    fontCompressionRatio: string;
  };
  optimizationSettings: {
    fontSubsetting: boolean;
    fontOptimization: boolean;
    embeddingControl: string;
    fontSubsettingOptions: any;
    fontOptimizationOptions: any;
    embeddingControlOptions: any;
    outputFormat: string;
    quality: string;
  };
  processingTime: number;
  warnings?: string[];
  errors?: string[];
}

export interface FontOptimizationPreset {
  id: string;
  name: string;
  description: string;
  fontSubsetting: boolean;
  fontOptimization: boolean;
  embeddingControl: 'full' | 'subset' | 'none';
  fontSubsettingOptions: any;
  fontOptimizationOptions: any;
  embeddingControlOptions: any;
  outputFormat: 'pdf' | 'pdfa' | 'pdfx';
  quality: 'low' | 'medium' | 'high' | 'custom';
  estimatedReduction: string;
  useCase: string;
  processingTime: number;
}

export interface FontOptimizationTools {
  qpdf: {
    installed: boolean;
    version?: string;
    message: string;
    error?: string;
  };
  ghostscript: {
    installed: boolean;
    version?: string;
    message: string;
    error?: string;
  };
  fonttools: {
    installed: boolean;
    version?: string;
    message: string;
    error?: string;
  };
  pdfFonts: {
    installed: boolean;
    version?: string;
    message: string;
    error?: string;
  };
}

export interface FontAnalysisResult {
  totalFonts: number;
  embeddedFonts: number;
  subsettedFonts: number;
  unembeddedFonts: number;
  fontDetails: Array<{
    name: string;
    type: string;
    embedded: boolean;
    subsetted: boolean;
    size: number;
    encoding: string;
    subset: string;
  }>;
  totalFontSize: number;
  optimizationPotential: {
    canSubset: number;
    canOptimize: number;
    canEmbed: number;
    estimatedSizeReduction: number;
  };
}
