import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, BarChart3, AlertCircle, CheckCircle, Loader2, File, GitCompare, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import pdfStatisticsService, { type PdfStatisticsResult, type ComparisonResult, type ComparisonSummary } from '../../services/pdfStatisticsService';

const PDFStatistics: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PdfStatisticsResult | null>(null);
  const [comparisonResults, setComparisonResults] = useState<{ results: ComparisonResult[]; summary: ComparisonSummary } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [analysisType, setAnalysisType] = useState<'single' | 'compare'>('single');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const pdfFiles = acceptedFiles.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length === 0) {
      setError('Please select PDF files only');
      return;
    }

    if (analysisType === 'single') {
      setSelectedFile(pdfFiles[0]);
      setSelectedFiles([]);
    } else {
      setSelectedFiles(pdfFiles);
      setSelectedFile(null);
    }
    
    setError(null);
    setAnalysisResult(null);
    setComparisonResults(null);
    toast.success(`${pdfFiles.length} PDF file(s) selected successfully`);
  }, [analysisType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: analysisType === 'compare'
  });

  const analyzeSinglePdf = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await pdfStatisticsService.analyzePdf(selectedFile);
      setAnalysisResult(result);
      toast.success('PDF analysis completed successfully');
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to analyze PDF: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const comparePdfs = async () => {
    if (selectedFiles.length < 2) {
      setError('Please select at least 2 PDF files for comparison');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await pdfStatisticsService.comparePdfs(selectedFiles);
      setComparisonResults({ results: result.comparisonResults, summary: result.comparisonSummary });
      toast.success('PDF comparison completed successfully');
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to compare PDFs: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setAnalysisResult(null);
    setComparisonResults(null);
    setSelectedFile(null);
    setSelectedFiles([]);
    setError(null);
    toast.success('Results cleared');
  };

  return (
    <div className="mx-auto space-y-6">
      {/* Header */}
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
              <h1 className="text-3xl font-bold text-gray-900">PDF Statistics</h1>
              <p className="mt-2 text-sm text-gray-600">
                Analyze document content, performance metrics, and usage statistics
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border">
          {!selectedFile && selectedFiles.length === 0 ? (
            /* Upload Section */
            <div className="p-8">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Upload PDF Files</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Select PDF files to analyze their content and performance metrics
                </p>

                {/* Analysis Type Selector */}
                <div className="flex gap-4 mb-6 justify-center">
                  <button
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                      analysisType === 'single'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                    }`}
                    onClick={() => setAnalysisType('single')}
                  >
                    <FileText className="w-4 h-4" />
                    Single Analysis
                  </button>
                  <button
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                      analysisType === 'compare'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                    }`}
                    onClick={() => setAnalysisType('compare')}
                  >
                    <GitCompare className="w-4 h-4" />
                    Compare PDFs
                  </button>
                </div>

                {/* Dropzone */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-4">
                    <Upload className="w-12 h-12 text-gray-400" />
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">
                        {isDragActive
                          ? 'Drop your PDF files here'
                          : analysisType === 'single'
                          ? 'Drag & drop a PDF file here, or click to select'
                          : 'Drag & drop PDF files here, or click to select'}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {analysisType === 'single'
                          ? 'Select a single PDF file for comprehensive analysis'
                          : 'Select multiple PDF files for comparison analysis'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Main Working Area */
            <div className="flex flex-col h-[600px]">
              {/* File Selection Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {analysisType === 'single' ? 'Single Analysis' : 'Compare PDFs'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {analysisType === 'single'
                        ? 'Analyze content, performance, and usage statistics'
                        : 'Compare multiple PDFs side by side'}
                    </p>
                  </div>
                  <button
                    onClick={clearResults}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Selected Files */}
              <div className="p-4 border-b border-gray-200">
                {selectedFile && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <File className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">{selectedFile.name}</p>
                      <p className="text-xs text-blue-700">{pdfStatisticsService.formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                )}

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Selected Files ({selectedFiles.length})</h4>
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <File className="w-5 h-5 text-gray-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-600">{pdfStatisticsService.formatFileSize(file.size)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 flex gap-3">
                  {analysisType === 'single' && selectedFile && (
                    <button
                      onClick={analyzeSinglePdf}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <BarChart3 className="w-4 h-4" />
                      )}
                      {isLoading ? 'Analyzing...' : 'Analyze PDF'}
                    </button>
                  )}

                  {analysisType === 'compare' && selectedFiles.length >= 2 && (
                    <button
                      onClick={comparePdfs}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <GitCompare className="w-4 h-4" />
                      )}
                      {isLoading ? 'Comparing...' : 'Compare PDFs'}
                    </button>
                  )}
                </div>
              </div>

              {/* Results Section */}
              {(analysisResult || comparisonResults) && (
                <div className="flex-1 flex flex-col">
                  {/* Tabs */}
                  <div className="flex border-b border-gray-200">
                    <button
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 ${
                        activeTab === 'overview'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setActiveTab('overview')}
                    >
                      <BarChart3 className="w-4 h-4" />
                      Overview
                    </button>
                    <button
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 ${
                        activeTab === 'comparison'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setActiveTab('comparison')}
                    >
                      <GitCompare className="w-4 h-4" />
                      Comparison
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 p-6 overflow-auto">
                    {activeTab === 'overview' && analysisResult && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Document Overview */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <h4 className="font-medium text-gray-900">Document Overview</h4>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Total Pages</span>
                              <span className="text-sm font-medium">{analysisResult.summary.totalPages}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">File Size</span>
                              <span className="text-sm font-medium">{pdfStatisticsService.formatFileSize(analysisResult.fileSize)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Processing Time</span>
                              <span className="text-sm font-medium">{analysisResult.processingTime}ms</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Text Density</span>
                              <span className="text-sm font-medium">{analysisResult.summary.textDensity} chars/page</span>
                            </div>
                          </div>
                        </div>

                        {/* Content Analysis */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <BarChart3 className="w-5 h-5 text-blue-600" />
                            <h4 className="font-medium text-gray-900">Content Analysis</h4>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Total Images</span>
                              <span className="text-sm font-medium">{analysisResult.contentAnalysis.totalImages}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Total Fonts</span>
                              <span className="text-sm font-medium">{analysisResult.contentAnalysis.totalFonts}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Has Bookmarks</span>
                              <span className="flex items-center">
                                {analysisResult.summary.hasBookmarks ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-red-600" />
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Has Forms</span>
                              <span className="flex items-center">
                                {analysisResult.summary.hasForms ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-red-600" />
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Performance Metrics */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <BarChart3 className="w-5 h-5 text-blue-600" />
                            <h4 className="font-medium text-gray-900">Performance Metrics</h4>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Efficiency Score</span>
                              <span 
                                className="text-sm font-medium"
                                style={{ color: pdfStatisticsService.getScoreColor(analysisResult.performanceMetrics.efficiencyScore) }}
                              >
                                {analysisResult.performanceMetrics.efficiencyScore}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Compression Ratio</span>
                              <span className="text-sm font-medium">{analysisResult.performanceMetrics.compressionRatio}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Size per Page</span>
                              <span className="text-sm font-medium">{pdfStatisticsService.formatFileSize(analysisResult.performanceMetrics.sizePerPage)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">CPU Intensity</span>
                              <span 
                                className="text-sm font-medium"
                                style={{ color: pdfStatisticsService.getIntensityColor(analysisResult.performanceMetrics.cpuIntensity) }}
                              >
                                {analysisResult.performanceMetrics.cpuIntensity}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'comparison' && comparisonResults && (
                      <div className="space-y-6">
                        {/* Comparison Summary */}
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 mb-4">Comparison Summary</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                              <div className="text-2xl font-bold text-gray-900">{comparisonResults.summary.totalFiles}</div>
                              <div className="text-sm text-gray-600">Total Files</div>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                              <div className="text-2xl font-bold text-gray-900">{pdfStatisticsService.formatFileSize(comparisonResults.summary.totalSize)}</div>
                              <div className="text-sm text-gray-600">Total Size</div>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                              <div className="text-2xl font-bold text-gray-900">{comparisonResults.summary.totalPages}</div>
                              <div className="text-sm text-gray-600">Total Pages</div>
                            </div>
                          </div>
                        </div>

                        {/* Individual Results */}
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 mb-4">Individual Results</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {comparisonResults.results.map((result, index) => (
                              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <File className="w-5 h-5 text-blue-600" />
                                  <h5 className="font-medium text-gray-900 truncate">{result.filename}</h5>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Size</span>
                                    <span className="text-sm font-medium">{pdfStatisticsService.formatFileSize(result.fileSize)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Pages</span>
                                    <span className="text-sm font-medium">{result.contentAnalysis.pageCount}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Efficiency</span>
                                    <span 
                                      className="text-sm font-medium"
                                      style={{ color: pdfStatisticsService.getScoreColor(result.performanceMetrics.efficiencyScore) }}
                                    >
                                      {result.performanceMetrics.efficiencyScore}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFStatistics;