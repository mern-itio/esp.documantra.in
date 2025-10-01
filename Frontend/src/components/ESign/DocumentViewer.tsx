import { Document, Page, pdfjs } from 'react-pdf';
import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import SignPad from './SignPad';
import { eSignApi } from '../../services/apiHelper';

interface Props {
  document: any;
  signatureFields: any[];
  currentUserId: string;
  envelopeID?:string;
  onClose?: () => void;
  onSignatureSave?: (fieldId: string, signatureUrl: string) => void;
  cycleId?:string;
}

Modal.setAppElement('#root');

const DocumentViewer: React.FC<Props> = ({ document, signatureFields, currentUserId, onClose,envelopeID,onSignatureSave,cycleId}) => {
  const urlParams = new URLSearchParams(window.location.search);
  const selfValue = urlParams.get('self'); 
  const [activeField, setActiveField] = useState<any>(null);
  const [selfSigner, setSelfSigner] = useState<any>(null);
  console.log(`Envelope ID in DocumentViewer: ${envelopeID}`);
    // --- PDF.js worker setup ---
  useEffect(() => {
    console.log(selfValue); // "1"
    if(selfValue==="1"){
      getSelfSigner();
    }else{
      console.log("Regular Signer Mode Enabled");
    }
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
    console.log("Field clicked:", field);
    setActiveField(field);
  };
  console.log(`Document: ${import.meta.env.VITE_ESIGN_SERVICE_URL}/uploads/${document.name}`)
  const getSelfSigner = async () => {
    try {
      const response = await eSignApi.get(`/api/e-sign/public/envelope/self-signer/${cycleId}`);
      if (response && response.data) {
        setSelfSigner(response.data);
      } else {
        console.warn("No self-signer data found in response");
      }
    } catch (err) {
      console.error('Failed to load self-signer data:', err);
    }
  };

  return (
    <div className="relative flex flex-col items-center mt-4">
      {/* PDF Container */}
      <div className="relative border border-gray-300 rounded-lg shadow-sm bg-white overflow-auto max-w-4xl max-h-[80vh] p-2">
      <button
        onClick={onClose}
        className="mb-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 z-20"
      >
        Close
      </button>
        <Document
          file={document.filePath || `${import.meta.env.VITE_ESIGN_SERVICE_URL}/uploads/${document.name}`}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        >
          <Page pageNumber={currentPage} />
        </Document>

        {/* Signature Fields */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {signatureFields
            .filter(field => (field.page.$numberInt || field.page) === currentPage)
            .map(field => {
              const isSignatureType = field.type === "signature";
              let isCurrentUser;
                if (selfValue === "1") { 
                  // self-signing mode
                  isCurrentUser =  selfSigner?.some((s:any) =>s.signerSlotId === field.slotId && s._id.toString() === currentUserId.toString());
                } else {
                  // Regular signing mode
                    isCurrentUser = field.recipientId === currentUserId; 
                }
              let isSigned = false;
              let signedImage = null;
               if (selfValue === "1" ) { 
                //Self Signer Mode
                const matchedSigner = selfSigner?.find((s: any) => s.signerSlotId === field.slotId);
                 isSigned =  matchedSigner ? !!matchedSigner.signature : false;
                 signedImage =matchedSigner ? matchedSigner.signature : null;
               }else{
              // If selfSigner check already signed using selfSigner data otherwise use field.signature
                 isSigned = !!field.signature;
                 signedImage = field.signature;
            }

              if (isSignatureType) {
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
                        ? 'border-green-500'
                        : isCurrentUser
                        ? 'bg-blue-100 border-blue-500 text-blue-700 cursor-pointer hover:bg-blue-200'
                        : 'bg-gray-100 border-gray-300 text-gray-500 opacity-50'
                    }`}
                    onClick={() =>
                      isCurrentUser && !isSigned && handleFieldClick(field)
                    }
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
              } else {
                        const fieldId = field.fieldId || field._id.$oid || field._id;
                        let displayValue = field.label || field.value || '';

                        // Check if selfValue is "1" and selfSigner has data for this fieldId
                        if (selfValue === "1" ) {
                          const matchedSigner = selfSigner?.find((s: any) => s.signerSlotId === field.slotId);
                            // Loop through selfSigner.data keys and find a match with field.fieldId
                            for (const key in matchedSigner?.data) {
                                if (key === fieldId && field?.slotId === matchedSigner?.signerSlotId) {
                                    displayValue = matchedSigner.data[key]; // use the matched value
                                    break;
                                }
                            }
                        }
                        return (
                            <div
                                key={fieldId}
                                style={{
                                    position: 'absolute',
                                    top: field.y.$numberDouble || field.y,
                                    left: field.x.$numberDouble || field.x,
                                    width: field.width.$numberInt || field.width,
                                    height: field.height.$numberInt || field.height,
                                    zIndex: 10,
                                    background: 'transparent',
                                    border: 'none',
                                    padding: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    pointerEvents: 'none',
                                }}
                            >
                                <span className="text-sm text-gray-700">{displayValue}</span>
                            </div>
                        );
                     }
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
            selfValue={selfValue || ''}
            onSaveSign={(fieldId: string, signatureUrl: string) => {
              // Update selfSigner locally for immediate visual update
              setSelfSigner((prev: any) =>
                prev.map((s: any) =>
                  s.signerSlotId === activeField?.slotId
                    ? { ...s, signature: signatureUrl }
                    : s
                )
              );

              setActiveField(null); // Close the SignPad
              onSignatureSave?.(fieldId, signatureUrl); // Optional: notify parent
            }}
          />
        )}
    </div>
  );
};

export default DocumentViewer;
