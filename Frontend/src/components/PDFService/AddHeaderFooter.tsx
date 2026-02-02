import React, { useState, useRef } from 'react';
import { addHeaderFooterService } from '../../services/addHeaderFooterService';
import type { AddHeaderFooterRequest, HeaderFooterPreviewRequest } from '../../types/addHeaderFooter';
import { Button } from '../DocumentService/ui/button';
import { Input } from '../DocumentService/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../DocumentService/ui/card';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// PDF.js imports
import * as pdfjsLib from 'pdfjs-dist';

// Use worker from public folder
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const AddHeaderFooter: React.FC = () => {
   const location = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [addHeaderFooterResult, setAddHeaderFooterResult] = useState<any>(null);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    headerText: 'Page {page} of {total}',
    footerText: 'Document',
    headerPosition: 'top-center' as const,
    footerPosition: 'bottom-center' as const,
    fontSize: 12,
    fontColor: '#000000',
    startPage: 1,
    endPage: '',
    margin: 20,
    customHeaderText: '',
    customFooterText: '',
    excludePages: '',
    headerEnabled: true,
    footerEnabled: true
  });

  const positionOptions = [
    { value: 'top-left', label: 'Top Left', description: 'Top left corner' },
    { value: 'top-center', label: 'Top Center', description: 'Top center' },
    { value: 'top-right', label: 'Top Right', description: 'Top right corner' },
    { value: 'bottom-left', label: 'Bottom Left', description: 'Bottom left corner' },
    { value: 'bottom-center', label: 'Bottom Center', description: 'Bottom center' },
    { value: 'bottom-right', label: 'Bottom Right', description: 'Bottom right corner' },
    { value: 'middle-left', label: 'Middle Left', description: 'Left side middle' },
    { value: 'middle-right', label: 'Middle Right', description: 'Right side middle' },
    { value: 'center', label: 'Center', description: 'Page center' }
  ];

  const headerFooterOptions = [
    { value: 'Page {page}', label: 'Page Number', description: 'Page 1, Page 2...' },
    { value: 'Page {page} of {total}', label: 'Page with Total', description: 'Page 1 of 5, Page 2 of 5...' },
    { value: '{page}', label: 'Number Only', description: '1, 2, 3...' },
    { value: 'Page {page} - {total}', label: 'Dash Format', description: 'Page 1 - 5, Page 2 - 5...' },
    { value: 'P.{page}', label: 'Abbreviated', description: 'P.1, P.2...' },
    { value: 'Document', label: 'Document', description: 'Document' },
    { value: 'Confidential', label: 'Confidential', description: 'Confidential' },
    { value: 'Draft', label: 'Draft', description: 'Draft' }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please select a valid PDF file');
        setSelectedFile(null);
        return;
      }

      const fileSizeMB = file.size / 1024 / 1024;
      if (fileSizeMB > 2) {
        setError('File size should not exceed 2 MB');
        setSelectedFile(null);
        return;
      }

      // ✅ valid file
      setSelectedFile(file);
      setError('');
      setResult(null);
      setPreviewUrl('');
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };



  const renderPage = async (pdf: any, pageNum: number) => {
    if (!canvasRef.current) return;
    
    try {
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      const viewport = page.getViewport({ scale: 1.5 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  };

  const changePage = async (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && pdfDocument) {
      setCurrentPage(newPage);
      await renderPage(pdfDocument, newPage);
    }
  };

  const handleAddHeaderFooter = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file first');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const request: AddHeaderFooterRequest = {
        file: selectedFile,
        headerText: formData.headerEnabled ? formData.headerText : '',
        footerText: formData.footerEnabled ? formData.footerText : '',
        headerPosition: formData.headerPosition,
        footerPosition: formData.footerPosition,
        fontSize: formData.fontSize,
        fontColor: formData.fontColor,
        startPage: formData.startPage,
        endPage: formData.endPage ? parseInt(formData.endPage) : undefined,
        margin: formData.margin,
        customHeaderText: formData.customHeaderText || undefined,
        customFooterText: formData.customFooterText || undefined,
        excludePages: formData.excludePages ? 
          formData.excludePages.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p)) : 
          undefined,
        headerEnabled: formData.headerEnabled,
        footerEnabled: formData.footerEnabled
      };

      const response = await addHeaderFooterService.addHeaderFooter(request);
      setResult(response);
      if (response.success) {
        setAddHeaderFooterResult(response);
        // Clear preview states after successful processing
        setPreviewUrl('');
        setPdfDocument(null);
        setCurrentPage(1);
        setTotalPages(0);
        setIsPreviewExpanded(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add headers and footers');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (result?.downloadUrl) {
      try {
        await addHeaderFooterService.downloadFile(result.downloadUrl, result.filename);
      } catch (err: any) {
        console.error('Download error:', err);
        setError(`Failed to download file: ${err.message}`);
      }
    } else if (result?.previewUrl) {
      setError('Please click "Add Headers & Footers" first to generate the complete PDF, then download it.');
    } else {
      setError('No download URL available');
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setFormData({
      headerText: 'Page {page} of {total}',
      footerText: 'Document',
      headerPosition: 'top-center',
      footerPosition: 'bottom-center',
      fontSize: 12,
      fontColor: '#000000',
      startPage: 1,
      endPage: '',
      margin: 20,
      customHeaderText: '',
      customFooterText: '',
      excludePages: '',
      headerEnabled: true,
      footerEnabled: true
    });
    setResult(null);
    setPreviewUrl('');
    setError('');
    setAddHeaderFooterResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetToStart = () => {
    setSelectedFile(null);
    setFormData({
      headerText: 'Page {page} of {total}',
      footerText: 'Document',
      headerPosition: 'top-center',
      footerPosition: 'bottom-center',
      fontSize: 12,
      fontColor: '#000000',
      startPage: 1,
      endPage: '',
      margin: 20,
      customHeaderText: '',
      customFooterText: '',
      excludePages: '',
      headerEnabled: true,
      footerEnabled: true
    });
    setResult(null);
    setPreviewUrl('');
    setError('');
    setAddHeaderFooterResult(null);
    setPdfDocument(null);
    setCurrentPage(1);
    setTotalPages(0);
    setIsPreviewExpanded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) return;
    
    setIsPreviewing(true);
    try {
      const request: HeaderFooterPreviewRequest = {
        file: selectedFile,
        headerText: formData.headerEnabled ? formData.headerText : '',
        footerText: formData.footerEnabled ? formData.footerText : '',
        headerPosition: formData.headerPosition,
        footerPosition: formData.footerPosition,
        fontSize: formData.fontSize,
        fontColor: formData.fontColor,
        startPage: formData.startPage,
        endPage: formData.endPage || undefined,
        margin: formData.margin,
        customHeaderText: formData.customHeaderText || undefined,
        customFooterText: formData.customFooterText || undefined,
        excludePages: formData.excludePages || undefined,
        headerEnabled: formData.headerEnabled,
        footerEnabled: formData.footerEnabled
      };

      const response = await addHeaderFooterService.getPreview(request);
      setPreviewUrl(response.previewUrl);
      setResult(response);
      setIsPreviewExpanded(true);
    } catch (err: any) {
      setError(err.message || 'Failed to generate preview');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleCollapsePreview = () => {
    setIsPreviewExpanded(false);
    setPreviewUrl('');
    setResult(null);
    setPdfDocument(null);
    setCurrentPage(1);
    setTotalPages(0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownloadSuccess = async () => {
    if (addHeaderFooterResult?.downloadUrl) {
      try {
        await addHeaderFooterService.downloadFile(addHeaderFooterResult.downloadUrl, addHeaderFooterResult.filename);
      } catch (err: any) {
        console.error('Download error:', err);
        setError(`Failed to download file: ${err.message}`);
      }
    } else {
      setError('No download URL available');
    }
  };

  // Show expanded preview if preview is expanded
  if (isPreviewExpanded && previewUrl) {
    return (
      <div className="mx-auto space-y-6">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-6">
              <Link
                   to={`/pdf-tools${location.search}`}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Add Headers & Footers to PDF</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Customize headers and footers with advanced formatting and positioning options
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Headers & Footers Preview</h2>
              <button
                onClick={handleCollapsePreview}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Collapse Preview</span>
              </button>
            </div>
            
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <iframe
                src={previewUrl}
                className="w-full h-[800px]"
                title="Headers & Footers Preview"
                onLoad={() => console.log('Preview iframe loaded successfully')}
                onError={(e) => console.error('Preview iframe error:', e)}
              />
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Preview shows how your headers and footers will appear on the PDF
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show success message if processing was successful
  if (addHeaderFooterResult && addHeaderFooterResult.success) {
    return (
      <div className="mx-auto space-y-6">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-6">
              <Link
                   to={`/pdf-tools${location.search}`}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Add Headers & Footers to PDF</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Customize headers and footers with advanced formatting and positioning options
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-green-800 mb-3">
                Headers & Footers Added Successfully!
              </h3>
              <p className="text-lg text-green-700 mb-8">
                Your PDF has been processed with headers and footers and the updated document is ready for download.
              </p>
              {addHeaderFooterResult.file && (
                <div className="bg-white border border-green-200 rounded-lg p-6 mb-8 shadow-sm">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-gray-900 text-lg">{addHeaderFooterResult.filename}</h4>
                      <p className="text-sm text-gray-600">
                        {formatFileSize(addHeaderFooterResult.file.size)} • {addHeaderFooterResult.pagesModified || 0} pages modified
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleDownloadSuccess}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-base font-medium shadow-md"
                  disabled={!addHeaderFooterResult?.downloadUrl}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => setAddHeaderFooterResult(null)}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2 text-base font-medium shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Back to Configuration</span>
                </button>
                <button
                  onClick={resetToStart}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-base font-medium shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Start New</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
                 to={`/pdf-tools${location.search}`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add Headers & Footers to PDF</h1>
              <p className="mt-2 text-sm text-gray-600">
                Customize headers and footers with advanced formatting and positioning options
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* File Upload Section - Only show when no file is selected */}
      {!selectedFile && (
        <Card>
          <CardHeader>
            <CardTitle>Upload PDF</CardTitle>
            <CardDescription>Select a PDF file to add headers and footers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Choose PDF File
                </label>
              </div>
            </div>
            {error && (
              <div className="text-sm text-red-600">{error}</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Configuration Section */}
      {selectedFile && (
        <Card>
          <CardHeader>
            <CardTitle>Header & Footer Configuration</CardTitle>
            <CardDescription>Customize the appearance and position of headers and footers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Header Section */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Header Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="headerEnabled"
                      checked={formData.headerEnabled}
                      onChange={(e) => handleInputChange('headerEnabled', e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="headerEnabled" className="text-sm font-medium text-gray-700">
                      Enable Header
                    </label>
                  </div>
                  
                  {formData.headerEnabled && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Header Position</label>
                        <select
                          value={formData.headerPosition}
                          onChange={(e) => handleInputChange('headerPosition', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {positionOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label} - {option.description}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Header Text</label>
                        <select
                          value={formData.headerText}
                          onChange={(e) => handleInputChange('headerText', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {headerFooterOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label} - {option.description}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Custom Header Text (optional)</label>
                        <Input
                          type="text"
                          value={formData.customHeaderText}
                          onChange={(e) => handleInputChange('customHeaderText', e.target.value)}
                          placeholder="e.g., Company Name"
                          className="w-full"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Footer Section */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Footer Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="footerEnabled"
                      checked={formData.footerEnabled}
                      onChange={(e) => handleInputChange('footerEnabled', e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="footerEnabled" className="text-sm font-medium text-gray-700">
                      Enable Footer
                    </label>
                  </div>
                  
                  {formData.footerEnabled && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Footer Position</label>
                        <select
                          value={formData.footerPosition}
                          onChange={(e) => handleInputChange('footerPosition', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {positionOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label} - {option.description}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Footer Text</label>
                        <select
                          value={formData.footerText}
                          onChange={(e) => handleInputChange('footerText', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {headerFooterOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label} - {option.description}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Custom Footer Text (optional)</label>
                        <Input
                          type="text"
                          value={formData.customFooterText}
                          onChange={(e) => handleInputChange('customFooterText', e.target.value)}
                          placeholder="e.g., Confidential"
                          className="w-full"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Common Settings */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Font Size</label>
                <Input
                  type="number"
                  min="8"
                  max="72"
                  value={formData.fontSize}
                  onChange={(e) => handleInputChange('fontSize', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Font Color</label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={formData.fontColor}
                    onChange={(e) => handleInputChange('fontColor', e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={formData.fontColor}
                    onChange={(e) => handleInputChange('fontColor', e.target.value)}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Margin (px)</label>
                <Input
                  type="number"
                  min="5"
                  max="100"
                  value={formData.margin}
                  onChange={(e) => handleInputChange('margin', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Page Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Start Page</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.startPage}
                  onChange={(e) => handleInputChange('startPage', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">End Page (optional)</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.endPage}
                  onChange={(e) => handleInputChange('endPage', e.target.value)}
                  placeholder="Leave empty for all pages"
                  className="w-full"
                />
              </div>

              {/* Exclude Pages */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Exclude Pages (optional)</label>
                <Input
                  type="text"
                  value={formData.excludePages}
                  onChange={(e) => handleInputChange('excludePages', e.target.value)}
                  placeholder="e.g., 1,3,5 (comma-separated)"
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Enter page numbers separated by commas to exclude them from headers/footers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {selectedFile && (
        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            onClick={handlePreview}
            disabled={isPreviewing}
            variant="outline"
            className="px-6 py-3"
          >
            {isPreviewing ? 'Generating Preview...' : 'Generate Preview'}
          </Button>
          
          <Button
            onClick={handleAddHeaderFooter}
            disabled={isProcessing}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? 'Adding Headers & Footers...' : 'Add Headers & Footers'}
          </Button>
          
          <Button
            onClick={resetForm}
            variant="outline"
            className="px-6 py-3"
          >
            Reset Form
          </Button>
        </div>
      )}

      {/* Preview Section - Only show when preview is generated but not expanded */}
      {previewUrl && !isPreviewExpanded && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Preview of how headers and footers will appear</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* PDF Navigation Controls */}
              {totalPages > 1 && pdfDocument && (
                <div className="flex items-center justify-center gap-4 mb-4">
                  <Button
                    onClick={() => changePage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    onClick={() => changePage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              )}
              
              {/* PDF Canvas Viewer */}
              <div className="flex justify-center">
                {pdfDocument ? (
                  <canvas
                    ref={canvasRef}
                    className="border border-gray-300 rounded-lg shadow-sm"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                ) : (
                  <iframe
                    src={previewUrl}
                    className="w-full h-96 border border-gray-300 rounded-lg"
                    title="Headers & Footers Preview"
                    onLoad={() => console.log('Preview iframe loaded successfully')}
                    onError={(e) => console.error('Preview iframe error:', e)}
                  />
                )}
              </div>
              
              <div className="text-sm text-gray-600 text-center">
                <p>Total pages: {result?.totalPages}</p>
              </div>
              
              {/* Expand Preview Button */}
              <div className="text-center">
                <Button
                  onClick={() => setIsPreviewExpanded(true)}
                  variant="outline"
                  className="px-6 py-3"
                >
                  Expand Preview
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {result && result.success && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Success!</CardTitle>
            <CardDescription className="text-green-700">
              Headers and footers have been added successfully
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-green-700">
                <p><strong>File:</strong> {result.filename}</p>
                <p><strong>Pages Modified:</strong> {result.pagesModified}</p>
                <p><strong>Total Pages:</strong> {result.totalPages}</p>
                {!result?.downloadUrl && (
                  <p className="text-blue-600 mt-2">
                    💡 <strong>Tip:</strong> Click "Add Headers & Footers" first to generate the complete PDF, then download it.
                  </p>
                )}
              </div>
              
              <Button
                onClick={handleDownload}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3"
                disabled={!result?.downloadUrl}
              >
                {result?.downloadUrl ? 'Download PDF' : 'Generate PDF First'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-700 text-center">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section - Only show when no file is selected */}
      {!selectedFile && (
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p><strong>1.</strong> Upload your PDF file</p>
              <p><strong>2.</strong> Maximum file size: 2MB</p>
              <p><strong>3.</strong> Choose whether to enable headers and/or footers</p>
              <p><strong>4.</strong> Select the position where headers and footers should appear</p>
              <p><strong>5.</strong> Choose from predefined text options or enter custom text</p>
              <p><strong>6.</strong> Customize the font size, color, and margin</p>
              <p><strong>7.</strong> Optionally set page range and exclude specific pages</p>
              <p><strong>8.</strong> Generate a preview to see how it will look</p>
              <p><strong>9.</strong> Add headers and footers and download your modified PDF</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AddHeaderFooter;
