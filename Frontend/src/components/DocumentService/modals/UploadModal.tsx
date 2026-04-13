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

/** Narrow shape for errors thrown from upload / API during upload */
type UploadFlowError = {
  code?: string;
  message?: string;
  data?: { existingDocument?: { id: string; name: string; uploadedAt: string } };
  response?: { status?: number; data?: { required?: unknown; creditsBalance?: unknown } };
};

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const { uploadFiles, userPermissions, currentFolderId } = useDocumentStore();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Get subscription plan from localStorage
  const [subscriptionPlan, setSubscriptionPlan] = useState<Record<string, unknown> | null>(null);
  
  React.useEffect(() => {
    const storedPlan = localStorage.getItem('userSubscriptionPlan');
    if (storedPlan) {
      setSubscriptionPlan(JSON.parse(storedPlan) as Record<string, unknown>);
    }
  }, [isOpen]);

  // Update plan when localStorage changes
  React.useEffect(() => {
    const handleStorageChange = () => {
      const storedPlan = localStorage.getItem('userSubscriptionPlan');
      if (storedPlan) {
        setSubscriptionPlan(JSON.parse(storedPlan) as Record<string, unknown>);
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
  const [existingDocument, setExistingDocument] = useState<{
    id: string;
    name: string;
    uploadedAt: string;
  } | null>(null);

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
        } catch (error: unknown) {
          const err = error as UploadFlowError;
          if (err.code === 'DUPLICATE_FILENAME' && err.data?.existingDocument) {
            setDuplicateFile(file);
            setExistingDocument(err.data.existingDocument);
            setShowDuplicateModal(true);
            setIsUploading(false);
            return;
          }
          if (err.message === 'Insufficient credits' || err.response?.status === 402) {
            throw error;
          }
          throw error;
        }
      }

      // Clear selected files and close modal on success
      setSelectedFiles([]);
      onClose();
      navigate(`/all-documents`);
    } catch (error: unknown) {
      const err = error as UploadFlowError;
      console.error('❌ Upload failed:', error);
      console.error('🔍 Error message:', err.message);
      console.error('🔍 Error response:', err.response);
      
      if (err.message === 'Insufficient credits' || err.response?.status === 402) {
        console.log('💰 Handling insufficient credits error!');
        const required = err.response?.data?.required ?? 'N/A';
        const balance = err.response?.data?.creditsBalance ?? 'N/A';
        console.log('Setting upload error message');
        setUploadError(`Insufficient credits! Required: ${required}, You have: ${balance}. Please upgrade your plan to continue.`);
      } else if (err.code === 'DUPLICATE_FILENAME') {
        // Already handled above
      } else {
        setUploadError(err.message || 'Upload failed. Please try again.');
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
    } catch (error: unknown) {
      const err = error as UploadFlowError;
      console.error('Upload failed:', error);
      
      if (err.message === 'Insufficient credits' || err.response?.status === 402) {
        const required = err.response?.data?.required ?? 'N/A';
        const balance = err.response?.data?.creditsBalance ?? 'N/A';
        setUploadError(`Insufficient credits! Required: ${required}, You have: ${balance}. Please upgrade your plan to continue.`);
      } else {
        setUploadError(err.message || 'Upload failed. Please try again.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs dark:bg-black/60">
      <div className="max-h-full w-full max-w-2xl overflow-auto rounded-lg border border-border bg-card text-card-foreground shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Upload Documents</h2>
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
            const creditsBalance = Number(subscriptionPlan.creditsBalance ?? 0);
            const docCosts = subscriptionPlan.documentCosts as Record<string, unknown> | undefined;
            const costPerUpload = Number(docCosts?.credits ?? 0);
            const fileCount = Math.max(1, selectedFiles.length || 0);
            const totalCost = costPerUpload * fileCount;
            const balanceAfterUpload = creditsBalance - totalCost;
            const isNegative = balanceAfterUpload < 0;
            
            return (
              <div
                className={`mb-3 flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                  isNegative
                    ? 'border-destructive/30 bg-destructive/10 text-destructive dark:text-red-200'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span><span className="font-medium">Credits:</span> {creditsBalance}</span>
                  <span>•</span>
                  <span><span className="font-medium">Cost per upload:</span> {costPerUpload}</span>
                  <span>•</span>
                  <span>
                    <span className="font-medium">After upload:</span>{' '}
                    {isNegative ? (
                      <span className="font-semibold text-destructive">
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
          <div className="mb-4 rounded-lg border border-primary/25 bg-primary/10 p-3 dark:bg-primary/15">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              <div className="text-sm text-foreground">
                <p>
                  Upload limit: {userPermissions.uploadLimit === -1
                    ? 'Unlimited'
                    : formatFileSize(userPermissions.uploadLimit)} per file
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Supported: PDF, Word, Text files
                </p>
              </div>
            </div>
          </div>

          {/* Credit Balance Info (replaced by single-line banner above) */}

          {/* Error Display */}
          {uploadError && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 dark:bg-destructive/20">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <div className="text-sm text-destructive">
                  <p className="font-medium">Upload Error:</p>
                  <p className="text-xs mt-1 whitespace-pre-line">{uploadError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Drop Zone */}
          <div
            className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/10 dark:bg-primary/15'
                : 'border-border hover:border-muted-foreground/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium text-foreground">
              Drop files here or click to browse
            </h3>
            <p className="mb-4 text-muted-foreground">
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
              <h4 className="mb-2 text-sm font-medium text-foreground">
                Selected Files ({selectedFiles.length})
              </h4>
              <div className="max-h-32 overflow-y-auto rounded-lg border border-border">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-border p-3 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
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
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <div className="text-sm text-muted-foreground">
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
            >
              {isUploading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
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