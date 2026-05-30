import React, { useState, useRef } from 'react';
import { redactService } from '../../services/redactService';
import type {
  RedactRequest,
  RedactResponse,
  RedactOptions,
  RedactPreview,
  RedactionType,
  RedactionColor,
  RedactionMethod
} from '../../types/redact';
import { Button } from '../DocumentService/ui/button';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  CheckCircle,
  FileText,
  Settings,
  RotateCcw,
  Info,
  Eye,
  Shield,
  AlertTriangle,
  Download,
  FileSearch,
  XCircle,
  Palette,
  ShieldCheck,
  Target,
  Filter,
  AlertCircle,
} from 'lucide-react';

const RedactContent: React.FC = () => {
  const location = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<RedactResponse | null>(null);
  const [preview, setPreview] = useState<RedactPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'options' | 'preview' | 'results'>('options');
  const [options, setOptions] = useState<RedactOptions>({
    redactionTypes: ['ssn'],
    customPattern: '',
    redactionColor: 'black',
    redactionMethod: 'solid',
    preserveLayout: true,
    batchMode: false,
    complianceMode: false
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
      setResult(null);
      setPreview(null);
      setSuccess(null);
    } else if (file) {
      setError('Please select a valid PDF file');
    }
  };

  const handleOptionChange = (key: keyof RedactOptions, value: any) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePreview = async () => {
    if (!selectedFile || (!options.redactionType && (!options.redactionTypes || options.redactionTypes.length === 0))) {
      setError('Please select a PDF file and choose a redaction type');
      return;
    }

    const request: Omit<RedactRequest, 'redactionColor' | 'redactionMethod' | 'preserveLayout' | 'batchMode' | 'complianceMode'> = {
      file: selectedFile,
      redactionType: options.redactionType,
      redactionTypes: options.redactionTypes,
      customPattern: options.customPattern
    };

    const validation = redactService.validateRequest(request as RedactRequest);
    if (!validation.valid) {
      setError(validation.message || 'Validation failed');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await redactService.previewRedaction(request);
      setPreview(response);
      setSuccess(`Found ${response.totalMatches} items to redact`);
      setActiveTab('preview');
    } catch (err: any) {
      console.error('Preview error:', err);
      setError(`Failed to preview: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRedact = async () => {
    if (!selectedFile || (!options.redactionType && (!options.redactionTypes || options.redactionTypes.length === 0))) {
      setError('Please select a PDF file and choose a redaction type');
      return;
    }

    const request: RedactRequest = {
      file: selectedFile,
      ...options
    };

    const validation = redactService.validateRequest(request);
    if (!validation.valid) {
      setError(validation.message || 'Validation failed');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await redactService.redactContent(request);
      setResult(response);
      setSuccess('Content redaction completed successfully!');
      setActiveTab('results');
    } catch (err: any) {
      console.error('Redaction error:', err);
      setError(`Failed to perform redaction: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (result?.downloadUrl) {
      try {
        await redactService.downloadFile(result.downloadUrl, result.filename);
      } catch (err: any) {
        console.error('Download error:', err);
        setError(`Failed to download file: ${err.message}`);
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setResult(null);
    setPreview(null);
    setError(null);
    setSuccess(null);
    setActiveTab('options');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setResult(null);
    setPreview(null);
    setError(null);
    setSuccess(null);
    setActiveTab('options');
    setOptions({
      redactionTypes: ['ssn'],
      customPattern: '',
      redactionColor: 'black',
      redactionMethod: 'solid',
      preserveLayout: true,
      batchMode: false,
      complianceMode: false
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const redactionTypes: { value: RedactionType; label: string; description: string; icon: React.ReactNode }[] = [
    { value: 'ssn', label: 'Social Security Number', description: 'US SSN format (XXX-XX-XXXX)', icon: <Shield className="w-4 h-4" /> },
    { value: 'credit_card', label: 'Credit Card Number', description: '16-digit credit card numbers', icon: <FileText className="w-4 h-4" /> },
    { value: 'email', label: 'Email Address', description: 'Email addresses', icon: <FileText className="w-4 h-4" /> },
    { value: 'phone', label: 'Phone Number', description: 'US phone numbers', icon: <FileText className="w-4 h-4" /> },
    { value: 'address', label: 'Street Address', description: 'Street addresses', icon: <FileText className="w-4 h-4" /> },
    { value: 'name', label: 'Full Name', description: 'First and last names', icon: <FileText className="w-4 h-4" /> },
    { value: 'date', label: 'Date', description: 'Dates in MM/DD/YYYY format', icon: <FileText className="w-4 h-4" /> },
    { value: 'all_sensitive', label: 'All Sensitive Data', description: 'SSN, credit cards, emails, phones', icon: <ShieldCheck className="w-4 h-4" /> },
    { value: 'custom', label: 'Custom Pattern', description: 'Custom regular expression', icon: <Target className="w-4 h-4" /> }
  ];

  const redactionColors: { value: RedactionColor; label: string; color: string }[] = [
    { value: 'black', label: 'Black', color: 'bg-black' },
    { value: 'white', label: 'White', color: 'bg-[#F7F3EE] border' },
    { value: 'red', label: 'Red', color: 'bg-red-500' },
    { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
    { value: 'gray', label: 'Gray', color: 'bg-[#F5F2EE]0' }
  ];

  const redactionMethods: { value: RedactionMethod; label: string; description: string }[] = [
    { value: 'solid', label: 'Solid Fill', description: 'Completely cover with solid color' },
    { value: 'pattern', label: 'Pattern Fill', description: 'Cover with crosshatch pattern' }
  ];

  return (
    <div className="mx-auto p-2 space-y-6">
      {/* Header */}
      <div className="bg-background shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link
                to={`/pdf-tools${location.search}`}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Redact Content</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Permanently remove sensitive information from PDF documents
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-success" />
                <span>Privacy Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 bg-success/10 border border-success rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-success mr-2" />
            <p className="text-success">{success}</p>
          </div>
        </div>
      )}

      {error && (
          <div className="mb-6 bg-destructive/10 border border-destructive rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-destructive mr-2" />
            <p className="text-destructive">{error}</p>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 gap-6 ${selectedFile ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}>
        {/* Left Panel - File Upload and Configuration */}
        <div className={`space-y-6 ${selectedFile ? 'lg:col-span-1' : 'lg:col-span-2'}`}>
          {/* File Upload Section */}
          <div className="bg-card rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Upload PDF File
              </h2>
              {selectedFile && (
                <button
                  onClick={removeFile}
                  className="text-destructive hover:text-destructive/80 font-medium text-sm flex items-center space-x-1"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Remove File</span>
                </button>
              )}
            </div>

            {!selectedFile ? (
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center space-y-2 text-muted-foreground hover:text-primary mx-auto"
                >
                  <Upload className="w-12 h-12" />
                  <span className="text-lg font-medium">Click to upload PDF</span>
                  <span className="text-sm text-muted-foreground">Maximum file size: 2MB</span>
                </button>
              </div>
            ) : (
              <div className="bg-success/10 border border-success rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <h4 className="font-medium text-success">{selectedFile.name}</h4>
                      <p className="text-sm text-success">
                        Size: {redactService.formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removeFile}
                    className="text-destructive hover:text-destructive/80 p-1 rounded-lg hover:bg-destructive/10 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
            {!selectedFile && (
          <div className="bg-destructive/10 border border-destructive rounded-xl p-6">
            <h3 className="text-lg font-semibold text-destructive mb-2 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Privacy Notice
            </h3>
            <div className="space-y-2 text-sm text-destructive">
              <p><strong>Permanent:</strong> Redacted content cannot be recovered</p>
              <p><strong>Secure:</strong> Files are processed securely</p>
              <p><strong>Compliant:</strong> Meets privacy regulations</p>
              <p><strong>Audit:</strong> Optional compliance tracking</p>
            </div>
          </div>
            )}
          {/* Configuration Options */}
          {selectedFile && (
            <div className="bg-card rounded-xl shadow-lg p-6">



              {activeTab === 'options' && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <Shield className="w-12 h-12 mx-auto mb-2 text-destructive" />
                      <h3 className="text-lg font-semibold text-foreground">Redaction Configuration</h3>
                    <p className="text-sm text-muted-foreground">Configure what content to redact</p>
                  </div>

                  {/* Redaction Type Selection (multi-select) */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-foreground border-b pb-2 flex items-center">
                      <Target className="w-4 h-4 mr-2" />
                      Redaction Type
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {redactionTypes.map((type) => {
                        const selected = options.redactionTypes?.includes(type.value);
                        return (
                          <label
                            key={type.value}
                            className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${selected
                                ? 'border-primary bg-primary/10'
                                : 'border-gray-200 hover:border-gray-300'
                              }`}
                          >
                            <input
                              type="checkbox"
                              name="redactionTypes"
                              value={type.value}
                              checked={!!selected}
                              onChange={(e) => {
                                const value = e.target.value as RedactionType;
                                const current = options.redactionTypes || [];
                                const next = e.target.checked
                                  ? Array.from(new Set([...current, value]))
                                  : current.filter(v => v !== value);
                                handleOptionChange('redactionTypes', next);
                              }}
                              className="w-4 h-4 text-primary border-border focus:ring-primary mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                {type.icon}
                                <span className="text-sm font-medium text-foreground">{type.label}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{type.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Pattern Input */}
                  {(options.redactionType === 'custom' || options.redactionTypes?.includes('custom')) && (
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold text-foreground border-b pb-2 flex items-center">
                        <Filter className="w-4 h-4 mr-2" />
                        Custom Pattern
                      </h4>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Regular Expression Pattern *
                        </label>
                        <input
                          type="text"
                          value={options.customPattern}
                          onChange={(e) => handleOptionChange('customPattern', e.target.value)}
                          placeholder="Enter regex pattern (e.g., \b\d{3}-\d{2}-\d{4}\b)"
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Use regular expressions to define custom patterns. Test your pattern before applying.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Redaction Appearance */}
                  <div className="space-y-4">
                      <h4 className="text-md font-semibold text-foreground border-b pb-2 flex items-center">
                      <Palette className="w-4 h-4 mr-2" />
                      Redaction Appearance
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Redaction Color
                        </label>
                        <div className="flex space-x-2">
                          {redactionColors.map((color) => (
                            <button
                              key={color.value}
                              onClick={() => handleOptionChange('redactionColor', color.value)}
                              className={`w-8 h-8 rounded border-2 ${options.redactionColor === color.value
                                  ? 'border-primary ring-2 ring-primary/10'
                                  : 'border-border'
                                } ${color.color}`}
                              title={color.label}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Redaction Method
                        </label>
                        <div className="space-y-2">
                          {redactionMethods.map((method) => (
                            <label key={method.value} className="flex items-center space-x-3">
                              <input
                                type="radio"
                                name="redactionMethod"
                                value={method.value}
                                checked={options.redactionMethod === method.value}
                                onChange={(e) => handleOptionChange('redactionMethod', e.target.value as RedactionMethod)}
                                className="w-4 h-4 text-primary border-border focus:ring-primary"
                              />
                              <div>
                                <span className="text-sm text-foreground">{method.label}</span>
                                <p className="text-xs text-muted-foreground">{method.description}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Options */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-foreground border-b pb-2 flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Advanced Options
                    </h4>

                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={options.preserveLayout}
                          onChange={(e) => handleOptionChange('preserveLayout', e.target.checked)}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                        />
                        <div>
                          <span className="text-sm text-foreground">Preserve Layout</span>
                          <p className="text-xs text-muted-foreground">Maintain original document formatting</p>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={options.complianceMode}
                          onChange={(e) => handleOptionChange('complianceMode', e.target.checked)}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                        />
                        <div>
                          <span className="text-sm text-foreground">Compliance Mode</span>
                          <p className="text-xs text-muted-foreground">Generate audit trail for compliance</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center space-x-4 mt-6">
                    <Button
                      onClick={handlePreview}
                      disabled={isProcessing || !selectedFile || (!options.redactionType && (!options.redactionTypes || options.redactionTypes.length === 0))}
                      className="flex items-center space-x-2 bg-primary hover:bg-primary/90"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{isProcessing ? 'Processing...' : 'Preview'}</span>
                    </Button>

                    <Button
                      onClick={handleRedact}
                      disabled={isProcessing || !selectedFile || (!options.redactionType && (!options.redactionTypes || options.redactionTypes.length === 0))}
                      className="flex items-center space-x-2 bg-destructive hover:bg-destructive/90"
                    >
                      <Shield className="w-4 h-4" />
                      <span>{isProcessing ? 'Processing...' : 'Redact Content'}</span>
                    </Button>

                    <Button
                      onClick={resetForm}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Reset</span>
                    </Button>
                  </div>
                </div>
              )}


              {activeTab === 'preview' && preview && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <Eye className="w-12 h-12 mx-auto mb-2 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Redaction Preview</h3>
                    <p className="text-sm text-muted-foreground">Found {preview.totalMatches} items to redact</p>
                  </div>

                  {/* Preview Legend */}
                  <div className="bg-destructive/10 border border-destructive rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <span className={`w-4 h-4 rounded ${options.redactionColor === 'black' ? 'bg-black' : options.redactionColor === 'white' ? 'bg-[#F7F3EE] border' : `bg-${options.redactionColor}-500`}`}></span>
                        <span className="text-muted-foreground">= Content to be redacted</span>
                      </div>
                    </div>
                  </div>

                  {/* Matches */}
                  {preview.matches.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold text-foreground border-b pb-2 flex items-center">
                        <FileSearch className="w-4 h-4 mr-2" />
                        Items to Redact ({preview.matches.length})
                      </h4>

                      <div className="max-h-96 overflow-y-auto space-y-3">
                        {preview.matches.map((match, index) => (
                          <div key={index} className="border border-border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
                              <span className="text-xs text-muted-foreground">{match.pattern}</span>
                            </div>
                            <div className="text-sm text-foreground">
                              <span className="text-muted-foreground">
                                {match.context.substring(0, match.position)}
                              </span>
                              <span className={`${options.redactionColor === 'black' ? 'bg-black text-white' : options.redactionColor === 'white' ? 'bg-[#F7F3EE] text-black border' : `bg-${options.redactionColor}-500 text-white`} px-1 rounded`}>
                                {match.text}
                              </span>
                              <span className="text-muted-foreground">
                                {match.context.substring(match.position + match.text.length)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Matches */}
                  {preview.matches.length === 0 && (
                    <div className="text-center py-8">
                      <XCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Items Found</h3>
                      <p className="text-muted-foreground">No content matching the selected pattern was found in the document.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Results Tab */}
              {activeTab === 'results' && result && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 text-success" />
                    <h3 className="text-lg font-semibold text-foreground">Redaction Complete</h3>
                    <p className="text-sm text-muted-foreground">Content has been successfully redacted</p>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-destructive/10 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-destructive">{result.redactionDetails.totalRedactions}</div>
                      <div className="text-sm text-destructive">Items Redacted</div>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-primary">{result.redactionDetails.pagesProcessed}</div>
                      <div className="text-sm text-primary">Pages Processed</div>
                    </div>
                    <div className="bg-success/10 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-success">
                        {redactService.formatFileSize(result.fileSize)}
                      </div>
                      <div className="text-sm text-success">File Size</div>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-primary">
                        {result.complianceInfo ? 'Yes' : 'No'}
                      </div>
                      <div className="text-sm text-primary">Audit Trail</div>
                    </div>
                  </div>

                  {/* Download Button */}
                  <div className="text-center">
                    <Button
                      onClick={handleDownload}
                      className="flex items-center space-x-2 bg-success hover:bg-success/90 mx-auto"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Redacted PDF</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Information and Help - Only show when no file is selected */}
        {!selectedFile && (
          <div className="space-y-6">
            {/* Help Information */}
            <div className="bg-card rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2" />
                How It Works
              </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>1. Upload:</strong> Select your PDF file</p>
                <p><strong>2. Configure:</strong> Choose what to redact</p>
                <p><strong>3. Preview:</strong> See what will be redacted</p>
                <p><strong>4. Redact:</strong> Permanently remove content</p>
                <p><strong>5. Download:</strong> Get your redacted PDF</p>
              </div>
            </div>

            {/* Features */}
            <div className="bg-card rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Features
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Pattern-based redaction</p>
                <p>• Custom regex patterns</p>
                <p>• Multiple redaction types</p>
                <p>• Privacy compliance</p>
                <p>• Audit trail generation</p>
              </div>
            </div>

            {/* Privacy Notice */}

          </div>
        )}

        {/* Results Section - Show when file is selected and redaction is complete */}
        {selectedFile && result && (
          <div className="bg-card rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="w-6 h-6 text-success" />
              <h3 className="text-lg font-semibold text-success">Redaction Complete!</h3>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-foreground">File:</span>
                <span className="text-sm text-muted-foreground">{result.filename}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-foreground">Original Size:</span>
                    <span className="text-sm text-muted-foreground">{redactService.formatFileSize(result.originalFileSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-foreground">New Size:</span>
                <span className="text-sm text-muted-foreground">{redactService.formatFileSize(result.fileSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-foreground">Items Redacted:</span>
                <span className="text-sm text-muted-foreground">{result.redactionDetails.totalRedactions}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-destructive"></div>
            <span className="text-muted-foreground">Processing redaction...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RedactContent;
