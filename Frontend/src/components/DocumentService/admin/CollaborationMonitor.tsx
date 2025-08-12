import React, { useState } from 'react';
import { 
  Users, 
  MessageCircle, 
  GitBranch, 
  Activity,
  Clock,
  TrendingUp,
  Eye,
  Edit3
} from 'lucide-react';
import { useCollaborationStore } from '../../store/collaborationStore';
import { useDocumentStore } from '../../store/documentStore';
import { formatDate } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

export function CollaborationMonitor() {
  const { currentUser } = useDocumentStore();
  const { 
    activeUsers, 
    comments, 
    versions, 
    workflows,
    getDocumentComments,
    getDocumentVersions,
    getActiveUsers
  } = useCollaborationStore();
  
  const [timeRange, setTimeRange] = useState('24h');

  if (currentUser.role !== 'super_admin' && currentUser.role !== 'team_admin') {
    return (
      <div className="p-8 text-center">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Access Required</h3>
        <p className="text-gray-500">You need admin permissions to view collaboration monitoring.</p>
      </div>
    );
  }

  // Calculate collaboration metrics
  const totalActiveUsers = activeUsers.length;
  const totalComments = comments.length;
  const unresolvedComments = comments.filter(c => !c.resolved).length;
  const totalVersions = versions.length;
  const activeWorkflows = workflows.filter(w => w.status === 'active').length;

  // Mock real-time collaboration data
  const collaborationSessions = [
    {
      id: 'session-1',
      documentName: 'Financial_Report_Q4.pdf',
      activeUsers: 3,
      duration: '45 minutes',
      lastActivity: '2024-07-01T14:30:00Z',
      status: 'active'
    },
    {
      id: 'session-2',
      documentName: 'Project_Proposal.docx',
      activeUsers: 2,
      duration: '1.2 hours',
      lastActivity: '2024-07-01T14:25:00Z',
      status: 'active'
    },
    {
      id: 'session-3',
      documentName: 'Marketing_Strategy.pptx',
      activeUsers: 1,
      duration: '20 minutes',
      lastActivity: '2024-07-01T14:20:00Z',
      status: 'paused'
    }
  ];

  // Mock user activity data
  const userActivity = [
    {
      user: 'john.doe@example.com',
      documentsEdited: 5,
      commentsAdded: 12,
      versionsCreated: 3,
      lastActive: '2024-07-01T14:30:00Z',
      status: 'online'
    },
    {
      user: 'jane.smith@example.com',
      documentsEdited: 8,
      commentsAdded: 18,
      versionsCreated: 5,
      lastActive: '2024-07-01T14:25:00Z',
      status: 'online'
    },
    {
      user: 'mike.johnson@example.com',
      documentsEdited: 3,
      commentsAdded: 7,
      versionsCreated: 2,
      lastActive: '2024-07-01T13:45:00Z',
      status: 'away'
    }
  ];

  const collaborationStats = [
    {
      title: 'Active Users',
      value: totalActiveUsers.toString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+8%'
    },
    {
      title: 'Comments Today',
      value: totalComments.toString(),
      icon: MessageCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+15%'
    },
    {
      title: 'Document Versions',
      value: totalVersions.toString(),
      icon: GitBranch,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+12%'
    },
    {
      title: 'Active Workflows',
      value: activeWorkflows.toString(),
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: '+5%'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collaboration Monitor</h1>
          <p className="text-gray-600 mt-1">
            Real-time monitoring of document collaboration activities
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last hour</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <Button size="sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Collaboration Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {collaborationStats.map((stat, index) => {
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
                    <p className="text-xs text-green-600 mt-1">{stat.change} from yesterday</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Collaboration Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Active Collaboration Sessions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {collaborationSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    session.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {session.documentName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {session.activeUsers} active user{session.activeUsers !== 1 ? 's' : ''} • 
                      Duration: {session.duration}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {formatDate(session.lastActivity)}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Activity and Comment Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>User Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userActivity.map((user) => (
                <div key={user.user} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      user.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.user}
                      </p>
                      <p className="text-xs text-gray-500">
                        Last active: {formatDate(user.lastActive)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">
                      {user.documentsEdited} docs • {user.commentsAdded} comments
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.versionsCreated} versions created
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comment Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <span>Comment Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Comments</span>
                <span className="text-sm font-medium text-gray-900">{totalComments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Unresolved Comments</span>
                <span className="text-sm font-medium text-orange-600">{unresolvedComments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Resolution Rate</span>
                <span className="text-sm font-medium text-green-600">
                  {totalComments > 0 ? Math.round(((totalComments - unresolvedComments) / totalComments) * 100) : 0}%
                </span>
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Comments</h4>
                <div className="space-y-2">
                  {comments.slice(0, 3).map((comment) => (
                    <div key={comment.id} className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-900 truncate">
                        {comment.content}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        by {comment.authorName} • {formatDate(comment.timestamp)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Workflow Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{activeWorkflows}</div>
              <div className="text-sm text-blue-700">Active Workflows</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {workflows.filter(w => w.status === 'completed').length}
              </div>
              <div className="text-sm text-green-700">Completed Today</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">2.3</div>
              <div className="text-sm text-orange-700">Avg Days to Complete</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}