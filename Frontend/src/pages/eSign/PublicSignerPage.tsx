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
  const [activeDocument, setActiveDocument] = useState<any>(null);
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
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
        // Preload all signature fields across documents for continuous view
        const allFields: any[] = [];
        for (const d of docs) {
          try {
            const res = await eSignApi.get(`/api/e-sign/public/document/signature-fields/${d.id}`);
            if (res.status === 200 && Array.isArray(res.data.signatureFields)) {
              allFields.push(...res.data.signatureFields);
            }
          } catch (err) {
            console.warn('Failed to load signature fields for document', d.id);
          }
        }
        setSignatureFields(allFields);
        // keep compatibility: select first document (not required for continuous viewer)
        if (docs.length > 0) setActiveDocument(docs[0]);
      }
    } catch (error) {
      console.error("Error fetching envelope:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSignatureFields = async (documentId: string) => {
    try {
      const response = await eSignApi.get(
        `/api/e-sign/public/document/signature-fields/${documentId}`
      );
      if (response.status === 200) {
        setSignatureFields(response.data.signatureFields);
      }
    } catch (err) {
      console.error("Error fetching signature fields", err);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading...
      </div>
    );
  }

  if (!envelope) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-600">
        <FileText className="w-12 h-12 text-gray-400 mb-4" />
        <p>Envelope not found or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <DocumentViewer
        documents={allDocuments}
        signatureFields={signatureFields}
        currentUserId={recipientId || ""}
        envelopeID={id || ""}
        onClose={() => setActiveDocument(null)}
        onSignatureSave={handleSignatureSave}
        cycleId={cycleId || ""}
      />
    </div>
  );
};

export default EnvelopeDetails;
