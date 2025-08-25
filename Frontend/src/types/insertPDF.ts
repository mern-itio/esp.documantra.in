// Insert PDF Types

export interface InsertPDFRequest {
  mainDocument: File;
  sourceDocuments: File[];
  insertions: Insertion[];
}

export interface Insertion {
  type: 'import' | 'blank';
  position: number;
  sourceDocumentIndex?: number;
  sourcePageIndex?: number;
  blankPageSize?: PageSizeOption;
}

export interface PageSizeOption {
  name: string;
  width: number;
  height: number;
  description: string;
}

export interface InsertPDFResponse {
  success: boolean;
  message?: string;
  file?: {
    filename: string;
    path: string;
    size: number;
  };
  downloadUrl?: string;
  insertions?: Insertion[];
  totalInsertions?: number;
  error?: string;
}

// PDFInfo is available from common types when needed

export interface InsertPageItem {
  id: string;
  pageNumber: number;
  sourceDocument?: string;
  sourcePage?: number;
}

export const PAGE_SIZE_OPTIONS: PageSizeOption[] = [
  {
    name: 'A4',
    width: 595,
    height: 842,
    description: 'Standard A4 size (210 × 297 mm)'
  },
  {
    name: 'Letter',
    width: 612,
    height: 792,
    description: 'US Letter size (8.5 × 11 inches)'
  },
  {
    name: 'Legal',
    width: 612,
    height: 1008,
    description: 'US Legal size (8.5 × 14 inches)'
  },
  {
    name: 'A3',
    width: 842,
    height: 1191,
    description: 'A3 size (297 × 420 mm)'
  },
  {
    name: 'Custom',
    width: 595,
    height: 842,
    description: 'Custom dimensions'
  }
];
