import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Trash2,
  ChevronDown,
  ChevronUp,
  User,
  Key,
  MessageSquare,
  ArrowUpToLine,
  Triangle,
  PenLine,
  UserRoundPlus,
  Contact,
  LockKeyhole,
  ArrowDownToLine,
  Plus,
  AlertTriangle,
  CircleQuestionMark,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Phone,
  Edit,
  BookOpen,
  Search,
  Save,
  GripVertical,
  Mail,
  Sparkles
} from 'lucide-react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
// import { useApp } from '../../context/AppContext';
import { useAuth } from '../../components/AuthService/AuthContext';
import type { Document as ESDocument, Recipient } from '../../types';
import AdvancedAuthenticationSelector from '../../components/ESign/advanced/AdvancedAuthenticationSelector';
import SignatureTypeSelector from '../../components/ESign/advanced/SignatureTypeSelector';
import { eSignApi, subscriptionApi } from '../../services/apiHelper';
import { SubscriptionStorage } from '../../services/subscriptionService';
import SigningEditorStep from '../../components/ESign/SigningEditorStep';
import { SubscriptionPlansModal } from '../../components/common/SubscriptionPlansModal';
import { debounce } from '../../components/common/lib/utils';
import type { SignatureField as EditorSignatureField } from '../../components/ESign/SigningEditorStep';
// Extend editor field locally to allow optional power-form metadata used during save
type EditorSignatureFieldExt = EditorSignatureField & {
  signerIndex?: number | null;
  isPowerForm?: boolean;
  fieldType?: string;
  option?: string[];
};
import type { AxiosProgressEvent } from 'axios';
// type FieldType = "signature" | "text" | "email" | "number" | "id";
// --- add this type near the other types at the top of the file ---
type Party = {
  id: string;                 // e.g. "slot_1"
  name: string;               // display label, e.g. "Party A"
  slot: number;               // 1-based index
  role?: 'signer' | 'approver' | 'carbon_copy' | string;
  authMethod?: 'email' | 'sms' | 'access_code' | 'none' | string;
  required?: boolean;
};

import { Document as PDFDocument, Page as PDFPage } from 'react-pdf';

const EnvelopeCreator: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { envelopeId: routeEnvelopeId } = useParams<{ envelopeId: string }>();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Power Form State
  const [mode, _setMode] = useState<'normal' | 'power'>('normal');
  const [_powerForms, _setPowerForms] = useState<any[]>([]);
  const [selectedForm, _setSelectedForm] = useState<string>("");
  const [powerFormData, _setPowerFormData] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);

  // Parties & related state.....
  const [parties, _setParties] = useState<Party[]>(
    [{ id: 'slot_1', name: 'Party A', slot: 1, role: 'signer', authMethod: 'email', required: true }]
  );
  const [numberOfParties, __setNumberOfParties] = useState<number>(parties.length || 1);
  const [_maxParties] = useState<number>(10);

  // Selected/first party ids (creator choices)
  const [selectedPartyId, _setSelectedPartyId] = useState<string>(parties[0]?.id ?? 'slot_1');
  const [firstSigningPartyId, _setFirstSigningPartyId] = useState<string>(parties[0]?.id ?? 'slot_1');

  const [showTip, setShowTip] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
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
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [documentTitle, setDocumentTitle] = useState<string>(''); // Separate state for title, independent of subject

  const [documents, setDocuments] = useState<ESDocument[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [_files, setFiles] = useState<FileList | null>(null);
  const [envelopeId, setEnvelopeId] = useState<string | null>(null);
  const [signatureFields, setSignatureFields] = useState<EditorSignatureFieldExt[]>([]);
  const [sending, setSending] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const hasAutoAddedRecipient = useRef(false);
  const [isOnlySigner, setIsOnlySigner] = useState(false);
  const [showRecipients, setShowRecipients] = useState(false);
  const [showAddMessage, setShowAddMessage] = useState(false);
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(null);

  // Handle document from state (e.g., from AI content generation) or pending documents
  useEffect(() => {
    const loadDocument = async () => {
      // First check for document from state
      const documentData = location.state?.documentData;
      if (documentData && documentData.content && documents.length === 0) {
        try {
          // Convert base64 to File
          const byteCharacters = atob(documentData.content);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: documentData.type || 'application/pdf' });
          const file = new File([blob], documentData.name || 'Generated Document.pdf', {
            type: documentData.type || 'application/pdf'
          });

          const newDocument: ESDocument = {
            id: `doc_${Date.now()}_${Math.random()}`,
            name: file.name,
            size: file.size,
            pages: Math.ceil(file.size / 100000), // Mock page calculation
            type: file.type,
            url: URL.createObjectURL(file),
            file: file,
          };

          setDocuments([newDocument]);
          setEnvelopeData(prev => ({
            ...prev,
            subject: prev.subject || `Complete with Draft&Sign: ${file.name}`
          }));

          // Clear state to prevent re-adding
          navigate(location.pathname, { replace: true, state: null });
        } catch (error) {
          console.error('Error processing document from state:', error);
        }
      } else if (documents.length === 0) {
        // Check for pending document in localStorage
        const pendingDocId = localStorage.getItem('pendingDocumentId');
        const pendingSessionId = localStorage.getItem('pendingSessionId');
        
        if (pendingDocId || pendingSessionId) {
          try {
            const { aiContentService } = await import('../../services/aiContentService');
            const response = await aiContentService.getPendingDocument(pendingDocId || undefined, pendingSessionId || undefined);
            
            if (response.success && response.data) {
              // Convert content to PDF and add to documents
              const pdfResponse = await aiContentService.convertToPDF({
                content: response.data.content,
                documentName: response.data.documentName
              });

              if (pdfResponse.success && pdfResponse.data.base64) {
                const byteCharacters = atob(pdfResponse.data.base64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                const file = new File([blob], `${response.data.documentName}.pdf`, {
                  type: 'application/pdf'
                });

                const newDocument: ESDocument = {
                  id: `doc_${Date.now()}_${Math.random()}`,
                  name: file.name,
                  size: file.size,
                  pages: Math.ceil(file.size / 100000),
                  type: file.type,
                  url: URL.createObjectURL(file),
                  file: file,
                };

                setDocuments([newDocument]);
                setEnvelopeData(prev => ({
                  ...prev,
                  subject: prev.subject || `Complete with Draft&Sign: ${file.name}`
                }));

                // Clean up
                localStorage.removeItem('pendingDocumentId');
                localStorage.removeItem('pendingSessionId');
              }
            }
          } catch (error) {
            console.error('Error loading pending document:', error);
            // Clean up on error
            localStorage.removeItem('pendingDocumentId');
            localStorage.removeItem('pendingSessionId');
          }
        }
      }
    };

    loadDocument();
  }, [location.state]);

  // Initialize title when documents are uploaded (only once, not when subject changes)
  useEffect(() => {
    if (documents?.length > 0 && !documentTitle) {
      const defaultTitle = `Complete with Draft&Sign: ${documents[0]?.name || 'Document'}`;
      setDocumentTitle(defaultTitle);
      setTitleInput(defaultTitle);
      // Also set subject initially if it's empty
      if (!envelopeData.subject) {
        setEnvelopeData(prev => ({ ...prev, subject: defaultTitle }));
      }
    }
  }, [documents]);

  // Reset stacked doc index when documents change
  useEffect(() => {
    if (documents && documents.length > 0) {
      setStackedDocIndex(prev => Math.max(0, Math.min(prev, documents.length - 1)));
    }
  }, [documents?.length]);
  const [showDocuments, setShowDocuments] = useState(true);
  const [stackedDocIndex, setStackedDocIndex] = useState(0); // Index of top document in stacked view
  const [openRoleDropdownId, setOpenRoleDropdownId] = useState<string | null>(null);
  const [openCustomizeDropdownId, setOpenCustomizeDropdownId] = useState<string | null>(null);
  const [setSigningOrder, setSetSigningOrder] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  // const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const RECIPIENT_COLORS = ["#789ceaff", "#87ecccff", "#f0c089ff", "#eea1c3ff", "#b99aeeff", "#f7b1bcff"];
  const [showSigningOrder, setShowSigningOrder] = useState(false);
  // Drag and drop state for recipient reordering
  const [draggedRecipientId, setDraggedRecipientId] = useState<string | null>(null);
  const [dragOverRecipientId, setDragOverRecipientId] = useState<string | null>(null);
  // Temporary order values while typing (before Enter is pressed)
  const [tempOrderValues, setTempOrderValues] = useState<Record<string, number>>({});
  // Track if order is being updated for animation
  const [_isReordering, setIsReordering] = useState(false);
  // Track which recipient is being reordered
  const [reorderingRecipientId, setReorderingRecipientId] = useState<string | null>(null);
  // Track recently reordered pills for animation effect
  const [reorderedPillIds, setReorderedPillIds] = useState<Set<string>>(new Set());
  // Bulk send modal state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkStep, setBulkStep] = useState<1 | 2>(1);
  const [bulkMethod, setBulkMethod] = useState<'manual' | 'csv'>('manual');
  const [bulkSharedRole, setBulkSharedRole] = useState<Recipient['role'] | ''>('' as any);
  const [bulkRows, setBulkRows] = useState<Array<{ id: string; name: string; email: string }>>([
    { id: `row_${Date.now()}`, name: '', email: '' },
    { id: `row_${Date.now() + 1}`, name: '', email: '' },
    { id: `row_${Date.now() + 2}`, name: '', email: '' },
  ]);
  const [bulkList, setBulkList] = useState<null | { role: Recipient['role']; items: Array<{ name: string; email: string }> }>(null);
  const [bulkBatchName, setBulkBatchName] = useState<string>('');
  const [bulkRoleDropdownOpen, setBulkRoleDropdownOpen] = useState<boolean>(false);
  const [bulkCustomizeOpen, setBulkCustomizeOpen] = useState<boolean>(false);
  const [bulkAccessCode, setBulkAccessCode] = useState<string | undefined>(undefined);
  const [openBulkAccess, setOpenBulkAccess] = useState<boolean>(false);
  const [bulkPrivateMessage, setBulkPrivateMessage] = useState<string | undefined>(undefined);
  const [openBulkPrivate, setOpenBulkPrivate] = useState<boolean>(false);
  // Authentication modal state
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalForRecipientId, setAuthModalForRecipientId] = useState<string | null>(null);
  const [authModalForBulk, setAuthModalForBulk] = useState<boolean>(false);
  const [tempAuthSelection, setTempAuthSelection] = useState<string[] | undefined>(undefined);
  const [hasUserChangedSelection, setHasUserChangedSelection] = useState<boolean>(false);

  // Helper function to parse authentication (handles both string and JSON array)
  const parseAuthentication = (auth: string | undefined | null): string[] => {
    if (!auth) return [];
    try {
      // Try to parse as JSON array
      const parsed = JSON.parse(auth);
      if (Array.isArray(parsed)) return parsed;
      // If it's a string, return as single-item array for backward compatibility
      return [auth];
    } catch {
      // If not JSON, treat as single string (backward compatibility)
      return [auth];
    }
  };

  // Helper function to stringify authentication (store as JSON array)
  const stringifyAuthentication = (auth: string[] | null | undefined): string | null => {
    if (!auth || auth.length === 0) return null;
    return JSON.stringify(auth);
  };

  // Initialize tempAuthSelection when modal opens
  useEffect(() => {
    if (showAuthModal && !hasUserChangedSelection) {
      if (authModalForBulk) {
        const firstAuth = recipients.length > 0 ? recipients[0]?.authentication : null;
        if (firstAuth) {
          const firstAuthArray = parseAuthentication(firstAuth);
          const allSame = recipients.every(r => {
            const rAuth = parseAuthentication(r.authentication);
            return JSON.stringify(rAuth.sort()) === JSON.stringify(firstAuthArray.sort());
          });
          setTempAuthSelection(allSame ? firstAuthArray : []);
        } else {
          setTempAuthSelection([]);
        }
      } else if (authModalForRecipientId) {
        const recipient = recipients.find(r => r.id === authModalForRecipientId);
        setTempAuthSelection(parseAuthentication(recipient?.authentication));
      } else {
        setTempAuthSelection([]);
      }
      setHasUserChangedSelection(false);
    }
  }, [showAuthModal, authModalForRecipientId, authModalForBulk]);

  // Reset hasUserChangedSelection when modal closes
  useEffect(() => {
    if (!showAuthModal) {
      setHasUserChangedSelection(false);
      setTempAuthSelection(undefined);
    }
  }, [showAuthModal]);
  const [shouldOpenAuthModalFromTour, setShouldOpenAuthModalFromTour] = useState<boolean>(false);
  // Send confirmation modal state
  const [showSendConfirmationModal, setShowSendConfirmationModal] = useState<boolean>(false);
  const [sendModalStep, setSendModalStep] = useState<1 | 2>(1);
  const [draggedSignerId, setDraggedSignerId] = useState<string | null>(null);
  const [dragOverSignerId, setDragOverSignerId] = useState<string | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<any>(null);
  const [authMethods, setAuthMethods] = useState<any[]>([]);
  // Help menu / sidebar state
  const [helpMenuOpen, setHelpMenuOpen] = useState<boolean>(false);
  const [helpSidebarOpen, setHelpSidebarOpen] = useState<boolean>(false);
  const helpMenuRef = useRef<HTMLDivElement | null>(null);
  const helpButtonRef = useRef<HTMLButtonElement | null>(null);
  // Subscription modal state
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<boolean>(false);
  // Summary section state
  const [showSummary, setShowSummary] = useState<boolean>(false);
  
  // Check if there are any recipients with authentication methods
  const hasRecipientsWithAuth = useMemo(() => {
    return recipients.some((recipient) => {
      const authArray = parseAuthentication(recipient.authentication);
      const authMethodList = authArray.map(authId => 
        authMethods.find(m => m.id === authId)
      ).filter(Boolean);
      return authMethodList.length > 0;
    });
  }, [recipients, authMethods]);
  
  // Auto-expand summary when there are no recipients with authentication in the table
  // Collapse it when there are recipients with authentication in the table
  useEffect(() => {
    if (!hasRecipientsWithAuth && recipients.length > 0) {
      setShowSummary(true);
    } else if (hasRecipientsWithAuth) {
      setShowSummary(false);
    }
  }, [hasRecipientsWithAuth, recipients.length]);
  
  // Close help menu when clicking outside
  useEffect(() => {
    if (!helpMenuOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Close if click is outside both the help menu and the help button
      if (
        helpMenuRef.current && 
        !helpMenuRef.current.contains(target) &&
        helpButtonRef.current &&
        !helpButtonRef.current.contains(target)
      ) {
        setHelpMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [helpMenuOpen]);
  
  // Advanced options modal state
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const advancedContentRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = {
    recipientPrivileges: useRef<HTMLDivElement | null>(null),
    reminders: useRef<HTMLDivElement | null>(null),
    expiration: useRef<HTMLDivElement | null>(null),
    mobileFriendly: useRef<HTMLDivElement | null>(null),
    comments: useRef<HTMLDivElement | null>(null),
  } as const;
  
  // Advanced options state
  const [advancedOptions, setAdvancedOptions] = useState({
    // Recipient Privileges
    canSignOnPaper: true,
    canDelegate: false,
    // Reminders (already in envelopeData, but keeping here for consistency)
    // Expiration
    expirationDays: 120,
    expirationAlertDays: 0,
    expirationType: 'custom' as 'custom' | 'never',
    alertType: 'custom' as 'custom' | 'never',
    // Mobile-Friendly
    responsiveSigning: true,
    // Comments
    commentsEnabled: false,
  });
  // CSV recipient summary state (separate from manual bulk list)
  const [csvRecipientList, setCsvRecipientList] = useState<null | { fileName: string; role: Recipient['role']; items: Array<{ name: string; email: string }> }>(null);
  const [csvRoleDropdownOpen, setCsvRoleDropdownOpen] = useState<boolean>(false);
  const [csvCustomizeOpen, setCsvCustomizeOpen] = useState<boolean>(false);
  const [_csvAccessCode, setCsvAccessCode] = useState<string | undefined>(undefined);
  const [_openCsvAccess, setOpenCsvAccess] = useState<boolean>(false);
  const [_csvPrivateMessage, setCsvPrivateMessage] = useState<string | undefined>(undefined);
  const [_openCsvPrivate, setOpenCsvPrivate] = useState<boolean>(false);
  const [showEnvelopeTooltip, setShowEnvelopeTooltip] = useState(false);
  // const [showFrequencyTooltip, setShowFrequencyTooltip] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isDragOverCsv, setIsDragOverCsv] = useState(false);
  const [showCsvExceptions, setShowCsvExceptions] = useState(false);
  const [unmatchedColumns, setUnmatchedColumns] = useState<string[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRecipientsData, setCsvRecipientsData] = useState<Array<Record<string, string>>>([]);
  const [showRecipientsEditor, setShowRecipientsEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'errors'>('all');
  const [showErrorBanner, setShowErrorBanner] = useState(true);
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const bulkRoleRef = useRef<HTMLButtonElement | null>(null);
  const bulkCustomizeRef = useRef<HTMLButtonElement | null>(null);

  // Guided tour for Envelope Creator
  const [isCreatorTourOpen, setIsCreatorTourOpen] = useState<boolean>(false);
  const [creatorTourIndex, setCreatorTourIndex] = useState<number>(0);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const creatorTourSteps = [
    { id: 'upload', selector: '[data-tour="ec-upload"]', title: 'Upload Documents', content: 'Upload your PDF documents by dragging and dropping or clicking to upload button.' },
    { id: 'recipients', selector: '[data-tour="ec-recipients-toggle"]', title: 'Add Recipients', content: 'Click to expand the recipients section and add people who need to sign the document.' },
    { id: 'addRecipient', selector: '[data-tour="ec-add-recipient"]', title: 'Add Recipient', content: 'Click this button to add a new recipient. Enter their full name and email address.' },
    { id: 'customize', selector: '[data-tour="ec-customize"]', title: 'Customize Options', content: 'Click the Customize button to set authentication methods for recipients. You can add security measures like access codes, SMS verification, or other authentication methods to ensure the right person signs the document.' },
    { id: 'bulkSend', selector: '[data-tour="ec-bulk-send"]', title: 'Bulk Send', content: 'Use Bulk Send to add multiple recipients at once. You can manually enter multiple recipients or upload a CSV file with recipient information. This saves time when sending to many people.' },
    { id: 'signingOrder', selector: '[data-tour="ec-signing-order"]', title: 'Set Signing Order', content: 'Enable this option to control the order in which recipients sign. Sequential order means one person signs after another. Parallel order allows all recipients to sign at the same time.' },
    { id: 'message', selector: '[data-tour="ec-message-toggle"]', title: 'Add Message', content: 'Click to add a subject line and optional message that will be included in the email sent to recipients.' },
    { id: 'subjectInput', selector: '[data-tour="ec-subject-input"]', title: 'Email Subject', content: 'Enter a clear and descriptive subject line for the email that recipients will receive.' },
    { id: 'type', selector: '[data-tour="ec-envelope-type"]', title: 'Envelope Type', content: 'Select an envelope type to categorize and organize your documents (e.g., Contract, Agreement, Invoice).' },
    { id: 'next', selector: '[data-tour="ec-next-button"]', title: 'Next Step', content: 'Click Next to proceed to placing signature fields on your documents. You can return to edit settings later.' },
  ] as const;
  const [creatorTargetRect, setCreatorTargetRect] = useState<DOMRect | null>(null);
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
  }, [isCreatorTourOpen, creatorTourIndex, showRecipients, setSigningOrder, showAddMessage]);
  const closeCreatorTour = () => { setIsCreatorTourOpen(false); setCreatorTourIndex(0); setCreatorTargetRect(null); };
  const nextCreatorStep = async () => {
    const step = creatorTourSteps[creatorTourIndex];
    try {
      if (step?.id === 'recipients') {
        setShowRecipients(true);
      }
      if (step?.id === 'addRecipient') {
        if (!recipients || recipients.length === 0) addRecipient();
      }
      if (step?.id === 'customize') {
        // Ensure recipients section is open
        setShowRecipients(true);
        // Ensure at least one recipient exists
        if (!recipients || recipients.length === 0) {
          addRecipient();
        }
        // Set flag to open auth modal - useEffect will handle it
        setShouldOpenAuthModalFromTour(true);
      }
      if (step?.id === 'bulkSend') {
        // Bulk send button is already visible, no action needed
      }
      if (step?.id === 'signingOrder') {
        if (recipients && recipients.length >= 2 && !setSigningOrder) {
          setSetSigningOrder(true);
        }
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
      setIsCreatorTourOpen(true);
      setCreatorTourIndex(0);
    }
  }, []);

  // Handle opening auth modal from customize tour step
  useEffect(() => {
    if (!shouldOpenAuthModalFromTour) return;
    
    // Wait for UI to update, then open auth modal
    const timeoutId = setTimeout(() => {
      // Get the first customize button to find which recipient to use
      const customizeButton = document.querySelector('[data-tour="ec-customize"]') as HTMLElement;
      if (customizeButton) {
        // Find the recipient row containing this button
        const recipientRow = customizeButton.closest('.recipient-row, [data-recipient-id]');
        // Try to get recipient ID from data attribute or use first recipient from state
        let recipientId: string | null = null;
        if (recipientRow) {
          const dataId = (recipientRow as HTMLElement).getAttribute('data-recipient-id');
          if (dataId) recipientId = dataId;
        }
        // Fallback to first recipient from state
        if (!recipientId && recipients && recipients.length > 0) {
          recipientId = recipients[0].id;
        }
        if (recipientId) {
          setAuthModalForRecipientId(recipientId);
          setAuthModalForBulk(false);
          setShowAuthModal(true);
          setShouldOpenAuthModalFromTour(false);
        }
      } else if (recipients && recipients.length > 0) {
        // Fallback: use first recipient if button not found
        setAuthModalForRecipientId(recipients[0].id);
        setAuthModalForBulk(false);
        setShowAuthModal(true);
        setShouldOpenAuthModalFromTour(false);
      }
    }, 600);

    return () => clearTimeout(timeoutId);
  }, [shouldOpenAuthModalFromTour, recipients]);

  // Drag handlers for tooltip
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

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (bulkRoleDropdownOpen && bulkRoleRef.current && !bulkRoleRef.current.contains(target)) {
        setBulkRoleDropdownOpen(false);
      }
      if (bulkCustomizeOpen && bulkCustomizeRef.current && !bulkCustomizeRef.current.contains(target)) {
        setBulkCustomizeOpen(false);
      }
      // close CSV dropdowns if open
      if (csvRoleDropdownOpen) setCsvRoleDropdownOpen(false);
      if (csvCustomizeOpen) setCsvCustomizeOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [bulkRoleDropdownOpen, bulkCustomizeOpen, csvRoleDropdownOpen, csvCustomizeOpen]);

  const addBulkRow = () => {
    if (bulkRows.length >= 10) return;
    setBulkRows(prev => [...prev, { id: `row_${Date.now()}`, name: '', email: '' }]);
  };
  const removeBulkRow = (id: string) => {
    setBulkRows(prev => prev.filter(r => r.id !== id));
  };
  const downloadSampleCsv = async () => {
    try {
      // Fetch the CSV file from public folder
      const response = await fetch('/Sample-Bulk-Recipient.csv');
      if (!response.ok) {
        throw new Error('Failed to fetch sample CSV');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Sample-Bulk-Recipient.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading sample CSV:', error);
      // Fallback to generated CSV if file not found
      const header = ['role', 'name', 'email'];
      const rows = [
        ['signer', 'Alice Smith', 'alice@example.com'],
        ['signer', 'Bob Lee', 'bob@example.com'],
      ];
      const csv = [header, ...rows].map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bulk_recipients_sample.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };
  const applyBulkRecipients = () => {
    const roleToUse = (bulkSharedRole || 'signer') as Recipient['role'];
    const cleaned = bulkRows
      .map(r => ({ name: (r.name || '').trim(), email: (r.email || '').trim() }))
      .filter(r => r.name && r.email);
    if (cleaned.length === 0) {
      setShowBulkModal(false);
      return;
    }
    setBulkList({ role: roleToUse, items: cleaned });
    if (!bulkBatchName) setBulkBatchName('Bulk Send List');
    // Prevent auto-adding a blank recipient and remove any auto-added empty one
    hasAutoAddedRecipient.current = true;
    
    // Convert bulk recipients to Recipient[] format and add to recipients state
    setRecipients(prev => {
      // Remove any empty recipients
      const filtered = prev.filter(r => r.name && r.name.trim() && r.email && r.email.trim());
      
      // Get the next order number
      const nextOrder = filtered.length > 0 ? Math.max(...filtered.map(r => r.order || 0)) + 1 : 1;
      
      // Convert bulk recipients to Recipient[] format
      const bulkRecipients: Recipient[] = cleaned.map((item, idx) => ({
        id: `bulk_recipient_${Date.now()}_${idx}`,
        name: item.name,
        email: item.email,
        role: roleToUse,
        order: nextOrder + idx,
        status: 'waiting' as const,
        authentication: '68ee2a18ba0c0738eb275d34' as Recipient['authentication'] // Default: secret email verification
      }));
      
      // Combine and normalize orders
      const combined = [...filtered, ...bulkRecipients];
      const normalized = normalizeOrders(combined);
      
      // If total recipients exceed 3, set the first bulk recipient as active
      if (normalized.length > 3 && bulkRecipients.length > 0) {
        setActiveRecipientId(bulkRecipients[0].id);
      } else if (normalized.length <= 3) {
        setActiveRecipientId(null);
      }
      
      return normalized;
    });
    
    setShowRecipients(true);
    setShowBulkModal(false);
  };

  const handleCsvFileSelect = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }
    setCsvFile(file);
    parseCsvFile(file);
  };

  const parseCsvFile = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        setShowCsvExceptions(true);
        setUnmatchedColumns(['CSV file is empty']);
        setCsvHeaders([]);
        return;
      }

      // Parse CSV (handling quoted values)
      const parseCsvLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      // Get original headers (case-sensitive)
      const originalHeaders = parseCsvLine(lines[0]);
      setCsvHeaders(originalHeaders);

      // Get normalized headers for matching
      const headers = originalHeaders.map(h => h.toLowerCase().trim());
      const nameIdx = headers.findIndex(h => h === 'name' || h === 'full name');
      const emailIdx = headers.findIndex(h => h === 'email' || h === 'email address');
      const roleIdx = headers.findIndex(h => h === 'role');

      // Define expected/matched columns
      const expectedColumns = new Set<string>();
      if (nameIdx !== -1) expectedColumns.add(originalHeaders[nameIdx].toLowerCase());
      if (emailIdx !== -1) expectedColumns.add(originalHeaders[emailIdx].toLowerCase());
      if (roleIdx !== -1) expectedColumns.add(originalHeaders[roleIdx].toLowerCase());

      // Find unmatched columns
      const unmatched: string[] = [];
      originalHeaders.forEach((header) => {
        const normalized = header.toLowerCase().trim();
        if (!expectedColumns.has(normalized)) {
          unmatched.push(header);
        }
      });

      if (nameIdx === -1 || emailIdx === -1) {
        setShowCsvExceptions(true);
        setUnmatchedColumns(unmatched.length > 0 ? unmatched : ['Missing required columns: name and email']);
        return;
      }

      const parsedRows: Array<{ name: string; email: string; role?: string }> = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        const name = values[nameIdx]?.trim() || '';
        const email = values[emailIdx]?.trim() || '';
        const role = roleIdx !== -1 ? values[roleIdx]?.trim() : undefined;

        if (name && email) {
          parsedRows.push({ name, email, role });
        }
      }

      if (parsedRows.length === 0) {
        setShowCsvExceptions(true);
        setUnmatchedColumns(unmatched.length > 0 ? unmatched : ['No valid rows found in CSV']);
        return;
      }

      // Parse ALL rows with ALL columns for recipients editor
      const allRowsData: Array<Record<string, string>> = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        const rowData: Record<string, string> = {};
        originalHeaders.forEach((header, idx) => {
          rowData[header] = values[idx]?.trim() || '';
        });
        allRowsData.push(rowData);
      }
      setCsvRecipientsData(allRowsData);

      // If there are unmatched columns, show exceptions page
      if (unmatched.length > 0) {
        setShowCsvExceptions(true);
        setUnmatchedColumns(unmatched);
        // Still parse the data so user can accept if they want
        const rows = parsedRows.map((row, idx) => ({
          id: `csv_row_${Date.now()}_${idx}`,
          name: row.name,
          email: row.email
        }));
        setBulkRows(rows);
        return;
      }

      // Set the first role if found, otherwise keep current
      if (parsedRows[0].role && !bulkSharedRole) {
        const roleMap: Record<string, Recipient['role']> = {
          'signer': 'signer',
          'needs to sign': 'signer',
          'in person signer': 'in_person_signer',
          'carbon copy': 'carbon_copy',
          'receives a copy': 'carbon_copy',
          'approver': 'approver',
          'needs to view': 'needs_to_view'
        };
        const mappedRole = roleMap[parsedRows[0].role.toLowerCase()];
        if (mappedRole) setBulkSharedRole(mappedRole);
      }

      // Parse ALL rows with ALL columns for recipients editor (even when no unmatched columns)
      const allRowsDataComplete: Array<Record<string, string>> = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        const rowData: Record<string, string> = {};
        originalHeaders.forEach((header, idx) => {
          rowData[header] = values[idx]?.trim() || '';
        });
        allRowsDataComplete.push(rowData);
      }
      setCsvRecipientsData(allRowsDataComplete);

      // Convert to bulkRows format
      const rows = parsedRows.map((row, idx) => ({
        id: `csv_row_${Date.now()}_${idx}`,
        name: row.name,
        email: row.email
      }));

      setBulkRows(rows);
      setShowCsvExceptions(false);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      setShowCsvExceptions(true);
      setUnmatchedColumns(['Error parsing CSV file. Please check the format.']);
      setCsvHeaders([]);
    }
  };

  const handleDragOverCsv = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverCsv(true);
  };

  const handleDragLeaveCsv = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverCsv(false);
  };

  const handleDropCsv = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverCsv(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleCsvFileSelect(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleCsvFileSelect(file);
    }
  };

  const applyCsvRecipients = () => {
    if (bulkRows.length === 0) {
      alert('Please upload a CSV file with recipient data');
      return;
    }
    const roleToUse = (bulkSharedRole || 'signer') as Recipient['role'];
    const cleaned = bulkRows
      .map(r => ({ name: (r.name || '').trim(), email: (r.email || '').trim() }))
      .filter(r => r.name && r.email);
    if (cleaned.length === 0) {
      alert('No valid recipients found in CSV');
      return;
    }
    setBulkList({ role: roleToUse, items: cleaned });
    // Mirror CSV UI even if user doesn't open the editor: set csvRecipientList and batch name from file
    setCsvRecipientList({
      fileName: csvFile?.name || 'bulk_recipients.csv',
      role: roleToUse,
      items: cleaned
    });
    setBulkBatchName(csvFile?.name || 'Bulk Send List');
    hasAutoAddedRecipient.current = true;
    // Use CSV roles, clear any existing individual recipients to avoid duplicate first card
    setRecipients([]);
    setShowRecipients(true);
    setShowBulkModal(false);
    setCsvFile(null);
    setShowCsvExceptions(false);
    setUnmatchedColumns([]);
  };

  const handleAcceptCsvExceptions = () => {
    // Open recipients editor to allow user to edit CSV data
    setShowCsvExceptions(false);
    setShowRecipientsEditor(true);
    // Ensure we're on the right step and method
    setBulkStep(2);
    // Ensure csvHeaders and csvRecipientsData are preserved
    // (they should already be set from CSV parsing, but make sure)
  };

  // Validate recipient data
  const validateRecipient = (recipient: Record<string, string>, headers: string[]): { hasErrors: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    let hasErrors = false;

    // Find email and name columns
    const emailHeader = headers.find(h => h.toLowerCase().includes('email'));
    // const nameHeader = headers.find(h => h.toLowerCase().includes('name') && !h.toLowerCase().includes('email'));
    const identificationHeader = headers.find(h => h.toLowerCase().includes('identification'));

    if (emailHeader && !recipient[emailHeader]?.trim()) {
      errors[emailHeader] = 'Email address required';
      hasErrors = true;
    }

    if (emailHeader && recipient[emailHeader]?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient[emailHeader].trim())) {
      errors[emailHeader] = 'Invalid email format';
      hasErrors = true;
    }

    // Validate Identification field - only show error when user has started typing
    if (identificationHeader && recipient[identificationHeader]?.trim()) {
      const identificationValue = recipient[identificationHeader].trim().toLowerCase();
      // Supported authentication types (case-insensitive matching)
      const supportedTypes = [
        'phone',
        'sms',
        'access code',
        'accesscode',
        'docusign id verification',
        'docusignidverification',
        'docusign'
      ];

      // Normalize both the input and supported types for comparison
      const normalizedInput = identificationValue.replace(/\s+/g, ' ').trim();
      const isValidType = supportedTypes.some(type => {
        const normalizedType = type.toLowerCase().replace(/\s+/g, ' ').trim();
        return normalizedInput === normalizedType;
      });

      // Show error only if the value doesn't match any supported type
      if (!isValidType) {
        errors[identificationHeader] = 'Supported authentication types are phone, SMS, access code, or Docusign ID Verification';
        hasErrors = true;
      }
    }

    // Check for required fields
    headers.forEach(header => {
      if ((header.toLowerCase().includes('email') || header.toLowerCase().includes('name')) && !recipient[header]?.trim()) {
        if (!errors[header]) {
          errors[header] = 'Required field missing';
          hasErrors = true;
        }
      }
    });

    return { hasErrors, errors };
  };

  const getRecipientsWithErrors = () => {
    return csvRecipientsData.map((recipient, idx) => {
      const validation = validateRecipient(recipient, csvHeaders);
      return { ...recipient, index: idx, errors: validation.errors, hasErrors: validation.hasErrors };
    }).filter(r => r.hasErrors);
  };

  const updateRecipientField = (recipientIndex: number, field: string, value: string) => {
    setCsvRecipientsData(prev => prev.map((recipient, idx) =>
      idx === recipientIndex ? { ...recipient, [field]: value } : recipient
    ));
  };



  const handleSaveRecipients = () => {
    // Convert CSV recipients data to bulkRows format
    const emailHeader = csvHeaders.find(h => h.toLowerCase().includes('email'));
    const nameHeader = csvHeaders.find(h => h.toLowerCase().includes('name') && !h.toLowerCase().includes('email'));

    const cleaned = csvRecipientsData
      .map((recipient, idx) => ({
        id: `csv_row_${Date.now()}_${idx}`,
        name: nameHeader ? (recipient[nameHeader] || '').trim() : '',
        email: emailHeader ? (recipient[emailHeader] || '').trim() : ''
      }))
      .filter(r => r.name && r.email);

    if (cleaned.length === 0) {
      alert('No valid recipients found');
      return;
    }

    setBulkRows(cleaned);
    const roleToUse = (bulkSharedRole || 'signer') as Recipient['role'];
    setBulkList({ role: roleToUse, items: cleaned.map(r => ({ name: r.name, email: r.email })) });
    // Also set CSV recipient summary card
    setCsvRecipientList({
      fileName: csvFile?.name || 'bulk_recipients.csv',
      role: roleToUse,
      items: cleaned.map(r => ({ name: r.name, email: r.email }))
    });
    // Always reflect CSV filename into the batch name to mirror desired UI
    setBulkBatchName(csvFile?.name || 'Bulk Send List');
    hasAutoAddedRecipient.current = true;
    // Use CSV roles, clear any existing individual recipients to avoid duplicate first card
    setRecipients([]);
    setShowRecipients(true);
    setShowBulkModal(false);
    setShowRecipientsEditor(false);
    setCsvFile(null);
  };

  // const clearCsvRecipientList = () => {
  //   setCsvRecipientList(null);
  //   setCsvAccessCode(undefined);
  //   setCsvPrivateMessage(undefined);
  //   setOpenCsvAccess(false);
  //   setOpenCsvPrivate(false);
  // };

  const handleBackToUpload = () => {
    setShowRecipientsEditor(false);
    setShowCsvExceptions(true);
  };

  const handleDiscardCsv = () => {
    // Discard the CSV and go back to upload page
    setCsvFile(null);
    setBulkRows([
      { id: `row_${Date.now()}`, name: '', email: '' },
      { id: `row_${Date.now() + 1}`, name: '', email: '' },
      { id: `row_${Date.now() + 2}`, name: '', email: '' },
    ]);
    setShowCsvExceptions(false);
    setUnmatchedColumns([]);
    setCsvHeaders([]);
    if (csvFileInputRef.current) {
      csvFileInputRef.current.value = '';
    }
  };

  const clearBulkList = () => {
    // Clear manual bulk list
    setBulkList(null);
    // Clear CSV-derived list and related panels
    setCsvRecipientList(null);
    setCsvAccessCode(undefined);
    setCsvPrivateMessage(undefined);
    setOpenCsvAccess(false);
    setOpenCsvPrivate(false);
    // Reset CSV parsing state
    setCsvFile(null);
    setCsvHeaders([]);
    setCsvRecipientsData([]);
    setShowCsvExceptions(false);
    setUnmatchedColumns([]);
    // Reset inline bulk rows to initial empty rows
    setBulkRows([
      { id: `row_${Date.now()}`, name: '', email: '' },
      { id: `row_${Date.now() + 1}`, name: '', email: '' },
      { id: `row_${Date.now() + 2}`, name: '', email: '' },
    ]);
  };
  const [recipientSuggestions, setRecipientSuggestions] = useState<Array<{ name: string; email: string }>>([]);
  const [suggestionsOpenForId, setSuggestionsOpenForId] = useState<string | null>(null);
  const [emailSuggestionsOpenForId, setEmailSuggestionsOpenForId] = useState<string | null>(null);
  const [loadingRecipientSuggestions, setLoadingRecipientSuggestions] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const searchQueryRef = useRef<string>('');
  const suggestionsContainerRef = useRef<HTMLDivElement | null>(null);
  const emailSuggestionsContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Recipient list modal state
  const [showRecipientListModal, setShowRecipientListModal] = useState(false);
  const [recipientListModalForId, setRecipientListModalForId] = useState<string | null>(null);
  const [savedRecipients, setSavedRecipients] = useState<Array<{ _id: string; name: string; email: string; title?: string; company?: string; phone?: string; address?: string }>>([]);
  const [loadingSavedRecipients, setLoadingSavedRecipients] = useState(false);
  const [recipientListSearch, setRecipientListSearch] = useState('');
  const [showAddRecipientForm, setShowAddRecipientForm] = useState(false);
  const [newRecipientForm, setNewRecipientForm] = useState({
    name: '',
    email: '',
    title: '',
    company: '',
    phone: '',
    address: ''
  });
  const [savingNewRecipient, setSavingNewRecipient] = useState(false);
  // Access code expanded panels per recipient
  const [openAccessForId, setOpenAccessForId] = useState<Record<string, boolean>>({});
  // Private message expanded panels per recipient
  const [openPrivateForId, setOpenPrivateForId] = useState<Record<string, boolean>>({});

  // Envelope Type state
  const [envelopeTypes, setEnvelopeTypes] = useState<any[]>([]);
  const [selectedEnvelopeType, setSelectedEnvelopeType] = useState<string>('');
  const [typeDropdownOpen, setTypeDropdownOpen] = useState<boolean>(false);
  const [typeSearch, setTypeSearch] = useState<string>('');
  const [showOtherInputInDropdown, setShowOtherInputInDropdown] = useState<boolean>(false);
  const [newEnvelopeTypeValue, setNewEnvelopeTypeValue] = useState<string>('');
  const typeDropdownRef = useRef<HTMLDivElement | null>(null);

  // PDF Preview Modal state
  const [pdfPreviewModalOpen, setPdfPreviewModalOpen] = useState<boolean>(false);
  const [selectedPdfForPreview, setSelectedPdfForPreview] = useState<ESDocument | null>(null);
  const [pdfNumPages, setPdfNumPages] = useState<number | null>(null);

  const steps = [
    { id: 1, name: 'Documents', description: 'Upload documents' },
    { id: 2, name: 'Signers', description: 'Add recipients and roles' },
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    setFiles(files);
    if (!files) return;

    // Auto-set or refresh subject using all selected filenames (with extensions)
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
    const validDocs: ESDocument[] = [];
    const invalidFiles: File[] = [];

    files.forEach((file) => {
      // Only accept PDF files
      if (file.type !== "application/pdf") {
        invalidFiles.push(file);
        return; // skip adding invalid file
      }

      const newDocument: ESDocument = {
        id: `doc_${Date.now()}_${Math.random()}`,
        name: file.name,
        size: file.size,
        pages: Math.ceil(file.size / 100000), // Mock page calculation
        type: file.type,
        url: URL.createObjectURL(file),
        file: file,
      };
      validDocs.push(newDocument);
    });

    // Show alert if any invalid files
    if (invalidFiles.length > 0) {
      alert(
        `Only PDF files are allowed. The following files are invalid:\n\n${invalidFiles
          .map((f) => f.name)
          .join("\n")}`
      );
    }

    // Add only valid PDFs to document state
    if (validDocs.length > 0) {
      // Pre-compute the full list of document names (existing + new) with extensions
      const allDocNames = [...(documents || []).map(d => d.name), ...validDocs.map(d => d.name)].filter(Boolean);
      setDocuments((prev) => [...prev, ...validDocs]);
      const subjectWasAuto = (envelopeData.subject || '').trim().startsWith('Complete with Esign:');
      if (!envelopeData.subject || envelopeData.subject.trim() === '' || subjectWasAuto) {
        setEnvelopeData(prev => ({ ...prev, subject: `Complete with Esign: ${allDocNames.join(', ')}` }));
      }
    }
  };

  // Drag and drop handlers
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

  // Setp 1: Save Document In DB with Empty Envelope

  const uploadDocuments = async (_currentStep: any) => {
    // Validate subject before allowing upload
    if (!envelopeData.subject || envelopeData.subject.trim() === '') {
      alert('Please enter a subject before uploading documents.');
      return false;
    }

    // Validate envelope type selection
    if (!selectedEnvelopeType || selectedEnvelopeType.trim() === '') {
      alert('Please select an Envelope Type before uploading documents.');
      return false;
    }

    if (!documents || documents.length === 0) return;

    // Validate file types before upload
    const invalidFiles = documents.filter(
      (doc) => !doc.type || !doc.type.toLowerCase().includes('pdf')
    );

    if (invalidFiles.length > 0) {
      alert(
        `Only PDF files are allowed. The following files are invalid:\n\n${invalidFiles
          .map((f) => f.name)
          .join('\n')}`
      );
      return false; // failure
    }

    // mark as uploading
    setDocuments((prev) =>
      prev.map((doc) => ({ ...doc, isUploading: true, uploadProgress: 0 }))
    );

    let loopEnvelopeId = envelopeId; // local variable

    for (const doc of documents) {
      const formData = new FormData();
      if (doc.file) {
        formData.append('files', doc.file, doc.name);
      } else {
        console.warn('Skipping document with no file:', doc.name);
        continue;
      }

      if (loopEnvelopeId) formData.append('envelopeId', loopEnvelopeId);
      // Include subject, message and envelopetype from Step 1
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
      // Persist any valid recipients captured on Step 1 before moving on
      try {
        const validRecipients = (recipients || []).filter(r => (r?.name || '').trim() && (r?.email || '').trim());
        if (validRecipients.length > 0) {
          const recipientPayload = validRecipients.map(r => ({
            name: r.name,
            email: r.email,
            role: r.role,
            order: r.order,
            status: r.status,
            authentication: r.authentication || null
          }));
          await eSignApi.post('/api/e-sign/add-recipients', {
            envelopeId: loopEnvelopeId,
            recipients: recipientPayload
          });
        }
      } catch (err) {
        console.error('Failed to save recipients from Step 1:', err);
      }
      await getEnvelopeDetail(loopEnvelopeId);
      navigate(`/e-sign/create?step=2&envelopeId=${loopEnvelopeId}`);
      return true; // success
    }
  };


  // Step 2: Insert Recipients Map them with Envelope
  const insertRecipient = async () => {
    if (recipients?.length === 0) return;

    const recipientData = recipients.map(recipient => ({
      name: recipient.name,
      email: recipient.email,
      role: recipient.role,
      order: recipient.order,
      status: recipient.status,
      authentication: recipient.authentication || null
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
        await navigate(`/e-sign/create?step=${currentStep + 1}&envelopeId=${response.data.envelopeId}`);
      }
    } catch (error) {
      console.error('Error inserting recipients:', error);
    }
  }
  // Get Power Form Template
  // const getPowerForm = async () => {
  //   try {
  //     const response = await templateServiceApi.get('/api/template/get-form');
  //     if (response.status === 200) {
  //       //setPowerFormTemplate(response.data.template);
  //       setMode('power');
  //       console.log('Power Forms:', response.data.form);
  //       setPowerForms(response.data.form);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching power form template:', error);
  //   }
  // };
  // const getFormDetails = async (formId: string) => {
  //   const response = await templateServiceApi.get(`/api/template/get-form-details/${formId}`);
  //   if (response.status === 200) {
  //     console.log('Power Forms:', response.data);
  //     setPowerFormData(response.data);
  //   }
  // }
  // const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   const formId = e.target.value;
  //   setSelectedForm(formId);       // ✅ update selected
  //   getFormDetails(formId);        // ✅ fetch details
  // };
  //Step 3: Save Signature fields 
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
      fieldId: field.fieldId ?? null, // <-- add this line
    }));
    console.log('Transformed fields data for saving:', fieldsData);

    try {
      const response = await eSignApi.post('/api/e-sign/save-signature-fields', {
        envelopeId,
        signatureFields: fieldsData
      });
      if (response.status === 200) {
        setSignatureFields(response.data.data.signatureFields);
        await navigate(`/e-sign/create?step=${currentStep + 1}&envelopeId=${envelopeId}`);
      }
    } catch (error) {
      console.error('Error saving signature fields:', error);
    }
  };

  // Immediate save with provided fields (used by SigningEditorStep on add)
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
        // Normalize documents to ensure preview works in both upload and edit flows
        const apiDocs = (response.data.data.documents || []).map((doc: any) => ({
          ...doc,
          type: doc.type || 'application/pdf',
          url: doc.url || `${import.meta.env.VITE_ESIGN_SERVICE_URL}/uploads/${encodeURIComponent(doc.name || '')}`,
        }));
        setDocuments(apiDocs);
        console.log('Fetched documents:', apiDocs);
        const loadedRecipients = response.data.data.recipients || [];
        setRecipients(loadedRecipients);
        console.log('Fetched recipients:', loadedRecipients);
        // If more than 3 recipients, set the first one as active (others will show as pills)
        if (loadedRecipients.length > 3 && loadedRecipients.length > 0) {
          setActiveRecipientId(loadedRecipients[0].id);
        } else {
          setActiveRecipientId(null);
        }
        // Prefill subject/message when returning to earlier steps
        const env = response.data.data;
        setEnvelopeData(prev => ({
          ...prev,
          subject: typeof env.subject === 'string' ? env.subject : (prev.subject || ''),
          message: typeof env.message === 'string' ? env.message : (prev.message || ''),
          reminderEnabled: typeof env.isReminder === 'boolean' ? env.isReminder : prev.reminderEnabled,
          reminderInterval: typeof env.reminderInterval === 'number' ? env.reminderInterval : prev.reminderInterval,
        }));
        if (typeof env.envelopetype === 'string' && env.envelopetype) {
          setSelectedEnvelopeType(env.envelopetype);
        }
        
        // Load advanced options from envelope
        if (env.expirationDate) {
          const expirationDate = new Date(env.expirationDate);
          const now = new Date();
          const daysDiff = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          setAdvancedOptions(prev => ({
            ...prev,
            expirationDays: daysDiff > 0 ? daysDiff : 120,
            expirationType: 'custom',
            expirationAlertDays: typeof env.expirationAlertDays === 'number' ? env.expirationAlertDays : prev.expirationAlertDays,
          }));
        } else {
          // If no expiration date, check if expirationAlertDays exists
          setAdvancedOptions(prev => ({
            ...prev,
            expirationAlertDays: typeof env.expirationAlertDays === 'number' ? env.expirationAlertDays : prev.expirationAlertDays,
          }));
        }
        
        // Load other advanced options if they exist
        setAdvancedOptions(prev => ({
          ...prev,
          canSignOnPaper: typeof env.canSignOnPaper === 'boolean' ? env.canSignOnPaper : prev.canSignOnPaper,
          canDelegate: typeof env.canDelegate === 'boolean' ? env.canDelegate : prev.canDelegate,
          responsiveSigning: typeof env.responsiveSigning === 'boolean' ? env.responsiveSigning : prev.responsiveSigning,
          commentsEnabled: typeof env.commentsEnabled === 'boolean' ? env.commentsEnabled : prev.commentsEnabled,
        }));
        
        setEnvelopeId(envelopeId);
      }
    } catch (error) {
      console.error('Error fetching envelope details:', error);
    }
  };
  const updateEnvelope = async () => {
    console.log('Updating envelope with data:', envelopeId);
    if (!envelopeId) return;

    console.log('Updating envelope data:', envelopeData);
    try {
      const response = await eSignApi.post('/api/e-sign/update-envelope', {
        envelopeId,
        envelopeData: {
          ...envelopeData,
          envelopetype: selectedEnvelopeType || undefined,
        },
      });
      if (response.status === 200) {
        console.log('Signature type updated successfully:', response.data);
        await navigate(`/e-sign/create?step=${currentStep + 1}&envelopeId=${response.data.envelopeId}`);
      }
    } catch (error) {
      console.error('Error updating signature type:', error);
    }
  };

  // Save advanced options
  const saveAdvancedOptions = async () => {
    if (!envelopeId) {
      toast.error('Please create an envelope first');
      return;
    }

    try {
      // Calculate expiration date if expiration is enabled
      let expiresAt: string | undefined = undefined;
      if (advancedOptions.expirationType === 'custom' && advancedOptions.expirationDays > 0) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + advancedOptions.expirationDays);
        expiresAt = expirationDate.toISOString();
      }

      // Update envelope with advanced options
      const response = await eSignApi.post('/api/e-sign/update-envelope', {
        envelopeId,
        envelopeData: {
          ...envelopeData,
          expiresAt,
          expirationAlertDays: advancedOptions.expirationAlertDays, // Backend now supports this field
          reminderEnabled: envelopeData.reminderEnabled,
          reminderInterval: envelopeData.reminderInterval,
          // Include advanced options (backend may accept them even if not in model yet)
          canSignOnPaper: advancedOptions.canSignOnPaper,
          canDelegate: advancedOptions.canDelegate,
          responsiveSigning: advancedOptions.responsiveSigning,
          commentsEnabled: advancedOptions.commentsEnabled,
        },
      });

      if (response.status === 200) {
        toast.success('Advanced options saved successfully');
        setShowAdvanced(false);
      }
    } catch (error: any) {
      console.error('Error saving advanced options:', error);
      toast.error(error?.response?.data?.message || 'Failed to save advanced options');
    }
  };

  // Load advanced options when opening modal
  useEffect(() => {
    if (showAdvanced && envelopeId) {
      // Load existing envelope data to populate advanced options
      getEnvelopeDetail(envelopeId);
    }
  }, [showAdvanced, envelopeId]);
  // Validation function to find first missing field and scroll to it
  const validateAndScrollToField = (): { isValid: boolean; fieldSelector?: string; message?: string } => {
    if (currentStep === 1) {
      // Check documents
      if (!documents || documents.length === 0) {
        return {
          isValid: false,
          fieldSelector: '[data-tour="ec-upload"]',
          message: 'Please upload at least one document'
        };
      }
      // Check envelope type
      if (!selectedEnvelopeType || selectedEnvelopeType.trim() === '') {
        return {
          isValid: false,
          fieldSelector: '[data-tour="ec-envelope-type"]',
          message: 'Please select an envelope type'
        };
      }
      // If "Other" input is open but not saved, require saving
      if (showOtherInputInDropdown && !newEnvelopeTypeValue.trim()) {
        return {
          isValid: false,
          fieldSelector: '[data-tour="ec-envelope-type"]',
          message: 'Please save the new envelope type or select an existing one'
        };
      }
    }
    if (currentStep === 2) {
      if (mode === 'normal') {
        // Check if recipients exist
        if (!recipients || recipients.length === 0) {
          // Expand recipients section if collapsed
          if (!showRecipients) {
            setShowRecipients(true);
          }
          return {
            isValid: false,
            fieldSelector: '[data-tour="ec-recipients-toggle"]',
            message: 'Please add at least one recipient'
          };
        }
        // Check if all recipients have name and email
        const firstInvalidRecipient = recipients.findIndex(r => !r.name || !r.name.trim() || !r.email || !r.email.trim());
        if (firstInvalidRecipient !== -1) {
          // Expand recipients section if collapsed
          if (!showRecipients) {
            setShowRecipients(true);
          }
          const recipient = recipients[firstInvalidRecipient];
          // Check which field is missing
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

  // Scroll to field and show message
  const scrollToField = (selector: string, message: string) => {
    // Wait a bit for any state updates (like expanding sections) to complete
    setTimeout(() => {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        // Scroll to element with more padding to ensure it's centered
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        
        // Get the input field (either the element itself or one inside it)
        let inputField: HTMLElement | null = null;
        if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
          inputField = element;
        } else {
          inputField = element.querySelector('input, select, textarea') as HTMLElement;
        }
        
        if (inputField) {
          setTimeout(() => {
            // Scroll the field into view again to ensure it's centered
            inputField!.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            
            // Focus the field (this moves the text cursor there and positions the caret)
            inputField!.focus();
            
            // If it's an input, also select the text if any (makes it more obvious where to type)
            if (inputField instanceof HTMLInputElement || inputField instanceof HTMLTextAreaElement) {
              // Small delay to ensure focus is complete before selecting
              setTimeout(() => {
                inputField!.select();
              }, 50);
            }
            
            // Highlight the field with prominent red border and animation
            inputField.style.borderColor = '#ef4444';
            inputField.style.borderWidth = '2px';
            inputField.style.boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.2), 0 0 20px rgba(239, 68, 68, 0.3)';
            inputField.style.transition = 'all 0.3s ease';
            inputField.style.zIndex = '9999';
            
            // Add a pulsing animation to draw attention
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
            
            // Remove highlight after 4 seconds
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
          // If no input found, just highlight the container
          element.style.outline = '3px solid rgba(239, 68, 68, 0.5)';
          element.style.outlineOffset = '2px';
          setTimeout(() => {
            element.style.outline = '';
            element.style.outlineOffset = '';
          }, 4000);
        }
        
        // Show toast message
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

  // Update your "Next" button handler:
  const handleNext = async () => {
    if (nextLoading) return;
    
    // Validate fields first
    const validation = validateAndScrollToField();
    if (!validation.isValid) {
      if (validation.fieldSelector && validation.message) {
        scrollToField(validation.fieldSelector, validation.message);
      }
      return;
    }
    
    setNextLoading(true);
    try {
      if (currentStep === 1) {
        const success = await uploadDocuments(currentStep);
        if (!success) {
          setNextLoading(false);
          return; // 🚫 stop here — no next step
        }
      }
      if (currentStep === 2) {
        if (mode === 'normal') {
          if (recipients.length === 0) {
            alert('Please add at least one recipient.');
            setNextLoading(false);
            return;
          }
          await insertRecipient();
        } else {
          // power form: ensure totalSigners is set
          if (parties.length === 0) {
            alert('Please add at least one party for the Power Form.');
            setNextLoading(false);
            return;
          }
          if (!selectedPartyId) {
            alert('Please choose which party you are.');
            setNextLoading(false);
            return;
          }
          if (!firstSigningPartyId) {
            alert('Please choose which party signs first.');
            setNextLoading(false);
            return;
          }
          // persist slots/config
          await getEnvelopeDetail(envelopeId || "");
          const savedId = await savePowerFormSlots();
          if (!savedId) {
            alert('Failed to save power form configuration. Try again.');
            setNextLoading(false);
            return;
          }
          // navigate to next step with returned envelope/template id
          navigate(`/e-sign/create?step=${currentStep + 1}&envelopeId=${savedId}`);
        }
      }
      if (currentStep === 3) {
        if (signatureFields.length === 0) {
          alert('Please add at least one signature field.');
          return;
        }
        // Here you can save the signature fields to the server or state
        await saveSignatureFields();
      }
      if (currentStep === 4) {
        await updateEnvelope();
      }
      if (currentStep === 5) {
        await updateEnvelope();
      }
      if (currentStep === 6) {
        alert('Envelope created successfully, Ready to send!');
        await navigate(`/e-sign/create?step=${currentStep + 1}&envelopeId=${envelopeId}`);
      }
      if (currentStep == 1) {
        setCurrentStep(prev => Math.min(6, prev + 2));
      } else {
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
    const base = bulkList ? 1 : 0;
    const newRecipient: Recipient = {
      id: `recipient_${Date.now()}`,
      name: '',
      email: '',
      role: 'signer',
      order: (recipients?.length || 0) + 1 + base,
      status: 'waiting',
      authentication: '68ee2a18ba0c0738eb275d34' // Default: secret email verification
    };
    setRecipients(prev => {
      const updated = [...prev, newRecipient];
      // Normalize orders to ensure they're sequential
      return normalizeOrders(updated);
    });
    // If this is the 4th+ recipient, set it as active (others will collapse to pills)
    if (recipients.length >= 3) {
      setActiveRecipientId(newRecipient.id);
    }
  };

  // Normalize orders to be sequential (1, 2, 3, ...)
  const normalizeOrders = (recipientsList: Recipient[]): Recipient[] => {
    const sorted = [...recipientsList].sort((a, b) => (a.order || 0) - (b.order || 0));
    return sorted.map((r, idx) => ({ ...r, order: idx + 1 }));
  };

  // Handle manual order input with intelligent swapping and animation
  const handleOrderChange = (recipientId: string, newOrder: number) => {
    const maxOrder = recipients.length;
    const clampedOrder = Math.max(1, Math.min(newOrder, maxOrder));
    
    setRecipients(prev => {
      const recipient = prev.find(r => r.id === recipientId);
      if (!recipient) return prev;
      
      const oldOrder = recipient.order || prev.findIndex(r => r.id === recipientId) + 1;
      
      // If order didn't change, return as is
      if (oldOrder === clampedOrder) {
        setTempOrderValues(prev => {
          const next = { ...prev };
          delete next[recipientId];
          return next;
        });
        return prev;
      }
      
      // Trigger animation
      setIsReordering(true);
      setReorderingRecipientId(recipientId);
      
      // Create updated list
      const updated = prev.map(r => {
        if (r.id === recipientId) {
          return { ...r, order: clampedOrder };
        }
        // Shift other recipients' orders
        if (oldOrder < clampedOrder) {
          // Moving down: shift recipients between old and new position up
          if (r.order && r.order > oldOrder && r.order <= clampedOrder) {
            return { ...r, order: (r.order || 1) - 1 };
          }
        } else {
          // Moving up: shift recipients between new and old position down
          if (r.order && r.order >= clampedOrder && r.order < oldOrder) {
            return { ...r, order: (r.order || 1) + 1 };
          }
        }
        return r;
      });
      
      // Normalize orders to ensure they're sequential
      const normalized = normalizeOrders(updated);
      
      // Clear temp value after applying
      setTempOrderValues(prev => {
        const next = { ...prev };
        delete next[recipientId];
        return next;
      });
      
      // End animation after transition completes
      setTimeout(() => {
        setIsReordering(false);
        setReorderingRecipientId(null);
      }, 600);
      
      return normalized;
    });
  };

  // Handle Enter key press to apply order change
  const handleOrderKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, recipientId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tempValue = tempOrderValues[recipientId];
      if (tempValue !== undefined) {
        handleOrderChange(recipientId, tempValue);
      }
    } else if (e.key === 'Escape') {
      // Cancel the change and revert to original order
      setTempOrderValues(prev => {
        const next = { ...prev };
        delete next[recipientId];
        return next;
      });
      e.currentTarget.blur();
    }
  };

  const updateRecipient = (id: string, updates: Partial<Recipient>) => {
    // If order is being updated, use the special handler
    if (updates.order !== undefined) {
      handleOrderChange(id, updates.order);
      return;
    }
    
    setRecipients(prev => prev.map(recipient =>
      recipient.id === id ? { ...recipient, ...updates } : recipient
    ));
  };

  // Handle authentication method selection
  const handleAuthMethodSelect = async (methodIds: string | null | string[]) => {
    try {
      // Normalize to array: handle both single string and array
      let normalizedMethods: string[] = [];
      if (Array.isArray(methodIds)) {
        normalizedMethods = methodIds.filter(id => id && id.trim().length > 0);
      } else if (methodIds && typeof methodIds === 'string' && methodIds.trim().length > 0) {
        normalizedMethods = [methodIds];
      }
      
      const authString = stringifyAuthentication(normalizedMethods);

      if (authModalForBulk) {
        // Apply to all recipients in bulk list
        const newRecipients = recipients.map(recipient => ({
          ...recipient,
          authentication: authString || undefined
        }));
        setRecipients(newRecipients);
        
        // If we have an envelopeId, persist the recipient authentication in DB
        if (envelopeId) {
          const recipientPayload = newRecipients.map(r => ({
            name: r.name,
            email: r.email,
            role: r.role,
            order: r.order,
            authentication: r.authentication || null
          }));
          
          const resp = await eSignApi.post('/api/e-sign/add-recipients', {
            envelopeId,
            recipients: recipientPayload
          });
          
          if (resp.status === 200) {
            await getEnvelopeDetail(envelopeId);
            toast.success(normalizedMethods.length > 0 ? `${normalizedMethods.length} authentication method(s) applied to all recipients` : 'Cleared authentication for all recipients');
          }
        } else {
          toast.success(normalizedMethods.length > 0 ? 'Authentication methods will be saved when recipients are added' : 'Authentication cleared (will save with recipients)');
        }
      } else if (authModalForRecipientId) {
        // Apply to specific recipient
        updateRecipient(authModalForRecipientId, { authentication: authString || undefined });
        
        // If we have an envelopeId, persist the recipient authentication in DB
        if (envelopeId) {
          const recipient = recipients.find(r => r.id === authModalForRecipientId);
          if (recipient) {
            const recipientPayload = [{
              name: recipient.name,
              email: recipient.email,
              role: recipient.role,
              order: recipient.order,
              authentication: authString || null
            }];
            
            const resp = await eSignApi.post('/api/e-sign/add-recipients', {
              envelopeId,
              recipients: recipientPayload
            });
            
            if (resp.status === 200) {
              await getEnvelopeDetail(envelopeId);
              toast.success(normalizedMethods.length > 0 ? `${normalizedMethods.length} authentication method(s) applied to recipient` : 'Cleared authentication for recipient');
            }
          }
        } else {
          toast.success(normalizedMethods.length > 0 ? 'Authentication methods will be saved when recipient is added' : 'Authentication cleared (will save with recipient)');
        }
      }
      
      // Close modal
      setShowAuthModal(false);
      setAuthModalForRecipientId(null);
      setAuthModalForBulk(false);
    } catch (error) {
      console.error('Error updating recipient authentication:', error);
      toast.error('Failed to update authentication method');
    }
  };
  const handleEmailOnBlur = async (id: string, email: string) => {
    if (!email || !envelopeId) return;
    try {
      const response = await eSignApi.get(`/api/e-sign/get-recipient/${email}`);
      if (response.status == 200) {
        const { recipient } = response.data;
        updateRecipient(id, {
          name: recipient.name,
          email: recipient.email
        })
        console.log('Fetched and updated');
      }
    } catch (err) {
      console.log(`Handle email on Blur`);
    }
  }

  // Drag handlers for recipient reordering
  const handleRecipientDragStart = (e: React.DragEvent, recipientId: string) => {
    if (!setSigningOrder) {
      e.preventDefault();
      return; // Only allow dragging when signing order is enabled
    }
    
    // Prevent dragging if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'TEXTAREA' || 
        target.closest('button') || target.closest('input') || target.closest('textarea') || 
        target.closest('.role-dropdown-container') || target.closest('.customize-dropdown-container') ||
        target.closest('[data-recipient-name-id]') || target.closest('[data-recipient-email-id]')) {
      e.preventDefault();
      return;
    }
    
    setDraggedRecipientId(recipientId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', recipientId);
    // Prevent text selection during drag
    e.dataTransfer.setDragImage(new Image(), 0, 0);
  };

  const handleRecipientDragOver = (e: React.DragEvent, recipientId: string) => {
    if (!setSigningOrder || !draggedRecipientId || draggedRecipientId === recipientId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverRecipientId(recipientId);
  };

  const handleRecipientDragLeave = () => {
    setDragOverRecipientId(null);
  };

  const handleRecipientDrop = (e: React.DragEvent, targetRecipientId: string) => {
    e.preventDefault();
    if (!draggedRecipientId || draggedRecipientId === targetRecipientId) {
      setDraggedRecipientId(null);
      setDragOverRecipientId(null);
      return;
    }

    setRecipients(prev => {
      const draggedRecipient = prev.find(r => r.id === draggedRecipientId);
      const targetRecipient = prev.find(r => r.id === targetRecipientId);
      
      if (!draggedRecipient || !targetRecipient) return prev;

      const draggedOrder = draggedRecipient.order || prev.findIndex(r => r.id === draggedRecipientId) + 1;
      const targetOrder = targetRecipient.order || prev.findIndex(r => r.id === targetRecipientId) + 1;

      // Swap orders
      const updated = prev.map(r => {
        if (r.id === draggedRecipientId) {
          return { ...r, order: targetOrder };
        }
        if (r.id === targetRecipientId) {
          return { ...r, order: draggedOrder };
        }
        return r;
      });

      // Normalize orders to ensure they're sequential
      return normalizeOrders(updated);
    });

    setDraggedRecipientId(null);
    setDragOverRecipientId(null);
  };

  const handleRecipientDragEnd = () => {
    setDraggedRecipientId(null);
    setDragOverRecipientId(null);
  };

  const removeRecipient = async (id: string) => {
    // Check if coming from db and delete from db too

    // Heuristic: If the ID is a MongoDB ObjectId (24 hex chars), treat it as DB record
    const isDbRecord = /^[a-fA-F0-9]{24}$/.test(id);

    if (isDbRecord) {
      try {
        await eSignApi.post(`/api/e-sign/envelope/remove-recipient/${id}/${envelopeId}`);// Adjust API path if needed
        console.log(`Recipient ${id} deleted from DB successfully.`);
      } catch (error) {
        console.error('Failed to delete recipient from DB:', error);
      }
    }
    setRecipients(prev => {
      const removed = prev.filter(recipient => recipient.id !== id);
      // Normalize orders after removal
      const normalized = normalizeOrders(removed);
      
      // Handle active recipient state
      if (id === activeRecipientId) {
        // If we removed the active recipient, set the first remaining as active (if any)
        if (normalized.length > 0 && normalized.length > 3) {
          setActiveRecipientId(normalized[0].id);
        } else {
          // If we now have 3 or fewer, clear active state (all will show as cards)
          setActiveRecipientId(null);
        }
      } else if (normalized.length <= 3) {
        // If we now have 3 or fewer recipients, clear active state
        setActiveRecipientId(null);
      }
      
      return normalized;
    });
  };

  // const canProceedToNext = () => {
  //   switch (currentStep) {
  //     case 1:
  //       return documents?.length > 0 && selectedEnvelopeType !== '';
  //     case 2:
  //       if (mode === 'normal') {
  //         return recipients?.length > 0 && recipients.every(r => r.name && r.email);
  //       } else {
  //         // power mode'
  //         return true; // Fields are optional
  //       }
  //     case 3:
  //       return true; // Fields are optional
  //     case 4:
  //       return true; // Authentication is optional
  //     case 5:
  //       return envelopeData.subject.trim() !== '';
  //     default:
  //       return true;
  //   }
  // };

  // const handleCreateEnvelope = () => {
  //   if (!user) return;
  //   navigate('/e-sign/dashboard');
  // };

  // Fetch subscription plan and auth methods for send confirmation
  const fetchSendConfirmationData = async () => {
    try {
      // Fetch subscription plan
      const planResponse = await subscriptionApi.get('/user-plan/me');
      if (planResponse.status === 200) {
        setSubscriptionPlan(planResponse.data.data);
        SubscriptionStorage.savePlan(planResponse.data.data);
      }
      
      // Fetch auth methods
      const authResponse = await subscriptionApi.get('/user/available/auth/methods');
      if (authResponse.status === 200) {
        setAuthMethods(authResponse.data.data.methods || []);
      }
    } catch (error) {
      console.error('Error fetching send confirmation data:', error);
    }
  };

  const handleSendEnvelope = async () => {
    console.log('handleSendEnvelope called', { envelopeId, mode });
    if (!envelopeId) {
      toast.error('Envelope ID is missing. Please save the envelope first.');
      console.error('Cannot send envelope: envelopeId is missing');
      return;
    }
    
    // Check if user has enough credits before proceeding
    const totalCost = calculateTotalCost();
    const creditsBalance = subscriptionPlan?.creditsBalance || 0;
    
    if (totalCost > 0 && creditsBalance < totalCost) {
      // Show subscription modal instead of send confirmation
      setShowSubscriptionModal(true);
      toast.error(`Insufficient credits. You need ${totalCost} credits but only have ${creditsBalance}. Please upgrade your plan.`);
      return;
    }
    
    try {
      // Show confirmation modal instead of directly sending
      console.log('Fetching send confirmation data...');
      await fetchSendConfirmationData();
      console.log('Setting modal to show...');
      setSendModalStep(1);
      setShowSendConfirmationModal(true);
      console.log('Modal should now be visible');
    } catch (error) {
      console.error('Error preparing send confirmation:', error);
      // Still show the modal even if data fetch fails
      setSendModalStep(1);
      setShowSendConfirmationModal(true);
      toast.error('Failed to load some data, but you can still proceed.');
    }
  };

  // Actual send function called after confirmation
  const confirmAndSendEnvelope = async () => {
    if (!envelopeId) return;
    
    // Double-check credits before sending (safety check)
    const totalCost = calculateTotalCost();
    const creditsBalance = subscriptionPlan?.creditsBalance || 0;
    
    if (totalCost > 0 && creditsBalance < totalCost) {
      // Close send confirmation modal
      setShowSendConfirmationModal(false);
      setSending(false);
      // Show subscription modal
      setShowSubscriptionModal(true);
      toast.error(`Insufficient credits. You need ${totalCost} credits but only have ${creditsBalance}. Please upgrade your plan.`);
      return;
    }
    
    setSending(true);
    // Keep modal open to show loading state
    try {
      // First, save the recipients with their updated order to the backend
      // Normalize orders to ensure they're sequential
      const normalizedRecipients = normalizeOrders(recipients);
      const recipientPayload = normalizedRecipients.map(r => ({
        name: r.name,
        email: r.email,
        role: r.role,
        order: r.order,
        status: r.status,
        authentication: r.authentication || null
      }));
      
      console.log('Saving recipients with updated order before sending:', recipientPayload);
      try {
        const saveResponse = await eSignApi.post('/api/e-sign/add-recipients', {
          envelopeId,
          recipients: recipientPayload
        });
        console.log('Recipients order saved successfully', saveResponse.data);
        
        // Update local state with normalized recipients to keep UI in sync
        setRecipients(normalizedRecipients);
        
        // Refresh envelope details to ensure backend state is reflected
        await getEnvelopeDetail(envelopeId);
      } catch (saveErr) {
        console.error('Failed to save recipients order:', saveErr);
        toast.error('Failed to save signing order. Please try again.');
        setSending(false);
        return;
      }
      
      // Now send the envelope
      await eSignApi.post(`/api/e-sign/send-envelope/${envelopeId}`);
      
      // Record credit usage
      const totalCost = calculateTotalCost();
      if (totalCost > 0 && subscriptionPlan) {
        try {
          // Include all recipients with authentication, including email verification
          const recipientsWithAuth = recipients.filter(r => r.authentication);
          if (recipientsWithAuth.length > 0) {
            await Promise.all(recipientsWithAuth.flatMap(recipient => {
              const authArray = parseAuthentication(recipient.authentication);
              return authArray.map(authId => {
                const authMethod = authMethods.find(m => m.id === authId);
                const cost = authMethod?.cost || 0;
                if (cost > 0) {
                  return subscriptionApi.post('/usage/consume', {
                    action: 'esign:envelopeSend',
                    credits: cost,
                    authId: authId,
                    toolId: 'esign',
                    reason: `Envelope ${envelopeId} sent to ${recipient.email}`,
                  });
                }
                return null;
              }).filter(Boolean);
            }));
            
            // Update credits in localStorage
            const newBalance = (subscriptionPlan.creditsBalance || 0) - totalCost;
            SubscriptionStorage.updateCredits(newBalance);
            setSubscriptionPlan((prev: any) => prev ? { ...prev, creditsBalance: newBalance } : null);
            
            // Dispatch custom event to notify header and other components to refresh credits
            window.dispatchEvent(new CustomEvent('credits-updated'));
          }
        } catch (creditErr: any) {
          console.error('Failed to record credit usage:', creditErr);
          // Check if error is due to insufficient credits
          if (creditErr?.response?.status === 402 || creditErr?.response?.data?.status === 402) {
            // Close send confirmation modal
            setShowSendConfirmationModal(false);
            setSending(false);
            // Show subscription modal
            setShowSubscriptionModal(true);
            const required = creditErr?.response?.data?.data?.required || totalCost;
            const balance = creditErr?.response?.data?.data?.creditsBalance || creditsBalance;
            toast.error(`Insufficient credits. You need ${required} credits but only have ${balance}. Please upgrade your plan.`);
            return;
          }
        }
      }
      
      // Close modal before navigation
      setShowSendConfirmationModal(false);
      
      // Navigate to agreement page with success parameter
      navigate('/e-sign/aggrement?sent=true');
    } catch (err) {
      console.error(err);
      // Close modal before showing error alert
      setShowSendConfirmationModal(false);
      
      Swal.fire({
        title: "Error",
        text: "Failed to send envelope. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#ffc107",
      });
    } finally {
      setSending(false);
    }
  };

  // Calculate total cost based on authentication methods
  const calculateTotalCost = (): number => {
    let total = 0;
    recipients.forEach(recipient => {
      if (recipient.authentication) {
        const authArray = parseAuthentication(recipient.authentication);
        authArray.forEach(authId => {
          const authMethod = authMethods.find(m => m.id === authId);
          if (authMethod) {
            total += authMethod.cost || 0;
          }
        });
      }
    });
    return total;
  };
  useEffect(() => {
    getSteps();
  }, [location.search, routeEnvelopeId]);

  // Fetch envelope types on component mount
  useEffect(() => {
    fetchEnvelopeTypes();
  }, []);

  // Auto-set active recipient when recipients exceed 3 and none is active
  useEffect(() => {
    if (recipients.length > 3 && !activeRecipientId && recipients.length > 0) {
      const sorted = [...recipients].sort((a, b) => (a.order || 0) - (b.order || 0));
      setActiveRecipientId(sorted[0].id);
    } else if (recipients.length <= 3) {
      setActiveRecipientId(null);
    }
  }, [recipients.length, activeRecipientId]);

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

  // Handle envelope type selection (including "Other")
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

  // Handle saving new envelope type (only for current envelope, not saved to DB)
  const handleSaveNewEnvelopeType = () => {
    if (!newEnvelopeTypeValue.trim()) {
      return;
    }

    // Set the custom type for this envelope only (not saved to database)
    setSelectedEnvelopeType(newEnvelopeTypeValue.trim());
    setShowOtherInputInDropdown(false);
    setNewEnvelopeTypeValue('');
    setTypeDropdownOpen(false);
    setTypeSearch('');
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

  const getSteps = async () => {
    try {
      const params = new URLSearchParams(location.search);
      const step = params.get('step');
      const envelopeId = params.get('envelopeId');

      if (step && envelopeId) {
        const response = await eSignApi.get('/api/e-sign/get-envelopes');
        if (response) {
          switch (Number(step)) {
            case 1:
              setCurrentStep(1);
              setEnvelopeId(envelopeId);
              if (envelopeId) await getEnvelopeDetail(envelopeId);
              break;
            case 2:
              setCurrentStep(2);
              setEnvelopeId(envelopeId);
              await getEnvelopeDetail(envelopeId);
              break;
            case 3:
              console.log('Current step', step);
              setCurrentStep(3);
              setEnvelopeId(envelopeId);
              await getEnvelopeDetail(envelopeId);
              await getSignatureFields(envelopeId);
              break;
            case 4:
              setCurrentStep(4);
              setEnvelopeId(envelopeId);
              break;
            case 5:
              setCurrentStep(5);
              setEnvelopeId(envelopeId);
              break;
            case 6:
              setCurrentStep(6);
              setEnvelopeId(envelopeId);
              await getEnvelopeDetail(envelopeId);
              break;
            default:
              setCurrentStep(1);
          }
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
      // Fallback to step 1 on error
      setCurrentStep(1);
    }
  }

  // Load unique recipient suggestions aggregated from user's envelopes and saved recipients
  const loadRecipientSuggestions = async (forceReload = false) => {
    if (!forceReload && (recipientSuggestions.length > 0 || loadingRecipientSuggestions)) return;
    setLoadingRecipientSuggestions(true);
    const map = new Map<string, { name: string; email: string }>();
    const addIfValid = (r: any) => {
      const name = (r?.name || '').trim();
      const email = (r?.email || '').trim();
      if (!email) return;
      const key = email.toLowerCase();
      // Prefer name from saved recipients if available, otherwise use envelope recipient name
      if (!map.has(key)) {
        map.set(key, { name: name || email, email });
      } else {
        // Update name if current entry doesn't have a name but new one does
        const existing = map.get(key);
        if (existing && (!existing.name || existing.name === existing.email) && name && name !== email) {
          map.set(key, { name, email });
        }
      }
    };
    try {
      // Fetch from both sources in parallel
      const [envelopesResponse, savedRecipientsResponse] = await Promise.allSettled([
        eSignApi.get('/api/e-sign/get-envelopes'),
        eSignApi.get('/api/e-sign/recipients')
      ]);

      // Add recipients from envelopes
      if (envelopesResponse.status === 'fulfilled') {
        const response = envelopesResponse.value;
        const envelopes = response?.data?.data || response?.data?.envelopes || response?.data || [];
        if (Array.isArray(envelopes)) {
          envelopes.forEach((env: any) => {
            const recs = env?.recipients || env?.recipientIds || [];
            if (Array.isArray(recs)) recs.forEach(addIfValid);
          });
        }
      }

      // Add saved recipients from database (user-filtered by backend)
      if (savedRecipientsResponse.status === 'fulfilled') {
        const response = savedRecipientsResponse.value;
        const savedRecipients = response?.data?.data || [];
        if (Array.isArray(savedRecipients)) {
          savedRecipients.forEach((r: any) => {
            addIfValid({ name: r.name, email: r.email });
          });
        }
      }

      // Always include logged-in user's email in suggestions
      if (user?.email) {
        const userEmail = user.email.toLowerCase();
        if (!map.has(userEmail)) {
          map.set(userEmail, {
            name: user.fullname || user.email,
            email: user.email
          });
        }
      }
      setRecipientSuggestions(Array.from(map.values()));
    } catch (err) {
      console.warn('Failed to load recipient suggestions; defaulting to empty list', err);
      // Still include logged-in user's email even on error
      if (user?.email) {
        setRecipientSuggestions([{
          name: user.fullname || user.email,
          email: user.email
        }]);
      } else {
        setRecipientSuggestions([]);
      }
    } finally {
      setLoadingRecipientSuggestions(false);
    }
  };

  // Debounced search function
  const debouncedSearch = useRef(
    debounce((query: string) => {
      setDebouncedSearchQuery(query);
    }, 250)
  ).current;

  // Fetch saved recipients from the API
  const fetchSavedRecipients = async () => {
    setLoadingSavedRecipients(true);
    try {
      // Fetch from both sources in parallel (same as loadRecipientSuggestions)
      const [envelopesResponse, savedRecipientsResponse] = await Promise.allSettled([
        eSignApi.get('/api/e-sign/get-envelopes'),
        eSignApi.get('/api/e-sign/recipients')
      ]);

      // Use a Map to deduplicate by email (prefer saved recipients over envelope recipients)
      const recipientsMap = new Map<string, { _id: string; name: string; email: string; title?: string; company?: string; phone?: string; address?: string }>();

      // First, add saved recipients (these have full details)
      if (savedRecipientsResponse.status === 'fulfilled') {
        const response = savedRecipientsResponse.value;
        const savedRecipients = response?.data?.data || [];
        if (Array.isArray(savedRecipients)) {
          savedRecipients.forEach((r: any) => {
            if (r?.email) {
              const email = r.email.toLowerCase();
              recipientsMap.set(email, {
                _id: r._id || r.id,
                name: r.name || '',
                email: r.email,
                title: r.title,
                company: r.company,
                phone: r.phone,
                address: r.address
              });
            }
          });
        }
      }

      // Then, add recipients from envelopes (only if not already in map)
      if (envelopesResponse.status === 'fulfilled') {
        const response = envelopesResponse.value;
        const envelopes = response?.data?.data || response?.data?.envelopes || response?.data || [];
        if (Array.isArray(envelopes)) {
          envelopes.forEach((env: any) => {
            const recs = env?.recipients || env?.recipientIds || [];
            if (Array.isArray(recs)) {
              recs.forEach((r: any) => {
                if (r?.email) {
                  const email = r.email.toLowerCase();
                  // Only add if not already in map (saved recipients take priority)
                  if (!recipientsMap.has(email)) {
                    recipientsMap.set(email, {
                      _id: r.id || r._id || email,
                      name: r.name || r.email,
                      email: r.email,
                      title: r.title,
                      company: r.company,
                      phone: r.phone,
                      address: r.address
                    });
                  }
                }
              });
            }
          });
        }
      }

      setSavedRecipients(Array.from(recipientsMap.values()));
    } catch (err) {
      console.error('Failed to fetch saved recipients', err);
      setSavedRecipients([]);
    } finally {
      setLoadingSavedRecipients(false);
    }
  };

  // Open recipient list modal
  const openRecipientListModal = (recipientId: string) => {
    setRecipientListModalForId(recipientId);
    setRecipientListSearch('');
    setShowRecipientListModal(true);
    fetchSavedRecipients();
    // Also refresh suggestions to include any newly added recipients
    loadRecipientSuggestions(true);
  };

  // Select recipient from list
  const selectRecipientFromList = (savedRecipient: { name: string; email: string; title?: string; company?: string; phone?: string; address?: string }) => {
    if (recipientListModalForId) {
      updateRecipient(recipientListModalForId, {
        name: savedRecipient.name,
        email: savedRecipient.email
      });
      setShowRecipientListModal(false);
      setRecipientListModalForId(null);
      setShowAddRecipientForm(false);
      setNewRecipientForm({ name: '', email: '', title: '', company: '', phone: '', address: '' });
    }
  };

  // Handle add new recipient
  const handleAddNewRecipient = async () => {
    if (!newRecipientForm.name.trim() || !newRecipientForm.email.trim()) {
      alert('Name and Email are required');
      return;
    }
    setSavingNewRecipient(true);
    try {
      const res = await eSignApi.post('/api/e-sign/recipients', newRecipientForm);
      if (res.status === 201) {
        // Add the new recipient to the list
        const newRecipient = res.data.data || {
          _id: res.data._id || Date.now().toString(),
          ...newRecipientForm
        };
        setSavedRecipients(prev => [newRecipient, ...prev]);
        
        // Also add to recipient suggestions so it shows up when typing
        setRecipientSuggestions(prev => {
          const emailKey = newRecipient.email.toLowerCase();
          const existing = prev.find(r => r.email.toLowerCase() === emailKey);
          if (!existing) {
            return [{ name: newRecipient.name, email: newRecipient.email }, ...prev];
          }
          // Update existing if name is better
          return prev.map(r => 
            r.email.toLowerCase() === emailKey && (!r.name || r.name === r.email)
              ? { name: newRecipient.name, email: r.email }
              : r
          );
        });
        
        // Automatically select the new recipient
        selectRecipientFromList(newRecipient);
        toast.success('Recipient added successfully');
      }
    } catch (err: any) {
      console.error('Failed to add recipient', err);
      const message = err?.response?.data?.message || 'Failed to add recipient';
      alert(message);
    } finally {
      setSavingNewRecipient(false);
    }
  };

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

  // Close email suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!emailSuggestionsOpenForId) return;
      const el = emailSuggestionsContainerRef.current;
      if (el && e.target instanceof Node && !el.contains(e.target)) {
        setEmailSuggestionsOpenForId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [emailSuggestionsOpenForId]);

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
  // const syncPartiesToNumber = (count: number) => {
  //   if (!count || count < 1) count = 1;
  //   if (count > maxParties) count = maxParties;

  //   // Build new parties array deterministically
  //   const newParties: Party[] = [];
  //   for (let i = 1; i <= count; i++) {
  //     const letter = String.fromCharCode(64 + i); // 1 -> 'A'
  //     newParties.push({
  //       id: `slot_${i}`,
  //       name: `Party ${letter}`,
  //       slot: i,
  //       role: 'signer',
  //       authMethod: 'email',
  //       required: true
  //     });
  //   }

  //   // Commit updates in order
  //   setParties(newParties);
  //   setNumberOfParties(count);

  //   // Ensure selectedPartyId remains valid, otherwise pick slot_1 or last slot
  //   setSelectedPartyId(prevSelected => {
  //     const exists = newParties.find(p => p.id === prevSelected);
  //     return exists ? prevSelected : newParties[0]?.id ?? `slot_1`;
  //   });

  //   // Ensure firstSigningPartyId remains valid
  //   setFirstSigningPartyId(prevFirst => {
  //     const exists = newParties.find(p => p.id === prevFirst);
  //     return exists ? prevFirst : newParties[0]?.id ?? `slot_1`;
  //   });
  //   console.log(parties)
  // };

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
  const savePowerFormSlots = async (): Promise<string | null> => {
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
        powerFormId: selectedForm || null,
      };
      const response = await eSignApi.post('/api/e-sign/envelope/connect/powerform', payload);
      if (response?.status === 200 || response?.status === 201) {
        // backend should return envelopeId or templateId
        const id = response.data?.envelope?._id;
        console.log('Power Form slots saved, envelopeId:', id);
        if (id) setEnvelopeId(id);
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
              <div className="space-y-6 overflow-visible">
                {/* Stacked layout for 4+ documents OR grid layout for 0-3 documents */}
                {documents && documents.length > 3 ? (
                  <div className="flex gap-4 items-stretch py-1 overflow-visible">
                    {/* Stacked Documents Container */}
                    <div className="w-1/3 relative" style={{ overflow: 'visible', paddingRight: '60px', paddingBottom: '50px' }}>
                      <div className="relative w-full h-full" style={{ minHeight: '150px', overflow: 'visible' }}>
                        {documents.map((doc, index) => {
                          // Calculate relative position: 0 is on top (stackedDocIndex), others are below
                          const position = index - stackedDocIndex;
                          const absPosition = position < 0 ? documents.length + position : position;
                          
                          const previewMinHeight = '180px';
                          const pdfWidth = 100;
                          const paddingClass = 'p-2';
                          const fontSizeClass = 'text-xs';
                          const closeButtonSize = 'w-5 h-5';
                          const closeIconSize = 'w-2.5 h-2.5';
                          // Subtle vertical offset to show bottom edges (primary offset is horizontal)
                          const verticalOffset = 10; // Subtle downward offset for each card
                          // Prominent horizontal offset to make right edges clearly visible
                          const horizontalOffset = absPosition === 0 ? 0 : 20 + (absPosition * 6); // Progressive horizontal offset: 20px, 26px, 32px, 38px
                          
                          // Only show top 4 cards in stack
                          if (absPosition >= 4) return null;
                          
                          // Calculate scale - minimal scaling for cleaner look
                          const scale = absPosition === 0 ? 1 : Math.max(0.98 - absPosition * 0.01, 0.95);
                          
                          // Color scheme for stacked cards - different colors for visual appeal
                          const cardColors = [
                            { border: '#260559', shadow: 'rgba(38, 5, 89, 0.2)', accent: '#6366f1' }, // Purple for top card
                            { border: '#6366f1', shadow: 'rgba(99, 102, 241, 0.15)', accent: '#8b5cf6' }, // Indigo for second
                            { border: '#8b5cf6', shadow: 'rgba(139, 92, 246, 0.12)', accent: '#a78bfa' }, // Purple for third
                            { border: '#a78bfa', shadow: 'rgba(167, 139, 250, 0.1)', accent: '#c4b5fd' } // Light purple for fourth
                          ];
                          const cardColor = cardColors[Math.min(absPosition, 3)];
                          
                          return (
                            <div
                              key={doc.id}
                              className="absolute top-0 left-0 w-full bg-white rounded-lg flex flex-col transition-all duration-500 ease-in-out overflow-hidden"
                              style={{
                                transform: `translate(${horizontalOffset}px, ${absPosition * verticalOffset}px) scale(${scale})`,
                                transformOrigin: 'top left',
                                zIndex: 10 - absPosition,
                                border: `1px solid ${absPosition === 0 ? cardColor.border : 'rgba(0, 0, 0, 0.1)'}`,
                                borderLeft: absPosition === 0 ? `2px solid ${cardColor.border}` : `1px solid rgba(0, 0, 0, 0.1)`, // Subtle left edge
                                boxShadow: absPosition === 0
                                  ? `0 4px 12px -2px ${cardColor.shadow}, 0 2px 4px -1px rgba(0, 0, 0, 0.1)`
                                  : `0 2px 6px -1px ${cardColor.shadow}, 0 1px 2px rgba(0, 0, 0, 0.06)`,
                                opacity: absPosition < 4 ? Math.max(1 - absPosition * 0.05, 0.85) : 0,
                                pointerEvents: absPosition === 0 ? 'auto' : 'none',
                                willChange: 'transform, opacity',
                                background: '#ffffff' // Clean white background like in the image
                              }}
                            >
                              {/* Close button at top right */}
                              {!doc.isUploading && absPosition === 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeDocument(doc.id);
                                  }}
                                  className={`absolute top-2 right-2 z-30 ${closeButtonSize} bg-black bg-opacity-70 rounded-full flex items-center justify-center hover:bg-opacity-90 transition-all`}
                                  onMouseEnter={(e) => e.stopPropagation()}
                                >
                                  <X className={`${closeIconSize} text-white`} />
                                </button>
                              )}

                              {/* PDF Preview/Thumbnail */}
                              {!doc.isUploading && doc.url && (
                                <div 
                                  className="w-full flex-1 border-b overflow-hidden bg-gradient-to-br from-gray-50 to-white min-h-0 relative group"
                                  style={{ 
                                    minHeight: previewMinHeight,
                                    borderBottomColor: absPosition === 0 ? cardColor.border + '40' : 'rgba(0, 0, 0, 0.1)'
                                  }}
                                >
                                  {/* Subtle gradient overlay */}
                                  <div 
                                    className="absolute inset-0 opacity-30 pointer-events-none"
                                    style={{
                                      background: `linear-gradient(135deg, ${cardColor.accent}15 0%, transparent 50%)`
                                    }}
                                  />
                                  <div className="w-full h-full flex items-center justify-center bg-transparent relative z-10 p-2">
                                    <div className="rounded-md shadow-sm border border-gray-200/50 bg-white p-1">
                                      <PDFDocument file={doc.url}>
                                        <PDFPage pageNumber={1} width={pdfWidth} renderTextLayer={false} renderAnnotationLayer={false} />
                                      </PDFDocument>
                                    </div>
                                  </div>
                                  {absPosition === 0 && (
                                    <div 
                                      className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-sm group-hover:opacity-100 transition-all duration-300 flex items-center justify-center opacity-0 z-20"
                                      style={{ pointerEvents: 'none' }}
                                    >
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedPdfForPreview(doc);
                                          setPdfPreviewModalOpen(true);
                                        }}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 rounded-lg shadow-xl hover:bg-gray-50 transition-all hover:scale-105 font-medium"
                                        style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)', pointerEvents: 'auto' }}
                                      >
                                        <Eye className="w-4 h-4" />
                                        <span className="text-sm">View</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* File Info Section */}
                              {!doc.isUploading ? (
                                <div className={paddingClass} style={{ background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 1))' }}>
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className={`font-semibold ${fontSizeClass} mb-1 truncate`} 
                                         style={{ color: absPosition === 0 ? cardColor.border : '#374151' }}
                                         title={doc.name}>
                                        {doc.name}
                                      </p>
                                      <div className="flex items-center justify-between">
                                        <p className="text-xs font-medium" style={{ color: absPosition === 0 ? cardColor.accent : '#6b7280' }}>
                                          {doc.pages} page{doc.pages !== 1 ? 's' : ''}
                                        </p>                                        
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className={paddingClass}>
                                  <p className={`font-medium text-gray-900 ${fontSizeClass} mb-2`}>{doc.name} — Uploading...</p>
                                  <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
                                    <div
                                      className="h-full bg-blue-500 transition-all"
                                      style={{ width: `${doc.uploadProgress ?? 0}%` }}
                                    />
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-1">{doc.uploadProgress ?? 0}%</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        
                        {/* Navigation Buttons - Left and Right of Document */}
                        {documents.length > 1 && (
                          <>
                            {/* Left Arrow */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setStackedDocIndex((prev) => (prev - 1 + documents.length) % documents.length);
                              }}
                              className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 z-30 p-2.5 transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
                              style={{ left: '10px' }}
                              title="Previous document"
                            >
                              <ChevronLeft className="w-6 h-6" style={{ color: '#260559' }} />
                            </button>
                            
                            {/* Right Arrow */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setStackedDocIndex((prev) => (prev + 1) % documents.length);
                              }}
                              className="absolute right-0 top-1/2 translate-x-full -translate-y-1/2 z-30 p-2.5 transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
                              style={{ right: '10px' }}
                              title="Next document"
                            >
                              <ChevronRight className="w-6 h-6" style={{ color: '#260559' }} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Upload Box - same line as stacked documents */}
                    <div className="w-2/3 flex-shrink-0" data-tour="ec-upload">
                      <div
                        onClick={(!documents || documents.length === 0) ? () => fileInputRef.current?.click() : undefined}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`bg-gray-100 transition-colors ${isDragOver
                          ? 'border-2 border-blue-400 bg-blue-50'
                          : 'border border-gray-200'
                          } ${documents && documents.length > 0 ? 'p-6' : 'p-8 sm:p-12'
                          } ${(!documents || documents.length === 0) ? 'cursor-pointer' : ''} rounded-lg h-full min-h-[250px] flex items-center justify-center`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept=".pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        {(!documents || documents.length === 0) ? (
                          <div className="flex flex-col items-center justify-center space-y-4 w-full">
                            <div className="bg-gray-700 rounded-lg p-3">
                              <ArrowUpToLine className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-sm text-gray-700">Drop your files here or</p>
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
                            className="flex flex-col items-center justify-center w-full cursor-pointer text-gray-500 hover:text-gray-700"
                          >
                            <div className="flex flex-col items-center justify-center space-y-4">
                              <div className="bg-gray-700 rounded-lg p-3">
                                <Upload className="w-6 h-6 text-white" />
                              </div>
                              <p className="text-sm text-gray-700">Drop your files here or</p>
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
                ) : (
                  /* Default grid layout for 0-3 documents */
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-1">
                  {/* Document Cards */}
                  {documents && documents.map((doc) => {
                    const docCount = documents.length;
                    // Calculate sizes based on document count
                    const previewMinHeight = docCount === 1 ? '220px' : docCount === 2 ? '180px' : docCount === 3 ? '150px' : '120px';
                    const pdfWidth = docCount === 1 ? 150 : docCount === 2 ? 150 : docCount === 3 ? 120 : 100;
                    const paddingClass = docCount === 1 ? 'p-1 sm:p-2' : docCount === 2 ? 'p-2 sm:p-3' : 'p-2';
                    const fontSizeClass = docCount === 1 ? 'text-xs sm:text-sm' : 'text-xs';
                    const closeButtonSize = docCount >= 4 ? 'w-5 h-5' : 'w-6 h-6';
                    const closeIconSize = docCount >= 4 ? 'w-2.5 h-2.5' : 'w-3 h-3';
                    
                    return (
                      <div key={doc.id} className="w-full h-auto relative bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
                        {/* Close button at top right */}
                        {!doc.isUploading && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeDocument(doc.id);
                            }}
                            className={`absolute top-2 right-2 z-10 ${closeButtonSize} bg-black bg-opacity-70 rounded-full flex items-center justify-center hover:bg-opacity-90 transition-all`}
                          >
                            <X className={`${closeIconSize} text-white`} />
                          </button>
                        )}

                        {/* PDF Preview/Thumbnail */}
                        {!doc.isUploading && doc.url && (
                          <div 
                            className="w-full flex-1 border-b border-gray-200 overflow-hidden bg-white rounded-t-lg min-h-0 relative group"
                            style={{ minHeight: previewMinHeight }}
                          >
                            {/* React-PDF thumbnail (first page) */}
                            <div className="w-full h-full flex items-center justify-center bg-white">
                              <PDFDocument file={doc.url}>
                                <PDFPage pageNumber={1} width={pdfWidth} renderTextLayer={false} renderAnnotationLayer={false} />
                              </PDFDocument>
                            </div>
                            {/* View Button - appears on hover */}
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPdfForPreview(doc);
                                  setPdfPreviewModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                                <span className="text-sm font-medium">View</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* File Info Section */}
                        {!doc.isUploading ? (
                          <div className={paddingClass}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                {/* File Name */}
                                <p className={`font-semibold text-gray-900 ${fontSizeClass} mb-1 truncate`} title={doc.name}>
                                  {doc.name}
                                </p>
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-gray-600">
                                    {doc.pages} page{doc.pages !== 1 ? 's' : ''}
                                  </p>
                                </div>

                              </div>
                            </div>
                          </div>
                      ) : (
                        /* Uploading state */
                        <div className={paddingClass}>
                          <p className={`font-medium text-gray-900 ${fontSizeClass} mb-2`}>{doc.name} — Uploading...</p>
                          <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all"
                              style={{ width: `${doc.uploadProgress ?? 0}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1">{doc.uploadProgress ?? 0}%</p>
                        </div>
                      )}
                    </div>
                    );
                  })}

                  {/* Upload Box - dynamically fills remaining space based on document count */}
                  {(() => {
                    const docCount = documents?.length || 0;
                    let colSpanClasses = '';
                    
                    if (docCount === 0) {
                      // No documents: full width
                      colSpanClasses = 'col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4';
                    } else if (docCount >= 4) {
                      // 4+ documents: wraps to new row, full width
                      colSpanClasses = 'col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4';
                    } else if (docCount === 1) {
                      // 1 document: fill remaining space (1 col on small, 2 on medium, 3 on large)
                      colSpanClasses = 'col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-3';
                    } else if (docCount === 2) {
                      // 2 documents: on small screens they fill the row (2 cols), so upload wraps and takes full width (2 cols)
                      // On medium: 2 docs take 2 cols, upload takes remaining 1 col
                      // On large: 2 docs take 2 cols, upload takes remaining 2 cols
                      colSpanClasses = 'col-span-1 sm:col-span-2 md:col-span-1 lg:col-span-2';
                    } else if (docCount === 3) {
                      // 3 documents: on small screens they wrap, upload takes full width (2 cols)
                      // On medium: 3 docs fill the row (3 cols), so upload wraps and takes full width (3 cols)
                      // On large: 3 docs take 3 cols, upload takes remaining 1 col
                      colSpanClasses = 'col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-1';
                    }
                    
                    return (
                      <div className={`w-full h-auto ${colSpanClasses}`} data-tour="ec-upload">
                    <div
                      onClick={(!documents || documents.length === 0) ? () => fileInputRef.current?.click() : undefined}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`bg-gray-100 transition-colors ${isDragOver
                        ? 'border-2 border-blue-400 bg-blue-50'
                        : 'border border-gray-200'
                        } ${documents && documents.length > 0 ? 'p-6' : 'p-8 sm:p-12'
                        } ${(!documents || documents.length === 0) ? 'cursor-pointer' : ''} rounded-lg h-full min-h-[200px] flex items-center justify-center`}
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

                      {/* CTA when no documents */}
                      {(!documents || documents.length === 0) ? (
                        <div className="flex flex-col items-center justify-center w-full">
                            {/* Upload icon in dark grey square box */}
                            <div className="bg-gray-700 rounded-lg p-3 mb-4">
                              <ArrowUpToLine className="w-6 h-6 text-white" />
                            </div>

                            {/* Text */}
                            <p className="text-sm text-gray-700 mb-4">Drop your files here or</p>

                            {/* Action Buttons Container */}
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
                              {/* Purple Upload button with dropdown arrow */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  fileInputRef.current?.click();
                                }}
                                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex-1 sm:flex-none min-w-[140px]"
                                style={{ backgroundColor: '#260559' }}
                              >
                                <span>Upload</span>
                                <Triangle className="w-3 h-2 fill-white rotate-180" />
                              </button>

                              {/* Divider with "or" text */}
                              <div className="flex items-center gap-2 my-2 sm:my-0">
                                <div className="h-px bg-gray-300 w-8"></div>
                                <span className="text-xs text-gray-500 font-medium">OR</span>
                                <div className="h-px bg-gray-300 w-8"></div>
                              </div>

                              {/* AI Generate Document Button with Ripple Animation */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/template/ai-generator');
                                }}
                                className="ai-generate-button flex items-center justify-center gap-2 flex-1 sm:flex-none min-w-[180px]"
                              >
                                <Sparkles className="w-4 h-4 relative z-10" />
                                <span className="relative z-10 text-sm sm:text-base">Generate with AI</span>
                              </button>
                            </div>
                          </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="flex flex-col items-center justify-center w-full cursor-pointer text-gray-500 hover:text-gray-700"
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
                    );
                  })()}
                  </div>
                )}
              </div>
            )}
            <hr className="border-t-2 border-gray-300 my-4" />
            {/* Recipients form moved from Step 2 to Step 1 */}
            <div>
              <h3
                onClick={() => setShowRecipients(prev => !prev)}
                className="text-lg text-gray-900 mb-4 cursor-pointer flex items-center justify-between"
                data-tour="ec-recipients-toggle"
              >
                <span>Add recipients</span>
                {showRecipients ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </h3>
              {bulkList && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">Batch Name <span className="text-red-500">*</span></label>
                  <input
                    value={bulkBatchName}
                    onChange={(e) => setBulkBatchName(e.target.value)}
                    className="w-full max-w-xl px-4 py-2 border border-gray-300 rounded-sm"
                    placeholder="Bulk Send List"
                  />
                  <div className="text-xs text-gray-500 mt-1">This name appears in your list of bulk sends and is not shown to others</div>
                </div>
              )}
              {showRecipients && (
                <div className="space-y-4">
                  {/* Top-level Options */}
                  <div className="space-y-3">
                    {/* I'm the only signer checkbox */}
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isOnlySigner}
                        onChange={(e) => {
                          setIsOnlySigner(e.target.checked);
                          if (e.target.checked) {
                            // Clear existing recipients and add current user as recipient
                            setRecipients([{
                              id: `self-${Date.now()}`,
                              name: user?.fullname || 'Me',
                              email: user?.email || '',
                              role: 'signer',
                              order: 1,
                              status: 'waiting',
                              authentication: '68ee2a18ba0c0738eb275d34' // Default: secret email verification
                            }]);
                          } else {
                            // Clear recipients when unchecked
                            setRecipients([]);
                          }
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-800 text-[12px] flex items-center gap-2">
                        I'm the only signer

                        <span className="relative group inline-flex">
                          {/* Icon */}
                          <div>
                            <Info className="w-5 h-5 text-[#1A1333]" />
                          </div>
                          <div
                            className="
                            absolute left-1/2 -translate-x-1/2 
                            bottom-full mb-3                 /* moves tooltip above without covering */
                            w-64 text-sm text-white bg-[#1A1333]
                            p-3 rounded-md shadow-lg 
                            opacity-0 group-hover:opacity-100 pointer-events-none
                            transition duration-200 z-50
                          "
                          >
                           You'll be the only signer. Add your fields and finish the signing.

                          </div>
                        </span>
                      </span>


                    </label>

                    {/* Set signing order checkbox */}
                    <div className="flex items-center justify-start gap-2 w-full">
                      <label className="flex items-center space-x-2 cursor-pointer" data-tour="ec-signing-order">
                        <input
                          type="checkbox"
                          checked={setSigningOrder}
                          onChange={(e) => setSetSigningOrder(e.target.checked)}
                          disabled={(((recipients?.length || 0) + (bulkList ? 1 : 0) + (csvRecipientList ? ((csvRecipientList.items?.length || 0)) : 0)) < 2)}
                          className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={(((recipients?.length || 0) + (bulkList ? 1 : 0) + (csvRecipientList ? ((csvRecipientList.items?.length || 0)) : 0)) < 2) ? 'Add at least two recipients to set signing order' : ''}
                        />
                        <span className={`text-sm ${((((recipients?.length || 0) + (bulkList ? 1 : 0) + (csvRecipientList ? ((csvRecipientList.items?.length || 0)) : 0)) < 2)) ? 'text-gray-300' : 'text-gray-700'}`}>Set signing order</span>
                      </label>

                      {/* View and Bulk controls */}
                      <div className="flex items-center gap-4">
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium" onClick={() => setShowSigningOrder(true)}>
                          View
                        </button>

                        {!bulkList ? (
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-2" onClick={() => { setShowBulkModal(true); setBulkStep(1); }} data-tour="ec-bulk-send">
                            Bulk send
                            <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded font-semibold">NEW</span>
                          </button>
                        ) : (
                          <div className="flex items-center">
                            <div
                              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-200 cursor-pointer"
                              onClick={() => {
                                if (bulkList) {
                                  setBulkMethod('manual');
                                  setBulkStep(2);
                                  setBulkSharedRole(bulkList.role as any);
                                  setBulkRows(
                                    (bulkList.items || []).map((it, idx) => ({
                                      id: `row_${Date.now()}_${idx}`,
                                      name: it.name,
                                      email: it.email,
                                      role: bulkList.role,
                                      order: idx + 1,
                                      status: 'waiting' as const,
                                      authentication: '68ee2a18ba0c0738eb275d34' as Recipient['authentication'] // Default: secret email verification
                                    }))
                                  );
                                  setShowBulkModal(true);
                                }
                              }}
                            >
                              <FileText className="w-4 h-4" />
                              <span className="font-medium">{csvRecipientList?.fileName || 'Bulk Send List'}</span>
                              <button className="px-1" title="Options"><ChevronDown className="w-4 h-4" /></button>
                            </div>
                            <button onClick={clearBulkList} className="ml-3 text-gray-600 hover:text-red-600" title="Remove"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Recipient Cards - Show form when expanded if not only signer */}
                  {!isOnlySigner && (
                    <>
                      {showBulkModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center">
                          <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
                            onClick={() => setShowBulkModal(false)}
                          />
                          <div className="relative bg-white w-full h-full p-6 overflow-y-auto">
                            <button
                              onClick={() => setShowBulkModal(false)}
                              className="absolute right-6 top-6 text-2xl text-[#3E2B66] hover:text-gray-800"
                            >
                              ✕
                            </button>

                            {/* Header - Defined once for all steps */}
                            <div className="mb-6">
                              <h2 className="text-[20px] font-semibold text-[#3E2B66]">
                                Bulk send
                              </h2>
                            </div>

                            {bulkStep === 1 && (
                              <div >
                                <div className='container mx-auto mt-19 px-4 sm:px-8 lg:px-50 '>
                                  <h3 className="text-[24px] text-[#3E2B66] mb-2">Choose how you'd like to upload your recipient list.</h3>
                                  <p className="text-black-600 mb-8">Choose how you'd like to upload your recipient list.</p>

                                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-10">
                                    <button
                                      onClick={() => setBulkMethod('manual')}
                                      className={`text-left p-6 border ${bulkMethod === 'manual' ? 'border-black-900' : 'border-gray-300 hover:border-gray-400'}`}
                                    >
                                      <div className="flex items-center gap-3 mb-2">
                                        <span className={`w-4 h-4 rounded-full border ${bulkMethod === 'manual' ? 'bg-blue-600 border-blue-600' : 'border-gray-400'}`} />
                                        <span className="font-semibold text-[#3E2B66]">Enter manually</span>
                                      </div>
                                      <div className="text-sm text-gray-600">Best for shorter lists. Type each recipient's name, role, and email address.</div>
                                    </button>

                                    <button
                                      onClick={() => setBulkMethod('csv')}
                                      className={`text-left p-6 border ${bulkMethod === 'csv' ? 'border-black-900' : 'border-gray-300 hover:border-gray-400'}`}
                                    >
                                      <div className="flex items-center gap-3 mb-2">
                                        <span className={`w-4 h-4 rounded-full border ${bulkMethod === 'csv' ? 'bg-blue-600 border-blue-900' : 'border-gray-400'}`} />
                                        <span className="text-[#3E2B66]">Upload a CSV</span>
                                      </div>
                                      <div className="text-sm text-gray-600">Required for 10+ recipients. We'll provide a sample for formatting help.</div>
                                    </button>
                                  </div>

                                  <div className="absolute bottom-4 right-4 flex items-center justify-end gap-3 bg-white">
                                    {/* <button
                                      onClick={downloadSampleCsv}
                                      className="px-4 py-2 border rounded-md text-[#3E2B66] border-[#3E2B66] flex items-center gap-2"
                                    >
                                      <ArrowDownToLine className="w-4 h-4" />
                                      Sample CSV
                                    </button> */}


                                    <button
                                      onClick={() => setBulkStep(bulkMethod === 'manual' ? 2 : 2)}
                                      className="px-4 py-2 text-white rounded-md" style={{ backgroundColor: '#260559' }}
                                    >
                                      Next
                                    </button>
                                  </div>

                                </div>

                              </div>
                            )}

                            {bulkStep === 2 && bulkMethod === 'manual' && (
                              <div>
                                <div className='container mx-auto px-4 sm:px-8 lg:px-50 '>
                                  <h3 className="text-[32px] leading-tight text-[#3E2B66] mb-1">Recipients</h3>
                                  <p className="text-gray-600 mb-6">Enter information for up to 10 recipients. If you need to add more recipients, <span className="text-purple-700 underline cursor-pointer" onClick={() => setBulkMethod('csv')}>upload a CSV instead</span></p>

                                  <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-900 mb-2">Role *</label>
                                    <select
                                      className="w-full max-w-md px-3 py-2 border rounded-sm"
                                      value={bulkSharedRole as any}
                                      onChange={(e) => setBulkSharedRole(e.target.value as any)}
                                    >
                                      <option value="">Select a role</option>
                                      <option value="signer">Needs to Sign</option>
                                      <option value="in_person_signer">In Person Signer</option>
                                      <option value="carbon_copy">Receives a Copy</option>
                                      <option value="approver">Approver</option>
                                      <option value="needs_to_view">Needs to View</option>
                                    </select>
                                    <div className="text-xs text-gray-500 mt-1">All recipients share this role.</div>
                                  </div>

                                  <div className="space-y-4">
                                    {bulkRows.map((row) => (
                                      <div key={row.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                        <div>
                                          <label className="block text-sm font-medium text-gray-900 mb-2">Name *</label>
                                          <input
                                            className="w-full px-3 py-2 border rounded-sm"
                                            value={row.name}
                                            onChange={(e) => setBulkRows(prev => prev.map(r => r.id === row.id ? { ...r, name: e.target.value } : r))}

                                          />
                                        </div>
                                        <div className="relative">
                                          <label className="block text-sm font-medium text-gray-900 mb-2">Email *</label>
                                          <input
                                            className="w-full px-3 py-2 border rounded-sm"
                                            value={row.email}
                                            onChange={(e) => setBulkRows(prev => prev.map(r => r.id === row.id ? { ...r, email: e.target.value } : r))}

                                          />
                                          {bulkRows.length > 1 && (
                                            <button type="button" onClick={() => removeBulkRow(row.id)} className="mt-2 absolute -right-10 top-8 text-gray-500 hover:text-red-600"><Trash2 className='w-4 h-4' /></button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                    {bulkRows.length < 10 && (
                                      <button type="button" onClick={addBulkRow} className="text-2xl text-[#3E2B66]"><Plus className='w-6 h-6' /></button>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-end mt-8">
                                  <div className="flex items-center gap-3">
                                    {/* <button onClick={() => setBulkMethod('csv')} className="px-4 py-2 border rounded-sm">Upload CSV</button> */}
                                    <button onClick={applyBulkRecipients} className="px-4 py-2 text-white rounded-sm" style={{ backgroundColor: '#260559' }}>Save</button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {bulkStep === 2 && bulkMethod === 'csv' && !showRecipientsEditor && (
                              <div className="w-full h-full flex flex-col relative">
                                {/* Show Exceptions Page */}
                                {showCsvExceptions ? (
                                  <>
                                    <div className="max-w-3xl mx-auto flex-1 flex flex-col px-6 pb-6">
                                      {/* Instructional Text */}
                                      <p className="text-sm text-gray-700 mb-6" style={{ fontFamily: 'sans-serif' }}>
                                        The following items could not be matched between entries on your envelope and the imported bulk list. You can accept these matching exceptions and continue with the envelope. Or you can discard the imported CSV, edit it to update column headers as required, and then re-import the edited file.
                                      </p>

                                      {/* Sample Download Link */}
                                      <div className="mb-6">
                                        <p className="text-sm text-gray-700 mb-2" style={{ fontFamily: 'sans-serif' }}>
                                          You can download a sample bulk list preformatted for your envelope.
                                        </p>
                                        <button
                                          onClick={downloadSampleCsv}
                                          className="text-blue-600 underline hover:text-blue-700 text-sm"
                                        >
                                          Download sample
                                        </button>
                                      </div>

                                      {/* Bulk list columns Warning Box */}
                                      {unmatchedColumns.length > 0 && (
                                        <div
                                          className="mb-8 p-4 rounded-lg border"
                                          style={{
                                            backgroundColor: '#fff7ed',
                                            borderColor: '#fed7aa'
                                          }}
                                        >
                                          <div className="flex items-start gap-2 mb-3">
                                            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                                            <h3 className="text-sm font-semibold text-orange-900">Bulk list columns:</h3>
                                          </div>
                                          <ul className="list-none pl-7 space-y-1">
                                            {unmatchedColumns.map((column, idx) => (
                                              <li key={idx} className="text-sm text-orange-900">
                                                <span className="text-red-600 mr-2">•</span>
                                                {column}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      {/* Action Buttons */}

                                    </div>
                                    <div className="flex items-center justify-end gap-3 mt-auto">
                                      <button
                                        onClick={handleDiscardCsv}
                                        className="px-4 py-2 bg-white border border-gray-300 rounded-sm text-gray-900 hover:bg-gray-50 transition-colors"
                                      >
                                        Discard CSV
                                      </button>
                                      <button
                                        onClick={handleAcceptCsvExceptions}
                                        className="px-6 py-2 text-white rounded-sm hover:opacity-90 transition-opacity"
                                        style={{ backgroundColor: '#3E2B66' }}
                                      >
                                        Accept
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  /* Main Content - Upload Page */
                                  <div className="flex-1 w-full flex flex-col items-center">
                                    {/* Upload CSV Title */}
                                    <h3 className="text-2xl text-gray-900 mb-8" style={{ fontFamily: 'sans-serif' }}>Upload a CSV</h3>

                                    {/* Drag and Drop Area */}
                                    <div
                                      onDragOver={handleDragOverCsv}
                                      onDragLeave={handleDragLeaveCsv}
                                      onDrop={handleDropCsv}
                                      className={`w-full max-w-2xl border-2 border-dashed rounded-lg p-12 ${isDragOverCsv
                                        ? 'border-purple-500'
                                        : 'border-gray-200'
                                        }`}
                                      style={{
                                        backgroundColor: isDragOverCsv ? '#f3e8ff' : '#f5f3f7',
                                        borderColor: isDragOverCsv ? '#9333ea' : '#e5e7eb'
                                      }}
                                    >
                                      <div className="flex flex-col items-center justify-center">
                                        {/* Upload Icon */}
                                        <Upload className="w-12 h-12 text-gray-700 mb-4" />

                                        {/* Drag and drop text */}
                                        <p className="text-base font-normal text-gray-900 mb-2" style={{ fontFamily: 'sans-serif' }}>
                                          Drag and drop file here
                                        </p>

                                        {/* Supported Formats */}
                                        <p className="text-sm text-gray-500 mb-6" style={{ color: '#9ca3af' }}>
                                          Supported Formats: CSV
                                        </p>

                                        {/* Select File Button */}
                                        <button
                                          onClick={() => csvFileInputRef.current?.click()}
                                          className="px-6 py-2 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                                          style={{ backgroundColor: '#3E2B66' }}
                                        >
                                          Select File
                                        </button>

                                        {/* Hidden File Input */}
                                        <input
                                          ref={csvFileInputRef}
                                          type="file"
                                          accept=".csv"
                                          onChange={handleFileInputChange}
                                          className="hidden"
                                        />

                                        {/* Show selected file name */}
                                        {csvFile && (
                                          <p className="mt-4 text-sm text-gray-600">{csvFile.name}</p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Sample CSV Section */}
                                    <div className="w-full max-w-2xl mt-6">
                                      <p className="text-sm text-gray-900 mb-3">
                                        For help formatting your list, download the sample CSV.
                                      </p>
                                      <button
                                        onClick={downloadSampleCsv}
                                        className="inline-flex items-center font-semibold gap-2 px-4 py-2 border border-gray-300 rounded-sm bg-white text-gray-900 hover:bg-gray-50 transition-colors"
                                      >
                                        <ArrowDownToLine className="w-4 h-4" />
                                        <span>Sample CSV</span>
                                      </button>
                                    </div>

                                    {/* Footer - Enter Manually Instead Button */}
                                    <div className="absolute bottom-6 right-6 flex items-center gap-3">
                                      {csvFile && bulkRows.length > 0 && !showCsvExceptions && (
                                        <button
                                          onClick={applyCsvRecipients}
                                          className="px-6 py-2 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                                          style={{ backgroundColor: '#3E2B66' }}
                                        >
                                          Save
                                        </button>
                                      )}
                                      <button
                                        onClick={() => {
                                          setBulkMethod('manual');
                                          setCsvFile(null);
                                          setBulkRows([
                                            { id: `row_${Date.now()}`, name: '', email: '' },
                                            { id: `row_${Date.now() + 1}`, name: '', email: '' },
                                            { id: `row_${Date.now() + 2}`, name: '', email: '' },
                                          ]);
                                        }}
                                        className="px-4 py-2 bg-gray-100 text-gray-900 rounded-sm hover:bg-gray-200 transition-colors" style={{ fontFamily: 'sans-serif' }}
                                      >
                                        Enter Manually Instead
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Recipients Editor - Shows after accepting CSV */}
                            {showRecipientsEditor && csvHeaders.length > 0 && (
                              <>

                                <div className="relative flex flex-col mt-19 max-w-7xl mx-auto min-h-[80vh]">
                                  {/* Recipients Heading */}
                                  <div className="mb-6">
                                    <h3 className="text-[28px] text-[#3E2B66] mb-1" style={{ fontFamily: 'sans-serif', fontWeight: '0' }}>Recipients</h3>
                                  </div>

                                  {/* Error Banner */}
                                  {showErrorBanner && getRecipientsWithErrors().length > 0 && (
                                    <div className="mb-6 bg-gray-100 rounded-lg p-4 flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <Info className="w-5 h-5 text-gray-600" />
                                        <span className="text-sm text-gray-700">There are errors in your bulk list.</span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <button className="text-sm text-blue-600 hover:text-blue-700 underline">
                                          Learn More
                                        </button>
                                        <button
                                          onClick={() => setShowErrorBanner(false)}
                                          className="text-gray-600 hover:text-gray-800"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Tabs */}
                                  <div className="flex gap-6 mb-6 border-b border-gray-200">
                                    <button
                                      onClick={() => setActiveTab('all')}
                                      className={`pb-2 px-1 text-sm font-medium ${activeTab === 'all'
                                        ? 'text-gray-900 border-b-2 border-gray-900'
                                        : 'text-gray-500'
                                        }`}
                                    >
                                      All Recipients ({csvRecipientsData.length})
                                    </button>
                                    <button
                                      onClick={() => setActiveTab('errors')}
                                      className={`pb-2 px-1 text-sm font-medium ${activeTab === 'errors'
                                        ? 'text-gray-900 border-b-2 border-gray-900'
                                        : 'text-gray-500'
                                        }`}
                                    >
                                      Errors ({getRecipientsWithErrors().length})
                                    </button>
                                  </div>

                                  {/* Recipients Table/Form - Horizontal Scrollable */}
                                  <div className="max-h-[100px] overflow-x-auto overflow-y-auto">
                                    <div className="inline-block min-w-full">
                                      {/* Header Row */}
                                      <div className="flex gap-4 pb-2 border-b border-gray-200 mb-2" >
                                        <div className="w-8 flex-shrink-0"></div>
                                        {csvHeaders.map((header, headerIdx) => {
                                          const emailHeader = csvHeaders.find(h => h.toLowerCase().includes('email'));
                                          const nameHeader = csvHeaders.find(h => h.toLowerCase().includes('name') && !h.toLowerCase().includes('email'));
                                          const isRequired = header === emailHeader || header === nameHeader;
                                          return (
                                            <div key={headerIdx} className="flex-shrink-0 w-64">
                                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                                {header}
                                                {isRequired && <span className="text-red-500 ml-1">*</span>}
                                              </label>
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {/* Data Rows */}
                                      <div className="space-y-4">
                                        {(csvRecipientsData.length > 0 ? csvRecipientsData : [csvHeaders.reduce((acc, h) => ({ ...acc, [h]: '' }), {} as Record<string, string>)])
                                          .filter((recipient) => {
                                            if (activeTab === 'errors') {
                                              const validation = validateRecipient(recipient, csvHeaders);
                                              return validation.hasErrors;
                                            }
                                            return true;
                                          })
                                          .map((recipient, displayIdx) => {
                                            const actualIdx = csvRecipientsData.findIndex(r => r === recipient);
                                            const validation = validateRecipient(recipient, csvHeaders);
                                            const isEmptyRow = csvRecipientsData.length === 0 && displayIdx === 0;

                                            return (
                                              <div key={displayIdx} className="flex gap-4 items-start" style={{ minWidth: 'max-content' }}>

                                                {/* Input fields in one row */}
                                                {csvHeaders.map((header, headerIdx) => {
                                                  const hasError = validation.errors[header];

                                                  return (
                                                    <div key={headerIdx} className="flex-shrink-0 w-64">
                                                      <div className="relative">
                                                        <input
                                                          type="text"
                                                          value={(recipient as Record<string, string>)[header] || ''}
                                                          onChange={(e) => {
                                                            if (isEmptyRow && csvRecipientsData.length === 0) {
                                                              // Create first row if it doesn't exist
                                                              const newRow: Record<string, string> = {};
                                                              csvHeaders.forEach(h => {
                                                                newRow[h] = h === header ? e.target.value : '';
                                                              });
                                                              setCsvRecipientsData([newRow]);
                                                            } else {
                                                              updateRecipientField(actualIdx >= 0 ? actualIdx : 0, header, e.target.value);
                                                            }
                                                          }}
                                                          className={`w-full px-3 py-2 text-sm border rounded ${hasError
                                                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                                            } focus:outline-none focus:ring-1`}
                                                          placeholder={header}
                                                        />
                                                      </div>
                                                      {hasError && (
                                                        <p className="text-xs text-red-600 mt-1">{validation.errors[header]}</p>
                                                      )}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            );
                                          })}
                                      </div>
                                    </div>
                                  </div>
                                  {/* Footer Buttons */}

                                </div>
                                <div className="absolute bottom-6 right-6 flex items-center justify-end gap-3">
                                  <button onClick={handleBackToUpload} className="px-4 py-2 bg-white border border-gray-300 rounded-sm text-gray-900 hover:bg-gray-50">
                                    Back to Upload
                                  </button>
                                  <button onClick={handleSaveRecipients} className="px-6 py-2 bg-[#3E2B66] text-white rounded-sm font-medium hover:opacity-90">
                                    Save
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                      {showSigningOrder && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center">
                          <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
                            onClick={() => setShowSigningOrder(false)}
                          />

                          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-4">
                            <button
                              onClick={() => setShowSigningOrder(false)}
                              className="absolute right-6 top-6 text-2xl text-[#3E2B66] hover:text-gray-800"
                            >
                              <X className="w-4 h-4" />
                            </button>

                            <h2 className="text-[20px] font-semibold text-[#3E2B66] mb-6">Signing Order Diagram</h2>

                            {(() => {
                              const getInitials = (name?: string, email?: string) => {
                                const src = (name && name.trim().length > 0 ? name : (email || '')) as string;
                                const chars = (src.match(/\b\w/g) || []).slice(0, 2).join('').toUpperCase();
                                return chars || <PenLine className='w-4 h-4' />;
                              };

                              const formatSentenceCase = (text: string) => {
                                if (!text) return text;
                                return text
                                  .toLowerCase()
                                  .split(' ')
                                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                  .join(' ');
                              };

                              // If CSV list exists, render based on signing order toggle
                              if (csvRecipientList && (csvRecipientList.items || []).length > 0) {
                                const items = csvRecipientList.items;

                                if (!setSigningOrder) {
                                  // Parallel row (all recipients at step 1)
                                  return (
                                    <div className="grid grid-cols-12 gap-6">
                                      <div className="col-span-4 text-sm text-gray-600">
                                        <div className="h-20 flex items-center font-semibold">SENDER</div>
                                        <div className="h-24 flex items-center">1</div>
                                        <div className="h-20 flex items-center font-semibold">COMPLETED</div>
                                      </div>
                                      <div className="col-span-8 relative">
                                        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gray-300 z-0" />
                                        {/* Sender */}
                                        <div className="relative h-20 flex justify-center items-center z-10">
                                          <div className="absolute left-6 right-6 bottom-0 border-t border-dashed border-gray-300 z-0" />
                                          <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center font-semibold text-[#3E2B66] z-20">
                                            {(((user?.fullname || user?.email || '?') as string).match(/\b\w/g) || []).slice(0, 2).join('').toUpperCase()}
                                          </div>
                                        </div>
                                        {/* Grouped participants */}
                                        <div className="relative h-24 flex justify-center items-center z-10">
                                          <div className="absolute left-6 right-6 bottom-0 border-t border-dashed border-gray-300 z-0" />
                                          <div className="px-4 py-2 border rounded-lg bg-white z-20 flex flex-wrap items-center justify-center gap-4">
                                            {items.map((it, idx) => (
                                              <div key={`g-${idx}`} className="flex flex-col items-center gap-1">
                                                <div className="w-14 h-14 rounded-full bg-cyan-100 flex items-center justify-center font-semibold text-[#3E2B66]">
                                                  {getInitials(it.name, it.email)}
                                                </div>
                                                <div className="text-xs font-medium text-[#3E2B66] text-center px-2 max-w-[80px] truncate">
                                                  {formatSentenceCase(it.name || it.email || 'Unnamed')}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                        {/* Completed */}
                                        <div className="relative h-20 flex justify-center items-center z-10">
                                          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-[#3E2B66] z-20">✓</div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }

                                // Sequential order (R1 -> R2 -> ...)
                                const ordered = items.map((it, idx) => ({ 
                                  key: `csv-${idx}`, 
                                  order: idx + 1,
                                  name: formatSentenceCase(it.name || it.email || 'Unnamed'),
                                  email: it.email
                                }));
                                return (
                                  <div className="grid grid-cols-12 gap-6">
                                    <div className="col-span-4 text-sm text-gray-600">
                                      <div className="h-20 flex items-center font-semibold">SENDER</div>
                                      {ordered.map((p) => (
                                        <div key={`lbl-${p.key}`} className="h-24 flex items-center">
                                          <span className="font-bold">{p.order}.</span> {p.name}
                                        </div>
                                      ))}
                                      <div className="h-20 flex items-center font-semibold">COMPLETED</div>
                                    </div>
                                    <div className="col-span-8 relative">
                                      <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gray-300 z-0" />
                                      {/* Sender */}
                                      <div className="relative h-20 flex justify-center items-center z-10">
                                        <div className="absolute left-6 right-6 bottom-0 border-t border-dashed border-gray-300 z-0" />
                                        <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center font-semibold text-[#3E2B66] z-20">
                                          {(((user?.fullname || user?.email || '?') as string).match(/\b\w/g) || []).slice(0, 2).join('').toUpperCase()}
                                        </div>
                                      </div>
                                      {ordered.map((p) => (
                                        <div key={p.key} className="relative h-24 flex justify-center items-center z-10">
                                          <div className="absolute left-6 right-6 bottom-0 border-t border-dashed border-gray-300 z-0" />
                                          <div className="w-14 h-14 rounded-full bg-cyan-100 flex items-center justify-center font-semibold text-[#3E2B66] z-20">
                                            {getInitials(p.name, p.email)}
                                          </div>
                                        </div>
                                      ))}
                                      {/* Completed */}
                                      <div className="relative h-20 flex justify-center items-center z-10">
                                        <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-[#3E2B66] z-20">✓</div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }

                              // Default (non-CSV) path using recipients
                              const sortedRecipients = [...recipients].sort((a, b) => (a.order || 0) - (b.order || 0));
                              const ordered = sortedRecipients.map((r) => ({
                                key: r.id,
                                order: r.order || 0,
                                name: formatSentenceCase(r.name || r.email || 'Unnamed'),
                                email: r.email
                              }));

                              return (
                                <div className="grid grid-cols-12 gap-6">
                                  <div className="col-span-4 text-sm text-gray-600">
                                    <div className="h-20 flex items-center font-semibold">SENDER</div>
                                    {ordered.map((p) => (
                                      <div key={`lbl-${p.key}`} className="h-24 flex items-center">
                                        <span className="font-bold">{p.order}.</span> {p.name}
                                      </div>
                                    ))}
                                    <div className="h-20 flex items-center font-semibold">COMPLETED</div>
                                  </div>
                                  <div className="col-span-8 relative">
                                    <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gray-300 z-0" />
                                    <div className="relative h-20 flex justify-center items-center z-10">
                                      <div className="absolute left-6 right-6 bottom-0 border-t border-dashed border-gray-300 z-0" />
                                      <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center font-semibold text-[#3E2B66] z-20">
                                        {(((user?.fullname || user?.email || '?') as string).match(/\b\w/g) || []).slice(0, 2).join('').toUpperCase()}
                                      </div>
                                    </div>
                                    {ordered.map((p) => (
                                      <div key={p.key} className="relative h-24 flex justify-center items-center z-10">
                                        <div className="absolute left-6 right-6 bottom-0 border-t border-dashed border-gray-300 z-0" />
                                        <div className="w-14 h-14 rounded-full bg-cyan-100 flex items-center justify-center font-semibold text-[#3E2B66] z-20">
                                          {getInitials(p.name, p.email)}
                                        </div>
                                      </div>
                                    ))}
                                    <div className="relative h-20 flex justify-center items-center z-10">
                                      <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-[#3E2B66] z-20">✓</div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                            <div className="mt-10 text-right">
                              <button
                                onClick={() => setShowSigningOrder(false)}
                                className="border border-[#3E2B66] text-[#3E2B66] px-5 py-2 rounded-md"
                              >
                                Close
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Authentication Method Selection Modal */}
                      {showAuthModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center">
                          <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
                            onClick={() => {
                              setShowAuthModal(false);
                              setAuthModalForRecipientId(null);
                              setAuthModalForBulk(false);
                            }}
                          />
                          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
                            <div className="flex items-center justify-between mb-6">
                              <h2 className="text-[20px] font-semibold text-[#3E2B66]">
                                Select Authentication Method
                              </h2>
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => {
                                    const methodToSave = tempAuthSelection === undefined ? null : tempAuthSelection;
                                    handleAuthMethodSelect(methodToSave);
                                  }}
                                  className="px-5 py-2 bg-[#3E2B66] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setShowAuthModal(false);
                                    setAuthModalForRecipientId(null);
                                    setAuthModalForBulk(false);
                                    setTempAuthSelection(undefined);
                    setHasUserChangedSelection(false);
                                  }}
                                  className="text-[#3E2B66] hover:text-gray-800 z-10"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                            <div className="mt-8">
                              <AdvancedAuthenticationSelector
                                selectedMethods={(() => {
                                  // If user has made a change, always use tempAuthSelection
                                  if (hasUserChangedSelection) {
                                    return tempAuthSelection || [];
                                  }
                                  // Otherwise, use the current recipient's authentication
                                  if (authModalForBulk) {
                                    // For bulk, check if all recipients have the same authentication
                                    const firstAuth = recipients.length > 0 ? recipients[0]?.authentication : null;
                                    if (!firstAuth) return [];
                                    const firstAuthArray = parseAuthentication(firstAuth);
                                    const allSame = recipients.every(r => {
                                      const rAuth = parseAuthentication(r.authentication);
                                      return JSON.stringify(rAuth.sort()) === JSON.stringify(firstAuthArray.sort());
                                    });
                                    return allSame ? firstAuthArray : [];
                                  } else if (authModalForRecipientId) {
                                    // For individual recipient, get their authentication
                                    const recipient = recipients.find(r => r.id === authModalForRecipientId);
                                    return parseAuthentication(recipient?.authentication);
                                  }
                                  return [];
                                })()}
                                onMethodSelect={handleAuthMethodSelect}
                                onSelectionChange={(methodIds) => {
                                  setTempAuthSelection(methodIds);
                                  setHasUserChangedSelection(true);
                                }}
                                showSaveButton={false}
                                riskLevel="medium"
                                complianceRequirements={[]}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Bulk list summary card (hidden when CSV list exists) */}
                      {bulkList && !csvRecipientList && (
                        <div>
                          <div className="flex items-stretch gap-4">
                            {setSigningOrder && (
                              <div className="w-16">
                                <div className="w-full h-10 border rounded-sm flex items-center justify-center">1</div>
                              </div>
                            )}

                            <div className="flex-1 bg-white border border-gray-200 shadow-sm relative" style={{ borderLeft: '7px solid #86e4ef' }}>
                              <div className="p-6">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-xs uppercase text-gray-500 tracking-wide">{bulkList.role}</div>
                                    <div className="mt-2 text-base text-gray-900 font-medium">Bulk Recipient</div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="relative" ref={bulkRoleRef as any}>
                                      <button type="button" onMouseDown={(e) => e.stopPropagation()} onClick={() => setBulkRoleDropdownOpen(prev => !prev)} className="px-4 py-2 bg-gray-100 text-black-700 rounded-sm border border-gray-300 flex items-center gap-2">
                                        <PenLine className="w-4 h-4 " />
                                        <span className="text-sm">{bulkList.role === 'signer' ? 'Needs to Sign' : bulkList.role === 'in_person_signer' ? 'In Person Signer' : bulkList.role === 'carbon_copy' ? 'Receives a Copy' : bulkList.role === 'approver' ? 'Approver' : 'Needs to View'}</span>
                                        <ChevronDown className="w-4 h-4" />
                                      </button>
                                      {bulkRoleDropdownOpen && (
                                        <div onMouseDown={(e) => e.stopPropagation()} className="absolute right-0 top-full mt-1 w-52 bg-white rounded-sm border border-gray-200 shadow-lg z-50">
                                          <div className="py-2 text-sm text-gray-800">
                                            <button type="button" onClick={() => { setBulkList(prev => prev ? { ...prev, role: 'signer' } : prev); setBulkRoleDropdownOpen(false); }} className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-50">
                                              <PenLine className="w-4 h-4" />
                                              <span>Needs to Sign</span>
                                            </button>
                                            <button type="button" onClick={() => { setBulkList(prev => prev ? { ...prev, role: 'carbon_copy' } : prev); setBulkRoleDropdownOpen(false); }} className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-50">
                                              <span className="text-xs font-semibold">CC</span>
                                              <span>Receives a Copy</span>
                                            </button>
                                            <button type="button" onClick={() => { setBulkList(prev => prev ? { ...prev, role: 'needs_to_view' } : prev); setBulkRoleDropdownOpen(false); }} className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-50">
                                              <Eye className="w-4 h-4" />
                                              <span>Needs to View</span>
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="relative" ref={bulkCustomizeRef as any}>
                                      <button type="button" onMouseDown={(e) => e.stopPropagation()} onClick={() => setBulkCustomizeOpen(prev => !prev)} className="px-4 py-2 bg-gray-100 text-black-700 rounded-sm border border-gray-300 flex items-center gap-2">
                                        <span className="text-sm font-bold">Customize</span>
                                        <ChevronDown className="w-4 h-4" />
                                      </button>
                                      {bulkCustomizeOpen && (
                                        <div onMouseDown={(e) => e.stopPropagation()} className="absolute right-0 top-full mt-1 w-80 bg-white rounded-sm border border-gray-200 shadow-lg z-50">
                                          <div className="py-2">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setBulkCustomizeOpen(false);
                                                setAuthModalForBulk(true);
                                                setAuthModalForRecipientId(null);
                                                setShowAuthModal(true);
                                              }}
                                              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100"
                                            >
                                              <div className="flex items-start gap-3">
                                                <Key className="w-5 h-5 text-gray-600 mt-0.5" />
                                                <div>
                                                  <div className="font-medium text-gray-900">Add authentication method</div>
                                                  <div className="text-xs text-gray-500 mt-1">Select an authentication method for this recipient.</div>
                                                </div>
                                              </div>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setBulkCustomizeOpen(false);
                                                setOpenBulkPrivate(true);
                                              }}
                                              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                                            >
                                              <div className="flex items-start gap-3">
                                                <MessageSquare className="w-5 h-5 text-gray-600 mt-0.5" />
                                                <div>
                                                  <div className="font-medium text-gray-900">Add private message</div>
                                                  <div className="text-xs text-gray-500 mt-1">Include a personal note with this recipient.</div>
                                                </div>
                                              </div>
                                            </button>
                                            {bulkAccessCode && (
                                              <div className="px-4 py-2 text-xs text-gray-600">Access code set</div>
                                            )}
                                            {bulkPrivateMessage && (
                                              <div className="px-4 py-2 text-xs text-gray-600">Private message set</div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Bulk Access Code Panel */}
                          {openBulkAccess && (
                            <div className="shadow-lg border-gray-200 bg-gray-100 relative">
                              <div className="absolute top-0 bottom-0" style={{ left: '-2px', width: 7 }}></div>
                              <div className="flex items-center justify-between px-4 pt-4">
                                <h5 className="text-lg text-gray-900">Access Code</h5>
                                <div className="flex items-center gap-2">
                                  <button
                                    title="Remove access code"
                                    onClick={() => { setBulkAccessCode(undefined); setOpenBulkAccess(false); }}
                                    className="p-2 rounded hover:bg-gray-100"
                                  >
                                    <Trash2 className="w-4 h-4 text-[#2C2441]" />
                                  </button>
                                  <button
                                    title="Collapse"
                                    onClick={() => setOpenBulkAccess(false)}
                                    className="p-2 rounded hover:bg-gray-100"
                                  >
                                    <ChevronUp className="w-4 h-4 text-[#2C2441]" />
                                  </button>
                                </div>
                              </div>
                              <div className="px-4 pb-4">
                                <div className="mt-2">
                                  <input
                                    type="text"
                                    value={bulkAccessCode || ''}
                                    onChange={(e) => setBulkAccessCode(e.target.value)}
                                    placeholder="Enter access code"
                                    className="w-100 px-4 py-2 border border-gray-300 bg-white rounded-sm "
                                  />
                                </div>
                                <div className="mt-3 text-gray-600 text-sm space-y-1">
                                  <p>Codes are not case-sensitive.</p>
                                  <p>You must provide this code to the signer.</p>
                                  <p className="text-gray-500">This code is available for you to review on the Envelope Details page.</p>
                                </div>
                              </div>
                            </div>
                          )}
                          {/* Bulk Private Message Panel */}
                          {openBulkPrivate && (
                            <div className="shadow-lg border-gray-200 bg-gray-100 relative">
                              <div className="absolute top-0 bottom-0" style={{ left: '-2px', width: 7 }}></div>
                              <div className="flex items-center justify-between px-4 pt-4">
                                <h5 className="text-lg text-gray-900">Private Message</h5>
                                <div className="flex items-center gap-2">
                                  <button
                                    title="Remove private message"
                                    onClick={() => { setBulkPrivateMessage(undefined); setOpenBulkPrivate(false); }}
                                    className="p-2 rounded hover:bg-gray-100"
                                  >
                                    <Trash2 className="w-6 h-6 text-[#2C2441]" />
                                  </button>
                                  <button
                                    title="Collapse"
                                    onClick={() => setOpenBulkPrivate(false)}
                                    className="p-2 rounded hover:bg-gray-100"
                                  >
                                    <ChevronUp className="w-5 h-5 text-[#2C2441]" />
                                  </button>
                                </div>
                              </div>
                              <div className="px-4 pb-4">
                                <div className="mt-2">
                                  <textarea
                                    value={bulkPrivateMessage || ''}
                                    onChange={(e) => setBulkPrivateMessage(e.target.value)}
                                    placeholder="Write a private message for all bulk recipients"
                                    className="w-full px-4 py-2 border border-gray-300 bg-white rounded-sm"
                                    rows={3}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* CSV role cards: one per CSV recipient */}
                      {csvRecipientList && csvRecipientList.items && csvRecipientList.items.length > 0 && (
                        <div className="space-y-4">
                          {csvRecipientList.items.map((_, idx) => (
                            <div key={`csv-role-${idx}`} className="flex items-stretch gap-4">
                              {setSigningOrder && (
                                <div className="w-16">
                                  <div className="w-full h-10 border rounded-sm flex items-center justify-center">{idx + 1}</div>
                                </div>
                              )}
                              <div className="flex-1 bg-white border border-gray-200 shadow-sm relative" style={{ borderLeft: '7px solid #86e4ef' }}>
                                <div className="p-6">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-xs uppercase text-gray-500 tracking-wide">ROLE {idx + 1}</div>
                                      <div className="mt-2 text-base text-gray-900 font-medium">Bulk Recipient</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="relative">
                                        <button type="button" onClick={() => setCsvRoleDropdownOpen(prev => !prev)} className="px-4 py-2 bg-gray-100 text-black-700 rounded-sm border border-gray-300 flex items-center gap-2">
                                          <PenLine className="w-4 h-4" />
                                          <span className="text-sm">Needs to Sign</span>
                                          <ChevronDown className="w-4 h-4" />
                                        </button>
                                        {csvRoleDropdownOpen && (
                                          <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-sm border border-gray-200 shadow-lg z-50">
                                            <div className="py-2 text-sm text-gray-800">
                                              <button type="button" onClick={() => { setCsvRoleDropdownOpen(false); }} className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-50">
                                                <PenLine className="w-4 h-4" />
                                                <span>Needs to Sign</span>
                                              </button>
                                              <button type="button" onClick={() => { setCsvRoleDropdownOpen(false); }} className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-50">
                                                <span className="text-xs font-semibold">CC</span>
                                                <span>Receives a Copy</span>
                                              </button>
                                              <button type="button" onClick={() => { setCsvRoleDropdownOpen(false); }} className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-50">
                                                <Eye className="w-4 h-4" />
                                                <span>Needs to View</span>
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      <div className="relative">
                                        <button type="button" onClick={() => setCsvCustomizeOpen(prev => !prev)} className="px-4 py-2 bg-gray-100 text-black-700 rounded-sm border border-gray-300 flex items-center gap-2">
                                          <span className="text-sm font-bold">Customize</span>
                                          <ChevronDown className="w-4 h-4" />
                                        </button>
                                        {csvCustomizeOpen && (
                                          <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-sm border border-gray-200 shadow-lg z-50">
                                            <div className="py-2">
                                              <button type="button" onClick={() => { setCsvCustomizeOpen(false); setAuthModalForBulk(true); setAuthModalForRecipientId(null); setShowAuthModal(true); }} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100">
                                                <div className="flex items-start gap-3">
                                                  <Key className="w-5 h-5 text-gray-600 mt-0.5" />
                                                  <div>
                                                    <div className="font-medium text-gray-900">Add authentication method</div>
                                                    <div className="text-xs text-gray-500 mt-1">Select an authentication method for this recipient.</div>
                                                  </div>
                                                </div>
                                              </button>
                                              <button type="button" onClick={() => { setCsvCustomizeOpen(false); setOpenCsvPrivate(true); }} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors">
                                                <div className="flex items-start gap-3">
                                                  <MessageSquare className="w-5 h-5 text-gray-600 mt-0.5" />
                                                  <div>
                                                    <div className="font-medium text-gray-900">Add private message</div>
                                                    <div className="text-xs text-gray-500 mt-1">Include a personal note with this recipient.</div>
                                                  </div>
                                                </div>
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}


                      {/* Show existing recipients even if CSV exists so Add Recipient works */}
                      {recipients?.length > 0 && (() => {
                        // Sort recipients by order before displaying
                        const sortedRecipients = [...recipients].sort((a, b) => {
                          const orderA = a.order || 0;
                          const orderB = b.order || 0;
                          return orderA - orderB;
                        });

                        // Determine if we should use pill/card mode (when more than 3 recipients)
                        const usePillMode = sortedRecipients.length > 3;

                        return (
                          <div className="space-y-4 transition-all duration-500 ease-in-out">
                            {/* Pills row - show when in pill mode and there are inactive recipients */}
                            {usePillMode && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {sortedRecipients
                                  .filter(r => r.id !== activeRecipientId)
                                  .map((recipient, index) => {
                                    const base = bulkList ? 1 : 0;
                                    const displayOrder = (recipient.order || (index + 1 + base));
                                    const originalIndex = recipients.findIndex(r => r.id === recipient.id);
                                    const isDraggingPill = draggedRecipientId === recipient.id;
                                    const isDragOverPill = dragOverRecipientId === recipient.id;
                                    const isReorderedPill = reorderedPillIds.has(recipient.id);
                                    return (
                                      <button
                                        key={recipient.id}
                                        type="button"
                                        onClick={() => setActiveRecipientId(recipient.id)}
                                        draggable
                                        title="Drag to reorder"
                                        onDragStart={(e) => {
                                          setDraggedRecipientId(recipient.id);
                                          e.dataTransfer.effectAllowed = 'move';
                                          e.dataTransfer.setData('text/plain', recipient.id);
                                          e.dataTransfer.setDragImage(new Image(), 0, 0);
                                        }}
                                        onDragOver={(e) => {
                                          if (draggedRecipientId && draggedRecipientId !== recipient.id) {
                                            e.preventDefault();
                                            e.dataTransfer.dropEffect = 'move';
                                            setDragOverRecipientId(recipient.id);
                                          }
                                        }}
                                        onDragLeave={() => {
                                          if (dragOverRecipientId === recipient.id) {
                                            setDragOverRecipientId(null);
                                          }
                                        }}
                                        onDrop={(e) => {
                                          e.preventDefault();
                                          if (draggedRecipientId && draggedRecipientId !== recipient.id) {
                                            // Trigger reorder animation for both pills
                                            setReorderedPillIds(prev => new Set([...prev, draggedRecipientId, recipient.id]));
                                            
                                            // Remove animation class after animation completes
                                            setTimeout(() => {
                                              setReorderedPillIds(prev => {
                                                const next = new Set(prev);
                                                next.delete(draggedRecipientId);
                                                next.delete(recipient.id);
                                                return next;
                                              });
                                            }, 600); // Match animation duration
                                            
                                            // Reorder recipients
                                            setRecipients(prev => {
                                              const draggedRecipient = prev.find(r => r.id === draggedRecipientId);
                                              const targetRecipient = prev.find(r => r.id === recipient.id);
                                              
                                              if (!draggedRecipient || !targetRecipient) return prev;

                                              const draggedOrder = draggedRecipient.order || prev.findIndex(r => r.id === draggedRecipientId) + 1;
                                              const targetOrder = targetRecipient.order || prev.findIndex(r => r.id === recipient.id) + 1;

                                              // Swap orders
                                              const updated = prev.map(r => {
                                                if (r.id === draggedRecipientId) {
                                                  return { ...r, order: targetOrder };
                                                }
                                                if (r.id === recipient.id) {
                                                  return { ...r, order: draggedOrder };
                                                }
                                                return r;
                                              });

                                              // Normalize orders to ensure they're sequential
                                              const normalized = normalizeOrders(updated);
                                              
                                              // Save order to backend if envelope exists
                                              if (envelopeId) {
                                                const recipientPayload = normalized.map(r => ({
                                                  id: r.id,
                                                  name: r.name,
                                                  email: r.email,
                                                  role: r.role,
                                                  order: r.order,
                                                  authentication: r.authentication
                                                }));
                                                eSignApi.post('/api/e-sign/update-envelope', {
                                                  envelopeId,
                                                  envelopeData: { recipients: recipientPayload }
                                                }).catch(err => console.error('Failed to update recipient order:', err));
                                              }
                                              
                                              return normalized;
                                            });
                                          }
                                          setDraggedRecipientId(null);
                                          setDragOverRecipientId(null);
                                        }}
                                        onDragEnd={() => {
                                          setDraggedRecipientId(null);
                                          setDragOverRecipientId(null);
                                        }}
                                        className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full hover:border-purple-500 hover:bg-purple-50 transition-all duration-300 shadow-sm cursor-grab active:cursor-grabbing ${
                                          isDraggingPill 
                                            ? 'opacity-60 scale-110 rotate-2 shadow-xl z-50 border-purple-500 bg-purple-100' 
                                            : ''
                                        } ${
                                          isDragOverPill 
                                            ? 'border-purple-600 scale-110 shadow-lg ring-2 ring-purple-300 ring-opacity-50 bg-purple-50' 
                                            : ''
                                        } ${
                                          isReorderedPill 
                                            ? 'animate-reorder-pill' 
                                            : ''
                                        }`}
                                        style={{
                                          borderLeft: `4px solid ${RECIPIENT_COLORS[originalIndex % RECIPIENT_COLORS.length]}`,
                                          transform: isReorderedPill ? undefined : (isDraggingPill ? 'scale(1.1) rotate(2deg)' : isDragOverPill ? 'scale(1.1)' : undefined),
                                          zIndex: isDraggingPill ? 50 : isReorderedPill ? 40 : undefined
                                        }}
                                      >
                                        <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <span className="text-sm font-medium text-gray-600">{displayOrder}.</span>
                                        <span className="text-sm font-medium text-gray-900">
                                          {recipient.name || 'Unnamed Recipient'}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {recipient.email || 'No email'}
                                        </span>
                                      </button>
                                    );
                                  })}
                              </div>
                            )}
                            
                            {sortedRecipients.map((recipient, index) => {
                              // In pill mode, only show the active recipient as a card
                              if (usePillMode && recipient.id !== activeRecipientId) {
                                return null;
                              }
                              const base = bulkList ? 1 : 0;
                              const displayOrder = (recipient.order || (index + 1 + base));
                              const isDragging = draggedRecipientId === recipient.id;
                              const isDragOver = dragOverRecipientId === recipient.id;
                              const isThisReordering = reorderingRecipientId === recipient.id;
                              const originalIndex = recipients.findIndex(r => r.id === recipient.id);
                              
                              return (
                                <div 
                                  key={recipient.id} 
                                  className={`flex items-stretch gap-4 transition-all duration-500 ease-in-out ${
                                    isDragging ? 'opacity-50 scale-95' : ''
                                  } ${isDragOver ? 'transform translate-y-1' : ''} ${
                                    isThisReordering ? 'transform transition-all duration-500 ease-in-out' : ''
                                  }`}
                                  draggable={setSigningOrder}
                                  title={setSigningOrder ? "Drag to reorder" : undefined}
                                  onDragStart={(e) => handleRecipientDragStart(e, recipient.id)}
                                  onDragOver={(e) => handleRecipientDragOver(e, recipient.id)}
                                  onDragLeave={handleRecipientDragLeave}
                                  onDrop={(e) => handleRecipientDrop(e, recipient.id)}
                                  onDragEnd={handleRecipientDragEnd}
                                  style={{
                                    cursor: setSigningOrder ? (isDragging ? 'grabbing' : 'grab') : 'default',
                                    userSelect: 'none',
                                    transition: isThisReordering ? 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'opacity 0.2s, transform 0.2s'
                                  }}
                                >
                                  {setSigningOrder && (
                                    <div className="w-16 flex flex-col items-center justify-center">
                                      <input
                                        type="number"
                                        min={1}
                                        max={recipients.length}
                                        value={tempOrderValues[recipient.id] !== undefined ? tempOrderValues[recipient.id] : displayOrder}
                                        onChange={(e) => {
                                          const newOrder = Number(e.target.value || 1);
                                          // Store in temp values, don't apply yet
                                          setTempOrderValues(prev => ({
                                            ...prev,
                                            [recipient.id]: newOrder
                                          }));
                                        }}
                                        onKeyDown={(e) => handleOrderKeyDown(e, recipient.id)}
                                        onBlur={() => {
                                          // On blur, apply the change if temp value exists
                                          const tempValue = tempOrderValues[recipient.id];
                                          if (tempValue !== undefined) {
                                            handleOrderChange(recipient.id, tempValue);
                                          }
                                        }}
                                        onDragStart={(e) => e.stopPropagation()}
                                        draggable="false"
                                        className="w-full h-10 border rounded-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder={displayOrder.toString()}
                                      />
                                      {setSigningOrder && (
                                        <div className="mt-1 text-gray-400 cursor-grab" title="Drag to reorder">
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                          </svg>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  <div 
                                    className={`flex-1 bg-white border shadow-sm relative transition-all duration-500 ease-in-out ${
                                      isDragOver ? 'border-blue-500 border-2 shadow-lg' : 'border-gray-200'
                                    } ${setSigningOrder ? 'cursor-grab active:cursor-grabbing' : ''} ${
                                      isThisReordering ? 'shadow-2xl scale-[1.02] z-20 ring-2 ring-blue-400 ring-opacity-50' : ''
                                    }`}
                                    style={{ 
                                      borderLeft: `7px solid ${RECIPIENT_COLORS[originalIndex % RECIPIENT_COLORS.length]}`,
                                      transition: isThisReordering ? 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease-in-out, transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'all 0.2s ease-in-out'
                                    }}
                                    onMouseDown={(e) => {
                                      // Prevent drag when clicking on inputs, buttons, or interactive elements
                                      const target = e.target as HTMLElement;
                                      if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'TEXTAREA' || target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('.role-dropdown-container') || target.closest('.customize-dropdown-container')) {
                                        e.stopPropagation();
                                      }
                                    }}
                                  >
                                  <div className="p-6">
                                    <div className="space-y-4">
                                      <div className="flex items-start gap-4">
                                        <div className="flex-1">
                                          <label className="block text-sm font-medium text-gray-900 mb-2">
                                            Name <span className="text-red-500">*</span>
                                          </label>
                                          <div
                                            className="relative"
                                            ref={(el) => {
                                              if (suggestionsOpenForId === recipient.id) {
                                                suggestionsContainerRef.current = el;
                                              }
                                            }}
                                          >
                                            <Contact className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#260559' }} />
                                            <input
                                              type="text"
                                              value={recipient.name}
                                              data-recipient-name-id={recipient.id}
                                              onChange={(e) => {
                                                const value = e.target.value;
                                                updateRecipient(recipient.id, { name: value });
                                                // Update search query ref immediately
                                                searchQueryRef.current = value;
                                                // Debounce the search query update
                                                debouncedSearch(value);
                                                // Show suggestions if user is typing
                                                if (value.trim().length > 0) {
                                                  setSuggestionsOpenForId(recipient.id);
                                                  loadRecipientSuggestions();
                                                } else {
                                                  setDebouncedSearchQuery('');
                                                }
                                              }}
                                              onBlur={() => {
                                                // Close dropdown after a short delay to allow click on suggestion
                                                setTimeout(() => {
                                                  setSuggestionsOpenForId(null);
                                                }, 200);
                                              }}
                                              onFocus={() => { setSuggestionsOpenForId(recipient.id); loadRecipientSuggestions(); }}
                                              onDragStart={(e) => e.stopPropagation()}
                                              draggable="false"
                                              className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                                              placeholder="Full name"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => openRecipientListModal(recipient.id)}
                                              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded transition-colors"
                                              title="Open recipient list"
                                            >
                                              <BookOpen className="w-5 h-5" style={{ color: '#260559' }} />
                                            </button>
                                            {suggestionsOpenForId === recipient.id && (
                                              <div className="absolute z-20 top-full mt-1 w-full max-h-56 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg">
                                                {loadingRecipientSuggestions ? (
                                                  <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
                                                ) : (() => {
                                                  const currentName = recipient.name.trim();
                                                  
                                                  // If no input, show only logged-in user's name
                                                  if (!currentName) {
                                                    const userName = user?.fullname?.toLowerCase() || '';
                                                    const userSuggestion = recipientSuggestions.find(s => 
                                                      s.name.toLowerCase() === userName || 
                                                      s.email.toLowerCase() === (user?.email?.toLowerCase() || '')
                                                    );
                                                    if (userSuggestion) {
                                                      return (
                                                        <button
                                                          key={userSuggestion.email}
                                                          type="button"
                                                          onMouseDown={(e) => {
                                                            e.preventDefault(); // Prevent input blur
                                                            updateRecipient(recipient.id, { name: userSuggestion.name, email: userSuggestion.email || recipient.email });
                                                            setSuggestionsOpenForId(null);
                                                          }}
                                                          onClick={(e) => {
                                                            e.preventDefault();
                                                            updateRecipient(recipient.id, { name: userSuggestion.name, email: userSuggestion.email || recipient.email });
                                                            setSuggestionsOpenForId(null);
                                                          }}
                                                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                                                        >
                                                          <div className="font-medium text-gray-900">{userSuggestion.name || userSuggestion.email}</div>
                                                          <div className="text-xs text-gray-600">{userSuggestion.email}</div>
                                                        </button>
                                                      );
                                                    }
                                                    return <div className="px-3 py-2 text-sm text-gray-500">No suggestions</div>;
                                                  }
                                                  
                                                  // Use debounced search query for filtering (200-300ms debounce)
                                                  // If debounce hasn't fired yet, use current input for immediate feedback
                                                  const query = (debouncedSearchQuery.trim() || currentName).toLowerCase();
                                                  
                                                  if (!query) {
                                                    return <div className="px-3 py-2 text-sm text-gray-500">No suggestions</div>;
                                                  }
                                                  
                                                  // Exact matches: 
                                                  // 1. Whole string match (entire name or email equals query exactly)
                                                  // 2. Starts with query (name or email starts with the query - prefix match)
                                                  const exactMatches = recipientSuggestions.filter(s => {
                                                    const nameLower = s.name.trim().toLowerCase();
                                                    const emailLower = s.email.trim().toLowerCase();
                                                    
                                                    // Whole string exact match
                                                    const nameExact = nameLower === query;
                                                    const emailExact = emailLower === query;
                                                    
                                                    // Starts with query (prefix match) - this makes "sne" match "sneha"
                                                    const nameStartsWith = nameLower.startsWith(query);
                                                    const emailStartsWith = emailLower.startsWith(query);
                                                    
                                                    return nameExact || emailExact || nameStartsWith || emailStartsWith;
                                                  });
                                                  
                                                  // Broad matches: contains query anywhere (case-insensitive), excluding exact matches
                                                  // Examples: "ha" in "sneha", "gmail" in email addresses, etc.
                                                  const exactMatchEmails = new Set(exactMatches.map(s => s.email.toLowerCase()));
                                                  const broadMatches = recipientSuggestions.filter(s => {
                                                    // Skip if already in exact matches
                                                    if (exactMatchEmails.has(s.email.toLowerCase())) {
                                                      return false;
                                                    }
                                                    // Check if name or email contains the query anywhere
                                                    // Trim and lowercase for consistent matching
                                                    const nameLower = s.name.trim().toLowerCase();
                                                    const emailLower = s.email.trim().toLowerCase();
                                                    const nameContains = nameLower.includes(query);
                                                    const emailContains = emailLower.includes(query);
                                                    return nameContains || emailContains;
                                                  });
                                                  
                                                  // Render results
                                                  const hasExactMatches = exactMatches.length > 0;
                                                  const hasBroadMatches = broadMatches.length > 0;
                                                  
                                                  if (!hasExactMatches && !hasBroadMatches) {
                                                    return <div className="px-3 py-2 text-sm text-gray-500">No results found</div>;
                                                  }
                                                  
                                                  const renderSuggestion = (s: { name: string; email: string }) => (
                                                    <button
                                                      key={s.email}
                                                      type="button"
                                                      onMouseDown={(e) => {
                                                        e.preventDefault(); // Prevent input blur
                                                        updateRecipient(recipient.id, { name: s.name, email: s.email || recipient.email });
                                                        setSuggestionsOpenForId(null);
                                                      }}
                                                      onClick={(e) => {
                                                        e.preventDefault();
                                                        updateRecipient(recipient.id, { name: s.name, email: s.email || recipient.email });
                                                        setSuggestionsOpenForId(null);
                                                      }}
                                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                                                    >
                                                      <div className="font-medium text-gray-900">{s.name || s.email}</div>
                                                      <div className="text-xs text-gray-600">{s.email}</div>
                                                    </button>
                                                  );
                                                  
                                                  return (
                                                    <>
                                                      {/* Exact Matches Section */}
                                                      {hasExactMatches && (
                                                        <>
                                                          <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-200 sticky top-0">
                                                            Exact Matches
                                                          </div>
                                                          {exactMatches.map(renderSuggestion)}
                                                        </>
                                                      )}
                                                      
                                                      {/* No exact match message */}
                                                      {!hasExactMatches && (
                                                        <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
                                                          No exact match found
                                                        </div>
                                                      )}
                                                      
                                                      {/* Broad Matches Section */}
                                                      {hasBroadMatches && (
                                                        <>
                                                          <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-200 sticky top-0">
                                                            Broad Matches
                                                          </div>
                                                          {broadMatches.map(renderSuggestion)}
                                                        </>
                                                      )}
                                                    </>
                                                  );
                                                })()}
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {/* Needs to Sign Button - fixed width */}
                                        <div className="relative role-dropdown-container" style={{ width: '180px' }}>
                                          <label className="block text-sm font-bold text-gray-900 mb-2 invisible">Role</label>
                                          <button
                                            onClick={() => setOpenRoleDropdownId(openRoleDropdownId === recipient.id ? null : recipient.id)}
                                            className="w-full px-4 py-2 bg-gray-100 text-black-700 font-bold rounded-sm hover:bg-gray-200 transition-colors flex items-center justify-between border border-gray-300"
                                            style={{ height: '42px' }}
                                          >
                                            <div className="flex items-center gap-2">
                                              <PenLine className="w-4 h-4 font-bold text-black-700" />
                                              <span className="text-sm whitespace-nowrap">
                                                {recipient.role === 'signer' ? 'Needs to Sign' :
                                                  recipient.role === 'in_person_signer' ? 'In Person Signer' :
                                                    recipient.role === 'carbon_copy' ? 'Receives a Copy' :
                                                      'Needs to View'}
                                              </span>
                                            </div>
                                            <ChevronDown className="w-4 h-4 ml-2 mt-1 text-black-900 flex-shrink-0" />
                                          </button>

                                          {/* Role Dropdown Menu */}
                                          {openRoleDropdownId === recipient.id && (
                                            <div className="absolute right-0 top-full mt-1 w-50 bg-white rounded-sm border border-gray-200 shadow-lg z-50">
                                              <div className="py-2">

                                                {/* Option Template Example */}
                                                {/* Needs to Sign */}
                                                <button
                                                  onClick={() => {
                                                    updateRecipient(recipient.id, { role: "signer" });
                                                    setOpenRoleDropdownId(null);
                                                  }}
                                                  className="w-full px-4 py-2 text-xs flex items-center hover:bg-gray-50 text-gray-800 gap-3"
                                                >
                                                  {/* ✔ placeholder box */}
                                                  <span className="w-4 flex justify-center">
                                                    {recipient.role === "signer" && (
                                                      <Check className="w-4 h-4 text-purple-600" />
                                                    )}
                                                  </span>

                                                  {/* icon */}
                                                  <PenLine className="w-4 h-4" />

                                                  {/* text */}
                                                  <span>Needs to Sign</span>
                                                </button>

                                                {/* In Person Signer */}
                                                <button
                                                  onClick={() => {
                                                    updateRecipient(recipient.id, { role: "in_person_signer" });
                                                    setOpenRoleDropdownId(null);
                                                  }}
                                                  className="w-full px-4 py-2 text-xs flex items-center hover:bg-gray-50 text-gray-800 gap-3"
                                                >
                                                  <span className="w-4 flex justify-center">
                                                    {recipient.role === "in_person_signer" && (
                                                      <Check className="w-4 h-4 text-purple-600" />
                                                    )}
                                                  </span>

                                                  <User className="w-4 h-4" />
                                                  <span>In Person Signer</span>
                                                </button>

                                                {/* CC */}
                                                <button
                                                  onClick={() => {
                                                    updateRecipient(recipient.id, { role: "carbon_copy" });
                                                    setOpenRoleDropdownId(null);
                                                  }}
                                                  className="w-full px-4 py-2 text-xs flex items-center hover:bg-gray-50 text-gray-800 gap-3"
                                                >
                                                  <span className="w-4 flex justify-center">
                                                    {recipient.role === "carbon_copy" && (
                                                      <Check className="w-4 h-4 text-purple-600" />
                                                    )}
                                                  </span>

                                                  <span className="text-xs font-semibold">
                                                    CC
                                                  </span>
                                                  <span>Receives a Copy</span>
                                                </button>

                                                {/* Needs to View */}
                                                <button
                                                  onClick={() => {
                                                    updateRecipient(recipient.id, { role: "needs_to_view" });
                                                    setOpenRoleDropdownId(null);
                                                  }}
                                                  className="w-full px-4 py-2 text-xs flex items-center hover:bg-gray-50 text-gray-800 gap-3"
                                                >
                                                  <span className="w-4 flex justify-center">
                                                    {recipient.role === "needs_to_view" && (
                                                      <Check className="w-4 h-4 text-purple-600" />
                                                    )}
                                                  </span>

                                                  <Eye className="w-4 h-4" />
                                                  <span>Needs to View</span>
                                                </button>

                                              </div>
                                            </div>
                                          )}
                                        </div>

                                        {/* Customize Button - fixed width */}
                                        <div className="relative customize-dropdown-container" style={{ width: '120px' }}>
                                          <label className="block text-sm font-medium text-gray-900 mb-2 invisible">Customize</label>
                                          <button
                                            onClick={() => setOpenCustomizeDropdownId(openCustomizeDropdownId === recipient.id ? null : recipient.id)}
                                            className="w-full px-2 py-2 font-bold text-white-700 rounded-sm hover:bg-gray-200 transition-colors flex items-center justify-between border border-gray-300 animate-shine relative overflow-hidden"
                                            style={{ height: '42px', backgroundColor: '#260559' }}
                                            data-tour="ec-customize"
                                          >
                                            <span className="text-sm text-white relative z-10">Customize</span>
                                            <ChevronDown className="w-4 h-4 mt-1 text-white flex-shrink-0 relative z-10" />
                                          </button>

                                          {/* Customize Dropdown Menu */}
                                          {openCustomizeDropdownId === recipient.id && (
                                            <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-sm border border-gray-200 shadow-lg z-50">
                                              <div className="py-2">
                                                <button
                                                  onClick={() => {
                                                    setAuthModalForRecipientId(recipient.id);
                                                    setAuthModalForBulk(false);
                                                    setOpenCustomizeDropdownId(null);
                                                    setShowAuthModal(true);
                                                  }}
                                                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100"
                                                >
                                                  <div className="flex items-start gap-3">
                                                    <Key className="w-5 h-5 text-gray-600 mt-0.5" />
                                                    <div>
                                                      <div className="font-medium text-gray-900">Add authentication method</div>
                                                      <div className="text-xs text-gray-500 mt-1">Select an authentication method for this recipient.</div>
                                                    </div>
                                                  </div>
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    setOpenPrivateForId(prev => ({ ...prev, [recipient.id]: true }));
                                                    setOpenCustomizeDropdownId(null);
                                                  }}
                                                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                                                >
                                                  <div className="flex items-start gap-3">
                                                    <MessageSquare className="w-5 h-5 text-gray-600 mt-0.5" />
                                                    <div>
                                                      <div className="font-medium text-gray-900">Add private message</div>
                                                      <div className="text-xs text-gray-500 mt-1">Include a personal note with this recipient.</div>
                                                    </div>
                                                  </div>
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Second Row: Delivery (left column) with Email below it in same column */}
                                      <div className="flex-1">
                                        {/* Delivery Options */}
                                        <div className="mb-4">
                                          <label className="block text-sm font-medium text-gray-900 mb-2">
                                            Delivery <span className="text-red-500">*</span>
                                          </label>
                                          <div className="flex items-center gap-4">
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={!recipient.authentication}
                                                onChange={() => {
                                                  updateRecipient(recipient.id, { authentication: undefined });
                                                }}
                                                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                style={{
                                                  accentColor: '#6d28d9'
                                                }}
                                              />
                                              <span className="text-sm text-gray-900">Email</span>
                                            </label>
                                            <label className="flex items-center space-x-2 cursor-not-allowed">
                                              <input
                                                type="checkbox"
                                                disabled
                                                className="w-4 h-4 rounded border-gray-300"
                                              />
                                              <span className="text-sm text-gray-300">SMS</span>
                                              <div className="relative inline-block">
                                                {/* Icon */}
                                                <span
                                                  onMouseEnter={() => setShowTip(true)}
                                                  onMouseLeave={() => setShowTip(false)}
                                                  className="cursor-pointer inline-flex items-center"
                                                >
                                                  <LockKeyhole className="w-4 h-4 text-blue-600" />
                                                </span>

                                                {/* Tooltip */}
                                                {showTip && (
                                                  <div className="absolute bottom-[140%] left-1/2 -translate-x-1/2 z-50">
                                                    {/* Tooltip box */}
                                                    <div className="bg-[#26263d] text-white text-sm px-4 py-2 rounded shadow-md whitespace-nowrap">
                                                      Learn about the SMS delivery add-on trial
                                                    </div>

                                                    {/* Arrow */}
                                                    <div className="h-0 w-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-[#26263d] mx-auto"></div>
                                                  </div>
                                                )}
                                              </div>
                                            </label>
                                          </div>
                                        </div>

                                        {/* Email Field - Below Delivery in same column */}
                                        <div className='w-125 relative'>
                                          <label className="block text-sm font-medium text-gray-900 mb-2">
                                            Email <span className="text-red-500">*</span>
                                          </label>
                                          <div
                                            className="relative"
                                            ref={(el) => {
                                              if (emailSuggestionsOpenForId === recipient.id) {
                                                emailSuggestionsContainerRef.current = el;
                                              }
                                            }}
                                          >
                                            <input
                                              type="email"
                                              value={recipient.email}
                                              data-recipient-email-id={recipient.id}
                                              onChange={(e) => {
                                                updateRecipient(recipient.id, { email: e.target.value });
                                                // Show suggestions if user is typing
                                                if (e.target.value.trim().length > 0) {
                                                  setEmailSuggestionsOpenForId(recipient.id);
                                                  loadRecipientSuggestions();
                                                }
                                              }}
                                              onBlur={(e) => {
                                                handleEmailOnBlur(recipient.id, e.target.value);
                                                // Close dropdown after a short delay to allow click on suggestion
                                                setTimeout(() => {
                                                  setEmailSuggestionsOpenForId(null);
                                                }, 200);
                                              }}
                                              onFocus={() => {
                                                setEmailSuggestionsOpenForId(recipient.id);
                                                loadRecipientSuggestions();
                                              }}
                                              onDragStart={(e) => e.stopPropagation()}
                                              draggable="false"
                                              className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                              placeholder="email@example.com"
                                            />
                                            {emailSuggestionsOpenForId === recipient.id && (
                                              <div className="absolute z-20 top-full mt-1 w-full max-h-56 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg">
                                                {loadingRecipientSuggestions ? (
                                                  <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
                                                ) : (() => {
                                                  // Filter suggestions: initially show only logged-in user's email, then show matching suggestions
                                                  const userEmail = user?.email?.toLowerCase() || '';
                                                  const currentEmail = recipient.email.toLowerCase().trim();
                                                  
                                                  // If no input, show only logged-in user's email
                                                  if (!currentEmail) {
                                                    const userSuggestion = recipientSuggestions.find(s => s.email.toLowerCase() === userEmail);
                                                    if (userSuggestion) {
                                                      return (
                                                        <button
                                                          key={userSuggestion.email}
                                                          type="button"
                                                          onMouseDown={(e) => {
                                                            e.preventDefault(); // Prevent input blur
                                                            updateRecipient(recipient.id, { email: userSuggestion.email, name: userSuggestion.name || recipient.name });
                                                            setEmailSuggestionsOpenForId(null);
                                                          }}
                                                          onClick={(e) => {
                                                            e.preventDefault();
                                                            updateRecipient(recipient.id, { email: userSuggestion.email, name: userSuggestion.name || recipient.name });
                                                            setEmailSuggestionsOpenForId(null);
                                                          }}
                                                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                                                        >
                                                          <div className="font-medium text-gray-900">{userSuggestion.name || userSuggestion.email}</div>
                                                          <div className="text-xs text-gray-600">{userSuggestion.email}</div>
                                                        </button>
                                                      );
                                                    }
                                                    return <div className="px-3 py-2 text-sm text-gray-500">No suggestions</div>;
                                                  }
                                                  
                                                  // Filter suggestions that match the typed email
                                                  const matchingSuggestions = recipientSuggestions.filter(s => 
                                                    s.email.toLowerCase().includes(currentEmail) || 
                                                    s.name.toLowerCase().includes(currentEmail)
                                                  );
                                                  
                                                  if (matchingSuggestions.length === 0) {
                                                    return <div className="px-3 py-2 text-sm text-gray-500">No matching suggestions</div>;
                                                  }
                                                  
                                                  return matchingSuggestions.map((s) => (
                                                    <button
                                                      key={s.email}
                                                      type="button"
                                                      onMouseDown={(e) => {
                                                        e.preventDefault(); // Prevent input blur
                                                        updateRecipient(recipient.id, { email: s.email, name: s.name || recipient.name });
                                                        setEmailSuggestionsOpenForId(null);
                                                      }}
                                                      onClick={(e) => {
                                                        e.preventDefault();
                                                        updateRecipient(recipient.id, { email: s.email, name: s.name || recipient.name });
                                                        setEmailSuggestionsOpenForId(null);
                                                      }}
                                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                                                    >
                                                      <div className="font-medium text-gray-900">{s.name || s.email}</div>
                                                      <div className="text-xs text-gray-600">{s.email}</div>
                                                    </button>
                                                  ));
                                                })()}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                  </div>
                                  {/* Access Code Panel */}
                                  {openAccessForId[recipient.id] && recipient.authentication === 'access_code' && (
                                    <div className="shadow-lg border-gray-200 bg-gray-100 relative">
                                      <div className="absolute top-0 bottom-0" style={{ left: '-7px', width: 7, background: '#eff2f5ff' }}></div>
                                      <div className="flex items-center justify-between px-4 pt-4">
                                        <h5 className="text-lg text-gray-900">Access Code</h5>
                                        <div className="flex items-center gap-2">
                                          <button
                                            title="Remove access code"
                                            onClick={() => {
                                              updateRecipient(recipient.id, { authentication: undefined, authValue: undefined });
                                              setOpenAccessForId(prev => ({ ...prev, [recipient.id]: false }));
                                            }}
                                            className="p-2 rounded hover:bg-gray-100"
                                          >
                                            <Trash2 className="w-6 h-6 text-[#2C2441]" />
                                          </button>
                                          <button
                                            title="Collapse"
                                            onClick={() => setOpenAccessForId(prev => ({ ...prev, [recipient.id]: false }))}
                                            className="p-2 rounded hover:bg-gray-100"
                                          >
                                            <ChevronUp className="w-4 h-4 text-[#2C2441]" />
                                          </button>
                                        </div>
                                      </div>
                                      <div className="px-4 pb-4">
                                        <div className="mt-2">
                                          <input
                                            type="text"
                                            value={recipient.authValue || ''}
                                            onChange={(e) => updateRecipient(recipient.id, { authValue: e.target.value })}
                                            placeholder="Enter access code"
                                            className="w-100 bg-white px-4 py-2 border border-gray-300 rounded-sm "
                                          />
                                        </div>
                                        <div className="mt-3 text-gray-600 text-sm space-y-1">
                                          <p>Codes are not case-sensitive.</p>
                                          <p>You must provide this code to the signer.</p>
                                          <p className="text-gray-500">This code is available for you to review on the Envelope Details page.</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Private Message Panel */}
                                  {openPrivateForId[recipient.id] && (
                                    <div className="shadow-lg border-gray-200 bg-gray-100 relative">
                                      <div className="absolute top-0 bottom-0" style={{ left: '-7px', width: 7, background: '#eff2f5ff' }}></div>
                                      <div className="flex items-center justify-between px-4 pt-4">
                                        <h5 className="text-lg text-gray-900">Private Message</h5>
                                        <div className="flex items-center gap-2">
                                          <button
                                            title="Remove private message"
                                            onClick={() => {
                                              updateRecipient(recipient.id, { privateMessage: undefined as any });
                                              setOpenPrivateForId(prev => ({ ...prev, [recipient.id]: false }));
                                            }}
                                            className="p-2 rounded hover:bg-gray-100"
                                          >
                                            <Trash2 className="w-6 h-6 text-[#2C2441]" />
                                          </button>
                                          <button
                                            title="Collapse"
                                            onClick={() => setOpenPrivateForId(prev => ({ ...prev, [recipient.id]: false }))}
                                            className="p-2 rounded hover:bg-gray-100"
                                          >
                                            <ChevronUp className="w-5 h-5 text-[#2C2441]" />
                                          </button>
                                        </div>
                                      </div>
                                      <div className="px-4 pb-4">
                                        <div className="mt-2">
                                          <textarea
                                            rows={3}
                                            value={recipient.privateMessage || ''}
                                            onChange={(e) => updateRecipient(recipient.id, { privateMessage: e.target.value } as any)}
                                            placeholder="Write a private message for this recipient"
                                            className="w-full bg-white px-4 py-2 border border-gray-300 rounded-sm "
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Remove button: show only if there are at least 2 recipients */}
                                  {recipients.length > 1 && (
                                    <button
                                      onClick={() => removeRecipient(recipient.id)}
                                      className="absolute top-4 right-4 w-6 h-6 bg-opacity-70 rounded-full flex items-center justify-center hover:bg-opacity-90 transition-all"
                                    >
                                      <Trash2 className="w-5 h-5 text-[#2C2441]" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          </div>
                        );
                      })()}

                    </>
                  )}

                  {/* Add Recipient Button - only show when not only signer */}
                  {!isOnlySigner && (() => {
                    // Check if all recipients have name and email filled
                    const allRecipientsFilled = recipients.every(r => 
                      r.name && r.name.trim() !== '' && 
                      r.email && r.email.trim() !== ''
                    );
                    
                    return (
                      <div className="relative group">
                        <button
                          onClick={allRecipientsFilled ? addRecipient : undefined}
                          disabled={!allRecipientsFilled}
                          className={`flex items-center border border-black-300 rounded-sm overflow-hidden transition-opacity ${
                            allRecipientsFilled 
                              ? 'cursor-pointer hover:opacity-90' 
                              : 'cursor-not-allowed opacity-50'
                          }`}
                          data-tour="ec-add-recipient"
                          // title={!allRecipientsFilled ? "Fill all detail of the recipient to add new" : ""}
                        >
                          {/* Left section */}
                          <div className="flex items-center gap-2 px-4 py-2 bg-white">
                            <UserRoundPlus className="w-4 h-4 text-[#2C2441]" />
                            <span className="text-sm text-[#2C2441]">Add Recipient</span>
                          </div>

                          {/* Divider */}
                          <div className="w-px h-8 bg-black" />

                          {/* Right section */}
                          <div className="px-3 py-2 bg-white flex items-center">
                            <ChevronDown className="w-4 h-4 text-[#2C2441]" />
                          </div>
                        </button>
                        
                        {/* Tooltip on hover when disabled */}
                        {!allRecipientsFilled && (
                          <div className="absolute bottom-full left-1/9 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            Fill all detail of the recipient to add new
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                              <div className="border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
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
                      onClick={() => setTypeDropdownOpen((o) => !o)}
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
                                disabled={!newEnvelopeTypeValue.trim()}
                                className="px-3 py-1.5 text-sm bg-[#3E2B66] text-white rounded hover:bg-[#4d3577] disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Use
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
              {/* <div className="relative">
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
              </div> */}

            </div>
          </div>

        );

      case 2:
        return (
          <SigningEditorStep
            documents={documents}
            recipients={recipients}
            signatureFields={signatureFields}
            setSignatureFields={setSignatureFields}
            mode={mode}
            powerFormData={powerFormData}
            slots={slots}
            onSend={mode === 'normal' ? handleSendEnvelope : undefined}
            sending={sending}
            onFieldsChange={(fields) => saveSignatureFieldsImmediate(fields as EditorSignatureFieldExt[])}
            envelopeId={envelopeId}
            onBack={() => {
              setCurrentStep(1);
              if (envelopeId) {
                navigate(`/e-sign/create?step=1&envelopeId=${envelopeId}`);
              } else {
                navigate(`/e-sign/create?step=1`);
              }
            }}
          />
        );

      case 3:
        return (
          <SigningEditorStep
            documents={documents}
            recipients={recipients}
            signatureFields={signatureFields}
            setSignatureFields={setSignatureFields}
            mode={mode}
            powerFormData={powerFormData}
            slots={slots}
            onSend={mode === 'normal' ? handleSendEnvelope : undefined}
            sending={sending}
            onFieldsChange={(fields) => saveSignatureFieldsImmediate(fields as EditorSignatureFieldExt[])}
            envelopeId={envelopeId}
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
                        <p className="text-sm font-medium text-gray-700 capitalize">{recipient?.role?.replace('_', ' ') ?? ''}</p>
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

  // Initialize orders when signing order is enabled
  useEffect(() => {
    if (setSigningOrder && recipients.length > 0) {
      setRecipients(prev => {
        // Check if any recipient is missing an order or orders are not sequential
        const hasInvalidOrders = prev.some((r, idx) => !r.order || r.order !== idx + 1);
        if (hasInvalidOrders) {
          return normalizeOrders(prev);
        }
        return prev;
      });
    }
  }, [setSigningOrder]);

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

              {isEditingTitle ? (
                <div className="flex items-center space-x-2">
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onBlur={() => {
                      if (titleInput.trim()) {
                        setDocumentTitle(titleInput.trim());
                        // Also update subject when title is edited
                        setEnvelopeData(prev => ({ ...prev, subject: titleInput.trim() }));
                      }
                      setIsEditingTitle(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      } else if (e.key === 'Escape') {
                        setTitleInput(documentTitle || `Complete with Draft&Sign: ${documents?.[0]?.name || 'Document'}`);
                        setIsEditingTitle(false);
                      }
                    }}
                    className="text-base font-medium text-gray-900 px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[300px]"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h1 className="text-base font-medium text-gray-900">
                    {documents?.length > 0
                      ? (documentTitle || `Complete with Draft&Sign: ${documents?.[0]?.name || 'Document'}`)
                      : 'Upload a Document and Add Envelope Recipients'}
                  </h1>
                  {documents?.length > 0 && (
                    <button
                      data-tour="ec-edit-title"
                      onClick={() => {
                        const currentTitle = documentTitle || `Complete with Draft&Sign: ${documents?.[0]?.name || 'Document'}`;
                        setTitleInput(currentTitle);
                        setIsEditingTitle(true);
                        setTimeout(() => titleInputRef.current?.focus(), 0);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                      title="Edit title"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )} 
            </div>

            {/* RIGHT — Help + Advanced Options */}
            <div className="flex items-center space-x-3 relative">
              <button
                ref={helpButtonRef}
                onClick={(e) => { e.stopPropagation(); setHelpMenuOpen(prev => !prev); }}
                className="p-2 rounded hover:bg-gray-100"
                title="Help"
              >
                <CircleQuestionMark className="w-5 h-5 text-gray-600" />
              </button>

              {helpMenuOpen && (
                <div 
                  ref={helpMenuRef}
                  className="absolute right-24 top-10 w-70 bg-white border border-gray-200 rounded-md shadow-xl z-50"
                >
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
                      <span className="text-blue-700">Visit the Draft&Sign Support Center</span> for helpful articles, guides, videos, and more.
                    </button>
                    <div className="p-4 border-t border-gray-100">
                      <button
                        onClick={() => window.open('/help-support', '_blank')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md text-white"
                      style={{ backgroundColor: '#260559' }}
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
                    onClick={() => window.open('/e-sign/guide', '_blank')}
                    className="text-[#4C2FFF] underline text-[14px]"
                  >
                    Sending Documents for Signature
                  </button>
                </div>
              </div>

              {/* Bottom links */}
              <div className="pt-6 border-t border-gray-200 space-y-5 text-[14px]">
                <button
                  onClick={() => window.open('/help-support', '_blank')}
                  className="flex items-center gap-2 text-[#4C2FFF] hover:underline"
                >
                  <span>Support Center</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
                {/* <button
                  onClick={() => window.open('/help-support', '_blank')}
                  className="flex items-center gap-2 text-[#4C2FFF] hover:underline"
                >
                  <span>Community</span>
                  <ExternalLink className="w-4 h-4" />
                </button> */}
                <button
                  onClick={() => window.open('/help-support', '_blank')}
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
          <div className="max-w-6xlVV mx-auto">
            {renderStepContent()}

            {/* Navigation (hidden on step 2; footer lives inside SigningEditorStep) */}
            {currentStep !== 2 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200" id='clearBoth'>
               <button
                 onClick={() => {
                   setCurrentStep(1);
                   if (envelopeId) {
                     navigate(`/e-sign/create?step=1&envelopeId=${envelopeId}`);
                   } else {
                     navigate(`/e-sign/create?step=1`);
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
                   className="flex items-center gap-2 px-6 py-2 bg-[#260559] text-white rounded-lg hover:bg-[#260559]/70 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          </div>
        </div>
      </div>

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
                {/* <button onClick={() => sectionRefs.comments.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="w-full text-left px-3 py-2 rounded hover:bg-gray-100">Comments</button> */}
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
                    <label className="flex items-center gap-3 text-gray-800 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4" 
                        checked={advancedOptions.canSignOnPaper}
                        onChange={(e) => setAdvancedOptions(prev => ({ ...prev, canSignOnPaper: e.target.checked }))}
                      /> 
                      Recipients can sign on paper
                    </label>
                    {/* <label className="flex items-center gap-3 text-gray-400 cursor-not-allowed">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4" 
                        checked={advancedOptions.canDelegate}
                        onChange={(e) => setAdvancedOptions(prev => ({ ...prev, canDelegate: e.target.checked }))}
                        disabled
                      /> 
                      Recipients can change signing responsibility or assign a delegate
                    </label> */}
                  </div>
                  <hr className="mt-8" />
                </section>

                {/* Reminders */}
                <section ref={sectionRefs.reminders}>
                  <h3 className="text-2xl text-gray-900">Reminders</h3>
                  <p className="text-gray-600 mt-2">Follow up with automatic reminders. Signers will receive emails until they sign or decline the envelope.</p>
                  <div className="mt-6 flex items-center gap-3">
                    <label className="flex items-center gap-3 text-gray-800 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5" 
                        checked={envelopeData.reminderEnabled}
                        onChange={(e) => setEnvelopeData(prev => ({ ...prev, reminderEnabled: e.target.checked }))}
                      />
                      Turn on auto reminders
                    </label>
                  </div>
                  {envelopeData.reminderEnabled && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Reminder interval (days)</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="30"
                        className="w-full border rounded px-3 py-2" 
                        value={envelopeData.reminderInterval}
                        onChange={(e) => setEnvelopeData(prev => ({ ...prev, reminderInterval: parseInt(e.target.value) || 3 }))}
                      />
                    </div>
                  )}
                  <hr className="mt-8" />
                </section>

                {/* Expiration */}
                <section ref={sectionRefs.expiration}>
                  <h3 className="text-2xl text-gray-900">Expiration</h3>
                  <p className="text-gray-600 mt-2">By default, envelopes expire after 120 days. Recipients can no longer view or sign an envelope after it expires.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Days until envelope expires</label>
                      <select 
                        className="w-full border rounded px-3 py-2"
                        value={advancedOptions.expirationType}
                        onChange={(e) => setAdvancedOptions(prev => ({ ...prev, expirationType: e.target.value as 'custom' | 'never' }))}
                      >
                        <option value="custom">Custom days</option>
                        <option value="never">Never expire</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Custom number of days *</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="365"
                        className={`w-full border rounded px-3 py-2 ${
                          advancedOptions.expirationType === 'never' ? 'cursor-not-allowed bg-gray-100' : ''
                        }`}
                        value={advancedOptions.expirationDays}
                        onChange={(e) => setAdvancedOptions(prev => ({ ...prev, expirationDays: parseInt(e.target.value) || 120 }))}
                        disabled={advancedOptions.expirationType === 'never'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Send alert</label>
                      <select 
                        className="w-full border rounded px-3 py-2"
                        value={advancedOptions.alertType}
                        onChange={(e) => setAdvancedOptions(prev => ({ ...prev, alertType: e.target.value as 'custom' | 'never' }))}
                      >
                        <option value="custom">Custom days</option>
                        <option value="never">Never</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Custom number of days *</label>
                      <input 
                        type="number" 
                        min="0" 
                        max="365"
                        className={`w-full border rounded px-3 py-2 ${
                          advancedOptions.expirationType === 'never' ? 'cursor-not-allowed bg-gray-100' : ''
                        }`}
                        value={advancedOptions.expirationAlertDays}
                        onChange={(e) => setAdvancedOptions(prev => ({ ...prev, expirationAlertDays: parseInt(e.target.value) || 0 }))}
                        disabled={advancedOptions.alertType === 'never'}
                      />
                    </div>
                  </div>
                  <hr className="mt-8" />
                </section>

                {/* Mobile Friendly */}
                <section ref={sectionRefs.mobileFriendly}>
                  <h3 className="text-2xl text-gray-900">Mobile-Friendly Viewing with Responsive Signing</h3>
                  <p className="text-gray-600 mt-2">View your document in preview mode to see how it looks on a mobile device</p>
                  <div className="mt-6">
                    <label className="flex items-center gap-3 text-gray-800 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5" 
                        checked={advancedOptions.responsiveSigning}
                        onChange={(e) => setAdvancedOptions(prev => ({ ...prev, responsiveSigning: e.target.checked }))}
                      />
                      Enable Responsive Signing for this envelope
                    </label>
                  </div>
                  {/* <hr className="mt-8" /> */}
                </section>

                {/* Comments */}
                {/* <section ref={sectionRefs.comments}>
                  <h3 className="text-2xl text-gray-900">Comments</h3>
                  <p className="text-gray-600 mt-2">Allow comments on documents. Both senders and recipients can comment.</p>
                  <div className="mt-6">
                    <label className="flex items-center gap-3 text-gray-800 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5" 
                        checked={advancedOptions.commentsEnabled}
                        onChange={(e) => setAdvancedOptions(prev => ({ ...prev, commentsEnabled: e.target.checked }))}
                      />
                      Enable comments for this envelope
                    </label>
                  </div>
                </section> */}
              </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end">
                  <button 
                    onClick={saveAdvancedOptions} 
                    className="px-6 py-2 rounded text-white hover:opacity-90 transition-opacity" 
                    style={{ backgroundColor: '#260559' }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Confirmation Modal */}
      {showSendConfirmationModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => {
              if (!sending) {
                setShowSendConfirmationModal(false);
                setDraggedSignerId(null);
                setDragOverSignerId(null);
              }
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[700px] max-h-[90vh] overflow-y-auto p-6 z-[10000]">
            {!sending && (
              <button
                onClick={() => {
                  setShowSendConfirmationModal(false);
                  setDraggedSignerId(null);
                  setDragOverSignerId(null);
                }}
                className="absolute right-6 top-6 text-2xl text-[#3E2B66] hover:text-gray-800 z-10"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Step Indicator */}
            <div className="flex items-center gap-3 mt-4 mb-8 pb-6 border-b border-gray-100">
              <div className={`flex items-center gap-2.5 transition-colors ${sendModalStep >= 1 ? 'text-[#3E2B66]' : 'text-gray-400'}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  sendModalStep >= 1 
                    ? 'bg-[#3E2B66] text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {sendModalStep > 1 ? <Check className="w-5 h-5" /> : '1'}
                </div>
                <span className="font-semibold text-sm">Signing Order</span>
              </div>
              <div className={`flex-1 h-0.5 transition-colors ${sendModalStep >= 2 ? 'bg-[#3E2B66]' : 'bg-gray-200'}`} />
              <div className={`flex items-center gap-2.5 transition-colors ${sendModalStep >= 2 ? 'text-[#3E2B66]' : 'text-gray-400'}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  sendModalStep >= 2 
                    ? 'bg-[#3E2B66] text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  2
                </div>
                <span className="font-semibold text-sm">Summary</span>
              </div>
            </div>

            {/* Step 1: Signing Order Diagram */}
            {sendModalStep === 1 && (
              <div>
                <div className="mb-2">
                  <h2 className="text-[24px] font-semibold text-[#3E2B66] mb-1">
                    Review Signing Order
                  </h2>
                  <p className="text-sm text-gray-500">
                    Drag & drop to reorder signers
                  </p>
                </div>
                <div className="mb-6">
                  {(() => {
                    const getInitials = (name?: string, email?: string) => {
                      const src = (name && name.trim().length > 0 ? name : (email || '')) as string;
                      const chars = (src.match(/\b\w/g) || []).slice(0, 2).join('').toUpperCase();
                      return chars || <PenLine className='w-4 h-4' />;
                    };

                    const formatSentenceCase = (text: string) => {
                      if (!text) return text;
                      return text
                        .toLowerCase()
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                    };

                    const sortedRecipients = [...recipients].sort((a, b) => (a.order || 0) - (b.order || 0));
                    const ordered = sortedRecipients.map((r) => ({
                      key: r.id,
                      order: r.order || 0,
                      name: formatSentenceCase(r.name || r.email || 'Unnamed'),
                      email: r.email
                    }));

                    return (
                      <div className="relative">
                        {/* Vertical Timeline Line */}
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 z-0" />
                        
                        {/* Sender Row */}
                        <div className="relative flex items-center py-4 mb-2">
                          <div className="relative z-10 flex items-center gap-4 w-full">
                            <div className="flex-shrink-0 w-12 flex justify-center">
                              <div className="w-10 h-10 rounded-full bg-purple-100 border-2 border-purple-300 flex items-center justify-center font-semibold text-[#3E2B66] text-sm">
                                {(((user?.fullname || user?.email || '?') as string).match(/\b\w/g) || []).slice(0, 2).join('').toUpperCase()}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-gray-700">SENDER</div>
                              <div className="text-xs text-gray-500">{formatSentenceCase(user?.fullname || user?.email || 'You')}</div>
                            </div>
                          </div>
                        </div>

                        {/* Signer Rows */}
                        {ordered.map((p, index) => {
                          const isDragging = draggedSignerId === p.key;
                          const isDragOver = dragOverSignerId === p.key;
                          const isCurrent = index === 0; // First signer is current
                          
                          return (
                            <div
                              key={`signer-${p.key}`}
                              className={`relative flex items-center py-3 mb-1 rounded-lg transition-all duration-200 ${
                                isDragging 
                                  ? 'opacity-50 scale-95 shadow-lg bg-white' 
                                  : isDragOver 
                                    ? 'bg-blue-50 border-2 border-blue-200' 
                                    : 'hover:bg-gray-50'
                              }`}
                              draggable
                              onDragStart={(e) => {
                                setDraggedSignerId(p.key);
                                e.dataTransfer.setData('recipientId', p.key);
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              onDragEnd={() => {
                                setDraggedSignerId(null);
                                setDragOverSignerId(null);
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                                if (dragOverSignerId !== p.key) {
                                  setDragOverSignerId(p.key);
                                }
                              }}
                              onDragLeave={() => {
                                if (dragOverSignerId === p.key) {
                                  setDragOverSignerId(null);
                                }
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                setDragOverSignerId(null);
                                const draggedId = e.dataTransfer.getData('recipientId');
                                if (draggedId && draggedId !== p.key) {
                                  const draggedRecipient = recipients.find(r => r.id === draggedId);
                                  const targetRecipient = recipients.find(r => r.id === p.key);
                                  if (draggedRecipient && targetRecipient) {
                                    const tempOrder = draggedRecipient.order;
                                    updateRecipient(draggedId, { order: targetRecipient.order });
                                    updateRecipient(p.key, { order: tempOrder });
                                    setTimeout(() => {
                                      setRecipients(prev => normalizeOrders(prev));
                                    }, 0);
                                  }
                                }
                              }}
                            >
                              <div className="relative z-10 flex items-center gap-4 w-full">
                                {/* Timeline Circle */}
                                <div className="flex-shrink-0 w-12 flex justify-center">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm border-2 ${
                                    isCurrent 
                                      ? 'bg-[#3E2B66] border-[#3E2B66] text-white' 
                                      : 'bg-gray-100 border-gray-300 text-gray-600'
                                  }`}>
                                    {getInitials(p.name, p.email)}
                                  </div>
                                </div>
                                
                                {/* Drag Handle */}
                                <div 
                                  className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors"
                                  title="Drag to reorder"
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  <GripVertical className="w-5 h-5" />
                                </div>
                                
                                {/* Signer Info */}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900">{index + 1}.</span>
                                    <span className="text-sm font-medium text-gray-900">{p.name}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">{p.email}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Completed Row */}
                        <div className="relative flex items-center py-4 mt-2">
                          <div className="relative z-10 flex items-center gap-4 w-full">
                            <div className="flex-shrink-0 w-12 flex justify-center">
                              <div className="w-10 h-10 rounded-full bg-green-100 border-2 border-green-300 flex items-center justify-center text-green-600">
                                <Check className="w-5 h-5" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-gray-700">COMPLETED</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowSendConfirmationModal(false);
                      setDraggedSignerId(null);
                      setDragOverSignerId(null);
                    }}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setSendModalStep(2)}
                    className="px-6 py-2.5 bg-[#3E2B66] text-white rounded-lg hover:bg-[#4d3577] font-medium transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Authentication & Credits */}
            {sendModalStep === 2 && (
              <div>
                {sending ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    {/* Envelope Sending Animation */}
                    <div className="relative mb-8 w-full max-w-md">
                      {/* Animated Envelope */}
                      <div className="envelope-sending-container relative flex items-center justify-center">
                        {/* Main Envelope */}
                        <div className="relative z-20 envelope-flying">
                          <div className="relative">
                            {/* Envelope Body */}
                            <div className="relative w-28 h-20 bg-gradient-to-br from-[#3E2B66] to-[#5a3f8a] rounded-sm shadow-2xl envelope-body overflow-hidden">
                              {/* Envelope Flap (Triangle shape) */}
                              <div className="absolute -top-4 left-0 w-full h-8 bg-gradient-to-br from-[#4d3577] to-[#3E2B66] envelope-flap" 
                                   style={{
                                     clipPath: 'polygon(0 100%, 50% 0, 100% 100%)',
                                     transformOrigin: 'center bottom'
                                   }}>
                              </div>
                              {/* Envelope Content Area */}
                              <div className="absolute inset-0 flex items-center justify-center pt-2">
                                <Mail className="w-10 h-10 text-white/90 relative z-10" />
                              </div>
                              {/* Shine Effect */}
                              <div className="absolute inset-0 envelope-shine rounded-sm"></div>
                              {/* Envelope Border/Outline */}
                              <div className="absolute inset-0 border-2 border-[#2a1a4a] rounded-sm"></div>
                            </div>
                            {/* Particles/Trail - Left side */}
                            <div className="absolute -left-6 top-1/2 -translate-y-1/2">
                              <div className="particle particle-1"></div>
                              <div className="particle particle-2"></div>
                              <div className="particle particle-3"></div>
                            </div>
                            {/* Particles/Trail - Right side */}
                            <div className="absolute -right-6 top-1/2 -translate-y-1/2">
                              <div className="particle particle-4"></div>
                              <div className="particle particle-5"></div>
                              <div className="particle particle-6"></div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Small Envelopes - Flying around */}
                        {/* Small Envelope 1 - Top Left */}
                        <div className="absolute top-8 left-12 small-envelope-1">
                          <div className="relative w-12 h-8 bg-gradient-to-br from-[#3E2B66]/80 to-[#5a3f8a]/80 rounded-sm shadow-lg overflow-hidden">
                            <div className="absolute -top-2 left-0 w-full h-4 bg-gradient-to-br from-[#4d3577]/80 to-[#3E2B66]/80" 
                                 style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}></div>
                            <div className="absolute inset-0 flex items-center justify-center pt-1">
                              <Mail className="w-4 h-4 text-white/80" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Small Envelope 2 - Top Right */}
                        <div className="absolute top-6 right-16 small-envelope-2">
                          <div className="relative w-12 h-8 bg-gradient-to-br from-[#3E2B66]/80 to-[#5a3f8a]/80 rounded-sm shadow-lg overflow-hidden">
                            <div className="absolute -top-2 left-0 w-full h-4 bg-gradient-to-br from-[#4d3577]/80 to-[#3E2B66]/80" 
                                 style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}></div>
                            <div className="absolute inset-0 flex items-center justify-center pt-1">
                              <Mail className="w-4 h-4 text-white/80" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Small Envelope 3 - Bottom Left */}
                        <div className="absolute bottom-8 left-16 small-envelope-3">
                          <div className="relative w-12 h-8 bg-gradient-to-br from-[#3E2B66]/80 to-[#5a3f8a]/80 rounded-sm shadow-lg overflow-hidden">
                            <div className="absolute -top-2 left-0 w-full h-4 bg-gradient-to-br from-[#4d3577]/80 to-[#3E2B66]/80" 
                                 style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}></div>
                            <div className="absolute inset-0 flex items-center justify-center pt-1">
                              <Mail className="w-4 h-4 text-white/80" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Small Envelope 4 - Bottom Right */}
                        <div className="absolute bottom-6 right-12 small-envelope-4">
                          <div className="relative w-12 h-8 bg-gradient-to-br from-[#3E2B66]/80 to-[#5a3f8a]/80 rounded-sm shadow-lg overflow-hidden">
                            <div className="absolute -top-2 left-0 w-full h-4 bg-gradient-to-br from-[#4d3577]/80 to-[#3E2B66]/80" 
                                 style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}></div>
                            <div className="absolute inset-0 flex items-center justify-center pt-1">
                              <Mail className="w-4 h-4 text-white/80" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Small Envelope 5 - Top Center */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 small-envelope-5">
                          <div className="relative w-10 h-7 bg-gradient-to-br from-[#3E2B66]/70 to-[#5a3f8a]/70 rounded-sm shadow-md overflow-hidden">
                            <div className="absolute -top-1.5 left-0 w-full h-3 bg-gradient-to-br from-[#4d3577]/70 to-[#3E2B66]/70" 
                                 style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}></div>
                            <div className="absolute inset-0 flex items-center justify-center pt-0.5">
                              <Mail className="w-3 h-3 text-white/70" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Small Envelope 6 - Bottom Center */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 small-envelope-6">
                          <div className="relative w-10 h-7 bg-gradient-to-br from-[#3E2B66]/70 to-[#5a3f8a]/70 rounded-sm shadow-md overflow-hidden">
                            <div className="absolute -top-1.5 left-0 w-full h-3 bg-gradient-to-br from-[#4d3577]/70 to-[#3E2B66]/70" 
                                 style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}></div>
                            <div className="absolute inset-0 flex items-center justify-center pt-0.5">
                              <Mail className="w-3 h-3 text-white/70" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Destination Indicators */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 opacity-40">
                          <div className="w-4 h-4 bg-[#3E2B66] rounded-full animate-ping"></div>
                          <div className="absolute inset-0 w-4 h-4 bg-[#3E2B66] rounded-full"></div>
                        </div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-40">
                          <div className="w-4 h-4 bg-[#3E2B66] rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                          <div className="absolute inset-0 w-4 h-4 bg-[#3E2B66] rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-semibold text-[#3E2B66] mb-3">Sending Envelope...</h3>
                    <p className="text-gray-600 text-center max-w-md mb-6">
                      Please wait while we send your envelope to all recipients. This may take a few moments.
                    </p>
                    <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#3E2B66] rounded-full animate-pulse"></div>
                        <span className="font-medium">Processing recipients</span>
                      </div>
                      <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#3E2B66] rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                        <span className="font-medium">Consuming credits</span>
                      </div>
                      <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#3E2B66] rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
                        <span className="font-medium">Sending emails</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Invoice Header */}
                    <div className="mb-8 pb-6 border-b-2 border-gray-300">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h2 className="text-3xl font-bold text-gray-900 mb-1">Envelope Summary</h2>
                          {/* <p className="text-sm text-gray-500">Transaction Summary</p> */}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">Date</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Insufficient Credits Warning */}
                    {((subscriptionPlan?.creditsBalance || 0) - calculateTotalCost()) < 0 && (
                      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-5 mb-6">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center mt-0.5">
                            <span className="text-white text-xs font-bold">!</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-red-900 mb-2">Insufficient Credits</h3>
                            <p className="text-sm text-red-700 mb-3">
                              You need <span className="font-bold">{calculateTotalCost()}</span> credits but only have{' '}
                              <span className="font-bold">{subscriptionPlan?.creditsBalance || 0}</span> credits available.
                            </p>
                            <p className="text-sm text-red-600">
                              Please upgrade your plan or add credits to proceed with sending this envelope.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Invoice Line Items */}
                    <div className="mb-6">
                      {/* <h3 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h3> */}
                      
                      {/* Table Header - Only show when there are recipients with authentication */}
                      {hasRecipientsWithAuth && (
                        <div className="bg-gradient-to-r from-[#260559]/100 to-[#3E2B66] border border-[#260559] rounded-t-lg overflow-hidden">
                          <div className="grid grid-cols-12 gap-4 px-4 py-3">
                            <div className="col-span-1 text-xs font-semibold text-white">#</div>
                            <div className="col-span-4 text-xs font-semibold text-white">Recipient</div>
                            <div className="col-span-5 text-xs font-semibold text-white">Authentication Method</div>
                            <div className="col-span-2 text-xs font-semibold text-white text-right">Cost</div>
                          </div>
                        </div>
                      )}

                      {/* Table Body - Only show recipients with authentication methods */}
                      <div className={`border border-gray-200 ${hasRecipientsWithAuth ? 'rounded-b-lg' : 'rounded-lg'} overflow-hidden`}>
                        {recipients
                          .filter((recipient) => {
                            const authArray = parseAuthentication(recipient.authentication);
                            const authMethodList = authArray.map(authId => 
                              authMethods.find(m => m.id === authId)
                            ).filter(Boolean);
                            return authMethodList.length > 0;
                          })
                          .map((recipient, index) => {
                            // Parse authentication - can be JSON stringified array or single value
                            const authArray = parseAuthentication(recipient.authentication);
                            const authMethodList = authArray.map(authId => 
                              authMethods.find(m => m.id === authId)
                            ).filter(Boolean);
                            const totalCost = authMethodList.reduce((sum, method) => sum + (method?.cost || 0), 0);
                            const authDisplay = authMethodList.map(m => m?.name).join(', ');
                            
                            return (
                              <div 
                                key={recipient.id} 
                                className={`grid grid-cols-12 gap-4 px-4 py-4 border-b border-gray-200 last:border-b-0 hover:bg-purple-50 transition-colors ${
                                  index % 2 === 0 ? 'bg-white' : 'bg-purple-50/30'
                                }`}
                              >
                                <div className="col-span-1 text-sm font-medium text-gray-700 flex items-center">{recipient.order}</div>
                                <div className="col-span-4">
                                  <p className="text-sm font-semibold text-gray-900 truncate">
                                    {recipient.name || recipient.email}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">{recipient.email}</p>
                                </div>
                                <div className="col-span-5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-700 font-medium">{authDisplay}</span>
                                    <button
                                      type="button"
                                      title="Edit authentication method"
                                      onClick={() => {
                                        setAuthModalForRecipientId(recipient.id);
                                        setAuthModalForBulk(false);
                                        setShowAuthModal(true);
                                      }}
                                      className="edit-icon-animated group relative inline-flex items-center justify-center w-7 h-7 rounded-md hover:to-purple-50 text-purple-600 transition-all duration-300 flex-shrink-0 shadow-sm hover:shadow-lg hover:shadow-purple-300/60 hover:scale-110 hover:border-purple-500 active:scale-95 hover:-translate-y-0.5"
                                    >
                                      <div className="absolute inset-0 rounded-md bg-purple-400 opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300 z-0"></div>
                                      <Edit className='w-3.5 h-3.5 relative z-10 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110 group-active:rotate-0 group-active:scale-100' />
                                      <div className="absolute inset-0 rounded-md ring-2 ring-purple-300 ring-offset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></div>
                                    </button>
                                  </div>
                                </div>
                                <div className="col-span-2 text-sm font-semibold text-purple-700 text-right flex items-center justify-end">
                                  {totalCost > 0 ? `${totalCost}` : '0'} <span className="text-xs text-gray-500 ml-1">credits</span>
                                </div>
                              </div>
                            );
                          })}
                        {recipients.filter((recipient) => {
                          const authArray = parseAuthentication(recipient.authentication);
                          const authMethodList = authArray.map(authId => 
                            authMethods.find(m => m.id === authId)
                          ).filter(Boolean);
                          return authMethodList.length === 0;
                        }).length === 0 && recipients.filter((recipient) => {
                          const authArray = parseAuthentication(recipient.authentication);
                          const authMethodList = authArray.map(authId => 
                            authMethods.find(m => m.id === authId)
                          ).filter(Boolean);
                          return authMethodList.length > 0;
                        }).length === 0 && (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <p className="text-sm">No recipients with authentication methods</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Invoice Summary - Collapsible */}
                    <div className="mb-6">
                      <button
                        type="button"
                        onClick={() => setShowSummary(!showSummary)}
                        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors rounded-l-lg"
                      >
                        <ChevronDown
                          className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${showSummary ? 'rotate-180' : ''}`}
                        />
                        <span className="text-gray-700 font-medium">View Summary</span>
                      </button>

                      {showSummary && (
                        <div className="mt-4 bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-6 shadow-sm">
                          {/* Recipients without authentication */}
                          {recipients.filter((recipient) => {
                            const authArray = parseAuthentication(recipient.authentication);
                            const authMethodList = authArray.map(authId => 
                              authMethods.find(m => m.id === authId)
                            ).filter(Boolean);
                            return authMethodList.length === 0;
                          }).length > 0 && (
                            <div className="mb-6">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                Recipients Without Authentication
                              </h4>
                              <div className="space-y-2">
                                {recipients
                                  .filter((recipient) => {
                                    const authArray = parseAuthentication(recipient.authentication);
                                    const authMethodList = authArray.map(authId => 
                                      authMethods.find(m => m.id === authId)
                                    ).filter(Boolean);
                                    return authMethodList.length === 0;
                                  })
                                  .map((recipient) => (
                                    <div
                                      key={recipient.id}
                                      className="flex items-center justify-between p-3 bg-white border border-yellow-200 rounded-lg hover:border-yellow-300 transition-colors"
                                    >
                                      <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-900">
                                          {recipient.name || recipient.email}
                                        </p>
                                        <p className="text-xs text-gray-500">{recipient.email}</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setAuthModalForRecipientId(recipient.id);
                                          setAuthModalForBulk(false);
                                          setShowAuthModal(true);
                                        }}
                                        className="inline-flex items-center gap-2 px-2 py-1 bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-50 border-2 border-yellow-400 rounded-full text-xs font-semibold text-yellow-900 hover:from-yellow-100 hover:via-amber-100 hover:to-yellow-100 hover:border-yellow-500 transition-all duration-200 shadow-md hover:shadow-xl hover:scale-105 animate-golden-shine relative group"
                                      >
                                        <LockKeyhole className="w-4 h-4 relative z-10 text-yellow-700 group-hover:text-yellow-800 transition-colors" />
                                        <span className="relative z-10">Select Authentication</span>
                                      </button>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Balance Summary */}
                          <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Current Balance:</span>
                              <span className="font-semibold text-gray-900">{subscriptionPlan?.creditsBalance || 0} credits</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Deduction:</span>
                              <span className="font-semibold text-red-600">- {calculateTotalCost()} credits</span>
                            </div>
                            <div className="border-t border-gray-300 pt-3 mt-3">
                              <div className="flex justify-between items-center">
                                <span className="text-base font-semibold text-gray-900">Remaining Balance:</span>
                                <span className={`text-xl font-bold ${
                                  ((subscriptionPlan?.creditsBalance || 0) - calculateTotalCost()) >= 0 
                                    ? 'text-green-600' 
                                    : 'text-red-600'
                                }`}>
                                  {(subscriptionPlan?.creditsBalance || 0) - calculateTotalCost()} credits
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>


                    <div className="flex justify-end gap-3 pt-6 mt-8 border-t border-gray-200">
                      <button
                        onClick={() => setSendModalStep(1)}
                        disabled={sending}
                        className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => {
                          // Check if credits are insufficient
                          const totalCost = calculateTotalCost();
                          const creditsBalance = subscriptionPlan?.creditsBalance || 0;
                          
                          if (totalCost > 0 && creditsBalance < totalCost) {
                            // Show subscription modal instead of sending
                            setShowSubscriptionModal(true);
                            toast.error(`Insufficient credits. You need ${totalCost} credits but only have ${creditsBalance}. Please upgrade your plan.`);
                            return;
                          }
                          
                          // If credits are sufficient, proceed with sending
                          if (!sending) {
                            confirmAndSendEnvelope();
                          }
                        }}
                        disabled={sending}
                        className={`px-6 py-2.5 rounded-lg text-white font-medium transition-all flex items-center gap-2 ${
                          (subscriptionPlan?.creditsBalance || 0) - calculateTotalCost() < 0
                            ? 'bg-gray-400 cursor-not-allowed'
                            : sending
                            ? 'bg-[#3E2B66] cursor-wait opacity-90'
                            : 'bg-[#3E2B66] hover:bg-[#4d3577] shadow-sm hover:shadow-md'
                        }`}
                      >
                        {sending && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        )}
                        {sending ? 'Sending Envelope...' : 'Confirm & Send'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {pdfPreviewModalOpen && selectedPdfForPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]" onClick={() => {
          setPdfPreviewModalOpen(false);
          setPdfNumPages(null);
        }}>
          <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] max-w-6xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex-1 mr-4">
                <h2 className="text-lg font-semibold text-gray-900 truncate">
                  {selectedPdfForPreview.name}
                </h2>
                {pdfNumPages && (
                  <p className="text-sm text-gray-500 mt-0.5">{pdfNumPages} {pdfNumPages === 1 ? 'page' : 'pages'}</p>
                )}
              </div>
              <button
                onClick={() => {
                  setPdfPreviewModalOpen(false);
                  setPdfNumPages(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {/* PDF Viewer (React-PDF with local worker) */}
            <div className="flex-1 overflow-hidden bg-gray-100">
              <div className="w-full h-full overflow-auto flex flex-col items-center p-4 gap-4">
                <PDFDocument 
                  file={selectedPdfForPreview.url}
                  onLoadSuccess={({ numPages }) => {
                    setPdfNumPages(numPages);
                  }}
                  onLoadError={(error) => {
                    console.error('Error loading PDF:', error);
                    setPdfNumPages(null);
                  }}
                >
                  {pdfNumPages && [...Array(pdfNumPages)].map((_, index) => (
                    <PDFPage 
                      key={`page_${index + 1}`}
                      pageNumber={index + 1} 
                      width={900}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      className="mb-4 shadow-lg"
                    />
                  ))}
                </PDFDocument>
                {!pdfNumPages && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-500">Loading PDF...</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Method Selection Modal (Global) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => {
              setShowAuthModal(false);
              setAuthModalForRecipientId(null);
              setAuthModalForBulk(false);
              setTempAuthSelection(undefined);
              setHasUserChangedSelection(false);
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[20px] font-semibold text-[#3E2B66]">
                Select Authentication Method
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const methodsToSave = tempAuthSelection || [];
                    handleAuthMethodSelect(methodsToSave);
                  }}
                  className="px-5 py-2 bg-[#3E2B66] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowAuthModal(false);
                    setAuthModalForRecipientId(null);
                    setAuthModalForBulk(false);
                    setTempAuthSelection(undefined);
                    setHasUserChangedSelection(false);
                  }}
                  className="text-[#3E2B66] hover:text-gray-800 z-10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="mt-2">
              <AdvancedAuthenticationSelector
                selectedMethods={(() => {
                  // If user has made a change, always use tempAuthSelection
                  if (hasUserChangedSelection) {
                    return tempAuthSelection || [];
                  }
                  // Otherwise, use the current recipient's authentication
                  if (authModalForBulk) {
                    const firstAuth = recipients.length > 0 ? recipients[0]?.authentication : null;
                    if (!firstAuth) return [];
                    const firstAuthArray = parseAuthentication(firstAuth);
                    const allSame = recipients.every(r => {
                      const rAuth = parseAuthentication(r.authentication);
                      return JSON.stringify(rAuth.sort()) === JSON.stringify(firstAuthArray.sort());
                    });
                    return allSame ? firstAuthArray : [];
                  } else if (authModalForRecipientId) {
                    const recipient = recipients.find(r => r.id === authModalForRecipientId);
                    return parseAuthentication(recipient?.authentication);
                  }
                  return [];
                })()}
                onMethodSelect={handleAuthMethodSelect}
                onSelectionChange={(methodIds) => {
                  setTempAuthSelection(methodIds);
                  setHasUserChangedSelection(true);
                }}
                showSaveButton={false}
                riskLevel="medium"
                complianceRequirements={[]}
              />
            </div>
          </div>
        </div>
      )}

      {/* Recipient List Modal */}
      {showRecipientListModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => {
              setShowRecipientListModal(false);
              setRecipientListModalForId(null);
              setRecipientListSearch('');
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-[20px] font-semibold text-[#3E2B66]">
                Select Recipient
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowAddRecipientForm(!showAddRecipientForm);
                    if (showAddRecipientForm) {
                      setNewRecipientForm({ name: '', email: '', title: '', company: '', phone: '', address: '' });
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {showAddRecipientForm ? 'Cancel' : 'Add New'}
                </button>
                <button
                  onClick={() => {
                    setShowRecipientListModal(false);
                    setRecipientListModalForId(null);
                    setRecipientListSearch('');
                    setShowAddRecipientForm(false);
                    setNewRecipientForm({ name: '', email: '', title: '', company: '', phone: '', address: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Add Recipient Form */}
            {showAddRecipientForm && (
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newRecipientForm.name}
                      onChange={(e) => setNewRecipientForm({ ...newRecipientForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={newRecipientForm.email}
                      onChange={(e) => setNewRecipientForm({ ...newRecipientForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={newRecipientForm.title}
                      onChange={(e) => setNewRecipientForm({ ...newRecipientForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Job title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input
                      type="text"
                      value={newRecipientForm.company}
                      onChange={(e) => setNewRecipientForm({ ...newRecipientForm, company: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={newRecipientForm.phone}
                      onChange={(e) => setNewRecipientForm({ ...newRecipientForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={newRecipientForm.address}
                      onChange={(e) => setNewRecipientForm({ ...newRecipientForm, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Address"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end mt-4">
                  <button
                    onClick={handleAddNewRecipient}
                    disabled={savingNewRecipient || !newRecipientForm.name.trim() || !newRecipientForm.email.trim()}
                    className="inline-flex items-center px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingNewRecipient ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save & Select
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Search Input */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={recipientListSearch}
                  onChange={(e) => setRecipientListSearch(e.target.value)}
                  placeholder="Search recipients..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            {/* Recipient List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingSavedRecipients ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 text-purple-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                  </div>
                </div>
              ) : (() => {
                // Filter recipients based on search
                const filteredRecipients = savedRecipients.filter(r => {
                  const searchLower = recipientListSearch.toLowerCase();
                  const nameMatch = r.name.toLowerCase().includes(searchLower);
                  const emailMatch = r.email.toLowerCase().includes(searchLower);
                  const companyMatch = r.company?.toLowerCase().includes(searchLower);
                  const titleMatch = r.title?.toLowerCase().includes(searchLower);
                  return nameMatch || emailMatch || companyMatch || titleMatch;
                });

                if (filteredRecipients.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {recipientListSearch ? 'No recipients found' : 'No recipients saved'}
                      </h3>
                      <p className="text-gray-500">
                        {recipientListSearch ? 'Try adjusting your search terms' : 'Go to Manage Recipients to add recipients'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {filteredRecipients.map((recipient) => (
                      <button
                        key={recipient._id}
                        onClick={() => selectRecipientFromList(recipient)}
                        className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 mb-1">
                              {recipient.name}
                            </div>
                            <div className="text-sm text-gray-600 mb-1">
                              {recipient.email}
                            </div>
                            {(recipient.title || recipient.company) && (
                              <div className="text-xs text-gray-500 mt-1">
                                {recipient.title && <span>{recipient.title}</span>}
                                {recipient.title && recipient.company && <span> • </span>}
                                {recipient.company && <span>{recipient.company}</span>}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <Check className="w-5 h-5 text-purple-600 opacity-0 group-hover:opacity-100" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Subscription Plans Modal */}
      <SubscriptionPlansModal 
        open={showSubscriptionModal} 
        onClose={() => {
          setShowSubscriptionModal(false);
          // Refresh subscription plan after modal closes (in case user upgraded)
          const refreshPlan = async () => {
            try {
              const planResponse = await subscriptionApi.get('/user-plan/me');
              if (planResponse.data?.data) {
                setSubscriptionPlan(planResponse.data.data);
                SubscriptionStorage.savePlan(planResponse.data.data);
                window.dispatchEvent(new CustomEvent('credits-updated'));
              }
            } catch (err) {
              console.error('Failed to refresh plan:', err);
            }
          };
          refreshPlan();
        }} 
      />
    </div>
  );
};

export default EnvelopeCreator;
