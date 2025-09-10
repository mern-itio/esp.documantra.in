import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, FileText, Edit3 } from 'lucide-react';
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900">Duplicate Filename Detected</h2>
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
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <div className="text-sm text-orange-800">
                <p className="font-medium">A document with this name already exists in this folder.</p>
              </div>
            </div>
          </div>

          {/* File Information */}
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">File to Upload:</span>
            </div>
            <p className="text-sm text-gray-700 ml-7">{duplicateFile.name}</p>
            <p className="text-xs text-gray-500 ml-7">
              Size: {(duplicateFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          {/* Existing Document Information */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Existing Document:</span>
            </div>
            <p className="text-sm text-blue-700 ml-7">{existingDocument.name}</p>
            <p className="text-xs text-blue-500 ml-7">
              Uploaded: {new Date(existingDocument.uploadedAt).toLocaleDateString()}
            </p>
          </div>

          {/* New Filename Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Filename
            </label>
            <div className="relative">
              <input
                type="text"
                value={newFilename}
                onChange={handleFilenameChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                placeholder="Enter new filename"
                disabled={isResolving}
              />
              <Edit3 className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
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
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <div className="text-sm text-red-800">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
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
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isResolving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
