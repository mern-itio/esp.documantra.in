import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  TrendingUp, 
  Users, 
  FileText, 
  Zap,
  Star,
  Clock,
  Target,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  AlertCircle,
  Loader2
} from 'lucide-react';
import type { ProcessingStats } from '../../types';
import { formatNumber, formatPercentage } from '../../utils';
import { analyticsService, type AnalyticsData, type AnalyticsFilters } from '../../services/analyticsService';

interface AnalyticsProps {
  stats: ProcessingStats;
  onBack: () => void;
}

export const Analytics: React.FC<AnalyticsProps> = ({ stats, onBack }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('7d');
  const [refreshing, setRefreshing] = useState(false);

  // Load analytics data on component mount and when time range changes
  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  // Set up real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAnalyticsData();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: AnalyticsFilters = { timeRange };
      const data = await analyticsService.getAnalyticsData(filters);
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError('Failed to load analytics data');
      // Fallback to static data if API fails
      setAnalyticsData(getFallbackData());
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalyticsData = async () => {
    try {
      setRefreshing(true);
      const filters: AnalyticsFilters = { timeRange };
      const data = await analyticsService.getAnalyticsData(filters);
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error refreshing analytics data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const getFallbackData = (): AnalyticsData => {
    const { dailyUsage, performanceMetrics, qualityMetrics } = stats;
    return {
      dailyUsage,
      performanceMetrics,
      qualityMetrics,
      usageTrend: [
        { date: '2024-01-01', operations: 2100, users: 450 },
        { date: '2024-01-02', operations: 2400, users: 520 },
        { date: '2024-01-03', operations: 2200, users: 480 },
        { date: '2024-01-04', operations: 2800, users: 630 },
        { date: '2024-01-05', operations: 3200, users: 720 },
        { date: '2024-01-06', operations: 1800, users: 380 },
        { date: '2024-01-07', operations: 1600, users: 340 }
      ],
      categoryUsage: [
        { category: 'Conversion', usage: 35, color: 'bg-blue-500' },
        { category: 'Editing', usage: 22, color: 'bg-green-500' },
        { category: 'Pages', usage: 18, color: 'bg-yellow-500' },
        { category: 'Security', usage: 12, color: 'bg-red-500' },
        { category: 'Optimization', usage: 8, color: 'bg-purple-500' },
        { category: 'OCR', usage: 3, color: 'bg-pink-500' },
        { category: 'Forms', usage: 2, color: 'bg-indigo-500' }
      ],
      recentActivity: [],
      topDocuments: []
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600">Loading analytics data...</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error && !analyticsData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600">Error loading data</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-900 mb-2">Failed to Load Analytics</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={loadAnalyticsData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analyticsData) return null;

  const { dailyUsage, performanceMetrics, qualityMetrics, usageTrend, categoryUsage, recentActivity, topDocuments } = analyticsData;

  // Transform category names for better display
  const transformedCategoryUsage = categoryUsage.map(category => ({
    ...category,
    category: category.category === 'Internal' ? 'Internal Operations' : 
             category.category === 'Unknown' ? 'Internal Operations' :
             category.category
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Monitor usage, performance, and quality metrics</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={refreshAnalyticsData}
            disabled={refreshing}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Operations</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatNumber(dailyUsage.totalOperations)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+12.5%</span>
            <span className="text-gray-500 ml-1">vs yesterday</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatNumber(dailyUsage.uniqueUsers)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+8.1%</span>
            <span className="text-gray-500 ml-1">vs yesterday</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatPercentage(performanceMetrics.successRate)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+0.3%</span>
            <span className="text-gray-500 ml-1">vs yesterday</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Processing</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {performanceMetrics.averageProcessingTime}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">-2.1s</span>
            <span className="text-gray-500 ml-1">vs yesterday</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Usage Trend</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {usageTrend.slice(-7).map((day) => {
              const date = new Date(day.date);
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
              const maxOperations = Math.max(...usageTrend.map(d => d.operations));
              
              return (
                <div key={day.date} className="flex items-center space-x-4">
                  <div className="w-8 text-sm font-medium text-gray-600">{dayName}</div>
                  <div className="flex-1 flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${maxOperations > 0 ? (day.operations / maxOperations) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="text-sm font-medium text-gray-900 w-16 text-right">
                      {formatNumber(day.operations)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Usage */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Category Usage</h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {transformedCategoryUsage.map((category) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${category.color}`} />
                  <span className="text-sm font-medium text-gray-900">{category.category}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${category.color}`}
                      style={{ width: `${Math.min(100, Math.max(0, category.usage))}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600 w-8 text-right">
                    {Math.min(100, Math.max(0, category.usage))}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Tools */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Most Popular Tools</h3>
            <Star className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {dailyUsage.popularTools.map((tool, index) => (
              <div key={tool.name} className="flex items-center space-x-4">
                <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">
                      {tool.name === 'Unknown Tool' ? 'Internal Operations' : tool.name}
                    </span>
                    <span className="text-sm text-gray-600">{formatNumber(tool.usage)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${tool.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Metrics */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Quality Metrics</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Conversion Accuracy</span>
                <span className="text-sm font-bold text-gray-900">
                  {formatPercentage(qualityMetrics.conversionAccuracy)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${qualityMetrics.conversionAccuracy}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Layout Preservation</span>
                <span className="text-sm font-bold text-gray-900">
                  {formatPercentage(qualityMetrics.layoutPreservation)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${qualityMetrics.layoutPreservation}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">OCR Accuracy</span>
                <span className="text-sm font-bold text-gray-900">
                  {formatPercentage(qualityMetrics.textRecognitionAccuracy)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${qualityMetrics.textRecognitionAccuracy}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Compression Efficiency</span>
                <span className="text-sm font-bold text-gray-900">
                  {formatPercentage(qualityMetrics.compressionEfficiency)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full"
                  style={{ width: `${qualityMetrics.compressionEfficiency}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity and Top Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.action === 'Unknown Operation' ? 'Internal Operations' : activity.action} - {activity.documentName === 'Unknown Tool Operation' ? 'Internal Operations' : activity.documentName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Documents */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Most Active Documents</h3>
            <FileText className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {topDocuments.length > 0 ? (
              topDocuments.map((doc, index) => (
                <div key={doc.documentId} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.documentName === 'Unknown Tool' ? 'Internal Operations' : doc.documentName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {doc.actionCount} actions • Last: {new Date(doc.lastAction).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No document activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatPercentage(performanceMetrics.successRate)}
            </div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {performanceMetrics.averageProcessingTime}
            </div>
            <div className="text-sm text-gray-600">Avg Processing Time</div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {performanceMetrics.userSatisfaction}/5.0
            </div>
            <div className="text-sm text-gray-600">User Satisfaction</div>
          </div>
        </div>
      </div>
    </div>
  );
};