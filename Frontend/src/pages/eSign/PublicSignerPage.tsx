import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { eSignApi, subscriptionApi } from "../../services/apiHelper";
import DocumentViewer from "../../components/ESign/DocumentViewer";
import * as Icons from "lucide-react";
import {
  FileText,
  Download,
  CheckCircle,
  X,
  Shield,
  RefreshCw,
  XCircle
} from "lucide-react";

interface UISchema {
 securityLevel: string;
 estimatedTime: string;
 costInfo: string;
 complianceInfo: [string];
 icon: string;
}
interface AuthMethod{
  id: string;
  name: string;
  description: string;
  uiSchema:UISchema;
}
interface AuthList{
  _id: string;
  authMethodId: string;
  status: "pending" | "completed" | "rejected";
}

const EnvelopeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { recipientId } = useParams<{ recipientId: string }>();
  const { cycleId } = useParams<{ cycleId: string }>();
  const [envelope, setEnvelope] = useState<any>(null);
  const [signatureFields, setSignatureFields] = useState<any[]>([]);
  const [_activeDocument, setActiveDocument] = useState<any>(null);
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [allRecipients, setAllRecipients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  /* ---------- AUTH STATES (added) ---------- */
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMethods, setAuthMethods] = useState<AuthMethod[]>([]);
  const [currentAuthIndex, setCurrentAuthIndex] = useState(0);
  const [authStatus, setAuthStatus] = useState<'pending' | 'verifying' | 'success' | 'failed'>('pending');
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

  useEffect(() => {
    fetchEnvelopeDetails();
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
  const currentRecipient = allRecipients.find(
    (r: any) => normId(r) === String(recipientId ?? "")
  );
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

  /* ---------- condition logic (added) ----------
     Condition 1: Envelope incomplete + auth pending -> show auth modal only
     Condition 2: Envelope incomplete + auth completed -> show DocumentViewer
     Condition 3: Envelope completed -> show Download modal only
  */
  useEffect(() => {
    // only run when envelope & recipient available
    if (!envelope || !currentRecipient) return;

    const envStatus = (envelope.status || "").toString().toLowerCase();
    const rawAuthentication = currentRecipient.authentication;
    const authList: AuthList[] = JSON.parse(rawAuthentication);
    const authCompleted = authList.every(a => a.status === "completed");
    const pendingAuth = authList.filter(a => a.status === "pending");

    // Condition 3
    if (envStatus === "completed") {
      setShowDownloadModal(true);
      setShowAuthModal(false);
      setIsAuthenticated(false);
      return;
    }

    // Envelope incomplete
    if (!authCompleted) {
            console.log("Its condition 1");
      // Condition 1
      setShowAuthModal(true);
      setIsAuthenticated(false);
      console.log("Starting auth flow for recipient", currentRecipient.authentication);
      const loadAuthMethods = async () => {
      const methods = await fetchPendingAuthMethodDetails(pendingAuth);
      if(methods.length === 0){
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
      setCurrentAction(''); // Reset action
    } else {
      // Condition 2
      console.log("Its condition 2");
      setIsAuthenticated(true);
      setShowAuthModal(false);
    }
  }, [envelope, currentRecipient]);

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

    setAuthStatus('pending');
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

  const esignBase = ((import.meta as any).env?.VITE_ESIGN_SERVICE_URL || "")
    .toString()
    .trim()
    .replace(/\/+$/, "");

  // const handleDownloadSigned = () => {
  //   if (!id || !esignBase) return;
  //   const url = `${esignBase}/api/e-sign/signatures/download/${id}`;
  //   window.open(url, "_blank");
  // };

  const handleDownloadAll = () => {
    if (!id || !esignBase) return;
    const url = `${esignBase}/api/e-sign/signatures/download-all/${id}`;
    window.open(url, "_blank");
  };

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
  const IconComponent = (Icons[currentAuthMethod?.uiSchema?.icon as keyof typeof Icons] as any) ||
    Icons.HelpCircle;
  return (
    <div className="min-h-screen bg-slate-100 px-3 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
        <div className="flex-1">
          {/* Render DocumentViewer only when envelope is NOT completed and auth is done */}
          { ( (envelope?.status || "").toString().toLowerCase() !== "completed" )
            && isAuthenticated && (
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
              isViewOnly={isViewOnly}
              onRecipientComplete={
                isInPerson ? handleRecipientComplete : undefined
              }
            />
          )}
        </div>
      </div>

      {/* ---------- AUTH MODAL (Condition 1 UI) ---------- */}
      { showAuthModal && !isAuthenticated && currentAuthMethod && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#260559] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Authentication Required</h3>
                  <p className="text-white/80 text-sm">
                    Step {currentAuthIndex + 1} of {authMethods.length || 1}
                  </p>
                </div>
              </div>
              {authStatus !== 'verifying' && (
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Current Method Display */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-4 rounded-xl ${
                  authStatus === 'success' ? 'bg-green-100' :
                  authStatus === 'failed' ? 'bg-red-100' :
                  'bg-[#260559]/10'
                }`}>
                  <div className={`${
                    authStatus === 'success' ? 'text-green-600' :
                    authStatus === 'failed' ? 'text-red-600' :
                    'text-[#260559]'
                  }`}>
                   <IconComponent className="w-6 h-6" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{currentAuthMethod.name}</h4>
                  <p className="text-sm text-gray-600">{currentAuthMethod.description}</p>
                </div>
              </div>

              {/* Retry Counter */}
              {retryCount > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <span className="font-semibold">Remaining attempts:</span> {3 - retryCount} of 3
                  </p>
                </div>
              )}

              {/* Status Messages */}
              {authStatus === 'success' && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-green-800 font-medium">Authentication successful!</p>
                </div>
              )}

              {authStatus === 'failed' && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-800 font-medium">
                    Authentication failed. {retryCount < 2 ? 'Please try again.' : 'Maximum attempts reached.'}
                  </p>
                </div>
              )}

              {/* Method-Specific UI */}
              {authStatus === 'pending' && (
                <div className="space-y-4">
                  {/* Message for skipped/unsupported method */}
                  {skipMessage && (
                    <div className="mb-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
                      {skipMessage}
                    </div>
                  )}

                  {/* Show Start Verification button when no action is set yet */}
                  {!currentAction && (
                    <div className="space-y-4">
                      <div className="text-center py-4">
                        <button
                            onClick={() => verificationStart(currentAuthMethod)}
                            className="w-full px-6 py-3 bg-[#260559] hover:bg-[#260559]/90 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isVerifying}
                          >
                            {isVerifying ? 'Sending OTP...' : 'Start Verification'}
                        </button>
                      </div>

                      <div className="text-center">
                        <button
                          onClick={() => skipCurrentAuthMethod('Moved to next authentication option.')}
                          className="w-full px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                          disabled={isVerifying}
                        >
                          Skip this method
                        </button>
                      </div>
                    </div>
                  )}

                  {/* OTP Input UI */}
                  {currentAction === 'ENTER_OTP' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-900">
                          {verificationMessage || `OTP has been sent to your registered email`}. Please enter the {otpLength}-digit code below.
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Enter OTP
                        </label>
                        <input
                          type="text"
                          value={otpCode}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, otpLength);
                            setOtpCode(value);
                          }}
                          placeholder={`Enter ${otpLength}-digit OTP`}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#260559] text-center text-lg tracking-widest font-mono"
                          maxLength={otpLength}
                          disabled={isVerifying}
                        />
                        <p className="text-xs text-gray-500 text-center">
                          {otpCode.length} / {otpLength}
                        </p>
                      </div>

                      <button
                        onClick={handleOTPSubmit}
                        className="w-full px-6 py-3 bg-[#260559] hover:bg-[#260559]/90 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isVerifying || otpCode.length !== otpLength}
                      >
                        {isVerifying ? 'Verifying OTP...' : 'Verify OTP'}
                      </button>

                      <button
                        onClick={() => {
                          setCurrentAction('');
                          setOtpCode('');
                        }}
                        className="w-full px-6 py-2 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        disabled={isVerifying}
                      >
                        Back
                      </button>

                      <button
                        onClick={() => skipCurrentAuthMethod('You chose to skip this verification method.')}
                        className="w-full px-6 py-2 text-[#260559] border border-[#260559] rounded-lg font-medium hover:bg-[#f5f0ff] transition-colors"
                        disabled={isVerifying}
                      >
                        Skip this method
                      </button>
                    </div>
                  )}

                  {/* Redirect to external verification URL */}
                  {currentAction === 'COMPLETE_IDENTITY_VERIFICATION' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-900">
                          {verificationMessage || 'Verification URL has been generated. You will be redirected shortly.'}
                        </p>
                      </div>

                      {verificationUrl && (
                        <p className="text-sm text-gray-600 text-center">
                          Redirecting in <span className="font-semibold">{redirectCountdown}</span> seconds...
                        </p>
                      )}

                      {verificationUrl && (
                        <div className="text-center">
                          <a
                            href={verificationUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-[#260559] hover:underline"
                          >
                            Open verification page now
                          </a>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setCurrentAction('');
                          setVerificationUrl('');
                          setRedirectCountdown(5);
                        }}
                        className="w-full px-6 py-2 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      >
                        Back
                      </button>

                      {verificationUrl && (
                        <button
                          onClick={() => {
                            window.location.href = verificationUrl;
                          }}
                          className="w-full px-6 py-2 text-[#260559] border border-[#260559] rounded-lg font-medium hover:bg-[#f5f0ff] transition-colors"
                        >
                          Go now
                        </button>
                      )}

                      <button
                        onClick={() => skipCurrentAuthMethod('You chose to skip this verification method.')}
                        className="w-full px-6 py-2 text-[#260559] border border-[#260559] rounded-lg font-medium hover:bg-[#f5f0ff] transition-colors"
                      >
                        Skip this method
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Verifying State */}
              {authStatus === 'verifying' && (
                <div className="text-center py-8">
                  <RefreshCw className="w-16 h-16 text-[#260559] mx-auto mb-4 animate-spin" />
                  <p className="text-gray-700 font-medium">Verifying authentication...</p>
                  <p className="text-sm text-gray-600 mt-2">Please wait</p>
                </div>
              )}

              {/* Progress Indicator */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="text-sm font-semibold text-[#260559]">
                    {currentAuthIndex + 1} / {Math.max(authMethods.length, 1)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#260559] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((currentAuthIndex + 1) / Math.max(authMethods.length, 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) }

      {/* Download Modal (Condition 3) */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              type="button"
              onClick={() => setShowDownloadModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Signing completed
                </h2>
                <p className="text-sm text-gray-600">
                  You can now download the signed document and completion
                  certificate.
                </p>
              </div>
            </div>
            <div className="space-y-3 mt-4">
              <button
                type="button"
                onClick={handleDownloadAll}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#3E2B66] hover:bg-[#4a3791]"
              >
                <Download className="w-4 h-4" />
                Download documents & certificate
              </button> 
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EnvelopeDetails;