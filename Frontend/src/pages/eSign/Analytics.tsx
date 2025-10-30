import React, { useEffect, useState } from 'react';
import { 
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Clock,
  CheckCircle,
  Shield,
  Zap,
  Globe,
  Target
} from 'lucide-react';
import { format, subDays, startOfMonth } from 'date-fns';
// import AdvancedAnalyticsDashboard from '../../components/ESign/advanced/AdvancedAnalyticsDashboard';
import { eSignApi } from '../../services/apiHelper';

const Analytics: React.FC = () => {
  const [dateRange, _setDateRange] = useState('30');
  const [_selectedMetric, _setSelectedMetric] = useState('completion_rate');
  const [_viewMode, _setViewMode] = useState<'basic' | 'advanced'>('basic');
  const [envelopes, setEnvelopes] = useState<any[]>([]);
  useEffect(() => {
    fetchEnvelopes();
  }, []);
    const fetchEnvelopes = async () => {
      try {
         const response = await eSignApi.get('/api/e-sign/get-envelopes');
         if (response.status == 200) {
          setEnvelopes(response.data.data);
         }
      } catch (error) {
        console.error('Error fetching envelopes:', error);
      }
    };
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
  const avgCompletionTime = 0.0; // Mock data
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
      change: '+0.0%',
      trend: 'up',
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      name: 'Avg. Completion Time',
      value: `${avgCompletionTime} days`,
      change: '-0.0 days',
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


  const statusDistribution = [
    { name: 'Completed', value: completedEnvelopes, color: 'bg-green-500' },
    { name: 'Pending', value: pendingEnvelopes, color: 'bg-yellow-500' },
    { name: 'Expired', value: expiredEnvelopes, color: 'bg-red-500' },
    { name: 'Draft', value: filteredEnvelopes.filter(env => env.status === 'draft').length, color: 'bg-gray-500' }
  ];

  // if (viewMode === 'advanced') {
  //   return <AdvancedAnalyticsDashboard />;
  // }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">Track your envelope performance and signing metrics.</p>
        </div>
        
        {/* <div className="flex items-center gap-4">
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
                viewMode === ('advanced' as 'basic' | 'advanced')
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
        </div> */}
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
      {/* <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
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
      </div> */}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Envelope Activity Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            {/* <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              <Filter className="w-4 h-4" />
              Filter
            </button> */}
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {envelopes.slice(0, 3).map((envelope) => (
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
    </div>
  );
};

export default Analytics;