import React, { useState } from 'react';
import {
  Database, 
  Cloud, 
  Mail, 
  Calendar, 
  CreditCard, 
  Users,
  Settings,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'crm' | 'storage' | 'email' | 'calendar' | 'payment' | 'database' | 'other';
  icon: React.ComponentType<any>;
  status: 'connected' | 'disconnected' | 'error';
  config?: Record<string, any>;
  lastSync?: string;
}

interface IntegrationHubProps {
  integrations: Integration[];
  onConnect: (integrationId: string, config: Record<string, any>) => void;
  onDisconnect: (integrationId: string) => void;
  onTest: (integrationId: string) => void;
}

export const IntegrationHub: React.FC<IntegrationHubProps> = ({
  integrations,
  onConnect,
  onDisconnect,
  onTest
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [configuringIntegration, setConfiguringIntegration] = useState<Integration | null>(null);
  const [config, setConfig] = useState<Record<string, any>>({});

  const categories = [
    { id: 'all', name: 'All Integrations', count: integrations.length },
    { id: 'crm', name: 'CRM Systems', count: integrations.filter(i => i.category === 'crm').length },
    { id: 'storage', name: 'Cloud Storage', count: integrations.filter(i => i.category === 'storage').length },
    { id: 'email', name: 'Email Services', count: integrations.filter(i => i.category === 'email').length },
    { id: 'calendar', name: 'Calendar Apps', count: integrations.filter(i => i.category === 'calendar').length },
    { id: 'payment', name: 'Payment Systems', count: integrations.filter(i => i.category === 'payment').length },
    { id: 'database', name: 'Databases', count: integrations.filter(i => i.category === 'database').length }
  ];

  const availableIntegrations: Integration[] = [
    {
      id: 'salesforce',
      name: 'Salesforce',
      description: 'Sync contacts and opportunities with Salesforce CRM',
      category: 'crm',
      icon: Users,
      status: 'disconnected'
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'Connect with HubSpot for lead management and automation',
      category: 'crm',
      icon: Users,
      status: 'connected',
      lastSync: '2 hours ago'
    },
    {
      id: 'google_drive',
      name: 'Google Drive',
      description: 'Store and sync templates with Google Drive',
      category: 'storage',
      icon: Cloud,
      status: 'connected',
      lastSync: '1 hour ago'
    },
    {
      id: 'dropbox',
      name: 'Dropbox',
      description: 'Backup templates to Dropbox automatically',
      category: 'storage',
      icon: Cloud,
      status: 'disconnected'
    },
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Send templates via Gmail integration',
      category: 'email',
      icon: Mail,
      status: 'connected',
      lastSync: '30 minutes ago'
    },
    {
      id: 'outlook',
      name: 'Microsoft Outlook',
      description: 'Integrate with Outlook for email automation',
      category: 'email',
      icon: Mail,
      status: 'error'
    },
    {
      id: 'google_calendar',
      name: 'Google Calendar',
      description: 'Schedule template deadlines and reminders',
      category: 'calendar',
      icon: Calendar,
      status: 'disconnected'
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Process payments for premium templates',
      category: 'payment',
      icon: CreditCard,
      status: 'connected',
      lastSync: '4 hours ago'
    },
    {
      id: 'postgresql',
      name: 'PostgreSQL',
      description: 'Connect to PostgreSQL database for data integration',
      category: 'database',
      icon: Database,
      status: 'disconnected'
    }
  ];

  const filteredIntegrations = selectedCategory === 'all' 
    ? availableIntegrations 
    : availableIntegrations.filter(i => i.category === selectedCategory);

  const getStatusIcon = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-300"></div>;
    }
  };

  const getStatusColor = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-700';
      case 'error':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleConnect = (integration: Integration) => {
    setConfiguringIntegration(integration);
    setConfig(integration.config || {});
  };

  const saveConfiguration = () => {
    if (configuringIntegration) {
      onConnect(configuringIntegration.id, config);
      setConfiguringIntegration(null);
      setConfig({});
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Integration Hub</h2>
        <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
          <Plus className="w-4 h-4 mr-2" />
          Request Integration
        </button>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category.name} ({category.count})
          </button>
        ))}
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {filteredIntegrations.map((integration) => {
          const Icon = integration.icon;
          return (
            <div key={integration.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{integration.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusIcon(integration.status)}
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(integration.status)}`}>
                        {integration.status}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onTest(integration.id)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  disabled={integration.status !== 'connected'}
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{integration.description}</p>
              
              {integration.lastSync && (
                <p className="text-xs text-gray-500 mb-3">Last sync: {integration.lastSync}</p>
              )}
              
              <div className="flex items-center space-x-2">
                {integration.status === 'connected' ? (
                  <button
                    onClick={() => onDisconnect(integration.id)}
                    className="flex-1 px-3 py-2 border border-red-300 hover:border-red-400 text-red-700 rounded-md text-sm font-medium"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(integration)}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                  >
                    Connect
                  </button>
                )}
                <button
                  onClick={() => onTest(integration.id)}
                  className="px-3 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-md text-sm"
                  disabled={integration.status !== 'connected'}
                >
                  Test
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration Modal */}
      {configuringIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Configure {configuringIntegration.name}
            </h3>
            
            <div className="space-y-4 mb-6">
              {configuringIntegration.id === 'salesforce' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instance URL</label>
                    <input
                      type="url"
                      value={config.instanceUrl || ''}
                      onChange={(e) => setConfig({ ...config, instanceUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://your-instance.salesforce.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                    <input
                      type="password"
                      value={config.apiKey || ''}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your Salesforce API key"
                    />
                  </div>
                </>
              )}
              
              {configuringIntegration.id === 'stripe' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Publishable Key</label>
                    <input
                      type="text"
                      value={config.publishableKey || ''}
                      onChange={(e) => setConfig({ ...config, publishableKey: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="pk_test_..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                    <input
                      type="password"
                      value={config.secretKey || ''}
                      onChange={(e) => setConfig({ ...config, secretKey: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="sk_test_..."
                    />
                  </div>
                </>
              )}
              
              {configuringIntegration.id === 'postgresql' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
                    <input
                      type="text"
                      value={config.host || ''}
                      onChange={(e) => setConfig({ ...config, host: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="localhost"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Database</label>
                    <input
                      type="text"
                      value={config.database || ''}
                      onChange={(e) => setConfig({ ...config, database: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="templates_db"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                      type="text"
                      value={config.username || ''}
                      onChange={(e) => setConfig({ ...config, username: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="postgres"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={config.password || ''}
                      onChange={(e) => setConfig({ ...config, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your database password"
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={saveConfiguration}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
              >
                Connect
              </button>
              <button
                onClick={() => setConfiguringIntegration(null)}
                className="px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Integration Status Summary */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-md font-medium text-gray-900 mb-4">Integration Status</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {availableIntegrations.filter(i => i.status === 'connected').length}
            </div>
            <div className="text-sm text-gray-600">Connected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {availableIntegrations.filter(i => i.status === 'disconnected').length}
            </div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {availableIntegrations.filter(i => i.status === 'error').length}
            </div>
            <div className="text-sm text-gray-600">Errors</div>
          </div>
        </div>
      </div>
    </div>
  );
};