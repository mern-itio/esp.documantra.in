import React, { useState } from 'react';
import { 
  BarChart3, 
  HardDrive, 
  FileText, 
  Users, 
  Share2, 
  Activity,
  AlertTriangle,
  TrendingUp,
  Clock,
  Shield,
  Database,
  Zap
} from 'lucide-react';
import { useDocumentStore } from '../../store/documentStore';
import { useCollaborationStore } from '../../store/collaborationStore';
import { formatFileSize, formatDate } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

export function DocumentAdminDashboard() {
  const { documents, folders, currentUser } = useDocumentStore();
  const { comments, versions, workflows, activeUsers } = useCollaborationStore();
  
  const [timeRange, setTimeRange] = useState('7d');

  // Calculate overview metrics
  const totalDocuments = documents.length;
  const totalStorage = documents.reduce((sum, doc) => sum + doc.size, 0);
  const sharedDocuments = documents.filter(doc => doc.shared).length;
  const totalFolders = folders.length;
  const activeCollaborations = activeUsers.length;
  const totalComments = comments.length;
  const totalVersions = versions.length;
  const activeWorkflows = workflows.filter(w => w.status === 'active').length;

  // Recent activity (mock data for demo)
  const recentActivity = [
    {
      id: 'activity-1',
      user: 'john.doe@example.com',
      action: 'uploaded',
      document: 'Financial_Report_Q4.pdf',
      timestamp: '2024-07-01T14:30:00Z',
      type: 'upload'
    },
    {
      id: 'activity-2',
      user: 'jane.smith@example.com',
      action: 'started collaboration on',
      document: 'Project_Proposal.docx',
      timestamp: '2024-07-01T14:25:00Z',
      type: 'collaboration'
    },
    {
      id: 'activity-3',
      user: 'mike.johnson@example.com',
      action: 'shared',
      document: 'Marketing_Strategy.pptx',
      timestamp: '2024-07-01T14:20:00Z',
      type: 'share'
    },
    {
      id: 'activity-4',
      user: 'sarah.wilson@example.com',
      action: 'completed workflow for',
      document: 'Contract_Review.pdf',
      timestamp: '2024-07-01T14:15:00Z',
      type: 'workflow'
    }
  ];

  // System alerts (mock data)
  const systemAlerts = [
    {
      id: 'alert-1',
      type: 'storage',
      severity: 'medium',
      message: 'Storage usage at 78% capacity',
      details: `${formatFileSize(totalStorage)} of ${formatFileSize(totalStorage * 1.28)} used`,
      timestamp: '2024-07-01T13:00:00Z'
    },
    {
      id: 'alert-2',
      type: 'security',
      severity: 'low',
      message: '3 documents shared externally today',
      details: 'Monitor external sharing activity',
      timestamp: '2024-07-01T12:30:00Z'
    },
    {
      id: 'alert-3',
      type: 'performance',
      severity: 'low',
      message: 'Average upload time: 2.3 seconds',
      details: 'System performance within normal range',
      timestamp: '2024-07-01T12:00:00Z'
    }
  ];

  const overviewStats = [
    {
      title: 'Total Documents',
      value: totalDocuments.toLocaleString(),
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Storage Used',
      value: formatFileSize(totalStorage),
      icon: HardDrive,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Active Users',
      value: activeCollaborations.toString(),
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+15%',
      changeType: 'positive'
    },
    {
      title: 'Shared Documents',
      value: sharedDocuments.toLocaleString(),
      icon: Share2,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: '+23%',
      changeType: 'positive'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'collaboration':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'share':
        return <Share2 className="w-4 h-4 text-purple-600" />;
      case 'workflow':
        return <Zap className="w-4 h-4 text-orange-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'storage':
        return <HardDrive className="w-4 h-4" />;
      case 'security':
        return <Shield className="w-4 h-4" />;
      case 'performance':
        return <Activity className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (currentUser.role !== 'super_admin' && currentUser.role !== 'team_admin') {
    return (
      <div className="p-8 text-center">
        <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Access Required</h3>
        <p className="text-gray-500">You need admin permissions to view the admin dashboard.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {currentUser.role === 'super_admin' 
              ? 'Platform-wide document management and oversight'
              : 'Team document management and administration'
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button size="sm">
            <Database className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${stat.bgColor} mr-4`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className={`text-xs mt-1 ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change} from last period
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Health and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>System Health</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">System Uptime</span>
                <span className="text-sm text-green-600 font-medium">99.9%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '99.9%' }} />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">2.1s</div>
                  <div className="text-xs text-gray-600">Avg Upload Time</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">0.3s</div>
                  <div className="text-xs text-gray-600">Search Response</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>System Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${getAlertColor(alert.severity)}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {alert.details}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(alert.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Activity and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 py-2">
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.user}</span>
                      {' '}
                      {activity.action}
                      {' '}
                      <span className="font-medium truncate">{activity.document}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Quick Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Folders</span>
                <span className="text-sm font-medium text-gray-900">{totalFolders}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Comments</span>
                <span className="text-sm font-medium text-gray-900">{totalComments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Document Versions</span>
                <span className="text-sm font-medium text-gray-900">{totalVersions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Workflows</span>
                <span className="text-sm font-medium text-gray-900">{activeWorkflows}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Collaboration Sessions</span>
                <span className="text-sm font-medium text-gray-900">{activeCollaborations}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Admin Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <FileText className="w-6 h-6 mb-2" />
              <span className="text-sm">Manage Documents</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <HardDrive className="w-6 h-6 mb-2" />
              <span className="text-sm">Storage Management</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Users className="w-6 h-6 mb-2" />
              <span className="text-sm">User Activity</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <BarChart3 className="w-6 h-6 mb-2" />
              <span className="text-sm">Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}