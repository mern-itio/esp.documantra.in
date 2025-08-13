import { useState } from 'react';
import { 
  MessageCircle, 
  Reply, 
  Check, 
  MoreVertical,
  Paperclip,
  Send,
  AtSign
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import type { CommentReply, DocumentComment } from '../../common/types/collaboration';
import { formatDate } from '../../common/lib/utils';

interface CommentSystemProps {
  documentId: string;
  comments: DocumentComment[];
  onCommentAdd: (comment: Omit<DocumentComment, 'id' | 'timestamp'>) => void;
  onCommentResolve?: (commentId: string) => void;
  onReplyAdd?: (commentId: string, reply: Omit<CommentReply, 'id' | 'timestamp'>) => void;
}

export function CommentSystem({
  documentId,
  comments,
  onCommentAdd,
  onCommentResolve,
  onReplyAdd
}: CommentSystemProps) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showResolved, setShowResolved] = useState(false);

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

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+(?:\.\w+)*@\w+(?:\.\w+)+)/g;
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
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment... Use @email to mention someone"
            className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
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
        </div>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredComments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {showResolved ? 'No comments yet' : 'No unresolved comments'}
            </p>
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div
              key={comment.id}
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
                  {onCommentResolve && !comment.resolved && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCommentResolve(comment.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Comment Content */}
              <div className="mb-3">
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
              {replyingTo === comment.id ? (
                <div className="mt-3 space-y-2">
                  <Input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    className="text-sm"
                  />
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleAddReply(comment.id)}
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
                  onClick={() => setReplyingTo(comment.id)}
                  className="mt-2 h-6 px-2"
                >
                  <Reply className="w-3 h-3 mr-1" />
                  Reply
                </Button>
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
    </div>
  );
}