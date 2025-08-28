// import axios from 'axios';
import { pdfApi } from './apiHelper';
import type {
  QualityAnalysisRequest,
  QualityAnalysisResponse,
  QualityAnalysisPresetsResponse,
  BatchQualityAnalysisRequest,
  BatchQualityAnalysisResponse
} from '../types/qualityAnalysis';

// const API_BASE_URL = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';

export const qualityAnalysisService = {
  async analyzeQuality(data: QualityAnalysisRequest): Promise<QualityAnalysisResponse> {
    const formData = new FormData();
    formData.append('file', data.file);
    if (data.preset) {
      formData.append('preset', data.preset);
    }

    const response = await pdfApi.post(
      `/pdf-quality-analysis/analyze`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  async getPresets(): Promise<QualityAnalysisPresetsResponse> {
    const response = await pdfApi.get(`/pdf-quality-analysis/presets`);
    return response.data;
  },

  async batchQualityAnalysis(data: BatchQualityAnalysisRequest): Promise<BatchQualityAnalysisResponse> {
    const formData = new FormData();
    data.files.forEach((file) => {
      formData.append('files', file);
    });
    if (data.preset) {
      formData.append('preset', data.preset);
    }

    const response = await pdfApi.post(
      `/pdf-quality-analysis/batch`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }
};

export const qualityAnalysisHelpers = {
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  getQualityLevelColor(level: string): string {
    switch (level) {
      case 'excellent':
        return 'text-green-600 bg-green-100';
      case 'good':
        return 'text-blue-600 bg-blue-100';
      case 'fair':
        return 'text-yellow-600 bg-yellow-100';
      case 'below_average':
        return 'text-orange-600 bg-orange-100';
      case 'poor':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  },

  getQualityLevelIcon(level: string): string {
    switch (level) {
      case 'excellent':
        return '🏆';
      case 'good':
        return '✅';
      case 'fair':
        return '⚠️';
      case 'below_average':
        return '📉';
      case 'poor':
        return '❌';
      default:
        return '❓';
    }
  },

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  },

  getPresetDescription(presetId: string): string {
    const descriptions: Record<string, string> = {
      comprehensive: 'Full analysis covering structure, content, and performance',
      performance_focused: 'Focus on performance metrics and optimization',
      content_focused: 'Focus on content quality and text/image analysis',
      quick_assessment: 'Basic quality check with essential metrics'
    };
    return descriptions[presetId] || 'Select a preset for analysis';
  },

  getLoadTimeColor(loadTime: string): string {
    switch (loadTime) {
      case 'fast':
        return 'text-green-600 bg-green-100';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-100';
      case 'slow':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  },

  getScoreColor(score: number): string {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  },

  getScoreBackground(score: number): string {
    if (score >= 90) return 'bg-green-100';
    if (score >= 80) return 'bg-blue-100';
    if (score >= 70) return 'bg-yellow-100';
    if (score >= 60) return 'bg-orange-100';
    return 'bg-red-100';
  }
};
