import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  FileText,
  Upload,
  Download,
  Settings,
  Info,
  CheckCircle,
  Loader2,
  Palette,
  Shield,
  Zap,
  BarChart3,
  ArrowLeft,
} from 'lucide-react';
import { optimizeFontService } from '../../services/optimizeFontService';
import type {
  OptimizeFontRequest,
  OptimizeFontResponse,
  FontOptimizationPreset,
  FontAnalysisResult
} from '../../types/optimizeFont';
import { toast } from 'react-hot-toast';
import { Link, useLocation } from 'react-router-dom';

const OptimizeFont: React.FC = () => {
   const location = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<OptimizeFontResponse | null>(null);
  const [fontAnalysis, setFontAnalysis] = useState<FontAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [presets, setPresets] = useState<FontOptimizationPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState<Omit<OptimizeFontRequest, 'file'>>({
    fontSubsetting: true,
    fontOptimization: true,
    embeddingControl: 'subset',
    fontSubsettingOptions: {
      includeAllGlyphs: false,
      includeCommonLigatures: true,
      includeDiscretionaryLigatures: false,
      includeContextualAlternates: false,
      includeKerning: true,
      includeOpenTypeFeatures: true,
      customGlyphs: []
    },
    fontOptimizationOptions: {
      removeUnusedFonts: true,
      optimizeFontMetrics: true,
      compressFontData: true,
      optimizeFontHinting: true,
      removeFontDuplicates: true,
      optimizeFontSubsets: true
    },
    embeddingControlOptions: {
      allowPrinting: true,
      allowCopying: true,
      allowEditing: false,
      allowFormFilling: true,
      allowAccessibility: true,
      allowDocumentAssembly: false,
      allowHighQualityPrinting: true
    },
    outputFormat: 'pdf',
    quality: 'medium'
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setFontAnalysis(null);
      setIsAnalyzing(true);
      // Auto-analyze fonts when file is dropped
      analyzeFonts(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  const analyzeFonts = async (fileToAnalyze: File) => {
    setIsAnalyzing(true);
    try {
      const analysis = await optimizeFontService.analyzeFonts(fileToAnalyze);
      setFontAnalysis(analysis);
    } catch (error) {
      console.error('Font analysis failed:', error);
      toast.error('Failed to analyze fonts in the document');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadPresets = async () => {
    try {
      const presetsData = await optimizeFontService.getFontOptimizationPresets();
      setPresets(presetsData);
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  };

  const applyPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setFormData({
        fontSubsetting: preset.fontSubsetting,
        fontOptimization: preset.fontOptimization,
        embeddingControl: preset.embeddingControl,
        fontSubsettingOptions: preset.fontSubsettingOptions,
        fontOptimizationOptions: preset.fontOptimizationOptions,
        embeddingControlOptions: preset.embeddingControlOptions,
        outputFormat: preset.outputFormat,
        quality: preset.quality
      });
      setSelectedPreset(presetId);
    }
  };

  const previewOptimization = async () => {
    if (!file) return;

    try {
      const preview = await optimizeFontService.previewFontOptimization({
        ...formData,
        file
      });
      setPreviewData(preview);
      setShowPreview(true);
    } catch (error) {
      console.error('Preview failed:', error);
      toast.error('Failed to generate preview');
    }
  };

  const handleOptimize = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const request: OptimizeFontRequest = {
        ...formData,
        file
      };

      const response = await optimizeFontService.optimizeFont(request);
      setResult(response);
      toast.success('Font optimization completed successfully!');
    } catch (error) {
      console.error('Font optimization failed:', error);
      toast.error('Font optimization failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (result?.downloadUrl) {
      try {
        // Create a proper download URL with the full API base URL
        const API_BASE_URL = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';
        const fullDownloadUrl = `${API_BASE_URL}${result.downloadUrl}`;
        
        console.log('Downloading from URL:', fullDownloadUrl);
        
        // Fetch the file to ensure it exists and is valid
        const response = await fetch(fullDownloadUrl);
        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
        }
        
        // Get the file blob
        const blob = await response.blob();
        
        // Check if the blob is a valid PDF
        if (blob.type !== 'application/pdf' && !blob.type.includes('pdf')) {
          console.warn('Downloaded file may not be a valid PDF, type:', blob.type);
        }
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename || 'optimized-fonts.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the object URL
        window.URL.revokeObjectURL(url);
        
        toast.success('File downloaded successfully!');
      } catch (error) {
        console.error('Download failed:', error);
        toast.error('Failed to download file. Please try again.');
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    // Handle negative numbers (size increases)
    const isNegative = bytes < 0;
    const absBytes = Math.abs(bytes);

    if (absBytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(absBytes) / Math.log(k));
    const formattedSize = parseFloat((absBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];

    return isNegative ? `+${formattedSize}` : formattedSize;
  };

  const getOptimizationScore = (): number => {
    if (!fontAnalysis) return 0;
    const { totalFonts, embeddedFonts, subsettedFonts } = fontAnalysis;
    if (totalFonts === 0) return 100;

    const embeddedRatio = embeddedFonts / totalFonts;
    const subsettedRatio = subsettedFonts / totalFonts;

    return Math.round((embeddedRatio * 0.6 + subsettedRatio * 0.4) * 100);
  };

  React.useEffect(() => {
    loadPresets();
  }, []);

  return (
    <div className="mx-auto p-2 space-y-6">
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
              <h1 className="text-3xl font-bold text-gray-900">Optimize Fonts</h1>
              <p className="mt-2 text-sm text-gray-600">
                Optimize font usage and embedding in your PDF documents. Reduce file size while maintaining quality and ensuring compatibility.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
        <div {...getRootProps()} className="cursor-pointer">
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            {isDragActive ? (
              <p className="text-blue-600">Drop the PDF file here...</p>
            ) : (
              <p className="text-gray-600">
                Drag and drop a PDF file here, or <span className="text-blue-600">click to select</span>
              </p>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2">Supports PDF files up to 100MB</p>
        </div>
      </div>


      {file && (
        <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-600" />
          <span className="font-medium">{file.name}</span>
          <span className="text-sm text-gray-500">({formatFileSize(file.size)})</span>
          {isAnalyzing && (
            <span className="flex items-center gap-2 ml-4 text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing fonts...</span>
            </span>
          )}
        </div>
      )}

      {/* Font Analysis Results */}
      {fontAnalysis && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Font Analysis Results
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {result ? result.fontOptimizationResults.fontsProcessed : fontAnalysis.totalFonts}
              </div>
              <div className="text-sm text-gray-600">Total Fonts</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {result ? result.fontOptimizationResults.fontsEmbedded : fontAnalysis.embeddedFonts}
              </div>
              <div className="text-sm text-gray-600">Embedded</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {result ? result.fontOptimizationResults.fontsSubsetted : fontAnalysis.subsettedFonts}
              </div>
              <div className="text-sm text-gray-600">Subsetted</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{getOptimizationScore()}%</div>
              <div className="text-sm text-gray-600">Optimization Score</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Font Size:</span>
              <span className="font-medium">
                {result ? formatFileSize(result.fontOptimizationResults.totalFontSizeBefore) : formatFileSize(fontAnalysis.totalFontSize)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Estimated Size Reduction:</span>
              <span className="font-medium text-green-600">
                {formatFileSize(fontAnalysis.optimizationPotential.estimatedSizeReduction)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Optimization Options */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Optimization Options
          </h3>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
          </button>
        </div>

        {/* Presets */}
        {presets.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Optimization Presets
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => applyPreset(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a preset...</option>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} - {preset.description}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Basic Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.fontSubsetting}
                onChange={(e) => setFormData({ ...formData, fontSubsetting: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium">Font Subsetting</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">Include only used characters</p>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.fontOptimization}
                onChange={(e) => setFormData({ ...formData, fontOptimization: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium">Font Optimization</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">Optimize font data and metrics</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Embedding Control
            </label>
            <select
              value={formData.embeddingControl}
              onChange={(e) => setFormData({ ...formData, embeddingControl: e.target.value as any })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="full">Full Embedding</option>
              <option value="subset">Subset Embedding</option>
              <option value="none">No Embedding</option>
            </select>
          </div>
        </div>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="space-y-6 border-t pt-6">
            {/* Font Subsetting Options */}
            <div>
              <h4 className="text-md font-medium mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4 text-blue-600" />
                Font Subsetting Options
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(formData.fontSubsettingOptions || {}).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={value as boolean}
                      onChange={(e) => setFormData({
                        ...formData,
                        fontSubsettingOptions: {
                          ...formData.fontSubsettingOptions,
                          [key]: e.target.checked
                        }
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Font Optimization Options */}
            <div>
              <h4 className="text-md font-medium mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                Font Optimization Options
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(formData.fontOptimizationOptions || {}).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={value as boolean}
                      onChange={(e) => setFormData({
                        ...formData,
                        fontOptimizationOptions: {
                          ...formData.fontOptimizationOptions,
                          [key]: e.target.checked
                        }
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Embedding Control Options */}
            <div>
              <h4 className="text-md font-medium mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                Embedding Control Options
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(formData.embeddingControlOptions || {}).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={value as boolean}
                      onChange={(e) => setFormData({
                        ...formData,
                        embeddingControlOptions: {
                          ...formData.embeddingControlOptions,
                          [key]: e.target.checked
                        }
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Output Format and Quality */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Output Format
                </label>
                <select
                  value={formData.outputFormat}
                  onChange={(e) => setFormData({ ...formData, outputFormat: e.target.value as any })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pdf">PDF</option>
                  <option value="pdfa">PDF/A</option>
                  <option value="pdfx">PDF/X</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quality
                </label>
                <select
                  value={formData.quality}
                  onChange={(e) => setFormData({ ...formData, quality: e.target.value as any })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={previewOptimization}
          disabled={!file || isProcessing}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Info className="w-4 h-4" />
          Preview Results
        </button>

        <button
          onClick={handleOptimize}
          disabled={!file || isProcessing}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          {isProcessing ? 'Optimizing...' : 'Optimize Fonts'}
        </button>
      </div>

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Optimization Preview</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Estimated File Size:</span>
                <span className="font-medium">{formatFileSize(previewData.estimatedFileSize)}</span>
              </div>
              <div className="flex justify-between">
                <span>Size Reduction:</span>
                <span className="font-medium text-green-600">{formatFileSize(previewData.estimatedSizeReduction)}</span>
              </div>
              <div className="flex justify-between">
                <span>Processing Time:</span>
                <span className="font-medium">{previewData.estimatedProcessingTime}s</span>
              </div>
            </div>
            {previewData.warnings.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Warnings:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {previewData.warnings.map((warning: string, index: number) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  handleOptimize();
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Optimization Results
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{formatFileSize(result.fileSize)}</div>
              <div className="text-sm text-gray-600">Final Size</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{formatFileSize(result.sizeReduction)}</div>
              <div className="text-sm text-gray-600">Size Reduced</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{result.compressionRatio}</div>
              <div className="text-sm text-gray-600">Compression Ratio</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{result.totalPages}</div>
              <div className="text-sm text-gray-600">Total Pages</div>
            </div>
          </div>

          {/* Warning if file size increased */}
          {result && result.sizeReduction < 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <span className="text-sm font-medium">⚠️ File Size Increased</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                The optimization process increased the file size by {formatFileSize(Math.abs(result.sizeReduction))}.
                This can happen when fonts are embedded or when additional optimization metadata is added.
              </p>
            </div>
          )}

          {/* Font Optimization Results */}
          <div className="mb-6">
            <h4 className="text-md font-medium mb-3">Font Optimization Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Fonts Processed:</span>
                  <span className="font-medium">{result.fontOptimizationResults.fontsProcessed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Fonts Subsetted:</span>
                  <span className="font-medium">{result.fontOptimizationResults.fontsSubsetted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Fonts Optimized:</span>
                  <span className="font-medium">{result.fontOptimizationResults.fontsOptimized}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Fonts Embedded:</span>
                  <span className="font-medium">{result.fontOptimizationResults.fontsEmbedded}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Font Size Reduction:</span>
                  <span className="font-medium text-green-600">{formatFileSize(result.fontOptimizationResults.fontSizeReduction)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Font Compression:</span>
                  <span className="font-medium">{result.fontOptimizationResults.fontCompressionRatio}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleDownload}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Optimized PDF
            </button>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <Info className="w-5 h-5" />
          About Font Optimization
        </h3>
        <div className="text-blue-800 space-y-2 text-sm">
          <p>
            <strong>Font Subsetting:</strong> Reduces file size by including only the characters that are actually used in your document.
          </p>
          <p>
            <strong>Font Optimization:</strong> Compresses font data and optimizes metrics for better performance.
          </p>
          <p>
            <strong>Embedding Control:</strong> Manages how fonts are embedded to ensure compatibility across different devices and platforms.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OptimizeFont;
