import React, { useState, useRef, useEffect } from 'react';
import { removeUnusedObjectsService } from '../../services/removeUnusedObjectsService';
import type {
  RemoveUnusedObjectsRequest,
  RemoveUnusedObjectsResponse,
  ObjectAnalysis,
  CleanupPreset,
  CleanupRecommendation
} from '../../types/removeUnusedObjects';
import { Button } from '../DocumentService/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../DocumentService/ui/card';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Trash2,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  Eye,
  Settings,
  BarChart3,
  RefreshCw,
  Upload,
  BookOpen,
  FileImage,
  Type,
  Database
} from 'lucide-react';

const RemoveUnusedObjects: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [result, setResult] = useState<RemoveUnusedObjectsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ObjectAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<CleanupRecommendation[]>([]);
  const [presets, setPresets] = useState<CleanupPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('balanced');
  const [cleanupSettings, setCleanupSettings] = useState({
    objectAnalysis: true,
    resourceCleanup: true,
    structureOptimization: true,
    aggressiveCleanup: false,
    preserveMetadata: true,
    preserveAnnotations: true,
    preserveBookmarks: true
  });
  const [batchMode, setBatchMode] = useState(false);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [batchProgress, setBatchProgress] = useState(0);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const response = await removeUnusedObjectsService.getCleanupPresets();
      setPresets(response.presets);
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
      setResult(null);
      setAnalysis(null);
      setRecommendations([]);
      // Automatically analyze the file
      analyzeFile(file);
    } else if (file) {
      setError('Please select a valid PDF file');
    }
  };

  const handleBatchFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');

    if (pdfFiles.length > 0) {
      setBatchFiles(pdfFiles);
      setError(null);
    } else {
      setError('Please select valid PDF files');
    }
  };

  const analyzeFile = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const analysisResponse = await removeUnusedObjectsService.analyzeObjects(file);
      setAnalysis(analysisResponse.analysis);

      // Get recommendations
      const recommendationsResponse = await removeUnusedObjectsService.getCleanupRecommendations(file);
      setRecommendations(recommendationsResponse.recommendations);

      // Set suggested preset
      if (recommendationsResponse.suggestedPreset) {
        setSelectedPreset(recommendationsResponse.suggestedPreset);
        applyPreset(recommendationsResponse.suggestedPreset);
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(`Failed to analyze PDF: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setCleanupSettings(preset.settings);
      setSelectedPreset(presetId);
    }
  };

  const handleSettingChange = (setting: string, value: boolean) => {
    setCleanupSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!selectedFile) {
      setError('Please select a PDF file');
      return false;
    }
    return true;
  };

  const handleRemoveUnusedObjects = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const request: RemoveUnusedObjectsRequest = {
        file: selectedFile!,
        ...cleanupSettings
      };

      const response = await removeUnusedObjectsService.removeUnusedObjects(request);
      setResult(response);
    } catch (err: any) {
      console.error('Remove unused objects error:', err);
      setError(`Failed to remove unused objects: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePreview = async () => {
    if (!validateForm()) return;

    setIsPreviewing(true);
    setError(null);

    try {
      const request: RemoveUnusedObjectsRequest = {
        file: selectedFile!,
        ...cleanupSettings
      };

      const previewResponse = await removeUnusedObjectsService.previewCleanup(request);
      // Handle preview response (could show in a modal or separate section)
      console.log('Preview response:', previewResponse);
    } catch (err: any) {
      console.error('Preview error:', err);
      setError(`Failed to preview cleanup: ${err.message}`);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleBatchCleanup = async () => {
    if (batchFiles.length === 0) {
      setError('Please select files for batch processing');
      return;
    }

    setIsBatchProcessing(true);
    setError(null);
    setBatchProgress(0);

    try {
      const request = {
        files: batchFiles,
        preset: selectedPreset,
        customSettings: cleanupSettings
      };

      const response = await removeUnusedObjectsService.batchCleanup(request);
      setBatchResults(response.results);
      setBatchProgress(100);
    } catch (err: any) {
      console.error('Batch cleanup error:', err);
      setError(`Failed to perform batch cleanup: ${err.message}`);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (result?.downloadUrl) {
      try {
        await removeUnusedObjectsService.downloadFile(result.downloadUrl, result.filename);
      } catch (err: any) {
        setError(`Failed to download file: ${err.message}`);
      }
    }
  };

  const handleBatchDownload = async (result: any) => {
    try {
      await removeUnusedObjectsService.downloadFile(result.downloadUrl, result.outputFilename);
    } catch (err: any) {
      setError(`Failed to download file: ${err.message}`);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    setAnalysis(null);
    setRecommendations([]);
    setBatchFiles([]);
    setBatchResults([]);
    setBatchProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (batchFileInputRef.current) batchFileInputRef.current.value = '';
  };

  // const getOptimizationIcon = (potential: number) => {
  //   if (potential > 0.3) return <TrendingDown className="w-5 h-5 text-green-600" />;
  //   if (potential > 0.1) return <Target className="w-5 h-5 text-yellow-600" />;
  //   return <Gauge className="w-5 h-5 text-gray-600" />;
  // };

  const getOptimizationColor = (potential: number) => {
    if (potential > 0.3) return 'text-green-600 bg-green-100';
    if (potential > 0.1) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="mx-auto p-2 space-y-6">
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
              <h1 className="text-3xl font-bold text-gray-900">Remove Unused Object</h1>
              <p className="mt-2 text-sm text-gray-600">
                Clean up unused PDF objects and resources for better performance and smaller file sizes
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Upload PDF
              </CardTitle>
              <CardDescription>
                Select a PDF file to analyze and clean up unused objects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing || isAnalyzing}
                    className="flex-1"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Choose PDF File
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setBatchMode(!batchMode)}
                    disabled={isProcessing || isAnalyzing}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {batchMode ? 'Single Mode' : 'Batch Mode'}
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {batchMode && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Button
                        onClick={() => batchFileInputRef.current?.click()}
                        disabled={isBatchProcessing}
                        variant="outline"
                        className="flex-1"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Multiple PDF Files
                      </Button>
                    </div>

                    <input
                      ref={batchFileInputRef}
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={handleBatchFileSelect}
                      className="hidden"
                    />

                    {batchFiles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">
                          Selected Files ({batchFiles.length}):
                        </p>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {batchFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-600">{file.name}</span>
                              <span className="text-xs text-gray-500">
                                {removeUnusedObjectsService.formatFileSize(file.size)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedFile && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="font-medium text-blue-900">{selectedFile.name}</span>
                      </div>
                      <div className="text-sm text-blue-700">
                        {removeUnusedObjectsService.formatFileSize(selectedFile.size)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  PDF Analysis
                </CardTitle>
                <CardDescription>
                  Detailed analysis of your PDF structure and optimization potential
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{analysis.totalObjects}</div>
                    <div className="text-sm text-gray-600">Total Objects</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{analysis.totalPages}</div>
                    <div className="text-sm text-gray-600">Pages</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{analysis.unusedObjects}</div>
                    <div className="text-sm text-gray-600">Unused Objects</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{analysis.compressedObjects}</div>
                    <div className="text-sm text-gray-600">Compressed</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Structure Elements</h4>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <BookOpen className="w-4 h-4 mr-2 text-blue-600" />
                        Bookmarks: {analysis.structure.hasBookmarks ? 'Yes' : 'No'}
                      </div>
                      <div className="flex items-center text-sm">
                        <FileImage className="w-4 h-4 mr-2 text-green-600" />
                        Images: {analysis.structure.hasImages ? 'Yes' : 'No'}
                      </div>
                      <div className="flex items-center text-sm">
                        <Type className="w-4 h-4 mr-2 text-purple-600" />
                        Fonts: {analysis.structure.hasFonts ? 'Yes' : 'No'}
                      </div>
                      <div className="flex items-center text-sm">
                        <Database className="w-4 h-4 mr-2 text-orange-600" />
                        Metadata: {analysis.structure.hasMetadata ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Optimization Potential</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Size Reduction:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOptimizationColor(analysis.optimizationPotential.estimatedSizeReduction)}`}>
                          {(analysis.optimizationPotential.estimatedSizeReduction * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Unused Objects:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${analysis.unusedObjects > 0 ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'}`}>
                          {analysis.unusedObjects > 0 ? 'Can Remove' : 'None Found'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Structure:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${analysis.optimizationPotential.canOptimizeStructure ? 'text-yellow-600 bg-yellow-100' : 'text-gray-600 bg-gray-100'}`}>
                          {analysis.optimizationPotential.canOptimizeStructure ? 'Can Optimize' : 'Already Optimal'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {recommendations.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Recommendations</h4>
                    {recommendations.map((rec, index) => (
                      <div key={index} className={`p-3 rounded-lg border-l-4 ${rec.priority === 'high' ? 'border-red-500 bg-red-50' :
                        rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                          'border-green-500 bg-green-50'
                        }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{rec.title}</h5>
                            <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                            <div className="flex items-center mt-2 space-x-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${removeUnusedObjectsService.getPriorityColor(rec.priority)}`}>
                                {rec.priority} Priority
                              </span>
                              <span className="text-sm text-gray-600">
                                Est. Reduction: {rec.estimatedReduction}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Cleanup Complete
                </CardTitle>
                <CardDescription>
                  Your PDF has been successfully cleaned up
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-900">
                        {removeUnusedObjectsService.formatFileSize(result.originalSize)}
                      </div>
                      <div className="text-sm text-green-600">Original Size</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-900">
                        {removeUnusedObjectsService.formatFileSize(result.cleanedSize)}
                      </div>
                      <div className="text-sm text-blue-600">New Size</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-900">
                        {result.sizeReductionPercent}
                      </div>
                      <div className="text-sm text-purple-600">Reduction</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-900">
                        {result.processingTime}ms
                      </div>
                      <div className="text-sm text-orange-600">Processing</div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button onClick={handleDownload} className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Download Cleaned PDF
                    </Button>
                    <Button variant="outline" onClick={resetForm}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Process Another File
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Batch Results */}
          {batchResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Batch Processing Results
                </CardTitle>
                <CardDescription>
                  Results from batch cleanup processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {batchResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{result.filename}</div>
                        <div className="text-sm text-gray-600">
                          {removeUnusedObjectsService.formatFileSize(result.originalSize)} → {removeUnusedObjectsService.formatFileSize(result.cleanedSize)} ({result.sizeReductionPercent} reduction)
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleBatchDownload(result)}
                        variant="outline"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Card className="border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-center text-red-600">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Error: {error}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Presets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Cleanup Presets
              </CardTitle>
              <CardDescription>
                Choose from predefined cleanup configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${selectedPreset === preset.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                    onClick={() => applyPreset(preset.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{preset.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${removeUnusedObjectsService.getRiskLevelColor(preset.riskLevel)}`}>
                        {preset.riskLevel}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{preset.description}</p>
                    <div className="text-sm font-medium text-blue-600">
                      Est. Reduction: {preset.estimatedReduction}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Advanced Settings
              </CardTitle>
              <CardDescription>
                Customize cleanup behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Object Analysis</span>
                  <input
                    type="checkbox"
                    checked={cleanupSettings.objectAnalysis}
                    onChange={(e) => handleSettingChange('objectAnalysis', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Resource Cleanup</span>
                  <input
                    type="checkbox"
                    checked={cleanupSettings.resourceCleanup}
                    onChange={(e) => handleSettingChange('resourceCleanup', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Structure Optimization</span>
                  <input
                    type="checkbox"
                    checked={cleanupSettings.structureOptimization}
                    onChange={(e) => handleSettingChange('structureOptimization', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Aggressive Cleanup</span>
                  <input
                    type="checkbox"
                    checked={cleanupSettings.aggressiveCleanup}
                    onChange={(e) => handleSettingChange('aggressiveCleanup', e.target.checked)}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Preserve Metadata</span>
                  <input
                    type="checkbox"
                    checked={cleanupSettings.preserveMetadata}
                    onChange={(e) => handleSettingChange('preserveMetadata', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Preserve Annotations</span>
                  <input
                    type="checkbox"
                    checked={cleanupSettings.preserveAnnotations}
                    onChange={(e) => handleSettingChange('preserveAnnotations', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Preserve Bookmarks</span>
                  <input
                    type="checkbox"
                    checked={cleanupSettings.preserveBookmarks}
                    onChange={(e) => handleSettingChange('preserveBookmarks', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {!batchMode ? (
                  <>
                    <Button
                      onClick={handleRemoveUnusedObjects}
                      disabled={!selectedFile || isProcessing}
                      className="w-full"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove Unused Objects
                        </>
                      )}
                    </Button>

                  
                  </>
                ) : (
                  <Button
                    onClick={handleBatchCleanup}
                    disabled={batchFiles.length === 0 || isBatchProcessing}
                    className="w-full"
                    size="lg"
                  >
                    {isBatchProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Processing {batchFiles.length} files...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Batch Cleanup ({batchFiles.length} files)
                      </>
                    )}
                  </Button>
                )}

                <Button
                  onClick={resetForm}
                  variant="ghost"
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Progress Bar for Batch Processing */}
          {batchMode && isBatchProcessing && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Progress</span>
                    <span className="text-gray-600">{batchProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${batchProgress}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default RemoveUnusedObjects;
