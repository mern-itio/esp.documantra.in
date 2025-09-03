import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Download,
  MessageSquare,
  Plus,
  Trash2,
  Eye,
  CheckCircle,
  Loader2,
  Reply,
  MessageCircle,
  ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import commentService from '../../services/commentService';
import type { 
  CommentRequest, 
  CommentResponse, 
  Comment, 
  // CommentOptions, 
  CommentLibrary,
  CommentThread,
  UserInfo,
  CommentPosition,
  CommentColor
} from '../../types/comments';

const AddComments: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CommentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'options' | 'preview' | 'results'>('options');
  
  // Comment management
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentLibrary, setCommentLibrary] = useState<CommentLibrary | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: 'John Doe',
    email: 'john.doe@example.com',
    id: 'user_001'
  });
  
  // UI state
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentColor, setNewCommentColor] = useState<CommentColor>('yellow');
  // const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentPosition, setCommentPosition] = useState<CommentPosition | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Options
  // const [options, setOptions] = useState<CommentOptions>({
  //   defaultColor: 'yellow',
  //   showResolved: true,
  //   sortBy: 'timestamp',
  //   groupByThread: true,
  //   autoSave: true,
  //   enableNotifications: true
  // });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load comment library on component mount
  useEffect(() => {
    const loadCommentLibrary = async () => {
      try {
        const library = await commentService.getCommentLibrary();
        setCommentLibrary(library);
      } catch (error) {
        console.error('Failed to load comment library:', error);
      }
    };

    loadCommentLibrary();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
      setResult(null);
      setComments([]);
      setPreviewUrl(null);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const handleAddComment = (position: CommentPosition) => {
    if (!newCommentText.trim()) {
      setError('Please enter comment text');
      return;
    }

    const newComment = commentService.createComment(
      newCommentText,
      position,
      userInfo.name,
      newCommentColor
    );

    setComments(prev => [...prev, newComment]);
    setNewCommentText('');
    // setShowCommentForm(false);
    setCommentPosition(null);
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

    const reply = commentService.createComment(
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

  const handleAddComments = async () => {
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

      const request: CommentRequest = {
        file,
        comments: comments.map(comment => ({
          text: comment.text,
          position: comment.position,
          color: comment.color,
          pageNumber: comment.pageNumber,
          parentId: comment.parentId,
          threadId: comment.threadId
        })),
        userInfo
      };

      const validation = commentService.validateRequest(request);
      if (!validation.valid) {
        setError(validation.message || 'Invalid request');
        return;
      }

      const response = await commentService.addComments(request);
      setResult(response);
      setActiveTab('results');
    } catch (err) {
      console.error('Error adding comments:', err);
      setError(err instanceof Error ? err.message : 'Failed to add comments');
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = async () => {
    if (!file || comments.length === 0) {
      setError('Please select a PDF file and add comments');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const request: CommentRequest = {
        file,
        comments: comments.map(comment => ({
          text: comment.text,
          position: comment.position,
          color: comment.color,
          pageNumber: comment.pageNumber,
          parentId: comment.parentId,
          threadId: comment.threadId
        })),
        userInfo
      };

      const response = await commentService.getPreview(request);
      setPreviewUrl(response.previewUrl || null);
      setActiveTab('preview');
    } catch (err) {
      console.error('Error generating preview:', err);
      setError('Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (result?.downloadUrl) {
      try {
        await commentService.downloadFile(result.downloadUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Download failed');
      }
    }
  };

  const handleReset = () => {
    setFile(null);
    setComments([]);
    setResult(null);
    setError(null);
    setActiveTab('options');
    setSelectedComment(null);
    setReplyText('');
    setNewCommentText('');
    setPreviewUrl(null);
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

  const threads = commentService.organizeCommentsIntoThreads(comments);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/pdf-tools" 
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to PDF Tools
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add Comments</h1>
          <p className="mt-2 text-gray-600">
            Add sticky notes and comments with threading to your PDF documents
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
              onClick={() => setActiveTab('options')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'options'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MessageSquare className="h-4 w-4 inline mr-2" />
              Comments
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'preview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Eye className="h-4 w-4 inline mr-2" />
              Preview
            </button>
            {result && (
              <button
                onClick={() => setActiveTab('results')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'results'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <CheckCircle className="h-4 w-4 inline mr-2" />
                Results
              </button>
            )}
          </nav>
        </div>

        {/* Options Tab */}
        {activeTab === 'options' && (
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position (Click on PDF to set)
                    </label>
                    <div className="text-sm text-gray-500">
                      {commentPosition 
                        ? `Page ${commentPosition.pageNumber}, X: ${commentPosition.x}, Y: ${commentPosition.y}`
                        : 'Click on the PDF preview to set comment position'
                      }
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (commentPosition) {
                        handleAddComment(commentPosition);
                      } else {
                        // Default position for demo
                        handleAddComment({
                          x: 100,
                          y: 100,
                          pageNumber: 1
                        });
                      }
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

            {/* Right Column - Comments List */}
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
                              <div className="text-sm font-medium">{thread.rootComment.author}</div>
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
                                    <div className="font-medium">{reply.author}</div>
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

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Comment Preview</h3>
            
            {previewUrl ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Preview Generated Successfully!</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    This shows how your PDF will look with the comments applied.
                  </p>
                </div>
                
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <iframe
                    src={previewUrl}
                    className="w-full h-96"
                    title="Commented PDF Preview"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Eye className="h-5 w-5" />
                    <span className="font-medium">Generate Preview</span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    Click the "Preview" button to see how your PDF will look with the comments applied.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Comments added successfully!</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Comment Details</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Total Comments: {result.commentDetails.totalComments}</div>
                  <div>Total Threads: {result.commentDetails.totalThreads}</div>
                  <div>Resolved: {result.commentDetails.resolvedComments}</div>
                  <div>Unresolved: {result.commentDetails.unresolvedComments}</div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">File Information</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Original Size: {commentService.formatFileSize(result.originalFileSize)}</div>
                  <div>New Size: {commentService.formatFileSize(result.fileSize)}</div>
                  <div>Size Change: {result.fileSize > result.originalFileSize ? '+' : ''}{commentService.formatFileSize(result.fileSize - result.originalFileSize)}</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {activeTab !== 'results' && (
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleAddComments}
              disabled={!file || loading || comments.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
              {loading ? 'Adding Comments...' : 'Add Comments'}
            </button>

            <button
              onClick={generatePreview}
              disabled={!file || loading || comments.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Eye className="h-4 w-4" />
              Preview
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
                Reply to {selectedComment.author}
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

export default AddComments;
