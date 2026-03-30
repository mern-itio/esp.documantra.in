import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { Organization } from '../../types/organization';
import { organizationApi } from '../../services/apiHelper';

interface DeleteOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization | null;
  onSuccess: () => void;
}

export const DeleteOrganizationModal: React.FC<DeleteOrganizationModalProps> = ({
  isOpen,
  onClose,
  organization,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!organization?._id) return;

    setIsLoading(true);
    try {
      // Placeholder API call - replace with actual endpoint
      const response = await organizationApi.delete(`/api/organization/delete/${organization._id}`);
 
      if (response.status === 200 || response.status === 204) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error deleting organization:', error);
      alert('Failed to delete organization. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Delete Organization</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete <span className="font-semibold text-gray-900">{organization?.name}</span>?
          </p>
          <p className="text-sm text-gray-600 mb-6">
            This action cannot be undone. All data associated with this organization will be permanently deleted.
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Yes, Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

