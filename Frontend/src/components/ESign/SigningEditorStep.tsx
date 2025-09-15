import React, { useEffect, useMemo, useState, useRef } from "react";
import { FileText, UserCircle, X } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import { eSignApi } from "../../services/apiHelper";

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

type SignatureField = {
  id: string;
  _id?: string; // for backward compatibility
  docId: string;
  documentId?: string; // for backward compatibility
  recipientId: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

const RECIPIENT_COLORS = [
  "#2563eb", "#059669", "#d97706", "#db2777", "#7c3aed", "#f43f5e",
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
  signatureFields: SignatureField[];
  setSignatureFields: React.Dispatch<React.SetStateAction<SignatureField[]>>;
}) {
  // PDF.js worker
  useEffect(() => {
    if (typeof window !== "undefined") {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    }
  }, []);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [dragging, setDragging] = useState(false);
  const [draggedField, setDraggedField] = useState<null | { type: "signature" }>(null);
  const [dropPreview, setDropPreview] = useState<{ x: number; y: number } | null>(null);
  const [movingFieldId, setMovingFieldId] = useState<string | null>(null);
  const [moveOffset, setMoveOffset] = useState<{ x: number; y: number } | null>(null);

  const pdfContainerRef = useRef<HTMLDivElement>(null);

  const activeDoc = useMemo(() => documents.find(d => d.id === activeDocId) || null, [activeDocId, documents]);
  const activeRecipient = useMemo(() => recipients.find(r => r.id === activeRecipientId) || null, [activeRecipientId, recipients]);

  const recipientColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    recipients.forEach((r, idx) => map[r.id] = getRecipientColor(idx));
    return map;
  }, [recipients]);

  // Initialize first doc and recipient
  useEffect(() => { if (!activeDocId && documents.length) setActiveDocId(documents[0].id); }, [documents]);
  useEffect(() => { if (!activeRecipientId && recipients.length) setActiveRecipientId(recipients[0].id); }, [recipients]);

  const handleDragStart = (e: React.DragEvent) => { setDraggedField({ type: "signature" }); setDragging(true); e.dataTransfer.effectAllowed = "move"; };
  const handleDragEnd = () => { setDragging(false); setDraggedField(null); setDropPreview(null); };

  const handlePdfDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedField) return;
    const rect = pdfContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDropPreview({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handlePdfDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedField || !activeDocId || !activeRecipientId) return;
    const rect = pdfContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = 120, height = 40;
    setSignatureFields(prev => [
      ...prev,
      { id: `${Date.now()}`, docId: activeDocId, recipientId: activeRecipientId, page: currentPage, x: x - width/2, y: y - height/2, width, height }
    ]);
    setDragging(false); setDraggedField(null); setDropPreview(null);
  };

  const handleFieldMouseDown = (e: React.MouseEvent, field: SignatureField) => {
    if (field.recipientId !== activeRecipientId) return;
    e.stopPropagation();
    setMovingFieldId(field.id ?? field._id ?? null);
    setMoveOffset({ x: e.clientX - field.x, y: e.clientY - field.y });
  };

  useEffect(() => {
    if (!movingFieldId) return;
    const handleMouseMove = (e: MouseEvent) => setSignatureFields(fields => fields.map(f => f.id ?? f._id === movingFieldId ? {...f, x: e.clientX - (moveOffset?.x ?? 0), y: e.clientY - (moveOffset?.y ?? 0)} : f));
    const handleMouseUp = () => { setMovingFieldId(null); setMoveOffset(null); };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => { window.removeEventListener("mousemove", handleMouseMove); window.removeEventListener("mouseup", handleMouseUp); };
  }, [movingFieldId, moveOffset]);

  const handleDeleteField = async (id: string) => {
     // Heuristic: If the ID is a MongoDB ObjectId (24 hex chars), treat it as DB record
    const isDbRecord = /^[a-fA-F0-9]{24}$/.test(id);
    if(isDbRecord && id) {
          try{
            await eSignApi.post(`/api/e-sign/envelope/remove-signature-field/${id}`);
            console.log(`Signature field ${id} deleted from DB successfully.`);
          }catch (error) {
            console.error('Failed to delete signature field from DB:', error);
          }
        }
    setSignatureFields(fields => fields.filter(f => (f.id ?? f._id) !== id));
  }

  const onDocLoadSuccess = ({ numPages }: { numPages: number }) => { setNumPages(numPages); };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] gap-4">
      {/* Doc buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {documents.map(doc => {
          const isActive = doc.id === activeDocId;
          return (
            <button key={doc.id} onClick={() => { setActiveDocId(doc.id); setCurrentPage(1); }} className={`px-3 py-2 rounded-xl border text-sm flex items-center gap-2 ${isActive ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300"} hover:shadow-sm`}>
              <FileText className="w-4 h-4" />
              <span className="truncate max-w-[180px]">{doc.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main stage */}
      <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
        <div className="col-span-12 lg:col-span-9 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
            <div className="text-sm text-gray-600">
              Viewing: <span className="font-medium text-gray-900">{activeDoc?.name ?? "—"}</span>
            </div>
            <div className="text-xs text-gray-500">Step 3: PDF Canvas Rendering</div>
          </div>

          {/* PDF scrollable container */}
          <div className="flex-1 overflow-auto bg-gray-50 relative" ref={pdfContainerRef} onDragOver={handlePdfDragOver} onDrop={handlePdfDrop}>
            {activeDoc?.name && activeDoc.type === "application/pdf" ? (
              <Document
                file={activeDoc.file || `${import.meta.env.VITE_ESIGN_SERVICE_URL}/uploads/${activeDoc.name}`}
                onLoadSuccess={onDocLoadSuccess}
              >
                <div className="relative w-max mx-auto">
                  <Page pageNumber={currentPage} width={800} className="shadow mb-4" />
                  {/* Signature fields */}
                  {signatureFields
                  .filter(f => (f.docId ?? f.documentId) === activeDocId && f.page === currentPage)
                    .map(f => {
                      const isActiveRecipient = f.recipientId === activeRecipientId;
                      const color = recipientColorMap[f.recipientId] || "#2563eb";
                      return (
                        <div
                          key={f.id?? f._id}
                          style={{
                            position: "absolute",
                            left: f.x,
                            top: f.y,
                            width: f.width,
                            height: f.height,
                            border: `2px solid ${color}`,
                            background: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 6,
                            cursor: isActiveRecipient ? "move" : "not-allowed",
                            zIndex: 10
                          }}
                          onMouseDown={e => handleFieldMouseDown(e, f)}
                          title={`Signature for ${recipients.find(r => r.id === f.recipientId)?.name || "Recipient"}`}
                        >
                          ✍ Signature
                          {isActiveRecipient && (
                            <button
                              onClick={e => { e.stopPropagation(); handleDeleteField(f.id ?? f._id); }}
                              style={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                width: 22,
                                height: 22,
                                borderRadius: "50%",
                                border: `1px solid ${recipientColorMap[activeRecipientId!] || "#2563eb"}`,
                                background: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transform: "translate(50%, -50%)",
                                cursor: "pointer",
                                zIndex: 11,
                                padding: 0,
                                lineHeight: 1
                              }}
                            >
                              <X size={14} style={{ display: "block" }} />
                            </button>

                          )}
                        </div>
                      );
                    })}
                  {/* Drop preview */}
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
                        zIndex: 20
                      }}
                    >
                      ✍ Signature
                    </div>
                  )}
                </div>
              </Document>
            ) : (
              <div className="text-center p-8 text-gray-500">Preview not available</div>
            )}
          </div>

          {/* Pagination outside scrollable PDF */}
          {numPages > 1 && (
            <div className="flex justify-center gap-4 py-2 border-t border-gray-200 bg-gray-50">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">{currentPage} / {numPages}</span>
              <button
                disabled={currentPage >= numPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                Next
              </button>
            </div>
          )}
        </div>


        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-3">
          <div className="h-full rounded-2xl border border-gray-200 shadow-sm bg-white flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 font-medium text-sm text-gray-700">Recipients</div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {recipients.map(r => {
                const isActive = r.id === activeRecipientId;
                const color = recipientColorMap[r.id] || "#2563eb";
                return (
                  <button key={r.id} onClick={()=>setActiveRecipientId(r.id)} className={`w-full text-left px-4 py-3 flex items-center gap-3 text-sm ${isActive?"bg-blue-50 text-blue-700 font-medium":"hover:bg-gray-50 text-gray-700"}`} style={{borderLeft:`6px solid ${color}`}}>
                    <UserCircle className="w-5 h-5 shrink-0" color={color} />
                    <div className="flex flex-col">
                      <span className="truncate">{r.name || "Unnamed"}</span>
                      <span className="text-xs text-gray-500">{r.role}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {activeRecipient && <div className="p-3 text-xs text-gray-500 border-t border-gray-200">Active: <span className="font-medium text-gray-700">{activeRecipient.name}</span></div>}

            {/* Toolbox */}
            <div className="border-t border-gray-200 p-4">
              <div className="font-medium text-xs text-gray-500 mb-2">Toolbox</div>
              <div draggable onDragStart={handleDragStart} onDragEnd={handleDragEnd} className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{borderColor: recipientColorMap[activeRecipientId!] || "#2563eb", background:"#f1f5ff", color:recipientColorMap[activeRecipientId!] || "#2563eb", width:120, cursor:"grab"}}>✍ Signature</div>
              <div className="text-[11px] text-gray-400 mt-2">Drag and drop onto the PDF to add a signature field for the active recipient.<br/><span className="text-blue-500">Tip:</span> Only active recipient's fields are editable.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
