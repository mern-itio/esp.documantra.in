import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  Settings,
  FileText,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Shield,
  PenTool,
  FileSpreadsheet,
  Info,
  Search,
  Zap,
  Target,
  Layout,
  Smartphone
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { pdfApi } from '../../services/apiHelper';

interface DetectedField {
  name: string;
  type: string;
  confidence: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  suggestedLabel: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    type?: string;
  };
  improvements?: {
    improvedPlacement?: boolean;
    improvedValidation?: boolean;
    improvedLabel?: boolean;
    improvedName?: boolean;
  };
}

interface FormAnalysis {
  totalPages: number;
  formType: string;
  confidence: number;
  detectedElements: any[];
  recommendations: string[];
}

interface OptimizationOptions {
  enhanceValidation: boolean;
  optimizeNames: boolean;
  optimizePosition: boolean;
  improveLabels: boolean;
}

const FormRecognitionPage: React.FC = () => {
   const location = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [detectedFields, setDetectedFields] = useState<DetectedField[]>([]);
  const [formAnalysis, setFormAnalysis] = useState<FormAnalysis | null>(null);
  const [optimizationOptions, setOptimizationOptions] = useState<OptimizationOptions>({
    enhanceValidation: true,
    optimizeNames: true,
    optimizePosition: true,
    improveLabels: true
  });
  const [optimizedFields, setOptimizedFields] = useState<DetectedField[]>([]);
  const [resultFile, setResultFile] = useState<string>('');
  const [processingMode, setProcessingMode] = useState<'convert' | 'analyze' | 'detect' | 'optimize'>('convert');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setDetectedFields([]);
      setFormAnalysis(null);
      setOptimizedFields([]);
      setResultFile('');
      toast.success('PDF file selected for form recognition');
    } else {
      toast.error('Please select a valid PDF file');
    }
  };

  const handleConvertToFillable = async () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file first');
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);

      const response = await pdfApi.post('/pdf-form-recognition/convert', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 200 && response.data.success) {
        const result = response.data.result;
        setResultFile(result.filename);
        toast.success(`Form converted successfully! ${result.fieldsCreated} fields created`);
      }
    } catch (error) {
      console.error('Error converting form:', error);
      toast.error('Failed to convert form');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalyzeForm = async () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file first');
      return;
    }

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);

      const response = await pdfApi.post('/pdf-form-recognition/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 200 && response.data.success) {
        setFormAnalysis(response.data.analysis);
        toast.success('Form analysis completed');
      }
    } catch (error) {
      console.error('Error analyzing form:', error);
      toast.error('Failed to analyze form');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDetectFields = async () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file first');
      return;
    }

    setIsDetecting(true);
    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);

      const response = await pdfApi.post('/pdf-form-recognition/detect-fields', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 200 && response.data.success) {
        setDetectedFields(response.data.detectedFields);
        toast.success(`Detected ${response.data.totalFields} form fields`);
      }
    } catch (error) {
      console.error('Error detecting fields:', error);
      toast.error('Failed to detect form fields');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleOptimizeFields = async () => {
    if (detectedFields.length === 0) {
      toast.error('No fields to optimize. Please detect fields first.');
      return;
    }

    setIsOptimizing(true);
    try {
      const response = await pdfApi.post('/pdf-form-recognition/optimize-fields', {
        fields: detectedFields,
        optimizationOptions
      });

      if (response.status === 200 && response.data.success) {
        setOptimizedFields(response.data.optimizedFields);
        const improvements = response.data.improvements;
        toast.success(`Optimization completed! ${improvements.improvedPlacement} placement, ${improvements.improvedValidation} validation improvements`);
      }
    } catch (error) {
      console.error('Error optimizing fields:', error);
      toast.error('Failed to optimize fields');
    } finally {
      setIsOptimizing(false);
    }
  };

  const downloadResult = () => {
    if (resultFile) {
      const downloadUrl = `${import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104'}/downloads/${resultFile}`;
      window.open(downloadUrl, '_blank');
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="mx-auto min-h-full w-full space-y-6 bg-background text-foreground">
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
              <h1 className="text-3xl font-bold text-foreground">Form Recognition</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Convert static forms to fillable forms with AI-powered field detection and optimization
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload */}
          <div className="bg-card rounded-lg shadow p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Upload Static Form</h2>

            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center bg-muted/30 dark:bg-muted/20">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <div className="mt-4">
                <label className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-500 font-medium">
                    Click to upload
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-muted-foreground mt-1">or drag and drop</p>
              </div>
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
          </div>

          {/* Processing Mode Selection */}
          <div className="bg-card rounded-lg shadow p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Processing Mode</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setProcessingMode('convert')}
                className={`p-4 rounded-lg border-2 text-left ${processingMode === 'convert'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-muted-foreground/40'
                  }`}
              >
                <Zap className="w-6 h-6 text-primary mb-2" />
                <h3 className="font-medium">Convert to Fillable</h3>
                <p className="text-sm text-muted-foreground">Full conversion with field detection</p>
              </button>

              <button
                onClick={() => setProcessingMode('analyze')}
                className={`p-4 rounded-lg border-2 text-left ${processingMode === 'analyze'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-muted-foreground/40'
                  }`}
              >
                <Search className="w-6 h-6 text-primary mb-2" />
                <h3 className="font-medium">Analyze Form</h3>
                <p className="text-sm text-muted-foreground">Analyze form structure and content</p>
              </button>

              <button
                onClick={() => setProcessingMode('detect')}
                className={`p-4 rounded-lg border-2 text-left ${processingMode === 'detect'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-muted-foreground/40'
                  }`}
              >
                <Target className="w-6 h-6 text-primary mb-2" />
                <h3 className="font-medium">Detect Fields</h3>
                <p className="text-sm text-muted-foreground">Automatic field detection only</p>
              </button>

              <button
                onClick={() => setProcessingMode('optimize')}
                className={`p-4 rounded-lg border-2 text-left ${processingMode === 'optimize'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-muted-foreground/40'
                  }`}
              >
                <Settings className="w-6 h-6 text-primary mb-2" />
                <h3 className="font-medium">Optimize Fields</h3>
                <p className="text-sm text-muted-foreground">Optimize field properties</p>
              </button>
            </div>
          </div>

          {/* Form Analysis Results */}
          {formAnalysis && processingMode === 'analyze' && (
            <div className="bg-card rounded-lg shadow p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">Form Analysis Results</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-foreground mb-3">Form Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Form Type:</span>
                      <span className="font-medium capitalize">{formAnalysis.formType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Pages:</span>
                      <span className="font-medium">{formAnalysis.totalPages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confidence:</span>
                      <span className={`font-medium ${getConfidenceColor(formAnalysis.confidence)}`}>
                        {Math.round(formAnalysis.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-3">Recommendations</h3>
                  <div className="space-y-2">
                    {formAnalysis.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detected Fields */}
          {detectedFields.length > 0 && (processingMode === 'detect' || processingMode === 'optimize') && (
            <div className="bg-card rounded-lg shadow p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">Detected Fields</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detectedFields.map((field, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-foreground">{field.suggestedLabel}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(field.confidence)} bg-opacity-10`}>
                        {getConfidenceText(field.confidence)} ({Math.round(field.confidence * 100)}%)
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>Type: <span className="font-medium">{field.type}</span></div>
                      <div>Name: <span className="font-mono text-xs">{field.name}</span></div>
                      {field.validation && (
                        <div className="text-xs text-muted-foreground">
                          Validation: {Object.keys(field.validation).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optimized Fields */}
          {optimizedFields.length > 0 && processingMode === 'optimize' && (
            <div className="bg-card rounded-lg shadow p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">Optimized Fields</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {optimizedFields.map((field, index) => (
                  <div key={index} className="border border-success rounded-lg p-4 bg-success/10">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-foreground">{field.suggestedLabel}</h3>
                      <span className="text-xs px-2 py-1 rounded-full text-success bg-success/10">
                        Optimized
                      </span>
                    </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                      <div>Type: <span className="font-medium">{field.type}</span></div>
                      <div>Name: <span className="font-mono text-xs">{field.name}</span></div>
                      {field.improvements && (
                        <div className="text-xs text-success">
                          Improvements: {Object.keys(field.improvements).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-card rounded-lg shadow p-6 border border-border">
            <div className="flex flex-wrap gap-4">
              {processingMode === 'convert' && (
                <button
                  onClick={handleConvertToFillable}
                  disabled={isProcessing || !selectedFile}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/80 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  Convert to Fillable Form
                </button>
              )}

              {processingMode === 'analyze' && (
                <button
                  onClick={handleAnalyzeForm}
                  disabled={isAnalyzing || !selectedFile}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/80 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  Analyze Form
                </button>
              )}

              {processingMode === 'detect' && (
                <button
                  onClick={handleDetectFields}
                  disabled={isDetecting || !selectedFile}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/80 disabled:opacity-50"
                >
                  {isDetecting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Target className="w-4 h-4 mr-2" />
                  )}
                  Detect Fields
                </button>
              )}

              {processingMode === 'optimize' && (
                <button
                  onClick={handleOptimizeFields}
                  disabled={isOptimizing || detectedFields.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/80 disabled:opacity-50"
                >
                  {isOptimizing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Settings className="w-4 h-4 mr-2" />
                  )}
                  Optimize Fields
                </button>
              )}

              {resultFile && (
                <button
                  onClick={downloadResult}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-success hover:bg-success/80"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Fillable Form
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Optimization Options */}
          {processingMode === 'optimize' && (
            <div className="bg-card rounded-lg shadow p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">Optimization Options</h2>

              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={optimizationOptions.enhanceValidation}
                    onChange={(e) => setOptimizationOptions(prev => ({ ...prev, enhanceValidation: e.target.checked }))}
                    className="h-4 w-4 text-primary focus:ring-primary border-border bg-background text-foreground rounded"
                  />
                  <span className="ml-2 text-sm text-muted-foreground">Enhance validation rules</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={optimizationOptions.optimizeNames}
                    onChange={(e) => setOptimizationOptions(prev => ({ ...prev, optimizeNames: e.target.checked }))}
                      className="h-4 w-4 text-primary focus:ring-primary border-border bg-background text-foreground rounded"
                  />
                  <span className="ml-2 text-sm text-muted-foreground">Optimize field names</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={optimizationOptions.optimizePosition}
                    onChange={(e) => setOptimizationOptions(prev => ({ ...prev, optimizePosition: e.target.checked }))}
                    className="h-4 w-4 text-primary focus:ring-primary border-border bg-background text-foreground rounded"
                  />
                  <span className="ml-2 text-sm text-muted-foreground">Optimize field positioning</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={optimizationOptions.improveLabels}
                    onChange={(e) => setOptimizationOptions(prev => ({ ...prev, improveLabels: e.target.checked }))}
                    className="h-4 w-4 text-primary focus:ring-primary border-border bg-background text-foreground rounded"
                  />
                    <span className="ml-2 text-sm text-muted-foreground">Improve field labels</span>
                </label>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="bg-card rounded-lg shadow p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Features</h2>

            <div className="space-y-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <Target className="w-4 h-4 mr-2 text-primary" />
                Automatic field detection
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Search className="w-4 h-4 mr-2 text-success" />
                Form analysis
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Settings className="w-4 h-4 mr-2 text-primary" />
                Field optimization
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Zap className="w-4 h-4 mr-2 text-primary" />
                AI-powered conversion
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Shield className="w-4 h-4 mr-2 text-primary" />
                Smart validation
              </div>
            </div>
          </div>

          {/* Supported Form Types */}
          <div className="bg-card rounded-lg shadow p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Supported Form Types</h2>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <FileText className="w-4 h-4 mr-2 text-primary" />
                Application forms
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Layout className="w-4 h-4 mr-2 text-success" />
                Surveys & questionnaires
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <PenTool className="w-4 h-4 mr-2 text-primary" />
                Contracts & agreements
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <FileSpreadsheet className="w-4 h-4 mr-2 text-primary" />
                Invoices & receipts
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                  <Smartphone className="w-4 h-4 mr-2 text-primary" />
                General forms
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-muted border border-border bg-background text-foreground rounded-lg p-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-foreground">
                <p className="font-medium mb-1">How it works:</p>
                <p>Upload a static PDF form and our AI will automatically detect form fields, analyze the structure, and convert it into a fillable form with proper validation and optimization.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormRecognitionPage;
