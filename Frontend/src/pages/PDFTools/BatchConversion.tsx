import React, { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Download,
  Play,
  Loader2,
  CheckCircle,
  AlertCircle,
  Crown,
  FileText as FileTextIcon,
  Archive,
  X,
  Check
} from 'lucide-react';
import { pdfService } from '../../services/pdfService';

interface FileWithFormat {
  file: File | null;
  outputFormat: string;
  id: string;
}

interface ConversionResult {
  fileName: string;
  inputFormat: string;
  outputFormat: string;
  status: 'success' | 'error';
  downloadUrl?: string;
  message: string;
}

type ToolComplexity = 'easy' | 'medium' | 'hard';

interface BatchConversionProps {
  onBack?: () => void;
}

export const BatchConversion: React.FC<BatchConversionProps> = ({ onBack }) => {
   const location = useLocation();
  const [files, setFiles] = useState<FileWithFormat[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [results, setResults] = useState<ConversionResult[]>([]);
  const [zipUrl, setZipUrl] = useState<string | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize 5 file input refs
  React.useEffect(() => {
    fileInputRefs.current = Array(5).fill(null);
  }, []);

  // Initialize default output formats for all 5 slots
  React.useEffect(() => {
    if (files.length === 0) {
      const defaultFormats = Array(5).fill(null).map((_, index) => ({
        file: null,
        outputFormat: 'pdf',
        id: `file-${index}`
      }));
      setFiles(defaultFormats);
    }
  }, []);

  const supportedInputFormats = ['pdf', 'docx', 'xls', 'xlsx'];
  
  // Define supported output formats for each input type
  const getSupportedOutputFormats = (inputType: string) => {
    switch (inputType.toLowerCase()) {
      case 'pdf':
        return ['docx', 'xlsx', 'pptx', 'txt', 'html'];
      case 'docx':
      case 'doc':
        return ['pdf', 'xlsx'];
      case 'xlsx':
      case 'xls':
        return ['pdf', 'docx'];
      case 'pptx':
      case 'ppt':
        return ['pdf'];
      case 'txt':
        return ['pdf'];
      case 'html':
        return ['pdf'];
      default:
        return ['pdf'];
    }
  };

  const toolInfo = {
    name: 'Batch Conversion',
    description: 'Convert multiple files to different formats simultaneously',
    icon: FileTextIcon,
    premium: false,
    complexity: 'medium' satisfies ToolComplexity,
    popularity: 98,
    avgProcessingTime: '2-10 minutes',
    inputFormats: supportedInputFormats,
    outputFormats: ['pdf', 'docx', 'xlsx', 'pptx', 'txt', 'html'], // All possible output formats
    features: [
      '5 individual file inputs',
      'Multiple formats',
      'Bulk download',
      'Progress tracking'
    ]
  };

  const Icon = toolInfo.icon;

  const handleFileUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Get the first supported output format for this file type
    const inputType = getFileType(file.name);
    const supportedFormats = getSupportedOutputFormats(inputType);
    const defaultOutputFormat = supportedFormats[0] || 'pdf';

    // Update or add file at specific index
    setFiles(prev => {
      const newFiles = [...prev];
      const existingIndex = newFiles.findIndex(f => f.id === `file-${index}`);
      
      if (existingIndex >= 0) {
        // Update existing file and set appropriate output format
        newFiles[existingIndex] = {
          ...newFiles[existingIndex],
          file: file,
          outputFormat: defaultOutputFormat
        };
      } else {
        // Add new file with appropriate output format
        newFiles.push({
          file: file,
          outputFormat: defaultOutputFormat,
          id: `file-${index}`
        });
      }
      
      return newFiles;
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter(f => f.id !== `file-${index}`));
  };

  const updateOutputFormat = (index: number, format: string) => {
    setFiles(prev => {
      const newFiles = [...prev];
      const existingIndex = newFiles.findIndex(f => f.id === `file-${index}`);
      
      if (existingIndex >= 0) {
        // Update existing file's output format
        newFiles[existingIndex] = { ...newFiles[existingIndex], outputFormat: format };
      } else {
        // Create a placeholder entry for format selection even when no file is uploaded
        newFiles.push({
          file: null as any,
          outputFormat: format,
          id: `file-${index}`
        });
      }
      
      return newFiles;
    });
  };

  const getFileAtIndex = (index: number) => {
    return files.find(f => f.id === `file-${index}`);
  };

  const getDefaultOutputFormat = (index: number) => {
    const fileData = getFileAtIndex(index);
    if (fileData?.outputFormat) {
      return fileData.outputFormat;
    }
    
    // If no file is selected, default to PDF
    if (!fileData?.file) {
      return 'pdf';
    }
    
    // If file is selected, use the first supported output format for that input type
    const inputType = getFileType(fileData.file.name);
    const supportedFormats = getSupportedOutputFormats(inputType);
    return supportedFormats[0] || 'pdf';
  };

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'pdf': return '📄';
      case 'docx': return '📝';
      case 'xlsx': return '📊';
      case 'pptx': return '📈';
      case 'txt': return '📃';
      case 'html': return '🌐';
      default: return '📁';
    }
  };

  const processFiles = async () => {
    const validFiles = files.filter(f => f.file !== null) as Array<{ file: File; outputFormat: string; id: string }>;
    if (validFiles.length === 0) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setResults([]);

    try {
      // Check if backend service is available
      try {
        await pdfService.checkHealth();
      } catch (error) {
        throw new Error('Backend service is not available. Please check if the PDF service is running.');
      }

      // Extract files and output formats - only for files that actually exist
      const fileArray = validFiles.map(f => f.file);
      const outputFormats = validFiles.map(f => f.outputFormat);

      console.log('Starting batch conversion with:', {
        files: fileArray.map(f => f.name),
        formats: outputFormats,
        totalFiles: fileArray.length,
        allFiles: files,
        validFiles: validFiles
      });

      // Call batch conversion API
      const result = await pdfService.batchConvert(fileArray, outputFormats);
      
      console.log('Batch conversion result:', result);
      
      setResults(result.results || []);
      setZipUrl(result.zipUrl || null);
      
    } catch (error) {
      console.error('Batch conversion error:', error);
      setResults([{
        fileName: 'Batch Conversion',
        inputFormat: 'unknown',
        outputFormat: 'unknown',
        status: 'error',
        message: error instanceof Error ? error.message : 'Conversion failed'
      }]);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(100);
    }
  };

  const downloadFile = async (downloadUrl: string, fileName: string, outputFormat: string) => {
    try {
      const baseUrl = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';
      const fullUrl = `${baseUrl}${downloadUrl}`;
      
      console.log(`Downloading file from: ${fullUrl}`);
      
      const response = await fetch(fullUrl);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Create clean filename by removing original extension and adding new one
      const cleanFileName = fileName.replace(/\.[^/.]+$/, '') + '.' + outputFormat;
      a.download = cleanFileName;
      
      console.log(`Download filename: ${cleanFileName} (original: ${fileName}, format: ${outputFormat})`);
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('File downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const downloadAll = async () => {
    try {
      // Prefer backend-provided ZIP if available
      if (zipUrl) {
        const baseUrl = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';
        const fullUrl = `${baseUrl}${zipUrl}`;

        console.log(`Downloading ZIP from: ${fullUrl}`);
        const response = await fetch(fullUrl);
        if (!response.ok) {
          throw new Error(`ZIP download failed: ${response.status} ${response.statusText}`);
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'batch_conversion.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return;
      }

      // Fallback: download each file individually
      const successfulResults = results.filter(r => r.status === 'success' && r.downloadUrl);
      if (successfulResults.length === 0) {
        alert('No successful conversions to download');
        return;
      }
      for (const result of successfulResults) {
        if (result.downloadUrl) {
          await downloadFile(result.downloadUrl, result.fileName, result.outputFormat);
        }
      }
    } catch (error) {
      console.error('Download all error:', error);
      alert('Failed to download results.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext || 'unknown';
  };

  // Create 5 individual file input fields
  const renderFileInputs = () => {
    const inputs = [];
    for (let i = 0; i < 5; i++) {
      const fileData = getFileAtIndex(i);
      const hasFile = !!fileData?.file;
      
      inputs.push(
        <div key={i} className="mb-4 p-4 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                {hasFile ? (
                  <span className="text-lg">{getFormatIcon(getFileType(fileData!.file!.name))}</span>
                ) : (
                  <Upload className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                {hasFile ? (
                  <>
                    <p className="font-medium text-foreground">{fileData!.file!.name}</p>
                    <p className="text-sm text-muted-foreground">{formatFileSize(fileData!.file!.size)}</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">No file selected</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Output Format Selection */}
              <select
                value={getDefaultOutputFormat(i)}
                onChange={(e) => updateOutputFormat(i, e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {(() => {
                  const fileData = getFileAtIndex(i);
                  const inputType = fileData?.file ? getFileType(fileData.file.name) : 'pdf';
                  const supportedFormats = getSupportedOutputFormats(inputType);
                  
                  return supportedFormats.map(format => (
                    <option key={format} value={format}>
                      {format.toUpperCase()}
                    </option>
                  ));
                })()}
              </select>
              
              {/* File Input */}
              <input
                type="file"
                ref={(el) => { 
                  fileInputRefs.current[i] = el; 
                }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.html"
                onChange={(e) => handleFileUpload(i, e)}
                className="hidden"
              />
              
              {/* Upload/Change Button */}
              <button
                onClick={() => fileInputRefs.current[i]?.click()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
              >
                {hasFile ? 'Change' : 'Choose File'}
              </button>
              
              {/* Remove Button */}
              {hasFile && (
                <button
                  onClick={() => removeFile(i)}
                    className="p-2 text-destructive hover:text-destructive/90 hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }
    return inputs;
  };

  return (
    <div className="min-h-full w-full space-y-6 p-2 bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack ? (
            <button
              onClick={onBack}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <Link
                 to={`/pdf-tools${location.search}`}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-foreground">{toolInfo.name}</h1>
                {toolInfo.premium && (
                  <Crown className="w-5 h-5 text-warning" />
                )}
              </div>
              <p className="text-muted-foreground">{toolInfo.description}</p>
            </div>
          </div>
        </div>

        
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Processing Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload */}
          <div className="bg-muted rounded-xl border border-border p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4">Upload Files (Max 5)</h3>

            {/* Individual File Inputs */}
            {renderFileInputs()}

            <div className="mt-4 text-center text-muted-foreground text-sm">
              Supports: {toolInfo.inputFormats?.join(', ').toUpperCase()}
            </div>
          </div>

          {/* Processing */}
          {files.length > 0 && (
              <div className="bg-muted rounded-xl border border-border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Convert Files</h3>
                <button
                  onClick={processFiles}
                  disabled={isProcessing}
                  className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                  <span>{isProcessing ? 'Converting...' : 'Start Conversion'}</span>
                </button>
              </div>

              {isProcessing && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Processing files...</span>
                    <span className="text-sm text-muted-foreground">{processingProgress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Results */}
              {results.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">Conversion Results</h4>
                    {(zipUrl || results.some(r => r.status === 'success')) && (
                      <button
                        onClick={downloadAll}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        <Archive className="w-4 h-4" />
                        <span>{zipUrl ? 'Download ZIP' : 'Download All'}</span>
                      </button>
                    )}
                  </div>
                  
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        result.status === 'success' 
                          ? 'bg-success/10 border-success/40' 
                          : 'bg-destructive/10 border-destructive/40'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {result.status === 'success' ? (
                          <CheckCircle className="w-5 h-5 text-success" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-destructive" />
                        )}
                        <div>
                            <p className="font-medium text-foreground">{result.fileName}</p>
                          <p className="text-sm text-muted-foreground">
                            {result.inputFormat.toUpperCase()} → {result.outputFormat.toUpperCase()}
                          </p>
                          {result.message && (
                            <p className="text-sm text-muted-foreground">{result.message}</p>
                          )}
                        </div>
                      </div>
                      
                      {result.status === 'success' && result.downloadUrl && (
                        <button
                          onClick={() => downloadFile(result.downloadUrl!, result.fileName, result.outputFormat)}
                          className="flex items-center space-x-2 px-3 py-2 text-sm rounded-lg bg-success text-success-foreground hover:bg-success/90 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tool Info */}
          <div className="bg-muted rounded-xl border border-border p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4">Tool Information</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Complexity</label>
                <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${toolInfo.complexity === 'easy' ? 'bg-success text-success-foreground' :
                    toolInfo.complexity === 'medium' ? 'bg-warning text-warning-foreground' :
                      'bg-destructive text-destructive-foreground'
                  }`}>
                  {toolInfo.complexity}
                </span>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Popularity</label>
                <div className="mt-1 flex items-center">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${toolInfo.popularity}%` }}
                    />
                  </div>
                  <span className="ml-2 text-sm text-muted-foreground">{toolInfo.popularity}%</span>
                </div>
              </div>

              <div>
                    <label className="text-sm font-medium text-foreground">Avg. Processing Time</label>
                <p className="text-sm text-muted-foreground">{toolInfo.avgProcessingTime}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Input Formats</label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {toolInfo.inputFormats?.map(format => (
                    <span key={format} className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                      .{format}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Output Formats</label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {toolInfo.outputFormats?.map(format => (
                    <span key={format} className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                      .{format}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                  <label className="text-sm font-medium text-foreground">Features</label>
                <div className="mt-1 space-y-1">
                  {toolInfo.features.map(feature => (
                    <div key={feature} className="text-sm text-muted-foreground flex items-center">
                      <Check className="w-3 h-3 text-success mr-2" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
