import React, { useState, useRef } from 'react';
import {
  Upload,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wrench,
  File,
  Info,
  AlertCircle,
  Download,
  Search,
  Zap,
  Shield,
  BarChart3,
  X
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { pdfRepairService } from '../../services/pdfRepairService';
import { pdfApi } from '../../services/apiHelper';
import type { RepairResult, AnalysisResult, OptimizationResult } from '../../services/pdfRepairService';

type RepairMode = 'repair' | 'analyze' | 'optimize';
type ActiveTab = 'repair' | 'analysis' | 'optimization' | 'results';

const PdfRepairPage: React.FC = () => {
   const location = useLocation();
  const [repairMode, setRepairMode] = useState<RepairMode>('repair');
  const [activeTab, setActiveTab] = useState<ActiveTab>('repair');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // File and results
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [repairResult, setRepairResult] = useState<RepairResult | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setRepairResult(null);
      setAnalysisResult(null);
      setOptimizationResult(null);
      toast.success('PDF file selected');
    } else {
      toast.error('Please select a valid PDF file');
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setRepairResult(null);
    setAnalysisResult(null);
    setOptimizationResult(null);
    setActiveTab('repair');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('File removed');
  };

  const handleRepairPdf = async () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file first');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await pdfRepairService.repairPdf(selectedFile);
      // console.log('🔧 Repair result received:', result);
      // console.log('🔧 Repair result success:', result.success);
      // console.log('🔧 Repair result downloadUrl:', result.downloadUrl);
      setRepairResult(result);
      setActiveTab('results');
      toast.success('PDF repair completed successfully');
      
      // If repair was successful and we have a download URL, analyze the repaired PDF
      if (result.success && result.downloadUrl) {
        // console.log('🔄 Auto-analyzing repaired PDF...');
        try {
          // Download the repaired PDF and analyze it
          const response = await fetch(`${pdfApi.defaults.baseURL}${result.downloadUrl}`);
          // console.log('📥 Auto-analysis download response:', response.status);
          const repairedPdfBlob = await response.blob();
          
          // Create FormData for the repaired PDF
          const formData = new FormData();
          formData.append('pdf', repairedPdfBlob, 'repaired.pdf');
          
          const analysisResult = await pdfRepairService.analyzeRepairedPdf(formData);
          // console.log('📊 Auto-analysis result:', analysisResult);
          setAnalysisResult(analysisResult);
        } catch (analysisError) {
          console.error('Error analyzing repaired PDF:', analysisError);
          // Don't show error to user as repair was successful
        }
      } else {
        // console.log('⚠️ Repair result missing success or download URL:', { success: result.success, downloadUrl: result.downloadUrl });
      }
    } catch (error) {
      console.error('Error repairing PDF:', error);
      toast.error('Failed to repair PDF: ' + ((error as Error).message || 'Network error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalyzePdf = async () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file first');
      return;
    }

    setIsProcessing(true);
    try {
      // console.log('🔍 Starting PDF analysis...');
      // console.log('📁 Selected file:', selectedFile.name, selectedFile.size);
      // console.log('🔧 Repair result exists:', !!repairResult);
      // console.log('🔗 Download URL:', repairResult?.downloadUrl);
      
      // If we have a repair result with a download URL, analyze the repaired PDF
      if (repairResult && repairResult.downloadUrl) {
        // console.log('✅ Analyzing repaired PDF...');
        try {
          // Download the repaired PDF and analyze it
          const response = await fetch(`${pdfApi.defaults.baseURL}${repairResult.downloadUrl}`);
          // console.log('📥 Download response status:', response.status);
          
          if (!response.ok) {
            throw new Error(`Download failed: ${response.status} ${response.statusText}`);
          }
          
          const repairedPdfBlob = await response.blob();
          // console.log('📄 Repaired PDF blob size:', repairedPdfBlob.size);
          
          // Create FormData for the repaired PDF
          const formData = new FormData();
          formData.append('pdf', repairedPdfBlob, 'repaired.pdf');
          // console.log('📋 Created FormData for repaired PDF');
          
          const result = await pdfRepairService.analyzeRepairedPdf(formData);
          // console.log('📊 Analysis result:', result);
          setAnalysisResult(result);
          setActiveTab('analysis');
          toast.success('Repaired PDF analysis completed successfully');
        } catch (repairedAnalysisError) {
          console.error('❌ Error analyzing repaired PDF:', repairedAnalysisError);
          // console.log('🔄 Falling back to original file analysis...');
          // Fall back to analyzing original file
          const result = await pdfRepairService.analyzePdf(selectedFile);
          // console.log('📊 Fallback analysis result:', result);
          setAnalysisResult(result);
          setActiveTab('analysis');
          toast.success('PDF analysis completed successfully (fallback)');
        }
      } else {
        // console.log('📄 Analyzing original file...');
        // No repair result, analyze the original file
        const result = await pdfRepairService.analyzePdf(selectedFile);
        // console.log('📊 Original analysis result:', result);
        setAnalysisResult(result);
        setActiveTab('analysis');
        toast.success('PDF analysis completed successfully');
      }
    } catch (error) {
      console.error('❌ Error analyzing PDF:', error);
      toast.error('Failed to analyze PDF: ' + ((error as Error).message || 'Network error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOptimizePdf = async () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file first');
      return;
    }

    setIsProcessing(true);
    try {
      // If we have a repair result with a download URL, optimize the repaired PDF
      if (repairResult && repairResult.downloadUrl) {
        try {
          // Download the repaired PDF and optimize it
          const response = await fetch(`${pdfApi.defaults.baseURL}${repairResult.downloadUrl}`);
          const repairedPdfBlob = await response.blob();
          // Create FormData for the repaired PDF
          const formData = new FormData();
          formData.append('pdf', repairedPdfBlob, 'repaired.pdf');
          
          const result = await pdfRepairService.optimizePdf(formData);
          setOptimizationResult(result);
          setActiveTab('optimization');
          toast.success('Repaired PDF optimization completed successfully');
        } catch (repairedOptimizationError) {
          console.error('Error optimizing repaired PDF:', repairedOptimizationError);
          // Fall back to optimizing original file
          const formData = new FormData();
          formData.append('pdf', selectedFile);
          const result = await pdfRepairService.optimizePdf(formData);
          setOptimizationResult(result);
          setActiveTab('optimization');
          toast.success('PDF optimization completed successfully');
        }
      } else {
        // No repair result, optimize the original file
        const formData = new FormData();
        formData.append('pdf', selectedFile);
        const result = await pdfRepairService.optimizePdf(formData);
        setOptimizationResult(result);
        setActiveTab('optimization');
        toast.success('PDF optimization completed successfully');
      }
    } catch (error) {
      console.error('Error optimizing PDF:', error);
      toast.error('Failed to optimize PDF: ' + ((error as Error).message || 'Network error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'major':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'minor':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'major':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'minor':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
              <h1 className="text-3xl font-bold text-gray-900">PDF Repair</h1>
              <p className="mt-2 text-sm text-gray-600">
                Repair corrupted PDFs, analyze issues, and optimize for fast web viewing
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setRepairMode('repair')}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              repairMode === 'repair'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Wrench className="w-4 h-4 mr-2" />
            Repair PDF
          </button>
          <button
            onClick={() => setRepairMode('analyze')}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              repairMode === 'analyze'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Search className="w-4 h-4 mr-2" />
            Analyze PDF
          </button>
          <button
            onClick={() => setRepairMode('optimize')}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              repairMode === 'optimize'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Zap className="w-4 h-4 mr-2" />
            Optimize PDF
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('repair')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'repair'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Wrench className="w-4 h-4 inline mr-2" />
              Repair
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analysis'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Search className="w-4 h-4 inline mr-2" />
              Analysis
            </button>
            <button
              onClick={() => setActiveTab('optimization')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'optimization'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Zap className="w-4 h-4 inline mr-2" />
              Optimization
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'results'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Results
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className={`grid grid-cols-1 gap-8 ${selectedFile ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}>
        {/* Main Content */}
        <div className={`space-y-6 ${selectedFile ? 'lg:col-span-1' : 'lg:col-span-2'}`}>
          {/* File Upload Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload PDF for {repairMode === 'repair' ? 'Repair' : repairMode === 'analyze' ? 'Analysis' : 'Optimization'}</h2>
            
            {!selectedFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-500 font-medium">
                      Click to upload PDF
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <File className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Change File
                    </button>
                    <button
                      onClick={handleRemoveFile}
                      className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                      title="Remove file"
                    >
                      <X className="w-5 h-5 text-gray-500 hover:text-red-600" />
                    </button>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}
  
            {selectedFile && (
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={handleRepairPdf}
                  disabled={isProcessing}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Wrench className="w-4 h-4 mr-2" />
                  )}
                  Repair PDF
                </button>
                <button
                  onClick={handleAnalyzePdf}
                  disabled={isProcessing}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  {repairResult && repairResult.downloadUrl ? 'Analyze Repaired PDF' : 'Analyze PDF'}
                </button>
                <button
                  onClick={handleOptimizePdf}
                  disabled={isProcessing}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  {repairResult && repairResult.downloadUrl ? 'Optimize Repaired PDF' : 'Optimize PDF'}
                </button>
              </div>
            )}
          </div>
          {!selectedFile && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">How it works:</p>
                <p>Upload a corrupted or damaged PDF to repair structural issues, analyze problems, or optimize for fast web viewing. The tool will attempt to recover as much content as possible and provide detailed reports.</p>
              </div>
            </div>
          </div>
          )}
          {/* Repair Results */}
          {activeTab === 'results' && repairResult && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Repair Results</h3>
                  <div className="flex items-center space-x-4">
                    {repairResult.success ? (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-sm font-medium text-green-600">Repair Successful</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-5 h-5 text-red-500" />
                        <span className="text-sm font-medium text-red-600">Repair Failed</span>
                      </div>
                    )}
                    {repairResult.downloadUrl && (
                      <a
                        href={`${pdfApi.defaults.baseURL}${repairResult.downloadUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </a>
                    )}
                  </div>
                </div>

                {/* File Size Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Original File</h4>
                    <div className="text-2xl font-bold text-gray-600">
                      {formatFileSize(repairResult.originalSize)}
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Repaired File</h4>
                    <div className="text-2xl font-bold text-green-600">
                      {formatFileSize(repairResult.repairedSize)}
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Document Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Pages:</span>
                      <span className="ml-2 font-medium">{repairResult.statistics.pages}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Fonts:</span>
                      <span className="ml-2 font-medium">{repairResult.statistics.fonts}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Images:</span>
                      <span className="ml-2 font-medium">{repairResult.statistics.images}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Forms:</span>
                      <span className="ml-2 font-medium">{repairResult.statistics.forms}</span>
                    </div>
                  </div>
                </div>

                {/* Issues Found */}
                {repairResult.issuesFound.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Issues Found ({repairResult.issuesFound.length})</h4>
                    <div className="space-y-2">
                      {repairResult.issuesFound.map((issue, index) => (
                        <div key={index} className={`border rounded-lg p-3 ${getSeverityColor(issue.severity)}`}>
                          <div className="flex items-start">
                            {getSeverityIcon(issue.severity)}
                            <div className="ml-2">
                              <p className="text-sm font-medium">{issue.message}</p>
                              {issue.details && (
                                <p className="text-xs mt-1 opacity-75">{issue.details}</p>
                              )}
                              {issue.page && (
                                <p className="text-xs mt-1 opacity-75">Page: {issue.page}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Repairs Applied */}
                {repairResult.repairsApplied.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Repairs Applied ({repairResult.repairsApplied.length})</h4>
                    <div className="space-y-2">
                      {repairResult.repairsApplied.map((repair, index) => (
                        <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                            <div className="ml-2">
                              <p className="text-sm font-medium text-green-800">{repair.message}</p>
                              {repair.details && (
                                <p className="text-xs mt-1 text-green-600">{repair.details}</p>
                              )}
                              {repair.page && (
                                <p className="text-xs mt-1 text-green-600">Page: {repair.page}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {activeTab === 'analysis' && analysisResult && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Analysis Results</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className={`text-2xl font-bold ${getHealthScoreColor(analysisResult.healthScore)}`}>
                        {analysisResult.healthScore}%
                      </span>
                      <span className="text-sm text-gray-500">Health Score</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      analysisResult.isCorrupted 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {analysisResult.isCorrupted ? 'Needs Repair' : 'Healthy'}
                    </div>
                    {analysisResult.repairStatus && (
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        analysisResult.repairStatus === 'excellent' ? 'bg-green-100 text-green-800' :
                        analysisResult.repairStatus === 'good' ? 'bg-blue-100 text-blue-800' :
                        analysisResult.repairStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                        analysisResult.repairStatus === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        Repair: {analysisResult.repairStatus}
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistics */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Document Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">File Size:</span>
                      <span className="ml-2 font-medium">{analysisResult.statistics.fileSizeFormatted}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Pages:</span>
                      <span className="ml-2 font-medium">{analysisResult.statistics.pages}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Fonts:</span>
                      <span className="ml-2 font-medium">{analysisResult.statistics.fonts}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Forms:</span>
                      <span className="ml-2 font-medium">{analysisResult.statistics.forms}</span>
                    </div>
                  </div>
                </div>

                {/* Issues */}
                {analysisResult.issues.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Issues Found ({analysisResult.issues.length})</h4>
                    <div className="space-y-2">
                      {analysisResult.issues.map((issue, index) => (
                        <div key={index} className={`border rounded-lg p-3 ${getSeverityColor(issue.severity)}`}>
                          <div className="flex items-start">
                            {getSeverityIcon(issue.severity)}
                            <div className="ml-2">
                              <p className="text-sm font-medium">{issue.message}</p>
                              {issue.details && (
                                <p className="text-xs mt-1 opacity-75">{issue.details}</p>
                              )}
                              {issue.page && (
                                <p className="text-xs mt-1 opacity-75">Page: {issue.page}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {analysisResult.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Recommendations</h4>
                    <div className="space-y-2">
                      {analysisResult.recommendations.map((rec, index) => (
                        <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-start">
                            <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                            <div className="ml-2">
                              <p className="text-sm font-medium text-blue-800">{rec.message}</p>
                              <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                                rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                                rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {rec.priority} priority
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Optimization Results */}
          {activeTab === 'optimization' && optimizationResult && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Optimization Results</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-green-600">
                        {optimizationResult.compressionRatio}%
                      </span>
                      <span className="text-sm text-gray-500">Size Reduction</span>
                    </div>
                    {optimizationResult.downloadUrl && (
                      <a
                        href={`${pdfApi.defaults.baseURL}${optimizationResult.downloadUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        View Optimized PDF
                      </a>
                    )}
                  </div>
                </div>

                {/* File Size Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Original File</h4>
                    <div className="text-2xl font-bold text-gray-600">
                      {formatFileSize(optimizationResult.originalSize)}
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Optimized File</h4>
                    <div className="text-2xl font-bold text-green-600">
                      {formatFileSize(optimizationResult.optimizedSize)}
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Document Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Pages:</span>
                      <span className="ml-2 font-medium">{optimizationResult.statistics.pages}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Fonts:</span>
                      <span className="ml-2 font-medium">{optimizationResult.statistics.fonts}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Images:</span>
                      <span className="ml-2 font-medium">{optimizationResult.statistics.images}</span>
                    </div>
                  </div>
                </div>

                {/* Optimizations Applied */}
                {optimizationResult.optimizationsApplied.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Optimizations Applied ({optimizationResult.optimizationsApplied.length})</h4>
                    <div className="space-y-2">
                      {optimizationResult.optimizationsApplied.map((opt, index) => (
                        <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-start">
                            <Zap className="w-4 h-4 text-green-500 mt-0.5" />
                            <div className="ml-2">
                              <p className="text-sm font-medium text-green-800">{opt.message}</p>
                              {opt.details && (
                                <p className="text-xs mt-1 text-green-600">{opt.details}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Only show when no file is selected */}
        {!selectedFile && (
          <div className="space-y-6">
          {/* Features */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Features</h2>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Wrench className="w-4 h-4 mr-2 text-blue-600" />
                Error recovery
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Shield className="w-4 h-4 mr-2 text-green-600" />
                Structure repair
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <File className="w-4 h-4 mr-2 text-purple-600" />
                Content reconstruction
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Zap className="w-4 h-4 mr-2 text-orange-600" />
                Web optimization
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Search className="w-4 h-4 mr-2 text-indigo-600" />
                Issue analysis
              </div>
            </div>
          </div>

          {/* Repair Types */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Repair Types</h2>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                <strong>Corrupted Structure:</strong> Fix broken PDF structure
              </div>
              <div className="text-sm text-gray-600">
                <strong>Missing Objects:</strong> Recover missing PDF objects
              </div>
              <div className="text-sm text-gray-600">
                <strong>Invalid References:</strong> Fix broken internal references
              </div>
              <div className="text-sm text-gray-600">
                <strong>Damaged Metadata:</strong> Repair document metadata
              </div>
              <div className="text-sm text-gray-600">
                <strong>Broken Fonts:</strong> Fix font embedding issues
              </div>
            </div>
          </div>

         
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfRepairPage;
