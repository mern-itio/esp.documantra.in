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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnvelopeDetails();
  }, []);

  const fetchEnvelopeDetails = async () => {
    try {
      const response = await eSignApi.get(`/api/e-sign/public/envelope/${id}`);
      if (response.status === 200) {
        setEnvelope(response.data.data);

        // Auto-select the first document for signing
        if (response.data.data.documents?.length > 0) {
            const doc = response.data.data.documents[0];
            setActiveDocument(doc);
            await fetchSignatureFields(doc.id);
        }
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      {activeDocument ? (
        <DocumentViewer
          document={activeDocument}
          signatureFields={signatureFields}
          currentUserId={recipientId || ""}
          envelopeID={id || ""}
          onClose={() => setActiveDocument(null)}
          onSignatureSave={handleSignatureSave}
          cycleId={cycleId || ""}
        />
      ) : (
        <button
          onClick={() => setActiveDocument(envelope.documents[0])}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start Signing
        </button>
      )}
    </div>
  );
};

export default EnvelopeDetails;
