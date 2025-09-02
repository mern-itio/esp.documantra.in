import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Download,
  Plus,
  Edit3,
  Trash2,
  ChevronRight,
  ChevronDown,
  Eye,
  CheckCircle,
  Loader2,
  Bookmark,
  BookmarkCheck,
  ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { pdfBookmarksService } from '../../services/pdfBookmarksService';
import { pdfApi } from '../../services/apiHelper';
import type { Bookmark as BookmarkType, AutoDetectResult, CustomBookmarksResult } from '../../services/pdfBookmarksService';


const PdfBookmarksPage: React.FC = () => {
  // State management
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [processedResult, setProcessedResult] = useState<AutoDetectResult | CustomBookmarksResult | null>(null);

  // UI state
  const [expandedBookmarks, setExpandedBookmarks] = useState<Set<string>>(new Set());
  const [newBookmarkTitle, setNewBookmarkTitle] = useState('');
  const [newBookmarkPage, setNewBookmarkPage] = useState(1);

  // PDF preview
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize PDF.js
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Point to the worker file in your public folder
        if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
          // console.log("PDF.js worker set to local file: /pdf.worker.min.mjs");
        }
      } catch (err) {
        console.warn("Failed to set PDF.js worker:", err);
      }
    }
  }, []);

  // Load PDF.js dynamically
  const loadPDFJS = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && !window.pdfjsLib) {
        const pdfjsLib = await import('pdfjs-dist');

        // Set worker path to local file
        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
          // console.log("PDF.js worker set to local file: /pdf.worker.min.mjs");
        } catch (error) {
          console.warn("Failed to set PDF.js worker:", error);
          pdfjsLib.GlobalWorkerOptions.workerSrc = '';
        }

        // Assign to window
        window.pdfjsLib = pdfjsLib;
      }

      return window.pdfjsLib;
    } catch (error) {
      console.error('Error loading PDF.js:', error);
      throw error;
    }
  }, []);

  // File handling
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      loadPDFPreview(file);
      toast.success('PDF file selected successfully');
    } else {
      toast.error('Please select a valid PDF file');
    }
  };

  // Load PDF preview
  const loadPDFPreview = async (file: File) => {
    try {
      const pdfjsLib = await loadPDFJS();
      // console.log('Loading PDF preview for:', file.name);

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      // console.log('PDF loaded successfully, pages:', pdf.numPages);

      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      await renderPDFPage(pdf, 1);
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast.error(`Failed to load PDF preview: ${(error as Error).message || 'Unknown error'}`);
    }
  };

  // Create custom bookmarks
  const handleCreateCustomBookmarks = async () => {
    if (!selectedFile || bookmarks.length === 0) {
      toast.error('Please select a PDF file and create bookmarks first');
      return;
    }

    setIsProcessing(true);
    try {
      // console.log('🔧 Creating custom bookmarks with:', bookmarks);
      const result = await pdfBookmarksService.createCustomBookmarks(selectedFile, bookmarks);
      setProcessedResult(result);
      toast.success('Custom bookmarks created successfully');
    } catch (error) {
      console.error('Error creating custom bookmarks:', error);
      toast.error('Failed to create custom bookmarks: ' + ((error as Error).message || 'Network error'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Bookmark management
  const addBookmark = () => {
    if (!newBookmarkTitle.trim()) {
      toast.error('Please enter a bookmark title');
      return;
    }

    if (newBookmarkPage < 1 || newBookmarkPage > totalPages) {
      toast.error(`Please enter a page number between 1 and ${totalPages}`);
      return;
    }

    const newBookmark: BookmarkType = {
      id: Date.now().toString(),
      title: newBookmarkTitle,
      page: newBookmarkPage - 1, // Convert to 0-based index
      level: 0, // Always start at level 0 for simplicity
      children: [],
      custom: true
    };

    setBookmarks([...bookmarks, newBookmark]);
    setNewBookmarkTitle('');
    setNewBookmarkPage(1);
    toast.success('Bookmark added successfully');
  };

  const deleteBookmark = (id: string) => {
    setBookmarks(bookmarks.filter(bookmark => bookmark.id !== id));
    toast.success('Bookmark deleted successfully');
  };

  const toggleBookmarkExpansion = (id: string) => {
    const newExpanded = new Set(expandedBookmarks);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedBookmarks(newExpanded);
  };

  const startEditingBookmark = (bookmark: BookmarkType) => {
    setNewBookmarkTitle(bookmark.title);
    setNewBookmarkPage(bookmark.page + 1);
  };

  // PDF preview functions

  const renderPDFPage = async (pdf: any, pageNum: number) => {
    try {
      if (!canvasRef.current || !window.pdfjsLib) {
        console.error('Canvas ref or PDF.js not available');
        return;
      }

      // console.log('Rendering PDF page:', pageNum);
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        console.error('Could not get canvas context');
        return;
      }

      const viewport = page.getViewport({ scale: 1.5 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
      // console.log('PDF page rendered successfully');
    } catch (error) {
      console.error('Error rendering PDF page:', error);
      toast.error(`Failed to render PDF page: ${(error as Error).message || 'Unknown error'}`);
    }
  };

  const navigateToPage = (page: number) => {
    if (pdfDoc) {
      setCurrentPage(page);
      renderPDFPage(pdfDoc, page);
    }
  };

  // Render bookmark tree
  const renderBookmarkTree = (bookmarks: BookmarkType[], level = 0) => {
    return bookmarks.map((bookmark) => (
      <div key={bookmark.id} className="ml-4">
        <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md">
          <div className="flex items-center space-x-2">
            {bookmark.children && bookmark.children.length > 0 && (
              <button
                onClick={() => toggleBookmarkExpansion(bookmark.id || '')}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {expandedBookmarks.has(bookmark.id || '') ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}
            <Bookmark className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">{bookmark.title}</span>
            <span className="text-xs text-gray-500">Page {bookmark.page + 1}</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => navigateToPage(bookmark.page + 1)}
              className="p-1 hover:bg-blue-100 rounded text-blue-600"
              title="Go to page"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => startEditingBookmark(bookmark)}
              className="p-1 hover:bg-yellow-100 rounded text-yellow-600"
              title="Edit bookmark"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => deleteBookmark(bookmark.id || '')}
              className="p-1 hover:bg-red-100 rounded text-red-600"
              title="Delete bookmark"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {bookmark.children && bookmark.children.length > 0 && expandedBookmarks.has(bookmark.id || '') && (
          <div className="ml-4">
            {renderBookmarkTree(bookmark.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              to="/pdf-tools"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add Bookmarks</h1>
              <p className="mt-2 text-sm text-gray-600">
                Create navigation bookmarks in PDFs
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border">
          {!selectedFile ? (
            /* Upload Section */
            <div className="p-8">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                  <Upload className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Upload PDF File</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Select a PDF file to create navigation bookmarks
                </p>
                <div className="mt-6">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose PDF File
                  </label>
                </div>
              </div>
            </div>
          ) : (
            /* Main Working Area */
            <div className="flex h-[600px]">
              {/* Left Side - Bookmarks Management */}
              <div className="w-1/2 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Add Bookmarks</h3>
                  <p className="text-sm text-gray-500">Click on pages in the preview to add bookmarks</p>
                </div>

                {/* Add Bookmark Form */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bookmark Title
                      </label>
                      <input
                        type="text"
                        placeholder="Enter bookmark title"
                        value={newBookmarkTitle}
                        onChange={(e) => setNewBookmarkTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Page Number
                      </label>
                      <input
                        type="number"
                        placeholder="Page number"
                        min="1"
                        max={totalPages}
                        value={newBookmarkPage}
                        onChange={(e) => setNewBookmarkPage(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={addBookmark}
                      className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Bookmark
                    </button>
                  </div>
                </div>

                {/* Bookmarks List */}
                <div className="flex-1 overflow-y-auto p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Bookmarks ({bookmarks.length})
                  </h4>
                  {bookmarks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No bookmarks added yet</p>
                      <p className="text-xs">Add bookmarks to see them here</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {bookmarks.map((bookmark) => (
                        <div key={bookmark.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                          <div className="flex items-center space-x-3">
                            <Bookmark className="w-4 h-4 text-blue-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{bookmark.title}</p>
                              <p className="text-xs text-gray-500">Page {bookmark.page + 1}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => navigateToPage(bookmark.page + 1)}
                              className="p-1 hover:bg-blue-100 rounded text-blue-600"
                              title="Go to page"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => startEditingBookmark(bookmark)}
                              className="p-1 hover:bg-yellow-100 rounded text-yellow-600"
                              title="Edit bookmark"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteBookmark(bookmark.id || '')}
                              className="p-1 hover:bg-red-100 rounded text-red-600"
                              title="Delete bookmark"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCreateCustomBookmarks}
                      disabled={isProcessing || bookmarks.length === 0}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <BookmarkCheck className="w-4 h-4 mr-2" />
                      )}
                      {isProcessing ? 'Creating...' : 'Create PDF with Bookmarks'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Side - PDF Preview */}
              <div className="w-1/2 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">PDF Preview</h3>
                  <p className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </p>
                </div>

                <div className="flex-1 p-4 bg-gray-100 overflow-auto">
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden relative">
                    <canvas
                      ref={canvasRef}
                      className="max-w-full h-auto cursor-pointer"
                      onClick={() => setNewBookmarkPage(currentPage)}
                      title="Click to set this page for bookmark"
                    />

                    {/* Bookmark indicators */}
                    {bookmarks.map((bookmark) => {
                      if (bookmark.page + 1 === currentPage) {
                        return (
                          <div
                            key={bookmark.id}
                            className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium shadow-lg"
                          >
                            📖 {bookmark.title}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Click on the PDF to set the page number for your bookmark
                  </p>

                  {/* Show bookmarks on current page */}
                  {bookmarks.filter(b => b.page + 1 === currentPage).length > 0 && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                      <p className="text-blue-800 font-medium">Bookmarks on this page:</p>
                      {bookmarks
                        .filter(b => b.page + 1 === currentPage)
                        .map(bookmark => (
                          <div key={bookmark.id} className="flex items-center mt-1">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            <span className="text-blue-700">{bookmark.title}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Page Navigation */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => navigateToPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage <= 1}
                      className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      {bookmarks.some(b => b.page + 1 === currentPage) && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          📖 Bookmarked
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => navigateToPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage >= totalPages}
                      className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>

                  {/* Quick navigation to bookmarked pages */}
                  {bookmarks.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600 mb-2">Quick jump to bookmarks:</p>
                      <div className="flex flex-wrap gap-1">
                        {bookmarks.map((bookmark) => (
                          <button
                            key={bookmark.id}
                            onClick={() => navigateToPage(bookmark.page + 1)}
                            className={`px-2 py-1 text-xs rounded ${currentPage === bookmark.page + 1
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            title={bookmark.title}
                          >
                            P{bookmark.page + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Download Section */}
          {processedResult && (
            <div className="p-6 border-t border-gray-200 bg-green-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <h3 className="text-lg font-medium text-green-900">PDF with Bookmarks Created!</h3>
                    <p className="text-sm text-green-700">
                      Your PDF now has {processedResult.bookmarks.length} bookmarks
                    </p>
                  </div>
                </div>
                <a
                  href={`${pdfApi.defaults.baseURL}${processedResult.downloadUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </a>
              </div>

              {/* Bookmark Information */}
              <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">📖 How to Access Bookmarks:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• <strong>In Adobe Reader:</strong> Right-click → Document Properties → Description tab</p>
                  <p>• <strong>In Chrome:</strong> Right-click → Document Properties → Details tab</p>
                  <p>• <strong>In Foxit Reader:</strong> File → Document Properties → Description</p>
                  <p>• <strong>Keywords field</strong> contains: <code className="bg-gray-100 px-1 rounded">PDF_BOOKMARKS:{"{...}"}</code></p>
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> Bookmarks are stored in PDF metadata. While they won't appear in the traditional bookmark panel,
                    the bookmark information is preserved and can be extracted programmatically or viewed in document properties.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfBookmarksPage;
