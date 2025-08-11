import { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Clock, RefreshCw, Server, Database, Shield, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatusPage = () => {
  const [activeTab, setActiveTab] = useState('current');
  
  // Mock current system status
  const systemStatus = {
    status: 'operational', // operational, degraded, outage
    lastUpdated: 'May 15, 2025 09:32 AM UTC',
    message: 'All systems operational',
    uptime: '99.99%'
  };
  
  // Mock service statuses
  const services = [
    {
      name: 'E-Signature Platform',
      status: 'operational',
      uptime: '99.99%',
      lastIncident: '32 days ago'
    },
    {
      name: 'PDF Tools',
      status: 'operational',
      uptime: '99.98%',
      lastIncident: '45 days ago'
    },
    {
      name: 'Document Management',
      status: 'operational',
      uptime: '99.97%',
      lastIncident: '28 days ago'
    },
    {
      name: 'API Services',
      status: 'operational',
      uptime: '99.95%',
      lastIncident: '15 days ago'
    },
    {
      name: 'Authentication Services',
      status: 'operational',
      uptime: '99.99%',
      lastIncident: '60 days ago'
    },
    {
      name: 'Template Library',
      status: 'operational',
      uptime: '99.99%',
      lastIncident: '90 days ago'
    }
  ];
  
  // Mock data center statuses
  const dataCenters = [
    {
      region: 'US East (Virginia)',
      status: 'operational',
      latency: '45ms'
    },
    {
      region: 'US West (Oregon)',
      status: 'operational',
      latency: '52ms'
    },
    {
      region: 'EU Central (Frankfurt)',
      status: 'operational',
      latency: '78ms'
    },
    {
      region: 'EU West (Dublin)',
      status: 'operational',
      latency: '82ms'
    },
    {
      region: 'Asia Pacific (Tokyo)',
      status: 'operational',
      latency: '112ms'
    },
    {
      region: 'Asia Pacific (Sydney)',
      status: 'operational',
      latency: '145ms'
    }
  ];
  
  // Mock incident history
  const incidents = [
    {
      id: 'INC-2025-05-01',
      date: 'May 1, 2025',
      title: 'API Service Degradation',
      status: 'resolved',
      duration: '45 minutes',
      affected: ['API Services'],
      description: 'Some API requests experienced increased latency and occasional timeouts due to database connection issues.',
      updates: [
        { time: '08:15 AM UTC', message: 'Investigating reports of API timeouts and latency.' },
        { time: '08:32 AM UTC', message: 'Identified database connection pool saturation as the root cause.' },
        { time: '08:45 AM UTC', message: 'Implemented mitigation by increasing connection pool size and optimizing query patterns.' },
        { time: '09:00 AM UTC', message: 'Service has been fully restored. Monitoring for any further issues.' }
      ]
    },
    {
      id: 'INC-2025-04-15',
      date: 'April 15, 2025',
      title: 'PDF Processing Delays',
      status: 'resolved',
      duration: '2 hours',
      affected: ['PDF Tools'],
      description: 'PDF processing jobs experienced delays due to a spike in demand and resource constraints.',
      updates: [
        { time: '14:20 PM UTC', message: 'Investigating reports of delayed PDF processing.' },
        { time: '14:45 PM UTC', message: 'Identified resource constraints due to unexpected traffic increase.' },
        { time: '15:30 PM UTC', message: 'Scaled up processing resources and implemented queue prioritization.' },
        { time: '16:15 PM UTC', message: 'Processing times have returned to normal. Queue backlog cleared.' }
      ]
    },
    {
      id: 'INC-2025-03-22',
      date: 'March 22, 2025',
      title: 'Authentication Service Disruption',
      status: 'resolved',
      duration: '35 minutes',
      affected: ['Authentication Services'],
      description: 'Users experienced difficulties logging in due to an issue with our authentication provider.',
      updates: [
        { time: '10:05 AM UTC', message: 'Investigating reports of login failures.' },
        { time: '10:15 AM UTC', message: 'Identified issue with third-party authentication provider.' },
        { time: '10:25 AM UTC', message: 'Implemented fallback authentication mechanism.' },
        { time: '10:40 AM UTC', message: 'Authentication services fully restored. Working with provider to prevent recurrence.' }
      ]
    }
  ];
  
  // Mock maintenance schedule
  const maintenanceSchedule = [
    {
      id: 'MAINT-2025-05-20',
      date: 'May 20, 2025',
      timeWindow: '02:00 AM - 04:00 AM UTC',
      title: 'Database Optimization',
      status: 'scheduled',
      affected: ['Document Management', 'Template Library'],
      description: 'Scheduled maintenance to optimize database performance. Brief periods of increased latency may be experienced.',
      expectedImpact: 'Minimal - No downtime expected'
    },
    {
      id: 'MAINT-2025-06-05',
      date: 'June 5, 2025',
      timeWindow: '01:00 AM - 03:00 AM UTC',
      title: 'Infrastructure Upgrades',
      status: 'scheduled',
      affected: ['All Services'],
      description: 'Infrastructure upgrades to improve system reliability and performance.',
      expectedImpact: 'Moderate - Brief service interruptions possible'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'operational':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'outage':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'maintenance':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

 const getStatusClass = (status: string) => {
    switch(status) {
      case 'operational':
        return 'bg-green-100 text-green-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'outage':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800';
      case 'resolved':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="container-max">
        {/* Current Status Overview */}
        <div className={`bg-white rounded-2xl shadow-lg p-8 mb-8 border-l-4 ${
          systemStatus.status === 'operational' ? 'border-green-500' :
          systemStatus.status === 'degraded' ? 'border-yellow-500' :
          'border-red-500'
        }`}>
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              {getStatusIcon(systemStatus.status)}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">System Status</h1>
                <p className="text-gray-600">Last updated: {systemStatus.lastUpdated}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => window.location.reload()} 
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              <Link 
                to="/subscribe-status" 
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                <span>Subscribe to Updates</span>
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">{systemStatus.uptime}</div>
              <div className="text-sm text-gray-600">30-Day Uptime</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {services.filter(s => s.status === 'operational').length}/{services.length}
              </div>
              <div className="text-sm text-gray-600">Operational Services</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {dataCenters.filter(d => d.status === 'operational').length}/{dataCenters.length}
              </div>
              <div className="text-sm text-gray-600">Operational Regions</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {incidents.length}
              </div>
              <div className="text-sm text-gray-600">Recent Incidents</div>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${
            systemStatus.status === 'operational' ? 'bg-green-50 text-green-800' :
            systemStatus.status === 'degraded' ? 'bg-yellow-50 text-yellow-800' :
            'bg-red-50 text-red-800'
          }`}>
            <div className="font-medium">{systemStatus.message}</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-8">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('current')}
              className={`px-4 py-2 font-medium rounded-lg mr-2 ${
                activeTab === 'current' ? 'bg-primary-100 text-primary-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Current Status
            </button>
            <button
              onClick={() => setActiveTab('incidents')}
              className={`px-4 py-2 font-medium rounded-lg mr-2 ${
                activeTab === 'incidents' ? 'bg-primary-100 text-primary-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Incident History
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`px-4 py-2 font-medium rounded-lg mr-2 ${
                activeTab === 'maintenance' ? 'bg-primary-100 text-primary-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Scheduled Maintenance
            </button>
            <button
              onClick={() => setActiveTab('uptime')}
              className={`px-4 py-2 font-medium rounded-lg ${
                activeTab === 'uptime' ? 'bg-primary-100 text-primary-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Uptime Reports
            </button>
          </div>
        </div>

        {/* Current Status Tab */}
        {activeTab === 'current' && (
          <>
            {/* Services Status */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Services Status</h2>
              
              <div className="space-y-4">
                {services.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(service.status)}
                      <span className="font-medium text-gray-900">{service.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">Uptime: {service.uptime}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(service.status)}`}>
                        {service.status === 'operational' ? 'Operational' : 
                         service.status === 'degraded' ? 'Degraded Performance' : 'Outage'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Center Status */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Center Status</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                {dataCenters.map((center, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(center.status)}
                      <span className="font-medium text-gray-900">{center.region}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">Latency: {center.latency}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(center.status)}`}>
                        {center.status === 'operational' ? 'Operational' : 
                         center.status === 'degraded' ? 'Degraded Performance' : 'Outage'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Incidents */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Incidents</h2>
              
              <div className="p-8 text-center border border-dashed border-gray-300 rounded-lg">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Incidents</h3>
                <p className="text-gray-600">
                  All systems are currently operational. No incidents have been reported.
                </p>
              </div>
            </div>
          </>
        )}

        {/* Incident History Tab */}
        {activeTab === 'incidents' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Incident History</h2>
            
            <div className="space-y-8">
              {incidents.map((incident, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{incident.date}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(incident.status)}`}>
                          {incident.status === 'resolved' ? 'Resolved' : 'Ongoing'}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mt-1">{incident.title}</h3>
                    </div>
                    <div className="mt-2 md:mt-0">
                      <span className="text-sm text-gray-600">Duration: {incident.duration}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Affected Services:</div>
                      <div className="flex flex-wrap gap-2">
                        {incident.affected.map((service, serviceIndex) => (
                          <span key={serviceIndex} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Description:</div>
                      <p className="text-gray-600">{incident.description}</p>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Updates:</div>
                      <div className="space-y-3">
                        {incident.updates.map((update, updateIndex) => (
                          <div key={updateIndex} className="flex gap-3">
                            <div className="text-xs text-gray-500 whitespace-nowrap">{update.time}</div>
                            <div className="text-sm text-gray-700">{update.message}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scheduled Maintenance Tab */}
        {activeTab === 'maintenance' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Scheduled Maintenance</h2>
            
            <div className="space-y-6">
              {maintenanceSchedule.map((maintenance, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{maintenance.date}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(maintenance.status)}`}>
                          {maintenance.status === 'scheduled' ? 'Scheduled' : 'In Progress'}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mt-1">{maintenance.title}</h3>
                    </div>
                    <div className="mt-2 md:mt-0">
                      <span className="text-sm text-gray-600">Window: {maintenance.timeWindow}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Affected Services:</div>
                      <div className="flex flex-wrap gap-2">
                        {maintenance.affected.map((service, serviceIndex) => (
                          <span key={serviceIndex} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Description:</div>
                      <p className="text-gray-600">{maintenance.description}</p>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Expected Impact:</div>
                      <p className="text-gray-600">{maintenance.expectedImpact}</p>
                    </div>
                  </div>
                </div>
              ))}

              {maintenanceSchedule.length === 0 && (
                <div className="p-8 text-center border border-dashed border-gray-300 rounded-lg">
                  <Clock className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Scheduled Maintenance</h3>
                  <p className="text-gray-600">
                    There is no maintenance scheduled at this time. Check back later for updates.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Uptime Reports Tab */}
        {activeTab === 'uptime' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Uptime Reports</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">30-Day Uptime</h3>
                <div className="space-y-4">
                  {services.map((service, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-700">{service.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full" 
                            style={{ width: service.uptime }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{service.uptime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Historical Uptime</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Last 90 days</span>
                    <span className="font-medium text-gray-900">99.98%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Last 6 months</span>
                    <span className="font-medium text-gray-900">99.97%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Last 12 months</span>
                    <span className="font-medium text-gray-900">99.95%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">All time</span>
                    <span className="font-medium text-gray-900">99.93%</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link to="/uptime-history" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
                    View detailed uptime history
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">SLA Compliance</h3>
              <p className="text-gray-600 mb-4">
                DocuSigner is committed to maintaining a high level of service availability. Our Service Level Agreement (SLA) guarantees 99.9% uptime for all customers, with higher guarantees available for enterprise customers.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">99.9%</div>
                  <div className="text-sm text-gray-600">Standard SLA</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">99.95%</div>
                  <div className="text-sm text-gray-600">Business SLA</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">99.99%</div>
                  <div className="text-sm text-gray-600">Enterprise SLA</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link to="/sla" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
                  View SLA details
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Status Subscription */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-4">Stay Informed</h2>
              <p className="text-primary-100 mb-6">
                Subscribe to receive real-time notifications about DocuSigner service status updates, incidents, and scheduled maintenance.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary-200" />
                  <span>Email notifications</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary-200" />
                  <span>SMS alerts for critical incidents</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary-200" />
                  <span>Webhook integrations</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary-200" />
                  <span>RSS feed</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">Subscribe to Status Updates</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Notification Preferences</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded text-primary-600" defaultChecked />
                      <span className="text-sm">All incidents</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded text-primary-600" defaultChecked />
                      <span className="text-sm">Scheduled maintenance</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded text-primary-600" />
                      <span className="text-sm">Status changes</span>
                    </label>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-white text-primary-600 hover:bg-primary-50 font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Resources</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Server className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">System Architecture</h3>
              <p className="text-gray-600 mb-4">
                Learn about DocuSigner's system architecture, redundancy measures, and disaster recovery capabilities.
              </p>
              <Link to="/system-architecture" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
                View details
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            
            <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Database className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Residency</h3>
              <p className="text-gray-600 mb-4">
                Explore our global data center network and learn about data residency options for regulatory compliance.
              </p>
              <Link to="/data-residency" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
                View details
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            
            <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Security Overview</h3>
              <p className="text-gray-600 mb-4">
                Review our security practices, certifications, and compliance standards that protect your data.
              </p>
              <Link to="/security-overview" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
                View details
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusPage;