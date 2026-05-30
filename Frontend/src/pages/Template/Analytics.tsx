import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Download, 
  Users, 
  Clock,
  Calendar,
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('usage');

  const metrics = [
    {
      title: 'Template Usage',
      value: '23.4K',
      change: '+15.3%',
      trend: 'up',
      icon: Eye,
      color: 'blue'
    },
    {
      title: 'Downloads',
      value: '12.8K',
      change: '+8.7%',
      trend: 'up',
      icon: Download,
      color: 'green'
    },
    {
      title: 'Active Users',
      value: '5.6K',
      change: '+23.1%',
      trend: 'up',
      icon: Users,
      color: 'purple'
    },
    {
      title: 'Avg. Completion Time',
      value: '4.2m',
      change: '-12.5%',
      trend: 'down',
      icon: Clock,
      color: 'orange'
    }
  ];

  const topTemplates = [
    {
      name: 'Employment Contract Template',
      category: 'HR Documents',
      usage: 2456,
      completionRate: 94.2,
      avgTime: '6.7m'
    },
    {
      name: 'NDA Agreement',
      category: 'Legal Documents', 
      usage: 1987,
      completionRate: 91.8,
      avgTime: '4.3m'
    },
    {
      name: 'Sales Proposal Template',
      category: 'Business Contracts',
      usage: 1654,
      completionRate: 88.9,
      avgTime: '8.2m'
    },
    {
      name: 'Invoice Template',
      category: 'Finance',
      usage: 1432,
      completionRate: 96.1,
      avgTime: '3.1m'
    },
    {
      name: 'Customer Feedback Form',
      category: 'Forms',
      usage: 1298,
      completionRate: 85.6,
      avgTime: '5.4m'
    }
  ];

  const recentActivity = [
    {
      action: 'Template Created',
      template: 'Vendor Agreement Template',
      user: 'Sarah Johnson',
      time: '2 hours ago',
      type: 'create'
    },
    {
      action: 'High Usage Alert',
      template: 'Employment Contract Template',
      user: 'System',
      time: '4 hours ago',
      type: 'alert'
    },
    {
      action: 'Template Updated',
      template: 'Sales Proposal Template',
      user: 'Mike Chen',
      time: '6 hours ago',
      type: 'update'
    },
    {
      action: 'Template Published',
      template: 'Privacy Policy Template',
      user: 'Lisa Wang',
      time: '8 hours ago',
      type: 'publish'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Template Analytics</h1>
          <p className="text-gray-600">Track performance and usage insights for your templates</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
            <Calendar className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const colorClasses = {
            blue: 'bg-blue-50 text-blue-600',
            green: 'bg-green-50 text-green-600',
            purple: 'bg-[#F0FDF4] text-[#155E4B]',
            orange: 'bg-orange-50 text-orange-600'
          };

          return (
            <div key={index} className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[metric.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className={`flex items-center text-sm ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                  {metric.change}
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</h3>
                <p className="text-sm text-gray-600">{metric.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Usage Chart */}
        <div className="lg:col-span-2 bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Template Usage Trends</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedMetric('usage')}
                className={`px-3 py-1 text-sm rounded-md ${
                  selectedMetric === 'usage' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Usage
              </button>
              <button
                onClick={() => setSelectedMetric('completion')}
                className={`px-3 py-1 text-sm rounded-md ${
                  selectedMetric === 'completion' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Completion
              </button>
            </div>
          </div>
          
          {/* Mock Chart */}
          <div className="h-64 bg-[#F5F2EE] rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Chart Visualization</p>
              <p className="text-sm">Template usage data over time</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Stats</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Templates</span>
              <span className="font-semibold text-gray-900">847</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Templates</span>
              <span className="font-semibold text-gray-900">623</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Draft Templates</span>
              <span className="font-semibold text-gray-900">224</span>
            </div>
            <div className="w-full h-px bg-gray-200 my-4"></div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg. Rating</span>
              <span className="font-semibold text-gray-900">4.6/5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Error Rate</span>
              <span className="font-semibold text-red-600">2.3%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Calls/Day</span>
              <span className="font-semibold text-gray-900">1.2K</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Templates and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Templates */}
        <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Top Performing Templates</h2>
          <div className="space-y-4">
            {topTemplates.map((template, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-600">{template.category}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{template.usage.toLocaleString()} uses</div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{template.completionRate}% complete</span>
                    <span>•</span>
                    <span>{template.avgTime} avg</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  activity.type === 'create' ? 'bg-green-100 text-green-700' :
                  activity.type === 'alert' ? 'bg-orange-100 text-orange-700' :
                  activity.type === 'update' ? 'bg-blue-100 text-blue-700' :
                  'bg-[#DCFCE7] text-[#155E4B]'
                }`}>
                  {activity.action.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.template}</p>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <span>{activity.user}</span>
                    <span className="mx-1">•</span>
                    <span>{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};