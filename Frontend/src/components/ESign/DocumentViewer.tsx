import { Document, Page, pdfjs } from 'react-pdf';
import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import SignPad from './SignPad';

interface Props {
  document: any;
  signatureFields: any[];
  currentUserId: string;
  envelopeID?:string;
  onClose?: () => void;
  onSignatureSave?: (fieldId: string, signatureUrl: string) => void; //
}

Modal.setAppElement('#root');

const DocumentViewer: React.FC<Props> = ({ document, signatureFields, currentUserId, onClose,envelopeID,onSignatureSave}) => {
  const [activeField, setActiveField] = useState<any>(null);
  console.log(`Envelope ID in DocumentViewer: ${envelopeID}`);
    // --- PDF.js worker setup ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Point to the worker file in your public folder
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        console.log("PDF.js worker set to local file: /pdf.worker.min.mjs");
      } catch (err) {
        console.warn("Failed to set PDF.js worker:", err);
      }
    }
  }, []);
  // Multi-page states
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handleFieldClick = (field: any) => {
    setActiveField(field);
  };
  console.log(`Document: ${import.meta.env.VITE_ESIGN_SERVICE_URL}/uploads/${document.name}`)

  return (
    <div className="relative flex flex-col items-center mt-4">
      <button
        onClick={onClose}
        className="mb-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Close
      </button>

      {/* PDF Container */}
      <div className="relative border border-gray-300 rounded-lg shadow-sm bg-white overflow-auto max-w-4xl max-h-[80vh] p-2">
        <Document
          file={document.filePath || `${import.meta.env.VITE_ESIGN_SERVICE_URL}/uploads/${document.name}`}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        >
          <Page pageNumber={currentPage} />
        </Document>

        {/* Signature Fields */}
        <div className="absolute top-0 left-0 w-full h-full">
          {signatureFields
            .filter(field => (field.page.$numberInt || field.page) === currentPage) // page filter
            .map(field => {
              const isCurrentUser = field.recipientId === currentUserId;
              const isSigned = !!field.signature;
              const signedImage = field.signature; // this should be the base64 or image URL

              return (
                <div
                  key={field._id.$oid || field._id}
                  style={{
                    position: 'absolute',
                    top: field.y.$numberDouble || field.y,
                    left: field.x.$numberDouble || field.x,
                    width: field.width.$numberInt || field.width,
                    height: field.height.$numberInt || field.height,
                    zIndex: 10,
                    pointerEvents: isCurrentUser && !isSigned ? 'auto' : 'none',
                  }}
                  className={`flex items-center justify-center text-sm font-semibold rounded border-2 ${
                    isSigned
                      ? ' border-green-500 '
                      : isCurrentUser
                      ? 'bg-blue-100 border-blue-500 text-blue-700 cursor-pointer hover:bg-blue-200'
                      : 'bg-gray-100 border-gray-300 text-gray-500 opacity-50'
                  }`}
                  onClick={() => isCurrentUser && !isSigned && handleFieldClick(field)}
                >
                  {isSigned ? (
                    <img
                      src={signedImage}
                      alt="Signed"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    isCurrentUser ? 'Sign Here' : 'Signature'
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Page Navigation */}
      {numPages > 1 && (
        <div className="flex justify-between mt-2 w-full max-w-4xl px-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {currentPage} / {numPages}</span>
          <button
            disabled={currentPage >= numPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Next
          </button>
        </div>
      )}

      {/* Signature Modal */}
        {activeField && (
          <SignPad
            isSignPad={!!activeField}
            setIsSignPad={(open: boolean) => {
              if (!open) setActiveField(null);
            }}
            activeField={activeField}
            currentUserId={currentUserId}
            documentId={document.id}
            envelopeID={envelopeID}
            defaultSign={null} // if you have a default saved signature
            onSaveSign={(fieldId: string, signatureUrl: string) => {
                          // Forward event to parent
                          onSignatureSave?.(fieldId, signatureUrl);
                          setActiveField(null);
                        }}
          />
        )}
    </div>
  );
};

export default DocumentViewer;
