import { pdfApi } from './apiHelper';

export interface AnalyticsData {
  dailyUsage: {
    totalOperations: number;
    uniqueUsers: number;
    popularTools: Array<{
      name: string;
      usage: number;
      percentage: number;
    }>;
  };
  performanceTrend?: Array<{ date: string; successRate: number; avgProcessingTimeMs: number }>;
  performanceMetrics: {
    successRate: number;
    averageProcessingTime: string;
    userSatisfaction: number;
  };
  qualityMetrics: {
    conversionAccuracy: number;
    layoutPreservation: number;
    textRecognitionAccuracy: number;
    compressionEfficiency: number;
  };
  usageTrend: Array<{
    date: string;
    operations: number;
    users: number;
  }>;
  categoryUsage: Array<{
    category: string;
    usage: number;
    color: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    documentName: string;
    timestamp: string;
    userId: string;
  }>;
  topDocuments: Array<{
    documentId: string;
    documentName: string;
    actionCount: number;
    lastAction: string;
  }>;
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
}

class AnalyticsService {

  // Get comprehensive analytics data
  async getAnalyticsData(filters: AnalyticsFilters = {}): Promise<AnalyticsData> {
    try {
      const { startDate, endDate, timeRange = '7d' } = filters;
      
      // Calculate date range based on timeRange
      const dateRange = this.calculateDateRange(timeRange, startDate, endDate);
      
      // Fetch data from PDF operation tracking API
      const response = await pdfApi.get('/analytics', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          timeRange,
          includeAllUsers: true
        }
      });

      console.log('Analytics API Response:', response.data);

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      // Return fallback data if API fails
      return this.getFallbackData();
    }
  }

  // Get fallback data when API fails
  private getFallbackData(): AnalyticsData {
    return {
      dailyUsage: {
        totalOperations: 0,
        uniqueUsers: 0,
        popularTools: []
      },
      performanceMetrics: {
        successRate: 0,
        averageProcessingTime: '0s',
        userSatisfaction: 0
      },
      qualityMetrics: {
        conversionAccuracy: 0,
        layoutPreservation: 0,
        textRecognitionAccuracy: 0,
        compressionEfficiency: 0
      },
      usageTrend: [],
      categoryUsage: [],
      recentActivity: [],
      topDocuments: []
    };
  }

  // Calculate date range based on timeRange
  private calculateDateRange(timeRange: string, startDate?: string, endDate?: string) {
    if (startDate && endDate) {
      return { startDate, endDate };
    }

    const end = new Date();
    const start = new Date();

    switch (timeRange) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        start.setDate(end.getDate() - 7);
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  }


  // Get real-time analytics updates
  async getRealTimeAnalytics(): Promise<Partial<AnalyticsData>> {
    try {
      const response = await pdfApi.get('/analytics/real-time', { params: { includeAllUsers: true } });
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to fetch real-time analytics');
      }
    } catch (error) {
      console.error('Error fetching real-time analytics:', error);
      return {};
    }
  }

  // Get analytics for specific tool
  async getToolAnalytics(toolName: string, filters: AnalyticsFilters = {}): Promise<any> {
    try {
      const response = await pdfApi.get(`/analytics/tool/${toolName}`, {
        params: filters
      });
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || `Failed to fetch analytics for tool ${toolName}`);
      }
    } catch (error) {
      console.error(`Error fetching analytics for tool ${toolName}:`, error);
      return null;
    }
  }

  // Heartbeat ping to mark user active (call on load and interval)
  async sendHeartbeat(userId?: string): Promise<void> {
    try {
      await pdfApi.post('/analytics/heartbeat', { userId });
    } catch (error) {
      // silent fail
    }
  }

  async clearHeartbeat(userId?: string): Promise<void> {
    try {
      await pdfApi.delete('/analytics/heartbeat', { data: { userId } });
    } catch (error) {
      // silent fail
    }
  }
}

export const analyticsService = new AnalyticsService();
