import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Upload,
  X,
  FileText,
  ArrowLeft,
  Eye,
  Check,
  Shield,
  Award,
  ArrowDown,
  Info,
  MoreVertical,
  Download,
  FileEdit,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowUpToLine,
  Triangle,
  CircleQuestionMark,
  ChevronLeft,
  ExternalLink,
  Phone,
  Plus,
  Minus
} from 'lucide-react';
import type { Document, Recipient } from '../../types';
import SignatureTypeSelector from '../../components/ESign/advanced/SignatureTypeSelector';
import { eSignApi } from '../../services/apiHelper';
import Swal from 'sweetalert2';
import { referralMilestoneSwalHtml } from '../../utils/referralMilestoneUi';
import SigningEditorStep from '../../components/ESign/SigningEditorStep';
import type { SignatureField as EditorSignatureField } from '../../components/ESign/SigningEditorStep';
type EditorSignatureFieldExt = EditorSignatureField & {
  signerIndex?: number | null;
  isPowerForm?: boolean;
  fieldType?: string;
  option?: string[];
};
import type { AxiosProgressEvent } from 'axios';
import { Card } from '../../components/DocumentService/ui/card';
import toast from 'react-hot-toast';
import { useAuth } from '../../components/AuthService/AuthContext';
import { APP_NAME } from '../../components/constants/appConfig';
type Party = {
  id: string;                 // e.g. "slot_1"
  name: string;               // display label, e.g. "Party A"
  slot: number;               // 1-based index
  role?: 'signer' | 'approver' | 'carbon_copy' | string;
  authMethod?: 'email' | 'sms' | 'access_code' | 'none' | string;
  required?: boolean;
};

const PowerFormCreate: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { envelopeId: routeEnvelopeId } = useParams<{ envelopeId: string }>();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'normal' | 'power'>('normal');
  const [slots, setSlots] = useState<any[]>([]);
  const [parties, setParties] = useState<Party[]>(
    [{ id: 'slot_1', name: 'Signer A', slot: 1, role: 'signer', authMethod: 'email', required: true }]
  );
  const [numberOfParties, setNumberOfParties] = useState<number>(parties.length || 1);
  const [maxParties] = useState<number>(10);
  const [selectedPartyId, setSelectedPartyId] = useState<string>(parties[0]?.id ?? 'slot_1');
  const [firstSigningPartyId, setFirstSigningPartyId] = useState<string>(parties[0]?.id ?? 'slot_1');
  const getInitialStep = () => {
    const params = new URLSearchParams(location.search);
    const step = params.get('step');
    return step ? Number(step) : 1;
  };
  const [currentStep, setCurrentStep] = useState(getInitialStep());
  const [envelopeData, setEnvelopeData] = useState({
    subject: '',
    message: '',
    priority: 'normal' as const,
    expiresAt: '',
    reminderEnabled: true,
    reminderInterval: 3,
    requireAllSignatures: true,
    allowDecline: true,
    signingOrder: 'sequential' as const,
    signatureType: 'standard' as 'standard' | 'advanced' | 'qualified',
    complianceLevel: 'basic' as 'basic' | 'enhanced' | 'qualified'
  });
  const [documents, setDocuments] = useState<Document[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [_files, setFiles] = useState<FileList | null>(null);
  const [envelopeId, setEnvelopeId] = useState<string | null>(null);
  const [signatureFields, setSignatureFields] = useState<EditorSignatureFieldExt[]>([]);
  const [sending, setSending] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const hasAutoAddedRecipient = useRef(false);
  const [isOnlySigner, _setIsOnlySigner] = useState(false);
  const [showRecipients, setShowRecipients] = useState(false);
  const [showAddMessage, setShowAddMessage] = useState(false);
  const [showPowerForm, setShowPowerForm] = useState(false);
  const [showDocuments, setShowDocuments] = useState(true);
  const [openRoleDropdownId, setOpenRoleDropdownId] = useState<string | null>(null);
  const [openCustomizeDropdownId, setOpenCustomizeDropdownId] = useState<string | null>(null);
  const [_setSigningOrder, _setSetSigningOrder] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [_showSigningOrder, _setShowSigningOrder] = useState(false);
  const [_showBulkModal, _setShowBulkModal] = useState(false);
  const [_bulkStep, _setBulkStep] = useState<1 | 2>(1);
  const [_bulkMethod, _setBulkMethod] = useState<'manual' | 'csv'>('manual');
  const [_bulkSharedRole, _setBulkSharedRole] = useState<Recipient['role'] | ''>('' as any);
  const [_bulkRows, _setBulkRows] = useState<Array<{ id: string; name: string; email: string }>>([
    { id: `row_${Date.now()}`, name: '', email: '' },
    { id: `row_${Date.now() + 1}`, name: '', email: '' },
    { id: `row_${Date.now() + 2}`, name: '', email: '' },
  ]);
  const [bulkList, _setBulkList] = useState<null | { role: Recipient['role']; items: Array<{ name: string; email: string }> }>(null);
  const [_bulkBatchName, _setBulkBatchName] = useState<string>('');
  const [bulkRoleDropdownOpen, setBulkRoleDropdownOpen] = useState<boolean>(false);
  const [bulkCustomizeOpen, setBulkCustomizeOpen] = useState<boolean>(false);
  const [helpMenuOpen, setHelpMenuOpen] = useState<boolean>(false);
  const [helpSidebarOpen, setHelpSidebarOpen] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const advancedContentRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = {
    recipientPrivileges: useRef<HTMLDivElement | null>(null),
    reminders: useRef<HTMLDivElement | null>(null),
    expiration: useRef<HTMLDivElement | null>(null),
    mobileFriendly: useRef<HTMLDivElement | null>(null),
    comments: useRef<HTMLDivElement | null>(null),
  } as const;
   const [csvRoleDropdownOpen, setCsvRoleDropdownOpen] = useState<boolean>(false);
  const [csvCustomizeOpen, setCsvCustomizeOpen] = useState<boolean>(false);
   const [showEnvelopeTooltip, setShowEnvelopeTooltip] = useState(false);
  const [showFrequencyTooltip, setShowFrequencyTooltip] = useState(false);
  const bulkRoleRef = useRef<HTMLButtonElement | null>(null);
  const bulkCustomizeRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (bulkRoleDropdownOpen && bulkRoleRef.current && !bulkRoleRef.current.contains(target)) {
        setBulkRoleDropdownOpen(false);
      }
      if (bulkCustomizeOpen && bulkCustomizeRef.current && !bulkCustomizeRef.current.contains(target)) {
        setBulkCustomizeOpen(false);
      }
      if (csvRoleDropdownOpen) setCsvRoleDropdownOpen(false);
      if (csvCustomizeOpen) setCsvCustomizeOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [bulkRoleDropdownOpen, bulkCustomizeOpen, csvRoleDropdownOpen, csvCustomizeOpen]);

 const [suggestionsOpenForId, setSuggestionsOpenForId] = useState<string | null>(null);
  const suggestionsContainerRef = useRef<HTMLDivElement | null>(null);

  const [envelopeTypes, setEnvelopeTypes] = useState<any[]>([]);
  const [selectedEnvelopeType, setSelectedEnvelopeType] = useState<string>('');
  const [typeDropdownOpen, setTypeDropdownOpen] = useState<boolean>(false);
  const [typeSearch, setTypeSearch] = useState<string>('');
  const [showOtherInputInDropdown, setShowOtherInputInDropdown] = useState<boolean>(false);
  const [newEnvelopeTypeValue, setNewEnvelopeTypeValue] = useState<string>('');
  const [savingNewType, setSavingNewType] = useState<boolean>(false);
  const typeDropdownRef = useRef<HTMLDivElement | null>(null);

  const [isCreatorTourOpen, setIsCreatorTourOpen] = useState<boolean>(false);
  const [creatorTourIndex, setCreatorTourIndex] = useState<number>(0);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const creatorTourSteps = [
    { id: 'upload', selector: '[data-tour="ec-upload"]', title: 'Upload Documents', content: 'Upload your PDF documents by dragging and dropping or clicking to browse files.' },
    { id: 'powerForm', selector: '[data-tour="ec-power-form"]', title: 'Add Power Form', content: 'Select a power form template to use for this envelope. Power forms are reusable templates that can be filled out by different signers.' },
    { id: 'parties', selector: '[data-tour="ec-parties"]', title: 'Configure Signers', content: 'Set the number of signers and configure which signer signs first. You can also choose which signer you are.' },
    { id: 'message', selector: '[data-tour="ec-message-toggle"]', title: 'Add Message', content: 'Click to add a subject line and optional message that will be included in the email sent to recipients.' },
    { id: 'subjectInput', selector: '[data-tour="ec-subject-input"]', title: 'Email Subject', content: 'Enter a clear and descriptive subject line for the email that recipients will receive.' },
    { id: 'type', selector: '[data-tour="ec-envelope-type"]', title: 'Envelope Type', content: 'Select an envelope type to categorize and organize your documents (e.g., Contract, Agreement, Invoice).' },
    { id: 'next', selector: '[data-tour="ec-next-button"]', title: 'Next Step', content: 'Click Next to proceed to placing signature fields on your documents. You can return to edit settings later.' },
  ] as const;
  const [creatorTargetRect, setCreatorTargetRect] = useState<DOMRect | null>(null);

  const steps = [
    { id: 1, name: 'Documents', description: 'Upload documents' },
    { id: 2, name: 'Signers', description: 'Add recipients and roles' },
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    setFiles(files);
    if (!files) return;

    const subjectWasAuto = (envelopeData.subject || '').trim().startsWith('Complete with Esign:');
    if (!envelopeData.subject || envelopeData.subject.trim() === '' || subjectWasAuto) {
      const names = Array.from(files).map(f => f.name).filter(Boolean);
      if (names.length > 0) {
        setEnvelopeData(prev => ({ ...prev, subject: `Complete with Esign: ${names.join(', ')}` }));
      }
    }

    processFiles(Array.from(files));
  };

  const processFiles = (files: File[]) => {
    const validDocs: Document[] = [];
    const invalidFiles: File[] = [];

    files.forEach((file) => {
      if (file.type !== "application/pdf") {
        invalidFiles.push(file);
        return; 
      }

      const newDocument: Document = {
        id: `doc_${Date.now()}_${Math.random()}`,
        name: file.name,
        size: file.size,
        pages: Math.ceil(file.size / 100000), 
        type: file.type,
        url: URL.createObjectURL(file),
        file: file,
      };
      validDocs.push(newDocument);
    });

    if (invalidFiles.length > 0) {
      alert(
        `Only PDF files are allowed. The following files are invalid:\n\n${invalidFiles
          .map((f) => f.name)
          .join("\n")}`
      );
    }
    if (validDocs.length > 0) {
      const allDocNames = [...(documents || []).map(d => d.name), ...validDocs.map(d => d.name)].filter(Boolean);
      setDocuments((prev) => [...prev, ...validDocs]);
      const subjectWasAuto = (envelopeData.subject || '').trim().startsWith('Complete with Esign:');
      if (!envelopeData.subject || envelopeData.subject.trim() === '' || subjectWasAuto) {
        setEnvelopeData(prev => ({ ...prev, subject: `Complete with Esign: ${allDocNames.join(', ')}` }));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const uploadDocuments = async (_currentStep: any) => {
    if (!envelopeData.subject || envelopeData.subject.trim() === '') {
      alert('Please enter a subject before uploading documents.');
      return false;
    }
    if (!selectedEnvelopeType || selectedEnvelopeType.trim() === '') {
      alert('Please select an Envelope Type before uploading documents.');
      return false;
    }
    if (!documents || documents.length === 0) return;
    const invalidFiles = documents.filter(
      (doc) => !doc.type || !doc.type.toLowerCase().includes('pdf')
    );

    if (invalidFiles.length > 0) {
      alert(
        `Only PDF files are allowed. The following files are invalid:\n\n${invalidFiles
          .map((f) => f.name)
          .join('\n')}`
      );
      return false; 
    }
    setDocuments((prev) =>
      prev.map((doc) => ({ ...doc, isUploading: true, uploadProgress: 0 }))
    );
    let loopEnvelopeId = envelopeId; 
    for (const doc of documents) {
      const formData = new FormData();
      if (doc.file) {
        formData.append('files', doc.file, doc.name);
      } else {
        console.warn('Skipping document with no file:', doc.name);
        continue;
      }
      if (loopEnvelopeId) formData.append('envelopeId', loopEnvelopeId);
      formData.append('subject', envelopeData.subject.trim());
      formData.append('message', (envelopeData.message || '').trim());
      if (selectedEnvelopeType) {
        formData.append('envelopetype', selectedEnvelopeType);
      }
      try {
        const response = await eSignApi.post('/api/e-sign/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (progressEvent.total && progressEvent.loaded) {
              const percent = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setDocuments((prev) =>
                prev.map((d) =>
                  d.id === doc.id ? { ...d, uploadProgress: percent } : d
                )
              );
            }
          },
        });
        if (response.status === 200) {
          loopEnvelopeId = response.data.data.envelopeId;
        }
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === doc.id
              ? { ...d, isUploading: false, uploadProgress: 100 }
              : d
          )
        );
      } catch (err) {
        console.error('Upload failed for', doc.name, err);
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === doc.id
              ? { ...d, isUploading: false, uploadProgress: 0 }
              : d
          )
        );
      }
    }
    if (loopEnvelopeId) {
      setEnvelopeId(loopEnvelopeId);    
      await savePowerFormSlots(loopEnvelopeId);
      await getEnvelopeDetail(loopEnvelopeId);
      navigate(`/e-sign/powerforms?step=2&envelopeId=${loopEnvelopeId}`);
      return true;
    }
  };
  const insertRecipient = async () => {
    if (recipients?.length === 0) return;
    const recipientData = recipients.map(recipient => ({
      name: recipient.name,
      email: recipient.email,
      role: recipient.role,
      order: recipient.order,
      status: recipient.status,
      authentication: recipient.authentication
    }));
    try {
      const response = await eSignApi.post('/api/e-sign/add-recipients',
        {
          envelopeId,
          recipients: recipientData
        }
      );
      if (response.status === 200) {
        console.log('Recipients inserted successfully:', response.data.envelopeId);
        await getEnvelopeDetail(response.data.envelopeId);
        console.log('Current Step:', currentStep + 1);
        await navigate(`/e-sign/powerforms?step=${currentStep + 1}&envelopeId=${response.data.envelopeId}`);
      }
    } catch (error) {
      console.error('Error inserting recipients:', error);
    }
  }
  const saveSignatureFields = async () => {
    if (!envelopeId || signatureFields.length === 0) return;
    console.log('Preparing to save signature fields:', signatureFields);
    const fieldsData = signatureFields.map(field => ({
      _id: field._id,
      documentId: field.docId ?? field.documentId, // backward compatibility
      recipientId: mode === "normal" ? field.recipientId || null : null,
      slotId: field?.slotId || null,
      page: field.page,
      x: field.x,
      y: field.y,
      width: field.width,
      height: field.height,
      type: field.type || "signature",
      status: "pending",
      signerIndex: mode === "power" ? (field.signerIndex ?? null) : null,
      label: field.label ?? (field.type === "signature" ? "Signature" : undefined),
      option: field.options ?? [],
      fieldId: field.fieldId ?? null,
    }));
    console.log('Transformed fields data for saving:', fieldsData);

    try {
      const response = await eSignApi.post('/api/e-sign/save-signature-fields', {
        envelopeId,
        signatureFields: fieldsData
      });
      if (response.status === 200) {
        setSignatureFields(response.data.data.signatureFields);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving signature fields:', error);
      throw error;
    }
  };
  const saveSignatureFieldsImmediate = async (fields: EditorSignatureFieldExt[]) => {
    try {
      if (!envelopeId) return;
      const fieldsData = fields.map(field => ({
        _id: field._id,
        documentId: field.docId ?? field.documentId,
        recipientId: mode === 'normal' ? field.recipientId || null : null,
        slotId: field?.slotId || null,
        page: field.page,
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        type: field.type || 'signature',
        status: 'pending',
        signerIndex: mode === 'power' ? (field.signerIndex ?? null) : null,
        label: field.label ?? (field.type === 'signature' ? 'Signature' : undefined),
        option: field.options ?? [],
        fieldId: field.fieldId ?? null,
      }));

      const response = await eSignApi.post('/api/e-sign/save-signature-fields', {
        envelopeId,
        signatureFields: fieldsData,
      });
      if (response.status === 200) {
        setSignatureFields(response.data.data.signatureFields);
      }
    } catch (err) {
      console.error('Immediate save of signature fields failed:', err);
    }
  };
  const getEnvelopeDetail = async (envelopeId: string) => {
    try {
      const response = await eSignApi.get(`/api/e-sign/envelope/${envelopeId}`);
      if (response.status === 200) {
        const apiDocs = (response.data.data.documents || []).map((doc: any) => ({
          ...doc,
          type: doc.type || 'application/pdf',
          url: doc.url || `${import.meta.env.VITE_ESIGN_SERVICE_URL}/uploads/${encodeURIComponent(doc.name || '')}`,
        }));
        setDocuments(apiDocs);
        console.log('Fetched documents:', apiDocs);
        setRecipients(response.data.data.recipients);
        console.log('Fetched recipients:', response.data.data.recipients);
        const env = response.data.data;
        setEnvelopeData(prev => ({
          ...prev,
          subject: typeof env.subject === 'string' ? env.subject : (prev.subject || ''),
          message: typeof env.message === 'string' ? env.message : (prev.message || ''),
        }));
        if (typeof env.envelopetype === 'string' && env.envelopetype) {
          setSelectedEnvelopeType(env.envelopetype);
        }
        setEnvelopeId(envelopeId);
      }
    } catch (error) {
      console.error('Error fetching envelope details:', error);
    }
  };
  const validateAndScrollToField = (): { isValid: boolean; fieldSelector?: string; message?: string } => {
    if (currentStep === 1) {
      if (!documents || documents.length === 0) {
        return {
          isValid: false,
          fieldSelector: '[data-tour="ec-upload"]',
          message: 'Please upload at least one document'
        };
      }
      if (!selectedEnvelopeType || selectedEnvelopeType.trim() === '') {
        return {
          isValid: false,
          fieldSelector: '[data-tour="ec-envelope-type"]',
          message: 'Please select an envelope type'
        };
      }
      if (selectedEnvelopeType === 'Other' && (!newEnvelopeTypeValue || newEnvelopeTypeValue.trim() === '')) {
        return {
          isValid: false,
          fieldSelector: '[data-tour="ec-envelope-type"]',
          message: 'Please enter an envelope type'
        };
      }
      if (!envelopeData.subject || envelopeData.subject.trim() === '') {
        return {
          isValid: false,
          fieldSelector: '[data-tour="ec-subject-input"]',
          message: 'Please enter an email subject'
        };
      }
    }
    if (currentStep === 2) {
      if (mode === 'power') {
        if (!parties || parties.length === 0) {
          if (!showPowerForm) {
            setShowPowerForm(true);
          }
          return {
            isValid: false,
            fieldSelector: '[data-tour="ec-power-form"]',
            message: 'Please add at least one signer for the Power Form'
          };
        }
        if (!selectedPartyId) {
          if (!showPowerForm) {
            setShowPowerForm(true);
          }
          return {
            isValid: false,
            fieldSelector: '[data-tour="ec-parties"]',
            message: 'Please choose which signer you are'
          };
        }
        if (!firstSigningPartyId) {
          if (!showPowerForm) {
            setShowPowerForm(true);
          }
          return {
            isValid: false,
            fieldSelector: '[data-tour="ec-parties"]',
            message: 'Please choose which signer signs first'
          };
        }
      } else {
        if (!recipients || recipients.length === 0) {
          if (!showRecipients) {
            setShowRecipients(true);
          }
          return {
            isValid: false,
            fieldSelector: '[data-tour="ec-recipients-toggle"]',
            message: 'Please add at least one recipient'
          };
        }
        const firstInvalidRecipient = recipients.findIndex(r => !r.name || !r.name.trim() || !r.email || !r.email.trim());
        if (firstInvalidRecipient !== -1) {
          if (!showRecipients) {
            setShowRecipients(true);
          }
          const recipient = recipients[firstInvalidRecipient];
          if (!recipient.name || !recipient.name.trim()) {
            return {
              isValid: false,
              fieldSelector: `input[data-recipient-name-id="${recipient.id}"]`,
              message: 'Please fill in the recipient name'
            };
          }
          if (!recipient.email || !recipient.email.trim()) {
            return {
              isValid: false,
              fieldSelector: `input[data-recipient-email-id="${recipient.id}"]`,
              message: 'Please fill in the recipient email'
            };
          }
        }
      }
    }
    if (currentStep === 5) {
      if (!envelopeData.subject || envelopeData.subject.trim() === '') {
        return {
          isValid: false,
          fieldSelector: '[data-tour="ec-subject-input"]',
          message: 'Please enter an email subject'
        };
      }
    }
    return { isValid: true };
  };

  const scrollToField = (selector: string, message: string) => {
    setTimeout(() => {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        let inputField: HTMLElement | null = null;
        if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
          inputField = element;
        } else {
          inputField = element.querySelector('input, select, textarea, button') as HTMLElement;
        }
        
        if (inputField) {
          setTimeout(() => {
            inputField!.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            inputField!.focus();
            if (inputField instanceof HTMLInputElement || inputField instanceof HTMLTextAreaElement) {
              setTimeout(() => {
                inputField!.select();
              }, 50);
            }
            
            inputField.style.borderColor = '#ef4444';
            inputField.style.borderWidth = '2px';
            inputField.style.boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.2), 0 0 20px rgba(239, 68, 68, 0.3)';
            inputField.style.transition = 'all 0.3s ease';
            inputField.style.zIndex = '9999';
            let pulseCount = 0;
            const pulseInterval = setInterval(() => {
              if (pulseCount < 3) {
                inputField!.style.transform = 'scale(1.02)';
                setTimeout(() => {
                  inputField!.style.transform = 'scale(1)';
                }, 200);
                pulseCount++;
              } else {
                clearInterval(pulseInterval);
              }
            }, 600);
            
            setTimeout(() => {
              inputField!.style.borderColor = '';
              inputField!.style.borderWidth = '';
              inputField!.style.boxShadow = '';
              inputField!.style.transform = '';
              inputField!.style.zIndex = '';
              clearInterval(pulseInterval);
            }, 4000);
          }, 500);
        } else {
          element.style.outline = '3px solid rgba(239, 68, 68, 0.5)';
          element.style.outlineOffset = '2px';
          setTimeout(() => {
            element.style.outline = '';
            element.style.outlineOffset = '';
          }, 4000);
        }
        toast.error(message, {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#ef4444',
            color: '#fff',
            fontSize: '16px',
            padding: '16px 24px',
          },
        });
      }
    }, 150);
  };

  const handleNext = async () => {
    if (nextLoading) return;
    const validation = validateAndScrollToField();
    if (!validation.isValid) {
      if (validation.fieldSelector && validation.message) {
        scrollToField(validation.fieldSelector, validation.message);
      }
      setNextLoading(false);
      return;
    }
    
    setNextLoading(true);
    try {
      if (currentStep === 1) {
        const success = await uploadDocuments(currentStep);
        if (!success) {
          setNextLoading(false);
          return; 
        }
      }
      if (currentStep === 2) {
        if (mode === 'normal') {
          await insertRecipient();
        } else {
          if (signatureFields.length === 0) {
            toast.error('Please add at least one signature field.');
            setNextLoading(false);
            return;
          }
          const saved = await saveSignatureFields();
          if (!saved) {
            toast.error('Failed to save signature fields. Please try again.');
            setNextLoading(false);
            return;
          }
          if (envelopeId) {
            navigate(`/e-sign/envelope/${envelopeId}`);
          } else {
            toast.error('Envelope ID not found. Please try again.');
            setNextLoading(false);
            return;
          }
          return; // Don't increment step, we're navigating away
        }
      }
      // Only increment step if not in power mode step 2
      if (currentStep === 1) {
        setCurrentStep(2);
      } else if (mode === 'normal') {
        setCurrentStep(prev => Math.min(6, prev + 1));
      }
    } catch (err) {
      console.error('handleNext error:', err);
      // optionally surface error to user
    } finally {
      // small delay to avoid flicker (optional)
      // await new Promise(r => setTimeout(r, 150));
      setNextLoading(false);
    }
  };

  const removeDocument = async (docId: string) => {
    // Heuristic: If the ID is a MongoDB ObjectId (24 hex chars), treat it as DB record
    const isDbRecord = /^[a-fA-F0-9]{24}$/.test(docId);
    if (isDbRecord && envelopeId) {
      try {
        await eSignApi.post(`/api/e-sign/envelope/remove-document/${docId}/${envelopeId}`);
        console.log(`Document ${docId} deleted from DB successfully.`);
      } catch (error) {
        console.error('Failed to delete document from DB:', error);
      }
    }
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
  };

  const addRecipient = () => {
    const newRecipient: Recipient = {
      id: `recipient_${Date.now()}`,
      name: '',
      email: '',
      role: 'signer',
      order: recipients?.length + 1,
      status: 'waiting',
      authentication: 'email'
    };
    setRecipients(prev => [...prev, newRecipient]);
  };


  const handleSendEnvelope = async () => {
    if (!envelopeId) return;
    setSending(true);
    try {
      const resp = await eSignApi.post(`/api/e-sign/send-envelope/${envelopeId}`);
      const milestone = resp?.data?.referralMilestone;
      if (milestone?.achieved) {
        setSending(false);
        await Swal.fire({
          icon: 'success',
          title: 'Milestone achieved!',
          html: referralMilestoneSwalHtml(milestone),
          confirmButtonText: 'Awesome',
          confirmButtonColor: '#260559',
        });
      } else {
        setSending(false);
        alert('Envelope sent successfully!');
      }
      navigate('/e-sign/aggrement');
    } catch (err) {
      console.error(err);
      alert('Failed to send envelope. Try again.');
    } finally {
      setSending(false);
    }
  };
  useEffect(() => {
    getSteps();
  }, [location.search, routeEnvelopeId]);

  // Fetch envelope types on component mount
  useEffect(() => {
    fetchEnvelopeTypes();
    setMode('power');
  }, []);

  const fetchEnvelopeTypes = async () => {
    try {
      const response = await eSignApi.get('/api/e-sign/envelope-types');
      if (response.status === 200 && response.data.data) {
        setEnvelopeTypes(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching envelope types:', error);
    }
  };

  const handleEnvelopeTypeSelect = (value: string) => {
    if (value === 'Other') {
      setShowOtherInputInDropdown(true);
      setNewEnvelopeTypeValue('');
      // Don't close dropdown, show input instead
      return;
    }
    setSelectedEnvelopeType(value);
    setShowOtherInputInDropdown(false);
    setTypeDropdownOpen(false);
    setTypeSearch('');
  };

  // Handle saving new envelope type
  const handleSaveNewEnvelopeType = async () => {
    if (!newEnvelopeTypeValue.trim()) {
      return;
    }

    setSavingNewType(true);
    try {
      const response = await eSignApi.post('/api/e-sign/envelope-types', {
        title: newEnvelopeTypeValue.trim(),
        description: ''
      });

      if (response.status === 201) {
        // Add the new type to the list
        const newType = response.data.data;
        setEnvelopeTypes(prev => [...prev, newType]);
        
        // Select the newly created type
        setSelectedEnvelopeType(newType.title);
        setShowOtherInputInDropdown(false);
        setNewEnvelopeTypeValue('');
        setTypeDropdownOpen(false);
        setTypeSearch('');
        
        toast.success('Envelope type created successfully');
      }
    } catch (error: any) {
      console.error('Error creating envelope type:', error);
      const message = error.response?.data?.message || 'Failed to create envelope type';
      toast.error(message);
    } finally {
      setSavingNewType(false);
    }
  };

  // Close type dropdown on outside click
  useEffect(() => {
    if (!typeDropdownOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(target)) {
        setTypeDropdownOpen(false);
        setShowOtherInputInDropdown(false);
        setNewEnvelopeTypeValue('');
        setTypeSearch('');
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
    };
  }, [typeDropdownOpen]);

  // Tutorial functionality
  useEffect(() => {
    if (!isCreatorTourOpen) return;
    const step = creatorTourSteps[creatorTourIndex];
    // Wait a bit for any UI changes (like expanding sections) to complete
    const timeoutId = setTimeout(() => {
      const el = document.querySelector(step?.selector || '') as HTMLElement | null;
      if (el) {
        // Scroll element into view first
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        // Wait for scroll to complete, then get position
        setTimeout(() => {
          const rect = el.getBoundingClientRect();
          setCreatorTargetRect(rect);
        }, 300);
      } else {
        setCreatorTargetRect(null);
      }
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [isCreatorTourOpen, creatorTourIndex, showPowerForm, showAddMessage]);

  // Check if user has completed the power form creator tour
  const hasCompletedPowerFormTour = () => {
    try {
      const completed = localStorage.getItem('powerFormTourCompleted');
      return completed === 'true';
    } catch {
      return false;
    }
  };

  // Mark tour as completed
  const markPowerFormTourAsCompleted = () => {
    try {
      localStorage.setItem('powerFormTourCompleted', 'true');
    } catch (error) {
      console.error('Error saving power form tour completion:', error);
    }
  };

  const closeCreatorTour = () => { 
    setIsCreatorTourOpen(false); 
    setCreatorTourIndex(0); 
    setCreatorTargetRect(null);
    // Mark tour as completed when user closes it
    markPowerFormTourAsCompleted();
  };
  const nextCreatorStep = async () => {
    const step = creatorTourSteps[creatorTourIndex];
    try {
      if (step?.id === 'powerForm') {
        setShowPowerForm(true);
      }
      if (step?.id === 'message') {
        setShowAddMessage(true);
      }
      if (step?.id === 'next') {
        await handleNext();
      }
    } finally {
      setCreatorTourIndex(i => Math.min(i + 1, creatorTourSteps.length - 1));
    }
  };
  const prevCreatorStep = () => setCreatorTourIndex(i => Math.max(i - 1, 0));
  const creatorTourStartedRef = useRef<boolean>(false);
  useEffect(() => {
    if (!creatorTourStartedRef.current) {
      creatorTourStartedRef.current = true;
      
      // Check if user is new or hasn't completed the tour
      const isNewUser = user?.isFirstLogin === true;
      const hasCompleted = hasCompletedPowerFormTour();
      
      if (isNewUser && !hasCompleted) {
        setIsCreatorTourOpen(true);
        setCreatorTourIndex(0);
      }
    }
  }, [user]);

  const handleTooltipMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setTooltipPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const getSteps = async () => {
    try {
      const params = new URLSearchParams(location.search);
      const step = params.get('step');
      const envelopeId = params.get('envelopeId');

      if (step && envelopeId) {
        // Set step immediately from URL to prevent button from disappearing
        const stepNum = Number(step);
        const urlEnvelopeId = envelopeId; // Rename to avoid confusion
        // Only update if step actually changed to prevent unnecessary re-renders
        setCurrentStep(stepNum);
        setEnvelopeId(urlEnvelopeId);
        
        // Then fetch data asynchronously
        try {
          const response = await eSignApi.get('/api/e-sign/get-envelopes');
          if (response) {
            switch (stepNum) {
              case 1:
                if (urlEnvelopeId) await getEnvelopeDetail(urlEnvelopeId);
                break;
              case 2:
                await getEnvelopeDetail(urlEnvelopeId);
                break;
              case 3:
                console.log('Current step', step);
                await getEnvelopeDetail(urlEnvelopeId);
                await getSignatureFields(urlEnvelopeId);
                break;
              case 4:
                break;
              case 5:
                break;
              case 6:
                await getEnvelopeDetail(urlEnvelopeId);
                break;
              default:
                // Only reset if step is invalid
                if (stepNum < 1 || stepNum > 6) {
                  setCurrentStep(1);
                }
            }
          }
        } catch (apiError) {
          // If API call fails, keep the step from URL
          console.error('Error fetching envelope data:', apiError);
          // Don't reset step - keep it as set from URL
        }
      } else if (routeEnvelopeId) {
        // Arrived via /e-sign/edit/:envelopeId -> preload envelope on Step 1
        setCurrentStep(1);
        setEnvelopeId(routeEnvelopeId);
        await getEnvelopeDetail(routeEnvelopeId);
      } else {
        // No step or envelopeId in URL, default to step 1
        setCurrentStep(1);
      }
    } catch (error) {
      console.error('Error in getSteps:', error);
      // Only reset to step 1 if we don't have a valid step in URL
      const params = new URLSearchParams(location.search);
      const step = params.get('step');
      if (!step) {
        setCurrentStep(1);
      }
    }
  }


  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!suggestionsOpenForId) return;
      const el = suggestionsContainerRef.current;
      if (el && e.target instanceof Node && !el.contains(e.target)) {
        setSuggestionsOpenForId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [suggestionsOpenForId]);

  // Close document menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!openMenuId) return;
      const target = e.target as HTMLElement;
      // Check if click is outside the menu
      if (!target.closest('.document-menu-container')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  // Close role dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!openRoleDropdownId) return;
      const target = e.target as HTMLElement;
      if (!target.closest('.role-dropdown-container')) {
        setOpenRoleDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openRoleDropdownId]);

  // Close customize dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!openCustomizeDropdownId) return;
      const target = e.target as HTMLElement;
      if (!target.closest('.customize-dropdown-container')) {
        setOpenCustomizeDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openCustomizeDropdownId]);
  const syncPartiesToNumber = (count: number) => {
    if (!count || count < 1) count = 1;
    if (count > maxParties) count = maxParties;

    // Build new parties array deterministically
    const newParties: Party[] = [];
    for (let i = 1; i <= count; i++) {
      const letter = String.fromCharCode(64 + i); // 1 -> 'A'
      newParties.push({
        id: `slot_${i}`,
        name: `Signer ${letter}`,
        slot: i,
        role: 'signer',
        authMethod: 'email',
        required: true
      });
    }

    // Commit updates in order
    setParties(newParties);
    setNumberOfParties(count);

    // Ensure selectedPartyId remains valid, otherwise pick slot_1 or last slot
    setSelectedPartyId(prevSelected => {
      const exists = newParties.find(p => p.id === prevSelected);
      return exists ? prevSelected : newParties[0]?.id ?? `slot_1`;
    });

    // Ensure firstSigningPartyId remains valid
    setFirstSigningPartyId(prevFirst => {
      const exists = newParties.find(p => p.id === prevFirst);
      return exists ? prevFirst : newParties[0]?.id ?? `slot_1`;
    });
    console.log(parties)
  };

  const getSignatureFields = async (envelopeId: string) => {
    try {
      const response = await eSignApi.get(`/api/e-sign/envelope/get-signature-fields/${envelopeId}`);
      if (response.status === 200) {
        setSignatureFields(response.data.signatureFields);
        console.log('Fetched signature fields:', response.data.signatureFields);
      }
    } catch (error) {
      console.error('Error fetching signature fields:', error);
    }
  };
  // Step 2B: persist power-form slots / config (minimal)
  const savePowerFormSlots = async (envelopeId:any): Promise<string | null> => {
    // prepare slots payload
    const slotsPayload = parties.map(p => ({
      slotId: p.id,
      index: p.slot,
      label: p.name,
      role: p.role || 'signer',
      authMethod: p.authMethod || 'email',
      required: p.required ?? true
    }));
    setSlots(slotsPayload);
    try {
      // adjust endpoint as per your backend. This is example /api/powerforms or reuse envelopes endpoint.
      const payload = {
        envelopeId, // may be null for new
        slots: slotsPayload,
        creatorSlotId: selectedPartyId,
        firstSigningSlotId: firstSigningPartyId,
        numberOfParties,
      };
      const response = await eSignApi.post('/api/e-sign/envelope/connect/powerform', payload);
      if (response?.status === 200 || response?.status === 201) {
        // backend should return envelopeId or templateId
        const id = response.data?.envelope?._id;
        console.log('Power Form slots saved, envelopeId:', id);
        return id;
      } else {
        console.error('savePowerFormSlots: unexpected response', response);
        return null;
      }
    } catch (err) {
      console.error('savePowerFormSlots error', err);
      return null;
    }
  };

  const [isEditable, setIsEditable] = useState(false);
  const [date, setDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]
  );
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="container mx-auto px-4 sm:px-8 lg:px-50 space-y-6">
            {/* Collapsible Add documents header */}
            <div
              onClick={() => setShowDocuments(prev => !prev)}
              className="cursor-pointer flex items-center justify-between"
            >
              <h3 className="text-lg font-semibold text-gray-900">Add documents</h3>
              {showDocuments ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </div>

            {showDocuments && (
              <div className="space-y-6">
                {/* Layout: Previews + Upload. If multiple docs, show upload below previews */}
                {documents && documents.length > 1 ? (
                  <div className="flex flex-col gap-6">
                    {/* Previews row */}
                    <div className="flex gap-4 overflow-x-auto py-1">
                      {documents.map((doc) => (
                        <div key={doc.id} className="w-60 flex-shrink-0 relative bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col" style={{ height: '320px' }}>
                          {/* Close button at top right */}
                          {!doc.isUploading && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeDocument(doc.id);
                              }}
                              className="absolute top-2 right-2 z-10 w-6 h-6 bg-black bg-opacity-70 rounded-full flex items-center justify-center hover:bg-opacity-90 transition-all"
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                          )}

                          {/* PDF Preview/Thumbnail */}
                          {!doc.isUploading && doc.url && (
                            <div className="w-full flex-1 border-b border-gray-200 overflow-hidden bg-white rounded-t-lg min-h-0">
                              <object
                                data={doc.url}
                                type="application/pdf"
                                className="w-full h-full"
                                title={`Preview of ${doc.name}`}
                              >
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                  <FileText className="w-12 h-12 mb-2" />
                                  <p className="text-sm text-center">PDF Preview</p>
                                </div>
                              </object>
                            </div>
                          )}

                          {/* File Info Section */}
                          {!doc.isUploading ? (
                            <div className="p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  {/* File Name */}
                                  <p className="font-bold text-gray-900 text-base mb-1 truncate" title={doc.name}>
                                    {doc.name}
                                  </p>
                                  {/* Page Count with three dots menu */}
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600">
                                      {doc.pages} page{doc.pages !== 1 ? 's' : ''}
                                    </p>

                                    {/* Three Dots Menu */}
                                    <div className="relative flex-shrink-0 document-menu-container z-30">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                          setMenuPos({ x: rect.left, y: rect.bottom + window.scrollY });
                                          setOpenMenuId(openMenuId === doc.id ? null : doc.id);
                                        }}
                                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                                      >
                                        <MoreVertical className="w-5 h-5 text-gray-600" />
                                      </button>

                                      {/* Context Menu */}
                                      {openMenuId === doc.id && (
                                        <>
                                          {/* backdrop to close on outside click */}
                                          <div className="fixed inset-0 z-[999]" onClick={() => setOpenMenuId(null)} />
                                          <div className="fixed z-[1000] w-48 bg-white rounded-lg border border-gray-200 shadow-xl" style={{ left: (menuPos?.x ?? 0), top: (menuPos?.y ?? 0) }}>
                                            <div className="py-1">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setOpenMenuId(null);
                                                  // Handle Apply Templates
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                                              >
                                                Apply Templates
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setOpenMenuId(null);
                                                  // Handle Replace
                                                  fileInputRef.current?.click();
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                              >
                                                Replace
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setOpenMenuId(null);
                                                  // Handle Download Document
                                                  if (doc.url) {
                                                    const link = document.createElement('a');
                                                    link.href = doc.url;
                                                    link.download = doc.name;
                                                    link.click();
                                                  }
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                              >
                                                <Download className="w-4 h-4" />
                                                Download Document
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setOpenMenuId(null);
                                                  // Handle Rename Document
                                                  const newName = prompt('Enter new name:', doc.name);
                                                  if (newName && newName.trim()) {
                                                    setDocuments(prev => prev.map(d =>
                                                      d.id === doc.id ? { ...d, name: newName.trim() } : d
                                                    ));
                                                  }
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                              >
                                                <FileEdit className="w-4 h-4" />
                                                Rename Document
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setOpenMenuId(null);
                                                  // Handle Delete Document
                                                  if (window.confirm(`Are you sure you want to delete ${doc.name}?`)) {
                                                    removeDocument(doc.id);
                                                  }
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                                Delete Document
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setOpenMenuId(null);
                                                  // Handle View Document
                                                  if (doc.url) {
                                                    window.open(doc.url, '_blank');
                                                  }
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                              >
                                                <Eye className="w-4 h-4" />
                                                View Document
                                              </button>
                                            </div>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Uploading state */
                            <div className="p-4">
                              <p className="font-medium text-gray-900 text-sm mb-2">{doc.name} — Uploading...</p>
                              <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 transition-all"
                                  style={{ width: `${doc.uploadProgress ?? 0}%` }}
                                />
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{doc.uploadProgress ?? 0}%</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Upload area below when multiple docs */}
                    <div className="flex-1" data-tour="ec-upload">
                      <div
                        onClick={(!documents || documents.length === 0) ? () => fileInputRef.current?.click() : undefined}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`bg-gray-100 transition-colors ${isDragOver ? 'border-2 border-blue-400 bg-blue-50' : 'border border-gray-200'} p-6 ${(!documents || documents.length === 0) ? 'cursor-pointer' : ''}`}
                      >
                        {/* Hidden file input */}
                        <input ref={fileInputRef} type="file" multiple accept=".pdf" onChange={handleFileUpload} className="hidden" />
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="flex flex-col items-center justify-center h-full cursor-pointer text-gray-500 hover:text-gray-700"
                        >
                          <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="bg-gray-700 rounded-lg p-3">
                              <Upload className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-sm text-gray-700">Drop your files here or</p>
                            <button
                              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                              style={{ backgroundColor: '#260559' }}
                            >
                              <span>Upload</span>
                              <ArrowDown className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-6 items-start">
                    {/* Left: Document Preview Cards */}
                    {documents && documents.length > 0 && (
                      <div className="flex gap-4 overflow-x-auto py-1">
                        {documents.map((doc) => (
                          <div key={doc.id} className="w-80 flex-shrink-0 relative bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col" style={{ height: '320px' }}>
                            {/* Close button at top right */}
                            {!doc.isUploading && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeDocument(doc.id);
                                }}
                                className="absolute top-2 right-2 z-10 w-6 h-6 bg-black bg-opacity-70 rounded-full flex items-center justify-center hover:bg-opacity-90 transition-all"
                              >
                                <X className="w-3 h-3 text-white" />
                              </button>
                            )}

                            {/* PDF Preview/Thumbnail */}
                            {!doc.isUploading && doc.url && (
                              <div className="w-full flex-1 border-b border-gray-200 overflow-hidden bg-white rounded-t-lg min-h-0">
                                <object
                                  data={doc.url}
                                  type="application/pdf"
                                  className="w-full h-full"
                                  title={`Preview of ${doc.name}`}
                                >
                                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <FileText className="w-12 h-12 mb-2" />
                                    <p className="text-sm text-center">PDF Preview</p>
                                  </div>
                                </object>
                              </div>
                            )}

                            {/* File Info Section */}
                            {!doc.isUploading ? (
                              <div className="p-4">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    {/* File Name */}
                                    <p className="font-bold text-gray-900 text-base mb-1 truncate" title={doc.name}>
                                      {doc.name}
                                    </p>
                                    {/* Page Count with three dots menu */}
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm text-gray-600">
                                        {doc.pages} page{doc.pages !== 1 ? 's' : ''}
                                      </p>

                                      {/* Three Dots Menu */}
                                      <div className="relative flex-shrink-0 document-menu-container z-30">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                            setMenuPos({ x: rect.left, y: rect.bottom + window.scrollY });
                                            setOpenMenuId(openMenuId === doc.id ? null : doc.id);
                                          }}
                                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                                        >
                                          <MoreVertical className="w-5 h-5 text-gray-600" />
                                        </button>

                                        {/* Context Menu */}
                                        {openMenuId === doc.id && (
                                          <>
                                            {/* backdrop to close on outside click */}
                                            <div className="fixed inset-0 z-[999]" onClick={() => setOpenMenuId(null)} />
                                            <div className="fixed z-[1000] w-48 bg-white rounded-lg border border-gray-200 shadow-xl" style={{ left: (menuPos?.x ?? 0), top: (menuPos?.y ?? 0) }}>
                                              <div className="py-1">
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(null);
                                                    // Handle Apply Templates
                                                  }}
                                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                                                >
                                                  Apply Templates
                                                </button>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(null);
                                                    // Handle Replace
                                                    fileInputRef.current?.click();
                                                  }}
                                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                >
                                                  Replace
                                                </button>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(null);
                                                    // Handle Download Document
                                                    if (doc.url) {
                                                      const link = document.createElement('a');
                                                      link.href = doc.url;
                                                      link.download = doc.name;
                                                      link.click();
                                                    }
                                                  }}
                                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                                >
                                                  <Download className="w-4 h-4" />
                                                  Download Document
                                                </button>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(null);
                                                    // Handle Rename Document
                                                    const newName = prompt('Enter new name:', doc.name);
                                                    if (newName && newName.trim()) {
                                                      setDocuments(prev => prev.map(d =>
                                                        d.id === doc.id ? { ...d, name: newName.trim() } : d
                                                      ));
                                                    }
                                                  }}
                                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                                >
                                                  <FileEdit className="w-4 h-4" />
                                                  Rename Document
                                                </button>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(null);
                                                    // Handle Delete Document
                                                    if (window.confirm(`Are you sure you want to delete ${doc.name}?`)) {
                                                      removeDocument(doc.id);
                                                    }
                                                  }}
                                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                  Delete Document
                                                </button>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(null);
                                                    // Handle View Document
                                                    if (doc.url) {
                                                      window.open(doc.url, '_blank');
                                                    }
                                                  }}
                                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                                >
                                                  <Eye className="w-4 h-4" />
                                                  View Document
                                                </button>
                                              </div>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* Uploading state */
                              <div className="p-4">
                                <p className="font-medium text-gray-900 text-sm mb-2">{doc.name} — Uploading...</p>
                                <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500 transition-all"
                                    style={{ width: `${doc.uploadProgress ?? 0}%` }}
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{doc.uploadProgress ?? 0}%</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Right: Upload Dropzone - matches image design */}
                    <div className="flex-1" data-tour="ec-upload">
                      <div
                        onClick={(!documents || documents.length === 0) ? () => fileInputRef.current?.click() : undefined}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`bg-gray-100 transition-colors ${isDragOver
                          ? 'border-2 border-blue-400 bg-blue-50'
                          : 'border border-gray-200'
                          } ${documents && documents.length > 0 ? 'p-6' : 'p-12'
                          } ${(!documents || documents.length === 0) ? 'cursor-pointer' : ''}`}
                        style={{ height: documents && documents.length > 0 ? '320px' : 'auto' }}
                      >
                        {/* Hidden file input */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept=".pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                        />

                        {/* CTA when no documents - matches image exactly */}
                        {(!documents || documents.length === 0) ? (
                          <div className="flex flex-col items-center justify-center space-y-4 h-full">
                            {/* Upload icon in dark grey square box */}
                            <div className="bg-gray-700 rounded-lg p-3">
                              <ArrowUpToLine className="w-6 h-6 text-white" />
                            </div>

                            {/* Text */}
                            <p className="text-sm text-gray-700">Drop your files here or</p>

                            {/* Purple Upload button with dropdown arrow */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                              style={{ backgroundColor: '#260559' }}
                            >
                              <span>Upload</span>
                              <Triangle className="w-3 h-2 fill-white rotate-180" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center justify-center h-full cursor-pointer text-gray-500 hover:text-gray-700"
                          >
                            <div className="flex flex-col items-center justify-center space-y-4">
                              {/* Upload icon in dark grey square box */}
                              <div className="bg-gray-700 rounded-lg p-3">
                                <Upload className="w-6 h-6 text-white" />
                              </div>

                              {/* Text */}
                              <p className="text-sm text-gray-700">Drop your files here or</p>

                              {/* Purple Upload button with dropdown arrow */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  fileInputRef.current?.click();
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                style={{ backgroundColor: '#260559' }}
                              >
                                <span>Upload</span>
                                <ArrowDown className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <hr className="border-t-2 border-gray-300 my-4" />
            {/* Power Form */}
            <div>
              <h3 id='ToggleAddMessage' onClick={() => setShowPowerForm(prev => !prev)} className="text-lg text-gray-900 cursor-pointer flex items-center justify-between">
                <span>Add Signers Slots</span>
                {showPowerForm ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </h3>
            </div>
            {showPowerForm && (
               /* ======================== POWER FORM MODE ======================== */
              <Card className="p-6 shadow-sm border border-gray-200 rounded-sm bg-white space-y-6" data-tour="ec-power-form">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Add Slots</h4>
                  <p className="text-sm text-gray-600">
                    Set up your reusable signer slots.
                  </p>
                </div>

                {/* Power Form Selector */}

                {/* Power Form Preview */}
                {/* {powerFormData && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                    <div>
                      <h5 className="text-base font-semibold text-gray-900">
                        {powerFormData.title}
                      </h5>
                      <p className="text-sm text-gray-600">{powerFormData.description}</p>
                    </div>
                    <div>
                      <h6 className="text-sm font-medium text-gray-800 mb-2">Fields</h6>
                      <ul className="space-y-1">
                        {powerFormData.fields.map((field: any) => (
                          <li
                            key={field._id}
                            className="flex items-center justify-between bg-white border rounded p-2 text-sm"
                          >
                            <span>{field.label || field.type}</span>
                            <span className="text-gray-500">{field.type}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )} */}

                {/* Parties Configuration */}
                <div className="space-y-4" data-tour="ec-parties">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">
                      Number of Signer
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        className="px-2 py-1 border rounded hover:bg-gray-100"
                        onClick={() =>
                          syncPartiesToNumber(Math.max(1, numberOfParties - 1))
                        }
                        type="button"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={maxParties}
                        value={numberOfParties}
                        onChange={(e) =>
                          syncPartiesToNumber(Number(e.target.value || 1))
                        }
                        className="w-20 px-2 py-1 border rounded text-center text-sm"
                      />
                      <button
                        className="px-2 py-1 border rounded hover:bg-gray-100"
                        onClick={() =>
                          syncPartiesToNumber(
                            Math.min(maxParties, numberOfParties + 1)
                          )
                        }
                        type="button"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                     ( Min 1 - Max {maxParties})
                    </p>
                  </div>

                  {/* First Signing Party */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Which signer signs first?
                    </label>
                    <select
                      value={firstSigningPartyId}
                      onChange={(e) => setFirstSigningPartyId(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      {parties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.slot ? `(${p.slot})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Creator Party */}
                  <div>
                    <h6 className="text-sm font-medium text-gray-900 mb-2">
                      Choose which signer you are
                    </h6>
                    <div className="space-y-2">
                      {parties.map((party) => (
                        <label
                          key={party.id}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="creatorParty"
                            checked={selectedPartyId === party.id}
                            onChange={() => setSelectedPartyId(party.id)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{party.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
                )}
            <hr className="border-t-2 border-gray-300 my-4" />
            <div>
              <h3 id='ToggleAddMessage' data-tour="ec-message-toggle" onClick={() => setShowAddMessage(prev => !prev)} className="text-lg text-gray-900 cursor-pointer flex items-center justify-between">
                <span>Add message</span>
                {showAddMessage ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </h3>
            </div>

            {showAddMessage && (
              <div id='AddMessageContent' className="p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={envelopeData.subject}
                    onChange={(e) => setEnvelopeData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 mb-8 border border-black-100 rounded-sm placeholder-gray-900"
                    placeholder="Complete with Esign:"
                    data-tour="ec-subject-input"
                  />
                </div>

                <div>
                  <label className="block text-sm text-black-900 mt-4 mb-2">Message</label>
                  <textarea
                    value={envelopeData.message}
                    onChange={(e) => setEnvelopeData(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-black-100 rounded-sm placeholder-gray-900"
                    placeholder="Enter message"
                  />
                </div>
              </div>
            )}
            <hr className="border-t-2 border-gray-300 my-4" />
            {/* Envelope Type Dropdown */}
            <div className="space-y-6">

              {/* Envelope Type */}
              <div className="relative">
                <label htmlFor="envelopeType" className="block text-sm text-black-700 mb-2">
                  Envelope Type <span className="text-red-500">*</span>
                </label>

                <div className="flex items-center gap-2 w-1/2">
                  <div ref={typeDropdownRef} className="relative flex-1">
                    <button
                      id="envelopeType"
                      type="button"
                      onClick={() => {
                        setTypeDropdownOpen((o) => {
                          if (!o) {
                            // Opening dropdown - reset input state
                            setShowOtherInputInDropdown(false);
                            setNewEnvelopeTypeValue('');
                            setTypeSearch('');
                          }
                          return !o;
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-sm text-left"
                      data-tour="ec-envelope-type"
                    >
                      {selectedEnvelopeType || 'Select Envelope Type'}
                    </button>

                    {typeDropdownOpen && (
                      <div className="absolute left-0 bottom-full mb-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50">
                        {!showOtherInputInDropdown ? (
                          <>
                            <div className="p-2 border-b border-gray-200">
                              <input
                                type="text"
                                value={typeSearch}
                                onChange={(e) => setTypeSearch(e.target.value)}
                                placeholder="Search types..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                                autoFocus
                              />
                            </div>
                            <div className="max-h-56 overflow-auto py-1">
                              {envelopeTypes
                                .filter((t) => t.title.toLowerCase().includes(typeSearch.toLowerCase()))
                                .map((type) => (
                                  <button
                                    key={type.title}
                                    type="button"
                                    onClick={() => handleEnvelopeTypeSelect(type.title)}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${selectedEnvelopeType === type.title ? 'bg-gray-50' : ''}`}
                                  >
                                    {type.title}
                                  </button>
                                ))}
                              {/* Always show "Other" option, especially when no matches */}
                              {envelopeTypes.filter((t) => t.title.toLowerCase().includes(typeSearch.toLowerCase())).length === 0 && typeSearch.trim() !== '' && (
                                <div className="px-4 py-2 text-sm text-gray-500">
                                  No matches found
                                </div>
                              )}
                              <div className="border-t border-gray-100 my-1" />
                              <button
                                type="button"
                                onClick={() => handleEnvelopeTypeSelect('Other')}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-blue-600 font-medium"
                              >
                                Other
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="p-3">
                            <div className="mb-2">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Enter New Envelope Type
                              </label>
                              <input
                                type="text"
                                value={newEnvelopeTypeValue}
                                onChange={(e) => setNewEnvelopeTypeValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && newEnvelopeTypeValue.trim()) {
                                    handleSaveNewEnvelopeType();
                                  } else if (e.key === 'Escape') {
                                    setShowOtherInputInDropdown(false);
                                    setNewEnvelopeTypeValue('');
                                  }
                                }}
                                placeholder="Type new envelope type..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                autoFocus
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowOtherInputInDropdown(false);
                                  setNewEnvelopeTypeValue('');
                                }}
                                className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveNewEnvelopeType}
                                disabled={!newEnvelopeTypeValue.trim() || savingNewType}
                                className="px-3 py-1.5 text-sm bg-[#3E2B66] text-white rounded hover:bg-[#4d3577] disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {savingNewType ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Info Icon */}
                  <div
                    className=" cursor-pointer hover:bg-gray-100 relative"
                    onMouseEnter={() => setShowEnvelopeTooltip(true)}
                    onMouseLeave={() => setShowEnvelopeTooltip(false)}
                  >
                    <Info className="w-6 h-6 text-indigo-900" />

                    {showEnvelopeTooltip && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 bg-[#1A1333] text-white text-sm rounded-md p-3 shadow-lg z-50">
                        Helps distinguish different agreement types during management & workflow sorting.
                        <div className="absolute top-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1A1333] rotate-45" />
                      </div>
                    )}
                  </div>
                </div>

                {selectedEnvelopeType && (
                  <p className="text-sm text-gray-500 mt-2">
                    Selected: {envelopeTypes.find((t) => t.title === selectedEnvelopeType)?.title || selectedEnvelopeType}
                  </p>
                )}
              </div>

              {/* Frequency of Reminders */}
              <div className="relative">
                <label className="block text-sm text-gray-300 mb-2">Frequency of Reminders</label>

                <div className="w-50 flex items-center gap-2 w-1/2">
                  <select
                    disabled
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-sm bg-gray-100 text-gray-500"
                  >
                    <option>Every 0 days</option>
                  </select>

                  <div
                    className="p-2 cursor-pointer hover:bg-gray-100 relative"
                    onMouseEnter={() => setShowFrequencyTooltip(true)}
                    onMouseLeave={() => setShowFrequencyTooltip(false)}
                  >
                    <Info className="w-6 h-6 text-indigo-900" />

                    {showFrequencyTooltip && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 bg-[#1A1333] text-white text-sm rounded-md p-3 shadow-lg z-50">
                        An administrator must allow senders to override account defaults
                        <div className="absolute top-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1A1333] rotate-45" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

        );

      case 2:
        return (
          <SigningEditorStep
            envelopeId={envelopeId}
            documents={documents}
            recipients={recipients}
            signatureFields={signatureFields}
            setSignatureFields={setSignatureFields}
            mode="power"
            // powerFormData={powerFormData}
            slots={slots}
            onSend={mode === 'normal' ? handleSendEnvelope : undefined}
            sending={sending}
            onFieldsChange={(fields) => saveSignatureFieldsImmediate(fields as EditorSignatureFieldExt[])}
            onBack={() => {
              setCurrentStep(1);
              if (envelopeId) {
                navigate(`/e-sign/powerforms?step=1&envelopeId=${envelopeId}`);
              } else {
                navigate(`/e-sign/powerforms?step=1`);
              }
            }}
          />
        );

      case 3:
        return (
          <SigningEditorStep 
            documents={documents} 
            recipients={recipients} 
            signatureFields = {signatureFields} 
            setSignatureFields={setSignatureFields}
            mode="power"
            // powerFormData={powerFormData}
            slots={slots} 
          />
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Security & Authentication</h3>
              <p className="text-gray-600 mb-6">Configure signature types and advanced authentication methods for enhanced security.</p>
            </div>

            {/* Signature Type Selection */}
            <SignatureTypeSelector
              selectedType={envelopeData.signatureType}
              onTypeChange={(type) => setEnvelopeData(prev => ({
                ...prev,
                signatureType: type,
                complianceLevel: type === 'qualified' ? 'qualified' : type === 'advanced' ? 'enhanced' : 'basic'
              }))}
              complianceRequirements={[]}
              documentType="contract"
            />

            {/* Advanced Authentication */}
            {/* <div className="mt-8">
              <AdvancedAuthenticationSelector
                selectedMethods={recipients.map(r => r.authentication).filter(Boolean)}
                onMethodsChange={(methods) => {
                  // Update recipients with new authentication methods
                  setRecipients(prev => prev.map((recipient, index) => ({
                    ...recipient,
                    authentication: methods[index] as Recipient['authentication'] || 'email'
                  })));
                }}
                riskLevel="medium"
                complianceRequirements={[]}
              />
            </div> */}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Envelope Settings</h3>
              <p className="text-gray-600 mb-6">Configure how your envelope will be sent and managed.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                <input
                  type="text"
                  value={envelopeData.subject}
                  onChange={(e) => setEnvelopeData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter envelope subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={envelopeData.message}
                  onChange={(e) => setEnvelopeData(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a message for recipients (optional)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={envelopeData.priority}
                    onChange={(e) => setEnvelopeData(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Signing Order</label>
                  <select
                    value={envelopeData.signingOrder}
                    onChange={(e) => setEnvelopeData(prev => ({ ...prev, signingOrder: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sequential">Sequential (one at a time)</option>
                    <option value="parallel">Parallel (all at once)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Date</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    readOnly={!isEditable}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg 
                      ${isEditable ? "bg-white cursor-text" : "bg-gray-100 cursor-not-allowed"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditable(!isEditable)}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    {isEditable ? "Lock" : "Edit"}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="reminderEnabled"
                    checked={envelopeData.reminderEnabled}
                    onChange={(e) => setEnvelopeData(prev => ({ ...prev, reminderEnabled: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="reminderEnabled" className="text-sm font-medium text-gray-700">
                    Enable automatic reminders
                  </label>
                </div>

                {envelopeData.reminderEnabled && (
                  <div className="ml-7">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reminder interval (days)</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={envelopeData.reminderInterval}
                      onChange={(e) => setEnvelopeData(prev => ({ ...prev, reminderInterval: parseInt(e.target.value) }))}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="requireAllSignatures"
                    checked={envelopeData.requireAllSignatures}
                    onChange={(e) => setEnvelopeData(prev => ({ ...prev, requireAllSignatures: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="requireAllSignatures" className="text-sm font-medium text-gray-700">
                    Require all recipients to sign
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="allowDecline"
                    checked={envelopeData.allowDecline}
                    onChange={(e) => setEnvelopeData(prev => ({ ...prev, allowDecline: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="allowDecline" className="text-sm font-medium text-gray-700">
                    Allow recipients to decline signing
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Review & Send</h3>
              <p className="text-gray-600 mb-6">Review your envelope details before sending to recipients.</p>
            </div>

            <div className="space-y-6">
              {/* Envelope Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Envelope Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Subject</p>
                    <p className="text-gray-900">{envelopeData.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Priority</p>
                    <p className="text-gray-900 capitalize">{envelopeData.priority}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Signature Type</p>
                    <div className="flex items-center gap-2">
                      {envelopeData.signatureType === 'qualified' && <Award className="w-4 h-4 text-purple-600" />}
                      {envelopeData.signatureType === 'advanced' && <Shield className="w-4 h-4 text-blue-600" />}
                      <p className="text-gray-900 capitalize">{envelopeData.signatureType}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Documents</p>
                    <p className="text-gray-900">{documents?.length} document{documents?.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {envelopeData.message && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700">Message</p>
                    <p className="text-gray-900">{envelopeData.message}</p>
                  </div>
                )}
              </div>

              {/* Documents */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Documents</h4>
                <div className="space-y-3">
                  {documents?.map((doc) => (
                    <div key={doc.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        <p className="text-sm text-gray-500">{doc.pages} pages • {(doc.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recipients */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Recipients</h4>
                <div className="space-y-3">
                  {recipients.map((recipient, index) => (
                    <div key={recipient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{recipient.name}</p>
                          <p className="text-sm text-gray-500">{recipient.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700 capitalize">{recipient?.role.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-500 capitalize">
                          {recipient?.authentication?.replace('_', ' ') ?? 'No'} auth
                        </p>

                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Ensure at least one recipient by default; guard against double-run in StrictMode
  useEffect(() => {
    const shouldAutoAdd = (currentStep === 1 || (currentStep === 2 && mode === 'normal'))
      && (!recipients || recipients.length === 0)
      && !isOnlySigner
      && !bulkList; // Don't auto-add when bulk list is active
    if (!hasAutoAddedRecipient.current && shouldAutoAdd) {
      addRecipient();
      hasAutoAddedRecipient.current = true;
    }
  }, [currentStep, mode, recipients, isOnlySigner, bulkList]);

  // Auto-add recipient when recipients section expands and there are no recipients
  useEffect(() => {
    if (showRecipients && !isOnlySigner && (!recipients || recipients.length === 0) && !bulkList) {
      addRecipient();
    }
  }, [showRecipients, bulkList]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-between w-full">

            {/* LEFT — Back + Title */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() =>
                  window.history.length > 1 ? navigate(-1) : navigate('/e-sign/dashboard')
                }
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <h1 className="text-base font-medium text-gray-900">
                {documents?.length > 0
                  ? `Complete with Draft&Sign: ${documents?.[0]?.name || 'Document'}`
                  : 'Upload a Document and Add Envelope Recipients'}
              </h1>
            </div>

            {/* RIGHT — Help + Advanced Options */}
            <div className="flex items-center space-x-3 relative">
              <button
                onClick={(e) => { e.stopPropagation(); setHelpMenuOpen(prev => !prev); }}
                className="p-2 rounded hover:bg-gray-100"
                title="Help"
              >
                <CircleQuestionMark className="w-5 h-5 text-gray-600" />
              </button>

              {helpMenuOpen && (
                <div className="absolute right-24 top-10 w-70 bg-white border border-gray-200 rounded-md shadow-xl z-50">
                  <div className="px-4 py-3 border-b">
                    <h4 className="text-sm font-semibold text-gray-900">Help for this Page</h4>
                  </div>
                  <div className="max-h-80 p-4 overflow-y-auto">
                    <button
                      onClick={() => { setHelpMenuOpen(false); setHelpSidebarOpen(true); }}
                      className="w-full text-left px-4 py-3 text-sm text-blue-700 hover:bg-gray-50"
                    >
                      Basic steps to send an envelope
                    </button>
                    <button
                        onClick={() => { setHelpMenuOpen(false); window.open('help-support', '_blank'); }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-t border-gray-100"
                    >
                      <span className="text-blue-700">Visit the {APP_NAME} Support Center</span> for helpful articles, guides, videos, and more.
                    </button>
                    <div className="p-4 border-t border-gray-100">
                      <button
                        onClick={() => window.open('/help-support', '_blank')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md text-white"
                        style={{ backgroundColor: '#5015FF' }}
                      >
                       <Phone className='w-4 h-4'/>
                        <span className="font-semibold">Contact Support</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button onClick={() => setShowAdvanced(true)} className="border px-4 py-2 rounded-xs text-xs font-medium text-gray-800 hover:bg-gray-100">
                ADVANCED OPTIONS
              </button>
            </div>
          </div>


          <div className="flex items-center space-x-3"></div>
        </div>
      </div>

      <div className="flex">
        {/* Right Help Sidebar */}
        {(
          <div className={`fixed inset-y-0 right-0 w-[420px] bg-white border-l border-gray-200 shadow-2xl z-40 transform transition-transform duration-300 ${helpSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            {/* Header Bar: back + close icons */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <button onClick={() => setHelpSidebarOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => setHelpSidebarOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Content */}
            <div className="px-6 py-6 overflow-y-auto h-full">
              <div className="mb-8 h-98">
                <h3 className="text-[14px] tracking-wide font-semibold text-gray-900 uppercase mb-4">BASIC STEPS TO SEND AN ENVELOPE</h3>
                <div className="pl-4 border-l-2 border-gray-300 text-[14px] leading-6 text-gray-800">
                  <p>
                    To send an envelope, you upload the documents you want signed. Then you add the contact information
                    for the people who need to sign and what kind of information they will add, such as a signature, initials,
                    or their company name.
                  </p>
                </div>
                <div className="pl-4 mt-4 border-l-2 border-gray-300">
                  <button
                    onClick={() => window.open('https://support.docusign.com/en/guides/ndse-user-guide-sending-documents', '_blank')}
                    className="text-[#4C2FFF] underline text-[14px]"
                  >
                    Sending Documents for Signature
                  </button>
                </div>
              </div>

              {/* Bottom links */}
              <div className="pt-6 border-t border-gray-200 space-y-5 text-[14px]">
                <button
                  onClick={() => window.open('https://support.docusign.com', '_blank')}
                  className="flex items-center gap-2 text-[#4C2FFF] hover:underline"
                >
                  <span>Support Center</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  onClick={() => window.open('https://community.docusign.com', '_blank')}
                  className="flex items-center gap-2 text-[#4C2FFF] hover:underline"
                >
                  <span>Community</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  onClick={() => window.open('https://support.docusign.com/contactSupport', '_blank')}
                  className="flex items-center gap-2 text-[#4C2FFF] hover:underline"
                >
                  <span>Contact Us</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Progress Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 p-6 hidden">
          <div className="space-y-4">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${currentStep === step.id
                  ? 'bg-blue-50 border border-blue-200'
                  : currentStep > step.id
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-gray-50'
                  }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === step.id
                    ? 'bg-blue-600 text-white'
                    : currentStep > step.id
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                    }`}
                >
                  {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                </div>
                <div>
                  <p
                    className={`font-medium ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                      }`}
                  >
                    {step.name}
                  </p>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Summary</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Documents</span>
                <span className="font-medium text-gray-900">{documents?.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Recipients</span>
                <span className="font-medium text-gray-900">{recipients?.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Fields</span>

              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Signature Type</span>
                <span className="font-medium text-gray-900 capitalize">{envelopeData?.signatureType}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className={`max-w-6xlVV mx-auto ${(currentStep === 2 && mode === 'power') ? 'pb-20' : ''}`}>
            {renderStepContent()}

            {/* Navigation (hidden on step 2; it has its own fixed footer) */}
            {currentStep !== 2 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200" id='clearBoth'>
               <button
                 onClick={() => {
                   if (currentStep > 1) {
                     setCurrentStep(prev => prev - 1);
                     if (envelopeId) {
                       navigate(`/e-sign/powerforms?step=${currentStep - 1}&envelopeId=${envelopeId}`);
                     } else {
                       navigate(`/e-sign/powerforms?step=${currentStep - 1}`);
                     }
                   } else {
                     setCurrentStep(1);
                     if (envelopeId) {
                       navigate(`/e-sign/powerforms?step=1&envelopeId=${envelopeId}`);
                     } else {
                       navigate(`/e-sign/powerforms?step=1`);
                     }
                   }
                 }}
                 disabled={currentStep === 1}
                 className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <ArrowLeft className="w-4 h-4" />
                 Previous
               </button>

               <div className="flex items-center space-x-2">
                 {steps.map((step) => (
                   <div
                     key={step.id}
                     className={`w-2 h-2 rounded-full ${currentStep >= step.id ? 'bg-blue-600' : 'bg-gray-300'
                       }`}
                   />
                 ))}
               </div>

               {currentStep < 2 ? (
                 <button
                   onClick={handleNext}
                   disabled={nextLoading}
                   className="flex items-center bg-[#260559] gap-2 px-6 py-2 text-white rounded-lg hover:bg-[#260559]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                   data-tour="ec-next-button"
                 >
                   {nextLoading ? (
                     <>
                       <svg className="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                       </svg>
                       Processing...
                     </>
                   ) : (
                     <>Next<ArrowLeft className="w-4 h-4 rotate-180" /></>
                   )}
                 </button>
               ) : (
                 <button
                   onClick={() => navigate(`/e-sign/envelope/${envelopeId}`)}
                   className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
                 >
                   <Eye className="w-4 h-4" />
                   Preview
                 </button>
               )}
             </div>
            )}
            
            {/* Navigation for step 2 (SigningEditorStep in power mode) - Fixed at bottom */}
            {currentStep === 2 && mode === 'power' && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between z-50 shadow-lg">
               <button
                 onClick={() => {
                   setCurrentStep(1);
                   if (envelopeId) {
                     navigate(`/e-sign/powerforms?step=1&envelopeId=${envelopeId}`);
                   } else {
                     navigate(`/e-sign/powerforms?step=1`);
                   }
                 }}
                 className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
               >
                 <ArrowLeft className="w-4 h-4" />
                 Previous
               </button>

               <div className="flex items-center space-x-2">
                 {steps.map((step) => (
                   <div
                     key={step.id}
                     className={`w-2 h-2 rounded-full ${currentStep >= step.id ? 'bg-blue-600' : 'bg-gray-300'
                       }`}
                   />
                 ))}
               </div>

               <button
                 onClick={handleNext}
                 disabled={nextLoading}
                 className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 data-tour="ec-next-button"
               >
                 {nextLoading ? (
                   <>
                     <svg className="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                     </svg>
                     Processing...
                   </>
                 ) : (
                   <>Preview<Eye className="w-4 h-4" /></>
                 )}
               </button>
             </div>
            )}

          </div>
        </div>
      </div>

      {/* Advanced Options Modal */}
      {showAdvanced && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAdvanced(false)} />
          <div className="relative bg-white w-full h-full flex flex-col overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold">Advanced Options</h2>
              <button onClick={() => setShowAdvanced(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100" title="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-1">
              {/* Left Sidebar */}
              <div className="w-72 border-r border-gray-200 p-6 sticky top-16 self-start">
                <nav className="space-y-3 text-sm">
                <button onClick={() => sectionRefs.recipientPrivileges.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="w-full text-left px-3 py-2 rounded hover:bg-gray-100">Recipient Privileges</button>
                <button onClick={() => sectionRefs.reminders.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="w-full text-left px-3 py-2 rounded hover:bg-gray-100">Reminders</button>
                <button onClick={() => sectionRefs.expiration.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="w-full text-left px-3 py-2 rounded hover:bg-gray-100">Expiration</button>
                <button onClick={() => sectionRefs.mobileFriendly.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="w-full text-left px-3 py-2 rounded hover:bg-gray-100">Mobile-Friendly</button>
                <button onClick={() => sectionRefs.comments.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="w-full text-left px-3 py-2 rounded hover:bg-gray-100">Comments</button>
                </nav>
              </div>

              {/* Right Content */}
              <div className="flex-1 self-start sticky top-16" ref={advancedContentRef}>
              <div className="p-10 space-y-12">
                {/* Recipient Privileges */}
                <section ref={sectionRefs.recipientPrivileges}>
                  <h3 className="text-2xl text-gray-900">Recipient Privileges</h3>
                  <p className="text-gray-600 mt-2">Give recipients options for how they sign.</p>
                  <div className="mt-6 space-y-4">
                    <label className="flex items-center gap-3 text-gray-800"><input type="checkbox" className="w-4 h-4" defaultChecked /> Recipients can sign on paper</label>
                    <label className="flex items-center gap-3 text-gray-400"><input type="checkbox" className="w-4 h-4" disabled /> Recipients can change signing responsibility or assign a delegate</label>
                  </div>
                  <hr className="mt-8" />
                </section>

                {/* Reminders */}
                <section ref={sectionRefs.reminders}>
                  <h3 className="text-2xl text-gray-900">Reminders</h3>
                  <p className="text-gray-600 mt-2">Follow up with automatic reminders. Signers will receive emails until they sign or decline the envelope.</p>
                  <div className="mt-6 flex items-center gap-3">
                    <label className="flex items-center gap-3 text-gray-800">
                      <input type="checkbox" className="w-5 h-5" />
                      Turn on auto reminders
                    </label>
                  </div>
                  <hr className="mt-8" />
                </section>

                {/* Expiration */}
                <section ref={sectionRefs.expiration}>
                  <h3 className="text-2xl text-gray-900">Expiration</h3>
                  <p className="text-gray-600 mt-2">By default, envelopes expire after 120 days. Recipients can no longer view or sign an envelope after it expires.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Days until envelope expires</label>
                      <select className="w-full border rounded px-3 py-2">
                        <option>Custom days</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Custom number of days *</label>
                      <input className="w-full border rounded px-3 py-2" defaultValue={120} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Send alert</label>
                      <select className="w-full border rounded px-3 py-2">
                        <option>Custom days</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Custom number of days *</label>
                      <input className="w-full border rounded px-3 py-2" defaultValue={0} />
                    </div>
                  </div>
                  <hr className="mt-8" />
                </section>

                {/* Mobile Friendly */}
                <section ref={sectionRefs.mobileFriendly}>
                  <h3 className="text-2xl text-gray-900">Mobile-Friendly Viewing with Responsive Signing</h3>
                  <p className="text-gray-600 mt-2">View your document in preview mode to see how it looks on a mobile device</p>
                  <div className="mt-6">
                    <label className="flex items-center gap-3 text-gray-800">
                      <input type="checkbox" className="w-5 h-5" defaultChecked />
                      Enable Responsive Signing for this envelope
                    </label>
                  </div>
                  <hr className="mt-8" />
                </section>

                {/* Comments */}
                <section ref={sectionRefs.comments}>
                  <h3 className="text-2xl text-gray-900">Comments</h3>
                  <p className="text-gray-600 mt-2">Allow comments on documents. Both senders and recipients can comment.</p>
                </section>
              </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end">
                  <button onClick={() => setShowAdvanced(false)} className="px-6 py-2 rounded text-white" style={{ backgroundColor: '#260559' }}>Save</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    {/* Guided Tour Overlay */}
    {isCreatorTourOpen && (
      creatorTargetRect && (() => {
        // Calculate tooltip position relative to target element
        const tooltipWidth = 384; // max-w-sm = 384px
        const tooltipHeight = 200; // approximate height
        const spacing = 12; // space between tooltip and target
        const padding = 16; // padding from viewport edges
        
        // Calculate horizontal position - center tooltip relative to target, but keep within viewport
        const targetCenterX = creatorTargetRect.left + (creatorTargetRect.width / 2);
        let tooltipLeft = targetCenterX - (tooltipWidth / 2);
        // Keep tooltip within viewport bounds
        if (tooltipLeft < padding) {
          tooltipLeft = padding;
        } else if (tooltipLeft + tooltipWidth > window.innerWidth - padding) {
          tooltipLeft = window.innerWidth - tooltipWidth - padding;
        }
        
        // Calculate vertical position - prefer below, but show above if not enough space
        const spaceBelow = window.innerHeight - creatorTargetRect.bottom - spacing;
        const spaceAbove = creatorTargetRect.top - spacing;
        const showAbove = spaceBelow < tooltipHeight && spaceAbove > spaceBelow;
        
        const tooltipTop = showAbove 
          ? creatorTargetRect.top - tooltipHeight - spacing
          : creatorTargetRect.bottom + spacing;
        
        // Calculate arrow position (centered on target element)
        // Arrow should point to the center of the target element
        // Position is relative to tooltip's left edge
        const arrowOffsetFromTooltipLeft = targetCenterX - tooltipLeft;
        // Constrain arrow to be within tooltip bounds (with some padding)
        const arrowPadding = 20;
        const constrainedArrowLeft = Math.max(arrowPadding, Math.min(arrowOffsetFromTooltipLeft, tooltipWidth - arrowPadding));
        
        // Use dragged position if available, otherwise use calculated position
        const finalLeft = tooltipPosition ? tooltipPosition.x : tooltipLeft;
        const finalTop = tooltipPosition ? tooltipPosition.y : Math.max(padding, Math.min(tooltipTop, window.innerHeight - tooltipHeight - padding));

        return (
          <>
            {/* Tooltip - styled like the tooltip UI */}
            <div
              ref={tooltipRef}
              className="fixed z-50"
              style={{
                left: `${finalLeft}px`,
                top: `${finalTop}px`
              }}
            >
              {/* Tooltip box */}
              <div className="bg-[#000000]/50 text-white text-sm rounded-md shadow-lg max-w-sm relative">
              {/* Draggable header */}
                <div 
                  className="px-4 py-3 font-semibold cursor-move select-none"
                  onMouseDown={handleTooltipMouseDown}
                >
                  {creatorTourSteps[creatorTourIndex]?.title}
                </div>
                <div className="px-4 py-2 text-sm leading-relaxed">
                  {creatorTourSteps[creatorTourIndex]?.content}
                </div>
                <div className="px-4 py-3 flex items-center justify-between gap-2 border-t border-gray-600">
                  <div className="text-xs text-white-900">Step {creatorTourIndex + 1} of {creatorTourSteps.length}</div>
                  <div className="flex items-center gap-2">
                    <button onClick={closeCreatorTour} className="px-3 py-1.5 text-sm text-gray-300 hover:text-white">Skip</button>
                    <button onClick={prevCreatorStep} disabled={creatorTourIndex===0} className={`px-3 py-1.5 border border-white-500 rounded-sm text-sm ${creatorTourIndex===0 ? 'cursor-not-allowed text-white-900' : 'hover:bg-white-700 text-white'}`}>Back</button>
                    {creatorTourIndex < creatorTourSteps.length - 1 ? (
                      <button onClick={nextCreatorStep} className="px-3 py-1.5 bg-white text-[#26263d] rounded-sm text-sm font-medium hover:bg-gray-100">Next</button>
                    ) : (
                      <button onClick={closeCreatorTour} className="px-3 py-1.5 bg-white text-[#26263d] rounded-sm text-sm font-medium hover:bg-gray-100">Done</button>
                    )}
                  </div>
                </div>
                {/* Arrow pointing to target - positioned absolutely within tooltip */}
                <div 
                  className={`absolute h-0 w-0 ${showAbove ? 'top-full border-t-8 border-t-[#26263d]/30 border-l-8 border-l-transparent border-r-8 border-r-transparent' : 'bottom-full border-b-8 border-b-[#26263d]/30 border-l-8 border-l-transparent border-r-8 border-r-transparent'}`}
                  style={{ 
                    left: `${constrainedArrowLeft}px`,
                    transform: 'translateX(-50%)'
                  }}
                ></div>
              </div>
            </div>
          </>
        );
      })()
    )}
    </div>
  );
};

export default PowerFormCreate;