import React, { useState } from 'react';
import { 
  Shield, 
  Globe, 
  Zap, 
  Bell,
  Database,
  Key,
  CheckCircle,
  AlertTriangle,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import type{ EnterpriseSettings as EnterpriseSettingsType } from '../../types';
import { mockEnterpriseSettings } from '../../data/mockData';

const EnterpriseSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('authentication');
  const [settings, setSettings] = useState<EnterpriseSettingsType>(mockEnterpriseSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const tabs = [
    { id: 'authentication', name: 'Authentication', icon: Shield },
    { id: 'signatures', name: 'Signatures', icon: Key },
    { id: 'compliance', name: 'Compliance', icon: Globe },
    { id: 'workflows', name: 'Workflows', icon: Zap },
    { id: 'integration', name: 'Integration', icon: Database },
    { id: 'notifications', name: 'Notifications', icon: Bell },
  ];

  const updateSettings = (section: keyof EnterpriseSettingsType, updates: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Save settings logic here
    setHasChanges(false);
  };

  const renderAuthentication = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Settings</h3>
        <p className="text-gray-600">Configure default authentication methods and security policies.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Default Authentication Methods</h4>
        
        <div className="space-y-4">
          {[
            { id: 'email', name: 'Email Verification', description: 'Basic email-based authentication' },
            { id: 'sms', name: 'SMS Verification', description: 'Text message verification codes' },
            { id: 'knowledge_based', name: 'Knowledge-Based Authentication', description: 'Personal history questions' },
            { id: 'government_id', name: 'Government ID Verification', description: 'ID document verification' },
            { id: 'biometric', name: 'Biometric Authentication', description: 'Fingerprint, face, or voice recognition' },
            { id: 'digital_certificate', name: 'Digital Certificate', description: 'PKI-based authentication' }
          ].map((method) => (
            <div key={method.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h5 className="font-medium text-gray-900">{method.name}</h5>
                <p className="text-sm text-gray-600">{method.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.authentication.defaultMethods.includes(method.id)}
                  onChange={(e) => {
                    const methods = e.target.checked
                      ? [...settings.authentication.defaultMethods, method.id]
                      : settings.authentication.defaultMethods.filter(m => m !== method.id);
                    updateSettings('authentication', { defaultMethods: methods });
                  }}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Security Policies</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Authentication Attempts</label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.authentication.maxAuthAttempts}
                onChange={(e) => updateSettings('authentication', { maxAuthAttempts: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
              <input
                type="number"
                min="5"
                max="120"
                value={settings.authentication.sessionTimeout}
                onChange={(e) => updateSettings('authentication', { sessionTimeout: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-gray-900">Risk-Based Authentication</h5>
                <p className="text-sm text-gray-600">Automatically adjust authentication requirements based on risk</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.authentication.riskBasedAuth}
                  onChange={(e) => updateSettings('authentication', { riskBasedAuth: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Authentication Status</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">Email Verification</span>
              </div>
              <span className="text-sm text-green-700">Active</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">SMS Verification</span>
              </div>
              <span className="text-sm text-green-700">Active</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-900">Biometric Auth</span>
              </div>
              <span className="text-sm text-yellow-700">Setup Required</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSignatures = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Signature Settings</h3>
        <p className="text-gray-600">Configure signature types and validation requirements.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Default Signature Type</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'standard', name: 'Standard', description: 'Basic electronic signature' },
            { id: 'advanced', name: 'Advanced', description: 'Enhanced security signature' },
            { id: 'qualified', name: 'Qualified', description: 'Highest security level' }
          ].map((type) => (
            <div
              key={type.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                settings.signatures.defaultType === type.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => updateSettings('signatures', { defaultType: type.id })}
            >
              <h5 className="font-semibold text-gray-900">{type.name}</h5>
              <p className="text-sm text-gray-600 mt-1">{type.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Allowed Signature Types</h4>
          
          <div className="space-y-3">
            {['standard', 'advanced', 'qualified'].map((type) => (
              <div key={type} className="flex items-center justify-between">
                <span className="font-medium text-gray-900 capitalize">{type} Signature</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={settings.signatures.allowedTypes.includes(type)}
                    onChange={(e) => {
                      const types = e.target.checked
                        ? [...settings.signatures.allowedTypes, type]
                        : settings.signatures.allowedTypes.filter(t => t !== type);
                      updateSettings('signatures', { allowedTypes: types });
                    }}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Validation Settings</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-gray-900">Certificate Validation</h5>
                <p className="text-sm text-gray-600">Validate digital certificates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.signatures.certificateValidation}
                  onChange={(e) => updateSettings('signatures', { certificateValidation: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-gray-900">Timestamping</h5>
                <p className="text-sm text-gray-600">Add trusted timestamps to signatures</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.signatures.timestamping}
                  onChange={(e) => updateSettings('signatures', { timestamping: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompliance = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Compliance Settings</h3>
        <p className="text-gray-600">Configure compliance standards and audit requirements.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Enabled Compliance Standards</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: 'esign', name: 'ESIGN Act', description: 'US Electronic Signatures in Global and National Commerce Act' },
            { id: 'eidas', name: 'eIDAS', description: 'European Union electronic identification and trust services' },
            { id: 'hipaa', name: 'HIPAA', description: 'Health Insurance Portability and Accountability Act' },
            { id: 'sox', name: 'SOX', description: 'Sarbanes-Oxley Act compliance' },
            { id: 'gdpr', name: 'GDPR', description: 'General Data Protection Regulation' },
            { id: 'iso27001', name: 'ISO 27001', description: 'Information security management' }
          ].map((standard) => (
            <div key={standard.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h5 className="font-medium text-gray-900">{standard.name}</h5>
                <p className="text-sm text-gray-600 mt-1">{standard.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.compliance.enabledStandards.includes(standard.id)}
                  onChange={(e) => {
                    const standards = e.target.checked
                      ? [...settings.compliance.enabledStandards, standard.id]
                      : settings.compliance.enabledStandards.filter(s => s !== standard.id);
                    updateSettings('compliance', { enabledStandards: standards });
                  }}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Audit Settings</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Audit Level</label>
              <select
                value={settings.compliance.auditLevel}
                onChange={(e) => updateSettings('compliance', { auditLevel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="standard">Standard</option>
                <option value="enhanced">Enhanced</option>
                <option value="forensic">Forensic</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Retention (years)</label>
              <input
                type="number"
                min="1"
                max="25"
                value={settings.compliance.dataRetention}
                onChange={(e) => updateSettings('compliance', { dataRetention: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-gray-900">Blockchain Audit Trail</h5>
                <p className="text-sm text-gray-600">Immutable audit trail using blockchain</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.compliance.blockchainAudit}
                  onChange={(e) => updateSettings('compliance', { blockchainAudit: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Compliance Status</h4>
          
          <div className="space-y-3">
            {settings.compliance.enabledStandards.map((standard) => (
              <div key={standard} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-900 uppercase">{standard}</span>
                </div>
                <span className="text-sm text-green-700">Compliant</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderIntegration = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Integration Settings</h3>
        <p className="text-gray-600">Configure API access and external system integrations.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">API Configuration</h4>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-gray-900">API Access</h5>
              <p className="text-sm text-gray-600">Enable API access for your organization</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={settings.integration.apiAccess}
                onChange={(e) => updateSettings('integration', { apiAccess: e.target.checked })}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {settings.integration.apiAccess && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                  <div className="flex items-center gap-2">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value="sk_live_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Webhook Endpoints</label>
                  <div className="space-y-2">
                    {settings.integration.webhookEndpoints.map((endpoint, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="url"
                          value={endpoint}
                          onChange={(e) => {
                            const endpoints = [...settings.integration.webhookEndpoints];
                            endpoints[index] = e.target.value;
                            updateSettings('integration', { webhookEndpoints: endpoints });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://your-domain.com/webhook"
                        />
                        <button className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => updateSettings('integration', { 
                        webhookEndpoints: [...settings.integration.webhookEndpoints, ''] 
                      })}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Add Webhook Endpoint
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Single Sign-On</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-gray-900">SSO Enabled</h5>
                <p className="text-sm text-gray-600">Enable SAML/OAuth SSO integration</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.integration.ssoEnabled}
                  onChange={(e) => updateSettings('integration', { ssoEnabled: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-gray-900">LDAP Integration</h5>
                <p className="text-sm text-gray-600">Connect to LDAP directory</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.integration.ldapIntegration}
                  onChange={(e) => updateSettings('integration', { ldapIntegration: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Integration Status</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">REST API</span>
              </div>
              <span className="text-sm text-green-700">Active</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">Webhooks</span>
              </div>
              <span className="text-sm text-green-700">Configured</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-900">SSO</span>
              </div>
              <span className="text-sm text-yellow-700">Setup Required</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Enterprise Settings</h1>
            <p className="text-gray-600 mt-2">Configure advanced settings for your organization.</p>
          </div>
          
          {hasChanges && (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-5 h-5" />
              Save Changes
            </button>
          )}
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'authentication' && renderAuthentication()}
            {activeTab === 'signatures' && renderSignatures()}
            {activeTab === 'compliance' && renderCompliance()}
            {activeTab === 'workflows' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Workflow Settings</h3>
                <p className="text-gray-600">Configure workflow automation and business rules.</p>
              </div>
            )}
            {activeTab === 'integration' && renderIntegration()}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Notification Settings</h3>
                <p className="text-gray-600">Configure enterprise notification preferences.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseSettings;