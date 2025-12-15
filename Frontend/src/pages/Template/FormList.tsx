import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { templateServiceApi } from "../../services/apiHelper";
import Swal from "sweetalert2";
import { 
  Search, 
  ChevronDown, 
  Settings, 
  Star, 
  MoreVertical,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Trash2,
  Sparkles
} from "lucide-react";

interface Form {
  _id: string;
  title: string;
  description?: string;
  owner?: string;
  createdAt?: string;
  updatedAt?: string;
  action?: string[];
}

type SortField = 'name' | 'owner' | 'createdDate' | 'lastChange';
type SortOrder = 'asc' | 'desc';

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
  sortable?: boolean;
}

const defaultColumns: ColumnConfig[] = [
  { id: 'name', label: 'Name', visible: true, order: 1, sortable: true },
  { id: 'owner', label: 'Owner', visible: true, order: 2, sortable: true },
  { id: 'createdDate', label: 'Created Date', visible: true, order: 3, sortable: true },
  { id: 'lastChange', label: 'Last Change', visible: true, order: 4, sortable: true },
  { id: 'action', label: 'Action', visible: true, order: 5, sortable: false },
];

export const FormsList: React.FC = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>('lastChange');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const dropdownRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const dropdownButtonRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const [dropdownPosition, setDropdownPosition] = useState<Record<string, { top?: number; bottom?: number; left: number; position: 'above' | 'below' }>>({});
  
  // Date filter state
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [tempDateFilter, setTempDateFilter] = useState<string>('all'); // Temporary selection before Apply
  const dateDropdownContainerRef = React.useRef<HTMLDivElement | null>(null);
  
  // Advanced search state
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [selectedSearchType, setSelectedSearchType] = useState<string>('templateName');
  const [_tempSearchType, _setTempSearchType] = useState<string>('templateName'); // Temporary selection before Apply
  const advancedSearchContainerRef = React.useRef<HTMLDivElement | null>(null);
  
  // Items per page dropdown state
  const [showItemsPerPageDropdown, setShowItemsPerPageDropdown] = useState(false);
  const itemsPerPageContainerRef = React.useRef<HTMLDivElement | null>(null);

  // Column customization state
  const [showColumnModal, setShowColumnModal] = useState(false);
  
  // Load columns from localStorage or use default
  const loadColumnsFromStorage = (): ColumnConfig[] => {
    try {
      const saved = localStorage.getItem('formListColumns');
      if (saved) {
        const parsed = JSON.parse(saved) as ColumnConfig[];
        // Filter out powerforms column and migrate folders to action
        const filtered = parsed
          .filter(col => col.id !== 'powerforms')
          .map(col => {
            // Migrate 'folders' to 'action'
            if (col.id === 'folders') {
              return { ...col, id: 'action', label: 'Action' };
            }
            return col;
          });
        // Validate that all default columns exist in saved config
        const savedIds = new Set(filtered.map((col: ColumnConfig) => col.id));
        const defaultIds = new Set(defaultColumns.map(col => col.id));
        
        // If saved config is missing any default columns, merge them
        if (savedIds.size === defaultIds.size && [...savedIds].every(id => defaultIds.has(id))) {
          // Reorder based on default order and update order values
          const reordered = defaultColumns.map(defaultCol => {
            const savedCol = filtered.find(col => col.id === defaultCol.id);
            return savedCol ? { ...savedCol, order: defaultCol.order } : defaultCol;
          });
          return reordered.sort((a, b) => a.order - b.order);
        } else {
          // Merge: use saved config for existing columns, add missing ones from default
          const merged = [...defaultColumns];
          filtered.forEach((savedCol: ColumnConfig) => {
            const index = merged.findIndex(col => col.id === savedCol.id);
            if (index !== -1) {
              merged[index] = savedCol;
            }
          });
          return merged.sort((a, b) => a.order - b.order);
        }
      }
    } catch (error) {
      console.error('Error loading columns from localStorage:', error);
    }
    return defaultColumns;
  };
  
  const [columns, setColumns] = useState<ColumnConfig[]>(loadColumnsFromStorage());
  // Temporary columns state for modal (only applied on Save)
  const [tempColumns, setTempColumns] = useState<ColumnConfig[]>(columns);
  const [columnSearchTerm, setColumnSearchTerm] = useState("");
  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showSettingsTooltip, setShowSettingsTooltip] = useState(false);
  
  // Clean up powerforms column and migrate folders to action (one-time cleanup)
  useEffect(() => {
    const hasPowerforms = columns.some(col => col.id === 'powerforms');
    const hasFolders = columns.some(col => col.id === 'folders');
    if (hasPowerforms || hasFolders) {
      const cleanedColumns = columns
        .filter(col => col.id !== 'powerforms')
        .map(col => {
          // Migrate 'folders' to 'action'
          if (col.id === 'folders') {
            return { ...col, id: 'action', label: 'Action' };
          }
          return col;
        })
        .map((col, idx) => ({ ...col, order: idx }))
        .sort((a, b) => a.order - b.order);
      setColumns(cleanedColumns);
    }
  }, []); // Run only once on mount
  
  // Initialize tempColumns when modal opens
  useEffect(() => {
    if (showColumnModal) {
      setTempColumns(columns.map(col => ({ ...col })));
    }
  }, [showColumnModal]); // Only re-initialize when modal opens, not when columns change
  
  // Save columns to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('formListColumns', JSON.stringify(columns));
    } catch (error) {
      console.error('Error saving columns to localStorage:', error);
    }
  }, [columns]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newFormTitle, setNewFormTitle] = useState("");
  const [newFormDesc, setNewFormDesc] = useState("");

  const navigate = useNavigate();

  const getFromList = async () => {
    try {
      const response = await templateServiceApi.get('/api/template/get-form');
      if (response) {
        setForms(response.data.form);
      }
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    getFromList();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Handle form action dropdown
      if (showDropdown) {
        const dropdownEl = dropdownRefs.current[showDropdown];
        if (dropdownEl && !dropdownEl.contains(target)) {
          const isIconClick = target.closest('svg')?.parentElement?.classList.contains('relative');
          if (!isIconClick) {
            setShowDropdown(null);
          }
        }
      }
      
      // Handle date dropdown
      if (showDateDropdown && dateDropdownContainerRef.current && !dateDropdownContainerRef.current.contains(target)) {
        setShowDateDropdown(false);
      }
      
      // Handle advanced search dropdown
      if (showAdvancedSearch && advancedSearchContainerRef.current && !advancedSearchContainerRef.current.contains(target)) {
        setShowAdvancedSearch(false);
      }
      
      // Handle items per page dropdown
      if (showItemsPerPageDropdown && itemsPerPageContainerRef.current && !itemsPerPageContainerRef.current.contains(target)) {
        setShowItemsPerPageDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown, showDateDropdown, showAdvancedSearch, showItemsPerPageDropdown]);

  const handleCreateForm = async () => {
    if (!newFormTitle.trim()) return;
    setLoading(true);
    try {
      const response = await templateServiceApi.post('/api/template/create-form', {
        title: newFormTitle,
        description: newFormDesc
      });
      console.log(response.data);
      setForms(prev => [...prev, response.data]);
      setNewFormTitle("");
      setNewFormDesc("");
      setShowModal(false);
    } catch (err) {
      console.error("Error creating form", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return { date: '', time: '' };
    const date = new Date(dateString);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    }).toLowerCase();
    return { date: dateStr, time: timeStr };
  };

  const toSentenceCase = (text?: string) => {
    if (!text) return 'N/A';
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Date filtering function
  const getDateFilterRange = () => {
    const now = new Date();
    switch (selectedDateFilter) {
      case 'last24hours':
        return { start: new Date(now.getTime() - 24 * 60 * 60 * 1000), end: now };
      case 'lastWeek':
        return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: now };
      case 'last30days':
        return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end: now };
      case 'last6months':
        return { start: new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000), end: now };
      case 'last12months':
        return { start: new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000), end: now };
      case 'custom':
        // For custom, we'll need to add date pickers later
        return null;
      default:
        return null; // 'all' - no date filter
    }
  };

  // Advanced search filtering
  const matchesAdvancedSearch = (form: Form) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    switch (selectedSearchType) {
      case 'templateName':
        return form.title.toLowerCase().includes(searchLower);
      case 'templateId':
        return form._id.toLowerCase().includes(searchLower);
      case 'ownerNameEmail':
        const owner = form.owner || '';
        return owner.toLowerCase().includes(searchLower);
      case 'recipientNameEmail':
        // Recipient info might not be in the form data, so we'll search in description or skip
        return form.description?.toLowerCase().includes(searchLower) || false;
      default:
        return form.title.toLowerCase().includes(searchLower);
    }
  };

  const filteredAndSortedForms = forms
    .filter(form => {
      // Apply advanced search filter
      if (!matchesAdvancedSearch(form)) return false;
      
      // Apply date filter
      const dateRange = getDateFilterRange();
      if (dateRange) {
        const formDate = new Date(form.updatedAt || form.createdAt || 0);
        return formDate >= dateRange.start && formDate <= dateRange.end;
      }
      
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'owner':
          comparison = (a.owner || '').localeCompare(b.owner || '');
          break;
        case 'createdDate':
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
        case 'lastChange':
          comparison = new Date(a.updatedAt || a.createdAt || 0).getTime() - new Date(b.updatedAt || b.createdAt || 0).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDateFilter, selectedSearchType, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedForms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedForms = filteredAndSortedForms.slice(startIndex, startIndex + itemsPerPage);
  
  const getDateFilterLabel = () => {
    switch (selectedDateFilter) {
      case 'last24hours': return 'Last 24 hours';
      case 'lastWeek': return 'Last week';
      case 'last30days': return 'Last 30 days';
      case 'last6months': return 'Last 6 months';
      case 'last12months': return 'Last 12 months';
      case 'custom': return 'Custom';
      default: return 'All time';
    }
  };

  const handleUse = (formId: string) => {
    navigate(`/e-sign/form-builder/${formId}`);
  };

  const handleMenuAction = (formId: string, action: string) => {
    setShowDropdown(null);
    switch (action) {
      case 'edit':
        navigate(`/e-sign/form-builder/${formId}`);
        break;
      case 'view':
        window.open(`/template/form-view/${formId}`, '_blank');
        break;
      case 'embed':
        navigate(`/template/form-embed/${formId}`);
        break;
      case 'submissions':
        navigate(`/template/form-submissions/${formId}`);
        break;
      case 'delete':
        handleDeleteClick(formId);
        break;
    }
  };

  const handleDeleteClick = async (formId: string) => {
    const form = forms.find(f => f._id === formId);
    const formTitle = form?.title || 'this form';

    const result = await Swal.fire({
      title: 'Delete Form?',
      html: `Are you sure you want to delete <strong>"${formTitle}"</strong>?<br/><br/>This will permanently delete the form and all associated data including fields and submissions.<br/><br/><span style="color: #DC2626;">This action cannot be undone.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        popup: 'rounded-xl',
        confirmButton: 'px-5 py-2.5 rounded-lg font-medium',
        cancelButton: 'px-5 py-2.5 rounded-lg font-medium'
      }
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const response = await templateServiceApi.delete(`/api/template/delete-form/${formId}`);
        if (response) {
          setForms(prev => prev.filter(f => f._id !== formId));          
          Swal.fire({
            title: 'Deleted!',
            text: `"${formTitle}" has been deleted successfully.`,
            icon: 'success',
            confirmButtonColor: '#4D0080',
            confirmButtonText: 'OK',
            customClass: {
              popup: 'rounded-xl',
              confirmButton: 'px-5 py-2.5 rounded-lg font-medium'
            }
          });
        }
      } catch (err) {
        console.error("Error deleting form", err);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to delete form. Please try again.',
          icon: 'error',
          confirmButtonColor: '#DC2626',
          confirmButtonText: 'OK',
          customClass: {
            popup: 'rounded-xl',
            confirmButton: 'px-5 py-2.5 rounded-lg font-medium'
          }
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <div className="flex flex-col">
          <ChevronUp className="w-3 h-3 text-gray-400" />
          <ChevronDown className="w-3 h-3 text-gray-400 -mt-1" />
        </div>
      );
    }
    return sortOrder === 'asc'
      ? <ChevronUp className="w-3 h-3" />
      : <ChevronDown className="w-3 h-3" />;
  };
  const handleToggleColumn = (columnId: string) => {
    setTempColumns(prev => prev.map(col =>
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColumnIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  const handleDragEnd = () => {
    setDraggedColumnIndex(null);
    setDragOverIndex(null);
  };
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedColumnIndex === null || draggedColumnIndex === dropIndex) return;
    const newColumns = [...tempColumns];
    const draggedItem = newColumns[draggedColumnIndex];
    newColumns.splice(draggedColumnIndex, 1);
    newColumns.splice(dropIndex, 0, draggedItem);
    const updatedColumns = newColumns.map((col, idx) => ({
      ...col,
      order: idx
    }));

    setTempColumns(updatedColumns);
    setDraggedColumnIndex(null);
    setDragOverIndex(null);
  };

  const handleSaveColumns = () => {
    setColumns(tempColumns.map(col => ({ ...col })));
    setShowColumnModal(false);
  };

  const handleCancelColumns = () => {
    setTempColumns(columns.map(col => ({ ...col })));
    setShowColumnModal(false);
  };
  const handleResetToDefault = () => {
    const resetColumns = defaultColumns.map(col => ({ ...col }));
    setTempColumns(resetColumns);
  };
  const visibleColumns = columns
    .filter(col => col.visible)
    .sort((a, b) => a.order - b.order);
  const filteredColumnsForModal = tempColumns.filter(col =>
    col.label.toLowerCase().includes(columnSearchTerm.toLowerCase())
  );
  return (
    <div className="p-8 bg-white min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
     <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl" style={{ color: '#28004D' }}>My Templates</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/template/ai-generator')}
            className="premium-ai-button flex items-center gap-2 px-5 py-2.5 rounded-sm"
            style={{
              color: '#2A1A0E',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            <Sparkles className="w-4 h-4" style={{ color: '#2A1A0E' }} />
            <span>Generate Template using AI</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-sm text-white font-medium transition-all duration-200 hover:opacity-90"
            style={{
              backgroundColor: '#4D0080',
              borderRadius: '6px'
            }}
          >
            <Plus className="w-4 h-4" />
            New Form
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center gap-2 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#888888' }} />
          <input
            type="text"
            placeholder="Search My Templates"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded"
            style={{
              borderColor: '#D0D0D0',
              borderRadius: '6px',
              color: '#28004D'
            }}
          />
        </div>
        <div className="relative" ref={dateDropdownContainerRef}>
          <div
            className="px-4 py-2 border rounded flex items-center gap-2 cursor-pointer"
            style={{
              borderColor: '#D0D0D0',
              borderRadius: '6px',
              color: '#28004D'
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (!showDateDropdown) {
                // When opening, sync temp with current selection
                setTempDateFilter(selectedDateFilter);
              }
              setShowDateDropdown(!showDateDropdown);
              setShowAdvancedSearch(false);
              setShowItemsPerPageDropdown(false);
            }}
          >
            <span>{getDateFilterLabel()}</span>
            <ChevronDown className="w-4 h-4" />
          </div>
          
          {/* Date Dropdown */}
          {showDateDropdown && (
            <div
              className="absolute top-full mt-2 left-0 bg-white border rounded-lg shadow-lg z-50 min-w-[200px]"
              style={{
                borderColor: '#D0D0D0',
                borderRadius: '8px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-2">
                {[
                  { value: 'all', label: 'All time' },
                  { value: 'last12months', label: 'Last 12 months' },
                  { value: 'last6months', label: 'Last 6 months' },
                  { value: 'last30days', label: 'Last 30 days' },
                  { value: 'lastWeek', label: 'Last week' },
                  { value: 'last24hours', label: 'Last 24 hours' },
                  { value: 'custom', label: 'Custom' }
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer rounded"
                    style={{ color: '#28004D' }}
                  >
                    <input
                      type="radio"
                      name="dateFilter"
                      value={option.value}
                      checked={tempDateFilter === option.value}
                      onChange={(e) => setTempDateFilter(e.target.value)}
                      className="w-4 h-4"
                      style={{ accentColor: '#4D0080' }}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-between gap-2 p-3 border-t" style={{ borderColor: '#D0D0D0' }}>
                <button
                  onClick={() => {
                    setTempDateFilter('all');
                    setSelectedDateFilter('all');
                    setShowDateDropdown(false);
                  }}
                  className="px-4 py-2 border rounded-lg font-medium"
                  style={{
                    borderColor: '#D0D0D0',
                    borderRadius: '6px',
                    color: '#28004D'
                  }}
                >
                  Reset
                </button>
                <button
                  onClick={() => {
                    setSelectedDateFilter(tempDateFilter);
                    setShowDateDropdown(false);
                  }}
                  className="px-4 py-2 rounded-lg font-medium text-white"
                  style={{
                    backgroundColor: '#4D0080',
                    borderRadius: '6px'
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
        
      
        
        {/* Clear button - only show when filters are active */}
        {(searchTerm || selectedDateFilter !== 'all' || selectedSearchType !== 'templateName') && (
          <button
            className="px-4 py-2 border rounded"
            style={{
              borderColor: '#D0D0D0',
              borderRadius: '6px',
              color: '#28004D'
            }}
            onClick={() => {
              setSearchTerm("");
              setSelectedDateFilter('all');
              setTempDateFilter('all');
              setSelectedSearchType('templateName');
              // setTempSearchType('templateName');
              setCurrentPage(1);
            }}
          >
            Clear
          </button>
        )}
        <div
          className="relative ml-auto"
          onMouseEnter={() => setShowSettingsTooltip(true)}
          onMouseLeave={() => setShowSettingsTooltip(false)}
        >
          <Settings
            className="w-5 h-5 cursor-pointer"
            style={{ color: '#28004D' }}
            onClick={() => setShowColumnModal(true)}
          />
          {/* Tooltip */}
          {showSettingsTooltip && (
            <div
              className="absolute bottom-full mb-2 whitespace-nowrap z-50"
              style={{
                right: '-8px',
                transform: 'translateX(0)'
              }}
            >
              <div
                className="relative px-3 py-1.5 rounded-sm text-white text-sm font-medium"
                style={{
                  backgroundColor: '#28004D',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
              >
                Customize columns
                {/* Arrow pointing down towards the icon */}
                <div
                  className="absolute top-full"
                  style={{
                    right: '12px',
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '6px solid #28004D'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-sm overflow-x-auto overflow-y-visible" style={{ borderColor: '#D0D0D0' }}>
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ borderColor: '#D0D0D0' }}>
              {visibleColumns.map((col) => {
              
                const sortFieldMap: Record<string, SortField> = {
                  'name': 'name',
                  'owner': 'owner',
                  'createdDate': 'createdDate',
                  'lastChange': 'lastChange'
                };
                const field = sortFieldMap[col.id];
                return (
                  <th
                    key={col.id}
                    className={`px-4 py-3 text-left ${col.sortable ? 'cursor-pointer' : ''}`}
                    style={{ color: '#28004D' }}
                    onClick={col.sortable && field ? () => handleSort(field) : undefined}
                  >
                    {col.sortable && field ? (
                      <div className="flex items-center gap-2">
                        <span>{col.label}</span>
                        <SortIcon field={field} />
                      </div>
                    ) : (
                      <span>{col.label}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paginatedForms.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length} className="px-4 py-8 text-center" style={{ color: '#888888' }}>
                  {searchTerm ? 'No forms found matching your search.' : 'No forms created yet.'}
                </td>
              </tr>
            ) : (
              paginatedForms.map((form) => {
                const createdDate = formatDate(form.createdAt);
                const lastChange = formatDate(form.updatedAt || form.createdAt);
                return (
                  <tr
                    key={form._id}
                    className="border-b hover:bg-gray-50"
                    style={{ borderColor: '#D0D0D0' }}
                  >
                    {visibleColumns.map((col) => {
                      if (col.id === 'name') {
                        return (
                          <td key={col.id} className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4" style={{ color: '#28004D' }} />
                              <span style={{ color: '#28004D' }}>{form.title}</span>
                            </div>
                          </td>
                        );
                      }
                      if (col.id === 'owner') {
                        return (
                          <td key={col.id} className="px-4 py-3" style={{ color: '#28004D' }}>
                            {toSentenceCase(form.owner)}
                          </td>
                        );
                      }
                      if (col.id === 'createdDate') {
                        return (
                          <td key={col.id} className="px-4 py-3" style={{ color: '#28004D' }}>
                            {createdDate.date && (
                              <div>
                                <div>{createdDate.date}</div>
                                <div className="text-sm" style={{ color: '#888888' }}>{createdDate.time}</div>
                              </div>
                            )}
                          </td>
                        );
                      }
                      if (col.id === 'lastChange') {
                        return (
                          <td key={col.id} className="px-4 py-3" style={{ color: '#28004D' }}>
                            {lastChange.date && (
                              <div>
                                <div>{lastChange.date}</div>
                                <div className="text-sm" style={{ color: '#888888' }}>{lastChange.time}</div>
                              </div>
                            )}
                          </td>
                        );
                      }
                      if (col.id === 'action') {
                        return (
                          <td key={col.id} className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUse(form._id)}
                                className="px-3 py-1.5 rounded text-white font-medium"
                                style={{
                                  backgroundColor: '#4D0080',
                                  borderRadius: '6px'
                                }}
                              >
                                Use
                              </button>
                              <div 
                                className="relative"
                                ref={(el) => { if (el) dropdownButtonRefs.current[form._id] = el; }}
                              >
                                <MoreVertical
                                  className="w-5 h-5 cursor-pointer"
                                  style={{ color: '#28004D' }}
                                  onClick={() => {
                                    const formId = form._id;
                                    const isOpening = showDropdown !== formId;
                                    setShowDropdown(isOpening ? formId : null);
                                    
                                    if (isOpening) {
                                      // Calculate position after a brief delay to ensure DOM is updated
                                      setTimeout(() => {
                                        const buttonEl = dropdownButtonRefs.current[formId];
                                        if (buttonEl) {
                                          const buttonRect = buttonEl.getBoundingClientRect();
                                          const dropdownWidth = 192; // w-48 = 12rem = 192px
                                          const estimatedDropdownHeight = 220; // Approximate height of dropdown
                                          const spaceBelow = window.innerHeight - buttonRect.bottom;
                                          const spaceAbove = buttonRect.top;
                                          
                                          // Calculate left position (right-aligned)
                                          const left = buttonRect.right - dropdownWidth;
                                          
                                          // Position above if not enough space below but enough space above
                                          if (spaceBelow < estimatedDropdownHeight && spaceAbove > estimatedDropdownHeight) {
                                            setDropdownPosition(prev => ({ 
                                              ...prev, 
                                              [formId]: { 
                                                bottom: window.innerHeight - buttonRect.top + 8, 
                                                left: Math.max(8, Math.min(left, window.innerWidth - dropdownWidth - 8)),
                                                position: 'above' 
                                              } 
                                            }));
                                          } else {
                                            setDropdownPosition(prev => ({ 
                                              ...prev, 
                                              [formId]: { 
                                                top: buttonRect.bottom + 8, 
                                                left: Math.max(8, Math.min(left, window.innerWidth - dropdownWidth - 8)),
                                                position: 'below' 
                                              } 
                                            }));
                                          }
                                        }
                                      }, 0);
                                    }
                                  }}
                                />
                                {showDropdown === form._id && (
                                  <>
                                    <div
                                      ref={(el) => { 
                                        if (el) {
                                          dropdownRefs.current[form._id] = el;
                                          // Recalculate position when dropdown is rendered with actual height
                                          setTimeout(() => {
                                            const buttonEl = dropdownButtonRefs.current[form._id];
                                            if (buttonEl && el) {
                                              const buttonRect = buttonEl.getBoundingClientRect();
                                              const dropdownHeight = el.offsetHeight;
                                              const dropdownWidth = el.offsetWidth;
                                              const spaceBelow = window.innerHeight - buttonRect.bottom;
                                              const spaceAbove = buttonRect.top;
                                              
                                              // Calculate left position (right-aligned)
                                              const left = buttonRect.right - dropdownWidth;
                                              
                                              // Position above if not enough space below but enough space above
                                              if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
                                                setDropdownPosition(prev => ({ 
                                                  ...prev, 
                                                  [form._id]: { 
                                                    bottom: window.innerHeight - buttonRect.top + 8, 
                                                    left: Math.max(8, Math.min(left, window.innerWidth - dropdownWidth - 8)),
                                                    position: 'above' 
                                                  } 
                                                }));
                                              } else {
                                                setDropdownPosition(prev => ({ 
                                                  ...prev, 
                                                  [form._id]: { 
                                                    top: buttonRect.bottom + 8, 
                                                    left: Math.max(8, Math.min(left, window.innerWidth - dropdownWidth - 8)),
                                                    position: 'below' 
                                                  } 
                                                }));
                                              }
                                            }
                                          }, 0);
                                        }
                                      }}
                                      className="fixed w-48 bg-white border rounded shadow-lg z-[9999]"
                                      style={{
                                        borderColor: '#D0D0D0',
                                        borderRadius: '6px',
                                        ...(dropdownPosition[form._id]?.top !== undefined 
                                          ? { top: `${dropdownPosition[form._id].top}px` }
                                          : { bottom: `${dropdownPosition[form._id]?.bottom}px` }
                                        ),
                                        left: `${dropdownPosition[form._id]?.left || 0}px`
                                      }}
                                    >
                                      <button
                                        onClick={() => handleMenuAction(form._id, 'edit')}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50"
                                        style={{ color: '#28004D' }}
                                      >
                                        Add / Edit
                                      </button>
                                      <button
                                        onClick={() => handleMenuAction(form._id, 'view')}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50"
                                        style={{ color: '#28004D' }}
                                      >
                                        View
                                      </button>
                                      <button
                                        onClick={() => handleMenuAction(form._id, 'embed')}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50"
                                        style={{ color: '#28004D' }}
                                      >
                                        Embed
                                      </button>
                                      <button
                                        onClick={() => handleMenuAction(form._id, 'submissions')}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50"
                                        style={{ color: '#28004D' }}
                                      >
                                        Submissions
                                      </button>
                                      <div className="border-t my-1" style={{ borderColor: '#D0D0D0' }}></div>
                                      <button
                                        onClick={() => handleMenuAction(form._id, 'delete')}
                                        className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2"
                                        style={{ color: '#DC2626' }}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                        );
                      }
                      return null;
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: '#D0D0D0' }}>
        <div className="relative" ref={itemsPerPageContainerRef}>
          <div
            className="px-4 py-2 border rounded flex items-center gap-2 cursor-pointer"
            style={{
              borderColor: '#D0D0D0',
              borderRadius: '6px',
              color: '#28004D'
            }}
            onClick={(e) => {
              e.stopPropagation();
              setShowItemsPerPageDropdown(!showItemsPerPageDropdown);
              setShowDateDropdown(false);
              setShowAdvancedSearch(false);
            }}
          >
            <span>{itemsPerPage} / Page</span>
            <ChevronDown className="w-4 h-4" />
          </div>
          
          {/* Items Per Page Dropdown */}
          {showItemsPerPageDropdown && (
            <div
              className="absolute bottom-full mb-2 left-0 bg-white border rounded-lg shadow-lg z-50 min-w-[120px]"
              style={{
                borderColor: '#D0D0D0',
                borderRadius: '8px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-2">
                {[10, 25, 50, 100].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      setItemsPerPage(num);
                      setShowItemsPerPageDropdown(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-50 rounded ${
                      itemsPerPage === num ? 'font-semibold' : ''
                    }`}
                    style={{
                      color: itemsPerPage === num ? '#4D0080' : '#28004D'
                    }}
                  >
                    {num} / Page
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: '#28004D' }}>Page {currentPage}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-1 disabled:opacity-50"
            style={{ color: currentPage === 1 ? '#888888' : '#28004D' }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1 disabled:opacity-50"
            style={{ color: (currentPage === totalPages || totalPages === 0) ? '#888888' : '#28004D' }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Customize Columns Modal */}
      {showColumnModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(40, 0, 77, 0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowColumnModal(false);
          }}
        >
          <div
            className="bg-white rounded-sm shadow-xl w-full max-w-xl"
            style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#D0D0D0' }}>
              <h2 className="text-xl font-semibold" style={{ color: '#28004D' }}>Customize columns</h2>
              <button
                onClick={() => setShowColumnModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
                style={{ color: '#28004D' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-6 border-b" style={{ borderColor: '#D0D0D0' }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#888888' }} />
                <input
                  type="text"
                  placeholder="Find columns"
                  value={columnSearchTerm}
                  onChange={(e) => setColumnSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded"
                  style={{
                    borderColor: '#D0D0D0',
                    borderRadius: '6px',
                    color: '#28004D'
                  }}
                />
              </div>
            </div>

            {/* Column List - Scrollable */}
            <div
              className="flex-1 overflow-y-auto p-6"
              style={{ maxHeight: '400px' }}
            >
              <div className="space-y-0">
                {filteredColumnsForModal
                  .sort((a, b) => a.order - b.order)
                  .map((col) => {
                    const originalIndex = tempColumns.findIndex(c => c.id === col.id);
                    const isDragging = draggedColumnIndex === originalIndex;
                    const isDragOver = dragOverIndex === originalIndex;
                    return (
                      <div
                        key={col.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = 'move';
                          handleDragStart(e, originalIndex);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDragOver(e, originalIndex);
                        }}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDrop(e, originalIndex);
                        }}
                        className={`flex items-center justify-between py-3 px-2 border-b cursor-move ${isDragOver ? 'bg-purple-50' : ''
                          }`}
                        style={{
                          borderColor: '#D0D0D0',
                          opacity: isDragging ? 0.5 : 1
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {/* Toggle Switch */}
                          <button
                            type="button"
                            onClick={() => handleToggleColumn(col.id)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${col.visible
                                ? 'bg-purple-600'
                                : 'bg-gray-300'
                              }`}
                            style={{
                              backgroundColor: col.visible ? '#4D0080' : '#D0D0D0'
                            }}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${col.visible ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                          </button>

                          {/* Column Label */}
                          <span
                            className="flex-1"
                            style={{
                              color: col.visible ? '#28004D' : '#888888'
                            }}
                          >
                            {col.label}
                          </span>
                        </div>

                        {/* Drag Handle */}
                        <div className="flex flex-col gap-0.5 ml-4" style={{ color: '#888888' }}>
                          <div className="flex gap-0.5">
                            <div className="w-1 h-1 rounded-full bg-current"></div>
                            <div className="w-1 h-1 rounded-full bg-current"></div>
                          </div>
                          <div className="flex gap-0.5">
                            <div className="w-1 h-1 rounded-full bg-current"></div>
                            <div className="w-1 h-1 rounded-full bg-current"></div>
                          </div>
                          <div className="flex gap-0.5">
                            <div className="w-1 h-1 rounded-full bg-current"></div>
                            <div className="w-1 h-1 rounded-full bg-current"></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center p-6 border-t" style={{ borderColor: '#D0D0D0' }}>
              <button
                onClick={handleResetToDefault}
                className="px-4 py-2 border rounded-lg font-medium"
                style={{
                  borderColor: '#D0D0D0',
                  borderRadius: '6px',
                  color: '#28004D',
                  backgroundColor: '#FFFFFF'
                }}
              >
                Reset to Default
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelColumns}
                  className="px-4 py-2 border rounded-lg font-medium"
                  style={{
                    borderColor: '#D0D0D0',
                    borderRadius: '6px',
                    color: '#28004D',
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveColumns}
                  className="px-4 py-2 rounded-lg font-medium text-white"
                  style={{
                    backgroundColor: '#4D0080',
                    borderRadius: '6px'
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-sm shadow-lg w-full max-w-md p-6 relative">
            <h2 className="text-xl font-semibold mb-4"  style={{ 
            color: '#4D0080',
          }}>Create New Template</h2>

            <input
              type="text"
              placeholder="Template title"
              value={newFormTitle}
              onChange={e => setNewFormTitle(e.target.value)}
              className="w-full border rounded-sm px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <textarea
              placeholder="Description (optional)"
              value={newFormDesc}
              onChange={e => setNewFormDesc(e.target.value)}
              className="w-full border rounded-sm px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-sm border hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateForm}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 disabled:opacity-50" style={{
                  backgroundColor: '#4D0080',
                  borderRadius: '6px'
                }}
              >
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
