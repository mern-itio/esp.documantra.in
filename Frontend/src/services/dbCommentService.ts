import { pdfApi } from './apiHelper';
import type { 
  CommentStats,
  Comment,
  CommentThread,
  UserInfo
} from '../types/comments';

export interface DBCommentDocument {
  id: string;
  documentName: string;
  ownerName: string;
  comments: Comment[];
  totalComments: number;
  totalThreads: number;
  resolvedComments: number;
  unresolvedComments: number;
  allowComments: boolean;
  allowAnonymousComments: boolean;
  createdAt: string;
  lastAccessed: string;
  previewUrl?: string;
  downloadUrl?: string;
}

export interface CreateDocumentRequest {
  file: File;
  comments: Comment[];
  userInfo: UserInfo;
  shareableLink?: boolean;
  expiresInDays?: number;
}

export interface CreateDocumentResponse {
  success: boolean;
  message: string;
  documentId: string;
  filename: string;
  downloadUrl: string;
  shareableLink: string;
  linkToken: string;
  expiresAt?: string;
  originalFileSize: number;
  fileSize: number;
  commentDetails: {
    totalComments: number;
    totalThreads: number;
    resolvedComments: number;
    unresolvedComments: number;
  };
}

export interface AddCommentRequest {
  text: string;
  position: {
    x: number;
    y: number;
    pageNumber: number;
  };
  color?: string;
  parentId?: string;
  authorInfo?: UserInfo;
}

export interface UserDocumentsResponse {
  success: boolean;
  documents: Array<{
    _id: string;
    documentName: string;
    originalFilename: string;
    createdAt: string;
    totalComments: number;
    totalThreads: number;
    resolvedComments: number;
    unresolvedComments: number;
    isShared: boolean;
    shareableLink?: string;
  }>;
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

class DBCommentService {
  constructor() {
    // Service initialization
  }

  async createDocument(request: CreateDocumentRequest): Promise<CreateDocumentResponse> {
    try {
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('comments', JSON.stringify(request.comments));
      formData.append('userInfo', JSON.stringify(request.userInfo));
      formData.append('shareableLink', String(request.shareableLink || true));
      formData.append('expiresInDays', String(request.expiresInDays || 30));

      const response = await pdfApi.post('/pdf-comments-db/create-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes timeout
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to create document:', error);
      throw new Error(error.response?.data?.message || 'Failed to create document');
    }
  }

  async getDocumentByLink(linkToken: string): Promise<DBCommentDocument> {
    try {
      const response = await pdfApi.get(`/pdf-comments-db/shared/${linkToken}`);
      return response.data.document;
    } catch (error: any) {
      console.error('Failed to get document:', error);
      throw new Error(error.response?.data?.message || 'Failed to get document');
    }
  }

  async addComment(linkToken: string, request: AddCommentRequest): Promise<{ success: boolean; comment: Comment; totalComments: number }> {
    try {
      const response = await pdfApi.post(`/pdf-comments-db/shared/${linkToken}/comments`, request);
      return response.data;
    } catch (error: any) {
      console.error('Failed to add comment:', error);
      throw new Error(error.response?.data?.message || 'Failed to add comment');
    }
  }

  async replyToComment(linkToken: string, commentId: string, text: string, authorInfo?: UserInfo): Promise<{ success: boolean; reply: Comment; totalComments: number }> {
    try {
      const response = await pdfApi.post(`/pdf-comments-db/shared/${linkToken}/comments/${commentId}/reply`, {
        text,
        authorInfo
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to reply to comment:', error);
      throw new Error(error.response?.data?.message || 'Failed to reply to comment');
    }
  }

  async toggleCommentResolution(linkToken: string, commentId: string, resolved: boolean, authorInfo?: UserInfo): Promise<{ success: boolean; comment: Comment; totalComments: number }> {
    try {
      const response = await pdfApi.patch(`/pdf-comments-db/shared/${linkToken}/comments/${commentId}/resolve`, {
        resolved,
        authorInfo
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to toggle comment resolution:', error);
      throw new Error(error.response?.data?.message || 'Failed to toggle comment resolution');
    }
  }

  async getUserDocuments(userId: string, page: number = 1, limit: number = 10): Promise<UserDocumentsResponse> {
    try {
      const response = await pdfApi.get(`/pdf-comments-db/user/${userId}/documents?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get user documents:', error);
      throw new Error(error.response?.data?.message || 'Failed to get user documents');
    }
  }

  async downloadFile(downloadUrl: string): Promise<void> {
    try {
      const response = await pdfApi.get(downloadUrl, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `commented-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Download failed:', error);
      throw new Error('Download failed');
    }
  }

  validateRequest(request: CreateDocumentRequest): { valid: boolean; message?: string } {
    if (!request.file) {
      return { valid: false, message: 'Please select a PDF file' };
    }

    if (!request.comments || request.comments.length === 0) {
      return { valid: false, message: 'Please add at least one comment' };
    }

    if (!request.userInfo || !request.userInfo.name) {
      return { valid: false, message: 'Please provide user information' };
    }

    for (const comment of request.comments) {
      if (!comment.text.trim()) {
        return { valid: false, message: 'All comments must have text' };
      }
      if (comment.position.x < 0 || comment.position.y < 0) {
        return { valid: false, message: 'Invalid comment position' };
      }
    }

    return { valid: true };
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  generateCommentId(): string {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateThreadId(): string {
    return `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  createComment(
    text: string,
    position: { x: number; y: number; pageNumber: number },
    author: string,
    color: string = 'yellow',
    parentId?: string,
    threadId?: string
  ): Comment {
    const id = this.generateCommentId();
    const finalThreadId = threadId || this.generateThreadId();

    return {
      id,
      text,
      position,
      author,
      timestamp: new Date(),
      replies: [],
      parentId,
      isResolved: false,
      color: color as any,
      pageNumber: position.pageNumber,
      threadId: finalThreadId
    };
  }

  organizeCommentsIntoThreads(comments: Comment[]): CommentThread[] {
    const threads: { [threadId: string]: CommentThread } = {};
    
    // First pass: create threads for root comments
    comments.forEach(comment => {
      if (!comment.parentId) {
        threads[comment.threadId] = {
          id: comment.threadId,
          rootComment: comment,
          replies: [],
          isResolved: comment.isResolved,
          createdAt: comment.timestamp,
          lastActivity: comment.timestamp,
          participants: [comment.author]
        };
      }
    });

    // Second pass: add replies to threads
    comments.forEach(comment => {
      if (comment.parentId && threads[comment.threadId]) {
        threads[comment.threadId].replies.push(comment);
        threads[comment.threadId].lastActivity = comment.timestamp;
        if (!threads[comment.threadId].participants.includes(comment.author)) {
          threads[comment.threadId].participants.push(comment.author);
        }
      }
    });

    return Object.values(threads).sort((a, b) => 
      b.lastActivity.getTime() - a.lastActivity.getTime()
    );
  }

  calculateStats(comments: Comment[]): CommentStats {
    const totalComments = comments.length;
    const commentsByUser: { [userId: string]: number } = {};
    const commentsByPage: { [pageNumber: number]: number } = {};
    let totalReplies = 0;
    let resolvedComments = 0;

    comments.forEach(comment => {
      // Count by user
      commentsByUser[comment.author] = (commentsByUser[comment.author] || 0) + 1;
      
      // Count by page
      commentsByPage[comment.pageNumber] = (commentsByPage[comment.pageNumber] || 0) + 1;
      
      // Count replies
      if (comment.parentId) {
        totalReplies++;
      }
      
      // Count resolved
      if (comment.isResolved) {
        resolvedComments++;
      }
    });

    const threads = this.organizeCommentsIntoThreads(comments);
    const mostActiveThreads = threads
      .sort((a, b) => b.replies.length - a.replies.length)
      .slice(0, 5);

    return {
      totalComments,
      commentsByUser,
      commentsByPage,
      averageRepliesPerComment: totalComments > 0 ? totalReplies / totalComments : 0,
      mostActiveThreads,
      resolutionRate: totalComments > 0 ? resolvedComments / totalComments : 0
    };
  }
}

export default new DBCommentService();
