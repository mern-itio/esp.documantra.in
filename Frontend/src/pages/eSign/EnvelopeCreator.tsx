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
import { referralMilestoneSwalHtml } from '../../utils/referralMilestoneUi';
import { isAuthMethodFreeViaReferralPerk } from '../../utils/referralAuthPerks';
import toast from 'react-hot-toast';
// import { useApp } from '../../context/AppContext';
import { useAuth } from '../../components/AuthService/AuthContext';
import type { Document as ESDocument, Recipient } from '../../types';
import AdvancedAuthenticationSelector from '../../components/ESign/advanced/AdvancedAuthenticationSelector';
import SignatureTypeSelector from '../../components/ESign/advanced/SignatureTypeSelector';
import { eSignApi, subscriptionApi } from '../../services/apiHelper';
import { SubscriptionStorage } from '../../services/subscriptionService';
import SigningEditorStep from '../../components/ESign/SigningEditorStep';
import SavedRecipientContactFields from '../../components/ESign/SavedRecipientContactFields';
import {
  validateSavedRecipientForm,
  validateSavedRecipientField,
  isSavedRecipientFormValid,
  type SavedRecipientFormValues,
  type SavedRecipientFormErrors,
} from '../../components/ESign/recipientContactFormValidation';
import { SubscriptionPlansModal } from '../../components/common/SubscriptionPlansModal';
import { debounce } from '../../components/common/lib/utils';
import type { SignatureField as EditorSignatureField } from '../../components/ESign/SigningEditorStep';
type EditorSignatureFieldExt = EditorSignatureField & {
  signerIndex?: number | null;
  isPowerForm?: boolean;
  fieldType?: string;
  option?: string[];
};
import type { AxiosProgressEvent } from 'axios';
type Party = {
  id: string;
  name: string;
  slot: number;
  role?: 'signer' | 'approver' | 'carbon_copy' | string;
  authMethod?: 'email' | 'sms' | 'access_code' | 'none' | string;
  required?: boolean;
};
type EnvelopeRecipient = Recipient & { phone?: string };

import { Document as PDFDocument, Page as PDFPage } from 'react-pdf';
import DatePicker from 'react-datepicker';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import "react-datepicker/dist/react-datepicker.css";
import { toTitleCase } from '../../utils/formatName';
import { APP_NAME } from '../../components/constants/appConfig';

/** Match saved recipient rows by name, email, company, title, or phone (digits normalized). */
function recipientListRowMatchesQuery(
  r: {
    name: string;
    email: string;
    title?: string;
    company?: string;
    phone?: string;
  },
  rawQuery: string
): boolean {
  const q = rawQuery.trim();
  if (!q) return true;

  const searchLower = q.toLowerCase();
  const textMatch =
    r.name.toLowerCase().includes(searchLower) ||
    r.email.toLowerCase().includes(searchLower) ||
    (r.company?.toLowerCase().includes(searchLower) ?? false) ||
    (r.title?.toLowerCase().includes(searchLower) ?? false);
  if (textMatch) return true;

  const queryDigits = q.replace(/\D/g, '');
  if (queryDigits.length < 1) return false;

  const phoneDigits = (r.phone || '').replace(/\D/g, '');
  return phoneDigits.length > 0 && phoneDigits.includes(queryDigits);
}

const EnvelopeCreator: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { envelopeId: routeEnvelopeId } = useParams<{ envelopeId: string }>();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, _setMode] = useState<'normal' | 'power'>('normal');
  const [_powerForms, _setPowerForms] = useState<any[]>([]);
  const [selectedForm, _setSelectedForm] = useState<string>("");
  const [powerFormData, _setPowerFormData] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);

  const [parties, _setParties] = useState<Party[]>(
    [{ id: 'slot_1', name: 'Party A', slot: 1, role: 'signer', authMethod: 'email', required: true }]
  );
  const [numberOfParties, __setNumberOfParties] = useState<number>(parties.length || 1);
  const [_maxParties] = useState<number>(10);
  const [selectedPartyId, _setSelectedPartyId] = useState<string>(parties[0]?.id ?? 'slot_1');
  const [firstSigningPartyId, _setFirstSigningPartyId] = useState<string>(parties[0]?.id ?? 'slot_1');
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
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [documents, setDocuments] = useState<ESDocument[]>([]);
  const [recipients, setRecipients] = useState<EnvelopeRecipient[]>([]);
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
  const hasInPersonSigner = useMemo(
    () =>
      recipients.some(
        (r) => (r.role || '').toString().toLowerCase() === 'in_person_signer'
      ),
    [recipients]
  );
  const hasNonInPersonSigner = useMemo(
    () =>
      recipients.some((r) => {
        const role = (r.role || 'signer').toString().toLowerCase();
        return role !== 'in_person_signer' && role !== 'carbon_copy';
      }),
    [recipients]
  );
  const isInPersonOnlyFlow = hasInPersonSigner && !hasNonInPersonSigner;
  useEffect(() => {
    const loadDocument = async () => {
      const documentData = location.state?.documentData;
      if (documentData && documentData.content && documents.length === 0) {
        try {
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

          const pageCount = await getPDFPageCount(file);

          const newDocument: ESDocument = {
            id: `doc_${Date.now()}_${Math.random()}`,
            name: file.name,
            size: file.size,
            pages: pageCount,
            type: file.type,
            url: URL.createObjectURL(file),
            file: file,
          };

          setDocuments([newDocument]);
          setEnvelopeData(prev => ({
            ...prev,
            subject: prev.subject || `Complete with Draft&Sign: ${file.name}`
          }));

          navigate(location.pathname, { replace: true, state: null });
        } catch (error) {
          console.error('Error processing document from state:', error);
        }
      } else if (documents.length === 0) {
        const pendingDocId = localStorage.getItem('pendingDocumentId');
        const pendingSessionId = localStorage.getItem('pendingSessionId');

        if (pendingDocId || pendingSessionId) {
          try {
            const { aiContentService } = await import('../../services/aiContentService');
            const response = await aiContentService.getPendingDocument(pendingDocId || undefined, pendingSessionId || undefined);

            if (response.success && response.data) {
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

                const pageCount = await getPDFPageCount(file);
                const newDocument: ESDocument = {
                  id: `doc_${Date.now()}_${Math.random()}`,
                  name: file.name,
                  size: file.size,
                  pages: pageCount,
                  type: file.type,
                  url: URL.createObjectURL(file),
                  file: file,
                };

                setDocuments([newDocument]);
                setEnvelopeData(prev => ({
                  ...prev,
                  subject: prev.subject || `Complete with Draft&Sign: ${file.name}`
                }));

                localStorage.removeItem('pendingDocumentId');
                localStorage.removeItem('pendingSessionId');
              }
            }
          } catch (error) {
            console.error('Error loading pending document:', error);
            localStorage.removeItem('pendingDocumentId');
            localStorage.removeItem('pendingSessionId');
          }
        }
      }
    };

    loadDocument();
  }, [location.state]);

  useEffect(() => {
    if (documents?.length > 0 && !documentTitle) {
      const defaultTitle = `Complete with Draft&Sign: ${documents[0]?.name || 'Document'}`;
      setDocumentTitle(defaultTitle);
      setTitleInput(defaultTitle);
      if (!envelopeData.subject) {
        setEnvelopeData(prev => ({ ...prev, subject: defaultTitle }));
      }
    }
  }, [documents]);

  useEffect(() => {
    if (documents && documents.length > 0) {
      setStackedDocIndex(prev => Math.max(0, Math.min(prev, documents.length - 1)));
    }
  }, [documents?.length]);
  const [showDocuments, setShowDocuments] = useState(true);
  const [stackedDocIndex, setStackedDocIndex] = useState(0);
  const [openRoleDropdownId, setOpenRoleDropdownId] = useState<string | null>(null);
  const [openCustomizeDropdownId, setOpenCustomizeDropdownId] = useState<string | null>(null);
  const [setSigningOrder, setSetSigningOrder] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const RECIPIENT_COLORS = ["#789ceaff", "#87ecccff", "#f0c089ff", "#eea1c3ff", "#b99aeeff", "#f7b1bcff"];
  const [showSigningOrder, setShowSigningOrder] = useState(false);
  const [draggedRecipientId, setDraggedRecipientId] = useState<string | null>(null);
  const [dragOverRecipientId, setDragOverRecipientId] = useState<string | null>(null);
  const [tempOrderValues, setTempOrderValues] = useState<Record<string, number>>({});
  const [_isReordering, setIsReordering] = useState(false);
  const [reorderingRecipientId, setReorderingRecipientId] = useState<string | null>(null);
  const [reorderedPillIds, setReorderedPillIds] = useState<Set<string>>(new Set());
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
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalForRecipientId, setAuthModalForRecipientId] = useState<string | null>(null);
  const [authModalForBulk, setAuthModalForBulk] = useState<boolean>(false);
  const [tempAuthSelection, setTempAuthSelection] = useState<string[] | undefined>(undefined);
  const [hasUserChangedSelection, setHasUserChangedSelection] = useState<boolean>(false);
  const [showMissingRecipientPhoneModal, setShowMissingRecipientPhoneModal] = useState<boolean>(false);
  const [missingPhoneRecipientId, setMissingPhoneRecipientId] = useState<string | null>(null);
  const [missingPhoneValue, setMissingPhoneValue] = useState<string>('');
  const [missingPhoneError, setMissingPhoneError] = useState<string>('');
  const [pendingAuthSelectionAfterPhone, setPendingAuthSelectionAfterPhone] = useState<string[] | null>(null);
  const [savingMissingPhone, setSavingMissingPhone] = useState<boolean>(false);

  const DEFAULT_AUTH_METHOD_ID = '68ee2a18ba0c0738eb275d34';
  const DEFAULT_AUTH_JSON = JSON.stringify([{ authMethodId: DEFAULT_AUTH_METHOD_ID, status: 'pending' }]);

  const parseAuthentication = (auth: string | undefined | null): string[] => {
    if (!auth) return [];
    try {
      const parsed = JSON.parse(auth);
      if (Array.isArray(parsed)) {
        // Handle array of auth IDs (e.g. ["id1", "id2"]) or array of auth objects
        if (parsed.every((item) => typeof item === 'string')) {
          return parsed as string[];
        }
        return (parsed as any[])
          .map((item) => {
            if (!item || typeof item !== 'object') return null;
            return item.authMethodId ?? item.id ?? null;
          })
          .filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
      }
      if (typeof parsed === 'string') return [parsed];
      if (parsed && typeof parsed === 'object') {
        const id = (parsed as any).authMethodId ?? (parsed as any).id;
        return id ? [id] : [];
      }
      return [];
    } catch {
      return typeof auth === 'string' && auth.trim().length > 0 ? [auth] : [];
    }
  };

  const stringifyAuthentication = (auth: string[] | null | undefined): string | null => {
    if (!auth || auth.length === 0) return null;
    const items = auth
      .filter((id) => typeof id === 'string' && id.trim().length > 0)
      .map((id) => ({ authMethodId: id, status: 'pending' }));
    return items.length > 0 ? JSON.stringify(items) : null;
  };

  const loadAvailableAuthMethods = async (): Promise<any[]> => {
    if (authMethods.length > 0) return authMethods;
    try {
      const authResponse = await subscriptionApi.get('/user/available/auth/methods');
      const methods = authResponse?.data?.data?.methods || [];
      if (Array.isArray(methods) && methods.length > 0) {
        setAuthMethods(methods);
        return methods;
      }
    } catch (err) {
      console.warn('Failed to load auth methods for recipient requirement checks', err);
    }
    return authMethods;
  };

  const selectionRequiresPhone = async (selectedMethodIds: string[]): Promise<boolean> => {
    if (!selectedMethodIds || selectedMethodIds.length === 0) return false;
    const hasSmsLikeText = (value: any): boolean => {
      const t = String(value || '').toLowerCase();
      return t.includes('sms') || t.includes('phone') || t.includes('mobile');
    };
    const hasPhoneRequirement = (method: any): boolean => {
      const reqArrays = [
        method?.requiredFields,
        method?.requirements,
        method?.metadata?.requiredFields,
        method?.inputFields,
        method?.uiSchema?.requiredFields,
      ].filter(Array.isArray);

      return reqArrays.some((arr: any[]) =>
        arr.some((f: any) => {
          const v = typeof f === 'string' ? f : (f?.name || f?.field || f?.key || '');
          const t = String(v || '').toLowerCase();
          return t.includes('phone') || t.includes('mobile') || t.includes('sms');
        })
      );
    };

    const methodsPool = await loadAvailableAuthMethods();

    return selectedMethodIds.some((id) => {
      const method = methodsPool.find((m: any) => {
        const methodId = String(m?.id ?? m?._id ?? m?.authMethodId ?? '').trim();
        return methodId === String(id).trim();
      });
      if (!method) return hasSmsLikeText(id);
      return (
        hasPhoneRequirement(method) ||
        hasSmsLikeText(method?.name) ||
        hasSmsLikeText(method?.key) ||
        hasSmsLikeText(method?.slug) ||
        hasSmsLikeText(method?.type) ||
        hasSmsLikeText(method?.verificationType) ||
        hasSmsLikeText(method?.channel) ||
        hasSmsLikeText(method?.description) ||
        hasSmsLikeText(method?.uiSchema?.title) ||
        hasSmsLikeText(method?.uiSchema?.description)
      );
    });
  };

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

  useEffect(() => {
    if (!showAuthModal) {
      setHasUserChangedSelection(false);
      setTempAuthSelection(undefined);
    }
  }, [showAuthModal]);
  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };
  const [shouldOpenAuthModalFromTour, setShouldOpenAuthModalFromTour] = useState<boolean>(false);
  const [showSendConfirmationModal, setShowSendConfirmationModal] = useState<boolean>(false);
  const [sendModalStep, setSendModalStep] = useState<1 | 2>(1);
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [scheduledDate, setScheduledDate] = useState<string>(getTomorrowDate());
  const [scheduledTime, setScheduledTime] = useState<string>('10:00');
  const [scheduledDateTime, setScheduledDateTime] = useState<Date>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow;
  });

  const getMinTime = (): Date => {
    const now = new Date();
    const selected = scheduledDateTime;
    if (
      selected.getDate() === now.getDate() &&
      selected.getMonth() === now.getMonth() &&
      selected.getFullYear() === now.getFullYear()
    ) {
      const minTime = new Date(now);
      minTime.setMinutes(minTime.getMinutes() + 1);
      return minTime;
    }
    return new Date(0, 0, 0, 0, 0);
  };
  const [draggedSignerId, setDraggedSignerId] = useState<string | null>(null);
  const [dragOverSignerId, setDragOverSignerId] = useState<string | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<any>(null);
  const [authMethods, setAuthMethods] = useState<any[]>([]);
  const [helpMenuOpen, setHelpMenuOpen] = useState<boolean>(false);
  const [helpSidebarOpen, setHelpSidebarOpen] = useState<boolean>(false);
  const helpMenuRef = useRef<HTMLDivElement | null>(null);
  const helpButtonRef = useRef<HTMLButtonElement | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<boolean>(false);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const hasRecipientsWithAuth = useMemo(() => {
    return recipients.some((recipient) => {
      const authArray = parseAuthentication(recipient.authentication);
      const authMethodList = authArray.map(authId =>
        authMethods.find(m => m.id === authId)
      ).filter(Boolean);
      return authMethodList.length > 0;
    });
  }, [recipients, authMethods]);
  useEffect(() => {
    if (!hasRecipientsWithAuth && recipients.length > 0) {
      setShowSummary(true);
    } else if (hasRecipientsWithAuth) {
      setShowSummary(false);
    }
  }, [hasRecipientsWithAuth, recipients.length]);

  useEffect(() => {
    if (!helpMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
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

  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const advancedContentRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = {
    recipientPrivileges: useRef<HTMLDivElement | null>(null),
    reminders: useRef<HTMLDivElement | null>(null),
    expiration: useRef<HTMLDivElement | null>(null),
    mobileFriendly: useRef<HTMLDivElement | null>(null),
    comments: useRef<HTMLDivElement | null>(null),
  } as const;

  const [advancedOptions, setAdvancedOptions] = useState({
    canSignOnPaper: true,
    canDelegate: false,
    expirationDays: 120,
    expirationAlertDays: 0,
    expirationType: 'custom' as 'custom' | 'never',
    alertType: 'custom' as 'custom' | 'never',
    responsiveSigning: true,
    commentsEnabled: false,
  });
  const [csvRecipientList, setCsvRecipientList] = useState<null | { fileName: string; role: Recipient['role']; items: Array<{ name: string; email: string }> }>(null);
  const [csvRoleDropdownOpen, setCsvRoleDropdownOpen] = useState<boolean>(false);
  const [csvCustomizeOpen, setCsvCustomizeOpen] = useState<boolean>(false);
  const [_csvAccessCode, setCsvAccessCode] = useState<string | undefined>(undefined);
  const [_openCsvAccess, setOpenCsvAccess] = useState<boolean>(false);
  const [_csvPrivateMessage, setCsvPrivateMessage] = useState<string | undefined>(undefined);
  const [_openCsvPrivate, setOpenCsvPrivate] = useState<boolean>(false);
  const [showEnvelopeTooltip, setShowEnvelopeTooltip] = useState(false);
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
    const timeoutId = setTimeout(() => {
      const el = document.querySelector(step?.selector || '') as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
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
  const closeCreatorTour = () => {
    setIsCreatorTourOpen(false);
    setCreatorTourIndex(0);
    setCreatorTargetRect(null);
    markTourAsCompleted();
  };
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
        setShowRecipients(true);
        if (!recipients || recipients.length === 0) {
          addRecipient();
        }
        setShouldOpenAuthModalFromTour(true);
      }
      if (step?.id === 'bulkSend') {
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

  const hasCompletedCreatorTour = () => {
    try {
      const completed = localStorage.getItem('creatorTourCompleted');
      return completed === 'true';
    } catch {
      return false;
    }
  };

  const markTourAsCompleted = () => {
    try {
      localStorage.setItem('creatorTourCompleted', 'true');
    } catch (error) {
      console.error('Error saving tour completion:', error);
    }
  };

  useEffect(() => {
    if (!creatorTourStartedRef.current) {
      creatorTourStartedRef.current = true;

      const isNewUser = user?.isFirstLogin === true;
      const hasCompleted = hasCompletedCreatorTour();

      if (isNewUser && !hasCompleted) {
        setIsCreatorTourOpen(true);
        setCreatorTourIndex(0);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!shouldOpenAuthModalFromTour) return;

    const timeoutId = setTimeout(() => {
      const customizeButton = document.querySelector('[data-tour="ec-customize"]') as HTMLElement;
      if (customizeButton) {
        const recipientRow = customizeButton.closest('.recipient-row, [data-recipient-id]');
        let recipientId: string | null = null;
        if (recipientRow) {
          const dataId = (recipientRow as HTMLElement).getAttribute('data-recipient-id');
          if (dataId) recipientId = dataId;
        }
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
        setAuthModalForRecipientId(recipients[0].id);
        setAuthModalForBulk(false);
        setShowAuthModal(true);
        setShouldOpenAuthModalFromTour(false);
      }
    }, 600);

    return () => clearTimeout(timeoutId);
  }, [shouldOpenAuthModalFromTour, recipients]);

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
    hasAutoAddedRecipient.current = true;

    setRecipients(prev => {
      const filtered = prev.filter(r => r.name && r.name.trim() && r.email && r.email.trim());

      const nextOrder = filtered.length > 0 ? Math.max(...filtered.map(r => r.order || 0)) + 1 : 1;

      const bulkRecipients: Recipient[] = cleaned.map((item, idx) => ({
        id: `bulk_recipient_${Date.now()}_${idx}`,
        name: item.name,
        email: item.email,
        role: roleToUse,
        order: nextOrder + idx,
        status: 'waiting' as const,
        authentication: DEFAULT_AUTH_JSON as Recipient['authentication'] // Default: secret email verification
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
    setBulkList(null);
    setCsvRecipientList(null);
    setCsvAccessCode(undefined);
    setCsvPrivateMessage(undefined);
    setOpenCsvAccess(false);
    setOpenCsvPrivate(false);
    setCsvFile(null);
    setCsvHeaders([]);
    setCsvRecipientsData([]);
    setShowCsvExceptions(false);
    setUnmatchedColumns([]);
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
  const [showRecipientListModal, setShowRecipientListModal] = useState(false);
  const [recipientListModalForId, setRecipientListModalForId] = useState<string | null>(null);
  type SavedRecipientRow = {
    _id: string;
    name: string;
    email: string;
    title?: string;
    company?: string;
    phone?: string;
    address?: string;
    /** True only if row came from GET /recipients (your address book). Envelope-only rows are not deletable via that API. */
    addressBookEntry: boolean;
  };
  const [savedRecipients, setSavedRecipients] = useState<SavedRecipientRow[]>([]);
  const [loadingSavedRecipients, setLoadingSavedRecipients] = useState(false);
  const [recipientListSearch, setRecipientListSearch] = useState('');
  const [showAddRecipientForm, setShowAddRecipientForm] = useState(false);
  const [newRecipientForm, setNewRecipientForm] = useState<SavedRecipientFormValues>({
    name: '',
    email: '',
    title: '',
    company: '',
    phone: '',
    address: '',
  });
  const [recipientFormErrors, setRecipientFormErrors] = useState<SavedRecipientFormErrors>({});
  const [savingNewRecipient, setSavingNewRecipient] = useState(false);
  /** Mongo ObjectId for saved address-book row; only those rows can be edited/deleted via API */
  const [editingSavedRecipientId, setEditingSavedRecipientId] = useState<string | null>(null);
  const [deletingSavedRecipientId, setDeletingSavedRecipientId] = useState<string | null>(null);

  const isPersistedAddressBookRecipientId = (id: string) => /^[a-f\d]{24}$/i.test(String(id || ''));

  const resetNewRecipientFormState = () => {
    setNewRecipientForm({
      name: '',
      email: '',
      title: '',
      company: '',
      phone: '',
      address: '',
    });
    setRecipientFormErrors({});
  };

  const handleSavedRecipientFieldChange = (
    field: keyof SavedRecipientFormValues,
    value: string
  ) => {
    setNewRecipientForm((prev) => {
      const next = { ...prev, [field]: value };
      const msg = validateSavedRecipientField(field, next);
      setRecipientFormErrors((er) => {
        const copy: SavedRecipientFormErrors = { ...er };
        if (msg) copy[field] = msg;
        else delete copy[field];
        return copy;
      });
      return next;
    });
  };

  const handleSavedRecipientPhoneChange = (val: string) => {
    setNewRecipientForm((prev) => {
      const next = { ...prev, phone: val };
      const msg = validateSavedRecipientField('phone', next);
      setRecipientFormErrors((er) => {
        const copy: SavedRecipientFormErrors = { ...er };
        if (msg) copy.phone = msg;
        else delete copy.phone;
        return copy;
      });
      return next;
    });
  };

  const [envelopeTypes, setEnvelopeTypes] = useState<any[]>([]);
  const [selectedEnvelopeType, setSelectedEnvelopeType] = useState<string>('');
  const [typeDropdownOpen, setTypeDropdownOpen] = useState<boolean>(false);
  const [typeSearch, setTypeSearch] = useState<string>('');
  const [showOtherInputInDropdown, setShowOtherInputInDropdown] = useState<boolean>(false);
  const [newEnvelopeTypeValue, setNewEnvelopeTypeValue] = useState<string>('');
  const typeDropdownRef = useRef<HTMLDivElement | null>(null);
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

    const subjectWasAuto = (envelopeData.subject || '').trim().startsWith('Complete with Esign:');
    if (!envelopeData.subject || envelopeData.subject.trim() === '' || subjectWasAuto) {
      const names = Array.from(files).map(f => f.name).filter(Boolean);
      if (names.length > 0) {
        setEnvelopeData(prev => ({ ...prev, subject: `Complete with Esign: ${names.join(', ')}` }));
      }
    }

    processFiles(Array.from(files));
  };

  const getPDFPageCount = async (file: File): Promise<number> => {
    return new Promise(async (resolve) => {
      try {
        // Load PDF.js if not available
        let pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib && typeof window !== 'undefined') {
          try {
            const pdfjsModule = await import('pdfjs-dist');
            pdfjsLib = pdfjsModule;
            if (pdfjsLib.GlobalWorkerOptions) {
              pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
            }
            (window as any).pdfjsLib = pdfjsLib;
          } catch (importError) {
            console.warn('PDF.js not available, using estimate:', importError);
            resolve(Math.ceil(file.size / 100000));
            return;
          }
        }

        if (pdfjsLib) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const arrayBuffer = e.target?.result as ArrayBuffer;
              const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
              const pdf = await loadingTask.promise;
              resolve(pdf.numPages);
            } catch (error) {
              console.error('Error reading PDF pages:', error);
              // Fallback to estimate if PDF.js fails
              resolve(Math.ceil(file.size / 100000));
            }
          };
          reader.onerror = () => {
            // Fallback to estimate on error
            resolve(Math.ceil(file.size / 100000));
          };
          reader.readAsArrayBuffer(file);
        } else {
          // Fallback if PDF.js is not available
          resolve(Math.ceil(file.size / 100000));
        }
      } catch (error) {
        console.error('Error getting PDF page count:', error);
        // Fallback to estimate
        resolve(Math.ceil(file.size / 100000));
      }
    });
  };

  const processFiles = async (files: File[]) => {
    const validDocs: ESDocument[] = [];
    const invalidFiles: File[] = [];

    for (const file of files) {
      // Only accept PDF files
      if (file.type !== "application/pdf") {
        invalidFiles.push(file);
        continue; // skip adding invalid file
      }

      // Get actual page count from PDF
      const pageCount = await getPDFPageCount(file);

      const newDocument: ESDocument = {
        id: `doc_${Date.now()}_${Math.random()}`,
        name: file.name,
        size: file.size,
        pages: pageCount, // Actual page count from PDF
        type: file.type,
        url: URL.createObjectURL(file),
        file: file,
      };
      validDocs.push(newDocument);
    }

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
      // Include name, subject, message and envelopetype from Step 1
      if (documentTitle && documentTitle.trim()) {
        formData.append('name', documentTitle.trim());
      }
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

        // Verify and update page counts for documents loaded from backend
        const docsWithPageCounts = await Promise.all(
          apiDocs.map(async (doc: any) => {
            // If page count is missing or seems incorrect, recalculate it
            if (!doc.pages || doc.pages === 1) {
              try {
                // Try to fetch the document and count pages
                const docUrl = doc.url || `${import.meta.env.VITE_ESIGN_SERVICE_URL}/uploads/${encodeURIComponent(doc.name || '')}`;
                const fetchResponse = await fetch(docUrl);
                if (fetchResponse.ok) {
                  const blob = await fetchResponse.blob();
                  const file = new File([blob], doc.name || 'document.pdf', { type: 'application/pdf' });
                  const pageCount = await getPDFPageCount(file);
                  return { ...doc, pages: pageCount };
                }
              } catch (error) {
                console.warn('Could not verify page count for document:', doc.name, error);
              }
            }
            return doc;
          })
        );

        setDocuments(docsWithPageCounts);
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
        // Load envelope name if available
        if (typeof env.name === 'string' && env.name.trim()) {
          setDocumentTitle(env.name.trim());
          setTitleInput(env.name.trim());
        }
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
          name: documentTitle || undefined,
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
          name: documentTitle || undefined,
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
      authentication: DEFAULT_AUTH_JSON // Default: secret email verification
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

  const updateRecipient = (id: string, updates: Partial<EnvelopeRecipient>) => {
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
  const handleAuthMethodSelect = async (
    methodIds: string | null | string[],
    options?: { bypassRecipientPhoneCheck?: boolean; forceRecipientId?: string }
  ) => {
    try {
      // Normalize to array: handle both single string and array
      let normalizedMethods: string[] = [];
      if (Array.isArray(methodIds)) {
        normalizedMethods = methodIds
          .map((item: any) => item?.authMethodId || item)
          .filter((id: any) => typeof id === "string" && id.trim().length > 0);
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
            phone: r.phone || null,
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
      } else if (authModalForRecipientId || options?.forceRecipientId) {
        const targetRecipientId = options?.forceRecipientId || authModalForRecipientId;
        const targetRecipient = recipients.find(r => r.id === targetRecipientId);
        const requiresPhone = await selectionRequiresPhone(normalizedMethods);

        if (
          targetRecipientId &&
          targetRecipient &&
          !options?.bypassRecipientPhoneCheck &&
          requiresPhone &&
          String(targetRecipient.phone || '').replace(/\D/g, '').length === 0
        ) {
          setShowAuthModal(false);
          setMissingPhoneRecipientId(targetRecipientId);
          setPendingAuthSelectionAfterPhone(normalizedMethods);
          setMissingPhoneValue(String(targetRecipient.phone || ''));
          setMissingPhoneError('');
          setShowMissingRecipientPhoneModal(true);
          return;
        }

        // Apply to specific recipient
        if (targetRecipientId) {
          updateRecipient(targetRecipientId, { authentication: authString || undefined });
        }

        // If we have an envelopeId, persist the recipient authentication in DB
        if (envelopeId) {
          const recipient = recipients.find(r => r.id === targetRecipientId);
          if (recipient) {
            const recipientPayload = [{
              name: recipient.name,
              email: recipient.email,
              phone: recipient.phone || null,
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
        setRecipients((prev) =>
          prev.map((r) => {
            if (r.id !== id) return r;
            const typedName = (r.name || '').trim();
            return {
              ...r,
              email: recipient.email || r.email,
              ...(typedName ? {} : { name: recipient.name || r.name }),
            };
          })
        );
      }
    } catch (err) {
      console.log(`Handle email on Blur`);
    }
  };

  const handleRecipientDragStart = (e: React.DragEvent, recipientId: string) => {
    if (!setSigningOrder) {
      e.preventDefault();
      return;
    }

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

      const updated = prev.map(r => {
        if (r.id === draggedRecipientId) {
          return { ...r, order: targetOrder };
        }
        if (r.id === targetRecipientId) {
          return { ...r, order: draggedOrder };
        }
        return r;
      });
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
    const isDbRecord = /^[a-fA-F0-9]{24}$/.test(id);

    if (isDbRecord) {
      try {
        await eSignApi.post(`/api/e-sign/envelope/remove-recipient/${id}/${envelopeId}`);
      } catch (error) {
        console.error('Failed to delete recipient from DB:', error);
      }
    }
    setRecipients(prev => {
      const removed = prev.filter(recipient => recipient.id !== id);
      const normalized = normalizeOrders(removed);
      if (id === activeRecipientId) {
        if (normalized.length > 0 && normalized.length > 3) {
          setActiveRecipientId(normalized[0].id);
        } else {
          setActiveRecipientId(null);
        }
      } else if (normalized.length <= 3) {
        setActiveRecipientId(null);
      }
      return normalized;
    });
  };
  const fetchSendConfirmationData = async () => {
    try {
      let latestPlan: any = null;
      const planResponse = await subscriptionApi.get('/user-plan/me');
      if (planResponse.status === 200) {
        latestPlan = planResponse.data.data;
        setSubscriptionPlan(latestPlan);
        SubscriptionStorage.savePlan(latestPlan);
      }
      const authResponse = await subscriptionApi.get('/user/available/auth/methods');
      if (authResponse.status === 200) {
        setAuthMethods(authResponse.data.data.methods || []);
      }
      return latestPlan;
    } catch (error) {
      console.error('Error fetching send confirmation data:', error);
      return null;
    }
  };

  const handleSendEnvelope = async () => {
    console.log('handleSendEnvelope called', { envelopeId, mode });
    if (!envelopeId) {
      toast.error('Envelope ID is missing. Please save the envelope first.');
      console.error('Cannot send envelope: envelopeId is missing');
      return;
    }
    // Pure in-person flow (only in_person_signer + CC): skip the two-step
    // confirmation modal and go straight to confirmAndSendEnvelope so there
    // is no mail-sending summary/success UI.
    if (!isScheduled && isInPersonOnlyFlow) {
      try {
        await confirmAndSendEnvelope();
      } catch (error) {
        console.error('Error in in-person send flow:', error);
      }
      return;
    }

    try {
      const latestPlan = await fetchSendConfirmationData();
      const effectivePlan = latestPlan || subscriptionPlan || SubscriptionStorage.getPlan();
      const totalCost = calculateTotalCost();
      const creditsBalance = Number(effectivePlan?.creditsBalance || 0);

      if (totalCost > 0 && creditsBalance < totalCost) {
        setShowSubscriptionModal(true);
        toast.error(`Insufficient credits. You need ${totalCost} credits but only have ${creditsBalance}. Please upgrade your plan.`);
        return;
      }

      setSendModalStep(1);
      setShowSendConfirmationModal(true);
    } catch (error) {
      console.error('Error preparing send confirmation:', error);
      setSendModalStep(1);
      setShowSendConfirmationModal(true);
      toast.error('Failed to load some data, but you can still proceed.');
    }
  };

  const confirmAndSendEnvelope = async () => {
    if (!envelopeId) return;

    if (isScheduled && scheduledDate) {
      setShowSendConfirmationModal(false);
      try {
        const timezoneOffset = new Date().getTimezoneOffset() * -1;
        await eSignApi.post(`/api/e-sign/schedule-envelope/${envelopeId}`, {
          scheduledDate,
          scheduledTime: scheduledTime || null,
          timezoneOffset: timezoneOffset
        });
        navigate(`/e-sign/aggrement?scheduled=true&envelopeId=${envelopeId}`);
      } catch (err: any) {
        console.error('Error scheduling envelope:', err);
        Swal.fire({
          title: "Error",
          text: err?.response?.data?.message || "Failed to schedule envelope. Please try again.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
      return;
    }
    const totalCost = calculateTotalCost();
    const effectivePlan = subscriptionPlan || SubscriptionStorage.getPlan();
    const creditsBalance = Number(effectivePlan?.creditsBalance || 0);

    if (totalCost > 0 && creditsBalance < totalCost) {
      setShowSendConfirmationModal(false);
      setSending(false);
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

      // Send the envelope immediately (only if not scheduled)
      const sendResp = await eSignApi.post(`/api/e-sign/send-envelope/${envelopeId}`);
      const milestone = sendResp?.data?.referralMilestone;
      // Release sending UI + close modal before showing any popup to avoid overlay-lock issues.
      setShowSendConfirmationModal(false);
      setSending(false);
      if (milestone?.achieved) {
        await Swal.fire({
          icon: 'success',
          title: 'Milestone achieved!',
          html: referralMilestoneSwalHtml(milestone),
          confirmButtonText: 'Awesome',
        });
        // Milestone popup already shown; avoid triggering Agreement success popup again.
        navigate('/e-sign/aggrement');
      } else {
        // Keep existing app flow: Agreement page shows the standard success popup via `sent=true`.
        navigate('/e-sign/aggrement?sent=true');
      }

      // Record credit usage
      const totalCost = calculateTotalCost();
      if (totalCost > 0 && subscriptionPlan) {
        try {
          // Include all recipients with authentication, including email verification
          const recipientsWithAuth = recipients.filter(r => parseAuthentication(r.authentication).length > 0);
          if (recipientsWithAuth.length > 0) {
            const planForConsume = subscriptionPlan || SubscriptionStorage.getPlan();
            await Promise.all(recipientsWithAuth.flatMap(recipient => {
              const authArray = parseAuthentication(recipient.authentication);
              return authArray.map(authId => {
                const authMethod = authMethods.find(m => m.id === authId);
                const cost = authMethod?.cost || 0;
                if (cost > 0 && !isAuthMethodFreeViaReferralPerk(authMethod, planForConsume)) {
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

      // For pure in-person flows (no email signers), immediately open the first in-person
      // signer link so the host can hand over the device.
      if (isInPersonOnlyFlow) {
        const firstInPerson = normalizedRecipients.find((r) => {
          const role = (r.role || '').toString().toLowerCase();
          return role === 'in_person_signer';
        });
        const base = window.location.origin.replace(/\/+$/, '');
        if (firstInPerson && firstInPerson.id && base) {
          const url = `${base}/e-sign/signer/${envelopeId}/${firstInPerson.id}`;
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      }

      // Navigation is already handled above by milestone/normal branch.
    } catch (err) {
      console.error(err);
      // Close modal before showing error alert
      setShowSendConfirmationModal(false);

      Swal.fire({
        title: "Error",
        text: "Failed to send envelope. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setSending(false);
    }
  };

  // Calculate total cost based on authentication methods (referral perks can waive a named method)
  const calculateTotalCost = (): number => {
    const plan = subscriptionPlan || SubscriptionStorage.getPlan();
    let total = 0;

    recipients.forEach((recipient) => {
      const authArray = parseAuthentication(recipient.authentication);
      if (authArray.length === 0) return;

      authArray.forEach((auth: any) => {
        const methodId = typeof auth === "string" ? auth : auth.authMethodId;

        const authMethod = authMethods.find((m) => m.id === methodId);

        if (authMethod) {
          if (isAuthMethodFreeViaReferralPerk(authMethod, plan)) return;
          total += authMethod.cost || 0;
        }
      });
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

  const handleSaveNewEnvelopeType = () => {
    if (!newEnvelopeTypeValue.trim()) {
      return;
    }

    setSelectedEnvelopeType(newEnvelopeTypeValue.trim());
    setShowOtherInputInDropdown(false);
    setNewEnvelopeTypeValue('');
    setTypeDropdownOpen(false);
    setTypeSearch('');
  };

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
        setCurrentStep(1);
        setEnvelopeId(routeEnvelopeId);
        await getEnvelopeDetail(routeEnvelopeId);
      } else {
        setCurrentStep(1);
      }
    } catch (error) {
      console.error('Error in getSteps:', error);
      setCurrentStep(1);
    }
  }

  const loadRecipientSuggestions = async (forceReload = false) => {
    if (!forceReload && (recipientSuggestions.length > 0 || loadingRecipientSuggestions)) return;
    setLoadingRecipientSuggestions(true);
    const map = new Map<string, { name: string; email: string }>();
    const addIfValid = (r: any) => {
      const name = (r?.name || '').trim();
      const email = (r?.email || '').trim();
      if (!email) return;
      const key = email.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { name: name || email, email });
      } else {
        const existing = map.get(key);
        if (existing && (!existing.name || existing.name === existing.email) && name && name !== email) {
          map.set(key, { name, email });
        }
      }
    };
    try {
      const [envelopesResponse, savedRecipientsResponse] = await Promise.allSettled([
        eSignApi.get('/api/e-sign/get-envelopes'),
        eSignApi.get('/api/e-sign/recipients')
      ]);

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

      if (savedRecipientsResponse.status === 'fulfilled') {
        const response = savedRecipientsResponse.value;
        const savedRecipients = response?.data?.data || [];
        if (Array.isArray(savedRecipients)) {
          savedRecipients.forEach((r: any) => {
            addIfValid({ name: r.name, email: r.email });
          });
        }
      }

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

  const debouncedSearch = useRef(
    debounce((query: string) => {
      setDebouncedSearchQuery(query);
    }, 250)
  ).current;
  const fetchSavedRecipients = async () => {
    setLoadingSavedRecipients(true);
    try {
      const [envelopesResponse, savedRecipientsResponse] = await Promise.allSettled([
        eSignApi.get('/api/e-sign/get-envelopes'),
        eSignApi.get('/api/e-sign/recipients')
      ]);
      const recipientsMap = new Map<string, SavedRecipientRow>();
      if (savedRecipientsResponse.status === 'fulfilled') {
        const response = savedRecipientsResponse.value;
        const savedRecipients = response?.data?.data || [];
        if (Array.isArray(savedRecipients)) {
          savedRecipients.forEach((r: any) => {
            if (r?.email) {
              const email = r.email.toLowerCase();
              const rawId = r._id ?? r.id;
              recipientsMap.set(email, {
                _id: rawId != null ? String(rawId) : '',
                name: r.name || '',
                email: r.email,
                title: r.title,
                company: r.company,
                phone: r.phone,
                address: r.address,
                addressBookEntry: true,
              });
            }
          });
        }
      }

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
                  if (!recipientsMap.has(email)) {
                    const rawId = r.id ?? r._id;
                    recipientsMap.set(email, {
                      // Stable id for picker UI; not used for address-book DELETE (addressBookEntry is false).
                      _id: rawId != null ? String(rawId) : `env:${email}`,
                      name: r.name || r.email,
                      email: r.email,
                      title: r.title,
                      company: r.company,
                      phone: r.phone,
                      address: r.address,
                      addressBookEntry: false,
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

  const openRecipientListModal = (recipientId: string) => {
    setRecipientListModalForId(recipientId);
    setRecipientListSearch('');
    setShowRecipientListModal(true);
    fetchSavedRecipients();
    loadRecipientSuggestions(true);
  };

  const selectRecipientFromList = (savedRecipient: { name: string; email: string; title?: string; company?: string; phone?: string; address?: string }) => {
    if (recipientListModalForId) {
      updateRecipient(recipientListModalForId, {
        name: savedRecipient.name,
        email: savedRecipient.email,
        phone: savedRecipient.phone || ''
      });
      setShowRecipientListModal(false);
      setRecipientListModalForId(null);
      setShowAddRecipientForm(false);
      setEditingSavedRecipientId(null);
      resetNewRecipientFormState();
    }
  };

  // Handle add new recipient or update existing address-book entry
  const handleAddNewRecipient = async () => {
    const errs = validateSavedRecipientForm(newRecipientForm);
    if (Object.keys(errs).length > 0) {
      setRecipientFormErrors(errs);
      toast.error('Please fix the highlighted fields.');
      return;
    }
    const normalizeEmail = (v: string) => String(v || '').trim().toLowerCase();
    const normalizePhone = (v: string) => String(v || '').replace(/\D/g, '');
    const formEmail = normalizeEmail(newRecipientForm.email);
    const formPhone = normalizePhone(newRecipientForm.phone);

    const duplicateRecipient = savedRecipients.find((r) => {
      const sameRecordWhileEditing =
        !!editingSavedRecipientId && String(r._id) === String(editingSavedRecipientId);
      if (sameRecordWhileEditing) return false;
      if (!r.addressBookEntry || !isPersistedAddressBookRecipientId(r._id)) return false;

      const emailMatches = formEmail.length > 0 && normalizeEmail(r.email) === formEmail;
      const phoneMatches =
        formPhone.length > 0 && normalizePhone(r.phone || '') === formPhone;
      return emailMatches || phoneMatches;
    });

    if (!editingSavedRecipientId && duplicateRecipient) {
      const duplicateReason = (() => {
        const emailMatches = normalizeEmail(duplicateRecipient.email) === formEmail;
        const phoneMatches =
          formPhone.length > 0 &&
          normalizePhone(duplicateRecipient.phone || '') === formPhone;
        if (emailMatches && phoneMatches) return 'email and phone number';
        if (emailMatches) return 'email';
        return 'phone number';
      })();

      const confirmation = await Swal.fire({
        title: 'Recipient already exists',
        html: `A recipient with this ${duplicateReason} already exists.<br/><br/>If you continue, the existing recipient will be updated with the current form data.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Continue and Update',
        cancelButtonText: 'Cancel',
        didOpen: () => {
          const container = Swal.getContainer();
          if (container) container.style.zIndex = '10050';
        },
      });

      if (!confirmation.isConfirmed) {
        return;
      }
      setEditingSavedRecipientId(duplicateRecipient._id);
    }

    setRecipientFormErrors({});
    setSavingNewRecipient(true);
    try {
      const targetEditId =
        editingSavedRecipientId ||
        (duplicateRecipient ? duplicateRecipient._id : null);

      if (targetEditId && isPersistedAddressBookRecipientId(targetEditId)) {
        const res = await eSignApi.put(
          `/api/e-sign/recipients/${targetEditId}`,
          newRecipientForm
        );
        if (res.status === 200) {
          setEditingSavedRecipientId(null);
          setShowAddRecipientForm(false);
          resetNewRecipientFormState();
          await fetchSavedRecipients();
          toast.success('Recipient updated');
        }
        return;
      }

      const res = await eSignApi.post('/api/e-sign/recipients', newRecipientForm);
      if (res.status === 201 || res.status === 200) {
        // Add the new recipient to the list
        const newRecipient = res.data.data || {
          _id: res.data._id || Date.now().toString(),
          ...newRecipientForm,
          addressBookEntry: true as const,
        };
        const row: SavedRecipientRow = {
          _id: String(newRecipient._id),
          name: newRecipient.name,
          email: newRecipient.email,
          title: newRecipient.title,
          company: newRecipient.company,
          phone: newRecipient.phone,
          address: newRecipient.address,
          addressBookEntry: true,
        };
        await fetchSavedRecipients();

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
        selectRecipientFromList(row);
        toast.success(res.status === 201 ? 'Recipient added successfully' : 'Recipient updated successfully');
      }
    } catch (err: any) {
      console.error('Failed to save recipient', err);
      const message = err?.response?.data?.message || 'Failed to save recipient';
      alert(message);
    } finally {
      setSavingNewRecipient(false);
    }
  };
  const handleDeleteSavedRecipient = async (
    e: React.MouseEvent,
    recipient: SavedRecipientRow
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!recipient.addressBookEntry || !isPersistedAddressBookRecipientId(recipient._id)) {
      toast.error('Only contacts in your saved address book can be deleted here.');
      return;
    }
    const ok = await Swal.fire({
      title: 'Delete contact?',
      text: `${recipient.name} (${recipient.email}) will be removed from your saved recipients.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      // Recipient picker modal uses z-[10000]; Swal defaults ~1060 and would sit behind it
      didOpen: () => {
        const container = Swal.getContainer();
        if (container) container.style.zIndex = '10050';
      },
    });
    if (!ok.isConfirmed) return;
    setDeletingSavedRecipientId(recipient._id);
    try {
      await eSignApi.delete(`/api/e-sign/recipients/${recipient._id}`);
      setSavedRecipients((prev) => prev.filter((r) => r._id !== recipient._id));
      setRecipientSuggestions((prev) =>
        prev.filter((r) => r.email.toLowerCase() !== recipient.email.toLowerCase())
      );
      if (editingSavedRecipientId === recipient._id) {
        setEditingSavedRecipientId(null);
        setShowAddRecipientForm(false);
        resetNewRecipientFormState();
      }
      toast.success('Recipient deleted');
    } catch (err: any) {
      console.error('Failed to delete recipient', err);
      const status = err?.response?.status;
      const message = err?.response?.data?.message || 'Failed to delete recipient';
      if (status === 404) {
        await fetchSavedRecipients();
        toast.error(
          'That contact is not in your saved list anymore (for example, it only appeared from a past envelope). The list was refreshed.'
        );
      } else {
        toast.error(message);
      }
    } finally {
      setDeletingSavedRecipientId(null);
    }
  };

  const handleSaveMissingRecipientPhone = async () => {
    const targetRecipientId = missingPhoneRecipientId;
    const pendingMethods = pendingAuthSelectionAfterPhone;
    if (!targetRecipientId || !pendingMethods || pendingMethods.length === 0) {
      setShowMissingRecipientPhoneModal(false);
      return;
    }

    const phoneDigits = String(missingPhoneValue || '').replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setMissingPhoneError('Please enter a valid phone number to continue.');
      return;
    }

    setMissingPhoneError('');
    setSavingMissingPhone(true);
    try {
      const updatedRecipient = recipients.find((r) => r.id === targetRecipientId);
      updateRecipient(targetRecipientId, { phone: missingPhoneValue });

      // Persist through the same recipients CRUD API (edit if exists, else create).
      const isDirectRecipientId = /^[a-fA-F0-9]{24}$/.test(targetRecipientId);
      const mappedSavedRecipientId = (() => {
        const email = String(updatedRecipient?.email || '').toLowerCase();
        if (!email) return null;
        const row = savedRecipients.find(
          (r) =>
            r.addressBookEntry &&
            isPersistedAddressBookRecipientId(r._id) &&
            r.email.toLowerCase() === email
        );
        return row?._id || null;
      })();

      if (isDirectRecipientId || mappedSavedRecipientId) {
        const recipientDbId = isDirectRecipientId ? targetRecipientId : mappedSavedRecipientId!;
        await eSignApi.put(`/api/e-sign/recipients/${recipientDbId}`, {
          phone: missingPhoneValue
        });
      } else if (updatedRecipient?.name && updatedRecipient?.email) {
        await eSignApi.post('/api/e-sign/recipients', {
          name: updatedRecipient.name,
          email: updatedRecipient.email,
          title: '',
          company: '',
          phone: missingPhoneValue,
          address: ''
        });
      }

      if (updatedRecipient?.email) {
        const email = updatedRecipient.email.toLowerCase();
        setSavedRecipients((prev) =>
          prev.map((r) =>
            r.email.toLowerCase() === email ? { ...r, phone: missingPhoneValue } : r
          )
        );
      }
      await fetchSavedRecipients();

      setShowMissingRecipientPhoneModal(false);
      setMissingPhoneRecipientId(null);
      setPendingAuthSelectionAfterPhone(null);

      await handleAuthMethodSelect(pendingMethods, {
        bypassRecipientPhoneCheck: true,
        forceRecipientId: targetRecipientId,
      });
    } catch (err: any) {
      console.error('Failed to save missing recipient phone', err);
      const msg = err?.response?.data?.message || 'Failed to save phone number.';
      setMissingPhoneError(msg);
    } finally {
      setSavingMissingPhone(false);
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!openMenuId) return;
      const target = e.target as HTMLElement;
      if (!target.closest('.document-menu-container')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

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
              <h3 className="text-lg font-semibold text-foreground">Add documents</h3>
              {showDocuments ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
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
                          const verticalOffset = 10;
                          const horizontalOffset = absPosition === 0 ? 0 : 20 + (absPosition * 6);
                          if (absPosition >= 4) return null;
                          const scale = absPosition === 0 ? 1 : Math.max(0.98 - absPosition * 0.01, 0.95);
                          const cardColors = [
                            { border: '#260559', shadow: 'rgba(38, 5, 89, 0.2)', accent: '#6366f1' },
                            { border: '#6366f1', shadow: 'rgba(99, 102, 241, 0.15)', accent: '#8b5cf6' },
                            { border: '#8b5cf6', shadow: 'rgba(139, 92, 246, 0.12)', accent: '#a78bfa' },
                            { border: '#a78bfa', shadow: 'rgba(167, 139, 250, 0.1)', accent: '#c4b5fd' }
                          ];
                          const cardColor = cardColors[Math.min(absPosition, 3)];

                          return (
                            <div
                              key={doc.id}
                              className="absolute top-0 left-0 w-full bg-primary rounded-2xl flex flex-col transition-all duration-500 ease-in-out overflow-hidden"
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
                                background: '#ffffff'
                              }}
                            >
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

                              {!doc.isUploading && doc.url && (
                                <div
                                  className="w-full flex-1 border-b overflow-hidden bg-gradient-to-br from-gray-50 to-white min-h-0 relative group"
                                  style={{
                                    minHeight: previewMinHeight,
                                    borderBottomColor: absPosition === 0 ? cardColor.border + '40' : 'rgba(0, 0, 0, 0.1)'
                                  }}
                                >
                                  <div
                                    className="absolute inset-0 opacity-30 pointer-events-none"
                                    style={{
                                      background: `linear-gradient(135deg, ${cardColor.accent}15 0%, transparent 50%)`
                                    }}
                                  />
                                  <div className="w-full h-full flex items-center justify-center bg-transparent relative z-10 p-2">
                                    <div className="rounded-md shadow-sm border border-border/50 bg-white p-1">
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
                                        className="flex items-center gap-2 px-5 py-2.5 bg-white text-foreground rounded-lg shadow-xl hover:bg-gray-50 transition-all hover:scale-105 font-medium"
                                        style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)', pointerEvents: 'auto' }}
                                      >
                                        <Eye className="w-4 h-4" />
                                        <span className="text-sm">View</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

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
                                  <p className={`font-medium text-foreground ${fontSizeClass} mb-2`}>{doc.name} — Uploading...</p>
                                  <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
                                    <div
                                      className="h-full bg-blue-500 transition-all"
                                      style={{ width: `${doc.uploadProgress ?? 0}%` }}
                                    />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground mt-1">{doc.uploadProgress ?? 0}%</p>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {documents.length > 1 && (
                          <>
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
                    <div className="w-2/3 flex-shrink-0" data-tour="ec-upload">
                      <div
                        onClick={(!documents || documents.length === 0) ? () => fileInputRef.current?.click() : undefined}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`bg-primary transition-colors ${isDragOver
                          ? 'border-2 border-blue-400 bg-blue-50'
                          : 'border border-border'
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
                            <div className="bg-primary rounded-lg p-3">
                              <ArrowUpToLine className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-sm text-muted-foreground">Drop your files here or</p>
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
                            className="flex flex-col items-center justify-center w-full cursor-pointer text-muted-foreground hover:text-muted-foreground"
                          >
                            <div className="flex flex-col items-center justify-center space-y-4">
                              <div className="bg-gray-700 rounded-lg p-3">
                                <Upload className="w-6 h-6 text-white" />
                              </div>
                              <p className="text-sm text-muted-foreground">Drop your files here or</p>
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
                        <div key={doc.id} className="w-full h-auto relative bg-card rounded-lg border border-border shadow-sm flex flex-col">
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
                              className="w-full flex-1 border-b border-border overflow-hidden bg-primary rounded-t-lg min-h-0 relative group"
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
                                  className="flex items-center gap-2 px-4 py-2 bg-card text-foreground rounded-lg shadow-lg hover:bg-muted transition-colors"
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
                                  <p className={`font-semibold text-foreground ${fontSizeClass} mb-1 truncate`} title={doc.name}>
                                    {doc.name}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">
                                      {doc.pages} page{doc.pages !== 1 ? 's' : ''}
                                    </p>
                                  </div>

                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Uploading state */
                            <div className={paddingClass}>
                              <p className={`font-medium text-foreground ${fontSizeClass} mb-2`}>{doc.name} — Uploading...</p>
                              <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 transition-all"
                                  style={{ width: `${doc.uploadProgress ?? 0}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-1">{doc.uploadProgress ?? 0}%</p>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {(() => {
                      const docCount = documents?.length || 0;
                      let colSpanClasses = '';

                      if (docCount === 0) {
                        colSpanClasses = 'col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4';
                      } else if (docCount >= 4) {
                        colSpanClasses = 'col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4';
                      } else if (docCount === 1) {
                        colSpanClasses = 'col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-3';
                      } else if (docCount === 2) {
                        colSpanClasses = 'col-span-1 sm:col-span-2 md:col-span-1 lg:col-span-2';
                      } else if (docCount === 3) {
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
                            className={`bg-card transition-colors ${isDragOver
                              ? 'border-2 border-border bg-primary'
                              : 'border border-border'
                              } ${documents && documents.length > 0 ? 'p-6' : 'p-8 sm:p-12'
                              } ${(!documents || documents.length === 0) ? 'cursor-pointer' : ''} rounded-lg h-full min-h-[200px] flex items-center justify-center`}
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
                              <div className="flex flex-col items-center justify-center w-full">
                                <div className="bg-gray-700 rounded-lg p-3 mb-4">
                                  <ArrowUpToLine className="w-6 h-6 text-white" />
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">Drop your files here or</p>
                                <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
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
                                  <div className="flex items-center gap-2 my-2 sm:my-0">
                                    <div className="h-px bg-gray-300 w-8"></div>
                                    <span className="text-xs text-muted-foreground font-medium">OR</span>
                                    <div className="h-px bg-gray-300 w-8"></div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate('/e-sign/templateLibrary');
                                    }}
                                    className="ai-generate-button flex items-center justify-center gap-2 flex-1 sm:flex-none min-w-[180px]"
                                  >
                                    <Sparkles className="w-4 h-4 relative z-10" />
                                    <span className="relative z-10 text-sm sm:text-base">Choose Template</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center justify-center w-full cursor-pointer text-muted-foreground hover:text-muted-foreground"
                              >
                                <div className="flex flex-col items-center justify-center space-y-4">
                                  <div className="bg-gray-700 rounded-lg p-3">
                                    <Upload className="w-6 h-6 text-white" />
                                  </div>
                                  <p className="text-sm text-muted-foreground">Drop your files here or</p>
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
            <hr className="border-t-2 border-border my-4" />
            <div>
              <h3
                onClick={() => setShowRecipients(prev => !prev)}
                className="text-lg text-foreground mb-4 cursor-pointer flex items-center justify-between"
                data-tour="ec-recipients-toggle"
              >
                <span>Add recipients</span>
                {showRecipients ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </h3>
              {bulkList && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">Batch Name <span className="text-red-500">*</span></label>
                  <input
                    value={bulkBatchName}
                    onChange={(e) => setBulkBatchName(e.target.value)}
                    className="w-full max-w-xl px-4 py-2 border border-border rounded-sm"
                    placeholder="Bulk Send List"
                  />
                  <div className="text-xs text-muted-foreground mt-1">This name appears in your list of bulk sends and is not shown to others</div>
                </div>
              )}
              {showRecipients && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isOnlySigner}
                        onChange={(e) => {
                          setIsOnlySigner(e.target.checked);
                          if (e.target.checked) {
                            setRecipients([{
                              id: `self-${Date.now()}`,
                              name: user?.fullname || 'Me',
                              email: user?.email || '',
                              role: 'signer',
                              order: 1,
                              status: 'waiting',
                              authentication: DEFAULT_AUTH_JSON
                            }]);
                          } else {
                            setRecipients([]);
                          }
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-border rounded focus:ring-blue-500"
                      />
                      <span className="text-foreground text-[12px] flex items-center gap-2">
                        I'm the only signer
                        <span className="relative group inline-flex">
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
                    <div className="flex items-center justify-start gap-2 w-full">
                      <label className="flex items-center space-x-2 cursor-pointer" data-tour="ec-signing-order">
                        <input
                          type="checkbox"
                          checked={setSigningOrder}
                          onChange={(e) => setSetSigningOrder(e.target.checked)}
                          disabled={(((recipients?.length || 0) + (bulkList ? 1 : 0) + (csvRecipientList ? ((csvRecipientList.items?.length || 0)) : 0)) < 2)}
                          className="w-4 h-4 text-purple-600 bg-gray-100 border-border rounded focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={(((recipients?.length || 0) + (bulkList ? 1 : 0) + (csvRecipientList ? ((csvRecipientList.items?.length || 0)) : 0)) < 2) ? 'Add at least two recipients to set signing order' : ''}
                        />
                        <span className={`text-sm ${((((recipients?.length || 0) + (bulkList ? 1 : 0) + (csvRecipientList ? ((csvRecipientList.items?.length || 0)) : 0)) < 2)) ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>Set signing order</span>
                      </label>

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
                                      authentication: DEFAULT_AUTH_JSON as Recipient['authentication']
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
                            <button onClick={clearBulkList} className="ml-3 text-muted-foreground hover:text-red-600" title="Remove"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
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
                              className="absolute right-6 top-6 text-2xl text-[#3E2B66] hover:text-foreground"
                            >
                              ✕
                            </button>

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
                                      className={`text-left p-6 border ${bulkMethod === 'manual' ? 'border-black-900' : 'border-border hover:border-gray-400'}`}
                                    >
                                      <div className="flex items-center gap-3 mb-2">
                                        <span className={`w-4 h-4 rounded-full border ${bulkMethod === 'manual' ? 'bg-blue-600 border-blue-600' : 'border-gray-400'}`} />
                                        <span className="font-semibold text-[#3E2B66]">Enter manually</span>
                                      </div>
                                      <div className="text-sm text-muted-foreground">Best for shorter lists. Type each recipient's name, role, and email address.</div>
                                    </button>

                                    <button
                                      onClick={() => setBulkMethod('csv')}
                                      className={`text-left p-6 border ${bulkMethod === 'csv' ? 'border-black-900' : 'border-border hover:border-gray-400'}`}
                                    >
                                      <div className="flex items-center gap-3 mb-2">
                                        <span className={`w-4 h-4 rounded-full border ${bulkMethod === 'csv' ? 'bg-blue-600 border-blue-900' : 'border-gray-400'}`} />
                                        <span className="text-[#3E2B66]">Upload a CSV</span>
                                      </div>
                                      <div className="text-sm text-muted-foreground">Required for 10+ recipients. We'll provide a sample for formatting help.</div>
                                    </button>
                                  </div>

                                  <div className="absolute bottom-4 right-4 flex items-center justify-end gap-3 bg-white">
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
                                  <p className="text-muted-foreground mb-6">Enter information for up to 10 recipients. If you need to add more recipients, <span className="text-purple-700 underline cursor-pointer" onClick={() => setBulkMethod('csv')}>upload a CSV instead</span></p>

                                  <div className="mb-6">
                                    <label className="block text-sm font-medium text-foreground mb-2">Role *</label>
                                    <select
                                      className="w-full max-w-md px-3 py-2 border rounded-sm"
                                      value={bulkSharedRole as any}
                                      onChange={(e) => setBulkSharedRole(e.target.value as any)}
                                    >
                                      <option value="">Select a role</option>
                                      <option value="signer">Needs to Sign</option>
                                      <option value="in_person_signer">In Person Signer</option>
                                      <option value="carbon_copy">Receives a Copy</option>
                                      <option value="needs_to_view">Needs to View</option>
                                    </select>
                                    <div className="text-xs text-muted-foreground mt-1">All recipients share this role.</div>
                                  </div>

                                  <div className="space-y-4">
                                    {bulkRows.map((row) => (
                                      <div key={row.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                        <div>
                                          <label className="block text-sm font-medium text-foreground mb-2">Name *</label>
                                          <input
                                            className="w-full px-3 py-2 border rounded-sm"
                                            value={row.name}
                                            onChange={(e) => setBulkRows(prev => prev.map(r => r.id === row.id ? { ...r, name: e.target.value } : r))}

                                          />
                                        </div>
                                        <div className="relative">
                                          <label className="block text-sm font-medium text-foreground mb-2">Email *</label>
                                          <input
                                            className="w-full px-3 py-2 border rounded-sm"
                                            value={row.email}
                                            onChange={(e) => setBulkRows(prev => prev.map(r => r.id === row.id ? { ...r, email: e.target.value } : r))}

                                          />
                                          {bulkRows.length > 1 && (
                                            <button type="button" onClick={() => removeBulkRow(row.id)} className="mt-2 absolute -right-10 top-8 text-muted-foreground hover:text-red-600"><Trash2 className='w-4 h-4' /></button>
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
                                    <button onClick={applyBulkRecipients} className="px-4 py-2 text-white rounded-sm" style={{ backgroundColor: '#260559' }}>Save</button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {bulkStep === 2 && bulkMethod === 'csv' && !showRecipientsEditor && (
                              <div className="w-full h-full flex flex-col relative">
                                {showCsvExceptions ? (
                                  <>
                                    <div className="max-w-3xl mx-auto flex-1 flex flex-col px-6 pb-6">

                                      <p className="text-sm text-muted-foreground mb-6" style={{ fontFamily: 'sans-serif' }}>
                                        The following items could not be matched between entries on your envelope and the imported bulk list. You can accept these matching exceptions and continue with the envelope. Or you can discard the imported CSV, edit it to update column headers as required, and then re-import the edited file.
                                      </p>
                                      <div className="mb-6">
                                        <p className="text-sm text-muted-foreground mb-2" style={{ fontFamily: 'sans-serif' }}>
                                          You can download a sample bulk list preformatted for your envelope.
                                        </p>
                                        <button
                                          onClick={downloadSampleCsv}
                                          className="text-blue-600 underline hover:text-blue-700 text-sm"
                                        >
                                          Download sample
                                        </button>
                                      </div>
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
                                    </div>
                                    <div className="flex items-center justify-end gap-3 mt-auto">
                                      <button
                                        onClick={handleDiscardCsv}
                                        className="px-4 py-2 bg-white border border-border rounded-sm text-foreground hover:bg-gray-50 transition-colors"
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
                                    <h3 className="text-2xl text-foreground mb-8" style={{ fontFamily: 'sans-serif' }}>Upload a CSV</h3>

                                    {/* Drag and Drop Area */}
                                    <div
                                      onDragOver={handleDragOverCsv}
                                      onDragLeave={handleDragLeaveCsv}
                                      onDrop={handleDropCsv}
                                      className={`w-full max-w-2xl border-2 border-dashed rounded-lg p-12 ${isDragOverCsv
                                        ? 'border-purple-500'
                                        : 'border-border'
                                        }`}
                                      style={{
                                        backgroundColor: isDragOverCsv ? '#f3e8ff' : '#f5f3f7',
                                        borderColor: isDragOverCsv ? '#9333ea' : '#e5e7eb'
                                      }}
                                    >
                                      <div className="flex flex-col items-center justify-center">
                                        {/* Upload Icon */}
                                        <Upload className="w-12 h-12 text-muted-foreground mb-4" />

                                        {/* Drag and drop text */}
                                        <p className="text-base font-normal text-foreground mb-2" style={{ fontFamily: 'sans-serif' }}>
                                          Drag and drop file here
                                        </p>

                                        {/* Supported Formats */}
                                        <p className="text-sm text-muted-foreground mb-6" style={{ color: '#9ca3af' }}>
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
                                          <p className="mt-4 text-sm text-muted-foreground">{csvFile.name}</p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Sample CSV Section */}
                                    <div className="w-full max-w-2xl mt-6">
                                      <p className="text-sm text-foreground mb-3">
                                        For help formatting your list, download the sample CSV.
                                      </p>
                                      <button
                                        onClick={downloadSampleCsv}
                                        className="inline-flex items-center font-semibold gap-2 px-4 py-2 border border-border rounded-sm bg-white text-foreground hover:bg-gray-50 transition-colors"
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
                                        className="px-4 py-2 bg-gray-100 text-foreground rounded-sm hover:bg-gray-200 transition-colors" style={{ fontFamily: 'sans-serif' }}
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
                                        <Info className="w-5 h-5 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">There are errors in your bulk list.</span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <button className="text-sm text-blue-600 hover:text-blue-700 underline">
                                          Learn More
                                        </button>
                                        <button
                                          onClick={() => setShowErrorBanner(false)}
                                          className="text-muted-foreground hover:text-foreground"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Tabs */}
                                  <div className="flex gap-6 mb-6 border-b border-border">
                                    <button
                                      onClick={() => setActiveTab('all')}
                                      className={`pb-2 px-1 text-sm font-medium ${activeTab === 'all'
                                        ? 'text-foreground border-b-2 border-gray-900'
                                        : 'text-muted-foreground'
                                        }`}
                                    >
                                      All Recipients ({csvRecipientsData.length})
                                    </button>
                                    <button
                                      onClick={() => setActiveTab('errors')}
                                      className={`pb-2 px-1 text-sm font-medium ${activeTab === 'errors'
                                        ? 'text-foreground border-b-2 border-gray-900'
                                        : 'text-muted-foreground'
                                        }`}
                                    >
                                      Errors ({getRecipientsWithErrors().length})
                                    </button>
                                  </div>

                                  {/* Recipients Table/Form - Horizontal Scrollable */}
                                  <div className="max-h-[100px] overflow-x-auto overflow-y-auto">
                                    <div className="inline-block min-w-full">
                                      {/* Header Row */}
                                      <div className="flex gap-4 pb-2 border-b border-border mb-2" >
                                        <div className="w-8 flex-shrink-0"></div>
                                        {csvHeaders.map((header, headerIdx) => {
                                          const emailHeader = csvHeaders.find(h => h.toLowerCase().includes('email'));
                                          const nameHeader = csvHeaders.find(h => h.toLowerCase().includes('name') && !h.toLowerCase().includes('email'));
                                          const isRequired = header === emailHeader || header === nameHeader;
                                          return (
                                            <div key={headerIdx} className="flex-shrink-0 w-64">
                                              <label className="block text-xs font-medium text-muted-foreground mb-1">
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
                                                            : 'border-border focus:border-blue-500 focus:ring-blue-500'
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
                                  <button onClick={handleBackToUpload} className="px-4 py-2 bg-white border border-border rounded-sm text-foreground hover:bg-gray-50">
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
                              className="absolute right-6 top-6 text-2xl text-[#3E2B66] hover:text-foreground"
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
                                      <div className="col-span-4 text-sm text-muted-foreground">
                                        <div className="h-20 flex items-center font-semibold">SENDER</div>
                                        <div className="h-24 flex items-center">1</div>
                                        <div className="h-20 flex items-center font-semibold">COMPLETED</div>
                                      </div>
                                      <div className="col-span-8 relative">
                                        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gray-300 z-0" />
                                        {/* Sender */}
                                        <div className="relative h-20 flex justify-center items-center z-10">
                                          <div className="absolute left-6 right-6 bottom-0 border-t border-dashed border-border z-0" />
                                          <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center font-semibold text-[#3E2B66] z-20">
                                            {(((user?.fullname || user?.email || '?') as string).match(/\b\w/g) || []).slice(0, 2).join('').toUpperCase()}
                                          </div>
                                        </div>
                                        {/* Grouped participants */}
                                        <div className="relative h-24 flex justify-center items-center z-10">
                                          <div className="absolute left-6 right-6 bottom-0 border-t border-dashed border-border z-0" />
                                          <div className="px-4 py-2 border rounded-lg bg-white z-20 flex flex-wrap items-center justify-center gap-4">
                                            {items.map((it, idx) => (
                                              <div key={`g-${idx}`} className="flex flex-col items-center gap-1">
                                                <div className="w-14 h-14 rounded-full bg-cyan-100 flex items-center justify-center font-semibold text-[#3E2B66]">
                                                  {getInitials(it.name, it.email)}
                                                </div>
                                                <div className="text-xs font-medium text-[#3E2B66] text-center px-2 max-w-[80px] truncate">
                                                  {formatSentenceCase(it.name || it.email || 'Recipient')}
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
                                  name: formatSentenceCase(it.name || it.email || 'Recipient'),
                                  email: it.email
                                }));
                                return (
                                  <div className="grid grid-cols-12 gap-6">
                                    <div className="col-span-4 text-sm text-muted-foreground">
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
                                        <div className="absolute left-6 right-6 bottom-0 border-t border-dashed border-border z-0" />
                                        <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center font-semibold text-[#3E2B66] z-20">
                                          {(((user?.fullname || user?.email || '?') as string).match(/\b\w/g) || []).slice(0, 2).join('').toUpperCase()}
                                        </div>
                                      </div>
                                      {ordered.map((p) => (
                                        <div key={p.key} className="relative h-24 flex justify-center items-center z-10">
                                          <div className="absolute left-6 right-6 bottom-0 border-t border-dashed border-border z-0" />
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
                                name: formatSentenceCase(r.name || r.email || 'Recipient'),
                                email: r.email
                              }));

                              return (
                                <div className="grid grid-cols-12 gap-6">
                                  <div className="col-span-4 text-sm text-muted-foreground">
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
                                      <div className="absolute left-6 right-6 bottom-0 border-t border-dashed border-border z-0" />
                                      <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center font-semibold text-[#3E2B66] z-20">
                                        {(((user?.fullname || user?.email || '?') as string).match(/\b\w/g) || []).slice(0, 2).join('').toUpperCase()}
                                      </div>
                                    </div>
                                    {ordered.map((p) => (
                                      <div key={p.key} className="relative h-24 flex justify-center items-center z-10">
                                        <div className="absolute left-6 right-6 bottom-0 border-t border-dashed border-border z-0" />
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
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                            onClick={() => {
                              setShowAuthModal(false);
                              setAuthModalForRecipientId(null);
                              setAuthModalForBulk(false);
                            }}
                          />
                          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-2xl">
                            <div className="mb-6 flex items-center justify-between">
                              <h2 className="text-xl font-semibold text-foreground">
                                Select Authentication Method
                              </h2>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const methodToSave = tempAuthSelection === undefined ? null : tempAuthSelection;
                                    handleAuthMethodSelect(methodToSave);
                                  }}
                                  className="rounded-lg bg-primary px-5 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAuthModal(false);
                                    setAuthModalForRecipientId(null);
                                    setAuthModalForBulk(false);
                                    setTempAuthSelection(undefined);
                                    setHasUserChangedSelection(false);
                                  }}
                                  className="z-10 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                  aria-label="Close"
                                >
                                  <X className="h-5 w-5" />
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
                      {showMissingRecipientPhoneModal && (
                        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
                          <div
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                            onClick={() => {
                              if (savingMissingPhone) return;
                              setShowMissingRecipientPhoneModal(false);
                              setMissingPhoneRecipientId(null);
                              setPendingAuthSelectionAfterPhone(null);
                              setMissingPhoneError('');
                              setAuthModalForRecipientId(null);
                              setAuthModalForBulk(false);
                            }}
                          />
                          <div className="relative w-full max-w-lg rounded-lg border border-border bg-card p-6 text-card-foreground shadow-2xl">
                            <h3 className="text-lg font-semibold text-foreground">
                              Add phone number to proceed
                            </h3>
                            <p className="mt-2 text-xs text-muted-foreground">
                              This verification method requires a phone number to send a verification code for{' '}
                              <b className="text-primary">
                                {(() => {
                                  const recipient = recipients.find(r => r.id === missingPhoneRecipientId);

                                  const formatName = (name?: string) =>
                                    name
                                      ?.trim()
                                      .toLowerCase()
                                      .replace(/\s+/g, ' ')
                                      .split(' ')
                                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                      .join(' ') || 'Recipient';

                                  const formattedName = formatName(recipient?.name);

                                  return `${formattedName} (${recipient?.email || 'No email'})`;
                                })()}
                              </b>
                              . Please add it to continue.
                            </p>
                            <div className="mt-4">
                              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                                Phone Number <span className="text-destructive">*</span>
                              </label>
                              <PhoneInput
                                country="in"
                                value={missingPhoneValue}
                                onChange={(val) => {
                                  setMissingPhoneValue(val);
                                  if (missingPhoneError) setMissingPhoneError('');
                                }}
                                disabled={savingMissingPhone}
                                inputProps={{ name: 'missingRecipientPhone', id: 'missingRecipientPhone' }}
                                containerClass="w-full"
                                dropdownStyle={{ zIndex: 10080 }}
                                inputClass={`w-full !pl-12 !pr-3 !py-2 !text-sm !border !rounded-lg !bg-background !text-foreground focus:!outline-none focus:!ring-2 !transition-colors ${missingPhoneError
                                  ? '!border-destructive focus:!border-destructive focus:!ring-destructive/30'
                                  : '!border-border focus:!border-ring focus:!ring-ring'
                                  }`}
                                buttonClass="!rounded-l-lg !border !border-border !bg-background"
                              />
                              {missingPhoneError ? (
                                <p className="mt-1 text-xs text-destructive">{missingPhoneError}</p>
                              ) : null}
                            </div>

                            <div className="mt-6 flex items-center justify-end gap-3">
                              <button
                                type="button"
                                disabled={savingMissingPhone}
                                onClick={() => {
                                  setShowMissingRecipientPhoneModal(false);
                                  setMissingPhoneRecipientId(null);
                                  setPendingAuthSelectionAfterPhone(null);
                                  setMissingPhoneError('');
                                  setAuthModalForRecipientId(null);
                                  setAuthModalForBulk(false);
                                }}
                                className="rounded-sm border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={savingMissingPhone}
                                onClick={handleSaveMissingRecipientPhone}
                                className="rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
                              >
                                {savingMissingPhone ? 'Saving...' : 'Save and Continue'}
                              </button>
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
                          </div>
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
                              <div className="flex-1 bg-white border border-border shadow-sm relative" style={{ borderLeft: '7px solid #86e4ef' }}>
                                <div className="p-6">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-xs uppercase text-muted-foreground tracking-wide">ROLE {idx + 1}</div>
                                      <div className="mt-2 text-base text-foreground font-medium">Bulk Recipient</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="relative">
                                        <button type="button" onClick={() => setCsvRoleDropdownOpen(prev => !prev)} className="px-4 py-2 bg-gray-100 text-black-700 rounded-sm border border-border flex items-center gap-2">
                                          <PenLine className="w-4 h-4" />
                                          <span className="text-sm">Needs to Sign</span>
                                          <ChevronDown className="w-4 h-4" />
                                        </button>
                                        {csvRoleDropdownOpen && (
                                          <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-sm border border-border shadow-lg z-50">
                                            <div className="py-2 text-sm text-foreground">
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
                                        <button type="button" onClick={() => setCsvCustomizeOpen(prev => !prev)} className="px-4 py-2 bg-gray-100 text-black-700 rounded-sm border border-border flex items-center gap-2">
                                          <span className="text-sm font-bold">Customize</span>
                                          <ChevronDown className="w-4 h-4" />
                                        </button>
                                        {csvCustomizeOpen && (
                                          <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-sm border border-border shadow-lg z-50">
                                            <div className="py-2">
                                              <button type="button" onClick={() => { setCsvCustomizeOpen(false); setAuthModalForBulk(true); setAuthModalForRecipientId(null); setShowAuthModal(true); }} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100">
                                                <div className="flex items-start gap-3">
                                                  <Key className="w-5 h-5 text-muted-foreground mt-0.5" />
                                                  <div>
                                                    <div className="font-medium text-foreground">Add authentication method</div>
                                                    <div className="text-xs text-muted-foreground mt-1">Select an authentication method for this recipient.</div>
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
                                        className={`flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-full hover:border-purple-500 hover:bg-purple-50 transition-all duration-300 shadow-sm cursor-grab active:cursor-grabbing ${isDraggingPill
                                          ? 'opacity-60 scale-110 rotate-2 shadow-xl z-50 border-purple-500 bg-purple-100'
                                          : ''
                                          } ${isDragOverPill
                                            ? 'border-purple-600 scale-110 shadow-lg ring-2 ring-purple-300 ring-opacity-50 bg-purple-50'
                                            : ''
                                          } ${isReorderedPill
                                            ? 'animate-reorder-pill'
                                            : ''
                                          }`}
                                        style={{
                                          borderLeft: `4px solid ${RECIPIENT_COLORS[originalIndex % RECIPIENT_COLORS.length]}`,
                                          transform: isReorderedPill ? undefined : (isDraggingPill ? 'scale(1.1) rotate(2deg)' : isDragOverPill ? 'scale(1.1)' : undefined),
                                          zIndex: isDraggingPill ? 50 : isReorderedPill ? 40 : undefined
                                        }}
                                      >
                                        <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                        <span className="text-sm font-medium text-muted-foreground">{displayOrder}.</span>
                                        <span className="text-sm font-medium text-foreground">
                                          {recipient.name || 'Recipient'}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
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
                                  className={`flex items-stretch gap-4 transition-all duration-500 ease-in-out ${isDragging ? 'opacity-50 scale-95' : ''
                                    } ${isDragOver ? 'transform translate-y-1' : ''} ${isThisReordering ? 'transform transition-all duration-500 ease-in-out' : ''
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
                                        <div className="mt-1 text-muted-foreground cursor-grab" title="Drag to reorder">
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                          </svg>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  <div
                                    className={`flex-1 bg-card border shadow-sm relative transition-all duration-500 ease-in-out ${isDragOver ? 'border-blue-500 border-2 shadow-lg' : 'border-border'
                                      } ${setSigningOrder ? 'cursor-grab active:cursor-grabbing' : ''} ${isThisReordering ? 'shadow-2xl scale-[1.02] z-20 ring-2 ring-blue-400 ring-opacity-50' : ''
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
                                            <label className="block text-sm font-medium text-foreground mb-2">
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
                                              <Contact className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#5b1db8' }} />
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
                                                className="w-full pl-10 pr-12 py-2 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-card"
                                                placeholder="Full name"
                                              />
                                              <button
                                                type="button"
                                                onClick={() => openRecipientListModal(recipient.id)}
                                                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-muted rounded transition-colors"
                                                title="Open recipient list"
                                              >
                                                <BookOpen className="w-5 h-5" style={{ color: '#570cc8' }} />
                                              </button>
                                              {suggestionsOpenForId === recipient.id && (
                                                <div className="absolute z-20 top-full mt-1 w-full max-h-56 overflow-auto bg-card border border-border rounded-md shadow-lg">
                                                  {loadingRecipientSuggestions ? (
                                                    <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
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
                                                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                                                          >
                                                            <div className="font-medium text-foreground">{userSuggestion.name || userSuggestion.email}</div>
                                                            <div className="text-xs text-muted-foreground">{userSuggestion.email}</div>
                                                          </button>
                                                        );
                                                      }
                                                      return <div className="px-3 py-2 text-sm text-muted-foreground">No suggestions</div>;
                                                    }

                                                    // Use debounced search query for filtering (200-300ms debounce)
                                                    // If debounce hasn't fired yet, use current input for immediate feedback
                                                    const query = (debouncedSearchQuery.trim() || currentName).toLowerCase();

                                                    if (!query) {
                                                      return <div className="px-3 py-2 text-sm text-muted-foreground">No suggestions</div>;
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
                                                      return <div className="px-3 py-2 text-sm text-muted-foreground">No results found</div>;
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
                                                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                                                      >
                                                        <div className="font-medium text-foreground">{s.name || s.email}</div>
                                                        <div className="text-xs text-muted-foreground">{s.email}</div>
                                                      </button>
                                                    );

                                                    return (
                                                      <>
                                                        {/* Exact Matches Section */}
                                                        {hasExactMatches && (
                                                          <>
                                                            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-card border-b border-border sticky top-0">
                                                              Exact Matches
                                                            </div>
                                                            {exactMatches.map(renderSuggestion)}
                                                          </>
                                                        )}

                                                        {/* No exact match message */}
                                                        {!hasExactMatches && (
                                                          <div className="px-3 py-2 text-xs text-muted-foreground bg-card border-b border-border">
                                                            No exact match found
                                                          </div>
                                                        )}

                                                        {/* Broad Matches Section */}
                                                        {hasBroadMatches && (
                                                          <>
                                                            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-card border-b border-border sticky top-0">
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
                                            <label className="block text-sm font-bold text-foreground mb-2 invisible">Role</label>
                                            <button
                                              onClick={() => setOpenRoleDropdownId(openRoleDropdownId === recipient.id ? null : recipient.id)}
                                              className="w-full px-4 py-2 bg-card text-black-700 font-bold rounded-sm hover:bg-muted transition-colors flex items-center justify-between border border-border"
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
                                              <div className="absolute right-0 top-full mt-1 w-50 bg-card rounded-sm border border-border shadow-lg z-50">
                                                <div className="py-2">

                                                  {/* Option Template Example */}
                                                  {/* Needs to Sign */}
                                                  <button
                                                    onClick={() => {
                                                      updateRecipient(recipient.id, { role: "signer" });
                                                      setOpenRoleDropdownId(null);
                                                    }}
                                                    className="w-full px-4 py-2 text-xs flex items-center hover:bg-muted text-foreground gap-3"
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
                                                    className="w-full px-4 py-2 text-xs flex items-center hover:bg-muted text-foreground gap-3"
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
                                                    className="w-full px-4 py-2 text-xs flex items-center hover:bg-muted text-foreground gap-3"
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
                                                    className="w-full px-4 py-2 text-xs flex items-center hover:bg-muted text-foreground gap-3"
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
                                            <label className="block text-sm font-medium text-foreground mb-2 invisible">Customize</label>
                                            <button
                                              onClick={() => setOpenCustomizeDropdownId(openCustomizeDropdownId === recipient.id ? null : recipient.id)}
                                              className="w-full px-2 py-2 font-bold text-foreground rounded-sm hover:bg-card transition-colors flex items-center justify-between border border-border animate-shine relative overflow-hidden bg-muted"
                                              style={{ height: '42px'}}
                                              data-tour="ec-customize"
                                            >
                                              <span className="text-sm text-foreground relative z-10">Customize</span>
                                              <ChevronDown className="w-4 h-4 mt-1 text-foreground flex-shrink-0 relative z-10" />
                                            </button>

                                            {/* Customize Dropdown Menu */}
                                            {openCustomizeDropdownId === recipient.id && (
                                              <div className="absolute right-0 top-full mt-1 w-80 bg-card rounded-sm border border-border shadow-lg z-50">
                                                <div className="py-2">
                                                  <button
                                                    onClick={() => {
                                                      setAuthModalForRecipientId(recipient.id);
                                                      setAuthModalForBulk(false);
                                                      setOpenCustomizeDropdownId(null);
                                                      setShowAuthModal(true);
                                                    }}
                                                    className="w-full text-left px-4 py-3 text-sm hover:bg-muted text-foreground transition-colors border-b border-gray-100"
                                                  >
                                                    <div className="flex items-start gap-3">
                                                      <Key className="w-5 h-5 text-muted-foreground mt-0.5" />
                                                      <div>
                                                        <div className="font-medium text-foreground">Add authentication method</div>
                                                        <div className="text-xs text-muted-foreground mt-1">Select an authentication method for this recipient.</div>
                                                      </div>
                                                    </div>
                                                  </button>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex-1">
                                          <div className='w-165 relative'>
                                            <label className="block text-sm font-medium text-foreground mb-2">
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
                                                className="w-full px-4 py-2 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-card"
                                                placeholder="email@example.com"
                                              />
                                              {emailSuggestionsOpenForId === recipient.id && (
                                                <div className="absolute z-20 top-full mt-1 w-full max-h-56 overflow-auto bg-card border border-border rounded-md shadow-lg">
                                                  {loadingRecipientSuggestions ? (
                                                    <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
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
                                                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                                                          >
                                                            <div className="font-medium text-foreground">{userSuggestion.name || userSuggestion.email}</div>
                                                            <div className="text-xs text-muted-foreground">{userSuggestion.email}</div>
                                                          </button>
                                                        );
                                                      }
                                                      return <div className="px-3 py-2 text-sm text-muted-foreground">No suggestions</div>;
                                                    }

                                                    // Filter suggestions that match the typed email
                                                    const matchingSuggestions = recipientSuggestions.filter(s =>
                                                      s.email.toLowerCase().includes(currentEmail) ||
                                                      s.name.toLowerCase().includes(currentEmail)
                                                    );

                                                    if (matchingSuggestions.length === 0) {
                                                      return <div className="px-3 py-2 text-sm text-muted-foreground">No matching suggestions</div>;
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
                                                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                                                      >
                                                        <div className="font-medium text-foreground">{s.name || s.email}</div>
                                                        <div className="text-xs text-muted-foreground">{s.email}</div>
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
                          className={`flex items-center border border-black-300 rounded-sm overflow-hidden transition-opacity ${allRecipientsFilled
                            ? 'cursor-pointer hover:opacity-90'
                            : 'cursor-not-allowed opacity-50'
                            }`}
                          data-tour="ec-add-recipient"
                        // title={!allRecipientsFilled ? "Fill all detail of the recipient to add new" : ""}
                        >
                          {/* Left section */}
                          <div className="flex items-center gap-2 px-4 py-2 bg-card">
                            <UserRoundPlus className="w-4 h-4 text-foreground" />
                            <span className="text-sm text-foreground">Add Recipient</span>
                          </div>

                          {/* Divider */}
                          <div className="w-px h-8 bg-border" />

                          {/* Right section */}
                          <div className="px-3 py-2  flex items-center">
                            <ChevronDown className="w-4 h-4 text-foreground" />
                          </div>
                        </button>

                        {/* Tooltip on hover when disabled */}
                        {!allRecipientsFilled && (
                          <div className="absolute bottom-full left-1/9 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-muted text-muted-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            Fill all detail of the recipient to add new
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                              <div className="border-4 border-transparent border-t-card"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            <hr className="border-t-2 border-border my-4" />
            <div>

              <h3 id='ToggleAddMessage' data-tour="ec-message-toggle" onClick={() => setShowAddMessage(prev => !prev)} className="text-lg text-foreground cursor-pointer flex items-center justify-between">
                <span>Add message</span>
                {showAddMessage ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </h3>
            </div>

            {showAddMessage && (
              <div id='AddMessageContent' className="p-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={envelopeData.subject}
                    onChange={(e) => setEnvelopeData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 mb-8 border border-black-100 rounded-sm placeholder-foreground"
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
                    className="w-full px-3 py-2 border border-black-100 rounded-sm placeholder-foreground"
                    placeholder="Enter message"
                  />
                </div>
              </div>
            )}
            <hr className="border-t-2 border-border my-4" />
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
                      className="w-full px-4 py-2 border border-border rounded-sm text-left"
                      data-tour="ec-envelope-type"
                    >
                      {selectedEnvelopeType || 'Select Envelope Type'}
                    </button>

                    {typeDropdownOpen && (
                      <div className="absolute left-0 bottom-full mb-1 w-full bg-card border border-border rounded-md shadow-lg z-50">
                        {!showOtherInputInDropdown ? (
                          <>
                            <div className="p-2 border-b border-border">
                              <input
                                type="text"
                                value={typeSearch}
                                onChange={(e) => setTypeSearch(e.target.value)}
                                placeholder="Search types..."
                                className="w-full px-3 py-2 text-sm border border-border rounded"
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
                                    className={`w-full text-left px-4 py-2 text-sm hover:border-primary hover:bg-muted ${selectedEnvelopeType === type.title ? 'bg-muted' : ''}`}
                                  >
                                    {type.title}
                                  </button>
                                ))}
                              {/* Always show "Other" option, especially when no matches */}
                              {envelopeTypes.filter((t) => t.title.toLowerCase().includes(typeSearch.toLowerCase())).length === 0 && typeSearch.trim() !== '' && (
                                <div className="px-4 py-2 text-sm text-muted-foreground">
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
                              <label className="block text-xs font-medium text-muted-foreground mb-1">
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
                                className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                                className="px-3 py-1.5 text-sm text-muted-foreground hover:bg-gray-100 rounded"
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
                    className=" cursor-pointer hover:bg-card relative"
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
              </div>
            </div>
          </div>

        );

      case 2:
        return (
          <>
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
          </>
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
              <h3 className="text-lg font-semibold text-foreground mb-2">Security & Authentication</h3>
              <p className="text-muted-foreground mb-6">Configure signature types and advanced authentication methods for enhanced security.</p>
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
              <h3 className="text-lg font-semibold text-foreground mb-2">Envelope Settings</h3>
              <p className="text-muted-foreground mb-6">Configure how your envelope will be sent and managed.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Subject *</label>
                <input
                  type="text"
                  value={envelopeData.subject}
                  onChange={(e) => setEnvelopeData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter envelope subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Message</label>
                <textarea
                  value={envelopeData.message}
                  onChange={(e) => setEnvelopeData(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a message for recipients (optional)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Priority</label>
                  <select
                    value={envelopeData.priority}
                    onChange={(e) => setEnvelopeData(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Signing Order</label>
                  <select
                    value={envelopeData.signingOrder}
                    onChange={(e) => setEnvelopeData(prev => ({ ...prev, signingOrder: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sequential">Sequential (one at a time)</option>
                    <option value="parallel">Parallel (all at once)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Expiration Date</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    readOnly={!isEditable}
                    className={`w-full px-3 py-2 border border-border rounded-lg 
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
                    className="w-4 h-4 text-blue-600 border-border rounded focus:ring-blue-500"
                  />
                  <label htmlFor="reminderEnabled" className="text-sm font-medium text-muted-foreground">
                    Enable automatic reminders
                  </label>
                </div>

                {envelopeData.reminderEnabled && (
                  <div className="ml-7">
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Reminder interval (days)</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={envelopeData.reminderInterval}
                      onChange={(e) => setEnvelopeData(prev => ({ ...prev, reminderInterval: parseInt(e.target.value) }))}
                      className="w-24 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="requireAllSignatures"
                    checked={envelopeData.requireAllSignatures}
                    onChange={(e) => setEnvelopeData(prev => ({ ...prev, requireAllSignatures: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-border rounded focus:ring-blue-500"
                  />
                  <label htmlFor="requireAllSignatures" className="text-sm font-medium text-muted-foreground">
                    Require all recipients to sign
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="allowDecline"
                    checked={envelopeData.allowDecline}
                    onChange={(e) => setEnvelopeData(prev => ({ ...prev, allowDecline: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-border rounded focus:ring-blue-500"
                  />
                  <label htmlFor="allowDecline" className="text-sm font-medium text-muted-foreground">
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
              <h3 className="text-lg font-semibold text-foreground mb-2">Review & Send</h3>
              <p className="text-muted-foreground mb-6">Review your envelope details before sending to recipients.</p>
            </div>

            <div className="space-y-6">
              {/* Envelope Summary */}
              <div className="bg-white border border-border rounded-lg p-6">
                <h4 className="text-lg font-medium text-foreground mb-4">Envelope Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Subject</p>
                    <p className="text-foreground">{envelopeData.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Priority</p>
                    <p className="text-foreground capitalize">{envelopeData.priority}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Signature Type</p>
                    <div className="flex items-center gap-2">
                      {envelopeData.signatureType === 'qualified' && <Award className="w-4 h-4 text-purple-600" />}
                      {envelopeData.signatureType === 'advanced' && <Shield className="w-4 h-4 text-blue-600" />}
                      <p className="text-foreground capitalize">{envelopeData.signatureType}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Documents</p>
                    <p className="text-foreground">{documents?.length} document{documents?.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {envelopeData.message && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-muted-foreground">Message</p>
                    <p className="text-foreground">{envelopeData.message}</p>
                  </div>
                )}
              </div>

              {/* Documents */}
              <div className="bg-white border border-border rounded-lg p-6">
                <h4 className="text-lg font-medium text-foreground mb-4">Documents</h4>
                <div className="space-y-3">
                  {documents?.map((doc) => (
                    <div key={doc.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-600" />
                      <div>
                        <p className="font-medium text-foreground">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">{doc.pages} pages • {(doc.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recipients */}
              <div className="bg-white border border-border rounded-lg p-6">
                <h4 className="text-lg font-medium text-foreground mb-4">Recipients</h4>
                <div className="space-y-3">
                  {recipients.map((recipient, index) => (
                    <div key={recipient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{toTitleCase(recipient.name)}</p>
                          <p className="text-sm text-muted-foreground">{recipient.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground capitalize">{recipient?.role?.replace('_', ' ') ?? ''}</p>
                        <p className="text-xs text-muted-foreground capitalize">
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
    <div className="min-h-screentext-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-between w-full">

            {/* LEFT — Back + Title */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() =>
                  window.history.length > 1 ? navigate(-1) : navigate('/e-sign/dashboard')
                }
                className="p-2 text-muted-foreground hover:text-muted-foreground rounded-lg hover:bg-gray-100 transition-colors"
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
                    className="text-base font-medium text-foreground px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[300px]"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h1 className="text-base font-medium text-foreground">
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
                      className="p-1 text-muted-foreground hover:text-muted-foreground rounded transition-colors"
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
                <CircleQuestionMark className="w-5 h-5 text-muted-foreground" />
              </button>

              {helpMenuOpen && (
                <div
                  ref={helpMenuRef}
                  className="absolute right-24 top-10 w-70 bg-background border border-border rounded-md shadow-xl z-50"
                >
                  <div className="px-4 py-3 border-b">
                    <h4 className="text-sm font-semibold text-foreground">Help for this Page</h4>
                  </div>
                  <div className="max-h-80 p-4 overflow-y-auto">
                    <button
                      onClick={() => { setHelpMenuOpen(false); setHelpSidebarOpen(true); }}
                      className="w-full text-left px-4 py-3 text-sm text-primary hover:bg-card"
                    >
                      Basic steps to send an envelope
                    </button>
                    <button
                      onClick={() => { setHelpMenuOpen(false); window.open('help-support', '_blank'); }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-muted border-t border-border"
                    >
                      <span className="text-primary">Visit the {APP_NAME} Support Center</span> for helpful articles, guides, videos, and more.
                    </button>
                    <div className="p-4 border-t border-border">
                      <button
                        onClick={() => window.open('/help-support', '_blank')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md text-foreground hover:text-primary-foreground"
                        style={{ backgroundColor: 'var(--primary)' }}
                      >
                        <Phone className='w-4 h-4' />
                        <span className="font-semibold">Contact Support</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button onClick={() => setShowAdvanced(true)} className="border px-4 py-2 rounded-xs text-xs font-medium text-foreground hover:bg-muted hover:text-foreground">
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
          <div className={`fixed inset-y-0 right-0 w-[420px] bg-background border-l border-border shadow-2xl z-40 transform transition-transform duration-300 ${helpSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            {/* Header Bar: back + close icons */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <button onClick={() => setHelpSidebarOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => setHelpSidebarOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted">
                  <X className="w-5 h-5 text-muted-foreground" />
           
              </button>
            </div>
            {/* Content */}
            <div className="px-6 py-6 overflow-y-auto h-full">
              <div className="mb-8 h-98">
                <h3 className="text-[14px] tracking-wide font-semibold text-foreground uppercase mb-4">BASIC STEPS TO SEND AN ENVELOPE</h3>
                <div className="pl-4 border-l-2 border-border text-[14px] leading-6 text-foreground">
                  <p>
                    To send an envelope, you upload the documents you want signed. Then you add the contact information
                    for the people who need to sign and what kind of information they will add, such as a signature, initials,
                    or their company name.
                  </p>
                </div>
                <div className="pl-4 mt-4 border-l-2 border-border">
                  <button
                    onClick={() => window.open('/e-sign/guide', '_blank')}
                    className="text-[#4C2FFF] underline text-[14px]"
                  >
                    Sending Documents for Signature
                  </button>
                </div>
              </div>

              {/* Bottom links */}
              <div className="pt-6 border-t border-border space-y-5 text-[14px]">
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
                  onClick={() => window.open('/contact-sales', '_blank')}
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
        <div className="w-80 bg-white border-r border-border p-6 hidden">
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
                      : 'bg-gray-300 text-muted-foreground'
                    }`}
                >
                  {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                </div>
                <div>
                  <p
                    className={`font-medium ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                  >
                    {step.name}
                  </p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="mt-8 pt-6 border-t border-border">
            <h4 className="text-sm font-medium text-foreground mb-4">Summary</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Documents</span>
                <span className="font-medium text-foreground">{documents?.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Recipients</span>
                <span className="font-medium text-foreground">{recipients?.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fields</span>

              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Signature Type</span>
                <span className="font-medium text-foreground capitalize">{envelopeData?.signatureType}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="max-w-6xlVV mx-auto">
            {renderStepContent()}
            {currentStep !== 2 && (
              <div className="flex items-center justify-end mt-8 pt-6 border-t border-border" id='clearBoth'>
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
                    className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground"
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

      {isCreatorTourOpen && (
        creatorTargetRect && (() => {
          const tooltipWidth = 384;
          const tooltipHeight = 200;
          const spacing = 12;
          const padding = 16;

          const targetCenterX = creatorTargetRect.left + (creatorTargetRect.width / 2);
          let tooltipLeft = targetCenterX - (tooltipWidth / 2);
          if (tooltipLeft < padding) {
            tooltipLeft = padding;
          } else if (tooltipLeft + tooltipWidth > window.innerWidth - padding) {
            tooltipLeft = window.innerWidth - tooltipWidth - padding;
          }

          const spaceBelow = window.innerHeight - creatorTargetRect.bottom - spacing;
          const spaceAbove = creatorTargetRect.top - spacing;
          const showAbove = spaceBelow < tooltipHeight && spaceAbove > spaceBelow;

          const tooltipTop = showAbove
            ? creatorTargetRect.top - tooltipHeight - spacing
            : creatorTargetRect.bottom + spacing;

          const arrowOffsetFromTooltipLeft = targetCenterX - tooltipLeft;
          const arrowPadding = 20;
          const constrainedArrowLeft = Math.max(arrowPadding, Math.min(arrowOffsetFromTooltipLeft, tooltipWidth - arrowPadding));

          const finalLeft = tooltipPosition ? tooltipPosition.x : tooltipLeft;
          const finalTop = tooltipPosition ? tooltipPosition.y : Math.max(padding, Math.min(tooltipTop, window.innerHeight - tooltipHeight - padding));

          return (
            <>
              <div
                ref={tooltipRef}
                className="fixed z-50"
                style={{
                  left: `${finalLeft}px`,
                  top: `${finalTop}px`
                }}
              >
                <div className="bg-[#000000]/50 text-foreground text-sm rounded-md shadow-lg max-w-sm relative">
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
                      <button onClick={closeCreatorTour} className="px-3 py-1.5 text-sm text-muted-foreground/50 hover:text-white">Skip</button>
                      <button onClick={prevCreatorStep} disabled={creatorTourIndex === 0} className={`px-3 py-1.5 border border-white-500 rounded-sm text-sm ${creatorTourIndex === 0 ? 'cursor-not-allowed text-white-900' : 'hover:bg-white-700 text-white'}`}>Back</button>
                      {creatorTourIndex < creatorTourSteps.length - 1 ? (
                        <button onClick={nextCreatorStep} className="px-3 py-1.5 bg-white text-[#26263d] rounded-sm text-sm font-medium hover:bg-gray-100">Next</button>
                      ) : (
                        <button onClick={closeCreatorTour} className="px-3 py-1.5 bg-white text-[#26263d] rounded-sm text-sm font-medium hover:bg-gray-100">Done</button>
                      )}
                    </div>
                  </div>
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
      {showAdvanced && (
        <div className=" fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAdvanced(false)} />
          <div className="relative bg-card w-full h-full flex flex-col overflow-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background z-10">
              <h2 className="text-xl font-semibold">Advanced Options</h2>
              <button onClick={() => setShowAdvanced(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted" title="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-1">
              <div className="w-72 border-r border-border p-6 sticky top-16 self-start h-[calc(100vh-4rem)]">
                <nav className="space-y-3 text-sm">
                  <button onClick={() => sectionRefs.reminders.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="w-full text-left px-3 py-2 rounded hover:bg-muted">Reminders</button>
                  <button onClick={() => sectionRefs.expiration.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="w-full text-left px-3 py-2 rounded hover:bg-muted">Expiration</button>
                  {/* <button onClick={() => sectionRefs.mobileFriendly.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="w-full text-left px-3 py-2 rounded hover:bg-muted-100">Mobile-Friendly</button> */}
                </nav>
              </div>

              <div className="flex-1 self-start sticky top-16" ref={advancedContentRef}>
                <div className="p-10 space-y-12">

                  <section ref={sectionRefs.reminders}>
                    <h3 className="text-2xl text-foreground">Reminders</h3>
                    <p className="text-muted-foreground mt-2">Follow up with automatic reminders. Signers will receive emails until they sign or decline the envelope.</p>
                    <div className="mt-6 flex items-center gap-3">
                      <label className="flex items-center gap-3 text-foreground cursor-pointer">
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
                        <label className="block text-sm font-medium text-muted-foreground mb-2">Reminder interval (days)</label>
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

                  <section ref={sectionRefs.expiration}>
                    <h3 className="text-2xl text-foreground">Expiration</h3>
                    <p className="text-muted-foreground mt-2">By default, envelopes expire after 120 days. Recipients can no longer view or sign an envelope after it expires.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">Days until envelope expires</label>
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
                        <label className="block text-sm font-medium text-muted-foreground mb-2">Custom number of days *</label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          className={`w-full border rounded px-3 py-2 ${advancedOptions.expirationType === 'never' ? 'cursor-not-allowed bg-gray-100' : ''
                            }`}
                          value={advancedOptions.expirationDays}
                          onChange={(e) => setAdvancedOptions(prev => ({ ...prev, expirationDays: parseInt(e.target.value) || 120 }))}
                          disabled={advancedOptions.expirationType === 'never'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">Send alert</label>
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
                        <label className="block text-sm font-medium text-muted-foreground mb-2">Custom number of days *</label>
                        <input
                          type="number"
                          min="0"
                          max="365"
                          className={`w-full border rounded px-3 py-2 ${advancedOptions.expirationType === 'never' ? 'cursor-not-allowed bg-gray-100' : ''
                            }`}
                          value={advancedOptions.expirationAlertDays}
                          onChange={(e) => setAdvancedOptions(prev => ({ ...prev, expirationAlertDays: parseInt(e.target.value) || 0 }))}
                          disabled={advancedOptions.alertType === 'never'}
                        />
                      </div>
                    </div>
                    {/* <hr className="mt-8" /> */}
                  </section>
                </div>
                <div className="sticky bottom-0 bg-card border-t border-border p-4 flex justify-end">
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
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-[700px] max-h-[90vh] overflow-y-auto p-6 z-[10000]">
            {!sending && (
              <button
                onClick={() => {
                  setShowSendConfirmationModal(false);
                  setDraggedSignerId(null);
                  setDragOverSignerId(null);
                }}
                className="absolute right-6 top-6 text-2xl text-foreground hover:text-foreground z-10"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-3 mt-4 mb-8 pb-6 border-b border-muted-foreground">
              <div className={`flex items-center gap-2.5 transition-colors ${sendModalStep >= 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${sendModalStep >= 1
                  ? 'bg-muted text-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground'
                  }`}>
                  {sendModalStep > 1 ? <Check className="w-5 h-5" /> : '1'}
                </div>
                <span className="font-semibold text-sm">Signing Order</span>
              </div>
              <div
                className={`flex-1 h-0.5 transition-colors ${sendModalStep >= 2 ? 'bg-primary' : 'bg-border'}`}
                aria-hidden
              />
              <div className={`flex items-center gap-2.5 transition-colors ${sendModalStep >= 2 ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${sendModalStep >= 2
                  ? 'bg-muted text-foreground shadow-sm'
                  : 'bg-muted text-foreground'
                  }`}>
                  2
                </div>
                <span className="font-semibold text-sm">Summary</span>
              </div>
            </div>

            {sendModalStep === 1 && (
              <div>
                <div className="mb-2 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-[24px] font-semibold text-foreground mb-1">
                      {recipients.length === 1 ? 'Review Recipient Summary' : 'Review Signing Order'}
                    </h2>
                    <p className="text-sm text-foreground">
                      {recipients.length === 1
                        ? 'Review recipient details before sending.'
                        : 'Drag & drop to reorder signers'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowSendConfirmationModal(false);
                      setSendModalStep(1);
                      setCurrentStep(1);
                      setShowRecipients(true);
                      setDraggedSignerId(null);
                      setDragOverSignerId(null);
                      if (envelopeId) {
                        navigate(`/e-sign/create?step=1&envelopeId=${envelopeId}`);
                      } else {
                        navigate(`/e-sign/create?step=1`);
                      }
                    }}
                    className="px-4 py-2.5 border border-border rounded-lg text-muted-foreground hover:bg-card font-medium transition-colors text-sm whitespace-nowrap"
                  >
                    {recipients.length === 1 ? 'Edit recipient' : 'Edit / Add more recipients'}
                  </button>
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
                      name: formatSentenceCase(r.name || r.email || 'Recipient'),
                      email: r.email
                    }));

                    return (
                      <div className="relative">
                        {/* Vertical Timeline Line */}
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-muted z-0" />

                        {/* Sender Row */}
                        <div className="relative flex items-center py-4 mb-2">
                          <div className="relative z-10 flex items-center gap-4 w-full">
                            <div className="flex-shrink-0 w-12 flex justify-center">
                              <div className="w-10 h-10 rounded-full bg-purple-100 border-2 border-purple-300 flex items-center justify-center font-semibold text-[#3E2B66] text-sm">
                                {(((user?.fullname || user?.email || '?') as string).match(/\b\w/g) || []).slice(0, 2).join('').toUpperCase()}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-muted-foreground">SENDER</div>
                              <div className="text-xs text-muted-foreground">{formatSentenceCase(user?.fullname || user?.email || 'You')}</div>
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
                              className={`relative flex items-center py-3 mb-1 rounded-lg transition-all duration-200 ${isDragging
                                ? 'opacity-50 scale-95 shadow-lg bg-card'
                                : isDragOver
                                  ? 'bg-blue-50 border-2 border-blue-200'
                                  : 'hover:bg-muted'
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
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm border-2 ${isCurrent
                                    ? 'bg-[#3E2B66] border-[#3E2B66] text-white'
                                    : 'bg-mute border-border text-muted-foreground'
                                    }`}>
                                    {getInitials(p.name, p.email)}
                                  </div>
                                </div>

                                {/* Drag Handle */}
                                {recipients.length > 1 && (
                                  <div
                                    className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-muted-foreground transition-colors"
                                    title="Drag to reorder"
                                    onMouseDown={(e) => e.stopPropagation()}
                                  >
                                    <GripVertical className="w-5 h-5" />
                                  </div>
                                )}

                                {/* Signer Info */}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-foreground">{index + 1}.</span>
                                    <span className="text-sm font-medium text-foreground">{p.name}</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-0.5">{p.email}</div>
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
                              <div className="text-sm font-semibold text-muted-foreground">COMPLETED</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-border">
                  <button
                    onClick={() => {
                      setShowSendConfirmationModal(false);
                      setDraggedSignerId(null);
                      setDragOverSignerId(null);
                    }}
                    className="px-6 py-2.5 border border-border rounded-lg text-muted-foreground hover:bg-muted font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendModalStep(2)}
                    className="rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Authentication & Credits */}
            {sendModalStep === 2 && (
              <div>
                {sending && !isScheduled ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    {/* Envelope Sending Animation */}
                    <div className="relative mb-8 w-full max-w-md">
                      {/* Animated Envelope */}
                      <div className="envelope-sending-container relative flex items-center justify-center">
                        {/* Main Envelope */}
                        <div className="relative z-20 envelope-flying">
                          <div className="relative">
                            {/* Envelope Body */}
                            <div className="relative w-28 h-20 bg-gradient-to-br from-primary to-primary/75 rounded-sm shadow-2xl shadow-primary/25 envelope-body overflow-hidden">
                              {/* Envelope Flap (Triangle shape) */}
                              <div className="absolute -top-4 left-0 w-full h-8 bg-gradient-to-br from-primary/95 to-primary envelope-flap"
                                style={{
                                  clipPath: 'polygon(0 100%, 50% 0, 100% 100%)',
                                  transformOrigin: 'center bottom'
                                }}>
                              </div>
                              {/* Envelope Content Area */}
                              <div className="absolute inset-0 flex items-center justify-center pt-2">
                                <Mail className="w-10 h-10 text-primary-foreground/90 relative z-10" />
                              </div>
                              {/* Shine Effect */}
                              <div className="absolute inset-0 envelope-shine rounded-sm"></div>
                              {/* Envelope Border/Outline */}
                              <div className="absolute inset-0 border-2 border-primary/40 rounded-sm"></div>
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
                          <div className="relative w-12 h-8 bg-gradient-to-br from-primary/85 to-primary/65 rounded-sm shadow-lg overflow-hidden">
                            <div className="absolute -top-2 left-0 w-full h-4 bg-gradient-to-br from-primary/90 to-primary/80"
                              style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}></div>
                            <div className="absolute inset-0 flex items-center justify-center pt-1">
                              <Mail className="w-4 h-4 text-primary-foreground/85" />
                            </div>
                          </div>
                        </div>

                        {/* Small Envelope 2 - Top Right */}
                        <div className="absolute top-6 right-16 small-envelope-2">
                          <div className="relative w-12 h-8 bg-gradient-to-br from-primary/85 to-primary/65 rounded-sm shadow-lg overflow-hidden">
                            <div className="absolute -top-2 left-0 w-full h-4 bg-gradient-to-br from-primary/90 to-primary/80"
                              style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}></div>
                            <div className="absolute inset-0 flex items-center justify-center pt-1">
                              <Mail className="w-4 h-4 text-primary-foreground/85" />
                            </div>
                          </div>
                        </div>

                        {/* Small Envelope 3 - Bottom Left */}
                        <div className="absolute bottom-8 left-16 small-envelope-3">
                          <div className="relative w-12 h-8 bg-gradient-to-br from-primary/85 to-primary/65 rounded-sm shadow-lg overflow-hidden">
                            <div className="absolute -top-2 left-0 w-full h-4 bg-gradient-to-br from-primary/90 to-primary/80"
                              style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}></div>
                            <div className="absolute inset-0 flex items-center justify-center pt-1">
                              <Mail className="w-4 h-4 text-primary-foreground/85" />
                            </div>
                          </div>
                        </div>

                        {/* Small Envelope 4 - Bottom Right */}
                        <div className="absolute bottom-6 right-12 small-envelope-4">
                          <div className="relative w-12 h-8 bg-gradient-to-br from-primary/85 to-primary/65 rounded-sm shadow-lg overflow-hidden">
                            <div className="absolute -top-2 left-0 w-full h-4 bg-gradient-to-br from-primary/90 to-primary/80"
                              style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}></div>
                            <div className="absolute inset-0 flex items-center justify-center pt-1">
                              <Mail className="w-4 h-4 text-primary-foreground/85" />
                            </div>
                          </div>
                        </div>

                        {/* Small Envelope 5 - Top Center */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 small-envelope-5">
                          <div className="relative w-10 h-7 bg-gradient-to-br from-primary/75 to-primary/55 rounded-sm shadow-md overflow-hidden">
                            <div className="absolute -top-1.5 left-0 w-full h-3 bg-gradient-to-br from-primary/85 to-primary/70"
                              style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}></div>
                            <div className="absolute inset-0 flex items-center justify-center pt-0.5">
                              <Mail className="w-3 h-3 text-primary-foreground/75" />
                            </div>
                          </div>
                        </div>

                        {/* Small Envelope 6 - Bottom Center */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 small-envelope-6">
                          <div className="relative w-10 h-7 bg-gradient-to-br from-primary/75 to-primary/55 rounded-sm shadow-md overflow-hidden">
                            <div className="absolute -top-1.5 left-0 w-full h-3 bg-gradient-to-br from-primary/85 to-primary/70"
                              style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}></div>
                            <div className="absolute inset-0 flex items-center justify-center pt-0.5">
                              <Mail className="w-3 h-3 text-primary-foreground/75" />
                            </div>
                          </div>
                        </div>

                        {/* Destination Indicators */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 opacity-40">
                          <div className="w-4 h-4 bg-primary rounded-full animate-ping"></div>
                          <div className="absolute inset-0 w-4 h-4 bg-primary rounded-full"></div>
                        </div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-40">
                          <div className="w-4 h-4 bg-primary rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                          <div className="absolute inset-0 w-4 h-4 bg-primary rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-2xl font-semibold text-primary mb-3">Sending Envelope...</h3>
                    <p className="text-muted-foreground text-center max-w-md mb-6">
                      Please wait while we send your envelope to all recipients. This may take a few moments.
                    </p>
                    <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        <span className="font-medium text-foreground">Processing recipients</span>
                      </div>
                      <div className="w-1 h-1 bg-muted-foreground/40 rounded-full"></div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                        <span className="font-medium text-foreground">Consuming credits</span>
                      </div>
                      <div className="w-1 h-1 bg-muted-foreground/40 rounded-full"></div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
                        <span className="font-medium text-foreground">Sending emails</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Invoice Header */}
                    <div className="mb-8 pb-6 border-b-2 border-border">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h2 className="text-3xl font-bold text-foreground mb-1">Envelope Summary</h2>
                          {/* <p className="text-sm text-muted-foreground">Transaction Summary</p> */}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1">Date</p>
                          <p className="text-sm font-semibold text-foreground">
                            {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Insufficient Credits Warning */}
                    {((subscriptionPlan?.creditsBalance || 0) - calculateTotalCost()) < 0 && (
                      <div className="bg-destructive/10 dark:bg-destructive/15 border-2 border-destructive/30 rounded-lg p-5 mb-6">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-destructive flex items-center justify-center mt-0.5">
                            <span className="text-destructive-foreground text-xs font-bold">!</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-destructive mb-2">Insufficient Credits</h3>
                            <p className="text-sm text-destructive/90 mb-3">
                              You need <span className="font-bold">{calculateTotalCost()}</span> credits but only have{' '}
                              <span className="font-bold">{subscriptionPlan?.creditsBalance || 0}</span> credits available.
                            </p>
                            <p className="text-sm text-destructive/80">
                              Please upgrade your plan or add credits to proceed with sending this envelope.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Invoice Line Items */}
                    <div className="mb-6">
                      {/* <h3 className="text-lg font-semibold text-foreground mb-4">Line Items</h3> */}

                      {/* Table Header - Only show when there are recipients with authentication */}
                      {hasRecipientsWithAuth && (
                        <div className="bg-gradient-to-r from-primary to-primary/90 border border-primary/30 rounded-t-lg overflow-hidden">
                          <div className="grid grid-cols-12 gap-4 px-4 py-3">
                            <div className="col-span-1 text-xs font-semibold text-primary-foreground">#</div>
                            <div className="col-span-4 text-xs font-semibold text-primary-foreground">Recipient</div>
                            <div className="col-span-5 text-xs font-semibold text-primary-foreground">Authentication Method</div>
                            <div className="col-span-2 text-xs font-semibold text-primary-foreground text-right">Cost</div>
                          </div>
                        </div>
                      )}

                      {/* Table Body - Only show recipients with authentication methods */}
                      <div className={`border border-border ${hasRecipientsWithAuth ? 'rounded-b-lg' : 'rounded-lg'} overflow-hidden`}>
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
                            const planRow = subscriptionPlan || SubscriptionStorage.getPlan();
                            const rawLineCost = authMethodList.reduce((sum, method) => sum + (method?.cost || 0), 0);
                            const effectiveLineCost = authMethodList.reduce((sum, method) => {
                              if (!method) return sum;
                              if (isAuthMethodFreeViaReferralPerk(method, planRow)) return sum;
                              return sum + (method.cost || 0);
                            }, 0);
                            const authDisplay = authMethodList.map(m => m?.name).join(', ');

                            return (
                              <div
                                key={recipient.id}
                                className={`grid grid-cols-12 gap-4 px-4 py-4 border-b border-border last:border-b-0 hover:bg-accent/50 transition-colors ${index % 2 === 0 ? 'bg-card' : 'bg-muted/40'
                                  }`}
                              >
                                <div className="col-span-1 text-sm font-medium text-muted-foreground flex items-center">{recipient.order}</div>
                                <div className="col-span-4">
                                  <p className="text-sm font-semibold text-foreground truncate">
                                    {toTitleCase(recipient.name) || recipient.email}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">{recipient.email}</p>
                                </div>
                                <div className="col-span-5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground font-medium">{authDisplay}</span>
                                    <button
                                      type="button"
                                      title="Edit authentication method"
                                      onClick={() => {
                                        setAuthModalForRecipientId(recipient.id);
                                        setAuthModalForBulk(false);
                                        setShowAuthModal(true);
                                      }}
                                      className="edit-icon-animated group relative inline-flex items-center justify-center w-7 h-7 rounded-md text-primary border border-transparent hover:border-primary/40 hover:bg-accent/60 transition-all duration-300 flex-shrink-0 shadow-sm hover:shadow-md hover:shadow-primary/20 hover:scale-110 active:scale-95 hover:-translate-y-0.5 ring-offset-background"
                                    >
                                      <div className="absolute inset-0 rounded-md bg-primary opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300 z-0"></div>
                                      <Edit className='w-3.5 h-3.5 relative z-10 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110 group-active:rotate-0 group-active:scale-100' />
                                      <div className="absolute inset-0 rounded-md ring-2 ring-primary/40 ring-offset-1 ring-offset-background opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></div>
                                    </button>
                                  </div>
                                </div>
                                <div className="col-span-2 text-sm font-semibold text-right flex items-center justify-end flex-wrap gap-1">
                                  {effectiveLineCost === 0 && rawLineCost > 0 ? (
                                    <>
                                      <span className="text-success">Free</span>
                                      <span className="text-xs font-normal text-muted-foreground">(referral)</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-primary">{effectiveLineCost > 0 ? `${effectiveLineCost}` : '0'}</span>
                                      <span className="text-xs text-muted-foreground font-normal ml-1">credits</span>
                                    </>
                                  )}
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
                            <div className="px-4 py-8 text-center text-muted-foreground">
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
                        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-muted transition-colors rounded-l-lg"
                      >
                        <ChevronDown
                          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showSummary ? 'rotate-180' : ''}`}
                        />
                        <span className="text-muted-foreground font-medium">View Summary</span>
                      </button>

                      {showSummary && (
                        <div className="mt-4 bg-gradient-to-br from-muted/60 to-accent/40 border border-border rounded-lg p-6 shadow-sm">
                          {/* Recipients without authentication */}
                          {recipients.filter((recipient) => {
                            const authArray = parseAuthentication(recipient.authentication);
                            const authMethodList = authArray.map(authId =>
                              authMethods.find(m => m.id === authId)
                            ).filter(Boolean);
                            return authMethodList.length === 0;
                          }).length > 0 && (
                              <div className="mb-6">
                                <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
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
                                        className="flex items-center justify-between p-3 bg-card border border-amber-500/35 dark:border-amber-400/25 rounded-lg hover:border-amber-500/55 transition-colors"
                                      >
                                        <div className="flex-1">
                                          <p className="text-sm font-semibold text-foreground">
                                            {toTitleCase(recipient.name) || recipient.email}
                                          </p>
                                          <p className="text-xs text-muted-foreground">{recipient.email}</p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setAuthModalForRecipientId(recipient.id);
                                            setAuthModalForBulk(false);
                                            setShowAuthModal(true);
                                          }}
                                          className="inline-flex items-center gap-2 px-2 py-1 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/15 dark:from-amber-500/20 dark:via-amber-400/15 dark:to-amber-500/20 border-2 border-amber-500/50 dark:border-amber-400/45 rounded-full text-xs font-semibold text-foreground hover:from-amber-500/25 hover:via-amber-500/15 hover:to-amber-500/25 transition-all duration-200 shadow-md hover:shadow-xl hover:scale-105 animate-golden-shine relative group"
                                        >
                                          <LockKeyhole className="w-4 h-4 relative z-10 text-amber-700 dark:text-amber-300 group-hover:text-amber-800 dark:group-hover:text-amber-200 transition-colors" />
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
                              <span className="text-muted-foreground">Current Balance:</span>
                              <span className="font-semibold text-foreground">{subscriptionPlan?.creditsBalance || 0} credits</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">Deduction:</span>
                              <span className="font-semibold text-destructive">- {calculateTotalCost()} credits</span>
                            </div>
                            <div className="border-t border-border pt-3 mt-3">
                              <div className="flex justify-between items-center">
                                <span className="text-base font-semibold text-foreground">Remaining Balance:</span>
                                <span className={`text-xl font-bold ${((subscriptionPlan?.creditsBalance || 0) - calculateTotalCost()) >= 0
                                  ? 'text-success'
                                  : 'text-destructive'
                                  }`}>
                                  {(subscriptionPlan?.creditsBalance || 0) - calculateTotalCost()} credits
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Schedule Envelope Section */}
                    <div className="mt-6 pt-6 border-t border-border">
                      <div className="flex items-center gap-3 mb-4">
                        <input
                          type="checkbox"
                          id="schedule-envelope"
                          checked={isScheduled}
                          onChange={(e) => {
                            setIsScheduled(e.target.checked);
                            if (!e.target.checked) {
                              setScheduledDate('');
                              setScheduledTime('');
                            }
                          }}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-primary focus:ring-offset-background"
                        />
                        <label htmlFor="schedule-envelope" className="text-sm font-medium text-muted-foreground cursor-pointer">
                          Schedule envelope to send later
                        </label>
                      </div>

                      {isScheduled && (
                        <div className="ml-7 space-y-4 bg-muted/50 border border-border rounded-lg p-4">
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-2">
                              Schedule Date & Time
                            </label>
                            <DatePicker
                              selected={scheduledDateTime}
                              onChange={(date: Date | null) => {
                                if (date) {
                                  setScheduledDateTime(date);
                                  // Update separate date and time states for API compatibility
                                  const dateStr = date.toISOString().split('T')[0];
                                  const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                                  setScheduledDate(dateStr);
                                  setScheduledTime(timeStr);
                                }
                              }}
                              showTimeSelect
                              timeFormat="HH:mm"
                              timeIntervals={1}
                              dateFormat="MMMM d, yyyy h:mm aa"
                              minDate={new Date()}
                              minTime={getMinTime()}
                              maxTime={new Date(0, 0, 0, 23, 59)}
                              filterTime={(time: Date) => {
                                const now = new Date();
                                const selected = scheduledDateTime;
                                // If selected date is today, filter out past times
                                if (
                                  selected.getDate() === now.getDate() &&
                                  selected.getMonth() === now.getMonth() &&
                                  selected.getFullYear() === now.getFullYear()
                                ) {
                                  const currentTime = now.getHours() * 60 + now.getMinutes();
                                  const timeToCheck = time.getHours() * 60 + time.getMinutes();
                                  // Allow times that are at least 1 minute in the future
                                  return timeToCheck > currentTime;
                                }
                                // For future dates, allow all times
                                return true;
                              }}
                              onChangeRaw={(e) => {
                                // Prevent manual typing into the input; users must pick from the picker
                                if (e && typeof (e as any).preventDefault === 'function') {
                                  (e as any).preventDefault();
                                }
                              }}
                              className=" px-3 py-2 w-full text-sm border border-border text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                              wrapperClassName="w-full"
                              calendarClassName="shadow-lg border border-border rounded-lg"
                              placeholderText="Select date and time"
                              isClearable={false}
                              required={isScheduled}
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">
                              For today, you can only select times after the current time.
                            </p>
                          </div>
                          {scheduledDateTime && (
                            <div className="text-sm text-muted-foreground mt-2 p-2 bg-card rounded border border-border">
                              <span className="font-medium text-xs text-primary">Scheduled for:</span>{' '}
                              <span className="text-xs text-foreground">
                                {scheduledDateTime.toLocaleString('en-US', {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 pt-6 mt-8 border-t border-border">
                      <button
                        onClick={() => setSendModalStep(1)}
                        disabled={sending}
                        className="px-6 py-2.5 border border-border rounded-lg text-muted-foreground hover:bg-muted font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

                          // Validate scheduling if enabled
                          if (isScheduled && !scheduledDate) {
                            toast.error('Please select a date for scheduling');
                            return;
                          }

                          // If credits are sufficient, proceed with sending/scheduling
                          if (!sending) {
                            confirmAndSendEnvelope();
                          }
                        }}
                        disabled={sending}
                        className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${(subscriptionPlan?.creditsBalance || 0) - calculateTotalCost() < 0
                          ? 'bg-muted text-muted-foreground cursor-not-allowed'
                          : sending
                            ? 'bg-primary text-primary-foreground cursor-wait opacity-90'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md'
                          }`}
                      >
                        {sending && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-primary-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-primary-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-primary-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        )}
                        {sending
                          ? (isScheduled
                            ? 'Scheduling Envelope...'
                            : (isInPersonOnlyFlow ? 'Starting in-person signing...' : 'Sending Envelope...'))
                          : (isScheduled
                            ? 'Confirm & Schedule'
                            : (isInPersonOnlyFlow ? 'Start in-person signing' : 'Confirm & Send'))
                        }
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
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex-1 mr-4">
                <h2 className="text-lg font-semibold text-foreground truncate">
                  {selectedPdfForPreview.name}
                </h2>
                {pdfNumPages && (
                  <p className="text-sm text-muted-foreground mt-0.5">{pdfNumPages} {pdfNumPages === 1 ? 'page' : 'pages'}</p>
                )}
              </div>
              <button
                onClick={() => {
                  setPdfPreviewModalOpen(false);
                  setPdfNumPages(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
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
                    <div className="text-muted-foreground">Loading PDF...</div>
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
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => {
              setShowAuthModal(false);
              setAuthModalForRecipientId(null);
              setAuthModalForBulk(false);
              setTempAuthSelection(undefined);
              setHasUserChangedSelection(false);
            }}
          />
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                Select Authentication Method
              </h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const methodsToSave = tempAuthSelection || [];
                    handleAuthMethodSelect(methodsToSave);
                  }}
                  className="rounded-lg bg-primary px-5 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAuthModal(false);
                    setAuthModalForRecipientId(null);
                    setAuthModalForBulk(false);
                    setTempAuthSelection(undefined);
                    setHasUserChangedSelection(false);
                  }}
                  className="z-10 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
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
              setShowAddRecipientForm(false);
              setEditingSavedRecipientId(null);
              resetNewRecipientFormState();
            }}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-[25px] thankyou-heading font-semibold text-[#3E2B66]">
                {editingSavedRecipientId
                  ? "Edit Recipient"
                  : showAddRecipientForm
                    ? "Add Recipient"
                    : "Select Recipient"}
              </h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (showAddRecipientForm) {
                      setShowAddRecipientForm(false);
                      setEditingSavedRecipientId(null);
                      resetNewRecipientFormState();
                    } else {
                      setEditingSavedRecipientId(null);
                      resetNewRecipientFormState();
                      setShowAddRecipientForm(true);
                    }
                  }}
                  className={`inline-flex items-center px-4 py-2 font-medium rounded-lg transition-colors text-sm
                    ${showAddRecipientForm
                      ? ""
                      : "bg-[#3E2B66] text-white hover:bg-[#4d3577]"
                    }
                  `}
                >
                  {showAddRecipientForm ? (
                    " "
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {showAddRecipientForm ? '' : 'Add New'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRecipientListModal(false);
                    setRecipientListModalForId(null);
                    setRecipientListSearch('');
                    setShowAddRecipientForm(false);
                    setEditingSavedRecipientId(null);
                    resetNewRecipientFormState();
                  }}
                  className="text-muted-foreground hover:text-muted-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Add Recipient Form */}
            {showAddRecipientForm && (
              <div className="p-4 border-b border-border bg-gray-50">
                <SavedRecipientContactFields
                  values={newRecipientForm}
                  errors={recipientFormErrors}
                  onFieldChange={handleSavedRecipientFieldChange}
                  onPhoneChange={handleSavedRecipientPhoneChange}
                  disabled={savingNewRecipient}
                  phoneDropdownZIndex={10020}
                />
                <div className="flex items-center gap-4 justify-end mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddRecipientForm(false);
                      setEditingSavedRecipientId(null);
                      resetNewRecipientFormState();
                    }}
                    className="inline-flex items-center px-4 py-2 font-medium rounded-lg transition-colors text-sm bg-gray-200 text-muted-foreground hover:bg-gray-300"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNewRecipient}
                    disabled={savingNewRecipient || !isSavedRecipientFormValid(newRecipientForm)}
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
                        {editingSavedRecipientId ? 'Save changes' : 'Save & Select'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Search Input */}
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="search"
                  inputMode="search"
                  autoComplete="off"
                  value={recipientListSearch}
                  onChange={(e) => setRecipientListSearch(e.target.value)}
                  placeholder="Search by name, email, company, or phone…"
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder:text-xs"
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
                const filteredRecipients = savedRecipients.filter((r) =>
                  recipientListRowMatchesQuery(r, recipientListSearch)
                );

                if (filteredRecipients.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        {recipientListSearch ? 'No recipients found' : 'No recipients saved'}
                      </h3>
                      <p className="text-muted-foreground">
                        {recipientListSearch ? 'Try adjusting your search terms' : 'Go to Manage Recipients to add recipients'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {filteredRecipients.map((recipient) => {
                      const resolvedPhone = (() => {
                        const direct = String(recipient.phone || '').trim();
                        if (direct) return direct;
                        const emailKey = String(recipient.email || '').toLowerCase().trim();
                        if (!emailKey) return '';
                        const fromCurrentRecipients = recipients.find(
                          (r) => String(r.email || '').toLowerCase().trim() === emailKey
                        );
                        return String((fromCurrentRecipients as any)?.phone || '').trim();
                      })();
                      const canManage =
                        recipient.addressBookEntry &&
                        isPersistedAddressBookRecipientId(recipient._id);
                      return (
                        <div
                          key={recipient._id}
                          className="group flex w-full items-stretch overflow-hidden rounded-lg border border-border bg-white transition-colors hover:border-purple-300"
                        >
                          <button
                            type="button"
                            onClick={() => selectRecipientFromList(recipient)}
                            className="min-w-0 flex-1 text-left p-4 hover:bg-purple-50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-foreground mb-1">
                                  {recipient.name}
                                </div>
                                <div className="flex text-xs text-muted-foreground mb-1 break-all">
                                  {recipient.email}
                                  {resolvedPhone ? ` | ${resolvedPhone}` : ''}
                                </div>
                              </div>
                            </div>
                          </button>
                          {canManage && (
                            <div className="flex shrink-0 flex-col justify-center gap-1 border-l border-gray-100 bg-gray-50/80 px-2 py-2">
                              <button
                                type="button"
                                aria-label="Edit recipient"
                                disabled={deletingSavedRecipientId === recipient._id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setEditingSavedRecipientId(recipient._id);
                                  setNewRecipientForm({
                                    name: recipient.name || '',
                                    email: recipient.email || '',
                                    title: recipient.title || '',
                                    company: recipient.company || '',
                                    phone: recipient.phone || '',
                                    address: recipient.address || '',
                                  });
                                  setRecipientFormErrors({});
                                  setShowAddRecipientForm(true);
                                }}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-purple-700 hover:bg-purple-100 disabled:opacity-40"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                aria-label="Delete recipient"
                                disabled={deletingSavedRecipientId === recipient._id}
                                onClick={(e) => handleDeleteSavedRecipient(e, recipient)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-40"
                              >
                                {deletingSavedRecipientId === recipient._id ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>  
                          )}
                        </div>
                      );
                    })}
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
