import { 
  Users, 
  MessageCircle, 
  GitBranch, 
  Clock, 
  TrendingUp,
  Activity,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { COLLABORATION_ANALYTICS } from '../../common/lib/collaborationMockData';

export function CollaborationAnalytics() {
  const { documentMetrics, userEngagement, workflowPerformance, collaborationTrends } = COLLABORATION_ANALYTICS;

  const stats = [
    {
      title: 'Active Collaborators',
      value: userEngagement.activeCollaborators.toString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%'
    },
    {
      title: 'Comments This Week',
      value: documentMetrics.commentActivity.toString(),
      icon: MessageCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+8%'
    },
    {
      title: 'Version Updates',
      value: documentMetrics.versionActivity.toString(),
      icon: GitBranch,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+15%'
    },
    {
      title: 'Avg Session Length',
      value: userEngagement.averageSessionLength,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: '+5%'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
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
                    <p className="text-xs text-green-600 mt-1">{stat.change} from last week</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Collaboration Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Collaboration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Document Collaboration</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Collaborative Documents</span>
                <span className="text-sm font-medium">
                  {documentMetrics.collaborativeDocuments} / {documentMetrics.totalDocuments}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${(documentMetrics.collaborativeDocuments / documentMetrics.totalDocuments) * 100}%`
                  }}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">
                    {documentMetrics.averageCollaborators}
                  </div>
                  <div className="text-xs text-gray-600">Avg Collaborators</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">
                    {userEngagement.commentResolutionRate}%
                  </div>
                  <div className="text-xs text-gray-600">Comment Resolution</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workflow Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Workflow Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">On-time Completion</span>
                <span className="text-sm font-medium">
                  {workflowPerformance.onTimeCompletionRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${workflowPerformance.onTimeCompletionRate}%` }}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">
                    {workflowPerformance.activeWorkflows}
                  </div>
                  <div className="text-xs text-gray-600">Active Workflows</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">
                    {workflowPerformance.averageProcessingTime}
                  </div>
                  <div className="text-xs text-gray-600">Avg Processing Time</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trends and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Activity Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Daily Active Users</span>
                  <span className="text-sm font-medium">Last 7 days</span>
                </div>
                <div className="flex items-end space-x-1 h-20">
                  {collaborationTrends.dailyActiveUsers.map((value, index) => (
                    <div
                      key={index}
                      className="bg-blue-500 rounded-t flex-1"
                      style={{
                        height: `${(value / Math.max(...collaborationTrends.dailyActiveUsers)) * 100}%`
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Weekly Comments</span>
                  <span className="text-sm font-medium">Last 7 weeks</span>
                </div>
                <div className="flex items-end space-x-1 h-16">
                  {collaborationTrends.weeklyComments.map((value, index) => (
                    <div
                      key={index}
                      className="bg-green-500 rounded-t flex-1"
                      style={{
                        height: `${(value / Math.max(...collaborationTrends.weeklyComments)) * 100}%`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workflow Bottlenecks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Workflow Bottlenecks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workflowPerformance.bottleneckSteps.map((step, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{step}</p>
                    <p className="text-xs text-gray-600">Frequently delayed step</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-yellow-800">
                      {Math.floor(Math.random() * 5) + 2} days avg
                    </p>
                    <p className="text-xs text-yellow-600">delay time</p>
                  </div>
                </div>
              ))}
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Recommendations</p>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  <li>• Consider parallel approval processes</li>
                  <li>• Set up automated reminders</li>
                  <li>• Add backup approvers for critical steps</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Engagement Summary */}
      <Card>
        <CardHeader>
          <CardTitle>User Engagement Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {userEngagement.collaborationFrequency}
              </div>
              <div className="text-sm text-gray-600">Sessions per week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {userEngagement.documentCompletionRate}%
              </div>
              <div className="text-sm text-gray-600">Completion rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {documentMetrics.workflowsActive}
              </div>
              <div className="text-sm text-gray-600">Active workflows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {documentMetrics.workflowsCompleted}
              </div>
              <div className="text-sm text-gray-600">Completed this month</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}