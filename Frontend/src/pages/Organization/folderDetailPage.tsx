import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Folder, Users, Shield, Plus, Mail, ArrowLeft, Trash2, ExternalLink, User2, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { organizationApi } from '../../services/apiHelper';
import { ShareFolderModal } from '../../components/Organization/ShareFolderModal';
import { ShareFolderWithRoleModal } from '../../components/Organization/ShareFolderWithRoleModal';
import { AddEnvelopeModal } from '../../components/Organization/AddEnvelopeModal';

interface FolderDetail {
  _id: string;
  name: string;
}

interface Envelope {
  _id: string;
  name: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  previewUrl?: string | null;
  sharedBy?: { name: string | null; email: string | null } | null;
  recipients?: { _id?: string; name?: string; email?: string; title?: string; company?: string }[];
  documents?: { _id?: string; fileName?: string; filePath?: string; mimeType?: string }[];
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Role {
  _id: string;
  name: string;
  description: string;
}

type TabKey = 'envelopes' | 'users' | 'roles';

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
  render: (item: any) => React.ReactNode;
}


const FolderDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { folderId } = useParams<{ folderId: string }>();
  const [folderDetail, setFolderDetail] = useState<FolderDetail | null>(null);
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showShareRoleModal, setShowShareRoleModal] = useState(false);
  const [showAddEnvelopeModal, setShowAddEnvelopeModal] = useState(false);

  const formatDate = (value?: string) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
  };

  useEffect(() =>{
    fetchFolder();
    fetchFolderEnvelopes();
    fetchRolesAndUsers();
},[folderId]);
const fetchFolderEnvelopes = async () => {
    try{
        const response = await organizationApi.get(`/api/organization/fetch-folder-envelopes/${folderId}`);
        if(response.status === 200){
           setEnvelopes(response?.data?.data);
        }
    }catch (err){
        console.error('Error fetching folder envelopes:', err);
    }
};
const fetchFolder = async () => {
    try{
        const response = await organizationApi.get(`/api/organization/fetch-folder/${folderId}`);
        if(response.status === 200){
            setFolderDetail(response?.data?.data);
        }
    }catch (err){
        console.error('Error fetching folder details:', err);
    }
};
const fetchRolesAndUsers = async () => {
    try{
        const response = await organizationApi.get(`/api/organization/fetch-roles-and-users/${folderId}`);
        if(response.status === 200){
          setUsers(response?.data?.data?.users || []);
          setRoles(response?.data?.data?.roles || []);
        }
    }catch (err){
        console.error('Error fetching roles and users:', err);
    }
};

const handleRemoveEnvelope = async (envelopeId: string) => {
  const result = await Swal.fire({
    title: 'Remove envelope',
    text: 'Are you sure you want to remove this envelope from the folder?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Remove',
    cancelButtonText: 'Cancel'
  });

  if (result.isConfirmed) {
    try {
      await organizationApi.delete(`/api/organization/remove-envelope/${folderId}/${envelopeId}`);
    } catch (err) {
      console.warn('Remove envelope API not available, applying local remove', err);
    }
    setEnvelopes(prev => prev.filter((env) => env._id !== envelopeId));
    Swal.fire('Removed', 'Envelope removed successfully.', 'success');
  }
};

const handleRemoveUser = async (userId: string) => {
  const result = await Swal.fire({
    title: 'Remove user',
    text: 'Are you sure you want to remove this user from the folder?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Remove',
    cancelButtonText: 'Cancel'
  });

  if (result.isConfirmed) {
    try {
      await organizationApi.delete(`/api/organization/remove-user/${folderId}/${userId}`);
    } catch (err) {
      console.warn('Remove user API not available, applying local remove', err);
    }
    setUsers(prev => prev.filter((u) => u._id !== userId));
    Swal.fire('Removed', 'User removed successfully.', 'success');
  }
};

const handleRemoveRole = async (roleId: string) => {
  const result = await Swal.fire({
    title: 'Remove role',
    text: 'Are you sure you want to remove this role from the folder?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Remove',
    cancelButtonText: 'Cancel'
  });

  if (result.isConfirmed) {
    try {
      await organizationApi.delete(`/api/organization/remove-role/${folderId}/${roleId}`);
    } catch (err) {
      console.warn('Remove role API not available, applying local remove', err);
    }
    setRoles(prev => prev.filter((r) => r._id !== roleId));
    Swal.fire('Removed', 'Role removed successfully.', 'success');
  }
};

  const [activeTab, setActiveTab] = useState('envelopes');
  // Table controls
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Sent' | 'Completed' | 'Draft'>('All');
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const resizingColumnRef = useRef<string | null>(null);
  const resizeStartXRef = useRef<number>(0);
  const resizeStartWidthRef = useRef<number>(0);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('folder-table-column-widths');
    return saved ? JSON.parse(saved) : {};
  });

  const tabs: { id: TabKey; name: string; icon: any }[] = [
    { id: 'envelopes', name: 'Envelopes', icon: Mail },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'roles', name: 'Roles', icon: Shield }
  ];

  const envelopeRenderers = useMemo(() => ({
    envelope: (item: Envelope) => (
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>                   
        </div>
        <button
          type="button"
          onClick={() => navigate(`/e-sign/envelope/${item._id}`)}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-[#260559] hover:bg-[#260559]/6 transition-colors"
          title="Open envelope"
        >
          View
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    ),
    status: (item: Envelope) => (
      <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${
        String(item.status).toLowerCase() === 'completed'
          ? 'bg-green-100 text-green-800'
          : String(item.status).toLowerCase() === 'sent' || String(item.status).toLowerCase() === 'in-progress'
          ? 'bg-blue-100 text-blue-800'
          : 'bg-gray-100 text-gray-800'
      }`}>
        {item.status}
      </span>
    ),
    sharedBy: (item: Envelope) => (
      <>
        {item.sharedBy?.name || item.sharedBy?.email ? (
          <div className="flex items-start gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#260559]/10 text-[#260559] flex items-center justify-center flex-shrink-0">
              <User2 className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{item.sharedBy?.name || '—'}</p>
              <p className="text-xs text-gray-500 truncate">{item.sharedBy?.email || ''}</p>
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )}
      </>
    ),
    recipients: (item: Envelope) => (
      <>
        {Array.isArray(item.recipients) && item.recipients.length > 0 ? (
          <RecipientsSummary recipients={item.recipients} />
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )}
      </>
    ),
    created: (item: Envelope) => <span className="text-sm text-gray-500">{formatDate(item.createdAt)}</span>,
  }), [navigate]);

  const getInitialColumnConfig = useCallback((tab: TabKey): ColumnConfig[] => {
    if (tab === 'envelopes') {
      return [
        { id: 'envelope', label: 'Envelope', visible: true, order: 1, render: envelopeRenderers.envelope },
        { id: 'status', label: 'Status', visible: true, order: 2, render: envelopeRenderers.status },
        { id: 'sharedBy', label: 'Shared by', visible: true, order: 3, render: envelopeRenderers.sharedBy },
        { id: 'recipients', label: 'Recipients', visible: true, order: 4, render: envelopeRenderers.recipients },
        { id: 'created', label: 'Created', visible: true, order: 5, render: envelopeRenderers.created },
      ];
    }
    if (tab === 'users') {
      return [
        { id: 'name', label: 'Name', visible: true, order: 1, render: (item: User) => <span className="text-sm font-medium text-gray-900">{item.name}</span> },
        { id: 'email', label: 'Email', visible: true, order: 2, render: (item: User) => <span className="text-sm text-gray-500">{item.email}</span> },
        { id: 'role', label: 'Role', visible: true, order: 3, render: (item: User) => <span className="text-sm text-gray-500">{item.role}</span> },
      ];
    }
    return [
      { id: 'name', label: 'Name', visible: true, order: 1, render: (item: Role) => <span className="text-sm font-medium text-gray-900">{item.name}</span> },
      { id: 'description', label: 'Description', visible: true, order: 2, render: (item: Role) => <span className="text-sm text-gray-500">{item.description}</span> },
    ];
  }, [envelopeRenderers]);

  const [columnConfigMap, setColumnConfigMap] = useState<Record<TabKey, ColumnConfig[]>>({
    envelopes: getInitialColumnConfig('envelopes'),
    users: getInitialColumnConfig('users'),
    roles: getInitialColumnConfig('roles'),
  });

  const getVisibleColumns = useCallback((tab: TabKey): ColumnConfig[] => {
    return (columnConfigMap[tab] || [])
      .filter(col => col.visible)
      .sort((a, b) => a.order - b.order)
      .slice(0, 5);
  }, [columnConfigMap]);

  const toggleColumn = (columnId: string) => {
    setColumnConfigMap(prev => {
      const current = prev[activeTab] || [];
      const updated = current.map(col => {
        if (col.id !== columnId) return col;
        const nextVisible = !col.visible;
        if (nextVisible) {
          const visibleCount = current.filter(c => c.visible).length;
          if (visibleCount >= 5) return col;
        }
        return { ...col, visible: nextVisible };
      });
      return { ...prev, [activeTab]: updated };
    });
  };

  const resetColumns = () => {
    setColumnConfigMap(prev => ({ ...prev, [activeTab]: getInitialColumnConfig(activeTab) }));
  };

  const getColumnWidth = (columnId: string): number | undefined => {
    return columnWidths[`${activeTab}:${columnId}`];
  };

  const handleResizeStart = (e: React.MouseEvent, columnId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnId);
    resizingColumnRef.current = columnId;
    resizeStartXRef.current = e.clientX;
    const currentWidth = getColumnWidth(columnId) || (e.currentTarget.closest('th') as HTMLTableCellElement)?.offsetWidth || 150;
    resizeStartWidthRef.current = currentWidth;
  };

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizingColumnRef.current) return;
    const diff = e.clientX - resizeStartXRef.current;
    const newWidth = Math.max(50, resizeStartWidthRef.current + diff);
    setColumnWidths((prev) => {
      const next = { ...prev, [`${activeTab}:${resizingColumnRef.current!}`]: newWidth };
      localStorage.setItem('folder-table-column-widths', JSON.stringify(next));
      return next;
    });
  }, [activeTab]);

  const handleResizeEnd = useCallback(() => {
    setResizingColumn(null);
    resizingColumnRef.current = null;
    resizeStartXRef.current = 0;
    resizeStartWidthRef.current = 0;
  }, []);

  useEffect(() => {
    if (!resizingColumn) return;
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
  }, [resizingColumn, handleResizeMove, handleResizeEnd]);

  const handleCreateClick = () => {
    if(activeTab == 'envelopes'){
      setShowAddEnvelopeModal(true);
    }else if(activeTab =='users'){
      setShowShareModal(true);
    }else{
      setShowShareRoleModal(true);
    }
  };

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, itemsPerPage, activeTab]);

  const renderTable = () => {
    // Prepare filtered data per active tab
    let data: any[] = [];
    if (activeTab === 'envelopes') data = envelopes;
    if (activeTab === 'users') data = users;
    if (activeTab === 'roles') data = roles;

    const filtered = data.filter((item) => {
      const q = searchTerm.trim().toLowerCase();
      if (activeTab === 'envelopes') {
        const matchesSearch = !q || item.name.toLowerCase().includes(q);
        const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
        return matchesSearch && matchesStatus;
      }
      if (activeTab === 'users') {
        return (
          !q ||
          item.name.toLowerCase().includes(q) ||
          (item.email || '').toLowerCase().includes(q) ||
          (item.role || '').toLowerCase().includes(q)
        );
      }
      // roles
      return !q || item.name.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q);
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
    const page = Math.min(currentPage, totalPages);
    const startIdx = (page - 1) * itemsPerPage;
    const pageItems = filtered.slice(startIdx, startIdx + itemsPerPage);

    // Render table rows generically
    return (
      <div>
        <ShareFolderModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            folder={folderDetail}
            onShared={fetchRolesAndUsers}
        />
        <ShareFolderWithRoleModal
            isOpen={showShareRoleModal}
            onClose={() => setShowShareRoleModal(false)}
            folder={folderDetail}
            onShared={fetchRolesAndUsers}
        />
        <AddEnvelopeModal
            isOpen={showAddEnvelopeModal}
            onClose={() => setShowAddEnvelopeModal(false)}
            folder={folderDetail}
            onAdded={fetchFolderEnvelopes}
        />
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full max-w-md">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${activeTab}`}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'envelopes' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="All">All Status</option>
                <option value="Sent">Sent</option>
                <option value="Completed">Completed</option>
                <option value="Draft">Draft</option>
              </select>
            )}

            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(parseInt(e.target.value, 10))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
            </select>
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
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200" style={{ tableLayout: 'fixed', width: '100%' }}>
            <thead className="bg-gray-50">
              <tr>
                {activeTab === 'envelopes' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </>
                )}
                {activeTab === 'users' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </>
                )}
                {activeTab === 'roles' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </>
                )}
                {getVisibleColumns(activeTab).map((column) => {
                  const columnWidth = getColumnWidth(column.id);
                  const isResizing = resizingColumn === column.id;
                  return (
                    <th
                      key={column.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative group"
                      style={{ width: columnWidth ? `${columnWidth}px` : undefined }}
                    >
                      <div className="flex items-center justify-between">
                        <span>{column.label}</span>
                      </div>
                      <div
                        className={`absolute top-0 right-0 w-1 h-full cursor-col-resize transition-opacity z-10 ${
                          isResizing ? 'bg-[#3E2B66] opacity-100' : 'bg-gray-300 opacity-0 group-hover:opacity-100 hover:bg-[#3E2B66]'
                        }`}
                        onMouseDown={(e) => handleResizeStart(e, column.id)}
                        style={{ cursor: 'col-resize', width: isResizing ? '2px' : '1px' }}
                      />
                    </th>
                  );
                })}
              </tr>
            </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {pageItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={Math.max(1, getVisibleColumns(activeTab).length)}
                      className="px-6 py-8 text-center text-sm text-gray-500"
                    >
                      No data found
                    </td>
                  </tr>
                ) : (
                  pageItems.map((item: any) => (
                    <tr key={item._id} className="hover:bg-gray-50">

                      {activeTab === 'envelopes' && (
                        <>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {item.name}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                              item.status === 'Completed'
                                ? 'bg-green-100 text-green-800'
                                : item.status === 'Sent'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.createdAt}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <button
                              onClick={() => handleRemoveEnvelope(item._id)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                          </td>
                        </>
                      )}

                      {activeTab === 'users' && (
                        <>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.email}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.role}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <button
                              onClick={() => handleRemoveUser(item._id)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                          </td>
                        </>
                      )}

                      {activeTab === 'roles' && (
                        <>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.description}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <button
                              onClick={() => handleRemoveRole(item._id)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                          </td>
                        </>
                      )}

                      {getVisibleColumns(activeTab).map((column) => {
                        const columnWidth = getColumnWidth(column.id);
                        return (
                          <td
                            key={column.id}
                            className="px-6 py-4 whitespace-nowrap"
                            style={{ width: columnWidth ? `${columnWidth}px` : undefined, overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            {column.render(item)}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>

          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIdx + 1} to {Math.min(startIdx + pageItems.length, total)} of {total}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="border rounded disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm">{page} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="border rounded disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mr-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="p-2 bg-gradient-to-br from-[#260559] to-[#3E2B66] rounded-lg">
                  <Folder className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">{folderDetail?.name}</h1>
              </div>
              <p className="text-gray-600 ml-14">
                Manage folder contents and permissions
              </p>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreateClick}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#260559] to-[#3E2B66] text-white rounded-lg font-semibold hover:from-[#3E2B66] hover:to-[#260559] shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              <span>
                {activeTab === 'envelopes' ? 'Add Envelope' :
                 activeTab === 'users' ? 'Add User' : 'Create Role'}
              </span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-[#260559] text-[#260559]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Table Content */}
          <div className="p-6">
            {renderTable()}
          </div>
        </div>

        {isColumnModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Customize Columns</h3>
                <button onClick={() => setIsColumnModalOpen(false)} className="text-gray-500 hover:text-gray-800">✕</button>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                You can select up to 3 columns.
              </p>
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {(columnConfigMap[activeTab] || []).map((column) => {
                  const visibleCount = (columnConfigMap[activeTab] || []).filter(c => c.visible).length;
                  const isDisabled = !column.visible && visibleCount >= 3;
                  return (
                    <label
                      key={column.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        column.visible ? 'border-[#260559]/30 bg-[#260559]/5' : 'border-gray-200'
                      } ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className="text-sm font-medium text-gray-800">{column.label}</span>
                      <input
                        type="checkbox"
                        checked={column.visible}
                        disabled={isDisabled}
                        onChange={() => toggleColumn(column.id)}
                      />
                    </label>
                  );
                })}
              </div>
              <div className="mt-5 flex items-center justify-between">
                <button
                  onClick={resetColumns}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  Reset
                </button>
                <button
                  onClick={() => setIsColumnModalOpen(false)}
                  className="px-4 py-2 text-sm rounded-lg bg-[#260559] text-white hover:bg-[#34106a]"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FolderDetailPage;

function RecipientsSummary({
  recipients,
}: {
  recipients: { name?: string; email?: string }[];
}) {
  const safe = useMemo(() => (recipients || []).filter(Boolean), [recipients]);
  const top = safe.slice(0, 2);
  const remaining = Math.max(0, safe.length - top.length);

  return (
    <div className="flex flex-wrap gap-1.5">
      {top.map((r, idx) => {
        const label = r.name || r.email || 'Recipient';
        const email = r.email || '';
        const title = email ? `${label} — ${email}` : label;
        return (
          <span
            key={`${label}-${idx}`}
            title={title}
            className="inline-flex flex-col items-start px-2.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-gray-700 border border-gray-200 max-w-[260px]"
          >
            <span className="truncate w-full">{label}</span>
        
            {email && (
              <span className="text-gray-500 text-[10px] truncate w-full">
                {email}
              </span>
            )}
          </span>
        );
      })}
      {remaining > 0 && (
        <span
          title={safe.map(r => r.email || r.name).filter(Boolean).join(', ')}
          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#260559]/8 text-[#260559] border border-[#260559]/20"
        >
          +{remaining} more
        </span>
      )}
    </div>
  );
}
