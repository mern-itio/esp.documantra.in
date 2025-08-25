import { Document, Page } from 'react-pdf';
import React, { useState, useRef } from 'react';
import Modal from 'react-modal';

interface Props {
  document: any;
  signatureFields: any[];
  currentUserId: string;
  onClose?: () => void;
}

Modal.setAppElement('#root');

const DocumentViewer: React.FC<Props> = ({ document, signatureFields, currentUserId, onClose }) => {
  const [signedFields, setSignedFields] = useState<string[]>([]);
  const [activeField, setActiveField] = useState<any>(null);
  const [signatureType, setSignatureType] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);

  const handleFieldClick = (field: any) => {
    setActiveField(field);
    setSignatureType('draw');
    setTypedSignature('');
    setUploadedFile(null);
  };

  const handleSubmitSignature = () => {
    if (!activeField) return;
    const signatureData = {
      recipientId: currentUserId,
      fieldId: activeField._id.$oid || activeField._id,
      signature: signatureType === 'draw' ? canvasRef.current?.toDataURL()
                 : signatureType === 'type' ? typedSignature
                 : uploadedFile?.name,
      type: signatureType
    };
    console.log('Signature Submitted:', signatureData);
    setSignedFields([...signedFields, activeField._id.$oid || activeField._id]);
    setActiveField(null);
  };

  const startDrawing = (_e: React.MouseEvent<HTMLCanvasElement>) => setDrawing(true);
  const stopDrawing = (_e: React.MouseEvent<HTMLCanvasElement>) => setDrawing(false);
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
  };

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
        >
          <Page pageNumber={1} />
        </Document>

        {/* Signature Fields */}
        <div className="absolute top-0 left-0 w-full h-full">
          {signatureFields.map(field => {
            const isCurrentUser = field.recipientId === currentUserId;
            const isSigned = signedFields.includes(field._id.$oid || field._id);

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
                    ? 'bg-green-300 border-green-500 text-white'
                    : isCurrentUser
                    ? 'bg-blue-100 border-blue-500 text-blue-700 cursor-pointer hover:bg-blue-200'
                    : 'bg-gray-100 border-gray-300 text-gray-500 opacity-50'
                }`}
                onClick={() => isCurrentUser && !isSigned && handleFieldClick(field)}
              >
                {isSigned ? 'Signed' : isCurrentUser ? 'Sign Here' : 'Signature'}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal for Signature */}
      <Modal
        isOpen={!!activeField}
        onRequestClose={() => setActiveField(null)}
        className="bg-white p-6 max-w-md mx-auto mt-24 rounded-xl shadow-lg outline-none"
        overlayClassName="fixed inset-0 bg-white bg-opacity-70 flex justify-center items-start z-50"
      >
        <h2 className="text-lg font-bold mb-4">Sign Document</h2>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSignatureType('draw')}
            className={`px-3 py-1 border rounded ${signatureType==='draw'?'bg-blue-500 text-white':'bg-gray-100'}`}
          >
            Draw
          </button>
          <button
            onClick={() => setSignatureType('type')}
            className={`px-3 py-1 border rounded ${signatureType==='type'?'bg-blue-500 text-white':'bg-gray-100'}`}
          >
            Type
          </button>
          <button
            onClick={() => setSignatureType('upload')}
            className={`px-3 py-1 border rounded ${signatureType==='upload'?'bg-blue-500 text-white':'bg-gray-100'}`}
          >
            Upload
          </button>
        </div>

        {signatureType === 'draw' && (
          <canvas
            ref={canvasRef}
            width={400}
            height={150}
            className="border mb-4"
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseMove={draw}
          />
        )}

        {signatureType === 'type' && (
          <input
            type="text"
            value={typedSignature}
            onChange={(e) => setTypedSignature(e.target.value)}
            placeholder="Type your signature"
            className="border p-2 w-full mb-4"
          />
        )}

        {signatureType === 'upload' && (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
            className="border p-2 w-full mb-4"
          />
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={() => setActiveField(null)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitSignature}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Submit
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentViewer;
