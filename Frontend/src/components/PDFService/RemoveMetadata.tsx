import React, { useState, useRef } from 'react';
import { removeMetadataService } from '../../services/removeMetadataService';
import type {
  RemoveMetadataRequest,
  RemoveMetadataResponse,
  MetadataCheckResponse,
  MetadataCleaningPreset
} from '../../types/removeMetadata';
import { Button } from '../DocumentService/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  Download, 
  EyeOff, 
  Shield, 
  ShieldCheck, 
  ShieldX, 
  ShieldMinus,
  FileText, 
  Settings, 
  RotateCcw, 
  CheckCircle, 
  Info, 
  Trash2,
  Database,
  FileSearch,
  Zap,
  Target,
  X,
} from 'lucide-react';
import SuccessBox from '../common/SuccessBox';

const RemoveMetadata: React.FC = () => {
  const location = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckingMetadata, setIsCheckingMetadata] = useState(false);
  const [metadataCheck, setMetadataCheck] = useState<MetadataCheckResponse | null>(null);
  const [result, setResult] = useState<RemoveMetadataResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [removeMetadataResult, setRemoveMetadataResult] = useState<RemoveMetadataResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'presets' | 'custom' | 'advanced'>('presets');
  const [selectedPreset, setSelectedPreset] = useState<MetadataCleaningPreset | null>(null);
  const [customOptions, setCustomOptions] = useState<Record<string, boolean>>({});
  const [advancedOptions, setAdvancedOptions] = useState<Record<string, boolean>>({});
  // const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cleaningPresets = removeMetadataService.getCleaningPresets();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
      setResult(null);
      setMetadataCheck(null);
      setSuccess(null);
      // Automatically check metadata
      checkMetadata(file);
    } else if (file) {
      setError('Please select a valid PDF file');
    }
  };

  const checkMetadata = async (file: File) => {
    setIsCheckingMetadata(true);
    setError(null);
    
    try {
      const check = await removeMetadataService.checkMetadata(file);
      setMetadataCheck(check);
      
      if (!check.metadataFound) {
        setSuccess('No significant metadata detected in this PDF');
      }
    } catch (err: any) {
      console.error('Metadata check error:', err);
      setError(`Failed to check metadata: ${err.message}`);
    } finally {
      setIsCheckingMetadata(false);
    }
  };

  const handlePresetSelect = (preset: MetadataCleaningPreset) => {
    setSelectedPreset(preset);
    // Convert preset options to the correct format, excluding the 'file' property
    const { file, ...options } = preset.options;
    // Ensure all options are boolean values
    const booleanOptions: Record<string, boolean> = {};
    Object.entries(options).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        booleanOptions[key] = value;
      } else if (typeof value === 'string') {
        booleanOptions[key] = value === 'true';
      } else {
        booleanOptions[key] = !!value;
      }
    });
    
    // console.log('Preset selected:', preset.name);
    // console.log('Preset options:', options);
    // console.log('Converted boolean options:', booleanOptions);
    
    setCustomOptions(booleanOptions);
    setActiveTab('presets');
  };

  const handleCustomOptionChange = (option: string, value: boolean) => {
    setCustomOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  const handleAdvancedOptionChange = (option: string, value: boolean) => {
    setAdvancedOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  const getDefaultAdvancedOptions = (): Record<string, boolean> => ({
    removeDocumentInfo: true,
    removeProducer: true,
    removeCreator: true,
    removeCreationDate: true,
    removeModificationDate: true,
    removeKeywords: true,
    removeSubject: true,
    removeAuthor: true,
    removeTitle: true,
    removeTrapped: true,
    removeXMPMetadata: true,
    removeMetadata: true,
    removeInfo: true
  });

  const handleRemoveMetadata = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file');
      return;
    }

    // Log the current state for debugging
    // console.log('Current customOptions:', customOptions);
    // console.log('Current advancedOptions:', advancedOptions);

    // Merge custom options with advanced options, with advanced options taking precedence
    const mergedOptions = { ...customOptions, ...advancedOptions };
    
    // console.log('Merged options being sent:', mergedOptions);

    const request: RemoveMetadataRequest = {
      file: selectedFile,
      ...mergedOptions
    };

    const validation = removeMetadataService.validateRequest(request);
    if (!validation.valid) {
      setError(validation.message || 'Validation failed');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await removeMetadataService.removeMetadata(request);
      setResult(response);
      setRemoveMetadataResult(response);
      // console.log(response);
      setSuccess('Metadata removed successfully!');
    } catch (err: any) {
      console.error('Metadata removal error:', err);
      setError(`Failed to remove metadata: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (result?.downloadUrl) {
      try {
        await removeMetadataService.downloadFile(result.downloadUrl, result.filename);
      } catch (err: any) {
        console.error('Download error:', err);
        setError(`Failed to download file: ${err.message}`);
      }
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setResult(null);
    setRemoveMetadataResult(null);
    setError(null);
    setSuccess(null);
    setMetadataCheck(null);
    setSelectedPreset(null);
    setCustomOptions({});
    setAdvancedOptions({});
    // setShowAdvancedOptions(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getPresetIcon = (preset: MetadataCleaningPreset) => {
    switch (preset.icon) {
      case 'Shield':
        return <Shield className="w-5 h-5" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5" />;
      case 'ShieldX':
        return <ShieldX className="w-5 h-5" />;
      case 'ShieldMinus':
        return <ShieldMinus className="w-5 h-5" />;
      case 'EyeOff':
        return <EyeOff className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'basic':
        return 'bg-primary text-primary-foreground border-primary-foreground';
      case 'advanced':
        return 'bg-highlight text-highlight-foreground border-highlight-foreground';
      case 'comprehensive':
        return 'bg-destructive text-destructive-foreground border-destructive-foreground';
      case 'custom':
        return 'bg-primary text-primary-foreground border-primary-foreground';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  // Success Box UI
  if (removeMetadataResult && removeMetadataResult.success) {
    return (
      <div className="mx-auto p-2 space-y-6">
        <div className="bg-background shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-6">
              <Link
                to={`/pdf-tools${location.search}`}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Remove Metadata</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Clean metadata and hidden information from your PDF documents for enhanced privacy and security
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <SuccessBox
            title="Metadata Removed Successfully!"
            subtitle="Your PDF has been cleaned and is ready for download"
            message="All metadata and hidden information has been removed from your document for enhanced privacy and security."
            fileInfo={{
              filename: removeMetadataResult.filename,
              size: selectedFile?.size || 0
            }}
            actions={{
              primary: {
                label: 'Download Cleaned PDF',
                onClick: () => removeMetadataService.downloadFile(removeMetadataResult.downloadUrl || '', removeMetadataResult.filename)
              },
              secondary: {
                label: 'Back to Configuration',
                onClick: () => setRemoveMetadataResult(null)
              },
              tertiary: {
                label: 'Start New',
                onClick: () => {
                  setRemoveMetadataResult(null);
                  setResult(null);
                  setSelectedFile(null);
                  setMetadataCheck(null);
                  setSelectedPreset(null);
                  setCustomOptions({});
                  setAdvancedOptions({});
                  setError(null);
                  setSuccess(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto p-2 space-y-6">
      {/* Header */}
      <div className="bg-background shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
                to={`/pdf-tools${location.search}`}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Remove Metadata</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Clean metadata and hidden information from your PDF documents for enhanced privacy and security
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 bg-success border border-success-foreground rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-5 h-5 text-success mr-2">✓</div>
            <p className="text-success-foreground">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-destructive border border-destructive-foreground rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-5 h-5 text-destructive-foreground mr-2">✗</div>
            <p className="text-destructive-foreground">{error}</p>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 ${selectedFile ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-6`}>
        {/* Left Panel - File Upload and Configuration */}
        <div className={`${selectedFile ? 'lg:col-span-1' : 'lg:col-span-2'} space-y-6`}>
          {/* File Upload Section - Only show when no file selected */}
          {!selectedFile && (
            <div className="bg-background rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-muted-foreground mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Upload PDF File
              </h2>
              
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center space-y-2 text-muted-foreground hover:text-primary mx-auto"
                >
                  <Upload className="w-12 h-12" />
                  <span className="text-lg font-medium">Click to upload PDF</span>
                </button>
              </div>
            </div>
          )}
    {!selectedFile && (
          <div className="bg-background rounded-xl shadow-lg p-6 border-l-4 border-highlight-foreground">
            <h3 className="text-lg font-semibold text-highlight-foreground mb-2 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Security Note
            </h3>
            <p className="text-sm text-highlight-foreground">
              Metadata removal helps protect your privacy by eliminating hidden information that could reveal document origins, 
              creation details, or other sensitive data. This is especially important for documents shared publicly or with third parties.
            </p>
          </div>
    )}
          {/* Selected File Info - Show after file upload */}
          {selectedFile && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Selected PDF File</h3>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile as File).name} • {removeMetadataService.formatFileSize((selectedFile as File).size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setResult(null);
                    setRemoveMetadataResult(null);
                    setError(null);
                    setSuccess(null);
                    setMetadataCheck(null);
                    setSelectedPreset(null);
                    setCustomOptions({});
                    setAdvancedOptions({});
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Metadata Check Result */}
          {isCheckingMetadata && (
              <div className="bg-background rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-2 text-primary">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>Analyzing PDF metadata...</span>
              </div>
            </div>
          )}

          {metadataCheck && (
            <div className="bg-background rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <FileSearch className="w-5 h-5 mr-2" />
                Metadata Analysis
              </h3>
              
              <div className="space-y-3">
                {removeMetadataService.getMetadataSummary(metadataCheck.metadataInfo).map((summary, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <Database className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{summary}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Configuration Tabs */}
          {selectedFile && (
            <div className="bg-background rounded-xl shadow-lg p-6">
              <div className="flex justify-center mb-6">
                <div className="flex space-x-1 bg-background rounded-lg p-1 shadow-sm border">
                  <button
                    onClick={() => setActiveTab('presets')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center space-x-2 ${
                      activeTab === 'presets'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Target className="w-4 h-4" />
                    <span>Presets</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('custom')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center space-x-2 ${
                      activeTab === 'custom'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Custom</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('advanced')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center space-x-2 ${
                      activeTab === 'advanced'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>Advanced</span>
                  </button>
                </div>
              </div>

              {/* Presets Tab */}
              {activeTab === 'presets' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cleaningPresets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handlePresetSelect(preset)}
                        className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                          selectedPreset?.id === preset.id
                            ? 'border-primary bg-card/50'
                            : 'border-border hover:border-primary'
                        }`}
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`p-2 rounded-lg ${
                            selectedPreset?.id === preset.id ? 'bg-card/50' : 'bg-muted'
                          }`}>
                            {getPresetIcon(preset)}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{preset.name}</div>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full border ${getCategoryColor(preset.category)}`}>
                              {preset.category}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{preset.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Tab */}
              {activeTab === 'custom' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(customOptions).map(([key, value]) => (
                      <label key={key} className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted">
                        <input
                          type="checkbox"
                          checked={value || false}
                          onChange={(e) => handleCustomOptionChange(key, e.target.checked)}
                            className="w-4 h-4 text-primary rounded focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-foreground">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Advanced Tab */}
              {activeTab === 'advanced' && (
                <div className="space-y-6">
                  <div className="text-center mb-2">
                    <Zap className="w-12 h-12 mx-auto mb-2 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Advanced Metadata Removal Options</h3>
                    <p className="text-sm text-muted-foreground">Configure granular metadata removal settings for power users</p>
                  </div>
                  
                  {/* Document Information */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-foreground border-b pb-2">Document Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        'removeDocumentInfo', 'removeProducer', 'removeCreator', 'removeCreationDate',
                        'removeModificationDate', 'removeKeywords', 'removeSubject', 'removeAuthor',
                        'removeTitle', 'removeTrapped', 'removeXMPMetadata', 'removeMetadata'
                      ].map((option) => (
                        <label key={option} className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted">
                          <input
                            type="checkbox"
                            checked={advancedOptions[option] || false}
                            onChange={(e) => handleAdvancedOptionChange(option, e.target.checked)}
                            className="w-4 h-4 text-primary rounded focus:ring-primary"
                          />
                          <span className="text-sm font-medium text-foreground">
                            {option.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* PDF Structure */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-foreground border-b pb-2">PDF Structure</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        'removePageLabels', 'removeBookmarks', 'removeAnnotations', 'removeFormFields',
                        'removeJavaScript', 'removeEmbeddedFiles', 'removeICCProfiles', 'removeColorProfiles',
                        'removeOutputIntents', 'removePageLayout', 'removePageMode', 'removeViewerPreferences',
                        'removeOpenAction', 'removeAdditionalStreams', 'removeStructureTree', 'removeMarkInfo',
                        'removeLang', 'removeSpiderInfo', 'removeCollection', 'removeNeedsRendering',
                        'removePieceInfo', 'removeOCProperties', 'removeDSS', 'removeAF', 'removeDests',
                        'removeNames', 'removeID', 'removeEncrypt', 'removeStructTreeRoot', 'removeCatalog',
                        'removeInfo', 'removeXRef', 'removeTrailer', 'removeRoot', 'removePages',
                        'removeKids', 'removeParent', 'removeMediaBox', 'removeCropBox', 'removeBleedBox',
                        'removeTrimBox', 'removeArtBox', 'removeRotate', 'removeResources', 'removeContents',
                        'removeFonts', 'removeImages', 'removeShadings', 'removePatterns', 'removeXObjects',
                        'removeExtGState', 'removeProperties', 'removeShading', 'removePattern',
                        'removeFont', 'removeImage', 'removeXObject'
                      ].map((option) => (
                        <label key={option} className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted">
                          <input
                            type="checkbox"
                            checked={advancedOptions[option] || false}
                            onChange={(e) => handleAdvancedOptionChange(option, e.target.checked)}
                              className="w-4 h-4 text-primary rounded focus:ring-primary"
                          />
                          <span className="text-sm font-medium text-foreground">
                            {option.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Controls */}
                  <div className="pt-4 border-t space-y-3">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Selected options:</span> {Object.values(advancedOptions).filter(Boolean).length} of {Object.keys(advancedOptions).length}
                    </div>
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => setAdvancedOptions({})}
                        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted"
                      >
                        Reset All
                      </button>
                      <button
                        onClick={() => setAdvancedOptions(getDefaultAdvancedOptions())}
                        className="px-4 py-2 text-sm text-primary hover:text-primary-foreground border border-primary rounded-md hover:bg-primary-100"
                      >
                        Set Defaults
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 mt-6">
                <Button
                  onClick={handleRemoveMetadata}
                  disabled={isProcessing || !selectedFile || (Object.keys(customOptions).length === 0 && Object.keys(advancedOptions).length === 0)}
                  className="flex items-center space-x-2 bg-destructive hover:bg-destructive-foreground"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isProcessing ? 'Processing...' : 'Remove Metadata'}</span>
                </Button>

                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Results and Information - Only show when no file selected */}
        {!selectedFile && (
          <div className="space-y-6">
          {/* Results Section */}
          {result && (
            <div className="bg-background rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="w-6 h-6 text-success" />
                <h3 className="text-lg font-semibold text-success-foreground">Metadata Removed Successfully!</h3>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-foreground">File:</span>
                  <span className="text-sm text-muted-foreground">{result.filename}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-foreground">Pages:</span>
                  <span className="text-sm text-muted-foreground">{result.totalPages}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-foreground">Original Size:</span>
                  <span className="text-sm text-muted-foreground">{removeMetadataService.formatFileSize(result.originalFileSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-foreground">New Size:</span>
                  <span className="text-sm text-muted-foreground">{removeMetadataService.formatFileSize(result.fileSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-foreground">Reduction:</span>
                  <span className="text-sm text-muted-foreground">
                    {removeMetadataService.formatSizeReduction(result.sizeReduction)} 
                    ({removeMetadataService.calculateSizeReductionPercentage(result.originalFileSize, result.fileSize)}%)
                  </span>
                </div>
              </div>

              <Button
                onClick={handleDownload}
                className="w-full bg-success hover:bg-success-foreground text-primary-foreground"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Cleaned PDF
              </Button>
            </div>
          )}

          {/* Help Information */}
          <div className="bg-background rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2" />
              How It Works
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>1. Upload:</strong> Select your PDF file for analysis</p>
              <p><strong>2. Analyze:</strong> We'll scan for metadata and hidden information</p>
              <p><strong>3. Configure:</strong> Choose what to remove using presets or custom options</p>
              <p><strong>4. Process:</strong> Clean the metadata while preserving document content</p>
              <p><strong>5. Download:</strong> Get your privacy-enhanced PDF</p>
            </div>
          </div>

         

          {/* Privacy Benefits */}
          <div className="bg-background rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <EyeOff className="w-5 h-5 mr-2" />
              Privacy Benefits
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Remove author and creator information</p>
              <p>• Eliminate creation and modification dates</p>
              <p>• Clear document properties and keywords</p>
              <p>• Remove embedded metadata and XMP data</p>
              <p>• Protect against document tracking</p>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-destructive"></div>
            <span className="text-foreground">Removing metadata...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemoveMetadata;
