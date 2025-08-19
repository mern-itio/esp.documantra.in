import React from 'react';
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
  Activity
} from 'lucide-react';
import type { ProcessingStats } from '../../types';
import { formatNumber, formatPercentage } from '../../utils';

interface AnalyticsProps {
  stats: ProcessingStats;
  onBack: () => void;
}

export const Analytics: React.FC<AnalyticsProps> = ({ stats, onBack }) => {
  const { dailyUsage, performanceMetrics, qualityMetrics } = stats;

  const mockChartData = [
    { name: 'Mon', operations: 2100, users: 450 },
    { name: 'Tue', operations: 2400, users: 520 },
    { name: 'Wed', operations: 2200, users: 480 },
    { name: 'Thu', operations: 2800, users: 630 },
    { name: 'Fri', operations: 3200, users: 720 },
    { name: 'Sat', operations: 1800, users: 380 },
    { name: 'Sun', operations: 1600, users: 340 }
  ];

  const categoryUsage = [
    { category: 'Conversion', usage: 35, color: 'bg-blue-500' },
    { category: 'Editing', usage: 22, color: 'bg-green-500' },
    { category: 'Pages', usage: 18, color: 'bg-yellow-500' },
    { category: 'Security', usage: 12, color: 'bg-red-500' },
    { category: 'Optimization', usage: 8, color: 'bg-purple-500' },
    { category: 'OCR', usage: 3, color: 'bg-pink-500' },
    { category: 'Forms', usage: 2, color: 'bg-indigo-500' }
  ];

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
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
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
            {mockChartData.map((day) => (
              <div key={day.name} className="flex items-center space-x-4">
                <div className="w-8 text-sm font-medium text-gray-600">{day.name}</div>
                <div className="flex-1 flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(day.operations / 3500) * 100}%` }}
                    />
                  </div>
                  <div className="text-sm font-medium text-gray-900 w-16 text-right">
                    {formatNumber(day.operations)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Usage */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Category Usage</h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {categoryUsage.map((category) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${category.color}`} />
                  <span className="text-sm font-medium text-gray-900">{category.category}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${category.color}`}
                      style={{ width: `${category.usage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600 w-8 text-right">
                    {category.usage}%
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
                    <span className="font-medium text-gray-900">{tool.name}</span>
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