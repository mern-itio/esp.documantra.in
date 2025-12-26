import React, { useState, useEffect } from 'react';
import { Building, Globe, FileText, X } from 'lucide-react';
import type { Organization, UpdateOrganizationRequest } from '../../types/organization';
import { organizationApi } from '../../services/apiHelper';

interface EditOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization | null;
  onSuccess: () => void;
}

export const EditOrganizationModal: React.FC<EditOrganizationModalProps> = ({
  isOpen,
  onClose,
  organization,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<UpdateOrganizationRequest>({
    name: '',
    logo: '',
    website: '',
    gst: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (organization && isOpen) {
      setFormData({
        name: organization.name || '',
        logo: organization.logo || '',
        website: organization.website || '',
        gst: organization.gst || organization.gstNumber || '',
      });
      setErrors({});
    }
  }, [organization, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Organization name is required';
    }

    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Please enter a valid URL';
    }

    if (formData.logo && !isValidUrl(formData.logo)) {
      newErrors.logo = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !organization?._id) {
      return;
    }

    setIsLoading(true);
    try {
      // Placeholder API call - replace with actual endpoint
      const response = await organizationApi.put(
        `/api/organization/${organization._id}`,
        formData
      );

      if (response.status === 200) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error updating organization:', error);
      setErrors({ submit: 'Failed to update organization. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof UpdateOrganizationRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#260559] to-[#3E2B66] rounded-lg">
              <Building className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Organization</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Organization Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#3E2B66] focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter organization name"
              disabled={isLoading}
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Logo URL
            </label>
            <input
              type="url"
              value={formData.logo}
              onChange={(e) => handleChange('logo', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#3E2B66] focus:border-transparent ${
                errors.logo ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="https://example.com/logo.png"
              disabled={isLoading}
            />
            {errors.logo && <p className="mt-1 text-sm text-red-500">{errors.logo}</p>}
            {formData.logo && !errors.logo && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-2">Preview:</p>
                <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                  <img
                    src={formData.logo}
                    alt="Logo preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Website
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#3E2B66] focus:border-transparent ${
                  errors.website ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://www.example.com"
                disabled={isLoading}
              />
            </div>
            {errors.website && <p className="mt-1 text-sm text-red-500">{errors.website}</p>}
          </div>

          {/* GST */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              GST Number
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.gst}
                onChange={(e) => handleChange('gst', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3E2B66] focus:border-transparent"
                placeholder="GST123456789"
                disabled={isLoading}
              />
            </div>
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-[#260559] to-[#3E2B66] text-white rounded-lg font-semibold hover:from-[#3E2B66] hover:to-[#260559] shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

