import React, { useState, useRef, useCallback } from 'react';
import { 
  Download, 
  Scissors, 
  FileText, 
  Settings, 
  Plus, 
  Trash2, 
  X, 
  Loader2,
  BookOpen,
  HardDrive
} from 'lucide-react';
import { splitPDFService } from '../../services/splitPDFService';
import type { SplitPDFRequest, SplitPDFResponse } from '../../types/splitPDF';

interface PDFDocument {
  id: string;
  file: File;
  name: string;
  size: number;
  pages: number;
  preview?: string;
  isProcessing?: boolean;
  error?: string;
}

interface CustomRange {
  id: string;
  start: number;
  end: number;
  name: string;
}

interface SplitPDFProps {
  onSplitComplete?: (result: SplitPDFResponse) => void;
}

const SplitPDF: React.FC<SplitPDFProps> = ({ onSplitComplete }) => {
  const [document, setDocument] = useState<PDFDocument | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitProgress, setSplitProgress] = useState(0);
  const [splitMode, setSplitMode] = useState<'pages' | 'custom' | 'bookmarks' | 'size'>('pages');
  const [pagesPerSplit, setPagesPerSplit] = useState(1);
  const [maxSizeMB, setMaxSizeMB] = useState(10);
  const [customRanges, setCustomRanges] = useState<CustomRange[]>([]);
  const [splitResult, setSplitResult] = useState<SplitPDFResponse | null>(null);
  // const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Check if it's a PDF
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a PDF file');
      return;
    }

    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      alert('File size must be less than 100MB');
      return;
    }

    const newDocument: PDFDocument = {
      id: Date.now().toString(),
      file,
      name: file.name,
      size: file.size,
      pages: 0,
      isProcessing: true
    };

    setDocument(newDocument);

    // Get PDF info
    try {
      const pdfInfo = await splitPDFService.getPDFInfo(file);
      setDocument(prev => prev ? {
        ...prev,
        pages: pdfInfo.pages,
        isProcessing: false,
        error: pdfInfo.isValid ? undefined : 'Invalid PDF file'
      } : null);
    } catch (error) {
      setDocument(prev => prev ? {
        ...prev,
        isProcessing: false,
        error: 'Failed to process PDF'
      } : null);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [handleFileSelect]);

  const removeDocument = useCallback(() => {
    setDocument(null);
    setSplitResult(null);
  }, []);

  const addCustomRange = useCallback(() => {
    const newRange: CustomRange = {
      id: Date.now().toString(),
      start: 1,
      end: 1,
      name: `Range ${customRanges.length + 1}`
    };
    setCustomRanges(prev => [...prev, newRange]);
  }, [customRanges.length]);

  const updateCustomRange = useCallback((id: string, field: keyof CustomRange, value: string | number) => {
    setCustomRanges(prev => prev.map(range => 
      range.id === id ? { ...range, [field]: value } : range
    ));
  }, []);

  const removeCustomRange = useCallback((id: string) => {
    setCustomRanges(prev => prev.filter(range => range.id !== id));
  }, []);

  const handleSplit = async () => {
    if (!document || document.error || document.isProcessing) return;

    setIsSplitting(true);
    setSplitProgress(0);

    try {
      // Prepare the split request
      const request: SplitPDFRequest = {
        file: document.file,
        mode: splitMode
      };

      if (splitMode === 'pages') {
        request.pagesPerSplit = pagesPerSplit;
      } else if (splitMode === 'size') {
        request.maxSizeMB = maxSizeMB;
      } else if (splitMode === 'custom') {
        request.customRanges = customRanges;
      }

      // Start progress simulation
      const progressInterval = setInterval(() => {
        setSplitProgress(prev => Math.min(prev + 15, 90));
      }, 200);

      // Call the split service
      const result = await splitPDFService.splitPDF(request);

      clearInterval(progressInterval);
      setSplitProgress(100);

      if (result.success) {
        setSplitResult(result);
        onSplitComplete?.(result);
      } else {
        throw new Error(result.error || 'Failed to split PDF');
      }
    } catch (error: any) {
      console.error('Split error:', error);
      alert(`Error splitting PDF: ${error.message}`);
    } finally {
      setIsSplitting(false);
      setSplitProgress(0);
    }
  };

  const downloadFile = async (filename: string) => {
    try {
      await splitPDFService.downloadSplitPDF(filename);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  const downloadAll = async () => {
    if (!splitResult?.files) return;
    
    try {
      await splitPDFService.downloadAllSplitPDFs(splitResult.files);
    } catch (error) {
      console.error('Download all error:', error);
      alert('Failed to download some files');
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const canSplit = document && !document.error && !document.isProcessing && 
    (splitMode !== 'custom' || customRanges.length > 0);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      {/* <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Split PDF Documents</h1>
        <p className="text-gray-600">Divide your PDF into multiple files with precision</p>
      </div> */}

      {/* File Upload Area */}
      {!document && (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
            isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Scissors className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Drop a PDF file here or click to browse
          </h3>
          <p className="text-gray-500 mb-4">
            Select a PDF file to split into multiple documents
          </p>
          <button
            onClick={openFileDialog}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Choose File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>
      )}

      {/* Document Preview */}
      {document && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Selected Document</h3>
            <button
              onClick={removeDocument}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {/* Document Preview */}
            <div className="w-20 h-24 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center relative overflow-hidden">
              {document.isProcessing ? (
                <div className="flex flex-col items-center space-y-1">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  <span className="text-xs text-gray-500">Processing...</span>
                </div>
              ) : (
                <>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-2xl text-gray-200 font-bold">D</div>
                  </div>
                  <div className="absolute top-1 right-1 bg-orange-500 text-white text-xs px-1 py-0.5 rounded-full font-medium">
                    Oltio
                  </div>
                </>
              )}
            </div>

            {/* Document Info */}
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{document.name}</h4>
              <div className="text-sm text-gray-500 mt-1">
                {formatFileSize(document.size)} • {document.pages} page{document.pages !== 1 ? 's' : ''}
              </div>
              {document.error && (
                <div className="text-sm text-red-600 mt-1">{document.error}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Split Options */}
      {document && !document.error && !document.isProcessing && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Split Options</h3>
          
          {/* Split Mode Selection */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <button
              onClick={() => setSplitMode('pages')}
              className={`p-3 rounded-lg border-2 transition-all ${
                splitMode === 'pages'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileText className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">By Pages</span>
            </button>
            
            <button
              onClick={() => setSplitMode('custom')}
              className={`p-3 rounded-lg border-2 transition-all ${
                splitMode === 'custom'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Settings className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Custom Ranges</span>
            </button>
            
            <button
              onClick={() => setSplitMode('bookmarks')}
              className={`p-3 rounded-lg border-2 transition-all ${
                splitMode === 'bookmarks'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <BookOpen className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">By Bookmarks</span>
            </button>
            
            <button
              onClick={() => setSplitMode('size')}
              className={`p-3 rounded-lg border-2 transition-all ${
                splitMode === 'size'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <HardDrive className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">By Size</span>
            </button>
          </div>

          {/* Mode-specific Options */}
          {splitMode === 'pages' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pages per split file
                </label>
                <input
                  type="number"
                  min="1"
                  max={document.pages}
                  value={pagesPerSplit}
                  onChange={(e) => setPagesPerSplit(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Will create {Math.ceil(document.pages / pagesPerSplit)} files
                </p>
              </div>
            </div>
          )}

          {splitMode === 'custom' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Custom page ranges
                </label>
                <button
                  onClick={addCustomRange}
                  className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Range</span>
                </button>
              </div>
              
              {customRanges.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No custom ranges defined. Click "Add Range" to get started.
                </p>
              )}
              
              {customRanges.map((range) => (
                <div key={range.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <input
                      type="number"
                      min="1"
                      max={document.pages}
                      value={range.start}
                      onChange={(e) => updateCustomRange(range.id, 'start', parseInt(e.target.value) || 1)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Start"
                    />
                    <input
                      type="number"
                      min="1"
                      max={document.pages}
                      value={range.end}
                      onChange={(e) => updateCustomRange(range.id, 'end', parseInt(e.target.value) || 1)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="End"
                    />
                    <input
                      type="text"
                      value={range.name}
                      onChange={(e) => updateCustomRange(range.id, 'name', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Name (optional)"
                    />
                  </div>
                  <button
                    onClick={() => removeCustomRange(range.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {splitMode === 'size' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum size per file (MB)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="0.1"
                  value={maxSizeMB}
                  onChange={(e) => setMaxSizeMB(parseFloat(e.target.value) || 10)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Files will be split to stay under this size limit
                </p>
              </div>
            </div>
          )}

          {/* Split Button */}
          <div className="mt-6">
            <button
              onClick={handleSplit}
              disabled={!canSplit || isSplitting}
              className="w-full bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isSplitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Splitting PDF...</span>
                </>
              ) : (
                <>
                  <Scissors className="w-5 h-5" />
                  <span>Split PDF</span>
                </>
              )}
            </button>

            {/* Progress Bar */}
            {isSplitting && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${splitProgress}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600 mt-2 text-center">{splitProgress}% complete</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Split Results */}
      {splitResult && splitResult.success && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Split Results</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={downloadAll}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download All</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {splitResult.files?.map((file, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-10 bg-gray-200 rounded flex items-center justify-center">
                    <FileText className="w-4 h-4 text-gray-600" />
                  </div>
                  <button
                    onClick={() => downloadFile(file.filename)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
                <h4 className="font-medium text-gray-900 text-sm truncate">{file.filename}</h4>
                <p className="text-xs text-gray-500 mt-1">{formatFileSize(file.size)}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 text-center text-sm text-gray-600">
            Successfully created {splitResult.totalFiles} file{splitResult.totalFiles !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Instructions */}
      {!document && (
        <div className="text-center text-gray-500">
          <p>Upload a PDF file to get started</p>
          <div className="mt-4 text-xs text-gray-400">
            <p>• Maximum file size: 100MB</p>
            <p>• Only PDF files are supported</p>
            <p>• Choose from multiple split modes</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SplitPDF;
