import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  BarChart3,
  Info,
  Zap,
  Target,
  AlertCircle,
  CheckSquare
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { pdfValidatorService } from '../../services/pdfValidatorService';
import type { ValidationResult, ValidationStandards } from '../../services/pdfValidatorService';

type ActiveTab = 'validation' | 'standards';

const PdfValidatorPage: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<ActiveTab>('validation');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Single PDF validation
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  
  // Standards
  const [standards, setStandards] = useState<ValidationStandards | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadStandards();
  }, []);

  const loadStandards = async () => {
    try {
      const standardsData = await pdfValidatorService.getValidationStandards();
      setStandards(standardsData);
    } catch (error) {
      console.error('Error loading standards:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setValidationResult(null);
      toast.success('PDF file selected');
    } else {
      toast.error('Please select a valid PDF file');
    }
  };

  const handleValidatePdf = async () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file first');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await pdfValidatorService.validatePdf(selectedFile);
      setValidationResult(result);
      toast.success('PDF validation completed successfully');
    } catch (error) {
      console.error('Error validating PDF:', error);
      toast.error('Failed to validate PDF: ' + ((error as Error).message || 'Network error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };



  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceIcon = (compliant: boolean) => {
    return compliant ? 
      <CheckCircle className="w-5 h-5 text-green-500" /> : 
      <XCircle className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="mx-auto space-y-6">
      {/* Header */}
      <div className="bg-background shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
                 to={`/pdf-tools${location.search}`}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">PDF Validator</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Validate PDF standards compliance and check for errors
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-background rounded-lg shadow p-6">
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('validation')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'validation'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-muted-foreground hover:border-border'
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Validation Results
            </button>
            <button
              onClick={() => setActiveTab('standards')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'standards'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-muted-foreground hover:border-border'
              }`}
            >
              <Target className="w-4 h-4 inline mr-2" />
              Standards Reference
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload Section */}
            <div className="bg-background rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Upload PDF for Validation</h2>
            
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <div className="mt-4">
                <label className="cursor-pointer">
                  <span className="text-primary hover:text-foreground font-medium">
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
                <p className="text-sm text-muted-foreground mt-1">or drag and drop</p>
              </div>
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            {selectedFile && (
              <div className="mt-4">
                <button
                  onClick={handleValidatePdf}
                  disabled={isProcessing}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/80 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4 mr-2" />
                  )}
                  Validate PDF
                </button>
              </div>
            )}
          </div>

          {/* Validation Results */}
          {activeTab === 'validation' && validationResult && (
            <div className="bg-background rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Validation Results</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`text-2xl font-bold ${getScoreColor(validationResult.overallScore)}`}>
                      {validationResult.overallScore}%
                    </span>
                    <span className="text-sm text-muted-foreground">Overall Score</span>
                  </div>
                </div>

                {/* Standards Compliance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {Object.entries(validationResult.standards).map(([standard, data]) => (
                    <div key={standard} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-foreground capitalize">{standard}</h4>
                        <div className="flex items-center space-x-2">
                          {getComplianceIcon(data.compliant)}
                          <span className={`text-sm font-medium ${getScoreColor(data.score)}`}>
                            {data.score}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-border rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            data.score >= 90 ? 'bg-green-500' : 
                            data.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${data.score}%` }}
                        ></div>
                      </div>
                      {data.issues.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {data.issues.length} issue{data.issues.length !== 1 ? 's' : ''} found
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Issues and Warnings */}
                {(validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
                  <div className="space-y-4">
                    {validationResult.errors.length > 0 && (
                      <div>
                          <h4 className="font-medium text-destructive mb-2 flex items-center">
                          <XCircle className="w-4 h-4 mr-2" />
                          Errors ({validationResult.errors.length})
                        </h4>
                        <div className="space-y-2">
                          {validationResult.errors.map((error, index) => (
                            <div key={index} className="bg-destructive border border-destructive rounded-lg p-3">
                              <div className="flex items-start">
                                {getSeverityIcon(error.severity)}
                                <div className="ml-2">
                                  <p className="text-sm text-destructive-foreground">{error.message}</p>
                                  <p className="text-xs text-destructive mt-1">Location: {error.location}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {validationResult.warnings.length > 0 && (
                      <div>
                        <h4 className="font-medium text-warning mb-2 flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Warnings ({validationResult.warnings.length})
                        </h4>
                        <div className="space-y-2">
                          {validationResult.warnings.map((warning, index) => (
                            <div key={index} className="bg-warning border border-warning rounded-lg p-3">
                              <div className="flex items-start">
                                {getSeverityIcon(warning.severity)}
                                <div className="ml-2">
                                  <p className="text-sm text-warning-foreground">{warning.message}</p>
                                  <p className="text-xs text-warning mt-1">Location: {warning.location}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Recommendations */}
                {validationResult.recommendations.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-primary mb-2 flex items-center">
                      <Zap className="w-4 h-4 mr-2" />
                      Recommendations
                    </h4>
                    <div className="space-y-2">
                      {validationResult.recommendations.map((rec, index) => (
                        <div key={index} className="bg-primary border border-primary rounded-lg p-3">
                          <div className="flex items-start">
                            <Info className="w-4 h-4 text-primary mt-0.5" />
                            <div className="ml-2">
                                <p className="text-sm text-primary-foreground">{rec.message}</p>
                              <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                                rec.priority === 'high' ? 'bg-destructive text-destructive-foreground' :
                                rec.priority === 'medium' ? 'bg-warning text-warning-foreground' :
                                'bg-success text-success-foreground'
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

          {/* Standards Reference */}
          {activeTab === 'standards' && standards && (
            <div className="bg-background rounded-lg shadow">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-6">PDF Standards Reference</h3>
                
                <div className="space-y-6">
                  {Object.entries(standards).map(([standard, data]) => (
                    <div key={standard} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-foreground">{data.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{data.description}</p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded-full">
                          {standard.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-foreground mb-2">Validation Checks:</h5>
                        <ul className="space-y-1">
                          {data.checks.map((check: string, index: number) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start">
                              <CheckSquare className="w-3 h-3 text-green-500 mt-1 mr-2 flex-shrink-0" />
                              {check}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Features */}
            <div className="bg-background border border-border rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Features</h2>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <Shield className="w-4 h-4 mr-2 text-primary" />
                Standards validation
              </div>
                <div className="flex items-center text-sm text-muted-foreground">
                <BarChart3 className="w-4 h-4 mr-2 text-primary" />
                Compliance reporting
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <AlertTriangle className="w-4 h-4 mr-2 text-primary" />
                Error detection
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Target className="w-4 h-4 mr-2 text-primary" />
                Standards reference
              </div>
            </div>
          </div>

          {/* Supported Standards */}
          <div className="bg-background border border-border rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Supported Standards</h2>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                <strong>PDF/A:</strong> Long-term preservation
              </div>
              <div className="text-sm text-muted-foreground">
                <strong>PDF/UA:</strong> Accessibility compliance
              </div>
              <div className="text-sm text-muted-foreground">
                <strong>PDF/X:</strong> Print production
              </div>
              <div className="text-sm text-muted-foreground">
                <strong>General:</strong> Basic structure validation
              </div>
            </div>
          </div>

          {/* Info */}
            <div className="bg-primary border border-primary rounded-lg p-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-primary-foreground mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-primary-foreground">
                <p className="font-medium mb-1">How it works:</p>
                <p>Upload a PDF to validate against industry standards. Get detailed compliance reports and recommendations for improvement.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfValidatorPage;