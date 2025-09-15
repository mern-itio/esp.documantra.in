import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Share2, FileText, Eye, Download, Trash2, ExternalLink } from 'lucide-react';
import { pdfShareService } from '../../services/pdfShareService';
import type { SharedDocument } from '../../services/pdfShareService';
import { Button } from '../../components/DocumentService/ui/button';
import { Card } from '../../components/DocumentService/ui/card';
import Badge from '../../components/DocumentService/ui/badge';
import { useDocumentStore } from '../../components/common/store/documentStore';

const SharedPDFPage: React.FC = () => {
  const [sharedDocuments, setSharedDocuments] = useState<SharedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery] = useState('');
  const [filterStatus] = useState<'all' | 'active' | 'expired' | 'revoked'>('all');
  
  // Get sorting from document store
  const { sortBy, sortOrder } = useDocumentStore();
  const [selectedDocument, setSelectedDocument] = useState<SharedDocument | null>(null);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load PDF.js
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
          console.log("PDF.js worker set to local file: /pdf.worker.min.mjs");
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
        
        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
          console.log("PDF.js worker set to local file: /pdf.worker.min.mjs");
        } catch (error) {
          console.warn("Failed to set PDF.js worker:", error);
          pdfjsLib.GlobalWorkerOptions.workerSrc = '';
        }
        
        window.pdfjsLib = pdfjsLib;
      }
      
      return window.pdfjsLib;
    } catch (error) {
      console.error('Error loading PDF.js:', error);
      throw error;
    }
  }, []);

  // Load shared documents
  useEffect(() => {
    const loadSharedDocuments = async () => {
      try {
        setLoading(true);
        const response = await pdfShareService.getUserSharedDocuments();
        
        if (response.success) {
          setSharedDocuments(response.data.sharedDocuments);
        } else {
          setError('Failed to load shared documents');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load shared documents');
      } finally {
        setLoading(false);
      }
    };

    loadSharedDocuments();
  }, []);

  // Filter and sort documents using document store sorting
  const filteredDocuments = sharedDocuments
    .filter(doc => {
      const matchesSearch = doc.document.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesFilter = true;
      if (filterStatus === 'active') {
        matchesFilter = doc.isActive && (!doc.expiresAt || new Date(doc.expiresAt) > new Date());
      } else if (filterStatus === 'expired') {
        matchesFilter = !!(doc.expiresAt && new Date(doc.expiresAt) <= new Date());
      } else if (filterStatus === 'revoked') {
        matchesFilter = !doc.isActive;
      }
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.document.name.toLowerCase();
          bValue = b.document.name.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'size':
          // Use document size if available, otherwise use 0
          aValue = a.document.size || 0;
          bValue = b.document.size || 0;
          break;
        case 'type':
          // Shared documents are all PDFs, so sort by name as fallback
          aValue = a.document.name.toLowerCase();
          bValue = b.document.name.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const handleRevokeShare = async (shareToken: string) => {
    try {
      const response = await pdfShareService.revokeSharedDocument(shareToken);
      if (response.success) {
        setSharedDocuments(prev => 
          prev.map(doc => 
            doc.shareToken === shareToken 
              ? { ...doc, isActive: false }
              : doc
          )
        );
      }
    } catch (err: any) {
      console.error('Failed to revoke share:', err);
    }
  };

  const handleViewDocument = async (doc: SharedDocument) => {
    setSelectedDocument(doc);
    setShowPDFViewer(true);
    setCurrentPage(1);
    setScale(1);
    await loadPDFDocument(doc.shareToken);
  };

  const loadPDFDocument = async (shareToken: string) => {
    try {
      const pdfjsLib = await loadPDFJS();
      if (!pdfjsLib) return;

      const response = await fetch(`${import.meta.env.VITE_DOCUMENT_SERVICE_URL || 'http://localhost:2102'}/public/pdf-share/file/${shareToken}`);

      if (!response.ok) {
        throw new Error('Failed to fetch PDF document');
      }

      const arrayBuffer = await response.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
    } catch (err: any) {
      console.error('Error loading PDF:', err);
    }
  };

  // Render PDF page
  const renderPage = useCallback(async (pageNumber: number) => {
    if (!pdfDocument || !canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;

      context.clearRect(0, 0, canvas.width, canvas.height);
      
      const page = await pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale: scale });
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
    } catch (error) {
      console.error('Error rendering PDF page:', error);
    }
  }, [pdfDocument, scale]);

  // Render current page when page number or scale changes
  useEffect(() => {
    if (currentPage > 0 && pdfDocument) {
      renderPage(currentPage);
    }
  }, [currentPage, renderPage]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (doc: SharedDocument) => {
    if (!doc.isActive) {
      return <Badge variant="destructive" className="text-xs">Revoked</Badge>;
    }
    if (doc.expiresAt && new Date(doc.expiresAt) < new Date()) {
      return <Badge variant="secondary" className="text-xs">Expired</Badge>;
    }
    return <Badge variant="default" className="text-xs">Active</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <Share2 size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No shared documents</h3>
         
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <FileText size={20} className="text-blue-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {doc.document.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(doc.createdAt)}
                    </p>
                  </div>
                </div>
                {getStatusBadge(doc)}
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                <div className="flex items-center space-x-1">
                  <Eye size={14} />
                  <span>{doc.viewCount} views</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Download size={14} />
                  <span>{doc.downloadCount} downloads</span>
                </div>
              </div>

              {/* Recipients */}
              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-2">Recipients:</p>
                <div className="flex flex-wrap gap-1">
                  {doc.recipients.slice(0, 3).map((recipient: any, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {recipient.email}
                    </Badge>
                  ))}
                  {doc.recipients.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{doc.recipients.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewDocument(doc)}
                  className="flex-1"
                >
                  <ExternalLink size={14} className="mr-1" />
                  View
                </Button>
                
                {doc.isActive && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRevokeShare(doc.shareToken)}
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* PDF Viewer Modal */}
      {showPDFViewer && selectedDocument && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs " onClick={() => setShowPDFViewer(false)} />
          
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">
                    {selectedDocument.document.name}
                  </h2>
                  <span className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPDFViewer(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </Button>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                  >
                    ←
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    →
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setScale(prev => Math.max(0.5, prev - 0.25))}
                    disabled={scale <= 0.5}
                  >
                    -
                  </Button>
                  <span className="text-sm text-gray-600 min-w-[60px] text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setScale(prev => Math.min(3, prev + 0.25))}
                    disabled={scale >= 3}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* PDF Content */}
              <div className="flex-1 overflow-auto p-4 bg-gray-100">
                <div className="flex justify-center">
                  <canvas
                    ref={canvasRef}
                    className="shadow-lg bg-white"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedPDFPage;
