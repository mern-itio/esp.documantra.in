import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Plus,
  Reply,
  CheckCircle,
  Loader2,
  Share2,
  Download,
  Eye,
  AlertCircle
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import dbCommentService, { type DBCommentDocument } from '../../services/dbCommentService';
import type { 
  Comment, 
  CommentPosition,
  CommentColor,
  UserInfo
} from '../../types/comments';
import { pdfApi } from '../../services/apiHelper';

const SharedDocumentViewer: React.FC = () => {
  const { linkToken } = useParams<{ linkToken: string }>();
  const navigate = useNavigate();
  
  const [document, setDocument] = useState<DBCommentDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingComment, setAddingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  
  // New comment form
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentColor, setNewCommentColor] = useState<CommentColor>('yellow');
  const [commentPosition, setCommentPosition] = useState<CommentPosition | null>(null);
  
  // Reply form
  const [replyText, setReplyText] = useState('');
  
  // User info for comments
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: 'Anonymous',
    email: '',
    id: 'anonymous'
  });

  useEffect(() => {
    if (linkToken) {
      loadDocument();
      loadUserInfo();
    }
  }, [linkToken]);

  const loadUserInfo = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUserInfo({
          name: parsedUser.fullname || parsedUser.name || 'Anonymous',
          email: parsedUser.email || '',
          id: parsedUser.id || 'anonymous'
        });
        console.log('Loaded user info from localStorage:', {
          name: parsedUser.fullname || parsedUser.name || 'Anonymous',
          email: parsedUser.email || '',
          id: parsedUser.id || 'anonymous'
        });
      } else {
        console.log('No user data found in localStorage, using anonymous');
      }
    } catch (error) {
      console.error('Error loading user info from localStorage:', error);
    }
  };

  const loadDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const doc = await dbCommentService.getDocumentByLink(linkToken!);
      
      // Ensure all comments have proper Date objects
      const processedDoc = {
        ...doc,
        comments: doc.comments.map(comment => ({
          ...comment,
          timestamp: new Date(comment.timestamp),
          replies: comment.replies.map(reply => ({
            ...reply,
            timestamp: new Date(reply.timestamp)
          }))
        }))
      };
      
      setDocument(processedDoc);
    } catch (err) {
      console.error('Failed to load document:', err);
      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (position?: CommentPosition) => {
    const finalPosition = position || commentPosition;
    
    if (!newCommentText.trim() || !finalPosition || !linkToken) {
      setError('Please enter comment text and select a position');
      return;
    }

    try {
      setAddingComment(true);
      setError(null);

      console.log('Adding comment with:', {
        linkToken,
        text: newCommentText,
        position: finalPosition,
        color: newCommentColor,
        authorInfo: userInfo
      });

      const result = await dbCommentService.addComment(linkToken, {
        text: newCommentText,
        position: finalPosition,
        color: newCommentColor,
        authorInfo: userInfo
      });

      console.log('Comment added successfully:', result);

      // Update local state
      if (document) {
        // Ensure the new comment has proper Date objects
        const newComment = {
          ...result.comment,
          timestamp: new Date(result.comment.timestamp)
        };
        
        setDocument({
          ...document,
          comments: [...document.comments, newComment],
          totalComments: result.totalComments
        });
      }

      setNewCommentText('');
      setCommentPosition(null);
    } catch (err) {
      console.error('Failed to add comment:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        response: (err as any)?.response?.data,
        status: (err as any)?.response?.status
      });
      setError(err instanceof Error ? err.message : 'Failed to add comment');
    } finally {
      setAddingComment(false);
    }
  };

  const handleReplyToComment = async (parentComment: Comment) => {
    if (!replyText.trim() || !linkToken) {
      setError('Please enter reply text');
      return;
    }

    try {
      setAddingComment(true);
      setError(null);

      const result = await dbCommentService.replyToComment(
        linkToken,
        parentComment.id,
        replyText,
        userInfo
      );

      // Update local state
      if (document) {
        // Ensure the new reply has proper Date objects
        const newReply = {
          ...result.reply,
          timestamp: new Date(result.reply.timestamp)
        };
        
        const updatedComments = document.comments.map(comment => 
          comment.id === parentComment.id 
            ? { ...comment, replies: [...comment.replies, newReply] }
            : comment
        );
        
        setDocument({
          ...document,
          comments: updatedComments,
          totalComments: result.totalComments
        });
      }

      setReplyText('');
      setReplyingTo(null);
    } catch (err) {
      console.error('Failed to reply to comment:', err);
      setError(err instanceof Error ? err.message : 'Failed to reply to comment');
    } finally {
      setAddingComment(false);
    }
  };

  const handleToggleResolution = async (comment: Comment) => {
    if (!linkToken) return;

    try {
      const result = await dbCommentService.toggleCommentResolution(
        linkToken,
        comment.id,
        !comment.isResolved,
        userInfo
      );

      // Update local state
      if (document) {
        const updatedComments = document.comments.map(c => 
          c.id === comment.id ? result.comment : c
        );
        
        setDocument({
          ...document,
          comments: updatedComments,
          totalComments: result.totalComments
        });
      }
    } catch (err) {
      console.error('Failed to toggle comment resolution:', err);
      setError(err instanceof Error ? err.message : 'Failed to update comment');
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

  const threads = document ? dbCommentService.organizeCommentsIntoThreads(document.comments) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F2EE] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-[#F5F2EE] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Document Not Found</h2>
          <p className="text-gray-600 mb-4">
            {error || 'The document you\'re looking for doesn\'t exist or the link has expired.'}
          </p>
          <button
            onClick={() => navigate('/pdf-tools')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to PDF Tools
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2EE]">
      {/* Header */}
      <div className="bg-[#F7F3EE] shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{document.documentName}</h1>
              <p className="text-sm text-gray-600">
                Shared by {document.ownerName} • {document.totalComments} comments
              </p>
            </div>
            <div className="flex items-center gap-4">
              {document.downloadUrl && (
                <button
                  onClick={() => window.open(`${pdfApi.defaults.baseURL}${document.downloadUrl}`, '_blank')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
              )}
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">Shared Document</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - PDF Preview */}
          <div className="lg:col-span-2">
            <div className="bg-[#F7F3EE] rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Document Preview</h3>
              {document.previewUrl ? (
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <iframe
                    src={`${pdfApi.defaults.baseURL}${document.previewUrl}`}
                    className="w-full h-96"
                    title="Commented PDF Preview"
                    onLoad={() => console.log('PDF iframe loaded successfully')}
                    onError={(e) => console.error('PDF iframe error:', e)}
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <Eye className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">PDF preview not available</p>
                  <p className="text-sm text-gray-500 mt-2">
                    The document preview could not be loaded
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Comments and Forms */}
          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-[#F7F3EE] rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={userInfo.name}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      userInfo.id !== 'anonymous' ? 'bg-[#F5F2EE]' : ''
                    }`}
                    readOnly={userInfo.id !== 'anonymous'}
                    placeholder={userInfo.id === 'anonymous' ? 'Enter your name' : 'Logged in user'}
                  />
                  {userInfo.id !== 'anonymous' && (
                    <p className="text-xs text-gray-500 mt-1">Logged in as: {userInfo.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email (optional)</label>
                  <input
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      userInfo.id !== 'anonymous' ? 'bg-[#F5F2EE]' : ''
                    }`}
                    readOnly={userInfo.id !== 'anonymous'}
                    placeholder={userInfo.id === 'anonymous' ? 'Enter your email' : 'Logged in user email'}
                  />
                </div>
              </div>
            </div>

            {/* Add Comment Form */}
            {document.allowComments && (
              <div className="bg-[#F7F3EE] rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add Comment</h3>
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
                      const position = {
                        x: 100,
                        y: 100,
                        pageNumber: 1
                      };
                      console.log('Setting comment position:', position);
                      handleAddComment(position);
                    }}
                    disabled={!newCommentText.trim() || addingComment}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {addingComment ? (
                      <>
                        <Loader2 className="h-4 w-4 inline mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 inline mr-2" />
                        Add Comment
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Comments List */}
            <div className="bg-[#F7F3EE] rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Comments ({document.totalComments})
              </h3>
              {threads.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>No comments yet</p>
                  <p className="text-sm">Be the first to add a comment!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {threads.map((thread) => (
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
                              onClick={() => handleToggleResolution(thread.rootComment)}
                              className={`p-1 rounded ${
                                thread.rootComment.isResolved 
                                  ? 'bg-green-100 text-green-600' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                              title={thread.rootComment.isResolved ? 'Resolved' : 'Mark as resolved'}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            {document.allowComments && (
                              <button
                                onClick={() => setReplyingTo(thread.rootComment)}
                                className="p-1 rounded bg-blue-100 text-blue-600"
                                title="Reply"
                              >
                                <Reply className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Replies */}
                      {thread.replies.length > 0 && (
                        <div className="mt-2 ml-4 space-y-2">
                          {thread.replies.map((reply) => (
                                                           <div key={reply.id} className={`p-2 rounded text-sm ${getColorClass(reply.color)}`}>
                                 <div className="flex items-start justify-between">
                                   <div className="flex-1">
                                     <div className="font-medium">{reply.authorName || reply.author}</div>
                                     <div>{reply.text}</div>
                                   </div>
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
          </div>
        </div>
      </div>

      {/* Reply Modal */}
      {replyingTo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#F7F3EE] rounded-lg p-6 w-full max-w-md">
                         <h3 className="text-lg font-medium text-gray-900 mb-4">
               Reply to {replyingTo.authorName || replyingTo.author}
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
                onClick={() => handleReplyToComment(replyingTo)}
                disabled={!replyText.trim() || addingComment}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {addingComment ? 'Replying...' : 'Reply'}
              </button>
              <button
                onClick={() => {
                  setReplyingTo(null);
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
  );
};

export default SharedDocumentViewer;
