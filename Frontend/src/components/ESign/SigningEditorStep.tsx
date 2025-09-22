import React, { useEffect, useMemo, useState, useRef } from "react";
import { FileText, UserCircle } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

export type Doc = {
  id: string;
  name: string;
  size?: number;
  pages?: number;
  url?: string;
  type?: string;
  file?: File;
};

export type Recipient = {
  id: string;
  name: string;
  email: string;
  role: "signer" | "approver" | "carbon_copy" | "in_person_signer";
};

type FieldType = "signature" | "text" | "email" | "number";

export type SignatureField = {
  id: string;
  _id?: string;
  docId: string;
  documentId?: string;
  recipientId?: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: FieldType;
  label?: string;
  locked?: boolean;
};

const RECIPIENT_COLORS = ["#2563eb", "#059669", "#d97706", "#db2777", "#7c3aed", "#f43f5e"];
function getRecipientColor(idx: number) {
  return RECIPIENT_COLORS[idx % RECIPIENT_COLORS.length];
}

export default function SigningEditorStep({
  documents,
  recipients,
  signatureFields,
  setSignatureFields,
  mode,
  powerFormData,
}: {
  documents: Doc[];
  recipients: Recipient[];
  signatureFields: SignatureField[];
  setSignatureFields: React.Dispatch<React.SetStateAction<SignatureField[]>>;
  mode: "normal" | "power";
  powerFormData?: Record<string, any>;
}) {
  // PDF.js worker
  useEffect(() => {
    if (typeof window !== "undefined") {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    }
  }, []);

  const [activeDocId, setActiveDocId] = useState<string | null>(documents[0]?.id ?? null);
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(mode === "power" ? "signer1" : recipients[0]?.id ?? null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [dragging, setDragging] = useState(false);
  const [draggedField, setDraggedField] = useState<null | { type: FieldType; label?: string }>(null);
  const [dropPreview, setDropPreview] = useState<{ x: number; y: number } | null>(null);
  const [movingFieldId, setMovingFieldId] = useState<string | null>(null);
  const [moveOffset, setMoveOffset] = useState<{ x: number; y: number } | null>(null);

  const pdfContainerRef = useRef<HTMLDivElement>(null);

  const activeDoc = useMemo(() => documents.find(d => d.id === activeDocId) || null, [activeDocId, documents]);
  const activeRecipient = useMemo(
    () =>
      recipients.find(r => r.id === activeRecipientId) ||
      (mode === "power" ? { id: "signer1", name: "Signer 1", email: "", role: "signer" } : null),
    [activeRecipientId, recipients, mode]
  );

  const recipientColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    recipients.forEach((r, idx) => (map[r.id] = getRecipientColor(idx)));
    if (mode === "power") map["signer1"] = getRecipientColor(0);
    return map;
  }, [recipients, mode]);

  // Initialize first doc and recipient
  useEffect(() => {
    if (!activeDocId && documents.length) setActiveDocId(documents[0].id);
  }, [documents]);

  useEffect(() => {
    if (!activeRecipientId) {
      setActiveRecipientId(mode === "power" ? "signer1" : recipients[0]?.id ?? null);
    }
  }, [recipients, mode]);

  const handleDragStart = (e: React.DragEvent, field: { type: FieldType; label?: string }) => {
    setDraggedField(field);
    setDragging(true);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragEnd = () => {
    setDragging(false);
    setDraggedField(null);
    setDropPreview(null);
  };

  function getPageElement(): HTMLElement | null {
    if (!pdfContainerRef.current) return null;
    const canvas = pdfContainerRef.current.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return pdfContainerRef.current.querySelector(".react-pdf__Page")?.parentElement ?? null;
    let el: HTMLElement | null = canvas;
    while (el && el !== pdfContainerRef.current) {
      try {
        if (window.getComputedStyle(el).position === "relative") return el;
      } catch (err) {}
      el = el.parentElement;
    }
    return canvas.parentElement;
  }

  const handlePdfDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedField) return;
    const pageEl = getPageElement();
    const rect = pageEl?.getBoundingClientRect();
    if (!rect) return;
    setDropPreview({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handlePdfDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedField || !activeDocId) return;
    const pageEl = getPageElement();
    const rect = pageEl?.getBoundingClientRect();
    if (!rect) return;

    const width = 120,
      height = 40;
    let left = e.clientX - rect.left - width / 2;
    let top = e.clientY - rect.top - height / 2;

    left = Math.max(0, Math.min(left, rect.width - width));
    top = Math.max(0, Math.min(top, rect.height - height));

    setSignatureFields(prev => [
      ...prev,
      {
        id: `${Date.now()}`,
        docId: activeDocId,
        recipientId: mode === "power" ? "signer1" : activeRecipientId ?? undefined,
        page: currentPage,
        x: left,
        y: top,
        width,
        height,
        type: draggedField.type,
        label: draggedField.label,
      },
    ]);

    setDragging(false);
    setDraggedField(null);
    setDropPreview(null);
  };

  const handleFieldMouseDown = (e: React.MouseEvent, field: SignatureField) => {
    if (field.locked) return;
    if (mode === "normal" && field.recipientId !== activeRecipientId) return;

    e.stopPropagation();
    const pageEl = getPageElement();
    const pageRect = pageEl?.getBoundingClientRect();
    if (!pageRect) return;

    setMovingFieldId(field.id ?? field._id ?? null);
    setMoveOffset({
      x: e.clientX - ((pageRect.left ?? 0) + field.x),
      y: e.clientY - ((pageRect.top ?? 0) + field.y),
    });
  };

  useEffect(() => {
    if (!movingFieldId) return;

    const handleMouseMove = (e: MouseEvent) => {
      const pageEl = getPageElement();
      const pageRect = pageEl?.getBoundingClientRect();
      const pageLeft = pageRect?.left ?? 0;
      const pageTop = pageRect?.top ?? 0;
      const pageWidth = pageRect?.width ?? Infinity;
      const pageHeight = pageRect?.height ?? Infinity;

      setSignatureFields(fields =>
        fields.map(f =>
          (f.id ?? f._id) === movingFieldId
            ? {
                ...f,
                x: Math.max(0, Math.min(e.clientX - pageLeft - (moveOffset?.x ?? 0), pageWidth - f.width)),
                y: Math.max(0, Math.min(e.clientY - pageTop - (moveOffset?.y ?? 0), pageHeight - f.height)),
              }
            : f
        )
      );
    };

    const handleMouseUp = () => {
      setMovingFieldId(null);
      setMoveOffset(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [movingFieldId, moveOffset]);



  const onDocLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const addFieldsForAllRecipients = () => {
    if (!activeDocId) return;
    const pageWidth = 800,
      pageHeight = 1000;
    const width = 120,
      height = 40;
    const bottomMargin = 20;
    const gap = 12,
      rowGap = 10,
      sideMargin = 50;
    const targetPage = numPages > 0 ? numPages : 1;
    const recipientsList = mode === "power" ? [{ id: "signer1" }] : recipients;

    const usableWidth = Math.max(1, pageWidth - sideMargin * 2);
    const perRow = Math.max(1, Math.floor((usableWidth + gap) / (width + gap)));

    const newFields: SignatureField[] = recipientsList.map((r, idx) => {
      const col = idx % perRow;
      const row = Math.floor(idx / perRow);
      const itemsInThisRow = Math.min(perRow, Math.max(0, recipientsList.length - row * perRow));
      const rowTotalWidth = itemsInThisRow * width + (itemsInThisRow - 1) * gap;
      const startXForRow = sideMargin + Math.max(0, (usableWidth - rowTotalWidth) / 2);
      const x = startXForRow + col * (width + gap);
      const y = pageHeight - height - bottomMargin - row * (height + rowGap);

      return {
        id: `auto_${Date.now()}_${idx}`,
        docId: activeDocId,
        recipientId: r.id,
        page: targetPage,
        x,
        y,
        width,
        height,
        type: "signature",
        locked: true,
      };
    });

    setSignatureFields(prev => [...prev, ...newFields]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {documents.map(doc => {
          const isActive = doc.id === activeDocId;
          return (
            <button
              key={doc.id}
              onClick={() => {
                setActiveDocId(doc.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-2 rounded-xl border text-sm flex items-center gap-2 ${
                isActive ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300"
              } hover:shadow-sm`}
            >
              <FileText className="w-4 h-4" />
              <span className="truncate max-w-[180px]">{doc.name}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
        {/* PDF viewer */}
        <div className="col-span-12 lg:col-span-9 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
            <div className="text-sm text-gray-600">
              Viewing: <span className="font-medium text-gray-900">{activeDoc?.name ?? "—"}</span>
            </div>
            <div className="text-xs text-gray-500">Step 3: PDF Canvas Rendering</div>
          </div>

          <div className="flex-1 overflow-auto bg-gray-50 relative" ref={pdfContainerRef} onDragOver={handlePdfDragOver} onDrop={handlePdfDrop}>
            {activeDoc?.type === "application/pdf" ? (
              <Document file={activeDoc.file || `${import.meta.env.VITE_ESIGN_SERVICE_URL}/uploads/${activeDoc.name}`} onLoadSuccess={onDocLoadSuccess}>
                <div className="relative w-max mx-auto">
                  <Page pageNumber={currentPage} width={800} className="shadow mb-4" />
                  {signatureFields
                    .filter(f => (f.docId ?? f.documentId) === activeDocId && f.page === currentPage)
                    .map(f => {
                      const color = recipientColorMap[f.recipientId ?? ""] || "#2563eb";
                      return (
                        <div
                          key={f.id ?? f._id}
                          style={{
                            position: "absolute",
                            left: f.x,
                            top: f.y,
                            width: f.width,
                            height: f.height,
                            border: `2px dashed ${color}`,
                            background: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 6,
                            cursor: f.locked ? "not-allowed" : "move",
                          }}
                          onMouseDown={e => handleFieldMouseDown(e, f)}
                          title={f.type === "signature" ? "Signature" : f.label}
                        >
                          {f.type === "signature" ? "Signature" : f.label || f.type}
                        </div>
                      );
                    })}

                  {dragging && dropPreview && (
                    <div
                      style={{
                        position: "absolute",
                        left: dropPreview.x - 60,
                        top: dropPreview.y - 20,
                        width: 120,
                        height: 40,
                        border: `2px dashed ${recipientColorMap[activeRecipientId!] || "#2563eb"}`,
                        background: "#e0e7ff88",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 6,
                        pointerEvents: "none",
                        zIndex: 20,
                      }}
                    >
                      {draggedField?.type === "signature" ? "Signature" : draggedField?.label || draggedField?.type}
                    </div>
                  )}
                </div>
              </Document>
            ) : (
              <div className="text-center p-8 text-gray-500">Preview not available</div>
            )}
          </div>

          {numPages > 1 && (
            <div className="flex justify-center gap-4 py-2 border-t border-gray-200 bg-gray-50">
              <button disabled={currentPage <= 1} onClick={() => setCurrentPage(prev => prev - 1)} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">
                Previous
              </button>
              <span className="text-sm text-gray-600">
                {currentPage} / {numPages}
              </span>
              <button disabled={currentPage >= numPages} onClick={() => setCurrentPage(prev => prev + 1)} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">
                Next
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-3">
          <div className="h-full rounded-2xl border border-gray-200 shadow-sm bg-white flex flex-col">
            {mode === "normal" && (
              <>
                <div className="px-4 py-3 border-b border-gray-200 font-medium text-sm text-gray-700">Recipients</div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                  {recipients.map(r => {
                    const isActive = r.id === activeRecipientId;
                    const color = recipientColorMap[r.id] || "#2563eb";
                    return (
                      <button
                        key={r.id}
                        onClick={() => setActiveRecipientId(r.id)}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 text-sm ${
                          isActive ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-50 text-gray-700"
                        }`}
                        style={{ borderLeft: `6px solid ${color}` }}
                      >
                        <UserCircle className="w-5 h-5 shrink-0" color={color} />
                        <div className="flex flex-col">
                          <span className="truncate">{r.name || "Unnamed"}</span>
                          <span className="text-xs text-gray-500">{r.role}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {activeRecipient && (
                  <div className="p-3 text-xs text-gray-500 border-t border-gray-200">
                    Active: <span className="font-medium text-gray-700">{activeRecipient.name}</span>
                  </div>
                )}
              </>
            )}

            {/* Toolbox */}
            <div className="border-t border-gray-200 p-4">
              <div className="font-medium text-xs text-gray-500 mb-2">Toolbox</div>

              <div className="mb-2">
                <button onClick={addFieldsForAllRecipients} className="w-full text-sm px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">
                  Add Fixed Field
                </button>
              </div>

              {mode === "normal" ? (
                <div
                  draggable
                  onDragStart={e => handleDragStart(e, { type: "signature" })}
                  onDragEnd={handleDragEnd}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                  style={{
                    borderColor: recipientColorMap[activeRecipientId!] || "#2563eb",
                    background: "#f1f5ff",
                    color: recipientColorMap[activeRecipientId!] || "#2563eb",
                    width: 120,
                    cursor: "grab",
                  }}
                >
                  Signature
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {powerFormData?.fields?.map((field: any) => (
                    <div
                      key={field._id}
                      draggable
                      onDragStart={e => handleDragStart(e, { type: field.type, label: field.label })}
                      onDragEnd={handleDragEnd}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-gray-50 cursor-grab"
                    >
                      {field.label} ({field.type})
                    </div>
                  ))}
                </div>
              )}

              <div className="text-[11px] text-gray-400 mt-2">Drag and drop onto the PDF to add fields.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
