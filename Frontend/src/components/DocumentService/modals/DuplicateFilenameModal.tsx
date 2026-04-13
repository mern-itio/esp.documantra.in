import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { documentAPI } from '../../../services/api';

interface DuplicateFilenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicateFile: File;
  existingDocument: {
    id: string;
    name: string;
    uploadedAt: string;
  };
  folderId?: string;
  onResolve: (newFilename: string) => void;
}

export function DuplicateFilenameModal({ 
  isOpen, 
  onClose, 
  duplicateFile, 
  existingDocument, 
  folderId,
  onResolve 
}: DuplicateFilenameModalProps) {
  const [newFilename, setNewFilename] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && duplicateFile) {
      // Generate a new filename with timestamp
      const fileExtension = duplicateFile.name.split('.').pop();
      const fileNameWithoutExt = duplicateFile.name.replace(`.${fileExtension}`, '');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      setNewFilename(`${fileNameWithoutExt}_${timestamp}.${fileExtension}`);
    }
  }, [isOpen, duplicateFile]);

  const handleFilenameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const fileExtension = duplicateFile.name.split('.').pop();
    
    // Ensure the file extension is preserved
    let newName = inputValue;
    if (!newName.endsWith(`.${fileExtension}`)) {
      newName = `${newName}.${fileExtension}`;
    }
    
    setNewFilename(newName);
    setError(null);
  };

  const generateUniqueFilename = () => {
    const fileExtension = duplicateFile.name.split('.').pop();
    const fileNameWithoutExt = duplicateFile.name.replace(`.${fileExtension}`, '');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    setNewFilename(`${fileNameWithoutExt}_${timestamp}_${randomSuffix}.${fileExtension}`);
  };

  const checkDuplicate = async (filename: string) => {
    try {
      setIsChecking(true);
      setError(null);
      
      // If the filename is the same as the original, it's not a duplicate for our purposes
      if (filename === duplicateFile.name) {
        return true;
      }
      
      const response = await documentAPI.checkDuplicateFilename(filename, folderId);
      
      if (response.success && response.isDuplicate) {
        setError('This filename is also taken. Please choose a different name.');
        return false;
      }
      
      return true;
    } catch (error: unknown) {
      console.error('Error checking duplicate:', error);
      setError('Failed to check filename availability. Please try again.');
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  const handleResolve = async () => {
    if (!newFilename.trim()) {
      setError('Please enter a filename');
      return;
    }

    // Check if the new filename is also a duplicate
    const isAvailable = await checkDuplicate(newFilename);
    if (!isAvailable) {
      return;
    }

    try {
      setIsResolving(true);
      setError(null);
      
      // Call the parent's resolve function
      onResolve(newFilename);
      onClose();
    } catch (error: unknown) {
      console.error('Error resolving duplicate:', error);
      setError('Failed to resolve duplicate filename. Please try again.');
    } finally {
      setIsResolving(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs dark:bg-black/60">
      <div className="max-h-full w-full max-w-md overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400" />
            <h2 className="text-lg font-semibold text-foreground">Duplicate Filename Detected</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleCancel}
            disabled={isResolving}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning Message */}
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 dark:bg-amber-950/30">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <div className="text-sm text-amber-950 dark:text-amber-100">
                <p className="font-medium">A document with this name already exists in this folder.</p>
              </div>
            </div>
          </div>

          {/* File Information */}
          <div className="mb-4 rounded-lg border border-border bg-muted/50 p-3">
            <div className="mb-2 flex items-center space-x-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">File to Upload:</span>
            </div>
            <p className="ml-7 text-sm text-foreground">{duplicateFile.name}</p>
            <p className="ml-7 text-xs text-muted-foreground">
              Size: {(duplicateFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          {/* Existing Document Information */}
          <div className="mb-4 rounded-lg border border-primary/25 bg-primary/10 p-3 dark:bg-primary/15">
            <div className="mb-2 flex items-center space-x-3">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Existing Document:</span>
            </div>
            <p className="ml-7 text-sm text-foreground">{existingDocument.name}</p>
            <p className="ml-7 text-xs text-muted-foreground">
              Uploaded: {new Date(existingDocument.uploadedAt).toLocaleDateString()}
            </p>
          </div>

          {/* New Filename Input */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-foreground">
              New Filename
            </label>
            <div className="relative">
              <input
                type="text"
                value={newFilename}
                onChange={handleFilenameChange}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter new filename"
                disabled={isResolving}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                The file extension will be preserved automatically
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateUniqueFilename}
                disabled={isResolving}
                className="text-xs h-7 px-2"
              >
                Generate Unique Name
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 dark:bg-destructive/20">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <div className="text-sm text-destructive">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isResolving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleResolve}
            disabled={isResolving || isChecking || !newFilename.trim()}
          >
            {isResolving ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Resolving...
              </>
            ) : (
              'Use New Name'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
