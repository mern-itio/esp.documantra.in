import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, Eye, Send, FileText } from 'lucide-react';
import { pdfShareService, type PDFShareRecipient, type PDFShareRequest } from '../../../services/pdfShareService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Alert } from '../ui/alert';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

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
  const [toRecipients, setToRecipients] = useState<PDFShareRecipient[]>([]);
  const [ccRecipients, setCcRecipients] = useState<PDFShareRecipient[]>([]);
  const [bccRecipients, setBccRecipients] = useState<PDFShareRecipient[]>([]);
  const [toInput, setToInput] = useState('');
  const [ccInput, setCcInput] = useState('');
  const [bccInput, setBccInput] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
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

  // Parse emails from input string
  const parseEmails = (input: string): string[] => {
    return input
      .split(/[,;\s]+/)
      .map(email => email.trim())
      .filter(email => email.length > 0);
  };

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Add emails to recipients array
  const addEmailsToRecipients = (type: 'to' | 'cc' | 'bcc', emails: string[]) => {
    const validEmails = emails.filter(isValidEmail);
    const newRecipients = validEmails.map(email => ({ email, name: '' }));

    switch (type) {
      case 'to':
        setToRecipients(prev => {
          const existingEmails = prev.map(r => r.email);
          const uniqueNewRecipients = newRecipients.filter(r => !existingEmails.includes(r.email));
          return [...prev, ...uniqueNewRecipients];
        });
        break;
      case 'cc':
        setCcRecipients(prev => {
          const existingEmails = prev.map(r => r.email);
          const uniqueNewRecipients = newRecipients.filter(r => !existingEmails.includes(r.email));
          return [...prev, ...uniqueNewRecipients];
        });
        break;
      case 'bcc':
        setBccRecipients(prev => {
          const existingEmails = prev.map(r => r.email);
          const uniqueNewRecipients = newRecipients.filter(r => !existingEmails.includes(r.email));
          return [...prev, ...uniqueNewRecipients];
        });
        break;
    }
  };

  // Handle input change and auto-add emails
  const handleInputChange = (type: 'to' | 'cc' | 'bcc', value: string) => {
    switch (type) {
      case 'to':
        setToInput(value);
        break;
      case 'cc':
        setCcInput(value);
        break;
      case 'bcc':
        setBccInput(value);
        break;
    }
  };

  // Handle input key press (Enter, comma, semicolon)
  const handleInputKeyPress = (type: 'to' | 'cc' | 'bcc', e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
      e.preventDefault();
      const inputValue = e.currentTarget.value;
      const emails = parseEmails(inputValue);

      if (emails.length > 0) {
        addEmailsToRecipients(type, emails);
        // Clear input after adding emails
        switch (type) {
          case 'to':
            setToInput('');
            break;
          case 'cc':
            setCcInput('');
            break;
          case 'bcc':
            setBccInput('');
            break;
        }
      }
    }
  };

  // Handle input blur (when user clicks away)
  const handleInputBlur = (type: 'to' | 'cc' | 'bcc') => {
    let inputValue = '';
    switch (type) {
      case 'to':
        inputValue = toInput;
        break;
      case 'cc':
        inputValue = ccInput;
        break;
      case 'bcc':
        inputValue = bccInput;
        break;
    }

    const emails = parseEmails(inputValue);
    if (emails.length > 0) {
      addEmailsToRecipients(type, emails);
      // Clear input after adding emails
      switch (type) {
        case 'to':
          setToInput('');
          break;
        case 'cc':
          setCcInput('');
          break;
        case 'bcc':
          setBccInput('');
          break;
      }
    }
  };

  // Remove recipient
  const removeRecipient = (type: 'to' | 'cc' | 'bcc', index: number) => {
    switch (type) {
      case 'to':
        setToRecipients(toRecipients.filter((_, i) => i !== index));
        break;
      case 'cc':
        setCcRecipients(ccRecipients.filter((_, i) => i !== index));
        break;
      case 'bcc':
        setBccRecipients(bccRecipients.filter((_, i) => i !== index));
        break;
    }
  };

  const validateRecipients = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const allRecipients = [...toRecipients, ...ccRecipients, ...bccRecipients];

    for (const recipient of allRecipients) {
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
      if (toRecipients.length === 0) {
        setError('Please add at least one TO recipient');
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
        toRecipients: toRecipients.filter(r => r.email),
        ccRecipients: ccRecipients.filter(r => r.email),
        bccRecipients: bccRecipients.filter(r => r.email),
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
    setToRecipients([]);
    setCcRecipients([]);
    setBccRecipients([]);
    setToInput('');
    setCcInput('');
    setBccInput('');
    setShowCc(false);
    setShowBcc(false);
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
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      // Try modern clipboard API first (requires HTTPS)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
      
      // Fallback for HTTP or older browsers
      fallbackCopyToClipboard(text);
    } catch (err) {
      console.error("Failed to copy: ", err);
      // Try fallback method
      fallbackCopyToClipboard(text);
    }
  };

  const fallbackCopyToClipboard = (text: string) => {
    try {
      // Method 1: Try with a temporary textarea (most reliable)
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // Make it invisible but still selectable
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      textArea.style.pointerEvents = 'none';
      textArea.setAttribute('readonly', '');
      
      document.body.appendChild(textArea);
      
      // Select the text
      textArea.select();
      textArea.setSelectionRange(0, 99999); // For mobile devices
      
      // Try to copy
      let successful = false;
      try {
        successful = document.execCommand('copy');
      } catch (execErr) {
        console.log('execCommand failed, trying alternative method');
      }
      
      // Clean up
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
      
      // Method 2: Try with a temporary input element
      const input = document.createElement('input');
      input.value = text;
      input.style.position = 'fixed';
      input.style.left = '-999999px';
      input.style.top = '-999999px';
      input.style.opacity = '0';
      input.style.pointerEvents = 'none';
      
      document.body.appendChild(input);
      input.select();
      input.setSelectionRange(0, 99999);
      
      try {
        successful = document.execCommand('copy');
      } catch (execErr) {
        console.log('Input execCommand also failed');
      }
      
      document.body.removeChild(input);
      
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
      
      // Method 3: Try with window.getSelection (for text selection)
      const selection = window.getSelection();
      const range = document.createRange();
      const textNode = document.createTextNode(text);
      document.body.appendChild(textNode);
      range.selectNodeContents(textNode);
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      try {
        successful = document.execCommand('copy');
        selection?.removeAllRanges();
      } catch (execErr) {
        console.log('Selection method failed');
      }
      
      document.body.removeChild(textNode);
      
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
      
      // If all methods fail, show the text in a prompt for manual copy
      console.error('All copy methods failed');
      const userConfirmed = window.confirm(
        `Copy failed automatically. The link is: ${text}\n\nClick OK to open a dialog where you can manually copy the link.`
      );
      
      if (userConfirmed) {
        // Show the text in a prompt for manual copying
        const manualCopy = window.prompt('Copy this link manually:', text);
        if (manualCopy !== null) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }
      
    } catch (err) {
      console.error('All fallback copy methods failed:', err);
      // Last resort: show the text in an alert
      alert(`Copy failed. Please manually copy this link: ${text}`);
    }
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full overflow-hidden">
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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === stepName ? 'bg-blue-600 text-white' :
                (existingDocument ? ['recipients', 'preview', 'confirm'] : ['upload', 'recipients', 'preview', 'confirm']).indexOf(step) > index ? 'bg-green-600 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                {existingDocument ? index + 1 : index + 1}
              </div>
              <span className={`ml-2 text-sm ${step === stepName ? 'text-blue-600 font-medium' : 'text-gray-600'
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
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <h3 className="text-lg font-medium mb-2">Uploading PDF...</h3>
                  <p className="text-gray-600">Please wait while we process your document</p>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <h3 className="text-lg font-medium">Upload PDF Document</h3>
                    <p className="text-sm text-gray-600">Select a PDF file to share with others</p>
                  </div>

                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-lg font-medium mb-2">Drop your PDF here or click to browse</p>
                    <p className="text-gray-600">Maximum file size: 5MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Existing Document Info (when sharing existing document) */}
          {existingDocument && step === 'recipients' && (
            <div className="mb-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
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
                <h3 className="text-lg font-medium mb-1">Add Recipients</h3>
                <p className="text-sm text-gray-600">Enter email addresses separated by commas or press Enter</p>
              </div>

              {/* TO Recipients */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-medium text-gray-700 w-12">To</label>
                  <div className="flex-1 min-h-[40px] border rounded-lg p-2 flex flex-wrap items-center gap-2 bg-white relative">
                    {/* Email chips */}
                    {toRecipients.map((recipient, index) => (
                      <div
                        key={`to-chip-${index}`}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
                      >
                        <span>{recipient.email}</span>
                        <button
                          onClick={() => removeRecipient('to', index)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {/* Input field */}
                    <input
                      type="text"
                      value={toInput}
                      onChange={(e) => handleInputChange('to', e.target.value)}
                      onKeyDown={(e) => handleInputKeyPress('to', e)}
                      onBlur={() => handleInputBlur('to')}
                      placeholder={toRecipients.length === 0 ? "Enter email addresses..." : ""}
                      className="flex-1 min-w-[200px] border-none outline-none bg-transparent text-sm"
                    />
                    {/* CC and BCC buttons positioned in top-right corner */}
                    <div className="absolute top-2 right-2 flex space-x-2">
                      {!showCc && (
                        <button
                          onClick={() => setShowCc(true)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50"
                        >
                          Cc
                        </button>
                      )}
                      {!showBcc && (
                        <button
                          onClick={() => setShowBcc(true)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50"
                        >
                          Bcc
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* CC Recipients - Only show when CC is enabled */}
              {showCc && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <label className="text-sm font-medium text-gray-700 w-12">Cc</label>
                    <div className="flex-1 min-h-[40px] border rounded-lg p-2 flex flex-wrap items-center gap-2 bg-white relative">
                      {ccRecipients.map((recipient, index) => (
                        <div
                          key={`cc-chip-${index}`}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 border border-gray-200"
                        >
                          <span>{recipient.email}</span>
                          <button
                            onClick={() => removeRecipient('cc', index)}
                            className="ml-2 text-gray-600 hover:text-gray-800"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <input
                        type="text"
                        value={ccInput}
                        onChange={(e) => handleInputChange('cc', e.target.value)}
                        onKeyDown={(e) => handleInputKeyPress('cc', e)}
                        onBlur={() => handleInputBlur('cc')}
                        placeholder={ccRecipients.length === 0 ? "Enter email addresses..." : ""}
                        className="flex-1 min-w-[200px] border-none outline-none bg-transparent text-sm"
                      />
                      {/* Remove CC field button */}
                      <button
                        onClick={() => {
                          setShowCc(false);
                          setCcRecipients([]);
                          setCcInput('');
                        }}
                        className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 p-1"
                        title="Remove CC field"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* BCC Recipients - Only show when BCC is enabled */}
              {showBcc && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <label className="text-sm font-medium text-gray-700 w-12">Bcc</label>
                    <div className="flex-1 min-h-[40px] border rounded-lg p-2 flex flex-wrap items-center gap-2 bg-white relative">
                      {bccRecipients.map((recipient, index) => (
                        <div
                          key={`bcc-chip-${index}`}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 border border-gray-200"
                        >
                          <span>{recipient.email}</span>
                          <button
                            onClick={() => removeRecipient('bcc', index)}
                            className="ml-2 text-gray-600 hover:text-gray-800"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <input
                        type="text"
                        value={bccInput}
                        onChange={(e) => handleInputChange('bcc', e.target.value)}
                        onKeyDown={(e) => handleInputKeyPress('bcc', e)}
                        onBlur={() => handleInputBlur('bcc')}
                        placeholder={bccRecipients.length === 0 ? "Enter email addresses..." : ""}
                        className="flex-1 min-w-[200px] border-none outline-none bg-transparent text-sm"
                      />
                      {/* Remove BCC field button */}
                      <button
                        onClick={() => {
                          setShowBcc(false);
                          setBccRecipients([]);
                          setBccInput('');
                        }}
                        className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 p-1"
                        title="Remove BCC field"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject"
                  />
                </div>
                <div >
                  <label className="block text-sm font-medium mb-2">Message (optional)</label>
                  <div className="space-y-3">
                    <div className="border rounded-lg overflow-hidden h-70 ck-editor-content">
                      <CKEditor
                        editor={ClassicEditor as any}
                        data={message}
                        onChange={(_event, editor) => {
                          const data = editor.getData();
                          setMessage(data);
                        }}
                         config={{
                         toolbar: {
                           items: [
                             'heading', '|',
                             'bold', 'italic', '|',
                             'bulletedList', 'numberedList', '|',
                             'undo', 'redo'
                           ],
                           shouldNotGroupWhenFull: true
                         },
                           heading: {
                             options: [
                               { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
                               { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
                               { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
                               { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
                               { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
                               { model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
                               { model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' }
                             ]
                         },
                         link: {
                           addTargetToExternalLinks: true,
                           defaultProtocol: 'https://'
                         },
                         list: {
                             properties: {
                               styles: true,
                               startIndex: true,
                               reversed: true
                             }
                           },
                           placeholder: 'Enter your message...',
                           removePlugins: ['ToolbarMenuButton', 'PoweredBy']
                         }}
                      />
                    </div>
                  </div>
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
                        {pdfFile.file.size < 1024 * 1024
                          ? `${(pdfFile.file.size / 1024).toFixed(2)} KB`
                          : `${(pdfFile.file.size / 1024 / 1024).toFixed(2)} MB`}
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
                <h4 className="font-medium mb-3">Recipients ({toRecipients.length + ccRecipients.length + bccRecipients.length})</h4>
                <div className="space-y-3">
                  {/* TO Recipients */}
                  {toRecipients.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">To ({toRecipients.length})</h5>
                      <div className="space-y-2">
                        {toRecipients.map((recipient, index) => (
                          <div key={`to-preview-${index}`} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div>
                              <p className="font-medium">{recipient.email}</p>
                              {recipient.name && <p className="text-sm text-gray-600">{recipient.name}</p>}
                            </div>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">TO</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CC Recipients */}
                  {ccRecipients.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">CC ({ccRecipients.length})</h5>
                      <div className="space-y-2">
                        {ccRecipients.map((recipient, index) => (
                          <div key={`cc-preview-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{recipient.email}</p>
                              {recipient.name && <p className="text-sm text-gray-600">{recipient.name}</p>}
                            </div>
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">CC</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* BCC Recipients */}
                  {bccRecipients.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">BCC ({bccRecipients.length})</h5>
                      <div className="space-y-2">
                        {bccRecipients.map((recipient, index) => (
                          <div key={`bcc-preview-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{recipient.email}</p>
                              {recipient.name && <p className="text-sm text-gray-600">{recipient.name}</p>}
                            </div>
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">BCC</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Preview */}
              {message && (
                <div>
                  <h4 className="font-medium mb-3">Message Preview</h4>
                  <Card className="p-4">
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: message }}
                    />
                  </Card>
                </div>
              )}
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
                    onClick={() => copyToClipboard(shareData?.shareUrl || "")}
                    variant="outline"
                  >
                    {copied ? "Copied" : "Copy"}
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
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{recipient.email}</span>
                      {recipient.type && (
                        <span className={`px-2 py-1 text-xs rounded ${recipient.type === 'TO' ? 'bg-blue-100 text-blue-800' :
                          recipient.type === 'CC' ? 'bg-gray-100 text-gray-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                          {recipient.type}
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${recipient.sent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
                disabled={loading || (step === 'upload' && !pdfFile) || (step === 'recipients' && toRecipients.length === 0)}
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
