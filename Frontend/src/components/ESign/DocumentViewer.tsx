import { Document, Page, pdfjs } from "react-pdf";
import React, { useEffect, useLayoutEffect, useRef, useState, useMemo } from "react";
import Modal from "react-modal";
import SignPad from "./SignPad";
import { eSignApi } from "../../services/apiHelper";
import type { SignerData, ActiveField } from "../../types/documentTypes";
import confetti from "canvas-confetti";
import { Link, useNavigate } from "react-router-dom";
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
  allRecipients?: any[];
  setSignatureFields: (fields: any[] | ((prev: any[]) => any[])) => void;
}

Modal.setAppElement("#root");

const BASE_PAGE_WIDTH = 800;
const MIN_FIELD_WIDTH = 16;
const MIN_FIELD_HEIGHT = 14;

const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === "object") {
    if (value.$numberDouble !== undefined) return Number(value.$numberDouble);
    if (value.$numberDecimal !== undefined) return Number(value.$numberDecimal);
    if (value.$numberInt !== undefined) return Number(value.$numberInt);
    if (value.$numberLong !== undefined) return Number(value.$numberLong);
    if ("value" in value) return toNumber(value.value);
  }
  const coerced = Number(value);
  return Number.isNaN(coerced) ? 0 : coerced;
};

const DocumentViewerContent: React.FC<Props> = ({
  document,
  documents,
  signatureFields,
  currentUserId,
  envelopeID,
  onSignatureSave,
  cycleId,
  allRecipients,
  setSignatureFields
}) => {
  const curRecipientSignature = allRecipients?.find(r => r.id === currentUserId)?.signature || null;

  const [recipientSignature, setRecipientSignature] = useState<string | null>(curRecipientSignature);

  useEffect(() => {
    setRecipientSignature(curRecipientSignature);
  }, [curRecipientSignature]);


  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const selfValue = urlParams.get("self");
  const [activeField, setActiveField] = useState<ActiveField | null>(null);
  const [selfSigner, setSelfSigner] = useState<SignerData[]>([]);
  const [_isLoading, setIsLoading] = useState(selfValue === "1");
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);
  const [pageWidth, setPageWidth] = useState<number>(BASE_PAGE_WIDTH);
  const [pageScale, setPageScale] = useState<number>(1);

  // Local optimistic store for signatures in non-self mode so user sees signature immediately
  const [localSignedMap, setLocalSignedMap] = useState<Record<string, string>>(
    {}
  );
  // Local values for non-signature inputs (text, date, checkbox, etc.)
  const [localFieldValues, setLocalFieldValues] = useState<Record<string, any>>({});
  const [signingFieldIds, setSigningFieldIds] = useState<Record<string, boolean>>({});
  // Use refs to store values without causing re-renders
  const fieldValuesRef = useRef<Record<string, any>>({});

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
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateDimensions = () => {
      const container = pdfContainerRef.current;
      if (!container) return;
      const paddingOffset = 24; // account for container padding/scrollbar
      const availableWidth = Math.max(
        280,
        container.clientWidth - paddingOffset
      );
      const nextWidth = Math.min(BASE_PAGE_WIDTH, availableWidth);
      setPageWidth(nextWidth);
      setPageScale(nextWidth / BASE_PAGE_WIDTH);
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    let resizeObserver: ResizeObserver | null = null;
    if ((window as any).ResizeObserver && pdfContainerRef.current) {
      resizeObserver = new ResizeObserver(() => updateDimensions());
      resizeObserver.observe(pdfContainerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateDimensions);
      if (resizeObserver && pdfContainerRef.current) {
        resizeObserver.unobserve(pdfContainerRef.current);
      }
    };
  }, []);

  const [currentActionableIndex, setCurrentActionableIndex] =
    useState<number>(0);
  const [hasAutoOpened, setHasAutoOpened] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const hadFieldsInitiallyRef = useRef<boolean>(false);
  const isUserTypingRef = useRef<boolean>(false);
  const scrollPositionRef = useRef<number>(0);
  const shouldPreserveScrollRef = useRef<boolean>(false);
  const activeInputRef = useRef<HTMLInputElement | null>(null);
  const activeInputIdRef = useRef<string | null>(null);
  const currentFieldIdRef = useRef<string | null>(null);
  const [buttonStyle, setButtonStyle] = useState<React.CSSProperties>({});
  const buttonUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastButtonPositionRef = useRef<{ top: number; left: number } | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isNavigatingRef = useRef<boolean>(false);

  const normalizePage = (field: any) =>
    Number(
      field?.page?.$numberInt ??
      field?.page ??
      field?.pageNumber ??
      field?.pageNo ??
      0
    );
  // returns whether one non-signature field is considered filled
const isFieldFilled = (f: any): boolean => {
  const key = f._id || f.fieldId;
  let v = fieldValuesRef.current[key];
  if (v === undefined) v = localFieldValues[key];
  if (v !== undefined && v !== null) {
    if (f.type === "checkbox") return !!v;
    return String(v).trim().length > 0;
  }

  // respect existing selfValue/selfSigner fallback if you use it for prefill
  if (selfValue === "1") {
    const matched = (selfSigner || []).find((s: any) => s && s.signerSlotId === f.slotId);
    if (matched) {
      const val = matched.role === "creator" ? matched.data?.name : matched.data?.[f.label];
      if (f.type === "checkbox") return !!val;
      return val !== undefined && val !== null && String(val).trim().length > 0;
    }
  }

  // backend-provided default
  if (f.signature !== undefined && f.signature !== null) {
    return String(f.signature).trim().length > 0;
  }
  return false;
};

// returns true only if ALL non-signature fields for that recipient are filled
const areAllNonSignatureFieldsFilledForRecipient = (recipientId: string) => {
  const fields = signatureFields.filter((ff: any) => ff.type !== "signature" && ff.recipientId === recipientId);
  if (fields.length === 0) return true; // no other fields => allow signing
  return fields.every(isFieldFilled);
};
// Submit non-signature fields 
// call after you setValue(..., true) (i.e., onBlur / onChange)
const submitSingleField = async (recipientId: string, fieldId: string, value: any) => {
  if (!recipientId || value == null) return;

  const payload = {
    envelopeID,
    recipientId,
    fields: { fieldId, value },
  };

  try {
    const response = await eSignApi.post('/api/e-sign/public/save-non-signature-field', payload);
    console.log("Field submitted:", response);

    // Update signatureFields to trigger actionableFields recompute
    setSignatureFields(prev => prev.map(f => 
      (f._id || f.fieldId) === fieldId ? { ...f, signature: value } : f
    ));

  } catch (e) {
    console.error("Network error while submitting field", e);
  }
};





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
    if (field.signature !== undefined && field.signature !== null) {
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
          // Regular mode: recipient-based signing
          isCurrentUser = field.recipientId === currentUserId;
          if (field.type === 'signature') {
            // In regular mode, exclude signature fields until all non-signature fields for that recipient are filled
            const allFilled = areAllNonSignatureFieldsFilledForRecipient(field.recipientId);
            if (!allFilled) {
              // Don't include signature field in actionableFields if non-signature fields aren't all filled
              return false;
            }
            isCompleted = !!field.signature || !!localSignedMap[field._id || field.fieldId];
          } else {
            isCompleted = isNonSignatureCompleted(field);
          }
        }
        return isCurrentUser && !isCompleted;
      })
      .sort((a, b) => {
        // In regular mode, prioritize non-signature fields first, then signature fields
        if (selfValue !== '1') {
          if (a.type === 'signature' && b.type !== 'signature') return 1;
          if (a.type !== 'signature' && b.type === 'signature') return -1;
        }
        // Then sort by page number
        return a.pageNum - b.pageNum;
      });
  }, [signatureFields, selfSigner, selfValue, currentUserId, localSignedMap, localFieldValues]);

  // Track if there were fields initially
  useEffect(() => {
    if (actionableFields.length > 0 && !hadFieldsInitiallyRef.current) {
      hadFieldsInitiallyRef.current = true;
    }
  }, [actionableFields.length]);

  const currentNavField =
    currentActionableIndex < actionableFields.length
      ? actionableFields[currentActionableIndex]
      : null;
  const currentNavFieldKey = currentNavField
    ? currentNavField._id || currentNavField.fieldId
    : null;

  // Auto-scroll to first actionable field on load (only once) - but don't open sign pad
  useEffect(() => {
    // Only run once when fields first become available, not when they change due to user input
    if (!hasAutoOpened && actionableFields.length > 0) {
      // In regular mode, find first non-signature field if available
      let firstField = actionableFields[0];
      if (selfValue !== '1') {
        const firstNonSignature = actionableFields.find(f => f.type !== 'signature');
        if (firstNonSignature) {
          firstField = firstNonSignature;
          const firstIndex = actionableFields.findIndex(f => f === firstNonSignature);
          setCurrentActionableIndex(firstIndex);
          currentFieldIdRef.current = firstField._id || firstField.fieldId;
        } else {
          // If no non-signature fields, use first field (should be signature)
          setCurrentActionableIndex(0);
          currentFieldIdRef.current = firstField._id || firstField.fieldId;
        }
      } else {
        setCurrentActionableIndex(0);
        currentFieldIdRef.current = firstField._id || firstField.fieldId;
      }
      setHasAutoOpened(true);
      // Center the first actionable field in view (but don't open sign pad)
      setTimeout(() => {
        scrollToFieldElement(firstField._id || firstField.fieldId);
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
    if (isNavigatingRef.current) return; // Prevent concurrent navigation
    
    // Ensure index is valid and wraps around correctly
    const validIndex = ((index % actionableFields.length) + actionableFields.length) % actionableFields.length;
    if (validIndex < 0 || validIndex >= actionableFields.length) return;
    
    const field = actionableFields[validIndex];
    if (!field) return;
    
    isNavigatingRef.current = true;
    setCurrentActionableIndex(validIndex);
    // Track the field ID so we can maintain position when actionableFields changes
    currentFieldIdRef.current = field._id || field.fieldId;
    // wait for page render then scroll to exact field element (robust polling)
    requestAnimationFrame(() => {
      scrollToFieldElement(field._id || field.fieldId);
      // Allow navigation after scroll completes
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 500);
    });
  };
  
  // Find the next incomplete field, starting from a given index
  // In regular mode, prioritizes non-signature fields first
  const findNextIncompleteField = (startIndex: number, prioritizeNonSignature: boolean = false) => {
    if (actionableFields.length === 0) return null;
    
    // In regular mode, first try to find non-signature fields
    if (selfValue !== '1' && prioritizeNonSignature) {
      // First pass: look for non-signature fields
      for (let i = 0; i < actionableFields.length; i++) {
        const idx = (startIndex + i) % actionableFields.length;
        const field = actionableFields[idx];
        
        if (!field || field.type === 'signature') continue;
        
        const isCompleted = isNonSignatureCompleted(field);
        
        if (!isCompleted) {
          return idx;
        }
      }
      
      // Second pass: if no incomplete non-signature fields, look for signature fields
      for (let i = 0; i < actionableFields.length; i++) {
        const idx = (startIndex + i) % actionableFields.length;
        const field = actionableFields[idx];
        
        if (!field || field.type !== 'signature') continue;
        
        const fieldKey = field._id || field.fieldId;
        const isCompleted = !!field.signature || !!localSignedMap[fieldKey];
        
        if (!isCompleted) {
          return idx;
        }
      }
    } else {
      // Self mode or no prioritization: search forward from startIndex
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
    }
    
    return null;
  };
  
  // (Prev navigation removed because it wasn't used; keeping only Next in UI)
  const goToNext = () => {
    if (actionableFields.length === 0) return;
    
    // If not started yet, navigate to first incomplete field and mark as started
    if (!hasStarted) {
      setHasStarted(true);
      // In regular mode, prioritize non-signature fields first
      const firstIncomplete = selfValue !== '1' 
        ? findNextIncompleteField(0, true) // Prioritize non-signature in regular mode
        : findNextIncompleteField(0);
      if (firstIncomplete !== null) {
        goToActionableIndex(firstIncomplete);
      } else {
        goToActionableIndex(0);
      }
      return;
    }
    
    // Check if current field is completed - if so, it may have been removed from actionableFields
    const currentField = currentActionableIndex < actionableFields.length 
      ? actionableFields[currentActionableIndex] 
      : null;
    
    let isCurrentCompleted = false;
    if (currentField) {
      const key = currentField._id || currentField.fieldId;
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
    } else {
      // Current field doesn't exist in actionableFields, so it's completed
      isCurrentCompleted = true;
    }
    
    // In regular mode, prioritize non-signature fields first
    if (selfValue !== '1') {
      // If current is completed, start from current index (field was removed, so next field is now at this index)
      // Otherwise, start from current + 1
      const startIdx = isCurrentCompleted ? currentActionableIndex : currentActionableIndex + 1;
      let nextIndex = findNextIncompleteField(startIdx, true);
      
      // If not found after current, try from the beginning
      if (nextIndex === null) {
        nextIndex = findNextIncompleteField(0, true);
      }
      
      // Navigate if we found a field (even if index is same, because the field at that index changed)
      if (nextIndex !== null) {
        goToActionableIndex(nextIndex);
      }
    } else {
      // Self mode: original behavior
      const startIdx = isCurrentCompleted ? currentActionableIndex : currentActionableIndex + 1;
      let nextIndex = findNextIncompleteField(startIdx);
      
      // If not found after current, try from the beginning
      if (nextIndex === null) {
        nextIndex = findNextIncompleteField(0);
      }
      
      // Navigate if we found a field
      if (nextIndex !== null) {
        goToActionableIndex(nextIndex);
      }
    }
    // If nextIndex is null, all fields are completed - do nothing
  };
  // Do Signature
  const doSign = async (field:any) =>{
    if(!recipientSignature){
      alert("Please save a signature before submitting!");
      return;
    }
    const fieldKey = field?._id || field?.fieldId;
    if (fieldKey) {
      setSigningFieldIds((prev) => ({ ...prev, [fieldKey]: true }));
    }
    const clearSigningState = () => {
      if (!fieldKey) return;
      setSigningFieldIds((prev) => {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
    };
    try{
      console.log(field);
      const certificateId = await issueCertificate(currentUserId, envelopeID, selfValue);
      const payload = {
        fieldId: fieldKey,
        signatureImageBase64: recipientSignature,
        envelopeId: envelopeID || "",
        documentId:field?.documentId,
        recipientId: currentUserId,
        certificateId, 
        signerName: "John Doe", // adjust dynamically if you have a real name
        selfValue: selfValue || "",
        cycleId:cycleId || ""
      };
      const response = await eSignApi.post("/api/e-sign/public/add-signature", payload);
      if (response?.status === 200) {
        const key = fieldKey;
        setLocalSignedMap((p) => ({ ...(p || {}), [key]: recipientSignature }));
         triggerConfetti();
        if(response?.data?.fieldRemmaning===false){
          navigate("/e-sign/signer/thank-you");
        }
      }else{
        console.error("submit response:", response);
        alert("Failed to submit signature. Please try again.");
      }
    }catch (err){
      console.error("submit error:", err);
            alert("An error occurred while submitting the signature.");
    } finally {
      clearSigningState();
    }
  };
    const issueCertificate = async (recipientId: any, envelopeId: any, selfVal: any) => {
      const payload = { recipientId, envelopeId, selfValue: selfVal };
      try {
        const res = await eSignApi.post("/api/e-sign/certificates/issue", payload);
        return res?.data?.certificateId;
      } catch (err) {
        console.error("issueCertificate error:", err);
        throw err;
      }
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

  // Update button position based on current field
  useEffect(() => {
    if (!hasStarted || !pdfContainerRef.current) {
      setButtonStyle({});
      lastButtonPositionRef.current = null;
      return;
    }

    // Clear any pending updates
    if (buttonUpdateTimeoutRef.current) {
      clearTimeout(buttonUpdateTimeoutRef.current);
      buttonUpdateTimeoutRef.current = null;
    }

    const updatePosition = () => {
      const container = pdfContainerRef.current;
      if (!container) return;

      // Get current field from actionableFields using the index
      const currentField = currentNavField;

      if (!currentField) {
        setButtonStyle({});
        lastButtonPositionRef.current = null;
        return;
      }

      const fieldId = currentField._id || currentField.fieldId;
      const selector = `[data-field-id="${fieldId}"]`;
      const fieldElement = container.querySelector(selector) as HTMLElement | null;

      if (!fieldElement) {
        // Field not rendered yet, try again after a delay
        buttonUpdateTimeoutRef.current = setTimeout(updatePosition, 200);
        return;
      }

      // Get positions relative to container
      const containerRect = container.getBoundingClientRect();
      const fieldRect = fieldElement.getBoundingClientRect();

      // Calculate field position accounting for scroll
      const fieldTop = fieldRect.top - containerRect.top + container.scrollTop;
      const fieldLeft = fieldRect.left - containerRect.left + container.scrollLeft;
      const fieldHeight = fieldRect.height;

      // Button dimensions
      const buttonWidth = 90;
      const buttonHeight = 36;
      const spacing = 12;

      // Position to the left of field, vertically centered
      const left = Math.max(0, fieldLeft - buttonWidth - spacing);
      const top = fieldTop + (fieldHeight / 2) - (buttonHeight / 4);

      // Only update if position actually changed (avoid unnecessary re-renders)
      if (!lastButtonPositionRef.current || 
          Math.abs(lastButtonPositionRef.current.top - top) > 1 || 
          Math.abs(lastButtonPositionRef.current.left - left) > 1) {
        lastButtonPositionRef.current = { top, left };
        setButtonStyle({
          position: 'absolute',
          top: `${top}px`,
          left: `${left}px`,
          transform: 'translateY(-50%)',
        });
      }
    };

    // Delay initial update to avoid conflicts with navigation/rendering
    buttonUpdateTimeoutRef.current = setTimeout(updatePosition, 300);

    // Throttled scroll handler
    const container = pdfContainerRef.current;
    const handleScroll = () => {
      if (scrollTimeoutRef.current) return;
      scrollTimeoutRef.current = setTimeout(() => {
        updatePosition();
        scrollTimeoutRef.current = null;
      }, 50); // Throttle to max 20 updates per second
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (buttonUpdateTimeoutRef.current) {
        clearTimeout(buttonUpdateTimeoutRef.current);
        buttonUpdateTimeoutRef.current = null;
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
    };
    // Only depend on current index, nav field, and started state to avoid excessive recalculations
  }, [hasStarted, currentActionableIndex, currentNavFieldKey, actionableFields.length]);

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
  // Don't adjust if user is currently typing or navigating to avoid interrupting them
  useEffect(() => {
    // Don't make any changes if user is typing or we're navigating
    if (isUserTypingRef.current || isNavigatingRef.current) {
      return;
    }
    
    if (actionableFields.length === 0) {
      currentFieldIdRef.current = null;
      return;
    }
    
    // Get current index from state (don't use in dependency to avoid loops)
    const currentIdx = currentActionableIndex;
    
    // If we have a tracked field ID, try to find it in the new actionableFields
    if (currentFieldIdRef.current) {
      const foundIndex = actionableFields.findIndex(
        (f) => (f._id || f.fieldId) === currentFieldIdRef.current
      );
      if (foundIndex >= 0 && foundIndex !== currentIdx) {
        // Field still exists and is incomplete, update index to its new position
        setCurrentActionableIndex(foundIndex);
        return;
      } else if (foundIndex < 0) {
        // Field was completed and removed from actionableFields
        // Don't auto-navigate - let user click Next button
        currentFieldIdRef.current = null;
      }
    }
    
    // Check if current index is out of bounds
    if (currentIdx >= actionableFields.length) {
      // Find the first incomplete field - in regular mode, prioritize non-signature fields
      const nextIncomplete = selfValue !== '1' 
        ? findNextIncompleteField(0, true)
        : findNextIncompleteField(0);
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
    
    // Just update the ref if field exists - don't auto-navigate on completion
    const currentField = actionableFields[currentIdx];
    if (currentField) {
      const key = currentField._id || currentField.fieldId;
      currentFieldIdRef.current = key;
    }
    // Only depend on actionableFields.length, NOT completion states to avoid re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    recipientSignature: string | null;
    onFieldClick: (field: any) => void;
    normalizePage: (field: any) => number;
    pageWidth: number;
    pageScale: number;
    signingFieldIds: Record<string, boolean>;
  }> = ({
    doc,
    signatureFields,
    currentUserId,
    selfValue,
    selfSigner,
    localSignedMap,
    recipientSignature,
    onFieldClick,
    normalizePage,
    pageWidth,
    pageScale,
    signingFieldIds,
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
                <div className="relative" style={{ width: pageWidth }}>
                  <Page pageNumber={pageNum} width={pageWidth} />

                  {/* per-page overlay */}
                  <div
                    className="absolute inset-0 z-40"
                    style={{
                      width: pageWidth,
                    }}
                  >
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
                        const isSigning = !!signingFieldIds[keyId];
                        const rawWidth = toNumber(
                          field.width?.$numberDouble ??
                            field.width?.$numberInt ??
                            field.width
                        );
                        const rawHeight = toNumber(
                          field.height?.$numberDouble ??
                            field.height?.$numberInt ??
                            field.height
                        );
                        const rawX = toNumber(
                          field.x?.$numberDouble ?? field.x?.$numberInt ?? field.x
                        );
                        const rawY = toNumber(
                          field.y?.$numberDouble ?? field.y?.$numberInt ?? field.y
                        );
                        const scaledWidth = Math.max(
                          rawWidth * pageScale,
                          MIN_FIELD_WIDTH
                        );
                        const scaledHeight = Math.max(
                          rawHeight * pageScale,
                          MIN_FIELD_HEIGHT
                        );
                        const labelOffset = Math.max(
                          4,
                          Math.min(12, scaledHeight * 0.2)
                        );
                        const labelFontSize = Math.max(
                          4.5,
                          Math.min(10, 9 * pageScale)
                        );
                        const fieldFontSize = Math.max(
                         4.5,
                          Math.min(11, 11 * pageScale)
                        );
                        const boxPaddingY = Math.max(4, 12 * pageScale);
                        const boxPaddingX = Math.max(6, 14 * pageScale);
                        const labelTop = scaledHeight + 2;

                        // recipient display (best-effort)
                        const recipientDisplay = (() => {
                          if (selfValue === "1") {
                            const matched = (selfSigner || []).find(
                              (s: any) => s && s.signerSlotId === field.slotId
                            );
                            if (matched) {
                              const primary =
                                matched?.data?.name || matched?.name || matched?.data?.email;
                              const secondary =
                                matched?.data?.name && matched?.data?.email
                                  ? matched.data.email
                                  : undefined;
                              return {
                                primary: primary || "Recipient",
                                secondary,
                                decorated: true,
                              };
                            }
                          } else {
                            const recipient = allRecipients?.find(
                              (r: any) => r.id === field.recipientId
                            );
                            if (recipient) {
                              return {
                                primary: recipient.name || recipient.email || "Recipient",
                                secondary:
                                  recipient.name && recipient.email ? recipient.email : undefined,
                                decorated: true,
                              };
                            }
                            if (
                              field.recipientId &&
                              String(field.recipientId) === String(currentUserId)
                            ) {
                              return {
                                primary: "You",
                                decorated: false,
                              };
                            }
                          }
                          return {
                            primary: "Recipient",
                            decorated: false,
                          };
                        })();
                        const recipientSecondaryFont = Math.max(
                          4,
                          Math.min(labelFontSize - 1, labelFontSize * 0.95)
                        );
                        const recipientBadgePaddingY = Math.max(2, 6 * pageScale);
                        const recipientBadgePaddingX = Math.max(3, 10 * pageScale);
                        const recipientBadgeRadius = Math.max(3, 8 * pageScale);
                        const recipientBadgeGap = Math.max(1, 4 * pageScale);

                        if (isSignatureType) {
                          const allFilled = areAllNonSignatureFieldsFilledForRecipient(field.recipientId);
                          const allowSigning = isCurrentUser && !isSigned && allFilled && !isSigning;
                          return (
                            <div
                              key={field._id?.$oid || field._id}
                              data-field-id={keyId}
                              style={{
                                position: "absolute",
                                top: rawY * pageScale,
                                left: rawX * pageScale,
                                width: scaledWidth,
                                height: scaledHeight + labelOffset,
                                zIndex: 10
                              }}
                            >
                              <div
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  width: scaledWidth,
                                  height: scaledHeight,
                                  pointerEvents: allowSigning ? "auto" : "none",
                                  fontSize: fieldFontSize,
                                  padding: `${boxPaddingY}px ${boxPaddingX}px`,
                                }}
                                className={`flex items-center justify-center font-semibold rounded border-2 ${isSigned
                                  ? "border-green-500"
                                  : isCurrentUser
                                    ? isSigning
                                      ? "bg-blue-100 border-blue-400 text-blue-600 cursor-progress"
                                      : "bg-blue-100 border-blue-500 text-blue-700 cursor-pointer hover:bg-blue-200"
                                    : "bg-gray-100 border-gray-300 text-gray-500 opacity-50"
                                  }`}
                                onClick={() => {
                                  if (isSigning) return;
                                  if (isCurrentUser && !recipientSignature) {
                                    console.log(recipientSignature);
                                    onFieldClick(field);
                                  } else if (isCurrentUser && recipientSignature) {
                                    doSign(field);
                                  }
                                }}

                              >
                                {isSigning ? (
                                  <div className="flex items-center gap-2">
                                    <span className="h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                    <span>Signing...</span>
                                  </div>
                                ) : isSigned ? (
                                  <img
                                    src={signedImage as string}
                                    alt="Signed"
                                    className="h-full w-full object-contain"
                                  />
                                ) : !allFilled ? (
                                  "Fill all other fields first"
                                ) : isCurrentUser && recipientSignature ? (
                                  "Click to sign"
                                ) : isCurrentUser && !recipientSignature ?(
                                  "Click to Save"
                                ):("Signature")}
                              </div>
                              <div
                                style={{
                                  position: "absolute",
                                  top: labelTop,
                                  left: 0,
                                  width: scaledWidth,
                                  pointerEvents: 'none',
                                  textAlign: 'center',
                                  fontSize: labelFontSize,
                                  lineHeight: 1.1,
                                }}
                                className="text-[10px] text-gray-600"
                              >
                                {recipientDisplay.decorated ? (
                                  <div
                                    style={{
                                      display: "inline-flex",
                                      flexDirection: "column",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      backgroundColor: "rgba(148, 163, 184, 0.35)",
                                      borderRadius: recipientBadgeRadius,
                                      padding: `${recipientBadgePaddingY}px ${recipientBadgePaddingX}px`,
                                      gap: recipientBadgeGap,
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: labelFontSize,
                                        fontWeight: 600,
                                        color: "#1f2937",
                                        lineHeight: 1.1,
                                      }}
                                    >
                                      {recipientDisplay.primary}
                                    </span>
                                    {recipientDisplay.secondary ? (
                                      <span
                                        style={{
                                          fontSize: recipientSecondaryFont,
                                          color: "#1f2937",
                                          lineHeight: 1.05,
                                        }}
                                      >
                                        {recipientDisplay.secondary}
                                      </span>
                                    ) : null}
                                  </div>
                                ) : (
                                  <span
                                    style={{
                                      fontSize: labelFontSize,
                                      fontWeight: 500,
                                      color: "#4b5563",
                                      lineHeight: 1.1,
                                    }}
                                  >
                                    {recipientDisplay.primary}
                                  </span>
                                )}
                              </div>
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
                          "w-full h-full flex items-center justify-center rounded border " +
                          ( isSigned? "border-green-500" :editable ? "bg-blue-50 border-blue-400 text-blue-700" : "bg-gray-100 border-gray-300 text-gray-500 opacity-80");

                        const inputBaseStyle: React.CSSProperties = {
                          height: scaledHeight,
                          fontSize: fieldFontSize,
                          padding: `${boxPaddingY}px ${boxPaddingX}px`,
                        };

                        // Render control based on type
                        const renderInput = () => {
                          switch (field.type) {
                            case "checkbox":
                              return (
                                <label
                                  className={commonBox + " cursor-pointer gap-2"}
                                  style={{
                                    pointerEvents: editable ? "auto" : "none",
                                    fontSize: fieldFontSize,
                                    minHeight: scaledHeight,
                                    padding: `${boxPaddingY}px ${boxPaddingX}px`,
                                  }}
                                >
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
                                  className={commonBox + " outline-none"}
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
                                  style={{
                                    ...inputBaseStyle,
                                    pointerEvents: editable ? "auto" : "none",
                                  }}
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
                                  className={commonBox + " outline-none"}
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
                                    submitSingleField(field.recipientId,field._id,newValue);
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
                                  style={{
                                    ...inputBaseStyle,
                                    pointerEvents: editable ? "auto" : "none",
                                  }}
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
                                  className={commonBox + " tracking-widest outline-none"}
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
                                  style={{
                                    ...inputBaseStyle,
                                    pointerEvents: editable ? "auto" : "none",
                                    letterSpacing: "0.35em",
                                  }}
                                  autoComplete="off"
                                />
                              );
                            case "stamp":
                              return (
                                <div 
                                  className={`${commonBox} ${editable && !value ? 'cursor-pointer hover:bg-blue-100 transition-colors' : ''} flex-col gap-1.5`}
                                  style={{
                                    pointerEvents: editable ? "auto" : "none",
                                    minHeight: scaledHeight,
                                  }}
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
                                <div
                                  className={commonBox}
                                  style={{
                                    fontSize: fieldFontSize,
                                    minHeight: scaledHeight,
                                    padding: `${boxPaddingY}px ${boxPaddingX}px`,
                                  }}
                                >
                                  {fieldLable || field.type || ''}
                                </div>
                              );
                          }
                        };

                        return (
                          <div
                            key={fieldId}
                            data-field-id={keyId}
                            style={{
                              position: "absolute",
                              top: rawY * pageScale,
                              left: rawX * pageScale,
                              width: scaledWidth,
                              height: scaledHeight + labelOffset,
                              zIndex: 10,
                              pointerEvents: "auto",
                            }}
                          >{
                            <div
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: scaledWidth,
                                height: scaledHeight,
                              }}
                            >
                              {
                                isSigned ? (
                                  <div
                                    className={commonBox}
                                    style={{
                                      fontSize: fieldFontSize,
                                      minHeight: scaledHeight,
                                      padding: `${boxPaddingY}px ${boxPaddingX}px`,
                                    }}
                                  >
                                    {field.signature}
                                  </div>
                                ) : renderInput()
                              }
                              
                            </div>
                          }
                            <div
                              style={{
                                position: "absolute",
                                top: labelTop,
                                left: 0,
                                width: scaledWidth,
                                pointerEvents: 'none',
                                textAlign: 'center',
                                fontSize: labelFontSize,
                                lineHeight: 1.1,
                              }}
                              className="text-[10px] text-gray-600"
                            >
                              {recipientDisplay.decorated ? (
                                <div
                                  style={{
                                    display: "inline-flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: "rgba(148, 163, 184, 0.35)",
                                    borderRadius: recipientBadgeRadius,
                                    padding: `${recipientBadgePaddingY}px ${recipientBadgePaddingX}px`,
                                    gap: recipientBadgeGap,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: labelFontSize,
                                      fontWeight: 600,
                                      color: "#1f2937",
                                      lineHeight: 1.1,
                                    }}
                                  >
                                    {recipientDisplay.primary}
                                  </span>
                                  {recipientDisplay.secondary ? (
                                    <span
                                      style={{
                                        fontSize: recipientSecondaryFont,
                                        color: "#1f2937",
                                        lineHeight: 1.05,
                                      }}
                                    >
                                      {recipientDisplay.secondary}
                                    </span>
                                  ) : null}
                                </div>
                              ) : (
                                <span
                                  style={{
                                    fontSize: labelFontSize,
                                    fontWeight: 500,
                                    color: "#4b5563",
                                    lineHeight: 1.1,
                                  }}
                                >
                                  {recipientDisplay.primary}
                                </span>
                              )}
                            </div>
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
        className="relative flex-1 w-full max-w-full sm:max-w-3xl lg:max-w-4xl border border-gray-200 rounded-lg shadow-sm bg-white overflow-auto self-center mt-14 sm:mt-16 lg:mt-20 mb-20 px-3 sm:px-4 py-4"
        style={{ maxHeight: "calc(100vh - 160px)" }}
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
                recipientSignature={recipientSignature}
                onFieldClick={handleFieldClick}
                normalizePage={normalizePage}
                pageWidth={pageWidth}
                pageScale={pageScale}
                signingFieldIds={signingFieldIds}
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

        {/* Navigation button - positioned relative to current field */}
        {(() => {
        // Get the current field at currentActionableIndex
        const currentField = currentActionableIndex < actionableFields.length 
          ? actionableFields[currentActionableIndex] 
          : null;
        
        // Find the next incomplete field for navigation
        let nextFieldIndex: number | null = null;
        let isCurrentCompleted = false;
        
        if (hasStarted) {
          // Check if current field exists and is still incomplete
          if (currentField) {
            const key = currentField._id || currentField.fieldId;
            
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
          } else {
            // Current field doesn't exist (was removed from actionableFields), so it's completed
            isCurrentCompleted = true;
          }
          
          // Always start searching from current index + 1
          // In regular mode, prioritize non-signature fields
          const startIdx = currentActionableIndex + 1;
          nextFieldIndex = selfValue !== '1'
            ? findNextIncompleteField(startIdx, true)
            : findNextIncompleteField(startIdx);
          
          // If not found after current, try from the beginning
          if (nextFieldIndex === null) {
            nextFieldIndex = selfValue !== '1'
              ? findNextIncompleteField(0, true)
              : findNextIncompleteField(0);
          }
        } else {
          // Not started yet - in regular mode, prioritize non-signature fields
          nextFieldIndex = selfValue !== '1' 
            ? findNextIncompleteField(0, true) 
            : findNextIncompleteField(0);
        }
        
        // Show the current field type (or next field if current is completed)
        const displayField = currentField && !isCurrentCompleted 
          ? currentField 
          : (nextFieldIndex !== null ? actionableFields[nextFieldIndex] : null);
        const fieldType = displayField?.type || '';
        // Show "Sign" for signature type, otherwise capitalize first letter
        const fieldTypeDisplay = fieldType === 'signature' 
          ? 'Sign' 
          : fieldType ? fieldType.charAt(0).toUpperCase() + fieldType.slice(1) : '';
        const buttonText = hasStarted ? (fieldTypeDisplay || 'Next') : "Start";
        
        // Check if there's a next field to navigate to
        // Button should be enabled if there's a next field OR if current field is completed (so user can move to next)
        const hasNextField = (nextFieldIndex !== null) || (currentField && !isCurrentCompleted);
        
        const navScale = Math.min(1, Math.max(0.4, pageScale || 1));
        const navFontSize = Math.max(9, Math.min(15, 10 + (navScale - 0.4) * 8));
        const navPaddingY = Math.max(4, Math.min(12, 6 + (navScale - 0.4) * 12));
        const navPaddingX = Math.max(8, Math.min(18, 10 + (navScale - 0.4) * 14));
        const navTailWidth = Math.max(8, Math.min(18, 10 + (navScale - 0.4) * 12));
        const navBorderRadius = Math.max(5, Math.min(12, 6 + (navScale - 0.4) * 10));
        const navShadow = navScale <= 0.6 ? "0 3px 8px rgba(0,0,0,0.12)" : "0 6px 16px rgba(0,0,0,0.15)";

        // For "Start" button, use fixed positioning
        if (!hasStarted) {
          return (
            <button
              onClick={goToNext}
              disabled={!hasNextField}
              className="fixed z-50 font-medium shadow disabled:opacity-50"
              style={{ 
                backgroundColor: '#ffc107', 
                color: '#1a1a1a', 
                padding: `${navPaddingY}px ${navPaddingX}px`,
                border: 'none',
                borderRadius: `${navBorderRadius}px`,
                fontSize: `${navFontSize}px`,
                top: navScale <= 0.6 ? '48px' : '56px',
                left: navScale <= 0.6 ? '20px' : '64px',
                cursor: 'pointer',
                boxShadow: navShadow,
              }}
              aria-label="Start"
            >
              {buttonText}
            </button>
          );
        }

        // For navigation button, position relative to current field
        return (
          <button
            onClick={goToNext}
            disabled={!hasNextField || actionableFields.length === 0}
            className="absolute z-50 font-medium shadow disabled:opacity-50"
            style={{ 
              backgroundColor: '#ffc107', 
              color: '#1a1a1a', 
              padding: `${navPaddingY}px ${navPaddingX + navTailWidth * 0.4}px ${navPaddingY}px ${navPaddingX}px`,
              border: 'none',
              borderRadius: `${navBorderRadius}px`,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              clipPath: `polygon(0 0, calc(100% - ${navTailWidth}px) 0, 100% 50%, calc(100% - ${navTailWidth}px) 100%, 0 100%)`,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontSize: `${navFontSize}px`,
              boxShadow: navShadow,
              ...buttonStyle,
            }}
            aria-label={fieldTypeDisplay}
          >
            {buttonText}
          </button>
        );
      })()}
      </div>

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
          onSignatureSaved={(signatureUrl: string) => {
            setRecipientSignature(signatureUrl);
          }}
          onSaveSign={(fieldId: string, signatureUrl: string, fieldRemmaning:boolean) => {
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
              if(fieldRemmaning===false){
                navigate("/e-sign/signer/thank-you");
              }
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

