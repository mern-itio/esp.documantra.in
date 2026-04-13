import React, { useState } from 'react';
import { X, Folder, Move } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export interface FolderData {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/50 p-4 backdrop-blur-xs dark:bg-black/60">
      <div className="max-h-full w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center space-x-2">
            <Move className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
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
              <label htmlFor="folder-search" className="mb-2 block text-sm font-medium text-foreground">
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
              <label className="mb-3 block text-sm font-medium text-foreground">
                Select Destination Folder
              </label>
              
              {/* Move to Root Option */}
              <div className="mb-4">
                <label className="flex cursor-pointer items-center space-x-3 rounded-lg border border-border p-3 hover:bg-accent/50">
                  <input
                    type="radio"
                    name="folder-selection"
                    value="root"
                    checked={selectedFolderId === null}
                    onChange={() => setSelectedFolderId(null)}
                    className="border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <Folder className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Root Level (No Folder)</span>
                      <p className="text-sm text-muted-foreground">Move documents to the main document area</p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Available Folders */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredFolders.length === 0 ? (
                  <div className="py-4 text-center text-muted-foreground">
                    {searchTerm ? 'No folders match your search' : 'No folders available'}
                  </div>
                ) : (
                  filteredFolders.map((folder) => (
                    <label
                      key={folder._id}
                      className="flex cursor-pointer items-center space-x-3 rounded-lg border border-border p-3 hover:bg-accent/50"
                    >
                      <input
                        type="radio"
                        name="folder-selection"
                        value={folder._id}
                        checked={selectedFolderId === folder._id}
                        onChange={() => setSelectedFolderId(folder._id)}
                        className="border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: folder.color }}
                        >
                          <Folder className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-foreground">{folder.name}</span>
                          {folder.description && (
                            <p className="text-sm text-muted-foreground">{folder.description}</p>
                          )}
                          <div className="mt-1 flex items-center space-x-4 text-xs text-muted-foreground">
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
            <div className="rounded-lg border border-primary/25 bg-card p-4 dark:bg-primary/15">
              <div className="flex items-center space-x-2 text-foreground">
                <Move className="h-4 w-4 text-primary" />
                <span className="font-medium">Move Summary</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
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
            >
              {isMoving ? 'Moving...' : `Move ${selectedCount} Document${selectedCount !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
