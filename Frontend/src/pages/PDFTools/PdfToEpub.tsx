import React, { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Download,
  Play,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Crown,
  FileText as FileTextIcon
} from 'lucide-react';
import { pdfService } from '../../services/pdfService';

export const PdfToEpub: React.FC = () => {
   const location = useLocation();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [results, setResults] = useState<Array<{ 
    name: string; 
    status: 'success' | 'error'; 
    message?: string;
    downloadUrl?: string;
    outputFile?: string;
    fileSize?: number;
    images?: string[]; // Added for image results
    outputDir?: string; // Added for image results
    fileCount?: number; // Added for image results
    method?: string; // Added for image results
    pdf?: string; // Added for PDF results
    epub?: string; // Added for EPUB results
  }>>([]);
    
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hardcoded tool information for Image to PDF
  const toolInfo = {
    name: 'PDF To EPUB',
    description: 'Convert PDF files to Epub file with high accuracy',
    icon: FileTextIcon,
    premium: false,
    // badge: 'Popular',
    complexity: 'easy' as const,
    popularity: 95,
    avgProcessingTime: '2-5 seconds',
    inputFormats: ['pdf'],
    outputFormats: ['epub'],
    features: [
      'chapter detection',
      'toc generation',
      'reflowable text',
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
    setUploadedFiles((prev) => [...prev, ...pdfFiles]);
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
    setUploadedFiles((prev) => [...prev, ...pdfFiles]);
  }
};


  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFiles = async () => {
    if (uploadedFiles.length === 0) return;

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

      // Process each file individually
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        
        // Update progress
        setProcessingProgress(Math.round(((i + 1) / uploadedFiles.length) * 100));
        
        try {
          console.log(`Converting ${file.name} to EPUB...`);
          
          // Call the conversion API using the service
          const result = await pdfService.convertPdfToEpub(file);
          
          console.log('Conversion result:', result);
          
          // Add successful result
          setResults(prev => [...prev, {
            name: file.name,
            status: 'success',
            message: result.message,
            images: result.images || [],
            outputDir: result.outputDir,
            fileCount: result.fileCount,
            method: result.method || 'unknown',
            pdf: result.pdf, // Store the PDF path for download
            epub: result.epub // Store the EPUB path for download
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
      setIsProcessing(false);
      setProcessingProgress(100);
    }
  };

  const downloadResult = async (result: any) => {
    try {
      if (result.status === 'success') {
        // Handle EPUB download
        if (result.epub) {
          const epubPath = result.epub;
          const filename = `converted_document.epub`;
          
          // Use the download service to get the EPUB
          const baseUrl = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';
          const fullUrl = `${baseUrl}${epubPath}`;
          
          console.log(`Downloading EPUB from: ${fullUrl}`);
          
          const response = await fetch(fullUrl);
          
          if (!response.ok) {
            throw new Error(`Download failed: ${response.status} ${response.statusText}`);
          }

          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          console.log('Successfully downloaded EPUB');
        }
        
        // Handle PDF download (fallback)
        else if (result.pdf) {
          const pdfPath = result.pdf;
          const filename = `converted_document.pdf`;
          
          // Use the download service to get the PDF
          const baseUrl = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';
          const fullUrl = `${baseUrl}${pdfPath}`;
          
          console.log(`Downloading PDF from: ${fullUrl}`);
          
          const response = await fetch(fullUrl);
          
          if (!response.ok) {
            throw new Error(`Download failed: ${response.status} ${response.statusText}`);
          }

          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          console.log('Successfully downloaded PDF');
        }
        
        // Handle Image downloads (fallback)
        else if (result.images && result.images.length > 0) {
          // Download each image
          for (let i = 0; i < result.images.length; i++) {
            const imagePath = result.images[i];
            const filename = `converted_image_${i + 1}.png`;
            
            // Use the download service to get the image
            const baseUrl = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';
            const fullUrl = `${baseUrl}${imagePath}`;
            
            console.log(`Downloading image from: ${fullUrl}`);
            
            const response = await fetch(fullUrl);
            
            if (!response.ok) {
              throw new Error(`Download failed: ${response.status} ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }
          
          console.log(`Successfully downloaded ${result.images.length} images`);
        }
        
        else {
          console.warn('No downloadable files found in result');
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download converted files. Please try again.');
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
    <div className="space-y-6 p-2 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
               to={`/pdf-tools${location.search}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Icon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900">{toolInfo.name}</h1>
                {toolInfo.premium && (
                  <Crown className="w-5 h-5 text-yellow-500" />
                )}
                {/* {toolInfo.badge && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {toolInfo.badge}
                  </span>
                )} */}
              </div>
              <p className="text-gray-600">{toolInfo.description}</p>
            </div>
          </div>
        </div>

        
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Processing Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Files</h3>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop PDF files here or click to upload
              </p>
              <p className="text-gray-600 mb-4">
                Supports: {toolInfo.inputFormats?.join(', ') || 'PDF files'}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Choose Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">
                  Uploaded Files ({uploadedFiles.length})
                </h4>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 font-medium text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Processing */}
          {uploadedFiles.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Convert PDF to EPUB</h3>
                <button
                  onClick={processFiles}
                  disabled={isProcessing}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                    <span className="text-sm font-medium text-gray-700">Converting PDF to EPUB...</span>
                    <span className="text-sm text-gray-600">{processingProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Results */}
              {results.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Conversion Results</h4>
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${result.status === 'success' ? 'bg-green-50' : 'bg-red-50'
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        {result.status === 'success' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{result.name}</p>
                          {result.message && (
                            <p className="text-sm text-gray-600">{result.message}</p>
                          )}
                          {result.status === 'success' && result.fileCount && (
                            <p className="text-sm text-gray-500">Images: {result.fileCount}</p>
                          )}
                          
                        </div>
                      </div>
                      {result.status === 'success' && (
                        <button
                          onClick={() => downloadResult(result)}
                          className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download {result.epub ? 'EPUB' : result.pdf ? 'PDF' : 'File'}</span>
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
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tool Information</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Complexity</label>
                <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${toolInfo.complexity === 'easy' ? 'bg-green-100 text-green-800' :
                    toolInfo.complexity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                  }`}>
                  {toolInfo.complexity}
                </span>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Popularity</label>
                <div className="mt-1 flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${toolInfo.popularity}%` }}
                    />
                  </div>
                  <span className="ml-2 text-sm text-gray-600">{toolInfo.popularity}%</span>
                </div>
              </div>

              {toolInfo.avgProcessingTime && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Avg. Processing Time</label>
                  <p className="text-sm text-gray-600">{toolInfo.avgProcessingTime}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Input Formats</label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {toolInfo.inputFormats?.map(format => (
                    <span key={format} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      .{format}
                    </span>
                  )) || (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        .pdf
                      </span>
                    )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Output Formats</label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {toolInfo.outputFormats?.map(format => (
                    <span key={format} className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded">
                      .{format}
                    </span>
                  )) || (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded">
                        .epub
                      </span>
                    )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Features</label>
                <div className="mt-1 space-y-1">
                  {toolInfo.features.map(feature => (
                    <div key={feature} className="text-sm text-gray-600">
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