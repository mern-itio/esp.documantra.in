import React, { useState, useEffect } from 'react';
import { X, Shield, FileSignature, FolderOpen, Building2, Loader2 } from 'lucide-react';
import { organizationApi } from '../../services/apiHelper';

type PermissionKey =
  | 'ENVELOPE_CREATE'
  | 'ENVELOPE_SHARE'
  | 'FOLDER_CREATE'
  | 'FOLDER_SHARE'
  | 'ORG_SHARE'
  | 'ORG_SETTINGS_EDIT';

type Permissions = Record<PermissionKey, boolean>;

const DEFAULT_PERMISSIONS: Permissions = {
  ENVELOPE_CREATE:   false,
  ENVELOPE_SHARE:    false,
  FOLDER_CREATE:     false,
  FOLDER_SHARE:      false,
  ORG_SHARE:         false,
  ORG_SETTINGS_EDIT: false,
};

interface PermissionMeta {
  label: string;
  description: string;
  icon: React.ReactNode;
  group: string;
}

const PERMISSION_META: Record<PermissionKey, PermissionMeta> = {
  ENVELOPE_CREATE:   { label: 'Create Envelopes',   description: 'Can create and send signature envelopes', icon: <FileSignature className="w-4 h-4" />, group: 'Documents' },
  ENVELOPE_SHARE:    { label: 'Share Envelopes',    description: 'Can share envelopes with others',          icon: <FileSignature className="w-4 h-4" />, group: 'Documents' },
  FOLDER_CREATE:     { label: 'Create Folders',     description: 'Can create document folders',              icon: <FolderOpen    className="w-4 h-4" />, group: 'Folders'   },
  FOLDER_SHARE:      { label: 'Share Folders',      description: 'Can share folders with team members',      icon: <FolderOpen    className="w-4 h-4" />, group: 'Folders'   },
  ORG_SHARE:         { label: 'Share Organization', description: 'Can invite members to the organization',   icon: <Building2     className="w-4 h-4" />, group: 'Organization' },
  ORG_SETTINGS_EDIT: { label: 'Edit Settings',      description: 'Can modify organization settings',         icon: <Building2     className="w-4 h-4" />, group: 'Organization' },
};

const PERMISSION_GROUPS: { id: string; label: string; keys: PermissionKey[] }[] = [
  { id: 'Documents',    label: 'Documents',    keys: ['ENVELOPE_CREATE', 'ENVELOPE_SHARE'] },
  { id: 'Folders',      label: 'Folders',      keys: ['FOLDER_CREATE',   'FOLDER_SHARE']   },
  { id: 'Organization', label: 'Organization', keys: ['ORG_SHARE',       'ORG_SETTINGS_EDIT'] },
];

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId?: string | null;
  onCreated?: () => void;
  role?: {
    _id: string;
    name: string;
    description?: string;
    permissions?: {
      permissions?: Permissions;
    };
  };
}

const Toggle: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
      checked ? 'bg-[#260559]' : 'bg-gray-200'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`}
    />
  </button>
);

const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  isOpen, onClose, organizationId, onCreated, role,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<Permissions>({ ...DEFAULT_PERMISSIONS });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!role;

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description || '');
      setPermissions({ ...DEFAULT_PERMISSIONS, ...(role.permissions?.permissions || {}) });
    } else {
      setName('');
      setDescription('');
      setPermissions({ ...DEFAULT_PERMISSIONS });
    }
    setError('');
  }, [role, isOpen]);

  if (!isOpen) return null;

  const togglePermission = (key: PermissionKey) =>
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));

  const enabledCount = Object.values(permissions).filter(Boolean).length;

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Role name is required.'); return; }
    if (!organizationId && !isEdit) { setError('Organization not found.'); return; }
    setError('');
    setIsSubmitting(true);
    try {
      const payload = { name: name.trim(), description: description.trim(), permissions };
      const url = isEdit && role
        ? `/api/organization/update-role/${role._id}`
        : `/api/organization/create-role/${organizationId}`;
      const response = await organizationApi.post(url, payload);
      if (response.status === 200 || response.status === 201) {
        onCreated?.();
        onClose();
      } else {
        setError(`Failed to ${isEdit ? 'update' : 'create'} role. Please try again.`);
      }
    } catch (err) {
      console.error(err);
      setError(`Failed to ${isEdit ? 'update' : 'create'} role. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#260559] flex items-center justify-center shadow-sm">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {isEdit ? 'Edit Role' : 'Create New Role'}
              </h2>
              <p className="text-xs text-gray-400">
                {isEdit ? 'Update role name and permissions' : 'Define a role and grant permissions'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Role name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Role Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Contributor, Reviewer, Manager"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#260559]/20 focus:border-[#260559] transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Description
              <span className="ml-1.5 text-xs font-normal text-gray-400">optional</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe what this role is for..."
              rows={2}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#260559]/20 focus:border-[#260559] transition-colors resize-none"
            />
          </div>

          {/* Permissions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700">Permissions</label>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                enabledCount > 0
                  ? 'bg-[#260559]/8 text-[#260559]'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {enabledCount} / {Object.keys(DEFAULT_PERMISSIONS).length} enabled
              </span>
            </div>

            <div className="space-y-5">
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.id}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    {group.label}
                  </p>
                  <div className="space-y-2">
                    {group.keys.map((key) => {
                      const meta = PERMISSION_META[key];
                      const enabled = permissions[key];
                      return (
                        <div
                          key={key}
                          onClick={() => togglePermission(key)}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                            enabled
                              ? 'bg-[#260559]/4 border-[#260559]/20'
                              : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              enabled ? 'bg-[#260559]/10 text-[#260559]' : 'bg-gray-200 text-gray-500'
                            }`}>
                              {meta.icon}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{meta.label}</p>
                              <p className="text-xs text-gray-400">{meta.description}</p>
                            </div>
                          </div>
                          <Toggle checked={enabled} onChange={() => togglePermission(key)} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#260559] rounded-lg hover:bg-[#34106a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {isEdit ? 'Saving...' : 'Creating...'}
              </>
            ) : (
              isEdit ? 'Save Changes' : 'Create Role'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRoleModal;
export { CreateRoleModal };
