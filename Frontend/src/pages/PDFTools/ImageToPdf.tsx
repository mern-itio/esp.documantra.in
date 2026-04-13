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
// import { FileUploadStatus } from '../../components/common/FileUploadStatus';

export const ImageToPDF: React.FC = () => {
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
  }>>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toolInfo = {
    name: 'Image To PDF',
    description: 'Convert Image files to PDF file with high accuracy',
    icon: FileTextIcon,
    premium: false,
    complexity: 'easy' as const,
    popularity: 95,
    avgProcessingTime: '2-5 seconds',
    inputFormats: ['jpg', 'jpeg', 'png'],
    outputFormats: ['pdf'],
    features: [
      'layout option',
      'compression settings',
      'page ordering',
    ]
  };

  const Icon = toolInfo.icon;

  const updatePreviews = (files: File[]) => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews((old) => {
      old.forEach((u) => URL.revokeObjectURL(u));
      return urls;
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imgFiles = files.filter(
      (file) => file.type.startsWith("image/") || file.name.toLowerCase().endsWith(".jpg") || file.name.toLowerCase().endsWith(".png")
    );
    if (imgFiles.length > 0) {
      // Reset previous results/progress when starting a new selection
      setResults([]);
      setProcessingProgress(0);
      setIsProcessing(false);
      const next = [...uploadedFiles, ...imgFiles];
      setUploadedFiles(next);
      updatePreviews(next);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const imgFiles = files.filter(
      (file) => file.type.startsWith("image/") || file.name.toLowerCase().endsWith(".jpg") || file.name.toLowerCase().endsWith(".png")
    );
    if (imgFiles.length > 0) {
      // Reset previous results/progress when starting a new selection
      setResults([]);
      setProcessingProgress(0);
      setIsProcessing(false);
      const next = [...uploadedFiles, ...imgFiles];
      setUploadedFiles(next);
      updatePreviews(next);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDragIndex(index);
    try {
      e.dataTransfer.setData('text/plain', String(index));
      e.dataTransfer.effectAllowed = 'move';
    } catch {}
  };
  const onItemDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onDragEnter = (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    const next = [...uploadedFiles];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    setUploadedFiles(next);
    updatePreviews(next);
    setDragIndex(index);
  };
  const onDragEnd = () => setDragIndex(null);

  const removeFile = (index: number) => {
    const next = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(next);
    updatePreviews(next);
    if (next.length === 0) {
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

    let progressInterval: NodeJS.Timeout | undefined;
    try {
      try {
        await pdfService.checkHealth();
      } catch (error) {
        throw new Error('Backend service is not available. Please check if the PDF service is running.');
      }

      let currentProgress = 0;
      progressInterval = setInterval(() => {
        if (currentProgress < 90) {
          currentProgress += Math.random() * 8;
          setProcessingProgress(Math.floor(Math.min(currentProgress, 90)));
        }
      }, 300);

      // Send images in the user-defined order to get one combined PDF
      const result = await pdfService.convertImgsToPdf(uploadedFiles);

      setResults(prev => [...prev, {
        name: `${uploadedFiles.length} images`,
        status: 'success',
        message: result.message,
        pdf: result.pdf,
      }]);

    } catch (error) {
      setResults(prev => [...prev, {
        name: 'Service Error',
        status: 'error',
        message: error instanceof Error ? error.message : 'Service unavailable'
      }]);
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      setIsProcessing(false);
      if (processingProgress < 100) setProcessingProgress(100);
    }
  };

  const downloadResult = async (result: any) => {
    try {
      if (result.status === 'success' && result.pdf) {
        const pdfPath = result.pdf;
        const filename = `converted_document.pdf`;
        const baseUrl = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';
        const fullUrl = `${baseUrl}${pdfPath}`;
        const response = await fetch(fullUrl);
        if (!response.ok) throw new Error(`Download failed: ${response.status} ${response.statusText}`);
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
    } catch (error) {
      alert('Failed to download converted files. Please try again.');
    }
  };

  return (
    <div className="space-y-6 p-2 bg-background">
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
              </div>
              <p className="text-muted-foreground">{toolInfo.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-muted rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Upload Files</h3>

            {uploadedFiles.length === 0 && (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors"
              >
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">
                  Drop Image files here or click to upload
                </p>
                <p className="text-muted-foreground mb-4">
                  Supports: {toolInfo.inputFormats?.join(', ') || 'Image files'}
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Choose Files
                </button>
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">Drag to reorder pages</div>
                  <button onClick={handleAddMoreFiles} className="px-3 py-1 bg-muted rounded">Add more</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {previews.map((src, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-lg p-2 bg-muted ${dragIndex === idx ? 'ring-2 ring-primary' : ''}`}
                      draggable
                      onDragStart={(e) => onDragStart(e, idx)}
                      onDragOver={onItemDragOver}
                      onDragEnter={() => onDragEnter(idx)}
                      onDragEnd={onDragEnd}
                      onDrop={(e) => { e.preventDefault(); onDragEnd(); }}
                    >
                      <img src={src} alt={`preview-${idx}`} className="w-full h-36 object-contain bg-muted" />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-muted-foreground">Page {idx + 1}</span>
                        <button onClick={() => removeFile(idx)} className="text-xs text-destructive">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {uploadedFiles.length > 0 && (
            <div className="bg-muted rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Convert Images to PDF</h3>
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
                    <span className="text-sm font-medium text-foreground">Converting Images to PDF...</span>
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
                        </div>
                      </div>
                      {result.status === 'success' && (
                        <button
                          onClick={() => downloadResult(result)}
                          className="flex items-center space-x-1 px-3 py-1 text-sm text-success text-success-foreground hover:text-success/90 font-medium"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download PDF</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
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
                        .jpg, .jpeg, .png
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
                        .pdf
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
        </div>
      </div>
    </div>
  );
};