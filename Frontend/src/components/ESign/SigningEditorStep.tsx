import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  FileText, X, Undo2, Redo2, Save, Printer, RefreshCw,
  HelpCircle, Search, ChevronDown, Trash2, FileSignature, PenLine,
  Stamp, Calendar, Building2, Briefcase, Hash, Check, User, Type,
 
  SaveAll,
  Pen,
  SquareMousePointer,
  RectangleHorizontal,
  CircleDot,
  Info
} from "lucide-react";
import type { Recipient } from "../../types";

// Type declarations for PDF.js
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export type Doc = {
  id: string;
  name: string;
  size?: number;
  pages?: number;
  url?: string;
  type?: string;
  file?: File;
};

// Recipient type is imported from shared types to keep role union in sync

type FieldType = "signature" | "text" | "email" | "number" | "id" | "dropdown" | "input" | "checkbox" | "phone" | "stamp";

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
  options?: string[]; // for select/dropdown fields
  value?: string | boolean; // for checkbox default/value or generic value
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

// function hexToRgba(hex: string, alpha: number) {
//   const sanitized = hex.replace('#', '');
//   const bigint = parseInt(sanitized.length === 3
//     ? sanitized.split('').map(c => c + c).join('')
//     : sanitized, 16);
//   const r = (bigint >> 16) & 255;
//   const g = (bigint >> 8) & 255;
//   const b = bigint & 255;
//   return `rgba(${r}, ${g}, ${b}, ${alpha})`;
// }

export default function SigningEditorStep({
  documents,
  recipients,
  signatureFields,
  setSignatureFields,
  mode,
  powerFormData,
  slots,
  onSend,
  sending,
  onBack,
  onFieldsChange
}: {
  documents: Doc[];
  recipients: Recipient[];
  signatureFields: SignatureField[];
  setSignatureFields: React.Dispatch<React.SetStateAction<SignatureField[]>>;
  mode: "normal" | "power";
  powerFormData?: PowerFormData;
  slots?: PowerFormSlot[]; // preferred prop for slots
  onSend?: () => void;
  sending?: boolean;
  onBack?: () => void;
  onFieldsChange?: (fields: SignatureField[]) => void;
}) {
  // PDF.js worker setup - same approach as InsertPDF
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Point to the worker file in your public folder
        if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
          console.log("PDF.js worker set to local file: /pdf.worker.min.mjs");
        }
      } catch (err) {
        console.warn("Failed to set PDF.js worker:", err);
      }
    }
  }, []);

  // Load PDF.js dynamically - same approach as InsertPDF
  const loadPDFJS = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && !window.pdfjsLib) {
        const pdfjsLib = await import('pdfjs-dist');

        // Set worker path to local file
        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
          console.log("PDF.js worker set to local file: /pdf.worker.min.mjs");
        } catch (error) {
          console.warn("Failed to set PDF.js worker:", error);
          pdfjsLib.GlobalWorkerOptions.workerSrc = '';
        }

        // Assign to window
        window.pdfjsLib = pdfjsLib;
      }

      return window.pdfjsLib;
    } catch (error) {
      console.error('Error loading PDF.js:', error);
      throw error;
    }
  }, []);

  // state
  const [activeDocId, setActiveDocId] = useState<string | null>(documents[0]?.id ?? null);
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(mode === "normal" ? recipients[0]?.id ?? null : null);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(mode === "power" ? (slots || powerFormData?.slots)?.[0]?.slotId ?? null : null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [dragging, setDragging] = useState(false);
  const [draggedField, setDraggedField] = useState<null | { type: FieldType; label?: string; id?: string }>(null);
  const [dropPreview, setDropPreview] = useState<{ x: number; y: number; pageNum?: number } | null>(null);
  const [movingFieldId, setMovingFieldId] = useState<string | null>(null);
  const [moveOffset, setMoveOffset] = useState<{ x: number; y: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [showDocDropdown, setShowDocDropdown] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [leftPanel, setLeftPanel] = useState<'standard' | 'custom' | 'pen'>('standard');
  const [companyInfo, setCompanyInfo] = useState<{ visible: boolean; top: number }>({ visible: false, top: 120 });
  const [pageCanvases, setPageCanvases] = useState<Map<number, HTMLCanvasElement>>(new Map());
  const [thumbnailCanvases, setThumbnailCanvases] = useState<Map<number, HTMLCanvasElement>>(new Map());
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  console.log("activeRecipientId1", activeRecipientId);
  console.log("recipients", recipients[0]?.id);
  console.log("mode", mode);

  // effective slots (slots prop preferred, fall back to powerFormData.slots)
  const slotsToUse = slots ?? powerFormData?.slots ?? [];

  // memo lookups
  const activeDoc = useMemo(() => documents.find(d => d.id === activeDocId) || null, [activeDocId, documents]);
  const activeRecipient = useMemo(() => recipients.find(r => r.id === activeRecipientId) || null, [activeRecipientId, recipients]);
  const activeSlot = useMemo(() => slotsToUse.find(s => s.slotId === activeSlotId) || null, [activeSlotId, slotsToUse]);
  console.log("activeRecipientId2", activeRecipientId);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showRecipientDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest('.recipient-dropdown')) {
          setShowRecipientDropdown(false);
        }
      }
      if (showDocDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest('.document-dropdown')) {
          setShowDocDropdown(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showRecipientDropdown, showDocDropdown]);
  console.log("activeRecipientId3", activeRecipientId);
  // auto-select activeSlot from selected recipient when activeSlot is empty
  useEffect(() => {
    if (mode === "power" && !activeSlotId && slotsToUse.length > 0) {
      // Find slot that matches the selected recipient if available
      let matchingSlot = null;
      if (activeRecipientId) {
        matchingSlot = slotsToUse.find(slot =>
          slot.role === "signer" || slot.role === "firstSigner"
        );
      }
      console.log("activeRecipientId4", activeRecipientId);
      if (matchingSlot) {
        setActiveSlotId(matchingSlot.slotId);
      } else {
        // Fallback to first available slot
        setActiveSlotId(slotsToUse[0]?.slotId ?? null);
      }
    }
  }, [mode, activeSlotId, activeRecipientId, slotsToUse]);
  console.log("SignatureField", signatureFields);
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

  // page element (pdf page container) - gets the page element for a specific page number
  function getPageElement(pageNum?: number): HTMLElement | null {
    if (!pdfContainerRef.current) return null;

    if (pageNum) {
      const pageEl = pdfContainerRef.current.querySelector(`[data-page="${pageNum}"]`) as HTMLElement | null;
      return pageEl ?? null;
    }

    // Fallback: return first page or current page
    const firstPage = pdfContainerRef.current.querySelector('[data-page]') as HTMLElement | null;
    return firstPage ?? null;
  }

  // Load and render PDF - all pages
  useEffect(() => {
    let isCancelled = false;
    const renderTasks: any[] = [];

    const renderPDF = async () => {
      if (!activeDoc || !pdfContainerRef.current) return;

      try {
        const pdfjsLib = await loadPDFJS();
        let data: ArrayBuffer;

        if (activeDoc.file) {
          data = await activeDoc.file.arrayBuffer();
        } else {
          // Fetch from URL
          const response = await fetch(
            activeDoc.url || `${import.meta.env.VITE_ESIGN_SERVICE_URL}/uploads/${activeDoc.name}`
          );
          data = await response.arrayBuffer();
        }

        if (isCancelled) return;

        const pdf = await pdfjsLib.getDocument({ data }).promise;
        if (isCancelled) return;

        setNumPages(pdf.numPages);

        // Clear existing canvases
        const newPageCanvases = new Map<number, HTMLCanvasElement>();
        const newThumbnailCanvases = new Map<number, HTMLCanvasElement>();

        // Render all pages
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (isCancelled) return;

          const page = await pdf.getPage(pageNum);
          if (isCancelled) return;

          // Main canvas for this page
          const mainViewport = page.getViewport({ scale: 800 / page.getViewport({ scale: 1 }).width });
          const mainCanvas = document.createElement('canvas');
          const mainContext = mainCanvas.getContext('2d');
          if (!mainContext || isCancelled) continue;

          mainCanvas.width = mainViewport.width;
          mainCanvas.height = mainViewport.height;

          const mainTask = page.render({
            canvasContext: mainContext,
            viewport: mainViewport
          });
          renderTasks.push(mainTask);
          await mainTask.promise;
          newPageCanvases.set(pageNum, mainCanvas);

          // Thumbnail canvas for this page
          const thumbnailScale = 150 / mainViewport.width;
          const thumbnailViewport = page.getViewport({ scale: thumbnailScale });
          const thumbnailCanvas = document.createElement('canvas');
          const thumbnailContext = thumbnailCanvas.getContext('2d');
          if (!thumbnailContext || isCancelled) continue;

          thumbnailCanvas.width = thumbnailViewport.width;
          thumbnailCanvas.height = thumbnailViewport.height;

          const thumbnailTask = page.render({
            canvasContext: thumbnailContext,
            viewport: thumbnailViewport
          });
          renderTasks.push(thumbnailTask);
          await thumbnailTask.promise;
          newThumbnailCanvases.set(pageNum, thumbnailCanvas);
        }

        if (!isCancelled) {
          setPageCanvases(newPageCanvases);
          setThumbnailCanvases(newThumbnailCanvases);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Error rendering PDF:', error);
        }
      }
    };

    renderPDF();

    // Cleanup function
    return () => {
      isCancelled = true;
      renderTasks.forEach(task => {
        if (task && task.cancel) task.cancel();
      });
    };
  }, [activeDoc, loadPDFJS]);

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

  const findPageForDrop = (clientX: number, clientY: number): { pageNum: number; rect: DOMRect; pageElement: HTMLElement } | null => {
    if (!pdfContainerRef.current) return null;

    const pageElements = pdfContainerRef.current.querySelectorAll('[data-page]');
    for (const pageEl of Array.from(pageElements)) {
      const rect = pageEl.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right &&
        clientY >= rect.top && clientY <= rect.bottom) {
        const pageNum = parseInt(pageEl.getAttribute('data-page') || '1');
        return { pageNum, rect, pageElement: pageEl as HTMLElement };
      }
    }

    // Fallback: use first page
    const firstPage = pageElements[0];
    if (firstPage) {
      const rect = firstPage.getBoundingClientRect();
      const pageNum = parseInt(firstPage.getAttribute('data-page') || '1');
      return { pageNum, rect, pageElement: firstPage as HTMLElement };
    }

    return null;
  };

  const handlePdfDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedField) return;
    const pageInfo = findPageForDrop(e.clientX, e.clientY);
    if (!pageInfo) return;
    setDropPreview({
      x: e.clientX - pageInfo.rect.left,
      y: e.clientY - pageInfo.rect.top,
      pageNum: pageInfo.pageNum
    });
  };

  const handlePdfDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedField || !activeDocId) return;
    const pageInfo = findPageForDrop(e.clientX, e.clientY);
    if (!pageInfo) return;

    const { pageNum, rect } = pageInfo;
    setCurrentPage(pageNum);

    // base width/height (kept constant - you can replace with ratio later)
    const width = 200, height = 40;
    let left = e.clientX - rect.left - width / 2;
    let top = e.clientY - rect.top - height / 2;

    left = Math.max(0, Math.min(left, rect.width - width));
    top = Math.max(0, Math.min(top, rect.height - height));

    // If dropping a generic text field without predefined label, prompt for label
    let resolvedLabel = draggedField.label;
    let options: string[] | undefined = undefined;
    if (draggedField.type === "text" && !resolvedLabel) {
      const input = window.prompt("Enter label for this textbox:", "Textbox");
      if (input === null) {
        // user cancelled; do not add field
        setDragging(false);
        setDraggedField(null);
        setDropPreview(null);
        return;
      }
      resolvedLabel = input.trim() || "Textbox";
    }
    // If dropping a dropdown field, ask for label and options
    if (draggedField.type === "dropdown") {
      const labelInput = window.prompt("Enter label for this dropdown:", "Dropdown");
      if (labelInput === null) {
        setDragging(false);
        setDraggedField(null);
        setDropPreview(null);
        return;
      }
      resolvedLabel = (labelInput.trim() || "Dropdown");
      const optionsInput = window.prompt("Enter options (comma separated):", "Option 1, Option 2, Option 3");
      if (optionsInput === null) {
        setDragging(false);
        setDraggedField(null);
        setDropPreview(null);
        return;
      }
      options = optionsInput.split(',').map(s => s.trim()).filter(Boolean);
    }
    // If dropping an input field (textarea), ask for label
    if (draggedField.type === "input") {
      const taLabel = window.prompt("Enter label for this input field:", "Comments");
      if (taLabel === null) {
        setDragging(false);
        setDraggedField(null);
        setDropPreview(null);
        return;
      }
      resolvedLabel = (taLabel.trim() || "Input");
    }
    // If dropping a checkbox field, ask for label and options (same as dropdown)
    if (draggedField.type === "checkbox") {
      const cbLabel = window.prompt("Enter label for this checkbox:", "Checkbox");
      if (cbLabel === null) {
        setDragging(false);
        setDraggedField(null);
        setDropPreview(null);
        return;
      }
      resolvedLabel = (cbLabel.trim() || "Checkbox");
      const cbOptions = window.prompt("Enter checkbox options (comma separated):", "Yes, No");
      if (cbOptions === null) {
        setDragging(false);
        setDraggedField(null);
        setDropPreview(null);
        return;
      }
      options = cbOptions.split(',').map(s => s.trim()).filter(Boolean);
      // Set default value to first option
      (draggedField as any).__value = options[0] || '';
    }
    // If dropping a phone field, ask for label
    if (draggedField.type === "phone") {
      const phLabel = window.prompt("Enter label for this phone field:", "Phone");
      if (phLabel === null) {
        setDragging(false);
        setDraggedField(null);
        setDropPreview(null);
        return;
      }
      resolvedLabel = (phLabel.trim() || "Phone");
    }

    const newField: SignatureField = {
      id: `${Date.now()}`,
      docId: activeDocId,
      recipientId: mode === "normal" ? activeRecipientId ?? undefined : undefined,
      slotId: mode === "power" ? activeSlotId ?? undefined : undefined,
      page: pageNum,
      x: left,
      y: top,
      width,
      height,
      type: draggedField.type,
      label: resolvedLabel,
      fieldId: draggedField.id,
      options,
      value: (draggedField as any).__value
    };
    console.log(`New Field ID : ${JSON.stringify(newField)}`);
    console.log("activeRecipientId6", activeRecipientId);
    setSignatureFields(prev => {
      const next = [...prev, newField];
      if (onFieldsChange) onFieldsChange(next);
      return next;
    });

    setDragging(false);
    setDraggedField(null);
    setDropPreview(null);
  };

  // move logic — allow moving any non-locked field (not restricted by active)
  const handleFieldMouseDown = (e: React.MouseEvent, field: SignatureField) => {
    if (field.locked) return;

    e.stopPropagation();
    const pageEl = getPageElement(field.page);
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
      // Find which page the field is on
      const field = signatureFields.find(f => (f.id ?? f._id) === movingFieldId);
      if (!field) return;

      const pageEl = getPageElement(field.page);
      const pageRect = pageEl?.getBoundingClientRect();
      if (!pageRect) return;

      const pageLeft = pageRect.left ?? 0;
      const pageTop = pageRect.top ?? 0;
      const pageWidth = pageRect.width ?? Infinity;
      const pageHeight = pageRect.height ?? Infinity;

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
  }, [movingFieldId, moveOffset, setSignatureFields, signatureFields]);

  // Add fixed fields for all recipients/slots (bottom row)
  // const addFieldsForAllRecipients = () => {
  //   if (!activeDocId) return;
  //   const pageWidth = 800, pageHeight = 1000;
  //   const width = 120, height = 40;
  //   const bottomMargin = 20;
  //   const gap = 12, rowGap = 10, sideMargin = 50;
  //   const targetPage = numPages > 0 ? numPages : 1;

  //   const targetList =
  //     mode === "normal"
  //       ? recipients.map(r => ({ id: r.id }))
  //       : (slotsToUse || []).map(s => ({ id: s.slotId }));

  //   const usableWidth = Math.max(1, pageWidth - sideMargin * 2);
  //   const perRow = Math.max(1, Math.floor((usableWidth + gap) / (width + gap)));

  //   const newFields: SignatureField[] = targetList.map((r, idx) => {
  //     const col = idx % perRow;
  //     const row = Math.floor(idx / perRow);
  //     const itemsInThisRow = Math.min(perRow, Math.max(0, targetList.length - row * perRow));
  //     const rowTotalWidth = itemsInThisRow * width + (itemsInThisRow - 1) * gap;
  //     const startXForRow = sideMargin + Math.max(0, (usableWidth - rowTotalWidth) / 2);
  //     const x = startXForRow + col * (width + gap);
  //     const y = pageHeight - height - bottomMargin - row * (height + rowGap);

  //     return {
  //       id: `auto_${Date.now()}_${idx}`,
  //       docId: activeDocId,
  //       recipientId: mode === "normal" ? r.id : undefined,
  //       slotId: mode === "power" ? r.id : undefined,
  //       page: targetPage,
  //       x,
  //       y,
  //       width,
  //       height,
  //       type: "signature",
  //       locked: true,
  //     };
  //   });

  //   setSignatureFields(prev => [...prev, ...newFields]);
  // };

  // active assignee id for preview color
  const activeAssigneeId = mode === "normal" ? activeRecipientId : activeSlotId;
  console.log("activeAssigneeId7", activeAssigneeId);

  // Standard fields list for left sidebar
  const standardFields = [
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

  const filteredFields = standardFields.filter(field =>
    field.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const documentName = activeDoc?.name || 'Brief Report.docx';
  // const documentTitle = `Complete with Docusign: ${documentName}`;

  // render
  if (!documents || documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-160px)]">
        <div className="text-center">
          <div className="text-gray-500 text-lg mb-2">No documents available</div>
          <div className="text-gray-400 text-sm">Please upload documents first</div>
        </div>
      </div>
    );
  }

  if (!activeDocId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-160px)]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-gray-500 text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen min-h-0 flex flex-col overflow-hidden bg-gray-100" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>

      <div className="bg-gray-50 border-b border-gray-200 h-12 flex items-center px-4 w-full">
        <div className="flex items-center flex-1 min-w-0">
          <div className="p-3 flex-shrink-0 relative recipient-dropdown">
            {mode === "normal" ? (
              <>
                <button
                  onClick={() => setShowRecipientDropdown(!showRecipientDropdown)}
                  className="w-60 flex items-center justify-between gap-2 px-2 py-1 bg-white-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
                >
                  {/* LEFT BLOCK — icon + name */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-4 h-4 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center flex-shrink-0">
                      <User className="w-3 h-3 text-blue-600" />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span
                        className="text-xs font-medium leading-tight truncate"
                        style={{ fontSize: "12px", color: "#301934" }}
                      >
                        {activeRecipient?.name || "Select Recipient"}
                      </span>

                      {/* {activeRecipient?.email && (
                        <span
                          className="text-xs leading-tight truncate"
                          style={{ fontSize: "11px", color: "#6b7280" }}
                        >
                          {activeRecipient.email}
                        </span>
                      )} */}
                    </div>
                  </div>

                  {/* DROPDOWN ICON */}
                  <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
                </button>

                {showRecipientDropdown && (
                  <div className="absolute top-full left-3 right-3 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                    {recipients.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setActiveRecipientId(r.id);
                          setShowRecipientDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <div className="w-6 h-6 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center flex-shrink-0">
                          <User className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs font-medium text-gray-800 truncate" style={{ fontSize: '12px' }}>{r.name}</span>
                          {r.email && <span className="text-xs text-gray-500 truncate" style={{ fontSize: '11px' }}>{r.email}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowRecipientDropdown(!showRecipientDropdown)}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-800 font-medium truncate flex-1 text-left" style={{ fontSize: '14px', color: '#301934' }}>
                    {activeSlot?.name || activeSlot?.slotId || 'Select Slot'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
                </button>
                {showRecipientDropdown && (
                  <div className="absolute top-full left-3 right-3 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                    {slotsToUse.map((s) => (
                      <button
                        key={s.slotId}
                        onClick={() => {
                          setActiveSlotId(s.slotId);
                          setShowRecipientDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 truncate"
                      >
                        {s.name || s.slotId || 'Unnamed Slot'}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Document chooser */}
          {documents.length > 1 && (
            <div className="p-3 flex-shrink-0 relative document-dropdown">
              <button
                onClick={() => setShowDocDropdown(!showDocDropdown)}
                className="w-60 flex items-center justify-between gap-2 px-2 py-1 bg-white-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
                title="Select document"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-3 h-3 text-gray-600" />
                  </div>
                  <span className="text-xs font-medium leading-tight truncate" style={{ fontSize: "12px", color: "#301934" }}>
                    {documents.find(d => d.id === activeDocId)?.name || 'Select Document'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
              </button>
              {showDocDropdown && (
                <div className="absolute top-full left-3 right-3 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                  {documents.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setActiveDocId(d.id);
                        setCurrentPage(1);
                        setShowDocDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <div className="w-6 h-6 rounded bg-gray-100 border border-gray-300 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-3.5 h-3.5 text-gray-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-800 truncate" style={{ fontSize: '12px' }}>{d.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {/* Middle Icons */}
        <div className="flex items-center justify-center flex-1">
          <button className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors">
            <Undo2 className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors">
            <Redo2 className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors">
            <Save className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors">
            <Printer className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>

          <select
            value={zoomLevel}
            onChange={(e) => setZoomLevel(Number(e.target.value))}
            className="px-2 py-1 text-sm text-gray-800 hover:bg-gray-200 rounded transition-colors border-none bg-transparent cursor-pointer focus:outline-none"
            style={{ fontSize: '14px', color: '#301934' }}
          >
            <option value={50}>50%</option>
            <option value={75}>75%</option>
            <option value={100}>100%</option>
            <option value={125}>125%</option>
            <option value={150}>150%</option>
            <option value={166}>166%</option>
            <option value={200}>200%</option>
          </select>
        </div>

        <div className="flex items-center justify-end flex-1">
          <div className="p-3 flex-shrink-0">
            <div className="flex gap-2 items-center justify-between mb-2">
              <div>
                <button
                  onClick={() => setShowShortcutsModal(true)}
                  className="text-xs font-semibold text-gray-700 uppercase tracking-wide hover:text-gray-900 transition-colors"
                  style={{ fontSize: '12px', color: '#374151', fontWeight: '600' }}
                >
                  SHORTCUTS
                </button>
              </div>
              <button
                onClick={() => setShowRightSidebar(!showRightSidebar)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title={showRightSidebar ? "Hide preview" : "Show preview"}
              >
                <SaveAll className="w-4 h-4 text-black-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden bg-gray-100 pb-24">
        {/* Left Side Panel */}
        <div className="w-[300px] bg-white border-r border-gray-200 flex flex-shrink-0 h-full">
          {/* Vertical Tabs - Extreme Left Edge */}
          <div className="flex flex-col border-r border-gray-200 flex-shrink-0 h-full">
            <button
              onClick={() => setLeftPanel('standard')}
              className={`w-10 h-12 flex items-center justify-center border-b border-gray-200 transition-colors ${leftPanel === 'standard' ? 'bg-purple-50' : 'hover:bg-gray-50'}`}
            >
              <RectangleHorizontal className="w-3.5 h-3.5 text-gray-700" />
            </button>
            <button
              onClick={() => setLeftPanel(prev => (prev === 'custom' ? 'standard' : 'custom'))}
              className={`w-10 h-12 flex items-center justify-center border-b border-gray-200 transition-colors ${leftPanel === 'custom' ? 'bg-purple-50' : 'hover:bg-gray-50'}`}
            >
              <SquareMousePointer className="w-3.5 h-3.5 text-gray-500" />
            </button>
            <button
              onClick={() => setLeftPanel(prev => (prev === 'pen' ? 'standard' : 'pen'))}
              className={`w-10 h-12 flex items-center justify-center border-b border-gray-200 transition-colors ${leftPanel === 'pen' ? 'bg-purple-50' : 'hover:bg-gray-50'}`}
            >
              <Pen className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>

          {/* Search and Fields */}
          <div className="flex-1 overflow-hidden flex flex-col min-w-0 h-full">
            {leftPanel === 'standard' && (
              <>
                {/* Search Box - Full Width */}
                <div className="border-b border-gray-200 flex-shrink-0">
                  <div className="relative px-1.5 py-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search Fields"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      style={{ fontSize: '14px', color: '#6b7280' }}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Standard Fields List */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  <div className="p-3">
                    <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide" style={{ fontSize: '12px', color: '#374151', fontWeight: '600' }}>
                      STANDARD FIELDS
                    </h3>
                    <div className="space-y-1">
                      {filteredFields.map((field, index) => {
                        const Icon = field.icon;
                        const showSeparatorAfter =
                          (field.type === 'date' && filteredFields[index + 1]) ||
                          (field.type === 'title' && filteredFields[index + 1]);

                        return (
                          <React.Fragment key={field.type}>
                            <button
                              onDragStart={e => handleDragStart(e, { type: field.type as FieldType, label: field.label })}
                              onDragEnd={handleDragEnd}
                              draggable
                              className="w-full flex items-center gap-3 px-2 py-2 hover:bg-blue-50 rounded text-left transition-colors cursor-grab active:cursor-grabbing"
                            >
                              <div className="w-5 h-5 flex items-center justify-center border border-blue bg-blue-100 rounded text-blue-600 flex-shrink-0" style={{ backgroundColor: '#dbeafe', color: '#2563eb' }}>
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-sm text-gray-800" style={{ fontSize: '11px', color: '#301934' }}>
                                {field.label}
                              </span>
                            </button>
                            {showSeparatorAfter && (
                              <div className="my-1 border-t border-gray-200"></div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}

            {leftPanel === 'custom' && (
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold" style={{ color: '#301934' }}>Custom Fields</h3>
                    <span className="text-lg leading-none" title="Add">+</span>
                  </div>

                  <details open className="mb-4">
                    <summary className="cursor-pointer list-none flex items-center justify-between py-1">
                      <span className="text-sm font-medium" style={{ color: '#301934' }}>My Fields</span>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </summary>
                    <div className="mt-2 pl-1">
                      {/* Example item to mirror screenshot */}
                      <button className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 w-full text-left">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded border" style={{ background: '#b9e6f2', borderColor: '#93c5fd' }}>
                          <SquareMousePointer className="w-3.5 h-3.5 text-gray-700" />
                        </span>
                        <span className="text-sm truncate" style={{ color: '#301934' }}>Stamp {String(signatureFields[0]?.id || '').slice(0,6)}</span>
                      </button>
                    </div>
                  </details>

                  <details>
                    <summary className="cursor-pointer list-none flex items-center justify-between py-1">
                      <span className="text-sm font-medium" style={{ color: '#301934' }}>Data Verification</span>
                      <HelpCircle className="w-4 h-4 text-gray-500" />
                    </summary>
                  </details>
                </div>
              </div>
            )}

            {leftPanel === 'pen' && (
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-3">
                  <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide" style={{ fontSize: '10px', color: '#374151', fontWeight: '600' }}>Pre-fill Tools</h3>
                  <div className="">
                    {[
                      { key: 'text', label: 'Text', icon: Type },
                      { key: 'checkbox', label: 'Checkbox', icon: Check },
                      { key: 'radio', label: 'Radio', icon: CircleDot },
                      { key: 'name', label: 'Name', icon: User },
                      { key: 'company', label: 'Company', icon: Building2 },
                    ].map((item) => (
                      <button
                        key={`prefill-${item.key}`}
                        onDragStart={(e) =>
                          handleDragStart(e, {
                            type: item.key === 'checkbox' ? 'checkbox' : 'text',
                            label: item.label,
                          })
                        }
                        onDragEnd={handleDragEnd}
                        draggable
                        className="w-full flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded text-left transition-colors cursor-grab active:cursor-grabbing"
                      >
                        <span className="w-4 h-4 inline-flex items-center justify-center rounded border border-gray-300 bg-white text-gray-700">
                          <item.icon className="w-3 h-3" />
                        </span>
                        <span className="text-xs" style={{ fontSize: '12px', color: '#301934' }}>{item.label}</span>
                        {item.key === 'company' && (
                          <Info
                            className="w-4 h-4 ml-auto text-gray-500 cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                              setCompanyInfo({ visible: true, top: rect.top + window.scrollY - 40 });
                            }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Document Area */}
        <div className="flex-1 overflow-auto bg-gray-100 h-full">
          <div
            className="relative w-full flex items-start justify-center"
            ref={pdfContainerRef}
            onDragOver={handlePdfDragOver}
            onDrop={handlePdfDrop}
            style={{
              padding: '12px',
              minHeight: '100%',
              boxSizing: 'border-box'
            }}
          >
            {activeDoc?.type === "application/pdf" ? (
              <div
                className="relative"
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  margin: '0 auto',
                  gap: '16px'
                }}
              >
                {Array.from({ length: numPages }, (_, index) => {
                  const pageNum = index + 1;
                  const pageCanvas = pageCanvases.get(pageNum);

                  if (!pageCanvas) {
                    return (
                      <div key={pageNum} className="flex items-center justify-center" style={{ minHeight: '200px' }}>
                        <p className="text-gray-500">Loading page {pageNum}...</p>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={pageNum}
                      data-page={pageNum}
                      className="relative"
                      style={{
                        background: 'white',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        display: 'block',
                        marginBottom: pageNum < numPages ? '16px' : '0'
                      }}
                    >
                      <img
                        src={pageCanvas.toDataURL()}
                        alt={`Page ${pageNum}`}
                        style={{
                          display: 'block',
                          width: 'auto',
                          height: 'auto'
                        }}
                      />

                      {/* Render ALL fields on this page */}
                      {signatureFields
                        .filter(
                          (f) => (f.docId ?? f.documentId) === activeDocId && f.page === pageNum
                        )
                        .map((f) => {
                          const assignee = findAssignee(f);
                          const color =
                            recipientColorMap[f.recipientId ?? f.slotId ?? ""] || "#2563eb";
                          const isActive =
                            mode === "normal"
                              ? f.recipientId === activeRecipientId
                              : f.slotId === activeSlotId;
                          console.log("activeRecipientId8", activeRecipientId);
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
                                  background: (f.type === "text" || f.type === "email" || f.type === "dropdown" || f.type === "input" || f.type === "checkbox" || f.type === "phone" || f.type === "stamp") ? "#f8fafc" : "#fff",
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
                                    : f.type === "stamp"
                                      ? `Stamp - ${assignee?.name ?? ""}`
                                      : f.type === "text"
                                        ? `${f.label || "Text"} field - ${assignee?.name ?? ""}`
                                        : f.type === "email"
                                          ? `Email field - ${assignee?.name ?? ""}`
                                          : f.label
                                }
                              >
                                {/* Remove button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSignatureFields(prev => prev.filter(field => (field.id ?? field._id) !== (f.id ?? f._id)));
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "#dc2626";
                                    e.currentTarget.style.transform = "scale(1.1)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "#ef4444";
                                    e.currentTarget.style.transform = "scale(1)";
                                  }}
                                  style={{
                                    position: "absolute",
                                    top: -8,
                                    right: -8,
                                    width: 20,
                                    height: 20,
                                    borderRadius: "50%",
                                    background: "#ef4444",
                                    color: "white",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "12px",
                                    fontWeight: "bold",
                                    zIndex: 40,
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                    transition: "all 0.2s ease"
                                  }}
                                  title="Remove field"
                                >
                                  ×
                                </button>
                                {/* Field text stays inside box */}
                                <div
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    textAlign: "center",
                                  }}
                                >
                                  {f.type === "signature"
                                    ? "Signature"
                                    : f.type === "stamp"
                                      ? "Stamp"
                                      : f.type === "text"
                                        ? (f.label || "Text")
                                        : f.type === "email"
                                          ? "Email"
                                          : f.type === "dropdown"
                                            ? (f.label || "Dropdown")
                                            : f.type === "input"
                                              ? (f.label || "Input")
                                              : f.type === "checkbox"
                                                ? (f.label || "Checkbox")
                                                : f.type === "phone"
                                                  ? (f.label || "Phone")
                                                  : f.label || f.type}
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

                      {/* Drag preview on this page */}
                      {dragging && dropPreview && dropPreview.pageNum === pageNum && (
                        <div
                          style={{
                            position: "absolute",
                            left: dropPreview.x - 60,
                            top: dropPreview.y - 20,
                            width: 120,
                            height: 40,
                            border: `2px dashed ${recipientColorMap[activeAssigneeId ?? ""] || "#2563eb"
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
                            : draggedField?.type === "stamp"
                              ? "Stamp"
                              : draggedField?.type === "text"
                                ? (draggedField?.label || "Text")
                                : draggedField?.type === "email"
                                  ? "Email"
                                  : draggedField?.type === "dropdown"
                                    ? (draggedField?.label || "Dropdown")
                                    : draggedField?.label || draggedField?.type}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-8 text-gray-500">Preview not available</div>
            )}
          </div>
        </div>

        {/* Company info popover */}
        {companyInfo.visible && (
          <div className="fixed z-50" style={{ top: companyInfo.top, left: 320 }}>
            {/* Arrow */}
            <div className="absolute -left-2 top-10" aria-hidden>
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderTop: '10px solid transparent',
                  borderBottom: '10px solid transparent',
                  borderRight: '10px solid white',
                  filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))'
                }}
              />
            </div>

            <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-[380px]">
              <div className="p-6">
                <h4 className="text-lg font-semibold mb-3" style={{ color: '#301934' }}>
                  View company name in PREVIEW
                </h4>
                <p className="text-sm text-gray-700 mb-4">
                  Use RECIPIENT PREVIEW to see how your company name appears to recipients.
                </p>
                <p className="text-sm text-gray-700 mb-6">
                  To correct or change your company name, go to account settings or contact your administrator.
                </p>
                <div className="flex justify-end">
                  <button
                    onClick={() => setCompanyInfo({ visible: false, top: companyInfo.top })}
                    className="px-5 py-2 rounded  text-white transition-colors"  style={{ backgroundColor: '#260559' }}
                  >
                    Got It
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Side Panel */}
        {showRightSidebar && (
          <div className="w-[220px] bg-white border-l border-gray-200 flex flex-col flex-shrink-0 h-full min-h-0">

            <div className="px-3 pt-3 pb-2 border-b border-gray-200 flex-shrink-0">
              <p className="text-sm font-medium text-gray-800 truncate" style={{ fontSize: '13px', color: '#301934', fontWeight: '500' }}>
                {documentName?.slice(0, 22)}
              </p>
              <p className="text-[11px] text-gray-500" style={{ color: '#6b7280' }}>
                Pages: {activeDoc?.pages || numPages || 1}
              </p>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-2 py-3">
              {/* All page thumbnails */}
              {activeDoc?.type === "application/pdf" ? (
                Array.from({ length: numPages }, (_, index) => {
                  const pageNum = index + 1;
                  const thumbnailCanvas = thumbnailCanvases.get(pageNum);
                  const isCurrentPage = pageNum === currentPage;

                  return (
                    <div key={pageNum} className="mb-3">
                      <div
                        className={`overflow-hidden cursor-pointer transition-all ${isCurrentPage ? 'ring-2 ring-blue-300' : ''}`}
                        onClick={() => {
                          const pageElement = document.querySelector(`[data-page="${pageNum}"]`);
                          if (pageElement) {
                            pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                          setCurrentPage(pageNum);
                        }}
                      >
                        {thumbnailCanvas ? (
                          <img
                            src={thumbnailCanvas.toDataURL()}
                            alt={`Page ${pageNum} thumbnail`}
                            className="block w-full bg-white"
                            style={{ border: '1px solid #e5e7eb' }}
                          />
                        ) : (
                          <div className="w-full h-24 bg-white border border-gray-200 flex items-center justify-center">
                            <p className="text-[11px] text-gray-400">Loading...</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1 px-1">
                        <p className="text-[11px] text-gray-600">{pageNum}</p>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPageCanvases(prev => {
                                const newMap = new Map(prev);
                                newMap.delete(pageNum);
                                return newMap;
                              });
                              setThumbnailCanvases(prev => {
                                const newMap = new Map(prev);
                                newMap.delete(pageNum);
                                return newMap;
                              });
                            }}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                            title="Refresh"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSignatureFields(prev => prev.filter(f => (f.docId ?? f.documentId) !== activeDocId || f.page !== pageNum));
                            }}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                            title="Clear fields"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-24 bg-white border border-gray-200 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sticky footer for Send */}
      {onSend && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex justify-end gap-2 z-40">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Previous
            </button>
          )}
          <button
            onClick={onSend}
            disabled={!!sending}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${sending ? 'bg-blue-400 cursor-not-allowed text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowShortcutsModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-4xl mx-4 max-h-[70vh] flex flex-col"
            style={{ width: '800px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-xl text-gray-800" style={{ fontSize: '20px', color: '#301934', fontFamily: "Georgia, serif", }}>
                Keyboard shortcuts
              </h2>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Introductory Text */}
              <p className="text-xs text-black-600 mb-6" >
                Use shortcut keys as an alternative to mouse control to perform common actions.
              </p>

              {/* Navigate Section */}
              <div className="mb-6">
                <h3 className="text-base text-black-00 mb-3" style={{ fontSize: '16px', color: '#301934' }}>
                  Navigate
                </h3>
                <div className="flex items-center gap-4 py-2">
                  <span className="text-sm text-black-700" style={{ fontSize: '12px', }}>
                    Move Between Panels
                  </span>
                  <span className="text-sm text-gray-800 px-2 py-1 rounded" style={{ fontSize: '14px', color: '#301934' }}>
                    Ctrl+Shift+L
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-300 mb-6"></div>

              {/*Common Actions */}
              <div className="mb-6">
                <h3 className="text-base text-gray-800 mb-3" style={{ fontSize: '16px', color: '#301934', fontWeight: '500' }}>
                  Fields
                </h3>

                <div className="grid grid-cols-2 gap-x-12">
                  {/* LEFT COLUMN */}
                  <div className="space-y-2">
                    {/* Add Field */}
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-700" style={{ fontSize: '12px', color: '#374151' }}>
                        Add Field
                      </span>
                      <div className="flex gap-2">
                        <span className="text-sm font-medium text-gray-800 px-2 py-1  rounded" style={{ fontSize: '14px', color: '#301934', fontWeight: '500' }}>
                          Enter, Space
                        </span>
                      </div>
                    </div>

                    {/* Duplicate Field */}
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-700" style={{ fontSize: '12px', color: '#374151' }}>
                        Duplicate Field
                      </span>
                      <span className="text-sm font-medium text-gray-800 px-2 py-1  rounded" style={{ fontSize: '14px', color: '#301934', fontWeight: '500' }}>
                        Ctrl+D
                      </span>
                    </div>

                    {/* Select Fields on Current Page */}
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-700" style={{ fontSize: '12px', color: '#374151' }}>
                        Select Fields on Current Page
                      </span>
                      <span className="text-sm font-medium text-gray-800 px-2 py-1  rounded" style={{ fontSize: '14px', color: '#301934', fontWeight: '500' }}>
                        Ctrl+G
                      </span>
                    </div>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="space-y-2 border-l border-gray-200 pl-8">
                    {/* Delete Field */}
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-700" style={{ fontSize: '12px', color: '#374151' }}>
                        Delete Field
                      </span>
                      <span className="text-sm font-medium text-gray-800 px-2 py-1  rounded" style={{ fontSize: '14px', color: '#301934', fontWeight: '500' }}>
                        Delete
                      </span>
                    </div>

                    {/* Search fields */}
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-700" style={{ fontSize: '12px', color: '#374151' }}>
                        Search fields
                      </span>
                      <span className="text-sm font-medium text-gray-800 px-2 py-1  rounded" style={{ fontSize: '14px', color: '#301934', fontWeight: '500' }}>
                        Ctrl+Shift+S
                      </span>
                    </div>

                    {/* Change Recipient for Field */}
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-700" style={{ fontSize: '12px', color: '#374151' }}>
                        Change Recipient for Field
                      </span>
                      <div className="flex gap-2">
                        <span className="text-sm font-medium text-gray-800 px-2 py-1  rounded" style={{ fontSize: '14px', color: '#301934', fontWeight: '500' }}>
                          Ctrl+Shift+,
                        </span>
                        <span className="text-sm font-medium text-gray-800 px-2 py-1 rounded" style={{ fontSize: '14px', color: '#301934', fontWeight: '500' }}>
                          Ctrl+Shift+.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-300 mb-6"></div>

              <div>
                <h3 className="text-base text-gray-800 mb-3" style={{ fontSize: '16px', color: '#301934', fontWeight: '500' }}>
                  Common Actions
                </h3>

                <div className="grid grid-cols-2 gap-x-12">
                  {/* LEFT COLUMN */}
                  <div className="space-y-2">
                    {/* Common Actions */}
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-700" style={{ fontSize: '12px', color: '#374151' }}>
                        Save
                      </span>
                      <div className="flex gap-2">
                        <span className="text-sm font-medium text-gray-800 px-2 py-1  rounded" style={{ fontSize: '14px', color: '#301934', fontWeight: '500' }}>
                          Ctrl+S
                        </span>
                      </div>
                    </div>

                    {/* Duplicate Field */}
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-700" style={{ fontSize: '12px', color: '#374151' }}>
                        Undo
                      </span>
                      <span className="text-sm font-medium text-gray-800 px-2 py-1  rounded" style={{ fontSize: '14px', color: '#301934', fontWeight: '500' }}>
                        Ctrl+Z
                      </span>
                    </div>

                    {/* Select Fields on Current Page */}
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-700" style={{ fontSize: '12px', color: '#374151' }}>
                        Select all
                      </span>
                      <span className="text-sm font-medium text-gray-800 px-2 py-1  rounded" style={{ fontSize: '14px', color: '#301934', fontWeight: '500' }}>
                        Ctrl+A
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 border-l border-gray-200 pl-8">
                    {/* Delete Field */}
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-700" style={{ fontSize: '12px', color: '#374151' }}>
                        Copy
                      </span>
                      <span className="text-sm font-medium text-gray-800 px-2 py-1  rounded" style={{ fontSize: '14px', color: '#301934', fontWeight: '500' }}>
                        Ctrl+C
                      </span>
                    </div>

                    {/* Search fields */}
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-700" style={{ fontSize: '12px', color: '#374151' }}>
                        Redo
                      </span>
                      <span className="text-sm font-medium text-gray-800 px-2 py-1  rounded" style={{ fontSize: '14px', color: '#301934', fontWeight: '500' }}>
                        Ctrl+Y
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with OK Button */}
            <div className="p-6 border-t border-gray-200 flex justify-end flex-shrink-0">
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors font-medium"
                style={{ backgroundColor: '#9333ea', fontSize: '14px' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
