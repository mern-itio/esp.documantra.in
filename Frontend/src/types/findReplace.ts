export interface FindReplaceRequest {
  file: File;
  searchText: string;
  replaceText?: string;
  useRegex?: boolean;
  caseSensitive?: boolean;
  wholeWord?: boolean;
  replaceAll?: boolean;
  selectedMatches?: number[]; // Array of match indices to replace
}

export interface FindReplaceResponse {
  success: boolean;
  message: string;
  filename: string;
  downloadUrl: string;
  totalPages: number;
  fileSize: number;
  originalFileSize: number;
  findReplaceResults: {
    searchText: string;
    replaceText: string;
    useRegex: boolean;
    caseSensitive: boolean;
    wholeWord: boolean;
    replaceAll: boolean;
    totalMatches: number;
    matches: FindReplaceMatch[];
    replacements: FindReplaceReplacement[];
    pages: PageDistribution[];
  };
  extractedText: string;
}

export interface FindReplaceMatch {
  text: string;
  position: number;
  page: number;
  context: string;
  contextStart: number;
  contextEnd: number;
  matchStart: number;
  matchEnd: number;
}

export interface FindReplaceReplacement {
  original: string;
  replacement: string;
  position: number;
  page: number;
}

export interface PageDistribution {
  page: number;
  matchCount: number;
  matches: FindReplaceMatch[];
}

export interface FindReplaceOptions {
  searchText: string;
  replaceText: string;
  useRegex: boolean;
  caseSensitive: boolean;
  wholeWord: boolean;
  replaceAll: boolean;
  selectedMatches?: number[]; // Array of selected match indices
}

export interface FindReplaceStats {
  totalMatches: number;
  totalReplacements: number;
  pagesAffected: number;
  searchText: string;
  replaceText: string;
}

export interface FindReplacePreview {
  success: boolean;
  message: string;
  totalMatches: number;
  matches: FindReplaceMatch[];
  pages: PageDistribution[];
  extractedText: string;
}

export interface FindReplaceHistory {
  id: string;
  timestamp: Date;
  searchText: string;
  replaceText: string;
  totalMatches: number;
  totalReplacements: number;
  filename: string;
  options: FindReplaceOptions;
}

export interface FindReplaceSettings {
  defaultCaseSensitive: boolean;
  defaultWholeWord: boolean;
  defaultUseRegex: boolean;
  maxPreviewMatches: number;
  contextLength: number;
  autoSave: boolean;
}

export interface FindReplaceToolbarState {
  isVisible: boolean;
  searchText: string;
  replaceText: string;
  currentMatchIndex: number;
  totalMatches: number;
  options: FindReplaceOptions;
  matches: FindReplaceMatch[];
}

export interface FindReplaceKeyboardShortcuts {
  open: string; // Default: 'Ctrl+F'
  close: string; // Default: 'Escape'
  findNext: string; // Default: 'F3' or 'Enter'
  findPrevious: string; // Default: 'Shift+F3'
  replace: string; // Default: 'Ctrl+H'
  replaceAll: string; // Default: 'Ctrl+Shift+H'
}

export interface FindReplaceValidation {
  valid: boolean;
  message?: string;
  errors?: string[];
}

export interface FindReplaceContext {
  before: string;
  match: string;
  after: string;
  lineNumber?: number;
  columnNumber?: number;
}

export interface FindReplaceHighlight {
  start: number;
  end: number;
  type: 'match' | 'current' | 'replaced';
  page: number;
}

export interface FindReplaceSearchPattern {
  pattern: string;
  flags: string;
  isValid: boolean;
  error?: string;
}

export interface FindReplaceBatchOperation {
  id: string;
  operations: FindReplaceRequest[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results: FindReplaceResponse[];
  createdAt: Date;
  completedAt?: Date;
}

export interface FindReplacePreset {
  id: string;
  name: string;
  description: string;
  searchText: string;
  replaceText: string;
  options: FindReplaceOptions;
  category: string;
  isDefault: boolean;
}

export interface FindReplaceTemplate {
  id: string;
  name: string;
  description: string;
  operations: FindReplaceOperation[];
  category: string;
  tags: string[];
}

export interface FindReplaceOperation {
  searchText: string;
  replaceText: string;
  options: FindReplaceOptions;
  order: number;
  enabled: boolean;
}

export interface FindReplaceExport {
  format: 'json' | 'csv' | 'txt';
  includeMatches: boolean;
  includeContext: boolean;
  includeMetadata: boolean;
}

export interface FindReplaceImport {
  format: 'json' | 'csv' | 'txt';
  data: string;
  validate: boolean;
}

export interface FindReplaceAnalytics {
  totalSearches: number;
  totalReplacements: number;
  mostUsedPatterns: Array<{
    pattern: string;
    count: number;
  }>;
  averageMatchesPerSearch: number;
  successRate: number;
  errorRate: number;
}
