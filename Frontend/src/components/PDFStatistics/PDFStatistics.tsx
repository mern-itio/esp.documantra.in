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
      setActiveTab('overview'); // Set to overview tab for single analysis
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
      setActiveTab('comparison'); // Set to comparison tab for comparison mode
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
    setActiveTab('overview'); // Reset to default tab
    toast.success('Results cleared');
  };

  return (
    <div className="mx-auto space-y-6">
      {/* Header */}
      <div className="bg-background shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              to="/pdf-tools"
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">PDF Statistics</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Analyze document content, performance metrics, and usage statistics
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Content */}
        <div className="bg-background rounded-lg shadow-sm border">
          {!selectedFile && selectedFiles.length === 0 ? (
            /* Upload Section */
            <div className="p-8">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Upload PDF Files</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Select PDF files to analyze their content and performance metrics
                </p>

                {/* Analysis Type Selector */}
                <div className="flex gap-4 mb-6 justify-center">
                  <button
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                      analysisType === 'single'
                          ? 'border-primary text-primary'
                        : 'border-border bg-background text-muted-foreground hover:border-border'
                    }`}
                    onClick={() => setAnalysisType('single')}
                  >
                    <FileText className="w-4 h-4" />
                    Single Analysis
                  </button>
                  <button
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                      analysisType === 'compare'
                        ? 'border-primary  text-primary'
                        : 'border-border bg-background text-muted-foreground hover:border-border'
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
                      ? 'border-primary bg-primary'
                      : 'border-border hover:border-border'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-4">
                    <Upload className="w-12 h-12 text-muted-foreground" />
                    <div>
                      <h4 className="text-lg font-medium text-foreground">
                        {isDragActive
                          ? 'Drop your PDF files here'
                          : analysisType === 'single'
                          ? 'Drag & drop a PDF file here, or click to select'
                          : 'Drag & drop PDF files here, or click to select'}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
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
            <div className="flex flex-col h-full">
              {/* File Selection Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-foreground">
                      {analysisType === 'single' ? 'Single Analysis' : 'Compare PDFs'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {analysisType === 'single'
                        ? 'Analyze content, performance, and usage statistics'
                        : 'Compare multiple PDFs side by side'}
                    </p>
                  </div>
                  <button
                    onClick={clearResults}
                      className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Selected Files */}
              <div className="p-4 border-b border-border">
                {selectedFile && (
                  <div className="flex items-center gap-3 p-3 bg-card border border-primary rounded-lg">
                    <File className="w-5 h-5 text-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{pdfStatisticsService.formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                )}

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Selected Files ({selectedFiles.length})</h4>
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-primary border border-primary rounded-lg">
                          <File className="w-5 h-5 text-primary-foreground" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-primary">{file.name}</p>
                            <p className="text-xs text-primary">{pdfStatisticsService.formatFileSize(file.size)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mt-4 flex items-center gap-2 p-3 bg-destructive-50 border border-destructive-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 flex gap-3">
                  {analysisType === 'single' && selectedFile && (
                    <button
                      onClick={analyzeSinglePdf}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <div className="flex border-b border-border">
                    {/* Show Overview tab only for single analysis */}
                    {analysisType === 'single' && analysisResult && (
                      <button
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 ${
                          activeTab === 'overview'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                        onClick={() => setActiveTab('overview')}
                      >
                        <BarChart3 className="w-4 h-4" />
                        Overview
                      </button>
                    )}
                    {/* Show Comparison tab only for comparison mode */}
                    {analysisType === 'compare' && comparisonResults && (
                      <button
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 ${
                          activeTab === 'comparison'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-muted-foreground'
                        }`}
                        onClick={() => setActiveTab('comparison')}
                      >
                        <GitCompare className="w-4 h-4" />
                        Comparison
                      </button>
                    )}
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 p-6 overflow-auto">
                    {/* Single Analysis Overview */}
                    {activeTab === 'overview' && analysisType === 'single' && analysisResult && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Document Overview */}
                        <div className="bg-background border border-border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <FileText className="w-5 h-5 text-primary" />
                            <h4 className="font-medium text-foreground">Document Overview</h4>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Total Pages</span>
                              <span className="text-sm font-medium">{analysisResult.summary.totalPages}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">File Size</span>
                              <span className="text-sm font-medium">{pdfStatisticsService.formatFileSize(analysisResult.fileSize)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Processing Time</span>
                              <span className="text-sm font-medium">{analysisResult.processingTime}ms</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Text Density</span>
                              <span className="text-sm font-medium">{analysisResult.summary.textDensity} chars/page</span>
                            </div>
                          </div>
                        </div>

                        {/* Content Analysis */}
                        <div className="bg-background border border-border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            <h4 className="font-medium text-foreground">Content Analysis</h4>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Total Images</span>
                              <span className="text-sm font-medium">{analysisResult.contentAnalysis.totalImages}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Total Fonts</span>
                              <span className="text-sm font-medium">{analysisResult.contentAnalysis.totalFonts}</span>
                            </div>
                            <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Has Bookmarks</span>
                              <span className="flex items-center">
                                {analysisResult.summary.hasBookmarks ? (
                                  <CheckCircle className="w-4 h-4 text-success" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-destructive" />
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Has Forms</span>
                              <span className="flex items-center">
                                {analysisResult.summary.hasForms ? (
                                  <CheckCircle className="w-4 h-4 text-success" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-destructive" />
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Performance Metrics */}
                        <div className="bg-background border border-border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            <h4 className="font-medium text-foreground">Performance Metrics</h4>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Efficiency Score</span>
                              <span 
                                className="text-sm font-medium"
                                style={{ color: pdfStatisticsService.getScoreColor(analysisResult.performanceMetrics.efficiencyScore) }}
                              >
                                {analysisResult.performanceMetrics.efficiencyScore}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Compression Ratio</span>
                              <span className="text-sm font-medium">{analysisResult.performanceMetrics.compressionRatio}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Size per Page</span>
                              <span className="text-sm font-medium">{pdfStatisticsService.formatFileSize(analysisResult.performanceMetrics.sizePerPage)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">CPU Intensity</span>
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

                    {/* Comparison Results */}
                    {activeTab === 'comparison' && analysisType === 'compare' && comparisonResults && (
                      <div className="space-y-6">
                        {/* Comparison Summary */}
                        <div>
                            <h4 className="text-lg font-medium text-foreground mb-4">Comparison Summary</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-background border border-border rounded-lg p-4 text-center">
                              <div className="text-2xl font-bold text-foreground">{comparisonResults.summary.totalFiles}</div>
                              <div className="text-sm text-muted-foreground">Total Files</div>
                            </div>
                              <div className="bg-background border border-border rounded-lg p-4 text-center">
                              <div className="text-2xl font-bold text-foreground">{pdfStatisticsService.formatFileSize(comparisonResults.summary.totalSize)}</div>
                              <div className="text-sm text-muted-foreground">Total Size</div>
                            </div>
                            <div className="bg-background border border-border rounded-lg p-4 text-center">
                              <div className="text-2xl font-bold text-foreground">{comparisonResults.summary.totalPages}</div>
                              <div className="text-sm text-muted-foreground">Total Pages</div>
                            </div>
                          </div>
                        </div>

                        {/* Individual Results */}
                        <div>
                          <h4 className="text-lg font-medium text-foreground mb-4">Individual Results</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {comparisonResults.results.map((result, index) => (
                              <div key={index} className="bg-background border border-border rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <File className="w-5 h-5 text-primary" />
                                  <h5 className="font-medium text-foreground truncate">{result.filename}</h5>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Size</span>
                                    <span className="text-sm font-medium">{pdfStatisticsService.formatFileSize(result.fileSize)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Pages</span>
                                    <span className="text-sm font-medium">{result.contentAnalysis.pageCount}</span>
                                  </div>
                                  <div className="flex justify-between">
                                      <span className="text-sm text-muted-foreground">Efficiency</span>
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