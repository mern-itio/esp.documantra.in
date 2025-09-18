import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, Eye, Send, Plus, Trash2, FileText } from 'lucide-react';
import { pdfShareService, type PDFShareRecipient, type PDFShareRequest } from '../../../services/pdfShareService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Alert } from '../ui/alert';

interface PDFShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (shareData: any) => void;
  existingDocument?: any; // SharedDocument from SharedPDFPage
}

interface PDFFile {
  file: File;
  preview: string;
  documentId?: string;
}

const PDFShareModal: React.FC<PDFShareModalProps> = ({ isOpen, onClose, onSuccess, existingDocument }) => {
  const [step, setStep] = useState<'upload' | 'recipients' | 'preview' | 'confirm'>('upload');
  const [pdfFile, setPdfFile] = useState<PDFFile | null>(null);
  const [recipients, setRecipients] = useState<PDFShareRecipient[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [allowDownload, setAllowDownload] = useState(true);
  const [allowComments, setAllowComments] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shareData, setShareData] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle existing document
  useEffect(() => {
    if (existingDocument && isOpen) {
      // Verify the user is the owner of the document
      if (!existingDocument.isOwner) {
        setError('You can only share documents that you own');
        return;
      }
      
      // Set up the existing document for sharing
      setPdfFile({
        file: new File([], existingDocument.document.name, { type: 'application/pdf' }), // Dummy file
        preview: '', // Will be loaded if needed
        documentId: existingDocument.document._id || existingDocument.document.id
      });
      setSubject(`Document shared: ${existingDocument.document.name}`);
      setStep('recipients'); // Skip upload step for existing documents
    } else if (!existingDocument && isOpen) {
      // Reset to upload step for new documents
      setStep('upload');
    }
  }, [existingDocument, isOpen]);

  // Load PDF.js
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Point to the worker file in your public folder
        if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
          console.log("PDF.js worker set to local file: /pdf.worker.min.mjs");
        }
      } catch (err) {
        console.warn("Failed to set PDF.js worker:", err);
      }
    }
  }, []);

  // Load PDF.js dynamically
  const loadPDFJS = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && !window.pdfjsLib) {
        const pdfjsLib = await import('pdfjs-dist');
        
        // Set worker path to local file
        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
          console.log("PDF.js worker set to local file: /pdf.worker.min.mjs");
        } catch (error) {
          console.warn("Failed to set PDF.js worker:", error);
          pdfjsLib.GlobalWorkerOptions.workerSrc = '';
        }
        
        // Assign to window
        window.pdfjsLib = pdfjsLib;
      }
      
      return window.pdfjsLib;
    } catch (error) {
      console.error('Error loading PDF.js:', error);
      throw error;
    }
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Upload PDF to backend
      const uploadResponse = await pdfShareService.uploadPDFForSharing(file);
      
      if (uploadResponse.success) {
        // Generate preview using PDF.js
        let preview = '';
        const pdfjsLib = await loadPDFJS();
        if (pdfjsLib) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 0.5 });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d')!;
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            const renderContext = {
              canvasContext: context,
              viewport: viewport
            };
            
            await page.render(renderContext).promise;
            preview = canvas.toDataURL();
          } catch (previewError) {
            console.warn('Failed to generate PDF preview:', previewError);
          }
        }

        setPdfFile({
          file,
          preview,
          documentId: uploadResponse.data.documentId
        });
        
        setSubject(`Document shared: ${file.name}`);
        setStep('recipients');
      } else {
        setError(uploadResponse.message || 'Failed to upload PDF');
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      setError('Failed to upload PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const addRecipient = () => {
    setRecipients([...recipients, { email: '', name: '', isCC: false }]);
  };

  const updateRecipient = (index: number, field: keyof PDFShareRecipient, value: string | boolean) => {
    const updated = [...recipients];
    updated[index] = { ...updated[index], [field]: value };
    setRecipients(updated);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const validateRecipients = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const recipient of recipients) {
      if (!recipient.email || !emailRegex.test(recipient.email)) {
        setError('Please enter valid email addresses for all recipients');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (step === 'upload' && pdfFile) {
      setStep('recipients');
    } else if (step === 'recipients') {
      if (recipients.length === 0) {
        setError('Please add at least one recipient');
        return;
      }
      if (!validateRecipients()) {
        return;
      }
      setStep('preview');
    } else if (step === 'preview') {
      setStep('confirm');
    }
  };

  const handleSend = async () => {
    if (!pdfFile?.documentId) {
      setError('No document to share');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const shareRequest: PDFShareRequest = {
        documentId: pdfFile.documentId,
        recipients: recipients.filter(r => r.email),
        subject: subject || `Document shared: ${pdfFile.file.name}`,
        message,
        allowDownload,
        allowComments,
        expiresAt: expiresAt || undefined,
        password: password || undefined
      };

      const response = await pdfShareService.createShareAndSendEmails(shareRequest);
      
      if (response.success) {
        setShareData(response.data);
        setStep('confirm');
        // Don't call onSuccess here - let user see the confirm step first
      } else {
        setError(response.message || 'Failed to share document');
      }
    } catch (error) {
      console.error('Error sharing document:', error);
      setError('Failed to share document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setPdfFile(null);
    setRecipients([]);
    setSubject('');
    setMessage('');
    setAllowDownload(true);
    setAllowComments(false);
    setExpiresAt('');
    setPassword('');
    setError('');
    setShareData(null);
    onClose();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Share PDF Document</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center p-4 border-b bg-gray-50">
          {(existingDocument ? ['recipients', 'preview', 'confirm'] : ['upload', 'recipients', 'preview', 'confirm']).map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === stepName ? 'bg-blue-600 text-white' : 
                (existingDocument ? ['recipients', 'preview', 'confirm'] : ['upload', 'recipients', 'preview', 'confirm']).indexOf(step) > index ? 'bg-green-600 text-white' : 
                'bg-gray-300 text-gray-600'
              }`}>
                {existingDocument ? index + 1 : index + 1}
              </div>
              <span className={`ml-2 text-sm ${
                step === stepName ? 'text-blue-600 font-medium' : 'text-gray-600'
              }`}>
                {stepName.charAt(0).toUpperCase() + stepName.slice(1)}
              </span>
              {index < (existingDocument ? 2 : 3) && <div className="w-8 h-0.5 bg-gray-300 mx-2" />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <Alert className="mb-4 bg-red-50 border-red-200 text-red-800">
              {error}
            </Alert>
          )}

          {/* Step 1: Upload (only for new documents) */}
          {step === 'upload' && !existingDocument && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Upload PDF Document</h3>
                <p className="text-gray-600">Select a PDF file to share with others</p>
              </div>

              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium mb-2">Drop your PDF here or click to browse</p>
                <p className="text-gray-600">Maximum file size: 50MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {loading && (
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Uploading PDF...</p>
                </div>
              )}
            </div>
          )}

          {/* Existing Document Info (when sharing existing document) */}
          {existingDocument && step === 'recipients' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText size={24} className="text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-900">Sharing Existing Document</h3>
                  <p className="text-sm text-blue-700">{existingDocument.document.name}</p>
                  <p className="text-xs text-blue-600">
                    Originally shared on {new Date(existingDocument.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Recipients */}
          {step === 'recipients' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Add Recipients</h3>
                <p className="text-gray-600">Enter email addresses of people you want to share with</p>
              </div>

              <div className="space-y-4">
                {recipients.map((recipient, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <Input
                        placeholder="Email address"
                        value={recipient.email}
                        onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                        type="email"
                      />
                    </div>
                    <div className="w-48">
                      <Input
                        placeholder="Name (optional)"
                        value={recipient.name || ''}
                        onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`cc-${index}`}
                        checked={recipient.isCC}
                        onChange={(e) => updateRecipient(index, 'isCC', e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor={`cc-${index}`} className="text-sm text-gray-600">CC</label>
                    </div>
                    <button
                      onClick={() => removeRecipient(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}

                <Button
                  onClick={addRecipient}
                  variant="outline"
                  className="w-full"
                >
                  <Plus size={20} className="mr-2" />
                  Add Recipient
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message (optional)</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add a personal message..."
                    className="w-full p-3 border rounded-lg resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && pdfFile && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Preview & Settings</h3>
                <p className="text-gray-600">Review your document and configure sharing options</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* PDF Preview */}
                <div>
                  <h4 className="font-medium mb-3">Document Preview</h4>
                  <Card className="p-4">
                    {pdfFile.preview ? (
                      <img
                        src={pdfFile.preview}
                        alt="PDF Preview"
                        className="w-full h-64 object-contain border rounded"
                      />
                    ) : (
                      <div className="w-full h-64 flex items-center justify-center border rounded bg-gray-50">
                        <div className="text-center">
                          <Eye size={48} className="mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-600">PDF Preview</p>
                        </div>
                      </div>
                    )}
                    <div className="mt-3">
                      <p className="font-medium">{pdfFile.file.name}</p>
                      <p className="text-sm text-gray-600">
                        {(pdfFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Settings */}
                <div>
                  <h4 className="font-medium mb-3">Sharing Options</h4>
                  <Card className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Allow Download</label>
                      <input
                        type="checkbox"
                        checked={allowDownload}
                        onChange={(e) => setAllowDownload(e.target.checked)}
                        className="rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Allow Comments</label>
                      <input
                        type="checkbox"
                        checked={allowComments}
                        onChange={(e) => setAllowComments(e.target.checked)}
                        className="rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Expires At (optional)</label>
                      <Input
                        type="datetime-local"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Password (optional)</label>
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Set a password for extra security"
                      />
                    </div>
                  </Card>
                </div>
              </div>

              {/* Recipients Summary */}
              <div>
                <h4 className="font-medium mb-3">Recipients ({recipients.length})</h4>
                <div className="space-y-2">
                  {recipients.map((recipient, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{recipient.email}</p>
                        {recipient.name && <p className="text-sm text-gray-600">{recipient.name}</p>}
                      </div>
                      {recipient.isCC && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">CC</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 'confirm' && shareData && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send size={32} className="text-green-600" />
                </div>
                <h3 className="text-lg font-medium mb-2">Document Shared Successfully!</h3>
                <p className="text-gray-600">Your PDF has been shared with the recipients</p>
              </div>

              <Card className="p-6">
                <h4 className="font-medium mb-4">Share Details</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Document:</span>
                    <span className="font-medium">{shareData.documentName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Recipients:</span>
                    <span className="font-medium">{shareData.recipients.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Download Allowed:</span>
                    <span className="font-medium">{shareData.allowDownload ? 'Yes' : 'No'}</span>
                  </div>
                  {shareData.expiresAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Expires:</span>
                      <span className="font-medium">{new Date(shareData.expiresAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h4 className="font-medium mb-4">Share Link</h4>
                <div className="flex items-center space-x-2">
                  <Input
                    value={shareData.shareUrl}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    onClick={() => copyToClipboard(shareData.shareUrl)}
                    variant="outline"
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Share this link with anyone you want to give access to the document
                </p>
              </Card>

              <div className="space-y-2">
                <h4 className="font-medium">Email Status</h4>
                {shareData.recipients.map((recipient: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{recipient.email}</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      recipient.sent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {recipient.sent ? 'Sent' : 'Failed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <Button
            onClick={handleClose}
            variant="outline"
          >
            {step === 'confirm' ? 'Close' : 'Cancel'}
          </Button>
          
          <div className="flex space-x-3">
            {step !== 'upload' && step !== 'confirm' && (
              <Button
                onClick={() => setStep(step === 'recipients' ? (existingDocument ? 'recipients' : 'upload') : 'recipients')}
                variant="outline"
              >
                Back
              </Button>
            )}
            
            {step === 'confirm' ? (
              <Button
                onClick={() => {
                  onSuccess?.(shareData);
                  handleClose();
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                Done
              </Button>
            ) : step === 'preview' ? (
              <Button
                onClick={handleSend}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Sending...' : 'Send & Share'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={loading || (step === 'upload' && !pdfFile) || (step === 'recipients' && recipients.length === 0)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFShareModal;
