import { Shield, CheckCircle, Clock, TrendingUp, FileText, Users } from 'lucide-react';

const CompliancePage = () => {
  const complianceMetrics = [
    { title: 'Overall Compliance Score', value: '94%', status: 'good', icon: Shield },
    { title: 'Regulatory Requirements', value: '87%', status: 'warning', icon: CheckCircle },
    { title: 'Policy Adherence', value: '96%', status: 'good', icon: FileText },
    { title: 'Training Completion', value: '91%', status: 'good', icon: Users },
  ];

  const recentComplianceActivities = [
    { id: 1, activity: 'GDPR Assessment Completed', date: '2024-01-15', status: 'completed', type: 'Assessment' },
    { id: 2, activity: 'SOC 2 Audit Initiated', date: '2024-01-14', status: 'in-progress', type: 'Audit' },
    { id: 3, activity: 'HIPAA Policy Review', date: '2024-01-13', status: 'pending', type: 'Review' },
    { id: 4, activity: 'ISO 27001 Certification', date: '2024-01-12', status: 'completed', type: 'Certification' },
  ];

  const upcomingDeadlines = [
    { id: 1, requirement: 'Annual Security Assessment', deadline: '2024-02-15', priority: 'high' },
    { id: 2, requirement: 'Data Privacy Impact Assessment', deadline: '2024-02-28', priority: 'medium' },
    { id: 3, requirement: 'Employee Training Renewal', deadline: '2024-03-01', priority: 'low' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compliance Management</h1>
            <p className="text-gray-600 mt-1">Monitor and manage your organization's compliance status</p>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-green-500" />
            <span className="text-sm text-green-600 font-medium">+5% this quarter</span>
          </div>
        </div>
      </div>

      {/* Compliance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {complianceMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${
                metric.status === 'good' ? 'bg-green-100' : 
                metric.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <metric.icon className={`h-6 w-6 ${
                  metric.status === 'good' ? 'text-green-600' : 
                  metric.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                }`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Compliance Activities */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>
          <div className="space-y-3">
            {recentComplianceActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    activity.status === 'completed' ? 'bg-green-100' :
                    activity.status === 'in-progress' ? 'bg-blue-100' : 'bg-yellow-100'
                  }`}>
                    <FileText className={`h-4 w-4 ${
                      activity.status === 'completed' ? 'text-green-600' :
                      activity.status === 'in-progress' ? 'text-blue-600' : 'text-yellow-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.activity}</p>
                    <p className="text-sm text-gray-500">{activity.type} • {activity.date}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                  activity.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h2>
          <div className="space-y-3">
            {upcomingDeadlines.map((deadline) => (
              <div key={deadline.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    deadline.priority === 'high' ? 'bg-red-100' :
                    deadline.priority === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
                  }`}>
                    <Clock className={`h-4 w-4 ${
                      deadline.priority === 'high' ? 'text-red-600' :
                      deadline.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{deadline.requirement}</p>
                    <p className="text-sm text-gray-500">Due: {deadline.deadline}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  deadline.priority === 'high' ? 'bg-red-100 text-red-800' :
                  deadline.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                  {deadline.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Compliance Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">15</div>
            <div className="text-sm text-gray-600">Active Frameworks</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">94%</div>
            <div className="text-sm text-gray-600">Overall Compliance</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">8</div>
            <div className="text-sm text-gray-600">Pending Reviews</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompliancePage;
