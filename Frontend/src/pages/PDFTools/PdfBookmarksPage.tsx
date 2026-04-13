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
  RotateCcw,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { pdfBookmarksService } from '../../services/pdfBookmarksService';
import { pdfApi } from '../../services/apiHelper';
import type { Bookmark as BookmarkType, AutoDetectResult, CustomBookmarksResult } from '../../services/pdfBookmarksService';


const PdfBookmarksPage: React.FC = () => {
  // State management
   const location = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [processedResult, setProcessedResult] = useState<AutoDetectResult | CustomBookmarksResult | null>(null);

  // UI state
  const [expandedBookmarks, setExpandedBookmarks] = useState<Set<string>>(new Set());
  const [newBookmarkTitle, setNewBookmarkTitle] = useState('');
  const [newBookmarkPage, setNewBookmarkPage] = useState<number | null>(1);


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

    if (newBookmarkPage === null || newBookmarkPage < 1 || newBookmarkPage > totalPages) {
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

  // Navigation functions
  const handleBackToWorking = async () => {
    setProcessedResult(null);
    
    // Re-render the PDF preview if we have a selected file and PDF document
    if (selectedFile && pdfDoc) {
      try {
        // Add a small delay to ensure the canvas is available after state change
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Ensure PDF.js is loaded
        const pdfjsLib = await loadPDFJS();
        if (!pdfjsLib) {
          throw new Error('PDF.js not available');
        }
        
        await renderPDFPage(pdfDoc, currentPage);
        toast.success('Returned to bookmark editing');
      } catch (error) {
        console.error('Error re-rendering PDF:', error);
        toast.error('Error loading PDF preview');
      }
    } else {
      toast.success('Returned to bookmark editing');
    }
  };

  const handleAddNew = () => {
    setProcessedResult(null);
    setSelectedFile(null);
    setBookmarks([]);
    setNewBookmarkTitle('');
    setNewBookmarkPage(1);
    setCurrentPage(1);
    setTotalPages(0);
    setPdfDoc(null);
    setExpandedBookmarks(new Set());
    toast.success('Ready to add new PDF');
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
      // Wait a bit for the canvas to be available
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        if (canvasRef.current && window.pdfjsLib) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 50));
        attempts++;
      }
      
      if (!canvasRef.current) {
        console.error('Canvas ref not available after waiting');
        return;
      }
      
      if (!window.pdfjsLib) {
        console.error('PDF.js not available after waiting');
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
      <div className="bg-background shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
                 to={`/pdf-tools${location.search}`}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Add Bookmarks</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Create navigation bookmarks in PDFs
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Content */}
        <div className="bg-background rounded-lg shadow-sm">
          {processedResult ? (
            /* Success Section - Only show when bookmarks are successfully created */
            <div className="p-8">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-success-100 mb-6">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                <h3 className="text-2xl font-bold text-success-900 mb-2">PDF with Bookmarks Created Successfully!</h3>
                <p className="text-lg text-success-700 mb-6">
                  Your PDF now has {processedResult.bookmarks.length} bookmarks
                </p>
                
                <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <a
                    href={`${pdfApi.defaults.baseURL}${processedResult.downloadUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/80"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download PDF with Bookmarks
                  </a>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleBackToWorking}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-foreground bg-background hover:bg-muted"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Editing
                    </button>
                    
                    <button
                      onClick={handleAddNew}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/80"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Add New PDF
                    </button>
                  </div>
                </div>

                {/* Bookmark Information */}
                <div className=" mx-auto text-left">
                  <div className="p-6 rounded-lg border border-success-200 shadow-sm">
                    <h4 className="text-lg font-medium text-foreground mb-4">📖 How to Access Bookmarks:</h4>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>• <strong>In Adobe Reader:</strong> Right-click → Document Properties → Description tab</p>
                      <p>• <strong>In Chrome:</strong> Right-click → Document Properties → Details tab</p>
                      <p>• <strong>In Foxit Reader:</strong> File → Document Properties → Description</p>
                      <p>• <strong>Keywords field</strong> contains: <code className="bg-muted px-2 py-1 rounded text-xs">PDF_BOOKMARKS:{"{...}"}</code></p>
                    </div>
                      <div className="mt-4 p-4 bg-success rounded border border-success">
                      <p className="text-sm text-success">
                        <strong>Note:</strong> Bookmarks are stored in PDF metadata. While they won't appear in the traditional bookmark panel,
                        the bookmark information is preserved and can be extracted programmatically or viewed in document properties.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : !selectedFile ? (
            /* Upload Section */
            <div className="p-8">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 mb-4">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Upload PDF File</h3>
                <p className="text-sm text-muted-foreground mb-6">
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
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/80"
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
              <div className="w-1/2 border-r border-border flex flex-col">
                <div className="p-4 border-b border-border">
                  <h3 className="text-lg font-medium text-foreground">Add Bookmarks</h3>
                  <p className="text-sm text-muted-foreground">Click on pages in the preview to add bookmarks</p>
                </div>

                {/* Add Bookmark Form */}
                <div className="p-4 border-b border-border bg-background">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Bookmark Title
                      </label>
                      <input
                        type="text"
                        placeholder="Enter bookmark title"
                        value={newBookmarkTitle}
                        onChange={(e) => setNewBookmarkTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Page Number
                      </label>
                      <input
                        type="number"
                        placeholder="Page number"
                        min="1"
                        max={totalPages}
                        value={newBookmarkPage === null ? "" : newBookmarkPage}
                        onFocus={() => setNewBookmarkPage(null)}  // clears when clicked
                        onBlur={(e) => {
                          // reset to 1 if user leaves empty
                          if (!e.target.value) setNewBookmarkPage(1);
                        }}
                        onChange={(e) =>
                          setNewBookmarkPage(
                            e.target.value ? parseInt(e.target.value, 10) : null
                          )
                        }
                        className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <button
                      onClick={addBookmark}
                      className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/80"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Bookmark
                    </button>
                  </div>
                </div>

                {/* Bookmarks List */}
                <div className="flex-1 overflow-y-auto p-4">
                  <h4 className="text-sm font-medium text-foreground mb-3">
                    Bookmarks ({bookmarks.length})
                  </h4>
                  {bookmarks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No bookmarks added yet</p>
                      <p className="text-xs">Add bookmarks to see them here</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {bookmarks.map((bookmark) => (
                          <div key={bookmark.id} className="flex items-center justify-between p-3 bg-background border border-border rounded-lg hover:bg-muted">
                          <div className="flex items-center space-x-3">
                            <Bookmark className="w-4 h-4 text-primary" />
                            <div>
                              <p className="text-sm font-medium text-foreground">{bookmark.title}</p>
                              <p className="text-xs text-muted-foreground">Page {bookmark.page + 1}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => navigateToPage(bookmark.page + 1)}
                              className="p-1 hover:bg-primary-100 rounded text-primary"
                              title="Go to page"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => startEditingBookmark(bookmark)}
                              className="p-1 hover:bg-primary-100 rounded text-primary"
                              title="Edit bookmark"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteBookmark(bookmark.id || '')}
                              className="p-1 hover:bg-primary-100 rounded text-primary"
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
                <div className="p-4 border-t border-border bg-background">
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCreateCustomBookmarks}
                      disabled={isProcessing || bookmarks.length === 0}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="p-4 border-b border-border">
                  <h3 className="text-lg font-medium text-foreground">PDF Preview</h3>
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                </div>

                <div className="flex-1 p-4 bg-background overflow-auto">
                  <div className="bg-background rounded-lg shadow-sm overflow-hidden relative">
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
                            className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium shadow-lg"
                          >
                            📖 {bookmark.title}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Click on the PDF to set the page number for your bookmark
                  </p>

                  {/* Show bookmarks on current page */}
                  {bookmarks.filter(b => b.page + 1 === currentPage).length > 0 && (
                    <div className="mt-2 p-2 bg-primary-50 border border-primary-200 rounded text-xs">
                      <p className="text-primary-800 font-medium">Bookmarks on this page:</p>
                      {bookmarks
                        .filter(b => b.page + 1 === currentPage)
                        .map(bookmark => (
                          <div key={bookmark.id} className="flex items-center mt-1">
                            <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                            <span className="text-primary-700">{bookmark.title}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Page Navigation */}
                <div className="p-4 border-t border-border bg-background">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => navigateToPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage <= 1}
                      className="px-3 py-1 text-sm bg-background border border-border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>
                      {bookmarks.some(b => b.page + 1 === currentPage) && (
                        <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                          📖 Bookmarked
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => navigateToPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage >= totalPages}
                        className="px-3 py-1 text-sm bg-background border border-border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>

                  {/* Quick navigation to bookmarked pages */}
                  {bookmarks.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Quick jump to bookmarks:</p>
                      <div className="flex flex-wrap gap-1">
                        {bookmarks.map((bookmark) => (
                          <button
                            key={bookmark.id}
                            onClick={() => navigateToPage(bookmark.page + 1)}
                            className={`px-2 py-1 text-xs rounded ${currentPage === bookmark.page + 1
                                ? 'bg-primary text-primary'
                              : 'bg-muted text-muted-foreground hover:bg-muted-foreground/10'
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
        </div>
      </div>
    </div>
  );
};

export default PdfBookmarksPage;
