import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Share2, FileText, Eye, Download, Trash2, ExternalLink, MessageSquare, User, Share, Copy, Link } from 'lucide-react';
import { pdfShareService } from '../../services/pdfShareService';
import type { SharedDocument, Comment } from '../../services/pdfShareService';
import { Button } from '../../components/DocumentService/ui/button';
import { Card } from '../../components/DocumentService/ui/card';
import Badge from '../../components/DocumentService/ui/badge';
import { useDocumentStore } from '../../components/common/store/documentStore';
import PDFShareModal from '../../components/DocumentService/sharing/PDFShareModal';

const SharedPDFPage: React.FC = () => {
  const [sharedDocuments, setSharedDocuments] = useState<SharedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus] = useState<'all' | 'active' | 'expired' | 'revoked'>('all');

  // Get search and sorting from document store
  const { 
    searchQuery, 
    sortBy, 
    sortOrder, 
    viewMode,
    selectedDocuments,
    setSelectedDocuments
  } = useDocumentStore();
  const [selectedDocument, setSelectedDocument] = useState<SharedDocument | null>(null);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [documentToShare, setDocumentToShare] = useState<SharedDocument | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

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

        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
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

  // Filter and sort documents using document store search and sorting
  const filteredDocuments = sharedDocuments
    .filter(doc => {
      // Always exclude revoked documents unless specifically filtering for them
      if (!doc.isActive && filterStatus !== 'revoked') {
        return false;
      }

      // Search query filter
      const matchesSearch = !searchQuery || 
        (doc.document?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.recipients.some((recipient: any) => 
          recipient.email.toLowerCase().includes(searchQuery.toLowerCase())
        );

      // Status filter
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
          aValue = a.document?.name?.toLowerCase() || '';
          bValue = b.document?.name?.toLowerCase() || '';
          break;
        case 'date':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'size':
          // Use document size if available, otherwise use 0
          aValue = a.document?.size || 0;
          bValue = b.document?.size || 0;
          break;
        case 'type':
          // Shared documents are all PDFs, so sort by name as fallback
          aValue = a.document?.name?.toLowerCase() || '';
          bValue = b.document?.name?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const handleRevokeShare = async (shareToken: string) => {
    const confirmRevoke = window.confirm("Are you sure you want to delete this document?");
    if (!confirmRevoke) return;

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
      console.error("Failed to revoke share:", err);
    }
  };


  const handleShareDocument = (doc: SharedDocument) => {
    // Only allow owners to share documents
    if (!doc.isOwner) {
      console.warn('Only document owners can share documents');
      return;
    }
    setDocumentToShare(doc);
    setShowShareModal(true);
  };

  const handleShareSuccess = (shareData: any) => {
    // Optionally refresh the shared documents list or show a success message
    console.log('Document shared successfully:', shareData);
    setShowShareModal(false);
    setDocumentToShare(null);
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
    setDocumentToShare(null);
  };

  const handleCopyLink = async (shareToken: string) => {
    try {
      const shareLink = `${window.location.origin}/shared/${shareToken}`;
      await navigator.clipboard.writeText(shareLink);
      setCopiedLink(shareToken);
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedLink(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = `${window.location.origin}/shared/${shareToken}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setCopiedLink(shareToken);
      setTimeout(() => {
        setCopiedLink(null);
      }, 2000);
    }
  };

  const handleViewDocument = async (doc: SharedDocument) => {
    setSelectedDocument(doc);
    setShowPDFViewer(true);
    setCurrentPage(1);
    setScale(1);
    setShowComments(false);
    setComments([]);
    await loadPDFDocument(doc.shareToken);


    if (doc.allowComments || doc.isOwner) {
      await loadComments(doc.shareToken);
    } else {
      console.log('Comments not allowed for this document');
    }
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

  const loadComments = async (shareToken: string) => {
    try {
      // Check if user is logged in and try authenticated API first
      const token = localStorage.getItem('accessToken');


      if (token) {
        try {
          const response = await pdfShareService.getSharedDocumentCommentsAuth(shareToken);
          if (response.success) {
            setComments(response.data);
            return;
          }
        } catch (authError) {
          console.warn('Auth API failed, falling back to public API:', authError);
        }
      }

      const response = await pdfShareService.getSharedDocumentComments(shareToken);
      if (response.success) {
        setComments(response.data);
      }
    } catch (err: any) {
      console.error('Error loading comments:', err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedDocument) return;

    try {
      // Check if user is the document owner (admin)
      const isAdmin = selectedDocument.isOwner;

      if (isAdmin) {
        // Check if token exists
        const token = localStorage.getItem('accessToken');
        if (!token) {
          console.error('No token found for admin comment');
          alert('Please log in again to add admin comments');
          return;
        }



        // Add admin comment
        const response = await pdfShareService.addAdminComment(selectedDocument.shareToken, {
          content: newComment,
          position: { page: currentPage, x: 0, y: 0 }
        });

        if (response.success) {
          setComments(prev => [response.data, ...prev]);
          setNewComment('');
        }
      } else {
        // Add regular comment
        const userInfo = getUserInfo();
        const response = await pdfShareService.addSharedDocumentComment(selectedDocument.shareToken, {
          content: newComment,
          position: { page: currentPage, x: 0, y: 0 },
          authorName: userInfo.fullname,
          authorEmail: userInfo.email
        });

        if (response.success) {
          setComments(prev => [response.data, ...prev]);
          setNewComment('');
          setCommentAuthor('');
          setCommentEmail('');
        }
      }
    } catch (err: any) {
      console.error('Error adding comment:', err);
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
    <div>
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <Share2 size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No shared documents</h3>
          {searchQuery && (
            <p className="text-sm text-gray-500">
              No documents found matching "{searchQuery}"
            </p>
          )}
        </div>
      ) : (
        <div className={`p-4 ${viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
        }`}>
          {filteredDocuments.map((doc) => {
            const isSelected = selectedDocuments.includes(doc.id);
            return (
            <Card 
              key={doc.id} 
              className={`p-4 hover:shadow-lg transition-shadow cursor-pointer ${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => {
                if (isSelected) {
                  setSelectedDocuments(selectedDocuments.filter(id => id !== doc.id));
                } else {
                  setSelectedDocuments([...selectedDocuments, doc.id]);
                }
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <FileText size={20} className="text-blue-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {doc.document?.name || 'Untitled document'}
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

                {doc.isOwner && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyLink(doc.shareToken)}
                    title={copiedLink === doc.shareToken ? "Link copied!" : "Copy share link"}
                    className={copiedLink === doc.shareToken ? "bg-green-50 text-green-600 border-green-200" : ""}
                  >
                    {copiedLink === doc.shareToken ? <Copy size={14} className="text-green-600" /> : <Link size={14} />}
                  </Button>
                )}

                {doc.isOwner && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleShareDocument(doc)}
                    title="Share this document"
                  >
                    <Share size={14} />
                  </Button>
                )}

                {doc.isOwner && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRevokeShare(doc.shareToken)}
                    title="Revoke access"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </Card>
            );
          })}
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
                    {selectedDocument.document?.name || 'Document'}
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
                  {(selectedDocument?.allowComments || selectedDocument?.isOwner) && (
                    <Button
                      variant={showComments ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowComments(!showComments)}
                    >
                      <MessageSquare size={14} className="mr-1" />
                      Comments ({comments.length})
                      {selectedDocument?.isOwner && !selectedDocument?.allowComments && (
                        <span className="ml-1 text-xs text-blue-600">(Admin)</span>
                      )}
                    </Button>
                  )}

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
              <div className="flex-1 overflow-auto p-4 bg-gray-100 flex">
                <div className="flex-1 flex justify-center">
                  <canvas
                    ref={canvasRef}
                    className="shadow-lg bg-white"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </div>

                {/* Comments Panel */}
                {showComments && (selectedDocument?.allowComments || selectedDocument?.isOwner) && (
                  <div className="w-80 ml-4 bg-white rounded-lg shadow-lg flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Comments</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {comments.map((comment) => (
                        <div key={comment._id} className={`border-b border-gray-100 pb-3 ${comment.isAdminComment ? 'bg-blue-50 p-3 rounded-lg' : ''}`}>
                          <div className="flex items-start space-x-2">
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
                                <div className="mt-2 ml-4 space-y-2">
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
                    <div className="p-4 border-t border-gray-200">
                      <div className="space-y-3">
                        {(() => {
                          const userInfo = getUserInfo();
                          const isLoggedIn = localStorage.getItem('userData') !== null;
                          const isAdmin = selectedDocument?.isOwner;

                          if (isAdmin) {
                            return (
                              <div className="text-sm text-blue-700 bg-blue-100 p-2 rounded border border-blue-200">
                                <p>Commenting as <strong>Admin</strong>: <strong>{userInfo.fullname}</strong></p>
                              </div>
                            );
                          } else if (isLoggedIn) {
                            return (
                              <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                                <p>Commenting as: <strong>{userInfo.fullname}</strong></p>
                              </div>
                            );
                          } else {
                            return (
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
                          }
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
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Share Modal */}
      <PDFShareModal
        isOpen={showShareModal}
        onClose={handleCloseShareModal}
        onSuccess={handleShareSuccess}
        existingDocument={documentToShare}
      />
    </div>
  );
};

export default SharedPDFPage;
