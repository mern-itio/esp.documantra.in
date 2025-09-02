import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Upload,
  Download,
  Play,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Crown
} from 'lucide-react';
import * as Icons from 'lucide-react';
import type { PDFTool } from '../../types';
import { downloadFile } from '../../utils';

interface PDFViewerProps {
  selectedTool: PDFTool | null;
  onBack: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ selectedTool, onBack }) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [results, setResults] = useState<Array<{ name: string; status: 'success' | 'error'; message?: string }>>([]);
    
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!selectedTool) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Select a tool to get started</p>
        </div>
      </div>
    );
  }

  const Icon = (Icons as any)[selectedTool.icon || 'FileText'] || Icons.FileText;

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
      status: "success" | "error"; // ✅ matches state
      message?: string;
    }[] = uploadedFiles.map(file => ({
      name: file.name,
      status: Math.random() > 0.1 ? "success" : "error",
      message: Math.random() > 0.1 ? undefined : "Processing failed - file may be corrupted",
    }));


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
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Icon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900">{selectedTool.name}</h1>
                {selectedTool.premium && (
                  <Crown className="w-5 h-5 text-yellow-500" />
                )}
                {selectedTool.badge && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {selectedTool.badge}
                  </span>
                )}
              </div>
              <p className="text-gray-600">{selectedTool.description}</p>
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
                Drop files here or click to upload
              </p>
              <p className="text-gray-600 mb-4">
                Supports: {selectedTool.inputFormats?.join(', ') || 'PDF files'}
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
                accept={selectedTool.inputFormats?.map(format => `.${format}`).join(',') || '.pdf'}
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
                <h3 className="text-lg font-semibold text-gray-900">Process Files</h3>
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
                  <span>{isProcessing ? 'Processing...' : 'Start Processing'}</span>
                </button>
              </div>

              {isProcessing && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Processing...</span>
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
                <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${selectedTool.complexity === 'easy' ? 'bg-green-100 text-green-800' :
                    selectedTool.complexity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                  }`}>
                  {selectedTool.complexity}
                </span>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Popularity</label>
                <div className="mt-1 flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${selectedTool.popularity}%` }}
                    />
                  </div>
                  <span className="ml-2 text-sm text-gray-600">{selectedTool.popularity}%</span>
                </div>
              </div>

              {selectedTool.avgProcessingTime && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Avg. Processing Time</label>
                  <p className="text-sm text-gray-600">{selectedTool.avgProcessingTime}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Input Formats</label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedTool.inputFormats?.map(format => (
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
                  {selectedTool.outputFormats?.map(format => (
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
                  {(selectedTool.features || []).map(feature => (
                    <div key={feature} className="text-sm text-gray-600">
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