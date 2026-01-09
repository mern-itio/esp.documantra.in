import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MoreVertical, Download, ChevronLeft, ChevronRight, ChevronDown, Check, CheckCircle, Pencil, Trash2, Plus, ShieldCheck, X, Settings, Clock, Mail, Eye, MailOpen, EyeClosed, CircleCheckBig, Sparkles } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { eSignApi } from '../../services/apiHelper';
import Swal from 'sweetalert2';
import { useAuth } from '../../components/AuthService/AuthContext';

interface Agreement {
  id: string;
  name: string;
  status: 'completed' | 'in-progress' | 'draft' | 'deleted' | 'scheduled';
  lastChange: string;
  createdBy: string;
  recipientCount: number;
  completedCount: number;
  waitingFor?: string;
  primaryRecipientName?: string;
  isPowerForm?: boolean;
  direction?: string;
  isScheduled?: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
  isAIGenerated?: boolean;
  sender?: {
    name: string;
    email: string;
  };
}

interface EnvelopeData {
  id: string;
  name?: string;
  subject: string;
  status: string;
  priority?: string;
  createdAt: string;
  sentAt: string;
  isPowerForm?: boolean;
  direction?: string;
  signatureType?: string;
  isScheduled?: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
  isAIGenerated?: boolean;
  sender: {
    id?: string;
    name: string;
    email: string;
    role?: string;
    organization?: string;
    avatar?: string;
  };
  recipients: Array<{
    id: string;
    name: string;
    email: string;
    role?: string;
    order?: number;
    status: string;
    authentication?: string;
  }>;
  documents?: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
  }>;
  completionCertificate?: any;
}

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
  render: (agreement: Agreement, envelopeData?: EnvelopeData) => React.ReactNode;
}

// Component for Scheduled status with tooltip that escapes overflow
const ScheduledStatusWithTooltip: React.FC<{ scheduledDate?: string; scheduledTime?: string }> = ({ scheduledDate, scheduledTime }) => {
  const [showTooltip, setShowTooltip] = React.useState(false);
  const [tooltipPosition, setTooltipPosition] = React.useState({ left: 0, top: 0 });
  const statusRef = React.useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (statusRef.current) {
      const rect = statusRef.current.getBoundingClientRect();
      setTooltipPosition({
        left: rect.left + rect.width / 2,
        top: rect.bottom + 8
      });
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  if (!scheduledDate) return null;

  try {
    const scheduledDateObj = new Date(scheduledDate);
    if (isNaN(scheduledDateObj.getTime())) {
      return null;
    }
    const formattedDate = scheduledDateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Use scheduledTime if available, otherwise convert from scheduledDate
    let formattedTime: string;
    if (scheduledTime) {
      // Parse the scheduledTime (format: "HH:mm" or "HH:MM")
      const [hours, minutes] = scheduledTime.split(':');
      const hour24 = parseInt(hours, 10);
      const minute = parseInt(minutes, 10);

      if (!isNaN(hour24) && !isNaN(minute)) {
        // Format as 12-hour time
        const hour12 = hour24 % 12 || 12;
        const ampm = hour24 >= 12 ? 'PM' : 'AM';
        formattedTime = `${hour12.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${ampm}`;
      } else {
        // Fallback to date conversion if parsing fails
        formattedTime = scheduledDateObj.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }
    } else {
      formattedTime = scheduledDateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }

    return (
      <>
        <div
          ref={statusRef}
          className="relative inline-flex items-center gap-2 text-blue-600"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600 transition-transform duration-200" />
            <span className="text-sm font-medium">Scheduled</span>
          </div>
        </div>
        {showTooltip && (
          <div
            className="fixed min-w-[280px] max-w-[320px] bg-[#1A1333] text-white text-sm rounded-md p-3 shadow-lg z-[9999] pointer-events-none whitespace-normal"
            style={{
              left: `${tooltipPosition.left}px`,
              top: `${tooltipPosition.top}px`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="mb-2 font-semibold text-base">Scheduled Delivery</div>
            <div className="text-xs text-gray-300 mb-1">Date: {formattedDate}</div>
            <div className="text-xs text-gray-300">Time: {formattedTime}</div>
            <div className="absolute top-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1A1333] rotate-45" />
          </div>
        )}
      </>
    );
  } catch (error) {
    return null;
  }
};

const AgreementPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user,accountType } = useAuth();
  console.log(accountType);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [filteredAgreements, setFilteredAgreements] = useState<Agreement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState<string>('1');
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [openHeaderMenu, setOpenHeaderMenu] = useState<null | 'date' | 'status' | 'sender' | 'quick' | 'advanced' | 'shared'>(null);
  const [headerMenuPosition, setHeaderMenuPosition] = useState<{ top: number; left: number } | null>(null);
  // header selections
  const dateOptions = ['All time', 'Last 12 months', 'Last 6 months', 'Last 30 days', 'Last week', 'Last 24 hours', 'Custom'];
  const statusOptions = ['All', 'In progress', 'Completed', 'Draft', 'Deleted'];
  const [selectedDateIdx, setSelectedDateIdx] = useState<number>(2);
  const [selectedStatusIdx, setSelectedStatusIdx] = useState<number>(0);
  const [selectedShared, setSelectedShared] = useState<'user' | 'viewAll' | 'selectUser'>('user');
  const [customDateFrom, setCustomDateFrom] = useState<string>('');
  const [customDateTo, setCustomDateTo] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const menuRef = useRef<HTMLDivElement | null>(null);
  const dateButtonRef = useRef<HTMLButtonElement | null>(null);
  const statusButtonRef = useRef<HTMLButtonElement | null>(null);
  const itemsPerPage = 10;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkMenu, setShowBulkMenu] = useState<boolean>(false);
  const [bulkResending, setBulkResending] = useState<boolean>(false);
  const [rowResendLoadingId, setRowResendLoadingId] = useState<string | null>(null);
  // Column customization state
  const [envelopesData, setEnvelopesData] = useState<EnvelopeData[]>([]);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState<boolean>(false);
  // Column resizing state
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('agreement-table-column-widths');
    return saved ? JSON.parse(saved) : {};
  });
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const resizeStartXRef = useRef<number>(0);
  const resizeStartWidthRef = useRef<number>(0);
  const resizingColumnRef = useRef<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  // Guided tour state
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [tourStepIndex, setTourStepIndex] = useState<number>(0);
  const tourSteps = [
    {
      id: 'search',
      selector: '[data-tour="search-input"]',
      title: 'Search',
      content: 'Quickly find envelopes by name or creator.'
    },

    {
      id: 'customize-columns',
      selector: '[data-tour="customize-columns"]',
      title: 'Customize Columns',
      content: 'Click the settings icon to customize which columns are visible in the table. You can show or hide columns and select up to 3 columns to display at once.'
    },
    {
      id: 'table',
      selector: '[data-tour="agreements-table"]',
      title: 'Agreements List',
      content: 'View status, last change, and actions for each envelope.'
    },
    {
      id: 'row-actions',
      selector: '[data-tour="row-actions"]',
      title: 'Row Actions',
      content: 'Resend, Continue, Download, Restore, and more options.'
    },
    {
      id: 'pagination',
      selector: '[data-tour="pagination-nav"]',
      title: 'Pagination',
      content: 'Navigate through pages of results.'
    }
  ] as const;

  const currentStep = tourSteps[tourStepIndex];
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isTourOpen) return;
    const step = tourSteps[tourStepIndex];
    const el = document.querySelector(step?.selector || '') as HTMLElement | null;
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      const refineTimeout = setTimeout(() => {
        const updatedRect = el.getBoundingClientRect();
        setTargetRect(updatedRect);
      }, 300);
      return () => clearTimeout(refineTimeout);
    } else {
      setTargetRect(null);
      const skipTimeout = setTimeout(() => {
        if (tourStepIndex < tourSteps.length - 1) {
          setTourStepIndex(tourStepIndex + 1);
        } else {
          closeTour();
        }
      }, 100);
      return () => clearTimeout(skipTimeout);
    }
  }, [isTourOpen, tourStepIndex, tourSteps]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (tooltipPosition) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;


        const tooltipWidth = 384;
        const tooltipHeight = 200;
        const padding = 16;

        const constrainedX = Math.max(padding, Math.min(newX, window.innerWidth - tooltipWidth - padding));
        const constrainedY = Math.max(padding, Math.min(newY, window.innerHeight - tooltipHeight - padding));

        setTooltipPosition({ x: constrainedX, y: constrainedY });
      }
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
  }, [isDragging, dragOffset, tooltipPosition]);

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!tooltipRef.current) return;

    const rect = tooltipRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);

    if (!tooltipPosition) {
      setTooltipPosition({ x: rect.left, y: rect.top });
    }
  };

  // Check if user has completed the agreement page tour
  const hasCompletedAgreementTour = () => {
    try {
      const completed = localStorage.getItem('agreementTourCompleted');
      return completed === 'true';
    } catch {
      return false;
    }
  };

  // Mark tour as completed
  const markAgreementTourAsCompleted = () => {
    try {
      localStorage.setItem('agreementTourCompleted', 'true');
    } catch (error) {
      console.error('Error saving agreement tour completion:', error);
    }
  };

  const closeTour = () => {
    // Mark tour as completed when user closes it
    markAgreementTourAsCompleted();
    setIsTourOpen(false);
    setTourStepIndex(0);
    setTargetRect(null);
    setTooltipPosition(null);
    setIsDragging(false);
  };
  const nextStep = () => {
    setTourStepIndex((i) => Math.min(i + 1, tourSteps.length - 1));
    setTooltipPosition(null);
  };
  const prevStep = () => {
    setTourStepIndex((i) => Math.max(i - 1, 0));
    setTooltipPosition(null);
  };

  const tourStartedRef = useRef<boolean>(false);
  useEffect(() => {
    if (!loading && !tourStartedRef.current) {
      tourStartedRef.current = true;

      // Check if user is new or hasn't completed the tour
      const isNewUser = user?.isFirstLogin === true;
      const hasCompleted = hasCompletedAgreementTour();

      if (isNewUser && !hasCompleted) {
        setIsTourOpen(true);
        setTourStepIndex(0);
      }
    }
  }, [loading, user]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const isScheduled = searchParams.get('scheduled') === 'true';
    const envelopeId = searchParams.get('envelopeId');

    if (isScheduled && envelopeId) {
      eSignApi.get(`/api/e-sign/envelope/${envelopeId}`)
        .then((response) => {
          if (response.data && response.data.data) {
            const envelope = response.data.data;
            const scheduledDate = envelope.scheduledDate;
            if (scheduledDate) {
              const scheduledDateTime = new Date(scheduledDate).toLocaleString();
              Swal.fire({
                title: "Envelope Scheduled!",
                text: `Your envelope has been scheduled to send on ${scheduledDateTime}`,
                icon: "success",
                confirmButtonText: "OK",
                confirmButtonColor: "#4D0080",
              });
            } else {
              Swal.fire({
                title: "Envelope Scheduled!",
                text: "Your envelope has been scheduled successfully.",
                icon: "success",
                confirmButtonText: "OK",
                confirmButtonColor: "#4D0080",
              });
            }
          }
        })
        .catch((error) => {
          console.error('Error fetching envelope details:', error);
          Swal.fire({
            title: "Envelope Scheduled!",
            text: "Your envelope has been scheduled successfully.",
            icon: "success",
            confirmButtonText: "OK",
            confirmButtonColor: "#4D0080",
          });
        });

      navigate(location.pathname, { replace: true });
    }
  }, [location.search, navigate]);

  const isPowerFormRoute = () => {
    const path = location.pathname;
    return path.includes('/powerform') || path.includes('/power-form');
  };

  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('/shared-with-me')) return 'shared-with-me';
    if (path.includes('/completed')) return 'completed';
    if (path.includes('/draft')) return 'draft';
    if (path.includes('/in-progress')) return 'in-progress';
    if (path.includes('/deleted')) return 'deleted';
    if (path.includes('/all')) return 'all';
    return 'all';
  };

  const currentTab = getCurrentTab();
  const isPowerForm = isPowerFormRoute();

  const isAISentEnvelope = (agreement: Agreement, envelopeData?: EnvelopeData): boolean => {

    return envelopeData?.isAIGenerated === true || agreement.isAIGenerated === true;
  };

  const columnRenderers = {
    name: (agreement: Agreement, envelopeData?: EnvelopeData) => {
      const isAISent = isAISentEnvelope(agreement, envelopeData);
      return (
        <div className="flex items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/e-sign/envelope/${agreement.id}`)}
                className="text-left text-sm font-semibold text-[#3E2B66] hover:text-[#260559] hover:underline transition-colors duration-200"
                title="View envelope details"
              >
                {agreement.name}
              </button>

              {isAISent && (
                <span
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                  style={{ backgroundColor: '#F3E8FF', color: '#4D0080' }}
                >
                  <Sparkles className="w-3 h-3" />
                  AI
                </span>
              )}
            </div>
            {!agreement.isPowerForm && (
              <>
                <div className="text-xs text-gray-500 mt-0.5">
                  To: {agreement.primaryRecipientName || '-'}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  By: {agreement?.sender?.name || '-'}
                </div>
              </>
            )}
          </div>
        </div>
      );
    },
    status: (agreement: Agreement) => (
      agreement.status === 'in-progress' ? (
        <div className="relative group/status">
          <div>
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#3E2B66]/20 to-[#3E2B66]/40 rounded-full progress-bar-animate"></div>
              <span className="absolute left-0 w-2 h-2 bg-[#3E2B66] rounded-full shadow-sm"></span>
              <span className="absolute right-0 w-2 h-2 bg-[#3E2B66] rounded-full shadow-sm"></span>
            </div>
            <div className="mt-2 text-sm font-medium text-[#3E2B66] underline decoration-dotted hover:decoration-solid transition-all cursor-pointer">
              {`Waiting for ${agreement.waitingFor || 'recipient'}`}
            </div>
            {!agreement.isPowerForm && agreement.direction && (
              <div className="text-xs text-gray-500 mt-0.5">
                {agreement.direction === "sent_and_received" ? 'Sent and Received' : agreement.direction}
              </div>
            )}
          </div>
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover/status:opacity-100 transition-opacity duration-200 pointer-events-none">
            <Clock className="w-5 h-5 text-[#3E2B66] animate-spin" style={{ animationDuration: '2s' }} />
          </div>
        </div>
      ) : (
        <>
          {agreement.status === 'completed' && (
            <div className="flex items-center gap-2 text-green-600 group/status">
              <CheckCircle className="w-5 h-5 text-green-600 group-hover/status:scale-110 transition-transform duration-200" />
              <span className="text-sm font-medium">Completed</span>
            </div>
          )}
          {agreement.isScheduled && agreement.status === 'draft' && (
            <ScheduledStatusWithTooltip scheduledDate={agreement.scheduledDate} scheduledTime={agreement.scheduledTime} />
          )}
          {agreement.status === 'draft' && !agreement.isPowerForm && !agreement.isScheduled && (
            <div className="flex items-center gap-2 text-[#3E2B66] group/status">
              <Pencil className="w-5 h-5 text-[#3E2B66] group-hover/status:rotate-12 transition-transform duration-200" />
              <span className="text-sm font-medium">Draft</span>
            </div>
          )}
          {agreement.isPowerForm && (
            <div className="flex items-center gap-2 text-amber-600">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm">Power Form</span>
            </div>
          )}
          {agreement.status === 'deleted' && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Deleted
            </span>
          )}
        </>
      )
    ),
    lastChange: (agreement: Agreement) => (
      <span className="text-sm text-gray-900">{formatDate(agreement.lastChange)}</span>
    ),
    recipient: (_agreement: Agreement, envelopeData?: EnvelopeData) => {
      const recipient = envelopeData?.recipients?.[0];
      return <span className="text-sm text-gray-900">{recipient?.name || recipient?.email || '-'}</span>;
    },
    sender: (_agreement: Agreement, envelopeData?: EnvelopeData) => (
      <span className="text-sm text-gray-900">{envelopeData?.sender?.name || '-'}</span>
    ),
    priority: (_agreement: Agreement, envelopeData?: EnvelopeData) => (
      <span className="text-sm text-gray-900 capitalize">{envelopeData?.priority || 'normal'}</span>
    ),
    createdAt: (_agreement: Agreement, envelopeData?: EnvelopeData) => (
      <span className="text-sm text-gray-900">{envelopeData ? formatDate(envelopeData.createdAt) : '-'}</span>
    ),
    sentAt: (_agreement: Agreement, envelopeData?: EnvelopeData) => (
      <span className="text-sm text-gray-900">{envelopeData?.sentAt ? formatDate(envelopeData.sentAt) : '-'}</span>
    ),
    signatureType: (_agreement: Agreement, envelopeData?: EnvelopeData) => (
      <span className="text-sm text-gray-900 capitalize">{envelopeData?.signatureType || '-'}</span>
    ),
    recipientCount: (agreement: Agreement) => (
      <span className="text-sm text-gray-900">{agreement.recipientCount}</span>
    ),
  };

  const getInitialColumnConfig = (): ColumnConfig[] => [
    { id: 'name', label: 'Name', visible: true, order: 1, render: columnRenderers.name },
    { id: 'status', label: 'Status', visible: true, order: 2, render: columnRenderers.status },
    { id: 'lastChange', label: 'Last Change', visible: true, order: 3, render: columnRenderers.lastChange },
    { id: 'recipient', label: 'Recipient', visible: false, order: 4, render: columnRenderers.recipient },
    { id: 'sender', label: 'Sender', visible: false, order: 5, render: columnRenderers.sender },
    { id: 'priority', label: 'Priority', visible: false, order: 6, render: columnRenderers.priority },
    { id: 'createdAt', label: 'Created At', visible: false, order: 7, render: columnRenderers.createdAt },
    { id: 'sentAt', label: 'Sent At', visible: false, order: 8, render: columnRenderers.sentAt },
    { id: 'signatureType', label: 'Signature Type', visible: false, order: 9, render: columnRenderers.signatureType },
    { id: 'recipientCount', label: 'Recipient Count', visible: false, order: 10, render: columnRenderers.recipientCount },
  ];

  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(getInitialColumnConfig());

  const fetchEnvelopes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await eSignApi.get('/api/e-sign/get-envelopes');

      if (response.data && response.data.status === 'success') {
        const envelopes: EnvelopeData[] = response.data.data;

        setEnvelopesData(envelopes);

        const allEnvelopes = envelopes.map(envelope => ({
          id: envelope.id,
          name: envelope.name || envelope.subject || 'Untitled Agreement',
          status: envelope.status as 'completed' | 'in-progress' | 'draft' | 'deleted',
          lastChange: envelope.sentAt || envelope.createdAt,
          createdBy: envelope.sender?.name || 'Unknown',
          recipientCount: envelope.recipients?.length || 0,
          isPowerForm: envelope.isPowerForm,
          sender: envelope.sender,
          direction: envelope.direction,
          isScheduled: envelope.isScheduled || false,
          scheduledDate: envelope.scheduledDate,
          scheduledTime: envelope.scheduledTime,
          isAIGenerated: envelope.isAIGenerated || false,
          completedCount: envelope.recipients?.filter(recipient =>
            recipient.status === 'completed' || recipient.status === 'signed'
          ).length || 0,
          waitingFor: (() => {
            const firstWaiting = (envelope.recipients || []).find(r => {
              const s = (r.status || '').toLowerCase();
              return s === 'waiting' || s === 'pending' || s === 'needs to sign';
            });
            if (firstWaiting) return firstWaiting.name || firstWaiting.email;
            if (((envelope.status || '').toLowerCase()) === 'in-progress') {
              const first = (envelope.recipients || [])[0];
              return first?.name || first?.email;
            }
            return undefined;
          })(),
          primaryRecipientName: (() => {
            const first = (envelope.recipients || [])[0];
            return first?.name || first?.email || undefined;
          })()
        }));

        setAgreements(allEnvelopes);
      } else {
        console.error('Failed to fetch envelopes:', response.data?.message);
        setAgreements([]);
      }
    } catch (error) {
      console.error('Error fetching envelopes:', error);
      setAgreements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnvelopes();
  }, [fetchEnvelopes,accountType]);

  useEffect(() => {
    const handleEnvelopesUpdated = (event?: Event) => {
      console.log('🔄 Envelopes updated event received, refreshing list...', event);
      setTimeout(() => {
        fetchEnvelopes();
      }, 500);
    };

    window.addEventListener('envelopes:updated', handleEnvelopesUpdated);

    window.addEventListener('ai-assistant:document-sent', handleEnvelopesUpdated);

    const handleAIAction = (event: Event) => {
      const customEvent = event as CustomEvent;
      const action = customEvent.detail?.action;
      if (action === 'create_and_send_envelope' ||
        action === 'generate_document' ||
        action === 'send_document') {
        console.log('🔄 AI assistant action detected, refreshing envelopes...', action);
        handleEnvelopesUpdated();
      }
    };
    window.addEventListener('ai-assistant:action-completed', handleAIAction);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Page visible, refreshing envelopes...');
        fetchEnvelopes();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('envelopes:updated', handleEnvelopesUpdated);
      window.removeEventListener('ai-assistant:document-sent', handleEnvelopesUpdated);
      window.removeEventListener('ai-assistant:action-completed', handleAIAction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchEnvelopes]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sent = params.get('sent');

    if (sent === 'true') {
      navigate(location.pathname, { replace: true });

      setTimeout(() => {
        Swal.fire({
          title: "Envelope Sent!",
          text: "Envelope Sent Successfully",
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#ffc107",
        });
      }, 300);
    }
  }, [location.search, navigate, location.pathname]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('userData');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.fullname) {
          setCurrentUserName(parsed.fullname as string);
        } else if (parsed?.email) {
          setCurrentUserName(parsed.email as string);
        }
      }
    } catch (_) {

    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isClickOnDateButton = dateButtonRef.current && dateButtonRef.current.contains(target);
      const isClickOnStatusButton = statusButtonRef.current && statusButtonRef.current.contains(target);

      if (isClickOnDateButton || isClickOnStatusButton) {
        return;
      }

      if (menuRef.current && !menuRef.current.contains(target)) {
        setOpenMenuId(null);
        setMenuPosition(null);
        setOpenHeaderMenu(null);
        setHeaderMenuPosition(null);
      }
    }
    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenMenuId(null);
        setMenuPosition(null);
        setOpenHeaderMenu(null);
        setHeaderMenuPosition(null);
      }
    }
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  useEffect(() => {
    let filtered = agreements;
    if (isPowerForm) {
      filtered = filtered.filter(agreement => agreement.isPowerForm === true);
    } else {
    }

    if (currentTab === 'all') {
      filtered = filtered.filter(agreement => agreement.status !== 'deleted');
    } else if (currentTab === 'completed') {
      filtered = filtered.filter(agreement => agreement.status === 'completed');
    } else if (currentTab === 'draft') {
      filtered = filtered.filter(agreement => agreement.status === 'draft');
    } else if (currentTab === 'in-progress') {
      filtered = filtered.filter(agreement => agreement.status === 'in-progress');
    } else if (currentTab === 'deleted') {
      filtered = filtered.filter(agreement => agreement.status === 'deleted');
    } else if (currentTab === 'shared-with-me') {
      filtered = filtered.filter(agreement => agreement.direction != 'Sent');
    }

    if (searchTerm) {
      filtered = filtered.filter(agreement =>
        agreement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agreement.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatusIdx !== 0) {
      const statusMap: { [key: number]: Agreement['status'] } = {
        1: 'in-progress',
        2: 'completed',
        3: 'draft',
        4: 'deleted',
      };
      const targetStatus = statusMap[selectedStatusIdx];
      if (targetStatus) {
        filtered = filtered.filter(a => a.status === targetStatus);
      }
    }

    const { from, to } = getSelectedDateRange();
    if (from || to) {
      filtered = filtered.filter(a => {
        const d = new Date(a.lastChange);
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }

    setFilteredAgreements(filtered);
    setCurrentPage(1);
  }, [agreements, searchTerm, currentTab, selectedStatusIdx, selectedDateIdx, customDateFrom, customDateTo, isPowerForm]);

  const totalPages = Math.ceil(filteredAgreements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAgreements = filteredAgreements.slice(startIndex, endIndex);


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSelectedDateRange = (): { from?: Date; to?: Date } => {
    const now = new Date();
    switch (dateOptions[selectedDateIdx]) {
      case 'All time':
        return {};
      case 'Last 12 months': {
        const from = new Date(now);
        from.setMonth(from.getMonth() - 12);
        return { from, to: now };
      }
      case 'Last 6 months': {
        const from = new Date(now);
        from.setMonth(from.getMonth() - 6);
        return { from, to: now };
      }
      case 'Last 30 days': {
        const from = new Date(now);
        from.setDate(from.getDate() - 30);
        return { from, to: now };
      }
      case 'Last week': {
        const from = new Date(now);
        from.setDate(from.getDate() - 7);
        return { from, to: now };
      }
      case 'Last 24 hours': {
        const from = new Date(now);
        from.setHours(from.getHours() - 24);
        return { from, to: now };
      }
      case 'Custom': {
        if (!customDateFrom && !customDateTo) return {};
        const from = customDateFrom ? new Date(customDateFrom + 'T00:00:00') : undefined;
        const to = customDateTo ? new Date(customDateTo + 'T23:59:59.999') : undefined;
        return { from, to };
      }
      default:
        return {};
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setPageInput(page.toString());
  };

  const handlePageJump = () => {
    const pageNum = parseInt(pageInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      handlePageChange(pageNum);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePageJump();
    }
  };

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const getPaginationPages = (): (number | string)[] => {
    if (totalPages <= 4) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    return [1, 2, '...', totalPages - 1, totalPages];
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDateIdx(2);
    setCustomDateFrom('');
    setCustomDateTo('');
    setSelectedStatusIdx(0);
    setCurrentPage(1);
    setOpenHeaderMenu(null);
    setHeaderMenuPosition(null);
  };

  const isSelected = (id: string) => selectedIds.has(id);
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkResend = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      setBulkResending(true);
      for (const id of ids) {
        const ag = agreements.find(a => a.id === id);
        const status = (ag?.status || '').toLowerCase();
        if (status === 'draft') {
          await eSignApi.post(`/api/e-sign/send-envelope/${id}`);
        } else if (status === 'in-progress') {
          await eSignApi.post(`/api/e-sign/envelope/reminder/${id}`);
        }
      }
      Swal.fire({
        title: 'Success!',
        text: 'Email(s) queued successfully',
        icon: 'success',
        confirmButtonText: 'OK'
      });
    } catch (e) {
      Swal.fire({
        title: 'Error',
        text: 'Failed to trigger resend for some items',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally { setBulkResending(false); }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete ${ids.length} envelope(s)?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete them!',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;
    for (const id of ids) {
      try { await eSignApi.post(`/api/e-sign/envelope/delete/${id}`); } catch (_) { }
    }
    await fetchEnvelopes();
    clearSelection();
  };

  const handleRowResend = async (agreement: Agreement) => {
    try {
      setRowResendLoadingId(agreement.id);
      const s = (agreement.status || '').toLowerCase();
      if (s === 'draft') {
        await eSignApi.post(`/api/e-sign/send-envelope/${agreement.id}`);
      } else if (s === 'in-progress') {
        await eSignApi.post(`/api/e-sign/envelope/reminder/${agreement.id}`);
      }
      Swal.fire({
        title: 'Success!',
        text: 'Email queued successfully',
        icon: 'success',
        confirmButtonText: 'OK'
      });
    } catch (e) {
      Swal.fire({
        title: 'Error',
        text: 'Failed to trigger email',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setRowResendLoadingId(null);
    }
  };

  const handleContinue = (id: string) => {
    navigate(`/e-sign/edit/${id}`);
  };
  const handleView = (id: string) => {
    navigate(`/e-sign/signer-cycles/${id}`);
  };

  const handleRestore = async (id: string) => {
    try {
      await eSignApi.post('/api/e-sign/update-envelope', {
        envelopeId: id,
        envelopeData: { status: 'draft' }
      });
      await fetchEnvelopes();
      Swal.fire({
        title: 'Success!',
        text: 'Envelope restored to Draft',
        icon: 'success',
        confirmButtonText: 'OK'
      });
    } catch (e) {
      Swal.fire({
        title: 'Error',
        text: 'Failed to restore',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const getVisibleColumns = (): ColumnConfig[] => {
    return columnConfig
      .filter(col => col.visible)
      .sort((a, b) => a.order - b.order)
      .slice(0, 3);
  };

  const toggleColumn = (columnId: string) => {
    setColumnConfig(prev => {
      const updated = prev.map(col => {
        if (col.id === columnId) {
          const newVisible = !col.visible;
          if (newVisible) {
            const visibleCount = prev.filter(c => c.visible).length;
            if (visibleCount >= 3) {
              return col;
            }
          }
          return { ...col, visible: newVisible };
        }
        return col;
      });
      return updated;
    });
  };

  const resetColumns = () => {
    setColumnConfig(getInitialColumnConfig());
  };

  const handleResizeStart = (e: React.MouseEvent, columnId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnId);
    resizingColumnRef.current = columnId;
    resizeStartXRef.current = e.clientX;

    const currentWidth = columnWidths[columnId] ||
      (() => {
        const th = (e.target as HTMLElement).closest('th');
        return th ? th.offsetWidth : 150;
      })();
    resizeStartWidthRef.current = currentWidth;
  };

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizingColumnRef.current) return;

    const diff = e.clientX - resizeStartXRef.current;
    const newWidth = Math.max(50, resizeStartWidthRef.current + diff); // Minimum width of 50px

    setColumnWidths(prev => {
      const updated = { ...prev, [resizingColumnRef.current!]: newWidth };
      localStorage.setItem('agreement-table-column-widths', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleResizeEnd = useCallback(() => {
    setResizingColumn(null);
    resizingColumnRef.current = null;
    resizeStartXRef.current = 0;
    resizeStartWidthRef.current = 0;
  }, []);

  useEffect(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [resizingColumn, handleResizeMove, handleResizeEnd]);

  const getColumnWidth = (columnId: string): number | undefined => {
    return columnWidths[columnId];
  };

  const getEnvelopeData = (agreementId: string): EnvelopeData | undefined => {
    return envelopesData.find(e => e.id === agreementId);
  };

  const handlePermanentDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Permanently Delete?',
      text: 'This action cannot be undone! The envelope will be permanently deleted from the system.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete permanently!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const response = await eSignApi.post(`/api/e-sign/envelope/permanent-delete/${id}`);
        if (response.status === 200) {
          Swal.fire({
            title: 'Deleted!',
            text: 'Envelope has been permanently deleted.',
            icon: 'success',
            confirmButtonText: 'OK'
          });
          await fetchEnvelopes();
        }
      } catch (error) {
        console.error('Error permanently deleting envelope:', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to permanently delete envelope. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    }
  };

  const openHeaderDropdown = (type: 'date' | 'status' | 'sender' | 'quick' | 'advanced' | 'shared', e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (openHeaderMenu === type) {
      setOpenHeaderMenu(null);
      setHeaderMenuPosition(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const width = type === 'shared' ? 336 : 360;
      const left = Math.min(window.innerWidth - width - 8, Math.max(8, rect.left + window.scrollX));
      const top = rect.bottom + window.scrollY + 8;
      setHeaderMenuPosition({ top, left });
      setOpenHeaderMenu(type);
    }
  };


  const closeHeaderMenu = () => {
    setOpenHeaderMenu(null);
    setHeaderMenuPosition(null);
  };

  const handleExportCSV = () => {
    try {
      // Prepare CSV data
      const csvData = filteredAgreements.map(agreement => ({
        Name: agreement.name,
        Status: agreement.status,
        'Last Change': formatDate(agreement.lastChange),
        'Created By': agreement.createdBy,
        'Recipients': agreement.recipientCount,
        'Completed': agreement.completedCount
      }));

      // Convert to CSV string
      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row =>
          headers.map(header => {
            const value = row[header as keyof typeof row];
            // Escape commas and quotes in CSV
            return typeof value === 'string' && (value.includes(',') || value.includes('"'))
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `agreements_${currentTab}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(`Exported ${csvData.length} agreements to CSV`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to export CSV. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  // Button labels reflecting current selections
  const getDateButtonLabel = () => {
    const label = dateOptions[selectedDateIdx];
    if (label === 'Custom') {
      if (customDateFrom && customDateTo) return `${new Date(customDateFrom).toLocaleDateString()} - ${new Date(customDateTo).toLocaleDateString()}`;
      if (customDateFrom) return `${new Date(customDateFrom).toLocaleDateString()} - …`;
      if (customDateTo) return `… - ${new Date(customDateTo).toLocaleDateString()}`;
      return 'Custom';
    }
    return label;
  };
  const { pathname } = useLocation();
  const isTrashPage = pathname.includes('deleted');
  const getStatusButtonLabel = () => {
    const label = statusOptions[selectedStatusIdx];
    return label === 'All' ? 'Status' : label;
  };

  const handlePrint = () => {
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        Swal.fire({
          title: 'Popup Blocked',
          text: 'Please allow popups to print the agreements list.',
          icon: 'warning',
          confirmButtonText: 'OK'
        });
        return;
      }

      // Get current tab name for the title
      const tabName = currentTab === 'all' ? 'All' :
        currentTab === 'completed' ? 'Completed' :
          currentTab === 'draft' ? 'Drafts' :
            currentTab === 'in-progress' ? 'In-progress' :
              currentTab === 'deleted' ? 'Deleted' : 'Agreements';

      // Create print content
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${tabName} Agreements - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .status-completed { color: #28a745; font-weight: bold; }
            .status-in-progress { color: #ffc107; font-weight: bold; }
            .status-draft { color: #6c757d; font-weight: bold; }
            .status-deleted { color: #dc3545; font-weight: bold; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>${tabName} Agreements</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Total Records: ${filteredAgreements.length}</p>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Last Change</th>
                <th>Created By</th>
                <th>Recipients</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              ${filteredAgreements.map(agreement => `
                <tr>
                  <td>${agreement.name}</td>
                  <td class="status-${agreement.status}">${agreement.status.charAt(0).toUpperCase() + agreement.status.slice(1)}</td>
                  <td>${formatDate(agreement.lastChange)}</td>
                  <td>${agreement.createdBy}</td>
                  <td>${agreement.recipientCount}</td>
                  <td>${agreement.completedCount}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();

      // Wait for content to load, then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);

      console.log(`Printed ${filteredAgreements.length} agreements`);
    } catch (error) {
      console.error('Error printing:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to print. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleManageAction = async (action: string, agreementId: string) => {
    try {
      switch (action) {
        case 'view':
          // Navigate to envelope details
          window.open(`/e-sign/envelope/${agreementId}`, '_blank');
          break;
        case 'download':
          // Implement download functionality
          try {
            console.log('Downloading envelope:', agreementId);

            // Use the download-all endpoint to get all signed documents as a zip
            const response = await eSignApi.get(
              `/api/e-sign/signatures/download-all/${agreementId}`,
              { responseType: 'blob' }
            );

            if (response.status === 200 && response.data) {
              // response.data is already a Blob when responseType is 'blob'
              const blob = response.data instanceof Blob
                ? response.data
                : new Blob([response.data], { type: 'application/zip' });

              const url = window.URL.createObjectURL(blob);

              // Create a temporary anchor element and trigger download
              const link = document.createElement('a');
              link.href = url;
              link.download = `signed_documents_${agreementId}.zip`;
              document.body.appendChild(link);
              link.click();

              // Clean up
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
            } else {
              Swal.fire({
                title: 'No Documents',
                text: 'No signed documents found for this agreement.',
                icon: 'info',
                confirmButtonText: 'OK'
              });
            }
          } catch (error: any) {
            console.error('Error downloading envelope:', error);
            // Try to extract error message from blob response if available
            let errorMessage = 'Failed to download documents. Please try again.';
            if (error.response?.data instanceof Blob) {
              // If error response is a blob, try to read it as text
              try {
                const text = await error.response.data.text();
                const parsed = JSON.parse(text);
                errorMessage = parsed.message || errorMessage;
              } catch {
                // If parsing fails, use default message
              }
            } else if (error.response?.data?.message) {
              errorMessage = error.response.data.message;
            }
            Swal.fire({
              title: 'Error',
              text: errorMessage,
              icon: 'error',
              confirmButtonText: 'OK'
            });
          }
          break;
        case 'edit':
          // Navigate to edit envelope
          window.open(`/e-sign/create?step=3&envelopeId=${agreementId}`, '_blank');
          break;
        case 'delete':
          // Implement soft delete functionality
          const result = await Swal.fire({
            title: 'Are you sure?',
            text: 'Are you sure you want to delete this agreement? This will move it to the deleted tab.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
          });
          if (result.isConfirmed) {
            try {
              // Call soft delete API to update status to "deleted"
              const response = await eSignApi.post(`/api/e-sign/envelope/delete/${agreementId}`);
              if (response.status === 200) {
                console.log('Envelope status updated to deleted:', agreementId);
                Swal.fire({
                  title: 'Success!',
                  text: 'Agreement deleted successfully. It has been moved to the deleted tab.',
                  icon: 'success',
                  confirmButtonText: 'OK'
                });
                // Refresh the list after deletion
                await fetchEnvelopes();
              }
            } catch (error) {
              console.error('Error deleting envelope:', error);
              Swal.fire({
                title: 'Error',
                text: 'Failed to delete agreement. Please try again.',
                icon: 'error',
                confirmButtonText: 'OK'
              });
            }
          }
          break;
        case 'more':
          // Show more options
          console.log('More options for envelope:', agreementId);
          break;
        default:
          console.log(`${action} action for agreement ${agreementId}`);
      }
    } catch (error) {
      console.error(`Error performing ${action} action:`, error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Selection header (replaces default header when any selected) */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-900 rounded-sm text-sm">
            <span className="inline-flex w-4 h-4 items-center justify-center border border-purple-600 rounded">
              <Check className="w-3 h-3" />
            </span>
            {selectedIds.size} selected
          </div>
          {/* <button onClick={() => setShowMoveDialog(true)} className="px-3 py-2 border border-gray-300 rounded-sm hover:bg-gray-50 text-sm">Move</button> */}
          <button onClick={handleBulkResend} disabled={bulkResending} className={`px-3 py-2 border border-gray-300 rounded-sm text-sm ${bulkResending ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'}`}>{bulkResending ? 'Resending…' : 'Resend'}</button>
          <div className="relative">
            <button onClick={() => setShowBulkMenu(s => !s)} className="px-3 py-2 border border-gray-300 rounded-sm hover:bg-gray-50 text-sm">▾</button>
            {showBulkMenu && (
              <div className="absolute z-20 mt-2 w-56 bg-white border rounded-sm shadow-lg">
                <button onClick={() => { setShowBulkMenu(false); handleBulkDelete(); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">Delete</button>
                <button onClick={() => { setShowBulkMenu(false); handleExportCSV(); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">Export as CSV</button>
                <button disabled className="w-full text-left px-4 py-2 text-gray-400 text-sm cursor-not-allowed">Transfer Ownership</button>
              </div>
            )}
          </div>
          <button onClick={clearSelection} className="ml-auto text-sm text-gray-600 hover:underline">Clear</button>
        </div>
      )}

      {/* Search + filter bar to match screenshot */}
      {selectedIds.size === 0 && (
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center" data-tour="filter-bar">
            <div className="flex-1">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none shadow-sm focus:ring-2 focus:ring-[#3E2B66]/20 focus:border-[#3E2B66] transition-all duration-200 bg-white hover:border-gray-400 text-sm"
                  data-tour="search-input"
                />

                {(searchTerm || selectedDateIdx !== 2 || selectedStatusIdx !== 0 || customDateFrom || customDateTo) && (
                  <button
                    onClick={handleClearFilters}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 hover:scale-110 transition-all duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>
            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
              <button
                ref={dateButtonRef}
                onClick={(e) => openHeaderDropdown('date', e)}
                className="group inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {getDateButtonLabel()} <ChevronDown className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
              </button>

              <button
                ref={statusButtonRef}
                onClick={(e) => openHeaderDropdown('status', e)}
                className="group inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {getStatusButtonLabel()} <ChevronDown className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
              </button>
              <div className="flex items-center gap-2">
                <div className="relative group/tooltip">
                  <button
                    onClick={() => setIsColumnModalOpen(true)}
                    className="inline-flex items-center justify-center p-2.5"
                    data-tour="customize-columns"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  {/* Tooltip */}
                  <div className="absolute top-[60%] right-full -translate-y-1/2 mr-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 whitespace-nowrap pointer-events-none z-50">
                    Customize columns
                    <div className="absolute top-1/2 left-full -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
                  </div>

                </div>

              </div>
              {/* Create Button - Conditional rendering based on powerform route */}
              {isPowerForm ? (
                /* Dropdown Menu - Only shows on powerform routes */
                <div className="relative group">
                  <button
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#260559] to-[#3E2B66] text-white rounded-lg text-sm font-medium hover:from-[#3E2B66] hover:to-[#4d3577] transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-100"
                  >
                    <Plus className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" /> Create
                  </button>
                  {/* Dropdown Menu - Shows on hover, vertical list layout */}
                  <div className="absolute top-full right-0 mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="flex flex-col gap-2 min-w-[180px]">
                      {/* Create Envelope Button */}
                      <Link to="/e-sign/create">
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="w-full inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#260559] to-[#3E2B66] text-white rounded-lg text-sm font-medium hover:from-[#3E2B66] hover:to-[#4d3577] transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
                        >
                          <Plus className="w-4 h-4" /> Create Envelope
                        </button>
                      </Link>
                      {/* Create PowerForm Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/e-sign/powerforms');
                        }}
                        className="w-full inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#260559] text-[#260559] rounded-lg text-sm font-medium hover:bg-gray-50 transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" />
                        Create PowerForm
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Direct Create Envelope Button - Shows on non-powerform routes */
                <Link to="/e-sign/create">
                  <button
                    className="group inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#260559] to-[#3E2B66] text-white rounded-lg text-sm font-medium hover:from-[#3E2B66] hover:to-[#4d3577] transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-100"
                  >
                    <Plus className="w-4 h-4 transition-transform duration-200 ease-in-out group-hover:rotate-90" />  Create Envelope
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Agreements Table */}
      <div className="relative" data-tour="agreements-table">
        <div className="flex flex-col min-h-[calc(100vh-150px)] overflow-x-auto relative">
          <table ref={tableRef} className="min-w-full divide-y divide-gray-200" style={{ tableLayout: 'fixed', width: '100%' }}>
            {currentAgreements.length > 0 && (
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  {!isPowerForm && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ width: '50px' }}>
                    </th>
                  )}
                  {getVisibleColumns().map((column) => {
                    const columnWidth = getColumnWidth(column.id);
                    const isResizing = resizingColumn === column.id;
                    return (
                      <th
                        key={column.id}
                        className={`py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider relative group ${column.id === 'status' ? 'pl-12 pr-6' : 'px-6'}`}
                        style={{ width: columnWidth ? `${columnWidth}px` : undefined }}
                      >
                        <div className="flex items-center justify-between">
                          <span>{column.label}</span>
                        </div>
                        <div
                          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize transition-opacity z-10 ${isResizing
                            ? 'bg-[#3E2B66] opacity-100'
                            : 'bg-gray-300 opacity-0 group-hover:opacity-100 hover:bg-[#3E2B66]'
                            }`}
                          onMouseDown={(e) => handleResizeStart(e, column.id)}
                          style={{
                            cursor: 'col-resize',
                            width: isResizing ? '2px' : '1px'
                          }}
                        />
                      </th>
                    );
                  })}
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ width: '200px' }}>
                    Actions
                  </th>
                </tr>
              </thead>
            )}
            <tbody className="bg-white divide-y divide-gray-200">
              {currentAgreements.length === 0 ? (
                <tr>
                  <td
                    colSpan={getVisibleColumns().length + (isPowerForm ? 1 : 2)}
                    className="px-6 py-16"
                  >
                    <div className="flex flex-col h-115 items-center justify-center text-center gap-4">
                      {/* Simple illustration / icon */}
                      <div className="relative flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center">
                          <div className="w-14 h-18 rounded-lg bg-white shadow-md border border-indigo-100 flex flex-col items-center justify-center">
                            <div className="w-10 h-2 bg-indigo-100 rounded mb-1" />
                            <div className="w-8 h-2 bg-indigo-100 rounded mb-1" />
                            <div className="w-6 h-2 bg-indigo-100 rounded" />
                          </div>
                        </div>
                        <span className="absolute -bottom-1 -right-1 text-2xl"><CircleCheckBig className="h-6 w-6 text-green-500" /></span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-[#3E2B66]">
                          {isTrashPage ? 'Trash is empty' : "You're all set to begin!"}
                        </h3>

                        <p className="text-sm text-gray-500">
                          {isTrashPage ? (
                            'There are no deleted agreements in the trash.'
                          ) : (
                            <>
                              There are no agreements yet. Start exploring by{' '}
                              <Link
                                to="/create"
                                className="font-medium text-[#3E2B66] hover:underline"
                              >
                                creating your first envelope
                              </Link><br />
                              and sending it for signing.
                            </>
                          )}
                        </p>

                        {searchTerm && (
                          <p className="text-xs text-gray-400">
                            Try adjusting your search or filters.
                          </p>
                        )}
                      </div>

                    </div>
                  </td>
                </tr>
              ) : (
                currentAgreements.map((agreement) => {
                  const envelopeData = getEnvelopeData(agreement.id);
                  return (
                    <tr key={agreement.id} className="group hover:bg-gradient-to-r hover:from-purple-50/30 hover:to-transparent transition-all duration-200 border-l-4 border-l-transparent hover:border-l-[#3E2B66]">
                      {!isPowerForm && (
                        <td className="px-6 py-4">
                          <input type="checkbox" checked={isSelected(agreement.id)} onChange={() => toggleSelect(agreement.id)} className="w-4 h-4 rounded border-gray-400" />
                        </td>
                      )}
                      {getVisibleColumns().map((column) => {
                        const columnWidth = getColumnWidth(column.id);
                        return (
                          <td
                            key={column.id}
                            className={`py-4 whitespace-nowrap ${column.id === 'status' ? 'pl-12 pr-6' : 'px-6'}`}
                            style={{ width: columnWidth ? `${columnWidth}px` : undefined, overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            {column.render(agreement, envelopeData)}
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" data-tour="row-actions">
                        <div className="flex items-center justify-end gap-2 relative">
                          {agreement.status === 'in-progress' && agreement.direction !== 'Received' && (
                            <button
                              onClick={() => handleRowResend(agreement)}
                              disabled={rowResendLoadingId === agreement.id}
                              className={`resend-envelope-button ${rowResendLoadingId === agreement.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                              {!rowResendLoadingId && (
                                <div>
                                  <Mail className="envelope-icon envelope-closed" />
                                  <MailOpen className="envelope-icon envelope-open" />
                                </div>
                              )}
                              {rowResendLoadingId === agreement.id ? 'Resending…' : 'Resend'}
                            </button>
                          )}
                          {agreement.status === "draft" && agreement.direction !== 'Received' && (
                            <button
                              onClick={() =>
                                agreement?.isPowerForm
                                  ? handleView(agreement.id)
                                  : handleContinue(agreement.id)
                              }
                              className={agreement.isPowerForm ? "view-eye-button" : "continue-application"}
                            >
                              {agreement.isPowerForm ? (
                                <div>
                                  <EyeClosed className="eye-icon eye-closed" />
                                  <Eye className="eye-icon eye-open" />
                                </div>
                              ) : (
                                <div>
                                  <div className="pencil"></div>
                                  <div className="folder">
                                    <div className="top">
                                      <svg viewBox="0 0 24 27">
                                        <path d="M1,0 L23,0 C23.5522847,-1.01453063e-16 24,0.44771525 24,1 L24,8.17157288 C24,8.70200585 23.7892863,9.21071368 23.4142136,9.58578644 L20.5857864,12.4142136 C20.2107137,12.7892863 20,13.2979941 20,13.8284271 L20,26 C20,26.5522847 19.5522847,27 19,27 L1,27 C0.44771525,27 6.76353751e-17,26.5522847 0,26 L0,1 C-6.76353751e-17,0.44771525 0.44771525,1.01453063e-16 1,0 Z"></path>
                                      </svg>
                                    </div>
                                    <div className="paper"></div>
                                  </div>
                                </div>
                              )}
                              {agreement.isPowerForm ? "View" : "Continue"}
                            </button>
                          )}

                          {agreement.status === 'completed' && agreement.direction !== 'Received' && (
                            <button
                              onClick={() => handleManageAction('download', agreement.id)}
                              className="download-btn-sparkle px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 relative overflow-visible"
                            >
                              <Download className="w-4 h-4 relative z-10" style={{ color: '#3E2B66' }} />
                              <span className="relative z-10" style={{ color: '#3E2B66' }}>Download</span>
                              <div className="sparkle-star-1">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  xmlSpace="preserve"
                                  version="1.1"
                                  style={{ shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', fillRule: 'evenodd', clipRule: 'evenodd' }}
                                  viewBox="0 0 784.11 815.53"
                                  xmlnsXlink="http://www.w3.org/1999/xlink"
                                >
                                  <g id="Layer_x0020_1">
                                    <path
                                      className="sparkle-fill"
                                      d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z"
                                    ></path>
                                  </g>
                                </svg>
                              </div>
                              <div className="sparkle-star-2">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  xmlSpace="preserve"
                                  version="1.1"
                                  style={{ shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', fillRule: 'evenodd', clipRule: 'evenodd' }}
                                  viewBox="0 0 784.11 815.53"
                                  xmlnsXlink="http://www.w3.org/1999/xlink"
                                >
                                  <g id="Layer_x0020_1">
                                    <path
                                      className="sparkle-fill"
                                      d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z"
                                    ></path>
                                  </g>
                                </svg>
                              </div>
                              <div className="sparkle-star-3">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  xmlSpace="preserve"
                                  version="1.1"
                                  style={{ shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', fillRule: 'evenodd', clipRule: 'evenodd' }}
                                  viewBox="0 0 784.11 815.53"
                                  xmlnsXlink="http://www.w3.org/1999/xlink"
                                >
                                  <g id="Layer_x0020_1">
                                    <path
                                      className="sparkle-fill"
                                      d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z"
                                    ></path>
                                  </g>
                                </svg>
                              </div>
                              <div className="sparkle-star-4">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  xmlSpace="preserve"
                                  version="1.1"
                                  style={{ shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', fillRule: 'evenodd', clipRule: 'evenodd' }}
                                  viewBox="0 0 784.11 815.53"
                                  xmlnsXlink="http://www.w3.org/1999/xlink"
                                >
                                  <g id="Layer_x0020_1">
                                    <path
                                      className="sparkle-fill"
                                      d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z"
                                    ></path>
                                  </g>
                                </svg>
                              </div>
                              <div className="sparkle-star-5">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  xmlSpace="preserve"
                                  version="1.1"
                                  style={{ shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', fillRule: 'evenodd', clipRule: 'evenodd' }}
                                  viewBox="0 0 784.11 815.53"
                                  xmlnsXlink="http://www.w3.org/1999/xlink"
                                >
                                  <g id="Layer_x0020_1">
                                    <path
                                      className="sparkle-fill"
                                      d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z"
                                    ></path>
                                  </g>
                                </svg>
                              </div>
                              <div className="sparkle-star-6">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  xmlSpace="preserve"
                                  version="1.1"
                                  style={{ shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', fillRule: 'evenodd', clipRule: 'evenodd' }}
                                  viewBox="0 0 784.11 815.53"
                                  xmlnsXlink="http://www.w3.org/1999/xlink"
                                >
                                  <g id="Layer_x0020_1">
                                    <path
                                      className="sparkle-fill"
                                      d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z"
                                    ></path>
                                  </g>
                                </svg>
                              </div>
                            </button>
                          )}
                          {agreement.status === 'deleted' && agreement.direction !== 'Received' && (
                            <>
                              <button
                                onClick={() => handleRestore(agreement.id)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                              >
                                Restore
                              </button>
                              <button
                                onClick={() => handlePermanentDelete(agreement.id)}
                                className="px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 hover:border-red-400 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 inline-flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Permanently
                              </button>
                            </>
                          )}

                          {agreement.status !== 'deleted' && agreement.direction !== 'Received' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const target = e.currentTarget as HTMLElement;
                                const rect = target.getBoundingClientRect();
                                const menuWidth = 224;
                                const menuHeight = 180; // approximate menu height (adjust as needed)
                                const spaceBelow = window.innerHeight - rect.bottom;
                                const openUpward = spaceBelow < menuHeight + 16; // if not enough space below, open upward

                                const left = Math.max(8, rect.right - menuWidth + window.scrollX);
                                const top = openUpward
                                  ? rect.top + window.scrollY - menuHeight - 8 // open upward
                                  : rect.bottom + window.scrollY + 8; // open downward

                                setMenuPosition({ top, left });
                                setOpenMenuId(openMenuId === agreement.id ? null : agreement.id);
                              }}
                              className="p-2 text-gray-600 hover:text-[#3E2B66] hover:bg-purple-50 rounded-lg transition-all duration-200 group/menu"
                              title="More options"
                            >
                              <MoreVertical className="w-4 h-4 group-hover/menu:rotate-90 transition-transform duration-200" />
                            </button>
                          )}
                          {agreement.direction === 'Received' && (
                            <button
                              onClick={() => navigate(`/e-sign/envelope/${agreement.id}`)}
                              className="px-4 py-2 border border-[#3E2B66] bg-[#3E2B66] text-white rounded-lg text-sm font-medium hover:bg-[#4d3577] hover:border-[#4d3577] transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                            >
                              View
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

            </tbody>
          </table>
          {currentAgreements.length > 0 && currentAgreements.length < 6 && (
            <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-gradient-to-b from-white via-indigo-50/30 to-indigo-100/40">
              <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-200/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-purple-200/20 blur-3xl" />

              <div className="relative z-10 max-w-md px-12 py-8 text-center backdrop-blur">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <CircleCheckBig className="h-6 w-6 text-green-500" />
                </div>

                <p className="text-xl font-semibold text-indigo-700">
                  You&apos;re all caught up
                </p>

                <p className="mt-1 text-m text-indigo-600/80">
                  All active agreements are visible here
                </p>
              </div>

            </div>
          )}

        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6" data-tour="pagination">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{startIndex + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(endIndex, filteredAgreements.length)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{filteredAgreements.length}</span>
                  {' '}results
                </p>
              </div>
              <div className="flex items-center gap-3">
                <nav className="relative z-0 inline-flex rounded-sm shadow-sm -space-x-px" aria-label="Pagination" data-tour="pagination-nav">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-[#3E2B66] hover:text-white hover:border-[#3E2B66] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 disabled:hover:border-gray-300"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  {/* Page numbers */}
                  {getPaginationPages().map((page, index) => {
                    if (page === '...') {
                      return (
                        <span
                          key={`ellipsis-${index}`}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500"
                        >
                          ...
                        </span>
                      );
                    }
                    const pageNum = page as number;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-200 ${pageNum === currentPage
                          ? 'z-10 bg-[#3E2B66] border-[#3E2B66] text-white shadow-md'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-[#3E2B66] hover:text-white hover:border-[#3E2B66]'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-[#3E2B66] hover:text-white hover:border-[#3E2B66] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 disabled:hover:border-gray-300"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>

                {/* Page jump input */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Go to</span>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onKeyDown={handlePageInputKeyDown}
                    onBlur={handlePageJump}
                    className="w-16 px-2 py-1 border border-gray-300 rounded-sm text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-label="Jump to page"
                  />
                  <span className="text-sm text-gray-700">of {totalPages}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed-position dropdown menu rendered once per page to avoid clipping */}
      {openMenuId && menuPosition && (() => {
        const currentAgreement = agreements.find(a => a.id === openMenuId);
        return (
          <div
            ref={menuRef}
            className="fixed z-50 w-56 bg-white border border-gray-200 rounded-sm shadow-lg"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <ul className="py-1 text-sm text-gray-700">
              <li><button onClick={() => { setOpenMenuId(null); setMenuPosition(null); handleManageAction('view', openMenuId); }} className="w-full text-left px-4 py-2 hover:bg-gray-50">View</button></li>
              <li><button onClick={() => { setOpenMenuId(null); setMenuPosition(null); handlePrint(); }} className="w-full text-left px-4 py-2 hover:bg-gray-50">Print</button></li>
              {currentAgreement?.status !== 'completed' && <li><button onClick={() => { setOpenMenuId(null); setMenuPosition(null); handleManageAction('edit', openMenuId); }} className="w-full text-left px-4 py-2 hover:bg-gray-50">Edit</button></li>}
              <li><button onClick={() => { setOpenMenuId(null); setMenuPosition(null); handleExportCSV(); }} className="w-full text-left px-4 py-2 hover:bg-gray-50">Export as CSV</button></li>
              <li><button onClick={() => { setOpenMenuId(null); setMenuPosition(null); handleManageAction('delete', openMenuId); }} className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50">Delete</button></li>
            </ul>
          </div>
        );
      })()}

      {/* Guided Tour Overlay */}
      {isTourOpen && (
        targetRect && (() => {
          // Calculate tooltip position relative to target element
          const tooltipWidth = 384; // max-w-sm = 384px
          const tooltipHeight = 200; // approximate height
          const spacing = 12; // space between tooltip and target
          const padding = 16; // padding from viewport edges

          // Use manual position if dragging, otherwise calculate position
          let tooltipLeft: number;
          let tooltipTop: number;
          const targetCenterX = targetRect.left + (targetRect.width / 2);

          if (tooltipPosition) {
            // Use manual position from dragging
            tooltipLeft = tooltipPosition.x;
            tooltipTop = tooltipPosition.y;
          } else {
            // Calculate horizontal position - center tooltip relative to target, but keep within viewport
            tooltipLeft = targetCenterX - (tooltipWidth / 2);
            // Keep tooltip within viewport bounds
            if (tooltipLeft < padding) {
              tooltipLeft = padding;
            } else if (tooltipLeft + tooltipWidth > window.innerWidth - padding) {
              tooltipLeft = window.innerWidth - tooltipWidth - padding;
            }

            // Calculate vertical position - prefer below, but show above if not enough space
            const spaceBelow = window.innerHeight - targetRect.bottom - spacing;
            const spaceAbove = targetRect.top - spacing;
            const showAbove = spaceBelow < tooltipHeight && spaceAbove > spaceBelow;

            tooltipTop = showAbove
              ? targetRect.top - tooltipHeight - spacing
              : targetRect.bottom + spacing;
          }

          // Calculate arrow position (centered on target element) - only show if not manually positioned
          const arrowOffsetFromTooltipLeft = targetCenterX - tooltipLeft;
          const arrowPadding = 20;
          const constrainedArrowLeft = Math.max(arrowPadding, Math.min(arrowOffsetFromTooltipLeft, tooltipWidth - arrowPadding));

          // Determine arrow direction
          const spaceBelow = window.innerHeight - targetRect.bottom - spacing;
          const spaceAbove = targetRect.top - spacing;
          const showAbove = spaceBelow < tooltipHeight && spaceAbove > spaceBelow;

          return (
            <>
              {/* Tooltip - styled like the tooltip UI */}
              <div
                ref={tooltipRef}
                className="fixed z-50"
                style={{
                  left: `${tooltipLeft}px`,
                  top: `${Math.max(padding, Math.min(tooltipTop, window.innerHeight - tooltipHeight - padding))}px`,
                  cursor: isDragging ? 'grabbing' : 'default'
                }}
              >
                {/* Tooltip box */}
                <div className="bg-[#000000]/50 text-white text-sm rounded-md shadow-lg max-w-sm relative">
                  {/* Draggable header */}
                  <div
                    className="px-4 py-3 font-semibold cursor-move select-none"
                    onMouseDown={handleDragStart}
                    style={{ userSelect: 'none' }}
                  >
                    {currentStep?.title}
                  </div>
                  <div className="px-4 py-2 text-sm leading-relaxed">
                    {currentStep?.content}
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between gap-2 border-t border-gray-600">
                    <div className="text-xs text-white-900">Step {tourStepIndex + 1} of {tourSteps.length}</div>
                    <div className="flex items-center gap-2">
                      <button onClick={closeTour} className="px-3 py-1.5 text-sm text-gray-300 hover:text-white">Skip</button>
                      <button onClick={prevStep} disabled={tourStepIndex === 0} className={`px-3 py-1.5 border border-white-900 rounded-sm text-sm ${tourStepIndex === 0 ? 'cursor-not-allowed text-white-500' : 'hover:bg-gray-700 text-white'}`}>Back</button>
                      {tourStepIndex < tourSteps.length - 1 ? (
                        <button onClick={nextStep} className="px-3 py-1.5 bg-white text-[#26263d] rounded-sm text-sm font-medium hover:bg-gray-100">Next</button>
                      ) : (
                        <button onClick={closeTour} className="px-3 py-1.5 bg-white text-[#26263d] rounded-sm text-sm font-medium hover:bg-gray-100">Done</button>
                      )}
                    </div>
                  </div>
                  {/* Arrow pointing to target - only show if not manually positioned */}
                  {!tooltipPosition && (
                    <div
                      className={`absolute h-0 w-0 ${showAbove ? 'top-full border-t-8 border-t-[#26263d] border-l-8 border-l-transparent border-r-8 border-r-transparent' : 'bottom-full border-b-8 border-b-[#26263d] border-l-8 border-l-transparent border-r-8 border-r-transparent'}`}
                      style={{
                        left: `${constrainedArrowLeft}px`,
                        transform: 'translateX(-50%)'
                      }}
                    ></div>
                  )}
                </div>
              </div>
            </>
          );
        })()
      )}

      {/* Header dropdowns (Date/Status/Sender/Quick/Advanced/Shared Access) */}
      {openHeaderMenu && headerMenuPosition && (
        <div
          ref={menuRef}
          className="fixed z-50 bg-white border border-gray-200 rounded-sm shadow-xl"
          style={{ top: headerMenuPosition.top, left: headerMenuPosition.left, width: openHeaderMenu === 'shared' ? 336 : 360, maxHeight: '70vh', overflowY: 'auto' }}
        >
          {openHeaderMenu !== 'shared' ? (
            <div className="p-4">
              <div className="text-lg font-semibold mb-4 capitalize">{openHeaderMenu === 'date' ? 'Date' : openHeaderMenu === 'status' ? 'Status' : openHeaderMenu === 'sender' ? 'Sender' : openHeaderMenu === 'quick' ? 'Quick views' : 'Advanced search'}</div>
              <div className="space-y-4 text-sm text-gray-800">
                {openHeaderMenu === 'date' && (
                  <div className="space-y-4">
                    <ul className="space-y-3">
                      {dateOptions.map((label, idx) => (
                        <li key={label}>
                          <button
                            onClick={() => {
                              setSelectedDateIdx(idx);
                              // Keep menu open if Custom selected to show calendars
                              if (label !== 'Custom') {
                                closeHeaderMenu();
                              }
                            }}
                            className="w-full flex items-center gap-3 px-1 py-1 hover:bg-gray-50 rounded-sm text-left"
                          >
                            <span className={`inline-block w-4 h-4 rounded-full border ${selectedDateIdx === idx ? 'border-purple-600 ring-4 ring-purple-200' : 'border-gray-400'}`}></span>
                            <span>{label}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    {dateOptions[selectedDateIdx] === 'Custom' && (
                      <div className="pt-2 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">From</label>
                            <input
                              type="date"
                              value={customDateFrom}
                              onChange={(e) => setCustomDateFrom(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <div className="text-[10px] text-gray-400 mt-1">(MM/DD/YYYY)</div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">To</label>
                            <input
                              type="date"
                              value={customDateTo}
                              onChange={(e) => setCustomDateTo(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <div className="text-[10px] text-gray-400 mt-1">(MM/DD/YYYY)</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {openHeaderMenu === 'status' && (
                  <ul className="space-y-3">
                    {statusOptions.map((label, idx) => (
                      <li key={label}>
                        <button onClick={() => { setSelectedStatusIdx(idx); closeHeaderMenu(); }} className="w-full flex items-center gap-3 px-1 py-1 hover:bg-gray-50 rounded-sm text-left">
                          <span className={`inline-block w-4 h-4 rounded-full border ${selectedStatusIdx === idx ? 'border-purple-600 ring-4 ring-purple-200' : 'border-gray-400'}`}></span>
                          <span>{label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div className="p-2 w-80">
              <button onClick={() => { setSelectedShared('user'); closeHeaderMenu(); }} className={`w-full px-2 py-2 flex items-center gap-2 rounded-sm ${selectedShared === 'user' ? 'text-purple-700' : 'hover:bg-gray-50'}`}>
                {selectedShared === 'user' && <Check className="w-4 h-4" />}<span>{currentUserName || 'Current User'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Customize Columns Modal */}
      {isColumnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsColumnModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex items-start justify-between mb-6">
              <h3 className="text-[22px] font-semibold text-[#3E2B66]">Customize Columns</h3>
              <button
                onClick={() => setIsColumnModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> You can select a maximum of 3 columns to display at a time.
              </p>
            </div>

            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {columnConfig.map((column) => {
                const visibleCount = columnConfig.filter(c => c.visible).length;
                const isDisabled = !column.visible && visibleCount >= 3;

                return (
                  <div
                    key={column.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${column.visible
                      ? 'bg-purple-50 border-purple-300'
                      : isDisabled
                        ? 'bg-gray-50 border-gray-200 opacity-60'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={column.visible}
                        onChange={() => toggleColumn(column.id)}
                        disabled={isDisabled}
                        className="w-5 h-5 rounded border-gray-300 text-[#3E2B66] focus:ring-[#3E2B66] disabled:cursor-not-allowed"
                      />
                      <span className={`text-sm font-medium ${isDisabled ? 'text-gray-400' : 'text-gray-900'}`}>
                        {column.label}
                      </span>
                    </label>
                    {column.visible && (
                      <span className="text-xs text-purple-600 font-medium">Visible</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                onClick={resetColumns}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Reset to Default
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsColumnModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsColumnModalOpen(false)}
                  className="px-5 py-2 text-sm font-medium text-white bg-[#3E2B66] rounded-lg hover:bg-[#4d3577] transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgreementPage;