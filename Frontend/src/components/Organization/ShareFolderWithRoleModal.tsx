import React, { useEffect, useState } from 'react';
import { X, Users, Search } from 'lucide-react';
import { organizationApi } from '../../services/apiHelper';
import { useAuth } from '../../components/AuthService/AuthContext';
import toast from 'react-hot-toast';

interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions?: any;
}

interface ShareFolderWithRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: {
    _id: string;
    folderName?: string;
    name?:string
  } | null;
  onShared: () => void;
}

export const ShareFolderWithRoleModal: React.FC<ShareFolderWithRoleModalProps> = ({
  isOpen,
  onClose,
  folder,
  onShared,
}) => {
  const { organizationId } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<Record<string, { view: boolean; edit: boolean; share: boolean }>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && organizationId) {
      fetchRoles();
    } else if (!isOpen) {
      setSelectedRoles([]);
      setSelectedRolePermissions({});
      setSearchQuery('');
    }
  }, [isOpen, organizationId]);

  const fetchRoles = async () => {
    try {
      const response = await organizationApi.get(`/api/organization/fetch-roles/${organizationId}`);
      if (response.status === 200) {
        const payload = response.data?.data ?? response.data;
        setRoles(Array.isArray(payload) ? payload : []);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to load roles');
    }
  };

  const handleRoleSelect = (roleId: string) => {
    setSelectedRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
    if (!selectedRolePermissions[roleId]) {
      setSelectedRolePermissions(prev => ({
        ...prev,
        [roleId]: { view: true, edit: false, share: false }
      }));
    }
  };

  const handlePermissionChange = (roleId: string, permission: 'view' | 'edit' | 'share', value: boolean) => {
    setSelectedRolePermissions(prev => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [permission]: value
      }
    }));
  };

  const handleShare = async () => {
    if (selectedRoles.length === 0 || !folder) return;

    setIsLoading(true);
    try {
      const shares = selectedRoles.map(roleId => ({
        folderId: folder._id,
        sharedWithType: 'ROLE',
        sharedWithId: roleId,
        permission: selectedRolePermissions[roleId],
        createdBy: null // Will be set in backend from req.user
      }));

      // Assuming we can use the same endpoint but with different payload
      const response = await organizationApi.post(`/api/organization/share-folder`, {
        shares
      });

      if (response.status === 200 || response.status === 201) {
        toast.success('Folder shared with roles successfully!');
        onShared();
        onClose();
      }
    } catch (error) {
      console.error('Error sharing folder with roles:', error);
      toast.error('Failed to share folder with roles');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#260559] to-[#3E2B66] rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Share Folder with Roles</h2>
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
                placeholder="Search roles..."
              />
            </div>

            {/* Roles List */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredRoles.map((role) => (
                <div key={role._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role._id)}
                        onChange={() => handleRoleSelect(role._id)}
                        className="w-4 h-4 text-[#3E2B66] border-gray-300 rounded focus:ring-[#3E2B66]"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{role.name}</p>
                        {role.description && (
                          <p className="text-sm text-gray-500">{role.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {selectedRoles.includes(role._id) && (
                    <div className="ml-7 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Permissions:</p>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedRolePermissions[role._id]?.view || false}
                            onChange={(e) => handlePermissionChange(role._id, 'view', e.target.checked)}
                            className="w-4 h-4 text-[#3E2B66] border-gray-300 rounded focus:ring-[#3E2B66]"
                          />
                          <span className="text-sm">View</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedRolePermissions[role._id]?.edit || false}
                            onChange={(e) => handlePermissionChange(role._id, 'edit', e.target.checked)}
                            className="w-4 h-4 text-[#3E2B66] border-gray-300 rounded focus:ring-[#3E2B66]"
                          />
                          <span className="text-sm">Edit</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedRolePermissions[role._id]?.share || false}
                            onChange={(e) => handlePermissionChange(role._id, 'share', e.target.checked)}
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

            {selectedRoles.length > 0 && (
              <button
                onClick={handleShare}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-gradient-to-r from-[#260559] to-[#3E2B66] text-white rounded-lg font-semibold hover:from-[#3E2B66] hover:to-[#260559] transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? 'Sharing...' : `Share with ${selectedRoles.length} role${selectedRoles.length > 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};