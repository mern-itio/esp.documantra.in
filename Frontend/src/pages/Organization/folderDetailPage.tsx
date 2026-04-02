import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Folder, Users, Shield, Plus, Mail, ArrowLeft, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
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
  createdAt: string;
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

  const tabs = [
    { id: 'envelopes', name: 'Envelopes', icon: Mail },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'roles', name: 'Roles', icon: Shield }
  ];

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
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
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
              </tr>
            </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {pageItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
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
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-sm">{page} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
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

      </div>
    </div>
  );
};

export default FolderDetailPage;
