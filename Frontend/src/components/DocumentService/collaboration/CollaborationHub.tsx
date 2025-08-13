import { useState, useEffect } from 'react';
import { X, Users, MessageCircle, GitBranch, Workflow, Brain, Settings } from 'lucide-react';
import type { Document } from '../../common/types';
import { documentAPI, commentAPI, versionAPI, workflowAPI } from '../../../services/api';
import type { DocumentComment, CollaborativeUser } from '../../common/types/collaboration';
import { useAuth } from '../../AuthService/AuthContext';

import { Button } from '../ui/button';
import { CollaborativeEditor } from './CollaborativeEditor';
import { CommentSystem } from './CommentSystem';
import { VersionManager } from '../version/VersionManager';
import { WorkflowManager } from '../workflow/WorkflowManager';
import { DocumentProcessor } from '../processing/DocumentProcessor';
import { useCollaborationStore } from '../../common/store/collaborationStore';

interface CollaborationHubProps {
  document: Document;
  onClose: () => void;
}

type TabType = 'editor' | 'comments' | 'versions' | 'workflows' | 'analysis';

export function CollaborationHub({ document, onClose }: CollaborationHubProps) {
  const [activeTab, setActiveTab] = useState<TabType>('editor');
  const [documentContent, setDocumentContent] = useState<string>('');
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [comments, setComments] = useState<DocumentComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [versions, setVersions] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  // const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(true);
  // const [isLoadingVersions, setIsLoadingVersions] = useState(true);
  
  const { user } = useAuth();
  
  const {
    getDocumentAnalysis,
    compareVersions,
    restoreVersion,
    processDocument
  } = useCollaborationStore();

  // Get real collaborators from document data (only shared users, not owner)
  const getRealCollaborators = (): CollaborativeUser[] => {
    const collaborators: CollaborativeUser[] = [];
    
    // Only add shared collaborators, NOT the owner
    if (document.sharedWith && Array.isArray(document.sharedWith)) {
      document.sharedWith.forEach(share => {
        collaborators.push({
          id: share.userId || share.email,
          email: share.userId || share.email,
          name: share.userId || share.email,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(share.userId || share.email)}&background=10b981&color=ffffff`,
          lastActivity: share.createdAt || new Date().toISOString(),
          isTyping: false,
          color: '#10b981'
        });
      });
    }
    
    return collaborators;
  };

  const activeUsers = getRealCollaborators();
  
  // Debug logging
  // console.log('🔍 Document sharedWith:', document.sharedWith);
  // console.log('🔍 Active users (shared collaborators):', activeUsers);
  // console.log('🔍 Document owner:', document.ownerId || document.uploadedBy);
  
  const analysis = getDocumentAnalysis(document.id);

  // Load document content and comments when component mounts
  useEffect(() => {
    loadDocumentContent();
    loadComments();
    loadVersions();
    loadWorkflows();
  }, [document.id]);

  const loadDocumentContent = async () => {
    try {
      setIsLoadingContent(true);
      const response = await documentAPI.getDocument(document.id);
      if (response.success && response.data.content) {
        setDocumentContent(response.data.content);
      } else {
        // Generate placeholder content based on document type
        setDocumentContent(generatePlaceholderContent(document));
      }
    } catch (error) {
      console.error('Failed to load document content:', error);
      setDocumentContent(generatePlaceholderContent(document));
    } finally {
      setIsLoadingContent(false);
    }
  };

  const loadComments = async () => {
    try {
      setIsLoadingComments(true);
      console.log('🔍 Loading comments for document:', document.id);
      const response = await commentAPI.getDocumentComments(document.id);
      if (response.success) {
        console.log('🔍 Comments loaded successfully:', response.data);
        setComments(response.data);
      } else {
        console.log('❌ Failed to load comments:', response);
        setComments([]);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const loadVersions = async () => {
    try {
      // setIsLoadingVersions(true);
      console.log('🔍 Loading versions for document:', document.id);
      const response = await versionAPI.getDocumentVersions(document.id);
      if (response.success) {
        console.log('🔍 Versions loaded successfully:', response.data);
        setVersions(response.data);
      } else {
        console.log('❌ Failed to load versions:', response);
        setVersions([]);
      }
    } catch (error) {
      console.error('Failed to load versions:', error);
      setVersions([]);
    } 
  };

  const loadWorkflows = async () => {
    try {
      // setIsLoadingWorkflows(true);
      console.log('🔍 Loading workflows for document:', document.id);
      const response = await workflowAPI.getDocumentWorkflows(document.id);
      if (response.success) {
        console.log('🔍 Workflows loaded successfully:', response.data);
        setWorkflows(response.data);
      } else {
        console.log('❌ Failed to load workflows:', response);
        setWorkflows([]);
      }
    } catch (error) {
      console.error('Failed to load workflows:', error);
      setWorkflows([]);
    }
  };

  // Workflow management functions
  const handleCreateWorkflow = async (workflow: any) => {
    try {
      const response = await workflowAPI.createWorkflow(document.id, workflow);
      if (response.success) {
        // console.log('✅ Workflow created successfully');
        await loadWorkflows(); // Reload workflows
      } else {
        console.error('❌ Failed to create workflow:', response.message);
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
    }
  };

  const handleUpdateWorkflow = async (workflowId: string, updates: any) => {
    try {
      const response = await workflowAPI.updateWorkflow(workflowId, updates);
      if (response.success) {
        // console.log('✅ Workflow updated successfully');
        await loadWorkflows(); // Reload workflows
      } else {
        console.error('❌ Failed to update workflow:', response.message);
      }
    } catch (error) {
      console.error('Error updating workflow:', error);
    }
  };

  const handleCompleteWorkflowStep = async () => {
    try {
      // This will be handled by the WorkflowManager component
      await loadWorkflows(); // Reload workflows after step completion
    } catch (error) {
      console.error('Error completing workflow step:', error);
    }
  };

  const handleAddComment = async (comment: Omit<DocumentComment, 'id' | 'timestamp'>) => {
    try {
      const response = await commentAPI.createComment(document.id, {
        content: comment.content,
        position: comment.position,
        mentions: comment.mentions,
        attachments: comment.attachments
      });
      
      if (response.success) {
        // Reload comments to get the updated list
        await loadComments();
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleResolveComment = async (commentId: string) => {
    try {
      // console.log('🔍 Resolving comment with ID:', commentId);
      // console.log('🔍 Comment ID type:', typeof commentId);
      // console.log('🔍 Comment ID value:', commentId);
      
      if (!commentId) {
        console.error('❌ Comment ID is undefined or null');
        return;
      }
      
      const response = await commentAPI.toggleCommentResolution(commentId, true);
      if (response.success) {
        // Reload comments to get the updated list
        await loadComments();
      }
    } catch (error) {
      console.error('Failed to resolve comment:', error);
    }
  };

  const handleAddCommentReply = async (commentId: string, reply: Omit<DocumentComment['replies'][0], 'id' | 'timestamp'>) => {
    try {
      const response = await commentAPI.addCommentReply(commentId, {
        content: reply.content,
        mentions: reply.mentions
      });
      
      if (response.success) {
        // Reload comments to get the updated list
        await loadComments();
      }
    } catch (error) {
      console.error('Failed to add reply:', error);
    }
  };

  const generatePlaceholderContent = (doc: Document) => {
    // If document already has content, use it
    if (doc.content) {
      return doc.content;
    }
    
    // Fallback content for documents without extracted content
    return `# ${doc.name.replace(/\.[^/.]+$/, '')}\n\nThis document doesn't have extracted content yet.\n\n## Document Details\n- Name: ${doc.name}\n- Type: ${doc.type.toUpperCase()}\n- Size: ${(doc.size / 1024 / 1024).toFixed(2)} MB\n- Uploaded: ${new Date(doc.createdAt).toLocaleDateString()}\n\nClick the Edit button to add notes, comments, or extract content.`;
  };

  const tabs = [
    {
      id: 'editor' as TabType,
      label: 'Editor',
      icon: Users,
      count: activeUsers.length
    },
    {
      id: 'comments' as TabType,
      label: 'Comments',
      icon: MessageCircle,
      count: comments.filter(c => !c.resolved).length
    },
    {
      id: 'versions' as TabType,
      label: 'Versions',
      icon: GitBranch,
      count: versions.length
    },
    {
      id: 'workflows' as TabType,
      label: 'Workflows',
      icon: Workflow,
      count: workflows.filter(w => w.status === 'active').length
    },
    {
      id: 'analysis' as TabType,
      label: 'Analysis',
      icon: Brain,
      count: analysis ? 1 : 0
    }
  ];

  const handleContentChange = async (content: string) => {
    try {
      // Save content to database
      const response = await documentAPI.updateDocument(document.id, { content });
      if (response.success) {
        setDocumentContent(content);
        console.log('Document content saved successfully');
        
        // Create a new version after successful content save
        await createNewVersion(content);
      } else {
        console.error('Failed to save document content:', response.message);
      }
    } catch (error) {
      console.error('Error saving document content:', error);
    }
  };

  const createNewVersion = async (newContent: string) => {
    try {
      // Get the previous version for comparison
      const previousVersion = versions[0]; // Most recent version
      const previousContent = previousVersion?.content || '';
      
      // Calculate changes (simple diff for now)
      const changes = calculateChanges(previousContent, newContent);
      
      // Create new version with real user data
      const response = await versionAPI.createVersion(document.id, {
        content: newContent,
        description: `Content updated by ${user?.fullname || user?.email || 'User'}`,
        changes: changes
      });
      
      if (response.success) {
        console.log('New version created successfully');
        // Reload versions to get the updated list
        await loadVersions();
      } else {
        console.error('Failed to create version:', response.message);
      }
    } catch (error) {
      console.error('Failed to create new version:', error);
    }
  };

  const calculateChanges = (oldContent: string, newContent: string) => {
    if (!oldContent && newContent) {
      // First version - all content is additions
      return { additions: newContent.length, deletions: 0, modifications: 0 };
    }
    
    if (oldContent && !newContent) {
      // Content was completely removed
      return { additions: 0, deletions: oldContent.length, modifications: 0 };
    }
    
    if (oldContent === newContent) {
      // No changes
      return { additions: 0, deletions: 0, modifications: 0 };
    }
    
    // Split into lines for better comparison
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    let additions = 0;
    let deletions = 0;
    let modifications = 0;
    
    // More sophisticated line-based diff
    // const maxLines = Math.max(oldLines.length, newLines.length);
    const minLines = Math.min(oldLines.length, newLines.length);
    
    // Count modifications in overlapping lines
    for (let i = 0; i < minLines; i++) {
      if (oldLines[i] !== newLines[i]) {
        modifications++;
      }
    }
    
    // Count additions (new lines beyond old content)
    if (newLines.length > oldLines.length) {
      additions = newLines.length - oldLines.length;
    }
    
    // Count deletions (old lines beyond new content)
    if (oldLines.length > newLines.length) {
      deletions = oldLines.length - newLines.length;
    }
    
    // If content is very different, adjust calculations
    if (modifications > minLines * 0.8) {
      // If more than 80% of lines are modified, treat as mostly new content
      modifications = Math.floor(minLines * 0.3); // Reduce modifications
      additions += Math.floor(minLines * 0.5); // Increase additions
    }
    
    return { additions, deletions, modifications };
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{document.name}</h2>
              <p className="text-sm text-gray-500">
                Collaborative editing • {activeUsers.length} shared collaborator{activeUsers.length !== 1 ? 's' : ''}
                {activeUsers.length > 0 && (
                  <span className="ml-2 text-gray-400">
                   ( {/* (Owner: {document.ownerId || document.uploadedBy || 'Unknown'} */}
                    {document.sharedWith && document.sharedWith.length > 0 && 
                      ` • Shared: ${document.sharedWith.length} user${document.sharedWith.length !== 1 ? 's' : ''}`}
                    )
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-200">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Collaborator Info */}
          {activeUsers.length > 0 && (
            <div className="py-2 text-xs text-gray-500 border-t border-gray-100">
              <span className="font-medium">Shared Collaborators:</span>
              {activeUsers.map((user, index) => (
                <span key={user.id} className="ml-2">
                  {user.name}
                  {index < activeUsers.length - 1 ? ',' : ''}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'editor' && (
            <CollaborativeEditor
              documentId={document.id}
              content={isLoadingContent ? 'Loading document content...' : documentContent}
              activeUsers={activeUsers}
              comments={comments}
              isEditable={true} // Make all documents editable
              document={document}
              onContentChange={handleContentChange}
              onCommentAdd={handleAddComment}
            />
          )}

          {activeTab === 'comments' && (
            <div className="h-full">
              <CommentSystem
                documentId={document.id}
                comments={comments}
                onCommentAdd={handleAddComment}
                onCommentResolve={handleResolveComment}
                onReplyAdd={handleAddCommentReply}
                isLoading={isLoadingComments}
              />
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="h-full overflow-auto p-6">
              <VersionManager
                documentId={document.id}
                versions={versions}
                currentVersion={versions[0]?.id || ''}
                documentOwnerId={document.ownerId || document.uploadedBy}
                onVersionSelect={(versionId) => console.log('Select version:', versionId)}
                onVersionCompare={compareVersions}
                onVersionRestore={restoreVersion}
                onVersionTag={(versionId, tag) => console.log('Tag version:', versionId, tag)}
                onVersionReload={loadVersions}
              />
            </div>
          )}

          {activeTab === 'workflows' && (
            <div className="h-full overflow-auto p-6">
              <WorkflowManager
                documentId={document.id}
                workflows={workflows}
                onWorkflowCreate={handleCreateWorkflow}
                onWorkflowUpdate={handleUpdateWorkflow}
                onStepComplete={handleCompleteWorkflowStep}
              />
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="h-full overflow-auto p-6">
              <DocumentProcessor
                documentId={document.id}
                analysis={analysis}
                onProcessDocument={processDocument}
                onReprocessDocument={processDocument}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}