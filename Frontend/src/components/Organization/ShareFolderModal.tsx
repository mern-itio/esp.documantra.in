import React, { useEffect, useState } from 'react';
import { X, User, Search, Plus } from 'lucide-react';
import { organizationApi } from '../../services/apiHelper';
import { useAuth } from '../../components/AuthService/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface User {
  _id: string;
  name: string;
  fullname?: string;
  email: string;
}

interface ShareFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: {
    _id: string;
    folderName?: string;
    name?:string;
  } | null;
  onShared: () => void;
}

export const ShareFolderModal: React.FC<ShareFolderModalProps> = ({
  isOpen,
  onClose,
  folder,
  onShared,
}) => {
  const navigate = useNavigate();
  const { organizationId } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUserPermissions, setSelectedUserPermissions] = useState<Record<string, { view: boolean; edit: boolean; share: boolean }>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && organizationId) {
      fetchUsers();
    } else if (!isOpen) {
      setSelectedUsers([]);
      setSelectedUserPermissions({});
      setSearchQuery('');
    }
  }, [isOpen, organizationId]);
  const handleAddMember = () => {
    navigate('/organizations?add-member=true');
  } 
  const fetchUsers = async () => {
    try {
      const response = await organizationApi.get(`/api/organization/members/${organizationId}`);
      if (response.status === 200) {
        const payload = response.data?.data ?? response.data;
        setUsers(Array.isArray(payload) ? payload : []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
    if (!selectedUserPermissions[userId]) {
      setSelectedUserPermissions(prev => ({
        ...prev,
        [userId]: { view: true, edit: false, share: false }
      }));
    }
  };

  const handlePermissionChange = (userId: string, permission: 'view' | 'edit' | 'share', value: boolean) => {
    setSelectedUserPermissions(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [permission]: value
      }
    }));
  };

  const handleShare = async () => {
    if (selectedUsers.length === 0 || !folder) return;

    setIsLoading(true);
    try {
      const shares = selectedUsers.map(userId => ({
        folderId: folder._id,
        sharedWithType: 'USER',
        sharedWithId: userId,
        permission: selectedUserPermissions[userId],
        createdBy: null // Will be set in backend
      }));

      const response = await organizationApi.post(`/api/organization/share-folder`, {
        shares
      });

      if (response.status === 200 || response.status === 201) {
        toast.success('Folder shared successfully!');
        onShared();
        onClose();
      }
    } catch (error) {
      console.error('Error sharing folder:', error);
      toast.error('Failed to share folder');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#260559] to-[#3E2B66] rounded-lg">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Share Folder</h2>
              <p className="text-sm text-gray-600">{folder?.folderName || folder?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3E2B66] focus:border-transparent"
                placeholder="Search users..."
              />
            </div>

            {/* Users List */} 
            {filteredUsers.length !== 0 ?(
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredUsers.map((user) => (
                <div key={user._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => handleUserSelect(user._id)}
                        className="w-4 h-4 text-[#3E2B66] border-gray-300 rounded focus:ring-[#3E2B66]"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{user.fullname || user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </div>
                  {selectedUsers.includes(user._id) && (
                    <div className="ml-7 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Permissions:</p>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedUserPermissions[user._id]?.view || false}
                            onChange={(e) => handlePermissionChange(user._id, 'view', e.target.checked)}
                            className="w-4 h-4 text-[#3E2B66] border-gray-300 rounded focus:ring-[#3E2B66]"
                          />
                          <span className="text-sm">View</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedUserPermissions[user._id]?.edit || false}
                            onChange={(e) => handlePermissionChange(user._id, 'edit', e.target.checked)}
                            className="w-4 h-4 text-[#3E2B66] border-gray-300 rounded focus:ring-[#3E2B66]"
                          />
                          <span className="text-sm">Edit</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedUserPermissions[user._id]?.share || false}
                            onChange={(e) => handlePermissionChange(user._id, 'share', e.target.checked)}
                            className="w-4 h-4 text-[#3E2B66] border-gray-300 rounded focus:ring-[#3E2B66]"
                          />
                          <span className="text-sm">Share</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            ):(
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-gray-500 mb-4">
                  No members found. Please add members in organization.
                </p>
              <button
                onClick={() => handleAddMember()}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#260559] to-[#3E2B66] text-white rounded-lg font-semibold hover:from-[#3E2B66] hover:to-[#260559] shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                <span>Add Member</span>
              </button>
              </div>
            )}

            {selectedUsers.length > 0 && (
              <button
                onClick={handleShare}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-gradient-to-r from-[#260559] to-[#3E2B66] text-white rounded-lg font-semibold hover:from-[#3E2B66] hover:to-[#260559] transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? 'Sharing...' : `Share with ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
