import React, { useState, useEffect } from 'react';
import { ArrowLeft, Cloud, Plus, Settings, Folder, Upload, Download, FolderSync as Sync, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { cloudConnectorService, type CloudService, type CloudFile } from '../../services/cloudConnectorService';

interface CloudConnectorProps {
  onBack: () => void;
}

// Helper function to calculate storage percentage
const calculateStoragePercentage = (used: string, total: string): number => {
  try {
    // Convert storage strings to bytes
    const usedBytes = parseStorageToBytes(used);
    const totalBytes = parseStorageToBytes(total);
    
    if (totalBytes === 0) return 0;
    
    return (usedBytes / totalBytes) * 100;
  } catch (error) {
    console.error('Error calculating storage percentage:', error);
    return 0;
  }
};

// Helper function to parse storage strings to bytes
const parseStorageToBytes = (storage: string): number => {
  const match = storage.match(/^([\d.]+)\s*(KB|MB|GB|TB)?$/i);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();
  
  switch (unit) {
    case 'B': return value;
    case 'KB': return value * 1024;
    case 'MB': return value * 1024 * 1024;
    case 'GB': return value * 1024 * 1024 * 1024;
    case 'TB': return value * 1024 * 1024 * 1024 * 1024;
    default: return value;
  }
};

export const CloudConnector: React.FC<CloudConnectorProps> = ({ onBack }) => {
  const [services, setServices] = useState<CloudService[]>([]);
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [folderPath, setFolderPath] = useState<Array<{id: string, name: string}>>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Set up OAuth event listeners
  useEffect(() => {
    const handleOAuthSuccess = () => {
      loadData(); // Reload data after successful connection
      setConnecting(null);
    };

    const handleOAuthError = (event: CustomEvent) => {
      setError(event.detail.error);
      setConnecting(null);
    };

    // Listen for localStorage changes (fallback for COOP issues)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'oauthCallback' && e.newValue) {
        try {
          const oauthData = JSON.parse(e.newValue);
          if (oauthData.type === 'OAUTH_SUCCESS') {
            // Clear the localStorage item
            localStorage.removeItem('oauthCallback');
            // Trigger the OAuth success flow
            handleOAuthSuccess();
          }
        } catch (error) {
          console.error('Error parsing OAuth callback data:', error);
        }
      }
    };

    // Check for existing OAuth callback data on mount
    const checkExistingCallback = () => {
      const oauthData = localStorage.getItem('oauthCallback');
      if (oauthData) {
        try {
          const data = JSON.parse(oauthData);
          if (data.type === 'OAUTH_SUCCESS' && Date.now() - data.timestamp < 30000) { // 30 seconds timeout
            localStorage.removeItem('oauthCallback');
            handleOAuthSuccess();
          }
        } catch (error) {
          console.error('Error parsing existing OAuth callback data:', error);
        }
      }
    };

    window.addEventListener('cloudServiceConnected', handleOAuthSuccess as EventListener);
    window.addEventListener('cloudServiceError', handleOAuthError as EventListener);
    window.addEventListener('storage', handleStorageChange);

    // Check for existing callback data
    checkExistingCallback();

    // Set up periodic check for OAuth callback data (fallback)
    const intervalId = setInterval(() => {
      const oauthData = localStorage.getItem('oauthCallback');
      if (oauthData) {
        try {
          const data = JSON.parse(oauthData);
          if (data.type === 'OAUTH_SUCCESS' && Date.now() - data.timestamp < 30000) {
            localStorage.removeItem('oauthCallback');
            handleOAuthSuccess();
          }
        } catch (error) {
          console.error('Error parsing OAuth callback data:', error);
        }
      }
    }, 1000); // Check every second

    return () => {
      window.removeEventListener('cloudServiceConnected', handleOAuthSuccess as EventListener);
      window.removeEventListener('cloudServiceError', handleOAuthError as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  // Check for OAuth completion via URL parameters (fallback for COOP issues)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('oauth') === 'success') {
      const service = urlParams.get('service');
      if (service) {
        loadData(); // Reload data after successful connection
        setConnecting(null);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [availableServices, connectedServices] = await Promise.all([
        cloudConnectorService.getAvailableServices(),
        cloudConnectorService.getConnectedServices()
      ]);

      // Only try to get files if there are connected services
      let filesData: CloudFile[] = [];
      if (connectedServices.length > 0) {
        try {
          filesData = await cloudConnectorService.getFiles();
        } catch (error) {
          console.warn('Error loading files (this is normal if no files are synced):', error);
          filesData = [];
        }
      }

      // Merge available and connected services
      const allServices = availableServices.map(service => {
        const connected = connectedServices.find(cs => cs.id === service.id);
        return connected ? { ...service, ...connected } : service;
      });

      setServices(allServices);
      setFiles(filesData);
      
      // Set first connected service as selected
      const firstConnected = allServices.find(s => s.connected);
      if (firstConnected) {
        setSelectedService(firstConnected.id);
      }
    } catch (err) {
      console.error('Error loading cloud connector data:', err);
      setError('Failed to load cloud connector data');
    } finally {
      setLoading(false);
    }
  };

  const connectService = async (serviceId: string) => {
    try {
      setConnecting(serviceId);
      setError(null);
      
      await cloudConnectorService.initiateOAuthFlow(serviceId);
    } catch (err) {
      console.error('Error connecting service:', err);
      setError(`Failed to connect to ${serviceId}`);
      setConnecting(null);
    }
  };

  const disconnectService = async (serviceId: string) => {
    try {
      setError(null);
      await cloudConnectorService.disconnectService(serviceId);
      await loadData(); // Reload data after disconnection
    } catch (err) {
      console.error('Error disconnecting service:', err);
      setError(`Failed to disconnect from ${serviceId}`);
    }
  };

  const syncFiles = async () => {
    try {
    setIsSyncing(true);
      setError(null);
      
      const connectedServices = services.filter(s => s.connected);
      let totalSynced = 0;
      
      for (const service of connectedServices) {
        try {
          const result = await cloudConnectorService.syncFiles(service.id);
          totalSynced += result.filesSynced;
        } catch (err) {
          console.error(`Error syncing ${service.name}:`, err);
        }
      }
      
      // Reload data after sync
      await loadData();
    } catch (err) {
      console.error('Error syncing files:', err);
      setError('Failed to sync files');
    } finally {
      setIsSyncing(false);
    }
  };

  const browseFiles = async (serviceId: string, folderId: string = 'root') => {
    setSelectedService(serviceId);
    setCurrentFolderId(folderId);
    setLoading(true);
    setError(null);
    
    try {
      const filesData = await cloudConnectorService.getFiles(serviceId, folderId);
      setFiles(filesData);
    } catch (error) {
      console.error('🔍 Error browsing files:', error);
      setError(error instanceof Error ? error.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = async (folder: CloudFile) => {
    
    if (folder.type === 'folder' && !navigating) {
      // Use fileId (cloud service ID) for navigation, not MongoDB _id
      const folderCloudId = folder.fileId || folder.id;
      
      // Check if we're already in this folder to prevent duplicate navigation
      if (currentFolderId === folderCloudId) {
        return; // Already in this folder, don't navigate again
      }
      
      setNavigating(true);
      try {
        // Add current folder to path
        setFolderPath(prev => [...prev, { id: folderCloudId, name: folder.name }]);
        await browseFiles(selectedService, folderCloudId);
      } finally {
        setNavigating(false);
      }
    }
  };

  const navigateBack = async (index: number) => {
    if (navigating) return; // Prevent multiple navigation calls
    
    setNavigating(true);
    try {
      // Navigate back to the folder at the specified index
      const newPath = folderPath.slice(0, index);
      setFolderPath(newPath);
      
      const targetFolderId = index === 0 ? 'root' : newPath[newPath.length - 1].id;
      await browseFiles(selectedService, targetFolderId);
    } finally {
      setNavigating(false);
    }
  };

  const uploadFile = async () => {
    if (!selectedService) {
      setError('Please select a service first');
      return;
    }
    
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png';
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;
      
      setLoading(true);
      setError(null);
      
      try {
        
        // Upload each file to the cloud service
        for (const file of Array.from(files)) {
          const result = await cloudConnectorService.uploadFile(selectedService, file, currentFolderId);
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to upload file');
          }
        }
        
        // Show success message
        alert(`Successfully uploaded ${files.length} file(s) to ${services.find(s => s.id === selectedService)?.name}`);
        
        // Refresh files after upload - stay in current folder
        await browseFiles(selectedService, currentFolderId);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to upload files');
      } finally {
        setLoading(false);
      }
    };
    
    input.click();
  };

  const createNewFolder = async () => {
    if (!selectedService) {
      setError('Please select a service first');
      return;
    }
    
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Create folder in cloud service
      const result = await cloudConnectorService.createFolder(selectedService, folderName, currentFolderId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create folder');
      }
      
      // Show success message
      alert(`Successfully created folder "${folderName}" in ${services.find(s => s.id === selectedService)?.name}`);
      
      // Refresh files after folder creation - stay in current folder
      await browseFiles(selectedService, currentFolderId);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create folder');
    } finally {
      setLoading(false);
    }
  };
  const getServiceIcon = (service: CloudService) => {
    return service.icon;
  };


  const connectedServices = services.filter(s => s.connected);
  const availableServices = services.filter(s => !s.connected);

  if (loading) {
    return (
      <div className="space-y-6">
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
              <p className="text-gray-600">Loading cloud services...</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

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

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connected Services */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Status */}
          <div className="bg-[#F7F3EE] rounded-xl border border-gray-200 p-6">
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
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.min(100, Math.max(0, calculateStoragePercentage(service.storageUsed || '0', service.storageTotal || '0')))}%` 
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
                        onClick={() => browseFiles(service.id)}
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
            <div className="bg-[#F7F3EE] rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Files from {services.find(s => s.id === selectedService)?.name}
                </h3>
                  
                  {/* Breadcrumb Navigation */}
                  {folderPath.length > 0 && (
                    <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                      <button 
                        onClick={() => navigateBack(0)}
                        className="hover:text-blue-600 transition-colors"
                      >
                        Root
                      </button>
                      {folderPath.map((folder, index) => (
                        <div key={folder.id} className="flex items-center space-x-1">
                          <span>/</span>
                          <button 
                            onClick={() => navigateBack(index + 1)}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {folder.name}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={uploadFile}
                    className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload</span>
                  </button>
                  <button 
                    onClick={createNewFolder}
                    className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Folder</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {files
                  .filter(file => file.service === selectedService)
                  .map((file) => (
                    <div 
                      key={file.id} 
                      className={`flex items-center justify-between p-3 hover:bg-[#F5F2EE] rounded-lg transition-colors ${
                        file.type === 'folder' ? `cursor-pointer hover:bg-blue-50 ${navigating ? 'opacity-50 pointer-events-none' : ''}` : ''
                      }`}
                      onClick={() => file.type === 'folder' && !navigating && navigateToFolder(file)}
                    >
                      <div className="flex items-center space-x-3">
                        {file.type === 'folder' ? (
                          <div className="flex items-center space-x-2">
                          <Folder className="w-5 h-5 text-blue-500" />
                            <span className="text-xs text-blue-600 font-medium">FOLDER</span>
                          </div>
                        ) : (
                          <div className={`w-5 h-5 rounded flex items-center justify-center ${
                            file.type === 'pdf' ? 'bg-red-100' :
                            file.type === 'doc' || file.type === 'docx' ? 'bg-blue-100' :
                            file.type === 'image' ? 'bg-green-100' :
                            'bg-gray-100'
                          }`}>
                            <span className={`text-xs font-bold ${
                              file.type === 'pdf' ? 'text-red-600' :
                              file.type === 'doc' || file.type === 'docx' ? 'text-blue-600' :
                              file.type === 'image' ? 'text-green-600' :
                              'text-gray-600'
                            }`}>
                              {file.type === 'pdf' ? 'PDF' :
                               file.type === 'doc' || file.type === 'docx' ? 'DOC' :
                               file.type === 'image' ? 'IMG' :
                               file.type.toUpperCase()}
                            </span>
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
                      
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Available Services */}
        <div className="space-y-6">
          <div className="bg-[#F7F3EE] rounded-xl border border-gray-200 p-6">
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
                    disabled={connecting === service.id}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                  >
                    {connecting === service.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                    <Plus className="w-3 h-3" />
                    )}
                    <span>{connecting === service.id ? 'Connecting...' : 'Connect'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Sync Status */}
          <div className="bg-[#F7F3EE] rounded-xl border border-gray-200 p-6">
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
          <div className="bg-[#F7F3EE] rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="space-y-2">
              <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-[#F5F2EE] rounded-lg transition-colors">
                <Upload className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">Upload to Cloud</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-[#F5F2EE] rounded-lg transition-colors">
                <Download className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-900">Download All</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-[#F5F2EE] rounded-lg transition-colors">
                <Sync className="w-4 h-4 text-[#155E4B]" />
                <span className="text-sm font-medium text-gray-900">Auto-Sync Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};