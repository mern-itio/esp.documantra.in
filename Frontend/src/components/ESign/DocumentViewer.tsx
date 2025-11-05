import { Document, Page, pdfjs } from "react-pdf";
import React, { useEffect, useRef, useState, useMemo } from "react";
import Modal from "react-modal";
import SignPad from "./SignPad";
import { eSignApi } from "../../services/apiHelper";
import type { SignerData, ActiveField } from "../../types/documentTypes";
import confetti from "canvas-confetti";

interface Props {
  document: any;
  signatureFields: any[];
  currentUserId: string;
  envelopeID?: string;
  onClose?: () => void;
  onSignatureSave?: (fieldId: string, signatureUrl: string) => void;
  cycleId?: string;
}

Modal.setAppElement("#root");

const DocumentViewerContent: React.FC<Props> = ({
  document,
  signatureFields,
  currentUserId,
  envelopeID,
  onSignatureSave,
  cycleId,
}) => {
  const urlParams = new URLSearchParams(window.location.search);
  const selfValue = urlParams.get("self");
  const [activeField, setActiveField] = useState<ActiveField | null>(null);
  const [selfSigner, setSelfSigner] = useState<SignerData[]>([]);
  const [_isLoading, setIsLoading] = useState(selfValue === "1");
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);

  // Local optimistic store for signatures in non-self mode so user sees signature immediately
  const [localSignedMap, setLocalSignedMap] = useState<Record<string, string>>(
    {}
  );

  // PDF.js worker setup
  useEffect(() => {
    if (selfValue === "1") {
      getSelfSigner();
    }
    if (typeof window !== "undefined") {
      try {
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      } catch (err) {
        console.warn("Failed to set PDF.js worker:", err);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentActionableIndex, setCurrentActionableIndex] =
    useState<number>(0);
  const [hasAutoOpened, setHasAutoOpened] = useState<boolean>(false);

  const normalizePage = (field: any) =>
    Number(
      field?.page?.$numberInt ??
        field?.page ??
        field?.pageNumber ??
        field?.pageNo ??
        0
    );

  // build actionable (user-specific) signature fields
  const actionableFields = useMemo(() => {
    if (!signatureFields || !Array.isArray(signatureFields)) return [];
    return signatureFields
      .map((f) => ({ ...f, pageNum: normalizePage(f) }))
      .filter((field) => field.type === "signature")
      .filter((field) => {
        if (selfValue === "1") {
          const matchedSigner = (selfSigner || []).find(
            (s: any) => s && s.signerSlotId === field.slotId
          );
          const isCurrentUser = matchedSigner
            ? matchedSigner._id?.toString?.() === currentUserId?.toString?.()
            : false;
          const isSigned = matchedSigner ? !!matchedSigner.signature : false;
          return isCurrentUser && !isSigned;
        } else {
          // For non-self mode: consider both backend field.signature and optimistic localSignedMap
          const isCurrentUser = field.recipientId === currentUserId;
          const isSigned =
            !!field.signature || !!localSignedMap[field._id || field.fieldId];
          return isCurrentUser && !isSigned;
        }
      })
      .sort((a, b) => a.pageNum - b.pageNum);
  }, [signatureFields, selfSigner, selfValue, currentUserId, localSignedMap]);

  // Auto-open first actionable field on load (only once)
  useEffect(() => {
    if (!hasAutoOpened && actionableFields.length > 0) {
      const first = actionableFields[0];
      setCurrentPage(first.pageNum || 1);
      setActiveField(first);
      setCurrentActionableIndex(0);
      setHasAutoOpened(true);
    }
  }, [actionableFields, hasAutoOpened]);

  // click-to-sign behavior (open signpad for first actionable field on that page)
  useEffect(() => {
    const node = pdfContainerRef.current;
    if (!node) return;

    const handler = (e: MouseEvent) => {
      if (activeField) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("button, a, input, textarea, .no-sign")) return;

      const actionableOnPage = actionableFields.filter(
        (f) => f.pageNum === currentPage
      );
      if (actionableOnPage.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        setActiveField(actionableOnPage[0]);
        const globalIndex = actionableFields.findIndex(
          (af) =>
            af._id === actionableOnPage[0]._id ||
            af.fieldId === actionableOnPage[0].fieldId
        );
        if (globalIndex >= 0) setCurrentActionableIndex(globalIndex);
      }
    };

    node.addEventListener("click", handler);
    return () => node.removeEventListener("click", handler);
  }, [actionableFields, currentPage, activeField]);

  const handleFieldClick = (field: any) => {
    const af: ActiveField = {
      ...field,
      status: "pending",
    };
    const idx = actionableFields.findIndex(
      (af) => af._id === field._id || af.fieldId === field.fieldId
    );
    if (idx >= 0) setCurrentActionableIndex(idx);
    setActiveField(af);
  };

  const getSelfSigner = async () => {
    try {
      setIsLoading(true);
      if (!cycleId) {
        console.warn("No cycleId provided");
        return;
      }
      const response = await eSignApi.get(
        `/api/e-sign/public/envelope/self-signer/${cycleId}`
      );
      if (response?.data?.selfSigner) {
        const validSigners = response.data.selfSigner.filter(
          (signer: SignerData) =>
            signer && typeof signer === "object" && signer.signerSlotId
        );
        setSelfSigner(validSigners);
      } else {
        setSelfSigner([]);
      }
    } catch (err) {
      console.error("Failed to load self-signer data:", err);
      setSelfSigner([]);
    } finally {
      setIsLoading(false);
    }
  };

  // scroll helper: waits for element to appear inside pdfContainerRef then centers it
  const scrollToFieldElement = (fieldId: string | number) => {
    const container = pdfContainerRef.current;
    if (!container) return;
    const selector = `[data-field-id="${fieldId}"]`;
    let attempts = 0;
    const maxAttempts = 30;
    const attempt = () => {
      attempts++;
      const el = container.querySelector(selector) as HTMLElement | null;
      if (el) {
        const elTop = el.offsetTop;
        const elHeight = el.offsetHeight || 0;
        const containerHeight = container.clientHeight;
        const target = Math.max(0, elTop - containerHeight / 2 + elHeight / 2);
        container.scrollTo({ top: target, behavior: "smooth" });
      } else if (attempts < maxAttempts) {
        setTimeout(attempt, 50);
      }
    };
    attempt();
  };

  // Arrow navigation — move to field (center it) but DO NOT open signpad
  const goToActionableIndex = (index: number) => {
    if (index < 0 || index >= actionableFields.length) return;
    const field = actionableFields[index];
    if (!field) return;
    setCurrentActionableIndex(index);
    setCurrentPage(field.pageNum || 1);

    // wait for page render then scroll to exact field element (robust polling)
    setTimeout(() => {
      scrollToFieldElement(field._id || field.fieldId);
    }, 80);
  };
  const goToPrev = () => goToActionableIndex(currentActionableIndex - 1);
  const goToNext = () => goToActionableIndex(currentActionableIndex + 1);

  // 🎉 Party popper immediately after a signature is saved
  const triggerConfetti = () => {
    // small burst in center
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { x: 0.5, y: 0.35 },
    });
    confetti({
      particleCount: 30,
      spread: 120,
      origin: { x: 0.5, y: 0.35 },
    });
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* PDF */}
      <div
        ref={pdfContainerRef}
        className="relative border border-gray-300 rounded-lg shadow-sm bg-white overflow-auto max-w-4xl max-h-[80vh] p-2"
      >
        <Document
          file={
            document.filePath ||
            `${import.meta.env.VITE_ESIGN_SERVICE_URL}/uploads/${document.name}`
          }
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        >
          <Page pageNumber={currentPage} width={800} height={1132} />
        </Document>

        {/* Fields overlay */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {/*
            We render BOTH:
              - signature fields (interactive for signer)
              - non-signature fields (labels / values placed on document)
            The non-signature logic was restored here — if selfValue === "1",
            we pull values from selfSigner.data for that slot; otherwise we show field.value/label.
          */}
          {signatureFields
            .filter((f) => normalizePage(f) === currentPage)
            .map((field) => {
              const isSignatureType = field.type === "signature";

              // common derived values
              let isCurrentUser = false;
              let isSigned = false;
              let signedImage: string | null = null;

              if (selfValue === "1" && selfSigner) {
                const matched = selfSigner.find(
                  (s: any) => s && s.signerSlotId === field.slotId
                );
                isCurrentUser = matched
                  ? matched._id?.toString?.() === currentUserId?.toString?.()
                  : false;
                isSigned = matched ? !!matched.signature : false;
                signedImage = matched?.signature ?? null;
              } else {
                isCurrentUser = field.recipientId === currentUserId;
                isSigned =
                  !!field.signature || !!localSignedMap[field._id || field.fieldId];
                signedImage =
                  localSignedMap[field._id || field.fieldId] || field.signature || null;
              }

              const keyId = field._id || field.fieldId;

              if (isSignatureType) {
                // signature box rendering
                return (
                  <div
                    key={field._id?.$oid || field._id}
                    data-field-id={keyId}
                    style={{
                      position: "absolute",
                      top: field.y?.$numberDouble ?? field.y,
                      left: field.x?.$numberDouble ?? field.x,
                      width: field.width?.$numberInt ?? field.width,
                      height: field.height?.$numberInt ?? field.height,
                      zIndex: 10,
                      pointerEvents: isCurrentUser && !isSigned ? "auto" : "none",
                    }}
                    className={`flex items-center justify-center text-sm font-semibold rounded border-2 ${
                      isSigned
                        ? "border-green-500"
                        : isCurrentUser
                        ? "bg-blue-100 border-blue-500 text-blue-700 cursor-pointer hover:bg-blue-200"
                        : "bg-gray-100 border-gray-300 text-gray-500 opacity-50"
                    }`}
                    onClick={() =>
                      isCurrentUser && !isSigned && handleFieldClick(field)
                    }
                  >
                    {isSigned ? (
                      <img
                        src={signedImage as string}
                        alt="Signed"
                        className="w-full h-full object-contain"
                      />
                    ) : isCurrentUser ? (
                      "Sign Here"
                    ) : (
                      "Signature"
                    )}
                  </div>
                );
              } else {
                // Non-signature field: render label/value at its position
                const fieldLable = field.label
                const fieldId = field._id
                // default display value
                let displayValue = field.label ?? field.value ?? "";

                // If self-signing mode, try to populate from matched signer's data
                if (selfValue === "1") {
                  const matchedSigner = selfSigner?.find(
                    (s: any) => s && s.signerSlotId === field.slotId
                  );
                  if (matchedSigner && typeof matchedSigner.data === "object") {
                    // If this slot is the same as matchedSigner, pick matching data key
                    // If role is "creator", show signer name
                    if (matchedSigner.role === "creator") {
                      displayValue = matchedSigner.data?.name ?? displayValue;
                    } else {
                      // If the fieldId exists in matchedSigner.data use it
                      if (fieldLable && matchedSigner.data[fieldLable] !== undefined) {
                        displayValue = matchedSigner.data[fieldLable];
                      }
                    }
                  }
                }

                return (
                  <div
                    key={fieldId}
                    data-field-id={keyId}
                    style={{
                      position: "absolute",
                      top: field.y?.$numberDouble ?? field.y,
                      left: field.x?.$numberDouble ?? field.x,
                      width: field.width?.$numberInt ?? field.width,
                      height: field.height?.$numberInt ?? field.height,
                      zIndex: 10,
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <span className="text-sm text-gray-700">{displayValue}</span>
                  </div>
                );
              }
            })}
        </div>
      </div>

      {/* Page Nav */}
      {numPages > 1 && (
        <div className="flex justify-between mt-2 w-full max-w-4xl px-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} / {numPages}
          </span>
          <button
            disabled={currentPage >= numPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Next
          </button>
        </div>
      )}

      {/* Floating arrows (do not open signpad) */}
      {actionableFields.length > 0 && (
        <div className="fixed right-6 bottom-6 z-50 flex items-center gap-3 bg-white/90 border p-2 rounded shadow">
          <button
            onClick={goToPrev}
            disabled={currentActionableIndex <= 0}
            className="px-2 py-1 border rounded disabled:opacity-40"
            aria-label="Previous signature field"
          >
            ←
          </button>
          <div className="text-sm">
            Field {Math.min(currentActionableIndex + 1, actionableFields.length)} /{" "}
            {actionableFields.length}
          </div>
          <button
            onClick={goToNext}
            disabled={currentActionableIndex >= actionableFields.length - 1}
            className="px-2 py-1 border rounded disabled:opacity-40"
            aria-label="Next signature field"
          >
            →
          </button>
        </div>
      )}

      {/* SignPad Modal */}
      {activeField && (
        <SignPad
          isSignPad={!!activeField}
          setIsSignPad={(open: boolean) => {
            if (!open) setActiveField(null);
          }}
          activeField={activeField}
          currentUserId={currentUserId}
          documentId={document.id}
          envelopeID={envelopeID}
          defaultSign={null}
          selfValue={selfValue || ""}
          cycleId={cycleId || ""}
          onSaveSign={(fieldId: string, signatureUrl: string) => {
            // When selfValue === "1" update the signer entry and trigger confetti reliably
            if (selfValue === "1") {
              setSelfSigner((prev) => {
                const updated = (prev || []).map((s: any) =>
                  s && s.signerSlotId === activeField?.slotId
                    ? { ...s, signature: signatureUrl }
                    : s
                );
                // immediate feedback
                triggerConfetti();
                return updated;
              });
            } else {
              // non-self: optimistic local update so UI shows signed image immediately
              const key = activeField?._id ;
              if (key) {
                setLocalSignedMap((p) => ({ ...(p || {}), [key]: signatureUrl }));
              }
              // immediate feedback
              triggerConfetti();
            }

            // Close modal but keep arrows visible (arrows navigation does not auto-open SignPad)
            setActiveField(null);

            // notify parent if needed
            onSignatureSave?.(fieldId, signatureUrl);
          }}
        />
      )}
    </div>
  );
};

const DocumentViewer: React.FC<Props> = (props) => {
  return <DocumentViewerContent {...props} />;
};

export default DocumentViewer;
