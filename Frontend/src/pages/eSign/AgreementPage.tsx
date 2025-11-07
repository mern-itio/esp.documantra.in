import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreVertical, Download, ChevronLeft, ChevronRight, ChevronDown, Check, CheckCircle, Pencil } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { eSignApi } from '../../services/apiHelper';

interface Agreement {
  id: string;
  name: string;
  status: 'completed' | 'in-progress' | 'draft' | 'deleted';
  lastChange: string;
  createdBy: string;
  recipientCount: number;
  completedCount: number;
  waitingFor?: string;
  primaryRecipientName?: string;
  isPowerForm?:boolean;
}

interface EnvelopeData {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  sentAt: string;
  isPowerForm?:boolean;
  sender: {
    name: string;
    email: string;
  };
  recipients: Array<{
    id: string;
    name: string;
    email: string;
    status: string;
  }>;
}

const AgreementPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [filteredAgreements, setFilteredAgreements] = useState<Agreement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [openHeaderMenu, setOpenHeaderMenu] = useState<null | 'date' | 'status' | 'sender' | 'quick' | 'advanced' | 'shared'>(null);
  const [headerMenuPosition, setHeaderMenuPosition] = useState<{ top: number; left: number } | null>(null);
  // header selections
  const dateOptions = ['All time','Last 12 months','Last 6 months','Last 30 days','Last week','Last 24 hours','Custom'];
  const statusOptions = ['All','In progress','Completed','Draft','Deleted'];
  const senderOptions = ['Sent by anyone','Sent by me','Sent to me'];
  const quickOptions = ['All','Action Required','Waiting for Others','Expiring Soon','Authentication Failed'];
  const advancedOptions = ['Exclude envelope custom fields','Include envelope custom fields'];
  const [selectedDateIdx, setSelectedDateIdx] = useState<number>(2);
  const [selectedStatusIdx, setSelectedStatusIdx] = useState<number>(0);
  const [selectedSenderIdx, setSelectedSenderIdx] = useState<number>(0);
  const [selectedQuickIdx, setSelectedQuickIdx] = useState<number>(0);
  const [selectedAdvancedIdx, setSelectedAdvancedIdx] = useState<number>(0);
  const [selectedShared, setSelectedShared] = useState<'user' | 'viewAll' | 'selectUser'>('user');
  const [customDateFrom, setCustomDateFrom] = useState<string>('');
  const [customDateTo, setCustomDateTo] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [isSharedWithMeOpen, setIsSharedWithMeOpen] = useState<boolean>(false);
  const [isSharedEnvelopesOpen, setIsSharedEnvelopesOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const itemsPerPage = 10;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkMenu, setShowBulkMenu] = useState<boolean>(false);
  const [showMoveDialog, setShowMoveDialog] = useState<boolean>(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('Inbox');
  const [bulkResending, setBulkResending] = useState<boolean>(false);
  const [rowResendLoadingId, setRowResendLoadingId] = useState<string | null>(null);
  // Guided tour state
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [tourStepIndex, setTourStepIndex] = useState<number>(0);
  const tourSteps = [
    {
      id: 'title',
      selector: '[data-tour="agreements-title"]',
      title: 'All Agreements',
      content: 'This page lists all your envelopes with status and recipients.'
    },
    {
      id: 'shared-access',
      selector: '[data-tour="shared-access"]',
      title: 'Shared Access',
      content: 'Switch between your view and shared access options.'
    },
    {
      id: 'search',
      selector: '[data-tour="search-input"]',
      title: 'Search',
      content: 'Quickly find envelopes by name or creator.'
    },
    {
      id: 'filters',
      selector: '[data-tour="filter-bar"]',
      title: 'Filters',
      content: 'Narrow results by date, status, sender, and more.'
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
      selector: '[data-tour="pagination"]',
      title: 'Pagination',
      content: 'Navigate through pages of results.'
    }
  ] as const;

  const currentStep = tourSteps[tourStepIndex];
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    if (!isTourOpen) return;
    const el = document.querySelector(currentStep?.selector || '') as HTMLElement | null;
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      const top = Math.max(0, window.scrollY + rect.top - 120);
      window.scrollTo({ top, behavior: 'smooth' });
    } else {
      setTargetRect(null);
    }
  }, [isTourOpen, tourStepIndex]);

  const closeTour = () => {
    setIsTourOpen(false);
    setTourStepIndex(0);
    setTargetRect(null);
  };
  const nextStep = () => setTourStepIndex((i) => Math.min(i + 1, tourSteps.length - 1));
  const prevStep = () => setTourStepIndex((i) => Math.max(i - 1, 0));

  // Auto-start guided tour on initial render after data loads
  const tourStartedRef = useRef<boolean>(false);
  useEffect(() => {
    if (!loading && !tourStartedRef.current) {
      tourStartedRef.current = true;
      setIsTourOpen(true);
      setTourStepIndex(0);
    }
  }, [loading]);

  // Get current tab from URL path or default to all
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('/completed')) return 'completed';
    if (path.includes('/draft')) return 'draft';
    if (path.includes('/in-progress')) return 'in-progress';
    if (path.includes('/deleted')) return 'deleted';
    if (path.includes('/all')) return 'all';
    return 'all'; // Default to 'all' tab
  };
  
  const currentTab = getCurrentTab();

  // Fetch envelopes data from API
  const fetchEnvelopes = async () => {
    try {
      setLoading(true);
      const response = await eSignApi.get('/api/e-sign/get-envelopes');
      
      if (response.data && response.data.status === 'success') {
        const envelopes: EnvelopeData[] = response.data.data;
        
        // Map all envelopes to agreement format
        const allEnvelopes = envelopes.map(envelope => ({
          id: envelope.id,
          name: envelope.subject || 'Untitled Agreement',
          status: envelope.status as 'completed' | 'in-progress' | 'draft' | 'deleted',
          lastChange: envelope.sentAt || envelope.createdAt,
          createdBy: envelope.sender?.name || 'Unknown',
          recipientCount: envelope.recipients?.length || 0,
          isPowerForm:envelope.isPowerForm,
          completedCount: envelope.recipients?.filter(recipient => 
            recipient.status === 'completed' || recipient.status === 'signed'
          ).length || 0,
          waitingFor: (() => {
            const firstWaiting = (envelope.recipients || []).find(r => {
              const s = (r.status || '').toLowerCase();
              return s === 'waiting' || s === 'pending' || s === 'needs to sign';
            });
            // If backend doesn't include recipient status, fall back to first recipient when in-progress
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
  };

  useEffect(() => {
    fetchEnvelopes();
  }, []);

  // Read current user name from localStorage
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
      // ignore parse errors
    }
  }, []);

  // Close any open row menu on outside click or ESC
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  useEffect(() => {
    // Filter agreements based on current tab and search term
    let filtered = agreements;

    // Filter by status based on current tab
    if (currentTab === 'all') {
      // Show all except deleted in 'All' view
      filtered = filtered.filter(agreement => agreement.status !== 'deleted');
    } else if (currentTab === 'completed') {
      filtered = filtered.filter(agreement => agreement.status === 'completed');
    } else if (currentTab === 'draft') {
      filtered = filtered.filter(agreement => agreement.status === 'draft');
    } else if (currentTab === 'in-progress') {
      filtered = filtered.filter(agreement => agreement.status === 'in-progress');
    } else if (currentTab === 'deleted') {
      filtered = filtered.filter(agreement => agreement.status === 'deleted');
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(agreement =>
        agreement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agreement.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by selected Status dropdown
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

    // Filter by selected Date range (based on lastChange)
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
    setCurrentPage(1); // Reset to first page when filtering
  }, [agreements, searchTerm, currentTab, selectedStatusIdx, selectedDateIdx, customDateFrom, customDateTo]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredAgreements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAgreements = filteredAgreements.slice(startIndex, endIndex);
  // interface Document {
  //   id: string;
  //   name: string;
  //   size: number;
  //   type: string;
  // }

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
  };

  // Note: navigation between tabs is preserved via URL reading above; UI mirrors filter bar

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDateIdx(2); // Last 6 months default
    setCustomDateFrom('');
    setCustomDateTo('');
    setSelectedStatusIdx(0); // All
    setSelectedSenderIdx(0); // Sent by anyone
    setSelectedQuickIdx(0); // All
    setSelectedAdvancedIdx(0); // Default
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
      alert('Email(s) queued successfully');
    } catch (e) {
      alert('Failed to trigger resend for some items');
    } finally { setBulkResending(false); }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} envelope(s)?`)) return;
    for (const id of ids) {
      try { await eSignApi.post(`/api/e-sign/envelope/soft-delete/${id}`); } catch (_) {}
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
      alert('Email queued successfully');
    } catch (e) {
      alert('Failed to trigger email');
    } finally {
      setRowResendLoadingId(null);
    }
  };

  const handleContinue = (id: string) => {
    navigate(`/e-sign/edit/${id}`);
  };

  const handleRestore = async (id: string) => {
    try {
      await eSignApi.post('/api/e-sign/update-envelope', {
        envelopeId: id,
        envelopeData: { status: 'draft' }
      });
      await fetchEnvelopes();
      alert('Envelope restored to Draft');
    } catch (e) {
      alert('Failed to restore');
    }
  };

  const openHeaderDropdown = (type: 'date' | 'status' | 'sender' | 'quick' | 'advanced' | 'shared', e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = type === 'shared' ? 336 : 360;
    const left = Math.min(window.innerWidth - width - 8, Math.max(8, rect.left + window.scrollX));
    const top = rect.bottom + window.scrollY + 8;
    setHeaderMenuPosition({ top, left });
    setOpenHeaderMenu(type === openHeaderMenu ? null : type);
  };

  const handleResetHeader = () => {
    setSelectedDateIdx(2);
    setSelectedStatusIdx(0);
    setSelectedSenderIdx(0);
    setSelectedQuickIdx(0);
    setSelectedAdvancedIdx(0);
  };

  const handleApplyHeader = () => {
    setOpenHeaderMenu(null);
    setHeaderMenuPosition(null);
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
      alert('Failed to export CSV. Please try again.');
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

  const getStatusButtonLabel = () => {
    const label = statusOptions[selectedStatusIdx];
    return label === 'All' ? 'Status' : label;
  };

  const getSenderButtonLabel = () => {
    const label = senderOptions[selectedSenderIdx];
    return label === 'Sent by anyone' ? 'Sender' : label;
  };

  const getQuickViewsButtonLabel = () => {
    const label = quickOptions[selectedQuickIdx];
    return label === 'All' ? 'Quick views' : label;
  };

  const getAdvancedButtonLabel = () => {
    const label = advancedOptions[selectedAdvancedIdx];
    return label === 'Exclude envelope custom fields' ? 'Advanced search' : 'Advanced search*';
  };

  const handlePrint = () => {
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to print the agreements list.');
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
      alert('Failed to print. Please try again.');
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
            
            // Fetch envelope details to get document IDs
            const response = await eSignApi.get(`/api/e-sign/envelope/${agreementId}`);
            if (response.status === 200 && response.data.status === 'success') {
              
              const documents = (response.data.data.documents as { id: string }[]).map(doc => doc.id);
              
              if (documents.length === 0) {
                alert('No documents found for this agreement.');
                return;
              }else{
                // alert(agreementId);
                // alert(documents);
                window.open(`/e-sign/signer/${agreementId}/${documents}`, '_blank');
                return;
              }
              
             
            } else {
              alert('Failed to fetch envelope details for download.');
            }
          } catch (error) {
            console.error('Error downloading envelope:', error);
            alert('Failed to download documents. Please try again.');
          }
          break;
        case 'edit':
          // Navigate to edit envelope
          window.open(`/e-sign/create?step=3&envelopeId=${agreementId}`, '_blank');
          break;
        case 'delete':
          // Implement soft delete functionality
          if (window.confirm('Are you sure you want to delete this agreement? This will move it to the deleted tab.')) {
            try {
              // Call soft delete API to update status to "deleted"
              const response = await eSignApi.post(`/api/e-sign/envelope/soft-delete/${agreementId}`);
              if (response.status === 200) {
                console.log('Envelope status updated to deleted:', agreementId);
                alert('Agreement deleted successfully. It has been moved to the deleted tab.');
                // Refresh the list after deletion
                await fetchEnvelopes();
              }
            } catch (error) {
              console.error('Error deleting envelope:', error);
              alert('Failed to delete agreement. Please try again.');
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
    <div className="p-6">
      {/* Selection header (replaces default header when any selected) */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-900 rounded-sm text-sm">
            <span className="inline-flex w-4 h-4 items-center justify-center border border-purple-600 rounded">
              <Check className="w-3 h-3" />
            </span>
            {selectedIds.size} selected
          </div>
          <button onClick={() => setShowMoveDialog(true)} className="px-3 py-2 border border-gray-300 rounded-sm hover:bg-gray-50 text-sm">Move</button>
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

      {/* Top title and right actions */}
      {selectedIds.size === 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl text-gray-900" data-tour="agreements-title">All Agreements</h1>
            <div className="flex items-center gap-3">
              <button data-tour="shared-access" onClick={(e) => openHeaderDropdown('shared', e)} className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-sm text-sm text-gray-700 hover:bg-gray-50">
                Shared Access <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search + filter bar to match screenshot */}
      {selectedIds.size === 0 && (
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between" data-tour="filter-bar">
          <div className="flex-1">
            <div className="relative max-w-lg">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search Envelopes"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-tour="search-input"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={(e) => openHeaderDropdown('date', e)} className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-sm text-sm text-gray-700 hover:bg-gray-50">{getDateButtonLabel()} <ChevronDown className="w-4 h-4" /></button>
            <button onClick={(e) => openHeaderDropdown('status', e)} className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-sm text-sm text-gray-700 hover:bg-gray-50">{getStatusButtonLabel()} <ChevronDown className="w-4 h-4" /></button>
            <button onClick={(e) => openHeaderDropdown('sender', e)} className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-sm text-sm text-gray-700 hover:bg-gray-50">{getSenderButtonLabel()} <ChevronDown className="w-4 h-4" /></button>
            <button onClick={(e) => openHeaderDropdown('quick', e)} className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-sm text-sm text-gray-700 hover:bg-gray-50">{getQuickViewsButtonLabel()} <ChevronDown className="w-4 h-4" /></button>
            <button onClick={(e) => openHeaderDropdown('advanced', e)} className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-sm text-sm text-gray-700 hover:bg-gray-50">{getAdvancedButtonLabel()} <ChevronDown className="w-4 h-4" /></button>
            <button onClick={handleClearFilters} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-sm text-sm hover:bg-gray-200">Clear</button>
          </div>
        </div>
      </div>
      )}

      

      {/* Agreements Table */}
      <div className="relative" data-tour="agreements-table">
        <div className="overflow-x-auto relative">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Change</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentAgreements.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      {searchTerm ? 'No agreements found matching your search.' : 'No agreements available.'}
                    </div>
                  </td>
                </tr>
              ) : (
                currentAgreements.map((agreement) => (
                  <tr key={agreement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input type="checkbox" checked={isSelected(agreement.id)} onChange={() => toggleSelect(agreement.id)} className="w-4 h-4 rounded border-gray-400" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        
                        <div>
                          <button
                            onClick={() => navigate(`/e-sign/envelope/${agreement.id}`)}
                            className="text-left text-sm font-medium text-indigo-700 hover:underline"
                            title="View envelope details"
                          >
                             {agreement.name?.slice(0, 25)}{agreement.name?.length > 25 ? "..." : ""}
                          </button>
                          <div className="text-sm text-gray-500">To: {agreement.primaryRecipientName || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {agreement.status === 'in-progress' ? (
                        <div className="min-w-[220px]">
                          <div className="relative h-[4px] bg-gray-200 rounded-full">
                            <span className="absolute -top-[2px] left-0 w-1.5 h-1.5 bg-gray-600 rounded-full"></span>
                            <span className="absolute -top-[2px] right-0 w-1.5 h-1.5 bg-gray-600 rounded-full"></span>
                          
                          </div>
                          <div className="mt-2 text-sm text-gray-900 underline decoration-dotted">
                            {`Waiting for ${agreement.waitingFor || 'recipient'}`}
                          </div>
                        </div>
                      ) : (
                        <>
                          {agreement.status === 'completed' && (
                            <div className="flex items-center gap-2 text-green-700">
                              <CheckCircle className="w-5 h-5 text-green-700" />
                              <span className="text-sm">Completed</span>
                            </div>
                          )}
                          {agreement.status === 'draft' && !agreement.isPowerForm && (
                            <div className="flex items-center gap-2 text-[#3E2B66]">
                              <Pencil className="w-5 h-5 text-[#3E2B66]" />
                              <span className="text-sm">Draft</span>
                            </div>
                          )}

                          {agreement.isPowerForm && (
                            <div className="flex items-center gap-2 text-[#FF00FF]"> {/* Magenta */}
                              <Pencil className="w-5 h-5 text-[#FF00FF]" />
                              <span className="text-sm">Power Form</span>
                            </div>
                          )}
                          {agreement.status === 'deleted' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Deleted
                            </span>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(agreement.lastChange)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" data-tour="row-actions">
                      <div className="flex items-center justify-end gap-2 relative" ref={menuRef}>
                        {agreement.status === 'in-progress' && (
                          <button
                            onClick={() => handleRowResend(agreement)}
                            disabled={rowResendLoadingId === agreement.id}
                            className={`px-3 py-1.5 border border-gray-300 rounded-sm text-sm ${rowResendLoadingId===agreement.id ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'} inline-flex items-center gap-2`}
                          >
                            {rowResendLoadingId === agreement.id ? 'Resending…' : 'Resend'}
                          </button>
                        )}
                        {agreement.status === 'draft' && (
                          <button
                            onClick={() => handleContinue(agreement.id)}
                            className="px-3 py-1.5 border border-gray-300 rounded-sm text-sm hover:bg-gray-50"
                          >
                            Continue
                          </button>
                        )}
                        {agreement.status === 'completed' && (
                          <button
                            onClick={() => handleManageAction('download', agreement.id)}
                            className="px-3 py-1.5 border border-gray-300 rounded-sm text-sm hover:bg-gray-50 inline-flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        )}
                        {agreement.status === 'deleted' && (
                          <button
                            onClick={() => handleRestore(agreement.id)}
                            className="px-3 py-1.5 border border-gray-300 rounded-sm text-sm hover:bg-gray-50"
                          >
                            Restore
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            const target = e.currentTarget as HTMLElement;
                            const rect = target.getBoundingClientRect();
                            const menuWidth = 224;
                            const left = Math.max(8, rect.right - menuWidth + window.scrollX);
                            const top = rect.bottom + window.scrollY + 8;
                            setMenuPosition({ top, left });
                            setOpenMenuId(openMenuId === agreement.id ? null : agreement.id);
                          }}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-sm"
                          title="More options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenuId === agreement.id && menuPosition && (
                          <div className="fixed inset-0 z-40" onClick={() => { setOpenMenuId(null); setMenuPosition(null); }} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
              <div>
                <nav className="relative z-0 inline-flex rounded-sm shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed-position dropdown menu rendered once per page to avoid clipping */}
      {openMenuId && menuPosition && (
        <div
          ref={menuRef}
          className="fixed z-50 w-56 bg-white border border-gray-200 rounded-sm shadow-lg"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          <ul className="py-1 text-sm text-gray-700">
            <li><button onClick={() => { setOpenMenuId(null); setMenuPosition(null); handleManageAction('view', openMenuId); }} className="w-full text-left px-4 py-2 hover:bg-gray-50">View</button></li>
            <li><button onClick={() => { setOpenMenuId(null); setMenuPosition(null); handlePrint(); }} className="w-full text-left px-4 py-2 hover:bg-gray-50">Print</button></li>
            <li><button onClick={() => { setOpenMenuId(null); setMenuPosition(null); handleManageAction('edit', openMenuId); }} className="w-full text-left px-4 py-2 hover:bg-gray-50">Edit</button></li>
            <li><button onClick={() => { setOpenMenuId(null); setMenuPosition(null); handleExportCSV(); }} className="w-full text-left px-4 py-2 hover:bg-gray-50">Export as CSV</button></li>
            <li><button onClick={() => { setOpenMenuId(null); setMenuPosition(null); handleManageAction('delete', openMenuId); }} className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50">Delete</button></li>
          </ul>
        </div>
      )}

      {/* Guided Tour Overlay */}
      {isTourOpen && (
        <>
          {targetRect && (
            <>
              {/* Highlight box */}
              <div
                className="fixed border-2 border-indigo-500 rounded-md shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] z-50 pointer-events-none"
                style={{
                  left: `${targetRect.left}px`,
                  top: `${targetRect.top}px`,
                  width: `${targetRect.width}px`,
                  height: `${targetRect.height}px`
                }}
              />
              {/* Tooltip */}
              <div
                className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-xl max-w-sm"
                style={{
                  left: `${Math.min(Math.max(16, targetRect.left), window.innerWidth - 320)}px`,
                  top: `${Math.min(targetRect.bottom + 12, window.innerHeight - 180)}px`
                }}
              >
                <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">
                  {currentStep?.title}
                </div>
                <div className="px-4 py-3 text-sm text-gray-700">
                  {currentStep?.content}
                </div>
                <div className="px-4 py-3 flex items-center justify-between gap-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500">Step {tourStepIndex + 1} of {tourSteps.length}</div>
                  <div className="flex items-center gap-2">
                    <button onClick={closeTour} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900">Skip</button>
                    <button onClick={prevStep} disabled={tourStepIndex===0} className={`px-3 py-1.5 border border-gray-300 rounded-sm text-sm ${tourStepIndex===0 ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'}`}>Back</button>
                    {tourStepIndex < tourSteps.length - 1 ? (
                      <button onClick={nextStep} className="px-3 py-1.5 bg-[#3E2B66] text-white rounded-sm text-sm">Next</button>
                    ) : (
                      <button onClick={closeTour} className="px-3 py-1.5 bg-[#3E2B66] text-white rounded-sm text-sm">Done</button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
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
                            <span className={`inline-block w-4 h-4 rounded-full border ${selectedDateIdx===idx?'border-purple-600 ring-4 ring-purple-200':'border-gray-400'}`}></span>
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
                          <span className={`inline-block w-4 h-4 rounded-full border ${selectedStatusIdx===idx?'border-purple-600 ring-4 ring-purple-200':'border-gray-400'}`}></span>
                          <span>{label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {openHeaderMenu === 'sender' && (
                  <ul className="space-y-3">
                    {senderOptions.map((label, idx) => (
                      <li key={label}>
                        <button onClick={() => { setSelectedSenderIdx(idx); closeHeaderMenu(); }} className="w-full flex items-center gap-3 px-1 py-1 hover:bg-gray-50 rounded-sm text-left">
                          <span className={`inline-block w-4 h-4 rounded-full border ${selectedSenderIdx===idx?'border-purple-600 ring-4 ring-purple-200':'border-gray-400'}`}></span>
                          <span>{label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {openHeaderMenu === 'quick' && (
                  <ul className="space-y-3">
                    {quickOptions.map((label, idx) => (
                      <li key={label}>
                        <button onClick={() => { setSelectedQuickIdx(idx); closeHeaderMenu(); }} className="w-full flex items-center gap-3 px-1 py-1 hover:bg-gray-50 rounded-sm text-left">
                          <span className={`inline-block w-4 h-4 rounded-full border ${selectedQuickIdx===idx?'border-purple-600 ring-4 ring-purple-200':'border-gray-400'}`}></span>
                          <span>{label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {openHeaderMenu === 'advanced' && (
                  <ul className="space-y-3">
                    {advancedOptions.map((label, idx) => (
                      <li key={label}>
                        <button onClick={() => { setSelectedAdvancedIdx(idx); closeHeaderMenu(); }} className="w-full flex items-center gap-3 px-1 py-1 hover:bg-gray-50 rounded-sm text-left">
                          <span className={`inline-block w-4 h-4 rounded-full border ${selectedAdvancedIdx===idx?'border-purple-600 ring-4 ring-purple-200':'border-gray-400'}`}></span>
                          <span>{label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button onClick={handleResetHeader} className="px-4 py-2 bg-gray-100 rounded-sm">Reset</button>
                <button onClick={handleApplyHeader} className="px-4 py-2 bg-blue-700 text-white rounded-sm">Apply</button>
              </div>
            </div>
          ) : (
            <div className="p-2 w-80">
              <button onClick={() => { setSelectedShared('user'); closeHeaderMenu(); }} className={`w-full px-2 py-2 flex items-center gap-2 rounded-sm ${selectedShared==='user' ? 'text-purple-700' : 'hover:bg-gray-50'}`}>
                {selectedShared==='user' && <Check className="w-4 h-4" />}<span>{currentUserName || 'Current User'}</span>
              </button>
              <div className="mt-2 px-2 py-1 text-[10px] tracking-wide text-gray-500">SHARED ACCESS</div>
              <button onClick={() => { setSelectedShared('viewAll'); closeHeaderMenu(); setIsSharedWithMeOpen(true); }} className={`w-full text-left px-2 py-2 rounded-sm ${selectedShared==='viewAll' ? 'text-purple-700' : 'hover:bg-gray-50'}`}>View All</button>
              <div className="mt-2 px-2 py-1 text-[10px] tracking-wide text-gray-500">SHARED ENVELOPES (LEGACY)</div>
              <button onClick={() => { setSelectedShared('selectUser'); closeHeaderMenu(); setIsSharedEnvelopesOpen(true); }} className={`w-full text-left px-2 py-2 rounded-sm ${selectedShared==='selectUser' ? 'text-purple-700' : 'hover:bg-gray-50'}`}>Select User</button>
            </div>
          )}
        </div>
      )}

      {/* Modal: Shared with Me */}
      {isSharedWithMeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsSharedWithMeOpen(false)}></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 p-8">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Shared with Me</h2>
              <button onClick={() => setIsSharedWithMeOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="text-gray-700">
              <p className="text-xl mb-4">No one has shared access with you.</p>
              <p className="mb-4">Reduce delays by sending and managing envelopes on behalf of others.</p>
              <button className="text-indigo-700 underline">Get Started</button>
            </div>
            <div className="mt-8 text-right">
              <button onClick={() => setIsSharedWithMeOpen(false)} className="px-4 py-2 bg-gray-100 rounded-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Shared Envelopes (Select User) */}
      {isSharedEnvelopesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsSharedEnvelopesOpen(false)}></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">Shared Envelopes</h2>
              <button onClick={() => setIsSharedEnvelopesOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="bg-gray-50 p-4 rounded-sm mb-6">
              <div className="flex items-center gap-2">
                <input type="text" placeholder="Search" className="flex-1 px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <button className="px-3 py-2 border border-gray-300 rounded-sm"><Search /></button>
              </div>
            </div>
            <div className="py-8 text-center text-gray-700">
              <div className="text-2xl mb-2">No results</div>
              <div>You don't have any shared users.</div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={() => setIsSharedEnvelopesOpen(false)} className="px-4 py-2 bg-gray-100 rounded-sm">Cancel</button>
              <button className="px-4 py-2 bg-gray-300 text-gray-600 rounded-sm cursor-not-allowed">Select</button>
            </div>
          </div>
        </div>
      )}
      {/* Move to Folder Modal (shared with detail page style) */}
      {showMoveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMoveDialog(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
            <button onClick={() => setShowMoveDialog(false)} className="absolute right-6 top-6 text-2xl text-[#3E2B66]">✕</button>
            <h3 className="text-[22px] font-semibold text-[#3E2B66] mb-6">Move to Folder</h3>
            <div className="space-y-2 mb-6">
              {['Inbox','Sent','test'].map((f) => (
                <button key={f} onClick={() => setSelectedFolder(f)} className={`w-full text-left px-4 py-3 rounded-sm border ${selectedFolder===f ? 'bg-gray-100 border-gray-300' : 'border-transparent hover:bg-gray-50'}`}>{f}</button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <button className="px-4 py-2 bg-gray-100 rounded-sm">New Folder</button>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowMoveDialog(false)} className="px-4 py-2 bg-gray-100 rounded-sm">Cancel</button>
                <button onClick={() => setShowMoveDialog(false)} className="px-5 py-2 bg-[#3E2B66] text-white rounded-sm">Move</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgreementPage;