import { FileSearch, Eye, Download, Filter, Calendar, User, Activity, Clock, AlertTriangle } from 'lucide-react';

const AuditTrailPage = () => {
  const auditEvents = [
    { 
      id: 1, 
      event: 'Document Access', 
      user: 'john.doe@company.com', 
      timestamp: '2024-01-15 14:30:25', 
      details: 'Accessed contract_2024.pdf',
      severity: 'low',
      ip: '192.168.1.100'
    },
    { 
      id: 2, 
      event: 'Document Modification', 
      user: 'jane.smith@company.com', 
      timestamp: '2024-01-15 13:45:12', 
      details: 'Modified invoice_001.pdf',
      severity: 'medium',
      ip: '192.168.1.101'
    },
    { 
      id: 3, 
      event: 'Login Attempt', 
      user: 'unknown@external.com', 
      timestamp: '2024-01-15 12:20:45', 
      details: 'Failed login attempt from external IP',
      severity: 'high',
      ip: '203.45.67.89'
    },
    { 
      id: 4, 
      event: 'Document Deletion', 
      user: 'admin@company.com', 
      timestamp: '2024-01-15 11:15:30', 
      details: 'Deleted old_contract_2023.pdf',
      severity: 'medium',
      ip: '192.168.1.102'
    },
    { 
      id: 5, 
      event: 'Permission Change', 
      user: 'admin@company.com', 
      timestamp: '2024-01-15 10:30:15', 
      details: 'Changed permissions for finance folder',
      severity: 'high',
      ip: '192.168.1.102'
    },
  ];

  const auditStats = [
    { title: 'Total Events', value: '1,234', icon: Activity, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { title: 'High Severity', value: '23', icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-100' },
    { title: 'Unique Users', value: '45', icon: User, color: 'text-green-600', bgColor: 'bg-green-100' },
    { title: 'Today\'s Events', value: '67', icon: Clock, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
            <p className="text-gray-600 mt-1">Monitor and track all system activities and user actions</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              <Download className="h-4 w-4" />
              Export Logs
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Audit Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {auditStats.map((stat, index) => (
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

      {/* Audit Events Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Audit Events</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <Activity className="h-4 w-4 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{event.event}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{event.user}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{event.timestamp}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{event.details}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{event.ip}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityColor(event.severity)}`}>
                      {event.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-primary-600 hover:text-primary-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="h-4 w-4" />
            Last 24 Hours
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <AlertTriangle className="h-4 w-4" />
            High Severity
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <User className="h-4 w-4" />
            User Activity
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <FileSearch className="h-4 w-4" />
            Document Events
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditTrailPage;
