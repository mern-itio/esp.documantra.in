import { useState, useEffect } from 'react';
import { 
  Users, 
  MessageCircle, 
  Edit3, 
  Save, 
  Eye,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { PresenceIndicator } from './PresenceIndicator';
import { CommentSystem } from './CommentSystem';
import type { CollaborativeUser, DocumentComment, CommentReply } from '../../common/types/collaboration';
import { formatDate } from '../../common/lib/utils';

interface CollaborativeEditorProps {
  documentId: string;
  content: string;
  activeUsers: CollaborativeUser[];
  comments: DocumentComment[];
  onReplyAdd: (commentId: string, reply: Omit<CommentReply, 'id' | 'timestamp'>) => void;
  onCommentResolve?: (commentId: string) => void;
  isEditable: boolean;
  document?: any; // Add document for owner information
  onContentChange: (content: string) => void;
  onCommentAdd: (comment: Omit<DocumentComment, 'id' | 'timestamp'>) => void;
  canAddComments?: boolean;
  isLoadingComments?: boolean;
}

export function CollaborativeEditor({
  documentId,
  content,
  activeUsers,
  comments,
  isEditable,
  onContentChange,
  onCommentAdd,
  onReplyAdd,
  onCommentResolve,
  canAddComments = true,
  isLoadingComments = false
}: CollaborativeEditorProps) {
  const [localContent, setLocalContent] = useState(content);
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const handleContentChange = (newContent: string) => {
    setLocalContent(newContent);
    setHasUnsavedChanges(newContent !== content);
  };

  const handleSave = async () => {
    try {
      // Call the onContentChange callback to save to database
      await onContentChange(localContent);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save content:', error);
    }
  };

  // const handleSave = () => {
  //   onContentChange(localContent);
  //   setHasUnsavedChanges(false);
  //   setLastSaved(new Date());
  // };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">
              {activeUsers.length} shared collaborator{activeUsers.length !== 1 ? 's' : ''}
            </span>
            </div>
            
            <PresenceIndicator users={activeUsers} />
            
            {/* Show collaborator details on hover */}
            <div className="relative group">
              <div className="text-xs text-gray-500 cursor-help">
                ℹ️
              </div>
              <div className="absolute bottom-top left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 min-w-[200px]">
                <div className="font-medium mb-1">Shared Collaborators:</div>
                {activeUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2 py-1">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: user.color }}
                    />
                    <span className="truncate">{user.name}</span>
                    <span className="text-gray-300">(Shared)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Save Status */}
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            {hasUnsavedChanges ? (
              <>
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Unsaved changes</span>
              </>
            ) : lastSaved ? (
              <>
                <Clock className="w-4 h-4 text-green-500" />
                <span>Saved {formatDate(lastSaved.toISOString())}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>All changes saved</span>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="relative"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Comments
            {comments.filter(c => !c.resolved).length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {comments.filter(c => !c.resolved).length}
              </span>
            )}
          </Button>

          {isEditable && (
            <>
              {isEditing ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleEditing}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </>
          )}

          {!isEditable && (
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              View Only
            </Button>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Editor */}
        <div className="flex-1 p-4">
          {isEditing ? (
            <textarea
              value={localContent}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full h-full resize-none border-0 focus:outline-none focus:ring-0 text-sm font-mono"
              placeholder="Start typing your document content..."
            />
          ) : (
            <div className="w-full h-full overflow-auto">            
                
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {localContent || 'No content available'}
                </div>
              </div>
          )}
        </div>

        {/* Comments Sidebar */}
        {showComments && (
          <div className="w-80 border-l border-gray-200">
            <CommentSystem
              documentId={documentId}
              comments={comments}
              onCommentAdd={onCommentAdd}
              onReplyAdd={onReplyAdd}
              onCommentResolve={onCommentResolve}
              isLoading={isLoadingComments}
              canAddComments={canAddComments}
            />
          </div>
        )}
      </div>

      {/* Real-time Activity Indicator */}
      {activeUsers.some(user => user.isTyping) && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <span className="text-sm text-gray-600">
              {activeUsers
                .filter(user => user.isTyping)
                .map(user => user.name)
                .join(', ')} {activeUsers.filter(user => user.isTyping).length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}