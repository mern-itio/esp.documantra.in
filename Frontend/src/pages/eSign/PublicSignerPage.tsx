import React, { useEffect, useState, useMemo, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import { eSignApi, subscriptionApi } from "../../services/apiHelper";
import DocumentViewer from "../../components/ESign/DocumentViewer";
import SignerAccessGate, {
  readSignerAccessToken,
  saveSignerAccessToken,
} from "../../components/ESign/SignerAccessGate";
import { CookiePreferenceCenter } from "../../components/common/CookiePreferenceCenter";
import SelfieCapture from "../../components/ESign/SelfieCapture";
import LivenessCapture from "../../components/ESign/LivenessCapture";
import DocumentSignatureBackground from "../../components/common/DocumentSignatureBackground";
import BrandLogo from "../../components/BrandLogo";
import { resolveEsignDocumentFileProp } from "../../utils/esignDocumentUrl";
import { markDocumentOpened, persistBiometricEvidence } from "../../utils/signingContext";
import { resolvePublicSignatureMethod, isVSignEnabled, refreshVSignPublicStatus } from "../../config/vsign";
import { isPublicSignOnlyApp } from "../../config/appMode";
import { formatDocuMantraEnvelopeId } from "../../utils/envelopeIdFormat";
import * as Icons from "lucide-react";
import {
  FileText,
  CheckCircle,
  X,
  Shield,
  RefreshCw,
  XCircle,
  ChevronDown,
  ArrowRight,
  User,
  Mail,
  Link2,
  Bell,
  Copy,
  Layers,
  Printer,
  Download,
  Share2,
  MessageSquare,
} from "lucide-react";

interface UISchema {
  securityLevel: string;
  estimatedTime: string;
  costInfo: string;
  complianceInfo: [string];
  icon: string;
}
interface AuthMethod {
  id: string;
  name: string;
  description: string;
  uiSchema: UISchema;
}
interface AuthList {
  _id: string;
  authMethodId: string;
  status: "pending" | "completed" | "rejected";
}

const formatDisplayName = (value: unknown): string => {
  const s = String(value ?? "").trim();
  if (!s) return "—";
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

const parseAuthList = (rawAuthentication: any): AuthList[] => {
  if (!rawAuthentication) return [];
  try {
    const parsed = JSON.parse(rawAuthentication);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item: any) =>
        item &&
        typeof item === "object" &&
        typeof item.authMethodId === "string" &&
        typeof item.status === "string"
    ) as AuthList[];
  } catch {
    return [];
  }
};

const EnvelopeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { recipientId } = useParams<{ recipientId: string }>();
  const { cycleId } = useParams<{ cycleId: string }>();
  const location = useLocation();

  const isPreviewMode = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('preview') === '1' || location.pathname.includes('/e-sign/preview/');
    } catch {
      return location.pathname.includes('/e-sign/preview/');
    }
  }, [location.pathname, location.search]);

  const isSignAppearanceDemo = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get('signDemo') === '1';
    } catch {
      return false;
    }
  }, [location.search]);

  // Some copied links drop the "/" between envelopeId and recipientId (48–49 hex chars).
  useEffect(() => {
    const rawId = String(id ?? "").trim();
    const rawRecipientId = String(recipientId ?? "").trim();
    if (rawRecipientId || !/^[a-f0-9]{48,49}$/i.test(rawId)) return;

    const envId = rawId.slice(0, 24);
    const rid = rawId.length === 48 ? rawId.slice(24) : rawId.slice(25);
    const suffix = `${location.search}${location.hash}`;
    window.location.replace(`/e-sign/signer/${envId}/${rid}${suffix}`);
  }, [id, recipientId, location.search, location.hash]);

  const initialAccessToken = useMemo(() => {
    try {
      return new URLSearchParams(location.search).get('accessToken');
    } catch {
      return null;
    }
  }, [location.search]);

  useEffect(() => {
    refreshVSignPublicStatus().catch(() => {});
  }, []);

  useEffect(() => {
    if (id && recipientId) {
      markDocumentOpened(String(id), String(recipientId));
    }
  }, [id, recipientId]);

  const usesVSignByDefault = isVSignEnabled() || isPublicSignOnlyApp();
  const skipSignerAccessGate =
    import.meta.env.DEV || import.meta.env.VITE_SKIP_SIGNER_ACCESS_OTP === "true";

  const [envelope, setEnvelope] = useState<any>(null);
  const [signatureFields, setSignatureFields] = useState<any[]>([]);
  const [_activeDocument, setActiveDocument] = useState<any>(null);
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [allRecipients, setAllRecipients] = useState<any[]>([]);
  const [currentRecipient,setCurrentRecipient] = useState<any>([]);
  const [loading, setLoading] = useState(isPreviewMode || skipSignerAccessGate);
  const [_showDownloadModal, setShowDownloadModal] = useState(false);

  /* ---------- TERMS & CONDITIONS GATE ---------- */
  const TERMS_VERSION = "v1";
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [showOtherOptions, setShowOtherOptions] = useState(false);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const otherOptionsRef = useRef<HTMLDivElement | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignName, setAssignName] = useState("");
  const [assignEmail, setAssignEmail] = useState("");
  const [assignReason, setAssignReason] = useState("");
  const [isAssignSubmitting, setIsAssignSubmitting] = useState(false);
  const [assignSubmitError, setAssignSubmitError] = useState<string>("");
  const [showAssignedAwayPage, setShowAssignedAwayPage] = useState(false);
  const [assignedAwayToName, setAssignedAwayToName] = useState("");
  const [assignedAwayToEmail, setAssignedAwayToEmail] = useState("");
  const [reassignLinkCopied, setReassignLinkCopied] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [isDeclineSubmitting, setIsDeclineSubmitting] = useState(false);
  const [declineSubmitError, setDeclineSubmitError] = useState<string>("");
  const [declineReason, setDeclineReason] = useState("");
  const [isFinishLaterSubmitting, setIsFinishLaterSubmitting] = useState(false);
  const [showSessionInfoModal, setShowSessionInfoModal] = useState(false);
  const [sessionCopyStatus, setSessionCopyStatus] = useState<"" | "copied" | "failed">("");
  const [showSigningDoneModal, setShowSigningDoneModal] = useState(false);
  const initialCompletionRedirectRef = useRef(true);
  const [sessionIp, setSessionIp] = useState<string>(""); // best-effort
  const [signatureProvider, setSignatureProvider] = useState<string>(
    usesVSignByDefault ? "vSign" : "draftAndSign",
  );
  const [signatureMethod, setSignatureMethod] = useState<string>(
    usesVSignByDefault ? "aadhaarSignature" : "Digital_Signature",
  );

  useEffect(() => {
    // Close the dropdown when clicking outside it
    if (!showOtherOptions) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!otherOptionsRef.current) return;
      if (event.target instanceof Node && otherOptionsRef.current.contains(event.target)) return;
      setShowOtherOptions(false);
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOtherOptions]);

  useEffect(() => {
    // Best-effort public IP lookup for Session Information
    if (!showSessionInfoModal) return;
    let cancelled = false;
    const run = async () => {
      try {
        // Using a simple public endpoint; replace with backend if preferred.
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json().catch(() => ({}));
        const ip = String((data as any)?.ip || "").trim();
        if (!cancelled && ip) setSessionIp(ip);
      } catch {
        // ignore
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [showSessionInfoModal]);

  /* ---------- AUTH STATES (added) ---------- */
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMethods, setAuthMethods] = useState<AuthMethod[]>([]);
  const [currentAuthIndex, setCurrentAuthIndex] = useState(0);
  const [authStatus, setAuthStatus] = useState<
    'pending' | 'verifying' | 'success' | 'failed' | 'skipping'
  >('pending');
  const [retryCount, setRetryCount] = useState(0);
  const [otpCode, setOtpCode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>(''); // Track current auth action (e.g., 'ENTER_OTP')
  const [otpLength, setOtpLength] = useState<number>(6); // Track OTP length from backend
  const [verificationId, setVerificationId] = useState<string>(''); // For any code-based verification if needed
  const [verificationMessage, setVerificationMessage] = useState<string>(''); // To display any messages from backend during verification
  const [biometricError, setBiometricError] = useState<string>('');
  const [verificationUrl, setVerificationUrl] = useState<string>(''); // For redirects to external identity verification
  const [signerAccessToken, setSignerAccessToken] = useState<string | null>(null);
  const [accessVerified, setAccessVerified] = useState(skipSignerAccessGate);
  const [showCookieCenter, setShowCookieCenter] = useState(false);
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);

  const [redirectCountdown, setRedirectCountdown] = useState<number>(5);
  const [skipMessage, setSkipMessage] = useState<string>(''); // If current method can't be used, show message then auto-advance
  const [showSkipWarningModal, setShowSkipWarningModal] = useState(false);
  const [pendingSkipReason, setPendingSkipReason] = useState<string>("");

  const getSignerAccessHeaders = (tokenOverride?: string | null) => {
    const token =
      tokenOverride ||
      signerAccessToken ||
      initialAccessToken ||
      readSignerAccessToken(String(id ?? ""), String(recipientId ?? ""));
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  };

  useEffect(() => {
    if (!isPreviewMode && !isSignAppearanceDemo) return;
    if (isSignAppearanceDemo) setTermsAccepted(true);
    setLoading(true);
    fetchEnvelopeDetails();
    console.log('Fetched Envelope details');
  }, [isPreviewMode, isSignAppearanceDemo]);

  const fetchEnvelopeDetails = async (tokenOverride?: string | null) => {
    try {
      const response = await eSignApi.get(`/api/e-sign/public/envelope/${id}`, {
        params: recipientId ? { recipientId } : undefined,
        headers: getSignerAccessHeaders(tokenOverride),
      });
      if (response.status === 200) {
        setEnvelope(response.data.data);
        const docs = response.data.data.documents || [];
        setAllDocuments(docs);
        const method = resolvePublicSignatureMethod(
          response.data.data?.signatureType,
          response.data.data?.envelopetype,
        );
        setSignatureMethod(method);
        setSignatureProvider(method === 'aadhaarSignature' ? 'vSign' : 'draftAndSign');
        const recipients = response.data.data.recipients || [];
        setAllRecipients(recipients);
        if(!cycleId){
          const rowcurrentRecipient = recipients.find(
            (r: any) => normId(r) === String(recipientId ?? "")
          );
          setCurrentRecipient(rowcurrentRecipient);
          const email = (rowcurrentRecipient?.email || '').toString().trim().toLowerCase();
          if (email) {
            sessionStorage.setItem('recipientPortalPrefillEmail', email);
          }
          const recipientName = (rowcurrentRecipient?.name || '').toString().trim();
          if (recipientName) {
            sessionStorage.setItem('recipientPortalPrefillName', recipientName);
          }
        }else{
          await fetchCurrentRecipient(recipientId);
        }
        const allFields: any[] = [];
        for (const d of docs) {
          try {
            const res = await eSignApi.get(
              `/api/e-sign/public/document/signature-fields/${d.id}`,
              {
                params: recipientId ? { recipientId } : undefined,
                headers: getSignerAccessHeaders(tokenOverride),
              }
            );
            if (res.status === 200 && Array.isArray(res.data.signatureFields)) {
              allFields.push(...res.data.signatureFields);
            }
          } catch (err) {
            console.warn("Failed to load signature fields for document", d.id);
          }
        }
        setSignatureFields(allFields);
        if (docs.length > 0) setActiveDocument(docs[0]);

        if (allFields.length === 0) {
          console.warn('No signature fields found for envelope', id);
        }
      }
    } catch (error) {
      console.error("Error fetching envelope:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPreviewMode || !accessVerified || !id || !recipientId) return;
    setLoading(true);
    const token =
      initialAccessToken ||
      readSignerAccessToken(String(id), String(recipientId)) ||
      undefined;
    fetchEnvelopeDetails(token);
  }, [isPreviewMode, accessVerified, id, recipientId, initialAccessToken]);

  const fetchCurrentRecipient = async(recipientId:any) =>{
    const response = await eSignApi.post('api/e-sign/public/fetch/current-recipient',{
      cycleId:cycleId,
      currentRecipientId:recipientId
    });
    if(response.status==200){
      setCurrentRecipient(response.data.currentRecipient);
      const email = (response.data.currentRecipient?.email || '').toString().trim().toLowerCase();
      if (email) {
        sessionStorage.setItem('recipientPortalPrefillEmail', email);
      }
      const recipientName = (response.data.currentRecipient?.name || '').toString().trim();
      if (recipientName) {
        sessionStorage.setItem('recipientPortalPrefillName', recipientName);
      }
    }
  }

  const handleSignatureSave = (fieldId: string, signatureUrl: string) => {
    setSignatureFields((prev) =>
      prev.map((field) =>
        field._id === fieldId || field._id?.$oid === fieldId
          ? { ...field, signature: signatureUrl }
          : field
      )
    );
  };
  // CC recipients get view-only: no signing or editing fields
  const normId = (r: any) => {
    const raw = r?.id ?? r?._id;
    if (raw == null) return "";
    if (typeof raw === "string") return raw;
    if (typeof raw === "object" && raw.$oid) return String(raw.$oid);
    return String(raw);
  };
  const role = (currentRecipient?.role ?? "").toString().toLowerCase().trim();
  const isViewOnly =
    isPreviewMode ||
    (!!currentRecipient && (role === "carbon_copy" || role === "cc"));
  const isInPerson = !!currentRecipient && role === "in_person_signer";

  const isCompletedStatus = (status: any) => {
    const s = (status || "").toString().toLowerCase();
    return s === "completed" || s === "signed" || s === "declined";
  };

  const { allPendingAreInPerson, nextInPersonRecipient } = useMemo(() => {
    // Treat the current in-person signer as "just completed" when computing what's next.
    const effectiveRecipients = allRecipients.map((r: any) => {
      if (normId(r) === normId(currentRecipient)) {
        return { ...r, status: "completed" };
      }
      return r;
    });

    const pending = effectiveRecipients.filter(
      (r: any) => !isCompletedStatus(r.status)
    );

    const allPendingInPerson =
      pending.length > 0 &&
      pending.every((r: any) => {
        const rr = (r.role || "").toString().toLowerCase();
        return rr === "in_person_signer" || rr === "carbon_copy" || rr === "cc";
      });

    const pendingInPerson = pending.filter((r: any) => {
      const rr = (r.role || "").toString().toLowerCase();
      return rr === "in_person_signer";
    });

    let next: any | null = null;
    if (pendingInPerson.length > 0) {
      // simple order-based next: sort by order and pick first pending
      const sorted = [...pendingInPerson].sort(
        (a, b) => (a.order || 0) - (b.order || 0)
      );
      next = sorted[0];
    }

    return { allPendingAreInPerson: allPendingInPerson, nextInPersonRecipient: next };
  }, [allRecipients, currentRecipient]);

  const termsStorageKey = useMemo(() => {
    const envId = String(id ?? "").trim();
    const rid = String(recipientId ?? "").trim();
    return `esign:termsAccepted:${TERMS_VERSION}:${envId}:${rid}`;
  }, [id, recipientId]);

  /* ---------- condition logic ----------
     Flow: Terms -> Document review (read/print/download/share) -> Auth -> Signing
  */
  useEffect(() => {
    // only run when envelope & recipient available
    if (!envelope || !currentRecipient) return;
    if (isPreviewMode) {
      // Preview route must never show terms/auth gates.
      setShowTermsModal(false);
      setShowAuthModal(false);
      setTermsAccepted(true);
      setIsAuthenticated(true);
      return;
    }

    // During post-sign completion flow, never reopen terms/auth modals.
    if (showSigningDoneModal) {
      setShowTermsModal(false);
      setShowAuthModal(false);
      setIsAuthenticated(true);
      return;
    }

    const envStatus = (envelope.status || "").toString().toLowerCase();
    const rawAuthentication = currentRecipient.authentication;
    const authList: AuthList[] = parseAuthList(rawAuthentication);
    const authCompleted = authList.every(a => a.status === "completed");
    const pendingAuth = authList.filter(a => a.status === "pending");

    // Condition 3 (or signer already completed): redirect to status page to avoid blank view on revisit
    const recipientStatus = (currentRecipient?.status || "").toString().toLowerCase();
    const recipientAlreadyCompleted =
      recipientStatus === "completed" ||
      recipientStatus === "signed" ||
      recipientStatus === "declined";

    // Previous signer → CC after reassignment: status "completed" while envelope still open.
    // Do not send them to the signer status page on first load (avoids wrong "signing completed" copy);
    // they stay on the public signing URL with the existing viewer UI.
    const ccCompletedWhileEnvelopeOpen =
      isViewOnly &&
      recipientAlreadyCompleted &&
      envStatus !== "completed";

    if (envStatus === "completed" || (recipientAlreadyCompleted && !ccCompletedWhileEnvelopeOpen)) {
      // On first load (re-opening a completed envelope) auto-redirect to status page.
      // But when the user just finished signing in this session, do NOT auto-redirect;
      // we want them to click the "Complete" button in the viewer header.
      if (initialCompletionRedirectRef.current && !showSigningDoneModal) {
        try {
          const envId = String(id ?? "");
          const rid = String(recipientId ?? "");
          window.location.replace(`/e-sign/signer/status/${envId}/${rid}`);
        } catch {
          // Fallback: show download modal if navigation fails
          setShowDownloadModal(true);
          setShowAuthModal(false);
          setIsAuthenticated(false);
          setShowTermsModal(false);
        }
        return;
      }

      // If not redirecting (i.e. completed during this session), keep UI stable.
      setShowDownloadModal(false);
      setShowAuthModal(false);
      setShowTermsModal(false);
      return;
    }

    // after first completed check, stop treating subsequent updates as "initial load"
    if (initialCompletionRedirectRef.current) initialCompletionRedirectRef.current = false;

    // Envelope incomplete
    if (!authCompleted) {
      // 
      console.log('In Auth Incomplete block');
      // Condition 1 / 1b: Show terms first; only show auth after terms accepted
      let termsAcceptedStored = false;
      try {
        termsAcceptedStored = window.localStorage.getItem(termsStorageKey) === "true";
      } catch {
        termsAcceptedStored = false;
      }
      if (termsAcceptedStored) {
        setShowAuthModal(false);
        setShowTermsModal(false);
        setIsAuthenticated(false);
      } else {
        setShowTermsModal(true);
        setShowAuthModal(false);
        setIsAuthenticated(false);
      }
      const loadAuthMethods = async () => {
        const methods = await fetchPendingAuthMethodDetails(pendingAuth);
        if (methods.length === 0) {
          setIsAuthenticated(true);
          setShowAuthModal(false);
        }
        setAuthMethods(methods || []);
      };
      loadAuthMethods();
      setCurrentAuthIndex(0);
      setAuthStatus('pending');
      setRetryCount(0);
      setOtpCode('');
      setCurrentAction('');
    } else {
      console.log('In Auth Completed block');
      // Condition 2
      setIsAuthenticated(true);
      setShowAuthModal(false);
    }
  }, [envelope, currentRecipient, termsStorageKey, isViewOnly, showSigningDoneModal, id, recipientId, isPreviewMode]);

  useEffect(() => {
    // Show terms when envelope is active (not completed) and terms not yet accepted (terms first, before auth)
    if (!envelope) return;
    if (isPreviewMode) {
      setShowTermsModal(false);
      setTermsAccepted(true);
      return;
    }
    const envStatus = (envelope.status || "").toString().toLowerCase();
    if (envStatus === "completed") return;

    let storedAccepted = false;
    try {
      storedAccepted = window.localStorage.getItem(termsStorageKey) === "true";
    } catch {
      storedAccepted = false;
    }

    setTermsAccepted(storedAccepted);
    setShowTermsModal(!storedAccepted);
    setTermsChecked(false);
  }, [envelope, termsStorageKey, isPreviewMode]);

  const acceptTerms = async() => {
    if (!termsChecked) return;
    try {
      const response = await eSignApi.post(
        `/api/e-sign/public/envelope/accept-terms`,
        {
          envelopeId: String(id ?? ""),
          recipientId: String(recipientId ?? ""),
          cycleId:String(cycleId ?? ""),
          consentVersion: TERMS_VERSION,
        });
        if(response.status==200){
            window.localStorage.setItem(termsStorageKey, "true");
            setTermsAccepted(true);
            setShowTermsModal(false);
            setShowOtherOptions(false);
            // After terms: let signer review the document first; auth opens on demand.
            setShowAuthModal(false);
        }
    } catch {
      // ignore storage failures; keep in-memory acceptance for this session
    }
  };

  /* ---------- AUTH FLOW HANDLERS (demo logic you provided) ---------- */
  const fetchPendingAuthMethodDetails = async (pendingAuth: any): Promise<AuthMethod[]> => {
    console.log("Fetching auth method details for IDs:", pendingAuth);
    const response = await subscriptionApi.post(`/api/authproviders/bulk/details`, {
      methodIds: pendingAuth.map((a: any) => a.authMethodId)
    });
    if (response.status === 200 && Array.isArray(response.data.methods)) {
      return response.data.methods;
    }
    return [];
  };
  const handleAuthSuccess = () => {
    setAuthStatus('success');

    setTimeout(() => {
      if (currentAuthIndex < authMethods.length - 1) {
        setCurrentAuthIndex(currentAuthIndex + 1);
        setAuthStatus('pending');
        setRetryCount(0);
        setOtpCode('');
        setCurrentAction(''); // Reset action for next auth method
      } else {
        // all auth steps done
        setIsAuthenticated(true);
        setShowAuthModal(false);
      }
    }, 1500);
  };

  const goToNextAuthMethod = () => {
    if (currentAuthIndex < authMethods.length - 1) {
      setCurrentAuthIndex(currentAuthIndex + 1);
      setAuthStatus('pending');
      setRetryCount(0);
      setOtpCode('');
      setCurrentAction('');
      setVerificationMessage('');
      setVerificationUrl('');
      setRedirectCountdown(5);
      setSkipMessage('');
    } else {
      // All methods processed (either completed or skipped)
      setIsAuthenticated(true);
      setShowAuthModal(false);
    }
  };

  const skipCurrentAuthMethod = (reason?: string) => {
    if (reason) {
      setSkipMessage(reason);
    }

    setAuthStatus('skipping');
    setCurrentAction('');
    setOtpCode('');
    setVerificationUrl('');
    setRedirectCountdown(5);

    // Give the user a moment to read the skip message before continuing to the next method.
    window.setTimeout(() => {
      goToNextAuthMethod();
    }, 1800);
  };

  const handleAuthFailure = () => {
    if (retryCount < 2) {
      setAuthStatus('failed');
      setTimeout(() => {
        setRetryCount(retryCount + 1);
        setAuthStatus('pending');
        setOtpCode('');
        setCurrentAction(''); // Reset action to allow retry
      }, 2000);
    } else {
      setAuthStatus('failed');
      alert('Authentication failed. Maximum retry attempts reached. Please try again later.');
      setShowAuthModal(false);
    }
  };

  const verificationStart = async (currentAuthMethod: AuthMethod) => {
    setIsVerifying(true);
    try {
      const response = await subscriptionApi.post(`/api/authproviders/initiate/auth`, {
        providerId: currentAuthMethod.id,
        recipientData: currentRecipient,
        envelopeId: id
      });

      if (response.status === 200 && response.data) {
        const { action, message, metadata, verificationId, missingRequirements, missingRequirement } = response.data as any;
        const serverMessage = message || response.data?.error || '';

        // If backend says required data is missing, skip this auth method.
        if (missingRequirements || missingRequirement || (response.data?.errorCode === 'MISSING_INFO')) {
          const reason =
            missingRequirements?.join?.(', ') ||
            missingRequirement ||
            serverMessage ||
            'Required information is missing for this verification method.';
          skipCurrentAuthMethod(reason);
          return;
        }

        console.log("Verification initiation response:", verificationId);
        setVerificationId(verificationId);
        setVerificationMessage(serverMessage);

        // Update UI based on action from backend
        if (action === 'ENTER_OTP') {
          setCurrentAction('ENTER_OTP');
          setOtpLength(metadata?.otpLength || 6);
          setAuthStatus('pending'); // Stay in pending state to show OTP input
          setOtpCode(''); // Reset OTP code
          console.log(`OTP sent. Expected length: ${metadata?.otpLength || 6}`);
        } else if (action === 'VERIFY_EMAIL_LINK') {
          setCurrentAction('VERIFY_EMAIL_LINK');
          console.log(message || 'Please verify via the email link sent to you.');
        } else if (action === 'COMPLETE_IDENTITY_VERIFICATION') {
          // Redirect the user to the provided URL after a short countdown.
          const url = (response.data as any).verificationUrl || '';
          setVerificationUrl(url);
          setRedirectCountdown(5);
          setCurrentAction('COMPLETE_IDENTITY_VERIFICATION');
          setVerificationMessage(
            'Verification URL has been generated. You will be redirected in a few seconds.'
          );
        } else if (action === 'CAPTURE_SELFIE') {
          setCurrentAction('CAPTURE_SELFIE');
          setAuthStatus('pending');
          setBiometricError('');
        } else if (action === 'CAPTURE_LIVENESS') {
          setCurrentAction('CAPTURE_LIVENESS');
          setAuthStatus('pending');
          setBiometricError('');
        } else {
          console.log(message || 'Verification initiated.');
        }
      } else {
        alert('Failed to initiate verification. Please try again later.');
        setAuthStatus('failed');
      }
    } catch (error: any) {
      console.error('Error during verification:', error);

      // Check if it's a 400 error with missing requirements
      if (error.response?.status === 400 && error.response?.data) {
        const { missingRequirements, missingRequirement, errorCode } = error.response.data;

        if (missingRequirements || missingRequirement || errorCode === 'MISSING_INFO') {
          const reason =
            'Required information is missing for this verification method.';
          skipCurrentAuthMethod(reason);
          return;
        }
      }

      // Otherwise, it's a real error
      alert('Failed to initiate verification. Please try again later.');
      setAuthStatus('failed');
    } finally {
      setIsVerifying(false);
    }
  };

  // When we need the user to be redirected to an external verification URL,
  // show a countdown and then navigate automatically.
  useEffect(() => {
    if (currentAction !== 'COMPLETE_IDENTITY_VERIFICATION' || !verificationUrl) return;
    if (redirectCountdown <= 0) {
      window.location.href = verificationUrl;
      return;
    }

    const timer = window.setTimeout(() => {
      setRedirectCountdown((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [currentAction, verificationUrl, redirectCountdown]);

  const handleBiometricValidationFailure = (message?: string, maxAttemptsReached?: boolean) => {
    if (maxAttemptsReached) {
      setAuthStatus('failed');
      setBiometricError(message || 'Maximum verification attempts reached.');
      alert(message || 'Maximum verification attempts reached for this method.');
      setShowAuthModal(false);
      return;
    }

    setAuthStatus('pending');
    setBiometricError(message || 'Verification failed. Please try again.');
    setCurrentAction(currentAction);
  };

  const handleSelfieSubmit = async (payload: { imageBase64: string; faceBox: { x: number; y: number; width: number; height: number } }) => {
    if (!verificationId) {
      setBiometricError('Session expired. Please start again.');
      setCurrentAction('');
      return;
    }

    setAuthStatus('verifying');
    setBiometricError('');
    try {
      const currentAuthMethod = authMethods[currentAuthIndex];
      const response = await subscriptionApi.post(`/api/authproviders/verify/selfie`, {
        providerId: currentAuthMethod.id,
        recipientId: currentRecipient.id,
        envelopeId: id,
        verificationId,
        imageBase64: payload.imageBase64,
        faceBox: payload.faceBox,
      });

      if (response.status === 200 && response.data?.success) {
        const identityBase = (
          import.meta.env.VITE_IDENTITY_SERVICE_URL || "http://localhost:2114"
        ).replace(/\/+$/, "");
        const data = response.data?.data || {};
        const imagePath = data.imageUrl || data.livePicUrl || "";
        const livePic = imagePath.startsWith("http")
          ? imagePath
          : imagePath
            ? `${identityBase}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`
            : payload.imageBase64;
        persistBiometricEvidence(String(id), String(currentRecipient.id), {
          livePic,
          livePicUrl: livePic,
          liveMatchPercent: Number(data?.metadata?.checks?.faceMatchPercent ?? 100),
        });
        handleAuthSuccess();
      } else {
        handleBiometricValidationFailure(response.data?.message, response.data?.maxAttemptsReached);
      }
    } catch (error: any) {
      const data = error?.response?.data;
      handleBiometricValidationFailure(
        data?.message || 'Selfie verification failed.',
        data?.maxAttemptsReached
      );
    }
  };

  const handleLivenessSubmit = async (payload: {
    imageBase64: string;
    secondaryImageBase64: string;
    faceBox: { x: number; y: number; width: number; height: number };
    secondaryFaceBox: { x: number; y: number; width: number; height: number };
  }) => {
    if (!verificationId) {
      setBiometricError('Session expired. Please start again.');
      setCurrentAction('');
      return;
    }

    setAuthStatus('verifying');
    setBiometricError('');
    try {
      const currentAuthMethod = authMethods[currentAuthIndex];
      const response = await subscriptionApi.post(`/api/authproviders/verify/liveness`, {
        providerId: currentAuthMethod.id,
        recipientId: currentRecipient.id,
        envelopeId: id,
        verificationId,
        imageBase64: payload.imageBase64,
        secondaryImageBase64: payload.secondaryImageBase64,
        faceBox: payload.faceBox,
        secondaryFaceBox: payload.secondaryFaceBox,
      });

      if (response.status === 200 && response.data?.success) {
        const identityBase = (
          import.meta.env.VITE_IDENTITY_SERVICE_URL || "http://localhost:2114"
        ).replace(/\/+$/, "");
        const data = response.data?.data || {};
        const toAbsolute = (path?: string) => {
          if (!path) return "";
          if (path.startsWith("http") || path.startsWith("data:image")) return path;
          return `${identityBase}${path.startsWith("/") ? path : `/${path}`}`;
        };
        persistBiometricEvidence(String(id), String(currentRecipient.id), {
          livePic: toAbsolute(data.livePicUrl || data.imageUrl),
          livePicUrl: toAbsolute(data.livePicUrl || data.imageUrl),
          idPic: toAbsolute(data.idPicUrl || data.secondaryImageUrl || data.imageUrl),
          idPicUrl: toAbsolute(data.idPicUrl || data.secondaryImageUrl || data.imageUrl),
          liveMatchPercent: 100,
        });
        handleAuthSuccess();
      } else {
        handleBiometricValidationFailure(response.data?.message, response.data?.maxAttemptsReached);
      }
    } catch (error: any) {
      const data = error?.response?.data;
      handleBiometricValidationFailure(
        data?.message || 'Liveness verification failed.',
        data?.maxAttemptsReached
      );
    }
  };

  const handleOTPSubmit = async () => {
    if (otpCode.length !== otpLength) {
      alert(`Please enter a valid ${otpLength}-digit OTP`);
      return;
    }

    setAuthStatus('verifying');
    try {
      console.log("Verification ID ", verificationId);
      const currentAuthMethod = authMethods[currentAuthIndex];
      const response = await subscriptionApi.post(`/api/authproviders/verify/otp`, {
        providerId: currentAuthMethod.id,
        recipientId: currentRecipient.id,
        envelopeId: id,
        otp: otpCode,
        verificationId: verificationId // pass the code received during initiation for correlation
      });

      console.log("OTP verification response:", response.data);

      if (response.status === 200 && response.data.success) {
        handleAuthSuccess();
      } else {
        handleAuthFailure();
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      handleAuthFailure();
    }
  };

  const currentAuthMethod = authMethods[currentAuthIndex];

  // const esignBase = ((import.meta as any).env?.VITE_ESIGN_SERVICE_URL || "")
  //   .toString()
  //   .trim()
  //   .replace(/\/+$/, "");

  // const handleDownloadSigned = () => {
  //   if (!id || !esignBase) return;
  //   const url = `${esignBase}/api/e-sign/signatures/download/${id}`;
  //   window.open(url, "_blank");
  // };

  // const handleDownloadAll = () => {
  //   if (!id || !esignBase) return;
  //   const url = `${esignBase}/api/e-sign/signatures/download-all/${id}`;
  //   window.open(url, "_blank");
  // };

  const handleRecipientComplete = () => {
    if (!isInPerson) return;

    if (allPendingAreInPerson && nextInPersonRecipient) {
      const nextId = normId(nextInPersonRecipient);
      if (!nextId) {
        setShowDownloadModal(true);
        return;
      }

      // Navigate to same envelope but for the next in-person signer.
      try {
        const parts = window.location.pathname.split("/").filter(Boolean);
        const rid = recipientId ? String(recipientId) : "";
        const idx = parts.lastIndexOf(rid);
        if (idx >= 0) {
          parts[idx] = nextId;
        } else {
          parts.push(nextId);
        }
        const newPath = "/" + parts.join("/");
        window.location.assign(
          newPath + window.location.search + window.location.hash
        );
      } catch {
        // Fallback: just show the completion modal if navigation fails.
        setShowDownloadModal(true);
      }
    } else {
      setShowDownloadModal(true);
    }
  };

  const handleSigningCompleted = async () => {
    // Set this immediately so the viewer stays mounted even if the envelope
    // status flips to "completed" right after the last field is submitted.
    setShowSigningDoneModal(true);
    setShowTermsModal(false);
    setShowAuthModal(false);
    setIsAuthenticated(true);

    // Refresh to get latest recipient statuses/envelope status
    try {
      await fetchEnvelopeDetails();
    } catch {
      // ignore; we can still compute from current state
    }
  };

  if (!isPreviewMode && !accessVerified) {
    return (
      <>
        <SignerAccessGate
          envelopeId={String(id ?? "")}
          recipientId={String(recipientId ?? "")}
          initialAccessToken={initialAccessToken}
          onVerified={(token) => {
            saveSignerAccessToken(String(id ?? ""), String(recipientId ?? ""), token);
            setSignerAccessToken(token);
            setAccessVerified(true);
            setLoading(true);
            fetchEnvelopeDetails(token);
          }}
        />
        <CookiePreferenceCenter
          open={showCookieCenter}
          onClose={() => setShowCookieCenter(false)}
        />
      </>
    );
  }

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-blue-50 px-4 text-gray-600">
        <DocumentSignatureBackground />
        <span className="relative z-10">Loading...</span>
      </div>
    );
  }

  if (!envelope) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-blue-50 px-4 text-center text-gray-600">
        <DocumentSignatureBackground />
        <div className="relative z-10 flex flex-col items-center">
          <FileText className="mb-4 h-12 w-12 text-gray-400" />
          <p>Envelope not found or has been removed.</p>
        </div>
      </div>
    );
  }

  const recipientStatus = (currentRecipient?.status || "").toString().toLowerCase();
  const isWaitingForTurn =
    !isPreviewMode &&
    !isViewOnly &&
    recipientStatus === "waiting" &&
    (envelope?.status || "").toString().toLowerCase() !== "completed";

  const activeSigners = (allRecipients || []).filter((r: any) => {
    const role = (r?.role || "").toString().toLowerCase();
    return role !== "carbon_copy" && role !== "cc" && role !== "in_person_signer";
  });

  if (isWaitingForTurn) {
    const completedCount = activeSigners.filter(
      (r: any) => (r?.status || "").toString().toLowerCase() === "completed",
    ).length;
    const envelopeTitle =
      (envelope?.subject && String(envelope.subject).trim()) ||
      (envelope?.name && String(envelope.name).trim()) ||
      "Document";

    return (
      <div className="relative min-h-screen overflow-hidden bg-blue-50 px-4 py-10">
        <DocumentSignatureBackground />
        <div className="relative z-10 mx-auto w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-100">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Waiting for your turn
              </p>
              <h1 className="text-xl font-semibold text-gray-900">{envelopeTitle}</h1>
            </div>
          </div>

          <p className="text-sm leading-6 text-gray-600">
            This envelope uses sequential signing. Another signer must finish before you can sign.
            You will receive an email when it is your turn.
          </p>

          <div className="mt-6 rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Signing progress
            </p>
            <p className="mt-2 text-sm text-gray-800">
              {completedCount} of {activeSigners.length} signer{activeSigners.length === 1 ? "" : "s"} completed
            </p>
            <div className="mt-4 space-y-2">
              {activeSigners
                .slice()
                .sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0))
                .map((signer: any, idx: number) => {
                  const status = (signer?.status || "").toString().toLowerCase();
                  const isDone = status === "completed";
                  const isCurrent = normId(signer) === String(recipientId ?? "");
                  return (
                    <div
                      key={String(signer?.id || idx)}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                        isCurrent ? "bg-amber-50 ring-1 ring-amber-100" : "bg-white"
                      }`}
                    >
                      <span className="font-medium text-gray-900">
                        {idx + 1}. {formatDisplayName(signer?.name)}
                        {isCurrent ? " (You)" : ""}
                      </span>
                      <span
                        className={`text-xs font-semibold uppercase ${
                          isDone ? "text-emerald-700" : status === "sent" ? "text-blue-700" : "text-gray-500"
                        }`}
                      >
                        {isDone ? "Completed" : status === "sent" ? "Signing" : "Waiting"}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchEnvelopeDetails()}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#260559] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d0445]"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh status
          </button>
        </div>
      </div>
    );
  }

  if (showAssignedAwayPage) {
    const senderLabel =
      envelope?.sender?.name ||
      envelope?.senderName ||
      envelope?.createdBy?.name ||
      envelope?.owner?.name ||
      "";
    const envelopeTitle =
      (envelope?.name && String(envelope.name).trim()) ||
      (envelope?.subject && String(envelope.subject).trim()) ||
      "Untitled envelope";
    const initialSignerName = formatDisplayName(
      (currentRecipient as any)?.name || (currentRecipient as any)?.fullname
    );
    const initialSignerEmail = String(
      (currentRecipient as any)?.email || ""
    ).trim();
    const docCount = Array.isArray(allDocuments) ? allDocuments.length : 0;
    const currentSigningUrl =
      typeof window !== "undefined" ? window.location.href : "";

    return (
      <div className="relative min-h-screen overflow-hidden bg-blue-50 px-4 py-8 sm:py-12">
        <DocumentSignatureBackground />
        <div className="relative z-10 mx-auto w-full max-w-5xl">
          <div className="mb-6 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-100">
              <CheckCircle className="h-3.5 w-3.5" />
              Reassignment complete
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Signing request reassigned
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Your signing session is closed. Below is a summary of this envelope and who signs next.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
            {/* Left: envelope + signers */}
            <div className="flex flex-col rounded-2xl border border-gray-200 bg-[#F7F3EE] p-6 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-start gap-3 border-b border-gray-100 pb-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#260559]/10 text-[#260559]">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Envelope
                  </p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 leading-snug">
                    {envelopeTitle}
                  </p>
                  {envelope?.name &&
                    envelope?.subject &&
                    String(envelope.name).trim() !== String(envelope.subject).trim() && (
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {String(envelope.subject)}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                    <span>
                      <span className="font-medium text-gray-700">From: </span>
                      {senderLabel ? formatDisplayName(senderLabel) : "—"}
                    </span>
                    {docCount > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5 text-gray-400" />
                        {docCount} document{docCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Signing order
              </p>
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-gray-100 bg-[#F5F2EE]/80 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <User className="h-3.5 w-3.5 text-[#260559]" />
                    Initial signer (you)
                  </div>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {initialSignerName}
                  </p>
                  {initialSignerEmail && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-600">
                      <Mail className="h-3 w-3 shrink-0 text-gray-400" />
                      {initialSignerEmail}
                    </p>
                  )}
                </div>

                <div className="flex justify-center py-0.5">
                  <ArrowRight className="h-5 w-5 rotate-90 text-gray-300 sm:rotate-0" aria-hidden />
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 ring-1 ring-emerald-100/80">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                    <User className="h-3.5 w-3.5" />
                    Next signer
                  </div>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {assignedAwayToName || "—"}
                  </p>
                  {assignedAwayToEmail && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-700">
                      <Mail className="h-3 w-3 shrink-0 text-emerald-700/70" />
                      {assignedAwayToEmail}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right: CC + notifications + same link */}
            <div className="flex flex-col rounded-2xl border border-[#260559]/15 bg-[#260559] p-6 text-white shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7F3EE]/15">
                <CheckCircle className="h-7 w-7 text-white" />
              </div>
              <h2 className="mt-5 text-xl font-semibold leading-snug">
              You’ve been added as a viewer
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/85">
                You reassigned this document to the next signer. You will not sign this copy; instead you will
                stay informed as a <strong className="font-semibold text-white">View only recipient</strong>.
              </p>

              <ul className="mt-6 space-y-4 text-sm text-white/90">
                <li className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F7F3EE]/10">
                    <Bell className="h-4 w-4" />  
                  </span>
                  <span>
                    <span className="font-medium text-white">Email updates</span>
                    <span className="block text-white/80">
                    You will receive email notifications as the document moves forward (when it is signed, or completed).
                    </span>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F7F3EE]/10">
                    <Link2 className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="font-medium text-white">Same link to view</span>
                    <span className="block text-white/80">
                      Bookmark or save this page. You can return anytime with the same signing link to view the
                      document status (read-only for Viewer).
                    </span>
                  </span>
                </li>
              </ul>

              {currentSigningUrl && (
                <div className="mt-6 rounded-xl bg-black/20 p-3 ring-1 ring-white/10">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
                    Your signing link
                  </p>
                  <p className="mt-1 break-all font-mono text-[11px] leading-relaxed text-white/90">
                    {currentSigningUrl}
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(currentSigningUrl);
                        setReassignLinkCopied(true);
                        window.setTimeout(() => setReassignLinkCopied(false), 2000);
                      } catch {
                        /* ignore */
                      }
                    }}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#F7F3EE]/15 px-3 py-2 text-xs font-medium text-white transition hover:bg-[#F7F3EE]/25"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {reassignLinkCopied ? "Copied" : "Copy link"}
                  </button>
                </div>
              )}

              <div className="mt-auto flex flex-col gap-3 pt-8 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => window.location.assign("/")}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-[#F7F3EE] px-5 py-2.5 text-sm font-semibold text-[#260559] shadow-sm transition hover:bg-[#F7F3EE]/95 sm:w-auto"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  const IconComponent = (Icons[currentAuthMethod?.uiSchema?.icon as keyof typeof Icons] as any) ||
    Icons.HelpCircle;

  const isEnvelopeCompleted =
    (envelope?.status || "").toString().toLowerCase() === "completed";
  const canBrowseDocument = isPreviewMode || isSignAppearanceDemo || termsAccepted;
  const canSignDocument =
    !isSignAppearanceDemo && (isPreviewMode || (termsAccepted && isAuthenticated));
  const authStillPending =
    !isPreviewMode && !isSignAppearanceDemo && termsAccepted && !isAuthenticated;
  const inDocumentReviewPhase = authStillPending && !showAuthModal;

  const shouldRenderDocumentInBackground =
    (isPreviewMode || isSignAppearanceDemo || !isEnvelopeCompleted || showSigningDoneModal) &&
    (isPreviewMode ||
      isSignAppearanceDemo ||
      canBrowseDocument ||
      showAuthModal ||
      showTermsModal ||
      showSigningDoneModal);

  const openDocumentDownload = (doc: any) => {
    const fileProp = resolveEsignDocumentFileProp(doc, {
      envelopeId: String(id ?? ""),
      recipientId: String(recipientId ?? ""),
      isPublicFlow: true,
    });
    let url: string | undefined;
    if (typeof fileProp === "string") {
      url = fileProp;
    } else if (fileProp && typeof fileProp === "object" && "url" in fileProp) {
      url = fileProp.url;
    }
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handlePrintDocument = () => {
    if (!canBrowseDocument) return;
    setShowOtherOptions(false);
    window.print();
  };

  const handleDownloadDocument = () => {
    if (!canBrowseDocument) return;
    setShowOtherOptions(false);
    const doc = allDocuments[0];
    if (!doc) return;
    openDocumentDownload(doc);
  };

  const handleShareSigningLink = async () => {
    setShowOtherOptions(false);
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareLinkCopied(true);
      window.setTimeout(() => setShareLinkCopied(false), 2500);
    } catch {
      window.prompt("Copy this link:", window.location.href);
    }
  };

  const beginIdentityVerification = () => {
    if (!authMethods.length) {
      setIsAuthenticated(true);
      return;
    }
    setShowAuthModal(true);
    setShowOtherOptions(false);
  };

  const renderSignerActionsMenu = () => (
    <div className="w-56 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg max-h-80">
      <button
        type="button"
        onClick={handlePrintDocument}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
      >
        <Printer className="h-4 w-4" />
        Print
      </button>
      <button
        type="button"
        onClick={handleDownloadDocument}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
      >
        <Download className="h-4 w-4" />
        Download
      </button>
      <button
        type="button"
        onClick={handleShareSigningLink}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
      >
        <Share2 className="h-4 w-4" />
        {shareLinkCopied ? "Link copied" : "Share link"}
      </button>
      <button
        type="button"
        onClick={() => {
          setShowOtherOptions(false);
          setShowCommentsPanel(true);
        }}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
      >
        <MessageSquare className="h-4 w-4" />
        Document suggestions
      </button>
      <div className="my-1 border-t border-gray-200" />
      <button
        type="button"
        onClick={() => {
          setShowOtherOptions(false);
          setShowAssignModal(true);
        }}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
      >
        <ArrowRight className="h-4 w-4" />
        Forward document
      </button>
      {envelope?.canDecline !== false && (
        <button
          type="button"
          onClick={() => {
            setShowOtherOptions(false);
            setShowDeclineModal(true);
          }}
          className="block w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
        >
          Decline to sign
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          setShowOtherOptions(false);
          setShowCookieCenter(true);
        }}
        className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
      >
        Cookie preferences
      </button>
      <button
        type="button"
        onClick={() => {
          setShowOtherOptions(false);
          setShowSessionInfoModal(true);
        }}
        className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
      >
        Session Details
      </button>
      {inDocumentReviewPhase && (
        <>
          <div className="my-1 border-t border-gray-200" />
          <button
            type="button"
            onClick={beginIdentityVerification}
            className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-[#260559] hover:bg-[#F5F2EE]"
          >
            Verify identity to sign
          </button>
        </>
      )}
    </div>
  );

  const emailCandidate = assignEmail.trim();
  const isAssignEmailValid =
    emailCandidate.length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailCandidate);

  const isAssignFormValid = assignName.trim().length > 0 && isAssignEmailValid;

  const submitAssignToSomeoneElse = async () => {
    if (!isAssignFormValid || isAssignSubmitting) return;

    setIsAssignSubmitting(true);
    setAssignSubmitError("");

    try {
      // Dummy endpoint: replace with real endpoint later.
      await eSignApi.post(`/api/e-sign/public/envelope/assign-to-someone-else`, {
        envelopeId: String(id ?? ""),
        recipientId: String(recipientId ?? ""),
        newSignerName: assignName.trim(),
        newSignerEmail: assignEmail.trim(),
        reason: assignReason.trim(),
      });

      setAssignedAwayToName(assignName.trim());
      setAssignedAwayToEmail(assignEmail.trim());
      setShowAssignedAwayPage(true);
      setShowAssignModal(false);
      setShowAuthModal(false);
      setShowTermsModal(false);
      setShowOtherOptions(false);
      setAssignName("");
      setAssignEmail("");
      setAssignReason("");
    } catch (error: any) {
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message;
      setAssignSubmitError(serverMessage || "Failed to assign to someone else.");
    } finally {
      setIsAssignSubmitting(false);
    }
  };

  const submitDeclineToSign = async () => {
    if (isDeclineSubmitting) return;
    if (!declineReason.trim()) {
      setDeclineSubmitError("Please provide a reason to decline.");
      return;
    }
    setIsDeclineSubmitting(true);
    setDeclineSubmitError("");
    try {
      await eSignApi.post(`/api/e-sign/public/envelope/decline`, {
        envelopeId: String(id ?? ""),
        recipientId: String(recipientId ?? ""),
        reason: declineReason.trim(),
      });
      setShowDeclineModal(false);
      setDeclineReason("");
      const envId = String(id ?? "").trim();
      const rid = String(recipientId ?? "").trim();
      if (envId && rid) {
        window.location.replace(`/e-sign/signer/status/${envId}/${rid}`);
      } else {
        window.location.assign("/");
      }
    } catch (error: any) {
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message;
      setDeclineSubmitError(serverMessage || "Failed to decline to sign.");
    } finally {
      setIsDeclineSubmitting(false);
    }
  };

  const requestSkipAuthMethod = (reason: string) => {
    setPendingSkipReason(reason);
    setShowSkipWarningModal(true);
  };

  const confirmSkipAuthMethod = () => {
    const reason = pendingSkipReason || "You chose to skip this verification method.";
    setShowSkipWarningModal(false);
    setPendingSkipReason("");
    skipCurrentAuthMethod(reason);
  };

  const sessionInfoRows = (() => {
    const recipientIdValue = String(recipientId ?? "").trim() || "—";
    // const pageUrlValue = (() => {
    //   try {
    //     return window.location.href;
    //   } catch {
    //     return "—";
    //   }
    // })();
    const openedAtValue = (() => {
      try {
        return new Date().toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZoneName: "short",
        });
      } catch {
        return new Date().toISOString();
      }
    })();
    const browserValue = (() => {
      try {
        const ua = navigator.userAgent || "";
        return ua ? ua : "—";
      } catch {
        return "—";
      }
    })();
    const ipValue = sessionIp?.trim() ? sessionIp.trim() : "Unavailable";

    return [
      { label: "DocuMantra Envelope ID", value: formatDocuMantraEnvelopeId(id) },
      { label: "Recipient ID", value: recipientIdValue },
      { label: "IP Address", value: ipValue },
      { label: "Opened At", value: openedAtValue },
      { label: "Browser", value: browserValue },
      // { label: "Page URL", value: pageUrlValue },
    ];
  })();
  const capitalizeWords = (value: any) => {
    if (!value || typeof value !== 'string') return 'Sender';

    return value
      .replace(/[_-]+/g, ' ')   // handle john_doe / john-doe
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  const copySessionInfoToClipboard = async () => {
    const text = sessionInfoRows
      .map((r) => `${r.label}: ${r.value}`)
      .join("\n")
      .trim();

    if (!text) {
      setSessionCopyStatus("failed");
      window.setTimeout(() => setSessionCopyStatus(""), 2200);
      return;
    }

    const tryModern = async (): Promise<boolean> => {
      if (!navigator.clipboard || !window.isSecureContext) return false;
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return false;
      }
    };

    const tryExecCommand = (): boolean => {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        ta.style.top = "0";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, text.length);
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
      } catch {
        return false;
      }
    };

    const ok = (await tryModern()) || tryExecCommand();
    setSessionCopyStatus(ok ? "copied" : "failed");
    window.setTimeout(() => setSessionCopyStatus(""), ok ? 1500 : 2200);
  };

  const envelopeDisplayTitle =
    (envelope?.subject && String(envelope.subject).trim()) ||
    (envelope?.name && String(envelope.name).trim()) ||
    "Document";
  const envelopeSenderName =
    envelope?.sender?.name ||
    envelope?.senderName ||
    envelope?.createdBy?.name ||
    envelope?.owner?.name ||
    "";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f3f4f6] px-0 py-0 sm:px-0">
      {!canBrowseDocument && <DocumentSignatureBackground />}
      <div className="relative z-10 mx-auto flex w-full max-w-none flex-1 flex-col">
        <div className="flex-1">
          {/* Render DocumentViewer in preview mode always; otherwise follow signing/auth flow */}
          {shouldRenderDocumentInBackground && (
            <div
              className={
                canBrowseDocument
                  ? ""
                  : "pointer-events-none select-none"
              }
              aria-hidden={!canBrowseDocument}
            >
              <DocumentViewer
                documents={allDocuments}
                signatureProvider={signatureProvider}
                signatureMethod={signatureMethod}
                allRecipients={allRecipients}
                signatureFields={signatureFields}
                currentUserId={isPreviewMode ? "" : (recipientId || "")}
                envelopeID={id || ""}
                isPublicFlow
                signAppearanceDemo={isSignAppearanceDemo}
                onClose={() => setActiveDocument(null)}
                onSignatureSave={handleSignatureSave}
                cycleId={cycleId || ""}
                setSignatureFields={setSignatureFields}
                isViewOnly={isViewOnly}
                signingEnabled={canSignDocument}
                showActionsMenu={!isPreviewMode && canBrowseDocument}
                headerTitle={
                  inDocumentReviewPhase
                    ? "Review document before signing"
                    : canSignDocument
                      ? "Review and complete"
                      : "View document"
                }
                documentTitle={envelopeDisplayTitle}
                senderName={envelopeSenderName}
                getSignerAccessHeaders={getSignerAccessHeaders}
                commentAuthorName={
                  (currentRecipient as any)?.name ||
                  (currentRecipient as any)?.fullname ||
                  envelopeSenderName ||
                  "Signer"
                }
                showCommentsPanel={showCommentsPanel}
                onCommentsPanelClose={() => setShowCommentsPanel(false)}
                allowDocumentComments={
                  !isPreviewMode && !isViewOnly && canBrowseDocument
                }
                onRecipientComplete={() => {
                  if (isInPerson) handleRecipientComplete();
                  handleSigningCompleted();
                }}
                onSigningRefresh={fetchEnvelopeDetails}
                onRequestActions={() => {
                  if (isPreviewMode) return;
                  setShowOtherOptions((v) => !v);
                  setShowTermsModal(false);
                }}
              />
            </div>
          )}

          {showOtherOptions && !showTermsModal && (
            <div ref={otherOptionsRef} className="fixed right-4 top-16 z-[70]">
              {renderSignerActionsMenu()}
            </div>
          )}

          {inDocumentReviewPhase && (
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[55] flex justify-center px-4 pb-4">
              <div className="pointer-events-auto flex w-full max-w-3xl items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg">
                <p className="text-sm text-gray-700">
                  Review the document, then verify your identity to start signing.
                </p>
                <button
                  type="button"
                  onClick={beginIdentityVerification}
                  className="inline-flex shrink-0 items-center justify-center rounded bg-[#f5c518] px-5 py-2 text-sm font-bold text-gray-900 hover:bg-[#e6b800]"
                >
                  Start
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------- TERMS MODAL (shown first, before auth) ---------- */}
      {!isPreviewMode && showTermsModal && (envelope?.status || "").toString().toLowerCase() !== "completed" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] px-4 py-10"
          onClick={() => setShowOtherOptions(false)}
        >
          <div
            className="w-full max-w-[640px] rounded-lg bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-200 px-8 py-5">
              <div className="flex justify-center">
                <BrandLogo className="h-8 w-auto" />
              </div>
            </div>

            <div className="px-8 py-6">
              <h2 className="text-lg font-semibold text-gray-900">Review and continue</h2>

              <div className="mt-4 text-sm text-gray-600">
                Message from{" "}
                <span className="font-semibold text-gray-900">
                  {capitalizeWords(envelopeSenderName || "Sender")}
                </span>
              </div>
              {(envelope?.message || envelope?.note || envelope?.emailMessage) && (
                <div className="mt-2 rounded bg-sky-50 px-3 py-2 text-sm text-gray-700">
                  {(envelope?.message || envelope?.note || envelope?.emailMessage).toString()}
                </div>
              )}

              <p className="mt-8 text-sm text-gray-700">
                Please read the{" "}
                <a
                  href="/terms-of-service"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#248567] underline hover:text-[#1f7158]"
                >
                  Electronic Record and Signature Disclosure
                </a>
                .
              </p>

              <label className="mt-4 flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-[3px] h-4 w-4 accent-[#248567]"
                  checked={termsChecked}
                  onChange={(e) => setTermsChecked(e.target.checked)}
                />
                <span className="text-sm text-gray-700">
                  I agree to use electronic records and signatures.{" "}
                  <span className="text-red-600">*</span>
                  <div className="mt-1 text-xs text-gray-500">
                    <a href="/terms-of-service" target="_blank" rel="noreferrer" className="underline hover:text-gray-700">
                      Terms and Conditions
                    </a>
                    {" | "}
                    <a href="/privacy-policy" target="_blank" rel="noreferrer" className="underline hover:text-gray-700">
                      Privacy Policy
                    </a>
                  </div>
                </span>
              </label>

              <div className="mt-6 flex items-center justify-end gap-3 pb-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowOtherOptions((v) => !v)}
                    className="inline-flex items-center gap-2 rounded border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    More actions
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </button>

                  {showOtherOptions && (
                    <div className="absolute right-0 top-full z-50 mt-2">
                      {renderSignerActionsMenu()}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={acceptTerms}
                  disabled={!termsChecked}
                  className="rounded bg-[#248567] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1f7158] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- ASSIGN TO SOMEONE ELSE MODAL ---------- */}
      {showAssignModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-[2px] px-4 py-10">
          <div
            className="w-full max-w-lg rounded-lg bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Forward document</h2>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <label className="flex items-start gap-3 rounded bg-[#fff8d6] px-4 py-3 text-sm text-gray-800">
                <input type="checkbox" defaultChecked className="mt-0.5 h-4 w-4 accent-[#248567]" />
                <span>Allow this person to sign the document instead of me.</span>
              </label>

              <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
                <span className="w-10 text-xs font-semibold uppercase tracking-wide text-gray-500">To</span>
                <input
                  type="email"
                  value={assignEmail}
                  onChange={(e) => setAssignEmail(e.target.value)}
                  placeholder="Email"
                  className="min-w-0 flex-1 border-0 bg-transparent px-0 py-1 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                />
              </div>

              <p className="text-sm font-semibold text-gray-900">
                {(currentRecipient as any)?.name || "You"} forwarded &ldquo;{envelopeDisplayTitle}&rdquo; to you.
              </p>

              <textarea
                maxLength={250}
                value={assignReason}
                onChange={(e) => setAssignReason(e.target.value)}
                rows={4}
                placeholder="Optional private message (to person you're forwarding this to)..."
                className="w-full resize-none rounded border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#248567] focus:outline-none focus:ring-1 focus:ring-[#248567]"
              />

              <input
                type="text"
                value={assignName}
                onChange={(e) => setAssignName(e.target.value)}
                placeholder="Recipient name"
                className="w-full rounded border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#248567] focus:outline-none focus:ring-1 focus:ring-[#248567]"
              />

              {assignSubmitError && (
                <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {assignSubmitError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                disabled={isAssignSubmitting}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitAssignToSomeoneElse}
                disabled={!isAssignFormValid || isAssignSubmitting}
                className={
                  !isAssignFormValid || isAssignSubmitting
                    ? "inline-flex items-center justify-center rounded bg-gray-200 px-6 py-2 text-sm font-semibold text-gray-500 cursor-not-allowed"
                    : "inline-flex items-center justify-center rounded bg-[#248567] px-6 py-2 text-sm font-semibold text-white hover:bg-[#1f7158]"
                }
              >
                {isAssignSubmitting ? "Forwarding..." : "Forward"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- DECLINE TO SIGN MODAL ---------- */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-[#2b164a]/55 backdrop-blur-[2px] px-4 py-10">
          <div className="w-full max-w-3xl rounded-2xl bg-[#F7F3EE] shadow-2xl">
            <div className="flex items-center  border-b border-gray-200 pb-2 justify-between px-10 pt-8">
              <h2 className="thankyou-heading text-xl">
                Decline to sign
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowDeclineModal(false);
                  setDeclineReason("");
                  setDeclineSubmitError("");
                }}
                disabled={isDeclineSubmitting}
                className="text-[#2b164a]/70 hover:text-[#2b164a] disabled:opacity-50"
              >
                <X className="h-7 w-7" />
              </button>
            </div>

            <div className="px-10 thankyou-para pb-8 pt-6 text-[#2b164a]">
              <p className="text-base leading-relaxed">
                If you decline, this document will be cancelled and cannot be signed again. Need changes? You can  {" "}
                <span className="font-semibold">Finish Later</span> and reach out to the sender.
              </p>
              <p className="mt-4 text-base leading-relaxed">
                Select <span className="font-semibold">Continue</span> to finish
                declining.
              </p>

              <div className="mt-5">
                <label className="block text-sm font-medium text-[#2b164a]">
                  Reason for declining <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  maxLength={300}
                  rows={4}
                  disabled={isDeclineSubmitting}
                  className="mt-2 w-full resize-none rounded border border-gray-300 px-3 py-2 text-sm focus:border-[#260559] focus:outline-none focus:ring-1 focus:ring-[#260559]"
                  placeholder="Please tell the sender why you are declining..."
                />
                <div className="mt-1 text-xs text-gray-500">
                  {300 - declineReason.length} characters remaining
                </div>
              </div>

              {declineSubmitError && (
                <div className="mt-6 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {declineSubmitError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-6 px-10 pb-10">
              <button
                type="button"
                onClick={() => {
                  if (isFinishLaterSubmitting || isDeclineSubmitting) return;
                  setIsFinishLaterSubmitting(true);
                  window.setTimeout(() => {
                    const env = String(id ?? "");
                    const rid = String(recipientId ?? "");
                    window.location.assign(`/e-sign/signer/finish-later/${env}/${rid}`);
                  }, 1400);
                }}
                disabled={isDeclineSubmitting || isFinishLaterSubmitting}
                className="rounded-md border border-[#2b164a]/40 bg-[#F7F3EE] px-6 py-3 text-base font-medium text-[#2b164a] hover:bg-[#2b164a]/5 disabled:opacity-50"
              >
                {isFinishLaterSubmitting ? "Finishing..." : "Finish Later"}
              </button>
              <button
                type="button"
                onClick={submitDeclineToSign}
                disabled={isDeclineSubmitting || !declineReason.trim()}
                className="rounded-md bg-[#260559] px-7 py-3 text-base font-semibold text-white hover:bg-[#260559]/90 disabled:opacity-50"
              >
                {isDeclineSubmitting ? "Continuing..." : "Continue"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- SESSION INFORMATION MODAL ---------- */}
      {showSessionInfoModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-[#2b164a]/55 backdrop-blur-[2px] px-4 py-10">
          <div className="w-full max-w-2xl rounded-2xl bg-[#F7F3EE] shadow-2xl">
            <div className="flex items-center justify-between px-10 pt-10">
              <h2 className="text-2xl thankyou-heading">
                Session Information
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowSessionInfoModal(false);
                  setSessionCopyStatus("");
                }}
                className="text-[#2b164a]/70 hover:text-[#2b164a]"
              >
                <X className="h-7 w-7" />
              </button>
            </div>

            <div className="px-10 pb-10 pt-6">
              <div className="grid grid-cols-2 gap-x-10 border-b border-gray-200 pb-4 text-sm font-semibold text-[#2b164a]">
                <div>Label</div>
                <div>Content</div>
              </div>

              <div className="thankyou-para divide-y divide-gray-200">
                {sessionInfoRows.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-2 gap-x-10 py-5 text-[#2b164a]"
                  >
                    <div className="text-base">{row.label}</div>
                    <div className="text-base break-all">{row.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-2 flex items-center justify-end gap-4">
                {sessionCopyStatus === "copied" && (
                  <span className="text-sm text-green-700">Copied</span>
                )}
                {sessionCopyStatus === "failed" && (
                  <span className="text-sm text-red-700">Copy failed</span>
                )}
                <button
                  type="button"
                  onClick={copySessionInfoToClipboard}
                  className="rounded-md bg-[#260559] px-7 py-3 text-base font-semibold text-white hover:bg-[#260559]/90"
                >
                  Copy to Clipboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signing completed CTA moved into `DocumentViewer` header */}

      {/* ---------- AUTH MODAL (Condition 1 UI) ---------- */}
      {!isPreviewMode && showAuthModal && !isAuthenticated && currentAuthMethod && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
          <div className="bg-[#F7F3EE] rounded-lg shadow-[0_24px_60px_rgba(0,0,0,0.22)] w-full max-w-lg overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-gray-200 bg-emerald-50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#260559]/10 text-[#260559] ring-1 ring-[#260559]/15">
                    <Shield className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        Verify your identity
                      </h3>
                      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700 ring-1 ring-gray-200">
                        Step {currentAuthIndex + 1} / {Math.max(authMethods.length, 1)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      Complete verification after reviewing the document to continue signing.
                    </p>
                  </div>
                </div>

                {authStatus !== "verifying" && (
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(false)}
                    className="rounded-lg p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {(() => {
                const total = Math.max(authMethods.length, 1);
                const completed = Math.min(
                  total,
                  currentAuthIndex + (authStatus === "success" ? 1 : 0)
                );
                const pct = Math.round((completed / total) * 100);
                return (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>Progress</span>
                      <span className="tabular-nums">{pct}%</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-green-200 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full bg-green-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Content */}
            <div className="p-5">
              {/* Method Card */}
              <div className="rounded-2xl border border-gray-200 bg-[#F7F3EE] p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div
                    className={
                      authStatus === "success"
                        ? "inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-green-100 text-green-700"
                        : authStatus === "failed"
                          ? "inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 text-red-700"
                          : authStatus === "skipping"
                            ? "inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-800"
                            : "inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#260559]/10 text-[#260559]"
                    }
                  >
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="truncate text-base font-semibold text-gray-900">
                        {currentAuthMethod.name}
                      </h4>
                      {retryCount > 0 && (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                          Attempts left: {Math.max(0, 3 - retryCount)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {currentAuthMethod.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status banners */}
              {authStatus === "success" && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Verified successfully. Continuing…
                </div>
              )}
              {authStatus === "failed" && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  <XCircle className="h-5 w-5 text-red-600" />
                  Verification failed.{" "}
                  {retryCount < 2 ? "Please try again." : "Maximum attempts reached."}
                </div>
              )}

              {authStatus === "skipping" && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
                  <RefreshCw className="h-5 w-5 shrink-0 text-amber-700 animate-spin" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-amber-950">
                      Skipping this step…
                    </div>
                    {skipMessage ? (
                      <div className="mt-1 text-xs text-amber-900">{skipMessage}</div>
                    ) : (
                      <div className="mt-1 text-xs text-amber-800">
                        Moving to the next verification option.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pending / method-specific */}
              {authStatus === "pending" && (
                <div className="mt-4 space-y-4">
                  {!currentAction && (
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          requestSkipAuthMethod("Authentication skipped.")
                        }
                        disabled={isVerifying}
                        className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-[#F7F3EE] px-4 py-2 text-sm font-medium text-gray-700 hover:bg-[#F5F2EE] disabled:opacity-50"
                      >
                        Skip
                      </button>
                      <button
                        type="button"
                        onClick={() => verificationStart(currentAuthMethod)}
                        disabled={isVerifying}
                        className="inline-flex items-center justify-center rounded-xl bg-[#260559] px-4 py-2 text-sm font-semibold text-white hover:bg-[#260559]/90 disabled:opacity-50"
                      >
                        {isVerifying ? "Sending…" : "Start verification"}
                      </button>
                    </div>
                  )}

                  {currentAction === "ENTER_OTP" && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                        {verificationMessage ||
                          `A code was sent to your registered email.`}{" "}
                        Enter the {otpLength}-digit code below.
                      </div>

                      <div className="rounded-2xl border border-gray-200 bg-[#F7F3EE] p-4">
                        <label className="block text-sm font-medium text-gray-700">
                          One-time passcode
                        </label>
                        <input
                          type="text"
                          value={otpCode}
                          onChange={(e) => {
                            const value = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, otpLength);
                            setOtpCode(value);
                          }}
                          placeholder={`Enter ${otpLength}-digit code`}
                          className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-base tracking-[0.22em] font-mono focus:outline-none focus:ring-2 focus:ring-[#260559]"
                          maxLength={otpLength}
                          disabled={isVerifying}
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            requestSkipAuthMethod(
                              "You chose to skip this verification method."
                            )
                          }
                          disabled={isVerifying}
                          className="inline-flex items-center justify-center rounded-xl border border-[#260559]/35 bg-[#F7F3EE] px-4 py-2 text-sm font-medium text-[#260559] hover:bg-[#260559]/5 disabled:opacity-50"
                        >
                          Skip
                        </button>
                        <button
                          type="button"
                          onClick={handleOTPSubmit}
                          disabled={isVerifying || otpCode.length !== otpLength}
                          className="inline-flex items-center justify-center rounded-xl bg-[#260559] px-4 py-2 text-sm font-semibold text-white hover:bg-[#260559]/90 disabled:opacity-50"
                        >
                          {isVerifying ? "Verifying…" : "Verify"}
                        </button>
                      </div>
                    </div>
                  )}

                  {currentAction === "CAPTURE_SELFIE" && (
                    <div className="space-y-4">
                      {biometricError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                          {biometricError}
                        </div>
                      )}
                      <SelfieCapture
                        disabled={isVerifying}
                        onSubmit={handleSelfieSubmit}
                      />
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentAction("");
                            setBiometricError("");
                          }}
                          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-[#F7F3EE] px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-[#F5F2EE]"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            requestSkipAuthMethod(
                              "You chose to skip this verification method."
                            )
                          }
                          className="inline-flex items-center justify-center rounded-lg border border-[#260559]/40 bg-[#F7F3EE] px-4 py-2.5 text-sm font-medium text-[#260559] hover:bg-[#260559]/5"
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  )}

                  {currentAction === "CAPTURE_LIVENESS" && (
                    <div className="space-y-4">
                      {biometricError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                          {biometricError}
                        </div>
                      )}
                      <LivenessCapture
                        disabled={isVerifying}
                        onSubmit={handleLivenessSubmit}
                      />
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentAction("");
                            setBiometricError("");
                          }}
                          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-[#F7F3EE] px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-[#F5F2EE]"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            requestSkipAuthMethod(
                              "You chose to skip this verification method."
                            )
                          }
                          className="inline-flex items-center justify-center rounded-lg border border-[#260559]/40 bg-[#F7F3EE] px-4 py-2.5 text-sm font-medium text-[#260559] hover:bg-[#260559]/5"
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  )}

                  {currentAction === "COMPLETE_IDENTITY_VERIFICATION" && (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                        {verificationMessage ||
                          "A verification link was generated. You can continue in a new tab."}
                      </div>

                      {verificationUrl && (
                        <div className="rounded-xl border border-gray-200 bg-[#F7F3EE] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900">
                                Verification link
                              </div>
                              <div className="mt-1 truncate text-xs text-gray-500">
                                {verificationUrl}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                window.location.href = verificationUrl;
                              }}
                              className="shrink-0 inline-flex items-center justify-center rounded-lg bg-[#260559] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#260559]/90"
                            >
                              Open
                            </button>
                          </div>

                          <div className="mt-3 text-xs text-gray-600">
                            Redirecting in{" "}
                            <span className="font-semibold tabular-nums">
                              {redirectCountdown}
                            </span>{" "}
                            seconds…
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentAction("");
                            setVerificationUrl("");
                            setRedirectCountdown(5);
                          }}
                          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-[#F7F3EE] px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-[#F5F2EE]"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            requestSkipAuthMethod(
                              "You chose to skip this verification method."
                            )
                          }
                          className="inline-flex items-center justify-center rounded-lg border border-[#260559]/40 bg-[#F7F3EE] px-4 py-2.5 text-sm font-medium text-[#260559] hover:bg-[#260559]/5"
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {authStatus === "verifying" && (
                <div className="mt-6 flex items-center gap-3 rounded-xl border border-gray-200 bg-[#F7F3EE] px-4 py-4">
                  <RefreshCw className="h-5 w-5 text-[#260559] animate-spin" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      Verifying…
                    </div>
                    <div className="text-xs text-gray-600">
                      Please keep this tab open.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------- SKIP AUTH WARNING MODAL ---------- */}
      {showSkipWarningModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-[2px] px-4 py-10">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-[#F7F3EE] shadow-2xl border border-gray-200">
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-200">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Skip verification?
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    If you skip this authentication method, your identity may remain <span className="font-semibold">unverified</span>.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSkipWarningModal(false);
                  setPendingSkipReason("");
                }}
                className="rounded-lg p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-3">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Skipping can reduce signature assurance. This may notify administrators and your signature may be marked as <span className="font-semibold">not fully validated</span>.
              </div>
              <div className="text-sm text-gray-600">
                You can continue with another verification method, or cancel and complete this step now.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 bg-[#F5F2EE] px-6 py-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowSkipWarningModal(false);
                  setPendingSkipReason("");
                }}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-[#F7F3EE] px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-[#F5F2EE]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSkipAuthMethod}
                className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
              >
                Skip anyway
              </button>
            </div>
          </div>
        </div>
      )}

      <CookiePreferenceCenter
        open={showCookieCenter}
        onClose={() => setShowCookieCenter(false)}
      />

    </div>
  );
};

export default EnvelopeDetails;