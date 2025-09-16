import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  FileText,
  Table,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Merge,
  Grid,
  ArrowLeft
} from 'lucide-react';
import { extractTablesService } from '../../services/extractTablesService';
import type { ExtractTablesRequest, ExtractTablesResponse, ExtractTablesResult } from '../../types/extractTables';
import { Link, useLocation } from 'react-router-dom';

const ExtractTables: React.FC = () => {
  const location = useLocation();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [detectionMethod, setDetectionMethod] = useState<'auto' | 'manual' | 'all'>('auto');
  const [outputFormat, setOutputFormat] = useState<'xlsx' | 'csv' | 'xls'>('xlsx');
  const [preserveFormatting, setPreserveFormatting] = useState(true);
  const [extractHeaders, setExtractHeaders] = useState(true);
  const [mergeTables, setMergeTables] = useState(false);
  const [pageRange, setPageRange] = useState('');
  const [language, setLanguage] = useState('eng');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ExtractTablesResult[]>([]);
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

  const detectionMethods = [
    { value: 'auto', label: 'Auto-detect tables', description: 'Intelligent table detection using AI' },
    { value: 'manual', label: 'Manual selection', description: 'Select specific areas for extraction' },
    { value: 'all', label: 'Convert all content', description: 'Extract all structured data' }
  ];

  const outputFormats = [
    { value: 'xlsx', label: 'Excel (.xlsx)', description: 'Modern Excel format with full features' },
    { value: 'xls', label: 'Excel 97-2003 (.xls)', description: 'Compatible with older Excel versions' },
    { value: 'csv', label: 'CSV (.csv)', description: 'Simple text format for data analysis' }
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

  const handleExtractTables = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one PDF file');
      return;
    }

    if (pageRange && !extractTablesService.validatePageRange(pageRange)) {
      setError('Invalid page range format. Use format like: 1-5, 10, 15-20');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResults([]);

    try {
      const request: ExtractTablesRequest = {
        files: selectedFiles,
        detectionMethod,
        outputFormat,
        preserveFormatting,
        extractHeaders,
        mergeTables,
        pageRange: pageRange || undefined,
        language
      };

      const response: ExtractTablesResponse = await extractTablesService.extractTables(request);
      setResults(response.results);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during table extraction');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      await extractTablesService.downloadFile(filename);
    } catch (error) {
      setError('Error downloading file');
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setResults([]);
    setError(null);
  };

  const getLanguageName = (code: string): string => {
    return languages.find(l => l.code === code)?.name || code;
  };

  const getDetectionMethodLabel = (value: string): string => {
    return detectionMethods.find(m => m.value === value)?.label || value;
  };

  const getOutputFormatLabel = (value: string): string => {
    return outputFormats.find(f => f.value === value)?.label || value;
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
              <h1 className="text-3xl font-bold text-gray-900">Extract Tables</h1>
              <p className="mt-2 text-sm text-gray-600">
                Recognize and extract table data from PDFs with intelligent detection
              </p>
            </div>
          </div>
        </div>
      </div>
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Upload PDFs</h3>

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
              <p className="text-sm text-gray-500">Upload file having less pages and smaller sizes for better performance upto 2MB</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            {selectedFiles.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Selected Files ({selectedFiles.length})
                  </span>
                  <button
                    onClick={clearAll}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({extractTablesService.formatFileSize(file.size)})
                        </span>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - File Upload and Settings */}
        <div className="lg:col-span-1 space-y-6">
          {/* File Upload */}
        

          {/* Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Extraction Settings
            </h3>

            <div className="space-y-4">
              {/* Detection Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detection Method
                </label>
                <select
                  value={detectionMethod}
                  onChange={(e) => setDetectionMethod(e.target.value as 'auto' | 'manual' | 'all')}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {detectionMethods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label} - {method.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Output Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Output Format
                </label>
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as 'xlsx' | 'csv' | 'xls')}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {outputFormats.map((format) => (
                    <option key={format.value} value={format.value}>
                      {format.label} - {format.description}
                    </option>
                  ))}
                </select>
              </div>

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

              {/* Page Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Range (Optional)
                </label>
                <input
                  type="text"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder="e.g., 1-5, 10, 15-20"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to process all pages
                </p>
              </div>

              {/* Processing Options */}
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={preserveFormatting}
                    onChange={(e) => setPreserveFormatting(e.target.checked)}
                    className="text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    <Eye className="h-4 w-4 inline mr-2" />
                    Preserve Formatting
                  </span>
                </label>
                <p className="text-xs text-gray-500 ml-6">
                  Maintain original text formatting and structure
                </p>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={extractHeaders}
                    onChange={(e) => setExtractHeaders(e.target.checked)}
                    className="text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    <Grid className="h-4 w-4 inline mr-2" />
                    Extract Headers
                  </span>
                </label>
                <p className="text-xs text-gray-500 ml-6">
                  Use first row as column headers
                </p>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={mergeTables}
                    onChange={(e) => setMergeTables(e.target.checked)}
                    className="text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    <Merge className="h-4 w-4 inline mr-2" />
                    Merge Tables
                  </span>
                </label>
                <p className="text-xs text-gray-500 ml-6">
                  Combine all tables into one output file
                </p>
              </div>
            </div>
          </div>

          {/* Process Button */}
          <button
            onClick={handleExtractTables}
            disabled={isProcessing || selectedFiles.length === 0}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Extracting Tables...</span>
              </>
            ) : (
              <>
                <Table className="h-5 w-5" />
                <span>Extract Tables</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Extraction Results ({results.length} files)
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {results.map((result, index) => (
                  <div key={index} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Table className="h-5 w-5 text-gray-500" />
                          <h4 className="font-medium text-gray-900">{result.filename}</h4>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Success
                          </span>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <span>Tables Detected: {result.tablesDetected}</span>
                            <span>•</span>
                            <span>Total Rows: {result.totalRows}</span>
                            <span>•</span>
                            <span>Total Columns: {result.totalColumns}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span>Detection: {getDetectionMethodLabel(result.detectionMethod)}</span>
                            <span>•</span>
                            <span>Output: {getOutputFormatLabel(result.outputFormat)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span>Language: {getLanguageName(result.language)}</span>
                            <span>•</span>
                            <span>Pages Processed: {result.pagesProcessed || 'N/A'}</span>
                            <span>•</span>
                            <span>Processing Time: {result.processingTime}ms</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span>Original Size: {extractTablesService.formatFileSize(result.originalSize)}</span>
                            <span>•</span>
                            <span>Output Size: {extractTablesService.formatFileSize(result.processedSize)}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownload(result.outputFilename)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tool Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">How It Works</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Convert PDF pages to high-resolution images</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Use AI-powered table detection algorithms</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Extract structured data with layout preservation</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Generate Excel, CSV, or other formats</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Support for multiple languages and table types</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtractTables;
