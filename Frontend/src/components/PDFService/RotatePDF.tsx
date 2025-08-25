import React, { useState, useRef, useCallback } from 'react';
import { FiUpload, FiFile, FiTrash2, FiDownload, FiRotateCw, FiPlus, FiX } from 'react-icons/fi';
import { rotatePDFService } from '../../services/rotatePDFService';
import type { RotatePDFResponse, RotatePageItem, RotationData } from '../../types/rotatePDF';
import type { PDFInfo } from '../../types/common';

interface RotatePDFProps {
  onRotateResult: (result: RotatePDFResponse) => void;
}

const RotatePDF: React.FC<RotatePDFProps> = ({ onRotateResult }) => {
  const [document, setDocument] = useState<File | null>(null);
  const [pdfInfo, setPdfInfo] = useState<PDFInfo | null>(null);
  const [rotating, setRotating] = useState(false);
  const [pageItems, setPageItems] = useState<RotatePageItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [showPagePreview, setShowPagePreview] = useState(true);
  const [rotationMode, setRotationMode] = useState<'individual' | 'batch'>('individual');
  const [batchRotation, setBatchRotation] = useState<90 | 180 | 270>(90);
  const [batchPages, setBatchPages] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a valid PDF file');
      return;
    }

    setDocument(file);

    // Get PDF info and initialize page items
    try {
      const info = await rotatePDFService.getPDFInfo(file);
      setPdfInfo(info);

      const initialPages: RotatePageItem[] = Array.from({ length: info.pages }, (_, i) => ({
        id: (i + 1).toString(),
        pageNumber: i + 1,
        currentRotation: 0,
        selectedRotation: 0,
      }));
      setPageItems(initialPages);
    } catch (error) {
      console.error('Error getting PDF info:', error);
      onRotateResult({
        success: false,
        error: 'Failed to get PDF information',
        message: (error as Error).message,
      });
      removeDocument();
    }
  }, [onRotateResult]);

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }, [handleFileSelect]);

  const removeDocument = useCallback(() => {
    setDocument(null);
    setPdfInfo(null);
    setPageItems([]);
    onRotateResult({
      success: false,
      message: 'Document removed'
    });
  }, [onRotateResult]);

  // Handle individual page rotation
  const handlePageRotation = useCallback((pageId: string, angle: 90 | 180 | 270) => {
    setPageItems(prev => prev.map(page => 
      page.id === pageId 
        ? { ...page, selectedRotation: (page.selectedRotation + angle) % 360 }
        : page
    ));
  }, []);

  // Handle batch rotation
  const handleBatchRotation = useCallback(() => {
    if (!batchPages.trim()) return;

    const pageNumbers = parsePageNumbers(batchPages);
    if (pageNumbers.length === 0) return;

    setPageItems(prev => prev.map(page => 
      pageNumbers.includes(page.pageNumber)
        ? { ...page, selectedRotation: (page.selectedRotation + batchRotation) % 360 }
        : page
    ));
  }, [batchPages, batchRotation]);

  // Parse page numbers from string input
  const parsePageNumbers = (input: string): number[] => {
    const numbers: number[] = [];
    const parts = input.split(',').map(p => p.trim());
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n.trim()));
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= (pdfInfo?.pages || 0)) {
              numbers.push(i);
            }
          }
        }
      } else {
        const num = parseInt(part);
        if (!isNaN(num) && num >= 1 && num <= (pdfInfo?.pages || 0)) {
          numbers.push(num);
        }
      }
    }
    
    return [...new Set(numbers)].sort((a, b) => a - b);
  };

  // Reset all rotations
  const resetRotations = useCallback(() => {
    setPageItems(prev => prev.map(page => ({
      ...page,
      selectedRotation: 0
    })));
    setBatchPages('');
  }, []);

  // Handle rotate
  const handleRotate = useCallback(async () => {
    if (!document || pageItems.length === 0) return;

    const rotations: RotationData[] = pageItems
      .filter(page => page.selectedRotation !== 0)
      .map(page => ({
        page: page.pageNumber,
        angle: page.selectedRotation as 90 | 180 | 270
      }));

    if (rotations.length === 0) {
      alert('Please select at least one page to rotate');
      return;
    }

    setRotating(true);
    try {
      const result = await rotatePDFService.rotatePDF({
        file: document,
        rotations: rotations
      });

      onRotateResult(result);
    } catch (error) {
      console.error('Error rotating PDF:', error);
      onRotateResult({
        success: false,
        error: 'Failed to rotate PDF',
        message: (error as Error).message,
      });
    } finally {
      setRotating(false);
    }
  }, [document, pageItems, onRotateResult]);

  // Generate mock page preview with rotation
  const generatePagePreview = (pageNumber: number, rotation: number) => {
    return (
      <div 
        className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center relative overflow-hidden"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {/* Mock PDF content */}
        <div className="text-center text-gray-600">
          <div className="text-lg font-semibold mb-1">Page {pageNumber}</div>
          <div className="text-xs">PDF Content Preview</div>
        </div>
        
        {/* Mock watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="text-6xl font-bold text-gray-300">D</div>
        </div>
        
        {/* Mock logo */}
        <div className="absolute top-2 right-2 text-xs font-semibold text-orange-500">
          Dittio
        </div>
        
        {/* Mock content lines */}
        <div className="absolute bottom-8 left-2 right-2 space-y-1">
          <div className="h-1 bg-gray-300 rounded"></div>
          <div className="h-1 bg-gray-300 rounded w-3/4"></div>
          <div className="h-1 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    );
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get rotation summary
  const getRotationSummary = () => {
    const rotatedPages = pageItems.filter(p => p.selectedRotation !== 0);
    const totalRotations = rotatedPages.reduce((sum, p) => sum + Math.abs(p.selectedRotation), 0);
    
    return {
      rotatedPages: rotatedPages.length,
      totalRotations,
      pages: rotatedPages.map(p => `Page ${p.pageNumber} (${p.selectedRotation}°)`).join(', ')
    };
  };

  const summary = getRotationSummary();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      {/* <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Rotate PDF Pages</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Rotate individual pages or apply batch rotations to your PDF documents
        </p>
      </div> */}

      {/* File Upload Area */}
      {!document && (
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <FiUpload className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            Drop your PDF here or click to browse
          </h3>
          <p className="text-gray-600 mb-6 text-lg">
            Select a PDF file to rotate its pages
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
             style={{cursor: 'pointer'}}
          >
            Choose PDF File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      )}

      {/* Document Info */}
      {document && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FiFile className="w-12 h-12 text-blue-500" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{document.name}</h3>
                <p className="text-gray-600">
                  {formatFileSize(document.size)} • {pdfInfo?.pages || 0} pages
                </p>
              </div>
            </div>
            <button
              onClick={removeDocument}
              className="text-gray-400 hover:text-gray-600 transition-colors"  style={{cursor: 'pointer'}}
            >
              <FiTrash2 className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      {/* Rotation Mode Selection */}
      {document && pdfInfo && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Rotation Mode</h2>
          <div className="flex space-x-4">
            <button
              onClick={() => setRotationMode('individual')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                rotationMode === 'individual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              style={{cursor: 'pointer'}}
            >
              Individual Page Rotation
            </button>
            <button
              onClick={() => setRotationMode('batch')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                rotationMode === 'batch'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
               style={{cursor: 'pointer'}}
            >
              Batch Rotation
            </button>
          </div>
        </div>
      )}

      {/* Batch Rotation Controls */}
      {document && pdfInfo && rotationMode === 'batch' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Batch Rotation Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rotation Angle
              </label>
              <select
                value={batchRotation}
                onChange={(e) => setBatchRotation(parseInt(e.target.value) as 90 | 180 | 270)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={90}>90° Clockwise</option>
                <option value={180}>180°</option>
                <option value={270}>90° Counter-clockwise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page Range
              </label>
              <input
                type="text"
                value={batchPages}
                onChange={(e) => setBatchPages(e.target.value)}
                placeholder="e.g., 1-5, 7, 9-12"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleBatchRotation}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"  style={{cursor: 'pointer'}}
              >
                Apply Batch
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Enter page numbers separated by commas. Use ranges like "1-5" for consecutive pages.
          </p>
        </div>
      )}

      {/* Page Preview & Rotation Section */}
      {document && pdfInfo && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Page Rotation</h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={resetRotations}
                className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"  style={{cursor: 'pointer'}}
              >
                Reset All
              </button>
              <button
                onClick={() => setShowPagePreview(!showPagePreview)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"  style={{cursor: 'pointer'}}
              >
                {showPagePreview ? <FiX className="w-4 h-4" /> : <FiPlus className="w-4 h-4" />}
                <span>{showPagePreview ? 'Hide' : 'Show'} Preview</span>
              </button>
            </div>
          </div>

          {showPagePreview && (
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pageItems.map((page) => (
                  <div key={page.id} className="relative">
                    {/* Page Preview Card */}
                    <div className="border-2 rounded-lg p-3 transition-all border-gray-200 bg-white relative">
                      {/* Rotation Button in Top Right Corner */}
                      <button
                        onClick={() => handlePageRotation(page.id, 90)}
                        className="absolute top-2 right-2 z-10 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg"
                        title="Click to rotate: 0° → 90° → 180° → 270° → 0°"  style={{cursor: 'pointer'}}
                      >
                        <FiRotateCw className="w-4 h-4" />
                      </button>
                      
                      {/* Page Preview */}
                      {generatePagePreview(page.pageNumber, page.selectedRotation)}
                      
                      {/* Page Number Label */}
                      <div className="text-center mt-2">
                        <span className="text-sm font-medium text-gray-700">
                          Page {page.pageNumber}
                        </span>
                      </div>
                      
                      {/* Current Rotation Display */}
                      {page.selectedRotation !== 0 && (
                        <div className="text-center mt-2">
                          <span className="text-xs font-medium text-blue-600">
                            Rotation: {page.selectedRotation}°
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Rotation Summary */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-800">
                      Pages to rotate: <span className="font-semibold">{summary.rotatedPages}</span>
                    </p>
                    <p className="text-sm text-blue-600">
                      Total rotations: {summary.totalRotations}°
                    </p>
                    {summary.pages && (
                      <p className="text-sm text-blue-600 mt-1">
                        {summary.pages}
                      </p>
                    )}
                  </div>
                  <div className="text-sm text-blue-600">
                    Click rotation button to cycle through angles: 0° → 90° → 180° → 270°
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rotate Button */}
      {document && pdfInfo && (
        <div className="text-center">
          <button
            onClick={handleRotate}
            disabled={rotating || summary.rotatedPages === 0}
            className="bg-blue-600 text-white py-4 px-8 rounded-lg font-medium text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center mx-auto"  style={{cursor: 'pointer'}}
          >
            {rotating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Rotating Pages...
              </>
            ) : (
              <>
                <FiDownload className="w-5 h-5 mr-2" />
                Rotate Pages ({summary.rotatedPages})
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default RotatePDF;
