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
  FileText as FileTextIcon
} from 'lucide-react';
import { pdfService } from '../../services/pdfService';
import { FileUploadStatus } from '../../components/common/FileUploadStatus';

export const PdfToExcel: React.FC = () => {
   const location = useLocation();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadTimes, setUploadTimes] = useState<Date[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [results, setResults] = useState<Array<{ 
    name: string; 
    status: 'success' | 'error'; 
    message?: string;
    downloadUrl?: string;
    outputFile?: string;
    fileSize?: number;
  }>>([]);
    
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hardcoded tool information for PDF to Word
  const toolInfo = {
    name: 'PDF to Excel',
    description: 'Convert PDF Files to editable Excel documents with high accuracy',
    icon: FileTextIcon,
    premium: false,
    // badge: 'Popular',
    complexity: 'easy' as const,
    popularity: 95,
    avgProcessingTime: '2-5 seconds',
    inputFormats: ['.pdf'],
    outputFormats: ['.xlsx'],
    features: [
      'table detection',
      'data extraction',
      'formula preservation',
    ]
  };

  const Icon = toolInfo.icon;

 const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(event.target.files || []);
  // Allow only PDF files
  const pdfFiles = files.filter(
    (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
  if (pdfFiles.length > 0) {
    // Reset previous results/progress when starting a new selection
    setResults([]);
    setProcessingProgress(0);
    setIsProcessing(false);
    const now = new Date();
    setUploadedFiles((prev) => [...prev, ...pdfFiles]);
    setUploadTimes((prev) => [...prev, ...pdfFiles.map(() => now)]);
  }
};

const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
  event.preventDefault();
  const files = Array.from(event.dataTransfer.files);
  // Allow only PDF files
  const pdfFiles = files.filter(
    (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
  if (pdfFiles.length > 0) {
    // Reset previous results/progress when starting a new selection
    setResults([]);
    setProcessingProgress(0);
    setIsProcessing(false);
    const now = new Date();
    setUploadedFiles((prev) => [...prev, ...pdfFiles]);
    setUploadTimes((prev) => [...prev, ...pdfFiles.map(() => now)]);
  }
};


  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const removeFile = (index: number) => {
    const newUploaded = uploadedFiles.filter((_, i) => i !== index);
    const newUploadTimes = uploadTimes.filter((_, i) => i !== index);
    setUploadedFiles(newUploaded);
    setUploadTimes(newUploadTimes);
    if (newUploaded.length === 0) {
      setResults([]);
      setProcessingProgress(0);
      setIsProcessing(false);
    }
  };

  const handleAddMoreFiles = () => {
    fileInputRef.current?.click();
  };

  const processFiles = async () => {
    if (uploadedFiles.length === 0) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setResults([]);

    // Progress simulation interval
    let progressInterval: NodeJS.Timeout | undefined;
    
    try {
      // Check if backend service is available
      try {
        await pdfService.checkHealth();
      } catch (error) {
        throw new Error('Backend service is not available. Please check if the PDF service is running.');
      }

      // Start progress simulation
      let currentProgress = 0;
      progressInterval = setInterval(() => {
        if (currentProgress < 90) {
          currentProgress += Math.random() * 8;
          setProcessingProgress(Math.floor(Math.min(currentProgress, 90)));
        }
      }, 300);

      // Process each file individually
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        
        try {
          console.log(`Converting ${file.name} to Excel...`);
          
          // Call the conversion API using the service
          const result = await pdfService.convertPdfToExcel(file);
          
          console.log('Conversion result:', result);
          
          // Add successful result
          setResults(prev => [...prev, {
            name: file.name,
            status: 'success',
            message: result.message,
            downloadUrl: result.downloadUrl,
            outputFile: result.outputFile,
            fileSize: result.fileSize
          }]);
          
        } catch (error) {
          console.error(`Error converting ${file.name}:`, error);
          
          // Add error result
          setResults(prev => [...prev, {
            name: file.name,
            status: 'error',
            message: error instanceof Error ? error.message : 'Conversion failed'
          }]);
        }
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      
    } catch (error) {
      console.error('Processing error:', error);
      // Add general error result
      setResults(prev => [...prev, {
        name: 'Service Error',
        status: 'error',
        message: error instanceof Error ? error.message : 'Service unavailable'
      }]);
    } finally {
      // Clear interval if it exists
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setIsProcessing(false);
      // Only set to 100% if not already set
      if (processingProgress < 100) {
        setProcessingProgress(100);
      }
    }
  };

  const downloadResult = async (result: any) => {
    if (result.status === 'success' && result.downloadUrl && result.outputFile) {
      try {
        await pdfService.downloadFile(result.downloadUrl, result.outputFile);
      } catch (error) {
        console.error('Download error:', error);
        alert('Failed to download converted file. Please try again.');
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 p-2 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
              to={`/pdf-tools${location.search}`}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

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
                {/* {toolInfo.badge && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {toolInfo.badge}
                  </span>
                )} */}
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
          <div className="bg-muted rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Upload Files</h3>

            {/* Show upload area only when no files are uploaded */}
            {uploadedFiles.length === 0 && (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors"
              >
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">
                  Drop PDF files here or click to upload
                </p>
                <p className="text-muted-foreground mb-4">
                  Supports: {toolInfo.inputFormats?.join(', ') || 'PDF files'}
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Choose Files
                </button>
              </div>
            )}

            {/* Show file upload status when files are uploaded */}
            {uploadedFiles.length > 0 && (
              <FileUploadStatus
                files={uploadedFiles}
                uploadTimes={uploadTimes}
                onRemoveFile={removeFile}
                onAddMoreFiles={handleAddMoreFiles}
                acceptedFormats={['pdf']}
                maxFiles={10}
              />
            )}

            {/* Single file input for all uploads */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Processing */}
          {uploadedFiles.length > 0 && (
            <div className="bg-muted rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Convert PDF to Excel</h3>
                <button
                  onClick={processFiles}
                  disabled={isProcessing}
                  className="flex items-center space-x-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                    <span className="text-sm font-medium text-foreground">Converting PDF File...</span>
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
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Conversion Results</h4>
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 border border-border rounded-lg ${result.status === 'success' ? 'bg-success/10 border border-success' : 'bg-destructive/10 border border-destructive'
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        {result.status === 'success' ? (
                              <CheckCircle className="w-5 h-5 text-success" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-destructive" />
                        )}
                        <div>
                          <p className="font-medium text-foreground">{result.name}</p>
                          {result.message && (
                            <p className="text-sm text-muted-foreground">{result.message}</p>
                          )}
                          {result.status === 'success' && result.fileSize && (
                            <p className="text-sm text-muted-foreground">Size: {formatFileSize(result.fileSize)}</p>
                          )}
                        </div>
                      </div>
                      {result.status === 'success' && (
                        <button
                          onClick={() => downloadResult(result)}
                          className="flex items-center space-x-1 px-3 py-1 text-sm text-success text-success-foreground hover:text-success/90 font-medium"
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
          <div className="bg-muted rounded-xl border border-border p-6">
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

              {toolInfo.avgProcessingTime && (
                <div>
                  <label className="text-sm font-medium text-foreground">Avg. Processing Time</label>
                  <p className="text-sm text-muted-foreground">{toolInfo.avgProcessingTime}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-foreground">Input Formats</label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {toolInfo.inputFormats?.map(format => (
                    <span key={format} className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                      .{format}
                    </span>
                  )) || (
                      <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                        .pdf
                      </span>
                    )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Output Formats</label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {toolInfo.outputFormats?.map(format => (
                    <span key={format} className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                      .{format}
                    </span>
                  )) || (
                      <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                        .xlsx
                      </span>
                    )}
                </div>
              </div>

              <div>
                  <label className="text-sm font-medium text-foreground">Features</label>
                <div className="mt-1 space-y-1">
                  {toolInfo.features.map(feature => (
                    <div key={feature} className="text-sm text-muted-foreground">
                      • {feature.replace(/_/g, ' ')}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Settings Panel */}
           
        </div>
      </div>
    </div>
  );
};