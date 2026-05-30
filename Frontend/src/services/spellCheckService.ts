import axios from 'axios';
import type { 
  SpellCheckRequest, 
  SpellCheckResponse, 
  Language,
  CustomDictionary,
  // SpellCheckOptions,
  SpellCheckStats
} from '../types/spellCheck';

class SpellCheckService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';
  }

  async spellCheck(request: SpellCheckRequest): Promise<SpellCheckResponse> {
    const formData = new FormData();
    formData.append('file', request.file);

    // Add spell check options to form data
    if (request.language) formData.append('language', request.language);
    if (request.customDictionary) formData.append('customDictionary', request.customDictionary);
    if (request.checkGrammar !== undefined) formData.append('checkGrammar', request.checkGrammar.toString());
    if (request.suggestions !== undefined) formData.append('suggestions', request.suggestions.toString());
    if (request.ignoreNumbers !== undefined) formData.append('ignoreNumbers', request.ignoreNumbers.toString());
    if (request.ignoreUrls !== undefined) formData.append('ignoreUrls', request.ignoreUrls.toString());
    if (request.ignoreEmails !== undefined) formData.append('ignoreEmails', request.ignoreEmails.toString());

    const response = await axios.post(`${this.baseURL}/pdf-spell-check/spell-check`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Construct full URL for download
    const baseURL = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';
    const downloadUrl = response.data.downloadUrl.startsWith('http') 
      ? response.data.downloadUrl 
      : `${baseURL}${response.data.downloadUrl}`;

    return {
      ...response.data,
      downloadUrl
    };
  }

  async downloadFile(url: string, filename: string): Promise<void> {
    try {
      const response = await axios.get(url, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      throw new Error('Failed to download file');
    }
  }

  // Helper method to get file size in readable format
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get supported languages
  getSupportedLanguages(): Language[] {
    return [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Spanish', flag: '🇪🇸' },
      { code: 'fr', name: 'French', flag: '🇫🇷' },
      { code: 'de', name: 'German', flag: '🇩🇪' },
      { code: 'it', name: 'Italian', flag: '🇮🇹' },
      { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
      { code: 'ru', name: 'Russian', flag: '🇷🇺' },
      { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
      { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
      { code: 'ko', name: 'Korean', flag: '🇰🇷' },
      { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
      { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
      { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
      { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
      { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
      { code: 'da', name: 'Danish', flag: '🇩🇰' },
      { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
      { code: 'pl', name: 'Polish', flag: '🇵🇱' },
      { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
      { code: 'cs', name: 'Czech', flag: '🇨🇿' }
    ];
  }

  // Get predefined custom dictionaries
  getCustomDictionaries(): CustomDictionary[] {
    return [
      {
        id: 'technical',
        name: 'Technical Terms',
        description: 'Common technical and scientific terms',
        words: [
          'algorithm', 'database', 'framework', 'javascript', 'typescript', 'react', 'nodejs',
          'api', 'json', 'xml', 'html', 'css', 'sql', 'mongodb', 'postgresql', 'redis',
          'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'microservices', 'devops',
          'machine learning', 'artificial intelligence', 'blockchain', 'cryptocurrency'
        ]
      },
      {
        id: 'medical',
        name: 'Medical Terms',
        description: 'Medical and healthcare terminology',
        words: [
          'diagnosis', 'treatment', 'symptoms', 'patient', 'doctor', 'nurse', 'hospital',
          'medicine', 'prescription', 'therapy', 'surgery', 'anesthesia', 'antibiotics',
          'cardiovascular', 'respiratory', 'neurological', 'psychological', 'pediatric',
          'oncology', 'dermatology', 'orthopedic', 'ophthalmology', 'gynecology'
        ]
      },
      {
        id: 'legal',
        name: 'Legal Terms',
        description: 'Legal and law terminology',
        words: [
          'plaintiff', 'defendant', 'attorney', 'lawyer', 'court', 'judge', 'jury',
          'testimony', 'evidence', 'verdict', 'sentence', 'appeal', 'litigation',
          'contract', 'agreement', 'liability', 'negligence', 'malpractice', 'settlement',
          'subpoena', 'deposition', 'affidavit', 'injunction', 'constitution'
        ]
      },
      {
        id: 'business',
        name: 'Business Terms',
        description: 'Business and corporate terminology',
        words: [
          'revenue', 'profit', 'loss', 'investment', 'portfolio', 'stakeholder', 'shareholder',
          'board', 'executive', 'management', 'strategy', 'marketing', 'sales', 'finance',
          'accounting', 'audit', 'compliance', 'governance', 'merger', 'acquisition',
          'partnership', 'corporation', 'entrepreneur', 'startup', 'venture'
        ]
      }
    ];
  }

  // Validate spell check request
  validateRequest(request: SpellCheckRequest): { valid: boolean; message?: string } {
    if (!request.file) {
      return { valid: false, message: 'Please select a PDF file' };
    }

    if (request.file.type !== 'application/pdf') {
      return { valid: false, message: 'Please select a valid PDF file' };
    }

    return { valid: true };
  }

  // Calculate spell check statistics
  calculateStats(spellCheckResults: any): SpellCheckStats {
    const totalWords = spellCheckResults.totalWords || 0;
    const misspelledWords = spellCheckResults.misspelledWords?.length || 0;
    const grammarIssues = spellCheckResults.grammarIssues?.length || 0;
    const accuracy = totalWords > 0 ? Math.round(((totalWords - misspelledWords) / totalWords) * 100) : 100;

    return {
      totalWords,
      misspelledWords,
      grammarIssues,
      accuracy,
      language: spellCheckResults.language || 'en'
    };
  }

  // Get accuracy color based on percentage
  getAccuracyColor(accuracy: number): string {
    if (accuracy >= 95) return 'text-green-600';
    if (accuracy >= 85) return 'text-yellow-600';
    return 'text-red-600';
  }

  // Get accuracy label
  getAccuracyLabel(accuracy: number): string {
    if (accuracy >= 95) return 'Excellent';
    if (accuracy >= 85) return 'Good';
    if (accuracy >= 70) return 'Fair';
    return 'Needs Improvement';
  }

  // Format extracted text for display
  formatExtractedText(text: string, maxLength: number = 500): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  // Get issue type color
  getIssueTypeColor(type: string): string {
    switch (type) {
      case 'capitalization':
        return 'bg-blue-100 text-blue-800';
      case 'spacing':
        return 'bg-yellow-100 text-yellow-800';
      case 'typo':
        return 'bg-red-100 text-red-800';
      case 'grammar':
        return 'bg-[#DCFCE7] text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Get issue type icon
  getIssueTypeIcon(type: string): string {
    switch (type) {
      case 'capitalization':
        return '🔤';
      case 'spacing':
        return '📏';
      case 'typo':
        return '❌';
      case 'grammar':
        return '📝';
      default:
        return '⚠️';
    }
  }
}

export const spellCheckService = new SpellCheckService();
