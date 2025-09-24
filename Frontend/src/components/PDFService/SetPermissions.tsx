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

  return (
    <div className="mx-auto p-2 space-y-6">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              to={`/pdf-tools${location.search}`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Set Permissions</h1>
              <p className="mt-2 text-sm text-gray-600">
                Control document permissions and access
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* File Upload Section */}
      {!selectedFile && (
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
            }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <FiUpload className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            Drop your PDF here or click to browse
          </h3>
          <p className="text-gray-600 mb-6 text-lg">
            Upload a PDF to set permissions and access controls
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
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
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <FiLock className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedFile.name}</h3>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleAnalyzePermissions}
                  disabled={analyzing}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
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
                  className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-2"
                >
                  <FiX className="w-4 h-4" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>

          {/* Current Permissions Display */}
          {currentPermissions && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <FiEye className="w-5 h-5 mr-2" />
                Current Permissions
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(currentPermissions.permissions.permissions).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    {value ? (
                      <FiCheck className="w-4 h-4 text-green-600" />
                    ) : (
                      <FiX className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-sm text-blue-800 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-sm text-blue-700">
                <p>Encryption: {currentPermissions.permissions.encryptionLevel}</p>
                <p>Password Protected: {currentPermissions.permissions.isPasswordProtected ? 'Yes' : 'No'}</p>
                <p>Owner Protected: {currentPermissions.permissions.isOwnerProtected ? 'Yes' : 'No'}</p>
              </div>
            </div>
          )}

          {/* Permission Presets */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Presets</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => applyPreset('view-only')}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                View Only
              </button>
              <button
                onClick={() => applyPreset('print-only')}
                className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors text-sm"
              >
                Print Only
              </button>
              <button
                onClick={() => applyPreset('fill-forms')}
                className="bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors text-sm"
              >
                Fill Forms
              </button>
              <button
                onClick={() => applyPreset('full-access')}
                className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors text-sm"
              >
                Full Access
              </button>
            </div>
          </div>

          {/* Granular Permissions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Granular Permissions</h4>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Permissions */}
              <div className="space-y-4">
                <h5 className="font-medium text-gray-700">Basic Access</h5>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={permissions.allowPrint}
                    onChange={(e) => updatePermission('allowPrint', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Allow Printing</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={permissions.allowCopy}
                    onChange={(e) => updatePermission('allowCopy', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Allow Copying</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={permissions.allowModify}
                    onChange={(e) => updatePermission('allowModify', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Allow Modification</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={permissions.allowAnnotate}
                    onChange={(e) => updatePermission('allowAnnotate', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Allow Annotations</span>
                </label>
              </div>

              {/* Advanced Permissions */}
              <div className="space-y-4">
                <h5 className="font-medium text-gray-700">Advanced Features</h5>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={permissions.allowFillForms}
                    onChange={(e) => updatePermission('allowFillForms', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Allow Form Filling</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={permissions.allowExtractContent}
                    onChange={(e) => updatePermission('allowExtractContent', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Allow Content Extraction</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={permissions.allowAssemble}
                    onChange={(e) => updatePermission('allowAssemble', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Allow Assembly</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={permissions.allowHighQualityPrint}
                    onChange={(e) => updatePermission('allowHighQualityPrint', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Allow High-Quality Print</span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleSetPermissions}
              disabled={processing}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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
        <div className="bg-green-50 rounded-lg border border-green-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiCheck className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-900">Permissions Set Successfully!</h3>
                <p className="text-green-700">{result.message}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleOpenSecurePDF}
                disabled={!viewEnabled}
                className={`px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors ${viewEnabled
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}
              >
                {!viewEnabled && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                <FiEye className="w-4 h-4" />
                <span className='text-xs'>
                  {viewEnabled
                    ? 'View Secure PDF'
                    : `Your file is getting ready... (${countdown}s)`}
                </span>
              </button>            
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-sm">
              <span className="font-medium text-green-800">File:</span>
              <p className="text-green-700">{result.filename}</p>
            </div>
            <div className="text-sm">
              <span className="font-medium text-green-800">Size:</span>
              <p className="text-green-700">{result.fileSize}</p>
            </div>
            <div className="text-sm">
              <span className="font-medium text-green-800">Password Protected:</span>
              <p className="text-green-700">{result.permissions.isPasswordProtected ? 'Yes' : 'No'}</p>
            </div>
            <div className="text-sm">
              <span className="font-medium text-green-800">Owner Protected:</span>
              <p className="text-green-700">{result.permissions.isOwnerProtected ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SetPermissions;
