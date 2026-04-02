import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MoreVertical, ChevronLeft, ChevronRight, CheckCircle, Pencil, Plus, Settings, X, CircleCheckBig, Star, Info, Zap, ShieldCheck, Mail, Globe, Server, AlertTriangle, BookOpen, HelpCircle, CheckCheck, Check } from 'lucide-react';
import { emailApi } from '../../services/apiHelper';
import Swal from 'sweetalert2';

interface SmtpConfiguration {
  _id: string;
  userId: string;
  provider: 'gmail' | 'zoho' | 'webmail' | 'other';
  displayName?: string;
  fromName?: string;
  fromEmail: string;
  smtp?: {
    host?: string;
    port?: number;
    secure?: boolean;
  };
  credentials?: {
    username?: string;
    password?: string;
  };
  isVerified: boolean;
  lastTestedAt?: string;
  lastError?: string;
  isDefault: boolean;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
  render: (config: SmtpConfiguration) => React.ReactNode;
}

type SmtpProvider = 'gmail' | 'zoho' | 'webmail' | 'other';

const PROVIDER_SMTP_DEFAULTS: Record<SmtpProvider, { host: string; port: string; secure: boolean }> = {
  gmail: { host: 'smtp.gmail.com', port: '587', secure: true },
  zoho: { host: 'smtppro.zoho.in', port: '587', secure: true },
  webmail: { host: 'mail.yourdomain.com', port: '587', secure: false },
  other: { host: '', port: '', secure: false }
};

const EmailPage: React.FC = () => {
  const [configurations, setConfigurations] = useState<SmtpConfiguration[]>([]);
  const [filteredConfigurations, setFilteredConfigurations] = useState<SmtpConfiguration[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState<string>('1');
  const [loading, _setLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SmtpConfiguration | null>(null);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [verifyingConfigId, setVerifyingConfigId] = useState<string | null>(null);

  // Column resizing state
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('email-table-column-widths');
    return saved ? JSON.parse(saved) : {};
  });
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const resizeStartXRef = useRef<number>(0);
  const resizeStartWidthRef = useRef<number>(0);
  const resizingColumnRef = useRef<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const itemsPerPage = 10;
  useEffect(() => {
    getConfigurations();
  }, []);
  const getConfigurations = async () => {
    try {
      const response = await emailApi.get('/api/smtp/');
      if (response.status == 200) {
        setConfigurations(response?.data?.data);
        console.log(response);
      }
    } catch (err) {
      console.log(err);
    }
  }

  // Form state
  const [formData, setFormData] = useState({
    provider: 'gmail' as SmtpProvider,
    fromName: '',
    fromEmail: '',
    smtpHost: '',
    smtpPort: '',
    smtpSecure: false,
    password: ''
  });

  const columnRenderers = {

    provider: (config: SmtpConfiguration) => (
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#260559]/10 text-[#260559]">
          <Mail className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-900 capitalize leading-tight">
            {config.provider}
          </div>
          <div className="text-xs text-gray-500 leading-tight truncate">
            {config.smtp?.host ? String(config.smtp.host) : "SMTP"}
          </div>
        </div>
      </div>
    ),
    fromName: (config: SmtpConfiguration) => (
      <span className="text-sm text-gray-900">{config.fromName || '-'}</span>
    ),
    fromEmail: (config: SmtpConfiguration) => (
      <span className="text-sm text-gray-900">{config.fromEmail}</span>
    ),
    smtpHost: (config: SmtpConfiguration) => (
      <span className="text-sm text-gray-900">{config.smtp?.host || '-'}</span>
    ),
    smtpPort: (config: SmtpConfiguration) => (
      <span className="text-sm text-gray-900">{config.smtp?.port || '-'}</span>
    ),
    isVerified: (config: SmtpConfiguration) => (
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
            config.isVerified
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {config.isVerified ? (
            <CheckCircle className="h-3.5 w-3.5" />
          ) : (
            <X className="h-3.5 w-3.5" />
          )}
          {config.isVerified ? "Verified" : "Not verified"}
        </span>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
            config.status === "active"
              ? "border-indigo-200 bg-indigo-50 text-indigo-700"
              : "border-gray-200 bg-gray-50 text-gray-700"
          }`}
        >
          {config.status === "active" ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <X className="h-3.5 w-3.5" />
          )}
          {config.status === "active" ? "Active" : "Inactive"}
        </span>

        {config.isDefault && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-600" />
            Primary
          </span>
        )}
      </div>
    ),
    isDefault: (config: SmtpConfiguration) => (
      config.isDefault ? (
        <div className="flex items-center gap-2 text-amber-600">
          <Star className="w-5 h-5 text-amber-600 fill-amber-600" />
          <span className="text-sm font-medium">Default</span>
        </div>
      ) : (
        <span className="text-sm text-gray-400">-</span>
      )
    ),
    lastTestedAt: (config: SmtpConfiguration) => (
      <span className="text-sm text-gray-900">
        {config.lastTestedAt ? formatDate(config.lastTestedAt) : '-'}
      </span>
    ),
    createdAt: (config: SmtpConfiguration) => (
      <span className="text-sm text-gray-900">
        {config.createdAt ? formatDate(config.createdAt) : '-'}
      </span>
    )
  };

  const getInitialColumnConfig = (): ColumnConfig[] => [
    { id: 'provider', label: 'Provider', visible: true, order: 1, render: columnRenderers.provider },
    { id: 'fromEmail', label: 'From Email', visible: true, order: 2, render: columnRenderers.fromEmail },
    { id: 'fromName', label: 'From Name', visible: true, order: 3, render: columnRenderers.fromName },
    { id: 'isVerified', label: 'Status', visible: true, order: 4, render: columnRenderers.isVerified },

    { id: 'smtpHost', label: 'SMTP Host', visible: false, order: 5, render: columnRenderers.smtpHost },
    { id: 'smtpPort', label: 'SMTP Port', visible: false, order: 6, render: columnRenderers.smtpPort },
    { id: 'isDefault', label: 'Default', visible: false, order: 7, render: columnRenderers.isDefault },
    { id: 'lastTestedAt', label: 'Last Tested', visible: false, order: 8, render: columnRenderers.lastTestedAt },
    { id: 'createdAt', label: 'Created At', visible: false, order: 9, render: columnRenderers.createdAt }
  ];

  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(getInitialColumnConfig());

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

  useEffect(() => {
    let filtered = configurations;

    if (searchTerm) {
      filtered = filtered.filter(config =>
        config.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        config.fromEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        config.fromName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        config.provider.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredConfigurations(filtered);
    setCurrentPage(1);
  }, [configurations, searchTerm]);

  const totalPages = Math.ceil(filteredConfigurations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentConfigurations = filteredConfigurations.slice(startIndex, endIndex);

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
    setCurrentPage(1);
  };

  const handleCreate = () => {
    const providerDefaults = PROVIDER_SMTP_DEFAULTS.gmail;
    setFormData({
      provider: 'gmail',
      fromName: '',
      fromEmail: '',
      smtpHost: providerDefaults.host,
      smtpPort: providerDefaults.port,
      smtpSecure: providerDefaults.secure,
      password: ''
    });
    setIsCreateModalOpen(true);
  };

  const handleProviderChange = (provider: SmtpProvider) => {
    const providerDefaults = PROVIDER_SMTP_DEFAULTS[provider];
    setFormData(prev => ({
      ...prev,
      provider,
      smtpHost: providerDefaults.host,
      smtpPort: providerDefaults.port,
      smtpSecure: providerDefaults.secure
    }));
  };

  const handleEdit = (config: SmtpConfiguration) => {
    setEditingConfig(config);
    const providerDefaults = PROVIDER_SMTP_DEFAULTS[config.provider];
    setFormData({
      provider: config.provider,
      fromName: config.fromName || '',
      fromEmail: config.fromEmail,
      smtpHost: config.smtp?.host || providerDefaults.host,
      smtpPort: config.smtp?.port?.toString() || providerDefaults.port,
      smtpSecure: config.smtp?.secure ?? providerDefaults.secure,
      password: '' // Don't show password
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will permanently delete this SMTP configuration.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        // Placeholder API call
        await emailApi.delete(`/api/smtp/${id}`);
        // For now, just remove from local state
        setConfigurations(prev => prev.filter(c => c._id !== id));
        Swal.fire({
          title: 'Deleted!',
          text: 'SMTP configuration has been deleted.',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      } catch (error) {
        console.error('Error deleting configuration:', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to delete configuration. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    }
  };
  const handleVerify = async (id: string) => {
    setVerifyingConfigId(id);
    Swal.fire({
      title: 'Verifying SMTP configuration...',
      text: 'Please wait while we test your SMTP connection.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      await emailApi.post(`/api/smtp/${id}/test`);

      setConfigurations(prev =>
        prev.map(c => ({
          ...c,
          isVerified: c._id === id
        }))
      );

      Swal.close();
      Swal.fire({
        title: 'Success!',
        text: 'SMTP verified successfully.',
        icon: 'success',
        confirmButtonText: 'OK'
      });

    } catch (err: any) {
      console.error('SMTP verify error:', err);

      const backendError =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to verify SMTP details.';

      let userMessage = backendError;

      if (backendError.includes('wrong version number')) {
        userMessage =
          'SSL/TLS configuration is incorrect. Please check whether the selected port matches SSL settings (Port 465 = SSL enabled, Port 587 = SSL disabled).';
      } else if (backendError.includes('ECONNREFUSED')) {
        userMessage =
          'Unable to connect to SMTP server. Please verify host and port.';
      } else if (backendError.includes('Invalid login')) {
        userMessage =
          'Authentication failed. Please check Email and Password.';
      } else if (backendError.includes('Missing credentials for "PLAIN"')) {
        userMessage =
          'SMTP username or password is missing. Please enter valid authentication credentials.';
      }

      Swal.close();
      Swal.fire({
        title: 'SMTP Verification Failed',
        text: userMessage,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setVerifyingConfigId(null);
    }
  };

  const handleMakeDefault = async (id: string) => {
    try {
      // Placeholder API call
      await emailApi.patch(`/api/smtp/${id}/set-default`);
      // Update local state
      setConfigurations(prev => prev.map(c => ({
        ...c,
        isDefault: c._id === id
      })));
      Swal.fire({
        title: 'Success!',
        text: 'Default SMTP configuration updated.',
        icon: 'success',
        confirmButtonText: 'OK'
      });
    } catch (error) {
      console.error('Error setting default:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to set default configuration. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleSetStatus = async (id: string, status: 'active' | 'inactive') => {
    try {
      await emailApi.patch(`/api/smtp/${id}/set-status`, { status });
      // Update local state
      setConfigurations(prev => prev.map(c => ({
        ...c,
        status: c._id === id ? status : c.status
      })));
      Swal.fire({
        title: 'Success!',
        text: `SMTP configuration set to ${status}.`,
        icon: 'success',
        confirmButtonText: 'OK'
      });
    } catch (error: any) {
      console.error('Error setting status:', error);
      const backendError = error?.response?.data?.message || 'Failed to update status. Please try again.';
      Swal.fire({
        title: 'Error',
        text: backendError,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(editingConfig?._id)
    console.log(formData);
    try {
      const payload = {
        provider: formData.provider,
        fromName: formData.fromName,
        fromEmail: formData.fromEmail,
        smtp: {
          host: formData.smtpHost,
          port: formData.smtpPort ? parseInt(formData.smtpPort) : undefined,
          secure: formData.smtpSecure
        },
        credentials: {
          password: formData.password
        }
      };

      if (isEditModalOpen && editingConfig) {
        // Placeholder API call for update
        await emailApi.patch(`/api/smtp/${editingConfig._id}`, payload);
        // Update local state
        setConfigurations(prev => prev.map(c =>
          c._id === editingConfig._id
            ? { ...c, ...payload, _id: c._id, updatedAt: new Date().toISOString() }
            : c
        ));
        Swal.fire({
          title: 'Updated!',
          text: 'SMTP configuration has been updated.',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      } else {
        // Placeholder API call for create
        const response = await emailApi.post('/api/smtp/', payload);
        // Add to local state
        console.log(response);
        const newConfig: SmtpConfiguration = {
          ...response.data.data
        };
        setConfigurations(prev => [newConfig, ...prev]);
        Swal.fire({
          title: 'Created!',
          text: 'SMTP configuration has been created.',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      }

      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
      setEditingConfig(null);
    } catch (error) {
      console.error('Error saving configuration:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to save configuration. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const getVisibleColumns = (): ColumnConfig[] => {
    return columnConfig
      .filter(col => col.visible)
      .sort((a, b) => a.order - b.order)
      .slice(0, 4);
  };

  const toggleColumn = (columnId: string) => {
    // Prevent toggling off the Status column
    if (columnId === 'isVerified') {
      return;
    }

    setColumnConfig(prev => {
      const updated = prev.map(col => {
        if (col.id === columnId) {
          const newVisible = !col.visible;
          if (newVisible) {
            const visibleCount = prev.filter(c => c.visible).length;
            if (visibleCount >= 4) {
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
    const newWidth = Math.max(50, resizeStartWidthRef.current + diff);

    setColumnWidths(prev => {
      const updated = { ...prev, [resizingColumnRef.current!]: newWidth };
      localStorage.setItem('email-table-column-widths', JSON.stringify(updated));
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    }
    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    }
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Search + filter bar */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="flex-1">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search configurations..."
                className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none shadow-sm focus:ring-2 focus:ring-[#3E2B66]/20 focus:border-[#3E2B66] transition-all duration-200 bg-white hover:border-gray-400 text-sm"
              />

              {searchTerm && (
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
            <div className="relative group/tooltip">
              <button
                onClick={() => setIsColumnModalOpen(true)}
                className="inline-flex items-center justify-center p-2.5"
              >
                <Settings className="w-5 h-5" />
              </button>
              <div className="absolute top-[60%] right-full -translate-y-1/2 mr-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 whitespace-nowrap pointer-events-none z-50">
                Customize columns
                <div className="absolute top-1/2 left-full -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
              </div>
            </div>

            {/* Help button */}
            <div className="relative group/help">
              <button
                onClick={() => setIsHelpOpen(true)}
                className="inline-flex items-center justify-center p-2.5 text-gray-500 hover:text-[#260559] transition-colors rounded-lg hover:bg-[#260559]/6"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <div className="absolute top-[60%] right-full -translate-y-1/2 mr-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover/help:opacity-100 group-hover/help:visible transition-all duration-200 whitespace-nowrap pointer-events-none z-50">
                Setup guide
                <div className="absolute top-1/2 left-full -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
              </div>
            </div>

            <button
              onClick={handleCreate}
              className="group inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#260559] to-[#3E2B66] text-white rounded-lg text-sm font-medium hover:from-[#3E2B66] hover:to-[#4d3577] transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-100"
            >
              <Plus className="w-4 h-4 transition-transform duration-200 ease-in-out group-hover:rotate-90" /> Create Configuration
            </button>
          </div>
        </div>
      </div>

      {/* Configurations Table */}
      <div className="relative">
        <div className="overflow-hidden border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
          <table
            ref={tableRef}
            className="min-w-full divide-y divide-gray-200"
            style={{ tableLayout: 'fixed', width: '100%' }}
          >
            {currentConfigurations.length > 0 && (
              <thead className="bg-gradient-to-r from-gray-50 to-white sticky top-0 z-10">
                <tr>
                  {getVisibleColumns().map((column) => {
                    const columnWidth = getColumnWidth(column.id);
                    const isResizing = resizingColumn === column.id;
                    return (
                      <th
                        key={column.id}
                        className={`py-3.5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wider relative group px-6`}
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
                  <th className="px-6 py-3.5 text-right text-[11px] font-bold text-gray-600 uppercase tracking-wider" style={{ width: '220px' }}>
                    Actions
                  </th>
                </tr>
              </thead>
            )}
            <tbody className="bg-white divide-y divide-gray-200">
              {currentConfigurations.length === 0 ? (
                <tr>
                  <td
                    colSpan={getVisibleColumns().length + 1}
                    className="px-6 py-16"
                  >
                    <div className="flex flex-col h-115 items-center justify-center text-center gap-4">
                      <div className="relative flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center">
                          <div className="w-14 h-18 rounded-lg bg-white shadow-md border border-indigo-100 flex flex-col items-center justify-center">
                            <div className="w-10 h-2 bg-indigo-100 rounded mb-1" />
                            <div className="w-8 h-2 bg-indigo-100 rounded mb-1" />
                            <div className="w-6 h-2 bg-indigo-100 rounded" />
                          </div>
                        </div>
                        <span className="absolute -bottom-1 -right-1 text-2xl">
                          <CircleCheckBig className="h-6 w-6 text-green-500" />
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-[#3E2B66]">
                          No SMTP configurations found
                        </h3>
                        <p className="text-sm text-gray-500">
                          {searchTerm ? (
                            'Try adjusting your search terms.'
                          ) : (
                            <>
                              Start by{' '}
                              <button
                                onClick={handleCreate}
                                className="font-medium text-[#3E2B66] hover:underline"
                              >
                                creating your first SMTP configuration
                              </button>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                currentConfigurations.map((config) => (
                  <tr
                    key={config._id}
                    className="group hover:bg-gradient-to-r hover:from-[#260559]/[0.04] hover:to-transparent transition-colors duration-200"
                  >
                    {getVisibleColumns().map((column) => {
                      const columnWidth = getColumnWidth(column.id);
                      return (
                        <td
                          key={column.id}
                          className="py-4 whitespace-nowrap px-6 align-middle"
                          style={{ width: columnWidth ? `${columnWidth}px` : undefined, overflow: 'hidden', textOverflow: 'ellipsis' }}
                        >
                          {column.render(config)}
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {!config.isDefault && (
                          <button
                            onClick={() => handleMakeDefault(config._id)}
                            disabled={!config.isVerified}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition ${
                              config.isVerified
                                ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                            }`}
                            title={config.isVerified ? "Set as Primary" : "Must be verified to set as default"}
                          >
                            <Star className="h-3.5 w-3.5" />
                            Primary
                          </button>
                        )}

                        {config.status !== 'active' ? (
                          <button
                            onClick={() => handleSetStatus(config._id, 'active')}
                            disabled={!config.isVerified}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition ${
                              config.isVerified
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                            }`}
                            title={config.isVerified ? "Activate this configuration" : "Must be verified to activate"}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Activate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSetStatus(config._id, 'inactive')}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs font-semibold text-rose-800 transition hover:bg-rose-100"
                            title="Deactivate this configuration"
                          >
                            <X className="h-3.5 w-3.5" />
                            Deactivate
                          </button>
                        )}

                        <button
                          onClick={() => handleEdit(config)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#260559]/25 bg-white px-2.5 py-2 text-xs font-semibold text-[#260559] transition hover:bg-[#260559]/5"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const target = e.currentTarget as HTMLElement;
                            const rect = target.getBoundingClientRect();
                            const menuWidth = 224;
                            const menuHeight = 120;
                            const spaceBelow = window.innerHeight - rect.bottom;
                            const openUpward = spaceBelow < menuHeight + 16;

                            const left = Math.max(8, rect.right - menuWidth + window.scrollX);
                            const top = openUpward
                              ? rect.top + window.scrollY - menuHeight - 8
                              : rect.bottom + window.scrollY + 8;

                            setMenuPosition({ top, left });
                            setOpenMenuId(openMenuId === config._id ? null : config._id);
                          }}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-50 hover:text-[#260559]"
                          title="More options"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
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
                    {Math.min(endIndex, filteredConfigurations.length)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{filteredConfigurations.length}</span>
                  {' '}results
                </p>
              </div>
              <div className="flex items-center gap-3">
                <nav className="relative z-0 inline-flex rounded-sm shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-[#3E2B66] hover:text-white hover:border-[#3E2B66] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 disabled:hover:border-gray-300"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

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
      {/* ── "All caught up" — fills remaining space when few rows ── */}
      {filteredConfigurations.length > 0 && filteredConfigurations.length <= 5 && (
        <div className="flex flex-col items-center justify-center min-h-[340px] select-none">
          {/* Animated ring + check */}
          <div className="relative mb-5">
            {/* Outer pulse ring */}
            <span className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-40" />
            <div className="relative w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
              <CheckCheck className="w-7 h-7 text-emerald-500" />
            </div>
          </div>

          <h3 className="text-lg font-bold text-[#260559] mb-1">You're all caught up</h3>
          <p className="text-sm text-gray-400 mb-4">
            {filteredConfigurations.length === 1
              ? 'Your email configuration is set up and ready.'
              : `All ${filteredConfigurations.length} email configurations are visible here.`}
          </p>
          <button
            onClick={() => setIsHelpOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#260559] hover:text-[#34106a] transition-colors"
          >
            Need Help <HelpCircle className="w-3.5 h-3.5" />
          
          </button>
        </div>
      )}

      {/* ── Help sidebar ── */}
      {/* Backdrop */}
      {isHelpOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-black/20"
          onClick={() => setIsHelpOpen(false)}
        />
      )}
      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[380px] bg-white shadow-2xl z-[9999] flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isHelpOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#260559] flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900">SMTP Setup Guide</span>
          </div>
          <button
            onClick={() => setIsHelpOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer body — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">

          {/* How it works */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">How it works</p>
            <ol className="space-y-4">
              {[
                { step: '1', title: 'Create a configuration', desc: 'Add your SMTP provider, host, port, and credentials using the Create Configuration button.' },
                { step: '2', title: 'Verify the connection',  desc: 'Use the ⋮ menu → Verify to send a test email and confirm the config is live.' },
                { step: '3', title: 'Set as Primary',         desc: 'Click the ☆ Active button on a verified config to make it the default sender.' },
                { step: '4', title: 'Emails go out',          desc: 'All document notifications and outgoing emails will now use your custom SMTP config.' },
              ].map((s, i, arr) => (
                <li key={s.step} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-[#260559] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {s.step}
                    </div>
                    {i < arr.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-semibold text-gray-800">{s.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Provider reference */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Provider reference</p>
            <div className="space-y-3">
              {[
                { name: 'Gmail',        icon: <Mail   className="w-3.5 h-3.5" />, color: 'bg-red-50 text-red-500',    host: 'smtp.gmail.com',       port: '587', tip: 'Requires 2FA and an App Password from Google Account → Security.' },
                { name: 'Zoho Mail',    icon: <Globe  className="w-3.5 h-3.5" />, color: 'bg-blue-50 text-blue-500',  host: 'smtp.zoho.com',        port: '587', tip: 'Enable SMTP access in Zoho Mail settings, then use an App-Specific Password.' },
                { name: 'Webmail',      icon: <Server className="w-3.5 h-3.5" />, color: 'bg-violet-50 text-violet-500', host: 'mail.yourdomain.com', port: '587', tip: 'Get credentials from your hosting control panel (cPanel / DirectAdmin).' },
                { name: 'Other',        icon: <Zap    className="w-3.5 h-3.5" />, color: 'bg-gray-100 text-gray-600', host: 'custom',               port: 'any', tip: 'Enter your SMTP host and port manually. TLS/SSL supported on any port.' },
              ].map((p) => (
                <div key={p.name} className="rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${p.color}`}>{p.icon}</span>
                    <span className="text-sm font-semibold text-gray-800">{p.name}</span>
                  </div>
                  <div className="flex gap-3 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Host</span>
                    <code className="text-[11px] bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-700">{p.host}</code>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Port</span>
                    <code className="text-[11px] bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-700">{p.port}</code>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{p.tip}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Quick tips */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Quick tips</p>
            <ul className="space-y-2.5">
              {[
                { icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />, bg: 'bg-emerald-50', text: 'Always verify a config before relying on it for production emails.' },
                { icon: <Star        className="w-3.5 h-3.5 text-[#260559]"  />, bg: 'bg-[#260559]/8', text: 'Only one config can be active/default at a time. Switch by clicking Active.' },
                { icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />, bg: 'bg-amber-50', text: 'Use App Passwords — never your main account password — to prevent lockouts.' },
                { icon: <Info        className="w-3.5 h-3.5 text-blue-500"   />, bg: 'bg-blue-50',   text: 'If verification fails, check that port 587 isn\'t blocked by your firewall.' },
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${t.bg}`}>{t.icon}</span>
                  <p className="text-xs text-gray-600 leading-relaxed">{t.text}</p>
                </li>
              ))}
            </ul>
          </section>

        </div>
      </div>

      {/* Dropdown menu */}
      {openMenuId && menuPosition && (() => {
        const currentConfig = configurations.find(c => c._id === openMenuId);
        return (
          <div
            ref={menuRef}
            className="fixed z-50 w-56 bg-white border border-gray-200 rounded-sm shadow-lg"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <ul className="py-1 text-sm text-gray-700">
              <li>
                <button
                  onClick={() => {
                    setOpenMenuId(null);
                    setMenuPosition(null);
                    if (currentConfig) handleDelete(currentConfig._id);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600"
                >
                  Delete
                </button>
              </li>
              {currentConfig && currentConfig.status !== 'active' && currentConfig.isVerified && (
                <li>
                  <button
                    onClick={() => {
                      setOpenMenuId(null);
                      setMenuPosition(null);
                      handleSetStatus(currentConfig._id, 'active');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-green-600"
                  >                   
                    Set Active
                  </button>
                </li>
              )}
              {currentConfig && currentConfig.status === 'active' && (
                <li>
                  <button
                    onClick={() => {
                      setOpenMenuId(null);
                      setMenuPosition(null);
                      handleSetStatus(currentConfig._id, 'inactive');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600"
                  >
                    Deactivate
                  </button>
                </li>
              )}
              {!currentConfig?.isVerified && (
                <li>
                  <button
                    onClick={() => {
                      setOpenMenuId(null);
                      setMenuPosition(null);
                      if (currentConfig) handleVerify(currentConfig._id);
                    }}
                    disabled={verifyingConfigId === currentConfig?._id}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-green-600 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {verifyingConfigId === currentConfig?._id ? 'Verifying...' : 'Verify'}
                  </button>
                </li>
              )}
            </ul>
          </div>
        );
      })()}

      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            setEditingConfig(null);
          }} />
          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <h3 className="text-[22px] font-semibold text-[#3E2B66]">
                {isEditModalOpen ? 'Edit SMTP Configuration' : 'Create SMTP Configuration'}
              </h3>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                  setEditingConfig(null);
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provider <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.provider}
                    onChange={(e) => handleProviderChange(e.target.value as SmtpProvider)}
                    className="cursor-pointer w-full px-3 py-2 border border-gray-300 rounded-sm"
                    required
                  >
                    <option value="gmail">Gmail</option>
                    <option value="zoho">Zoho</option>
                    <option value="webmail">Webmail</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={formData.smtpHost}
                    onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Name
                  </label>
                  <input
                    type="text"
                    value={formData.fromName}
                    onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.fromEmail}
                    onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                    placeholder="john.doe@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={formData.smtpPort}
                    onChange={(e) => setFormData({ ...formData, smtpPort: e.target.value })}
                    placeholder="587"
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password {isEditModalOpen && <span className="text-xs text-gray-500">(leave blank to keep current)</span>}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.smtpSecure}
                      onChange={(e) => setFormData({ ...formData, smtpSecure: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-[#3E2B66] focus:ring-[#3E2B66]"
                    />
                    <span className="text-sm font-medium text-gray-700">Secure (SSL/TLS)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                    setEditingConfig(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-sm hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium text-white bg-[#3E2B66] rounded-sm hover:bg-[#4d3577] transition-colors"
                >
                  {isEditModalOpen ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
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
                <strong>Note:</strong> You can select a maximum of 4 columns to display at a time. Status column is fixed and cannot be removed.
              </p>
            </div>

            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {columnConfig.map((column) => {
                const visibleCount = columnConfig.filter(c => c.visible).length;
                const isStatusColumn = column.id === 'isVerified';
                const isDisabled = (!column.visible && visibleCount >= 4) || isStatusColumn;

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
                        {isStatusColumn && <span className="ml-2 text-xs text-gray-500">(Fixed)</span>}
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

export default EmailPage;

