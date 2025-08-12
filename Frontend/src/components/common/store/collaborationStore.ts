import { create } from 'zustand';

import { 
  MOCK_COLLABORATIVE_USERS,
  MOCK_DOCUMENT_COMMENTS,
  MOCK_DOCUMENT_VERSIONS,
  MOCK_DOCUMENT_WORKFLOWS,
  MOCK_DOCUMENT_ANALYSIS,
  MOCK_COLLABORATION_SESSIONS
} from '../lib/collaborationMockData';
import { generateId, sleep } from '../lib/utils';
import type { CollaborationSession, CollaborativeUser, DocumentAnalysis, DocumentComment, DocumentVersion, DocumentWorkflow } from '../types/collaboration';

interface CollaborationState {
  // Real-time collaboration
  activeUsers: CollaborativeUser[];
  collaborationSessions: CollaborationSession[];
  
  // Comments
  comments: DocumentComment[];
  
  // Version control
  versions: DocumentVersion[];
  
  // Workflows
  workflows: DocumentWorkflow[];
  
  // Document analysis
  documentAnalysis: DocumentAnalysis[];
  
  // Loading states
  isProcessingDocument: boolean;
  isCreatingWorkflow: boolean;
  
  // Actions
  joinCollaboration: (documentId: string, user: CollaborativeUser) => void;
  leaveCollaboration: (documentId: string, userId: string) => void;
  updateUserPresence: (userId: string, presence: Partial<CollaborativeUser>) => void;
  
  addComment: (comment: Omit<DocumentComment, 'id' | 'timestamp'>) => Promise<void>;
  resolveComment: (commentId: string) => void;
  addCommentReply: (commentId: string, reply: any) => Promise<void>;
  
  createVersion: (version: Omit<DocumentVersion, 'id' | 'timestamp'>) => Promise<void>;
  compareVersions: (fromVersionId: string, toVersionId: string) => any;
  restoreVersion: (versionId: string) => Promise<void>;
  
  createWorkflow: (workflow: Omit<DocumentWorkflow, 'id' | 'createdAt'>) => Promise<void>;
  updateWorkflow: (workflowId: string, updates: Partial<DocumentWorkflow>) => Promise<void>;
  completeWorkflowStep: (workflowId: string, stepId: string) => Promise<void>;
  
  processDocument: (documentId: string) => Promise<void>;
  getDocumentAnalysis: (documentId: string) => DocumentAnalysis | undefined;
  
  getDocumentComments: (documentId: string) => DocumentComment[];
  getDocumentVersions: (documentId: string) => DocumentVersion[];
  getDocumentWorkflows: (documentId: string) => DocumentWorkflow[];
  getActiveUsers: (documentId: string) => CollaborativeUser[];
}

export const useCollaborationStore = create<CollaborationState>((set, get) => ({
  // Initial state
  activeUsers: MOCK_COLLABORATIVE_USERS,
  collaborationSessions: MOCK_COLLABORATION_SESSIONS,
  comments: MOCK_DOCUMENT_COMMENTS,
  versions: MOCK_DOCUMENT_VERSIONS,
  workflows: MOCK_DOCUMENT_WORKFLOWS,
  documentAnalysis: MOCK_DOCUMENT_ANALYSIS,
  isProcessingDocument: false,
  isCreatingWorkflow: false,

  // Real-time collaboration actions
  joinCollaboration: (documentId: string, user: CollaborativeUser) => {
    set(state => ({
      activeUsers: [...state.activeUsers.filter(u => u.id !== user.id), user]
    }));
  },

  leaveCollaboration: (documentId: string, userId: string) => {
    set(state => ({
      activeUsers: state.activeUsers.filter(u => u.id !== userId)
    }));
  },

  updateUserPresence: (userId: string, presence: Partial<CollaborativeUser>) => {
    set(state => ({
      activeUsers: state.activeUsers.map(user =>
        user.id === userId ? { ...user, ...presence } : user
      )
    }));
  },

  // Comment actions
  addComment: async (comment: Omit<DocumentComment, 'id' | 'timestamp'>) => {
    await sleep(500);
    
    const newComment: DocumentComment = {
      ...comment,
      id: generateId(),
      timestamp: new Date().toISOString()
    };

    set(state => ({
      comments: [...state.comments, newComment]
    }));
  },

  resolveComment: (commentId: string) => {
    set(state => ({
      comments: state.comments.map(comment =>
        comment.id === commentId
          ? { ...comment, resolved: true }
          : comment
      )
    }));
  },

  addCommentReply: async (commentId: string, reply: any) => {
    await sleep(300);
    
    const newReply = {
      ...reply,
      id: generateId(),
      timestamp: new Date().toISOString()
    };

    set(state => ({
      comments: state.comments.map(comment =>
        comment.id === commentId
          ? { ...comment, replies: [...comment.replies, newReply] }
          : comment
      )
    }));
  },

  // Version control actions
  createVersion: async (version: Omit<DocumentVersion, 'id' | 'timestamp'>) => {
    await sleep(1000);
    
    const newVersion: DocumentVersion = {
      ...version,
      id: generateId(),
      timestamp: new Date().toISOString()
    };

    set(state => ({
      versions: [...state.versions, newVersion]
    }));
  },

  compareVersions: (fromVersionId: string, toVersionId: string) => {
    // Mock comparison logic
    return {
      fromVersionId,
      toVersionId,
      changes: [],
      summary: {
        totalChanges: 0,
        additions: 0,
        deletions: 0,
        modifications: 0
      }
    };
  },

  restoreVersion: async (versionId: string) => {
    await sleep(1500);
    // Mock version restoration
    console.log('Restored version:', versionId);
  },

  // Workflow actions
  createWorkflow: async (workflow: Omit<DocumentWorkflow, 'id' | 'createdAt'>) => {
    set({ isCreatingWorkflow: true });
    await sleep(1000);
    
    const newWorkflow: DocumentWorkflow = {
      ...workflow,
      id: generateId(),
      createdAt: new Date().toISOString()
    };

    set(state => ({
      workflows: [...state.workflows, newWorkflow],
      isCreatingWorkflow: false
    }));
  },

  updateWorkflow: async (workflowId: string, updates: Partial<DocumentWorkflow>) => {
    await sleep(500);
    
    set(state => ({
      workflows: state.workflows.map(workflow =>
        workflow.id === workflowId
          ? { ...workflow, ...updates }
          : workflow
      )
    }));
  },

  completeWorkflowStep: async (workflowId: string, stepId: string) => {
    await sleep(500);
    
    set(state => ({
      workflows: state.workflows.map(workflow =>
        workflow.id === workflowId
          ? {
              ...workflow,
              steps: workflow.steps.map(step =>
                step.id === stepId
                  ? { 
                      ...step, 
                      status: 'completed' as const,
                      completedAt: new Date().toISOString()
                    }
                  : step
              )
            }
          : workflow
      )
    }));
  },

  // Document processing actions
  processDocument: async (documentId: string) => {
    set({ isProcessingDocument: true });
    await sleep(3000); // Simulate processing time
    
    const analysis: DocumentAnalysis = {
      id: generateId(),
      documentId,
      analysis: {
        wordCount: Math.floor(Math.random() * 5000) + 1000,
        pageCount: Math.floor(Math.random() * 20) + 1,
        readabilityScore: Math.floor(Math.random() * 10) + 1,
        sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as any,
        language: 'en',
        topics: ['business', 'finance', 'legal', 'technology'].slice(0, Math.floor(Math.random() * 4) + 1),
        entities: [],
        keyPhrases: ['important document', 'key information', 'critical data'],
        summary: 'This document contains important business information and requires careful review.'
      },
      classification: {
        category: 'Business Document',
        confidence: 0.85,
        suggestedTags: ['business', 'important', 'review']
      },
      compliance: {
        issues: [],
        score: Math.floor(Math.random() * 40) + 60,
        recommendations: ['Add confidentiality notice', 'Review data retention policies']
      },
      processedAt: new Date().toISOString()
    };

    set(state => ({
      documentAnalysis: [...state.documentAnalysis.filter(a => a.documentId !== documentId), analysis],
      isProcessingDocument: false
    }));
  },

  getDocumentAnalysis: (documentId: string) => {
    return get().documentAnalysis.find(analysis => analysis.documentId === documentId);
  },

  // Getter functions
  getDocumentComments: (documentId: string) => {
    return get().comments.filter(comment => comment.documentId === documentId);
  },

  getDocumentVersions: (documentId: string) => {
    return get().versions.filter(version => version.documentId === documentId);
  },

  getDocumentWorkflows: (documentId: string) => {
    return get().workflows.filter(workflow => workflow.documentId === documentId);
  },

  getActiveUsers: (documentId: string) => {
    return get().activeUsers;
  }
}));