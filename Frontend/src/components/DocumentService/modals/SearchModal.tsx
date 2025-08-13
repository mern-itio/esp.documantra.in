import { useState } from 'react';
import { X, Search, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useDocumentStore } from '../../common/store/documentStore';
import type { SearchFilters } from '../../common/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FILE_TYPES = [
  { value: 'pdf', label: 'PDF Documents' },
  { value: 'doc', label: 'Word Documents' },
  { value: 'docx', label: 'Word Documents' },
  { value: 'xls', label: 'Excel Spreadsheets' },
  { value: 'xlsx', label: 'Excel Spreadsheets' },
  { value: 'ppt', label: 'PowerPoint' },
  { value: 'pptx', label: 'PowerPoint' },
  { value: 'jpg', label: 'Images' },
  { value: 'png', label: 'Images' },
  { value: 'txt', label: 'Text Files' }
];

const COMMON_TAGS = [
  'contract', 'legal', 'invoice', 'report', 'presentation',
  'meeting', 'project', 'proposal', 'agreement', 'finance'
];

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const { searchQuery, setSearchQuery, searchFilters, setSearchFilters } = useDocumentStore();
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [localFilters, setLocalFilters] = useState<SearchFilters>(searchFilters);

  const handleApplyFilters = () => {
    setSearchQuery(localQuery);
    setSearchFilters(localFilters);
    onClose();
  };

  const handleClearFilters = () => {
    setLocalQuery('');
    setLocalFilters({});
    setSearchQuery('');
    setSearchFilters({});
  };

  const handleFileTypeToggle = (type: string) => {
    const currentTypes = localFilters.type || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
    setLocalFilters({
      ...localFilters,
      type: newTypes.length > 0 ? newTypes : undefined
    });
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = localFilters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    
    setLocalFilters({
      ...localFilters,
      tags: newTags.length > 0 ? newTags : undefined
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
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
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Search Query */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Documents
              </label>
              <Input
                placeholder="Enter keywords to search in document names and content..."
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
              />
            </div>

            {/* File Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                File Types
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FILE_TYPES.map((type) => (
                  <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localFilters.type?.includes(type.value) || false}
                      onChange={() => handleFileTypeToggle(type.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      localFilters.tags?.includes(tag)
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    {tag}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">From</label>
                  <Input
                    type="date"
                    value={localFilters.dateRange?.from || ''}
                    onChange={(e) => setLocalFilters({
                      ...localFilters,
                      dateRange: {
                        ...localFilters.dateRange,
                        from: e.target.value,
                        to: localFilters.dateRange?.to || ''
                      }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">To</label>
                  <Input
                    type="date"
                    value={localFilters.dateRange?.to || ''}
                    onChange={(e) => setLocalFilters({
                      ...localFilters,
                      dateRange: {
                        ...localFilters.dateRange,
                        from: localFilters.dateRange?.from || '',
                        to: e.target.value
                      }
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Additional Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Additional Filters
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localFilters.sharedOnly || false}
                    onChange={(e) => setLocalFilters({
                      ...localFilters,
                      sharedOnly: e.target.checked || undefined
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Shared documents only</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localFilters.favoriteOnly || false}
                    onChange={(e) => setLocalFilters({
                      ...localFilters,
                      favoriteOnly: e.target.checked || undefined
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Favorite documents only</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={handleClearFilters}
          >
            Clear All
          </Button>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleApplyFilters}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}