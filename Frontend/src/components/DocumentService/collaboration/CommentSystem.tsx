import { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Reply, 
  Check, 
  MoreVertical,
  // Paperclip,
  Send,
  AtSign,
  Edit3,
  Trash2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar } from '../../common/Avatar';
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
  // Version tracking
  currentVersion?: string;
  versions?: Array<{ id: string; version: string; description: string }>;
  onVersionChange?: (versionId: string) => void;
}

export function CommentSystem({
  documentId,
  comments,
  onCommentAdd,
  onCommentResolve,
  onReplyAdd,
  isLoading = false,
  canAddComments = true,
  currentVersion,
  versions,
  onVersionChange
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
  const [selectedVersion, setSelectedVersion] = useState<string>(currentVersion || 'all');
  const menuRef = useRef<HTMLDivElement>(null);

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Omit<DocumentComment, 'id' | 'timestamp'> = {
      documentId,
      author: 'current-user@example.com',
      authorName: 'Current User',
      authorAvatar: '', // We'll use Avatar component instead
      content: newComment,
      position: { page: 1, x: 100, y: 100 },
      replies: [],
      resolved: false,
      mentions: extractMentions(newComment),
      // Include version information if available
      versionId: selectedVersion !== 'all' ? {
        _id: selectedVersion,
        version: versions?.find(v => v.id === selectedVersion)?.version || 'Unknown',
        description: versions?.find(v => v.id === selectedVersion)?.description || '',
        createdAt: new Date().toISOString()
      } : undefined,
      versionNumber: selectedVersion !== 'all' ? versions?.find(v => v.id === selectedVersion)?.version : undefined,
      versionDescription: selectedVersion !== 'all' ? versions?.find(v => v.id === selectedVersion)?.description : undefined
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
      authorAvatar: '', // We'll use Avatar component instead
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

  // Filter comments by version if a specific version is selected
  const getFilteredComments = () => {
    let filtered = comments;
    
    // Filter by version if not showing all
    if (selectedVersion !== 'all') {
      filtered = filtered.filter(comment => 
        comment.versionId?._id === selectedVersion || 
        comment.versionNumber === selectedVersion
      );
    }
    
    // Filter by resolved status
    if (!showResolved) {
      filtered = filtered.filter(comment => !comment.resolved);
    }
    
    return filtered;
  };

  const filteredComments = getFilteredComments();

  return (
    <div className="h-full flex flex-col bg-muted/30">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Comments</h3>
            {/* Version Summary */}
            {versions && versions.length > 0 && (
              <div className="flex items-center space-x-2 mt-1 flex-wrap gap-1">
                <span className="text-xs text-muted-foreground">Comments by version:</span>
                {versions.map((version) => {
                  const versionCommentCount = comments.filter(c => 
                    c.versionId?._id === version.id || c.versionNumber === version.version
                  ).length;
                  return (
                    <span key={version.id} className="text-xs text-foreground bg-muted px-2 py-1 rounded-md">
                      {version.version}: {versionCommentCount}
                    </span>
                  );
                })}
                <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-md">
                  Total: {comments.length}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* Version Selector */}
            {versions && versions.length > 0 && (
              <select
                value={selectedVersion}
                onChange={(e) => {
                  const version = e.target.value;
                  setSelectedVersion(version);
                  if (onVersionChange && version !== 'all') {
                    onVersionChange(version);
                  }
                }}
                className="px-3 py-1 border border-input rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="all">All Versions</option>
                {versions.map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.version} - {version.description}
                  </option>
                ))}
              </select>
            )}
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
                className="w-full p-3 border border-input rounded-lg resize-none bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                rows={3}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {/* <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowAttachmentPicker(true)}
                    type="button"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button> */}
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
            <div className="text-center py-4 text-muted-foreground">
              You do not have permission to add comments.
            </div>
          )}
        </div>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading comments...</p>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {showResolved ? 'No comments yet' : 'No unresolved comments'}
            </p>
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div
              key={comment._id || comment.id}
              className={`bg-card text-card-foreground rounded-lg border border-border p-4 ${
                comment.resolved ? 'opacity-60' : ''
              }`}
            >
              {/* Comment Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Avatar
                    name={comment.authorName}
                    email={comment.author}
                    size="md"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {comment.authorName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(comment.timestamp)}
                    </span>
                    {/* Version Information */}
                    {comment.versionId && (
                      <div className="flex items-center space-x-1 mt-1">
                        <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                          Version: {comment.versionId.version || comment.versionNumber || 'Unknown'}
                        </span>
                        {comment.versionId.description && (
                          <span className="text-xs text-muted-foreground">
                            - {comment.versionId.description}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
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
                      <div className="absolute right-0 top-8 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg z-10 min-w-32">
                        {canAddComments && (
                          <button
                            onClick={() => {
                              const commentId = comment._id || comment.id;
                              if (commentId) {
                                handleEditComment(commentId, comment.content);
                                setShowCommentMenu(null);
                              }
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-accent flex items-center space-x-2"
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
                            className="w-full text-left px-4 py-2 hover:bg-accent text-destructive flex items-center space-x-2"
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
                      className="w-full p-2 border border-input rounded-md resize-none bg-background text-foreground"
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
                    <p className="text-sm text-foreground">{comment.content}</p>
                    {comment.mentions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {comment.mentions.map((mention, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
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
                <div className="space-y-2 ml-4 border-l-2 border-border pl-4">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="bg-muted/50 rounded-md p-2">
                      <div className="flex items-center space-x-2 mb-1">
                        <Avatar
                          name={reply.authorName}
                          email={reply.author}
                          size="sm"
                        />
                        <span className="text-xs font-medium text-foreground">
                          {reply.authorName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(reply.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-foreground">{reply.content}</p>
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
                <div className="mt-2 inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300 text-xs rounded-full">
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
        <div className="fixed inset-0 bg-black/50 dark:bg-black/60 flex items-center justify-center z-50">
          <div className="bg-card text-card-foreground border border-border rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Mention Someone</h3>
            <input
              type="text"
              placeholder="Enter email..."
              value={mentionSearch}
              onChange={(e) => setMentionSearch(e.target.value)}
              className="w-full p-2 border border-input rounded-md mb-4 bg-background text-foreground"
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
        <div className="fixed inset-0 bg-black/50 dark:bg-black/60 flex items-center justify-center z-50">
          <div className="bg-card text-card-foreground border border-border rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Add Attachment</h3>
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleAttachmentSelect(file);
                }
              }}
              className="w-full p-2 border border-input rounded-md mb-4 bg-background text-sm text-foreground"
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