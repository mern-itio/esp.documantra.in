import { useState } from 'react';
import { X, Users, MessageCircle, GitBranch, Workflow, Brain, Settings } from 'lucide-react';
import type { Document } from '../../common/types';

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
  
  const {
    getActiveUsers,
    getDocumentComments,
    getDocumentVersions,
    getDocumentWorkflows,
    getDocumentAnalysis,
    addComment,
    resolveComment,
    addCommentReply,
    // createVersion,
    compareVersions,
    restoreVersion,
    createWorkflow,
    updateWorkflow,
    completeWorkflowStep,
    processDocument
  } = useCollaborationStore();

  const activeUsers = getActiveUsers(document.id);
  const comments = getDocumentComments(document.id);
  const versions = getDocumentVersions(document.id);
  const workflows = getDocumentWorkflows(document.id);
  const analysis = getDocumentAnalysis(document.id);

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

  const handleContentChange = (content: string) => {
    // Mock content update
    console.log('Content updated:', content.substring(0, 100) + '...');
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
                Collaborative editing • {activeUsers.length} active user{activeUsers.length !== 1 ? 's' : ''}
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'editor' && (
            <CollaborativeEditor
              documentId={document.id}
              content="This is a sample document content for collaborative editing. Multiple users can edit this document simultaneously with real-time synchronization."
              activeUsers={activeUsers}
              comments={comments}
              isEditable={true}
              onContentChange={handleContentChange}
              onCommentAdd={addComment}
            />
          )}

          {activeTab === 'comments' && (
            <div className="h-full">
              <CommentSystem
                documentId={document.id}
                comments={comments}
                onCommentAdd={addComment}
                onCommentResolve={resolveComment}
                onReplyAdd={addCommentReply}
              />
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="h-full overflow-auto p-6">
              <VersionManager
                documentId={document.id}
                versions={versions}
                currentVersion={versions[0]?.id || ''}
                onVersionSelect={(versionId) => console.log('Select version:', versionId)}
                onVersionCompare={compareVersions}
                onVersionRestore={restoreVersion}
                onVersionTag={(versionId, tag) => console.log('Tag version:', versionId, tag)}
              />
            </div>
          )}

          {activeTab === 'workflows' && (
            <div className="h-full overflow-auto p-6">
              <WorkflowManager
                documentId={document.id}
                workflows={workflows}
                onWorkflowCreate={createWorkflow}
                onWorkflowUpdate={updateWorkflow}
                onStepComplete={completeWorkflowStep}
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