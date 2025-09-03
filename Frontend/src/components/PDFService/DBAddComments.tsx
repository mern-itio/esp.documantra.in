import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Download,
  MessageSquare,
  Plus,
  Trash2,
  CheckCircle,
  Loader2,
  Reply,
  MessageCircle,
  ArrowLeft,
  FileText,
  Share2,
  Link,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../AuthService/AuthContext';
import dbCommentService, { type CreateDocumentRequest } from '../../services/dbCommentService';
import type { 
  Comment, 
  CommentLibrary,
  CommentThread,
  UserInfo,
  CommentPosition,
  CommentColor
} from '../../types/comments';

const DBAddComments: React.FC = () => {
  const { user } = useAuth();
  // const navigate = useNavigate();
  
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'share' | 'manage'>('create');
  
  // Comment management
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentLibrary, setCommentLibrary] = useState<CommentLibrary | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: user?.fullname || 'Anonymous',
    email: user?.email || '',
    id: user?.id || 'anonymous'
  });
  
  // UI state
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentColor, setNewCommentColor] = useState<CommentColor>('yellow');
  // const [commentPosition, setCommentPosition] = useState<CommentPosition | null>(null);
  
  // Sharing options
  const [shareableLink, setShareableLink] = useState<boolean>(true);
  const [expiresInDays, setExpiresInDays] = useState<number>(30);
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  
  // User documents
  const [userDocuments, setUserDocuments] = useState<any[]>([]);
  // const [currentPage, setCurrentPage] = useState<number>(1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load comment library on component mount
  useEffect(() => {
    const loadCommentLibrary = async () => {
      try {
        // Use the existing comment service for templates
        const response = await fetch('/pdf-comments/comment-library');
        const data = await response.json();
        setCommentLibrary(data.commentLibrary);
      } catch (error) {
        console.error('Failed to load comment library:', error);
      }
    };

    loadCommentLibrary();
  }, []);

  // Load user documents when switching to manage tab
  useEffect(() => {
    if (activeTab === 'manage' && user?.id) {
      loadUserDocuments();
    }
  }, [activeTab, user?.id]);

  const loadUserDocuments = async () => {
    try {
      const response = await dbCommentService.getUserDocuments(user?.id || '');
      setUserDocuments(response.documents);
    } catch (error) {
      console.error('Failed to load user documents:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
      setResult(null);
      setComments([]);
      setGeneratedLink('');
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const handleAddComment = (position: CommentPosition) => {
    if (!newCommentText.trim()) {
      setError('Please enter comment text');
      return;
    }

    const newComment = dbCommentService.createComment(
      newCommentText,
      position,
      userInfo.name,
      newCommentColor
    );

    setComments(prev => [...prev, newComment]);
    setNewCommentText('');
    // setCommentPosition(null);
    setError(null);
  };

  const handleReplyToComment = (parentComment: Comment) => {
    if (!replyText.trim()) {
      setError('Please enter reply text');
      return;
    }

    const replyPosition: CommentPosition = {
      x: parentComment.position.x + 20,
      y: parentComment.position.y + 20,
      pageNumber: parentComment.position.pageNumber
    };

    const reply = dbCommentService.createComment(
      replyText,
      replyPosition,
      userInfo.name,
      newCommentColor,
      parentComment.id,
      parentComment.threadId
    );

    setComments(prev => prev.map(comment => 
      comment.id === parentComment.id 
        ? { ...comment, replies: [...comment.replies, reply] }
        : comment
    ));

    setReplyText('');
    setSelectedComment(null);
    setError(null);
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
  };

  const handleResolveComment = (commentId: string) => {
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, isResolved: !comment.isResolved }
        : comment
    ));
  };

  const handleCreateDocument = async () => {
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    if (comments.length === 0) {
      setError('Please add at least one comment');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const request: CreateDocumentRequest = {
        file,
        comments,
        userInfo,
        shareableLink,
        expiresInDays
      };

      const validation = dbCommentService.validateRequest(request);
      if (!validation.valid) {
        setError(validation.message || 'Invalid request');
        return;
      }

      const response = await dbCommentService.createDocument(request);
      setResult(response);
      setGeneratedLink(response.shareableLink);
      setActiveTab('share');
    } catch (err) {
      console.error('Error creating document:', err);
      setError(err instanceof Error ? err.message : 'Failed to create document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (result?.downloadUrl) {
      try {
        await dbCommentService.downloadFile(result.downloadUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Download failed');
      }
    }
  };

  const handleCopyLink = async () => {
    if (generatedLink) {
      try {
        await navigator.clipboard.writeText(window.location.origin + generatedLink);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      } catch (err) {
        setError('Failed to copy link');
      }
    }
  };

  const handleReset = () => {
    setFile(null);
    setComments([]);
    setResult(null);
    setError(null);
    setActiveTab('create');
    setSelectedComment(null);
    setReplyText('');
    setNewCommentText('');
    setGeneratedLink('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getColorClass = (color: CommentColor) => {
    const colorMap = {
      yellow: 'bg-yellow-200 border-yellow-400 text-yellow-800',
      green: 'bg-green-200 border-green-400 text-green-800',
      blue: 'bg-blue-200 border-blue-400 text-blue-800',
      pink: 'bg-pink-200 border-pink-400 text-pink-800',
      orange: 'bg-orange-200 border-orange-400 text-orange-800',
      purple: 'bg-purple-200 border-purple-400 text-purple-800',
      red: 'bg-red-200 border-red-400 text-red-800',
      gray: 'bg-gray-200 border-gray-400 text-gray-800'
    };
    return colorMap[color] || colorMap.yellow;
  };

  // Ensure all comments have proper Date objects before organizing into threads
  const processedComments = comments.map(comment => ({
    ...comment,
    timestamp: comment.timestamp instanceof Date ? comment.timestamp : new Date(comment.timestamp),
    replies: comment.replies.map(reply => ({
      ...reply,
      timestamp: reply.timestamp instanceof Date ? reply.timestamp : new Date(reply.timestamp)
    }))
  }));
  
  const threads = dbCommentService.organizeCommentsIntoThreads(processedComments);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <RouterLink 
            to="/pdf-tools" 
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to PDF Tools
          </RouterLink>
          <h1 className="text-3xl font-bold text-gray-900">Add Comments with Sharing</h1>
          <p className="mt-2 text-gray-600">
            Create shareable PDF documents with collaborative commenting system
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MessageCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('create')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Plus className="h-4 w-4 inline mr-2" />
              Create Document
            </button>
            {result && (
              <button
                onClick={() => setActiveTab('share')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'share'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Share2 className="h-4 w-4 inline mr-2" />
                Share Link
              </button>
            )}
            {user?.id && (
              <button
                onClick={() => setActiveTab('manage')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'manage'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="h-4 w-4 inline mr-2" />
                My Documents
              </button>
            )}
          </nav>
        </div>

        {/* Create Document Tab */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - File Upload and Comment Management */}
            <div className="lg:col-span-2 space-y-6">
              {/* File Upload */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Upload PDF</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        {file ? file.name : 'Click to upload PDF file'}
                      </span>
                      <input
                        ref={fileInputRef}
                        id="file-upload"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="sr-only"
                      />
                    </label>
                    <p className="mt-1 text-xs text-gray-500">PDF files only</p>
                  </div>
                </div>
              </div>

              {/* Comment Templates */}
              {commentLibrary && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Comment Templates</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {commentLibrary.templates?.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => {
                          setNewCommentText(template.text);
                          setNewCommentColor(template.color as CommentColor);
                        }}
                        className={`p-3 rounded-lg border-2 text-left transition-colors ${getColorClass(template.color as CommentColor)} hover:opacity-80`}
                      >
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm opacity-75">{template.text}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Comment */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Comment</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comment Text
                    </label>
                    <textarea
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Enter your comment..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color
                    </label>
                    <div className="flex space-x-2">
                      {(['yellow', 'green', 'blue', 'pink', 'orange', 'purple', 'red', 'gray'] as CommentColor[]).map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewCommentColor(color)}
                          className={`w-8 h-8 rounded-full border-2 ${
                            newCommentColor === color ? 'border-gray-800' : 'border-gray-300'
                          } ${getColorClass(color).split(' ')[0]}`}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      // Default position for demo
                      handleAddComment({
                        x: 100,
                        y: 100,
                        pageNumber: 1
                      });
                    }}
                    disabled={!newCommentText.trim()}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4 inline mr-2" />
                    Add Comment
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Comments List and Sharing Options */}
            <div className="space-y-6">
              {/* Comments List */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Comments ({comments.length})
                </h3>
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>No comments added yet</p>
                    <p className="text-sm">Add your first comment above</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {threads.map((thread: CommentThread) => (
                      <div key={thread.id} className="border rounded-lg p-3">
                        <div className={`p-2 rounded ${getColorClass(thread.rootComment.color)}`}>
                          <div className="flex items-start justify-between">
                                                         <div className="flex-1">
                               <div className="text-sm font-medium">{thread.rootComment.authorName || thread.rootComment.author}</div>
                               <div className="text-sm">{thread.rootComment.text}</div>
                               <div className="text-xs opacity-75 mt-1">
                                 Page {thread.rootComment.pageNumber} • {thread.replies.length} replies
                               </div>
                             </div>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleResolveComment(thread.rootComment.id)}
                                className={`p-1 rounded ${
                                  thread.rootComment.isResolved 
                                    ? 'bg-green-100 text-green-600' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                                title={thread.rootComment.isResolved ? 'Resolved' : 'Mark as resolved'}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setSelectedComment(thread.rootComment)}
                                className="p-1 rounded bg-blue-100 text-blue-600"
                                title="Reply"
                              >
                                <Reply className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(thread.rootComment.id)}
                                className="p-1 rounded bg-red-100 text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Replies */}
                        {thread.replies.length > 0 && (
                          <div className="mt-2 ml-4 space-y-2">
                            {thread.replies.map((reply: Comment) => (
                                                             <div key={reply.id} className={`p-2 rounded text-sm ${getColorClass(reply.color)}`}>
                                 <div className="flex items-start justify-between">
                                   <div className="flex-1">
                                     <div className="font-medium">{reply.authorName || reply.author}</div>
                                     <div>{reply.text}</div>
                                   </div>
                                  <button
                                    onClick={() => handleDeleteComment(reply.id)}
                                    className="p-1 rounded bg-red-100 text-red-600 ml-2"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sharing Options */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Sharing Options</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="shareable-link"
                      checked={shareableLink}
                      onChange={(e) => setShareableLink(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="shareable-link" className="ml-2 block text-sm text-gray-900">
                      Generate shareable link
                    </label>
                  </div>
                  
                  {shareableLink && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Link expires in (days)
                      </label>
                      <input
                        type="number"
                        value={expiresInDays}
                        onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 30)}
                        min="1"
                        max="365"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">User Info</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={userInfo.name}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={userInfo.email}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Share Link Tab */}
        {activeTab === 'share' && result && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-2 text-green-700 mb-4">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Document Created Successfully!</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Document Details</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>Total Comments: {result.commentDetails.totalComments}</div>
                    <div>Total Threads: {result.commentDetails.totalThreads}</div>
                    <div>Resolved: {result.commentDetails.resolvedComments}</div>
                    <div>Unresolved: {result.commentDetails.unresolvedComments}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">File Information</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>Original Size: {dbCommentService.formatFileSize(result.originalFileSize)}</div>
                    <div>New Size: {dbCommentService.formatFileSize(result.fileSize)}</div>
                    <div>Size Change: {result.fileSize > result.originalFileSize ? '+' : ''}{dbCommentService.formatFileSize(result.fileSize - result.originalFileSize)}</div>
                  </div>
                </div>
              </div>
            </div>

            {generatedLink && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Shareable Link</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Link className="h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={window.location.origin + generatedLink}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                    <button
                      onClick={handleCopyLink}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        linkCopied 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {linkCopied ? (
                        <>
                          <CheckCircle className="h-4 w-4 inline mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 inline mr-1" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => window.open(window.location.origin + generatedLink, '_blank')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Link
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manage Documents Tab */}
        {activeTab === 'manage' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">My Commented Documents</h3>
              
              {userDocuments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>No documents found</p>
                  <p className="text-sm">Create your first commented document above</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userDocuments.map((doc) => (
                    <div key={doc._id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{doc.documentName}</h4>
                          <p className="text-sm text-gray-600">
                            Created: {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>{doc.totalComments} comments</span>
                            <span>{doc.totalThreads} threads</span>
                            <span>{doc.resolvedComments} resolved</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.isShared && doc.shareableLink && (
                            <button
                              onClick={() => window.open(window.location.origin + doc.shareableLink, '_blank')}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {activeTab === 'create' && (
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCreateDocument}
              disabled={!file || loading || comments.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
              {loading ? 'Creating Document...' : 'Create Document'}
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Reset
            </button>
          </div>
        )}

        {/* Reply Modal */}
        {selectedComment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                             <h3 className="text-lg font-medium text-gray-900 mb-4">
                 Reply to {selectedComment.authorName || selectedComment.author}
               </h3>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Enter your reply..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                rows={3}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => handleReplyToComment(selectedComment)}
                  disabled={!replyText.trim()}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Reply
                </button>
                <button
                  onClick={() => {
                    setSelectedComment(null);
                    setReplyText('');
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DBAddComments;
