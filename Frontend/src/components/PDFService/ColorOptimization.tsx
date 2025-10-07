import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../DocumentService/ui/button';
import { Card } from '../DocumentService/ui/card';
import { Select } from '../DocumentService/ui/select';
import { Switch } from '../DocumentService/ui/switch';
import Badge from '../DocumentService/ui/badge';
import { Alert } from '../DocumentService/ui/alert';
import { colorOptimizationService, colorOptimizationHelpers } from '../../services/colorOptimizationService';
import type {
  ColorOptimizationRequest,
  ColorOptimizationResponse,
  ColorAnalysis,
  ColorOptimizationPreset,
  ColorOptimizationRecommendation
} from '../../types/colorOptimization';
import {
  Download,
  Settings,
  Eye,
  FileText,
  Palette,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Zap,
  X
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const ColorOptimization: React.FC = () => {
  const location = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ColorOptimizationResponse | null>(null);
  const [analysis, setAnalysis] = useState<ColorAnalysis | null>(null);
  const [presets, setPresets] = useState<ColorOptimizationPreset[]>([]);
  const [recommendations, setRecommendations] = useState<ColorOptimizationRecommendation[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('web_optimized');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<ColorOptimizationRequest>({
    file: null as any,
    colorConversion: true,
    profileOptimization: true,
    gamutMapping: true,
    targetColorSpace: 'auto',
    preserveTransparency: true,
    dithering: false,
    quality: 'medium',
    outputFormat: 'pdf'
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
          colorConversion: preset.colorConversion,
          profileOptimization: preset.profileOptimization,
          gamutMapping: preset.gamutMapping,
          targetColorSpace: preset.targetColorSpace,
          preserveTransparency: preset.preserveTransparency,
          dithering: preset.dithering,
          quality: preset.quality,
          outputFormat: prev.outputFormat
        }));
      }
    }
  }, [selectedPreset, presets]);

  const loadPresets = async () => {
    try {
      const response = await colorOptimizationService.getPresets();
      setPresets(response.presets);
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validationError = colorOptimizationHelpers.getFileValidationError(file);
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
      const response = await colorOptimizationService.analyzeColors(selectedFile);
      setAnalysis(response.analysis);

      // Get recommendations
      const recResponse = await colorOptimizationService.getRecommendations(selectedFile);
      setRecommendations(recResponse.recommendations);

      setSuccess('PDF color analysis completed successfully');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to analyze PDF colors');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOptimize = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await colorOptimizationService.optimizeColors({
        ...formData,
        file: selectedFile
      });

      setResult(response);
      setSuccess('Color optimization completed successfully!');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to optimize colors');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      colorOptimizationService.downloadColorOptimizedPDF(result.filename);
    }
  };

  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId);
  };

  const handleInputChange = (field: keyof ColorOptimizationRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setSelectedFile(null);
    setFormData({
      file: null as any,
      colorConversion: true,
      profileOptimization: true,
      gamutMapping: true,
      targetColorSpace: 'auto',
      preserveTransparency: true,
      dithering: false,
      quality: 'medium',
      outputFormat: 'pdf'
    });
    setResult(null);
    setAnalysis(null);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
useEffect(() => {
  if (success) {
    const timer = setTimeout(() => {
      setSuccess(null); // or '' depending on your state type
    }, 3000);

    return () => clearTimeout(timer); // cleanup if component unmounts early
  }
}, [success]);
  // Show only result when optimization is successful - hide everything else
  if (result && result.success) {
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
                <h1 className="text-3xl font-bold text-gray-900">Color Optimization</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Optimize color spaces and profiles for better compatibility and file size.
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
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Color Optimization Complete!</h3>
              <p className="text-gray-600">Your PDF colors have been optimized successfully</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {colorOptimizationHelpers.formatFileSize(result.originalSize)}
                </p>
                <p className="text-sm text-gray-600">Original Size</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {colorOptimizationHelpers.formatFileSize(result.optimizedSize)}
                </p>
                <p className="text-sm text-gray-600">Optimized Size</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {result.sizeChangePercent}%
                </p>
                <p className="text-sm text-gray-600">Size Change</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {colorOptimizationHelpers.formatProcessingTime(result.processingTime)}
                </p>
                <p className="text-sm text-gray-600">Processing Time</p>
              </div>
            </div>

            {/* Optimization Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <Palette className="w-4 h-4 mr-2 text-blue-600" />
                  Color Settings Applied
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Color Conversion</span>
                    <Badge variant={result.settings.colorConversion ? 'success' : 'secondary'}>
                      {result.settings.colorConversion ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Profile Optimization</span>
                    <Badge variant={result.settings.profileOptimization ? 'success' : 'secondary'}>
                      {result.settings.profileOptimization ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Gamut Mapping</span>
                    <Badge variant={result.settings.gamutMapping ? 'success' : 'secondary'}>
                      {result.settings.gamutMapping ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Target Color Space</span>
                    <span className="text-sm font-medium">{result.settings.targetColorSpace}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-green-600" />
                  Optimization Results
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Quality Level</span>
                    <Badge variant="success">{result.settings.quality}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Transparency Preserved</span>
                    <Badge variant={result.settings.preserveTransparency ? 'success' : 'secondary'}>
                      {result.settings.preserveTransparency ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Dithering Applied</span>
                    <Badge variant={result.settings.dithering ? 'success' : 'secondary'}>
                      {result.settings.dithering ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Output Format</span>
                    <span className="text-sm font-medium">{result.settings.outputFormat}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleDownload}
                className="bg-green-600 hover:bg-green-700 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Color Optimized PDF
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
              <h1 className="text-3xl font-bold text-gray-900">Color Optimization</h1>
              <p className="mt-2 text-sm text-gray-600">
                Optimize color spaces and profiles for better compatibility and file size.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* File Upload Section - Only show when no file selected */}
      {!selectedFile && (
        <Card className="p-6">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Palette className="w-8 h-8 mb-4 text-gray-500" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PDF files only (MAX. 2MB)</p>
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              {/* File Info */}
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Selected PDF File</h3>
                  <p className="text-sm text-gray-600">
                    {(selectedFile as File).name} • {colorOptimizationHelpers.formatFileSize((selectedFile as File).size)}
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
                      className="bg-blue-600 hover:bg-blue-700 flex items-center"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Analyzing Colors...
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Analyze PDF Colors
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
                        colorConversion: true,
                        profileOptimization: true,
                        gamutMapping: true,
                        targetColorSpace: 'auto',
                        preserveTransparency: true,
                        dithering: false,
                        quality: 'medium',
                        outputFormat: 'pdf'
                      });
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

        </Card>
      )}

      {/* Analysis Results and Recommendations - Side by Side */}
      {(analysis || recommendations.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Analysis Results */}
          {analysis && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Palette className="w-5 h-5 mr-2 text-blue-600" />
                Color Analysis Results
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{analysis.totalPages}</p>
                  <p className="text-sm text-gray-600">Pages</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{analysis.colorObjects}</p>
                  <p className="text-sm text-gray-600">Color Objects</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{analysis.imageObjects}</p>
                  <p className="text-sm text-gray-600">Images</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{analysis.fontObjects}</p>
                  <p className="text-sm text-gray-600">Fonts</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Color Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Color Space</span>
                      <Badge variant="secondary">{analysis.colorSpace}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Color Profile</span>
                      <Badge variant="secondary">{analysis.colorProfile}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Transparency</span>
                      <Badge variant={analysis.hasTransparency ? 'success' : 'secondary'}>
                        {analysis.hasTransparency ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Optimization Potential</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Color Conversion</span>
                      <Badge variant={analysis.optimizationPotential.canConvertColors ? 'success' : 'warning'}>
                        {analysis.optimizationPotential.canConvertColors ? 'Available' : 'Limited'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Profile Optimization</span>
                      <Badge variant={analysis.optimizationPotential.canOptimizeProfiles ? 'success' : 'warning'}>
                        {analysis.optimizationPotential.canOptimizeProfiles ? 'Available' : 'Limited'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Estimated Savings</span>
                      <span className="text-sm font-medium text-green-600">
                        {analysis.optimizationPotential.estimatedSavings}
                      </span>
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
                <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
                Optimization Recommendations
              </h3>

              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
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
                        <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-green-600 font-medium">
                            {rec.estimatedSavings}
                          </span>
                          <span className="text-blue-600">{rec.action}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Settings Section */}
      {selectedFile && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold flex items-center">
              <Settings className="w-5 h-5 mr-2 text-gray-600" />
              Color Optimization Settings
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </Button>
          </div>

          {/* Preset Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Optimization Preset
            </label>
            <Select
              value={selectedPreset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full"
            >
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </Select>
            <p className="text-sm text-gray-500 mt-1">
              {colorOptimizationHelpers.getPresetDescription(selectedPreset)}
            </p>
          </div>

          {/* Basic Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              {/* <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Color Conversion</label>
                  <p className="text-xs text-gray-500 text-red-600">Note: Not supported by qpdf, kept for UI compatibility</p>
                </div>
                <Switch
                  checked={formData.colorConversion}
                  onCheckedChange={(checked) => handleInputChange('colorConversion', checked)}
                  disabled={true}
                />
              </div> */}

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Profile Optimization</label>
                  <p className="text-xs text-gray-500">Optimize color profiles</p>
                </div>
                <Switch
                  checked={formData.profileOptimization}
                  onCheckedChange={(checked) => handleInputChange('profileOptimization', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Gamut Mapping</label>
                  <p className="text-xs text-gray-500">Apply gamut mapping</p>
                </div>
                <Switch
                  checked={formData.gamutMapping}
                  onCheckedChange={(checked) => handleInputChange('gamutMapping', checked)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Color Space
                </label>
                <Select
                  value={formData.targetColorSpace}
                  onChange={(e) => handleInputChange('targetColorSpace', e.target.value as any)}
                  className="w-full"
                >
                  <option value="rgb">RGB - Web & Screen</option>
                  <option value="cmyk">CMYK - Print</option>
                  <option value="grayscale">Grayscale</option>
                  <option value="auto">Auto Detect</option>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {colorOptimizationHelpers.getColorSpaceDescription(formData.targetColorSpace ?? 'auto')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality Level
                </label>
                <Select
                  value={formData.quality}
                  onChange={(e) => handleInputChange('quality', e.target.value)}
                  className="w-full"
                >
                  <option value="low">Low - Fast processing</option>
                  <option value="medium">Medium - Balanced</option>
                  <option value="high">High - Best quality</option>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {colorOptimizationHelpers.getQualityLevelDescription(formData.quality ?? 'medium')}
                </p>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="border-t pt-6">
              <h4 className="font-medium mb-4">Advanced Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Preserve Transparency</label>
                    <p className="text-xs text-gray-500">Keep transparent elements</p>
                  </div>
                  <Switch
                    checked={formData.preserveTransparency}
                    onCheckedChange={(checked) => handleInputChange('preserveTransparency', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Dithering</label>
                    <p className="text-xs text-gray-500">Apply dithering for color conversion</p>
                  </div>
                  <Switch
                    checked={formData.dithering}
                    onCheckedChange={(checked) => handleInputChange('dithering', checked)}
                  />
                </div>
              </div>
            </div>
          )}
           <div className="flex flex-col sm:flex-row mt-6 gap-4 justify-center">
            <Button
              onClick={handleOptimize}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700 flex items-center"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Optimizing Colors...
                </>
              ) : (
                <>
                  <Palette className="w-4 h-4 mr-2" />
                  Optimize Colors
                </>
              )}
            </Button>
          </div>
        </Card>
      )}


      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <span>{success}</span>
        </Alert>
      )}
    </div>
  );
};

export default ColorOptimization;
