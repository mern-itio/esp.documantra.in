import { Document, Page, pdfjs } from 'react-pdf';
import React, { useEffect, useRef, useState } from 'react';
import Modal from 'react-modal';
import SignPad from './SignPad';
import { eSignApi } from '../../services/apiHelper';
import ErrorBoundary from '../ErrorBoundary';
import type { SignerData, ActiveField } from '../../types/documentTypes';

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

const DocumentViewerContent: React.FC<Props> = ({ document, signatureFields, currentUserId, envelopeID, onSignatureSave, cycleId}) => {
  const urlParams = new URLSearchParams(window.location.search);
  const selfValue = urlParams.get('self'); 
  const [activeField, setActiveField] = useState<ActiveField | null>(null);
  const [selfSigner, setSelfSigner] = useState<SignerData[]>([]);
  const [_isLoading, setIsLoading] = useState(selfValue === "1");
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);

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
    const activeField: ActiveField = {
      ...field,
      status: 'pending'
    };
    setActiveField(activeField);
  };
  const getSelfSigner = async () => {
    try {
      setIsLoading(true);
      if (!cycleId) {
        console.warn("No cycleId provided");
        return;
      }
      const response = await eSignApi.get(`/api/e-sign/public/envelope/self-signer/${cycleId}`);
      if (response?.data?.selfSigner) {
        const validSigners = response.data.selfSigner.filter((signer: SignerData) => 
          signer && typeof signer === 'object' && signer.signerSlotId
        );
        setSelfSigner(validSigners);
      } else {
        console.warn("No self-signer data found in response");
        setSelfSigner([]);
      }
    } catch (err) {
      console.error('Failed to load self-signer data:', err);
      setSelfSigner([]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- New: click-anywhere behavior ---
  // Clicking anywhere inside the PDF container will open the SignPad for the first actionable signature field on the current page.
  useEffect(() => {
    const node = pdfContainerRef.current;
    if (!node) return;

    const handler = (e: MouseEvent) => {
      // If SignPad already open, don't open another
      if (activeField) return;

      // Avoid triggering when focusing/interacting with controls (buttons, inputs, links)
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('button, a, input, textarea, .no-sign')) return;

      // Find actionable signature fields on current page
      const actionable = signatureFields
        .filter(field => {
          const pageNum = Number(field?.page?.$numberInt ?? field?.page ?? field?.pageNumber ?? field?.pageNo ?? 0);
          return pageNum === currentPage && field?.type === 'signature';
        })
        .filter(field => {
          if (selfValue === '1') {
            const matchedSigner = selfSigner?.find((s: any) => s.signerSlotId === field.slotId);
            const isCurrentUser = matchedSigner ? (matchedSigner._id?.toString?.() === currentUserId?.toString?.()) : false;
            const isSigned = matchedSigner ? !!matchedSigner.signature : false;
            return isCurrentUser && !isSigned;
          } else {
            const isCurrentUser = field.recipientId === currentUserId;
            const isSigned = !!field.signature;
            return isCurrentUser && !isSigned;
          }
        });

      if (actionable.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        // pick first actionable field (you can enhance to pick nearest to click)
        setActiveField(actionable[0]);
      }
    };

    node.addEventListener('click', handler);
    return () => node.removeEventListener('click', handler);
  }, [signatureFields, selfSigner, selfValue, currentPage, activeField, currentUserId]);

  return (
    <div className="relative flex flex-col items-center ">
      {/* PDF Container */}
      <div ref={pdfContainerRef} className="relative border border-gray-300 rounded-lg shadow-sm bg-white overflow-auto max-w-4xl max-h-[80vh] ">
        <Document
          file={document.filePath || `${import.meta.env.VITE_ESIGN_SERVICE_URL}/uploads/${document.name}`}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        >
          <Page pageNumber={currentPage} 
           width={800} 
           height={1132} />
        </Document>

        {/* Signature Fields */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          { signatureFields
            .filter(field => Number(field?.page?.$numberInt ?? field?.page ?? field?.pageNumber ?? field?.pageNo ?? 0) === currentPage)
            .map(field => {
              const isSignatureType = field.type === "signature";
              let isCurrentUser;
                if (selfValue === "1" && selfSigner) { 
                  // self-signing mode
                  isCurrentUser = selfSigner.some((s:any) => {
                    if (!s) return false;
                    return s.signerSlotId === field.slotId && s._id?.toString?.() === currentUserId?.toString?.();
                  });
                } else {
                  // Regular signing mode
                  isCurrentUser = field.recipientId === currentUserId; 
                }
              let isSigned = false;
              let signedImage = null;
               if (selfValue === "1" ) { 
                //Self Signer Mode
                if (selfSigner) {
                  const matchedSigner = selfSigner.find((s: any) => s.signerSlotId === field.slotId);
                  isSigned = matchedSigner ? !!matchedSigner.signature : false;
                  signedImage = matchedSigner ? matchedSigner.signature : null;
                } else {
                  isSigned = false;
                  signedImage = null;
                }
               }else{
              // If selfSigner check already signed using selfSigner data otherwise use field.signature
                 isSigned = !!field.signature;
                 signedImage = field.signature;
            }

              if (isSignatureType) {
                return (
                  <div
                    key={field._id?.$oid || field._id}
                    style={{
                      position: 'absolute',
                      top: field.y?.$numberDouble ?? field.y,
                      left: field.x?.$numberDouble ?? field.x,
                      width: field.width?.$numberInt ?? field.width,
                      height: field.height?.$numberInt ?? field.height,
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
                        const fieldId = field.fieldId || field._id?.$oid || field._id;
                        let displayValue = field.label || field.value || '';

                        // Check if selfValue is "1" and selfSigner has data for this fieldId
                        if (selfValue === "1" ) {
                          const matchedSigner = selfSigner?.find((s: any) => s.signerSlotId === field.slotId);
                            // Loop through selfSigner.data keys and find a match with field.fieldId
                            
                            for (const key in matchedSigner?.data) {
                                if ( field?.slotId === matchedSigner?.signerSlotId) {
                                  if( matchedSigner?.role !== "creator" && key === fieldId){
                                    displayValue = matchedSigner.data[key]; // use the matched value
                                    break;
                                  }else if(matchedSigner?.role === "creator" ){
                                    displayValue = matchedSigner.data["name"];
                                    break;
                                  }

                                }
                            }
                        }
                        return (
                            <div
                                key={fieldId}
                                style={{
                                    position: 'absolute',
                                    top: field.y?.$numberDouble ?? field.y,
                                    left: field.x?.$numberDouble ?? field.x,
                                    width: field.width?.$numberInt ?? field.width,
                                    height: field.height?.$numberInt ?? field.height,
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
            if(selfValue==="1"){
              setSelfSigner((prev: any) =>
                prev.map((s: any) =>{
                  s.signerSlotId === activeField?.slotId
                    ? { ...s, signature: signatureUrl }
                    : s
                  })
              );
            }
              setActiveField(null); // Close the SignPad
              onSignatureSave?.(fieldId, signatureUrl); // Optional: notify parent
            }}
          />
        )}
    </div>
  );
};

const DocumentViewer: React.FC<Props> = (props) => {
  return (
    <ErrorBoundary>
      <DocumentViewerContent {...props} />
    </ErrorBoundary>
  );
};

export default DocumentViewer;
