import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  Archive, 
  Download, 
  Upload,
  Eye,
  Edit,
  Copy,
  Tag,
  Settings,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  type: 'document' | 'form_signer' | 'ai_generated' | 'api_template';
  status: 'published' | 'draft' | 'archived' | 'deprecated';
  creator: string;
  created: string;
  usage: number;
  rating: number;
  aiGenerated: boolean;
}

interface BulkTemplateActionsProps {
  templates: Template[];
  onBulkAction: (action: string, templateIds: string[]) => void;
}

export const BulkTemplateActions: React.FC<BulkTemplateActionsProps> = ({
  templates,
  onBulkAction
}) => {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const bulkActions = [
    { value: 'publish', label: 'Publish Templates', icon: CheckCircle, color: 'green' },
    { value: 'archive', label: 'Archive Templates', icon: Archive, color: 'yellow' },
    { value: 'delete', label: 'Delete Templates', icon: Trash2, color: 'red' },
    { value: 'export', label: 'Export Templates', icon: Download, color: 'blue' },
    { value: 'duplicate', label: 'Duplicate Templates', icon: Copy, color: 'purple' },
    { value: 'tag', label: 'Add Tags', icon: Tag, color: 'emerald' }
  ];

  const filteredTemplates = templates.filter(template => {
    const statusMatch = filterStatus === 'all' || template.status === filterStatus;
    const typeMatch = filterType === 'all' || template.type === filterType;
    return statusMatch && typeMatch;
  });

  const toggleSelectAll = () => {
    if (selectedTemplates.length === filteredTemplates.length) {
      setSelectedTemplates([]);
    } else {
      setSelectedTemplates(filteredTemplates.map(t => t.id));
    }
  };

  const toggleSelectTemplate = (templateId: string) => {
    setSelectedTemplates(prev => 
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const handleBulkAction = () => {
    if (selectedTemplates.length === 0 || !bulkAction) return;
    
    if (bulkAction === 'delete') {
      setShowConfirmDialog(true);
    } else {
      executeBulkAction();
    }
  };

  const executeBulkAction = () => {
    onBulkAction(bulkAction, selectedTemplates);
    setSelectedTemplates([]);
    setBulkAction('');
    setShowConfirmDialog(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700';
      case 'archived':
        return 'bg-gray-100 text-gray-700';
      case 'deprecated':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <Eye className="w-4 h-4" />;
      case 'form_signer':
        return <Edit className="w-4 h-4" />;
      case 'ai_generated':
        return <Settings className="w-4 h-4" />;
      case 'api_template':
        return <Upload className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Bulk Template Management</h2>
        <div className="text-sm text-gray-500">
          {selectedTemplates.length} of {filteredTemplates.length} templates selected
        </div>
      </div>

      {/* Filters and Bulk Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
            <option value="deprecated">Deprecated</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="document">Document</option>
            <option value="form_signer">Form Signer</option>
            <option value="ai_generated">AI Generated</option>
            <option value="api_template">API Template</option>
          </select>
        </div>

        {selectedTemplates.length > 0 && (
          <div className="flex items-center space-x-3">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Action...</option>
              {bulkActions.map(action => (
                <option key={action.value} value={action.value}>{action.label}</option>
              ))}
            </select>
            <button
              onClick={handleBulkAction}
              disabled={!bulkAction}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50"
            >
              Apply to {selectedTemplates.length} templates
            </button>
          </div>
        )}
      </div>

      {/* Template List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#F5F2EE]">
            <tr>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {selectedTemplates.length === filteredTemplates.length ? (
                    <CheckSquare className="w-4 h-4 mr-2" />
                  ) : (
                    <Square className="w-4 h-4 mr-2" />
                  )}
                  Select All
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creator</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-[#F7F3EE] divide-y divide-gray-200">
            {filteredTemplates.map((template) => (
              <tr key={template.id} className={`hover:bg-[#F5F2EE] ${
                selectedTemplates.includes(template.id) ? 'bg-blue-50' : ''
              }`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => toggleSelectTemplate(template.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {selectedTemplates.includes(template.id) ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900 flex items-center">
                        {template.name}
                        {template.aiGenerated && (
                          <span className="ml-2 px-2 py-0.5 bg-[#DCFCE7] text-[#155E4B] text-xs rounded-full">AI</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">ID: {template.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getTypeIcon(template.type)}
                    <span className="ml-2 text-sm text-gray-900 capitalize">{template.type.replace('_', ' ')}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(template.status)}`}>
                    {template.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{template.usage}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{template.creator}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-900">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#F7F3EE] rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Bulk Action</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to {bulkAction} {selectedTemplates.length} template(s)? 
              {bulkAction === 'delete' && ' This action cannot be undone.'}
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={executeBulkAction}
                className={`flex-1 px-4 py-2 rounded-md font-medium ${
                  bulkAction === 'delete'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Confirm
              </button>
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};