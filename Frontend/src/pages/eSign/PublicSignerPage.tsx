import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { eSignApi } from "../../services/apiHelper";
import DocumentViewer from "../../components/ESign/DocumentViewer";
import { FileText, Download, CheckCircle, X } from "lucide-react";

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

  const esignBase = ((import.meta as any).env?.VITE_ESIGN_SERVICE_URL || "")
    .toString()
    .trim()
    .replace(/\/+$/, "");

  const handleDownloadSigned = () => {
    if (!id || !esignBase) return;
    const url = `${esignBase}/api/e-sign/signatures/download/${id}`;
    window.open(url, "_blank");
  };

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

  return (
    <div className="min-h-screen bg-slate-100 px-3 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
        <div className="flex-1">
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
        </div>
      </div>

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
                onClick={handleDownloadSigned}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#3E2B66] hover:bg-[#4a3791]"
              >
                <Download className="w-4 h-4" />
                Download signed document
              </button>
              <button
                type="button"
                onClick={handleDownloadAll}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-[#3E2B66] border border-[#3E2B66] hover:bg-[#f5f0ff] bg-white"
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
