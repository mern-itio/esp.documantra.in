import React, { useCallback, useState } from 'react';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { useDocumentStore } from '../../common/store/documentStore';
import { formatFileSize } from '../../common/lib/utils';
import { DuplicateFilenameModal } from './DuplicateFilenameModal';
import { documentAPI } from '../../../services/api';
import { useNavigate } from 'react-router-dom';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPPORTED_TYPES = [
  'pdf', 'doc', 'docx', 'txt'
];

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const { uploadFiles, userPermissions, currentFolderId } = useDocumentStore();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Get subscription plan from localStorage
  const [subscriptionPlan, setSubscriptionPlan] = useState<any>(null);
  
  React.useEffect(() => {
    const storedPlan = localStorage.getItem('userSubscriptionPlan');
    if (storedPlan) {
      setSubscriptionPlan(JSON.parse(storedPlan));
    }
  }, [isOpen]);

  // Update plan when localStorage changes
  React.useEffect(() => {
    const handleStorageChange = () => {
      const storedPlan = localStorage.getItem('userSubscriptionPlan');
      if (storedPlan) {
        setSubscriptionPlan(JSON.parse(storedPlan));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen for our custom event
    window.addEventListener('subscription-plan-updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('subscription-plan-updated', handleStorageChange);
    };
  }, []);

  // Duplicate filename handling
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateFile, setDuplicateFile] = useState<File | null>(null);
  const [existingDocument, setExistingDocument] = useState<any>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(files);
    setUploadError(null); // Clear any previous errors
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      setUploadError(null); // Clear any previous errors
    }
  };

  const validateFiles = (files: File[]) => {
    const errors: string[] = [];

    files.forEach((file, index) => {
      const extension = file.name.split('.').pop()?.toLowerCase() || '';

      if (!SUPPORTED_TYPES.includes(extension)) {
        errors.push(`File ${index + 1}: Unsupported file type (.${extension})`);
      }

      if (userPermissions.uploadLimit !== -1 && file.size > userPermissions.uploadLimit) {
        errors.push(`File ${index + 1}: File size exceeds limit (${formatFileSize(userPermissions.uploadLimit)})`);
      }
    });

    return errors;
  };

  const checkForDuplicates = async (files: File[]) => {
    for (const file of files) {
      try {
        const response = await documentAPI.checkDuplicateFilename(file.name, currentFolderId || undefined);
        if (response.success && response.isDuplicate) {
          setDuplicateFile(file);
          setExistingDocument(response.data.existingDocument);
          setShowDuplicateModal(true);
          return true; // Found a duplicate
        }
      } catch (error) {
        console.error('Error checking for duplicates:', error);
        // Continue with upload if duplicate check fails
      }
    }
    return false; // No duplicates found
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    const errors = validateFiles(selectedFiles);
    if (errors.length > 0) {
      setUploadError(errors.join('\n'));
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      // Check for duplicates before uploading
      const hasDuplicates = await checkForDuplicates(selectedFiles);
      if (hasDuplicates) {
        setIsUploading(false);
        return; // Wait for user to resolve duplicates
      }

      // Upload files one by one to handle individual duplicates
      for (const file of selectedFiles) {
        try {
          await uploadFiles([file], currentFolderId || undefined);
        } catch (error: any) {
          // Handle duplicate filename error from backend
          if (error.code === 'DUPLICATE_FILENAME' && error.data?.existingDocument) {
            setDuplicateFile(file);
            setExistingDocument(error.data.existingDocument);
            setShowDuplicateModal(true);
            setIsUploading(false);
            return;
          }
          // Handle insufficient credits error - throw to outer handler
          if (error.message === 'Insufficient credits' || error.response?.status === 402) {
            throw error;
          }
          throw error; // Re-throw other errors
        }
      }

      // Clear selected files and close modal on success
      setSelectedFiles([]);
      onClose();
      navigate(`/all-documents`);
    } catch (error: any) {
      console.error('❌ Upload failed:', error);
      console.error('🔍 Error message:', error.message);
      console.error('🔍 Error response:', error.response);
      
      // Handle insufficient credits error specifically
      if (error.message === 'Insufficient credits' || error.response?.status === 402) {
        console.log('💰 Handling insufficient credits error!');
        const required = error.response?.data?.required || 'N/A';
        const balance = error.response?.data?.creditsBalance || 'N/A';
        console.log('Setting upload error message');
        setUploadError(`Insufficient credits! Required: ${required}, You have: ${balance}. Please upgrade your plan to continue.`);
      } else if (error.code === 'DUPLICATE_FILENAME') {
        // Already handled above
      } else {
        setUploadError(error.message || 'Upload failed. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
    setUploadError(null); // Clear error when files change
  };

  const handleDuplicateResolve = async (newFilename: string) => {
    if (!duplicateFile) return;

    // Create a new File object with the new name
    const renamedFile = new File([duplicateFile], newFilename, {
      type: duplicateFile.type,
      lastModified: duplicateFile.lastModified,
    });

    // Replace the duplicate file with the renamed one
    setSelectedFiles(files =>
      files.map(file => file === duplicateFile ? renamedFile : file)
    );

    // Reset duplicate state
    setDuplicateFile(null);
    setExistingDocument(null);
    setShowDuplicateModal(false);

    // Continue with upload directly without duplicate check
    try {
      setIsUploading(true);
      setUploadError(null);

      await uploadFiles([renamedFile], currentFolderId || undefined);

      // Clear selected files and close modal on success
      setSelectedFiles([]);
      onClose();
    } catch (error: any) {
      console.error('Upload failed:', error);
      
      // Handle insufficient credits error specifically
      if (error.message === 'Insufficient credits' || error.response?.status === 402) {
        const required = error.response?.data?.required || 'N/A';
        const balance = error.response?.data?.creditsBalance || 'N/A';
        setUploadError(`Insufficient credits! Required: ${required}, You have: ${balance}. Please upgrade your plan to continue.`);
      } else {
        setUploadError(error.message || 'Upload failed. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDuplicateCancel = () => {
    setDuplicateFile(null);
    setExistingDocument(null);
    setShowDuplicateModal(false);
    setIsUploading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-full overflow-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Upload Documents</h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onClose}
            disabled={isUploading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-2">
          {/* Single-line Credits Info */}
          {subscriptionPlan && (() => {
            const creditsBalance = subscriptionPlan.creditsBalance ?? 0;
            const costPerUpload = subscriptionPlan.documentCosts?.credits ?? 0;
            const fileCount = Math.max(1, selectedFiles.length || 0);
            const totalCost = costPerUpload * fileCount;
            const balanceAfterUpload = creditsBalance - totalCost;
            const isNegative = balanceAfterUpload < 0;
            
            return (
              <div className={`mb-3 px-3 py-2 rounded-lg text-sm flex items-center justify-between ${
                isNegative 
                  ? 'bg-red-50 border border-red-200 text-red-800' 
                  : 'bg-green-50 border border-green-200 text-green-800'
              }`}>
                <div className="flex items-center gap-3">
                  <span><span className="font-medium">Credits:</span> {creditsBalance}</span>
                  <span>•</span>
                  <span><span className="font-medium">Cost per upload:</span> {costPerUpload}</span>
                  <span>•</span>
                  <span>
                    <span className="font-medium">After upload:</span>{' '}
                    {isNegative ? (
                      <span className="text-red-600 font-semibold">
                        {balanceAfterUpload} ({Math.abs(balanceAfterUpload)} credits required)
                      </span>
                    ) : (
                      balanceAfterUpload
                    )}
                  </span>
                </div>
              </div>
            );
          })()}
          {/* Upload Limits Info */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <div className="text-sm text-blue-800">
                <p>
                  Upload limit: {userPermissions.uploadLimit === -1
                    ? 'Unlimited'
                    : formatFileSize(userPermissions.uploadLimit)} per file
                </p>
                <p className="text-xs mt-1">
                  Supported: PDF, Word, Text files
                </p>
              </div>
            </div>
          </div>

          {/* Credit Balance Info (replaced by single-line banner above) */}

          {/* Error Display */}
          {uploadError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <div className="text-sm text-red-800">
                  <p className="font-medium">Upload Error:</p>
                  <p className="text-xs mt-1 whitespace-pre-line">{uploadError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
              }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Drop files here or click to browse
            </h3>
            <p className="text-gray-500 mb-4">
              Select multiple files to upload them all at once
            </p>
            <input
              type="file"
              multiple
              accept={SUPPORTED_TYPES.map(type => `.${type}`).join(',')}
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="file-upload"
              className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              Browse Files
            </label>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Selected Files ({selectedFiles.length})
              </h4>
              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {selectedFiles.length > 0 && (
              <>Total: {formatFileSize(selectedFiles.reduce((total, file) => total + file.size, 0))}</>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isUploading || !!uploadError}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Duplicate Filename Modal */}
      {showDuplicateModal && duplicateFile && existingDocument && (
        <DuplicateFilenameModal
          isOpen={showDuplicateModal}
          onClose={handleDuplicateCancel}
          duplicateFile={duplicateFile}
          existingDocument={existingDocument}
          folderId={currentFolderId || undefined}
          onResolve={handleDuplicateResolve}
        />
      )}
    </div>
  );
}