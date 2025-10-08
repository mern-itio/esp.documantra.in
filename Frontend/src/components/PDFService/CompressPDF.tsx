import React, { useState, useRef, useEffect } from 'react';
import { FileText, Upload, Settings, CheckCircle, AlertCircle, Info, Zap, FileDown, ArrowLeft, X } from 'lucide-react';
import { Button } from '../DocumentService/ui/button';
import { Card } from '../DocumentService/ui/card';
import { compressPDFService } from '../../services/compressPDFService';
import type { CompressPDFRequest, CompressPDFResponse, CompressionPreset } from '../../types/compressPDF';
import { Link, useLocation } from 'react-router-dom';

const CompressPDF: React.FC = () => {
  const location = useLocation();
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
                <h1 className="text-3xl font-bold text-gray-900">Compress PDF</h1>
                <p className="mt-2 text-sm text-gray-600">
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
              <CheckCircle className="w-6 h-6 text-green-500" />
              <h3 className="text-lg font-semibold text-green-800">PDF Compressed Successfully!</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-600">Original Size</p>
                <p className="text-lg font-semibold text-gray-900">{formatFileSize(result.originalFileSize)}</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-600">Compressed Size</p>
                <p className={`text-lg font-semibold ${result.compressedFileSize < result.originalFileSize ? 'text-green-600' : 'text-red-600'}`}>
                  {formatFileSize(result.compressedFileSize)}
                </p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-600">Reduction</p>
                <p className={`text-lg font-semibold ${result.compressedFileSize < result.originalFileSize ? 'text-blue-600' : 'text-red-600'}`}>
                  {result.compressionRatio}
                </p>
              </div>
            </div>

            {/* Warning for size increase */}
            {result.compressedFileSize >= result.originalFileSize && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
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
                className="bg-green-600 hover:bg-green-700 text-white"
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
    <div className=" p-2 space-y-6">
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
              <h1 className="text-3xl font-bold text-gray-900">Compress PDF</h1>
              <p className="mt-2 text-sm text-gray-600">
                Reduce file size while maintaining quality
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* File Upload Section - Only show when no file selected */}
      {!selectedFile && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Upload className="w-5 h-5 text-gray-500" />
              <h2 className="text-xl font-semibold text-gray-900">Upload PDF</h2>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="space-y-4">
                <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900">Drop your PDF here</p>
                  <p className="text-gray-500">or click to browse</p>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="lg"
                >
                  Choose File
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Selected File Info - Show after file upload */}
      {selectedFile && (
        <Card className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Selected PDF File</h3>
                  <p className="text-sm text-gray-600">
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
                className="text-gray-500 hover:text-gray-700 transition-colors"
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
              <Settings className="w-5 h-5 text-gray-500" />
              <h2 className="text-xl font-semibold text-gray-900">Compression Options</h2>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('presets')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'presets'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Presets
                </button>
                <button
                  onClick={() => setActiveTab('custom')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'custom'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Custom
                </button>
                <button
                  onClick={() => setActiveTab('advanced')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'advanced'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900">{preset.name}</h3>
                        <p className="text-sm text-gray-600">{preset.description}</p>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>Estimated reduction: <span className="font-medium text-blue-600">{preset.estimatedReduction}</span></p>
                          <p>Use case: {preset.useCase}</p>
                        </div>
                      </div>
                      {selectedPreset?.id === preset.id && (
                        <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Compression Level
                    </label>
                    <select
                      value={customOptions.compressionLevel}
                      onChange={(e) => handleCustomOptionChange('compressionLevel', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low (High Quality)</option>
                      <option value="medium">Medium (Balanced)</option>
                      <option value="high">High (Small Size)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      <span className="text-sm text-gray-700">Downscale images</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={customOptions.removeMetadata}
                        onChange={(e) => handleCustomOptionChange('removeMetadata', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Remove metadata</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={customOptions.linearize}
                        onChange={(e) => handleCustomOptionChange('linearize', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Linearize PDF</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Object Streams
                    </label>
                    <select
                      value={customOptions.objectStreams}
                      onChange={(e) => handleCustomOptionChange('objectStreams', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Advanced Options</p>
                      <p>Fine-tune compression settings for professional use. These options provide granular control over the compression process.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Compression Level
                      </label>
                      <select
                        value={advancedOptions.compressionLevel}
                        onChange={(e) => handleAdvancedOptionChange('compressionLevel', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="low">Low (High Quality)</option>
                        <option value="medium">Medium (Balanced)</option>
                        <option value="high">High (Small Size)</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Compression Method
                      </label>
                      <select
                        value={advancedOptions.compressionMethod}
                        onChange={(e) => handleAdvancedOptionChange('compressionMethod', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        <span className="text-sm text-gray-700">Downscale images</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={advancedOptions.removeMetadata}
                          onChange={(e) => handleAdvancedOptionChange('removeMetadata', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Remove metadata</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={advancedOptions.linearize}
                          onChange={(e) => handleAdvancedOptionChange('linearize', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Linearize PDF</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Object Streams
                      </label>
                      <select
                        value={advancedOptions.objectStreams}
                        onChange={(e) => handleAdvancedOptionChange('objectStreams', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {/* Results Display */}
      {result && (
        <Card className="p-6 border-green-200 bg-green-50">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-semibold text-green-800">Compression Complete!</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-600">Original Size</p>
                <p className="text-lg font-semibold text-gray-900">{formatFileSize(result.originalFileSize)}</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-600">Compressed Size</p>
                <p className={`text-lg font-semibold ${result.compressedFileSize < result.originalFileSize ? 'text-green-600' : 'text-red-600'}`}>
                  {formatFileSize(result.compressedFileSize)}
                </p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-600">Reduction</p>
                <p className={`text-lg font-semibold ${result.compressedFileSize < result.originalFileSize ? 'text-blue-600' : 'text-red-600'}`}>
                  {result.compressionRatio}
                </p>
              </div>
            </div>

            {/* Warning for size increase */}
            {result.compressedFileSize >= result.originalFileSize && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
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
                className="min-w-[200px]"
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
