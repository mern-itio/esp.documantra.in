// PDF Editor Types
export interface PDFEditorState {
  currentPage: number;
  totalPages: number;
  zoom: number;
  viewMode: 'single' | 'continuous' | 'facing' | 'facing-continuous';
  tool: PDFTool;
  isModified: boolean;
  fileName: string;
  fileSize: number;
  lastSaved?: Date;
}

export interface PDFTool {
  type: 'select' | 'text' | 'highlight' | 'pen' | 'eraser' | 'shape' | 'stamp' | 'signature' | 'comment' | 'link' | 'image';
  subType?: string;
  color: string;
  strokeWidth: number;
  opacity: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  textAlign?: 'left' | 'center' | 'right';
  fillColor?: string;
  fillOpacity?: number;
}

export interface PDFAnnotation {
  id: string;
  type: 'text' | 'highlight' | 'pen' | 'shape' | 'stamp' | 'signature' | 'comment' | 'link' | 'image';
  pageNumber: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  content: string;
  style: {
    color: string;
    strokeWidth: number;
    opacity: number;
    fontSize?: number;
    fontFamily?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  };
  author: string;
  createdAt: Date;
  modifiedAt?: Date;
  isLocked: boolean;
  isVisible: boolean;
  zIndex: number;
}

export interface PDFTextAnnotation extends PDFAnnotation {
  type: 'text';
  text: string;
  style: {
    color: string;
    strokeWidth: number;
    opacity: number;
    fontSize: number;
    fontFamily: string;
    fontWeight: 'normal' | 'bold' | 'italic';
    textAlign: 'left' | 'center' | 'right';
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  };
}

export interface PDFHighlightAnnotation extends PDFAnnotation {
  type: 'highlight';
  text: string;
  highlightType: 'highlight' | 'underline' | 'strikethrough' | 'squiggly';
  style: {
    color: string;
    strokeWidth: number;
    opacity: number;
    thickness: number;
  };
}

export interface PDFPenAnnotation extends PDFAnnotation {
  type: 'pen';
  path: Array<{x: number, y: number}>;
  style: {
    color: string;
    strokeWidth: number;
    opacity: number;
    lineCap: 'butt' | 'round' | 'square';
    lineJoin: 'miter' | 'round' | 'bevel';
  };
}

export interface PDFShapeAnnotation extends PDFAnnotation {
  type: 'shape';
  shapeType: 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'polygon' | 'freeform';
  points: Array<{x: number, y: number}>;
  style: {
    color: string;
    strokeWidth: number;
    opacity: number;
    fillColor?: string;
    fillOpacity?: number;
    borderColor?: string;
    borderWidth?: number;
  };
}

export interface PDFStampAnnotation extends PDFAnnotation {
  type: 'stamp';
  stampType: 'approved' | 'rejected' | 'draft' | 'confidential' | 'urgent' | 'custom';
  customImage?: string;
  style: {
    color: string;
    strokeWidth: number;
    opacity: number;
    rotation: number;
  };
}

export interface PDFSignatureAnnotation extends PDFAnnotation {
  type: 'signature';
  signatureData: string; // Base64 image data
  style: {
    color: string;
    strokeWidth: number;
    opacity: number;
    rotation: number;
  };
}

export interface PDFCommentAnnotation extends PDFAnnotation {
  type: 'comment';
  comment: string;
  replies: Array<{
    id: string;
    author: string;
    content: string;
    createdAt: Date;
  }>;
  style: {
    color: string;
    strokeWidth: number;
    opacity: number;
    backgroundColor: string;
    borderColor: string;
  };
}

export interface PDFLinkAnnotation extends PDFAnnotation {
  type: 'link';
  url: string;
  targetPage?: number;
  targetPosition?: {x: number, y: number};
  style: {
    color: string;
    strokeWidth: number;
    opacity: number;
    underline: boolean;
  };
}

export interface PDFImageAnnotation extends PDFAnnotation {
  type: 'image';
  imageData: string; // Base64 image data
  originalWidth: number;
  originalHeight: number;
  style: {
    color: string;
    strokeWidth: number;
    opacity: number;
    rotation: number;
    borderColor?: string;
    borderWidth?: number;
  };
}

export interface PDFPage {
  pageNumber: number;
  width: number;
  height: number;
  thumbnail: string; // Base64 thumbnail
  annotations: PDFAnnotation[];
  isVisible: boolean;
}

export interface PDFDocument {
  id: string;
  fileName: string;
  fileSize: number;
  totalPages: number;
  pages: PDFPage[];
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
  permissions: {
    canPrint: boolean;
    canModify: boolean;
    canCopy: boolean;
    canAddAnnotations: boolean;
  };
  isPasswordProtected: boolean;
  isEncrypted: boolean;
}

export interface PDFEditorToolbar {
  tools: PDFToolbarGroup[];
  isVisible: boolean;
  position: 'top' | 'bottom';
}

export interface PDFToolbarGroup {
  id: string;
  name: string;
  tools: PDFToolbarItem[];
  isCollapsible: boolean;
  isCollapsed: boolean;
}

export interface PDFToolbarItem {
  id: string;
  name: string;
  icon: string;
  tool: PDFTool;
  isActive: boolean;
  isDisabled: boolean;
  shortcut?: string;
  subItems?: PDFToolbarItem[];
}

export interface PDFEditorSidebar {
  isVisible: boolean;
  width: number;
  activeTab: 'thumbnails' | 'bookmarks' | 'layers' | 'comments' | 'properties';
  thumbnails: PDFThumbnail[];
  bookmarks: PDFBookmark[];
  layers: PDFLayer[];
}

export interface PDFThumbnail {
  pageNumber: number;
  image: string; // Base64 thumbnail
  width: number;
  height: number;
  isSelected: boolean;
  annotations: number;
}

export interface PDFBookmark {
  id: string;
  title: string;
  pageNumber: number;
  level: number;
  children: PDFBookmark[];
  isExpanded: boolean;
  isVisible: boolean;
}

export interface PDFLayer {
  id: string;
  name: string;
  isVisible: boolean;
  isLocked: boolean;
  opacity: number;
  annotations: string[]; // Annotation IDs
}

export interface PDFEditorSettings {
  theme: 'light' | 'dark';
  language: string;
  defaultTool: PDFTool;
  autoSave: boolean;
  autoSaveInterval: number;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  showRulers: boolean;
  showPageNumbers: boolean;
  showAnnotations: boolean;
  enableCollaboration: boolean;
  enableComments: boolean;
  enableVersioning: boolean;
}

export interface PDFEditorHistory {
  actions: PDFEditorAction[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
}

export interface PDFEditorAction {
  id: string;
  type: 'add' | 'modify' | 'delete' | 'move' | 'resize' | 'style';
  target: 'annotation' | 'page' | 'document';
  targetId: string;
  data: any;
  timestamp: Date;
}

export interface PDFEditorExport {
  format: 'pdf' | 'pdfa' | 'pdfx';
  quality: 'low' | 'medium' | 'high' | 'original';
  includeAnnotations: boolean;
  includeComments: boolean;
  includeLayers: boolean;
  flattenAnnotations: boolean;
  compressImages: boolean;
  optimizeForWeb: boolean;
}

export interface PDFEditorImport {
  format: 'pdf' | 'image' | 'text';
  file: File;
  options: {
    mergeWithExisting: boolean;
    replaceExisting: boolean;
    addAsNewPage: boolean;
    extractText: boolean;
    extractImages: boolean;
  };
}

export interface PDFEditorCollaboration {
  isEnabled: boolean;
  users: PDFEditorUser[];
  permissions: {
    canEdit: boolean;
    canComment: boolean;
    canView: boolean;
    canExport: boolean;
  };
  realTimeSync: boolean;
  conflictResolution: 'last-wins' | 'manual' | 'merge';
}

export interface PDFEditorUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  isOnline: boolean;
  lastSeen: Date;
  currentPage?: number;
  currentTool?: PDFTool;
}

export interface PDFEditorValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface PDFEditorAnalytics {
  totalEdits: number;
  totalAnnotations: number;
  totalTimeSpent: number;
  mostUsedTools: Array<{
    tool: string;
    count: number;
  }>;
  collaborationStats: {
    totalUsers: number;
    activeUsers: number;
    totalComments: number;
    resolvedComments: number;
  };
  performance: {
    loadTime: number;
    renderTime: number;
    memoryUsage: number;
  };
}
