import { Link } from 'react-router-dom';
import { useAuth } from '../../components/AuthService/AuthContext';
import { 
  FileText, 
  Plus, 
  Upload, 
  Clock, 
  Star,
  TrendingUp,
  Shield,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

const DashboardContent = () => {
  const { user } = useAuth();

  const recentDocuments = [
    { id: 1, name: 'Contract_2024.pdf', type: 'PDF', date: '2024-01-15', status: 'Signed' },
    { id: 2, name: 'Invoice_001.pdf', type: 'PDF', date: '2024-01-14', status: 'Pending' },
    { id: 3, name: 'Agreement.docx', type: 'Word', date: '2024-01-13', status: 'Draft' },
  ];

  const quickActions = [
    { name: 'Upload Document', icon: Upload, color: 'bg-blue-500', link: '/upload' },
    { name: 'Create Template', icon: Plus, color: 'bg-green-500', link: '/templates' },
    { name: 'Send for Signature', icon: FileText, color: 'bg-purple-500', link: '/sign' },
    { name: 'View Reports', icon: Star, color: 'bg-orange-500', link: '/reports' },
  ];

  const complianceStats = [
    { title: 'Compliance Score', value: '94%', icon: Shield, color: 'text-green-600', bgColor: 'bg-green-100' },
    { title: 'Pending Reviews', value: '12', icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    { title: 'Completed Audits', value: '45', icon: CheckCircle, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { title: 'Risk Alerts', value: '3', icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.fullname}!</h1>
            <p className="text-gray-600 mt-1">Here's your compliance dashboard overview.</p>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-green-500" />
            <span className="text-sm text-green-600 font-medium">+12% this month</span>
          </div>
        </div>
      </div>

      {/* Compliance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {complianceStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.link}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${action.color} text-white`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-gray-700">{action.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Documents */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Documents</h2>
              <Link to="/documents" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View all
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{doc.name}</p>
                      <p className="text-sm text-gray-500">{doc.type} • {doc.date}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    doc.status === 'Signed' ? 'bg-green-100 text-green-800' :
                    doc.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">1,234</div>
            <div className="text-sm text-gray-600">Total Documents</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">89%</div>
            <div className="text-sm text-gray-600">Compliance Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">23</div>
            <div className="text-sm text-gray-600">Active Projects</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
