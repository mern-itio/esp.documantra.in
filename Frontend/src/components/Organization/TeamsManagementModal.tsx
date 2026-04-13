import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, X, Trash2, Search, UserPlus, Check, ArrowLeft, Mail, User, ChevronDown } from 'lucide-react';
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
  roleId?: { _id: string; name: string; description?: string; },
  status?: string;
}
interface Role {
  _id: string;
  name: string;
}

interface CustomRoleDropdownProps {
  value: string;
  onChange: (value: string) => void;
  onAddRole: () => void;
  roles: Role[];
  placeholder?: string;
  small?: boolean;
}

const CustomRoleDropdown: React.FC<CustomRoleDropdownProps> = ({ 
  value, 
  onChange, 
  onAddRole, 
  roles, 
  placeholder = 'Select a role',
  small = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedRole = roles.find(r => r._id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // Open upward if not enough space below (less than 250px for dropdown)
      setOpenUp(spaceBelow < 280 && spaceAbove > spaceBelow);
    }
  }, [isOpen]);

  const handleSelect = (roleId: string) => {
    if (roleId === 'add-role') {
      onAddRole();
      setIsOpen(false);
    } else {
      onChange(roleId);
      setIsOpen(false);
    }
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between ${
          small 
            ? 'px-2 py-1 text-xs border border-input rounded bg-background' 
            : 'px-3 py-2.5 border-2 border-border rounded-md'
        } bg-background font-medium text-foreground hover:border-border/80 transition-all`}
      >
        <span className={selectedRole ? 'text-foreground font-semibold' : 'text-muted-foreground'}>
          {selectedRole ? selectedRole.name : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute z-50 w-full ${openUp ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg overflow-hidden`}>
          {/* Roles List */}
          <div className="max-h-48 overflow-y-auto">
            {roles.length > 0 ? (
              roles.map((role) => (
                <button
                  key={role._id}
                  onClick={() => handleSelect(role._id)}
                  className={`w-full text-left px-4 py-3 text-sm font-medium transition-all border-b border-border last:border-b-0 ${
                    value === role._id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-popover-foreground hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{role.name}</span>
                    {value === role._id && <Check className="w-4 h-4" />}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-xs text-muted-foreground">No roles available</div>
            )}
          </div>

          {/* Separator */}
          <div className="h-px bg-border" />

          {/* Add Role Option */}
          <button
            onClick={() => handleSelect('add-role')}
            className="w-full text-left px-4 py-3 text-sm font-semibold text-primary hover:bg-accent transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Role</span>
          </button>
        </div>
      )}
    </div>
  );
};

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
  const [availableLoading, setAvailableLoading] = useState(false);
  const [selectedUserRoles, setSelectedUserRoles] = useState<Record<string, string>>({});
  const [roles, setRoles] = useState<Role[]>([]);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [newMemberData, setNewMemberData] = useState({
    name: '',
    email: '',
    roleId: '',
  });

  // When roles are loaded, ensure default role values are set for new member
  useEffect(() => {
    if (roles.length) {
      setNewMemberData((prev) => ({ ...prev, roleId: prev.roleId || roles[0]._id }));
    }
  }, [roles]);

  useEffect(() => {
    if (isOpen && organization?._id) {
      fetchTeamMembers();
      fetchRoles();
    } else if (!isOpen) {
      // Reset add member form when modal closes
      setShowAddMember(false);
      setSearchQuery('');
      setSelectedUsers([]);
      setAvailableUsers([]);
      setAvailableSearchQuery('');
      setSelectedUserRoles({});
      setNewMemberData({ name: '', email: '', roleId: '' });
      setAddMemberMode('existing');
    }
  }, [isOpen, organization]); // eslint-disable-line react-hooks/exhaustive-deps -- load/reset when modal opens; members fetch is stable per org

  useEffect(() => {
    const query = availableSearchQuery.trim();
    if (query.length < 2 || !organization?._id) {
      setAvailableUsers([]);
      return;
    }

    const handler = window.setTimeout(async () => {
      await fetchAvailableUsers(query);
    }, 300);

    return () => window.clearTimeout(handler);
  }, [availableSearchQuery, organization?._id]); // eslint-disable-line react-hooks/exhaustive-deps -- debounced search; fetchAvailableUsers tied to org

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

  const fetchAvailableUsers = async (query: string) => {
    if (!organization?._id || !query || query.trim().length < 2) {
      setAvailableUsers([]);
      return;
    }

    setAvailableLoading(true);
    try {
      const response = await organizationApi.get(
        `/api/organization/fetch-available-users/${organization._id}?q=${encodeURIComponent(query.trim())}`
      );

      if (response.status === 200) {
        const payload = response.data?.data ?? response.data;
        const users = Array.isArray(payload) ? payload : [];
        setAvailableUsers(users);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setAvailableUsers([]);
    } finally {
      setAvailableLoading(false);
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
        `/api/organization/remove/${organization._id}/members/${memberId}`
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
    setAddingMember(true);
    if (selectedUsers.length === 0 || !organization?._id) {
      setAddingMember(false);
      return;
    }
    // Prevent adding if organization has no roles defined
    if (roles.length === 0) {
      alert('No roles exist for this organization — please create a role first.');
      setAddingMember(false);
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
    } finally {
      setAddingMember(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60 backdrop-blur-sm">
      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-2xl w-full max-w-xl mx-4  flex flex-col">
        {/* Header */}
        <div className="flex items-center p-6 justify-between border-b border-border">
          <div className="flex items-center gap-3">

            <button
              onClick={() => {
                setShowAddMember(false);
                setSelectedUsers([]);
                setSearchQuery('');
                setAddMemberMode('existing');
              }}
            >
              <ArrowLeft className="w-4 h-4 flex text-muted-foreground hover:text-foreground" />
            </button>

            <div>
              <h2 className="text-2xl font-bold text-foreground">Team Management</h2>
              <p className="text-sm text-muted-foreground">{organization?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
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
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="Search team members..."
                  />
                </div>
                <button
                  onClick={() => setShowAddMember(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Member</span>
                </button>
              </div>

              {/* Members List */}
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading team members...</p>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-muted-foreground">No team members found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMembers.map((member) => (
                    <div
                      key={member._id}
                      className="flex items-center justify-between p-4 bg-muted/40 rounded-lg border border-border hover:bg-muted/60 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-semibold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{member?.name || member?.fullname}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                        <div
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${member.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300'
                            : member.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300'
                              : member.status === 'DISABLED'
                                ? 'bg-muted text-muted-foreground'
                                : member.status === 'REJECTED'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                            }`}
                        >
                          {member.status}
                        </div>
                        <div className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 text-xs font-semibold rounded-full">
                          {member.role || member?.roleId?.name}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member._id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors ml-4"
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
                <div className="p-4 bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-900 rounded-lg mb-4">
                  <p className="text-yellow-800 dark:text-yellow-200">
                    No roles exist for this organization. Please create roles before adding members.
                  </p>
                  <div className="mt-3">
                    <button
                      onClick={() => setShowCreateRoleModal(true)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Create Role
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Tab Switcher */}
                  <div className="flex gap-2 bg-muted p-1.5 rounded-lg w-fit">
                    <button
                      onClick={() => setAddMemberMode('existing')}
                      className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${
                        addMemberMode === 'existing'
                          ? 'bg-card text-primary shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4" />
                        Add Existing
                      </span>
                    </button>
                    <button
                      onClick={() => setAddMemberMode('new')}
                      className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${
                        addMemberMode === 'new'
                          ? 'bg-card text-primary shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Invite New
                      </span>
                    </button>
                  </div>

                  {/* Existing Member Mode */}
                  {addMemberMode === 'existing' && (
                    <div className="bg-muted/30 border border-border rounded-xl p-5 space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Search User</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
                          <input
                            type="text"
                            value={availableSearchQuery}
                            onChange={(e) => setAvailableSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-input rounded-lg bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Type name or email..."
                          />
                        </div>
                        {availableSearchQuery.trim().length < 2 && (
                          <p className="text-xs text-muted-foreground mt-1.5">Enter at least 2 characters</p>
                        )}
                      </div>

                      {/* Results */}
                      {availableSearchQuery.trim().length >= 2 && (
                        <div>
                          {availableLoading ? (
                            <div className="text-center py-8">
                              <div className="inline-block animate-spin">
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                              </div>
                              <p className="text-sm text-muted-foreground mt-2">Searching...</p>
                            </div>
                          ) : availableUsers.length > 0 ? (
                            <div className="border border-border rounded-lg overflow-hidden">
                              {availableUsers.map((user, index) => (
                                <div
                                  key={user._id}
                                  onClick={() => {
                                    setSelectedUsers((prev) => {
                                      if (prev.includes(user._id)) {
                                        setSelectedUserRoles((r) => {
                                          const copy = { ...r };
                                          delete copy[user._id];
                                          return copy;
                                        });
                                        return prev.filter((id) => id !== user._id);
                                      }
                                      setSelectedUserRoles((r) => ({ ...r, [user._id]: roles[0]?._id || '' }));
                                      return [...prev, user._id];
                                    });
                                  }}
                                  className={`p-3 cursor-pointer transition-colors ${
                                    index !== availableUsers.length - 1 ? 'border-b border-border' : ''
                                  } ${selectedUsers.includes(user._id) ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
                                        {(user.name || user.fullname)?.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-semibold text-foreground text-sm truncate">{user.name || user.fullname}</p>
                                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                      </div>
                                    </div>
                                    {selectedUsers.includes(user._id) && (
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <div className="w-32">
                                          <CustomRoleDropdown
                                            value={selectedUserRoles[user._id] || (roles[0]?._id ?? '')}
                                            onChange={(newValue) =>
                                              setSelectedUserRoles((prev) => ({ ...prev, [user._id]: newValue }))
                                            }
                                            onAddRole={() => setShowCreateRoleModal(true)}
                                            roles={roles}
                                            placeholder="Select role"
                                            small={true}
                                          />
                                        </div>
                                        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-6 text-center bg-blue-50 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-900 rounded-lg">
                              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-3">No users found</p>
                              <button
                                onClick={() => {
                                  setAddMemberMode('new');
                                  setNewMemberData({
                                    name: availableSearchQuery.trim(),
                                    email: availableSearchQuery.includes('@') ? availableSearchQuery.trim() : '',
                                    roleId: roles[0]?._id || ''
                                  });
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                                Invite as New User
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Add Button */}
                      {selectedUsers.length > 0 && (
                        <button
                          onClick={handleAddExistingMember}
                          disabled={addingMember}
                          className={`w-full px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                            addingMember
                              ? 'bg-muted text-muted-foreground cursor-not-allowed'
                              : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg'
                          }`}
                        >
                          {addingMember ? 'Adding...' : `Add ${selectedUsers.length} Member${selectedUsers.length > 1 ? 's' : ''}`}
                        </button>
                      )}
                    </div>
                  )}

                  {/* New Member Mode */}
                  {addMemberMode === 'new' && (
                    <div className="bg-muted/30 border border-border rounded-xl p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">Full Name</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <input
                              type="text"
                              value={newMemberData.name}
                              onChange={(e) => setNewMemberData({ ...newMemberData, name: e.target.value })}
                              className="w-full pl-10 pr-4 py-2.5 border border-input rounded-md bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                              placeholder="John Doe"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">Email Address</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <input
                              type="email"
                              value={newMemberData.email}
                              onChange={(e) => setNewMemberData({ ...newMemberData, email: e.target.value })}
                              className="w-full pl-10 pr-4 py-2.5 border border-input rounded-md bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                              placeholder="john@example.com"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-foreground">Assign Role</label>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                          <div className="flex-1 min-w-0">
                            <CustomRoleDropdown
                              value={newMemberData.roleId}
                              onChange={(newValue) => setNewMemberData({ ...newMemberData, roleId: newValue })}
                              onAddRole={() => setShowCreateRoleModal(true)}
                              roles={roles}
                              placeholder="Select a role"
                              small={false}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                         
                        <button
                          onClick={() => {
                            setAddMemberMode('existing');
                            setNewMemberData({ name: '', email: '', roleId: '' });
                          }}
                          className=" w-auto px-4 py-2.5 border border-border rounded-md font-semibold text-sm text-foreground hover:bg-accent transition-colors"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleCreateNewMember}
                          className="w-auto px-4 py-2.5 bg-primary text-primary-foreground rounded-md font-semibold text-sm hover:bg-primary/90 hover:shadow-lg transition-all duration-200"
                        >
                          <span className="flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" />
                            Invite Member
                          </span>
                        </button>
                      </div>
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

