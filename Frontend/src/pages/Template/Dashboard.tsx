import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText,
  TrendingUp, 
  Users,
  CheckCircle,
  Workflow,
  Code,
  ArrowRight
} from 'lucide-react';
import { StatsCard } from '../../components/Template/StatsCard';
import { RecentActivity } from '../../components/Template/RecentActivity';
import { QuickActions } from '../../components/Template/QuickActions';

export const Dashboard: React.FC = () => {
  const stats = [
    {
      title: 'Total Templates',
      value: '847',
      change: '+12%',
      trend: 'up' as const,
      icon: FileText,
      color: 'blue'
    },
    {
      title: 'Active Templates',
      value: '623',
      change: '+8%',
      trend: 'up' as const,
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Template Usage',
      value: '45.6K',
      change: '+23%',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'purple'
    },
    {
      title: 'API Calls',
      value: '23.4K',
      change: '+15%',
      trend: 'up' as const,
      icon: Code,
      color: 'orange'
    },
    {
      title: 'Team Members',
      value: '156',
      change: '+5%',
      trend: 'up' as const,
      icon: Users,
      color: 'indigo'
    },
    {
      title: 'Automations',
      value: '89',
      change: '+18%',
      trend: 'up' as const,
      icon: Workflow,
      color: 'teal'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Template Dashboard</h1>
        <p className="text-gray-600">Manage your document templates and automation workflows</p>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Templates */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Templates</h2>
            <Link 
              to="/library" 
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
            >
              View all
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-4">
            {[
              {
                name: 'Employment Contract Template',
                category: 'HR Documents',
                lastUsed: '2 hours ago',
                usage: 45,
                status: 'active'
              },
              {
                name: 'Sales Proposal Template',
                category: 'Business Contracts',
                lastUsed: '4 hours ago',
                usage: 32,
                status: 'active'
              },
              {
                name: 'NDA Agreement',
                category: 'Legal Documents',
                lastUsed: '1 day ago',
                usage: 28,
                status: 'active'
              },
              {
                name: 'Vendor Agreement',
                category: 'Business Contracts',
                lastUsed: '2 days ago',
                usage: 19,
                status: 'draft'
              }
            ].map((template, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-500">{template.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      template.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {template.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{template.usage} uses • {template.lastUsed}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Performance Overview</h2>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Template Completion Rate</span>
                <span className="text-sm font-semibold text-gray-900">94.2%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '94.2%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">API Success Rate</span>
                <span className="text-sm font-semibold text-gray-900">98.7%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '98.7%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">User Satisfaction</span>
                <span className="text-sm font-semibold text-gray-900">4.6/5</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Avg. Completion Time</span>
                <span className="font-medium text-gray-900">6.7 minutes</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Automation Savings</span>
              <span className="font-medium text-green-600">145 hrs/month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
};