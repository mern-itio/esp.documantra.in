import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Brain,
  Target,
  Gauge,
  Download,
  RefreshCw,
  Eye,
  FileImage,
  FileSpreadsheet,
  Presentation,
  File,
  Sparkles,
  Wand2,
  Clock,
  HardDrive,
  Smartphone,
  Monitor,
  Printer
} from 'lucide-react';
import { Button } from '../DocumentService/ui/button';
import { Card } from '../DocumentService/ui/card';
import { smartConversionService } from '../../services/smartConversionService';
import type { 
  SmartConversionRequest, 
  SmartConversionResponse,
  FormatAnalysis,
  ConversionPreset,
  ConversionProgress
} from '../../types/smartConversion';
import { CONVERSION_PRESETS } from '../../types/smartConversion';
import { Link } from 'react-router-dom';

const SmartConversion: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<SmartConversionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'presets' | 'custom' | 'smart'>('smart');
  const [selectedPreset, setSelectedPreset] = useState<ConversionPreset | null>(null);
  const [formatAnalysis, setFormatAnalysis] = useState<FormatAnalysis | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<ConversionProgress | null>(null);
  
  // Conversion settings
  const [targetFormat, setTargetFormat] = useState<string>('pdf');
  const [qualityLevel, setQualityLevel] = useState<'auto' | 'high' | 'medium' | 'low'>('auto');
  const [preserveLayout, setPreserveLayout] = useState(true);
  const [optimizeForWeb, setOptimizeForWeb] = useState(false);
  const [customSettings] = useState<SmartConversionRequest['customSettings']>({
    compressionLevel: 'medium',
    imageQuality: 85,
    removeMetadata: true,
    linearize: true,
    objectStreams: 'generate',
    compressionMethod: 'auto',
    maxImageResolution: 150
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-analyze file when selected
  useEffect(() => {
    if (selectedFile && activeMode === 'smart') {
      analyzeFile();
    }
  }, [selectedFile, activeMode]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validation = smartConversionService.validateFile(file);
      if (validation.valid) {
        setSelectedFile(file);
        setError(null);
        setResult(null);
        setFormatAnalysis(null);
      } else {
        setError(validation.error || 'Invalid file');
      }
    }
  };


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

    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    if (file) {
      const validation = smartConversionService.validateFile(file);
      if (validation.valid) {
        setSelectedFile(file);
        setError(null);
        setResult(null);
        setFormatAnalysis(null);
      } else {
        setError(validation.error || 'Invalid file');
      }
    }
  }, []);

  const analyzeFile = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await smartConversionService.detectFormat(selectedFile);
      setFormatAnalysis(response.analysis);
      
      // Auto-select recommended target format
      if (response.recommendations.targetFormats.length > 0) {
        setTargetFormat(response.recommendations.targetFormats[0]);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) return;

    setIsConverting(true);
    setError(null);
    setConversionProgress({
      fileIndex: 0,
      totalFiles: 1,
      currentFile: selectedFile.name,
      progress: 0,
      status: 'converting',
      message: 'Starting conversion...'
    });

    try {
      const request: SmartConversionRequest = {
        file: selectedFile,
        targetFormat: targetFormat as any,
        qualityLevel,
        preserveLayout,
        optimizeForWeb,
        customSettings: selectedPreset ? selectedPreset.customSettings : customSettings
      };

      const response = await smartConversionService.smartConvert(request);
      setResult(response);
      setConversionProgress(null);
    } catch (error: any) {
      setError(error.message);
      setConversionProgress(null);
    } finally {
      setIsConverting(false);
    }
  };


  const handleDownload = async (filename: string, originalName: string) => {
    try {
      const blob = await smartConversionService.downloadConvertedFile(filename);
      smartConversionService.downloadFileFromBlob(blob, originalName);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const getFileIcon = (filename: string) => {
    const category = smartConversionService.getFileTypeCategory(filename);
    
    switch (category) {
      case 'document':
        return <FileText className="w-8 h-8 text-blue-600" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="w-8 h-8 text-green-600" />;
      case 'presentation':
        return <Presentation className="w-8 h-8 text-orange-600" />;
      case 'image':
        return <FileImage className="w-8 h-8 text-purple-600" />;
      default:
        return <File className="w-8 h-8 text-gray-600" />;
    }
  };


  const getPresetIcon = (preset: ConversionPreset) => {
    switch (preset.name) {
      case 'Web Optimized':
        return <Monitor className="w-5 h-5" />;
      case 'Print Quality':
        return <Printer className="w-5 h-5" />;
      case 'Archive':
        return <HardDrive className="w-5 h-5" />;
      case 'Mobile Friendly':
        return <Smartphone className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link to="/pdf-tools" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Smart Conversion</h1>
                <p className="text-gray-600">AI-powered format detection and optimal conversion</p>
              </div>
            </div>
          </div>
        </div>


        {/* Upload Section - Full Width Initially */}
        {!selectedFile && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Upload File
            </h3>
              
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <div className="space-y-3">
                    {getFileIcon((selectedFile as File).name)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{(selectedFile as File).name}</p>
                      <p className="text-xs text-gray-500">
                        {smartConversionService.formatFileSize((selectedFile as File).size)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        setFormatAnalysis(null);
                        setResult(null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-sm text-gray-600">
                        Drag and drop your file here, or{' '}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-blue-600 hover:text-blue-500 font-medium"
                        >
                          browse
                        </button>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Supports PDF, Word, Excel, PowerPoint, Images, and more
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.odt,.ods,.odp,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.svg,.eps,.ai"
              />
            </Card>
        )}

        {/* File Info + Settings Layout - After Upload, Before Conversion */}
        {selectedFile && !result && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* File Info */}
            <div>
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  File Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(selectedFile.name)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {smartConversionService.formatFileSize(selectedFile!.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setFormatAnalysis(null);
                      setResult(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </Card>

              {/* Format Analysis */}
              {formatAnalysis && (
                <Card className="p-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Eye className="w-5 h-5 mr-2" />
                    Format Analysis
                  </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Detected Format:</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {formatAnalysis.detectedFormat}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Confidence:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round(formatAnalysis.confidence * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Quality:</span>
                    <span className={`text-sm font-medium capitalize ${
                      formatAnalysis.quality === 'excellent' ? 'text-green-600' :
                      formatAnalysis.quality === 'good' ? 'text-blue-600' :
                      formatAnalysis.quality === 'medium' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {formatAnalysis.quality}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Complexity:</span>
                    <span className={`text-sm font-medium capitalize ${
                      formatAnalysis.complexity === 'low' ? 'text-green-600' :
                      formatAnalysis.complexity === 'medium' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {formatAnalysis.complexity}
                    </span>
                  </div>
                  {formatAnalysis.metadata.pageCount && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Pages:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatAnalysis.metadata.pageCount}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            )}
            </div>

            {/* Settings Column */}
            <div>
              <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Conversion Settings
              </h3>

              {/* Mode Selection */}
              <div className="mb-4">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveMode('smart')}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeMode === 'smart'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Brain className="w-4 h-4 inline mr-1" />
                    Smart
                  </button>
                  <button
                    onClick={() => setActiveMode('presets')}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeMode === 'presets'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Target className="w-4 h-4 inline mr-1" />
                    Presets
                  </button>
                  <button
                    onClick={() => setActiveMode('custom')}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeMode === 'custom'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Gauge className="w-4 h-4 inline mr-1" />
                    Custom
                  </button>
                </div>
              </div>

              {/* Target Format */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Format
                </label>
                <select
                  value={targetFormat}
                  onChange={(e) => setTargetFormat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {formatAnalysis?.recommendations?.targetFormats?.map((format: string) => (
                    <option key={format} value={format}>
                      {format.toUpperCase()}
                    </option>
                  )) || (
                    <>
                      <option value="pdf">PDF</option>
                      <option value="word">Word</option>
                      <option value="excel">Excel</option>
                      <option value="powerpoint">PowerPoint</option>
                      <option value="html">HTML</option>
                      <option value="txt">Text</option>
                      <option value="image">Image</option>
                    </>
                  )}
                </select>
              </div>

              {/* Presets */}
              {activeMode === 'presets' && (
                <div className="space-y-3">
                  {CONVERSION_PRESETS.map((preset) => (
                    <div
                      key={preset.name}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedPreset?.name === preset.name
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPreset(preset)}
                    >
                      <div className="flex items-center space-x-3">
                        {getPresetIcon(preset)}
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{preset.name}</h4>
                          <p className="text-xs text-gray-600">{preset.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Custom Settings */}
              {activeMode === 'custom' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quality Level
                    </label>
                    <select
                      value={qualityLevel}
                      onChange={(e) => setQualityLevel(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="auto">Auto</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="preserveLayout"
                      checked={preserveLayout}
                      onChange={(e) => setPreserveLayout(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="preserveLayout" className="text-sm text-gray-700">
                      Preserve Layout
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="optimizeForWeb"
                      checked={optimizeForWeb}
                      onChange={(e) => setOptimizeForWeb(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="optimizeForWeb" className="text-sm text-gray-700">
                      Optimize for Web
                    </label>
                  </div>
                </div>
              )}

              {/* Convert Button */}
              <div className="mt-6">
                <Button
                  onClick={handleConvert}
                  disabled={!selectedFile || isConverting || isAnalyzing}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isConverting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Converting...
                    </>
                  ) : isAnalyzing ? (
                    <>
                      <Brain className="w-4 h-4 mr-2 animate-pulse" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Smart Convert
                    </>
                  )}
                </Button>
              </div>
              </Card>
            </div>
          </div>
        )}

        {/* Results Section - After Conversion */}
        {(result || error) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* File Info */}
            <div>
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  File Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(selectedFile!.name)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedFile!.name}</p>
                      <p className="text-xs text-gray-500">
                        {smartConversionService.formatFileSize(selectedFile!.size)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Results */}
            <div className="space-y-6">
            {/* Progress */}
            {conversionProgress && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Conversion Progress
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {conversionProgress.currentFile}
                    </span>
                    <span className="text-gray-900">
                      {conversionProgress.fileIndex + 1} of {conversionProgress.totalFiles}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${conversionProgress.progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">{conversionProgress.message}</p>
                </div>
              </Card>
            )}

            {/* Error */}
            {error && (
              <Card className="p-6 border-red-200 bg-red-50">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Single File Result */}
            {result && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Conversion Complete
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Source Format</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {result.conversion.sourceFormat}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Target Format</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {result.conversion.targetFormat}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Original Size</p>
                      <p className="text-sm font-medium text-gray-900">
                        {smartConversionService.formatFileSize(result.conversion.originalSize)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Converted Size</p>
                      <p className="text-sm font-medium text-gray-900">
                        {smartConversionService.formatFileSize(result.conversion.convertedSize)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Size Change</span>
                      <span className={`text-sm font-medium ${
                        result.conversion.sizeChange < 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.conversion.sizeChange < 0 ? '-' : '+'}
                        {Math.abs(parseFloat(result.conversion.sizeChangePercent))}%
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleDownload(result.conversion.outputFilename, result.conversion.outputFilename)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Converted File
                  </Button>
                </div>
              </Card>
            )}

            {/* Info Card */}
            {!result && !error && (
              <Card className="p-6">
                <div className="text-center py-8">
                  <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Smart Conversion Ready</h3>
                  <p className="text-gray-600">
                    Upload a file to get started with AI-powered format detection and optimal conversion.
                  </p>
                </div>
              </Card>
            )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartConversion;
