import { useState, useEffect } from 'react';
import { X, Users, MessageCircle, GitBranch, Workflow, Brain } from 'lucide-react';
import type { Document } from '../../common/types';
import { documentAPI, commentAPI, versionAPI, workflowAPI, documentAnalysisAPI } from '../../../services/api';
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
  console.log('🔍 CollaborationHub: Received document prop:', document);
  console.log('🔍 CollaborationHub: Document ID:', document?.id);
  console.log('🔍 CollaborationHub: Document _id:', (document as any)?._id);
  console.log('🔍 CollaborationHub: Document keys:', Object.keys(document || {}));
  
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
    // getDocumentAnalysis,
    compareVersions,
    restoreVersion,
    // processDocument
  } = useCollaborationStore();

  // Check user permissions for this document
  const getUserPermissions = () => {
    if (!document) {
      console.log('❌ getUserPermissions: Document is null or undefined');
      return { canEdit: false, canComment: false, canView: false, permission: 'none' as const };
    }
    
    console.log('🔍 Checking user permissions:', { user, documentOwner: document.ownerId || document.uploadedBy, documentSharedWith: document.sharedWith });
    
    if (!user) {
      console.log('❌ No user data:', { user });
      return { canEdit: false, canComment: false, canView: true, permission: 'view' as const };
    }

    // Check if user is the owner of the document
    const isOwner = user.id === (document.ownerId || document.uploadedBy) || 
                    user.email === (document.ownerId || document.uploadedBy);
    
    if (isOwner) {
      console.log('✅ User is document owner - full permissions granted');
      return { 
        canEdit: true, 
        canComment: true, 
        canView: true, 
        permission: 'full' as const 
      };
    }

    // If not owner, check shared permissions
    if (!document.sharedWith || document.sharedWith.length === 0) {
      console.log('❌ User is not owner and document is not shared');
      return { canEdit: false, canComment: false, canView: false, permission: 'none' as const };
    }

    // Find the user's share entry
    const userShare = document.sharedWith.find((share: any) => 
      share.userId === user.email || share.email === user.email
    );

    console.log('🔍 User share entry found:', userShare);

    if (!userShare) {
      console.log('❌ No matching share entry for user:', user.email);
      return { canEdit: false, canComment: false, canView: false, permission: 'none' as const };
    }

    const permission = userShare.permission || 'view';
    console.log('✅ User permission:', permission);
    
    const permissions = {
      canEdit: permission === 'edit',
      canComment: permission === 'edit' || permission === 'comment',
      canView: true,
      permission: permission
    };
    
    console.log('🔍 Final permissions:', permissions);
    return permissions;
  };

  const userPermissions = getUserPermissions();

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
  
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoadingAnalysis] = useState(true);

  // Load document analysis when analysis tab is active
  useEffect(() => {
    if (document?.id && activeTab === 'analysis') {
      console.log('🔍 CollaborationHub: Loading document analysis for document:', document.id);
      loadDocumentAnalysis();
    } else if (!document?.id) {
      console.log('🔍 CollaborationHub: Document not ready yet, skipping analysis load');
    }
  }, [document?.id, activeTab]);

  const loadDocumentAnalysis = async () => {
    if (!document?.id) {
      console.error('❌ loadDocumentAnalysis: Document ID is undefined!');
      return;
    }
    
    try {
      // Check analysis status first
      const statusResponse = await documentAnalysisAPI.getAnalysisStatus(document.id);
      if (statusResponse.success && statusResponse.data.status === 'completed') {
        // Analysis is complete, get the results
        const analysisResponse = await documentAnalysisAPI.getDocumentAnalysis(document.id);
        if (analysisResponse.success) {
          setAnalysis(analysisResponse.data);
        }
      }
    } catch (error) {
      console.error('Failed to load document analysis:', error);
    }
  };

  // Function to manually refresh analysis status
  // const refreshAnalysisStatus = () => {
  //   if (document.id) {
  //     loadDocumentAnalysis();
  //   }
  // };

  // Load document content when component mounts
  useEffect(() => {
    if (document?.id) {
      console.log('🔍 CollaborationHub: Loading initial data for document:', document.id);
      loadDocumentContent();
      loadComments();
      loadVersions();
      loadWorkflows();
    } else {
      console.log('🔍 CollaborationHub: Document not ready yet, skipping initial data load');
    }
  }, [document?.id]);

  const loadDocumentContent = async () => {
    if (!document?.id) {
      console.error('❌ loadDocumentContent: Document ID is undefined!');
      return;
    }
    
    try {
      const response = await documentAPI.getDocument(document.id);
      if (response.success) {
        setDocumentContent(response.data.content || '');
        setIsLoadingContent(false);
      } else {
        console.error('Failed to load document content:', response.message);
        // Generate placeholder content as fallback
        setDocumentContent(generatePlaceholderContent(document));
        setIsLoadingContent(false);
      }
    } catch (error) {
      console.error('Error loading document content:', error);
      // Generate placeholder content as fallback
      setDocumentContent(generatePlaceholderContent(document));
      setIsLoadingContent(false);
    }
  };

  const loadComments = async () => {
    if (!document?.id) {
      console.error('❌ loadComments: Document ID is undefined!');
      return;
    }
    
    try {
      console.log('🔍 Loading comments for document:', document.id);
      const response = await commentAPI.getDocumentComments(document.id);
      if (response.success) {
        setComments(response.data);
        setIsLoadingComments(false);
      } else {
        console.error('Failed to load comments:', response.message);
        setIsLoadingComments(false);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
      setIsLoadingComments(false);
    }
  };

  const loadVersions = async () => {
    if (!document?.id) {
      console.error('❌ loadVersions: Document ID is undefined!');
      return;
    }
    
    try {
      console.log('🔍 Loading versions for document:', document.id);
      const response = await versionAPI.getDocumentVersions(document.id);
      if (response.success) {
        setVersions(response.data);
        // setIsLoadingVersions(false);
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
    if (!document?.id) {
      console.error('❌ loadWorkflows: Document ID is undefined!');
      return;
    }
    
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
  const handleUpdateWorkflow = async (workflowId: string, updates: any) => {
    try {
      const response = await workflowAPI.updateWorkflow(workflowId, updates);
      if (response.success) {
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
    if (!document?.id) {
      console.error('❌ handleAddComment: Document ID is undefined!');
      return;
    }
    
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
    if (!doc) {
      return 'Document content not available';
    }
    
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
      count: isLoadingAnalysis ? 0 : (analysis ? 1 : 0)
    }
  ];

  const handleContentChange = async (content: string) => {
    console.log('🔍 handleContentChange: Document ID:', document?.id);
    console.log('🔍 handleContentChange: Document object:', document);
    
    if (!document?.id) {
      console.error('❌ handleContentChange: Document ID is undefined!');
      alert('Error: Document ID is missing. Please refresh the page and try again.');
      return;
    }
    
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
    if (!document?.id) {
      console.error('❌ createNewVersion: Document ID is undefined!');
      return;
    }
    
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
    // Ensure content is strings
    const old = oldContent || '';
    const new_ = newContent || '';
    
    if (!old && new_) {
      // First version - all content is additions
      return { additions: new_.length, deletions: 0, modifications: 0 };
    }
    
    if (old && !new_) {
      // Content was completely removed
      return { additions: 0, deletions: old.length, modifications: 0 };
    }
    
    if (old === new_) {
      // No changes
      return { additions: 0, deletions: 0, modifications: 0 };
    }
    
    // Split into lines for better comparison
    const oldLines = old.split('\n');
    const newLines = new_.split('\n');
    
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
              {/* Permission Badge */}
              <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
                userPermissions.permission === 'full'
                  ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                  : userPermissions.permission === 'edit' 
                  ? 'text-green-600 bg-green-50 border-green-200'
                  : userPermissions.permission === 'comment'
                  ? 'text-purple-600 bg-purple-50 border-purple-200'
                  : userPermissions.permission === 'view'
                  ? 'text-blue-600 bg-blue-50 border-blue-200'
                  : 'text-gray-600 bg-gray-50 border-gray-200'
              }`}>
                {userPermissions.permission === 'full' ? 'OWNER' : userPermissions.permission?.toUpperCase() || 'NO ACCESS'}
              </div>
              {/* <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button> */}
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
            <>
              {/* Permission Info Banner */}
              {!userPermissions.canEdit && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Read-only mode:</strong> You have {userPermissions.permission} access to this document. 
                        {userPermissions.permission === 'view' && ' You can view and add comments.'}
                        {userPermissions.permission === 'comment' && ' You can view and add comments, but cannot edit the document.'}
                        {userPermissions.permission === 'none' && ' You have no access to this document.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <CollaborativeEditor
                documentId={document.id}
                content={isLoadingContent ? 'Loading document content...' : documentContent}
                activeUsers={activeUsers}
                comments={comments}
                isEditable={userPermissions.canEdit} // Respect user permissions
                document={document}
                onContentChange={handleContentChange}
                onCommentAdd={handleAddComment}
              />
            </>
          )}

          {activeTab === 'comments' && (
            <div className="h-full">
              {/* Permission Info Banner for Comments */}
              {!userPermissions.canComment && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        <strong>View-only mode:</strong> You have {userPermissions.permission} access to this document. 
                        {userPermissions.permission === 'view' && ' You can view comments but cannot add new ones or reply to existing comments.'}
                        {userPermissions.permission === 'none' && ' You have no access to this document.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <CommentSystem
                documentId={document.id}
                comments={comments}
                onCommentAdd={handleAddComment}
                onCommentResolve={handleResolveComment}
                onReplyAdd={handleAddCommentReply}
                isLoading={isLoadingComments}
                canAddComments={userPermissions.canComment}
                currentVersion={versions[0]?._id || versions[0]?.id}
                versions={versions.map(v => ({
                  id: v._id || v.id,
                  version: v.version || 'Unknown',
                  description: v.description || ''
                }))}
                onVersionChange={async (versionId) => {
                  try {
                    // Load comments for specific version
                    const response = await commentAPI.getDocumentComments(document.id, versionId);
                    if (response.success) {
                      setComments(response.data);
                    }
                  } catch (error) {
                    console.error('Failed to load comments for version:', error);
                  }
                }}
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
                onWorkflowUpdate={handleUpdateWorkflow}
                onStepComplete={handleCompleteWorkflowStep}
                onWorkflowsRefresh={loadWorkflows}
              />
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="h-full overflow-auto p-6">
              <DocumentProcessor
                documentId={document.id}
                analysis={analysis}
                onProcessDocument={loadDocumentAnalysis}
                onReprocessDocument={loadDocumentAnalysis}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}