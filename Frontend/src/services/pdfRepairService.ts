import { pdfApi } from './apiHelper';

export interface RepairIssue {
  type: string;
  severity: 'critical' | 'major' | 'minor';
  message: string;
  details?: string;
  page?: number;
}

export interface RepairAction {
  type: string;
  message: string;
  details?: string;
  page?: number;
}

export interface RepairResult {
  originalSize: number;
  repairedSize: number;
  issuesFound: RepairIssue[];
  repairsApplied: RepairAction[];
  success: boolean;
  downloadUrl?: string;
  statistics: {
    pages: number;
    fonts: number;
    images: number;
    forms: number;
  };
}

export interface AnalysisResult {
  isCorrupted: boolean;
  issues: RepairIssue[];
  recommendations: Array<{
    type: string;
    priority: 'high' | 'medium' | 'low';
    message: string;
  }>;
  statistics: {
    fileSize: number;
    fileSizeFormatted: string;
    pages: number;
    fonts: number;
    images: number;
    forms: number;
  };
  healthScore: number;
  repairStatus?: 'excellent' | 'good' | 'partial' | 'failed' | 'success';
}

export interface OptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  optimizationsApplied: RepairAction[];
  statistics: {
    pages: number;
    fonts: number;
    images: number;
  };
  downloadUrl?: string;
}

export interface ServiceStatus {
  service: string;
  status: string;
  version: string;
  features: string[];
  capabilities: {
    repairTypes: string[];
    optimizationFeatures: string[];
    maxFileSize: string;
    supportedFormats: string[];
  };
  timestamp: string;
}

export const pdfRepairService = {
  // Repair a corrupted or damaged PDF
  async repairPdf(file: File): Promise<RepairResult> {
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await pdfApi.post('/pdf-repair/repair', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data.result;
      } else {
        throw new Error(response.data.error || 'Failed to repair PDF');
      }
    } catch (error: any) {
      console.error('Error repairing PDF:', error);
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.details || 
        error.message || 
        'Failed to repair PDF'
      );
    }
  },

  // Analyze PDF for issues and provide repair recommendations
  async analyzePdf(file: File): Promise<AnalysisResult> {
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await pdfApi.post('/pdf-repair/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data.result;
      } else {
        throw new Error(response.data.error || 'Failed to analyze PDF');
      }
    } catch (error: any) {
      console.error('Error analyzing PDF:', error);
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.details || 
        error.message || 
        'Failed to analyze PDF'
      );
    }
  },

  // Analyze repaired PDF to verify repair success
  async analyzeRepairedPdf(formData: FormData): Promise<AnalysisResult> {
    try {
      const response = await pdfApi.post('/pdf-repair/analyze-repaired', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data.result;
      } else {
        throw new Error(response.data.error || 'Failed to analyze repaired PDF');
      }
    } catch (error: any) {
      console.error('Error analyzing repaired PDF:', error);
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.details || 
        error.message || 
        'Failed to analyze repaired PDF'
      );
    }
  },

  // Optimize PDF for fast web viewing
  async optimizePdf(formData: FormData): Promise<OptimizationResult> {
    try {
      const response = await pdfApi.post('/pdf-repair/optimize', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data.result;
      } else {
        throw new Error(response.data.error || 'Failed to optimize PDF');
      }
    } catch (error: any) {
      console.error('Error optimizing PDF:', error);
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.details || 
        error.message || 
        'Failed to optimize PDF'
      );
    }
  },

  // Get service status
  async getServiceStatus(): Promise<ServiceStatus> {
    try {
      const response = await pdfApi.get('/pdf-repair/status');
      
      if (response.data.success) {
        return response.data.status;
      } else {
        throw new Error(response.data.error || 'Failed to get service status');
      }
    } catch (error: any) {
      console.error('Error getting service status:', error);
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.details || 
        error.message || 
        'Failed to get service status'
      );
    }
  }
};
