import React, { useState, useRef, useEffect } from 'react';
import { FileText, Settings, CheckCircle, AlertCircle, Info, Zap, FileDown, ArrowLeft, X } from 'lucide-react';
import { Button } from '../DocumentService/ui/button';
import { Card } from '../DocumentService/ui/card';
import { compressPDFService } from '../../services/compressPDFService';
import type { CompressPDFRequest, CompressPDFResponse, CompressionPreset } from '../../types/compressPDF';
import { Link, useLocation } from 'react-router-dom';

const CompressPDF: React.FC = () => {
  const location = useLocation();
  const isLandingRoute = location.pathname === '/compress-pdf';
  const headingTitle = 'Compress PDF';
  const headingSubtitle = 'Reduce file size while maintaining quality.';
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CompressPDFResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'presets' | 'custom' | 'advanced'>('presets');
  const [selectedPreset, setSelectedPreset] = useState<CompressionPreset | null>(null);
  const [customOptions, setCustomOptions] = useState<Partial<CompressPDFRequest>>({
    compressionLevel: 'medium',
    imageQuality: 85,
    downscaleImages: true,
    maxImageResolution: 150,
    removeMetadata: true,
    linearize: true,
    objectStreams: 'generate',
    compressionMethod: 'auto'
  });
  const [advancedOptions, setAdvancedOptions] = useState<Partial<CompressPDFRequest>>({
    compressionLevel: 'medium',
    imageQuality: 85,
    downscaleImages: true,
    maxImageResolution: 150,
    removeMetadata: true,
    linearize: true,
    objectStreams: 'generate',
    compressionMethod: 'auto'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const presets = compressPDFService.getCompressionPresets();

  // Rotating progress messages while processing large files
  const progressMessages = [
    'Analyzing document structure…',
    'Optimizing images…',
    'Compressing streams…',
    'Rewriting cross-reference table…',
    'Removing redundant metadata…',
    'Finalizing optimized PDF…',
    'Flattening annotations…',
    'Embedding fonts…',
    'Checking for broken links…',
    'Updating bookmarks…',
    'Encrypting document…',
    'Applying watermarks…',
    'Validating document integrity…',
    'Generating thumbnails…',
    'Performing OCR on scanned pages…',
    'Merging duplicate objects…',
    'Optimizing color profiles…',
    'Cleaning up unused objects…',
    'Updating XMP metadata…',
    'Saving optimized PDF…'
  ];
  
  const [progressIndex, setProgressIndex] = useState(0);

  useEffect(() => {
    if (!isProcessing) return;
    setProgressIndex(0);
    const interval = setInterval(() => {
      setProgressIndex((prev) => (prev + 1) % progressMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isProcessing]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
      setResult(null);
    } else if (file) {
      setError('Please select a valid PDF file');
    }
  };

  const handlePresetSelect = (preset: CompressionPreset) => {
    setSelectedPreset(preset);
    setCustomOptions({
      compressionLevel: preset.compressionLevel,
      imageQuality: preset.imageQuality,
      downscaleImages: preset.downscaleImages,
      maxImageResolution: preset.maxImageResolution,
      removeMetadata: preset.removeMetadata,
      linearize: preset.linearize,
      objectStreams: preset.objectStreams,
      compressionMethod: preset.compressionMethod
    });
    setActiveTab('presets');
  };

  const handleCustomOptionChange = (key: string, value: any) => {
    setCustomOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleAdvancedOptionChange = (key: string, value: any) => {
    setAdvancedOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleCompressPDF = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const options = activeTab === 'advanced' ? advancedOptions : customOptions;
      const request: CompressPDFRequest = {
        file: selectedFile,
        compressionLevel: options.compressionLevel || 'medium',
        imageQuality: options.imageQuality,
        downscaleImages: options.downscaleImages,
        maxImageResolution: options.maxImageResolution,
        removeMetadata: options.removeMetadata,
        linearize: options.linearize,
        objectStreams: options.objectStreams,
        compressionMethod: options.compressionMethod,
        customSettings: activeTab === 'advanced' ? {
          compressionLevel: options.compressionLevel === 'custom' ? options.imageQuality : undefined,
          imageQuality: options.imageQuality,
          objectStreams: options.objectStreams
        } : undefined
      };

      const response = await compressPDFService.compressPDF(request);
      console.log('Compression response:', response);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during compression');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!result) return;

    try {
      await compressPDFService.downloadFile(result.filename);
    } catch (err) {
      setError('Failed to download file');
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    setSelectedPreset(null);
    setCustomOptions({
      compressionLevel: 'medium',
      imageQuality: 85,
      downscaleImages: true,
      maxImageResolution: 150,
      removeMetadata: true,
      linearize: true,
      objectStreams: 'generate',
      compressionMethod: 'auto'
    });
    setAdvancedOptions({
      compressionLevel: 'medium',
      imageQuality: 85,
      downscaleImages: true,
      maxImageResolution: 150,
      removeMetadata: true,
      linearize: true,
      objectStreams: 'generate',
      compressionMethod: 'auto'
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Success Message UI - Show only success message after compression
  if (result && result.success) {
    return (
      <div className=" p-2 space-y-6">
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
                <h1 className="text-3xl font-bold text-foreground">Compress PDF</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Reduce file size while maintaining quality
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          {/* Success Message */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="w-6 h-6 text-success" />
              <h3 className="text-lg font-semibold text-success-foreground">PDF Compressed Successfully!</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground">Original Size</p>
                <p className="text-lg font-semibold text-foreground">{formatFileSize(result.originalFileSize)}</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground">Compressed Size</p>
                <p className={`text-lg font-semibold ${result.compressedFileSize < result.originalFileSize ? 'text-success' : 'text-destructive'}`}>
                  {formatFileSize(result.compressedFileSize)}
                </p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground">Reduction</p>
                <p className={`text-lg font-semibold ${result.compressedFileSize < result.originalFileSize ? 'text-primary' : 'text-destructive'}`}>
                  {result.compressionRatio}
                </p>
              </div>
            </div>

            {/* Warning for size increase */}
            {result.compressedFileSize >= result.originalFileSize && (
              <div className="mb-4 p-4 bg-highlight border border-highlight-foreground rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-highlight flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-highlight-foreground">
                    <p className="font-medium">File size increased after compression</p>
                    <p className="mt-1">
                      This usually happens when the PDF is already well-compressed or very small.
                      The compressed file may have better structure and compatibility, but the size increased by {Math.abs(parseFloat(result.compressionRatio))}%.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                onClick={handleDownload}
                className="bg-primary hover:bg-primary/80 text-primary-foreground"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Download Compressed PDF
              </Button>
              <Button
                onClick={() => setResult(null)}
                variant="outline"
              >
                Back to Configuration
              </Button>
              <Button
                onClick={resetForm}
                variant="outline"
              >
                Start New
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-2 space-y-6">
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
              <h1 className="text-3xl font-bold text-foreground">{headingTitle}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{headingSubtitle}</p>
            </div>
          </div>
        </div>
      </div>

      {isLandingRoute && (
        <div className="max-w-4xl mx-auto mt-8 text-center">
          <h2 className="text-2xl font-semibold text-foreground">{headingTitle}</h2>
          <p className="text-muted-foreground mt-2">{headingSubtitle}</p>
        </div>
      )}

      {/* File Upload Section - Only show when no file selected */}
      {!selectedFile && (
        <div className="max-w-4xl mx-auto mt-8">
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors hover:border-primary border-border`}
            onClick={() => fileInputRef.current?.click()}
          >
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground mb-2">
              Drag and drop your PDF here, or{' '}
              <button type="button" className="text-primary hover:text-muted-foreground font-medium cursor-pointer" style={{ cursor: 'pointer' }}>browse files</button>
            </p>
            <p className="text-sm text-muted-foreground">Maximum file size: 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Selected File Info - Show after file upload */}
      {selectedFile && (
        <Card className="p-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-card/50 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Selected PDF File</h3>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile as File).name} • {formatFileSize((selectedFile as File).size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setResult(null);
                  setError(null);
                  setSelectedPreset(null);
                  setCustomOptions({
                    compressionLevel: 'medium',
                    imageQuality: 85,
                    downscaleImages: true,
                    maxImageResolution: 150,
                    removeMetadata: true,
                    linearize: true,
                    objectStreams: 'generate',
                    compressionMethod: 'auto'
                  });
                  setAdvancedOptions({
                    compressionLevel: 'medium',
                    imageQuality: 85,
                    downscaleImages: true,
                    maxImageResolution: 150,
                    removeMetadata: true,
                    linearize: true,
                    objectStreams: 'generate',
                    compressionMethod: 'auto'
                  });
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
        </Card>
      )}

      {/* Compression Options */}
      {selectedFile && (
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold text-foreground">Compression Options</h2>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-border">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('presets')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'presets'
                      ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                >
                  Presets
                </button>
                <button
                  onClick={() => setActiveTab('custom')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'custom'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                >
                  Custom
                </button>
                <button
                  onClick={() => setActiveTab('advanced')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'advanced'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                >
                  Advanced
                </button>
              </nav>
            </div>

            {/* Presets Tab */}
            {activeTab === 'presets' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedPreset?.id === preset.id
                        ? 'border-primary bg-card/50'
                        : 'border-border hover:border-primary hover:shadow-md'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-foreground">{preset.name}</h3>
                        <p className="text-sm text-muted-foreground">{preset.description}</p>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>Estimated reduction: <span className="font-medium text-primary">{preset.estimatedReduction}</span></p>
                          <p>Use case: {preset.useCase}</p>
                        </div>
                      </div>
                      {selectedPreset?.id === preset.id && (
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Custom Tab */}
            {activeTab === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Compression Level
                    </label>
                    <select
                      value={customOptions.compressionLevel}
                      onChange={(e) => handleCustomOptionChange('compressionLevel', e.target.value)}
                        className="bg-card w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="low">Low (High Quality)</option>
                      <option value="medium">Medium (Balanced)</option>
                      <option value="high">High (Small Size)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Image Quality ({customOptions.imageQuality}%)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={customOptions.imageQuality}
                      onChange={(e) => handleCustomOptionChange('imageQuality', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Max Image Resolution ({customOptions.maxImageResolution} DPI)
                    </label>
                    <input
                      type="range"
                      min="72"
                      max="600"
                      step="1"
                      value={customOptions.maxImageResolution}
                      onChange={(e) => handleCustomOptionChange('maxImageResolution', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={customOptions.downscaleImages}
                        onChange={(e) => handleCustomOptionChange('downscaleImages', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-foreground">Downscale images</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={customOptions.removeMetadata}
                        onChange={(e) => handleCustomOptionChange('removeMetadata', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-foreground">Remove metadata</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={customOptions.linearize}
                        onChange={(e) => handleCustomOptionChange('linearize', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-foreground">Linearize PDF</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Object Streams
                    </label>
                    <select
                      value={customOptions.objectStreams}
                      onChange={(e) => handleCustomOptionChange('objectStreams', e.target.value)}
                        className="bg-card w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="generate">Generate (Recommended)</option>
                      <option value="preserve">Preserve</option>
                      <option value="disable">Disable</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-foreground">
                      <p className="font-medium">Advanced Options</p>
                      <p>Fine-tune compression settings for professional use. These options provide granular control over the compression process.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Compression Level
                      </label>
                      <select
                        value={advancedOptions.compressionLevel}
                        onChange={(e) => handleAdvancedOptionChange('compressionLevel', e.target.value)}
                        className="bg-card w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="low">Low (High Quality)</option>
                        <option value="medium">Medium (Balanced)</option>
                        <option value="high">High (Small Size)</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                        Image Quality ({advancedOptions.imageQuality}%)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={advancedOptions.imageQuality}
                        onChange={(e) => handleAdvancedOptionChange('imageQuality', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Max Image Resolution ({advancedOptions.maxImageResolution} DPI)
                      </label>
                      <input
                        type="range"
                        min="72"
                        max="600"
                        step="1"
                        value={advancedOptions.maxImageResolution}
                        onChange={(e) => handleAdvancedOptionChange('maxImageResolution', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Compression Method
                      </label>
                      <select
                        value={advancedOptions.compressionMethod}
                        onChange={(e) => handleAdvancedOptionChange('compressionMethod', e.target.value)}
                        className="bg-card w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="auto">Auto (Recommended)</option>
                        <option value="jpeg">JPEG</option>
                        <option value="flate">Flate (Lossless)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={advancedOptions.downscaleImages}
                          onChange={(e) => handleAdvancedOptionChange('downscaleImages', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-foreground">Downscale images</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={advancedOptions.removeMetadata}
                          onChange={(e) => handleAdvancedOptionChange('removeMetadata', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-foreground">Remove metadata</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={advancedOptions.linearize}
                          onChange={(e) => handleAdvancedOptionChange('linearize', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-foreground">Linearize PDF</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Object Streams
                      </label>
                      <select
                        value={advancedOptions.objectStreams}
                        onChange={(e) => handleAdvancedOptionChange('objectStreams', e.target.value)}
                        className="bg-card w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="generate">Generate (Recommended)</option>
                        <option value="preserve">Preserve</option>
                        <option value="disable">Disable</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      {selectedFile && (
        <div className="flex justify-center space-x-4">
          <Button
            onClick={handleCompressPDF}
            disabled={isProcessing}
            size="lg"
            className="min-w-[200px]"
          >
            {isProcessing ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{progressMessages[progressIndex]}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Compress PDF</span>
              </div>
            )}
          </Button>

          <Button
            onClick={resetForm}
            variant="outline"
            size="lg"
          >
            Reset
          </Button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Card className="p-4 border-destructive bg-destructive-foreground">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {/* Results Display */}
      {result && (
        <Card className="p-6 border-success bg-success/10">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-6 h-6 text-success" />
              <h3 className="text-xl font-semibold text-success-foreground">Compression Complete!</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-card rounded-lg">
                <p className="text-sm text-muted-foreground">Original Size</p>
                <p className="text-lg font-semibold text-foreground">{formatFileSize(result.originalFileSize)}</p>
              </div>
              <div className="text-center p-4 bg-card rounded-lg">
                <p className="text-sm text-muted-foreground">Compressed Size</p>
                <p className={`text-lg font-semibold ${result.compressedFileSize < result.originalFileSize ? 'text-success' : 'text-destructive'}`}>
                  {formatFileSize(result.compressedFileSize)}
                </p>
              </div>
              <div className="text-center p-4 bg-card rounded-lg">
                <p className="text-sm text-muted-foreground">Reduction</p>
                <p className={`text-lg font-semibold ${result.compressedFileSize < result.originalFileSize ? 'text-primary' : 'text-destructive'}`}>
                  {result.compressionRatio}
                </p>
              </div>
            </div>

            {/* Warning for size increase */}
            {result.compressedFileSize >= result.originalFileSize && (
                <div className="mt-4 p-4 bg-highlight border border-highlight-foreground rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-highlight flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-highlight-foreground">
                    <p className="font-medium">File size increased after compression</p>
                    <p className="mt-1">
                      This usually happens when the PDF is already well-compressed or very small.
                      The compressed file may have better structure and compatibility, but the size increased by {Math.abs(parseFloat(result.compressionRatio))}%.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <Button
                onClick={handleDownload}
                size="lg"
                className="min-w-[200px] text-foreground"
              >
                <div className="flex items-center space-x-2">
                  <FileDown className="w-4 h-4" />
                  <span>Download Compressed PDF</span>
                </div>
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CompressPDF;
