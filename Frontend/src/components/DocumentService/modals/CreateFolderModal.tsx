import React, { useState } from 'react';
import { X, Folder } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';


interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (folderData: { name: string; description: string; color: string; icon: string }) => Promise<void>;
  parentFolderName?: string;
}

export function CreateFolderModal({ isOpen, onClose, onSubmit, parentFolderName }: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState('');
  const [folderDescription, setFolderDescription] = useState('');
  const [folderColor, setFolderColor] = useState('#3b82f6');
  const [folderIcon, setFolderIcon] = useState('Folder');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    setIsCreating(true);
    setError(null);
    try {
      await onSubmit({
        name: folderName.trim(),
        description: folderDescription.trim(),
        color: folderColor,
        icon: folderIcon
      });
      setFolderName('');
      setFolderDescription('');
      setFolderColor('#3b82f6');
      setFolderIcon('Folder');
      setError(null);
      onClose();
    } catch (err: unknown) {
      console.error('Error creating folder:', err);
      const message = err instanceof Error ? err.message : 'Failed to create folder. Please try again.';
      setError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setFolderName('');
    setFolderDescription('');
    setFolderColor('#3b82f6');
    setFolderIcon('Folder');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs dark:bg-black/60">
      <div className="w-full max-w-md rounded-lg border border-border bg-card text-card-foreground shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center space-x-2">
            <Folder className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Create New Folder</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {parentFolderName && (
              <div className="rounded-lg border border-primary/25 bg-primary/10 p-3 dark:bg-primary/15">
                <p className="text-sm text-foreground">
                  Creating folder in: <span className="font-medium">{parentFolderName}</span>
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 dark:bg-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            
            <div>
              <label htmlFor="folder-name" className="mb-2 block text-sm font-medium text-foreground">
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
                className="border-input bg-background text-foreground"
              />
            </div>

            <div>
              <label htmlFor="folder-description" className="mb-2 block text-sm font-medium text-foreground">
                Description (Optional)
              </label>
              <Input
                id="folder-description"
                type="text"
                placeholder="Enter folder description..."
                value={folderDescription}
                onChange={(e) => setFolderDescription(e.target.value)}
                className="border-input bg-background text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="folder-color" className="mb-2 block text-sm font-medium text-foreground">
                  Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    id="folder-color"
                    type="color"
                    value={folderColor}
                    onChange={(e) => setFolderColor(e.target.value)}
                    className="h-10 w-10 rounded border border-border bg-background"
                  />
                  <span className="text-sm text-muted-foreground">{folderColor}</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="folder-icon" className="mb-2 block text-sm font-medium text-foreground">
                  Icon
                </label>
                <Input
                  id="folder-icon"
                  type="text"
                  placeholder="Folder"
                  value={folderIcon}
                  onChange={(e) => setFolderIcon(e.target.value)}
                  className="border-input bg-background text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-end space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isCreating}
              className="border-border"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!folderName.trim() || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Folder'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
