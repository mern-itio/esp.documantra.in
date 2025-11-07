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
  ArrowUp
} from 'lucide-react';
// import { useApp } from '../../context/AppContext';
import type { Document, Recipient } from '../../types';
// import AdvancedAuthenticationSelector from '../../components/ESign/advanced/AdvancedAuthenticationSelector';
import SignatureTypeSelector from '../../components/ESign/advanced/SignatureTypeSelector';
import { eSignApi, templateServiceApi } from '../../services/apiHelper';
import SigningEditorStep from '../../components/ESign/SigningEditorStep';
import type { SignatureField as EditorSignatureField } from '../../components/ESign/SigningEditorStep';
// Extend editor field locally to allow optional power-form metadata used during save
type EditorSignatureFieldExt = EditorSignatureField & {
  signerIndex?: number | null;
  isPowerForm?: boolean;
  fieldType?: string;
  option?: string[];
};
import type { AxiosProgressEvent } from 'axios';
import { Card } from '../../components/DocumentService/ui/card';
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

const PowerFormCreate: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { envelopeId: routeEnvelopeId } = useParams<{ envelopeId: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Power Form State
  const [mode, setMode] = useState<'normal' | 'power'>('normal');
  const [powerForms, setPowerForms] = useState<any[]>([]);
  const [selectedForm, setSelectedForm] = useState<string>("");
  const [powerFormData, setPowerFormData] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);

  // Parties & related state.....
  const [parties, setParties] = useState<Party[]>(
    [{ id: 'slot_1', name: 'Party A', slot: 1, role: 'signer', authMethod: 'email', required: true }]
  );
  const [numberOfParties, setNumberOfParties] = useState<number>(parties.length || 1);
  const [maxParties] = useState<number>(10);

  // Selected/first party ids (creator choices)
  const [selectedPartyId, setSelectedPartyId] = useState<string>(parties[0]?.id ?? 'slot_1');
  const [firstSigningPartyId, setFirstSigningPartyId] = useState<string>(parties[0]?.id ?? 'slot_1');

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
  // const RECIPIENT_COLORS = ["#789ceaff", "#87ecccff", "#f0c089ff", "#eea1c3ff", "#b99aeeff", "#f7b1bcff"];
  const [_showSigningOrder, _setShowSigningOrder] = useState(false);
  // Bulk send modal state
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
  // const [bulkAccessCode, setBulkAccessCode] = useState<string | undefined>(undefined);
  // const [openBulkAccess, setOpenBulkAccess] = useState<boolean>(false);
  // const [bulkPrivateMessage, setBulkPrivateMessage] = useState<string | undefined>(undefined);
  // const [openBulkPrivate, setOpenBulkPrivate] = useState<boolean>(false);
  // Help menu / sidebar state
  const [helpMenuOpen, setHelpMenuOpen] = useState<boolean>(false);
  const [helpSidebarOpen, setHelpSidebarOpen] = useState<boolean>(false);
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
  // CSV recipient summary state (separate from manual bulk list)
  const [_csvRecipientList, _setCsvRecipientList] = useState<null | { fileName: string; role: Recipient['role']; items: Array<{ name: string; email: string }> }>(null);
  const [csvRoleDropdownOpen, setCsvRoleDropdownOpen] = useState<boolean>(false);
  const [csvCustomizeOpen, setCsvCustomizeOpen] = useState<boolean>(false);
  const [_csvAccessCode, _setCsvAccessCode] = useState<string | undefined>(undefined);
  const [_openCsvAccess, _setOpenCsvAccess] = useState<boolean>(false);
  const [_csvPrivateMessage, _setCsvPrivateMessage] = useState<string | undefined>(undefined);
  const [_openCsvPrivate, _setOpenCsvPrivate] = useState<boolean>(false);
  const [showEnvelopeTooltip, setShowEnvelopeTooltip] = useState(false);
  const [showFrequencyTooltip, setShowFrequencyTooltip] = useState(false);
  const [_csvFile, _setCsvFile] = useState<File | null>(null);
  const [_isDragOverCsv, _setIsDragOverCsv] = useState(false);
  const [_showCsvExceptions, _setShowCsvExceptions] = useState(false);
  const [_unmatchedColumns, _setUnmatchedColumns] = useState<string[]>([]);
  const [_csvHeaders, _setCsvHeaders] = useState<string[]>([]);
  const [_csvRecipientsData, _setCsvRecipientsData] = useState<Array<Record<string, string>>>([]);
  const [_showRecipientsEditor, _setShowRecipientsEditor] = useState(false);
  const [_activeTab, _setActiveTab] = useState<'all' | 'errors'>('all');
  const [_showErrorBanner, _setShowErrorBanner] = useState(true);
  // const csvFileInputRef = useRef<HTMLInputElement>(null);
  const bulkRoleRef = useRef<HTMLButtonElement | null>(null);
  const bulkCustomizeRef = useRef<HTMLButtonElement | null>(null);

  // Guided tour for Envelope Creator
  const [isCreatorTourOpen, setIsCreatorTourOpen] = useState<boolean>(false);
  const [creatorTourIndex, setCreatorTourIndex] = useState<number>(0);
  const creatorTourSteps = [
    { id: 'upload', selector: '[data-tour="ec-upload"]', title: 'Upload Documents', content: 'Drag and drop or browse to upload PDF documents for signing.' },
    { id: 'recipients', selector: '[data-tour="ec-recipients-toggle"]', title: 'Add Recipients', content: 'Open the recipients section to specify who needs to sign.' },
    { id: 'addRecipient', selector: '[data-tour="ec-add-recipient"]', title: 'Create Recipient', content: 'Add at least one recipient and provide their name and email.' },
    { id: 'message', selector: '[data-tour="ec-message-toggle"]', title: 'Subject & Message', content: 'Set an email subject and an optional message for your recipients.' },
    { id: 'subjectInput', selector: '[data-tour="ec-subject-input"]', title: 'Subject', content: 'Enter a clear subject. It appears in the email sent to recipients.' },
    { id: 'type', selector: '[data-tour="ec-envelope-type"]', title: 'Envelope Type', content: 'Choose an envelope type to help organize and track your envelope.' },
    { id: 'next', selector: '[data-tour="ec-next-button"]', title: 'Next', content: 'Proceed to the next step. You can return later if needed.' },
    { id: 'send', selector: '[data-tour="ec-send-button"]', title: 'Send', content: 'When everything looks good, send your envelope for signature.' },
  ] as const;
  const [creatorTargetRect, setCreatorTargetRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    if (!isCreatorTourOpen) return;
    const step = creatorTourSteps[creatorTourIndex];
    const el = document.querySelector(step?.selector || '') as HTMLElement | null;
    if (el) {
      const rect = el.getBoundingClientRect();
      setCreatorTargetRect(rect);
      const top = Math.max(0, window.scrollY + rect.top - 140);
      window.scrollTo({ top, behavior: 'smooth' });
    } else {
      setCreatorTargetRect(null);
    }
  }, [isCreatorTourOpen, creatorTourIndex]);
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
      if (step?.id === 'message') {
        setShowAddMessage(true);
      }
      if (step?.id === 'next') {
        await handleNext();
      }
      if (step?.id === 'send') {
        if (!sending) await handleSendEnvelope();
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

  // const addBulkRow = () => {
  //   if (bulkRows.length >= 10) return;
  //   setBulkRows(prev => [...prev, { id: `row_${Date.now()}`, name: '', email: '' }]);
  // };
  // const removeBulkRow = (id: string) => {
  //   setBulkRows(prev => prev.filter(r => r.id !== id));
  // };
  // const downloadSampleCsv = async () => {
  //   try {
  //     // Fetch the CSV file from public folder
  //     const response = await fetch('/Sample-Bulk-Recipient.csv');
  //     if (!response.ok) {
  //       throw new Error('Failed to fetch sample CSV');
  //     }
  //     const blob = await response.blob();
  //     const url = URL.createObjectURL(blob);
  //     const a = document.createElement('a');
  //     a.href = url;
  //     a.download = 'Sample-Bulk-Recipient.csv';
  //     document.body.appendChild(a);
  //     a.click();
  //     document.body.removeChild(a);
  //     URL.revokeObjectURL(url);
  //   } catch (error) {
  //     console.error('Error downloading sample CSV:', error);
  //     // Fallback to generated CSV if file not found
  //     const header = ['role', 'name', 'email'];
  //     const rows = [
  //       ['signer', 'Alice Smith', 'alice@example.com'],
  //       ['signer', 'Bob Lee', 'bob@example.com'],
  //     ];
  //     const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  //     const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  //     const url = URL.createObjectURL(blob);
  //     const a = document.createElement('a');
  //     a.href = url;
  //     a.download = 'bulk_recipients_sample.csv';
  //     document.body.appendChild(a);
  //     a.click();
  //     document.body.removeChild(a);
  //     URL.revokeObjectURL(url);
  //   }
  // };
  // const applyBulkRecipients = () => {
  //   const roleToUse = (bulkSharedRole || 'signer') as Recipient['role'];
  //   const cleaned = bulkRows
  //     .map(r => ({ name: (r.name || '').trim(), email: (r.email || '').trim() }))
  //     .filter(r => r.name && r.email);
  //   if (cleaned.length === 0) {
  //     setShowBulkModal(false);
  //     return;
  //   }
  //   setBulkList({ role: roleToUse, items: cleaned });
  //   if (!bulkBatchName) setBulkBatchName('Bulk Send List');
  //   // Prevent auto-adding a blank recipient and remove any auto-added empty one
  //   hasAutoAddedRecipient.current = true;
  //   setRecipients(prev => (prev.length === 1 && (!prev[0].name || prev[0].name.trim() === '') && (!prev[0].email || prev[0].email.trim() === '')) ? [] : prev);
  //   setShowRecipients(true);
  //   setShowBulkModal(false);
  // };

  // const handleCsvFileSelect = (file: File) => {
  //   if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
  //     alert('Please select a CSV file');
  //     return;
  //   }
  //   setCsvFile(file);
  //   parseCsvFile(file);
  // };

  // const parseCsvFile = async (file: File) => {
  //   try {
  //     const text = await file.text();
  //     const lines = text.split('\n').filter(line => line.trim());
  //     if (lines.length === 0) {
  //       setShowCsvExceptions(true);
  //       setUnmatchedColumns(['CSV file is empty']);
  //       setCsvHeaders([]);
  //       return;
  //     }

  //     // Parse CSV (handling quoted values)
  //     const parseCsvLine = (line: string): string[] => {
  //       const result: string[] = [];
  //       let current = '';
  //       let inQuotes = false;
  //       for (let i = 0; i < line.length; i++) {
  //         const char = line[i];
  //         if (char === '"') {
  //           inQuotes = !inQuotes;
  //         } else if (char === ',' && !inQuotes) {
  //           result.push(current.trim());
  //           current = '';
  //         } else {
  //           current += char;
  //         }
  //       }
  //       result.push(current.trim());
  //       return result;
  //     };

  //     // Get original headers (case-sensitive)
  //     const originalHeaders = parseCsvLine(lines[0]);
  //     setCsvHeaders(originalHeaders);

  //     // Get normalized headers for matching
  //     const headers = originalHeaders.map(h => h.toLowerCase().trim());
  //     const nameIdx = headers.findIndex(h => h === 'name' || h === 'full name');
  //     const emailIdx = headers.findIndex(h => h === 'email' || h === 'email address');
  //     const roleIdx = headers.findIndex(h => h === 'role');

  //     // Define expected/matched columns
  //     const expectedColumns = new Set<string>();
  //     if (nameIdx !== -1) expectedColumns.add(originalHeaders[nameIdx].toLowerCase());
  //     if (emailIdx !== -1) expectedColumns.add(originalHeaders[emailIdx].toLowerCase());
  //     if (roleIdx !== -1) expectedColumns.add(originalHeaders[roleIdx].toLowerCase());

  //     // Find unmatched columns
  //     const unmatched: string[] = [];
  //     originalHeaders.forEach((header) => {
  //       const normalized = header.toLowerCase().trim();
  //       if (!expectedColumns.has(normalized)) {
  //         unmatched.push(header);
  //       }
  //     });

  //     if (nameIdx === -1 || emailIdx === -1) {
  //       setShowCsvExceptions(true);
  //       setUnmatchedColumns(unmatched.length > 0 ? unmatched : ['Missing required columns: name and email']);
  //       return;
  //     }

  //     const parsedRows: Array<{ name: string; email: string; role?: string }> = [];
  //     for (let i = 1; i < lines.length; i++) {
  //       const values = parseCsvLine(lines[i]);
  //       const name = values[nameIdx]?.trim() || '';
  //       const email = values[emailIdx]?.trim() || '';
  //       const role = roleIdx !== -1 ? values[roleIdx]?.trim() : undefined;

  //       if (name && email) {
  //         parsedRows.push({ name, email, role });
  //       }
  //     }

  //     if (parsedRows.length === 0) {
  //       setShowCsvExceptions(true);
  //       setUnmatchedColumns(unmatched.length > 0 ? unmatched : ['No valid rows found in CSV']);
  //       return;
  //     }

  //     // Parse ALL rows with ALL columns for recipients editor
  //     const allRowsData: Array<Record<string, string>> = [];
  //     for (let i = 1; i < lines.length; i++) {
  //       const values = parseCsvLine(lines[i]);
  //       const rowData: Record<string, string> = {};
  //       originalHeaders.forEach((header, idx) => {
  //         rowData[header] = values[idx]?.trim() || '';
  //       });
  //       allRowsData.push(rowData);
  //     }
  //     setCsvRecipientsData(allRowsData);

  //     // If there are unmatched columns, show exceptions page
  //     if (unmatched.length > 0) {
  //       setShowCsvExceptions(true);
  //       setUnmatchedColumns(unmatched);
  //       // Still parse the data so user can accept if they want
  //       const rows = parsedRows.map((row, idx) => ({
  //         id: `csv_row_${Date.now()}_${idx}`,
  //         name: row.name,
  //         email: row.email
  //       }));
  //       setBulkRows(rows);
  //       return;
  //     }

  //     // Set the first role if found, otherwise keep current
  //     if (parsedRows[0].role && !bulkSharedRole) {
  //       const roleMap: Record<string, Recipient['role']> = {
  //         'signer': 'signer',
  //         'needs to sign': 'signer',
  //         'in person signer': 'in_person_signer',
  //         'carbon copy': 'carbon_copy',
  //         'receives a copy': 'carbon_copy',
  //         'approver': 'approver',
  //         'needs to view': 'needs_to_view'
  //       };
  //       const mappedRole = roleMap[parsedRows[0].role.toLowerCase()];
  //       if (mappedRole) setBulkSharedRole(mappedRole);
  //     }

  //     // Parse ALL rows with ALL columns for recipients editor (even when no unmatched columns)
  //     const allRowsDataComplete: Array<Record<string, string>> = [];
  //     for (let i = 1; i < lines.length; i++) {
  //       const values = parseCsvLine(lines[i]);
  //       const rowData: Record<string, string> = {};
  //       originalHeaders.forEach((header, idx) => {
  //         rowData[header] = values[idx]?.trim() || '';
  //       });
  //       allRowsDataComplete.push(rowData);
  //     }
  //     setCsvRecipientsData(allRowsDataComplete);

  //     // Convert to bulkRows format
  //     const rows = parsedRows.map((row, idx) => ({
  //       id: `csv_row_${Date.now()}_${idx}`,
  //       name: row.name,
  //       email: row.email
  //     }));

  //     setBulkRows(rows);
  //     setShowCsvExceptions(false);
  //   } catch (error) {
  //     console.error('Error parsing CSV:', error);
  //     setShowCsvExceptions(true);
  //     setUnmatchedColumns(['Error parsing CSV file. Please check the format.']);
  //     setCsvHeaders([]);
  //   }
  // };

  // const handleDragOverCsv = (e: React.DragEvent) => {
  //   e.preventDefault();
  //   setIsDragOverCsv(true);
  // };

  // const handleDragLeaveCsv = (e: React.DragEvent) => {
  //   e.preventDefault();
  //   setIsDragOverCsv(false);
  // };

  // const handleDropCsv = (e: React.DragEvent) => {
  //   e.preventDefault();
  //   setIsDragOverCsv(false);
  //   const file = e.dataTransfer.files[0];
  //   if (file) {
  //     handleCsvFileSelect(file);
  //   }
  // };

  // const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     handleCsvFileSelect(file);
  //   }
  // };

  // const applyCsvRecipients = () => {
  //   if (bulkRows.length === 0) {
  //     alert('Please upload a CSV file with recipient data');
  //     return;
  //   }
  //   const roleToUse = (bulkSharedRole || 'signer') as Recipient['role'];
  //   const cleaned = bulkRows
  //     .map(r => ({ name: (r.name || '').trim(), email: (r.email || '').trim() }))
  //     .filter(r => r.name && r.email);
  //   if (cleaned.length === 0) {
  //     alert('No valid recipients found in CSV');
  //     return;
  //   }
  //   setBulkList({ role: roleToUse, items: cleaned });
  //   // Mirror CSV UI even if user doesn't open the editor: set csvRecipientList and batch name from file
  //   setCsvRecipientList({
  //     fileName: csvFile?.name || 'bulk_recipients.csv',
  //     role: roleToUse,
  //     items: cleaned
  //   });
  //   setBulkBatchName(csvFile?.name || 'Bulk Send List');
  //   hasAutoAddedRecipient.current = true;
  //   // Use CSV roles, clear any existing individual recipients to avoid duplicate first card
  //   setRecipients([]);
  //   setShowRecipients(true);
  //   setShowBulkModal(false);
  //   setCsvFile(null);
  //   setShowCsvExceptions(false);
  //   setUnmatchedColumns([]);
  // };

  // const handleAcceptCsvExceptions = () => {
  //   // Open recipients editor to allow user to edit CSV data
  //   setShowCsvExceptions(false);
  //   setShowRecipientsEditor(true);
  //   // Ensure we're on the right step and method
  //   setBulkStep(2);
  //   // Ensure csvHeaders and csvRecipientsData are preserved
  //   // (they should already be set from CSV parsing, but make sure)
  // };

  // Validate recipient data
  // const validateRecipient = (recipient: Record<string, string>, headers: string[]): { hasErrors: boolean; errors: Record<string, string> } => {
  //   const errors: Record<string, string> = {};
  //   let hasErrors = false;

  //   // Find email and name columns
  //   const emailHeader = headers.find(h => h.toLowerCase().includes('email'));
  //   // const nameHeader = headers.find(h => h.toLowerCase().includes('name') && !h.toLowerCase().includes('email'));
  //   const identificationHeader = headers.find(h => h.toLowerCase().includes('identification'));

  //   if (emailHeader && !recipient[emailHeader]?.trim()) {
  //     errors[emailHeader] = 'Email address required';
  //     hasErrors = true;
  //   }

  //   if (emailHeader && recipient[emailHeader]?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient[emailHeader].trim())) {
  //     errors[emailHeader] = 'Invalid email format';
  //     hasErrors = true;
  //   }

  //   // Validate Identification field - only show error when user has started typing
  //   if (identificationHeader && recipient[identificationHeader]?.trim()) {
  //     const identificationValue = recipient[identificationHeader].trim().toLowerCase();
  //     // Supported authentication types (case-insensitive matching)
  //     const supportedTypes = [
  //       'phone',
  //       'sms',
  //       'access code',
  //       'accesscode',
  //       'docusign id verification',
  //       'docusignidverification',
  //       'docusign'
  //     ];

  //     // Normalize both the input and supported types for comparison
  //     const normalizedInput = identificationValue.replace(/\s+/g, ' ').trim();
  //     const isValidType = supportedTypes.some(type => {
  //       const normalizedType = type.toLowerCase().replace(/\s+/g, ' ').trim();
  //       return normalizedInput === normalizedType;
  //     });

  //     // Show error only if the value doesn't match any supported type
  //     if (!isValidType) {
  //       errors[identificationHeader] = 'Supported authentication types are phone, SMS, access code, or Docusign ID Verification';
  //       hasErrors = true;
  //     }
  //   }

  //   // Check for required fields
  //   headers.forEach(header => {
  //     if ((header.toLowerCase().includes('email') || header.toLowerCase().includes('name')) && !recipient[header]?.trim()) {
  //       if (!errors[header]) {
  //         errors[header] = 'Required field missing';
  //         hasErrors = true;
  //       }
  //     }
  //   });

  //   return { hasErrors, errors };
  // };

  // const getRecipientsWithErrors = () => {
  //   return csvRecipientsData.map((recipient, idx) => {
  //     const validation = validateRecipient(recipient, csvHeaders);
  //     return { ...recipient, index: idx, errors: validation.errors, hasErrors: validation.hasErrors };
  //   }).filter(r => r.hasErrors);
  // };

  // const updateRecipientField = (recipientIndex: number, field: string, value: string) => {
  //   setCsvRecipientsData(prev => prev.map((recipient, idx) =>
  //     idx === recipientIndex ? { ...recipient, [field]: value } : recipient
  //   ));
  // };



  // const handleSaveRecipients = () => {
  //   // Convert CSV recipients data to bulkRows format
  //   const emailHeader = csvHeaders.find(h => h.toLowerCase().includes('email'));
  //   const nameHeader = csvHeaders.find(h => h.toLowerCase().includes('name') && !h.toLowerCase().includes('email'));

  //   const cleaned = csvRecipientsData
  //     .map((recipient, idx) => ({
  //       id: `csv_row_${Date.now()}_${idx}`,
  //       name: nameHeader ? (recipient[nameHeader] || '').trim() : '',
  //       email: emailHeader ? (recipient[emailHeader] || '').trim() : ''
  //     }))
  //     .filter(r => r.name && r.email);

  //   if (cleaned.length === 0) {
  //     alert('No valid recipients found');
  //     return;
  //   }

  //   setBulkRows(cleaned);
  //   const roleToUse = (bulkSharedRole || 'signer') as Recipient['role'];
  //   setBulkList({ role: roleToUse, items: cleaned.map(r => ({ name: r.name, email: r.email })) });
  //   // Also set CSV recipient summary card
  //   setCsvRecipientList({
  //     fileName: csvFile?.name || 'bulk_recipients.csv',
  //     role: roleToUse,
  //     items: cleaned.map(r => ({ name: r.name, email: r.email }))
  //   });
  //   // Always reflect CSV filename into the batch name to mirror desired UI
  //   setBulkBatchName(csvFile?.name || 'Bulk Send List');
  //   hasAutoAddedRecipient.current = true;
  //   // Use CSV roles, clear any existing individual recipients to avoid duplicate first card
  //   setRecipients([]);
  //   setShowRecipients(true);
  //   setShowBulkModal(false);
  //   setShowRecipientsEditor(false);
  //   setCsvFile(null);
  // };

  // const clearCsvRecipientList = () => {
  //   setCsvRecipientList(null);
  //   setCsvAccessCode(undefined);
  //   setCsvPrivateMessage(undefined);
  //   setOpenCsvAccess(false);
  //   setOpenCsvPrivate(false);
  // };

  // const handleBackToUpload = () => {
  //   setShowRecipientsEditor(false);
  //   setShowCsvExceptions(true);
  // };

  // const handleDiscardCsv = () => {
  //   // Discard the CSV and go back to upload page
  //   setCsvFile(null);
  //   setBulkRows([
  //     { id: `row_${Date.now()}`, name: '', email: '' },
  //     { id: `row_${Date.now() + 1}`, name: '', email: '' },
  //     { id: `row_${Date.now() + 2}`, name: '', email: '' },
  //   ]);
  //   setShowCsvExceptions(false);
  //   setUnmatchedColumns([]);
  //   setCsvHeaders([]);
  //   if (csvFileInputRef.current) {
  //     csvFileInputRef.current.value = '';
  //   }
  // };

  // const clearBulkList = () => {
  //   // Clear manual bulk list
  //   setBulkList(null);
  //   // Clear CSV-derived list and related panels
  //   setCsvRecipientList(null);
  //   setCsvAccessCode(undefined);
  //   setCsvPrivateMessage(undefined);
  //   setOpenCsvAccess(false);
  //   setOpenCsvPrivate(false);
  //   // Reset CSV parsing state
  //   setCsvFile(null);
  //   setCsvHeaders([]);
  //   setCsvRecipientsData([]);
  //   setShowCsvExceptions(false);
  //   setUnmatchedColumns([]);
  //   // Reset inline bulk rows to initial empty rows
  //   setBulkRows([
  //     { id: `row_${Date.now()}`, name: '', email: '' },
  //     { id: `row_${Date.now() + 1}`, name: '', email: '' },
  //     { id: `row_${Date.now() + 2}`, name: '', email: '' },
  //   ]);
  // };
  // const [recipientSuggestions, setRecipientSuggestions] = useState<Array<{ name: string; email: string }>>([]);
  const [suggestionsOpenForId, setSuggestionsOpenForId] = useState<string | null>(null);
  // const [loadingRecipientSuggestions, setLoadingRecipientSuggestions] = useState(false);
  const suggestionsContainerRef = useRef<HTMLDivElement | null>(null);
  // Access code expanded panels per recipient
  // const [openAccessForId, setOpenAccessForId] = useState<Record<string, boolean>>({});
  // // Private message expanded panels per recipient
  // const [openPrivateForId, setOpenPrivateForId] = useState<Record<string, boolean>>({});

  // Envelope Type state
  const [envelopeTypes, setEnvelopeTypes] = useState<any[]>([]);
  const [selectedEnvelopeType, setSelectedEnvelopeType] = useState<string>('');

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
    const validDocs: Document[] = [];
    const invalidFiles: File[] = [];

    files.forEach((file) => {
      // Only accept PDF files
      if (file.type !== "application/pdf") {
        invalidFiles.push(file);
        return; // skip adding invalid file
      }

      const newDocument: Document = {
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
      // try {
      //   const validRecipients = (recipients || []).filter(r => (r?.name || '').trim() && (r?.email || '').trim());
      //   if (validRecipients.length > 0) {
      //     const recipientPayload = validRecipients.map(r => ({
      //       name: r.name,
      //       email: r.email,
      //       role: r.role,
      //       order: r.order,
      //       status: r.status,
      //       // authentication: r.authentication
      //     }));
      //     await eSignApi.post('/api/e-sign/add-recipients', {
      //       envelopeId: loopEnvelopeId,
      //       recipients: recipientPayload
      //     });
      //   }
      // } catch (err) {
      //   console.error('Failed to save recipients from Step 1:', err);
      // }
      await savePowerFormSlots(loopEnvelopeId);
      await getEnvelopeDetail(loopEnvelopeId);
      navigate(`/e-sign/powerforms?step=2&envelopeId=${loopEnvelopeId}`);
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
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const formId = e.target.value;
      setSelectedForm(formId);       // ✅ update selected
      getFormDetails(formId);        // ✅ fetch details
  };
  // Get Power Form Template
  const getPowerForm = async () => {
    try {
      const response = await templateServiceApi.get('/api/template/get-form');
      if (response.status === 200) {
        //setPowerFormTemplate(response.data.template);
        setMode('power');
        console.log('Power Forms:', response.data.form);
        setPowerForms(response.data.form);
      }
    } catch (error) {
      console.error('Error fetching power form template:', error);
    }
  };
  const getFormDetails = async (formId: string) => {
    const response = await templateServiceApi.get(`/api/template/get-form-details/${formId}`);
    if (response.status === 200) {
      console.log('Power Forms:', response.data);
      setPowerFormData(response.data);
    }
  }
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
        await navigate(`/e-sign/powerforms?step=${currentStep + 1}&envelopeId=${envelopeId}`);
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
        setRecipients(response.data.data.recipients);
        console.log('Fetched recipients:', response.data.data.recipients);
        // Prefill subject/message when returning to earlier steps
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
        await navigate(`/e-sign/powerforms?step=${currentStep + 1}&envelopeId=${response.data.envelopeId}`);
      }
    } catch (error) {
      console.error('Error updating signature type:', error);
    }
  };
  // Update your "Next" button handler:
  const handleNext = async () => {
    if (nextLoading) return;
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
          const savedId = await savePowerFormSlots(envelopeId);
          if (!savedId) {
            alert('Failed to save power form configuration. Try again.');
            setNextLoading(false);
            return;
          }
          // navigate to next step with returned envelope/template id
          navigate(`/e-sign/powerforms?step=${currentStep + 1}&envelopeId=${savedId}`);
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
        await navigate(`/e-sign/powerforms?step=${currentStep + 1}&envelopeId=${envelopeId}`);
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

  // const updateRecipient = (id: string, updates: Partial<Recipient>) => {
  //   setRecipients(prev => prev.map(recipient =>
  //     recipient.id === id ? { ...recipient, ...updates } : recipient
  //   ));
  // };
  // const handleEmailOnBlur = async (id: string, email: string) => {
  //   if (!email || !envelopeId) return;
  //   try {
  //     const response = await eSignApi.get(`/api/e-sign/get-recipient/${email}`);
  //     if (response.status == 200) {
  //       const { recipient } = response.data;
  //       updateRecipient(id, {
  //         name: recipient.name,
  //         email: recipient.email
  //       })
  //       console.log('Fetched and updated');
  //     }
  //   } catch (err) {
  //     console.log(`Handle email on Blur`);
  //   }
  // }

  // const removeRecipient = async (id: string) => {
  //   // Check if coming from db and delete from db too

  //   // Heuristic: If the ID is a MongoDB ObjectId (24 hex chars), treat it as DB record
  //   const isDbRecord = /^[a-fA-F0-9]{24}$/.test(id);

  //   if (isDbRecord) {
  //     try {
  //       await eSignApi.post(`/api/e-sign/envelope/remove-recipient/${id}/${envelopeId}`);// Adjust API path if needed
  //       console.log(`Recipient ${id} deleted from DB successfully.`);
  //     } catch (error) {
  //       console.error('Failed to delete recipient from DB:', error);
  //     }
  //   }
  //   setRecipients(prev => prev.filter(recipient => recipient.id !== id));
  // };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return documents?.length > 0 && selectedEnvelopeType !== '';
      case 2:
        if (mode === 'normal') {
          return recipients?.length > 0 && recipients.every(r => r.name && r.email);
        } else {
          // power mode'
          return true; // Fields are optional
        }
      case 3:
        return true; // Fields are optional
      case 4:
        return true; // Authentication is optional
      case 5:
        return envelopeData.subject.trim() !== '';
      default:
        return true;
    }
  };

  // const handleCreateEnvelope = () => {
  //   if (!user) return;
  //   navigate('/e-sign/dashboard');
  // };

  const handleSendEnvelope = async () => {
    if (!envelopeId) return;
    setSending(true);
    try {
      await eSignApi.post(`/api/e-sign/send-envelope/${envelopeId}`);
      alert('Envelope sent successfully!');
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
    getPowerForm();
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

  // Load unique recipient suggestions aggregated from user's envelopes
  // const loadRecipientSuggestions = async (forceReload = false) => {
  //   if (!forceReload && (recipientSuggestions.length > 0 || loadingRecipientSuggestions)) return;
  //   setLoadingRecipientSuggestions(true);
  //   const map = new Map<string, { name: string; email: string }>();
  //   const addIfValid = (r: any) => {
  //     const name = (r?.name || '').trim();
  //     const email = (r?.email || '').trim();
  //     if (!email) return;
  //     const key = email.toLowerCase();
  //     if (!map.has(key)) map.set(key, { name: name || email, email });
  //   };
  //   try {
  //     const response = await eSignApi.get('/api/e-sign/get-envelopes');
  //     const envelopes = response?.data?.data || response?.data?.envelopes || response?.data || [];
  //     if (Array.isArray(envelopes)) {
  //       envelopes.forEach((env: any) => {
  //         const recs = env?.recipients || env?.recipientIds || [];
  //         if (Array.isArray(recs)) recs.forEach(addIfValid);
  //       });
  //     }
  //     setRecipientSuggestions(Array.from(map.values()));
  //   } catch (err) {
  //     console.warn('Failed to load recipient suggestions; defaulting to empty list');
  //     setRecipientSuggestions([]);
  //   } finally {
  //     setLoadingRecipientSuggestions(false);
  //   }
  // };

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
        name: `Party ${letter}`,
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
        powerFormId: selectedForm || null,
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
              <h3 id='ToggleAddMessage' data-tour="ec-message-toggle" onClick={() => setShowPowerForm(prev => !prev)} className="text-lg text-gray-900 cursor-pointer flex items-center justify-between">
                <span>Add power form</span>
                {showPowerForm ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </h3>
            </div>
            {showPowerForm && (
               /* ======================== POWER FORM MODE ======================== */
              <Card className="p-6 shadow-sm border border-gray-200 rounded-2xl bg-white space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Build Power Form</h4>
                  <p className="text-sm text-gray-600">
                    Set up your reusable form and signer slots.
                  </p>
                </div>

                {/* Power Form Selector */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Select Power Form
                  </label>
                  <select
                    id="powerForm"
                    value={selectedForm}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Choose a Form --</option>
                    {powerForms.map((form) => (
                      <option key={form._id} value={form._id}>
                        {form.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Power Form Preview */}
                {powerFormData && (
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
                )}

                {/* Parties Configuration */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">
                      Number of Parties
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        className="px-2 py-1 border rounded hover:bg-gray-100"
                        onClick={() =>
                          syncPartiesToNumber(Math.max(1, numberOfParties - 1))
                        }
                        type="button"
                      >
                        <ArrowDown className="w-4 h-4" />
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
                        <ArrowUp className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 ml-2">
                      Min 1 — Max {maxParties}
                    </p>
                  </div>

                  {/* First Signing Party */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Which party signs first?
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
                      Choose which party you are
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
                  <select
                    id="envelopeType"
                    value={selectedEnvelopeType}
                    onChange={(e) => setSelectedEnvelopeType(e.target.value)}
                    required
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-sm"
                    data-tour="ec-envelope-type"
                  >
                    <option value="">Select Envelope Type</option>
                    {envelopeTypes.map((type) => (
                      <option key={type.title} value={type.title}>
                        {type.title}
                      </option>
                    ))}
                  </select>

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
                    Selected: {envelopeTypes.find((t) => t.title === selectedEnvelopeType)?.title}
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
            documents={documents}
            recipients={recipients}
            signatureFields={signatureFields}
            setSignatureFields={setSignatureFields}
            mode="power"
            powerFormData={powerFormData}
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
            powerFormData={powerFormData}
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
                <X className="w-5 h-5" />
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
                      onClick={() => { setHelpMenuOpen(false); window.open('https://support.docusign.com', '_blank'); }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-t border-gray-100"
                    >
                      <span className="text-blue-700">Visit the Docusign Support Center</span> for helpful articles, guides, videos, and more.
                    </button>
                    <div className="p-4 border-t border-gray-100">
                      <button
                        onClick={() => window.open('https://support.docusign.com/contactSupport', '_blank')}
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
          <div className="max-w-6xlVV mx-auto">
            {renderStepContent()}

            {/* Navigation (hidden on step 2; footer lives inside SigningEditorStep) */}
            {currentStep !== 2 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200" id='clearBoth'>
               <button
                 onClick={() => {
                   setCurrentStep(1);
                   if (envelopeId) {
                     navigate(`/e-sign/powerforms?step=1&envelopeId=${envelopeId}`);
                   } else {
                     navigate(`/e-sign/powerforms?step=1`);
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
                   disabled={!canProceedToNext() || nextLoading}
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
      creatorTargetRect && (
        <>
          {/* Highlight box with dimming via huge box-shadow */}
          <div
            className="fixed border-2 border-indigo-500 rounded-md shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] z-50 pointer-events-none"
            style={{
              left: `${creatorTargetRect.left}px`,
              top: `${creatorTargetRect.top}px`,
              width: `${creatorTargetRect.width}px`,
              height: `${creatorTargetRect.height}px`
            }}
          />
          {/* Tooltip */}
          <div
            className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-xl max-w-sm"
            style={{
              left: `${Math.min(Math.max(16, creatorTargetRect.left), window.innerWidth - 320)}px`,
              top: `${Math.min(creatorTargetRect.bottom + 12, window.innerHeight - 180)}px`
            }}
          >
            <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">
              {creatorTourSteps[creatorTourIndex]?.title}
            </div>
            <div className="px-4 py-3 text-sm text-gray-700">
              {creatorTourSteps[creatorTourIndex]?.content}
            </div>
            <div className="px-4 py-3 flex items-center justify-between gap-2 border-t border-gray-100">
              <div className="text-xs text-gray-500">Step {creatorTourIndex + 1} of {creatorTourSteps.length}</div>
              <div className="flex items-center gap-2">
                <button onClick={closeCreatorTour} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900">Skip</button>
                <button onClick={prevCreatorStep} disabled={creatorTourIndex===0} className={`px-3 py-1.5 border border-gray-300 rounded-sm text-sm ${creatorTourIndex===0 ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'}`}>Back</button>
                {creatorTourIndex < creatorTourSteps.length - 1 ? (
                  <button onClick={nextCreatorStep} className="px-3 py-1.5 bg-[#3E2B66] text-white rounded-sm text-sm">Next</button>
                ) : (
                  <button onClick={closeCreatorTour} className="px-3 py-1.5 bg-[#3E2B66] text-white rounded-sm text-sm">Done</button>
                )}
              </div>
            </div>
          </div>
        </>
      )
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
                  <button onClick={() => setShowAdvanced(false)} className="px-6 py-2 rounded text-white" style={{ backgroundColor: '#5015FF' }}>Save</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PowerFormCreate;