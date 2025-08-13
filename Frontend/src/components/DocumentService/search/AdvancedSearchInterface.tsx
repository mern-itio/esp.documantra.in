import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  FileText, 
  Tag, 
  Users, 
  Clock,
  Sliders,
  X,
  Save
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface SearchFilters {
  query: string;
  fileTypes: string[];
  dateRange: {
    from: string;
    to: string;
  };
  sizeRange: {
    min: number;
    max: number;
  };
  tags: string[];
  authors: string[];
  collaborators: string[];
  lastModified: string;
  hasComments: boolean;
  hasVersions: boolean;
  isShared: boolean;
  workflowStatus: string[];
}

interface AdvancedSearchInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: SearchFilters) => void;
  onSaveSearch: (name: string, filters: SearchFilters) => void;
  savedSearches: Array<{ id: string; name: string; filters: SearchFilters }>;
}

const FILE_TYPES = [
  { value: 'pdf', label: 'PDF', color: 'bg-red-100 text-red-800' },
  { value: 'docx', label: 'Word', color: 'bg-blue-100 text-blue-800' },
  { value: 'xlsx', label: 'Excel', color: 'bg-green-100 text-green-800' },
  { value: 'pptx', label: 'PowerPoint', color: 'bg-orange-100 text-orange-800' },
  { value: 'txt', label: 'Text', color: 'bg-gray-100 text-gray-800' },
  { value: 'jpg', label: 'Image', color: 'bg-purple-100 text-purple-800' }
];

const COMMON_TAGS = [
  'contract', 'legal', 'finance', 'hr', 'marketing', 'sales',
  'project', 'meeting', 'report', 'proposal', 'invoice', 'agreement'
];

const WORKFLOW_STATUSES = [
  'draft', 'review', 'approved', 'rejected', 'completed', 'archived'
];

export function AdvancedSearchInterface({
  isOpen,
  onClose,
  onSearch,
  onSaveSearch,
  savedSearches
}: AdvancedSearchInterfaceProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    fileTypes: [],
    dateRange: { from: '', to: '' },
    sizeRange: { min: 0, max: 100 },
    tags: [],
    authors: [],
    collaborators: [],
    lastModified: '',
    hasComments: false,
    hasVersions: false,
    isShared: false,
    workflowStatus: []
  });

  const [saveSearchName, setSaveSearchName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  if (!isOpen) return null;

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleArrayToggle = (key: keyof SearchFilters, value: string) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    handleFilterChange(key, newArray);
  };

  const handleSearch = () => {
    onSearch(filters);
    onClose();
  };

  const handleSaveSearch = () => {
    if (saveSearchName.trim()) {
      onSaveSearch(saveSearchName.trim(), filters);
      setSaveSearchName('');
      setShowSaveDialog(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      fileTypes: [],
      dateRange: { from: '', to: '' },
      sizeRange: { min: 0, max: 100 },
      tags: [],
      authors: [],
      collaborators: [],
      lastModified: '',
      hasComments: false,
      hasVersions: false,
      isShared: false,
      workflowStatus: []
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Advanced Search</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Search Query */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Search className="w-4 h-4 inline mr-1" />
                  Search Query
                </label>
                <Input
                  value={filters.query}
                  onChange={(e) => handleFilterChange('query', e.target.value)}
                  placeholder="Enter keywords, phrases, or content to search for..."
                  className="w-full"
                />
              </div>

              {/* File Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <FileText className="w-4 h-4 inline mr-1" />
                  File Types
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {FILE_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => handleArrayToggle('fileTypes', type.value)}
                      className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                        filters.fileTypes.includes(type.value)
                          ? type.color
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">From</label>
                    <Input
                      type="date"
                      value={filters.dateRange.from}
                      onChange={(e) => handleFilterChange('dateRange', {
                        ...filters.dateRange,
                        from: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">To</label>
                    <Input
                      type="date"
                      value={filters.dateRange.to}
                      onChange={(e) => handleFilterChange('dateRange', {
                        ...filters.dateRange,
                        to: e.target.value
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* File Size Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Sliders className="w-4 h-4 inline mr-1" />
                  File Size Range (MB)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Min Size</label>
                    <Input
                      type="number"
                      min="0"
                      value={filters.sizeRange.min}
                      onChange={(e) => handleFilterChange('sizeRange', {
                        ...filters.sizeRange,
                        min: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Max Size</label>
                    <Input
                      type="number"
                      min="0"
                      value={filters.sizeRange.max}
                      onChange={(e) => handleFilterChange('sizeRange', {
                        ...filters.sizeRange,
                        max: parseInt(e.target.value) || 100
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleArrayToggle('tags', tag)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        filters.tags.includes(tag)
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Workflow Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Workflow Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {WORKFLOW_STATUSES.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleArrayToggle('workflowStatus', status)}
                      className={`p-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                        filters.workflowStatus.includes(status)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Filter className="w-4 h-4 inline mr-1" />
                  Additional Filters
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.hasComments}
                      onChange={(e) => handleFilterChange('hasComments', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Has comments</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.hasVersions}
                      onChange={(e) => handleFilterChange('hasVersions', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Has multiple versions</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.isShared}
                      onChange={(e) => handleFilterChange('isShared', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Shared documents</span>
                  </label>
                </div>
              </div>

              {/* Saved Searches */}
              {savedSearches.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Save className="w-4 h-4 inline mr-1" />
                    Saved Searches
                  </label>
                  <div className="space-y-2">
                    {savedSearches.map((search) => (
                      <button
                        key={search.id}
                        onClick={() => setFilters(search.filters)}
                        className="w-full text-left p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-900">
                          {search.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={clearFilters}>
              Clear All
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSaveDialog(true)}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Search
            </Button>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {/* Save Search Dialog */}
        {showSaveDialog && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Search</h3>
              <Input
                value={saveSearchName}
                onChange={(e) => setSaveSearchName(e.target.value)}
                placeholder="Enter search name..."
                className="mb-4"
              />
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSaveDialog(false);
                    setSaveSearchName('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveSearch}
                  disabled={!saveSearchName.trim()}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}