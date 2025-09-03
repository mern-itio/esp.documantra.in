import { pdfApi } from './apiHelper';
import type { 
  CommentRequest, 
  CommentResponse, 
  CommentLibrary, 
  CommentStats,
  Comment,
  CommentThread
} from '../types/comments';

class CommentService {
  constructor() {
    // Service initialization
  }

  async addComments(request: CommentRequest): Promise<CommentResponse> {
    try {
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('comments', JSON.stringify(request.comments));
      formData.append('userInfo', JSON.stringify(request.userInfo));

      const response = await pdfApi.post('/pdf-comments/add-comments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes timeout
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to add comments:', error);
      throw new Error(error.response?.data?.message || 'Failed to add comments');
    }
  }

  async getPreview(request: CommentRequest): Promise<CommentResponse> {
    try {
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('comments', JSON.stringify(request.comments));
      formData.append('userInfo', JSON.stringify(request.userInfo));

      const response = await pdfApi.post('/pdf-comments/preview-comments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes timeout
      });

      // Construct full URL for preview
      const baseURL = pdfApi.defaults.baseURL || 'http://localhost:2104';
      const previewUrl = response.data.previewUrl.startsWith('http') 
        ? response.data.previewUrl 
        : `${baseURL}${response.data.previewUrl}`;

      return {
        ...response.data,
        previewUrl
      };
    } catch (error: any) {
      console.error('Preview generation error:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate preview');
    }
  }

  async getCommentLibrary(): Promise<CommentLibrary> {
    try {
      const response = await pdfApi.get('/pdf-comments/comment-library');
      return response.data.commentLibrary;
    } catch (error: any) {
      console.error('Failed to get comment library:', error);
      throw new Error(error.response?.data?.message || 'Failed to get comment library');
    }
  }

  async getCommentStats(file: File): Promise<CommentStats> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await pdfApi.post('/pdf-comments/comment-stats', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to get comment stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to get comment stats');
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

  validateRequest(request: CommentRequest): { valid: boolean; message?: string } {
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

export default new CommentService();
