import React, { useState } from 'react';
import { ArrowLeft, Cloud, Plus, Settings, Folder, Upload, Download, FolderSync as Sync, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface CloudService {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  lastSync?: string;
  storageUsed?: string;
  storageTotal?: string;
}

interface CloudFile {
  id: string;
  name: string;
  type: 'pdf' | 'folder';
  size?: string;
  modified: string;
  service: string;
  synced: boolean;
}

interface CloudConnectorProps {
  onBack: () => void;
}

export const CloudConnector: React.FC<CloudConnectorProps> = ({ onBack }) => {
  const [services, setServices] = useState<CloudService[]>([
    {
      id: 'gdrive',
      name: 'Google Drive',
      icon: '🔵',
      connected: true,
      lastSync: '2 minutes ago',
      storageUsed: '2.4 GB',
      storageTotal: '15 GB'
    },
    {
      id: 'dropbox',
      name: 'Dropbox',
      icon: '📦',
      connected: true,
      lastSync: '5 minutes ago',
      storageUsed: '1.8 GB',
      storageTotal: '2 GB'
    },
    {
      id: 'onedrive',
      name: 'OneDrive',
      icon: '☁️',
      connected: false
    },
    {
      id: 'box',
      name: 'Box',
      icon: '📁',
      connected: false
    },
    {
      id: 'icloud',
      name: 'iCloud Drive',
      icon: '🍎',
      connected: false
    }
  ]);

  const [files, setFiles] = useState<CloudFile[]>([
    {
      id: 'file1',
      name: 'Project Proposal.pdf',
      type: 'pdf',
      size: '2.4 MB',
      modified: '2 hours ago',
      service: 'gdrive',
      synced: true
    },
    {
      id: 'file2',
      name: 'Financial Report.pdf',
      type: 'pdf',
      size: '1.8 MB',
      modified: '1 day ago',
      service: 'dropbox',
      synced: true
    },
    {
      id: 'folder1',
      name: 'Documents',
      type: 'folder',
      modified: '3 days ago',
      service: 'gdrive',
      synced: true
    },
    {
      id: 'file3',
      name: 'Contract Draft.pdf',
      type: 'pdf',
      size: '956 KB',
      modified: '1 week ago',
      service: 'gdrive',
      synced: false
    }
  ]);

  const [selectedService, setSelectedService] = useState<string>('gdrive');
  const [isSyncing, setIsSyncing] = useState(false);

  const connectService = (serviceId: string) => {
    setServices(prev => prev.map(service => 
      service.id === serviceId 
        ? { ...service, connected: true, lastSync: 'Just now' }
        : service
    ));
  };

  const disconnectService = (serviceId: string) => {
    setServices(prev => prev.map(service => 
      service.id === serviceId 
        ? { ...service, connected: false, lastSync: undefined }
        : service
    ));
  };

  const syncFiles = async () => {
    setIsSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setFiles(prev => prev.map(file => ({ ...file, synced: true })));
    setServices(prev => prev.map(service => 
      service.connected 
        ? { ...service, lastSync: 'Just now' }
        : service
    ));
    setIsSyncing(false);
  };

  const getServiceIcon = (service: CloudService) => {
    return service.icon;
  };

  const connectedServices = services.filter(s => s.connected);
  const availableServices = services.filter(s => !s.connected);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cloud Storage</h1>
            <p className="text-gray-600">Connect and manage your cloud storage services</p>
          </div>
        </div>

        <button
          onClick={syncFiles}
          disabled={isSyncing}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Sync className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync All'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connected Services */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Connected Services ({connectedServices.length})
            </h3>
            
            {connectedServices.length === 0 ? (
              <div className="text-center py-8">
                <Cloud className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No services connected</h4>
                <p className="text-gray-600">Connect your cloud storage to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {connectedServices.map((service) => (
                  <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getServiceIcon(service)}</span>
                        <div>
                          <h4 className="font-semibold text-gray-900">{service.name}</h4>
                          <div className="flex items-center space-x-1 text-sm text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            <span>Connected</span>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => disconnectService(service.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>

                    {service.storageUsed && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>Storage</span>
                          <span>{service.storageUsed} / {service.storageTotal}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ 
                              width: `${(parseFloat(service.storageUsed) / parseFloat(service.storageTotal!)) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>Last sync: {service.lastSync}</span>
                      </div>
                      <button
                        onClick={() => setSelectedService(service.id)}
                        className={`px-2 py-1 text-xs rounded ${
                          selectedService === service.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Browse
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* File Browser */}
          {connectedServices.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Files from {services.find(s => s.id === selectedService)?.name}
                </h3>
                
                <div className="flex items-center space-x-2">
                  <button className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Upload</span>
                  </button>
                  <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Plus className="w-4 h-4" />
                    <span>New Folder</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {files
                  .filter(file => file.service === selectedService)
                  .map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        {file.type === 'folder' ? (
                          <Folder className="w-5 h-5 text-blue-500" />
                        ) : (
                          <div className="w-5 h-5 bg-red-100 rounded flex items-center justify-center">
                            <span className="text-xs font-bold text-red-600">PDF</span>
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium text-gray-900">{file.name}</h4>
                          <div className="flex items-center space-x-3 text-sm text-gray-500">
                            <span>{file.modified}</span>
                            {file.size && <span>{file.size}</span>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {file.synced ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                        )}
                        <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Available Services */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Services</h3>
            
            <div className="space-y-3">
              {availableServices.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{getServiceIcon(service)}</span>
                    <span className="font-medium text-gray-900">{service.name}</span>
                  </div>
                  <button
                    onClick={() => connectService(service.id)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Connect</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Sync Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Status</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Files</span>
                <span className="font-medium text-gray-900">{files.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Synced</span>
                <span className="font-medium text-green-600">
                  {files.filter(f => f.synced).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="font-medium text-yellow-600">
                  {files.filter(f => !f.synced).length}
                </span>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ 
                      width: `${(files.filter(f => f.synced).length / files.length) * 100}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {Math.round((files.filter(f => f.synced).length / files.length) * 100)}% synced
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="space-y-2">
              <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                <Upload className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">Upload to Cloud</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                <Download className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-900">Download All</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                <Sync className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-900">Auto-Sync Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};