import { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Reply, 
  Check, 
  MoreVertical,
  Paperclip,
  Send,
  AtSign,
  Edit3,
  Trash2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import type { CommentReply, DocumentComment } from '../../common/types/collaboration';
import { formatDate } from '../../common/lib/utils';
import { commentAPI } from '../../../services/api';

interface CommentSystemProps {
  documentId: string;
  comments: DocumentComment[];
  onCommentAdd: (comment: Omit<DocumentComment, 'id' | 'timestamp'>) => void;
  onCommentResolve?: (commentId: string) => void;
  onReplyAdd?: (commentId: string, reply: Omit<CommentReply, 'id' | 'timestamp'>) => void;
  isLoading?: boolean;
  canAddComments?: boolean;
}

export function CommentSystem({
  documentId,
  comments,
  onCommentAdd,
  onCommentResolve,
  onReplyAdd,
  isLoading = false,
  canAddComments = true
}: CommentSystemProps) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showResolved, setShowResolved] = useState(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [showCommentMenu, setShowCommentMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Omit<DocumentComment, 'id' | 'timestamp'> = {
      documentId,
      author: 'current-user@example.com',
      authorName: 'Current User',
      authorAvatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop',
      content: newComment,
      position: { page: 1, x: 100, y: 100 },
      replies: [],
      resolved: false,
      mentions: extractMentions(newComment)
    };

    onCommentAdd(comment);
    setNewComment('');
  };

  const handleMentionSelect = (email: string) => {
    const beforeMention = newComment.substring(0, newComment.lastIndexOf('@'));
    const afterMention = newComment.substring(newComment.lastIndexOf('@') + mentionSearch.length + 1);
    setNewComment(beforeMention + '@' + email + ' ' + afterMention);
    setShowMentionPicker(false);
    setMentionSearch('');
  };

  const handleAttachmentSelect = (file: File) => {
    // For now, just add a placeholder. You can implement actual file upload later
    const attachmentText = `[Attachment: ${file.name}]`;
    setNewComment(prev => prev + ' ' + attachmentText);
    setShowAttachmentPicker(false);
  };

  const handleEditComment = (commentId: string, currentContent: string) => {
    setEditingComment(commentId);
    setEditCommentText(currentContent);
  };

  const handleSaveEdit = async (commentId: string) => {
    try {
      // Call the update comment API
      const response = await commentAPI.updateComment(commentId, {
        content: editCommentText,
        mentions: extractMentions(editCommentText)
      });
      
      if (response.success) {
        // Reload comments to get the updated list
        // You'll need to pass a reload function from parent
        setEditingComment(null);
        setEditCommentText('');
        // Trigger comment reload
        window.location.reload(); // Temporary solution - replace with proper reload
      }
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        // Call the delete comment API
        const response = await commentAPI.deleteComment(commentId);
        
        if (response.success) {
          // Reload comments to get the updated list
          // You'll need to pass a reload function from parent
          window.location.reload(); // Temporary solution - replace with proper reload
        }
      } catch (error) {
        console.error('Failed to delete comment:', error);
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowCommentMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown when pressing Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowCommentMenu(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleAddReply = (commentId: string) => {
    if (!replyText.trim() || !onReplyAdd) return;

    const reply: Omit<CommentReply, 'id' | 'timestamp'> = {
      author: 'current-user@example.com',
      authorName: 'Current User',
      authorAvatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop',
      content: replyText,
      mentions: extractMentions(replyText)
    };

    onReplyAdd(commentId, reply);
    setReplyText('');
    setReplyingTo(null);
  };

  const handleReplyTextChange = (value: string) => {
    setReplyText(value);
    
    // Auto-show mention picker when @ is typed in reply
    if (value.includes('@') && !value.includes('@ ')) {
      const lastAtSymbol = value.lastIndexOf('@');
      const afterAt = value.substring(lastAtSymbol + 1);
      if (afterAt && !afterAt.includes(' ')) {
        setMentionSearch(afterAt);
        setShowMentionPicker(true);
      }
    }
  };

  const extractMentions = (text: string): string[] => {
    // Extract mentions like @username or @email
    const mentionRegex = /@(\w+(?:[.-]\w+)*@\w+(?:[.-]\w+)*\.\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  const filteredComments = showResolved 
    ? comments 
    : comments.filter(comment => !comment.resolved);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResolved(!showResolved)}
            >
              {showResolved ? 'Hide Resolved' : 'Show Resolved'}
            </Button>
          </div>
        </div>

        {/* New Comment Input */}
        <div className="space-y-2">
          {canAddComments && (
            <>
              <textarea
                value={newComment}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewComment(value);
                  
                  // Auto-show mention picker when @ is typed
                  if (value.includes('@') && !value.includes('@ ')) {
                    const lastAtSymbol = value.lastIndexOf('@');
                    const afterAt = value.substring(lastAtSymbol + 1);
                    if (afterAt && !afterAt.includes(' ')) {
                      setMentionSearch(afterAt);
                      setShowMentionPicker(true);
                    }
                  }
                }}
                placeholder="Add a comment... Use @email to mention someone"
                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowAttachmentPicker(true)}
                    type="button"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowMentionPicker(true)}
                    type="button"
                  >
                    <AtSign className="w-4 h-4" />
                  </Button>
                </div>
                <Button 
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  size="sm"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Comment
                </Button>
              </div>
            </>
          )}
          {!canAddComments && (
            <div className="text-center py-4 text-gray-500">
              You do not have permission to add comments.
            </div>
          )}
        </div>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading comments...</p>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {showResolved ? 'No comments yet' : 'No unresolved comments'}
            </p>
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div
              key={comment._id || comment.id}
              className={`bg-white rounded-lg border p-4 ${
                comment.resolved ? 'opacity-60' : ''
              }`}
            >
              {/* Comment Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <img
                    src={comment.authorAvatar}
                    alt={comment.authorName}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {comment.authorName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(comment.timestamp)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  {onCommentResolve && !comment.resolved && canAddComments && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const commentId = comment._id || comment.id;
                        if (commentId) {
                          onCommentResolve(commentId);
                        }
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                  )}
                  <div className="relative" ref={menuRef}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        const commentId = comment._id || comment.id;
                        if (commentId) {
                          setShowCommentMenu(showCommentMenu === commentId ? null : commentId);
                        }
                      }}
                    >
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                    
                    {/* Dropdown Menu */}
                    {showCommentMenu === (comment._id || comment.id || '') && (
                      <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-10 min-w-32">
                        {canAddComments && (
                          <button
                            onClick={() => {
                              const commentId = comment._id || comment.id;
                              if (commentId) {
                                handleEditComment(commentId, comment.content);
                                setShowCommentMenu(null);
                              }
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2"
                          >
                            <Edit3 className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                        )}
                        {canAddComments && (
                          <button
                            onClick={() => {
                              const commentId = comment._id || comment.id;
                              if (commentId) {
                                handleDeleteComment(commentId);
                                setShowCommentMenu(null);
                              }
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 flex items-center space-x-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Comment Content */}
              <div className="mb-3">
                {editingComment === (comment._id || comment.id) ? (
                  <div className="space-y-2">
                    <textarea
                      value={editCommentText}
                      onChange={(e) => setEditCommentText(e.target.value)}
                      className="w-full p-2 border rounded resize-none"
                      rows={3}
                    />
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => {
                          const commentId = comment._id || comment.id;
                          if (commentId) {
                            handleSaveEdit(commentId);
                          }
                        }}
                      >
                        Save
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setEditingComment(null);
                          setEditCommentText('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                    {comment.mentions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {comment.mentions.map((mention, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            @{mention}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Replies */}
              {comment.replies.length > 0 && (
                <div className="space-y-2 ml-4 border-l-2 border-gray-100 pl-4">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="bg-gray-50 rounded p-2">
                      <div className="flex items-center space-x-2 mb-1">
                        <img
                          src={reply.authorAvatar}
                          alt={reply.authorName}
                          className="w-4 h-4 rounded-full"
                        />
                        <span className="text-xs font-medium text-gray-900">
                          {reply.authorName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(reply.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Input */}
              {canAddComments && (
                <>
                  {replyingTo === (comment._id || comment.id) ? (
                    <div className="mt-3 space-y-2">
                      <Input
                        value={replyText}
                        onChange={(e) => handleReplyTextChange(e.target.value)}
                        placeholder="Write a reply... Use @email to mention someone"
                        className="text-sm"
                      />
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            const commentId = comment._id || comment.id;
                            if (commentId) {
                              handleAddReply(commentId);
                            }
                          }}
                          disabled={!replyText.trim()}
                        >
                          Reply
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReplyingTo(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const commentId = comment._id || comment.id;
                        if (commentId) {
                          setReplyingTo(commentId);
                        }
                      }}
                      className="mt-2 h-6 px-2"
                    >
                      <Reply className="w-3 h-3 mr-1" />
                      Reply
                    </Button>
                  )}
                </>
              )}

              {/* Resolved Badge */}
              {comment.resolved && (
                <div className="mt-2 inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  <Check className="w-3 h-3 mr-1" />
                  Resolved
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Mention Picker Modal */}
      {showMentionPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Mention Someone</h3>
            <input
              type="text"
              placeholder="Enter email..."
              value={mentionSearch}
              onChange={(e) => setMentionSearch(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            />        
            <div className="flex justify-end mt-4 space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowMentionPicker(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (mentionSearch.trim()) {
                    handleMentionSelect(mentionSearch.trim());
                  }
                }}
                disabled={!mentionSearch.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Picker Modal */}
      {showAttachmentPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add Attachment</h3>
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleAttachmentSelect(file);
                }
              }}
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end mt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowAttachmentPicker(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}