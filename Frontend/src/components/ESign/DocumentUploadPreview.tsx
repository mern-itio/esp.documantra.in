import React from 'react';
import { FileText } from 'lucide-react';
import { Document as PDFDocument, Page as PDFPage } from 'react-pdf';
import type { Document as ESDocument } from '../../types';
import {
  getEsignDocumentPreviewKind,
  getEsignUploadExtension,
} from '../../config/esignUploadFormats';

type PreviewDoc = Pick<ESDocument, 'name' | 'type' | 'url' | 'file'>;

function resolvePreviewKind(doc: PreviewDoc) {
  return getEsignDocumentPreviewKind({
    name: doc.name,
    type: doc.type || doc.file?.type,
  });
}

function getDocumentTypeLabel(doc: PreviewDoc): string {
  const ext = getEsignUploadExtension(doc.name).toUpperCase();
  if (ext) return ext;
  if ((doc.type || '').startsWith('image/')) return 'IMAGE';
  return 'FILE';
}

export function DocumentUploadThumbnail({
  doc,
  pdfWidth = 120,
  minHeight = '150px',
  className = '',
}: {
  doc: PreviewDoc;
  pdfWidth?: number;
  minHeight?: string;
  className?: string;
}) {
  const kind = resolvePreviewKind(doc);

  if (kind === 'image' && doc.url) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center overflow-hidden bg-background p-2 ${className}`}
        style={{ minHeight }}
      >
        <img
          src={doc.url}
          alt={doc.name}
          className="max-h-full max-w-full object-contain"
        />
      </div>
    );
  }

  if (kind === 'pdf' && doc.url) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center overflow-hidden bg-background ${className}`}
        style={{ minHeight }}
      >
        <PDFDocument file={doc.url}>
          <PDFPage
            pageNumber={1}
            width={pdfWidth}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </PDFDocument>
      </div>
    );
  }

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-muted/40 px-3 py-4 text-center ${className}`}
      style={{ minHeight }}
    >
      <div className="rounded-xl bg-primary/10 p-3">
        <FileText className="h-8 w-8 text-primary" />
      </div>
      <p className="mt-2 line-clamp-2 text-xs font-medium text-foreground">{doc.name}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        {getDocumentTypeLabel(doc)} · converts to PDF on send
      </p>
    </div>
  );
}

export function DocumentUploadViewer({
  doc,
  pdfWidth = 900,
  onPdfLoadSuccess,
  onPdfLoadError,
}: {
  doc: PreviewDoc;
  pdfWidth?: number;
  onPdfLoadSuccess?: (numPages: number) => void;
  onPdfLoadError?: (error: Error) => void;
}) {
  const kind = resolvePreviewKind(doc);

  if (kind === 'image' && doc.url) {
    return (
      <div className="flex h-full w-full items-center justify-center overflow-auto p-4">
        <img
          src={doc.url}
          alt={doc.name}
          className="max-h-full max-w-full rounded-lg border border-border object-contain shadow-lg"
        />
      </div>
    );
  }

  if (kind === 'pdf' && doc.url) {
    return (
      <DocumentPdfPages
        url={doc.url}
        pdfWidth={pdfWidth}
        onLoadSuccess={onPdfLoadSuccess}
        onLoadError={onPdfLoadError}
      />
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="rounded-2xl bg-primary/10 p-5">
        <FileText className="h-12 w-12 text-primary" />
      </div>
      <div>
        <p className="text-base font-semibold text-foreground">{doc.name}</p>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {getDocumentTypeLabel(doc)} files are converted to PDF automatically when you continue.
          Preview is not available before upload.
        </p>
      </div>
    </div>
  );
}

function DocumentPdfPages({
  url,
  pdfWidth,
  onLoadSuccess,
  onLoadError,
}: {
  url: string;
  pdfWidth: number;
  onLoadSuccess?: (numPages: number) => void;
  onLoadError?: (error: Error) => void;
}) {
  const [numPages, setNumPages] = React.useState<number | null>(null);

  return (
    <div className="flex h-full w-full flex-col items-center gap-4 overflow-auto p-4">
      <PDFDocument
        file={url}
        onLoadSuccess={({ numPages: pages }) => {
          setNumPages(pages);
          onLoadSuccess?.(pages);
        }}
        onLoadError={(error) => {
          console.error('Error loading PDF:', error);
          setNumPages(null);
          onLoadError?.(error);
        }}
      >
        {numPages &&
          [...Array(numPages)].map((_, index) => (
            <PDFPage
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              width={pdfWidth}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="mb-4 shadow-lg"
            />
          ))}
      </PDFDocument>
      {!numPages && (
        <div className="flex h-full items-center justify-center">
          <div className="text-muted-foreground">Loading PDF...</div>
        </div>
      )}
    </div>
  );
}
