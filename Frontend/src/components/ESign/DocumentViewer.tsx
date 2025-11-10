import { Document, Page, pdfjs } from "react-pdf";
import React, { useEffect, useLayoutEffect, useRef, useState, useMemo } from "react";
import Modal from "react-modal";
import SignPad from "./SignPad";
import { eSignApi } from "../../services/apiHelper";
import type { SignerData, ActiveField } from "../../types/documentTypes";
import confetti from "canvas-confetti";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { Upload, Stamp as StampIcon, X } from "lucide-react";

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
  // Local values for non-signature inputs (text, date, checkbox, etc.)
  const [localFieldValues, setLocalFieldValues] = useState<Record<string, any>>({});
  // Use refs to store values without causing re-renders
  const fieldValuesRef = useRef<Record<string, any>>({});

  // PDF.js worker setup
  useEffect(() => {
    if (selfValue === "1") {
      getSelfSigner();
    }
    if (typeof window !== "undefined") {
      try {
        // Use react-pdf's recommended approach to get the worker
        // This ensures the worker version matches react-pdf's bundled PDF.js
        const workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
      } catch (err) {
        console.warn("Failed to set PDF.js worker, using fallback:", err);
        // Fallback to global config or local file
        const globalWorkerSrc = (window as any).__PDFJS_WORKER_SRC__;
        pdfjs.GlobalWorkerOptions.workerSrc = globalWorkerSrc || "/pdf.worker.min.mjs";
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [currentActionableIndex, setCurrentActionableIndex] =
    useState<number>(0);
  const [hasAutoOpened, setHasAutoOpened] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const hasShownCompletionAlertRef = useRef<boolean>(false);
  const hadFieldsInitiallyRef = useRef<boolean>(false);
  const isUserTypingRef = useRef<boolean>(false);
  const scrollPositionRef = useRef<number>(0);
  const shouldPreserveScrollRef = useRef<boolean>(false);
  const activeInputRef = useRef<HTMLInputElement | null>(null);
  const activeInputIdRef = useRef<string | null>(null);
  const currentFieldIdRef = useRef<string | null>(null);

  const normalizePage = (field: any) =>
    Number(
      field?.page?.$numberInt ??
      field?.page ??
      field?.pageNumber ??
      field?.pageNo ??
      0
    );

  // Determine if a non-signature field is completed
  const isNonSignatureCompleted = (field: any): boolean => {
    const key = field._id || field.fieldId;
    // Check ref first (most up-to-date), then state
    const refVal = fieldValuesRef.current[key];
    const localVal = refVal !== undefined ? refVal : localFieldValues[key];
    if (localVal !== undefined && localVal !== null && String(localVal).length > 0) {
      return field.type === 'checkbox' ? !!localVal : String(localVal).trim().length > 0;
    }
    // self mode: read from signer data by label
    if (selfValue === '1') {
      const matched = (selfSigner || []).find((s: any) => s && s.signerSlotId === field.slotId);
      if (matched) {
        if (field.type === 'checkbox') return !!matched.data?.[field.label];
        const v = matched.role === 'creator' ? matched.data?.name : matched.data?.[field.label];
        return v !== undefined && v !== null && String(v).trim().length > 0;
      }
    }
    // backend default value
    if (field.value !== undefined && field.value !== null) {
      return String(field.value).trim().length > 0;
    }
    return false;
  };

  // build actionable (user-specific) fields (signature + other inputs)
  const actionableFields = useMemo(() => {
    if (!signatureFields || !Array.isArray(signatureFields)) return [];
    return signatureFields
      .map((f) => ({ ...f, pageNum: normalizePage(f) }))
      .filter((field) => {
        // Determine if current user needs to act on this field
        let isCurrentUser = false;
        let isCompleted = false;

        if (selfValue === '1') {
          const matchedSigner = (selfSigner || []).find((s: any) => s && s.signerSlotId === field.slotId);
          isCurrentUser = matchedSigner ? matchedSigner._id?.toString?.() === currentUserId?.toString?.() : false;
          if (field.type === 'signature') {
            isCompleted = matchedSigner ? !!matchedSigner.signature : false;
          } else {
            isCompleted = isNonSignatureCompleted(field);
          }
        } else {
          isCurrentUser = field.recipientId === currentUserId;
          if (field.type === 'signature') {
            isCompleted = !!field.signature || !!localSignedMap[field._id || field.fieldId];
          } else {
            isCompleted = isNonSignatureCompleted(field);
          }
        }
        return isCurrentUser && !isCompleted;
      })
      .sort((a, b) => a.pageNum - b.pageNum);
  }, [signatureFields, selfSigner, selfValue, currentUserId, localSignedMap, localFieldValues]);

  // Track if there were fields initially
  useEffect(() => {
    if (actionableFields.length > 0 && !hadFieldsInitiallyRef.current) {
      hadFieldsInitiallyRef.current = true;
    }
  }, [actionableFields.length]);

  // Show success alert when all signatures are completed
  useEffect(() => {
    // Show alert if:
    // 1. There were fields initially (hadFieldsInitiallyRef.current is true)
    // 2. All fields are now completed (actionableFields.length === 0)
    // 3. We haven't shown the alert yet
    if (
      hadFieldsInitiallyRef.current &&
      actionableFields.length === 0 &&
      !hasShownCompletionAlertRef.current
    ) {
      hasShownCompletionAlertRef.current = true;
      
      // Show success alert after a short delay to ensure UI updates are complete
      setTimeout(() => {
        Swal.fire({
          title: "Congratulations!",
          text: "All signatures have been successfully completed. You will receive the mail of certificate and signed documents!",
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#ffc107",
        });
      }, 500);
    }
  }, [actionableFields.length]);

  // Auto-scroll to first actionable field on load (only once) - but don't open sign pad
  useEffect(() => {
    // Only run once when fields first become available, not when they change due to user input
    if (!hasAutoOpened && actionableFields.length > 0) {
      const first = actionableFields[0];
      setCurrentActionableIndex(0);
      // Track the field ID
      currentFieldIdRef.current = first._id || first.fieldId;
      setHasAutoOpened(true);
      // Center the first actionable field in view (but don't open sign pad)
      setTimeout(() => {
        scrollToFieldElement(first._id || first.fieldId);
      }, 80);
    }
    // Check actionableFields.length but only trigger once via hasAutoOpened guard
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionableFields.length, hasAutoOpened]);

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

  // scroll helper: reliably centers a field within the PDF container
  const isScrollingRef = useRef(false);
  const scrollToFieldElement = (fieldId: string | number) => {
    const container = pdfContainerRef.current;
    if (!container) return;
    
    // Prevent multiple simultaneous scrolls
    if (isScrollingRef.current) return;
    
    const selector = `[data-field-id="${fieldId}"]`;
    let attempts = 0;
    const maxAttempts = 50;
    const tolerance = 10; // px within center considered done

    const attempt = () => {
      attempts++;
      const el = container.querySelector(selector) as HTMLElement | null;
      if (!el) {
        if (attempts < maxAttempts) {
          setTimeout(attempt, 80);
        }
        return;
      }

      // Get current scroll position - this is the key: preserve current position
      const currentScrollTop = container.scrollTop;
      const contRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      
      // Calculate element's position relative to the container's scrollable content
      // Method: Find the element's offsetTop relative to the container
      let elementTop = 0;
      let parent: HTMLElement | null = el;
      
      // Walk up the DOM tree to calculate offset from container
      while (parent && parent !== container) {
        elementTop += parent.offsetTop;
        parent = parent.offsetParent as HTMLElement | null;
      }
      
      // Alternative: if offsetTop method doesn't work, use getBoundingClientRect with current scroll
      // This accounts for elements that might be outside viewport
      if (elementTop === 0 || Math.abs(elementTop - (elRect.top - contRect.top + currentScrollTop)) > 100) {
        // Fallback: use getBoundingClientRect but account for current scroll
        elementTop = elRect.top - contRect.top + currentScrollTop;
      }
      
      const elHeight = elRect.height || 0;
      
      // Target: center the element in the viewport
      const targetScroll = elementTop - (container.clientHeight / 2) + (elHeight / 2);
      
      // Clamp to valid scroll range
      const clampedTarget = Math.max(
        0,
        Math.min(
          container.scrollHeight - container.clientHeight,
          targetScroll
        )
      );

      // If already close to target, stop
      if (Math.abs(currentScrollTop - clampedTarget) <= tolerance) {
        isScrollingRef.current = false;
        return;
      }

      isScrollingRef.current = true;
      // Scroll from current position to target (smooth scroll handles this)
      container.scrollTo({ top: clampedTarget, behavior: 'smooth' });
      
      // Verify after scroll settles
      setTimeout(() => {
        const finalContRect = container.getBoundingClientRect();
        const finalElRect = el.getBoundingClientRect();
        const elementCenter = finalElRect.top + finalElRect.height / 2;
        const viewportCenter = finalContRect.top + container.clientHeight / 2;
        const isCentered = Math.abs(elementCenter - viewportCenter) <= tolerance * 2;
        
        isScrollingRef.current = false;
        
        if (!isCentered && attempts < maxAttempts) {
          attempt();
        }
      }, 200);
    };

    attempt();
  };

  // Arrow navigation — move to field (center it) but DO NOT open signpad
  const goToActionableIndex = (index: number) => {
    if (actionableFields.length === 0) return;
    // Ensure index is valid and wraps around correctly
    const validIndex = ((index % actionableFields.length) + actionableFields.length) % actionableFields.length;
    if (validIndex < 0 || validIndex >= actionableFields.length) return;
    
    const field = actionableFields[validIndex];
    if (!field) return;
    
    setCurrentActionableIndex(validIndex);
    // Track the field ID so we can maintain position when actionableFields changes
    currentFieldIdRef.current = field._id || field.fieldId;
    // wait for page render then scroll to exact field element (robust polling)
    requestAnimationFrame(() => {
      scrollToFieldElement(field._id || field.fieldId);
    });
  };
  
  // Find the next incomplete field, starting from a given index
  const findNextIncompleteField = (startIndex: number) => {
    if (actionableFields.length === 0) return null;
    
    // Search forward from startIndex
    for (let i = 0; i < actionableFields.length; i++) {
      const idx = (startIndex + i) % actionableFields.length;
      const field = actionableFields[idx];
      
      if (!field) continue;
      
      // Check if this field is still incomplete (check refs too)
      const key = field._id || field.fieldId;
      let isCompleted = false;
      
      if (field.type === 'signature') {
        if (selfValue === '1') {
          const matchedSigner = (selfSigner || []).find((s: any) => s && s.signerSlotId === field.slotId);
          isCompleted = matchedSigner ? !!matchedSigner.signature : false;
        } else {
          isCompleted = !!field.signature || !!localSignedMap[key];
        }
      } else {
        isCompleted = isNonSignatureCompleted(field);
      }
      
      if (!isCompleted) {
        return idx;
      }
    }
    
    return null;
  };
  
  // (Prev navigation removed because it wasn't used; keeping only Next in UI)
  const goToNext = () => {
    if (actionableFields.length === 0) return;
    
    // If not started yet, navigate to first incomplete field and mark as started
    if (!hasStarted) {
      setHasStarted(true);
      const firstIncomplete = findNextIncompleteField(0);
      if (firstIncomplete !== null) {
        goToActionableIndex(firstIncomplete);
      } else {
        goToActionableIndex(0);
      }
      return;
    }
    
    // Find the next incomplete field starting from current index + 1
    let nextIndex = findNextIncompleteField(currentActionableIndex + 1);
    
    // If not found after current, try from the beginning
    if (nextIndex === null) {
      nextIndex = findNextIncompleteField(0);
    }
    
    // Only navigate if we found a different field
    if (nextIndex !== null && nextIndex !== currentActionableIndex) {
      goToActionableIndex(nextIndex);
    }
    // If nextIndex is null or same as current, all fields are completed or we're on the last one - do nothing
  };

  // Preserve scroll position when actionableFields changes (e.g., when a field is completed)
  useLayoutEffect(() => {
    if (shouldPreserveScrollRef.current && pdfContainerRef.current) {
      const container = pdfContainerRef.current;
      const savedScroll = scrollPositionRef.current;
      // Restore immediately in layout phase
      container.scrollTop = savedScroll;
      // Also restore after paint to catch any late updates
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = savedScroll;
        }
      });
    }
  }, [actionableFields.length]);

  // Restore focus to active input after re-render
  useEffect(() => {
    if (activeInputIdRef.current && isUserTypingRef.current && typeof window !== 'undefined' && document) {
      const inputId = `field-${activeInputIdRef.current}`;
      const input = document.getElementById(inputId) as HTMLInputElement;
      if (input) {
        // Restore focus and cursor position
        requestAnimationFrame(() => {
          if (input && document.activeElement !== input) {
            input.focus();
            // Try to restore cursor position - place at end
            const len = input.value.length;
            input.setSelectionRange(len, len);
          }
        });
      }
    }
  }, [localFieldValues]);

  // Ensure current index stays valid when actionableFields change
  // IMPORTANT: Never scroll automatically - only adjust index silently
  // Don't adjust if user is currently typing to avoid interrupting them
  useEffect(() => {
    // Don't make any changes if user is typing
    if (isUserTypingRef.current) {
      return;
    }
    
    if (actionableFields.length === 0) {
      currentFieldIdRef.current = null;
      return;
    }
    
    // If we have a tracked field ID, try to find it in the new actionableFields
    if (currentFieldIdRef.current) {
      const foundIndex = actionableFields.findIndex(
        (f) => (f._id || f.fieldId) === currentFieldIdRef.current
      );
      if (foundIndex >= 0) {
        // Field still exists and is incomplete, update index to its new position
        setCurrentActionableIndex(foundIndex);
        return;
      } else {
        // Field was completed and removed, find next incomplete
        currentFieldIdRef.current = null;
      }
    }
    
    // Check if current index is out of bounds
    if (currentActionableIndex >= actionableFields.length) {
      // Find the first incomplete field
      const nextIncomplete = findNextIncompleteField(0);
      if (nextIncomplete !== null) {
        setCurrentActionableIndex(nextIncomplete);
        const field = actionableFields[nextIncomplete];
        currentFieldIdRef.current = field ? (field._id || field.fieldId) : null;
      } else {
        const nextValidIndex = Math.max(0, actionableFields.length - 1);
        setCurrentActionableIndex(nextValidIndex);
        const field = actionableFields[nextValidIndex];
        currentFieldIdRef.current = field ? (field._id || field.fieldId) : null;
      }
      return;
    }
    
    // Check if the current field is still incomplete
    const currentField = actionableFields[currentActionableIndex];
    if (currentField) {
      const key = currentField._id || currentField.fieldId;
      currentFieldIdRef.current = key;
      
      let isCompleted = false;
      
      if (currentField.type === 'signature') {
        if (selfValue === '1') {
          const matchedSigner = (selfSigner || []).find((s: any) => s && s.signerSlotId === currentField.slotId);
          isCompleted = matchedSigner ? !!matchedSigner.signature : false;
        } else {
          isCompleted = !!currentField.signature || !!localSignedMap[key];
        }
      } else {
        isCompleted = isNonSignatureCompleted(currentField);
      }
      
      // If current field is completed, find the next incomplete field
      if (isCompleted) {
        currentFieldIdRef.current = null;
        const nextIncomplete = findNextIncompleteField(currentActionableIndex + 1);
        if (nextIncomplete !== null) {
          setCurrentActionableIndex(nextIncomplete);
          const nextField = actionableFields[nextIncomplete];
          currentFieldIdRef.current = nextField ? (nextField._id || nextField.fieldId) : null;
        } else {
          // Try from beginning
          const firstIncomplete = findNextIncompleteField(0);
          if (firstIncomplete !== null && firstIncomplete !== currentActionableIndex) {
            setCurrentActionableIndex(firstIncomplete);
            const firstField = actionableFields[firstIncomplete];
            currentFieldIdRef.current = firstField ? (firstField._id || firstField.fieldId) : null;
          }
        }
      }
    }
  }, [actionableFields.length, currentActionableIndex, localFieldValues, localSignedMap, selfSigner]);

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

                        // Prefill value priority: ref (most recent) -> state -> signer.data -> field.value -> label
                        let value: any = fieldValuesRef.current[keyId];
                        if (value === undefined) {
                          value = localFieldValues[keyId];
                        }
                        if (value === undefined) {
                          if (selfValue === "1") {
                            const matchedSigner = selfSigner?.find(
                              (s: any) => s && s.signerSlotId === field.slotId
                            );
                            if (matchedSigner && typeof matchedSigner.data === "object") {
                              if (matchedSigner.role === "creator") {
                                value = matchedSigner.data?.name ?? value;
                              } else if (fieldLable && matchedSigner.data[fieldLable] !== undefined) {
                                value = matchedSigner.data[fieldLable];
                              }
                            }
                          }
                          if (value === undefined) value = field.value ?? "";
                        }

                        const setValue = (newVal: any, updateState: boolean = false) => {
                          try {
                            // Always update ref immediately (no re-render)
                            fieldValuesRef.current[keyId] = newVal;
                            
                            // Only update state if explicitly requested (on blur)
                            if (updateState) {
                              // Save current scroll position BEFORE any state updates
                              const container = pdfContainerRef?.current;
                              if (container) {
                                scrollPositionRef.current = container.scrollTop;
                                shouldPreserveScrollRef.current = true;
                              }
                              
                              // Mark that user is typing to prevent automatic scrolling
                              isUserTypingRef.current = true;
                              
                              // Update state (this will cause re-render but only on blur)
                              setLocalFieldValues((prev) => ({ ...prev, [keyId]: newVal }));
                              
                              if (selfValue === "1") {
                                // Update self signer structure for consistency so prefill works across pages
                                setSelfSigner((prev) => {
                                  return (prev || []).map((s: any) =>
                                    s && s.signerSlotId === field.slotId
                                      ? {
                                          ...s,
                                          data: {
                                            ...(typeof s.data === 'object' ? s.data : {}),
                                            ...(fieldLable ? { [fieldLable]: newVal } : {}),
                                          },
                                        }
                                      : s
                                  );
                                });
                              }
                              
                              // Restore scroll position after state updates
                              if (container) {
                                const savedScroll = scrollPositionRef.current;
                                requestAnimationFrame(() => {
                                  if (pdfContainerRef?.current && shouldPreserveScrollRef.current) {
                                    pdfContainerRef.current.scrollTop = savedScroll;
                                  }
                                });
                                
                                setTimeout(() => {
                                  if (pdfContainerRef?.current) {
                                    pdfContainerRef.current.scrollTop = savedScroll;
                                    shouldPreserveScrollRef.current = false;
                                  }
                                }, 50);
                              }
                              
                              // Reset typing flag after a short delay
                              setTimeout(() => {
                                isUserTypingRef.current = false;
                              }, 1000);
                            }
                          } catch (error) {
                            console.error("Error in setValue:", error);
                            // Still update the ref even if state update fails
                            fieldValuesRef.current[keyId] = newVal;
                          }
                        };
                        
                        // Prevent form submission on Enter key
                        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
                          // Prevent Enter from submitting any form
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            return false;
                          }
                        };
                        
                        // Track focus/blur to know when user is interacting with fields
                        const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
                          isUserTypingRef.current = true;
                          activeInputRef.current = e.target;
                          activeInputIdRef.current = keyId;
                        };
                        
                        const handleBlur = () => {
                          // Reset after a delay to allow for rapid typing
                          setTimeout(() => {
                            isUserTypingRef.current = false;
                            activeInputRef.current = null;
                            activeInputIdRef.current = null;
                          }, 500);
                        };

                        const editable = isCurrentUser;
                        const commonBox =
                          "w-full h-full flex items-center justify-center rounded border text-sm " +
                          (editable ? "bg-blue-50 border-blue-400 text-blue-700" : "bg-gray-100 border-gray-300 text-gray-500 opacity-80");

                        // Render control based on type
                        const renderInput = () => {
                          switch (field.type) {
                            case "checkbox":
                              return (
                                <label className={commonBox + " cursor-pointer gap-2 px-2"} style={{pointerEvents: editable? 'auto':'none'}}>
                                  <input
                                    type="checkbox"
                                    defaultChecked={!!value}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      setValue(e.target.checked, true); // Checkboxes update state immediately
                                    }}
                                    disabled={!editable}
                                  />
                                  <span> {fieldLable || "Checkbox"}</span>
                                </label>
                              );
                            case "date":
                              return (
                                <input
                                  id={`field-${keyId}`}
                                  key={`field-${keyId}`}
                                  type="date"
                                  className={commonBox + " px-2 outline-none"}
                                  defaultValue={value || ""}
                                  onChange={(e) => {
                                    setValue(e.target.value, false); // false = don't update state
                                  }}
                                  onBlur={(e) => {
                                    setValue(e.target.value, true); // true = update state on blur
                                    handleBlur();
                                  }}
                                  onKeyDown={handleKeyDown}
                                  onFocus={handleFocus}
                                  disabled={!editable}
                                  style={{pointerEvents: editable? 'auto':'none'}}
                                  autoComplete="off"
                                />
                              );
                            case "email":
                            case "name":
                            case "company":
                            case "title":
                            case "text":
                            case "number":
                              return (
                                <input
                                  id={`field-${keyId}`}
                                  key={`field-${keyId}`}
                                  type={field.type === 'number' ? 'number' : 'text'}
                                  className={commonBox + " px-2 outline-none"}
                                  placeholder={fieldLable || field.type}
                                  defaultValue={value || ""}
                                  onChange={(e) => {
                                    // Only update ref (no re-render)
                                    const newValue = e.target.value;
                                    setValue(newValue, false); // false = don't update state
                                  }}
                                  onBlur={(e) => {
                                    // Update state on blur to ensure it's saved
                                    const newValue = e.target.value;
                                    setValue(newValue, true); // true = update state
                                    handleBlur();
                                  }}
                                  onKeyDown={(e) => {
                                    handleKeyDown(e);
                                    // Prevent any form submission
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      return false;
                                    }
                                  }}
                                  onFocus={handleFocus}
                                  disabled={!editable}
                                  style={{pointerEvents: editable? 'auto':'none'}}
                                  autoComplete="off"
                                />
                              );
                            case "initial":
                              return (
                                <input
                                  id={`field-${keyId}`}
                                  key={`field-${keyId}`}
                                  type="text"
                                  maxLength={3}
                                  className={commonBox + " px-2 tracking-widest outline-none"}
                                  placeholder="Init"
                                  defaultValue={value || ""}
                                  onChange={(e) => {
                                    const newValue = e.target.value.toUpperCase();
                                    e.target.value = newValue; // Update immediately
                                    setValue(newValue, false); // false = don't update state
                                  }}
                                  onBlur={(e) => {
                                    const newValue = e.target.value.toUpperCase();
                                    setValue(newValue, true); // true = update state
                                    handleBlur();
                                  }}
                                  onKeyDown={(e) => {
                                    handleKeyDown(e);
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      return false;
                                    }
                                  }}
                                  onFocus={handleFocus}
                                  disabled={!editable}
                                  style={{pointerEvents: editable? 'auto':'none'}}
                                  autoComplete="off"
                                />
                              );
                            case "stamp":
                              return (
                                <div 
                                  className={`${commonBox} ${editable && !value ? 'cursor-pointer hover:bg-blue-100 transition-colors' : ''} flex-col gap-1.5 py-2`}
                                  style={{pointerEvents: editable? 'auto':'none'}}
                                >
                                  {value ? (
                                    <div className="relative w-full h-full flex items-center justify-center group">
                                      <img 
                                        src={value} 
                                        alt="Stamp" 
                                        className="max-h-full max-w-full object-contain rounded" 
                                      />
                                      {editable && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setValue(null);
                                          }}
                                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                          title="Remove stamp"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <label className="flex flex-col items-center justify-center gap-1.5 cursor-pointer w-full h-full">
                                      <div className="flex items-center gap-2">
                                        <StampIcon className="w-4 h-4" />
                                        <span className="text-xs font-medium">{fieldLable || 'Stamp'}</span>
                                      </div>
                                      {editable && (
                                        <>
                                          <Upload className="w-3.5 h-3.5 opacity-70" />
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (!file) return;
                                              const reader = new FileReader();
                                              reader.onload = () => setValue(reader.result as string);
                                              reader.readAsDataURL(file);
                                            }}
                                          />
                                          <span className="text-[10px] text-gray-500">Click to upload</span>
                                        </>
                                      )}
                                    </label>
                                  )}
                                </div>
                              );
                            default:
                              return (
                                <div className={commonBox}>{fieldLable || field.type || ''}</div>
                              );
                          }
                        };

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
                              pointerEvents: "auto",
                            }}
                          >
                            {renderInput()}
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
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      onKeyDown={(e) => {
        // Prevent Enter from submitting form anywhere
        if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      style={{ display: 'contents' }}
    >
      <div className="relative flex flex-col items-stretch min-h-screen bg-gray-50">
        {/* Header (sticky full-width) */}
        <div className="fixed top-0 left-0 right-0 h-12 bg-[#1b0c3e] text-white flex items-center justify-between px-4 z-50">
          <div className="text-sm font-medium">Review and complete</div>
        </div>

      {/* PDF(s) container */}
      <div
        ref={pdfContainerRef}
        className="relative border border-gray-300 rounded-sm shadow-sm bg-white overflow-auto max-w-4xl max-h-[100vh] self-center mt-8 mb-12"
        onKeyDown={(e) => {
          // Prevent Enter key from submitting any form anywhere in the container
          if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT' && (e.target as HTMLInputElement).type !== 'submit') {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
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
      {(() => {
        // Get the current field at currentActionableIndex
        const currentField = currentActionableIndex < actionableFields.length 
          ? actionableFields[currentActionableIndex] 
          : null;
        
        // Find the next incomplete field for navigation
        let nextFieldIndex: number | null = null;
        if (hasStarted && currentField) {
          // Check if current field is still incomplete
          const key = currentField._id || currentField.fieldId;
          let isCurrentCompleted = false;
          
          if (currentField.type === 'signature') {
            if (selfValue === '1') {
              const matchedSigner = (selfSigner || []).find((s: any) => s && s.signerSlotId === currentField.slotId);
              isCurrentCompleted = matchedSigner ? !!matchedSigner.signature : false;
            } else {
              isCurrentCompleted = !!currentField.signature || !!localSignedMap[key];
            }
          } else {
            isCurrentCompleted = isNonSignatureCompleted(currentField);
          }
          
          // If current is completed, find next from current index, otherwise from current + 1
          nextFieldIndex = findNextIncompleteField(isCurrentCompleted ? currentActionableIndex : currentActionableIndex + 1);
          if (nextFieldIndex === null) {
            nextFieldIndex = findNextIncompleteField(0);
          }
        } else {
          nextFieldIndex = findNextIncompleteField(0);
        }
        
        // Show the current field type (or first field if not started)
        const displayField = currentField || (nextFieldIndex !== null ? actionableFields[nextFieldIndex] : null);
        const fieldType = displayField?.type || '';
        // Show "Sign" for signature type, otherwise capitalize first letter
        const fieldTypeDisplay = fieldType === 'signature' 
          ? 'Sign' 
          : fieldType ? fieldType.charAt(0).toUpperCase() + fieldType.slice(1) : '';
        const buttonText = hasStarted ? (fieldTypeDisplay || 'Next') : "Start";
        
        // Check if there's a next field to navigate to (different from current)
        const hasNextField = nextFieldIndex !== null && (!hasStarted || nextFieldIndex !== currentActionableIndex);
        
        return (
          <button
            onClick={goToNext}
            disabled={!hasNextField || actionableFields.length === 0}
            className={`fixed z-50 font-medium shadow disabled:opacity-50 ${
              hasStarted ? "left-75" : "left-71"
            }`}
            style={{ 
              backgroundColor: '#ffc107', 
              color: '#1a1a1a', 
              marginLeft: 0,
              padding: hasStarted ? '8px 20px 8px 16px' : '8px 16px',
              border: 'none',
              borderRadius: hasStarted ? undefined : '8px',
              borderTopLeftRadius: hasStarted ? '8px' : undefined,
              borderBottomLeftRadius: hasStarted ? '8px' : undefined,
              borderTopRightRadius: hasStarted ? 0 : undefined,
              borderBottomRightRadius: hasStarted ? 0 : undefined,
              top: hasStarted ? '50%' : '60px',
              transform: hasStarted ? 'translateY(-50%)' : 'none',
              clipPath: hasStarted ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)' : 'none',
              cursor: 'pointer',
            }}
            aria-label={hasStarted ? `${fieldTypeDisplay} field` : "Start"}
          >
            {buttonText}
          </button>
        );
      })()}

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
    </form>
  );
};

const DocumentViewer: React.FC<Props> = (props) => {
  return <DocumentViewerContent {...props} />;
};

export default DocumentViewer;

