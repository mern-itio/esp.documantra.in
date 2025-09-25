import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Download,
  FileText,
  Table,
  Settings,
  CheckCircle,
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
  // const [detectionMethod, setDetectionMethod] = useState<'auto' | 'manual' | 'all'>('auto');
  const [outputFormat, setOutputFormat] = useState<'xlsx' | 'csv' | 'xls'>('xlsx');
  const [preserveFormatting, setPreserveFormatting] = useState(true);
  const [extractHeaders, setExtractHeaders] = useState(true);
  const [mergeTables, setMergeTables] = useState(false);
  const [pageRange, setPageRange] = useState('');
  // const [language, setLanguage] = useState('eng');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ExtractTablesResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadingMessages = [
    "Analyzing PDF structure...",
    "Detecting table boundaries...",
    "Extracting table data...",
    "Processing table content...",
    "Optimizing table layout...",
    "Generating output file...",
    "Finalizing results..."
  ];

  // Loading animation effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing) {
      interval = setInterval(() => {
        setCurrentLoadingMessage((prev) => (prev + 1) % loadingMessages.length);
      }, 2000); // Change message every 2 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isProcessing, loadingMessages.length]);


  const outputFormats = [
    { value: 'xlsx', label: 'Excel (.xlsx)', description: 'Modern Excel format with full features' },
    { value: 'xls', label: 'Excel 97-2003 (.xls)', description: 'Compatible with older Excel versions' },
    { value: 'csv', label: 'CSV (.csv)', description: 'Simple text format for data analysis' }
  ];



  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');

    if (pdfFiles.length !== files.length) {
      setError('Only PDF files are supported. Please select valid PDF files.');
      return;
    }

    if (pdfFiles.length === 0) {
      setError('Please select at least one PDF file.');
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
      setError('Only PDF files are supported. Please drop valid PDF files.');
      return;
    }

    if (pdfFiles.length === 0) {
      setError('Please drop at least one PDF file.');
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
        // detectionMethod,
        outputFormat,
        preserveFormatting,
        extractHeaders,
        mergeTables,
        pageRange: pageRange || undefined,
        // language
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

  // const removeFile = (index: number) => {
  //   setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  // };

  const clearAll = () => {
    setSelectedFiles([]);
    setResults([]);
    setError(null);
  };

  const getOutputFormatLabel = (value: string): string => {
    return outputFormats.find(f => f.value === value)?.label || value;
  };

  return (
    <div className="mx-auto space-y-6">
      {/* Header */}
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

      {/* File Upload Section - Only show when no files selected */}
      {selectedFiles.length === 0 && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
          </div>
        </div>
      )}

      {/* File Information - Show when files are selected but no results yet */}
      {selectedFiles.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-800">Selected Files ({selectedFiles.length})</h3>
              <button
                onClick={clearAll}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Clear All
              </button>
            </div>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-green-600" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">{file.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({extractTablesService.formatFileSize(file.size)})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 text-xl">⚠️</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-800">Extraction Failed</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <span className="text-xl">×</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing Animation - Full Width */}
      {isProcessing && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Table className="h-8 w-8 text-blue-800" />
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-blue-800 mb-2">
                {loadingMessages[currentLoadingMessage]}
              </h2>
              <p className="text-blue-600 mb-6">
                Our AI is working hard to extract tables from your PDF files...
              </p>
              <div className="w-full bg-blue-200 rounded-full h-3 mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full animate-pulse" style={{ width: '70%' }}></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Analyzing document structure</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Detecting table patterns</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Extracting data accurately</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Section - Only show when no results */}
      {selectedFiles.length > 0 && !isProcessing && results.length === 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Extraction Settings */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Extraction Settings
                </h3>

                <div className="space-y-4">
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
                  </div>
                </div>

                {/* Process Button */}
                <button
                  onClick={handleExtractTables}
                  disabled={isProcessing || selectedFiles.length === 0}
                  className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>{loadingMessages[currentLoadingMessage]}</span>
                    </>
                  ) : (
                    <>
                      <Table className="h-5 w-5" />
                      <span>Extract Tables</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column - Placeholder */}
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="text-center">
                  <Table className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Ready to Extract Tables
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Your extraction results will appear here once processing is complete.
                  </p>
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Advanced AI-powered table detection</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Multiple output formats (Excel, CSV)</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Preserve original formatting</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Section - Full Width with Interactive Success */}
      {results.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Enhanced Results Cards */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">
                Your Extracted Files
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>{results.length} file{results.length > 1 ? 's' : ''} processed</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {results.map((result, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                  {/* File Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      {/* Left side: File info */}
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                          <FileText className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {result.filename}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Success
                            </span>
                            <span className="text-sm text-gray-500">
                              {extractTablesService.formatFileSize(result.originalSize)} →{" "}
                              {extractTablesService.formatFileSize(result.processedSize)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right side: Buttons together */}
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={clearAll}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center space-x-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          <Upload className="h-5 w-5 mr-2" />
                          Extract Another File
                        </button>

                        <button
                          onClick={() => handleDownload(result.outputFilename)}
                          className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center space-x-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          <Download className="h-5 w-5" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  </div>


                  {/* File Stats */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <div className="text-2xl font-bold text-blue-600">{result.tablesDetected}</div>
                        <div className="text-sm text-gray-600">Tables Found</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <div className="text-2xl font-bold text-green-600">{result.totalRows}</div>
                        <div className="text-sm text-gray-600">Total Rows</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <div className="text-2xl font-bold text-purple-600">{result.totalColumns}</div>
                        <div className="text-sm text-gray-600">Columns</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <div className="text-2xl font-bold text-orange-600">{result.pagesProcessed || 'N/A'}</div>
                        <div className="text-sm text-gray-600">Pages</div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-4 flex flex-wrap items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                          <Table className="h-4 w-4" />
                          <span>{getOutputFormatLabel(result.outputFormat)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Settings className="h-4 w-4" />
                          <span>{result.processingTime}ms</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedFiles.length === 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
      )}
    </div>
  );
};

export default ExtractTables;
