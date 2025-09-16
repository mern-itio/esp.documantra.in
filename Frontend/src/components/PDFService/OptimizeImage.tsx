import React, { useState, useRef } from 'react';
import { Upload, Settings, CheckCircle, AlertCircle, Info, Image, FileDown, ArrowLeft } from 'lucide-react';
import { Button } from '../DocumentService/ui/button';
import { Card } from '../DocumentService/ui/card';
import { optimizeImageService } from '../../services/optimizeImageService';
import type { OptimizeImageRequest, OptimizeImageResponse, OptimizationPreset } from '../../types/optimizeImage';
import { Link, useLocation } from 'react-router-dom';

const OptimizeImage: React.FC = () => {
   const location = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<OptimizeImageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'presets' | 'custom' | 'advanced'>('presets');
  const [selectedPreset, setSelectedPreset] = useState<OptimizationPreset | null>(null);
  const [customOptions, setCustomOptions] = useState<Partial<OptimizeImageRequest>>({
    imageQuality: 85,
    maxResolution: 150,
    compressionLevel: 'medium',
    formatConversion: 'auto',
    downscaleImages: true,
    removeMetadata: true,
    optimizeForWeb: false
  });
  const [advancedOptions, setAdvancedOptions] = useState<Partial<OptimizeImageRequest>>({
    imageQuality: 85,
    maxResolution: 150,
    compressionLevel: 'medium',
    formatConversion: 'auto',
    downscaleImages: true,
    removeMetadata: true,
    optimizeForWeb: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const presets = optimizeImageService.getOptimizationPresets();

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

  const handlePresetSelect = (preset: OptimizationPreset) => {
    setSelectedPreset(preset);
    setCustomOptions({
      imageQuality: preset.imageQuality,
      maxResolution: preset.maxResolution,
      compressionLevel: preset.compressionLevel,
      formatConversion: preset.formatConversion,
      downscaleImages: preset.downscaleImages,
      removeMetadata: preset.removeMetadata,
      optimizeForWeb: preset.optimizeForWeb
    });
    setActiveTab('presets');
  };

  const handleCustomOptionChange = (key: string, value: any) => {
    setCustomOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleAdvancedOptionChange = (key: string, value: any) => {
    setAdvancedOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleOptimizeImage = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const options = activeTab === 'advanced' ? advancedOptions : customOptions;
      const request: OptimizeImageRequest = {
        file: selectedFile,
        imageQuality: options.imageQuality,
        maxResolution: options.maxResolution,
        compressionLevel: options.compressionLevel,
        formatConversion: options.formatConversion,
        downscaleImages: options.downscaleImages,
        removeMetadata: options.removeMetadata,
        optimizeForWeb: options.optimizeForWeb,
        customSettings: activeTab === 'advanced' ? {
          imageQuality: options.imageQuality,
          maxResolution: options.maxResolution,
          formatConversion: options.formatConversion
        } : undefined
      };

      const response = await optimizeImageService.optimizeImage(request);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during image optimization');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!result) return;

    try {
      await optimizeImageService.downloadFile(result.filename);
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
      imageQuality: 85,
      maxResolution: 150,
      compressionLevel: 'medium',
      formatConversion: 'auto',
      downscaleImages: true,
      removeMetadata: true,
      optimizeForWeb: false
    });
    setAdvancedOptions({
      imageQuality: 85,
      maxResolution: 150,
      compressionLevel: 'medium',
      formatConversion: 'auto',
      downscaleImages: true,
      removeMetadata: true,
      optimizeForWeb: false
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-2 space-y-6">
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
              <h1 className="text-3xl font-bold text-gray-900">Optimize Images</h1>
              <p className="mt-2 text-sm text-gray-600">
                Compress images within PDFs, adjust resolution, and convert formats
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* File Upload Section */}
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
            
            {!selectedFile ? (
              <div className="space-y-4">
                <Image className="w-12 h-12 text-gray-400 mx-auto" />
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
            ) : (
              <div className="space-y-4">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                >
                  Change File
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Optimization Options */}
      {selectedFile && (
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-gray-500" />
              <h2 className="text-xl font-semibold text-gray-900">Optimization Options</h2>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('presets')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'presets'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Presets
                </button>
                <button
                  onClick={() => setActiveTab('custom')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'custom'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Custom
                </button>
                <button
                  onClick={() => setActiveTab('advanced')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'advanced'
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
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedPreset?.id === preset.id
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
                      Max Resolution ({customOptions.maxResolution} DPI)
                    </label>
                    <input
                      type="range"
                      min="72"
                      max="600"
                      step="1"
                      value={customOptions.maxResolution}
                      onChange={(e) => handleCustomOptionChange('maxResolution', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

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
                      Format Conversion
                    </label>
                    <select
                      value={customOptions.formatConversion}
                      onChange={(e) => handleCustomOptionChange('formatConversion', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="auto">Auto (Recommended)</option>
                      <option value="jpeg">JPEG</option>
                      <option value="png">PNG</option>
                      <option value="webp">WebP</option>
                    </select>
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
                        checked={customOptions.optimizeForWeb}
                        onChange={(e) => handleCustomOptionChange('optimizeForWeb', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Optimize for web</span>
                    </label>
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
                      <p>Fine-tune image optimization settings for professional use. These options provide granular control over the optimization process.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
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
                        Max Resolution ({advancedOptions.maxResolution} DPI)
                      </label>
                      <input
                        type="range"
                        min="72"
                        max="600"
                        step="1"
                        value={advancedOptions.maxResolution}
                        onChange={(e) => handleAdvancedOptionChange('maxResolution', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

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
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Format Conversion
                      </label>
                      <select
                        value={advancedOptions.formatConversion}
                        onChange={(e) => handleAdvancedOptionChange('formatConversion', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="auto">Auto (Recommended)</option>
                        <option value="jpeg">JPEG</option>
                        <option value="png">PNG</option>
                        <option value="webp">WebP</option>
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
                          checked={advancedOptions.optimizeForWeb}
                          onChange={(e) => handleAdvancedOptionChange('optimizeForWeb', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Optimize for web</span>
                      </label>
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
            onClick={handleOptimizeImage}
            disabled={isProcessing}
            size="lg"
            className="min-w-[200px]"
          >
            {isProcessing ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Optimizing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Image className="w-4 h-4" />
                <span>Optimize Images</span>
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
              <h3 className="text-xl font-semibold text-green-800">Image Optimization Complete!</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-600">Original Size</p>
                <p className="text-lg font-semibold text-gray-900">{formatFileSize(result.originalFileSize)}</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-600">Optimized Size</p>
                <p className="text-lg font-semibold text-green-600">{formatFileSize(result.fileSize)}</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-600">Reduction</p>
                <p className="text-lg font-semibold text-blue-600">{result.optimizationRatio}</p>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handleDownload}
                size="lg"
                className="min-w-[200px]"
              >
                <div className="flex items-center space-x-2">
                  <FileDown className="w-4 h-4" />
                  <span>Download Optimized PDF</span>
                </div>
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default OptimizeImage;
