import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { eSignApi, subscriptionApi } from "../../services/apiHelper";
import DocumentViewer from "../../components/ESign/DocumentViewer";
import * as Icons from "lucide-react";
import {
  FileText,
  CheckCircle,
  X,
  Shield,
  RefreshCw,
  XCircle,
  ChevronDown
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
  const [envelope, setEnvelope] = useState<any>(null);
  const [signatureFields, setSignatureFields] = useState<any[]>([]);
  const [_activeDocument, setActiveDocument] = useState<any>(null);
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [allRecipients, setAllRecipients] = useState<any[]>([]);
  const [currentRecipient,setCurrentRecipient] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [_showDownloadModal, setShowDownloadModal] = useState(false);

  /* ---------- TERMS & CONDITIONS GATE ---------- */
  const TERMS_VERSION = "v1";
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [showOtherOptions, setShowOtherOptions] = useState(false);
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
  const [verificationUrl, setVerificationUrl] = useState<string>(''); // For redirects to external identity verification
  const [redirectCountdown, setRedirectCountdown] = useState<number>(5);
  const [skipMessage, setSkipMessage] = useState<string>(''); // If current method can't be used, show message then auto-advance
  const [showSkipWarningModal, setShowSkipWarningModal] = useState(false);
  const [pendingSkipReason, setPendingSkipReason] = useState<string>("");

  useEffect(() => {
    fetchEnvelopeDetails();
    console.log('Fetched Envelope details');
  }, []);

  const fetchEnvelopeDetails = async () => {
    try {
      const response = await eSignApi.get(`/api/e-sign/public/envelope/${id}`);
      if (response.status === 200) {
        setEnvelope(response.data.data);
        const docs = response.data.data.documents || [];
        setAllDocuments(docs);
        const recipients = response.data.data.recipients || [];
        setAllRecipients(recipients);
        if(!cycleId){
          const rowcurrentRecipient = recipients.find(
            (r: any) => normId(r) === String(recipientId ?? "")
          );
          setCurrentRecipient(rowcurrentRecipient);
        }else{
          await fetchCurrentRecipient(recipientId);
        }
        const allFields: any[] = [];
        for (const d of docs) {
          try {
            const res = await eSignApi.get(
              `/api/e-sign/public/document/signature-fields/${d.id}`
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
      }
    } catch (error) {
      console.error("Error fetching envelope:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchCurrentRecipient = async(recipientId:any) =>{
    const response = await eSignApi.post('api/e-sign/public/fetch/current-recipient',{
      cycleId:cycleId,
      currentRecipientId:recipientId
    });
    if(response.status==200){
      setCurrentRecipient(response.data.currentRecipient);
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
    !!currentRecipient &&
    (role === "carbon_copy" || role === "cc");
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

  /* ---------- condition logic (added) ----------
     Flow: Terms first -> then Auth -> then DocumentViewer
     Condition 1: Envelope incomplete + terms not accepted -> show terms modal only
     Condition 1b: Envelope incomplete + terms accepted + auth pending -> show auth modal
     Condition 2: Envelope incomplete + terms accepted + auth completed -> show DocumentViewer
     Condition 3: Envelope completed -> show Download modal only
  */
  useEffect(() => {
    // only run when envelope & recipient available
    if (!envelope || !currentRecipient) return;

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

    if (envStatus === "completed" || recipientAlreadyCompleted) {
      console.log('In completed block');
      // On first load (re-opening a completed envelope) auto-redirect to status page.
      // But when the user just finished signing in this session, do NOT auto-redirect;
      // we want them to click the "Complete" button in the viewer header.
      if (initialCompletionRedirectRef.current && !showSigningDoneModal) {
        try {
          const envId = String(id ?? "");
          const rid = String(recipientId ?? "");
          window.location.assign(`/e-sign/signer/status/${envId}/${rid}`);
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
        setShowAuthModal(true);
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
  }, [envelope, currentRecipient, termsStorageKey]);

  useEffect(() => {
    // Show terms when envelope is active (not completed) and terms not yet accepted (terms first, before auth)
    if (!envelope) return;
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
  }, [envelope, termsStorageKey]);

  const acceptTerms = async() => {
    if (!termsChecked) return;
    try {
      const response = await eSignApi.post(
        `/api/e-sign/public/envelope/accept-terms`,
        {
          envelopeId: String(id ?? ""),
          recipientId: String(recipientId ?? ""),
          cycleId:String(cycleId ?? "")
        });
        if(response.status==200){
            window.localStorage.setItem(termsStorageKey, "true");
            setTermsAccepted(true);
            setShowTermsModal(false);
            setShowOtherOptions(false);
            // After accepting terms, show auth modal if auth is still pending
            if (currentRecipient && envelope && (envelope.status || "").toString().toLowerCase() !== "completed") {
              try {
                const authList: AuthList[] = JSON.parse(currentRecipient.authentication);
                const authCompleted = authList.every((a: AuthList) => a.status === "completed");
                if (!authCompleted) setShowAuthModal(true);
              } catch {
                console.log('Catch Block Exicuted');
                // ignore parse errors
              }
            }else{
              console.log('Else Block Exicuted');
            }
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

    // Refresh to get latest recipient statuses/envelope status
    try {
      await fetchEnvelopeDetails();
    } catch {
      // ignore; we can still compute from current state
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-gray-600">
        Loading...
      </div>
    );
  }

  if (!envelope) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 text-center text-gray-600">
        <FileText className="mb-4 h-12 w-12 text-gray-400" />
        <p>Envelope not found or has been removed.</p>
      </div>
    );
  }
  if (showAssignedAwayPage) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-700">
            <CheckCircle className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Signing request reassigned
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            You have assigned this document to another signer. Your signing session is now closed.
          </p>

          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <div><span className="font-medium">New signer:</span> {assignedAwayToName || "—"}</div>
            <div className="mt-1"><span className="font-medium">Email:</span> {assignedAwayToEmail || "—"}</div>
          </div>

          <p className="mt-5 text-xs text-gray-500">
            The sender and new signer are notified. You will receive further updates as a Carbon Copy recipient.
          </p>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => window.location.assign("/")}
              className="inline-flex items-center justify-center rounded-lg bg-[#260559] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#260559]/90"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }
  const IconComponent = (Icons[currentAuthMethod?.uiSchema?.icon as keyof typeof Icons] as any) ||
    Icons.HelpCircle;

  const isEnvelopeCompleted =
    (envelope?.status || "").toString().toLowerCase() === "completed";
  const canInteractWithDocument = isAuthenticated && termsAccepted;
  const shouldRenderDocumentInBackground =
    (!isEnvelopeCompleted || showSigningDoneModal) &&
    (isAuthenticated || showAuthModal || showTermsModal || showSigningDoneModal);

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
        window.location.assign(`/e-sign/signer/status/${envId}/${rid}`);
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
    const envelopeIdValue = String(id ?? "").trim() || "—";
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
      { label: "Envelope ID", value: envelopeIdValue },
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

  return (
    <div className="min-h-screen bg-slate-100 px-3 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
        <div className="flex-1">
          {/* Render DocumentViewer only when envelope is NOT completed and auth is done */}
          {shouldRenderDocumentInBackground && (
            <div
              className={
                canInteractWithDocument
                  ? ""
                  : "pointer-events-none select-none blur-[2px] opacity-70"
              }
              aria-hidden={!canInteractWithDocument}
            >
              <DocumentViewer
                documents={allDocuments}
                allRecipients={allRecipients}
                signatureFields={signatureFields}
                currentUserId={recipientId || ""}
                envelopeID={id || ""}
                onClose={() => setActiveDocument(null)}
                onSignatureSave={handleSignatureSave}
                cycleId={cycleId || ""}
                setSignatureFields={setSignatureFields}
                isViewOnly={isViewOnly || !canInteractWithDocument}
                onRecipientComplete={() => {
                  if (isInPerson) handleRecipientComplete();
                  handleSigningCompleted();
                }}
                onRequestActions={() => {
                  // Show the same dropdown options that are normally on the Terms modal
                  setShowOtherOptions((v) => !v);
                  setShowTermsModal(false);
                }}
              />
            </div>
          )}

          {showOtherOptions && !showTermsModal && (
            <div ref={otherOptionsRef} className="fixed right-4 top-10 z-50">
              <div className="w-56 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg max-h-64">
                <button
                  type="button"
                  onClick={() => {
                    setShowOtherOptions(false);
                    setShowAssignModal(true);
                  }}
                  className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Reassign Document
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowOtherOptions(false);
                    setShowDeclineModal(true);
                  }}
                  className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Reject Request
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
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------- TERMS MODAL (shown first, before auth) ---------- */}
      {showTermsModal && (envelope?.status || "").toString().toLowerCase() !== "completed" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2b164a]/55 backdrop-blur-[2px] px-4 py-10"
          onClick={() => setShowOtherOptions(false)}
        >
          <div
            className="w-full max-w-[760px] rounded-lg bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-8 pt-7">
              <div className="flex items-center gap-2 border-b border-gray-400 pb-2">
                <span className="mx-auto">
                  <img src="/Logo.png" alt="docusign" className="h-15 w-auto " />
                </span>

              </div>

              <div className="mt-6 text-[20px] thankyou-heading font-semibold text-gray-900">
                Review and continue
              </div>

              <div className=" text-sm text-gray-700">
                <div className="text-xs text-gray-500">
                  Message from <b>{
                    capitalizeWords(
                      envelope?.sender?.name ||
                      envelope?.senderName ||
                      envelope?.createdBy?.name ||
                      envelope?.owner?.name ||
                      "Sender"
                    )
                  }</b>
                </div>
                {(envelope?.message || envelope?.note || envelope?.emailMessage) && (
                  <div className="mt-2 h-8 p-1 bg-emerald-100 rounded-sm text-sm text-gray-700">
                    {(envelope?.message || envelope?.note || envelope?.emailMessage).toString()}
                  </div>
                )}
              </div>

              <div className="mt-12 aadhar-heading text-sm text-gray-700">
                Please read the{" "}
                <a
                  href="/terms-of-service"
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-800 underline hover:text-blue-900"
                >
                  Electronic Record and Signature Disclosure
                </a>
                .
              </div>

              <div className="mt-3 flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-[3px] h-4 w-4 accent-[#260559]"
                  checked={termsChecked}
                  onChange={(e) => setTermsChecked(e.target.checked)}
                />
                <div className="aadhar-heading text-sm text-gray-700">
                  <span>I agree to use electronic records and signatures.</span>{" "}
                  <span className="text-red-600">*</span>
                  <div className="mt-1 text-xs text-gray-500">
                    <a
                      href="/terms-of-service"
                      target="_blank"
                      rel="noreferrer"
                      className="mr-3 text-gray-700 underline hover:text-blue-900"
                    >
                      Terms and Conditions
                    </a>
                    {" | "}
                    <a
                      href="/privacy-policy"
                      target="_blank"
                      rel="noreferrer"
                      className="ml-3 text-gray-700 underline hover:text-blue-900"
                    >
                      Privacy Policy
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end pb-8">

                <div className="relative flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowOtherOptions((v) => !v)}
                    className="inline-flex items-center gap-2 rounded bg-gray-100 px-4 py-2 text-sm text-gray-800 hover:bg-gray-200"
                  >
                    Other Options
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  </button>

                  {showOtherOptions && (
                    <div className="absolute right-0 top-full mt-2 z-50 w-56 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg max-h-64">
                      <button
                        type="button"
                        onClick={() => {
                          setShowOtherOptions(false);
                          setShowAssignModal(true);
                        }}
                        className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Reassign Document
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowOtherOptions(false);
                          setShowDeclineModal(true);
                        }}
                        className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Reject Request
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
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={acceptTerms}
                    disabled={!termsChecked}
                    className="rounded bg-[#260559] px-5 py-2 text-sm font-semibold text-white hover:bg-[#260559]/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- ASSIGN TO SOMEONE ELSE MODAL ---------- */}
      {showAssignModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-[2px] px-4 py-10">
          <div
            className="w-full max-w-2xl rounded-lg bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-8 py-5">
              <h2 className="text-xl thankyou-heading">
                Assign to Someone Else
              </h2>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-8 py-6 space-y-5">
              <div>
                <label className="thankyou-para block text-sm font-medium">
                  New Signer's Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={assignName}
                  onChange={(e) => setAssignName(e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-[#260559] focus:outline-none focus:ring-1 focus:ring-[#260559]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium thankyou-para">
                  New Signer's Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={assignEmail}
                  onChange={(e) => setAssignEmail(e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-[#260559] focus:outline-none focus:ring-1 focus:ring-[#260559]"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-500">
                    💬
                  </span>
                  Provide a reason for assigning to someone else
                </label>
                <textarea
                  maxLength={250}
                  value={assignReason}
                  onChange={(e) => setAssignReason(e.target.value)}
                  rows={4}
                  className="mt-2 w-full resize-none rounded border border-gray-300 px-3 py-2 text-sm focus:border-[#260559] focus:outline-none focus:ring-1 focus:ring-[#260559]"
                />
                <div className="mt-1 thankyou-para text-xs text-gray-500">
                  {250 - assignReason.length} characters remaining
                </div>
              </div>

              <p className="text-xs thankyou-para text-gray-500">
                The sender and the new signer will be notified of these changes.
                You will be added as a Carbon Copy (CC) recipient.
              </p>

              {assignSubmitError && (
                <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {assignSubmitError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t bg-gray-50 px-8 py-4">
              <button
                type="button"
                onClick={submitAssignToSomeoneElse}
                disabled={!isAssignFormValid || isAssignSubmitting}
                className={
                  !isAssignFormValid || isAssignSubmitting
                    ? "inline-flex items-center justify-center rounded bg-yellow-200 px-6 py-2 text-sm font-semibold text-gray-500 cursor-not-allowed"
                    : "inline-flex items-center justify-center rounded bg-yellow-300 px-6 py-2 text-sm font-semibold text-black hover:bg-yellow-200"
                }
              >
                {isAssignSubmitting ? "ASSIGNING..." : "ASSIGN"}
              </button>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                disabled={isAssignSubmitting}
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- DECLINE TO SIGN MODAL ---------- */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-[#2b164a]/55 backdrop-blur-[2px] px-4 py-10">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
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
                className="rounded-md border border-[#2b164a]/40 bg-white px-6 py-3 text-base font-medium text-[#2b164a] hover:bg-[#2b164a]/5 disabled:opacity-50"
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
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
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
      {showAuthModal && !isAuthenticated && currentAuthMethod && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-[0_24px_60px_rgba(0,0,0,0.22)] w-full max-w-lg overflow-hidden border border-gray-200">
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
                      Complete verification to continue signing.
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
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
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
                        className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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

                      <div className="rounded-2xl border border-gray-200 bg-white p-4">
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
                          className="inline-flex items-center justify-center rounded-xl border border-[#260559]/35 bg-white px-4 py-2 text-sm font-medium text-[#260559] hover:bg-[#260559]/5 disabled:opacity-50"
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

                  {currentAction === "COMPLETE_IDENTITY_VERIFICATION" && (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                        {verificationMessage ||
                          "A verification link was generated. You can continue in a new tab."}
                      </div>

                      {verificationUrl && (
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
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
                          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
                          className="inline-flex items-center justify-center rounded-lg border border-[#260559]/40 bg-white px-4 py-2.5 text-sm font-medium text-[#260559] hover:bg-[#260559]/5"
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {authStatus === "verifying" && (
                <div className="mt-6 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4">
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
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200">
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

            <div className="flex items-center justify-end gap-3 bg-gray-50 px-6 py-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowSkipWarningModal(false);
                  setPendingSkipReason("");
                }}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
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


    </div>
  );
};

export default EnvelopeDetails;