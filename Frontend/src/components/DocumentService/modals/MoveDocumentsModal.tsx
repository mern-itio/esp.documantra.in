import React, { useState } from 'react';
import { X, Folder, Move } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface FolderData {
  _id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  documentCount: number;
  folderCount: number;
  totalSize: number;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  modifiedAt: string;
  ownerId: string;
  parentId?: string;
  path: string;
}

interface MoveDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (targetFolderId: string | null) => Promise<void>;
  selectedCount: number;
  availableFolders: FolderData[];
}

export function MoveDocumentsModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  selectedCount, 
  availableFolders 
}: MoveDocumentsModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isMoving) return;

    setIsMoving(true);
    try {
      await onSubmit(selectedFolderId);
    } finally {
      setIsMoving(false);
    }
  };

  const handleClose = () => {
    setSelectedFolderId(null);
    setSearchTerm('');
    onClose();
  };

  const filteredFolders = availableFolders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    folder.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed overflow-auto inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Move className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Move {selectedCount} Document{selectedCount !== 1 ? 's' : ''}
            </h2>
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
        <div className="p-6">
          <div className="space-y-4">
            {/* Search */}
            <div>
              <label htmlFor="folder-search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Folders
              </label>
              <div className="relative">
                <Input
                  id="folder-search"
                  type="text"
                  placeholder="Search folders by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Folder Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Destination Folder
              </label>
              
              {/* Move to Root Option */}
              <div className="mb-4">
                <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="folder-selection"
                    value="root"
                    checked={selectedFolderId === null}
                    onChange={() => setSelectedFolderId(null)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Folder className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Root Level (No Folder)</span>
                      <p className="text-sm text-gray-500">Move documents to the main document area</p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Available Folders */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredFolders.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    {searchTerm ? 'No folders match your search' : 'No folders available'}
                  </div>
                ) : (
                  filteredFolders.map((folder) => (
                    <label
                      key={folder._id}
                      className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="folder-selection"
                        value={folder._id}
                        checked={selectedFolderId === folder._id}
                        onChange={() => setSelectedFolderId(folder._id)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: folder.color }}
                        >
                          <Folder className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">{folder.name}</span>
                          {folder.description && (
                            <p className="text-sm text-gray-500">{folder.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-400">
                            <span>{folder.documentCount} documents</span>
                            <span>{folder.folderCount} subfolders</span>
                            <span>{folder.totalSize > 0 ? `${(folder.totalSize / 1024 / 1024).toFixed(1)} MB` : '0 B'}</span>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-blue-800">
                <Move className="h-4 w-4" />
                <span className="font-medium">Move Summary</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                {selectedCount} document{selectedCount !== 1 ? 's' : ''} will be moved to{' '}
                {selectedFolderId === null ? (
                  'the root level'
                ) : (
                  <span className="font-medium">
                    {availableFolders.find(f => f._id === selectedFolderId)?.name}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isMoving}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              onClick={handleSubmit}
              disabled={isMoving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isMoving ? 'Moving...' : `Move ${selectedCount} Document${selectedCount !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
