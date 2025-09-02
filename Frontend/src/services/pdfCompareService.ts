import { pdfApi } from './apiHelper';

export interface ComparisonDifference {
  type?: string;
  field?: string;
  pdf1?: string;
  pdf2?: string;
  severity: 'error' | 'warning' | 'info' | 'minor' | 'major';
  message?: string;
  location?: string;
  page?: number;
}

export interface ComparisonResult {
  identical: boolean;
  differences: {
    structure: ComparisonDifference[];
    content: ComparisonDifference[];
    metadata: ComparisonDifference[];
    visual: ComparisonDifference[];
  };
  statistics: {
    pdf1: {
      fileSize: number;
      fileSizeFormatted: string;
      pageCount: number;
    };
    pdf2: {
      fileSize: number;
      fileSizeFormatted: string;
      pageCount: number;
    };
    similarity: number;
  };
  highlights: Array<{
    type: string;
    severity: 'error' | 'warning' | 'info' | 'minor' | 'major';
    message: string;
    location: string;
  }>;
}

export interface ServiceStatus {
  service: string;
  status: string;
  version: string;
  features: string[];
  capabilities: {
    comparisonFeatures: string[];
    maxFileSize: string;
    supportedFormats: string[];
  };
  timestamp: string;
}

export const pdfCompareService = {
  // Compare two PDF files
  async comparePdfs(file1: File, file2: File): Promise<ComparisonResult> {
    const formData = new FormData();
    formData.append('pdf1', file1);
    formData.append('pdf2', file2);

    try {
      const response = await pdfApi.post('/pdf-compare/compare', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data.result;
      } else {
        throw new Error(response.data.error || 'Failed to compare PDFs');
      }
    } catch (error: any) {
      console.error('Error comparing PDFs:', error);
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.details || 
        error.message || 
        'Failed to compare PDFs'
      );
    }
  },

  // Get service status
  async getServiceStatus(): Promise<ServiceStatus> {
    try {
      const response = await pdfApi.get('/pdf-compare/status');
      
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
