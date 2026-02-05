import React, { useState, useEffect } from 'react';
import { Users, Plus, X, Trash2, Search, UserPlus, Check } from 'lucide-react';
import type { Organization } from '../../types/organization';
import { organizationApi } from '../../services/apiHelper';
import CreateRoleModal from './CreateRoleModal';

interface TeamMember {
  _id: string;
  name: string;
  fullname?: string;
  email: string;
  role: string;
  avatar?: string;
  roleId?: { _id: string; name: string; description?: string;},
}
interface Role {
  _id: string;
  name: string;
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
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [availableSearchQuery, setAvailableSearchQuery] = useState('');
  const [selectedUserRoles, setSelectedUserRoles] = useState<Record<string, string>>({});
  const [roles, setRoles] = useState<Role[]>([]);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [newMemberData, setNewMemberData] = useState({
    name: '',
    email: '',
    roleId: '',
  });

  // When roles are loaded, ensure default role values are set for new member
  useEffect(() => {
    if (roles.length) {
      setNewMemberData((prev) => ({ ...prev, role: prev.roleId || roles[0]._id }));
    }
  }, [roles]);

  useEffect(() => {
    if (isOpen && organization?._id) {
      fetchTeamMembers();
      fetchAvailableUsers();
      fetchRoles();
    } else if (!isOpen) {
      // Reset add member form when modal closes
      setShowAddMember(false);
      setSearchQuery('');
      setSelectedUsers([]);
      setAvailableSearchQuery('');
      setSelectedUserRoles({});
      setNewMemberData({ name: '', email: '', roleId: '' });
      setAddMemberMode('existing');
    }
  }, [isOpen, organization]);

  const fetchTeamMembers = async () => {
    if (!organization?._id) return;

    setIsLoading(true);
    try {
      // Placeholder API call - replace with actual endpoint
      const response = await organizationApi.get(`/api/organization/members/${organization._id}`);
      if (response.status === 200) {
        const payload = response.data?.data ?? response.data;
        setMembers(Array.isArray(payload) ? payload : []);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      // Placeholder API call - replace with actual endpoint
      const response = await organizationApi.get(`/api/organization/fetch-available-users/${organization?._id}`);
      
      if (response.status === 200) {
        const payload = response.data?.data ?? response.data;
        console.log("Available Users:", payload);
        setAvailableUsers(Array.isArray(payload) ? payload : []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };
  const fetchRoles = async () => {
    try {
      // Placeholder API call - replace with actual endpoint
      const response = await organizationApi.get(`/api/organization/fetch-roles/${organization?._id}`);
      
      if (response.status === 200) {
        const payload = response.data?.data ?? response.data;
        setRoles(Array.isArray(payload) ? payload : []);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
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
    if (selectedUsers.length === 0 || !organization?._id) return;
    // Prevent adding if organization has no roles defined
    if (roles.length === 0) {
      alert('No roles exist for this organization — please create a role first.');
      return;
    }

    try {
      // Add each selected user sequentially
      for (const userId of selectedUsers) {
        const user = availableUsers.find((u) => u._id === userId);
        const roleId = selectedUserRoles[userId] || roles[0]?._id || '';
        const payload = {
          userId,
          name: user?.fullname || user?.name,
          email: user?.email,
          roleId,
        };

        const response = await organizationApi.post(
          `/api/organization/members/${organization._id}`,
          payload
        );

        if (response.status === 200 || response.status === 201) {
          if (user) {
            console.log("Added User:", user, "with Role ID:", roleId);
            const roleName = roles.find((r) => r._id === roleId)?.name || roleId;
            setMembers((prev) => [...prev, { ...user, role: roleName }] as TeamMember[]);
          }
        }
      }

      // Cleanup after adding
      setSelectedUsers([]);
      setSelectedUserRoles({});
      setAvailableSearchQuery('');
      setAvailableUsers([]);
      setShowAddMember(false);
    } catch (error) {
      console.error('Error adding members:', error);
      alert('Failed to add one or more members. Please try again.');
    }
  };

  const handleCreateNewMember = async () => {
    if (!newMemberData.name || !newMemberData.email || !organization?._id) return;

    // Prevent creating member if no roles exist for the organization
    if (roles.length === 0) {
      alert('No roles exist for this organization — please create a role first.');
      return;
    }

    try {
      // Placeholder API call - replace with actual endpoint
      const response = await organizationApi.post(
        `/api/organization/members/${organization._id}`,
        newMemberData
      );

      if (response.status === 200 || response.status === 201) {
        const payload = response.data?.data ?? response.data;
        setMembers((prev) => [...prev, payload]);
        setNewMemberData({ name: '', email: '', roleId: roles[0]?._id ?? '' });
        setShowAddMember(false);
      }
    } catch (error) {
      console.error('Error creating member:', error);
      alert('Failed to create member. Please try again.');
    }
  };

  if (!isOpen) return null;

  const filteredMembers = members.filter(
    (member) =>
      member?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
          {/* Show Member List View or Add Member View */}
          {!showAddMember ? (
            <>
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
                  onClick={() => setShowAddMember(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#260559] to-[#3E2B66] text-white rounded-lg font-semibold hover:from-[#3E2B66] hover:to-[#260559] shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Member</span>
                </button>
              </div>

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
                          <p className="font-semibold text-gray-900">{member?.name || member?.fullname}</p>
                          <p className="text-sm text-gray-600">{member.email}</p>
                        </div>
                        <div className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          {member.role || member?.roleId?.name}
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
            </>
          ) : (
            <>
              {/* Add Member Form */}
              {roles.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                  <p className="text-yellow-800">
                    No roles exist for this organization. Please create roles before adding members.
                  </p>
                  <div className="mt-3">
                    <button
                      onClick={() => setShowCreateRoleModal(true)}
                      className="px-4 py-2 bg-[#3E2B66] text-white rounded-lg font-semibold hover:bg-[#260559] transition-colors"
                    >
                      Create Role
                    </button>
                  </div>
                </div>
              ):(
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-[#3E2B66]" />
                    <h3 className="font-semibold text-gray-900">Add Team Member</h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddMember(false);
                      setSelectedUsers([]);
                      setSearchQuery('');
                      setAddMemberMode('existing');
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    <span>← Back</span>
                  </button>
                </div>

                {/* Tabs for Existing vs New */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => {
                      setAddMemberMode('existing');
                      setSelectedUsers([]);
                      setNewMemberData({ name: '', email: '', roleId: roles[0]?._id ?? '' });
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
                      setSelectedUsers([]);
                      setNewMemberData({ name: '', email: '', roleId: roles[0]?._id ?? '' });
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
                            value={availableSearchQuery}
                            onChange={(e) => setAvailableSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3E2B66] focus:border-transparent"
                            placeholder="Search by name or email..."
                          />
                        </div>
                        {availableUsers.filter((u) =>
                          `${u.name} ${u.email}`.toLowerCase().includes(availableSearchQuery.toLowerCase())
                        ).length > 0 && (
                          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                                {availableUsers
                                  .filter((u) => `${u?.fullname} ${u.email}`.toLowerCase().includes(availableSearchQuery.toLowerCase()))
                                  .map((user) => (
                                    <div
                                      key={user._id}
                                      onClick={() => {
                                        setSelectedUsers((prev) => {
                                          if (prev.includes(user._id)) {
                                            // deselect and remove role
                                            setSelectedUserRoles((r) => {
                                              const copy = { ...r };
                                              delete copy[user._id];
                                              return copy;
                                            });
                                            return prev.filter((id) => id !== user._id);
                                          }
                                          // select and set default role
                                          setSelectedUserRoles((r) => ({ ...r, [user._id]: roles[0]?._id || '' }));
                                          return [...prev, user._id];
                                        });
                                      }}
                                      className={`p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0 flex items-center justify-between ${
                                        selectedUsers.includes(user._id) ? 'bg-blue-50' : ''
                                      }`}
                                    >
                                      <div>
                                        <p className="font-medium text-gray-900">{user.fullname}</p>
                                        <p className="text-sm text-gray-600">{user.email}</p>
                                      </div>
                                      <div className="ml-2 flex items-center gap-2">
                                        {selectedUsers.includes(user._id) ? (
                                          <>
                                            <select
                                              value={selectedUserRoles[user._id] || (roles[0]?._id ?? '')}
                                              onChange={(e) =>
                                                setSelectedUserRoles((prev) => ({ ...prev, [user._id]: e.target.value }))
                                              }
                                              className="px-2 py-1 border border-gray-300 rounded"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              {roles.length > 0 && (
                                                roles.map((r) => (
                                                  <option key={r._id} value={r._id}>
                                                    {r.name}
                                                  </option>
                                                ))
                                              ) }
                                            </select>
                                            <Check className="w-5 h-5 text-green-600" />
                                          </>
                                        ) : null}
                                      </div>
                                    </div>
                                  ))}
                          </div>
                        )}
                        {selectedUsers.length > 0 && (
                          <button
                            onClick={handleAddExistingMember}
                            className="w-full px-4 py-2 bg-[#3E2B66] text-white rounded-lg font-semibold hover:bg-[#260559] transition-colors"
                          >
                            Add Selected Member{selectedUsers.length > 1 ? ` (${selectedUsers.length})` : ''}
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
                      value={newMemberData.roleId}
                      onChange={(e) => setNewMemberData({ ...newMemberData, roleId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3E2B66] focus:border-transparent"
                    >
                      {roles.length > 0 ? (
                        roles.map((r) => (
                          <option key={r._id} value={r._id}>
                            {r.name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Member">Member</option>
                          <option value="Admin">Admin</option>
                        </>
                      )}
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
            </>
          )}
        </div>
        <CreateRoleModal
          isOpen={showCreateRoleModal}
          onClose={() => setShowCreateRoleModal(false)}
          organizationId={organization?._id}
          onCreated={fetchRoles}
        />
      </div>
    </div>
  );
};

