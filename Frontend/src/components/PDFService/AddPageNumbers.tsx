import React, { useState, useRef } from 'react';
import { addPageNumbersService } from '../../services/addPageNumbersService';
import type { AddPageNumbersRequest, PageNumberPreviewRequest } from '../../types/addPageNumbers';
import { Button } from '../DocumentService/ui/button';
import { Input } from '../DocumentService/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../DocumentService/ui/card';
import SuccessBox from '../common/SuccessBox';

// PDF.js imports
import * as pdfjsLib from 'pdfjs-dist';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// Use the correct worker version that matches the installed pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

const AddPageNumbers: React.FC = () => {
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
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [addPageNumbersResult, setAddPageNumbersResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    position: 'bottom-center' as const,
    fontSize: 12,
    fontColor: '#000000',
    startPage: 1,
    endPage: '',
    format: 'Page {page} of {total}',
    margin: 20,
    customText: '',
    excludePages: ''
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

  const formatOptions = [
    { value: 'Page {page}', label: 'Simple', description: 'Page 1, Page 2...' },
    { value: 'Page {page} of {total}', label: 'With Total', description: 'Page 1 of 5, Page 2 of 5...' },
    { value: '{page}', label: 'Number Only', description: '1, 2, 3...' },
    { value: 'Page {page} - {total}', label: 'Dash Format', description: 'Page 1 - 5, Page 2 - 5...' },
    { value: 'P.{page}', label: 'Abbreviated', description: 'P.1, P.2...' }
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


  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreview = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file first');
      return;
    }

    setIsPreviewing(true);
    setError('');

    try {
      const previewRequest: PageNumberPreviewRequest = {
        file: selectedFile,
        position: formData.position,
        fontSize: formData.fontSize,
        fontColor: formData.fontColor,
        format: formData.format,
        margin: formData.margin,
        excludePages: formData.excludePages ?
          formData.excludePages.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p)) :
          undefined
      };

      // console.log('Generating preview with request:', previewRequest);
      const response = await addPageNumbersService.getPreview(previewRequest);
      // console.log('Preview response:', response);

      setPreviewUrl(response.previewUrl);
      setResult(response);

      // Load PDF with PDF.js for preview
      await loadPdfPreview(response.previewUrl);
      
      // Expand preview after successful generation
      setIsPreviewExpanded(true);
    } catch (err: any) {
      console.error('Preview generation error:', err);
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

  const loadPdfPreview = async (url: string) => {
    try {
      console.log('Loading PDF preview from:', url);
      const loadingTask = pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;
      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);

      // console.log('PDF loaded successfully, pages:', pdf.numPages);

      // Render first page
      await renderPage(pdf, 1);
    } catch (error) {
      console.error('Error loading PDF preview:', error);
      // Don't set error for preview loading issues, just log them
      console.warn('Preview loading failed, but this won\'t affect the main functionality');
    }
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

  const handleAddPageNumbers = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file first');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const request: AddPageNumbersRequest = {
        file: selectedFile,
        position: formData.position,
        fontSize: formData.fontSize,
        fontColor: formData.fontColor,
        startPage: formData.startPage,
        endPage: formData.endPage ? parseInt(formData.endPage) : undefined,
        format: formData.format,
        margin: formData.margin,
        customText: formData.customText || undefined,
        excludePages: formData.excludePages ?
          formData.excludePages.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p)) :
          undefined
      };



      // Log what's actually being sent in FormData
      const formDataDebug = new FormData();
      formDataDebug.append('file', selectedFile);
      formDataDebug.append('position', formData.position);
      formDataDebug.append('fontSize', formData.fontSize.toString());
      formDataDebug.append('fontColor', formData.fontColor);
      formDataDebug.append('startPage', formData.startPage.toString());
      formDataDebug.append('endPage', formData.endPage ? formData.endPage.toString() : '');
      formDataDebug.append('format', formData.format);
      formDataDebug.append('margin', formData.margin.toString());

      for (let [key, value] of formDataDebug.entries()) {
        console.log(`${key}: ${value}`);
      }

      const response = await addPageNumbersService.addPageNumbers(request);
      setResult(response);
      setAddPageNumbersResult(response);
      
      // Clear preview data after successful processing
      setPreviewUrl('');
      setPdfDocument(null);
      setCurrentPage(1);
      setTotalPages(0);
      setIsPreviewExpanded(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add page numbers');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    console.log('Download clicked, result:', result);

    // Check if this is a preview result or a full page numbers result
    if (result?.downloadUrl) {
      // This is from "Add Page Numbers" - use the main downloadUrl
      try {
        // console.log('Downloading main PDF with page numbers from:', result.downloadUrl);
        await addPageNumbersService.downloadFile(result.downloadUrl, result.filename);
        console.log('Download completed successfully');
      } catch (err: any) {
        console.error('Download error:', err);
        setError(`Failed to download file: ${err.message}`);
      }
    } else if (result?.previewUrl) {
      // This is from "Generate Preview" - we need to add page numbers first
      setError('Please click "Add Page Numbers" first to download the complete PDF with page numbers on all pages. The preview is just for viewing.');
    } else {
      console.error('No download URL available');
      setError('No download URL available');
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setFormData({
      position: 'bottom-center',
      fontSize: 12,
      fontColor: '#000000',
      startPage: 1,
      endPage: '',
      format: 'Page {page} of {total}',
      margin: 20,
      customText: '',
      excludePages: ''
    });
    setResult(null);
    setPreviewUrl('');
    setError('');
    setIsPreviewExpanded(false);
    setAddPageNumbersResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Reset to start
  const resetToStart = () => {
    setSelectedFile(null);
    setFormData({
      position: 'bottom-center',
      fontSize: 12,
      fontColor: '#000000',
      startPage: 1,
      endPage: '',
      format: 'Page {page} of {total}',
      margin: 20,
      customText: '',
      excludePages: ''
    });
    setResult(null);
    setPreviewUrl('');
    setError('');
    setIsPreviewExpanded(false);
    setAddPageNumbersResult(null);
    setIsProcessing(false);
    setIsPreviewing(false);
    setPdfDocument(null);
    setCurrentPage(1);
    setTotalPages(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

 
  // Download processed PDF
  const handleDownloadSuccess = async () => {
    if (!addPageNumbersResult?.downloadUrl) {
      console.error('No download URL available');
      alert('No download URL available');
      return;
    }

    try {
      await addPageNumbersService.downloadFile(addPageNumbersResult.downloadUrl, addPageNumbersResult.filename);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  // Show success message if processing was successful
  if (addPageNumbersResult && addPageNumbersResult.success) {
    return (
      <SuccessBox
        title="Add Page Numbers to PDF"
        subtitle="Customize page numbers with advanced formatting and positioning options"
        message="Page Numbers Added Successfully!"
        fileInfo={addPageNumbersResult.file ? {
          filename: addPageNumbersResult.filename,
          size: addPageNumbersResult.file.size,
          pagesModified: addPageNumbersResult.pagesModified
        } : undefined}
        actions={{
          primary: {
            label: "Download PDF",
            onClick: handleDownloadSuccess,
            disabled: !addPageNumbersResult?.downloadUrl
          },
          secondary: {
            label: "Back to Configuration",
            onClick: () => setAddPageNumbersResult(null)
          },
          tertiary: {
            label: "Start New",
            onClick: resetToStart
          }
        }}
        backUrl={`/pdf-tools${location.search}`}
      />
    );
  }

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
                <h1 className="text-3xl font-bold text-gray-900">Add Page Numbers to PDF</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Customize page numbers with advanced formatting and positioning options
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Expanded Preview Section */}
        <div className="max-w-7xl mx-auto p-6">
          <div className="relative">
            {/* Collapse Button */}
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={handleCollapsePreview}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Collapse</span>
              </button>
            </div>

            {/* PDF Navigation Controls */}
            {totalPages > 1 && pdfDocument && (
              <div className="flex items-center justify-center gap-4 mb-6">
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

            {/* PDF Viewer */}
            <div className="flex justify-center">
              {pdfDocument ? (
                <canvas
                  ref={canvasRef}
                  className="border border-gray-300 rounded-lg shadow-lg"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              ) : (
                <iframe
                  src={previewUrl}
                  className="w-full h-[800px] border border-gray-300 rounded-lg shadow-lg"
                  title="Page Numbers Preview"
                  onLoad={() => console.log('Preview iframe loaded successfully')}
                  onError={(e) => console.error('Preview iframe error:', e)}
                />
              )}
            </div>

            <div className="text-sm text-gray-600 text-center mt-4">
              <p>Total pages: {result?.totalPages}</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Add Page Numbers to PDF</h1>
              <p className="mt-2 text-sm text-gray-600">
                Customize page numbers with advanced formatting and positioning options
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* File Upload Section - Hide after file upload */}
      {!selectedFile && (
        <Card>
          <CardHeader>
            <CardTitle>Upload PDF</CardTitle>
            <CardDescription>Select a PDF file to add page numbers</CardDescription>
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
              {error && (
                <div className="text-sm text-red-600">{error}</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Section */}
      {selectedFile && !addPageNumbersResult && (
        <Card>
          <CardHeader>
            <CardTitle>Page Number Configuration</CardTitle>
            <CardDescription>Customize the appearance and position of page numbers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Position Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Position</label>
                <select
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {positionOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font Size */}
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

              {/* Font Color */}
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

              {/* Margin */}
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

              {/* Format Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Format</label>
                <select
                  value={formData.format}
                  onChange={(e) => handleInputChange('format', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {formatOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Text */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Custom Text (optional)</label>
                <Input
                  type="text"
                  value={formData.customText}
                  onChange={(e) => handleInputChange('customText', e.target.value)}
                  placeholder="e.g., Document:"
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Exclude Pages (optional)</label>
                <Input
                  type="text"
                  value={formData.excludePages}
                  onChange={(e) => handleInputChange('excludePages', e.target.value)}
                  placeholder="e.g., 1,3,5 (comma-separated)"
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Enter page numbers separated by commas to exclude them from numbering</p>
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
            onClick={handleAddPageNumbers}
            disabled={isProcessing}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? 'Adding Page Numbers...' : 'Add Page Numbers'}
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

      {/* Preview Section - Hide when expanded */}
      {previewUrl && !isPreviewExpanded && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Preview of how page numbers will appear</CardDescription>
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
                    title="Page Numbers Preview"
                    onLoad={() => console.log('Preview iframe loaded successfully')}
                    onError={(e) => console.error('Preview iframe error:', e)}
                  />
                )}
              </div>

              <div className="text-sm text-gray-600 text-center">
                {/* <p>Sample text: {result?.sampleText}</p> */}
                <p>Total pages: {result?.totalPages}</p>
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
              Page numbers have been added successfully
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
                    💡 <strong>Tip:</strong> Click "Add Page Numbers" first to generate the complete PDF, then download it.
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

      {/* Help Section - Hide after file upload */}
      {!selectedFile && (
        <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p><strong>1.</strong> Upload your PDF file</p>
            <p><strong>2.</strong> Maximum file size: 2MB</p>
            <p><strong>3.</strong> Choose the position where you want page numbers to appear</p>
            <p><strong>4.</strong> Customize the font size, color, and margin</p>
            <p><strong>5.</strong> Select a format for your page numbers</p>
            <p><strong>6.</strong> Optionally set page range and exclude specific pages</p>
            <p><strong>7.</strong> Generate a preview to see how it will look</p>
            <p><strong>8.</strong> Add page numbers and download your modified PDF</p>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
};

export default AddPageNumbers;
