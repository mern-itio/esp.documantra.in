import { AlertTriangle, TrendingUp, Shield, Clock, CheckCircle } from 'lucide-react';

const RiskManagementPage = () => {
  const riskMetrics = [
    { title: 'High Risk Items', value: '12', status: 'high', icon: AlertTriangle },
    { title: 'Medium Risk Items', value: '28', status: 'medium', icon: Clock },
    { title: 'Low Risk Items', value: '45', status: 'low', icon: CheckCircle },
    { title: 'Risk Score', value: '7.2/10', status: 'warning', icon: Shield },
  ];

  const recentRisks = [
    { id: 1, risk: 'Data Breach Vulnerability', severity: 'high', status: 'open', date: '2024-01-15' },
    { id: 2, risk: 'Compliance Gap - GDPR', severity: 'medium', status: 'in-progress', date: '2024-01-14' },
    { id: 3, risk: 'System Downtime Risk', severity: 'low', status: 'resolved', date: '2024-01-13' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Risk Management</h1>
            <p className="text-gray-600 mt-1">Monitor and manage organizational risks</p>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-green-500" />
            <span className="text-sm text-green-600 font-medium">Risk score improved by 15%</span>
          </div>
        </div>
      </div>

      {/* Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {riskMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${
                metric.status === 'high' ? 'bg-red-100' : 
                metric.status === 'medium' ? 'bg-yellow-100' : 
                metric.status === 'low' ? 'bg-green-100' : 'bg-orange-100'
              }`}>
                <metric.icon className={`h-6 w-6 ${
                  metric.status === 'high' ? 'text-red-600' : 
                  metric.status === 'medium' ? 'text-yellow-600' : 
                  metric.status === 'low' ? 'text-green-600' : 'text-orange-600'
                }`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Risks */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Risk Assessments</h2>
        <div className="space-y-3">
          {recentRisks.map((risk) => (
            <div key={risk.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  risk.severity === 'high' ? 'bg-red-100' :
                  risk.severity === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
                }`}>
                  <AlertTriangle className={`h-4 w-4 ${
                    risk.severity === 'high' ? 'text-red-600' :
                    risk.severity === 'medium' ? 'text-yellow-600' : 'text-green-600'
                  }`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{risk.risk}</p>
                  <p className="text-sm text-gray-500">Assessed: {risk.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  risk.severity === 'high' ? 'bg-red-100 text-red-800' :
                  risk.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                  {risk.severity}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  risk.status === 'open' ? 'bg-red-100 text-red-800' :
                  risk.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                }`}>
                  {risk.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Overview */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">12</div>
            <div className="text-sm text-gray-600">High Priority Risks</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">28</div>
            <div className="text-sm text-gray-600">Medium Priority Risks</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">45</div>
            <div className="text-sm text-gray-600">Low Priority Risks</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskManagementPage;
