import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Eye, Download, Lock, AlertCircle, FileText, User, Calendar, MessageSquare } from 'lucide-react';
import { pdfShareService } from '../../../services/pdfShareService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Alert } from '../ui/alert';

interface SharedDocumentViewerProps {
  shareToken: string;
}

interface SharedDocumentData {
  document: {
    id: string;
    name: string;
    size: number;
    createdAt: string;
  };
  share: {
    shareToken: string;
    ownerName: string;
    allowDownload: boolean;
    allowComments: boolean;
    message: string;
    expiresAt?: string;
    viewCount: number;
  };
}

const SharedDocumentViewer: React.FC<SharedDocumentViewerProps> = ({ shareToken }) => {
  const [documentData, setDocumentData] = useState<SharedDocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [, setPdfPages] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [email, setEmail] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load PDF.js
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Point to the worker file in your public folder
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
        
        // Set worker path to local file
        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
          console.log("PDF.js worker set to local file: /pdf.worker.min.mjs");
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

  // Load shared document data
  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await pdfShareService.getSharedDocument(shareToken, email, password);
        
        if (response.success) {
          setDocumentData(response.data);
          setPasswordRequired(false);
          await loadPDFDocument(response.data.document.id);
        } else {
          setError('Failed to load document');
        }
      } catch (error: any) {
        console.error('Error loading shared document:', error);
        if (error.message?.includes('Password required')) {
          setPasswordRequired(true);
        } else {
          setError(error.message || 'Failed to load document');
        }
      } finally {
        setLoading(false);
      }
    };

    if (shareToken) {
      loadDocument();
    }
  }, [shareToken, email, password]);

  // Load PDF document
  const loadPDFDocument = async (documentId: string) => {
    try {
      const pdfjsLib = await loadPDFJS();
      if (!pdfjsLib) return;

      console.log('Loading PDF document:', documentId);
      
      // Fetch the PDF file from the public endpoint
      const response = await fetch(`${import.meta.env.VITE_DOCUMENT_SERVICE_URL || 'http://localhost:2102'}/public/pdf-share/file/${shareToken}`);

      if (!response.ok) {
        throw new Error('Failed to fetch PDF document');
      }

      const arrayBuffer = await response.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      setTotalPages(pdf.numPages);
      setPdfPages(Array.from({ length: pdf.numPages }, (_, i) => ({ pageNumber: i + 1 })));
    } catch (error) {
      console.error('Error loading PDF:', error);
      // Fallback to mock data for demo
      setTotalPages(1);
      setPdfPages([{ pageNumber: 1 }]);
    }
  };

  // Render PDF page
  const renderPage = useCallback(async (pageNumber: number) => {
    if (!canvasRef.current || !documentData) return;

    try {
      const pdfjsLib = await loadPDFJS();
      if (!pdfjsLib) return;

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;

      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Fetch the PDF file from the public endpoint
      const response = await fetch(`${import.meta.env.VITE_DOCUMENT_SERVICE_URL || 'http://localhost:2102'}/public/pdf-share/file/${shareToken}`);

      if (!response.ok) {
        throw new Error('Failed to fetch PDF document');
      }

      const arrayBuffer = await response.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: scale });
      
      // Set canvas dimensions
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
    } catch (error) {
      console.error('Error rendering PDF page:', error);
      
      // Fallback to placeholder
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#f8f9fa';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.fillStyle = '#6b7280';
        context.font = '24px Arial';
        context.textAlign = 'center';
        context.fillText('PDF Preview', canvas.width / 2, canvas.height / 2 - 20);
        
        context.font = '16px Arial';
        context.fillText(`Page ${pageNumber} of ${totalPages}`, canvas.width / 2, canvas.height / 2 + 20);
        
        context.fillText('PDF content would be displayed here', canvas.width / 2, canvas.height / 2 + 50);
      }
    }
  }, [documentData, scale, totalPages, loadPDFJS]);

  // Render current page when page number or scale changes
  useEffect(() => {
    if (currentPage > 0) {
      renderPage(currentPage);
    }
  }, [currentPage, scale, renderPage]);

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }
    
    // Reload document with password
    const response = await pdfShareService.getSharedDocument(shareToken, email, password);
    
    if (response.success) {
      setDocumentData(response.data);
      setPasswordRequired(false);
      setError('');
    } else {
      setError('Invalid password');
    }
  };

  const handleDownload = async () => {
    if (!documentData?.share.allowDownload) {
      setError('Download is not allowed for this document');
      return;
    }

    try {
      const blob = await pdfShareService.downloadSharedDocument(shareToken, password);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documentData.document.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      setError(error.message || 'Failed to download document');
    }
  };

  const handleEmailSubmit = () => {
    // Reload document with email for tracking
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error && !passwordRequired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Document Not Available</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (passwordRequired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Lock size={48} className="mx-auto text-blue-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Password Required</h2>
            <p className="text-gray-600 mb-6">This document is protected with a password</p>
            
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              />
              <Button
                onClick={handlePasswordSubmit}
                className="w-full"
                disabled={!password.trim()}
              >
                Access Document
              </Button>
            </div>
            
            {error && (
              <Alert className="mt-4 bg-red-50 border-red-200 text-red-800">
                {error}
              </Alert>
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (!documentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Document Not Found</h2>
            <p className="text-gray-600">The shared document could not be found or is no longer available.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <FileText size={24} className="text-blue-600" />
              <div>
                <h1 className="text-lg font-semibold">{documentData.document.name}</h1>
                <p className="text-sm text-gray-600">
                  Shared by {documentData.share.ownerName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {documentData.share.allowDownload && (
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                >
                  <Download size={16} className="mr-2" />
                  Download
                </Button>
              )}
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Eye size={16} />
                <span>{documentData.share.viewCount} views</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Info */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <User size={16} className="text-gray-400" />
              <span className="text-gray-600">Shared by:</span>
              <span className="font-medium">{documentData.share.ownerName}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-gray-600">Created:</span>
              <span className="font-medium">
                {new Date(documentData.document.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText size={16} className="text-gray-400" />
              <span className="text-gray-600">Size:</span>
              <span className="font-medium">
                {(documentData.document.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          </div>
          
          {documentData.share.message && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-start space-x-2">
                <MessageSquare size={16} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Message from sender:</p>
                  <p className="text-sm font-medium">{documentData.share.message}</p>
                </div>
              </div>
            </div>
          )}
          
          {documentData.share.expiresAt && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <AlertCircle size={16} className="text-orange-400" />
                <span className="text-sm text-orange-600">
                  This document expires on {new Date(documentData.share.expiresAt).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* PDF Viewer */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Document Preview</h3>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  size="sm"
                  variant="outline"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage >= totalPages}
                  size="sm"
                  variant="outline"
                >
                  Next
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setScale(Math.max(0.5, scale - 0.25))}
                  size="sm"
                  variant="outline"
                >
                  -
                </Button>
                <span className="text-sm text-gray-600 w-12 text-center">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  onClick={() => setScale(Math.min(2, scale + 0.25))}
                  size="sm"
                  variant="outline"
                >
                  +
                </Button>
              </div>
            </div>
          </div>
          
          <div className="w-full m-auto border rounded-lg overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              className="w-full h-auto"
              style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
            />
          </div>
        </Card>

        {/* Email Tracking (Optional) */}
        {!email && (
          <Card className="p-4 mt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                Help us track document access by providing your email (optional)
              </p>
              <div className="flex items-center space-x-2 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Your email (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button
                  onClick={handleEmailSubmit}
                  size="sm"
                  disabled={!email.trim()}
                >
                  Submit
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SharedDocumentViewer;
