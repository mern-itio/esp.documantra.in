export interface Comment {
  id: string;
  text: string;
  position: CommentPosition;
  author: string;
  authorName?: string;
  timestamp: Date;
  replies: Comment[];
  parentId?: string;
  isResolved: boolean;
  color: CommentColor;
  pageNumber: number;
  threadId: string;
}

export interface CommentPosition {
  x: number; // X coordinate on the page
  y: number; // Y coordinate on the page
  pageNumber: number;
}

export interface CommentRequest {
  file: File;
  comments: CommentInput[];
  userInfo: UserInfo;
}

export interface CommentInput {
  text: string;
  position: CommentPosition;
  color: CommentColor;
  pageNumber: number;
  parentId?: string;
  threadId?: string;
}

export interface CommentResponse {
  success: boolean;
  message: string;
  filename: string;
  downloadUrl: string;
  previewUrl?: string;
  originalFileSize: number;
  fileSize: number;
  commentDetails: CommentDetails;
}

export interface CommentDetails {
  totalComments: number;
  totalThreads: number;
  commentsByPage: { [pageNumber: number]: number };
  resolvedComments: number;
  unresolvedComments: number;
}

export interface UserInfo {
  name: string;
  email: string;
  id: string;
  avatar?: string;
}

export interface CommentThread {
  id: string;
  rootComment: Comment;
  replies: Comment[];
  isResolved: boolean;
  createdAt: Date;
  lastActivity: Date;
  participants: string[];
}

export interface CommentOptions {
  defaultColor: CommentColor;
  showResolved: boolean;
  sortBy: 'timestamp' | 'position' | 'author';
  groupByThread: boolean;
  autoSave: boolean;
  enableNotifications: boolean;
}

export type CommentColor = 
  | 'yellow' 
  | 'green' 
  | 'blue' 
  | 'pink' 
  | 'orange' 
  | 'purple' 
  | 'red' 
  | 'gray';

export interface CommentTemplate {
  id: string;
  name: string;
  text: string;
  color: CommentColor;
  category: string;
}

export interface CommentLibrary {
  templates: CommentTemplate[];
  categories: string[];
}

export interface CommentStats {
  totalComments: number;
  commentsByUser: { [userId: string]: number };
  commentsByPage: { [pageNumber: number]: number };
  averageRepliesPerComment: number;
  mostActiveThreads: CommentThread[];
  resolutionRate: number;
}
