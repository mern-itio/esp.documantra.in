import React, { useState } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Database, 
  Zap,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from 'lucide-react';

interface SystemMetric {
  name: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  status: 'healthy' | 'warning' | 'critical';
}

interface SystemAlert {
  id: string;
  type: 'performance' | 'security' | 'capacity' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export const TemplateSystemMonitor: React.FC = () => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);

  const systemMetrics: SystemMetric[] = [
    {
      name: 'Template Generation Rate',
      value: '156/min',
      change: '+12%',
      trend: 'up',
      status: 'healthy'
    },
    {
      name: 'AI Processing Time',
      value: '3.2s',
      change: '-0.5s',
      trend: 'up',
      status: 'healthy'
    },
    {
      name: 'System Response Time',
      value: '245ms',
      change: '+15ms',
      trend: 'down',
      status: 'warning'
    },
    {
      name: 'Error Rate',
      value: '0.12%',
      change: '-0.03%',
      trend: 'up',
      status: 'healthy'
    },
    {
      name: 'Database Connections',
      value: '847/1000',
      change: '+23',
      trend: 'down',
      status: 'warning'
    },
    {
      name: 'Memory Usage',
      value: '68%',
      change: '+5%',
      trend: 'down',
      status: 'healthy'
    }
  ];

  const systemAlerts: SystemAlert[] = [
    {
      id: '1',
      type: 'performance',
      severity: 'medium',
      message: 'Template generation response time increased by 15%',
      timestamp: '2 minutes ago',
      resolved: false
    },
    {
      id: '2',
      type: 'capacity',
      severity: 'low',
      message: 'Database connection pool at 85% capacity',
      timestamp: '15 minutes ago',
      resolved: false
    },
    {
      id: '3',
      type: 'security',
      severity: 'high',
      message: 'Unusual API access pattern detected',
      timestamp: '1 hour ago',
      resolved: true
    }
  ];

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-200 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-200 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-blue-100 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">System Performance Monitor</h2>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="autoRefresh" className="text-sm text-gray-700">Auto-refresh</label>
          </div>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={10}>10s</option>
            <option value={30}>30s</option>
            <option value={60}>1m</option>
            <option value={300}>5m</option>
          </select>
          <button className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* System Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {systemMetrics.map((metric, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">{metric.name}</h3>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getMetricStatusColor(metric.status)}`}>
                {metric.status}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
              <div className="flex items-center space-x-1">
                {getTrendIcon(metric.trend)}
                <span className={`text-sm font-medium ${
                  metric.trend === 'up' ? 'text-green-600' : 
                  metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {metric.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* System Alerts */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-medium text-gray-900">System Alerts</h3>
          <span className="text-sm text-gray-500">
            {systemAlerts.filter(alert => !alert.resolved).length} active alerts
          </span>
        </div>
        <div className="space-y-3">
          {systemAlerts.map((alert) => (
            <div key={alert.id} className={`border rounded-lg p-4 ${getAlertSeverityColor(alert.severity)} ${
              alert.resolved ? 'opacity-60' : ''
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    {alert.resolved ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{alert.message}</p>
                    <div className="flex items-center space-x-2 mt-1 text-sm opacity-80">
                      <span className="capitalize">{alert.type}</span>
                      <span>•</span>
                      <span>{alert.timestamp}</span>
                      {alert.resolved && (
                        <>
                          <span>•</span>
                          <span className="text-green-600">Resolved</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {!alert.resolved && (
                  <button className="text-sm font-medium hover:underline">
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Health Overview */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-md font-medium text-gray-900 mb-4">System Health Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="font-medium text-gray-900">Template System</h4>
            <p className="text-sm text-green-600">Operational</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Database className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900">Database</h4>
            <p className="text-sm text-blue-600">Healthy</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-[#DCFCE7] rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="w-8 h-8 text-[#155E4B]" />
            </div>
            <h4 className="font-medium text-gray-900">AI Services</h4>
            <p className="text-sm text-[#155E4B]">Active</p>
          </div>
        </div>
      </div>
    </div>
  );
};