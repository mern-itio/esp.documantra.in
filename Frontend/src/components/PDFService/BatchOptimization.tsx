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
  X
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

  // Show only result when batch optimization is successful - hide everything else
  if (result && result.success) {
    return (
      <div className="mx-auto min-h-full w-full space-y-6 bg-background text-foreground">
        <div className="bg-background shadow-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-6">
              <Link
                to={`/pdf-tools${location.search}`}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Batch Optimization</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Optimize multiple PDFs simultaneously with custom profiles
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Show only the result - everything else is hidden */}
        <div className="max-w-7xl mx-auto p-6">
          <Card className="p-6">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-2">Batch Optimization Complete!</h3>
              <p className="text-muted-foreground">Your PDFs have been optimized successfully</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-foreground">{result.summary.totalFiles}</p>
                <p className="text-sm text-muted-foreground">Total Files</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{result.summary.successfulFiles}</p>
                <p className="text-sm text-muted-foreground">Successful</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{result.summary.failedFiles}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{result.summary.averageCompressionRatio}</p>
                <p className="text-sm text-muted-foreground">Avg. Reduction</p>
              </div>
            </div>

            {/* Individual Results */}
            <div className="space-y-4 mb-6">
              <h4 className="font-medium text-foreground">File Results:</h4>
              {result.results.map((fileResult, index) => (
                <div key={index} className="p-4 bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-900 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-emerald-900 dark:text-emerald-200">{fileResult.filename}</span>
                    <Button
                      onClick={() => handleDownload(fileResult.outputFilename)}
                      size="sm"
                      variant="outline"
                      className="text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/45"
                    >
                      <FileDown className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                    <div>
                      <span className="text-emerald-600 dark:text-emerald-400">Original:</span> {formatFileSize(fileResult.originalSize)}
                    </div>
                    <div>
                      <span className="text-emerald-600 dark:text-emerald-400">Optimized:</span> {formatFileSize(fileResult.optimizedSize)}
                    </div>
                    <div>
                      <span className="text-emerald-600 dark:text-emerald-400">Reduction:</span> {fileResult.compressionRatio}
                    </div>
                    <div>
                      <span className="text-emerald-600 dark:text-emerald-400">Size Saved:</span> {formatFileSize(fileResult.sizeReduction)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="space-y-2 mb-6">
                <h4 className="font-medium text-red-600 dark:text-red-400">Failed Files:</h4>
                {result.errors.map((error, index) => (
                  <div key={index} className="p-3 bg-red-50 dark:bg-red-950/35 border border-red-200 dark:border-red-900 rounded-lg">
                    <p className="font-medium text-red-900 dark:text-red-200">{error.filename}</p>
                    <p className="text-sm text-red-700 dark:text-red-300">{error.error}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {result.batchDownloadUrl && (
                <Button
                  onClick={handleBatchDownload}
                  className="bg-success text-success-foreground hover:bg-success/90 flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All Files
                </Button>
              )}
              <Button
                onClick={() => setResult(null)}
                variant="outline"
              >
                Back to Configuration
              </Button>
              <Button
                onClick={() => {
                  setSelectedFiles([]);
                  setResult(null);
                  setError(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                variant="outline"
              >
                Start New Batch
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-full w-full space-y-6 bg-background text-foreground">
      <div className="bg-background shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              to={`/pdf-tools${location.search}`}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Batch Optimization</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Optimize multiple PDFs simultaneously with custom profiles
              </p>
            </div>
          </div>
        </div>
      </div>

        <div className="space-y-6">
          {/* File Upload and Settings - Full Width */}
          <div className="space-y-6">
            {/* File Upload - Only show when no files selected */}
            {selectedFiles.length === 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">Upload PDF Files</h2>
                  <span className="text-sm text-muted-foreground">0/10 files</span>
                </div>

                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-muted-foreground/40 transition-colors bg-muted/30 dark:bg-muted/20">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-foreground">Select PDF files</p>
                    <p className="text-muted-foreground">
                      Drag and drop PDF files here, or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Maximum 10 files, 2MB each
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
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>
                </div>
              </Card>
            )}

            {/* Selected Files Info - Show after file selection */}
            {selectedFiles.length > 0 && (
              <Card className="p-6">
                <div className="bg-primary/10 border border-primary/30 dark:bg-primary/15 dark:border-primary/40 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/15 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Selected PDF Files</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedFiles.length} file(s) selected
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFiles([]);
                        setResult(null);
                        setError(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Selected Files List */}
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium text-foreground">{file.name}</p>
                            <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-destructive hover:text-destructive/90"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Optimization Settings */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Optimization Settings</h2>
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
                          ? 'border-primary bg-primary/10 dark:bg-primary/15'
                          : 'border-border hover:border-muted-foreground/40'
                      }`}
                      onClick={() => handlePresetSelect(preset)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-foreground">{preset.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{preset.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                            <span>Reduction: {preset.estimatedReduction}</span>
                            <span>Use: {preset.useCase}</span>
                          </div>
                        </div>
                        {selectedPreset?.id === preset.id && (
                          <CheckCircle className="h-5 w-5 text-primary" />
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
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Compression Level
                      </label>
                      <select
                        value={customOptions.compressionLevel}
                        onChange={(e) => handleCustomOptionChange('compressionLevel', e.target.value)}
                        className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
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
                      <span className="text-sm text-muted-foreground">{customOptions.imageQuality}%</span>
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
                      <label htmlFor="downscaleImages" className="text-sm font-medium text-foreground">
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
                      <label htmlFor="removeMetadata" className="text-sm font-medium text-foreground">
                        Remove Metadata
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Optimization Profile */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-foreground mb-2">
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
                            ? 'border-primary bg-primary/10 text-primary dark:bg-primary/15'
                            : 'border-border hover:border-muted-foreground/40'
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
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Processing files...</span>
                    <span>{progress.current}/{progress.total}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    {progress.current > 0 && progress.current <= progress.total
                      ? `Processing: ${selectedFiles[progress.current - 1]?.name}`
                      : 'Preparing files...'}
                  </p>
                </div>
              </Card>
            )}

            {/* Error Display */}
            {error && (
              <Card className="p-6 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/35">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  <div>
                    <h3 className="font-medium text-red-900 dark:text-red-200">Error</h3>
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
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
