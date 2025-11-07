import { Document, Page, pdfjs } from "react-pdf";
import React, { useEffect, useRef, useState, useMemo } from "react";
import Modal from "react-modal";
import SignPad from "./SignPad";
import { eSignApi } from "../../services/apiHelper";
import type { SignerData, ActiveField } from "../../types/documentTypes";
import confetti from "canvas-confetti";
import { Link } from "react-router-dom";

interface Props {
  // Backward compatible single document
  document?: any;
  // New: multiple documents continuous rendering
  documents?: any[];
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
  documents,
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
      setActiveField(first);
      setCurrentActionableIndex(0);
      setHasAutoOpened(true);
      // Center the first actionable field in view
      setTimeout(() => {
        scrollToFieldElement(first._id || first.fieldId);
      }, 80);
    }
  }, [actionableFields, hasAutoOpened]);

  // click-to-sign behavior removed dependency on page concept; keep disabled to avoid unintended opens on scroll viewport clicks

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

  // scroll helper: waits for element to appear then smoothly scrolls the container so it is centered
  const scrollToFieldElement = (fieldId: string | number) => {
    const container = pdfContainerRef.current;
    if (!container) return;
    const selector = `[data-field-id="${fieldId}"]`;
    let attempts = 0;
    const maxAttempts = 40;
    const attempt = () => {
      attempts++;
      const el = container.querySelector(selector) as HTMLElement | null;
      if (el) {
        const elRect = el.getBoundingClientRect();
        const contRect = container.getBoundingClientRect();
        // distance from container's top to element's top in the page coordinate space
        const deltaTop = elRect.top - contRect.top;
        const elHeight = elRect.height || 0;
        const target = Math.max(
          0,
          container.scrollTop + deltaTop - (container.clientHeight / 2) + (elHeight / 2)
        );
        container.scrollTo({ top: target, behavior: 'smooth' });
      } else if (attempts < maxAttempts) {
        // element may not be rendered yet; retry shortly
        setTimeout(attempt, 60);
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
    // wait for page render then scroll to exact field element (robust polling)
    setTimeout(() => {
      scrollToFieldElement(field._id || field.fieldId);
    }, 80);
  };
  // (Prev navigation removed because it wasn't used; keeping only Next in UI)
  const goToNext = () => {
    if (actionableFields.length === 0) return;
    const next = (currentActionableIndex + 1) % actionableFields.length;
    goToActionableIndex(next);
  };

  // Ensure current index stays valid when actionableFields change (e.g., after signing)
  useEffect(() => {
    if (actionableFields.length === 0) return;
    if (currentActionableIndex >= actionableFields.length) {
      goToActionableIndex(0);
    }
  }, [actionableFields.length]);

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

  // Render a single document with all pages stacked vertically and per-page overlays
  const SingleDoc: React.FC<{
    doc: any;
    signatureFields: any[];
    currentUserId: string;
    selfValue: string | null;
    selfSigner: any[];
    localSignedMap: Record<string, string>;
    onFieldClick: (field: any) => void;
    normalizePage: (field: any) => number;
  }> = ({
    doc,
    signatureFields,
    currentUserId,
    selfValue,
    selfSigner,
    localSignedMap,
    onFieldClick,
    normalizePage,
  }) => {
      const [numPages, setNumPages] = useState<number>(0);

      const isFieldForDoc = (field: any) => {
        const fieldDoc = (field?.documentId || field?.docId || field?.document?.id);
        const docId = doc?.id || doc?._id || doc?.documentId;
        return fieldDoc ? String(fieldDoc) === String(docId) : true; // fallback if backend omitted doc id
      };

      return (
        <Document
          file={doc.filePath || `${import.meta.env.VITE_ESIGN_SERVICE_URL}/uploads/${doc.name}`}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
        >
          {Array.from({ length: numPages }, (_, i) => {
            const pageNum = i + 1;
            return (
              <div key={`p-${pageNum}`} className="relative mb-8 flex justify-center py-6 bg-gray-100">
                <div className="relative">
                  <Page pageNumber={pageNum} width={800} />

                  {/* per-page overlay */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] z-40">
                    {signatureFields
                      .filter(isFieldForDoc)
                      .filter((f) => normalizePage(f) === pageNum)
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
                              className={`flex items-center justify-center text-sm font-semibold rounded border-2 ${isSigned
                                ? "border-green-500"
                                : isCurrentUser
                                  ? "bg-blue-100 border-blue-500 text-blue-700 cursor-pointer hover:bg-blue-200"
                                  : "bg-gray-100 border-gray-300 text-gray-500 opacity-50"
                                }`}
                              onClick={() =>
                                isCurrentUser && !isSigned && onFieldClick(field)
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
                        }

                        // Non-signature field
                        const fieldLable = field.label;
                        const fieldId = field._id;
                        let displayValue = field.label ?? field.value ?? "";

                        if (selfValue === "1") {
                          const matchedSigner = selfSigner?.find(
                            (s: any) => s && s.signerSlotId === field.slotId
                          );
                          if (matchedSigner && typeof matchedSigner.data === "object") {
                            if (matchedSigner.role === "creator") {
                              displayValue = matchedSigner.data?.name ?? displayValue;
                            } else {
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
                      })}
                  </div>
                </div>


              </div>
            );
          })}
        </Document>
      );
    };

  return (
    <div className="relative flex flex-col items-stretch min-h-screen bg-gray-50">
      {/* Header (sticky full-width) */}
      <div className="fixed top-0 left-0 right-0 h-12 bg-[#1b0c3e] text-white flex items-center justify-between px-4 z-50">
        <div className="text-sm font-medium">Review and complete</div>
      </div>

      {/* PDF(s) container */}
      <div
        ref={pdfContainerRef}
        className="relative border border-gray-300 rounded-sm shadow-sm bg-white overflow-auto max-w-4xl max-h-[100vh] self-center mt-8 mb-12"
      >
        {(() => {
          const docs = (documents && documents.length > 0)
            ? documents
            : (document ? [document] : []);

          return docs.map((doc, dIdx) => (
            <div key={doc.id || doc._id || dIdx} className="mb-6">
              <SingleDoc
                doc={doc}
                signatureFields={signatureFields}
                currentUserId={currentUserId}
                selfValue={selfValue}
                selfSigner={selfSigner}
                localSignedMap={localSignedMap}
                onFieldClick={handleFieldClick}
                normalizePage={normalizePage}
              />

              {/* separator between documents with next document name */}
              {dIdx < docs.length - 1 && (
                <div className="my-6 relative">
                  <div className="h-px bg-gray-200" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="px-2 py-0.5 text-xs text-gray-600 bg-white border border-gray-200 rounded">
                      {docs[dIdx + 1]?.name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ));
        })()}
      </div>

      {/* Sticky left-side Next button */}
      {actionableFields.length > 0 && (
        <button
          onClick={goToNext}
          disabled={actionableFields.length === 0}
          className="fixed left-68 top-1/2 -translate-y-1/2 z-50 px-5 py-2 rounded font-medium shadow border border-yellow-500 disabled:opacity-50"
          style={{ backgroundColor: '#ffc107', color: '#1a1a1a', marginLeft: 0, borderRadius: 8 }}
          aria-label="Next field"
        >
          Next
        </button>

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
          documentId={(activeField as any)?.documentId || (activeField as any)?.docId || (document && (document as any).id) || ""}
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
              const key = activeField?._id;
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
      {/* Footer (sticky full-width) */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-white text-xs text-gray-600 flex items-center justify-between px-4 py-3 z-50">
        <div>Powered by Draft&Sign</div>
        <div className="flex items-center gap-4">
          <Link to="/terms-of-service"><span>Terms of Use</span></Link>
          <Link to="/privacy-policy"><span>Privacy</span></Link>
        </div>
      </div>
    </div>
  );
};

const DocumentViewer: React.FC<Props> = (props) => {
  return <DocumentViewerContent {...props} />;
};

export default DocumentViewer;
