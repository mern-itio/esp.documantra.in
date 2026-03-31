import React, { useMemo, useState } from 'react';
import { X, Folder, Search } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';


interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (folderData: { name: string; color: string; icon: string }) => Promise<void>;
}

export function CreateFolderModal({ isOpen, onClose, onSubmit }: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState('');
  const [folderColor, setFolderColor] = useState('#3b82f6');
  const [folderIcon, setFolderIcon] = useState('Folder');
  const [iconSearch, setIconSearch] = useState('Folder');
  const [showIconDropdown, setShowIconDropdown] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const iconNames = useMemo(() => {
    return Object.keys(LucideIcons)
      .filter((name) => /^[A-Z]/.test(name))
      .sort((a, b) => a.localeCompare(b));
  }, []);

  const filteredIconNames = useMemo(() => {
    const query = iconSearch.trim().toLowerCase();
    if (!query) return iconNames.slice(0, 50);

    const exactMatches = iconNames.filter((name) => name.toLowerCase() === query);
    const prefixMatches = iconNames.filter(
      (name) => name.toLowerCase().startsWith(query) && name.toLowerCase() !== query
    );
    const broadMatches = iconNames.filter(
      (name) =>
        name.toLowerCase().includes(query) &&
        !name.toLowerCase().startsWith(query) &&
        name.toLowerCase() !== query
    );

    return [...exactMatches, ...prefixMatches, ...broadMatches].slice(0, 50);
  }, [iconNames, iconSearch]);

  const SelectedIcon =
    ((LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[folderIcon] as
      | React.ComponentType<{ className?: string }>
      | undefined) || Folder;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    setIsCreating(true);
    setError(null);
    try {
      await onSubmit({
        name: folderName.trim(),
        color: folderColor,
        icon: folderIcon
      });
      setFolderName('');
      setFolderColor('#3b82f6');
      setFolderIcon('Folder');
      setIconSearch('Folder');
      setShowIconDropdown(false);
      setError(null);
      onClose();
    } catch (error: any) {
      console.error('Error creating folder:', error);
      setError(error.message || 'Failed to create folder. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setFolderName('');
    setFolderColor('#3b82f6');
    setFolderIcon('Folder');
    setIconSearch('Folder');
    setShowIconDropdown(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Folder className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Create New Folder</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            
            <div>
              <label htmlFor="folder-name" className="block text-sm font-medium text-gray-700 mb-2">
                Folder Name
              </label>
              <Input
                id="folder-name"
                type="text"
                placeholder="Enter folder name..."
                value={folderName}
                onChange={(e) => {
                  setFolderName(e.target.value);
                  if (error) setError(null); // Clear error when user starts typing
                }}
                autoFocus
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="folder-color" className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    id="folder-color"
                    type="color"
                    value={folderColor}
                    onChange={(e) => setFolderColor(e.target.value)}
                    className="w-10 h-10 rounded border border-gray-300"
                  />
                  <span className="text-sm text-gray-500">{folderColor}</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="folder-icon" className="block text-sm font-medium text-gray-700 mb-2">
                  Icon
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <Input
                    id="folder-icon"
                    type="text"
                    placeholder="Search icon (e.g. Folder, File, Mail)"
                    value={iconSearch}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setIconSearch(nextValue);
                      const exact = iconNames.find((name) => name.toLowerCase() === nextValue.trim().toLowerCase());
                      if (exact) setFolderIcon(exact);
                      setShowIconDropdown(true);
                    }}
                    onFocus={() => setShowIconDropdown(true)}
                    onBlur={() => {
                      setTimeout(() => setShowIconDropdown(false), 150);
                    }}
                    className="pl-9 pr-10"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <SelectedIcon className="w-4 h-4" />
                  </div>

                  {showIconDropdown && (
                    <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-56 overflow-y-auto">
                      {filteredIconNames.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">No icons found</div>
                      ) : (
                        filteredIconNames.map((name) => {
                          const IconComp = (LucideIcons as unknown as Record<
                            string,
                            React.ComponentType<{ className?: string }>
                          >)[name];
                          const isActive = folderIcon === name;
                          return (
                            <button
                              key={name}
                              type="button"
                              onClick={() => {
                                setFolderIcon(name);
                                setIconSearch(name);
                                setShowIconDropdown(false);
                              }}
                              className={`w-full px-3 py-2 text-left flex items-center justify-between text-sm hover:bg-gray-50 ${
                                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                              }`}
                            >
                              <span className="truncate">{name}</span>
                              {IconComp ? <IconComp className="w-4 h-4 flex-shrink-0" /> : null}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">Type to search</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!folderName.trim() || isCreating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? 'Creating...' : 'Create Folder'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}