import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { eSignApi } from "../../services/apiHelper";
import DocumentViewer from "../../components/ESign/DocumentViewer";
import { FileText } from "lucide-react";

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
  // HandleSignApplied

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
          />
        </div>
      </div>
    </div>
  );
};

export default EnvelopeDetails;
