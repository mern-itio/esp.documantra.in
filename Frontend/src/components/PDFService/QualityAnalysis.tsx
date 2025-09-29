import React, { useState, useRef } from 'react';
import { Button } from '../DocumentService/ui/button';
import { Card } from '../DocumentService/ui/card';
// import { Select } from '../DocumentService/ui/select';
import Badge from '../DocumentService/ui/badge';
import { Alert } from '../DocumentService/ui/alert';
import { qualityAnalysisService, qualityAnalysisHelpers } from '../../services/qualityAnalysisService';
import type {
  QualityAnalysisResponse,
  // QualityAnalysisT,
  // QualityAnalysisPreset,
} from '../../types/qualityAnalysis';
import {
  FileText,
  BarChart3,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Target,
  Zap,
  Clock,
  TrendingUp,
  Lightbulb,
  X
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
interface QualityAnalysisProps {
  onBack?: () => void;
}

const QualityAnalysis: React.FC<QualityAnalysisProps> = ({ onBack }) => {
   const location = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<QualityAnalysisResponse | null>(null);
  // const [presets, setPresets] = useState<QualityAnalysisPreset[]>([]);
  // const [selectedPreset, setSelectedPreset] = useState<string>('comprehensive');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // useEffect(() => {
  //   loadPresets();
  // }, []);

  // const loadPresets = async () => {
  //   try {
  //     const response = await qualityAnalysisService.getPresets();
  //     // setPresets(response.presets);
  //   } catch (error) {
  //     console.error('Failed to load presets:', error);
  //   }
  // };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please select a PDF file');
        return;
      }

      setSelectedFile(file);
      setError(null);
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await qualityAnalysisService.analyzeQuality({
        file: selectedFile,
        // preset: selectedPreset
      });

      setResult(response);
      setSuccess('Quality analysis completed successfully!');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to analyze PDF quality');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getQualityScoreBackground = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 80) return 'bg-blue-100';
    if (score >= 70) return 'bg-yellow-100';
    if (score >= 60) return 'bg-orange-100';
    return 'bg-red-100';
  };

  // Show only result when analysis is successful - hide everything else
  if (result && result.success) {
    return (
      <div className="mx-auto p-2 space-y-6">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-6">
              {onBack ? (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : (
                <Link
                     to={`/pdf-tools${location.search}`}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Quality Analysis</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Analyze and score document quality with comprehensive metrics and optimization suggestions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Show only the result - everything else is hidden */}
        <div className="max-w-7xl mx-auto p-6">
          <div className="space-y-6">
            {/* Quality Score Overview */}
            <Card className="p-6">
              <div className="text-center mb-6">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Quality Analysis Complete!</h3>
                <p className="text-gray-600">Your PDF has been analyzed successfully</p>
              </div>

              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-4xl font-bold mb-4 ${getQualityScoreBackground(result.analysis.qualityScore.score)} ${getQualityScoreColor(result.analysis.qualityScore.score)}`}>
                  {result.analysis.qualityScore.score}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Quality Score: {result.analysis.qualityScore.score}/100
                </h3>
                <Badge className={`text-lg px-4 py-2 ${qualityAnalysisHelpers.getQualityLevelColor(result.analysis.qualityScore.qualityLevel)}`}>
                  {qualityAnalysisHelpers.getQualityLevelIcon(result.analysis.qualityScore.qualityLevel)} {result.analysis.qualityScore.qualityLevel.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{result.analysis.qualityScore.breakdown.structure}</p>
                  <p className="text-sm text-gray-600">Structure</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{result.analysis.qualityScore.breakdown.content}</p>
                  <p className="text-sm text-gray-600">Content</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{result.analysis.qualityScore.breakdown.performance}</p>
                  <p className="text-sm text-gray-600">Performance</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{result.analysis.qualityScore.breakdown.size}</p>
                  <p className="text-sm text-gray-600">Size</p>
                </div>
              </div>
            </Card>

            {/* Document Information */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Document Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{result.analysis.totalPages}</p>
                  <p className="text-sm text-gray-600">Total Pages</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">
                    {qualityAnalysisHelpers.formatFileSize(result.analysis.fileSize)}
                  </p>
                  <p className="text-sm text-gray-600">File Size</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">
                    {new Date(result.analysis.timestamp).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">Analysis Date</p>
                </div>
              </div>
            </Card>

            {/* Structure Analysis */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-green-600" />
                Structure Analysis
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Structure Score</span>
                  <Badge className={`px-3 py-1 ${getQualityScoreBackground(result.analysis.structureAnalysis.structureScore)} ${getQualityScoreColor(result.analysis.structureAnalysis.structureScore)}`}>
                    {result.analysis.structureAnalysis.structureScore}/100
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Status</span>
                  <Badge variant={result.analysis.structureAnalysis.isValid ? 'success' : 'destructive'}>
                    {result.analysis.structureAnalysis.isValid ? 'Valid' : 'Invalid'}
                  </Badge>
                </div>

                {result.analysis.structureAnalysis.hasErrors && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-2">Issues Found:</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {result.analysis.structureAnalysis.errorDetails.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>

            {/* Content Analysis */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
                Content Analysis
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className={`text-2xl font-bold ${getQualityScoreColor(result.analysis.contentAnalysis.textQuality)}`}>
                    {result.analysis.contentAnalysis.textQuality}/100
                  </p>
                  <p className="text-sm text-gray-600">Text Quality</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className={`text-2xl font-bold ${getQualityScoreColor(result.analysis.contentAnalysis.imageQuality)}`}>
                    {result.analysis.contentAnalysis.imageQuality}/100
                  </p>
                  <p className="text-sm text-gray-600">Image Quality</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className={`text-2xl font-bold ${getQualityScoreColor(result.analysis.contentAnalysis.fontQuality)}`}>
                    {result.analysis.contentAnalysis.fontQuality}/100
                  </p>
                  <p className="text-sm text-gray-600">Font Quality</p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Overall Content Score</span>
                  <Badge className={`px-3 py-1 ${getQualityScoreBackground(result.analysis.contentAnalysis.contentScore)} ${getQualityScoreColor(result.analysis.contentAnalysis.contentScore)}`}>
                    {result.analysis.contentAnalysis.contentScore}/100
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Performance Analysis */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-600" />
                Performance Analysis
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className={`text-2xl font-bold ${qualityAnalysisHelpers.getLoadTimeColor(result.analysis.performanceAnalysis.loadTime)}`}>
                    {result.analysis.performanceAnalysis.loadTime.toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-600">Load Time</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {result.analysis.performanceAnalysis.compressionRatio}%
                  </p>
                  <p className="text-sm text-gray-600">Compression Ratio</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className={`text-2xl font-bold ${getQualityScoreColor(result.analysis.performanceAnalysis.performanceScore)}`}>
                    {result.analysis.performanceAnalysis.performanceScore}/100
                  </p>
                  <p className="text-sm text-gray-600">Performance Score</p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Estimated Load Time:</span>
                  <span className="text-sm text-gray-600">{result.analysis.performanceAnalysis.estimatedLoadTime}</span>
                </div>
              </div>
            </Card>

            {/* Optimization Suggestions */}
            {result.analysis.optimizationSuggestions.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
                  Optimization Suggestions
                </h3>

                <div className="space-y-3">
                  {result.analysis.optimizationSuggestions.map((suggestion, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={`px-2 py-1 text-xs ${qualityAnalysisHelpers.getPriorityColor(suggestion.priority)}`}>
                              {suggestion.priority.toUpperCase()}
                            </Badge>
                            <h4 className="font-medium">{suggestion.title}</h4>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-green-600 font-medium">
                              Estimated Improvement: {suggestion.estimatedImprovement}
                            </span>
                            <span className="text-blue-600">{suggestion.action}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
                Start New Analysis
              </Button>
            </div>
          </div>
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
            {onBack ? (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <Link
                   to={`/pdf-tools${location.search}`}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quality Analysis</h1>
              <p className="mt-2 text-sm text-gray-600">
                Analyze and score document quality with comprehensive metrics and optimization suggestions.
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
                <BarChart3 className="w-8 h-8 mb-4 text-gray-500" />
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
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Selected PDF File</h3>
                  <p className="text-sm text-gray-600">
                    {(selectedFile as File).name} • {qualityAnalysisHelpers.formatFileSize((selectedFile as File).size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setResult(null);
                  setError(null);
                  setSuccess(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Analysis Section */}
      {selectedFile && (
        <Card className="p-6">
          <div className="text-center">
            <Button
              onClick={handleAnalyze}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing Quality...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analyze PDF Quality
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

export default QualityAnalysis;
