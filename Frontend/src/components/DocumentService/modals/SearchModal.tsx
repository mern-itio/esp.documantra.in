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
  { value: 'xls', label: 'Excel Spreadsheets' },
  { value: 'ppt', label: 'PowerPoint' },
  { value: 'jpg', label: 'Images' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm dark:bg-black/60">
      <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Advanced Search</h2>
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
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {/* Search Query */}
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
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
              <label className="mb-3 block text-sm font-medium text-foreground">
                File Types
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FILE_TYPES.map((type) => (
                  <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localFilters.type?.includes(type.value) || false}
                      onChange={() => handleFileTypeToggle(type.value)}
                      className="rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <span className="text-sm text-foreground">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="mb-3 block text-sm font-medium text-foreground">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      localFilters.tags?.includes(tag)
                        ? 'border-primary/40 bg-primary/15 text-primary'
                        : 'border-border bg-muted text-foreground hover:bg-accent'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="mb-3 block text-sm font-medium text-foreground">
                <Calendar className="mr-1 inline h-4 w-4" />
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">From</label>
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
                  <label className="mb-1 block text-xs text-muted-foreground">To</label>
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
              <label className="mb-3 block text-sm font-medium text-foreground">
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
                    className="rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <span className="text-sm text-foreground">Shared documents only</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localFilters.favoriteOnly || false}
                    onChange={(e) => setLocalFilters({
                      ...localFilters,
                      favoriteOnly: e.target.checked || undefined
                    })}
                    className="rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <span className="text-sm text-foreground">Favorite documents only</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
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
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}