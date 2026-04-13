import React, { useCallback, useMemo, useState } from 'react';
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

  const iconMap = useMemo(
    () => LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>,
    []
  );

  const normalize = (value: string) => value.toLowerCase().replace(/[\s_-]+/g, '');

  const isRenderableIcon = useCallback((name: string) => {
    const candidate = (iconMap as Record<string, unknown>)[name];
    return !!candidate && (typeof candidate === 'function' || typeof candidate === 'object');
  }, [iconMap]);

  const iconNames = useMemo(() => {
    return Object.keys(iconMap)
      .filter((name) => /^[A-Z]/.test(name) && isRenderableIcon(name))
      .sort((a, b) => a.localeCompare(b));
  }, [iconMap, isRenderableIcon]);

  const resolveIconName = (raw?: string) => {
    const input = (raw || '').trim();
    if (!input) return 'Folder';
    const exact = iconNames.find((name) => name === input);
    if (exact) return exact;
    const ci = iconNames.find((name) => name.toLowerCase() === input.toLowerCase());
    if (ci) return ci;
    const normalized = normalize(input);
    const normalizedMatch = iconNames.find((name) => normalize(name) === normalized);
    return normalizedMatch || 'Folder';
  };

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

  const SelectedIcon = iconMap[resolveIconName(folderIcon)] || Folder;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    setIsCreating(true);
    setError(null);
    try {
      await onSubmit({
        name: folderName.trim(),
        color: folderColor,
        icon: resolveIconName(folderIcon)
      });
      setFolderName('');
      setFolderColor('#3b82f6');
      setFolderIcon('Folder');
      setIconSearch('Folder');
      setShowIconDropdown(false);
      setError(null);
      onClose();
    } catch (error: unknown) {
      console.error('Error creating folder:', error);
      const msg = error instanceof Error ? error.message : 'Failed to create folder. Please try again.';
      setError(msg);
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
    <div className="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-card text-card-foreground border border-border rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Folder className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Create New Folder</h2>
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
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 dark:bg-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            
            <div>
              <label htmlFor="folder-name" className="block text-sm font-medium text-foreground mb-2">
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
                className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="folder-color" className="block text-sm font-medium text-foreground mb-2">
                  Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    id="folder-color"
                    type="color"
                    value={folderColor}
                    onChange={(e) => setFolderColor(e.target.value)}
                    className="w-10 h-10 rounded border border-border bg-background"
                  />
                  <span className="text-sm text-muted-foreground">{folderColor}</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="folder-icon" className="block text-sm font-medium text-foreground mb-2">
                  Icon
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
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
                      const exact = iconNames.find((name) => normalize(name) === normalize(nextValue.trim()));
                      if (exact) setFolderIcon(exact);
                      setShowIconDropdown(true);
                    }}
                    onFocus={() => setShowIconDropdown(true)}
                    onBlur={() => {
                      setTimeout(() => setShowIconDropdown(false), 150);
                    }}
                    className="pl-9 pr-10 border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <SelectedIcon className="w-4 h-4" />
                  </div>

                  {showIconDropdown && (
                    <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-lg max-h-56 overflow-y-auto">
                      {filteredIconNames.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No icons found</div>
                      ) : (
                        filteredIconNames.map((name) => {
                          const IconComp = iconMap[name];
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
                              className={`w-full px-3 py-2 text-left flex items-center justify-between text-sm hover:bg-accent ${
                                isActive ? 'bg-primary/10 text-primary' : 'text-popover-foreground'
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
                <p className="mt-1 text-xs text-muted-foreground">Type to search</p>
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
              className="border-border bg-background hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!folderName.trim() || isCreating}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isCreating ? 'Creating...' : 'Create Folder'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}