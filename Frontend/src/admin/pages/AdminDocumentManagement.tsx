import React, { useEffect, useMemo, useState } from 'react';
import { DataTable, Button } from '../common';
import {  
  CheckCircle, 
  XCircle, 
  Search,
  FileText,
  Link as LinkIcon,
  ToggleLeft,
  ToggleRight,
  Settings,
  RefreshCw,
  Save
} from 'lucide-react';
import type { PDFTool } from '../../types';
import { adminApiService } from '../services/AdminApiService';


interface ToolSettings {
  toolId: string;
  toolName: string;
  category: string;
  isActive: boolean;
  accessControl: {
    allowedFor: 'all' | 'logged_in_only' | 'pro' | 'custom';
    customRules: {
      freeUsers: {
        enabled: boolean;
        limitType: 'unlimited' | 'number';
        limit: number | null;
        timeWindow: 'daily' | 'weekly' | 'monthly';
      };
      proUsers: {
        enabled: boolean;
        limitType: 'unlimited' | 'number';
        limit: number | null;
        timeWindow: 'daily' | 'weekly' | 'monthly';
      };
      guests: {
        enabled: boolean;
        limitType: 'unlimited' | 'number';
        limit: number | null;
        timeWindow: 'daily' | 'weekly' | 'monthly';
      };
    };
  };
  features: {
    requiresAuth: boolean;
    requiresPremium: boolean;
    showInMenu: boolean;
    showInHeader: boolean;
    isPopular: boolean;
  };
  display: {
    badge: string | null;
    icon: string;
    description: string;
    order: number;
  };
}

const AdminDocumentManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [toolStatusMap, setToolStatusMap] = useState<Record<string, boolean>>({});
  const [toolSettings, setToolSettings] = useState<Record<string, ToolSettings>>({});
  const [loading, setLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolSettings | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [saving, setSaving] = useState(false);
 
  // Build list of PDF tools from backend catalog
  const [catalogTools, setCatalogTools] = useState<Array<{ id: string; name: string }>>([]);
  useEffect(() => {
    let mounted = true;
    import('../../services/toolCatalogService').then(({ toolCatalogService }) => {
      toolCatalogService.listPublic().then((tools) => {
        if (!mounted) return;
        setCatalogTools(Array.isArray(tools) ? tools : []);
      }).catch(() => {});
    });
    return () => { mounted = false; };
  }, []);

  const allTools: Array<PDFTool & { categoryKey: string; routeResolved?: string }> = useMemo(() => {
    return catalogTools.map(t => ({
      id: t.id,
      name: t.name,
      description: '',
      category: 'general',
      inputFormats: [],
      outputFormats: [],
      features: [],
      complexity: 'easy' as const,
      popularity: 0,
      avgProcessingTime: '',
      icon: undefined as any,
      route: `/pdf-tools/${t.id}`,
      categoryKey: 'general',
      routeResolved: `/pdf-tools/${t.id}`
    }));
  }, [catalogTools]);

  // Load tool settings from API
  useEffect(() => {
    loadToolSettings();
  }, []);



  const loadToolSettings = async () => {
    try {
      setLoading(true);
      console.log('Loading tool settings...');
      
      const response = await adminApiService.getPDFToolSettings();
      console.log('Tool settings response:', response);
      
      if (response.success && response.data) {
        const settingsMap: Record<string, ToolSettings> = {};
        response.data.forEach((setting: any) => {
          settingsMap[setting.toolId] = setting;
        });
        setToolSettings(settingsMap);
        // Hydrate toggle state from ACTIVATION API (independent of settings)
        const statusMap: Record<string, boolean> = {};
        const toolIds = allTools.map(t => t.id as string);
        await Promise.all(toolIds.map(async (id) => {
          try {
            const act = await adminApiService.getActivation(id);
            statusMap[id] = act.success ? !!(act.data as any)?.isActive : true;
          } catch {
            statusMap[id] = true;
          }
        }));
        setToolStatusMap(statusMap);
        console.log('Tool settings loaded successfully:', settingsMap);
      } else {
        console.error('Failed to load tool settings:', response.error);
        alert(`Failed to load tool settings: ${response.error}`);
      }
    } catch (error) {
      console.error('Error loading tool settings:', error);
      alert(`Error loading tool settings: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Removed localStorage persistence: we rely on server as the single source of truth

  const toggleToolActive = async (toolId: string) => {
    try {
      setSaving(true);
      const existing = toolSettings[toolId];
      const nextActive = !(existing?.isActive ?? toolStatusMap[toolId] ?? true);

      // Use independent activation API
      const res = await adminApiService.setActivation(toolId, nextActive);
      if (res.success) {
        setToolStatusMap(prev => ({ ...prev, [toolId]: nextActive }));
        if (existing) setToolSettings(prev => ({ ...prev, [toolId]: { ...existing, isActive: nextActive } }));
      } else {
        alert(`Failed to update active status: ${res.error}`);
      }
    } catch (e: any) {
      console.error('Error toggling tool active:', e);
      alert(`Error toggling tool active: ${e?.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  const openSettingsModal = (toolId: string) => {
    const settings = toolSettings[toolId];
    if (settings) {
      setSelectedTool(settings);
      setShowSettingsModal(true);
    } else {
      // Create default settings if none exist
      const defaultSettings: ToolSettings = {
        toolId,
        toolName: allTools.find(t => t.id === toolId)?.name || toolId,
        category: allTools.find(t => t.id === toolId)?.category || 'Unknown',
        isActive: true,
        accessControl: {
          allowedFor: 'all',
          customRules: {
            freeUsers: {
              enabled: true,
              limitType: 'number',
              limit: 10,
              timeWindow: 'daily'
            },
            proUsers: {
              enabled: true,
              limitType: 'unlimited',
              limit: null,
              timeWindow: 'daily'
            },
            guests: {
              enabled: true,
              limitType: 'number',
              limit: 5,
              timeWindow: 'daily'
            }
          }
        },
        features: {
          requiresAuth: false,
          requiresPremium: false,
          showInMenu: true,
          showInHeader: false,
          isPopular: false
        },
        display: {
          badge: null,
          icon: 'FileText',
          description: '',
          order: 0
        }
      };
      setSelectedTool(defaultSettings);
      setShowSettingsModal(true);
    }
  };

  const saveToolSettings = async () => {
    if (!selectedTool) return;
    
    try {
      setSaving(true);
      
      // Check if this is a new setting or updating existing one
      const existingSetting = toolSettings[selectedTool.toolId];
      let response;
      
      if (existingSetting) {
        // Update existing setting
        response = await adminApiService.updatePDFToolSetting(selectedTool.toolId, selectedTool);
      } else {
        // Create new setting
        response = await adminApiService.createPDFToolSetting(selectedTool);
      }
      
      if (response.success) {
        // Update local state
        setToolSettings(prev => ({
          ...prev,
          [selectedTool.toolId]: selectedTool
        }));
        setShowSettingsModal(false);
        setSelectedTool(null);
        console.log('Tool settings saved successfully');
        alert('Tool settings saved successfully!');
      } else {
        console.error('Failed to save tool settings:', response.error);
        alert(`Failed to save tool settings: ${response.error}`);
      }
    } catch (error) {
      console.error('Error saving tool settings:', error);
      alert(`Error saving tool settings: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  // const initializeDefaultSettings = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await adminApiService.initializeDefaultToolSettings();
  //     if (response.success) {
  //       console.log('Default settings initialized successfully');
  //       // Reload settings after initialization
  //       await loadToolSettings();
  //     } else {
  //       console.error('Failed to initialize default settings:', response.error);
  //     }
  //   } catch (error) {
  //     console.error('Error initializing default settings:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const getActiveBadge = (active: boolean) => {
    const color = active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
    const Icon = active ? CheckCircle : XCircle;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {active ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const getAccessControlBadge = (toolId: string) => {
    const settings = toolSettings[toolId];
    if (!settings) return <span className="text-gray-400">Not configured</span>;
    
    const { allowedFor, customRules } = settings.accessControl;
    
    if (allowedFor === 'all') {
      return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Free for All</span>;
    } else if (allowedFor === 'logged_in_only') {
      return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Logged In Only</span>;
    } else if (allowedFor === 'pro') {
      return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">Premium Only</span>;
    } else if (allowedFor === 'custom') {
      const freeEnabled = customRules.freeUsers.enabled;
      const proEnabled = customRules.proUsers.enabled;
      const guestEnabled = customRules.guests.enabled;
      
      if (freeEnabled && proEnabled && guestEnabled) {
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Custom Rules</span>;
      } else if (proEnabled && !freeEnabled && !guestEnabled) {
        return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">Pro Only</span>;
      } else {
        return <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Mixed Access</span>;
      }
    }
    
    return <span className="text-gray-400">Unknown</span>;
  };

  const columns = [
    {
      key: 'name',
      label: 'Tool',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center">
          <FileText className="w-4 h-4 text-gray-400 mr-2" />
          <span className="font-medium text-gray-900">{value}</span>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true
    },
    {
      key: 'route',
      label: 'Route',
      sortable: true,
      render: (val: string) => (
        <div className="flex items-center text-gray-700">
          <LinkIcon className="w-4 h-4 mr-1" />
          <span className="text-xs">{val}</span>
        </div>
      )
    },
    {
      key: 'accessControl',
      label: 'Access Control',
      sortable: false,
      render: (_: any, row: any) => getAccessControlBadge(row.id)
    },
    {
      key: 'active',
      label: 'Status',
      sortable: true,
      render: (value: boolean) => getActiveBadge(value)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: any) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openSettingsModal(row.id)}
            icon={<Settings className="w-4 h-4" />}
          >
            Settings
          </Button>
          <Button
            size="sm"
            variant={row.active ? 'outline' : 'primary'}
            onClick={() => toggleToolActive(row.id)}
            icon={row.active ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
          >
            {row.active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      )
    }
  ];

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  const tableData = useMemo(() => {
    const rows = allTools.map(t => ({
      id: t.id as string,
      name: t.name || t.id || 'Unknown',
      category: t.category || t.categoryKey,
      route: t.routeResolved,
      active: (toolSettings[t.id as string]?.isActive) ?? (toolStatusMap[t.id as string] ?? true)
    }));

    const filtered = rows.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.route?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? r.active : !r.active);
      return matchesSearch && matchesStatus;
    });

    const sorted = [...filtered];
    if (sortColumn) {
      sorted.sort((a: any, b: any) => {
        const av = a[sortColumn];
        const bv = b[sortColumn];
        if (av === bv) return 0;
        if (sortDirection === 'asc') return av > bv ? 1 : -1;
        return av < bv ? 1 : -1;
      });
    }
    return sorted;
  }, [allTools, searchTerm, statusFilter, sortColumn, sortDirection, toolStatusMap]);

  return (
    <>
      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">PDF Tools Management</h1>
              <p className="text-gray-600">View all PDF tools and configure access settings</p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={loadToolSettings}
                icon={<RefreshCw className="w-4 h-4" />}
                disabled={loading}
              >
                Refresh
              </Button>
              {/* <Button
                variant="primary"
                onClick={initializeDefaultSettings}
                disabled={loading}
              >
                Initialize Default Settings
              </Button> */}
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tools by name, category or route..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>               
              </div>
            </div>
          </div>
        </div>

        {/* Tools Table */}
        <div className="bg-white rounded-lg shadow">
          <DataTable
            data={tableData}
            columns={columns}
            onSort={handleSort}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            emptyMessage="No tools found"
          />
        </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && selectedTool && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Tool Settings: {selectedTool.toolName}</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Access Control Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Access Control</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Who can access this tool?
                    </label>
                    <select
                      value={selectedTool.accessControl.allowedFor}
                      onChange={(e) => setSelectedTool({
                        ...selectedTool,
                        accessControl: {
                          ...selectedTool.accessControl,
                          allowedFor: e.target.value as any
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="all">All Users (Free for logged in users)</option>
                     
                    </select>
                  </div>

                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowSettingsModal(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  if (!selectedTool) return;
                  try {
                    setSaving(true);
                    const res = await adminApiService.deletePDFToolSetting(selectedTool.toolId);
                    if (res.success) {
                      await loadToolSettings();
                      setShowSettingsModal(false);
                      setSelectedTool(null);
                      alert('Tool reset. Subscription-based access will apply.');
                    } else {
                      alert(`Failed to reset: ${res.error}`);
                    }
                  } catch (e) {
                    alert(`Error resetting: ${e}`);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Reset to Subscription
              </Button>
              <Button
                onClick={saveToolSettings}
                disabled={saving}
                icon={saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDocumentManagement;
