import React, { useState, useRef, useEffect } from 'react';
import { 
  Eye, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  FileDown, 
  ArrowLeft, 
  Trash2,
  Play,
  Loader2,
  Globe,
  Target,
  Settings,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { Button } from '../DocumentService/ui/button';
import { Card } from '../DocumentService/ui/card';
import { ocrService } from '../../services/ocrService';
import type { 
  OCRRequest, 
  OCRResponse, 
  OCRLanguage,
} from '../../types/ocr';
import { Link } from 'react-router-dom';

const OCR: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<OCRResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [languages, setLanguages] = useState<OCRLanguage[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('eng');
  const [accuracy, setAccuracy] = useState<'fast' | 'balanced' | 'accurate'>('balanced');
  const [outputFormat, setOutputFormat] = useState<'pdf' | 'txt'>('pdf');
  const [options, setOptions] = useState({
    autoDeskew: true,
    removeNoise: true,
    enhanceImage: true,
    preserveFormatting: true,
    createTextLayer: true
  });
  const [progress, setProgress] = useState<{ current: number; total: number; percentage: number }>({
    current: 0,
    total: 0,
    percentage: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      const languagesData = await ocrService.getAvailableLanguages();
      setLanguages(languagesData);
      if (languagesData.length > 0) {
        setSelectedLanguage(languagesData[0].code);
      }
    } catch (error) {
      console.error('Error loading languages:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => ocrService.validateFileType(file));
    
    if (validFiles.length !== files.length) {
      setError('Some files are not supported and will be ignored');
    }
    
    if (validFiles.length > 5) {
      setError('Maximum 5 files allowed. Only the first 5 will be processed.');
      setSelectedFiles(validFiles.slice(0, 5));
    } else {
      setSelectedFiles(validFiles);
      setError(null);
    }
    
    setResult(null);
  };

  const handleOptionChange = (key: string, value: boolean) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    setResult(null);
    setError(null);
  };

  const handleOCR = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress({ current: 0, total: selectedFiles.length, percentage: 0 });

    try {
      const request: OCRRequest = {
        files: selectedFiles,
        language: selectedLanguage,
        accuracy,
        outputFormat,
        options
      };

      const response = await ocrService.performOCR(request);
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
      console.error('OCR error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during OCR processing');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      await ocrService.downloadFile(filename);
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download file');
    }
  };

  const formatFileSize = (bytes: number): string => {
    return ocrService.formatFileSize(bytes);
  };

  const formatConfidence = (confidence: string): string => {
    return ocrService.formatConfidence(confidence);
  };

  const getLanguageName = (code: string): string => {
    return ocrService.getLanguageName(languages, code);
  };

  return (
      <div className="mx-auto space-y-6">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              to="/pdf-tools"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">OCR & Text Recognition</h1>
              <p className="mt-2 text-sm text-gray-600">
               High-accuracy OCR for scanned documents with 100+ language support
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
                <h2 className="text-xl font-semibold text-gray-900">Upload Files</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {selectedFiles.length}/5 files
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
                    {selectedFiles.length === 0 ? 'Select files for OCR' : `${selectedFiles.length} file(s) selected`}
                  </p>
                  <p className="text-gray-500">
                    Drag and drop PDF or image files here, or click to browse
                  </p>
                  <p className="text-sm text-gray-400">
                    Maximum 2MB. Supports PDF, JPG, PNG, TIFF, BMP
                  </p>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.tiff,.bmp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4"
                  disabled={selectedFiles.length >= 5}
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
                        <span className="text-2xl">{ocrService.getFileTypeIcon(file)}</span>
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

            {/* OCR Settings */}
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Settings className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">OCR Settings</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Language Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="h-4 w-4 inline mr-2" />
                    Language
                  </label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name} ({lang.code})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {languages.find(l => l.code === selectedLanguage)?.confidence && 
                      `Expected accuracy: ${(languages.find(l => l.code === selectedLanguage)?.confidence! * 100).toFixed(1)}%`
                    }
                  </p>
                </div>

                {/* Accuracy Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Target className="h-4 w-4 inline mr-2" />
                    Accuracy Level
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="accuracy"
                        value="fast"
                        checked={accuracy === 'fast'}
                        onChange={(e) => setAccuracy(e.target.value as any)}
                        className="text-blue-600"
                      />
                      <span className="text-sm">Fast (Good for simple documents)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="accuracy"
                        value="balanced"
                        checked={accuracy === 'balanced'}
                        onChange={(e) => setAccuracy(e.target.value as any)}
                        className="text-blue-600"
                      />
                      <span className="text-sm">Balanced (Recommended)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="accuracy"
                        value="accurate"
                        checked={accuracy === 'accurate'}
                        onChange={(e) => setAccuracy(e.target.value as any)}
                        className="text-blue-600"
                      />
                      <span className="text-sm">High Accuracy (Best for complex layouts)</span>
                    </label>
                  </div>
                </div>

                {/* Output Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileDown className="h-4 w-4 inline mr-2" />
                    Output Format
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="outputFormat"
                        value="pdf"
                        checked={outputFormat === 'pdf'}
                        onChange={(e) => setOutputFormat(e.target.value as any)}
                        className="text-blue-600"
                      />
                      <span className="text-sm">Searchable PDF</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="outputFormat"
                        value="txt"
                        checked={outputFormat === 'txt'}
                        onChange={(e) => setOutputFormat(e.target.value as any)}
                        className="text-blue-600"
                      />
                      <span className="text-sm">Plain Text</span>
                    </label>
                  </div>
                  {outputFormat === 'pdf' && (
                    <p className="text-xs text-amber-600 mt-2 bg-amber-50 p-2 rounded">
                      <Info className="h-3 w-3 inline mr-1" />
                      Note: If PDF creation fails due to system restrictions, a text file will be created as fallback.
                    </p>
                  )}
                </div>

                {/* Advanced Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Sparkles className="h-4 w-4 inline mr-2" />
                    Advanced Options
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={options.autoDeskew}
                        onChange={(e) => handleOptionChange('autoDeskew', e.target.checked)}
                        className="text-blue-600 rounded"
                      />
                      <span className="text-sm">Auto-deskew pages</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={options.removeNoise}
                        onChange={(e) => handleOptionChange('removeNoise', e.target.checked)}
                        className="text-blue-600 rounded"
                      />
                      <span className="text-sm">Remove background noise</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={options.enhanceImage}
                        onChange={(e) => handleOptionChange('enhanceImage', e.target.checked)}
                        className="text-blue-600 rounded"
                      />
                      <span className="text-sm">Enhance image quality</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={options.preserveFormatting}
                        onChange={(e) => handleOptionChange('preserveFormatting', e.target.checked)}
                        className="text-blue-600 rounded"
                      />
                      <span className="text-sm">Preserve formatting</span>
                    </label>
                  </div>
                </div>
              </div>
            </Card>

            {/* Process Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleOCR}
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
                    Start OCR Processing
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
                  <Eye className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">OCR & Text Recognition</h3>
                  <p className="text-sm text-gray-600">High-accuracy text extraction</p>
                </div>
              </div>
              
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>100+ languages supported</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>High accuracy OCR</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Confidence scoring</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Multiple output formats</span>
                </div>
              </div>
            </Card>

            {/* Results */}
            {result && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">OCR Results</h3>
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-600">
                      {result.summary.successfulFiles}/{result.summary.totalFiles} successful
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Language</p>
                        <p className="font-semibold">{getLanguageName(result.summary.language)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Accuracy</p>
                        <p className="font-semibold">{result.summary.accuracy}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Format</p>
                        <p className="font-semibold">
                          {result.summary.outputFormat.toUpperCase()}
                          {result.results.some(r => r.outputFilename.endsWith('.txt')) && 
                           result.summary.outputFormat === 'pdf' && (
                            <span className="text-xs text-amber-600 ml-1"></span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Failed</p>
                        <p className="font-semibold text-red-600">{result.summary.failedFiles}</p>
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
                            Download {fileResult.outputFilename.endsWith('.txt') ? 'Text' : 'PDF'}
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                          <div>
                            <span className="text-green-600">Confidence:</span> {formatConfidence(fileResult.confidence)}
                          </div>
                          <div>
                            <span className="text-green-600">Text Length:</span> {fileResult.textLength} chars
                          </div>
                          <div>
                            <span className="text-green-600">Original:</span> {formatFileSize(fileResult.originalSize)}
                          </div>
                          <div>
                            <span className="text-green-600">Processed:</span> {formatFileSize(fileResult.processedSize)}
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

export default OCR;
