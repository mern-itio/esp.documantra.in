import React, { useState, useEffect } from 'react';
import { Search, BarChart3, Zap, Edit3, Workflow, Target, Cloud, HelpCircle, ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ProcessingStats } from '../../types';
import { formatNumber } from '../../utils';
import { analyticsService, type AnalyticsData, type AnalyticsFilters } from '../../services/analyticsService';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentView: string;
  onViewChange: (view: 'tools' | 'viewer' | 'editor' | 'batch' | 'analytics' | 'workflows' | 'quality' | 'cloud' | 'help' | 'admin') => void;
  stats: ProcessingStats;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  currentView,
  onViewChange,
  stats
}) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if we're on a specific tool page (not the main PDF tools page)
  const isOnSpecificTool = location.pathname !== '/pdf-tools' && location.pathname.startsWith('/pdf-tools/');

  // Load analytics data on component mount
  useEffect(() => {
    loadAnalyticsData();
  }, []);

  // Set up real-time updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadAnalyticsData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadAnalyticsData = async () => {
    try {
      const filters: AnalyticsFilters = { timeRange: '7d' };
      const data = await analyticsService.getAnalyticsData(filters);
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error loading analytics data for header:', err);
      // Fallback to static stats if API fails
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  };

  // Use dynamic data if available, otherwise fallback to static stats
  const displayStats = analyticsData ? {
    totalOperations: analyticsData.dailyUsage.totalOperations,
    successRate: analyticsData.performanceMetrics.successRate
  } : {
    totalOperations: stats.dailyUsage.totalOperations,
    successRate: stats.performanceMetrics.successRate
  };

  const handleBackToTools = () => {
    navigate('/pdf-tools');
  };

  return (
    <header className="bg-white border-b border-gray-200 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-4">
          {/* Back Button - Only show when on specific tool pages */}
          {isOnSpecificTool && (
            <button
              onClick={handleBackToTools}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to PDF Tools</span>
            </button>
          )}

          {/* Stats Pills - Only show when not on specific tool pages */}
          {!isOnSpecificTool && (
            <div className="hidden md:flex items-center space-x-3">
              <div className="bg-blue-50 px-3 py-1 rounded-full">
                <span className="text-xs font-medium text-blue-700">
                  {loading ? '...' : formatNumber(displayStats.totalOperations)} operations in last 7 days
                </span>
              </div>
              <div className="bg-green-50 px-3 py-1 rounded-full">
                <span className="text-xs font-medium text-green-700">
                  {loading
                    ? '...'
                    : `${Number(displayStats.successRate).toFixed(2)}%`} success rate
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl mx-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search 50+ PDF tools..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Navigation and Actions - Only show when not on specific tool pages */}
        {!isOnSpecificTool && (
          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onViewChange('editor')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${currentView === 'editor'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Edit3 className="w-4 h-4 mr-1 inline" />
                Editor
              </button>
              <button
                onClick={() => onViewChange('batch')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${currentView === 'batch'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Zap className="w-4 h-4 mr-1 inline" />
                Batch
              </button>
              <button
                onClick={() => onViewChange('workflows')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${currentView === 'workflows'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Workflow className="w-4 h-4 mr-1 inline" />
                Workflows
              </button>
              <button
                onClick={() => onViewChange('quality')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${currentView === 'quality'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Target className="w-4 h-4 mr-1 inline" />
                Quality
              </button>
              <button
                onClick={() => onViewChange('cloud')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${currentView === 'cloud'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Cloud className="w-4 h-4 mr-1 inline" />
                Cloud
              </button>
              <button
                onClick={() => onViewChange('analytics')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${currentView === 'analytics'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <BarChart3 className="w-4 h-4 mr-1 inline" />
                Analytics
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => onViewChange('help')}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};