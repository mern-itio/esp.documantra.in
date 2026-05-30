import React, { useState } from 'react';
import { 
  BarChart3,
  FileText, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Star,
  Shield,
  Settings,
  Eye,
  RefreshCw,
  Activity,
  Globe,
  Sparkles
} from 'lucide-react';
import { TemplateSystemMonitor } from '../../components/Template/admin/TemplateSystemMonitor';
import { BulkTemplateActions } from '../../components/Template/admin/BulkTemplateActions';

export const TemplateAdminDashboard: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState<'overview' | 'templates' | 'ai' | 'marketplace' | 'workflows' | 'analytics' | 'security' | 'monitor' | 'bulk'>('overview');

  // Mock admin data
interface OverviewStats {
  totalTemplates: number;
  dailyCreations: number;
  aiGeneratedTemplates: number;
  marketplaceTemplates: number;
  activeWorkflows: number;
  templateUsage: number;
  systemHealth: number;
  aiAccuracy: number;
}

interface Alert {
  id: string;
  type: 'ai_performance' | 'marketplace' | 'security';
  severity: 'low' | 'medium' | 'high';
  message: string;
  details: string;
  timestamp: string;
}

interface RecentActivity {
  id: string;
  user: string;
  action: 'ai_template_generated' | 'template_published' | 'workflow_optimized';
  template: string;
  aiConfidence?: number;
  marketplace?: boolean;
  improvement?: string;
  timestamp: string;
}

interface Template {
  id: string;
  name: string;
  type: 'document' | 'form_signer' | 'ai_generated' | 'api_template';
  status: 'published' | 'draft' | 'archived' | 'deprecated';
  creator: string;
  created: string;
  usage: number;
  rating: number;
  aiGenerated: boolean;
}

interface AdminStats {
  overview: OverviewStats;
  alerts: Alert[];
  recentActivity: RecentActivity[];
  popularTemplates: Template[];
}

const adminStats: AdminStats = {
  overview: {
    totalTemplates: 12456,
    dailyCreations: 89,
    aiGeneratedTemplates: 3421,
    marketplaceTemplates: 1678,
    activeWorkflows: 234,
    templateUsage: 15670,
    systemHealth: 99.1,
    aiAccuracy: 94.7
  },
  alerts: [
    {
      id: '1',
      type: 'ai_performance',
      severity: 'medium',
      message: 'AI template generation accuracy below threshold',
      details: 'Current accuracy: 89.2%, Target: 95%',
      timestamp: '2 hours ago'
    },
    {
      id: '2',
      type: 'marketplace',
      severity: 'low',
      message: '15 templates pending approval',
      details: 'Average review time: 2.3 hours',
      timestamp: '4 hours ago'
    },
    {
      id: '3',
      type: 'security',
      severity: 'high',
      message: 'Suspicious template upload detected',
      details: 'Template contains potentially malicious content',
      timestamp: '6 hours ago'
    }
  ],
  recentActivity: [
    {
      id: '1',
      user: 'john@example.com',
      action: 'ai_template_generated',
      template: 'Custom Service Agreement',
      aiConfidence: 96.2,
      timestamp: '10 minutes ago'
    },
    {
      id: '2',
      user: 'jane@company.com',
      action: 'template_published',
      template: 'Project Proposal Template',
      marketplace: true,
      timestamp: '25 minutes ago'
    },
    {
      id: '3',
      user: 'admin@system.com',
      action: 'workflow_optimized',
      template: 'Employee Onboarding Flow',
      improvement: '+15% efficiency',
      timestamp: '1 hour ago'
    }
  ],
  popularTemplates: [
    {
      id: '1',
      name: 'Employment Contract',
      usage: 1234,
      type: 'form_signer',
      rating: 4.8,
      aiGenerated: false,
      status: 'published',
      creator: 'hr@company.com',
      created: '2024-06-15'
    },
    {
      id: '2',
      name: 'AI Sales Proposal',
      usage: 987,
      type: 'ai_generated',
      rating: 4.6,
      aiGenerated: true,
      status: 'published',
      creator: 'ai@system.com',
      created: '2024-06-20'
    },
    {
      id: '3',
      name: 'NDA Agreement',
      usage: 756,
      type: 'document',
      rating: 4.9,
      aiGenerated: false,
      status: 'published',
      creator: 'legal@company.com',
      created: '2024-06-10'
    }
  ]
};


  const aiMetrics = {
    generationAccuracy: 94.7,
    fieldDetectionAccuracy: 96.8,
    recommendationRelevance: 89.3,
    contentOptimizationEffectiveness: 87.6,
    userSatisfactionWithAI: 4.5,
    aiProcessingSpeed: 3.2,
    aiSystemUptime: 99.8,
    modelPerformanceScore: 92.4
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'ai', label: 'AI System', icon: Sparkles },
    { id: 'marketplace', label: 'Marketplace', icon: Globe },
    { id: 'workflows', label: 'Workflows', icon: Zap },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'monitor', label: 'System Monitor', icon: Activity },
    { id: 'bulk', label: 'Bulk Actions', icon: Settings }
  ];

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 border-red-200 text-red-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-blue-100 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700';
      case 'archived':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const handleBulkAction = (action: string, templateIds: string[]) => {
    console.log(`Executing ${action} on templates:`, templateIds);
    // Implementation would handle the bulk action
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Template System Administration</h1>
          <p className="text-gray-600">Monitor and manage your template system and AI features</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#F7F3EE] text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Templates</p>
                  <p className="text-lg font-semibold text-gray-900">{adminStats.overview.totalTemplates.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Sparkles className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">AI Generated</p>
                  <p className="text-lg font-semibold text-gray-900">{adminStats.overview.aiGeneratedTemplates.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-[#DCFCE7] rounded-lg">
                  <TrendingUp className="w-5 h-5 text-[#155E4B]" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Daily Usage</p>
                  <p className="text-lg font-semibold text-gray-900">{adminStats.overview.templateUsage.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Shield className="w-5 h-5 text-orange-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">System Health</p>
                  <p className="text-lg font-semibold text-gray-900">{adminStats.overview.systemHealth}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">System Alerts</h2>
              <span className="text-sm text-gray-500">{adminStats.alerts.length} active alerts</span>
            </div>
            <div className="space-y-3">
              {adminStats.alerts.map((alert) => (
                <div key={alert.id} className={`border rounded-lg p-4 ${getAlertColor(alert.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        <h3 className="font-medium">{alert.message}</h3>
                      </div>
                      <p className="text-sm opacity-80">{alert.details}</p>
                    </div>
                    <div className="text-xs opacity-60">{alert.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity and Popular Templates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {adminStats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Activity className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.user}</span> {activity.action.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-gray-600">{activity.template}</p>
                      <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Templates */}
            <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Popular Templates</h2>
              <div className="space-y-4">
                {adminStats.popularTemplates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        {template.aiGenerated && (
                          <span className="px-2 py-0.5 bg-[#DCFCE7] text-[#155E4B] text-xs rounded-full">AI</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{template.usage} uses</span>
                        <div className="flex items-center">
                          <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                          <span>{template.rating}</span>
                        </div>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(template.status)}`}>
                          {template.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI System Tab */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          {/* AI Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Generation Accuracy</h3>
                <Sparkles className="w-4 h-4 text-[#155E4B]" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{aiMetrics.generationAccuracy}%</p>
              <p className="text-xs text-green-600 mt-1">+2.3% from last week</p>
            </div>
            <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Field Detection</h3>
                <Eye className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{aiMetrics.fieldDetectionAccuracy}%</p>
              <p className="text-xs text-green-600 mt-1">+1.8% from last week</p>
            </div>
            <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Processing Speed</h3>
                <Zap className="w-4 h-4 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{aiMetrics.aiProcessingSpeed}s</p>
              <p className="text-xs text-green-600 mt-1">-0.5s from last week</p>
            </div>
            <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">System Uptime</h3>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{aiMetrics.aiSystemUptime}%</p>
              <p className="text-xs text-green-600 mt-1">99.9% target</p>
            </div>
          </div>

          {/* AI Model Performance */}
          <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Model Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">Model Accuracy Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Template Generation</span>
                    <span className="font-medium">{aiMetrics.generationAccuracy}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Field Detection</span>
                    <span className="font-medium">{aiMetrics.fieldDetectionAccuracy}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Recommendations</span>
                    <span className="font-medium">{aiMetrics.recommendationRelevance}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Content Optimization</span>
                    <span className="font-medium">{aiMetrics.contentOptimizationEffectiveness}%</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">User Satisfaction</h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{aiMetrics.userSatisfactionWithAI}/5</div>
                  <div className="text-sm text-gray-600">Average AI Feature Rating</div>
                  <div className="mt-4">
                    <div className="flex items-center justify-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= aiMetrics.userSatisfactionWithAI
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Monitor Tab */}
      {activeTab === 'monitor' && (
        <TemplateSystemMonitor />
      )}

      {/* Bulk Actions Tab */}
      {activeTab === 'bulk' && (
        <BulkTemplateActions 
          templates={adminStats.popularTemplates}
          onBulkAction={handleBulkAction}
        />
      )}

      {/* Other tabs placeholder */}
      {!['overview', 'ai', 'monitor', 'bulk'].includes(activeTab) && (
        <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Settings className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{tabs.find(t => t.id === activeTab)?.label} Administration</h3>
          <p className="text-gray-600">This section is under development and will be available soon.</p>
        </div>
      )}
    </div>
  );
};