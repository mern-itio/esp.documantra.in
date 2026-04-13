import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FiUpload, FiEye, FiLock, FiCheck, FiX } from 'react-icons/fi';
import { setPermissionsService } from '../../services/setPermissionsService';
import type { SetPermissionsRequest, SetPermissionsResponse, CurrentPermissionsResponse } from '../../types/setPermissions';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface SetPermissionsProps {
  onPermissionsResult?: (result: SetPermissionsResponse) => void;
}

const SetPermissions: React.FC<SetPermissionsProps> = ({ onPermissionsResult }) => {
  const location = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [result, setResult] = useState<SetPermissionsResponse | null>(null);
  const [currentPermissions, setCurrentPermissions] = useState<CurrentPermissionsResponse | null>(null);
  const [showSuccessArea, setShowSuccessArea] = useState(false);
  // const [showAdvanced, setShowAdvanced] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Permission states
  const [permissions, setPermissions] = useState<SetPermissionsRequest>({
    allowPrint: true,
    allowCopy: true,
    allowModify: true,
    allowAnnotate: true,
    allowFillForms: true,
    allowExtractContent: true,
    allowAssemble: true,
    allowHighQualityPrint: true,
    password: '',
    ownerPassword: ''
  });

  // Handle file upload
  const handleFileUpload = useCallback((file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a valid PDF file');
      return;
    }
    setSelectedFile(file);
    setResult(null);
    setCurrentPermissions(null);
  }, []);

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  // Handle file input
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  }, [handleFileUpload]);

  // Analyze current permissions
  const handleAnalyzePermissions = useCallback(async () => {
    if (!selectedFile) return;

    setAnalyzing(true);
    try {
      const response = await setPermissionsService.getCurrentPermissions(selectedFile);
      setCurrentPermissions(response);
    } catch (error) {
      console.error('Error analyzing permissions:', error);
      alert('Failed to analyze current permissions');
    } finally {
      setAnalyzing(false);
    }
  }, [selectedFile]);

  // Set permissions
  const handleSetPermissions = useCallback(async () => {
    if (!selectedFile) return;

    setProcessing(true);
    try {
      const response = await setPermissionsService.setPermissions(selectedFile, permissions);
      setResult(response);
      setShowSuccessArea(true);
      if (onPermissionsResult) {
        onPermissionsResult(response);
      }
    } catch (error) {
      console.error('Error setting permissions:', error);
      alert('Failed to set permissions');
    } finally {
      setProcessing(false);
    }
  }, [selectedFile, permissions, onPermissionsResult]);
  const [viewEnabled, setViewEnabled] = useState(false);
  const [countdown, setCountdown] = useState(7);

  useEffect(() => {
    if (result) {
      setViewEnabled(false);
      setCountdown(7);

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setViewEnabled(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [result]);
  // Open secure PDF in new tab
  const handleOpenSecurePDF = useCallback(async () => {
    if (!result || !viewEnabled) return; // prevent click before 7s

    try {
      await setPermissionsService.openSecurePDF(result.secureViewLink);
    } catch (error) {
      console.error('Error opening secure PDF:', error);
      alert('Failed to open secure PDF');
    }
  }, [result, viewEnabled]);

  // Update permission
  const updatePermission = useCallback((key: keyof SetPermissionsRequest, value: boolean | string) => {
    setPermissions(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Quick permission presets
  const applyPreset = useCallback((preset: string) => {
    switch (preset) {
      case 'view-only':
        setPermissions({
          ...permissions,
          allowPrint: false,
          allowCopy: false,
          allowModify: false,
          allowAnnotate: false,
          allowFillForms: false,
          allowExtractContent: false,
          allowAssemble: false,
          allowHighQualityPrint: false
        });
        break;
      case 'print-only':
        setPermissions({
          ...permissions,
          allowPrint: true,
          allowCopy: false,
          allowModify: false,
          allowAnnotate: false,
          allowFillForms: false,
          allowExtractContent: false,
          allowAssemble: false,
          allowHighQualityPrint: true
        });
        break;
      case 'fill-forms':
        setPermissions({
          ...permissions,
          allowPrint: true,
          allowCopy: false,
          allowModify: false,
          allowAnnotate: true,
          allowFillForms: true,
          allowExtractContent: false,
          allowAssemble: false,
          allowHighQualityPrint: true
        });
        break;
      case 'full-access':
        setPermissions({
          ...permissions,
          allowPrint: true,
          allowCopy: true,
          allowModify: true,
          allowAnnotate: true,
          allowFillForms: true,
          allowExtractContent: true,
          allowAssemble: true,
          allowHighQualityPrint: true
        });
        break;
    }
  }, [permissions]);

  // Custom Success Area
  if (showSuccessArea && result) {
    return (
      <div className="mx-auto min-h-full w-full space-y-6 bg-background p-2 text-foreground">
        <div className="border-b border-border bg-background shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-6">
              <Link
                to={`/pdf-tools${location.search}`}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Set Permissions</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Control document permissions and access
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Success Area */}
        <div className="mx-auto w-full max-w-4xl">
          <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 p-8 dark:border-emerald-800 dark:from-emerald-950/40 dark:via-green-950/35 dark:to-teal-950/40">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/20 dark:bg-success/30">
                <FiCheck className="h-10 w-10 text-success" />
              </div>
              <h3 className="mb-3 text-3xl font-bold text-foreground">
                Permissions Set Successfully!
              </h3>
              <p className="mb-8 text-lg text-muted-foreground">
                Your PDF permissions have been configured and the document is ready for download.
              </p>
              
              {/* File Info Card */}
              <div className="mb-8 rounded-lg border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10 dark:bg-success/20">
                    <FiLock className="h-6 w-6 text-success" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-lg font-semibold text-foreground">{result.filename}</h4>
                    <p className="text-sm text-muted-foreground">
                      {result.fileSize} • {result.permissions.isPasswordProtected ? 'Password Protected' : 'Not Password Protected'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleOpenSecurePDF}
                  disabled={!viewEnabled}
                  className={`flex items-center justify-center space-x-2 rounded-lg px-6 py-3 text-base font-medium shadow-md transition-colors ${
                    viewEnabled
                      ? 'bg-success text-success-foreground hover:bg-success/90'
                      : 'cursor-not-allowed bg-muted text-muted-foreground'
                  }`}
                >
                  {!viewEnabled && (
                    <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-muted-foreground"></div>
                  )}
                  <FiEye className="w-5 h-5" />
                  <span>
                    {viewEnabled
                      ? 'View Secure PDF'
                      : `Your file is getting ready... (${countdown}s)`}
                  </span>
                </button>
                
                <button
                  onClick={() => setShowSuccessArea(false)}
                  className="flex items-center justify-center space-x-2 rounded-lg bg-muted px-6 py-3 text-base font-medium text-muted-foreground shadow-md transition-colors hover:bg-muted/80"
                >
                  <FiX className="w-5 h-5" />
                  <span>Back to Configuration</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowSuccessArea(false);
                    setResult(null);
                    setSelectedFile(null);
                    setCurrentPermissions(null);
                  }}
                  className="flex items-center justify-center space-x-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
                >
                  <FiUpload className="w-5 h-5" />
                  <span>Start New</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-full w-full space-y-6 bg-background p-2 text-foreground">
      <div className="border-b border-border bg-background shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              to={`/pdf-tools${location.search}`}
              className="rounded-lg p-2 transition-colors hover:bg-muted/80"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Set Permissions</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Control document permissions and access
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* File Upload Section */}
      {!selectedFile && (
        <div
          className={`rounded-xl border-2 border-dashed p-12 text-center transition-all duration-200 ${dragActive
            ? 'border-primary bg-primary/15 dark:bg-primary/25'
            : 'border-border hover:border-muted-foreground/40 hover:bg-muted/30 dark:hover:bg-muted/20'
            }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <FiUpload className="mx-auto mb-6 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-4 text-2xl font-semibold text-foreground">
            Drop your PDF here or click to browse
          </h3>
          <p className="mb-6 text-lg text-muted-foreground">
            Upload a PDF to set permissions and access controls
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg bg-primary px-8 py-3 text-lg font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Choose PDF File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      )}

      {/* Permissions Control Section */}
      {selectedFile && (
        <div className="space-y-6">
          {/* File Info */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <FiLock className="h-8 w-8 text-success" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{selectedFile.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleAnalyzePermissions}
                  disabled={analyzing}
                  className="flex items-center space-x-2 rounded-lg bg-muted px-4 py-2 text-foreground transition-colors hover:bg-muted/80"
                >
                  <FiEye className="w-4 h-4" />
                  <span>{analyzing ? 'Analyzing...' : 'Analyze Current'}</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setResult(null);
                    setCurrentPermissions(null);
                  }}
                  className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg hover:bg-destructive/80 transition-colors flex items-center space-x-2"
                >
                  <FiX className="w-4 h-4" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>

          {/* Current Permissions Display */}
          {currentPermissions && (
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-6 dark:border-primary/40 dark:bg-primary/15">
              <h4 className="text-lg font-semibold text-primary mb-4 flex items-center">
                <FiEye className="w-5 h-5 mr-2" />
                Current Permissions
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(currentPermissions.permissions.permissions).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    {value ? (
                      <FiCheck className="h-4 w-4 text-success" />
                    ) : (
                      <FiX className="h-4 w-4 text-destructive" />
                    )}
                    <span className="text-sm text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-sm text-primary">
                <p>Encryption: {currentPermissions.permissions.encryptionLevel}</p>
                <p>Password Protected: {currentPermissions.permissions.isPasswordProtected ? 'Yes' : 'No'}</p>
                <p>Owner Protected: {currentPermissions.permissions.isOwnerProtected ? 'Yes' : 'No'}</p>
              </div>
            </div>
          )}

          {/* Permission Presets */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h4 className="mb-4 text-lg font-semibold text-foreground">Quick Presets</h4>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <button
                onClick={() => applyPreset('view-only')}
                className="rounded-lg bg-muted px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted/80"
              >
                View Only
              </button>
              <button
                onClick={() => applyPreset('print-only')}
                className="rounded-lg bg-muted px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted/80"
              >
                Print Only
              </button>
              <button
                onClick={() => applyPreset('fill-forms')}
                className="rounded-lg bg-muted px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted/80"
              >
                Fill Forms
              </button>
              <button
                onClick={() => applyPreset('full-access')}
                className="rounded-lg bg-primary/15 px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/25 dark:bg-primary/20 dark:hover:bg-primary/30"
              >
                Full Access
              </button>
            </div>
          </div>

          {/* Granular Permissions */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-foreground">Granular Permissions</h4>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Permissions */}
              <div className="space-y-4">
                <h5 className="font-medium text-muted-foreground">Basic Access</h5>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={permissions.allowPrint}
                    onChange={(e) => updatePermission('allowPrint', e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                  />
                  <span className="text-muted-foreground">Allow Printing</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={permissions.allowCopy}
                    onChange={(e) => updatePermission('allowCopy', e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                  />
                  <span className="text-muted-foreground">Allow Copying</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={permissions.allowModify}
                    onChange={(e) => updatePermission('allowModify', e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                  />
                  <span className="text-muted-foreground">Allow Modification</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={permissions.allowAnnotate}
                    onChange={(e) => updatePermission('allowAnnotate', e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                  />
                  <span className="text-muted-foreground">Allow Annotations</span>
                </label>
              </div>

              {/* Advanced Permissions */}
              <div className="space-y-4">
                <h5 className="font-medium text-muted-foreground">Advanced Features</h5>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={permissions.allowFillForms}
                    onChange={(e) => updatePermission('allowFillForms', e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                  />
                  <span className="text-muted-foreground">Allow Form Filling</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={permissions.allowExtractContent}
                    onChange={(e) => updatePermission('allowExtractContent', e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                  />
                  <span className="text-muted-foreground">Allow Content Extraction</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={permissions.allowAssemble}
                    onChange={(e) => updatePermission('allowAssemble', e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                  />
                  <span className="text-muted-foreground">Allow Assembly</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={permissions.allowHighQualityPrint}
                    onChange={(e) => updatePermission('allowHighQualityPrint', e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                  />
                  <span className="text-muted-foreground">Allow High-Quality Print</span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleSetPermissions}
              disabled={processing}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium text-lg hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {processing ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary-foreground"></div>
                  <span>Setting Permissions...</span>
                </>
              ) : (
                <>
                  <FiLock className="w-5 h-5" />
                  <span>Set Permissions</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="rounded-lg border border-success/30 bg-success/10 p-6 dark:border-success/40 dark:bg-success/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiCheck className="h-8 w-8 shrink-0 text-success" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">Permissions Set Successfully!</h3>
                <p className="text-muted-foreground">{result.message}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleOpenSecurePDF}
                disabled={!viewEnabled}
                className={`flex items-center space-x-2 rounded-lg px-6 py-2 transition-colors ${viewEnabled
                    ? 'bg-success text-success-foreground hover:bg-success/90'
                    : 'cursor-not-allowed bg-muted text-muted-foreground'
                  }`}
              >
                {!viewEnabled && (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-muted-foreground"></div>
                )}
                <FiEye className="h-4 w-4" />
                <span className="text-xs">
                  {viewEnabled
                    ? 'View Secure PDF'
                    : `Your file is getting ready... (${countdown}s)`}
                </span>
              </button>            
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-sm">
              <span className="font-medium text-foreground">File:</span>
              <p className="text-muted-foreground">{result.filename}</p>
            </div>
            <div className="text-sm">
              <span className="font-medium text-foreground">Size:</span>
              <p className="text-muted-foreground">{result.fileSize}</p>
            </div>
            <div className="text-sm">
              <span className="font-medium text-foreground">Password Protected:</span>
              <p className="text-muted-foreground">{result.permissions.isPasswordProtected ? 'Yes' : 'No'}</p>
            </div>
            <div className="text-sm">
              <span className="font-medium text-foreground">Owner Protected:</span>
              <p className="text-muted-foreground">{result.permissions.isOwnerProtected ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SetPermissions;
