import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { organizationApi } from '../../services/apiHelper';

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId?: string | null;
  onCreated?: () => void;
  role?: {
    _id: string;
    name: string;
    description?: string;
    permissions?:
      {
        permissions?: {
          ENVELOPE_CREATE: boolean;
          ENVELOPE_SHARE: boolean;
          FOLDER_CREATE: boolean;
          FOLDER_SHARE: boolean;
          ORG_SHARE: boolean;
          ORG_SETTINGS_EDIT: boolean;
        }
    };
  };
}

export const CreateRoleModal: React.FC<CreateRoleModalProps> = ({ isOpen, onClose, organizationId, onCreated, role }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState({
    ENVELOPE_CREATE: false,
    ENVELOPE_SHARE: false,
    FOLDER_CREATE: false,
    FOLDER_SHARE: false,
    ORG_SHARE: false,
    ORG_SETTINGS_EDIT: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = !!role;

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role?.description || '');
      setPermissions(role?.permissions?.permissions || {
        ENVELOPE_CREATE: false,
        ENVELOPE_SHARE: false,
        FOLDER_CREATE: false,
        FOLDER_SHARE: false,
        ORG_SHARE: false,
        ORG_SETTINGS_EDIT: false
      });
    } else {
      setName('');
      setDescription('');
      setPermissions({
        ENVELOPE_CREATE: false,
        ENVELOPE_SHARE: false,
        FOLDER_CREATE: false,
        FOLDER_SHARE: false,
        ORG_SHARE: false,
        ORG_SETTINGS_EDIT: false
      });
    }
  }, [role]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!name || (!organizationId && !isEdit)) return;
    setIsSubmitting(true);
    try {
      let response;
      if (isEdit && role) {
        response = await organizationApi.post(`/api/organization/update-role/${role._id}`, { name, description, permissions });
      } else {
        response = await organizationApi.post(`/api/organization/create-role/${organizationId}`, { name, description, permissions });
      }
      if (response.status === 200 || response.status === 201) {
        setName('');
        setDescription('');
        setPermissions({
          ENVELOPE_CREATE: false,
          ENVELOPE_SHARE: false,
          FOLDER_CREATE: false,
          FOLDER_SHARE: false,
          ORG_SHARE: false,
          ORG_SETTINGS_EDIT: false
        });
        onCreated?.();
        onClose();
      } else {
        alert(`Failed to ${isEdit ? 'update' : 'create'} role.`);
      }
    } catch (err) {
      console.error(`${isEdit ? 'Update' : 'Create'} role error`, err);
      alert(`Failed to ${isEdit ? 'update' : 'create'} role.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePermissionChange = (key: keyof typeof permissions) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{isEdit ? 'Edit Role' : 'Create Role'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <label className="block text-sm text-gray-700 mb-2">Role Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#3E2B66] mb-4"
            placeholder="e.g. Contributor"
          />
          <label className="block text-sm text-gray-700 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#3E2B66] mb-4"
            placeholder="Optional description"
            rows={3}
          />
          <label className="block text-sm text-gray-700 mb-2">Permissions</label>
          <div className="space-y-2 mb-4">
            {Object.entries(permissions).map(([key, value]) => (
              <div key={key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => handlePermissionChange(key as keyof typeof permissions)}
                  className="mr-2"
                />
                <label className="text-sm">{key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</label>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isSubmitting || !name}
              className="px-4 py-2 bg-[#3E2B66] text-white rounded-lg disabled:opacity-60 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Role' : 'Create Role')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRoleModal;
