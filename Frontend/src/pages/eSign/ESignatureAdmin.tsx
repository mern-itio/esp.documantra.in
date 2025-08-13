import React, { useState } from 'react';
import { 
  FileText, 
  Users, 
  Shield, 
  BarChart3, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Eye,
  Search,
  Download,
  RefreshCw,
  MoreHorizontal,
  Globe,
  Zap,
  Lock,
  Award,
  Mail,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { format } from 'date-fns';

const ESignatureAdmin: React.FC = () => {
  const { envelopes } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Calculate admin metrics
  const totalEnvelopes = envelopes.length;
  const completedEnvelopes = envelopes.filter(e => e.status === 'completed').length;
  const pendingEnvelopes = envelopes.filter(e => e.status === 'sent' || e.status === 'pending').length;
  const completionRate = totalEnvelopes > 0 ? (completedEnvelopes / totalEnvelopes) * 100 : 0;

  const adminMetrics = {
    totalEnvelopes: totalEnvelopes,
    dailyEnvelopes: 23,
    completionRate: completionRate,
    averageCompletionTime: "2.3 hours",
    activeEnvelopes: pendingEnvelopes,
    expiredEnvelopes: envelopes.filter(e => e.status === 'expired').length,
    systemHealth: 99.8,
    errorRate: 0.3,
    authSuccessRate: 96.8,
    mobileSigningRate: 67.3
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'envelopes', name: 'Envelopes', icon: FileText },
    { id: 'recipients', name: 'Recipients', icon: Users },
    { id: 'authentication', name: 'Authentication', icon: Shield },
    { id: 'signatures', name: 'Signatures', icon: Award },
    { id: 'workflows', name: 'Workflows', icon: Zap },
    { id: 'compliance', name: 'Compliance', icon: Globe },
    { id: 'security', name: 'Security', icon: Lock },
  ];

  const recentActivity = [
    {
      id: 1,
      user: "sarah.johnson@acme.com",
      action: "envelope_sent",
      envelope: "Employment Contract - Alex Rodriguez",
      recipients: 2,
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      status: "sent"
    },
    {
      id: 2,
      user: "michael.chen@techstart.com",
      action: "envelope_completed",
      envelope: "NDA Agreement - Project Phoenix",
      completionTime: "1.2 hours",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: "completed"
    },
    {
      id: 3,
      user: "alex.rodriguez@example.com",
      action: "document_signed",
      envelope: "Partnership Agreement - Q1 2024",
      authMethod: "biometric",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: "signed"
    }
  ];

  const systemAlerts = [
    {
      id: 1,
      type: "authentication",
      message: "High authentication failure rate detected",
      severity: "medium",
      details: "15% failure rate in video verification",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000)
    },
    {
      id: 2,
      type: "compliance",
      message: "Quarterly compliance audit due",
      severity: "low",
      details: "Q3 audit scheduled for next week",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
    },
    {
      id: 3,
      type: "performance",
      message: "Envelope processing time increased",
      severity: "medium",
      details: "Average completion time up 15% this week",
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000)
    }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-green-600">
              <TrendingUp className="w-4 h-4" />
              +12%
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{adminMetrics.totalEnvelopes.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Total Envelopes</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-green-600">
              <TrendingUp className="w-4 h-4" />
              +5.2%
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{adminMetrics.completionRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-600">Completion Rate</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-red-600">
              <TrendingDown className="w-4 h-4" />
              -15 min
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{adminMetrics.averageCompletionTime}</p>
            <p className="text-sm text-gray-600">Avg. Completion Time</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-green-600">
              <TrendingUp className="w-4 h-4" />
              +2.1%
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{adminMetrics.authSuccessRate}%</p>
            <p className="text-sm text-gray-600">Auth Success Rate</p>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">System Uptime</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">{adminMetrics.systemHealth}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Error Rate</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">{adminMetrics.errorRate}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Mobile Signing</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">{adminMetrics.mobileSigningRate}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Envelopes</span>
              <span className="text-sm font-medium text-gray-900">{adminMetrics.activeEnvelopes}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h3>
          <div className="space-y-3">
            {systemAlerts.slice(0, 4).map((alert) => (
              <div key={alert.id} className={`p-3 rounded-lg border ${
                alert.severity === 'high' ? 'bg-red-50 border-red-200' :
                alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                      alert.severity === 'high' ? 'text-red-600' :
                      alert.severity === 'medium' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                    <div>
                      <p className={`text-sm font-medium ${
                        alert.severity === 'high' ? 'text-red-900' :
                        alert.severity === 'medium' ? 'text-yellow-900' :
                        'text-blue-900'
                      }`}>
                        {alert.message}
                      </p>
                      <p className={`text-xs mt-1 ${
                        alert.severity === 'high' ? 'text-red-700' :
                        alert.severity === 'medium' ? 'text-yellow-700' :
                        'text-blue-700'
                      }`}>
                        {alert.details}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {format(alert.timestamp, 'HH:mm')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View All
          </button>
        </div>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.status === 'completed' ? 'bg-green-100 text-green-600' :
                  activity.status === 'sent' ? 'bg-blue-100 text-blue-600' :
                  'bg-yellow-100 text-yellow-600'
                }`}>
                  {activity.status === 'completed' ? <CheckCircle className="w-4 h-4" /> :
                   activity.status === 'sent' ? <Mail className="w-4 h-4" /> :
                   <FileText className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.envelope}</p>
                  <p className="text-xs text-gray-500">
                    {activity.user} • {format(activity.timestamp, 'MMM d, HH:mm')}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                activity.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {activity.action.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEnvelopes = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Envelope Administration</h3>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search envelopes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="completed">Completed</option>
            <option value="expired">Expired</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Envelope
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sender
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {envelopes.slice(0, 10).map((envelope) => (
                <tr key={envelope.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{envelope.subject}</div>
                      <div className="text-sm text-gray-500">{envelope.documents.length} document(s)</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{envelope.sender.name}</div>
                    <div className="text-sm text-gray-500">{envelope.sender.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{envelope.recipients.length} recipients</div>
                    <div className="text-sm text-gray-500">
                      {envelope.recipients.filter(r => r.status === 'completed').length} completed
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      envelope.status === 'completed' ? 'bg-green-100 text-green-800' :
                      envelope.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                      envelope.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {envelope.status.charAt(0).toUpperCase() + envelope.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(envelope.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAuthentication = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Authentication Monitoring</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Authentication Methods</h4>
          <div className="space-y-3">
            {[
              { method: 'Email', usage: 45, success: 98.2 },
              { method: 'SMS', usage: 25, success: 96.8 },
              { method: 'Biometric', usage: 15, success: 99.1 },
              { method: 'Video ID', usage: 10, success: 87.6 },
              { method: 'Government ID', usage: 5, success: 94.3 }
            ].map((auth) => (
              <div key={auth.method} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{auth.method}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-900">{auth.usage}%</span>
                  <span className={`text-sm font-medium ${
                    auth.success >= 95 ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {auth.success}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Security Metrics</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Failed Attempts</span>
              <span className="text-sm font-medium text-red-600">127</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Fraud Detected</span>
              <span className="text-sm font-medium text-red-600">3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Risk Score Avg</span>
              <span className="text-sm font-medium text-green-600">12.4</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">MFA Adoption</span>
              <span className="text-sm font-medium text-blue-600">78.3%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Incidents</h4>
          <div className="space-y-3">
            {[
              { type: 'Failed Auth', count: 15, time: '2h ago' },
              { type: 'Suspicious IP', count: 3, time: '4h ago' },
              { type: 'Multiple Attempts', count: 8, time: '6h ago' }
            ].map((incident, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                <span className="text-sm text-red-900">{incident.type}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-red-600">{incident.count}</span>
                  <span className="text-xs text-red-500">{incident.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSignatures = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Signature Type Management</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Signature Distribution</h4>
          <div className="space-y-4">
            {[
              { type: 'Standard', count: 1234, percentage: 65, color: 'bg-blue-500' },
              { type: 'Advanced', count: 567, percentage: 30, color: 'bg-green-500' },
              { type: 'Qualified', count: 95, percentage: 5, color: 'bg-purple-500' }
            ].map((sig) => (
              <div key={sig.type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{sig.type}</span>
                  <span className="text-sm text-gray-600">{sig.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`${sig.color} h-2 rounded-full`}
                    style={{ width: `${sig.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Compliance Status</h4>
          <div className="space-y-3">
            {[
              { standard: 'ESIGN Act', status: 'compliant', percentage: 99.8 },
              { standard: 'eIDAS', status: 'compliant', percentage: 97.2 },
              { standard: 'UETA', status: 'compliant', percentage: 99.5 },
              { standard: 'ISO 14533', status: 'partial', percentage: 85.3 }
            ].map((comp) => (
              <div key={comp.standard} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{comp.standard}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{comp.percentage}%</span>
                  <div className={`w-2 h-2 rounded-full ${
                    comp.status === 'compliant' ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Certificate Status</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-green-900">Valid Certificates</span>
              <span className="text-sm text-green-600">1,847</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm font-medium text-yellow-900">Expiring Soon</span>
              <span className="text-sm text-yellow-600">23</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-sm font-medium text-red-900">Revoked</span>
              <span className="text-sm text-red-600">5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">E-Signature Administration</h1>
            <p className="text-gray-600 mt-2">Monitor and manage your e-signature system performance.</p>
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
            </select>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
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
        {activeTab === 'envelopes' && renderEnvelopes()}
        {activeTab === 'recipients' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Recipient Management</h3>
            <p className="text-gray-600">Monitor recipient activity and engagement patterns.</p>
          </div>
        )}
        {activeTab === 'authentication' && renderAuthentication()}
        {activeTab === 'signatures' && renderSignatures()}
        {activeTab === 'workflows' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Workflow Administration</h3>
            <p className="text-gray-600">Monitor enterprise workflows and automation performance.</p>
          </div>
        )}
        {activeTab === 'compliance' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Compliance Monitoring</h3>
            <p className="text-gray-600">Track regulatory compliance and audit requirements.</p>
          </div>
        )}
        {activeTab === 'security' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Security Monitoring</h3>
            <p className="text-gray-600">Monitor security incidents and fraud detection.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ESignatureAdmin;