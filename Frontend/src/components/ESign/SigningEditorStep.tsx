import React, { useEffect, useMemo, useState, useRef } from "react";
import { FileText, UserCircle, X } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;


export type Doc = {
  id: string;
  name: string;
  size?: number;
  pages?: number;
  url?: string;
  type?: string;
  file?: File; // Optional: keep original file reference
};

export type Recipient = {
  id: string;
  name: string;
  email: string;
  role: "signer" | "approver" | "carbon_copy" | "in_person_signer";
};

type SignatureField = {
  id: string;
  docId: string;
  recipientId: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

// Assign a color to each recipient (repeat if more than 6)
const RECIPIENT_COLORS = [
  "#2563eb", // blue
  "#059669", // green
  "#d97706", // amber
  "#db2777", // pink
  "#7c3aed", // purple
  "#f43f5e", // red
];
function getRecipientColor(idx: number) {
  return RECIPIENT_COLORS[idx % RECIPIENT_COLORS.length];
}

export default function SigningEditorStep({
  documents,
  recipients,
  signatureFields,
  setSignatureFields,
}: {
  documents: Doc[];
  recipients: Recipient[];
  signatureFields: SignatureField[]; // current signature fields from parent
  setSignatureFields: React.Dispatch<React.SetStateAction<SignatureField[]>>; // setter
}) {
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [draggedField, setDraggedField] = useState<null | { type: "signature" }>(null);
  const [dropPreview, setDropPreview] = useState<{ x: number; y: number; page: number } | null>(null);
  const [movingFieldId, setMovingFieldId] = useState<string | null>(null);
  const [moveOffset, setMoveOffset] = useState<{ x: number; y: number } | null>(null);

  const pdfContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (documents?.length && !activeDocId) {
      setActiveDocId(documents[0].id);
    }
  }, [documents, activeDocId]);

  useEffect(() => {
    if (recipients?.length && !activeRecipientId) {
      setActiveRecipientId(recipients[0].id);
    }
  }, [recipients, activeRecipientId]);

  const activeDoc = useMemo(
    () => documents?.find((d) => d.id === activeDocId) || null,
    [activeDocId, documents]
  );

  const activeRecipient = useMemo(
    () => recipients?.find((r) => r.id === activeRecipientId) || null,
    [activeRecipientId, recipients]
  );

  // --- Drag from toolbox ---
  const handleDragStart = (e: React.DragEvent) => {
    setDraggedField({ type: "signature" });
    setDragging(true);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragEnd = () => {
    setDragging(false);
    setDraggedField(null);
    setDropPreview(null);
  };

  // --- Drag over PDF ---
  const handlePdfDragOver = (e: React.DragEvent, page: number) => {
    e.preventDefault();
    if (!draggedField) return;
    const rect = pdfContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDropPreview({ x, y, page });
  };

  // --- Drop on PDF ---
  const handlePdfDrop = (e: React.DragEvent, page: number) => {
    e.preventDefault();
    if (!draggedField || !activeDocId || !activeRecipientId) return;
    const rect = pdfContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = 120;
    const height = 40;
    setSignatureFields((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        docId: activeDocId,
        recipientId: activeRecipientId,
        page,
        x: x - width / 2,
        y: y - height / 2,
        width,
        height,
      },
    ]);
    setDragging(false);
    setDraggedField(null);
    setDropPreview(null);
  };

  // --- Move signature field (only for active recipient) ---
  const handleFieldMouseDown = (
    e: React.MouseEvent,
    field: SignatureField
  ) => {
    if (field.recipientId !== activeRecipientId) return;
    e.stopPropagation();
    setMovingFieldId(field.id);
    setMoveOffset({
      x: e.clientX - field.x,
      y: e.clientY - field.y,
    });
  };

  useEffect(() => {
    if (!movingFieldId) return;

    const handleMouseMove = (e: MouseEvent) => {
      setSignatureFields((fields) =>
        fields.map((f) =>
          f.id === movingFieldId
            ? {
                ...f,
                x: e.clientX - (moveOffset?.x ?? 0),
                y: e.clientY - (moveOffset?.y ?? 0),
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
    // eslint-disable-next-line
  }, [movingFieldId, moveOffset]);

  // --- Delete signature field (only for active recipient) ---
  const handleDeleteField = (id: string) => {
    setSignatureFields((fields) => fields.filter((f) => f.id !== id));
  };

  // --- Color for each recipient ---
  const recipientColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    recipients.forEach((r, idx) => {
      map[r.id] = getRecipientColor(idx);
    });
    return map;
  }, [recipients]);

  const onDocLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };



  return (
    <div className="flex flex-col h-[calc(100vh-160px)] gap-4">
      {/* Top: Doc buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {documents?.map((doc) => {
          const isActive = doc.id === activeDocId;
          return (
            <button
              key={doc.id}
              onClick={() => setActiveDocId(doc.id)}
              className={[
                "px-3 py-2 rounded-xl border text-sm flex items-center gap-2",
                isActive
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300",
                "hover:shadow-sm",
              ].join(" ")}
            >
              <FileText className="w-4 h-4" />
              <span className="truncate max-w-[180px]">{doc.name}</span>
              {typeof doc.pages === "number" && (
                <span className="text-xs opacity-80">· {doc.pages}p</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main stage */}
      <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Canvas area */}
        <div className="col-span-12 lg:col-span-9 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
            <div className="text-sm text-gray-600">
              Viewing: <span className="font-medium text-gray-900">{activeDoc?.name ?? "—"}</span>
            </div>
            <div className="text-xs text-gray-500">Step 3: PDF Canvas Rendering</div>
          </div>

          <div
            className="relative h-full min-h-[480px] overflow-auto bg-gray-50"
            ref={pdfContainerRef}
          >
            {activeDoc?.name && activeDoc.type === "application/pdf" ? (
              <Document
                file={activeDoc.file || `${import.meta.env.VITE_ESIGN_SERVICE_URL}/uploads/${activeDoc.name}`}
                onLoadSuccess={onDocLoadSuccess}
                loading={<div className="p-8 text-gray-500 text-center">Loading PDF…</div>}
                onLoadError={(err) => {
                  console.error("PDF load error:", err);
                }}
              >
                {Array.from(new Array(numPages), (_, index) => (
                  <div
                    key={`pdf_page_wrap_${index + 1}`}
                    className="relative"
                    style={{ width: 800, margin: "0 auto" }}
                    onDragOver={(e) => handlePdfDragOver(e, index + 1)}
                    onDrop={(e) => handlePdfDrop(e, index + 1)}
                  >
                    <Page
                      key={`page_${index + 1}`}
                      pageNumber={index + 1}
                      width={800}
                      className="mx-auto mb-4 shadow"
                    />
                    {/* Render signature fields for this page, doc */}
                    {signatureFields
                      .filter(
                        (f) =>
                          f.docId === activeDocId &&
                          f.page === index + 1
                      )
                      .map((f) => {
                        const isActiveRecipient = f.recipientId === activeRecipientId;
                        const color = recipientColorMap[f.recipientId] || "#2563eb";
                        return (
                          <div
                            key={f.id}
                            style={{
                              position: "absolute",
                              left: f.x,
                              top: f.y,
                              width: f.width,
                              height: f.height,
                              border: `2px solid ${color}`,
                              background: "#fff",
                              color: color,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: 6,
                              fontWeight: 500,
                              cursor: isActiveRecipient ? "move" : "not-allowed",
                              zIndex: 10,
                              opacity: isActiveRecipient ? 1 : 0.6,
                              boxShadow: isActiveRecipient ? "0 0 0 2px #e0e7ff" : undefined,
                              userSelect: "none",
                            }}
                            title={`Signature for ${recipients.find(r => r.id === f.recipientId)?.name || "Recipient"}`}
                            onMouseDown={e => handleFieldMouseDown(e, f)}
                          >
                            ✍ Signature
                            <span className="ml-2 text-xs text-gray-400">
                              ({recipients.find(r => r.id === f.recipientId)?.name || "Recipient"})
                            </span>
                            {isActiveRecipient && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  handleDeleteField(f.id);
                                }}
                                style={{
                                  position: "absolute",
                                  top: -10,
                                  right: -10,
                                  background: "#fff",
                                  border: `1px solid ${color}`,
                                  borderRadius: "50%",
                                  width: 22,
                                  height: 22,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  zIndex: 20,
                                  boxShadow: "0 1px 4px #0001",
                                }}
                                title="Delete signature field"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    {/* Drop preview */}
                    {dragging &&
                      dropPreview &&
                      dropPreview.page === index + 1 && (
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
                          ✍ Signature
                        </div>
                      )}
                  </div>
                ))}
              </Document>
            ) : (
              <div className="text-center p-8 text-gray-500">
                <p className="font-medium mb-2">Preview not available</p>
                <p className="text-sm">
                  Only PDF preview is supported for now. Other file types will show placeholder.
                </p>
              </div>
            )}

            {/* Overlay layer reserved for fields */}
            <div className="pointer-events-none absolute inset-0" />
          </div>
        </div>

        {/* Right sidebar: recipients list */}
        <div className="col-span-12 lg:col-span-3">
          <div className="h-full rounded-2xl border border-gray-200 shadow-sm bg-white flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 font-medium text-sm text-gray-700">
              Recipients
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {recipients.length === 0 && (
                <div className="p-4 text-sm text-gray-500">No recipients added.</div>
              )}
              {recipients.map((r) => {
                const isActive = r.id === activeRecipientId;
                const color = recipientColorMap[r.id] || "#2563eb";
                return (
                  <button
                    key={r.id}
                    onClick={() => setActiveRecipientId(r.id)}
                    className={[
                      "w-full text-left px-4 py-3 flex items-center gap-3 text-sm",
                      isActive
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "hover:bg-gray-50 text-gray-700",
                    ].join(" ")}
                    style={{
                      borderLeft: `6px solid ${color}`,
                      borderRadius: 0,
                    }}
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

            {/* Toolbox below recipients */}
            <div className="border-t border-gray-200 p-4">
              <div className="font-medium text-xs text-gray-500 mb-2">Toolbox</div>
              <div
                draggable
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                style={{
                  borderColor: recipientColorMap[activeRecipientId!] || "#2563eb",
                  background: "#f1f5ff",
                  color: recipientColorMap[activeRecipientId!] || "#2563eb",
                  width: 120,
                  userSelect: "none",
                  cursor: "grab",
                }}
                title="Drag to place a signature field"
              >
                ✍ Signature
              </div>
              <div className="text-[11px] text-gray-400 mt-2">
                Drag and drop onto the PDF to add a signature field for the active recipient.
                <br />
                <span className="text-blue-500">Tip:</span> Only active recipient's fields are editable.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
