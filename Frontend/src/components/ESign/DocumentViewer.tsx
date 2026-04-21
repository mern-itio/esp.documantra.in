import { Document, Page, pdfjs } from "react-pdf";
import React, { useEffect, useLayoutEffect, useRef, useState, useMemo } from "react";
import Modal from "react-modal";
import SignPad from "./SignPad";
import { eSignApi } from "../../services/apiHelper";
import type { SignerData, ActiveField } from "../../types/documentTypes";
import confetti from "canvas-confetti";
import { Link, useNavigate } from "react-router-dom";
import { Upload, Stamp as StampIcon, X, Pencil, Check, ChevronDown, ArrowUp } from "lucide-react";
import { toTitleCase } from "../../utils/formatName";

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
  /** When true (e.g. CC recipient), all signing and form fields are view-only */
  isViewOnly?: boolean;
  /** Called when current recipient completes all required signing actions (fieldRemmaning === false) */
  onRecipientComplete?: () => void;
  /** Opens the terms/conditions modal (with the same options dropdown) */
  onRequestActions?: () => void;
  signatureProvider:string
  signatureMethod:string
}

Modal.setAppElement("#root");

const BASE_PAGE_WIDTH = 800;
const MIN_FIELD_WIDTH = 16;
const MIN_FIELD_HEIGHT = 14;

// Mode constants
const MODE = {
  SELF_SIGNER: "1",
  RECIPIENT: "0"
} as const;

type SigningMode = typeof MODE.SELF_SIGNER | typeof MODE.RECIPIENT;

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

/** Stable Mongo/ObjectId string for keys (module scope so PDF subtree helpers don't close over stale state). */
const normalizeMongoId = (id: any) => {
  if (id == null) return "";
  if (typeof id === "string") return id;
  if (typeof id === "object" && (id as any).$oid) return String((id as any).$oid);
  return String(id);
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
  setSignatureFields,
  isViewOnly = false,
  onRecipientComplete,
  onRequestActions,
  signatureProvider,
  signatureMethod
}) => {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const selfValue = urlParams.get("self");
  const mode: SigningMode = (selfValue === MODE.SELF_SIGNER ? MODE.SELF_SIGNER : MODE.RECIPIENT) as SigningMode;

  // ==================== MODE-SPECIFIC HELPER FUNCTIONS ====================
  
  // Get initial signature based on mode
  const getInitialSignature = (): string | null => {
    switch (mode) {
      case MODE.SELF_SIGNER:
        // Will be set after selfSigner loads
        return null;
      case MODE.RECIPIENT:
        return allRecipients?.find(r => r.id === currentUserId)?.signature || null;
      default:
        return null;
    }
  };
  async function postRedirect(url:any, txnRef:any) {
   const form = window.document.createElement("form");
   form.method = "POST";
   form.action = url;

   const input = window.document.createElement("input");
   input.type = "hidden";
   input.name = "txnref";
   input.value = txnRef;

   form.appendChild(input);
   window.document.body.appendChild(form);
   form.submit();
  }
  async function completeSignature(envelopeID:any, currentUserId:any){

    const env = String(envelopeID ?? "");
    const rid = String(currentUserId ?? "");
    const response = await eSignApi.post('/api/e-sign/public/signature-complete',{
      envelopeId:envelopeID,
      currentUserId:currentUserId,
      selfValue:selfValue
    });
    if(response?.status == 200 ){
       navigate(`/e-sign/signer/status/${env}/${rid}`);
    }
  }

  // Get matched signer for a field (self-signer mode only)
  const getMatchedSigner = (field: any) => {
    if (mode !== MODE.SELF_SIGNER) return null;
    return (selfSigner || []).find((s: any) => s && s.signerSlotId === field.slotId);
  };

  // Get matched recipient for a field (recipient mode only)
  const getMatchedRecipient = (field: any) => {
    if (mode !== MODE.RECIPIENT) return null;
    return allRecipients?.find((r: any) => r.id === field.recipientId);
  };

  // Check if current user owns this field
  const isFieldForCurrentUser = (field: any): boolean => {
    switch (mode) {
      case MODE.SELF_SIGNER: {
        const matchedSigner = getMatchedSigner(field);
        return matchedSigner ? matchedSigner._id?.toString?.() === currentUserId?.toString?.() : false;
      }
      case MODE.RECIPIENT:
        return field.recipientId === currentUserId;
      default:
        return false;
    }
  };

  // Check if signature field is completed
  const isSignatureFieldCompleted = (field: any): boolean => {
    switch (mode) {
      case MODE.SELF_SIGNER: {
        const matchedSigner = getMatchedSigner(field);
        if (!matchedSigner) return false;
        
        // Check signatureFields array to see if this specific field is signed
        if (matchedSigner.signatureFields && Array.isArray(matchedSigner.signatureFields)) {
          const fieldEntry = matchedSigner.signatureFields.find(
            (sf: any) => sf.fieldId && (sf.fieldId.toString() === (field._id || field.fieldId)?.toString())
          );
          return fieldEntry ? fieldEntry.state === 'signed' : false;
        }
        // Fallback: check if signature exists in selfSigner
        return !!matchedSigner.signature;
      }
      case MODE.RECIPIENT: {
        const fieldKey = field._id || field.fieldId;
        return !!field.signature || !!localSignedMap[fieldKey];
      }
      default:
        return false;
    }
  };

  // Get initials value for a field
  const getInitialsValue = (field: any): string => {
    switch (mode) {
      case MODE.SELF_SIGNER: {
        const matchedSigner = getMatchedSigner(field);
        return matchedSigner?.initials || "";
      }
      case MODE.RECIPIENT: {
        const recipient = getMatchedRecipient(field);
        return recipient?.initials || "";
      }
      default:
        return "";
    }
  };

  // Get field value ONLY from matchedSigner.nonSignatureFields array
  const getFieldValueFromNonSignatureFields = (field: any, matchedSigner: any): any => {
    if (!matchedSigner || !matchedSigner.nonSignatureFields || !Array.isArray(matchedSigner.nonSignatureFields)) {
      return undefined;
    }
    
    const fieldId = field._id || field.fieldId;
    if (!fieldId) return undefined;
    
    // Find the entry in nonSignatureFields array that matches this field
    const fieldEntry = matchedSigner.nonSignatureFields.find(
      (nf: any) => nf && nf.fieldId && (nf.fieldId.toString() === fieldId.toString() || nf.fieldId._id?.toString() === fieldId.toString())
    );
    
    return fieldEntry ? fieldEntry.value : undefined;
  };

  const [recipientSignature, setRecipientSignature] = useState<string | null>(getInitialSignature());
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rawData = params.get("data");
    if (!rawData) return;
    const data = JSON.parse(decodeURIComponent(rawData));
    const response = {
      data
    };
    console.log(response);
    handleSuccess(response,data?.fieldId);

}, []);

  // Update signature when data changes based on mode
  useEffect(() => {
    switch (mode) {
      case MODE.RECIPIENT: {
        const sig = allRecipients?.find(r => r.id === currentUserId)?.signature || null;
        setRecipientSignature(sig);
        break;
      }
      case MODE.SELF_SIGNER:
        // Handled in separate useEffect below
        break;
    }
  }, [allRecipients, currentUserId, mode]);

  const [activeField, setActiveField] = useState<ActiveField | null>(null);
  const [isEditingSignature, setIsEditingSignature] = useState<boolean>(false);
  const [selfSigner, setSelfSigner] = useState<SignerData[]>([]);
  const [showCompleteButton, setShowCompleteButton] = useState(false);
  const [completeCtaState, setCompleteCtaState] = useState<"idle" | "done">("idle");
  const [isCompleteCtaGuidanceDismissed, setIsCompleteCtaGuidanceDismissed] = useState(false);
  const shouldHighlightCompleteCta =
    !isViewOnly &&
    showCompleteButton &&
    completeCtaState === "idle" &&
    !isCompleteCtaGuidanceDismissed;

  useEffect(() => {
    if (showCompleteButton && completeCtaState === "idle") {
      setIsCompleteCtaGuidanceDismissed(false);
    }
  }, [showCompleteButton, completeCtaState]);

  // ==================== CC / View-only Audit Trail ====================
  const [auditTrailOpen, setAuditTrailOpen] = useState(false);
  const [auditTrailLoading, setAuditTrailLoading] = useState(false);
  const [auditTrailError, setAuditTrailError] = useState<string | null>(null);
  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const auditTrailFetchedKeyRef = useRef<string | null>(null);

  // Aadhaar modal states
  const [showAadhaarModal, setShowAadhaarModal] = useState(false);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarError, setAadhaarError] = useState('');
  const [_aadhaarSaved, setAadhaarSaved] = useState(false);
  const [aadhaarSaving, setAadhaarSaving] = useState(false);
  const [pendingField, setPendingField] = useState<any>(null);

  const openAuditTrailModal = async () => {
    if (!isViewOnly) return;
    if (!envelopeID || !currentUserId) return;

    const key = `${envelopeID}:${currentUserId}`;
    setAuditTrailOpen(true);

    if (auditTrailFetchedKeyRef.current === key) return;

    setAuditTrailLoading(true);
    setAuditTrailError(null);
    try {
      const response = await eSignApi.get(
        `/api/e-sign/public/envelope/${envelopeID}/recipient/${currentUserId}/audit-trail`
      );
      const data =
        response?.data?.auditTrail ??
        response?.data?.data?.auditTrail ??
        response?.data?.data ??
        [];
      setAuditTrail(Array.isArray(data) ? data : []);
      auditTrailFetchedKeyRef.current = key;
    } catch (err: any) {
      setAuditTrail([]);
      setAuditTrailError(
        err?.response?.data?.message || err?.message || 'Failed to load audit trail'
      );
    } finally {
      setAuditTrailLoading(false);
    }
  };
  
  // Update signature when selfSigner changes (self-signer mode)
  // Skip this update if we're currently refreshing to avoid re-render loops
  useEffect(() => {
    switch (mode) {
      case MODE.SELF_SIGNER: {
        if (selfSigner.length > 0 && !isRefreshingSelfSignerRef.current) {
          const matchedSigner = selfSigner.find(
            (s: any) => s && s._id?.toString?.() === currentUserId?.toString?.()
          );
          if (matchedSigner?.signature) {
            setRecipientSignature(matchedSigner.signature);
          }
          
          // Clear cached values for initial fields when selfSigner updates (so updated initials are shown)
          const initialFields = signatureFields.filter((f: any) => f.type === "initial");
          initialFields.forEach((field: any) => {
            const keyId = field._id || field.fieldId;
            if (keyId) {
              // Clear from ref so it re-evaluates with updated initials
              delete fieldValuesRef.current[keyId];
              // Remove from auto-filled set
              autoFilledDateFieldsRef.current.delete(keyId);
            }
          });
        }
        break;
      }
      case MODE.RECIPIENT:
        // Handled in separate useEffect above
        break;
    }
  }, [selfSigner, currentUserId, mode, signatureFields]);
  
  // Clear cached values for initial fields when allRecipients updates (recipient mode)
  useEffect(() => {
    switch (mode) {
      case MODE.RECIPIENT: {
        if (allRecipients) {
          const initialFields = signatureFields.filter((f: any) => f.type === "initial");
          initialFields.forEach((field: any) => {
            const keyId = field._id || field.fieldId;
            if (keyId) {
              // Clear from ref so it re-evaluates with updated initials
              delete fieldValuesRef.current[keyId];
              // Remove from auto-filled set
              autoFilledDateFieldsRef.current.delete(keyId);
            }
          });
        }
        break;
      }
      case MODE.SELF_SIGNER:
        // Handled in separate useEffect above
        break;
    }
  }, [allRecipients, mode, signatureFields]);
  
  const [_isLoading, setIsLoading] = useState(mode === MODE.SELF_SIGNER);
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
  const [signingStatusText, setSigningStatusText] = useState<string>("Finalizing document...");
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  // Use refs to store values without causing re-renders
  const fieldValuesRef = useRef<Record<string, any>>({});
  const autoFilledDateFieldsRef = useRef<Set<string>>(new Set());

  // PDF.js worker setup
  useEffect(() => {
    switch (mode) {
      case MODE.SELF_SIGNER:
        getSelfSigner();
        break;
      case MODE.RECIPIENT:
        // No initialization needed
        break;
    }
    
    if (typeof window !== "undefined") {
      try {
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      } catch (err) {
        console.warn("Failed to set PDF.js worker:", err);
      }
    }
  }, [mode]);

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
  const buttonUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastButtonPositionRef = useRef<{ top: number; left: number } | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNavigatingRef = useRef<boolean>(false);
  const isRefreshingSelfSignerRef = useRef<boolean>(false);
  const pendingNavigationRef = useRef<boolean>(false);

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

  // Check mode-specific data sources
  switch (mode) {
    case MODE.SELF_SIGNER: {
      const matched = getMatchedSigner(f);
      if (matched) {
        const val = getFieldValueFromNonSignatureFields(f, matched);
        if (f.type === "checkbox") return !!val;
        return val !== undefined && val !== null && String(val).trim().length > 0;
      }
      break;
    }
    case MODE.RECIPIENT:
      // Backend-provided default
      if (f.signature !== undefined && f.signature !== null) {
        return String(f.signature).trim().length > 0;
      }
      break;
  }

  // backend-provided default fallback
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

// returns true only if ALL non-signature fields for that slot (self-signer mode) are filled
const areAllNonSignatureFieldsFilledForSlot = (slotId: string) => {
  if (!slotId) return true;
  const fields = signatureFields.filter((ff: any) => ff.type !== "signature" && ff.slotId === slotId);
  if (fields.length === 0) return true; // no other fields => allow signing
  return fields.every(isFieldFilled);
};
// Submit non-signature fields 
// call after you setValue(..., true) (i.e., onBlur / onChange)
const submitSingleField = async (recipientId: string, fieldId: string, value: any) => {
  if (!recipientId || value == null) return;
  const fieldIdStr = normalizeMongoId(fieldId);
  if (!fieldIdStr) return;

  const payload = {
    envelopeID,
    recipientId,
    fields: { fieldId: fieldIdStr, value },
    selfValue: mode === MODE.SELF_SIGNER ? "1" : "0",
    cycleId: mode === MODE.SELF_SIGNER ? cycleId : undefined,
  };

  try {
    const response = await eSignApi.post('/api/e-sign/public/save-non-signature-field', payload);
    console.log("Field submitted:", response);

    // Update signatureFields to trigger actionableFields recompute
    setSignatureFields(prev => prev.map(f => 
      normalizeMongoId(f._id || f.fieldId) === fieldIdStr ? { ...f, signature: value } : f
    ));

    // For self-signer mode, refresh selfSigner data to get updated nonSignatureFields
    if (mode === MODE.SELF_SIGNER && cycleId) {
      setTimeout(() => {
        getSelfSigner();
      }, 300);
    }

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
    
    // Check mode-specific data sources
    switch (mode) {
      case MODE.SELF_SIGNER: {
        const matched = getMatchedSigner(field);
        if (matched) {
          const v = getFieldValueFromNonSignatureFields(field, matched);
          if (field.type === 'checkbox') return !!v;
          return v !== undefined && v !== null && String(v).trim().length > 0;
        }
        break;
      }
      case MODE.RECIPIENT:
        // Backend default value
        if (field.signature !== undefined && field.signature !== null) {
          return String(field.value).trim().length > 0;
        }
        break;
    }
    
    return false;
  };

  // build actionable (user-specific) fields (signature + other inputs)
  const actionableFields = useMemo(() => {
    if (isViewOnly || !signatureFields || !Array.isArray(signatureFields)) return [];
    return signatureFields
      .map((f) => ({ ...f, pageNum: normalizePage(f) }))
      .filter((field) => {
        // Determine if current user needs to act on this field
        const isCurrentUser = isFieldForCurrentUser(field);
        let isCompleted = false;

        switch (mode) {
          case MODE.SELF_SIGNER: {
            if (field.type === 'signature') {
              // In self-signer mode, exclude signature fields until all non-signature fields for that slot are filled
              const allFilled = areAllNonSignatureFieldsFilledForSlot(field.slotId);
              if (!allFilled) {
                // Don't include signature field in actionableFields if non-signature fields aren't all filled
                return false;
              }
              isCompleted = isSignatureFieldCompleted(field);
            } else {
              isCompleted = isNonSignatureCompleted(field);
            }
            break;
          }
          case MODE.RECIPIENT: {
            if (field.type === 'signature') {
              // In regular mode, exclude signature fields until all non-signature fields for that recipient are filled
              const allFilled = areAllNonSignatureFieldsFilledForRecipient(field.recipientId);
              if (!allFilled) {
                // Don't include signature field in actionableFields if non-signature fields aren't all filled
                return false;
              }
              isCompleted = isSignatureFieldCompleted(field);
            } else {
              isCompleted = isNonSignatureCompleted(field);
            }
            break;
          }
        }
        return isCurrentUser && !isCompleted;
      })
      .sort((a, b) => {
        // In regular mode, prioritize non-signature fields first, then signature fields
        switch (mode) {
          case MODE.RECIPIENT:
            if (a.type === 'signature' && b.type !== 'signature') return 1;
            if (a.type !== 'signature' && b.type === 'signature') return -1;
            break;
          case MODE.SELF_SIGNER:
            // No special sorting for self-signer mode
            break;
        }
        // Then sort by page number
        return a.pageNum - b.pageNum;
      });
  }, [signatureFields, selfSigner, mode, currentUserId, localSignedMap, localFieldValues, isViewOnly]);

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
      let firstField = actionableFields[0];
      
      switch (mode) {
        case MODE.RECIPIENT: {
          // In regular mode, find first non-signature field if available
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
          break;
        }
        case MODE.SELF_SIGNER: {
          setCurrentActionableIndex(0);
          currentFieldIdRef.current = firstField._id || firstField.fieldId;
          break;
        }
      }
      
      setHasAutoOpened(true);
      // Center the first actionable field in view (but don't open sign pad)
      setTimeout(() => {
        scrollToFieldElement(firstField._id || firstField.fieldId);
      }, 80);
    }
    // Check actionableFields.length but only trigger once via hasAutoOpened guard
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionableFields.length, hasAutoOpened, mode]);

  // click-to-sign behavior removed dependency on page concept; keep disabled to avoid unintended opens on scroll viewport clicks

  const handleFieldClick = (fieldOrId: any, options?: { isEdit?: boolean }) => {
    if (isViewOnly) {
      // CC recipients are view-only: show recipient reassignment/audit timeline.
      openAuditTrailModal();
      return;
    }
    let field = fieldOrId;
    if (typeof fieldOrId === "string") {
      field =
        signatureFields.find(
          (f: any) => (f._id || f.fieldId)?.toString?.() === fieldOrId
        ) || null;
    }
    if (!field) return;

    setIsEditingSignature(!!options?.isEdit);

    const af: ActiveField = {
      ...field,
      status: "pending",
    };
    const idx = actionableFields.findIndex(
      (candidate) =>
        candidate._id === field._id || candidate.fieldId === field.fieldId
    );
    if (idx >= 0) setCurrentActionableIndex(idx);
    setActiveField(af);
  };

  const getSelfSigner = async (): Promise<void> => {
    // Prevent multiple simultaneous calls
    if (isRefreshingSelfSignerRef.current) {
      return Promise.resolve();
    }
    
    try {
      isRefreshingSelfSignerRef.current = true;
      setIsLoading(true);
      if (!cycleId) {
        console.warn("No cycleId provided");
        return Promise.resolve();
      }
      const response = await eSignApi.get(
        `/api/e-sign/public/envelope/self-signer/${cycleId}`
      );
      if (response?.data?.selfSigner) {
        const validSigners = response.data.selfSigner.filter(
          (signer: SignerData) =>
            signer && typeof signer === "object" && signer.signerSlotId
        );
        // Batch state update
        setSelfSigner(validSigners);
      } else {
        setSelfSigner([]);
      }
    } catch (err) {
      console.error("Failed to load self-signer data:", err);
      setSelfSigner([]);
    } finally {
      setIsLoading(false);
      // Allow useEffect to run after a short delay
      setTimeout(() => {
        isRefreshingSelfSignerRef.current = false;
        
        // If navigation was pending, trigger it now
        if (pendingNavigationRef.current) {
          pendingNavigationRef.current = false;
          setTimeout(() => {
            goToNext();
          }, 100);
        }
      }, 100);
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
    
    switch (mode) {
      case MODE.RECIPIENT: {
        if (prioritizeNonSignature) {
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
            
            const isCompleted = isSignatureFieldCompleted(field);
            
            if (!isCompleted) {
              return idx;
            }
          }
        } else {
          // Search forward from startIndex
          for (let i = 0; i < actionableFields.length; i++) {
            const idx = (startIndex + i) % actionableFields.length;
            const field = actionableFields[idx];
            
            if (!field) continue;
            
            const isCompleted = field.type === 'signature' 
              ? isSignatureFieldCompleted(field)
              : isNonSignatureCompleted(field);
            
            if (!isCompleted) {
              return idx;
            }
          }
        }
        break;
      }
      case MODE.SELF_SIGNER: {
        // Self mode: search forward from startIndex
        for (let i = 0; i < actionableFields.length; i++) {
          const idx = (startIndex + i) % actionableFields.length;
          const field = actionableFields[idx];
          
          if (!field) continue;
          
          const isCompleted = field.type === 'signature' 
            ? isSignatureFieldCompleted(field)
            : isNonSignatureCompleted(field);
          
          if (!isCompleted) {
            return idx;
          }
        }
        break;
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
      let firstIncomplete: number | null = null;
      
      switch (mode) {
        case MODE.RECIPIENT:
          // In regular mode, prioritize non-signature fields first
          firstIncomplete = findNextIncompleteField(0, true);
          break;
        case MODE.SELF_SIGNER:
          firstIncomplete = findNextIncompleteField(0);
          break;
      }
      
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
      if (currentField.type === 'signature') {
        isCurrentCompleted = isSignatureFieldCompleted(currentField);
      } else {
        isCurrentCompleted = isNonSignatureCompleted(currentField);
      }
    } else {
      // Current field doesn't exist in actionableFields, so it's completed
      isCurrentCompleted = true;
    }
    
    // Find next incomplete field based on mode
    switch (mode) {
      case MODE.RECIPIENT: {
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
        break;
      }
      case MODE.SELF_SIGNER: {
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
        break;
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
    if(signatureMethod=="aadhaarSignature"){
      const response = await checkRecipientRequireDetails(currentUserId);
      if(response?.status==200 && response?.data?.data?.flag === false){
        setPendingField(field);
        setShowAadhaarModal(true);
        return;
      }
    }
    const fieldKeyRaw = field?._id || field?.fieldId;
    const fieldKey = normalizeMongoId(fieldKeyRaw);
    if (fieldKey) setSigningFieldIds((prev) => ({ ...prev, [fieldKey]: true }));
    const clearSigningState = () => {
      if (!fieldKey) return;
      setSigningFieldIds((prev) => {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
    };

    // Keep the user engaged for long-running finalize (stamp/image embedding + emails + certificate)
    setSigningStatusText("Finalizing document...");
    const startedAt = Date.now();
    const statusTicker = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      if (elapsed < 4000) setSigningStatusText("Validating your details...");
      else if (elapsed < 12000) setSigningStatusText("Applying your signature...");
      else if (elapsed < 25000) setSigningStatusText("Finalizing document...");
      else if (elapsed < 60000) setSigningStatusText("Finalizing and sending emails...");
      else setSigningStatusText("Still working… almost done.");
    }, 1200);

    const waitForCompletion = async (maxMs = 120000) => {
      const until = Date.now() + maxMs;
      while (Date.now() < until) {
        try {
          const res = await eSignApi.get(`/api/e-sign/public/envelope/${envelopeID}`);
          const status = (res?.data?.data?.status || '').toString().toLowerCase();
          if (status === 'completed') return true;
        } catch {
          // ignore - best effort
        }
        await new Promise((r) => setTimeout(r, 2500));
      }
      return false;
    };
    try{
      console.log(field);
      const certificateId = await issueCertificate(currentUserId, envelopeID, selfValue);
      
      // Get initials from recipient or selfSigner based on mode
      let initialsValue = "";
      let signerName = "John Doe"; // default name
      switch (mode) {
        case MODE.SELF_SIGNER: {
          const matchedSigner = selfSigner.find(
            (s: any) => s && s._id?.toString?.() === currentUserId?.toString?.()
          );
          if (matchedSigner) {
            initialsValue = (matchedSigner as any).initials || "";
            signerName = (matchedSigner as any)?.data?.name || "John Doe";
            console.log(signerName);
          }
          break;
        }
        case MODE.RECIPIENT: {
          const recipient = allRecipients?.find(r => r.id === currentUserId);
          if (recipient) {
            initialsValue = recipient.initials || "";
          }
          break;
        }
      }
      
      const payload = {
        fieldId: fieldKey,
        signatureImageBase64: recipientSignature,
        envelopeId: envelopeID || "",
        documentId:field?.documentId,
        recipientId: currentUserId,
        certificateId, 
        signerName: signerName,
        selfValue: selfValue || "",
        cycleId:cycleId || "",
        initials: initialsValue || undefined,
        mode,
        signatureMethod,
        signatureProvider
      };
      // Allow long finalize (stamp embedding + certificate + emails)
      const response = await eSignApi.post("/api/e-sign/public/add-signature", payload, { timeout: 180000 });
      if (response?.status === 200) {
        if(response?.data?.signMethod == "V_Sign"){
          await postRedirect(response?.data?.authUrl, response?.data?.txnRef);
        }else{
          await handleSuccess(response,fieldKey);
        }
      }else{
        console.error("submit response:", response);
        // If server responded oddly, verify completion before showing error
        const completed = await waitForCompletion(45000);
        if (!completed) {
          if (isMountedRef.current) alert("Failed to submit signature. Please try again.");
        }
      }
    }catch (err){
      console.error("submit error:", err);
      // If request timed out / disconnected but backend completed, don't show error.
      const completed = await waitForCompletion(60000);
      if (!completed) {
        if (isMountedRef.current) alert("An error occurred while submitting the signature.");
      }
    } finally {
      window.clearInterval(statusTicker);
      if (isMountedRef.current) setSigningStatusText("Finalizing document...");
      clearSigningState();
    }
  };
  async function checkRecipientRequireDetails(currentUserId:any){
    const response = await eSignApi.post('/api/e-sign/public/recipients/validate',{
      signatureMethod:signatureMethod,
      currentUserId:currentUserId,
      selfValue
    });
    if(response.status==200){
      return response;
    }
  }

  const handleAadhaarSubmit = async () => {
    // Validation
    if (!aadhaarNumber || aadhaarNumber.length !== 12 || !/^\d+$/.test(aadhaarNumber)) {
      setAadhaarError('Please enter a valid 12-digit Aadhaar number.');
      return;
    }
    setAadhaarError('');
    setAadhaarSaving(true);

    try {
      // Assume API to save Aadhaar
      const response = await eSignApi.post('/api/e-sign/public/save-aadhaar', {
        aadhaarNumber,
        currentUserId,
        envelopeID,
        selfValue
      });
      if (response?.status === 200) {
        setAadhaarSaved(true);
        setShowAadhaarModal(false);
        setAadhaarNumber('');
        // Proceed with signing
        const field = pendingField;
        setPendingField(null);
        doSign(field);
      } else {
        setAadhaarError('Failed to save Aadhaar number. Please try again.');
      }
    } catch (err) {
      console.error('Error saving Aadhaar:', err);
      setAadhaarError('An error occurred. Please try again.');
    } finally {
      setAadhaarSaving(false);
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
    // Don't make any changes if user is typing, we're navigating, or refreshing selfSigner
    if (isUserTypingRef.current || isNavigatingRef.current || isRefreshingSelfSignerRef.current) {
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
      let nextIncomplete: number | null = null;
      switch (mode) {
        case MODE.RECIPIENT:
          nextIncomplete = findNextIncompleteField(0, true);
          break;
        case MODE.SELF_SIGNER:
          nextIncomplete = findNextIncompleteField(0);
          break;
      }
      
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
  async function handleSuccess(response:any,fieldKey:any){
    const key = fieldKey;
        setLocalSignedMap((p) => ({ ...(p || {}), [key]: recipientSignature }));
        triggerConfetti();
        
        // Handle post-signature navigation based on mode
        switch (mode) {
          case MODE.SELF_SIGNER: {
            if (cycleId) {
              // Mark navigation as pending
              pendingNavigationRef.current = true;
              // Wait a bit for the backend to update, then refresh
              setTimeout(() => {
                getSelfSigner();
                // Navigation will be triggered in getSelfSigner's finally block
              }, 500);
            }
            break;
          }
          case MODE.RECIPIENT: {
            // Recipient mode: navigate to next field
            setTimeout(() => {
              goToNext();
            }, 300);
            break;
          }
        }
        
        if (response?.data?.fieldRemmaining === false) {
          if (mode === MODE.RECIPIENT) {
            try {
              onRecipientComplete?.();
            } catch (err) {
              console.error('onRecipientComplete callback error:', err);
            }
          }
          setShowCompleteButton(true);
          // If parent provided a completion handler, it controls what happens next.
          // Fallback to legacy thank-you navigation when no callback is provided.
          if (!onRecipientComplete) {
            navigate("/e-sign/signer/thank-you");
          }
        }
  }

  // PDF stack for one file: must keep a stable component type (useMemo), not a nested `const X = () =>`,
  // or react-pdf <Document> remounts on every parent re-render (e.g. signing progress text).
  type SingleDocRenderProps = {
    doc: any;
    mode: SigningMode;
    signatureFields: any[];
    currentUserId: string;
    selfValue: string | null;
    selfSigner: any[];
    localSignedMap: Record<string, string>;
    recipientSignature: string | null;
    onFieldClick: (field: any, options?: { isEdit?: boolean }) => void;
    normalizePage: (field: any) => number;
    pageWidth: number;
    pageScale: number;
    signingFieldIds: Record<string, boolean>;
    signingStatusText: string;
    isViewOnly?: boolean;
    isFieldForCurrentUser: (field: any) => boolean;
    isSignatureFieldCompleted: (field: any) => boolean;
    getMatchedSigner: (field: any) => any;
    areAllNonSignatureFieldsFilledForSlot: (slotId: string) => boolean;
    areAllNonSignatureFieldsFilledForRecipient: (recipientId: string) => boolean;
    doSign: (field: any) => void | Promise<void>;
    openAuditTrailModal: () => void;
    getInitialsValue: (field: any) => string;
    getFieldValueFromNonSignatureFields: (field: any, matchedSigner: any) => any;
    fieldValuesRef: React.MutableRefObject<Record<string, any>>;
    localFieldValues: Record<string, any>;
    setLocalFieldValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
    submitSingleField: (recipientId: string, fieldId: string, value: any) => void | Promise<void>;
    autoFilledDateFieldsRef: React.MutableRefObject<Set<string>>;
    pdfContainerRef: React.RefObject<HTMLDivElement | null>;
    scrollPositionRef: React.MutableRefObject<number>;
    shouldPreserveScrollRef: React.MutableRefObject<boolean>;
    isUserTypingRef: React.MutableRefObject<boolean>;
    activeInputRef: React.MutableRefObject<HTMLInputElement | null>;
    activeInputIdRef: React.MutableRefObject<string | null>;
  };

  const SingleDoc = useMemo(() => {
    return function SingleDocInner(props: SingleDocRenderProps) {
      const {
        doc,
        mode,
        signatureFields,
        currentUserId,
        selfValue: _selfValue,
        selfSigner: _selfSigner,
        localSignedMap,
        recipientSignature,
        onFieldClick,
        normalizePage,
        pageWidth,
        pageScale,
        signingFieldIds,
        signingStatusText,
        isViewOnly = false,
        isFieldForCurrentUser,
        isSignatureFieldCompleted,
        getMatchedSigner,
        areAllNonSignatureFieldsFilledForSlot,
        areAllNonSignatureFieldsFilledForRecipient,
        doSign,
        openAuditTrailModal,
        getInitialsValue,
        getFieldValueFromNonSignatureFields,
        fieldValuesRef,
        localFieldValues,
        setLocalFieldValues,
        submitSingleField,
        autoFilledDateFieldsRef,
        pdfContainerRef,
        scrollPositionRef,
        shouldPreserveScrollRef,
        isUserTypingRef,
        activeInputRef,
        activeInputIdRef,
      } = props;
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
                        const isCurrentUser = isFieldForCurrentUser(field);
                        let isSigned = false;
                        let signedImage: string | null = null;

                        const getFieldAssignee = () => {
                          // Show assignee metadata in preview/read-only mode (like signing editor).
                          if (!isViewOnly) return null;

                          if (mode === MODE.RECIPIENT) {
                            const rec = (allRecipients || []).find((r: any) => {
                              const rid = normalizeMongoId(r?.id ?? r?._id);
                              return rid && rid === normalizeMongoId(field?.recipientId);
                            });
                            if (rec) {
                              return {
                                name: rec.name || "Recipient",
                                email: rec.email || "",
                              };
                            }
                          }

                          if (mode === MODE.SELF_SIGNER) {
                            const signer = getMatchedSigner(field);
                            const data = signer?.data || {};
                            return {
                              name: data?.name || signer?.name || "Signer",
                              email: data?.email || signer?.email || "",
                            };
                          }

                          return null;
                        };

                        const assignee = getFieldAssignee();

                        if (isSignatureType) {
                          isSigned = isSignatureFieldCompleted(field);
                          switch (mode) {
                            case MODE.SELF_SIGNER: {
                              const matched = getMatchedSigner(field);
                              signedImage = matched?.signature ?? null;
                              break;
                            }
                            case MODE.RECIPIENT: {
                              const fieldKey = normalizeMongoId(field._id || field.fieldId);
                              signedImage = localSignedMap[fieldKey] || field.signature || null;
                              break;
                            }
                          }
                        }

                        const keyId = normalizeMongoId(field._id || field.fieldId);
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
                          12,
                          Math.min(18, scaledHeight * 0.25)
                        );
                        // const labelFontSize = Math.max(
                        //   4.5,
                        //   Math.min(9, 8 * pageScale)
                        // );
                        const fieldFontSize = Math.max(
                         4.5,
                          Math.min(11, 11 * pageScale)
                        );
                        const boxPaddingY = Math.max(4, 12 * pageScale);
                        const boxPaddingX = Math.max(6, 14 * pageScale);
                        // const labelTop = scaledHeight + 2;

                        // recipient display (best-effort)
                        // const recipientDisplay = (() => {
                        //   switch (mode) {
                        //     case MODE.SELF_SIGNER: {
                        //       const matched = getMatchedSigner(field);
                        //       if (matched) {
                        //         const matchedAny = matched as any;
                        //         const primary =
                        //           matchedAny?.data?.name || matchedAny?.name || matchedAny?.data?.email;
                        //         const secondary =
                        //           matched?.data?.name && matched?.data?.email
                        //             ? matched.data.email
                        //             : undefined;
                        //         return {
                        //           primary: primary || "Recipient",
                        //           secondary,
                        //           decorated: true,
                        //         };
                        //       }
                        //       break;
                        //     }
                        //     case MODE.RECIPIENT: {
                        //       const recipient = getMatchedRecipient(field);
                        //       if (recipient) {
                        //         return {
                        //           primary: recipient.name || recipient.email || "Recipient",
                        //           secondary:
                        //             recipient.name && recipient.email ? recipient.email : undefined,
                        //           decorated: true,
                        //         };
                        //       }
                        //       if (
                        //         field.recipientId &&
                        //         String(field.recipientId) === String(currentUserId)
                        //       ) {
                        //         return {
                        //           primary: "You",
                        //           decorated: false,
                        //         };
                        //       }
                        //       break;
                        //     }
                        //   }
                        //   return {
                        //     primary: "Recipient",
                        //     decorated: false,
                        //   };
                        // })();
                        // const recipientSecondaryFont = Math.max(
                        //   4,
                        //   Math.min(labelFontSize - 1, labelFontSize * 0.95)
                        // );
                        // const recipientBadgePaddingY = Math.max(2, 6 * pageScale);
                        // const recipientBadgePaddingX = Math.max(3, 10 * pageScale);
                        // const recipientBadgeRadius = Math.max(3, 8 * pageScale);
                        // const recipientBadgeGap = Math.max(1, 4 * pageScale);

                        if (isSignatureType) {
                          // Mode-aware check: use slotId for self-signer, recipientId for recipient mode
                          let allFilled = true;
                          switch (mode) {
                            case MODE.SELF_SIGNER: {
                              allFilled = areAllNonSignatureFieldsFilledForSlot(field.slotId);
                              break;
                            }
                            case MODE.RECIPIENT: {
                              allFilled = areAllNonSignatureFieldsFilledForRecipient(field.recipientId);
                              break;
                            }
                          }
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
                                  // In CC view-only we still want clicks to open audit trail.
                                  pointerEvents: isViewOnly ? "auto" : (isSigned ? "auto" : allowSigning ? "auto" : "none"),
                                  fontSize: fieldFontSize,
                                  padding: `0px ${boxPaddingX-15}px`,
                                }}
                                className={`flex items-center justify-center cursor-pointer font-semibold rounded ${isSigned
                                  ? "border-0"
                                  : isViewOnly && isCurrentUser
                                    ? "bg-gray-100 border-2 border-gray-300 text-gray-500 opacity-80 cursor-pointer"
                                  : isCurrentUser
                                    ? isSigning
                                      ? "bg-blue-100 border-2 border-blue-400 text-blue-600 cursor-progress"
                                      : "bg-blue-100 border-2 border-blue-500 text-blue-700 cursor-pointer hover:bg-blue-200"
                                    : "bg-gray-100 border-2 border-gray-300 text-gray-500 opacity-50"
                                  }`}
                                onClick={() => {
                                  if (isViewOnly) {
                                    openAuditTrailModal();
                                    return;
                                  }
                                  if (isSigning) return;
                                  if (isCurrentUser && !recipientSignature) {
                                    onFieldClick(field);
                                  } else if (isCurrentUser && recipientSignature) {
                                    doSign(field);
                                  }
                                }}

                              >
                                {isSigning ? (
                                  <div className="flex items-center gap-2">
                                    <span className="h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                    <span>{signingStatusText || "Finalizing document..."}</span>
                                  </div>
                                ) : isSigned ? (
                                  <div className="relative w-full h-full">
                                    <img
                                      src={signedImage as string}
                                      alt="Signed"
                                      className="h-full w-full object-contain rounded"
                                    />
                                    {/* Only show edit button for current user's signed fields (not for CC view-only) */}
                                    {isCurrentUser && !isViewOnly && (
                                      <button
                                        type="button"
                                        className="absolute -top-2 -right-2 flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg border-2 border-white p-1.5 hover:scale-105 focus:scale-105 transition-transform focus:outline-none"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onFieldClick(field, { isEdit: true });
                                        }}
                                        aria-label="Edit signature"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                ) : !allFilled ? (
                                  "Fill all other fields first"
                                ) : isCurrentUser && recipientSignature ? (
                                  "Click to sign"
                                ) : isCurrentUser && !recipientSignature ?(
                                  "Click to Save"
                                ):("Signature")}
                              </div>
                              {assignee && (
                                <div
                                  className="absolute left-0 right-0 text-[10px] leading-tight text-gray-700 px-1.5 py-0.5 bg-white/90 border border-gray-200 rounded mt-0.5"
                                  style={{ top: scaledHeight + 2 }}
                                >
                                  <div className="truncate font-medium">{assignee.name}</div>
                                  {assignee.email ? (
                                    <div className="truncate text-gray-500">{assignee.email}</div>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          );
                        }

                        // Non-signature field
                        const fieldLable = field.label;
                        const fieldId = field._id;

                        // Helper function to check if date label is specific (should not auto-fill)
                        const isSpecificDateLabel = (label: string | undefined): boolean => {
                          if (!label) return false;
                          const lowerLabel = label.toLowerCase().trim();
                          const specificPatterns = [
                            'dob', 'date of birth', 'birth date', 'birthday',
                            'birth date', 'date of birth', 'd.o.b', 'd.o.b.',
                            'expiry', 'expiration', 'expire date', 'expiration date',
                            'start date', 'end date', 'from date', 'to date',
                            'effective date', 'issued date', 'issue date'
                          ];
                          return specificPatterns.some(pattern => lowerLabel.includes(pattern));
                        };

                        // Helper function to get current date in YYYY-MM-DD format
                        const getCurrentDate = (): string => {
                          const today = new Date();
                          const year = today.getFullYear();
                          const month = String(today.getMonth() + 1).padStart(2, '0');
                          const day = String(today.getDate()).padStart(2, '0');
                          return `${year}-${month}-${day}`;
                        };

                        // Prefill value priority: ref (most recent) -> state -> nonSignatureFields -> field.value
                        let value: any = fieldValuesRef.current[keyId];
                        if (value === undefined) {
                          value = localFieldValues[keyId];
                        }
                        if (value === undefined) {
                          // For initial fields, check saved initials first (before generating from name)
                          if (field.type === "initial") {
                            value = getInitialsValue(field);
                          }
                          
                          // If still no value, check other sources (nonSignatureFields or field.value)
                          if (value === undefined) {
                            switch (mode) {
                              case MODE.SELF_SIGNER: {
                                const matchedSigner = getMatchedSigner(field);
                                if (matchedSigner) {
                                  value = getFieldValueFromNonSignatureFields(field, matchedSigner);
                                }
                                break;
                              }
                              case MODE.RECIPIENT: {
                                // Recipient mode: get value from field.value or field.signature
                                value = field.value ?? field.signature ?? "";
                                break;
                              }
                            }
                          }
                          if (value === undefined) value = "";
                          
                          // Auto-fill date fields with current date if empty and label is not specific
                          if (field.type === "date" && (!value || String(value).trim() === "")) {
                            if (!isSpecificDateLabel(fieldLable) && !autoFilledDateFieldsRef.current.has(keyId)) {
                              value = getCurrentDate();
                              // Mark as auto-filled to prevent re-running
                              autoFilledDateFieldsRef.current.add(keyId);
                              // Set the value in ref immediately (no re-render)
                              fieldValuesRef.current[keyId] = value;
                              
                              // Update state after render to avoid side effects during render
                              setTimeout(() => {
                                setLocalFieldValues((prev) => {
                                  // Only update if not already set to avoid unnecessary re-renders
                                  if (prev[keyId] === undefined || prev[keyId] === "" || prev[keyId] === null) {
                                    return { ...prev, [keyId]: value };
                                  }
                                  return prev;
                                });
                                
                                // Submit the auto-filled date field to backend (for both modes)
                                switch (mode) {
                                  case MODE.SELF_SIGNER:
                                    // Submit to backend so it's stored in nonSignatureFields
                                    if (field.slotId && currentUserId) {
                                      submitSingleField(currentUserId, field._id, value);
                                    }
                                    break;
                                  case MODE.RECIPIENT:
                                    // Submit the date field automatically for recipient mode
                                    if (field.recipientId) {
                                      submitSingleField(field.recipientId, field._id, value);
                                    }
                                    break;
                                }
                              }, 0);
                            }
                          }
                          
                        }
                        
                        // Check if field has a value in selfSigner.nonSignatureFields (for read-only check in self-signer mode only)
                        const hasValueInSelfSigner = mode === MODE.SELF_SIGNER && (() => {
                          const matchedSigner = getMatchedSigner(field);
                          if (matchedSigner) {
                            const fieldValue = getFieldValueFromNonSignatureFields(field, matchedSigner);
                            return fieldValue !== undefined && fieldValue !== null && String(fieldValue).trim().length > 0;
                          }
                          return false;
                        })();
                        
                        // Determine if field is completed (only for self-signer mode with values in nonSignatureFields)
                        // For recipient mode, non-signature fields are never "completed" (always editable)
                        const isFieldCompleted = (() => {
                          switch (mode) {
                            case MODE.SELF_SIGNER: {
                              // Self-signer mode: check if has value in nonSignatureFields
                              if (hasValueInSelfSigner) {
                                return true;
                              }
                              // Also check if value exists in state/ref
                              if (value !== undefined && value !== null && String(value).trim().length > 0) {
                                return field.type === 'checkbox' ? !!value : true;
                              }
                              return false;
                            }
                            case MODE.RECIPIENT: {
                              // Recipient mode: non-signature fields are never "completed" (always editable)
                              return false;
                            }
                            default:
                              return false;
                          }
                        })();

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
                              
                              switch (mode) {
                                case MODE.SELF_SIGNER:
                                  // Values are stored in nonSignatureFields via backend submission
                                  // No local updates needed - values come from nonSignatureFields
                                  break;
                                case MODE.RECIPIENT:
                                  // No additional updates needed for recipient mode
                                  break;
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

                        // In self-signer mode, if field has value in nonSignatureFields, make it read-only
                        // For recipient mode, fields are always editable if currentUser. CC (isViewOnly) = view-only
                        const editable = !isViewOnly && isCurrentUser && !(mode === MODE.SELF_SIGNER && hasValueInSelfSigner);
                        const commonBox =
                          "w-full h-full flex items-center justify-center rounded " +
                          ( (isFieldCompleted && mode === MODE.SELF_SIGNER) || isSigned ? "border-0" : editable ? "bg-blue-50 border border-blue-400 text-blue-700" : "bg-gray-100 border border-gray-300 text-gray-500 opacity-80");

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
                                      const newValue = e.target.value;
                                      e.stopPropagation();
                                      setValue(e.target.checked, true); // Checkboxes update state immediately
                                      const recipientIdForSubmit = mode === MODE.SELF_SIGNER ? currentUserId : field.recipientId;
                                      submitSingleField(recipientIdForSubmit, field._id, newValue);
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
                                    const newValue = e.target.value;
                                    setValue(newValue, true); // true = update state on blur
                                    handleBlur();
                                    const recipientIdForSubmit = mode === MODE.SELF_SIGNER ? currentUserId : field.recipientId;
                                    submitSingleField(recipientIdForSubmit, field._id, newValue);
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
                            case "initial":
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
                                    const recipientIdForSubmit = mode === MODE.SELF_SIGNER ? currentUserId : field.recipientId;
                                    submitSingleField(recipientIdForSubmit, field._id, newValue);
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
                                            // Clear immediately and persist to backend (so completion state is accurate)
                                            setValue('', true);
                                            const recipientIdForSubmit =
                                              mode === MODE.SELF_SIGNER ? currentUserId : field.recipientId;
                                            submitSingleField(recipientIdForSubmit, field._id, '');
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
                                              reader.onload = () => {
                                                const dataUrl = reader.result as string;
                                                // Update UI immediately (so preview shows without needing extra clicks)
                                                setValue(dataUrl, true);
                                                // Persist to backend so stamp counts toward completion
                                                const recipientIdForSubmit =
                                                  mode === MODE.SELF_SIGNER ? currentUserId : field.recipientId;
                                                submitSingleField(recipientIdForSubmit, field._id, dataUrl);
                                              };
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
                            onClick={() => {
                              if (isViewOnly) openAuditTrailModal();
                            }}
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
                                (isFieldCompleted && mode === MODE.SELF_SIGNER) ? (
                                  <div
                                    className={commonBox}
                                    style={{
                                      fontSize: fieldFontSize,
                                      minHeight: scaledHeight,
                                      padding: `${boxPaddingY}px ${boxPaddingX}px`,
                                    }}
                                  >
                                    {field.type === 'checkbox' ? (value ? '✓' : '') : (value || field.signature || '')}
                                  </div>
                                ) : isSigned ? (
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
                          {assignee && (
                            <div
                              className="absolute left-0 right-0 text-[10px] leading-tight text-gray-700 px-1.5 py-0.5 bg-white/90 border border-gray-200 rounded mt-0.5"
                              style={{ top: scaledHeight + 2 }}
                            >
                              <div className="truncate font-medium">{assignee.name}</div>
                              {assignee.email ? (
                                <div className="truncate text-gray-500">{assignee.email}</div>
                              ) : null}
                            </div>
                          )}
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
  }, []);

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
        <div className="pointer-events-auto fixed top-0 left-0 right-0 z-[60] flex h-12 items-center bg-[#1b0c3e] px-4 text-white">
          <div className="w-full flex items-center justify-between">
            <div className="text-sm font-medium">
              {isViewOnly ? "View only" : "Review and complete"}
            </div>

            <div className="flex items-center gap-2">
              {!isViewOnly && onRequestActions && (
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => onRequestActions?.()}
                  className="inline-flex items-center justify-center gap-2 rounded-sm bg-white px-3 py-1.5 text-sm font-semibold text-[#1b0c3e] hover:bg-white/90"
                >
                  Actions
                  <ChevronDown className="h-4 w-4" />
                </button>
              )}

              {!isViewOnly && showCompleteButton && (
                <div className={`relative ${shouldHighlightCompleteCta ? "z-[70]" : ""}`}>
                  {shouldHighlightCompleteCta && (
                    <div className="pointer-events-none absolute top-full mt-2 right-0 flex flex-col items-center rounded-full bg-amber-300 px-3 py-1.5 text-[11px] font-semibold text-[#1b0c3e] shadow-md whitespace-nowrap">
                      <ArrowUp className="h-3.5 w-3.5 animate-bounce" />
                      <span>Click here to complete signing</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (completeCtaState === "done") return;
                      completeSignature(envelopeID, currentUserId)
                      setCompleteCtaState("done");
                    }}
                    className={
                      completeCtaState === "done"
                        ? "inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white"
                        : shouldHighlightCompleteCta
                          ? "inline-flex items-center justify-center rounded-lg bg-amber-300 px-3 py-1.5 text-sm font-semibold text-[#1b0c3e] shadow-[0_0_0_3px_rgba(251,191,36,0.65)] animate-pulse"
                          : "inline-flex items-center justify-center rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-[#1b0c3e] hover:bg-white/90"
                    }
                  >
                    {completeCtaState === "done" ? (
                      <>
                        <Check className="h-4 w-4" />
                        Completed
                      </>
                    ) : (
                      "Complete"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {shouldHighlightCompleteCta && (
          <div
            className="fixed left-0 right-0 top-12 bottom-0 z-[45] bg-black/45"
            onMouseDown={() => setIsCompleteCtaGuidanceDismissed(true)}
            aria-hidden="true"
          />
        )}

      {/* PDF(s) container */}
      <div
        ref={pdfContainerRef}
        className={`relative flex-1 w-full max-w-full sm:max-w-3xl lg:max-w-4xl border border-gray-200 rounded-lg shadow-sm bg-white overflow-auto self-center mt-14 sm:mt-16 lg:mt-20 mb-20 px-3 sm:px-4 py-4 ${
          shouldHighlightCompleteCta ? "pointer-events-none" : ""
        }`}
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
                mode={mode}
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
                signingStatusText={signingStatusText}
                isViewOnly={isViewOnly}
                isFieldForCurrentUser={isFieldForCurrentUser}
                isSignatureFieldCompleted={isSignatureFieldCompleted}
                getMatchedSigner={getMatchedSigner}
                areAllNonSignatureFieldsFilledForSlot={areAllNonSignatureFieldsFilledForSlot}
                areAllNonSignatureFieldsFilledForRecipient={areAllNonSignatureFieldsFilledForRecipient}
                doSign={doSign}
                openAuditTrailModal={openAuditTrailModal}
                getInitialsValue={getInitialsValue}
                getFieldValueFromNonSignatureFields={getFieldValueFromNonSignatureFields}
                fieldValuesRef={fieldValuesRef}
                localFieldValues={localFieldValues}
                setLocalFieldValues={setLocalFieldValues}
                submitSingleField={submitSingleField}
                autoFilledDateFieldsRef={autoFilledDateFieldsRef}
                pdfContainerRef={pdfContainerRef}
                scrollPositionRef={scrollPositionRef}
                shouldPreserveScrollRef={shouldPreserveScrollRef}
                isUserTypingRef={isUserTypingRef}
                activeInputRef={activeInputRef}
                activeInputIdRef={activeInputIdRef}
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

        {/* Navigation button - positioned relative to current field (hidden for CC view-only) */}
        {(() => {
        if (isViewOnly) return null;
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
            if (currentField.type === 'signature') {
              isCurrentCompleted = isSignatureFieldCompleted(currentField);
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
          
          switch (mode) {
            case MODE.RECIPIENT:
              nextFieldIndex = findNextIncompleteField(startIdx, true);
              // If not found after current, try from the beginning
              if (nextFieldIndex === null) {
                nextFieldIndex = findNextIncompleteField(0, true);
              }
              break;
            case MODE.SELF_SIGNER:
              nextFieldIndex = findNextIncompleteField(startIdx);
              // If not found after current, try from the beginning
              if (nextFieldIndex === null) {
                nextFieldIndex = findNextIncompleteField(0);
              }
              break;
          }
        } else {
          // Not started yet - in regular mode, prioritize non-signature fields
          switch (mode) {
            case MODE.RECIPIENT:
              nextFieldIndex = findNextIncompleteField(0, true);
              break;
            case MODE.SELF_SIGNER:
              nextFieldIndex = findNextIncompleteField(0);
              break;
          }
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
              className="fixed z-30 font-medium shadow disabled:opacity-50"
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
            className="absolute z-30 font-medium shadow disabled:opacity-50"
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

      {/* SignPad Modal - never show for CC view-only */}
      {activeField && !isViewOnly && (
        <SignPad
          isSignPad={!!activeField}
          setIsSignPad={(open: boolean) => {
            if (!open){
               setActiveField(null);
               setIsEditingSignature(false);
            }
          }}
          activeField={activeField}
          currentUserId={currentUserId}
          documentId={(activeField as any)?.documentId || (activeField as any)?.docId || (document && (document as any).id) || ""}
          envelopeID={envelopeID}
          defaultSign={null}
          mode={isEditingSignature ? "update" : "add"}
          selfValue={selfValue || ""}
          cycleId={cycleId || ""}
          onSignatureSaved={(signatureUrl: string,fieldId: string) => {
            if(fieldId){
              // for updating multiple signature fields with same signature
              setLocalSignedMap((p) => ({ ...(p || {}), [fieldId]: signatureUrl }));
            }
            setRecipientSignature(signatureUrl);
            
            // Clear cached values for initial fields so they can be re-evaluated with updated initials
            const initialFields = signatureFields.filter((f: any) => f.type === "initial");
            initialFields.forEach((field: any) => {
              const keyId = field._id || field.fieldId;
              if (keyId) {
                // Clear from ref
                delete fieldValuesRef.current[keyId];
                // Clear from state
                setLocalFieldValues((prev) => {
                  const next = { ...prev };
                  delete next[keyId];
                  return next;
                });
                // Remove from auto-filled set so it can be re-evaluated
                autoFilledDateFieldsRef.current.delete(keyId);
              }
            });
            
            // In self-signer mode, refresh selfSigner data to get updated signatureFields
            switch (mode) {
              case MODE.SELF_SIGNER:
                if (cycleId) {
                  // Mark navigation as pending
                  pendingNavigationRef.current = true;
                  // Wait a bit for the backend to update, then refresh
                  setTimeout(() => {
                    getSelfSigner();
                    // Navigation will be triggered in getSelfSigner's finally block
                  }, 500);
                }
                break;
              case MODE.RECIPIENT:
                // No additional action needed for recipient mode
                break;
            }
          }}
          onSaveSign={(fieldId: string, signatureUrl: string, fieldRemmaning:boolean) => {
            // Clear cached values for initial fields so they can be re-evaluated with updated initials
            const initialFields = signatureFields.filter((f: any) => f.type === "initial");
            initialFields.forEach((field: any) => {
              const keyId = field._id || field.fieldId;
              if (keyId) {
                // Clear from ref
                delete fieldValuesRef.current[keyId];
                // Clear from state
                setLocalFieldValues((prev) => {
                  const next = { ...prev };
                  delete next[keyId];
                  return next;
                });
                // Remove from auto-filled set so it can be re-evaluated
                autoFilledDateFieldsRef.current.delete(keyId);
              }
            });
            
            // Handle post-signature actions based on mode
            switch (mode) {
              case MODE.SELF_SIGNER: {
                // Don't update selfSigner optimistically - let getSelfSigner handle it
                // This prevents double updates and re-render loops
                triggerConfetti();
                
                // Refresh selfSigner data to get updated signatureFields
                if (cycleId) {
                  // Mark navigation as pending
                  pendingNavigationRef.current = true;
                  // Wait a bit for the backend to update, then refresh
                  setTimeout(() => {
                    getSelfSigner();
                    // Navigation will be triggered in getSelfSigner's finally block
                  }, 500);
                }
                break;
              }
              case MODE.RECIPIENT: {
                // non-self: optimistic local update so UI shows signed image immediately
                const key = activeField?._id;
                if (key) { 
                  setLocalSignedMap((p) => ({ ...(p || {}), [key]: signatureUrl }));
                }
                // immediate feedback
                triggerConfetti();
                
                // Navigate to next field
                setTimeout(() => {
                  goToNext();
                }, 300);
                
                if (fieldRemmaning === false) {
                  try {
                    onRecipientComplete?.();
                  } catch (err) {
                    console.error('onRecipientComplete callback error:', err);
                  }
                  setShowCompleteButton(true);
                  if (!onRecipientComplete) {
                    navigate("/e-sign/signer/thank-you");
                  }
                }
                break;
              }
            }

            // Close modal but keep arrows visible (arrows navigation does not auto-open SignPad)
            setActiveField(null);

            // notify parent if needed
            onSignatureSave?.(fieldId, signatureUrl);
          }}
        />
      )}

      {/* CC view-only recipient audit trail modal */}
      {auditTrailOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4 py-6"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0"
            onClick={() => setAuditTrailOpen(false)}
            aria-hidden="true"
          />
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-gray-200"
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="thankyou-heading text-xl font-semibold text-gray-900">Reassignment history of this envelope</h3>
                
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                onClick={() => setAuditTrailOpen(false)}
                aria-label="Close audit trail"
              >
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto px-6 py-4">
              {auditTrailLoading ? (
                <div className="text-sm text-gray-600">Loading audit trail...</div>
              ) : auditTrailError ? (
                <div className="text-sm text-red-600">{auditTrailError}</div>
              ) : auditTrail.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600">
                  No audit trail entries are available for this recipient.
                </div>
              ) : (
                <div className="space-y-3">
                  {auditTrail.map((entry: any, idx: number) => {
                    const action = (entry?.action || '').toString();
                    const timestamp = entry?.timestamp ? new Date(entry.timestamp).toLocaleString() : '';
                    const details = entry?.details || {};

                    if (action === 'RECIPIENT_REASSIGNED') {
                      return (
                        <div
                          key={`${action}-${idx}-${String(entry?._id || '')}`}
                          className="rounded-lg border border-gray-200 bg-white px-4 py-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">Recipient reassigned</div>
                              <div className="mt-1 text-xs text-gray-500">{timestamp}</div>
                            </div>
                            {/* <div className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-100">
                              CC event
                            </div> */}
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                Initial Signer
                              </div>
                              <div className="mt-1 text-sm font-semibold text-gray-900">
                              {toTitleCase(details?.previousRecipientName || 'Previous recipient')}
                              </div>
                              <div className="mt-1 text-xs text-gray-600">
                                {details?.previousRecipientEmail || ''}
                              </div>
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                Re-assigned Signer
                              </div>
                              <div className="mt-1 text-sm font-semibold text-gray-900">
                                {toTitleCase(details?.newRecipientName || 'New recipient')}
                              </div>
                              <div className="mt-1 text-xs text-gray-600">
                                {details?.newRecipientEmail || ''}
                              </div>
                            </div>
                          </div>

                          {details?.reason ? (
                            <div className="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-3">
                              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                Reason
                              </div>
                              <div className="mt-1 text-sm text-gray-700">{details.reason}</div>
                            </div>
                          ) : null}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`${action}-${idx}-${String(entry?._id || '')}`}
                        className="rounded-2xl border border-gray-200 bg-white px-4 py-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {action || 'Audit event'}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">{timestamp}</div>
                          </div>
                        </div>
                        {details && Object.keys(details).length > 0 ? (
                          <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                            <pre className="overflow-auto whitespace-pre-wrap text-[11px] text-gray-700">
                              {JSON.stringify(details, null, 2)}
                            </pre>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Aadhaar Number Modal */}
      {showAadhaarModal && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4 py-6"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0"
            onClick={() => setShowAadhaarModal(false)}
            aria-hidden="true"
          />
          <div
            className="relative w-full max-w-md overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-gray-200"
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Enter Aadhaar Number</h3>
                <p className="text-sm text-gray-600">Please provide your 12-digit Aadhaar number to proceed with Aadhaar signature.</p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                onClick={() => setShowAadhaarModal(false)}
                aria-label="Close modal"
              >
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>

            <div className="px-6 py-4">
              <div>
                <div className="mb-4">
                  <label htmlFor="aadhaar" className="block text-sm font-medium text-gray-700">
                    Aadhaar Number
                  </label>
                  <input
                    type="text"
                    id="aadhaar"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    placeholder="Enter 12-digit Aadhaar number"
                    maxLength={12}
                  />
                  {aadhaarError && (
                    <p className="mt-1 text-sm text-red-600">{aadhaarError}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    * We will securely store this Aadhaar number so future signing steps can be completed faster for you.
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAadhaarModal(false)}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAadhaarSubmit}
                    disabled={aadhaarSaving}
                    className={`rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${aadhaarSaving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
                  >
                    {aadhaarSaving ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                        Saving...
                      </span>
                    ) : (
                      'Submit'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
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

const DocumentViewer: React.FC<Props> = React.memo(
  (props) => <DocumentViewerContent {...props} />,
  (prevProps, nextProps) => {
    // Ignore callback identity changes from parent UI state (e.g. dropdown open/close)
    // so PDF rendering doesn't remount/reload unnecessarily.
    return (
      prevProps.document === nextProps.document &&
      prevProps.documents === nextProps.documents &&
      prevProps.signatureFields === nextProps.signatureFields &&
      prevProps.currentUserId === nextProps.currentUserId &&
      prevProps.envelopeID === nextProps.envelopeID &&
      prevProps.cycleId === nextProps.cycleId &&
      prevProps.allRecipients === nextProps.allRecipients &&
      prevProps.isViewOnly === nextProps.isViewOnly
    );
  }
);

export default DocumentViewer;

