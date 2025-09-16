import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Zap, 
  FileDown, 
  ArrowLeft, 
  Download,
  Trash2,
  Play,
  Loader2,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { Button } from '../DocumentService/ui/button';
import { Card } from '../DocumentService/ui/card';
import { batchOptimizationService } from '../../services/batchOptimizationService';
import type { 
  BatchOptimizationRequest, 
  BatchOptimizationResponse, 
  OptimizationPreset,
} from '../../types/batchOptimization';
import { Link, useLocation } from 'react-router-dom';

const BatchOptimization: React.FC = () => {
  const location = useLocation();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<BatchOptimizationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'presets' | 'custom' | 'advanced'>('presets');
  const [selectedPreset, setSelectedPreset] = useState<OptimizationPreset | null>(null);
  const [presets, setPresets] = useState<OptimizationPreset[]>([]);
  const [customOptions, setCustomOptions] = useState<{
    compressionLevel: 'low' | 'medium' | 'high';
    imageQuality: number;
    downscaleImages: boolean;
    maxImageResolution: number;
    removeMetadata: boolean;
    linearize: boolean;
    objectStreams: 'disable' | 'preserve' | 'generate';
    compressionMethod: 'auto' | 'jpeg' | 'flate';
  }>({
    compressionLevel: 'medium',
    imageQuality: 85,
    downscaleImages: true,
    maxImageResolution: 150,
    removeMetadata: true,
    linearize: true,
    objectStreams: 'generate',
    compressionMethod: 'auto'
  });
  const [optimizationProfile, setOptimizationProfile] = useState<'balanced' | 'quality' | 'size' | 'speed'>('balanced');
  const [progress, setProgress] = useState<{ current: number; total: number; percentage: number }>({
    current: 0,
    total: 0,
    percentage: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const presetsData = await batchOptimizationService.getOptimizationPresets();
      setPresets(presetsData);
      if (presetsData.length > 0) {
        setSelectedPreset(presetsData[0]);
      }
    } catch (error) {
      console.error('Error loading presets:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== files.length) {
      setError('Some files are not PDFs and will be ignored');
    }
    
    if (pdfFiles.length > 10) {
      setError('Maximum 10 files allowed. Only the first 10 will be processed.');
      setSelectedFiles(pdfFiles.slice(0, 10));
    } else {
      setSelectedFiles(pdfFiles);
      setError(null);
    }
    
    setResult(null);
  };

  const handlePresetSelect = (preset: OptimizationPreset) => {
    setSelectedPreset(preset);
    setCustomOptions({
      compressionLevel: preset.settings.compressionLevel || 'medium',
      imageQuality: preset.settings.imageQuality || 85,
      downscaleImages: preset.settings.downscaleImages ?? true,
      maxImageResolution: preset.settings.maxImageResolution || 150,
      removeMetadata: preset.settings.removeMetadata ?? true,
      linearize: preset.settings.linearize ?? true,
      objectStreams: preset.settings.objectStreams || 'generate',
      compressionMethod: preset.settings.compressionMethod || 'auto'
    });
    setActiveTab('presets');
  };

  const handleCustomOptionChange = (key: string, value: any) => {
    setCustomOptions(prev => ({ ...prev, [key]: value }));
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    setResult(null);
    setError(null);
  };

  const handleBatchOptimize = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one PDF file');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress({ current: 0, total: selectedFiles.length, percentage: 0 });

    try {
      const options = activeTab === 'custom' ? customOptions : (selectedPreset?.settings || {});
      const request: BatchOptimizationRequest = {
        files: selectedFiles,
        preset: selectedPreset?.id as any || 'web_optimized',
        customSettings: activeTab === 'custom' ? options : undefined,
        optimizationProfile
      };

      const response = await batchOptimizationService.batchOptimize(request);
      setResult(response);
      
      // Simulate progress updates
      for (let i = 0; i <= selectedFiles.length; i++) {
        setProgress({
          current: i,
          total: selectedFiles.length,
          percentage: (i / selectedFiles.length) * 100
        });
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
    } catch (error) {
      console.error('Batch optimization error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during batch optimization');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      await batchOptimizationService.downloadFile(filename);
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download file');
    }
  };

  const handleBatchDownload = async () => {
    if (result?.batchDownloadUrl) {
      try {
        const filename = result.batchDownloadUrl.split('/').pop() || 'batch_optimization.zip';
        await batchOptimizationService.downloadFile(filename);
      } catch (error) {
        console.error('Batch download error:', error);
        setError('Failed to download batch files');
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    return batchOptimizationService.formatFileSize(bytes);
  };

  return (
      <div className="mx-auto space-y-6">
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
              <h1 className="text-3xl font-bold text-gray-900">Batch Optimization</h1>
              <p className="mt-2 text-sm text-gray-600">
                Optimize multiple PDFs simultaneously with custom profiles
              </p>
            </div>
          </div>
        </div>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - File Upload and Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Upload PDF Files</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {selectedFiles.length}/10 files
                  </span>
                  {selectedFiles.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllFiles}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">
                    {selectedFiles.length === 0 ? 'Select PDF files' : `${selectedFiles.length} file(s) selected`}
                  </p>
                  <p className="text-gray-500">
                    Drag and drop PDF files here, or click to browse
                  </p>
                  <p className="text-sm text-gray-400">
                    Maximum 10 files, 100MB each
                  </p>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4"
                  disabled={selectedFiles.length >= 10}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="mt-6 space-y-2">
                  <h3 className="font-medium text-gray-900">Selected Files:</h3>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Optimization Settings */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Optimization Settings</h2>
                <div className="flex space-x-2">
                  <Button
                    variant={activeTab === 'presets' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('presets')}
                  >
                    Presets
                  </Button>
                  <Button
                    variant={activeTab === 'custom' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('custom')}
                  >
                    Custom
                  </Button>
                </div>
              </div>

              {activeTab === 'presets' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPreset?.id === preset.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handlePresetSelect(preset)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{preset.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{preset.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>Reduction: {preset.estimatedReduction}</span>
                            <span>Use: {preset.useCase}</span>
                          </div>
                        </div>
                        {selectedPreset?.id === preset.id && (
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'custom' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Compression Level
                      </label>
                      <select
                        value={customOptions.compressionLevel}
                        onChange={(e) => handleCustomOptionChange('compressionLevel', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image Quality
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={customOptions.imageQuality}
                        onChange={(e) => handleCustomOptionChange('imageQuality', parseInt(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-sm text-gray-500">{customOptions.imageQuality}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="downscaleImages"
                        checked={customOptions.downscaleImages}
                        onChange={(e) => handleCustomOptionChange('downscaleImages', e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="downscaleImages" className="text-sm font-medium text-gray-700">
                        Downscale Images
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="removeMetadata"
                        checked={customOptions.removeMetadata}
                        onChange={(e) => handleCustomOptionChange('removeMetadata', e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="removeMetadata" className="text-sm font-medium text-gray-700">
                        Remove Metadata
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Optimization Profile */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Optimization Profile
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { value: 'balanced', label: 'Balanced', icon: BarChart3 },
                    { value: 'quality', label: 'Quality', icon: CheckCircle },
                    { value: 'size', label: 'Size', icon: FileDown },
                    { value: 'speed', label: 'Speed', icon: Zap }
                  ].map((profile) => {
                    const Icon = profile.icon;
                    return (
                      <button
                        key={profile.value}
                        onClick={() => setOptimizationProfile(profile.value as any)}
                        className={`p-3 border rounded-lg text-center transition-colors ${
                          optimizationProfile === profile.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="h-5 w-5 mx-auto mb-1" />
                        <span className="text-sm font-medium">{profile.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Process Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleBatchOptimize}
                disabled={selectedFiles.length === 0 || isProcessing}
                size="lg"
                className="px-8 py-3"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Start Batch Optimization
                  </>
                )}
              </Button>
            </div>

            {/* Progress Bar */}
            {isProcessing && (
              <Card className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Processing files...</span>
                    <span>{progress.current}/{progress.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    {progress.current > 0 && progress.current <= progress.total
                      ? `Processing: ${selectedFiles[progress.current - 1]?.name}`
                      : 'Preparing files...'}
                  </p>
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Results and Info */}
          <div className="space-y-6">
            {/* Tool Info */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Batch Optimization</h3>
                  <p className="text-sm text-gray-600">Professional PDF optimization</p>
                </div>
              </div>
              
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Up to 10 files simultaneously</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Custom optimization profiles</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Progress tracking</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Batch download support</span>
                </div>
              </div>
            </Card>

            {/* Results */}
            {result && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Optimization Results</h3>
                  {result.batchDownloadUrl && (
                    <Button
                      onClick={handleBatchDownload}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download All
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Total Files</p>
                        <p className="font-semibold">{result.summary.totalFiles}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Successful</p>
                        <p className="font-semibold text-green-600">{result.summary.successfulFiles}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Failed</p>
                        <p className="font-semibold text-red-600">{result.summary.failedFiles}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Avg. Reduction</p>
                        <p className="font-semibold text-blue-600">{result.summary.averageCompressionRatio}</p>
                      </div>
                    </div>
                  </div>

                  {/* Individual Results */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">File Results:</h4>
                    {result.results.map((fileResult, index) => (
                      <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-green-900">{fileResult.filename}</span>
                          <Button
                            onClick={() => handleDownload(fileResult.outputFilename)}
                            size="sm"
                            variant="outline"
                            className="text-green-700 border-green-300 hover:bg-green-100"
                          >
                            <FileDown className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                          <div>
                            <span className="text-green-600">Original:</span> {formatFileSize(fileResult.originalSize)}
                          </div>
                          <div>
                            <span className="text-green-600">Optimized:</span> {formatFileSize(fileResult.optimizedSize)}
                          </div>
                          <div>
                            <span className="text-green-600">Reduction:</span> {fileResult.compressionRatio}
                          </div>
                          <div>
                            <span className="text-green-600">Size Saved:</span> {formatFileSize(fileResult.sizeReduction)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Errors */}
                  {result.errors.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 text-red-600">Failed Files:</h4>
                      {result.errors.map((error, index) => (
                        <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="font-medium text-red-900">{error.filename}</p>
                          <p className="text-sm text-red-700">{error.error}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Error Display */}
            {error && (
              <Card className="p-6 border-red-200 bg-red-50">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  <div>
                    <h3 className="font-medium text-red-900">Error</h3>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
  );
};

export default BatchOptimization;
