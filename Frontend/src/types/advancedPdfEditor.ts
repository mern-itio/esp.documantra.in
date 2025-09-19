export interface TextBlock {
  id: string;
  text: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  flags: number;
}

export interface PdfInfo {
  pageCount: number;
  fileSize: number;
  pageWidth: number;
  pageHeight: number;
  isEncrypted: boolean;
  metadata: {
    title: string;
    author: string;
    subject: string;
    creator: string;
    producer: string;
    creationDate: string;
    modificationDate: string;
  };
  pages: Array<{
    pageNumber: number;
    width: number;
    height: number;
    rotation: number;
  }>;
}

export interface EditOperation {
  type: 'replaceText' | 'addText' | 'addImage' | 'addShape' | 'highlight' | 'updateTextBlocks';
  pageNumber: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  oldText?: string;
  newText?: string;
  text?: string;
  imageData?: string;
  textBlocks?: TextBlock[];
  shapeType?: string;
  points?: Array<{ x: number; y: number }>;
  style?: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    strokeWidth?: number;
    rotation?: number;
  };
}

export interface EditorState {
  currentPage: number;
  totalPages: number;
  zoom: number;
  selectedTool: 'select' | 'text' | 'pen' | 'shape' | 'image' | 'highlight';
  selectedElement: TextBlock | null;
  isEditing: boolean;
  edits: EditOperation[];
  textBlocks: TextBlock[];
  pdfInfo: PdfInfo | null;
  fileName: string | null;
}

export interface EditorActions {
  setCurrentPage: (page: number) => void;
  setZoom: (zoom: number) => void;
  setSelectedTool: (tool: EditorState['selectedTool']) => void;
  setSelectedElement: (element: TextBlock | null) => void;
  setIsEditing: (editing: boolean) => void;
  addEdit: (edit: EditOperation) => void;
  clearEdits: () => void;
  setTextBlocks: (blocks: TextBlock[]) => void;
  setPdfInfo: (info: PdfInfo | null) => void;
  setFileName: (name: string | null) => void;
}

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingElement {
  id: string;
  type: 'pen' | 'rectangle' | 'ellipse' | 'line';
  points: DrawingPoint[];
  style: {
    color: string;
    strokeWidth: number;
    fillColor?: string;
  };
  pageNumber: number;
}

export interface ImageElement {
  id: string;
  imageData: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  pageNumber: number;
  rotation: number;
}

export interface HighlightElement {
  id: string;
  type: 'highlight' | 'underline' | 'strikethrough' | 'squiggly';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  pageNumber: number;
  style: {
    color: string;
    opacity: number;
  };
}

export interface CommentElement {
  id: string;
  content: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  pageNumber: number;
  author: string;
  timestamp: string;
  style: {
    color: string;
    opacity: number;
  };
}
