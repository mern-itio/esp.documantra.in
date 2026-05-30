import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { mergePDFService } from '../../services/mergePDFService';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  ChevronsRight,
  Pencil,
  Lightbulb,
  X,
} from 'lucide-react';
import { SignerEditorLayout } from '../../components/ESign/SignerEditorLayout';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker from global
if (typeof window !== 'undefined' && (window as any).__PDFJS_WORKER_SRC__) {
  pdfjs.GlobalWorkerOptions.workerSrc = (window as any).__PDFJS_WORKER_SRC__;
}

type Signer = {
  id: string;
  fullName: string;
  email: string;
};

type SignerFieldBox = {
  id: string;
  signerId: string;
  page: number;
  xPercent: number;
  yPercent: number;
  size: 'large' | 'small';
  /** Field type from standard fields (signature, date, name, etc.) */
  fieldType?: string;
  /** Custom label for non-signature fields (e.g. "Contract Date") */
  label?: string;
};

type LocationState = {
  files?: File[];
  fromPlan?: boolean;
};

/** Right side panel to rename a (non-signature) field */
function FieldRenameSidePanel({
  field,
  defaultLabel,
  onSave,
  onClose,
}: {
  field: SignerFieldBox;
  defaultLabel: string;
  onSave: (label: string) => void;
  onClose: () => void;
  onRemove: () => void;
}) {
  const [value, setValue] = useState(field.label ?? defaultLabel);
  useEffect(() => {
    setValue(field.label ?? defaultLabel);
  }, [field.id, field.label, defaultLabel]);
  return (
    <div
      className="fixed right-0 top-0 z-50 flex h-full w-72 flex-col border-l border-[#E6D8C9] bg-[#F7F3EE] shadow-xl"
      role="dialog"
      aria-labelledby="field-rename-title"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-[#E6D8C9] px-4 py-3">
        <h2 id="field-rename-title" className="text-base font-semibold text-slate-800">
          Rename field
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <span className="text-xs font-medium text-slate-500">Type</span>
          <p className="mt-0.5 text-sm font-medium text-slate-800">{defaultLabel}</p>
        </div>
        <div>
          <label htmlFor="field-rename-input" className="block text-xs font-medium text-slate-500">
            Field name
          </label>
          <input
            id="field-rename-input"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={defaultLabel}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#084bdc] focus:outline-none focus:ring-1 focus:ring-[#084bdc]"
          />
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onSave(value)}
            className="w-full rounded-lg bg-[#084bdc] px-3 py-2 text-sm font-semibold text-white hover:bg-[#084bdc]/90"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-slate-300 bg-[#F7F3EE] px-3 py-2 text-sm font-medium text-slate-700 hover:bg-[#F5F2EE]"
          >
            Cancel
          </button>
        
        </div>
      </div>
    </div>
  );
}

const SignerPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || {}) as LocationState;

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mergeError, setMergeError] = useState<string | null>(null);

  const [signers, setSigners] = useState<Signer[]>([]);
  const [showRecipientModal, setShowRecipientModal] = useState(false);

  // Add / edit signer form
  const [fullName, setFullName] = useState('');
  const [emailAdd, setEmailAdd] = useState('');
  const [formError, setFormError] = useState('');
  const [editingSignerId, setEditingSignerId] = useState<string | null>(null);

  // Mark vs Edit mode
  const [isMarkMode, setIsMarkMode] = useState(true);
  const [activeSignerId, setActiveSignerId] = useState<string | null>(null);

  // On‑PDF fields
  const [signerFields, setSignerFields] = useState<SignerFieldBox[]>([]);
  /** When set, show right side panel to rename this (non-signature) field */
  const [fieldRenamePanelFieldId, setFieldRenamePanelFieldId] = useState<string | null>(null);

  // Drag-and-drop from left panel standard fields (like SigningEditorStep)
  const [draggedField, setDraggedField] = useState<{ type: string; label: string } | null>(null);
  const [dropPreview, setDropPreview] = useState<{ x: number; y: number; pageNum: number } | null>(null);
  const pdfPageContainerRef = useRef<HTMLDivElement | null>(null);

  // Ensure overlay never stays active: clear drag state when any drag ends (drop or cancel)
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      setDraggedField(null);
      setDropPreview(null);
    };
    document.addEventListener('dragend', handleGlobalDragEnd);
    return () => document.removeEventListener('dragend', handleGlobalDragEnd);
  }, []);

  // Tap overlay
  const [tapOverlayDismissed, setTapOverlayDismissed] = useState(false);
  const [neverShowTapOverlay, setNeverShowTapOverlay] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('signerPage_tapOverlay_neverShow');
  });

  const showTapOverlay =
    signers.length > 0 &&
    isMarkMode &&
    signerFields.length === 0 &&
    !tapOverlayDismissed &&
    !neverShowTapOverlay &&
    !!pdfUrl &&
    !loading;

  const dismissTapOverlay = () => setTapOverlayDismissed(true);
  const dontShowTapOverlayAgain = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('signerPage_tapOverlay_neverShow', '1');
    }
    setNeverShowTapOverlay(true);
    setTapOverlayDismissed(true);
  };
  // PDF sizing
  const [pageWidth, setPageWidth] = useState(800);
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);
  const restoredFromPlanRef = useRef(false);

  // Thumbnails for right panel (generated from PDF)
  const [thumbnailUrls, setThumbnailUrls] = useState<(string | null)[]>([]);
  useEffect(() => {
    if (!pdfUrl || totalPages < 1) {
      setThumbnailUrls([]);
      return;
    }
    let cancelled = false;
    const thumbWidth = 200;

    const load = async () => {
      try {
        const doc = await pdfjs.getDocument(pdfUrl).promise;
        if (cancelled) return;
        const urls: (string | null)[] = [];
        for (let i = 1; i <= totalPages; i++) {
          if (cancelled) break;
          const page = await doc.getPage(i);
          const vp = page.getViewport({ scale: 1 });
          const scale = thumbWidth / vp.width;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            urls.push(null);
            continue;
          }
          // pdfjs-dist typings differ across versions (some require `canvas`, some forbid it).
          // Runtime supports rendering into the provided 2D context either way.
          const renderParams: any = { canvasContext: ctx, viewport };
          renderParams.canvas = canvas;
          await page.render(renderParams).promise;
          if (cancelled) break;
          urls.push(canvas.toDataURL('image/jpeg', 0.75));
        }
        if (!cancelled) setThumbnailUrls(urls);
      } catch {
        if (!cancelled) setThumbnailUrls([]);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [pdfUrl, totalPages]);

  useEffect(() => {
    const el = pdfContainerRef.current;
    if (!el) return;

    const onResize = () => {
      const { clientWidth: W, clientHeight: H } = el;
      if (W <= 0 || H <= 0) return;
      const a4Ratio = 210 / 297;
      const widthByHeight = H * a4Ratio * 1.05; // slightly oversize for better fill
      const w = Math.min(W, widthByHeight);
      setPageWidth(Math.max(200, Math.floor(w)));
    };

    onResize();
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pdfUrl, currentPage]);

  const STEP_STORAGE_KEY = 'signerPage_stepState';

  // Restore state when coming back from Step 2 (plan)
  useEffect(() => {
    if (restoredFromPlanRef.current) return;
    if (!state.fromPlan) return;
    if (typeof window === 'undefined') return;

    const raw = window.localStorage.getItem(STEP_STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as {
        pdfUrl?: string | null;
        signers?: Signer[];
        signerFields?: SignerFieldBox[];
      };
      if (parsed.pdfUrl) setPdfUrl(parsed.pdfUrl);
      if (parsed.signers) setSigners(parsed.signers);
      if (parsed.signerFields) setSignerFields(parsed.signerFields);
      restoredFromPlanRef.current = true;
    } catch {
      // ignore parse errors
    }
  }, [state.fromPlan]);

  const getInitials = (name: string) =>
    name
      .trim()
      .split(/\s+/)
      .map((s) => s[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  // Resolve PDF from uploaded files (state.files)
  useEffect(() => {
    const files = state?.files;
    if (!files?.length) {
      setLoading(false);
      return;
    }

    const pdfFiles = files.filter((f) => f.type === 'application/pdf');
    if (pdfFiles.length === 0) {
      setMergeError('No PDF file to display. Please upload at least one PDF.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        if (pdfFiles.length === 1) {
          const url = URL.createObjectURL(pdfFiles[0]);
          if (!cancelled) setPdfUrl(url);
          setLoading(false);
          return;
        }

        const result = await mergePDFService.mergePDFs({
          files: pdfFiles,
          orderedFilenames: pdfFiles.map((f) => f.name),
        });

        if (cancelled) return;

        if (result.success && result.mergedFile?.downloadUrl) {
          setPdfUrl(result.mergedFile.downloadUrl);
        } else {
          setMergeError(result.error || 'Failed to merge PDFs.');
          const fallback = URL.createObjectURL(pdfFiles[0]);
          setPdfUrl(fallback);
        }
      } catch (e: any) {
        if (!cancelled) {
          setMergeError(e?.message || 'Failed to prepare document.');
          const fallback = URL.createObjectURL(pdfFiles[0]);
          setPdfUrl(fallback);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [state?.files]);

  // Redirect if no files
  useEffect(() => {
    // Only redirect back to upload when there is neither an incoming file list
    // nor an already-loaded PDF URL, and we are NOT returning from Step 2.
    // When coming from Step 2 (`fromPlan`), we restore state from sessionStorage
    // instead of forcing the user back to the upload page.
    if (!loading && !state?.files?.length && !pdfUrl && !state.fromPlan) {
      navigate('/sign-pdf-online', { replace: true });
    }
  }, [loading, state?.files?.length, pdfUrl, state.fromPlan, navigate]);

  // Active signer selection
  useEffect(() => {
    if (signers.length === 0) {
      setActiveSignerId(null);
      return;
    }
    const ids = new Set(signers.map((s) => s.id));
    if (!activeSignerId || !ids.has(activeSignerId)) {
      setActiveSignerId(signers[0].id);
    }
  }, [signers, activeSignerId]);

  // Keep a ref to the current PDF URL (used only for persistence).
  const pdfUrlRef = useRef<string | null>(null);
  useEffect(() => {
    pdfUrlRef.current = pdfUrl;
  }, [pdfUrl]);


  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setTotalPages(numPages);
      setCurrentPage(1);
    },
    [],
  );
  const openRecipientModal = () => {
    setEditingSignerId(null);
    setFullName('');
    setEmailAdd('');
    setFormError('');
    setShowRecipientModal(true);
  };
  const openRecipientModalForEdit = (signer: Signer) => {
    setEditingSignerId(signer.id);
    setFullName(signer.fullName);
    setEmailAdd(signer.email);
    setFormError('');
    setShowRecipientModal(true);
  };



  // Field drag state
  const fieldDragRef = useRef<{
    fieldId: string;
    startX: number;
    startY: number;
    originXPercent: number;
    originYPercent: number;
    containerRect: DOMRect;
  } | null>(null);
  const fieldDidDragRef = useRef(false);

  const removeSignerField = (id: string) => {
    setSignerFields((prev) => prev.filter((f) => f.id !== id));
  };

  const updateSignerFieldLabel = (id: string, label: string) => {
    setSignerFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, label: label.trim() || undefined } : f)),
    );
    setFieldRenamePanelFieldId(null);
  };

  // Drag from left panel: find which page the drop is on (we show single page, so use currentPage + container rect)
  const findPageForDrop = (clientX: number, clientY: number): { pageNum: number; rect: DOMRect } | null => {
    const el = pdfPageContainerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
      return { pageNum: currentPage, rect };
    }
    return null;
  };

  const handlePdfDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!draggedField) return;
    const pageInfo = findPageForDrop(e.clientX, e.clientY);
    if (!pageInfo) {
      setDropPreview(null);
      return;
    }
    setDropPreview({
      x: e.clientX - pageInfo.rect.left,
      y: e.clientY - pageInfo.rect.top,
      pageNum: pageInfo.pageNum,
    });
  };

  const handlePdfDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedField) return;
    const pageInfo = findPageForDrop(e.clientX, e.clientY);
    if (!pageInfo) {
      setDraggedField(null);
      setDropPreview(null);
      return;
    }
    const { pageNum, rect } = pageInfo;
    setCurrentPage(pageNum);

    // Convert drop position to percentage (center of dropped field)
    const width = 120;
    const height = 40;
    let left = e.clientX - rect.left - width / 2;
    let top = e.clientY - rect.top - height / 2;
    left = Math.max(0, Math.min(left, rect.width - width));
    top = Math.max(0, Math.min(top, rect.height - height));

    const xPercent = (left + width / 2) / rect.width * 100;
    const yPercent = (top + height / 2) / rect.height * 100;
    const clampedX = Math.min(95, Math.max(5, xPercent));
    const clampedY = Math.min(95, Math.max(5, yPercent));

    // Require at least one signer to assign the field to
    const signerId = activeSignerId ?? signers[0]?.id;
    if (!signerId) {
      setDraggedField(null);
      setDropPreview(null);
      return;
    }

    setSignerFields((prev) => [
      ...prev,
      {
        id: `field-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        signerId,
        page: pageNum,
        xPercent: clampedX,
        yPercent: clampedY,
        size: 'large',
        fieldType: draggedField.type,
      },
    ]);
    setTapOverlayDismissed(true);
    setDraggedField(null);
    setDropPreview(null);
  };

  const startFieldDrag = (
    event: React.MouseEvent<HTMLDivElement>,
    field: SignerFieldBox,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const container = event.currentTarget.parentElement as HTMLElement | null;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    fieldDragRef.current = {
      fieldId: field.id,
      startX: event.clientX,
      startY: event.clientY,
      originXPercent: field.xPercent,
      originYPercent: field.yPercent,
      containerRect: rect,
    };
    fieldDidDragRef.current = false;

    const handleMove = (moveEvent: MouseEvent) => {
      const drag = fieldDragRef.current;
      if (!drag) return;

      const dx = moveEvent.clientX - drag.startX;
      const dy = moveEvent.clientY - drag.startY;

      if (!fieldDidDragRef.current) {
        const threshold = 3;
        if (Math.abs(dx) <= threshold && Math.abs(dy) <= threshold) {
          return;
        }
        fieldDidDragRef.current = true;
      }

      const { containerRect } = drag;
      if (!containerRect.width || !containerRect.height) return;

      const deltaXPercent = (dx / containerRect.width) * 100;
      const deltaYPercent = (dy / containerRect.height) * 100;

      const newX = Math.min(
        95,
        Math.max(5, drag.originXPercent + deltaXPercent),
      );
      const newY = Math.min(
        95,
        Math.max(5, drag.originYPercent + deltaYPercent),
      );

      setSignerFields((prev) =>
        prev.map((f) =>
          f.id === drag.fieldId ? { ...f, xPercent: newX, yPercent: newY } : f,
        ),
      );
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      fieldDragRef.current = null;
      fieldDidDragRef.current = false;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  // Simple Next handler – opens OTP panel (email / SMS)
  const handleNext = () => {
    if (signers.length === 0) return;

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        STEP_STORAGE_KEY,
        JSON.stringify({
          pdfUrl,
          signers,
          signerFields,
        }),
      );
    }
    navigate('/sign-pdf-online/plan', {
      state: {
        signers: signers.map(({ id, fullName, email }) => ({
          id,
          fullName,
          email,
        })),
      },
    });
  };



  // OTP countdown timer
  // useEffect(() => {
  //   if (!otpPanelOpen || otpStep !== 'verifyOtp' || !otpTimerRunning) return;

  //   if (otpCountdown <= 0) {
  //     setOtpTimerRunning(false);
  //     return;
  //   }

  //   const timer = window.setTimeout(() => {
  //     setOtpCountdown((prev) => Math.max(0, prev - 1));
  //   }, 1000);

  //   return () => window.clearTimeout(timer);
  // }, [otpPanelOpen, otpStep, otpTimerRunning, otpCountdown]);

  // When opened directly without any files or restored document, we redirect
  // back to the upload page (handled in a useEffect). Avoid rendering a blank
  // screen while that happens.
  if (!loading && !pdfUrl && !state?.files?.length && !state.fromPlan) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F5F2EE] text-sm text-slate-600">
        Redirecting to upload…
      </div>
    );
  }

  // Document name for right panel (static UI)
  const documentName = state?.files?.[0]?.name?.replace(/\.[^/.]+$/, '') || 'Document';

  return (
    <>
      <SignerEditorLayout
        documentName={documentName}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageSelect={setCurrentPage}
        thumbnailUrls={thumbnailUrls}
        showRightPanel
        onFieldDragStart={(field) => setDraggedField(field)}
        onFieldDragEnd={() => {
          setDraggedField(null);
          setDropPreview(null);
        }}
      >
        <React.Fragment>
          {/* Left side panel: rename (non-signature) field */}
          {fieldRenamePanelFieldId && (() => {
            const renameField = signerFields.find((f) => f.id === fieldRenamePanelFieldId);
            if (!renameField) return null;
            const defaultLabel = renameField.fieldType
              ? renameField.fieldType.charAt(0).toUpperCase() + renameField.fieldType.slice(1)
              : 'Field';
            return (
              <FieldRenameSidePanel
                field={renameField}
                defaultLabel={defaultLabel}
                onSave={(label) => updateSignerFieldLabel(renameField.id, label)}
                onClose={() => setFieldRenamePanelFieldId(null)}
                onRemove={() => {
                  removeSignerField(renameField.id);
                  setFieldRenamePanelFieldId(null);
                }}
              />
            );
          })()}

          <div className="flex h-full flex-col bg-slate-100 flex-1 min-h-0">
            {/* Step banner */}
            <div className="flex shrink-0 items-center justify-center border-b border-amber-200 bg-amber-50 py-2">
              <span className="rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-800">
                Step 1: Add Signature Fields
              </span>
            </div>

            {/* Blue instruction bar when signers exist; red when none */}
            {/* {signers.length > 0 && (
              <div className="shrink-0 bg-[#084bdc] px-4 py-2 text-center text-sm font-medium text-white">
                Tap where {signers[0].fullName} will sign.
              </div>
            )} */}
            {signers.length === 0 && (
              <div className="shrink-0 bg-red-600 px-4 py-2 text-center text-sm font-medium text-white">
                Add at least one recipient to continue
              </div>
            )}

            <div className="flex flex-1 min-h-0 flex-col relative">
              {/* PDF Area */}
              <div className="relative flex-1 min-h-0 min-w-0">
                <div
                  ref={pdfContainerRef}
                  className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[#F7F3EE]"
                >
                  {loading && (
                    <div className="text-slate-500">Preparing document…</div>
                  )}

                  {mergeError && !loading && (
                    <div className="mx-4 max-w-2xl rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      {mergeError}
                    </div>
                  )}

                  {pdfUrl && !loading && (
                    <div className="flex h-full items-center justify-center p-2">
                      <div
                        ref={pdfPageContainerRef}
                        data-page={currentPage}
                        className="relative inline-block"
                      >
                        <Document
                          file={pdfUrl}
                          onLoadSuccess={onDocumentLoadSuccess}
                          loading={
                            <div className="flex min-h-[200px] items-center justify-center text-slate-500">
                              Loading PDF…
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

                        {/* Overlay to catch drag/drop (react-pdf canvas swallows drop); above boxes only when dragging */}
                        <div
                          className="absolute inset-0"
                          style={{
                            pointerEvents: draggedField ? 'auto' : 'none',
                            zIndex: draggedField ? 40 : 5,
                          }}
                          onDragOver={handlePdfDragOver}
                          onDrop={handlePdfDrop}
                        />

                        {/* Signer field boxes — same look as drag preview: just field name, 120×40 */}
                        {signerFields
                          .filter((f) => f.page === currentPage)
                          .map((field) => {
                            const signer = signers.find((s) => s.id === field.signerId);
                            if (!signer) return null;

                            const displayName =
                              field.label ||
                              (field.fieldType
                                ? field.fieldType.charAt(0).toUpperCase() + field.fieldType.slice(1)
                                : 'Field');

                      return (
                        <div
                          key={field.id}
                          style={{
                            left: `${field.xPercent}%`,
                            top: `${field.yPercent}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                          className="absolute z-30 flex cursor-move flex-col items-center gap-0.5"
                        >
                          <div
                            style={{ width: 120, height: 40 }}
                            className="relative flex items-center justify-center rounded border-2 border-dashed border-sky-500 bg-sky-100/90 text-sm font-medium text-sky-800"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              startFieldDrag(e, field);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              if (fieldDidDragRef.current) return;
                              if (field.fieldType && field.fieldType !== 'signature') {
                                setFieldRenamePanelFieldId(field.id);
                              }
                            }}
                          >
                            <span className="relative z-10">{displayName}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                removeSignerField(field.id);
                              }}
                              className="absolute top-0 right-0 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-[red] text-[10px] font-bold text-white shadow-md hover:bg-black/80 translate-x-1/2 -translate-y-1/2"
                              aria-label="Remove field"
                            >
                              ×
                            </button>
                          </div>
                          <span className="max-w-[140px] truncate text-[10px] font-medium text-slate-600">
                            {signer.fullName}
                          </span>
                        </div>
                      );
                          })}

                        {/* Drop preview when dragging a standard field over the PDF */}
                        {dropPreview && dropPreview.pageNum === currentPage && draggedField && (
                          <div
                            className="absolute z-30 pointer-events-none rounded border-2 border-dashed border-sky-500 bg-sky-100/90 flex items-center justify-center text-sm font-medium text-sky-800"
                            style={{
                              left: dropPreview.x - 60,
                              top: dropPreview.y - 20,
                              width: 120,
                              height: 40,
                            }}
                          >
                            {draggedField.label}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!pdfUrl && !loading && mergeError && (
                    <p className="text-slate-500">
                      Unable to load document. Please go back and upload again.
                    </p>
                  )}
                </div>

                {/* Tap overlay */}
                {showTapOverlay && (
                  <div
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 p-6"
                    role="dialog"
                    aria-labelledby="tap-overlay-title"
                    aria-modal="true"
                  >
                    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                      <div className="relative flex w-full max-w-md items-center justify-center py-6">
                        <span
                          id="tap-overlay-title"
                          className="animate-drag-hand inline-flex items-center justify-center rounded-full p-4 shadow-lg ring-4 ring-amber-300/50"
                          style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' }}
                          aria-hidden="true"
                        >
                          <span className="text-3xl">👆</span>
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-bold text-white">Drag fields onto the PDF</p>
                        <p className="text-sm text-white/90">
                          Drag and drop fields from the left panel onto the document
                        </p>
                      </div>
                      <div className="mt-2 flex w-full max-w-sm items-center justify-between gap-4">
                        <button
                          type="button"
                          onClick={dontShowTapOverlayAgain}
                          className="text-sm font-medium text-white/80 underline hover:text-white"
                        >
                          Don&apos;t show me again
                        </button>
                        <button
                          type="button"
                          onClick={dismissTapOverlay}
                          className="rounded-lg bg-[#084bdc] px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-[#084bdc]/90"
                        >
                          Got it!
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 w-full max-w-md rounded-xl border-2 border-sky-400/60 bg-sky-500/30 px-4 py-3 backdrop-blur-sm">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="h-6 w-6 shrink-0 text-amber-300" />
                        <div className="text-left">
                          <p className="font-bold text-white">Pro Tip!</p>
                          <p className="mt-0.5 text-sm text-white/95">
                            Invite multiple signers — each receives a private signing link by email.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fixed footer: page nav + signers + Next / Mark Mode */}
              <footer className="flex h-[120px] shrink-0 items-center justify-between gap-4 border-t border-[#E6D8C9] bg-[#F7F3EE] px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-[#F7F3EE] text-slate-700 shadow-sm hover:bg-[#F5F2EE] disabled:opacity-50 disabled:pointer-events-none"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="min-w-[4rem] text-center text-sm font-medium text-slate-700">
                    Page {currentPage}/{totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-[#F7F3EE] text-slate-700 shadow-sm hover:bg-[#F5F2EE] disabled:opacity-50 disabled:pointer-events-none"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex flex-1 items-center justify-center gap-4 min-w-0">
                  <button
                    type="button"
                    onClick={openRecipientModal}
                    className="flex shrink-0 flex-col items-center gap-2 transition hover:opacity-90"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-slate-100">
                      <Plus className="h-6 w-6 text-slate-600" strokeWidth={2.5} />
                    </span>
                    <span className="text-xs font-medium text-slate-600">Add Signer</span>
                  </button>
                  {signers.length > 0 && (
                    <div className="flex items-center gap-4">
                      {signers.map((s, index) => {
                        const signerNumber = index + 1;
                        const isActiveInMarkMode = isMarkMode && activeSignerId === s.id;
                        const isEditing = !isMarkMode && editingSignerId === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              if (isMarkMode) {
                                setActiveSignerId(s.id);
                              } else {
                                openRecipientModalForEdit(s);
                              }
                            }}
                            className={`flex shrink-0 flex-col items-center gap-2 transition ${isActiveInMarkMode
                              ? ''
                              : isEditing
                                ? 'opacity-90'
                                : 'opacity-80 hover:opacity-100'
                              }`}
                          >
                            <span className="relative inline-flex">
                              <span
                                className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white ${isActiveInMarkMode
                                  ? 'bg-[#084bdc] ring-2 ring-sky-300 ring-offset-2'
                                  : 'bg-[#084bdc]/90'
                                  }`}
                              >
                                {getInitials(s.fullName)}
                              </span>
                              <span
                                className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow"
                                aria-label={`Signer ${signerNumber}`}
                              >
                                {signerNumber}
                              </span>
                            </span>
                            <span
                              className={`text-xs font-medium truncate max-w-[5rem] ${isActiveInMarkMode ? 'text-[#084bdc]' : 'text-slate-600'
                                }`}
                            >
                              {s.fullName}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-5 shrink-0">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                  >
                    <ChevronsRight className="h-4 w-4" />
                    Next
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMarkMode((m) => !m)}
                    className="flex flex-col items-center gap-0.5"
                    aria-label={isMarkMode ? 'Switch to Edit Mode' : 'Switch to Mark Mode'}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition ${isMarkMode
                        ? 'bg-amber-400 text-slate-900 hover:bg-amber-500'
                        : 'bg-sky-500 text-white hover:bg-sky-600'
                        }`}
                    >
                      <Pencil className="h-5 w-5" />
                    </span>
                    <span className="text-[10px] font-medium text-slate-600">
                      {isMarkMode ? 'Mark Mode' : 'Edit Mode'}
                    </span>
                  </button>
                </div>
              </footer>
            </div>
          </div>
        </React.Fragment>
      </SignerEditorLayout>

      {/* Add/Edit recipient modal: when no signers (required) or when Add Signer / Edit signer clicked */}
      {(signers.length === 0 || showRecipientModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div
            className="bg-[#F7F3EE] rounded-xl shadow-2xl w-full max-w-md p-6 relative"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-recipient-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {signers.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setShowRecipientModal(false);
                  setEditingSignerId(null);
                  setFullName('');
                  setEmailAdd('');
                  setFormError('');
                }}
                className="absolute right-4 top-4 rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            <h2 id="add-recipient-modal-title" className="price-heading pr-8">
              {editingSignerId ? 'Edit recipient' : 'Add recipient'}
            </h2>
            <p className="details-text mb-4">
              {editingSignerId
                ? 'Update the recipient details below.'
                : signers.length === 0
                  ? 'Add at least one recipient to continue.'
                  : 'Add a new recipient to the document.'}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Email Address</label>
                <div className="mt-1 flex rounded-lg border border-slate-300 overflow-hidden focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
                  <input
                    type="email"
                    value={emailAdd}
                    onChange={(e) => setEmailAdd(e.target.value)}
                    placeholder="Email Address"
                    className="flex-1 min-w-0 px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <button
                type="button"
                onClick={() => {
                  setFormError('');
                  const name = fullName.trim();
                  const email = emailAdd.trim().toLowerCase();
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!name) {
                    setFormError('Please enter the full name.');
                    return;
                  }
                  if (!email) {
                    setFormError('Please enter an email address.');
                    return;
                  }
                  if (!emailRegex.test(email)) {
                    setFormError('Please enter a valid email address.');
                    return;
                  }
                  if (editingSignerId) {
                    setSigners((prev) =>
                      prev.map((s) =>
                        s.id === editingSignerId ? { ...s, fullName: name, email } : s,
                      ),
                    );
                    setEditingSignerId(null);
                    setShowRecipientModal(false);
                  } else {
                    setSigners((prev) => [
                      ...prev,
                      {
                        id: `s-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                        fullName: name,
                        email,
                      },
                    ]);
                    setShowRecipientModal(false);
                  }
                  setFullName('');
                  setEmailAdd('');
                }}
                className="w-full rounded-lg bg-[#084bdc] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#084bdc]/90"
              >
                {editingSignerId ? 'Save' : 'Add recipient'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SignerPage;