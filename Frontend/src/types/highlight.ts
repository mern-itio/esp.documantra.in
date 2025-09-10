export interface HighlightRequest {
  file: File;
  highlights: Highlight[];
  preserveLayout?: boolean;
  outputFormat?: 'pdf' | 'pdfa';
}

export interface Highlight {
  id: string;
  text: string;
  pageNumber: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style: HighlightStyle;
  comment?: string;
  author?: string;
  createdAt?: Date;
}

export interface HighlightStyle {
  color: string;
  opacity: number;
  type: 'highlight' | 'underline' | 'strikethrough' | 'squiggly';
  thickness?: number;
}

export interface HighlightResponse {
  success: boolean;
  message: string;
  filename: string;
  downloadUrl: string;
  totalPages: number;
  fileSize: number;
  originalFileSize: number;
  highlightResults: {
    totalHighlights: number;
    highlights: Highlight[];
    pagesAffected: number[];
    processingTime: number;
  };
  extractedText: string;
}

export interface HighlightPreview {
  success: boolean;
  message: string;
  totalMatches: number;
  matches: HighlightMatch[];
  pages: PageDistribution[];
  extractedText: string;
}

export interface HighlightMatch {
  text: string;
  position: number;
  page: number;
  context: string;
  contextStart: number;
  contextEnd: number;
  matchStart: number;
  matchEnd: number;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PageDistribution {
  page: number;
  matchCount: number;
  matches: HighlightMatch[];
}

export interface HighlightColor {
  name: string;
  value: string;
  category: 'standard' | 'custom' | 'recent';
}

export interface HighlightPreset {
  id: string;
  name: string;
  description: string;
  style: HighlightStyle;
  category: string;
  isDefault: boolean;
}

export interface HighlightTemplate {
  id: string;
  name: string;
  description: string;
  highlights: Highlight[];
  category: string;
  tags: string[];
}

export interface HighlightSettings {
  defaultColor: string;
  defaultOpacity: number;
  defaultType: HighlightStyle['type'];
  autoSave: boolean;
  showComments: boolean;
  enableCollaboration: boolean;
}

export interface HighlightValidation {
  valid: boolean;
  message?: string;
  errors?: string[];
}

export interface HighlightStats {
  totalHighlights: number;
  highlightsByColor: Record<string, number>;
  highlightsByType: Record<string, number>;
  pagesAffected: number;
  averageHighlightsPerPage: number;
}

export interface HighlightExport {
  format: 'json' | 'pdf' | 'html';
  includeComments: boolean;
  includeMetadata: boolean;
  includeStyles: boolean;
}

export interface HighlightImport {
  format: 'json' | 'pdf' | 'html';
  data: string;
  validate: boolean;
}

export interface HighlightAnalytics {
  totalHighlights: number;
  mostUsedColors: Array<{
    color: string;
    count: number;
  }>;
  mostUsedTypes: Array<{
    type: string;
    count: number;
  }>;
  averageHighlightsPerDocument: number;
  collaborationStats: {
    totalAuthors: number;
    commentsCount: number;
    resolvedCount: number;
  };
}
