import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Download,
  Play,
  Settings,
  Info,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Crown,
  Merge
} from 'lucide-react';
import { downloadFile } from '../../../utils';

// Merge PDF Tool Configuration
const TOOL_CONFIG = {
  name: 'Merge PDF',
  description: 'Combine multiple PDF files into one document with page order control',
  icon: Merge,
  premium: false,
  badge: 'Popular',
  complexity: 'easy' as const,
  popularity: 92,
  avgProcessingTime: '5-10 seconds',
  inputFormats: ['pdf'],
  outputFormats: ['pdf'],
  features: [
    'Merge multiple PDFs',
    'Maintain page order',
    'Preserve quality',
    'Batch processing',
    'Drag and drop support',
    'Page reordering'
  ]
};

export const MergePDF: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [results, setResults] = useState<Array<{ name: string; status: 'success' | 'error'; message?: string }>>([]);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const Icon = TOOL_CONFIG.icon;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const moveFile = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= uploadedFiles.length) return;
    
    const newFiles = [...uploadedFiles];
    const [movedFile] = newFiles.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, movedFile);
    setUploadedFiles(newFiles);
  };

  const processFiles = async () => {
    if (uploadedFiles.length === 0) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setResults([]);

    // Simulate processing with progress
    for (let i = 0; i <= 100; i += 10) {
      setProcessingProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Simulate results
    const mockResults: {
      name: string;
      status: "success" | "error";
      message?: string;
    }[] = [{
      name: 'merged-document.pdf',
      status: "success"
    }];

    setResults(mockResults);
    setIsProcessing(false);
  };

  const downloadResult = (filename: string) => {
    // Simulate file download
    const content = `Processed file: ${filename}`;
    downloadFile(content, `processed_${filename}`, 'text/plain');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/pdf-tools"
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
                <h1 className="text-2xl font-bold text-gray-900">{TOOL_CONFIG.name}</h1>
                {TOOL_CONFIG.premium && (
                  <Crown className="w-5 h-5 text-yellow-500" />
                )}
                {TOOL_CONFIG.badge && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {TOOL_CONFIG.badge}
                  </span>
                )}
              </div>
              <p className="text-gray-600">{TOOL_CONFIG.description}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Info className="w-5 h-5" />
          </button>
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
                Supports: {TOOL_CONFIG.inputFormats?.join(', ') || 'PDF files'}
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
                accept={TOOL_CONFIG.inputFormats?.map(format => `.${format}`).join(',') || '.pdf'}
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Uploaded Files with Reordering */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">
                  PDF Files ({uploadedFiles.length}) - Drag to reorder
                </h4>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                          <FileText className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {index > 0 && (
                          <button
                            onClick={() => moveFile(index, index - 1)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Move up"
                          >
                            ↑
                          </button>
                        )}
                        {index < uploadedFiles.length - 1 && (
                          <button
                            onClick={() => moveFile(index, index + 1)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Move down"
                          >
                            ↓
                          </button>
                        )}
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 font-medium text-sm"
                        >
                          Remove
                        </button>
                      </div>
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
                <h3 className="text-lg font-semibold text-gray-900">Merge PDFs</h3>
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
                  <span>{isProcessing ? 'Merging...' : 'Merge PDFs'}</span>
                </button>
              </div>

              {isProcessing && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Merging PDFs...</span>
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
                  <h4 className="font-medium text-gray-900">Results</h4>
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
                        </div>
                      </div>
                      {result.status === 'success' && (
                        <button
                          onClick={() => downloadResult(result.name)}
                          className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
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
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tool Information</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Complexity</label>
                <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${TOOL_CONFIG.complexity === 'easy' ? 'bg-green-100 text-green-800' :
                    TOOL_CONFIG.complexity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                  }`}>
                  {TOOL_CONFIG.complexity}
                </span>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Popularity</label>
                <div className="mt-1 flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${TOOL_CONFIG.popularity}%` }}
                    />
                  </div>
                  <span className="ml-2 text-sm text-gray-600">{TOOL_CONFIG.popularity}%</span>
                </div>
              </div>

              {TOOL_CONFIG.avgProcessingTime && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Avg. Processing Time</label>
                  <p className="text-sm text-gray-600">{TOOL_CONFIG.avgProcessingTime}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Input Formats</label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {TOOL_CONFIG.inputFormats?.map(format => (
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
                  {TOOL_CONFIG.outputFormats?.map(format => (
                    <span key={format} className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded">
                      .{format}
                    </span>
                  )) || (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded">
                        .pdf
                      </span>
                    )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Features</label>
                <div className="mt-1 space-y-1">
                  {TOOL_CONFIG.features.map(feature => (
                    <div key={feature} className="text-sm text-gray-600">
                      • {feature.replace(/_/g, ' ')}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Merge Settings</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Output Quality</label>
                  <select className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option>High Quality</option>
                    <option>Standard Quality</option>
                    <option>Optimized Size</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Merge Options</label>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      <span className="text-sm text-gray-600">Preserve bookmarks</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      <span className="text-sm text-gray-600">Maintain metadata</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm text-gray-600">Add page numbers</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
