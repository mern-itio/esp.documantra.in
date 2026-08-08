import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  Briefcase,
  Building2,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  FileSignature,
  Hash,
  PenLine,
  Stamp,
  Trash2,
  Type,
  User,
} from 'lucide-react';
import { PDFJS_WORKER_SRC } from '../../../config/pdfjsWorker';
import { resolveEsignDocumentFileProp } from '../../../utils/esignDocumentUrl';

pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;

export type DemoPlacedField = {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  label: string;
  status: 'pending';
};

type FieldPaletteItem = {
  type: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const PALETTE: FieldPaletteItem[] = [
  { type: 'signature', label: 'Signature', icon: FileSignature },
  { type: 'initial', label: 'Initial', icon: PenLine },
  { type: 'stamp', label: 'Stamp', icon: Stamp },
  { type: 'date', label: 'Date Signed', icon: Calendar },
  { type: 'name', label: 'Name', icon: User },
  { type: 'email', label: 'Email', icon: Type },
  { type: 'company', label: 'Company', icon: Building2 },
  { type: 'title', label: 'Title', icon: Briefcase },
  { type: 'text', label: 'Text', icon: Type },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'checkbox', label: 'Checkbox', icon: Check },
];

function defaultFieldSize(type: string) {
  if (type === 'signature') return { width: 240, height: 34 };
  if (type === 'initial') return { width: 120, height: 30 };
  if (type === 'checkbox') return { width: 24, height: 24 };
  return { width: 200, height: 20 };
}

type Props = {
  pdfFile: File | null;
  documentId?: string;
  envelopeId?: string;
  recipientLabel?: string;
  fields: DemoPlacedField[];
  onChange: (fields: DemoPlacedField[]) => void;
  readOnly?: boolean;
  title?: string;
  description?: string;
};

export default function DemoFieldPlacer({
  pdfFile,
  documentId,
  envelopeId,
  recipientLabel,
  fields,
  onChange,
  readOnly = false,
  title = 'Place fields on document',
  description,
}: Props) {
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageWidth, setPageWidth] = useState(480);
  const [draggedPalette, setDraggedPalette] = useState<FieldPaletteItem | null>(null);
  const [selectedPalette, setSelectedPalette] = useState<FieldPaletteItem | null>(null);
  const [dropPreview, setDropPreview] = useState<{ x: number; y: number } | null>(null);

  const pdfSource = useMemo(() => {
    if (pdfFile?.name.toLowerCase().endsWith('.pdf')) {
      return pdfFile;
    }
    if (documentId) {
      return resolveEsignDocumentFileProp({ id: documentId }, { envelopeId });
    }
    return null;
  }, [pdfFile, documentId, envelopeId]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const update = () => {
      const available = el.clientWidth - 32;
      if (available > 0) {
        setPageWidth(Math.max(280, Math.min(920, available)));
      }
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [pdfSource]);

  const addFieldAt = useCallback(
    (clientX: number, clientY: number, palette: FieldPaletteItem) => {
      const el = pageContainerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
        return;
      }

      const { width, height } = defaultFieldSize(palette.type);
      let left = clientX - rect.left - width / 2;
      let top = clientY - rect.top - height / 2;
      left = Math.max(0, Math.min(left, rect.width - width));
      top = Math.max(0, Math.min(top, rect.height - height));

      const newField: DemoPlacedField = {
        id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        page: currentPage,
        x: Math.round(left),
        y: Math.round(top),
        width,
        height,
        type: palette.type,
        label: palette.label,
        status: 'pending',
      };
      onChange([...fields, newField]);
    },
    [currentPage, fields, onChange],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedPalette) return;
    const el = pageContainerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropPreview({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedPalette) return;
    addFieldAt(e.clientX, e.clientY, draggedPalette);
    setDraggedPalette(null);
    setDropPreview(null);
  };

  const handlePageClick = (e: React.MouseEvent) => {
    if (readOnly || !selectedPalette || draggedPalette) return;
    addFieldAt(e.clientX, e.clientY, selectedPalette);
  };

  const removeField = (id: string) => {
    if (readOnly) return;
    onChange(fields.filter((f) => f.id !== id));
  };

  if (!pdfSource) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Upload a PDF first, or complete the upload step so the converted document can be loaded for
        field placement.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E8E0D4] bg-white shadow-sm">
      <div className="border-b border-[#E8E0D4] bg-[#F7F3EE] px-4 py-3">
        <h3 className="text-sm font-bold text-[#260559]">{title}</h3>
        <p className="mt-1 text-xs text-gray-600">
          {description ??
            (readOnly
              ? 'Fields are locked — envelope has been sent or completed.'
              : 'Drag a field onto the PDF, or select a field type then click where it should go.')}
          {recipientLabel ? ` Assigned to: ${recipientLabel}.` : ''}
        </p>
      </div>

      <div className="flex min-h-[480px] flex-col md:flex-row">
        {!readOnly && (
        <aside className="w-full shrink-0 border-b border-[#E8E0D4] p-3 md:w-[240px] md:border-b-0 md:border-r">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Standard fields
          </p>
          <ul className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:block md:space-y-1 md:max-h-[420px] md:overflow-y-auto">
            {PALETTE.map((item) => {
              const Icon = item.icon;
              const active = selectedPalette?.type === item.type;
              return (
                <li key={item.type}>
                  <button
                    type="button"
                    draggable
                    onDragStart={() => {
                      setDraggedPalette(item);
                      setSelectedPalette(null);
                    }}
                    onDragEnd={() => {
                      setDraggedPalette(null);
                      setDropPreview(null);
                    }}
                    onClick={() => {
                      setSelectedPalette(active ? null : item);
                      setDraggedPalette(null);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition ${
                      active
                        ? 'border-[#155E4B] bg-[#155E4B]/10 text-[#155E4B]'
                        : 'border-transparent bg-[#F5F2EE] text-gray-800 hover:border-[#E8E0D4] hover:bg-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
          {selectedPalette && (
            <p className="mt-3 rounded-lg bg-sky-50 px-2 py-1.5 text-[11px] text-sky-800">
              Click on the document to place <strong>{selectedPalette.label}</strong>.
            </p>
          )}
        </aside>
        )}

        <div className="flex min-h-[420px] min-w-0 flex-1 flex-col bg-slate-100">
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-3 py-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded p-1 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-medium text-gray-700">
                Page {currentPage}
                {numPages > 0 ? ` / ${numPages}` : ''}
              </span>
              <button
                type="button"
                disabled={numPages > 0 && currentPage >= numPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="rounded p-1 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <span className="text-xs text-gray-500">{fields.length} field(s) placed</span>
          </div>

          <div
            ref={scrollContainerRef}
            className="relative min-h-[420px] min-w-0 flex-1 overflow-auto p-4"
          >
            <div
              ref={pageContainerRef}
              className="relative mx-auto w-fit shadow-md"
              onClick={handlePageClick}
              style={{ cursor: !readOnly && selectedPalette ? 'crosshair' : 'default' }}
            >
              <Document
                file={pdfSource}
                onLoadSuccess={({ numPages: total }) => {
                  setNumPages(total);
                  setCurrentPage((p) => Math.min(p, total || 1));
                }}
                loading={
                  <div
                    className="flex items-center justify-center text-sm text-gray-500"
                    style={{ width: pageWidth, minHeight: 320 }}
                  >
                    Loading document…
                  </div>
                }
                error={
                  <div className="max-w-md rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    Could not preview this file. Use a PDF, or complete upload so the server PDF is
                    available.
                  </div>
                }
              >
                <Page
                  pageNumber={currentPage}
                  width={pageWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>

              {!readOnly && (
              <div
                className="absolute inset-0"
                style={{ pointerEvents: draggedPalette || selectedPalette ? 'auto' : 'none' }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
              )}

              {fields
                .filter((f) => f.page === currentPage)
                .map((field) => (
                  <div
                    key={field.id}
                    className="absolute z-20 flex items-center justify-center rounded border-2 border-dashed border-[#155E4B] bg-[#155E4B]/10 text-[10px] font-semibold text-[#155E4B]"
                    style={{
                      left: field.x,
                      top: field.y,
                      width: field.width,
                      height: field.height,
                    }}
                  >
                    <span className="truncate px-1">{field.label}</span>
                    {!readOnly && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeField(field.id);
                      }}
                      className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow"
                      aria-label={`Remove ${field.label}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    )}
                  </div>
                ))}

              {dropPreview && draggedPalette && (
                <div
                  className="pointer-events-none absolute z-30 rounded border-2 border-dashed border-sky-500 bg-sky-100/80 text-[10px] font-medium text-sky-800"
                  style={{
                    left: dropPreview.x - defaultFieldSize(draggedPalette.type).width / 2,
                    top: dropPreview.y - defaultFieldSize(draggedPalette.type).height / 2,
                    width: defaultFieldSize(draggedPalette.type).width,
                    height: defaultFieldSize(draggedPalette.type).height,
                  }}
                >
                  <span className="flex h-full items-center justify-center">{draggedPalette.label}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {fields.length > 0 && (
        <div className="border-t border-[#E8E0D4] bg-[#F7F3EE] px-4 py-3">
          <p className="mb-2 text-xs font-semibold text-gray-700">Placed fields</p>
          <ul className="flex flex-wrap gap-2">
            {fields.map((f) => (
              <li
                key={f.id}
                className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] text-gray-700 ring-1 ring-[#E8E0D4]"
              >
                <span>
                  {f.label} · p{f.page}
                </span>
                {!readOnly && (
                <button
                  type="button"
                  onClick={() => removeField(f.id)}
                  className="text-red-500 hover:text-red-700"
                  aria-label={`Remove ${f.label}`}
                >
                  ×
                </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
