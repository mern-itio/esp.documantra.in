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
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Trash2,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
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
   const location = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // const [isPreviewing, setIsPreviewing] = useState(false);
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
    if (potential > 0.3) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300';
    if (potential > 0.1) return 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="mx-auto min-h-full w-full space-y-6 bg-background p-2 text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-background shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              to={`/pdf-tools${location.search}`}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Remove Unused Object</h1>
              <p className="mt-2 text-sm text-muted-foreground">
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
                        <p className="text-sm font-medium text-foreground">
                          Selected Files ({batchFiles.length}):
                        </p>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {batchFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between rounded bg-muted p-2">
                              <span className="text-sm text-muted-foreground">{file.name}</span>
                              <span className="text-xs text-muted-foreground">
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
                  <div className="rounded-lg border border-primary/25 bg-primary/10 p-4 dark:border-primary/35 dark:bg-primary/15">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-primary mr-2" />
                        <span className="font-medium text-foreground">{selectedFile.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
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
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{analysis.totalObjects}</div>
                    <div className="text-sm text-muted-foreground">Total Objects</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{analysis.totalPages}</div>
                    <div className="text-sm text-muted-foreground">Pages</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{analysis.unusedObjects}</div>
                    <div className="text-sm text-muted-foreground">Unused Objects</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{analysis.compressedObjects}</div>
                    <div className="text-sm text-muted-foreground">Compressed</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Structure Elements</h4>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <BookOpen className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                        Bookmarks: {analysis.structure.hasBookmarks ? 'Yes' : 'No'}
                      </div>
                      <div className="flex items-center text-sm">
                        <FileImage className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                        Images: {analysis.structure.hasImages ? 'Yes' : 'No'}
                      </div>
                      <div className="flex items-center text-sm">
                        <Type className="w-4 h-4 mr-2 text-[#155E4B] dark:text-purple-400" />
                        Fonts: {analysis.structure.hasFonts ? 'Yes' : 'No'}
                      </div>
                      <div className="flex items-center text-sm">
                        <Database className="w-4 h-4 mr-2 text-orange-600 dark:text-orange-400" />
                        Metadata: {analysis.structure.hasMetadata ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Optimization Potential</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Size Reduction:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOptimizationColor(analysis.optimizationPotential.estimatedSizeReduction)}`}>
                          {(analysis.optimizationPotential.estimatedSizeReduction * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Unused Objects:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${analysis.unusedObjects > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                          {analysis.unusedObjects > 0 ? 'Can Remove' : 'None Found'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Structure:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${analysis.optimizationPotential.canOptimizeStructure ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' : 'bg-muted text-muted-foreground'}`}>
                          {analysis.optimizationPotential.canOptimizeStructure ? 'Can Optimize' : 'Already Optimal'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {recommendations.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Recommendations</h4>
                    {recommendations.map((rec, index) => (
                      <div key={index} className={`p-3 rounded-lg border-l-4 ${rec.priority === 'high' ? 'border-red-500 bg-red-50 dark:bg-red-950/35' :
                        rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/35' :
                          'border-green-500 bg-green-50 dark:bg-green-950/35'
                        }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-foreground">{rec.title}</h5>
                            <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                            <div className="flex items-center mt-2 space-x-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${removeUnusedObjectsService.getPriorityColor(rec.priority)}`}>
                                {rec.priority} Priority
                              </span>
                              <span className="text-sm text-muted-foreground">
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
                <CardTitle className="flex items-center text-emerald-600 dark:text-emerald-400">
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
                    <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/35 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-200">
                        {removeUnusedObjectsService.formatFileSize(result.originalSize)}
                      </div>
                      <div className="text-sm text-emerald-700 dark:text-emerald-300">Original Size</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/35 rounded-lg">
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                        {removeUnusedObjectsService.formatFileSize(result.cleanedSize)}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">New Size</div>
                    </div>
                    <div className="text-center p-3 bg-[#F0FDF4] dark:bg-purple-950/35 rounded-lg">
                      <div className="text-2xl font-bold text-purple-900 dark:text-purple-200">
                        {result.sizeReductionPercent}
                      </div>
                      <div className="text-sm text-[#155E4B] dark:text-purple-300">Reduction</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/35 rounded-lg">
                      <div className="text-2xl font-bold text-orange-900 dark:text-orange-200">
                        {result.processingTime}ms
                      </div>
                      <div className="text-sm text-orange-700 dark:text-orange-300">Processing</div>
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
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{result.filename}</div>
                        <div className="text-sm text-muted-foreground">
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
            <Card className="border-red-200 dark:border-red-900">
              <CardContent className="pt-6">
                <div className="flex items-center text-red-600 dark:text-red-400">
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
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/35'
                      : 'border-border hover:border-muted-foreground/40'
                      }`}
                    onClick={() => applyPreset(preset.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-foreground">{preset.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${removeUnusedObjectsService.getRiskLevelColor(preset.riskLevel)}`}>
                        {preset.riskLevel}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{preset.description}</p>
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
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
                  <span className="text-sm font-medium text-foreground">Object Analysis</span>
                  <input
                    type="checkbox"
                    checked={cleanupSettings.objectAnalysis}
                    onChange={(e) => handleSettingChange('objectAnalysis', e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Resource Cleanup</span>
                  <input
                    type="checkbox"
                    checked={cleanupSettings.resourceCleanup}
                    onChange={(e) => handleSettingChange('resourceCleanup', e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Structure Optimization</span>
                  <input
                    type="checkbox"
                    checked={cleanupSettings.structureOptimization}
                    onChange={(e) => handleSettingChange('structureOptimization', e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Aggressive Cleanup</span>
                  <input
                    type="checkbox"
                    checked={cleanupSettings.aggressiveCleanup}
                    onChange={(e) => handleSettingChange('aggressiveCleanup', e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background text-destructive focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Preserve Metadata</span>
                  <input
                    type="checkbox"
                    checked={cleanupSettings.preserveMetadata}
                    onChange={(e) => handleSettingChange('preserveMetadata', e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Preserve Annotations</span>
                  <input
                    type="checkbox"
                    checked={cleanupSettings.preserveAnnotations}
                    onChange={(e) => handleSettingChange('preserveAnnotations', e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Preserve Bookmarks</span>
                  <input
                    type="checkbox"
                    checked={cleanupSettings.preserveBookmarks}
                    onChange={(e) => handleSettingChange('preserveBookmarks', e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
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
                    <span className="text-foreground">Progress</span>
                    <span className="text-muted-foreground">{batchProgress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
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
