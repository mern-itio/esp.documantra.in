import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  Shield,
  AlertTriangle,
  Download,
  Filter,
  Calendar,
  Target,
  Zap,
  Globe
} from 'lucide-react';
import { AdvancedAnalytics } from '../../types';
import { mockAdvancedAnalytics } from '../../data/mockData';

interface AdvancedAnalyticsDashboardProps {
  analytics?: AdvancedAnalytics;
}

const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
  analytics = mockAdvancedAnalytics
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30');
  const [selectedMetric, setSelectedMetric] = useState('completion_rate');

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'authentication', name: 'Authentication', icon: Shield },
    { id: 'workflows', name: 'Workflows', icon: Zap },
    { id: 'compliance', name: 'Compliance', icon: Globe },
  ];

  const overviewMetrics = [
    {
      name: 'Overall Completion Rate',
      value: `${analytics.completionRates.overall}%`,
      change: '+2.4%',
      trend: 'up',
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      name: 'Average Completion Time',
      value: analytics.timeToCompletion.average,
      change: '-15 min',
      trend: 'down',
      icon: Clock,
      color: 'bg-blue-500'
    },
    {
      name: 'Authentication Success Rate',
      value: `${Object.values(analytics.authenticationMetrics.successRates).reduce((a, b) => a + b, 0) / Object.values(analytics.authenticationMetrics.successRates).length}%`,
      change: '+1.2%',
      trend: 'up',
      icon: Shield,
      color: 'bg-purple-500'
    },
    {
      name: 'Workflow Efficiency',
      value: `${analytics.workflowAnalytics.automationEfficiency}%`,
      change: '+5.1%',
      trend: 'up',
      icon: Zap,
      color: 'bg-orange-500'
    }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewMetrics.map((metric) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;
          
          return (
            <div key={metric.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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

      {/* Completion Rates by Document Type */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Completion Rates by Document Type</h3>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="completion_rate">Completion Rate</option>
            <option value="time_to_complete">Time to Complete</option>
            <option value="auth_success">Authentication Success</option>
          </select>
        </div>
        
        <div className="space-y-4">
          {Object.entries(analytics.completionRates.byDocumentType).map(([type, rate]) => (
            <div key={type} className="flex items-center gap-4">
              <div className="w-24 text-sm text-gray-600 capitalize">{type.replace('_', ' ')}</div>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600 w-12 text-right">
                  {rate}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Signature Type Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Signature Type Performance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(analytics.completionRates.bySignatureType).map(([type, rate]) => (
            <div key={type} className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">{rate}%</span>
              </div>
              <h4 className="font-semibold text-gray-900 capitalize">{type} Signature</h4>
              <p className="text-sm text-gray-600 mt-1">
                {type === 'standard' ? 'Basic electronic signature' :
                 type === 'advanced' ? 'Enhanced security signature' :
                 'Qualified electronic signature'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAuthentication = () => (
    <div className="space-y-6">
      {/* Authentication Success Rates */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Authentication Method Performance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Success Rates</h4>
            <div className="space-y-4">
              {Object.entries(analytics.authenticationMetrics.successRates).map(([method, rate]) => (
                <div key={method} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      rate >= 95 ? 'bg-green-500' :
                      rate >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {method.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          rate >= 95 ? 'bg-green-500' :
                          rate >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">{rate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-4">Average Attempts</h4>
            <div className="space-y-4">
              {Object.entries(analytics.authenticationMetrics.averageAttempts).map(([method, attempts]) => (
                <div key={method} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {method.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(attempts / 3) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{attempts}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Score Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Risk Score Distribution</h3>
        
        <div className="flex items-end justify-between h-48 bg-gray-50 rounded-lg p-4">
          {analytics.authenticationMetrics.riskScoreDistribution.map((count, index) => (
            <div key={index} className="flex flex-col items-center gap-2">
              <div 
                className="bg-blue-500 rounded-t w-8 transition-all duration-300"
                style={{ height: `${(count / Math.max(...analytics.authenticationMetrics.riskScoreDistribution)) * 100}%` }}
              />
              <span className="text-xs text-gray-600">{index * 10}-{(index + 1) * 10}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">Risk Score Ranges (0-100)</p>
        </div>
      </div>

      {/* Time to Complete by Auth Method */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Completion Time by Authentication Method</h3>
        
        <div className="space-y-4">
          {Object.entries(analytics.timeToCompletion.byAuthMethod).map(([method, time]) => (
            <div key={method} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900 capitalize">{method.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWorkflows = () => (
    <div className="space-y-6">
      {/* Workflow Efficiency */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Workflow Performance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
              <span className="text-white text-xl font-bold">{analytics.workflowAnalytics.automationEfficiency}%</span>
            </div>
            <h4 className="font-semibold text-gray-900">Automation Efficiency</h4>
            <p className="text-sm text-gray-600 mt-1">Percentage of automated processes</p>
          </div>
          
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
              <span className="text-white text-xl font-bold">{analytics.workflowAnalytics.escalationRates.timeout}%</span>
            </div>
            <h4 className="font-semibold text-gray-900">Timeout Escalations</h4>
            <p className="text-sm text-gray-600 mt-1">Workflows escalated due to timeout</p>
          </div>
          
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <span className="text-white text-xl font-bold">{analytics.workflowAnalytics.escalationRates.manual_escalation}%</span>
            </div>
            <h4 className="font-semibold text-gray-900">Manual Escalations</h4>
            <p className="text-sm text-gray-600 mt-1">Manually escalated workflows</p>
          </div>
        </div>
      </div>

      {/* Bottlenecks Analysis */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Workflow Bottlenecks</h3>
        
        <div className="space-y-4">
          {analytics.workflowAnalytics.bottlenecks.map((bottleneck, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 capitalize">{bottleneck.step.replace('_', ' ')}</h4>
                  <p className="text-sm text-gray-600">Occurs in {bottleneck.frequency}% of workflows</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-red-600">{bottleneck.averageDelay}</div>
                  <div className="text-sm text-gray-500">Average Delay</div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-medium text-blue-900">Recommendation</h5>
                    <p className="text-sm text-blue-700">{bottleneck.recommendation}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Escalation Types */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Escalation Analysis</h3>
        
        <div className="space-y-4">
          {Object.entries(analytics.workflowAnalytics.escalationRates).map(([type, rate]) => (
            <div key={type} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-5 h-5 ${
                  rate > 10 ? 'text-red-500' : rate > 5 ? 'text-yellow-500' : 'text-green-500'
                }`} />
                <div>
                  <h4 className="font-medium text-gray-900 capitalize">{type.replace('_', ' ')}</h4>
                  <p className="text-sm text-gray-600">
                    {type === 'timeout' ? 'Workflows that exceeded time limits' :
                     type === 'manual_escalation' ? 'Manually escalated by users' :
                     'System-triggered escalations'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${
                  rate > 10 ? 'text-red-600' : rate > 5 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {rate}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCompliance = () => (
    <div className="space-y-6">
      {/* Compliance Adherence */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Compliance Adherence Rates</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(analytics.complianceMetrics.adherenceRates).map(([standard, rate]) => (
            <div key={standard} className="text-center">
              <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                rate >= 98 ? 'bg-gradient-to-br from-green-500 to-green-600' :
                rate >= 95 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
                'bg-gradient-to-br from-red-500 to-red-600'
              }`}>
                <span className="text-white text-lg font-bold">{rate}%</span>
              </div>
              <h4 className="font-semibold text-gray-900 uppercase">{standard}</h4>
              <p className="text-sm text-gray-600 mt-1">
                {standard === 'esign' ? 'ESIGN Act Compliance' :
                 standard === 'eidas' ? 'eIDAS Regulation' :
                 standard === 'hipaa' ? 'HIPAA Compliance' :
                 'SOX Compliance'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Audit & Risk Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <div className="text-3xl font-bold text-green-600 mb-2">{analytics.complianceMetrics.auditFindings}</div>
            <div className="text-sm text-green-700">Audit Findings</div>
            <div className="text-xs text-green-600 mt-1">Low risk level</div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <div className="text-3xl font-bold text-blue-600 mb-2">{analytics.complianceMetrics.riskAssessments}</div>
            <div className="text-sm text-blue-700">Risk Assessments</div>
            <div className="text-xs text-blue-600 mt-1">Completed this month</div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
            <Globe className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <div className="text-3xl font-bold text-purple-600 mb-2">4</div>
            <div className="text-sm text-purple-700">Compliance Standards</div>
            <div className="text-xs text-purple-600 mt-1">Actively monitored</div>
          </div>
        </div>
      </div>

      {/* Compliance Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Compliance Status Timeline</h3>
        
        <div className="space-y-4">
          {[
            { date: '2024-01-15', event: 'ESIGN Act compliance audit completed', status: 'completed', type: 'audit' },
            { date: '2024-01-10', event: 'eIDAS regulation update implemented', status: 'completed', type: 'update' },
            { date: '2024-01-05', event: 'HIPAA compliance review scheduled', status: 'scheduled', type: 'review' },
            { date: '2024-01-01', event: 'SOX compliance monitoring activated', status: 'active', type: 'monitoring' }
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${
                item.status === 'completed' ? 'bg-green-500' :
                item.status === 'active' ? 'bg-blue-500' :
                item.status === 'scheduled' ? 'bg-yellow-500' : 'bg-gray-500'
              }`} />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{item.event}</div>
                <div className="text-sm text-gray-600">{item.date}</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                item.status === 'completed' ? 'bg-green-100 text-green-800' :
                item.status === 'active' ? 'bg-blue-100 text-blue-800' :
                item.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600 mt-2">Comprehensive insights into your e-signature performance and compliance.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'authentication' && renderAuthentication()}
      {activeTab === 'workflows' && renderWorkflows()}
      {activeTab === 'compliance' && renderCompliance()}
    </div>
  );
};

export default AdvancedAnalyticsDashboard;