import React, { useEffect, useMemo, useState, useRef } from "react";
import { FileText, UserCircle } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import { useAuth } from '../../components/AuthService/AuthContext';
import { useTutorial } from '../../context/TutorialContext';

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

type FieldType = "signature" | "text" | "email" | "number" | "id";

export type SignatureField = {
  id: string;
  _id?: string;
  docId: string;
  documentId?: string;
  recipientId?: string;
  slotId?: string; // for power mode
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: FieldType;
  label?: string;
  locked?: boolean;
  fieldId?: string; // link back to power form field
};

export type PowerFormSlot = {
  slotId: string;
  name?: string;
  role?: string;
  // you can add more props (authMethod, required, index...) — editor will use slotId + name
};

export type PowerFormData = {
  slots: PowerFormSlot[];
  fields: { _id: string; label: string; type: FieldType }[];
};

const RECIPIENT_COLORS = ["#2563eb", "#059669", "#d97706", "#db2777", "#7c3aed", "#f43f5e"];
function getRecipientColor(idx: number) {
  return RECIPIENT_COLORS[idx % RECIPIENT_COLORS.length];
}

export default function PowerFormEditorStep({
  documents,
  recipients,
  signatureFields,
  setSignatureFields,
  mode,
  powerFormData,
  slots,
}: {
  documents: Doc[];
  recipients: Recipient[];
  signatureFields: SignatureField[];
  setSignatureFields: React.Dispatch<React.SetStateAction<SignatureField[]>>;
  mode: "normal" | "power";
  powerFormData?: PowerFormData;
  slots?: PowerFormSlot[]; // preferred prop for slots
}) {
  // pdf worker
  useEffect(() => {
    if (typeof window !== "undefined") {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    }
  }, []);
  const { user } = useAuth();
  const { 
    showTutorial,
    tutorialStep,
    setShowTutorial,
    handleNextStep,
    handlePrevStep,
    handleCloseTutorial 
  } = useTutorial();

  // Show tutorial if first login
  useEffect(() => {
    if (user?.isFirstLogin) {
      setShowTutorial(true);
    }
  }, [user]);
  // state
  const [activeDocId, setActiveDocId] = useState<string | null>(documents[0]?.id ?? null);
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(mode === "normal" ? recipients[0]?.id ?? null : null);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(mode === "power" ? (slots || powerFormData?.slots)?.[0]?.slotId ?? null : null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [dragging, setDragging] = useState(false);
  const [draggedField, setDraggedField] = useState<null | { type: FieldType; label?: string; id?:string }>(null);
  const [dropPreview, setDropPreview] = useState<{ x: number; y: number } | null>(null);
  const [movingFieldId, setMovingFieldId] = useState<string | null>(null);
  const [moveOffset, setMoveOffset] = useState<{ x: number; y: number } | null>(null);

  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // effective slots (slots prop preferred, fall back to powerFormData.slots)
  const slotsToUse = slots ?? powerFormData?.slots ?? [];

  // memo lookups
  const activeDoc = useMemo(() => documents.find(d => d.id === activeDocId) || null, [activeDocId, documents]);
  const activeRecipient = useMemo(() => recipients.find(r => r.id === activeRecipientId) || null, [activeRecipientId, recipients]);
  const activeSlot = useMemo(() => slotsToUse.find(s => s.slotId === activeSlotId) || null, [activeSlotId, slotsToUse]);

  // color map for recipients & slots
  const recipientColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    recipients.forEach((r, idx) => (map[r.id] = getRecipientColor(idx)));
    slotsToUse.forEach((s, idx) => (map[s.slotId] = getRecipientColor(idx + recipients.length))); // avoid collision
    return map;
  }, [recipients, slotsToUse]);

  // initialize when docs/recipients/slots change
  useEffect(() => {
    if (!activeDocId && documents.length) setActiveDocId(documents[0].id);
    console.log("documentes", documents);
    if (mode === "normal" && !activeRecipientId) setActiveRecipientId(recipients[0]?.id ?? null);
    if (mode === "power" && !activeSlotId) setActiveSlotId(slotsToUse?.[0]?.slotId ?? null);
  }, [documents, recipients, slotsToUse, mode]);

  // helpers to find assignee by field
  const findAssignee = (f: SignatureField) => {
    if (f.recipientId) {
      return recipients.find(r => r.id === f.recipientId) ?? { name: "Unknown", email: "" };
    }
    if (f.slotId) {
      return slotsToUse.find(s => s.slotId === f.slotId) ?? { name: f.slotId, role: "" };
    }
    return null;
  };

  // page element (pdf canvas container)
  function getPageElement(): HTMLElement | null {
    if (!pdfContainerRef.current) return null;
    const canvas = pdfContainerRef.current.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return pdfContainerRef.current.querySelector(".react-pdf__Page")?.parentElement ?? null;
    let el: HTMLElement | null = canvas;
    while (el && el !== pdfContainerRef.current) {
      try {
        if (window.getComputedStyle(el).position === "relative") return el;
      } catch {}
      el = el.parentElement;
    }
    return canvas.parentElement;
  }

  // drag handlers
  const handleDragStart = (e: React.DragEvent, field: { type: FieldType; label?: string; id?: string }) => {
    console.log(`Field ID : ${field.id}`);
    setDraggedField(field);
    setDragging(true);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragEnd = () => {
    setDragging(false);
    setDraggedField(null);
    setDropPreview(null);
  };

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

    // base width/height (kept constant - you can replace with ratio later)
    const width = 120, height = 40;
    let left = e.clientX - rect.left - width / 2;
    let top = e.clientY - rect.top - height / 2;

    left = Math.max(0, Math.min(left, rect.width - width));
    top = Math.max(0, Math.min(top, rect.height - height));

    const newField: SignatureField = {
      id: `${Date.now()}`,
      docId: activeDocId,
      recipientId: mode === "normal" ? activeRecipientId ?? undefined : undefined,
      slotId: mode === "power" ? activeSlotId ?? undefined : undefined,
      page: currentPage,
      x: left,
      y: top,
      width,
      height,
      type: draggedField.type,
      label: draggedField.label,
      fieldId: draggedField.id
    };
    console.log(`New Field ID : ${JSON.stringify(newField)}`);

    setSignatureFields(prev => [...prev, newField]);
   
    setDragging(false);
    setDraggedField(null);
    setDropPreview(null);
  };

  // move logic — allow moving any non-locked field (not restricted by active)
  const handleFieldMouseDown = (e: React.MouseEvent, field: SignatureField) => {
    if (field.locked) return;

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
  }, [movingFieldId, moveOffset, setSignatureFields]);

  const onDocLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  // Add fixed fields for all recipients/slots (bottom row)
  const addFieldsForAllRecipients = () => {
    if (!activeDocId) return;
    const pageWidth = 800, pageHeight = 1000;
    const width = 120, height = 40;
    const bottomMargin = 20;
    const gap = 12, rowGap = 10, sideMargin = 50;
    const targetPage = numPages > 0 ? numPages : 1;

    const targetList =
      mode === "normal"
        ? recipients.map(r => ({ id: r.id }))
        : (slotsToUse || []).map(s => ({ id: s.slotId }));

    const usableWidth = Math.max(1, pageWidth - sideMargin * 2);
    const perRow = Math.max(1, Math.floor((usableWidth + gap) / (width + gap)));

    const newFields: SignatureField[] = targetList.map((r, idx) => {
      const col = idx % perRow;
      const row = Math.floor(idx / perRow);
      const itemsInThisRow = Math.min(perRow, Math.max(0, targetList.length - row * perRow));
      const rowTotalWidth = itemsInThisRow * width + (itemsInThisRow - 1) * gap;
      const startXForRow = sideMargin + Math.max(0, (usableWidth - rowTotalWidth) / 2);
      const x = startXForRow + col * (width + gap);
      const y = pageHeight - height - bottomMargin - row * (height + rowGap);

      return {
        id: `auto_${Date.now()}_${idx}`,
        docId: activeDocId,
        recipientId: mode === "normal" ? r.id : undefined,
        slotId: mode === "power" ? r.id : undefined,
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

  // active assignee id for preview color
  const activeAssigneeId = mode === "normal" ? activeRecipientId : activeSlotId;

  // render
  return (
    
    <div className="flex flex-col h-[calc(100vh-160px)] gap-4">
            {/* Step-by-step Tutorial Modal */}
              {showTutorial && (
                <div className="fixed inset-0 z-50">
                  <div className="absolute inset-0 backdrop-blur-[0px]"></div>
                  <div className={`bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 max-w-lg w-full absolute transition-all duration-500 ease-in-out min-h-[340px] flex flex-col justify-between ${
                    tutorialStep === 0 ? 'top-95 right-50 -translate-x-1/6 -translate-y-1/2' : 
                    tutorialStep === 1 ? 'top-125 right-60 -translate-x-1/6 -translate-y-1/2' :
                    tutorialStep === 2 ? 'top-105 right-20 -translate-x-1/6 -translate-y-1/2' :
                    tutorialStep === 3 ? 'top-115 right-20 -translate-x-1/6 -translate-y-1/2' :
                    'top-1/4 right-5 -translate-x-1/6 -translate-y-1/2'
                  }`}>
                    {tutorialStep === 0 && (
                      <>
                        <div className="relative">
                          {/* Arrow pointing to recipients section */}
                          <div className="absolute left-20 -top-16 w-16 h-16">
                            <div className="w-16 h-16 border-l-4 border-t-4 border-blue-500 rounded-tl-xl transform rotate-311 absolute"></div>
                          </div>
                          <h2 className="text-xl font-bold mb-4">Step 1: Document Tab</h2>
                          <p className="text-gray-700 mb-4">By clicking this we can active the document </p>
                        </div>
                        <div className="flex-1" />
                        <div className="flex justify-between gap-2 mt-6">
                          <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={handlePrevStep}>Back</button>
                          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleNextStep}>Next</button>
                        </div>
                      </>
                    )}
                    {tutorialStep === 1 && (
                      <>
                        <div className="relative">
                          {/* Arrow pointing to recipients section */}
                          <div className="absolute right-20 -top-16 w-16 h-16">
                            <div className="w-16 h-16 border-l-4 border-t-4 border-blue-500 rounded-tl-xl transform rotate-133 absolute"></div>
                          </div>
                          <h2 className="text-xl font-bold mb-4">Step 2: Choose Recipients</h2>
                          <p className="text-gray-700 mb-4">Here is the added recipients list we can active any one recipient at a time by clicking on the box. </p>
                        </div>
                        <div className="flex-1" />
                        <div className="flex justify-between gap-2 mt-6">
                          <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={handlePrevStep}>Back</button>
                          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleNextStep}>Next</button>
                        </div>
                      </>
                    )}
                    {tutorialStep === 2 && (
                      <>
                        <div className="relative">
                          {/* Arrow pointing to recipients section */}
                          <div className="absolute right-20 top-70 w-16 h-16">
                            <div className="w-16 h-16 border-l-4 border-t-4 border-blue-500 rounded-tl-xl transform rotate-224 absolute"></div>
                          </div>
                          <h2 className="text-xl font-bold mb-4">Step 3: Fixed signature fields</h2>
                          <p className="text-gray-700 mb-4">By clicking this button we can add fixed field for all the added recipients. </p>
                        </div>
                        <div className="flex-1" />
                        <div className="flex justify-between gap-2 mt-6">
                          <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={handlePrevStep}>Back</button>
                          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleNextStep}>Next</button>
                        </div>
                      </>
                    )}
                    {tutorialStep === 3 && (
                      <>
                        <div className="relative">
                          {/* Arrow pointing to recipients section */}
                          <div className="absolute right-20 top-70 w-16 h-16">
                            <div className="w-16 h-16 border-l-4 border-t-4 border-blue-500 rounded-tl-xl transform rotate-224 absolute"></div>
                          </div>
                          <h2 className="text-xl font-bold mb-4">Step 4: Signature Fields</h2>
                          <p className="text-gray-700 mb-4">This is a dragable element we can drag it on to the pdf and this will create a signature field for the active recipient that we did in Step 2 </p>
                        </div>
                        <div className="flex-1" />
                        <div className="flex justify-between gap-2 mt-6">
                          <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={handlePrevStep}>Back</button>
                          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleCloseTutorial}>Finish</button>
                        </div>
                      </>
                    )}
                    <button
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
                      onClick={handleCloseTutorial}
                      aria-label="Close tutorial"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              )}
      {/* Document buttons */}
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

          <div
            className="flex-1 overflow-auto bg-gray-50 relative"
            ref={pdfContainerRef}
            onDragOver={handlePdfDragOver}
            onDrop={handlePdfDrop}
          >
            {activeDoc?.type === "application/pdf" ? (
              <Document
                file={
                  activeDoc.file ||
                  `${import.meta.env.VITE_ESIGN_SERVICE_URL}/uploads/${activeDoc.name}`
                }
                onLoadSuccess={onDocLoadSuccess}
              >
              <div className="relative w-max mx-auto">
                <Page pageNumber={currentPage} width={800} className="shadow mb-4" />

                {/* Render ALL fields on this page */}
                {signatureFields
                  .filter(
                    (f) => (f.docId ?? f.documentId) === activeDocId && f.page === currentPage
                  )
                  .map((f) => {
                    const assignee = findAssignee(f);
                    const color =
                      recipientColorMap[f.recipientId ?? f.slotId ?? ""] || "#2563eb";
                    const isActive =
                      mode === "normal"
                        ? f.recipientId === activeRecipientId
                        : f.slotId === activeSlotId;

                    return (
                      <React.Fragment key={f.id ?? f._id}>
                        {/* Signature/Field Box */}
                        <div
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
                            opacity: isActive ? 1 : 0.9,
                            boxSizing: "border-box",
                            zIndex: isActive ? 30 : 20,
                          }}
                          onMouseDown={(e) => handleFieldMouseDown(e, f)}
                          title={
                            f.type === "signature"
                              ? `Signature - ${assignee?.name ?? ""}`
                              : f.label
                          }
                        >
                          {/* Signature text stays inside box */}
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              textAlign: "center",
                            }}
                          >
                            {f.type === "signature" ? "Signature" : f.label || f.type}
                          </div>
                        </div>

                        {/* Labels BELOW the box (only if assignee exists) */}
                        {assignee && (
                          <div
                            style={{
                              position: "absolute",
                              left: f.x,
                              top: f.y + f.height + 4, // just below the box
                              width: f.width,
                              textAlign: "center",
                              fontSize: 11,
                              color: "#555",
                            }}
                          >
                            {"email" in assignee && (assignee as any).email ? (
                              <>
                                <div style={{ fontWeight: 600 }}>
                                  {(assignee as any).name ||
                                    (assignee as any).slotId ||
                                    ""}
                                </div>
                                <div style={{ fontSize: 10 }}>
                                  {(assignee as any).email}
                                </div>
                              </>
                            ) : (
                              <div style={{ fontWeight: 600 }}>
                                {(assignee as any).name || (assignee as any).slotId || ""}
                              </div>
                            )}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}

                {/* Drag preview */}
                {dragging && dropPreview && (
                  <div
                    style={{
                      position: "absolute",
                      left: dropPreview.x - 60,
                      top: dropPreview.y - 20,
                      width: 120,
                      height: 40,
                      border: `2px dashed ${
                        recipientColorMap[activeAssigneeId ?? ""] || "#2563eb"
                      }`,
                      background: "#e0e7ff88",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 6,
                      pointerEvents: "none",
                      zIndex: 40,
                    }}
                  >
                    {draggedField?.type === "signature"
                      ? "Signature"
                      : draggedField?.label || draggedField?.type}
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
              <span className="text-sm text-gray-600">{currentPage} / {numPages}</span>
              <button disabled={currentPage >= numPages} onClick={() => setCurrentPage(prev => prev + 1)} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">
                Next
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-3">
          <div className="h-full rounded-2xl border border-gray-200 shadow-sm bg-white flex flex-col">
            {/* Normal recipients */}
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
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 text-sm ${isActive ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-50 text-gray-700"}`}
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
                  <div className="p-3 text-xs text-gray-500 border-t border-gray-200">Active: <span className="font-medium text-gray-700">{activeRecipient.name}</span></div>
                )}
              </>
            )}

            {/* Power slots */}
            {mode === "power" && (
              <>
                <div className="px-4 py-3 border-b border-gray-200 font-medium text-sm text-gray-700">Slots</div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                  {slotsToUse.map(s => {
                    const isActive = s.slotId === activeSlotId;
                    const color = recipientColorMap[s.slotId] || "#2563eb";
                    return (
                      <button
                        key={s.slotId}
                        onClick={() => setActiveSlotId(s.slotId)}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 text-sm ${isActive ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-50 text-gray-700"}`}
                        style={{ borderLeft: `6px solid ${color}` }}
                      >
                        <UserCircle className="w-5 h-5 shrink-0" color={color} />
                        <div className="flex flex-col">
                          <span className="truncate">{s.name || s.slotId}</span>
                          <span className="text-xs text-gray-500">{s.role || ""}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {activeSlot && (
                  <div className="p-3 text-xs text-gray-500 border-t border-gray-200">Active Slot: <span className="font-medium text-gray-700">{activeSlot.name || activeSlot.slotId}</span></div>
                )}
              </>
            )}

            {/* Toolbox */}
            <div className="border-t border-gray-200 p-4">
              <div className="font-medium text-xs text-gray-500 mb-2">Toolbox</div>

              <div className="mb-2">
                <button onClick={addFieldsForAllRecipients} className="w-full text-sm px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">Add Fixed Field</button>
              </div>

              {/* Signature drag for both modes */}
              <div
                draggable
                onDragStart={e => handleDragStart(e, { type: "signature" })}
                onDragEnd={handleDragEnd}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border mb-2"
                style={{
                  borderColor: recipientColorMap[activeAssigneeId ?? ""] || "#2563eb",
                  background: "#f1f5ff",
                  color: recipientColorMap[activeAssigneeId ?? ""] || "#2563eb",
                  width: 120,
                  cursor: "grab",
                }}
              >
                Signature
              </div>

              {/* extra power fields */}
              {mode === "power" && (powerFormData?.fields ?? []).length > 0 && (
                <div className="flex flex-col gap-2">
                  {powerFormData!.fields!.map(field => (
                    <div
                      key={field._id}
                      draggable
                      onDragStart={e => handleDragStart(e, { type: field.type, label: field.label, id: field._id })}
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
