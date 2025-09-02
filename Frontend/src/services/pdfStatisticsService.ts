import { pdfApi } from './apiHelper';
export interface ContentAnalysis {
  pageCount: number;
  totalTextLength: number;
  totalImages: number;
  totalFonts: number;
  hasBookmarks: boolean;
  hasForms: boolean;
  hasAnnotations: boolean;
  hasImages: boolean;
  textDensity: number;
  averagePageSize: {
    width: number;
    height: number;
  };
  pageSizes: Array<{ width: number; height: number }>;
  fonts: string[];
  imageTypes: string[];
}

export interface UsageStatistics {
  readabilityScore: number;
  complexityScore: number;
  accessibilityScore: number;
  estimatedReadingTime: number;
  estimatedPrintTime: number;
  estimatedDownloadTime: number;
  recommendedUseCases: string[];
  optimizationSuggestions: string[];
}

export interface PerformanceMetrics {
  fileSize: number;
  sizePerPage: number;
  compressionRatio: number;
  processingTime: number;
  processingSpeed: number;
  efficiencyScore: number;
  loadTime: number;
  memoryUsage: number;
  cpuIntensity: 'low' | 'medium' | 'high';
}

export interface StructureAnalysis {
  pageCount: number;
  layoutConsistency: number;
  organizationScore: number;
  hasConsistentPageSizes: boolean;
  pageSizeVariations: number;
  structureComplexity: 'low' | 'medium' | 'high';
  recommendedStructure: string[];
}

export interface SecurityAnalysis {
  isEncrypted: boolean;
  hasPassword: boolean;
  hasDigitalSignature: boolean;
  hasMetadata: boolean;
  securityLevel: 'low' | 'medium' | 'high';
  privacyScore: number;
  complianceScore: number;
  securityRecommendations: string[];
}

export interface PdfStatisticsResult {
  filename: string;
  fileSize: number;
  processingTime: number;
  contentAnalysis: ContentAnalysis;
  usageStatistics: UsageStatistics;
  performanceMetrics: PerformanceMetrics;
  structureAnalysis: StructureAnalysis;
  securityAnalysis: SecurityAnalysis;
  summary: {
    totalPages: number;
    hasBookmarks: boolean;
    hasForms: boolean;
    hasImages: boolean;
    isEncrypted: boolean;
    compressionRatio: number;
    textDensity: number;
  };
}

export interface ComparisonResult {
  filename: string;
  fileSize: number;
  contentAnalysis: ContentAnalysis;
  usageStatistics: UsageStatistics;
  performanceMetrics: PerformanceMetrics;
}

export interface ComparisonSummary {
  totalFiles: number;
  totalSize: number;
  averageSize: number;
  totalPages: number;
  averagePages: number;
  sizeVariation: number;
  pageVariation: number;
  mostEfficient: ComparisonResult;
  largestFile: ComparisonResult;
}

export interface ServiceStatus {
  success: boolean;
  service: string;
  version: string;
  status: string;
  features: string[];
  capabilities: {
    maxFileSize: string;
    supportedFormats: string[];
    analysisTypes: string[];
  };
}

class PdfStatisticsService {
 
  // Get comprehensive PDF statistics
  async analyzePdf(file: File): Promise<PdfStatisticsResult> {
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await pdfApi.post(`/pdf-statistics/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds timeout
      });

      if (response.data.success) {
        return response.data.result;
      } else {
        throw new Error(response.data.error || 'Failed to analyze PDF');
      }
    } catch (error: any) {
      console.error('Error analyzing PDF:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to analyze PDF');
    }
  }

  // Get content analysis only
  async getContentAnalysis(file: File): Promise<{ filename: string; contentAnalysis: ContentAnalysis }> {
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await pdfApi.post(`/pdf-statistics/content-analysis`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      if (response.data.success) {
        return response.data.result;
      } else {
        throw new Error(response.data.error || 'Failed to analyze content');
      }
    } catch (error: any) {
      console.error('Error analyzing content:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to analyze content');
    }
  }

  // Get usage statistics only
  async getUsageStatistics(file: File): Promise<{ filename: string; usageStatistics: UsageStatistics }> {
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await pdfApi.post(`/pdf-statistics/usage-statistics`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      if (response.data.success) {
        return response.data.result;
      } else {
        throw new Error(response.data.error || 'Failed to get usage statistics');
      }
    } catch (error: any) {
      console.error('Error getting usage statistics:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to get usage statistics');
    }
  }

  // Get performance metrics only
  async getPerformanceMetrics(file: File): Promise<{ filename: string; performanceMetrics: PerformanceMetrics }> {
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await pdfApi.post(`/pdf-statistics/performance-metrics`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      if (response.data.success) {
        return response.data.result;
      } else {
        throw new Error(response.data.error || 'Failed to get performance metrics');
      }
    } catch (error: any) {
      console.error('Error getting performance metrics:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to get performance metrics');
    }
  }

  // Compare multiple PDFs
  async comparePdfs(files: File[]): Promise<{ comparisonResults: ComparisonResult[]; comparisonSummary: ComparisonSummary }> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('pdfs', file);
    });

    try {
      const response = await pdfApi.post(`/pdf-statistics/compare`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes timeout for comparison
      });

      if (response.data.success) {
        return response.data.result;
      } else {
        throw new Error(response.data.error || 'Failed to compare PDFs');
      }
    } catch (error: any) {
      console.error('Error comparing PDFs:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to compare PDFs');
    }
  }

  // Get service status
  async getServiceStatus(): Promise<ServiceStatus> {
    try {
      const response = await pdfApi.get(`/pdf-statistics/status`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting service status:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to get service status');
    }
  }

  // Health check
  async healthCheck(): Promise<{ success: boolean; service: string; status: string; timestamp: string; uptime: number }> {
    try {
      const response = await pdfApi.get(`/pdf-statistics/health`);
      return response.data;
    } catch (error: any) {
      console.error('Error checking health:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to check health');
    }
  }

  // Utility methods
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  getScoreColor(score: number): string {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  }

  getIntensityColor(intensity: string): string {
    switch (intensity) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  }
}

export default new PdfStatisticsService();
