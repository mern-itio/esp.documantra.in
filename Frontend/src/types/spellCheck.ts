export interface SpellCheckRequest {
  file: File;
  language?: string;
  customDictionary?: string;
  checkGrammar?: boolean;
  suggestions?: boolean;
  ignoreNumbers?: boolean;
  ignoreUrls?: boolean;
  ignoreEmails?: boolean;
}

export interface SpellCheckResponse {
  success: boolean;
  message: string;
  filename: string;
  downloadUrl: string;
  totalPages: number;
  fileSize: number;
  originalFileSize: number;
  spellCheckResults: {
    totalWords: number;
    misspelledWords: string[];
    suggestions: Record<string, string[]>;
    grammarIssues: GrammarIssue[];
    language: string;
    customDictionary: string;
    checkGrammar: boolean;
    showSuggestions: boolean;
  };
  extractedText: string;
}

export interface GrammarIssue {
  type: 'capitalization' | 'spacing' | 'typo' | 'grammar';
  sentence: string;
  suggestion: string;
  position: number;
}

export interface SpellCheckResult {
  word: string;
  suggestions: string[];
  context?: string;
  position?: number;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface CustomDictionary {
  id: string;
  name: string;
  words: string[];
  description?: string;
}

export interface SpellCheckOptions {
  language: string;
  checkGrammar: boolean;
  suggestions: boolean;
  ignoreNumbers: boolean;
  ignoreUrls: boolean;
  ignoreEmails: boolean;
  customDictionary?: string;
}

export interface SpellCheckStats {
  totalWords: number;
  misspelledWords: number;
  grammarIssues: number;
  accuracy: number;
  language: string;
}
