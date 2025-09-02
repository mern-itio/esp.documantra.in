import { pdfApi } from './apiHelper';

export interface ValidationIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  location: string;
}

export interface ValidationStandard {
  compliant: boolean;
  score: number;
  issues: ValidationIssue[];
}

export interface ValidationResult {
  isValid: boolean;
  overallScore: number;
  standards: {
    pdfA: ValidationStandard;
    pdfUA: ValidationStandard;
    pdfX: ValidationStandard;
    general: ValidationStandard;
  };
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  recommendations: Array<{
    type: string;
    priority: 'high' | 'medium' | 'low';
    message: string;
  }>;
  metadata: {
    title: string;
    author: string;
    subject: string;
    creator: string;
    producer: string;
    creationDate: string | null;
    modificationDate: string | null;
    keywords: string[] | string | null;
  };
  statistics: {
    fileSize: number;
    fileSizeFormatted: string;
    pageCount: number;
    creationDate: string;
  };
}

export interface ValidationStandards {
  pdfA: {
    name: string;
    description: string;
    checks: string[];
  };
  pdfUA: {
    name: string;
    description: string;
    checks: string[];
  };
  pdfX: {
    name: string;
    description: string;
    checks: string[];
  };
  general: {
    name: string;
    description: string;
    checks: string[];
  };
}

export interface ServiceStatus {
  service: string;
  status: string;
  version: string;
  features: string[];
  capabilities: {
    supportedStandards: string[];
    validationTypes: string[];
    maxFileSize: string;
    supportedFormats: string[];
  };
  timestamp: string;
}

export const pdfValidatorService = {
  // Validate single PDF file
  async validatePdf(file: File): Promise<ValidationResult> {
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await pdfApi.post('/pdf-validator/validate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data.result;
      } else {
        throw new Error(response.data.error || 'Failed to validate PDF');
      }
    } catch (error: any) {
      console.error('Error validating PDF:', error);
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.details || 
        error.message || 
        'Failed to validate PDF'
      );
    }
  },

  // Get validation standards
  async getValidationStandards(): Promise<ValidationStandards> {
    try {
      const response = await pdfApi.get('/pdf-validator/standards');
      
      if (response.data.success) {
        return response.data.result;
      } else {
        throw new Error(response.data.error || 'Failed to get validation standards');
      }
    } catch (error: any) {
      console.error('Error getting validation standards:', error);
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.details || 
        error.message || 
        'Failed to get validation standards'
      );
    }
  },

  // Get service status
  async getServiceStatus(): Promise<ServiceStatus> {
    try {
      const response = await pdfApi.get('/pdf-validator/status');
      
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