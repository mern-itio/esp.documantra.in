import React, { useState, useRef, useCallback } from 'react';
import { FiUpload, FiFile, FiTrash2, FiDownload, FiScissors, FiPlus, FiX } from 'react-icons/fi';
import { extractPDFService } from '../../services/extractPDFService';
import type { ExtractPDFResponse, PageSelection } from '../../types/extractPDF';
import type { PDFInfo } from '../../types/common';

const ExtractPDF: React.FC = () => {
  const [document, setDocument] = useState<File | null>(null);
  const [pdfInfo, setPdfInfo] = useState<PDFInfo | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractMode, setExtractMode] = useState<'pages' | 'range' | 'custom'>('pages');
  const [pageNumbers, setPageNumbers] = useState<string>('');
  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(1);
  const [customSelections, setCustomSelections] = useState<PageSelection[]>([]);
  const [outputName, setOutputName] = useState<string>('');
  const [extractResult, setExtractResult] = useState<ExtractPDFResponse | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a valid PDF file');
      return;
    }

    setDocument(file);
    setExtractResult(null);

    // Get PDF info
    try {
      const info = await extractPDFService.getPDFInfo(file);
      setPdfInfo(info);
      
      // Set default range values
      if (info.pages > 0) {
        setEndPage(info.pages);
      }
    } catch (error) {
      console.error('Error getting PDF info:', error);
    }
  }, []);

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

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Remove document
  const removeDocument = () => {
    setDocument(null);
    setPdfInfo(null);
    setExtractResult(null);
    setPageNumbers('');
    setStartPage(1);
    setEndPage(1);
    setCustomSelections([]);
    setOutputName('');
  };

  // Add custom selection
  const addCustomSelection = () => {
    const newSelection: PageSelection = {
      id: Date.now().toString(),
      type: 'page',
      value: 1,
      name: `Selection ${customSelections.length + 1}`
    };
    setCustomSelections([...customSelections, newSelection]);
  };

  // Update custom selection
  const updateCustomSelection = (id: string, field: keyof PageSelection, value: any) => {
    setCustomSelections(prev => prev.map(sel => {
      if (sel.id === id) {
        // If changing type from page to range, initialize proper value structure
        if (field === 'type' && value === 'range' && typeof sel.value === 'number') {
          return { ...sel, [field]: value, value: { start: sel.value, end: sel.value } };
        }
        // If changing type from range to page, convert to number
        if (field === 'type' && value === 'page' && typeof sel.value === 'object') {
          return { ...sel, [field]: value, value: (sel.value as any).start || 1 };
        }
        return { ...sel, [field]: value };
      }
      return sel;
    }));
  };

  // Remove custom selection
  const removeCustomSelection = (id: string) => {
    setCustomSelections(prev => prev.filter(sel => sel.id !== id));
  };

  // Parse page numbers string (handles ranges like "1-3,5,7-9")
  const parsePageNumbers = (input: string): number[] => {
    if (!input.trim()) return [];
    
    const pages: number[] = [];
    const parts = input.split(',').map(p => p.trim());
    
    for (const part of parts) {
      if (part.includes('-')) {
        // Handle range (e.g., "1-3")
        const [start, end] = part.split('-').map(n => parseInt(n.trim()));
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            pages.push(i);
          }
        }
      } else {
        // Handle single page (e.g., "5")
        const page = parseInt(part);
        if (!isNaN(page)) {
          pages.push(page);
        }
      }
    }
    
    // Remove duplicates and sort
    return [...new Set(pages)].sort((a, b) => a - b);
  };

  // Extract PDF
  const handleExtract = async () => {
    if (!document) return;

    setExtracting(true);
    try {
      let result: ExtractPDFResponse;

      if (extractMode === 'pages') {
        const pages = parsePageNumbers(pageNumbers);
        console.log('Parsed page numbers:', pages, 'from input:', pageNumbers);
        if (pages.length === 0) {
          alert('Please enter valid page numbers');
          return;
        }
        result = await extractPDFService.extractPages({
          file: document,
          pageNumbers: pages,
          outputName: outputName || undefined
        });
      } else if (extractMode === 'range') {
        if (startPage > endPage) {
          alert('Start page cannot be greater than end page');
          return;
        }
        result = await extractPDFService.extractRange({
          file: document,
          startPage,
          endPage,
          outputName: outputName || undefined
        });
      } else if (extractMode === 'custom') {
        if (customSelections.length === 0) {
          alert('Please add at least one selection');
          return;
        }
        result = await extractPDFService.extractCustom({
          file: document,
          selections: customSelections.map(sel => ({
            type: sel.type,
            value: sel.value
          })),
          outputName: outputName || undefined
        });
      } else {
        throw new Error('Invalid extract mode');
      }

      setExtractResult(result);
    } catch (error) {
      console.error('Error extracting PDF:', error);
      setExtractResult({
        success: false,
        error: 'Failed to extract PDF'
      });
    } finally {
      setExtracting(false);
    }
  };

  // Download extracted PDF
  const handleDownload = async () => {
    if (!extractResult?.file) return;

    try {
      await extractPDFService.downloadExtractedPDF(
        extractResult.file.filename
      );
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      {/* <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Extract PDF Pages</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Extract specific pages from your PDF documents. Choose individual pages, page ranges, 
          or create custom selections to get exactly what you need.
        </p>
      </div> */}

      {/* File Upload Section */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload PDF Document</h2>
        
        {!document ? (
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg text-gray-600 mb-2">
              Drag and drop your PDF here, or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                browse files
              </button>
            </p>
            <p className="text-sm text-gray-500">Maximum file size: 100MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <FiFile className="h-8 w-8 text-red-500" />
                <div>
                  <h3 className="font-medium text-gray-900">{document.name}</h3>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(document.size)} • {pdfInfo?.pages || 'Unknown'} pages
                  </p>
                </div>
              </div>
              <button
                onClick={removeDocument}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiTrash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Extract Options Section */}
      {document && pdfInfo && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Extract Options</h2>
          
          {/* Extract Mode Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Extraction Method
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: 'pages', label: 'Specific Pages', desc: 'Extract individual pages' },
                { value: 'range', label: 'Page Range', desc: 'Extract consecutive pages' },
                { value: 'custom', label: 'Custom Selection', desc: 'Mix of pages and ranges' }
              ].map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setExtractMode(mode.value as any)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    extractMode === mode.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{mode.label}</div>
                  <div className="text-sm text-gray-500">{mode.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Mode-specific inputs */}
          {extractMode === 'pages' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page Numbers
              </label>
              <input
                type="text"
                value={pageNumbers}
                onChange={(e) => setPageNumbers(e.target.value)}
                placeholder="e.g., 1, 3, 5-7, 10"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-2">
                Enter page numbers separated by commas. Use ranges like "5-7" for consecutive pages. Examples: "1,3,5" or "1-3,7-9" or "1,3-5,8".
              </p>
            </div>
          )}

          {extractMode === 'range' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Page
                </label>
                <input
                  type="number"
                  min="1"
                  max={pdfInfo.pages}
                  value={startPage}
                  onChange={(e) => setStartPage(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Page
                </label>
                <input
                  type="number"
                  min={startPage}
                  max={pdfInfo.pages}
                  value={endPage}
                  onChange={(e) => setEndPage(parseInt(e.target.value) || startPage)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {extractMode === 'custom' && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Custom Selections
                </label>
                <button
                  onClick={addCustomSelection}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiPlus className="h-4 w-4 mr-2" />
                  Add Selection
                </button>
              </div>
              
              <div className="space-y-4">
                {customSelections.map((selection) => (
                  <div key={selection.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-4">
                      <select
                        value={selection.type}
                        onChange={(e) => updateCustomSelection(selection.id, 'type', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="page">Single Page</option>
                        <option value="range">Page Range</option>
                      </select>
                      
                      {selection.type === 'page' ? (
                        <input
                          type="number"
                          min="1"
                          max={pdfInfo.pages}
                          value={selection.value as number}
                          onChange={(e) => updateCustomSelection(selection.id, 'value', parseInt(e.target.value) || 1)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Page number"
                        />
                      ) : (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            max={pdfInfo.pages}
                            value={typeof selection.value === 'object' ? (selection.value as any).start || 1 : 1}
                            onChange={(e) => {
                              const currentValue = typeof selection.value === 'object' ? selection.value as any : { start: 1, end: 1 };
                              updateCustomSelection(selection.id, 'value', {
                                ...currentValue,
                                start: parseInt(e.target.value) || 1
                              });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-20"
                            placeholder="Start"
                          />
                          <span className="text-gray-500">to</span>
                          <input
                            type="number"
                            min="1"
                            max={pdfInfo.pages}
                            value={typeof selection.value === 'object' ? (selection.value as any).end || 1 : 1}
                            onChange={(e) => {
                              const currentValue = typeof selection.value === 'object' ? selection.value as any : { start: 1, end: 1 };
                              updateCustomSelection(selection.id, 'value', {
                                ...currentValue,
                                end: parseInt(e.target.value) || 1
                              });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-20"
                            placeholder="End"
                          />
                        </div>
                      )}
                      
                      <input
                        type="text"
                        value={selection.name || ''}
                        onChange={(e) => updateCustomSelection(selection.id, 'name', e.target.value)}
                        placeholder="Selection name (optional)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      
                      <button
                        onClick={() => removeCustomSelection(selection.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <FiX className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Output Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Output File Name (Optional)
            </label>
            <input
              type="text"
              value={outputName}
              onChange={(e) => setOutputName(e.target.value)}
              placeholder="e.g., extracted_pages"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-2">
              Leave empty to use auto-generated names
            </p>
          </div>

          {/* Extract Button */}
          <button
            onClick={handleExtract}
            disabled={extracting}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-medium text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {extracting ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Extracting Pages...
              </>
            ) : (
              <>
                <FiScissors className="h-6 w-6 mr-3" />
                Extract PDF Pages
              </>
            )}
          </button>
        </div>
      )}

      {/* Results Section */}
      {extractResult && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Extraction Results</h2>
          
          {extractResult.success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <FiScissors className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-medium text-green-800">
                  {extractResult.message}
                </h3>
              </div>
              
              {extractResult.file && (
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FiFile className="h-8 w-8 text-red-500" />
                      <div>
                        <h4 className="font-medium text-gray-900">{extractResult.file.filename}</h4>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(extractResult.file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleDownload}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <FiDownload className="h-4 w-4 mr-2" />
                      Download
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <FiX className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-medium text-red-800">
                  Extraction Failed
                </h3>
              </div>
              <p className="text-red-700 mt-2">{extractResult.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExtractPDF;
