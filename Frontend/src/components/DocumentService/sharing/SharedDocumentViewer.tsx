import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Eye, Download, Lock, AlertCircle, FileText, User, Calendar, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { pdfShareService } from '../../../services/pdfShareService';
import type { Comment } from '../../../services/pdfShareService';
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
    isOwner?: boolean;
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
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [email] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  // Removed showComments state - comments now always visible in sidebar when available
  const [newComment, setNewComment] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentEmail, setCommentEmail] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Helper function to get user info from localStorage
  const getUserInfo = () => {
    const userInfo = localStorage.getItem('userData');
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        return {
          name: user.fullname || user.email || 'Anonymous',
          fullname: user.fullname || user.email || 'Anonymous',
          email: user.email || 'anonymous@example.com'
        };
      } catch (e) {
        console.warn('Failed to parse user info from localStorage:', e);
      }
    }
    return {
      name: 'Anonymous',
      fullname: 'Anonymous',
      email: 'anonymous@example.com'
    };
  };

  // Load PDF.js
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Point to the worker file in your public folder
        if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
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

          await loadComments();
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

  // Separate effect for password input to prevent focus loss
  const [passwordInput, setPasswordInput] = useState('');

  // Load PDF document
  const loadPDFDocument = async (documentId: string) => {
    try {
      const pdfjsLib = await loadPDFJS();
      if (!pdfjsLib) {
        console.error('PDF.js library not loaded');
        return;
      }
      console.log("Doc ID:", documentId);
      // Fetch the PDF file from the public endpoint
      const pdfUrl = `${import.meta.env.VITE_DOCUMENT_SERVICE_URL || 'http://localhost:2102'}/public/pdf-share/file/${shareToken}`;

      const response = await fetch(pdfUrl);

      if (!response.ok) {
        console.error('Failed to fetch PDF document. Status:', response.status, response.statusText);
        throw new Error('Failed to fetch PDF document');
      }

      const arrayBuffer = await response.arrayBuffer();

      if (arrayBuffer.byteLength === 0) {
        console.error('PDF file is empty');
        throw new Error('PDF file is empty');
      }

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setPdfPages(Array.from({ length: pdf.numPages }, (_, i) => ({ pageNumber: i + 1 })));

      // Use multiple attempts to ensure proper rendering on initial load
      const attemptRender = (attempts = 0) => {
        if (attempts >= 3) {
          console.error('Failed to render PDF after 3 attempts');
          return;
        }

        console.log(`Attempting to render PDF (attempt ${attempts + 1})`);

        // Wait for canvas to be ready
        setTimeout(() => {
          if (canvasRef.current && pdfDocument) {
            renderPage(1);
          } else {
            console.log('Canvas or PDF not ready, retrying...');
            attemptRender(attempts + 1);
          }
        }, 100 * (attempts + 1)); // Increasing delay
      };

      attemptRender();
    } catch (error) {
      console.error('Error loading PDF:', error);
      // Fallback to mock data for demo
      setTotalPages(1);
      setPdfPages([{ pageNumber: 1 }]);
    }
  };

  const loadComments = async () => {
    try {
      const response = await pdfShareService.getSharedDocumentComments(shareToken);
      if (response.success) {
        setComments(response.data);
      }
    } catch (err: any) {
      console.error('Error loading comments:', err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('userData') !== null;

    // If not logged in, validate that name and email are provided
    if (!isLoggedIn && (!commentAuthor.trim() || !commentEmail.trim())) {
      setError('Please enter your name and email to add a comment');
      return;
    }

    try {
      // Get user info from local storage if available, otherwise use form inputs
      const userInfo = getUserInfo();

      const response = await pdfShareService.addSharedDocumentComment(shareToken, {
        content: newComment,
        position: { page: currentPage, x: 0, y: 0 },
        authorName: isLoggedIn ? userInfo.fullname : commentAuthor.trim(),
        authorEmail: isLoggedIn ? userInfo.email : commentEmail.trim()
      });

      if (response.success) {
        setComments(prev => [response.data, ...prev]);
        setNewComment('');
        setCommentAuthor('');
        setCommentEmail('');
        setError(''); // Clear any previous errors
      }
    } catch (err: any) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment. Please try again.');
    }
  };

  // Render PDF page
  const renderPage = useCallback(async (pageNumber: number) => {
    if (!canvasRef.current || !pdfDocument) {
      return;
    }

    try {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        console.error('Cannot get canvas context');
        return;
      }

      const page = await pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale: scale });

      // Get device pixel ratio for crisp rendering on high-DPI displays
      const devicePixelRatio = window.devicePixelRatio || 1;
      
      // Set canvas dimensions with device pixel ratio for crisp rendering
      canvas.width = viewport.width * devicePixelRatio;
      canvas.height = viewport.height * devicePixelRatio;
      
      // Set canvas CSS size to the viewport size
      canvas.style.width = viewport.width + 'px';
      canvas.style.height = viewport.height + 'px';

      // Scale the context to match the device pixel ratio
      context.scale(devicePixelRatio, devicePixelRatio);

      // Clear canvas
      context.clearRect(0, 0, viewport.width, viewport.height);

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        // Enable high-quality rendering
        enableWebGL: false,
        renderInteractiveForms: false,
        // Improve text rendering
        textLayer: false,
        annotationLayer: false
      };

      await page.render(renderContext).promise;
    } catch (error) {
      console.error('Error rendering PDF page:', error);

      // Retry once after a short delay
      setTimeout(() => {
        if (canvasRef.current && pdfDocument) {
          renderPage(pageNumber);
        }
      }, 100);
    }
  }, [pdfDocument, scale]);

  // Render current page when page number or scale changes
  useEffect(() => {
    if (currentPage > 0 && pdfDocument) {
      renderPage(currentPage);
    }
  }, [currentPage, scale, renderPage, pdfDocument]);

  const handlePasswordSubmit = async () => {
    if (!passwordInput.trim()) {
      setError('Please enter a password');
      return;
    }

    // Set the password and trigger reload
    setPassword(passwordInput);
    setError('');
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

  // const handleEmailSubmit = () => {
  //   // Reload document with email for tracking
  //   window.location.reload();
  // };

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
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              />
              <Button
                onClick={handlePasswordSubmit}
                className="w-full"
                disabled={!passwordInput.trim()}
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                  <p
                    className="text-sm font-medium"
                    dangerouslySetInnerHTML={{ __html: documentData.share.message }}
                  ></p>
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

        {/* PDF Viewer with Comments Sidebar */}
       <div className="flex items-start gap-6">
          {/* PDF Viewer */}
          <Card className="flex-1 p-6">
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
                    <ChevronLeft size={16} className="mr-1" />
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
                    <ChevronRight size={16} className="ml-1" />
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

            <div className="w-full border rounded-lg overflow-hidden bg-white flex justify-center">
              <canvas
                ref={canvasRef}
                className="h-auto pdf-canvas"
              />
            </div>
          </Card>

          {/* Comments Sidebar - Always show if there are comments or if comments are allowed */}
          {(comments.length > 0 || documentData?.share.allowComments || documentData?.share.isOwner) && (
      <div className="w-[380px] self-start sticky top-6 bg-white shadow-lg rounded-md p-4 max-h-[calc(100vh-3rem)] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Comments</h3>
                <span className="text-sm text-gray-500">{comments.length} comments</span>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment._id} className={`border-b border-gray-100 pb-4 last:border-b-0 ${comment.isAdminComment ? 'bg-blue-50 p-3 rounded-lg' : ''}`}>
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${comment.isAdminComment ? 'bg-blue-600' : 'bg-blue-100'}`}>
                        <User size={16} className={comment.isAdminComment ? 'text-white' : 'text-blue-600'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium text-sm ${comment.isAdminComment ? 'text-blue-900' : 'text-gray-900'}`}>
                            {comment.authorName.includes('@') ? 
                              getUserInfo().fullname : 
                              comment.authorName
                            }
                            {comment.isAdminComment && (
                              <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                                Admin
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${comment.isAdminComment ? 'text-blue-800' : 'text-gray-700'}`}>{comment.content}</p>
                        {comment.replies.length > 0 && (
                          <div className="mt-3 ml-4 space-y-2">
                            {comment.replies.map((reply) => (
                              <div key={reply._id} className="flex items-start space-x-2">
                                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                  <User size={12} className="text-gray-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium text-xs text-gray-700">
                                      {reply.authorName}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(reply.timestamp).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600 mt-1">{reply.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {comments.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <MessageSquare size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No comments yet</p>
                  </div>
                )}
              </div>

              {/* Add Comment Form or Message */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                {documentData?.share.allowComments ? (
                  <div className="space-y-3">
                    {(() => {
                      const userInfo = getUserInfo();
                      const isLoggedIn = localStorage.getItem('userData') !== null;

                      return isLoggedIn ? (
                        <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                          <p>Commenting as: <strong>{userInfo.fullname}</strong></p>
                        </div>
                      ) : (
                        <>
                           <input
                            type="text"
                            placeholder="Your name"
                            value={commentAuthor}
                            onChange={(e) => setCommentAuthor(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                         
                         <input
                            type="email"
                            placeholder="Email"
                            value={commentEmail}
                            onChange={(e) => setCommentEmail(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </>
                       
                      );
                    })()}
                    <textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || (!localStorage.getItem('userData') && (!commentAuthor.trim() || !commentEmail.trim()))}
                      size="sm"
                      className="w-full"
                    >
                      Add Comment
                    </Button>

                    {error && (
                      <Alert className="mt-2 bg-red-50 border-red-200 text-red-800">
                        {error}
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <MessageSquare size={24} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Comments are disabled for this document</p>
                    <p className="text-xs text-gray-400 mt-1">You can view existing comments but cannot add new ones</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Old Comments Panel - Removed, now using sidebar */}
        {false && (documentData?.share.allowComments || documentData?.share.isOwner) && (
          <Card className="p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Comments</h3>
              <span className="text-sm text-gray-500">{comments.length} comments</span>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment._id} className={`border-b border-gray-100 pb-4 last:border-b-0 ${comment.isAdminComment ? 'bg-blue-50 p-3 rounded-lg' : ''}`}>
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${comment.isAdminComment ? 'bg-blue-600' : 'bg-blue-100'}`}>
                      <User size={16} className={comment.isAdminComment ? 'text-white' : 'text-blue-600'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium text-sm ${comment.isAdminComment ? 'text-blue-900' : 'text-gray-900'}`}>
                          {comment.authorName.includes('@') ? 
                            getUserInfo().fullname : 
                            comment.authorName
                          }
                          {comment.isAdminComment && (
                            <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                              Admin
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${comment.isAdminComment ? 'text-blue-800' : 'text-gray-700'}`}>{comment.content}</p>
                      {comment.replies.length > 0 && (
                        <div className="mt-3 ml-4 space-y-2">
                          {comment.replies.map((reply) => (
                            <div key={reply._id} className="flex items-start space-x-2">
                              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                <User size={12} className="text-gray-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-xs text-gray-700">
                                    {reply.authorName}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(reply.timestamp).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No comments yet</p>
                </div>
              )}
            </div>

            {/* Add Comment Form */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="space-y-3">
                {(() => {
                  const userInfo = getUserInfo();
                  const isLoggedIn = localStorage.getItem('userData') !== null;

                  return isLoggedIn ? (
                    <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                      <p>Commenting as: <strong>{userInfo.fullname}</strong> ({userInfo.email})</p>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Your name"
                        value={commentAuthor}
                        onChange={(e) => setCommentAuthor(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={commentEmail}
                        onChange={(e) => setCommentEmail(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  );
                })()}
                <textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  size="sm"
                  className="w-full"
                >
                  Add Comment
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Email Tracking (Optional) */}
        {/* {!email && (
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
        )} */}
      </div>
    </div>
  );
};

export default SharedDocumentViewer;
