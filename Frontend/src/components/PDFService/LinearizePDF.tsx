import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../DocumentService/ui/button';
import { Card } from '../DocumentService/ui/card';
import { Select } from '../DocumentService/ui/select';
import { Switch } from '../DocumentService/ui/switch';
import Badge from '../DocumentService/ui/badge';
import { Alert } from '../DocumentService/ui/alert';
import { linearizePDFService, linearizePDFHelpers } from '../../services/linearizePDFService';
import type {
  LinearizePDFRequest,
  LinearizePDFResponse,
  PDFAnalysis,
  LinearizationPreset,
  LinearizationRecommendation
} from '../../types/linearizePDF';
import {
  Upload,
  Download,
  Settings,
  Eye,
  FileText,
  Zap,
  Globe,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  X,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const LinearizePDF: React.FC = () => {
  const location = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<LinearizePDFResponse | null>(null);
  const [analysis, setAnalysis] = useState<PDFAnalysis | null>(null);
  const [presets, setPresets] = useState<LinearizationPreset[]>([]);
  const [recommendations, setRecommendations] = useState<LinearizationRecommendation[]>([]);
  const [selectedPreset] = useState<string>('web_optimized');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // const [isPreviewing, setIsPreviewing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<LinearizePDFRequest>({
    file: null as any,
    webOptimization: true,
    fastLoading: true,
    streamingSupport: true,
    compressionLevel: 'medium',
    objectStreams: 'generate',
    preserveMetadata: true,
    preserveAnnotations: true,
    preserveBookmarks: true,
    outputFormat: 'pdf',
    quality: 'medium'
  });

  useEffect(() => {
    loadPresets();
  }, []);

  useEffect(() => {
    if (selectedPreset && presets.length > 0) {
      const preset = presets.find(p => p.id === selectedPreset);
      if (preset) {
        setFormData(prev => ({
          ...prev,
          webOptimization: preset.webOptimization,
          fastLoading: preset.progressiveLoading,
          streamingSupport: preset.streamingSupport,
          compressionLevel: preset.compressionLevel,
          objectStreams: preset.objectStreams ? 'generate' : 'disable',
          preserveMetadata: preset.metadataPreservation,
          preserveAnnotations: preset.annotationsPreservation,
          preserveBookmarks: preset.bookmarksPreservation,
          outputFormat: prev.outputFormat,
          quality: prev.quality
        }));
      }
    }
  }, [selectedPreset, presets]);

  const loadPresets = async () => {
    try {
      const response = await linearizePDFService.getPresets();
      setPresets(response.presets);
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validationError = linearizePDFHelpers.getFileValidationError(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setSelectedFile(file);
      setFormData(prev => ({ ...prev, file }));
      setError(null);
      setResult(null);
      setAnalysis(null);
      setRecommendations([]);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await linearizePDFService.analyzePDF(selectedFile);
      setAnalysis(response.analysis);

      // Get recommendations
      const recResponse = await linearizePDFService.getRecommendations(selectedFile);
      setRecommendations(recResponse.recommendations);

      setSuccess('PDF analyzed successfully');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to analyze PDF');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // const handlePreview = async () => {
  //   if (!selectedFile) return;

  //   setIsPreviewing(true);
  //   setError(null);

  //   try {
  //     const response = await linearizePDFService.previewLinearization(selectedFile, formData);
  //     console.log(response);
  //     setSuccess('Preview generated successfully');
  //     // You can show preview results in a modal or separate section
  //   } catch (error: any) {
  //     setError(error.response?.data?.message || 'Failed to generate preview');
  //   } finally {
  //     setIsPreviewing(false);
  //   }
  // };

  const handleLinearize = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await linearizePDFService.linearizePDF({
        ...formData,
        file: selectedFile
      });

      setResult(response);
      setSuccess('PDF linearized successfully!');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to linearize PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      linearizePDFService.downloadLinearizedPDF(result.filename);
    }
  };



  const handleInputChange = (field: keyof LinearizePDFRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setSelectedFile(null);
    setResult(null);
    setFormData({
      file: null as any,
      webOptimization: true,
      fastLoading: true,
      streamingSupport: true,
      compressionLevel: 'medium',
      objectStreams: 'generate',
      preserveMetadata: true,
      preserveAnnotations: true,
      preserveBookmarks: true,
      outputFormat: 'pdf',
      quality: 'medium'
    });
    setResult(null);
    setAnalysis(null);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  // Show only result when linearization is successful - hide everything else
  if (result && result.success) {
    return (
      <div className="mx-auto min-h-full w-full space-y-6 bg-background p-2 text-foreground">
        {/* Header */}
        <div className="bg-background shadow-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-6">
              <Link
                to={`/pdf-tools${location.search}`}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Linearize PDF</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Optimize PDFs for fast web viewing.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Show only the result - everything else is hidden */}
        <div className="max-w-7xl mx-auto p-6">
          <Card className="p-6">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-2">Linearization Complete!</h3>
              <p className="text-muted-foreground">Your PDF has been optimized for web viewing</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-foreground">
                  {linearizePDFHelpers.formatFileSize(result.originalSize)}
                </p>
                <p className="text-sm text-muted-foreground">Original Size</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-foreground">
                  {linearizePDFHelpers.formatFileSize(result.linearizedSize)}
                </p>
                <p className="text-sm text-muted-foreground">Optimized Size</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-foreground">
                  {result.sizeChangePercent}%
                </p>
                <p className="text-sm text-muted-foreground">Size Change</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-foreground">
                  {linearizePDFHelpers.formatProcessingTime(result.processingTime)}
                </p>
                <p className="text-sm text-muted-foreground">Processing Time</p>
              </div>
            </div>

            {/* Optimization Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <Globe className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                  Web Optimization
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Linearized</span>
                    <Badge variant="success">Yes</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Progressive Loading</span>
                    <Badge variant={result.webOptimization.progressiveLoading ? 'success' : 'secondary'}>
                      {result.webOptimization.progressiveLoading ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Object Streams</span>
                    <Badge variant={result.webOptimization.objectStreams ? 'success' : 'secondary'}>
                      {result.webOptimization.objectStreams ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Estimated Load Time</span>
                    <span className="text-sm font-medium">{result.webOptimization.estimatedLoadTime}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                  Performance Improvements
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Web Optimized</span>
                    <Badge variant="success">Yes</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Streaming Ready</span>
                    <Badge variant={result.analysis.improvements.streamingReady ? 'success' : 'secondary'}>
                      {result.analysis.improvements.streamingReady ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Fast Loading</span>
                    <Badge variant={result.analysis.improvements.fastLoading ? 'success' : 'secondary'}>
                      {result.analysis.improvements.fastLoading ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Optimization Ratio</span>
                    <span className="text-sm font-medium">{result.analysis.improvements.optimizationRatio}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleDownload}
                className="bg-success text-success-foreground hover:bg-success/90 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Linearized PDF
              </Button>
              <Button
                onClick={() => setResult(null)}
                variant="outline"
              >
                Back to Configuration
              </Button>
              <Button
                onClick={resetForm}
                variant="outline"
              >
                Start New
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-full w-full space-y-6 bg-background p-2 text-foreground">
      {/* Header */}
      <div className="bg-background shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              to={`/pdf-tools${location.search}`}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Linearize PDF</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Optimize PDFs for fast web viewing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* File Upload Section - Only show when no file selected */}
      {!selectedFile && (
        <Card className="p-6">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 dark:bg-muted/20 dark:hover:bg-muted/40">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">PDF files only (MAX. 2MB)</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf"
                onChange={handleFileSelect}
              />
            </label>
          </div>
        </Card>
      )}

      {/* Selected File Info - Show after file upload */}
      {selectedFile && (
        <Card className="p-6">
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-6 dark:bg-primary/15 dark:border-primary/40">
            <div className="flex items-center justify-between">
              {/* File Info */}
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary/15 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Selected PDF File</h3>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile as File).name} • {linearizePDFHelpers.formatFileSize((selectedFile as File).size)}
                  </p>
                </div>
              </div>

              {/* Buttons: Analyze + Close */}
              {selectedFile && (
                <div className="flex items-center space-x-2">
                  {!analysis && (
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Analyze PDF
                        </>
                      )}
                    </Button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setResult(null);
                      setAnalysis(null);
                      setRecommendations([]);
                      setError(null);
                      setSuccess(null);
                      setFormData({
                        file: null as any,
                        webOptimization: true,
                        fastLoading: true,
                        streamingSupport: true,
                        compressionLevel: 'medium',
                        objectStreams: 'generate',
                        preserveMetadata: true,
                        preserveAnnotations: true,
                        preserveBookmarks: true,
                        outputFormat: 'pdf',
                        quality: 'medium'
                      });
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

        </Card>
      )}


      {/* Analysis Results */}
      {analysis && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            PDF Analysis
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-foreground">{analysis.totalPages}</p>
              <p className="text-sm text-muted-foreground">Pages</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-foreground">{analysis.totalObjects}</p>
              <p className="text-sm text-muted-foreground">Objects</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-foreground">{analysis.imageObjects}</p>
              <p className="text-sm text-muted-foreground">Images</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-foreground">{analysis.fontObjects}</p>
              <p className="text-sm text-muted-foreground">Fonts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Structure</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Bookmarks</span>
                  <Badge variant={analysis.structure.hasBookmarks ? 'success' : 'secondary'}>
                    {analysis.structure.hasBookmarks ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Annotations</span>
                  <Badge variant={analysis.structure.hasAnnotations ? 'success' : 'secondary'}>
                    {analysis.structure.hasAnnotations ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Images</span>
                  <Badge variant={analysis.structure.hasImages ? 'success' : 'secondary'}>
                    {analysis.structure.hasImages ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Web Optimization</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Linearized</span>
                  <Badge variant={analysis.webOptimization.isLinearized ? 'success' : 'warning'}>
                    {analysis.webOptimization.isLinearized ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Object Streams</span>
                  <Badge variant={analysis.webOptimization.hasObjectStreams ? 'success' : 'warning'}>
                    {analysis.webOptimization.hasObjectStreams ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estimated Load Time</span>
                  <span className="text-sm font-medium">{analysis.streamingPotential.estimatedLoadTime}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-yellow-600 dark:text-yellow-400" />
            Optimization Recommendations
          </h3>

          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge
                        variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'secondary' : 'default'}
                      >
                        {rec.priority}
                      </Badge>
                      <h4 className="font-medium">{rec.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {rec.estimatedLoadTime}
                      </span>
                      <span className="text-blue-600 dark:text-blue-400">{rec.action}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Settings Section */}
      {selectedFile && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold flex items-center">
              <Settings className="w-5 h-5 mr-2 text-muted-foreground" />
              Linearization Settings
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </Button>
          </div>
          {/* Basic Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-foreground">Web Optimization</label>
                  <p className="text-xs text-muted-foreground">Enable linearization for web viewing</p>
                </div>
                <Switch
                  checked={formData.webOptimization}
                  onCheckedChange={(checked) => handleInputChange('webOptimization', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-foreground">Fast Loading</label>
                  <p className="text-xs text-muted-foreground">Optimize for quick page loading</p>
                </div>
                <Switch
                  checked={formData.fastLoading}
                  onCheckedChange={(checked) => handleInputChange('fastLoading', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-foreground">Streaming Support</label>
                  <p className="text-xs text-muted-foreground">Enable progressive loading</p>
                </div>
                <Switch
                  checked={formData.streamingSupport}
                  onCheckedChange={(checked) => handleInputChange('streamingSupport', checked)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Compression Level
                </label>
                <Select
                  value={formData.compressionLevel}
                  onChange={(e) => handleInputChange('compressionLevel', e.target.value)}
                  className="w-full"
                >
                  <option value="low">Low - Fast processing</option>
                  <option value="medium">Medium - Balanced</option>
                  <option value="high">High - Maximum compression</option>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {linearizePDFHelpers.getCompressionLevelDescription(formData.compressionLevel ?? 'medium')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Object Streams
                </label>
                <Select
                  value={formData.objectStreams}
                  onChange={(e) => handleInputChange('objectStreams', e.target.value)}
                  className="w-full"
                >
                  <option value="generate">Generate - Better compression</option>
                  <option value="disable">Disable - Faster processing</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="border-t pt-6">
              <h4 className="font-medium mb-4">Preservation Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Metadata</label>
                    <p className="text-xs text-muted-foreground">Preserve document properties</p>
                  </div>
                  <Switch
                    checked={formData.preserveMetadata}
                    onCheckedChange={(checked) => handleInputChange('preserveMetadata', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Annotations</label>
                    <p className="text-xs text-muted-foreground">Keep comments and notes</p>
                  </div>
                  <Switch
                    checked={formData.preserveAnnotations}
                    onCheckedChange={(checked) => handleInputChange('preserveAnnotations', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Bookmarks</label>
                    <p className="text-xs text-muted-foreground">Preserve navigation</p>
                  </div>
                  <Switch
                    checked={formData.preserveBookmarks}
                    onCheckedChange={(checked) => handleInputChange('preserveBookmarks', checked)}
                  />
                </div>
              </div>
            </div>
          )}
          {selectedFile && (
            <div className="flex flex-col mt-6 sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleLinearize}
                disabled={isProcessing}
                className="bg-success text-success-foreground hover:bg-success/90 flex items-center"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-success-foreground mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Linearize PDF
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <span>{success}</span>
        </Alert>
      )}
    </div>
  );
};

export default LinearizePDF;
