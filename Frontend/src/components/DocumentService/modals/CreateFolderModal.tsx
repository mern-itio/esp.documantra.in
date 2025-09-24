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
    } catch (error: any) {
      console.error('Error creating folder:', error);
      setError(error.message || 'Failed to create folder. Please try again.');
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
            {parentFolderName && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  Creating folder in: <span className="font-medium">{parentFolderName}</span>
                </p>
              </div>
            )}

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

            <div>
              <label htmlFor="folder-description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <Input
                id="folder-description"
                type="text"
                placeholder="Enter folder description..."
                value={folderDescription}
                onChange={(e) => setFolderDescription(e.target.value)}
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
                <Input
                  id="folder-icon"
                  type="text"
                  placeholder="Folder"
                  value={folderIcon}
                  onChange={(e) => setFolderIcon(e.target.value)}
                />
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