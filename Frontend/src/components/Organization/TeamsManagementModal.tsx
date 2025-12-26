import React, { useState, useEffect } from 'react';
import { Users, Plus, X, Trash2, Search, UserPlus } from 'lucide-react';
import type { Organization } from '../../types/organization';
import { organizationApi } from '../../services/apiHelper';

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface TeamsManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization | null;
}

export const TeamsManagementModal: React.FC<TeamsManagementModalProps> = ({
  isOpen,
  onClose,
  organization,
}) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberMode, setAddMemberMode] = useState<'existing' | 'new'>('existing');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<TeamMember[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [newMemberData, setNewMemberData] = useState({
    name: '',
    email: '',
    role: 'Member',
  });

  useEffect(() => {
    if (isOpen && organization?._id) {
      fetchTeamMembers();
    }
  }, [isOpen, organization]);

  const fetchTeamMembers = async () => {
    if (!organization?._id) return;

    setIsLoading(true);
    try {
      // Placeholder API call - replace with actual endpoint
      const response = await organizationApi.get(`/api/organization/${organization._id}/members`);
      
      if (response.status === 200) {
        const payload = response.data?.data ?? response.data;
        setMembers(Array.isArray(payload) ? payload : []);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      // Mock data for demonstration
      setMembers([
        {
          _id: '1',
          name: 'John Doe',
          email: 'john.doe@example.com',
          role: 'Admin',
        },
        {
          _id: '2',
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          role: 'Member',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableUsers = async (query: string) => {
    if (!query.trim()) {
      setAvailableUsers([]);
      return;
    }

    try {
      // Placeholder API call - replace with actual endpoint
      const response = await organizationApi.get(`/api/users/search?q=${encodeURIComponent(query)}`);
      
      if (response.status === 200) {
        const payload = response.data?.data ?? response.data;
        setAvailableUsers(Array.isArray(payload) ? payload : []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      // Mock data for demonstration
      setAvailableUsers([
        { _id: '3', name: 'Alice Johnson', email: 'alice@example.com', role: 'User' },
        { _id: '4', name: 'Bob Williams', email: 'bob@example.com', role: 'User' },
      ]);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!organization?._id) return;

    if (!window.confirm('Are you sure you want to remove this member from the organization?')) {
      return;
    }

    try {
      // Placeholder API call - replace with actual endpoint
      const response = await organizationApi.delete(
        `/api/organization/${organization._id}/members/${memberId}`
      );

      if (response.status === 200 || response.status === 204) {
        setMembers((prev) => prev.filter((m) => m._id !== memberId));
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member. Please try again.');
    }
  };

  const handleAddExistingMember = async () => {
    if (!selectedUser || !organization?._id) return;

    try {
      // Placeholder API call - replace with actual endpoint
      const response = await organizationApi.post(
        `/api/organization/${organization._id}/members`,
        { userId: selectedUser, role: 'Member' }
      );

      if (response.status === 200 || response.status === 201) {
        const newMember = availableUsers.find((u) => u._id === selectedUser);
        if (newMember) {
          setMembers((prev) => [...prev, { ...newMember, role: 'Member' }]);
        }
        setSelectedUser('');
        setSearchQuery('');
        setAvailableUsers([]);
        setShowAddMember(false);
      }
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member. Please try again.');
    }
  };

  const handleCreateNewMember = async () => {
    if (!newMemberData.name || !newMemberData.email || !organization?._id) return;

    try {
      // Placeholder API call - replace with actual endpoint
      const response = await organizationApi.post(
        `/api/organization/${organization._id}/members`,
        newMemberData
      );

      if (response.status === 200 || response.status === 201) {
        const payload = response.data?.data ?? response.data;
        setMembers((prev) => [...prev, payload]);
        setNewMemberData({ name: '', email: '', role: 'Member' });
        setShowAddMember(false);
      }
    } catch (error) {
      console.error('Error creating member:', error);
      alert('Failed to create member. Please try again.');
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (showAddMember) {
        fetchAvailableUsers(searchQuery);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, showAddMember]);

  if (!isOpen) return null;

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#260559] to-[#3E2B66] rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
              <p className="text-sm text-gray-600">{organization?.name}</p>
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
          {/* Search and Add Button */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3E2B66] focus:border-transparent"
                placeholder="Search team members..."
              />
            </div>
            <button
              onClick={() => setShowAddMember(!showAddMember)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#260559] to-[#3E2B66] text-white rounded-lg font-semibold hover:from-[#3E2B66] hover:to-[#260559] shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="w-5 h-5" />
              <span>Add Member</span>
            </button>
          </div>

          {/* Add Member Form */}
          {showAddMember && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <UserPlus className="w-5 h-5 text-[#3E2B66]" />
                <h3 className="font-semibold text-gray-900">Add Team Member</h3>
              </div>

              {/* Tabs for Existing vs New */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => {
                    setAddMemberMode('existing');
                    setSelectedUser('');
                    setNewMemberData({ name: '', email: '', role: 'Member' });
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    addMemberMode === 'existing'
                      ? 'bg-[#3E2B66] text-white'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Choose Existing
                </button>
                <button
                  onClick={() => {
                    setAddMemberMode('new');
                    setSelectedUser('');
                    setSearchQuery('');
                    setAvailableUsers([]);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    addMemberMode === 'new'
                      ? 'bg-[#3E2B66] text-white'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Create New
                </button>
              </div>

              {/* Choose Existing User */}
              {addMemberMode === 'existing' && (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        fetchAvailableUsers(e.target.value);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3E2B66] focus:border-transparent"
                      placeholder="Search by name or email..."
                    />
                  </div>
                  {availableUsers.length > 0 && (
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                      {availableUsers.map((user) => (
                        <div
                          key={user._id}
                          onClick={() => setSelectedUser(user._id)}
                          className={`p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0 ${
                            selectedUser === user._id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedUser && (
                    <button
                      onClick={handleAddExistingMember}
                      className="w-full px-4 py-2 bg-[#3E2B66] text-white rounded-lg font-semibold hover:bg-[#260559] transition-colors"
                    >
                      Add Selected Member
                    </button>
                  )}
                </div>
              )}

              {/* Create New Member */}
              {addMemberMode === 'new' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newMemberData.name}
                    onChange={(e) => setNewMemberData({ ...newMemberData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3E2B66] focus:border-transparent"
                    placeholder="Name"
                  />
                  <input
                    type="email"
                    value={newMemberData.email}
                    onChange={(e) => setNewMemberData({ ...newMemberData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3E2B66] focus:border-transparent"
                    placeholder="Email"
                  />
                  <select
                    value={newMemberData.role}
                    onChange={(e) => setNewMemberData({ ...newMemberData, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3E2B66] focus:border-transparent"
                  >
                    <option value="Member">Member</option>
                    <option value="Admin">Admin</option>
                  </select>
                  <button
                    onClick={handleCreateNewMember}
                    className="w-full px-4 py-2 bg-[#3E2B66] text-white rounded-lg font-semibold hover:bg-[#260559] transition-colors"
                  >
                    Create & Add Member
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Members List */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading team members...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No team members found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMembers.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#260559] to-[#3E2B66] flex items-center justify-center text-white font-semibold">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-600">{member.email}</p>
                    </div>
                    <div className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                      {member.role}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(member._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-4"
                    title="Remove from organization"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

