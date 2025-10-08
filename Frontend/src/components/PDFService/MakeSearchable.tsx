import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  FileText,
  Search,
  Settings,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Sparkles,
  ArrowLeft,
  X
} from 'lucide-react';
import { Button } from '../DocumentService/ui/button';
import { Card } from '../DocumentService/ui/card';
import { makeSearchableService } from '../../services/makeSearchableService';
import type { MakeSearchableRequest, MakeSearchableResponse, MakeSearchableResult } from '../../types/makeSearchable';
import { Link, useLocation } from 'react-router-dom';

const MakeSearchable: React.FC = () => {
   const location = useLocation();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [language, setLanguage] = useState('eng');
  const [accuracy, setAccuracy] = useState<'fast' | 'balanced' | 'accurate'>('balanced');
  const [preserveLayout, setPreserveLayout] = useState(true);
  const [createInvisibleLayer, setCreateInvisibleLayer] = useState(true);
  const [enhanceImage, setEnhanceImage] = useState(true);
  const [removeNoise, setRemoveNoise] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [results, setResults] = useState<MakeSearchableResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const languages = [
    { code: 'eng', name: 'English', confidence: 0.95 },
    { code: 'jpn', name: 'Japanese', confidence: 0.90 },
    { code: 'chi_sim', name: 'Chinese (Simplified)', confidence: 0.88 },
    { code: 'chi_tra', name: 'Chinese (Traditional)', confidence: 0.88 },
    { code: 'kor', name: 'Korean', confidence: 0.85 },
    { code: 'ara', name: 'Arabic', confidence: 0.82 },
    { code: 'rus', name: 'Russian', confidence: 0.87 },
    { code: 'deu', name: 'German', confidence: 0.93 },
    { code: 'fra', name: 'French', confidence: 0.92 },
    { code: 'spa', name: 'Spanish', confidence: 0.91 },
    { code: 'ita', name: 'Italian', confidence: 0.90 },
    { code: 'por', name: 'Portuguese', confidence: 0.89 }
  ];

  const accuracyLevels = [
    { value: 'fast', label: 'Fast', description: 'Quick processing, lower accuracy' },
    { value: 'balanced', label: 'Balanced', description: 'Good balance of speed and accuracy' },
    { value: 'accurate', label: 'Accurate', description: 'Highest accuracy, slower processing' }
  ];



  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');

    if (pdfFiles.length !== files.length) {
      setError('Only PDF files are supported');
      return;
    }

    setSelectedFiles(pdfFiles);
    setError(null);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');

    if (pdfFiles.length !== files.length) {
      setError('Only PDF files are supported');
      return;
    }

    setSelectedFiles(pdfFiles);
    setError(null);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleMakeSearchable = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one PDF file');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResults([]);
    setProgress({ current: 0, total: selectedFiles.length, percentage: 0 });

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      const request: MakeSearchableRequest = {
        files: selectedFiles,
        language,
        accuracy,
        preserveLayout,
        createInvisibleLayer,
        enhanceImage,
        removeNoise
      };

      // Start progress simulation during API call
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev.percentage < 90) {
            const increment = Math.random() * 15 + 5; // Random increment between 5-20%
            return {
              ...prev,
              percentage: Math.min(prev.percentage + increment, 90)
            };
          }
          return prev;
        });
      }, 1000);

      const response: MakeSearchableResponse = await makeSearchableService.makeSearchable(request);
      
      // Clear interval and set to 100% when done
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setProgress({ 
        current: selectedFiles.length, 
        total: selectedFiles.length, 
        percentage: 100 
      });
      
      setResults(response.results);
    } catch (error) {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setError(error instanceof Error ? error.message : 'An error occurred during processing');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      await makeSearchableService.downloadFile(filename);
    } catch (error) {
      setError('Error downloading file');
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };


  const getLanguageName = (code: string): string => {
    return languages.find(l => l.code === code)?.name || code;
  };

  const getAccuracyLabel = (value: string): string => {
    return accuracyLevels.find(a => a.value === value)?.label || value;
  };

  // Show only result when processing is successful - hide everything else
  if (results.length > 0 && !isProcessing) {
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
                <h1 className="text-3xl font-bold text-gray-900">Make Searchable</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Convert scanned PDFs to searchable documents with preserved layout
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Show only the result - everything else is hidden */}
        <div className="max-w-7xl mx-auto p-6">
          <Card className="p-6">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Processing Complete!</h3>
              <p className="text-gray-600">Your PDF is now selectable and searchable</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{results.length}</p>
                <p className="text-sm text-gray-600">Files Processed</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{getLanguageName(results[0]?.language)}</p>
                <p className="text-sm text-gray-600">Language</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{getAccuracyLabel(results[0]?.accuracy)}</p>
                <p className="text-sm text-gray-600">Accuracy</p>
              </div>
            </div>

            {/* Individual Results */}
            <div className="space-y-4 mb-6">
              <h4 className="font-medium text-gray-900">File Results:</h4>
              {results.map((result, index) => (
                <div key={index} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-green-900">{result.filename}</span>
                    <Button
                      onClick={() => handleDownload(result.outputFilename)}
                      size="sm"
                      variant="outline"
                      className="text-green-700 border-green-300 hover:bg-green-100"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                    <div>
                      <span className="text-green-600">Language:</span> {getLanguageName(result.language)}
                    </div>
                    <div>
                      <span className="text-green-600">Accuracy:</span> {getAccuracyLabel(result.accuracy)}
                    </div>
                    <div>
                      <span className="text-green-600">Original:</span> {makeSearchableService.formatFileSize(result.originalSize)}
                    </div>
                    <div>
                      <span className="text-green-600">Processed:</span> {makeSearchableService.formatFileSize(result.processedSize)}
                    </div>
                    <div>
                      <span className="text-green-600">Text Length:</span> {result.textLength} chars
                    </div>
                    <div>
                      <span className="text-green-600">Confidence:</span> {result.confidence}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => setResults([])}
                variant="outline"
              >
                Back to Configuration
              </Button>
              <Button
                onClick={() => {
                  setSelectedFiles([]);
                  setResults([]);
                  setError(null);
                  setProgress({ current: 0, total: 0, percentage: 0 });
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                variant="outline"
              >
                Start New Processing
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold text-gray-900">Make Searchable</h1>
              <p className="mt-2 text-sm text-gray-600">
                Convert scanned PDFs to searchable documents with preserved layout
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        {/* File Upload - Only show when no files selected */}
        {selectedFiles.length === 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Upload a PDF that contains scanned images of text (not a PDF with selectable text)</h3>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Drop PDF files here or <span className="text-blue-600 font-medium">click to browse</span>
              </p>
              <p className="text-sm text-gray-500">Supports up to 5 PDF files, 2MB each</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </Card>
        )}

        {/* Selected Files Info - Show after file selection */}
        {selectedFiles.length > 0 && (
          <Card className="p-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-900">Selected PDF Files ({selectedFiles.length})</h3>
               
              </div>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">{makeSearchableService.formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Settings */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Processing Settings
          </h3>

          <div className="space-y-4">
            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} ({(lang.confidence * 100).toFixed(0)}% accuracy)
                  </option>
                ))}
              </select>
            </div>

            {/* Accuracy Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Accuracy Level
              </label>
              <select
                value={accuracy}
                onChange={(e) => setAccuracy(e.target.value as 'fast' | 'balanced' | 'accurate')}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {accuracyLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label} - {level.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Processing Options */}
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={preserveLayout}
                  onChange={(e) => setPreserveLayout(e.target.checked)}
                  className="text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  <Eye className="h-4 w-4 inline mr-2" />
                  Preserve Layout
                </span>
              </label>
              <p className="text-xs text-gray-500 ml-6">
                Maintain original document formatting and structure
              </p>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={createInvisibleLayer}
                  onChange={(e) => setCreateInvisibleLayer(e.target.checked)}
                  className="text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  <EyeOff className="h-4 w-4 inline mr-2" />
                  Create Invisible Text Layer
                </span>
              </label>
              <p className="text-xs text-gray-500 ml-6">
                Add searchable text without visual changes
              </p>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={enhanceImage}
                  onChange={(e) => setEnhanceImage(e.target.checked)}
                  className="text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  <ImageIcon className="h-4 w-4 inline mr-2" />
                  Enhance Image Quality
                </span>
              </label>
              <p className="text-xs text-gray-500 ml-6">
                Improve image clarity for better OCR results
              </p>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={removeNoise}
                  onChange={(e) => setRemoveNoise(e.target.checked)}
                  className="text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  <Sparkles className="h-4 w-4 inline mr-2" />
                  Remove Noise
                </span>
              </label>
              <p className="text-xs text-gray-500 ml-6">
                Clean up image artifacts and improve text clarity
              </p>
            </div>

            {/* Process Button - Integrated with settings */}
            {!isProcessing && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Ready to Process</h4>
                    <span className="text-sm text-blue-600 font-medium">
                      {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Your PDFs will be converted to searchable documents with the settings above.
                  </p>
                  <Button
                    onClick={handleMakeSearchable}
                    disabled={selectedFiles.length === 0}
                    size="lg"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  >
                    <Search className="h-5 w-5 mr-2" />
                    {selectedFiles.length > 0 ? 'Make Searchable' : 'Select Files First'}
                  </Button>
                </div>
                {selectedFiles.length === 0 && (
                  <p className="text-sm text-gray-500 text-center">
                    Upload PDF files above to get started
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Progress Bar - Only show when processing */}
        {isProcessing && (
          <Card className="p-6">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                <Search className="h-6 w-6 text-blue-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Processing Your PDFs</h3>
              <p className="text-sm text-gray-600">Converting scanned PDFs to searchable documents...</p>
            </div>
            <div className="space-y-3">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Processing {progress.total} file{progress.total !== 1 ? 's' : ''}</span>
                <span>{Math.round(progress.percentage)}% complete</span>
              </div>
              <p className="text-sm text-gray-500 text-center">
                {progress.percentage < 100 
                  ? 'Converting scanned PDFs to searchable documents...' 
                  : 'Finalizing results...'}
              </p>
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
  );
};

export default MakeSearchable;
