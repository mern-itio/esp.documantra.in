import React, { useState } from 'react';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Clock,
  CheckCircle,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Shield,
  Zap,
  Globe,
  Target
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import AdvancedAnalyticsDashboard from '../components/advanced/AdvancedAnalyticsDashboard';

const Analytics: React.FC = () => {
  const { envelopes } = useApp();
  const [dateRange, setDateRange] = useState('30');
  const [selectedMetric, setSelectedMetric] = useState('completion_rate');
  const [viewMode, setViewMode] = useState<'basic' | 'advanced'>('basic');

  // Calculate analytics data
  const now = new Date();
  const startDate = dateRange === '30' ? subDays(now, 30) : 
                   dateRange === '7' ? subDays(now, 7) :
                   startOfMonth(now);

  const filteredEnvelopes = envelopes.filter(env => 
    new Date(env.createdAt) >= startDate
  );

  const totalEnvelopes = filteredEnvelopes.length;
  const completedEnvelopes = filteredEnvelopes.filter(env => env.status === 'completed').length;
  const pendingEnvelopes = filteredEnvelopes.filter(env => env.status === 'sent' || env.status === 'pending').length;
  const expiredEnvelopes = filteredEnvelopes.filter(env => env.status === 'expired').length;

  const completionRate = totalEnvelopes > 0 ? (completedEnvelopes / totalEnvelopes) * 100 : 0;
  const avgCompletionTime = 2.3; // Mock data
  const totalRecipients = filteredEnvelopes.reduce((acc, env) => acc + env.recipients.length, 0);

  // Enhanced metrics for enterprise view
  const advancedMetrics = [
    {
      name: 'Total Envelopes',
      value: totalEnvelopes,
      change: '+12%',
      trend: 'up',
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      name: 'Completion Rate',
      value: `${completionRate.toFixed(1)}%`,
      change: '+5.2%',
      trend: 'up',
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      name: 'Avg. Completion Time',
      value: `${avgCompletionTime} days`,
      change: '-0.5 days',
      trend: 'down',
      icon: Clock,
      color: 'bg-yellow-500'
    },
    {
      name: 'Total Recipients',
      value: totalRecipients,
      change: '+18%',
      trend: 'up',
      icon: Users,
      color: 'bg-purple-500'
    },
    {
      name: 'Auth Success Rate',
      value: '96.8%',
      change: '+2.1%',
      trend: 'up',
      icon: Shield,
      color: 'bg-indigo-500'
    },
    {
      name: 'Workflow Efficiency',
      value: '87.3%',
      change: '+4.2%',
      trend: 'up',
      icon: Zap,
      color: 'bg-orange-500'
    },
    {
      name: 'Compliance Score',
      value: '98.2%',
      change: '+0.8%',
      trend: 'up',
      icon: Globe,
      color: 'bg-teal-500'
    },
    {
      name: 'ROI Improvement',
      value: '234%',
      change: '+45%',
      trend: 'up',
      icon: Target,
      color: 'bg-pink-500'
    }
  ];

  const chartData = [
    { name: 'Mon', completed: 12, sent: 8, advanced: 5, qualified: 2 },
    { name: 'Tue', completed: 15, sent: 12, advanced: 8, qualified: 3 },
    { name: 'Wed', completed: 8, sent: 15, advanced: 6, qualified: 1 },
    { name: 'Thu', completed: 18, sent: 10, advanced: 12, qualified: 4 },
    { name: 'Fri', completed: 22, sent: 14, advanced: 15, qualified: 6 },
    { name: 'Sat', completed: 5, sent: 8, advanced: 3, qualified: 1 },
    { name: 'Sun', completed: 3, sent: 6, advanced: 2, qualified: 0 }
  ];

  const statusDistribution = [
    { name: 'Completed', value: completedEnvelopes, color: 'bg-green-500' },
    { name: 'Pending', value: pendingEnvelopes, color: 'bg-yellow-500' },
    { name: 'Expired', value: expiredEnvelopes, color: 'bg-red-500' },
    { name: 'Draft', value: filteredEnvelopes.filter(env => env.status === 'draft').length, color: 'bg-gray-500' }
  ];

  if (viewMode === 'advanced') {
    return <AdvancedAnalyticsDashboard />;
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">Track your envelope performance and signing metrics.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('basic')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'basic'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Basic
            </button>
            <button
              onClick={() => setViewMode('advanced')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'advanced'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Advanced
            </button>
          </div>
          
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="month">This month</option>
          </select>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {advancedMetrics.slice(0, 4).map((metric) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;
          
          return (
            <div key={metric.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${metric.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendIcon className="w-4 h-4" />
                  {metric.change}
                </div>
              </div>
              
              <div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</p>
                <p className="text-sm text-gray-600">{metric.name}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enterprise Features Preview */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Unlock Advanced Analytics</h3>
            <p className="text-purple-100 mb-4">
              Get deeper insights with authentication analytics, workflow optimization, compliance tracking, and more.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Authentication Analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Workflow Intelligence</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span>Compliance Tracking</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setViewMode('advanced')}
            className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            View Advanced Analytics
          </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Envelope Activity Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Envelope Activity</h3>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="completion_rate">Completion Rate</option>
              <option value="volume">Volume</option>
              <option value="response_time">Response Time</option>
            </select>
          </div>
          
          <div className="space-y-4">
            {chartData.map((day, index) => (
              <div key={day.name} className="flex items-center gap-4">
                <div className="w-12 text-sm text-gray-600">{day.name}</div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="flex h-full">
                      <div 
                        className="bg-green-500 transition-all duration-300"
                        style={{ width: `${(day.completed / (day.completed + day.sent)) * 100}%` }}
                      />
                      <div 
                        className="bg-blue-500 transition-all duration-300"
                        style={{ width: `${(day.sent / (day.completed + day.sent)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 w-16 text-right">
                    {day.completed + day.sent}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-600">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-sm text-gray-600">Sent</span>
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Status Distribution</h3>
          
          <div className="space-y-4">
            {statusDistribution.map((status) => {
              const percentage = totalEnvelopes > 0 ? (status.value / totalEnvelopes) * 100 : 0;
              
              return (
                <div key={status.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${status.color}`} />
                    <span className="text-sm font-medium text-gray-700">{status.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${status.color} transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">{status.value}</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{totalEnvelopes}</p>
              <p className="text-sm text-gray-600">Total Envelopes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {envelopes.slice(0, 5).map((envelope) => (
            <div key={envelope.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    envelope.status === 'completed' ? 'bg-green-100 text-green-600' :
                    envelope.status === 'sent' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-900">{envelope.subject}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span>{envelope.recipients.length} recipients</span>
                      <span>{format(new Date(envelope.createdAt), 'MMM d, yyyy')}</span>
                      {envelope.signatureType && (
                        <span className="capitalize">{envelope.signatureType} signature</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    envelope.status === 'completed' ? 'bg-green-100 text-green-800' :
                    envelope.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {envelope.status.charAt(0).toUpperCase() + envelope.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;