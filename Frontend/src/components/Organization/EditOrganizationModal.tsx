import React, { useState, useEffect } from 'react';
import { Building, X } from 'lucide-react';
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
      const response = await organizationApi.patch(
        `/api/organization/update/${organization._id}`,
        formData
      );

      if (response.status === 200) {
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Error updating organization:', error);
      setErrors({ submit: error?.response?.data?.message || 'Failed to update organization. Please try again.' });
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
      <div className="bg-white rounded-md shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">

            <Building className="w-5 h-5 text-[#260559]" />

            <h2 className="text-2xl thankyou-heading font-bold text-gray-900">Edit Organization</h2>
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
          <div className="relative mb-[10px]">
            <input
              id="org-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`peer w-full rounded-lg border px-2 py-2 bg-transparent text-gray-900 text-sm transition-all outline-none ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#3E2B66]'
                } focus:ring-2 focus:ring-[#3E2B66]/20`}
              placeholder=" "
              disabled={isLoading}
            />
            <label
              htmlFor="org-name"
              className="pointer-events-none absolute left-4 z-10 origin-left bg-white px-1 text-xs text-gray-500 transition-all
              top-1/2 -translate-y-1/2
              peer-focus:-top-3 peer-focus:translate-y-0 peer-focus:text-[#260559]
              peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2
              peer-not-placeholder-shown:-top-3 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-[#260559]"            
            >

              Organization Name <span className="text-red-500">*</span>
            </label>
            {errors.name && (
              <span className="absolute right-4 top-2 text-xs font-medium text-red-600 bg-white px-1">
                {errors.name}
              </span>
            )}
          </div>

          {/* Logo URL */}
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-center">
            <div className="relative">
              <input
                id="org-logo"
                type="url"
                value={formData.logo}
                onChange={(e) => handleChange('logo', e.target.value)}
                className={`peer w-full rounded-lg border px-2 py-2 bg-transparent text-gray-900 transition-all outline-none ${errors.logo ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#3E2B66]'
                  } focus:ring-2 focus:ring-[#3E2B66]/20`}
                placeholder=" "
                disabled={isLoading}
              />
              <label
                htmlFor="org-logo"
                className={`pointer-events-none absolute left-4 z-10 origin-left transition-all bg-white px-1 ${formData.logo ? '-top-3 text-xs text-[#260559]' : 'top-4 text-sm text-gray-500'
                  } peer-focus:-top-3 peer-focus:text-xs peer-focus:text-[#260559]`}
              >
                Logo URL
              </label>
              {errors.logo && (
                <span className="absolute right-4 top-2 text-xs font-medium text-red-600 bg-white px-1">
                  {errors.logo}
                </span>
              )}
            </div>

            <div className="w-24 h-24  overflow-hidden bg-white border border-gray-200 shadow-sm">
              {formData.logo && !errors.logo ? (
                <img
                  src={formData.logo}
                  alt="Logo preview"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  no preview
                </div>
              )}
            </div>

          </div>

          {/* Website */}
          <div className="relative mt-[-10px]">

            <input
              id="org-website"
              type="url"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              className={`peer w-full text-sm rounded-lg border px-2 py-2 bg-transparent text-gray-900 transition-all outline-none ${errors.website ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#3E2B66]'
                } focus:ring-2 focus:ring-[#3E2B66]/20`}
              placeholder=" "
              disabled={isLoading}
            />
            <label
              htmlFor="org-website"
              className="pointer-events-none absolute left-4 z-10 origin-left bg-white px-1 text-xs text-gray-500 transition-all
              top-1/2 -translate-y-1/2
              peer-focus:-top-3 peer-focus:translate-y-0 peer-focus:text-[#260559]
              peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2
              peer-not-placeholder-shown:-top-3 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-[#260559]"
            >
              Website
            </label>
            {errors.website && (
              <span className="absolute right-4 top-2 text-xs font-medium text-red-600 bg-white px-1">
                {errors.website}
              </span>
            )}
          </div>

          {/* GST */}
          <div className="relative">

            <input
              id="org-gst"
              type="text"
              value={formData.gst}
              onChange={(e) => handleChange('gst', e.target.value)}
              className="peer w-full text-xs rounded-lg border px-2 py-2 bg-transparent text-gray-900 transition-all outline-none border-gray-300 focus:border-[#3E2B66] focus:ring-2 focus:ring-[#3E2B66]/20"
              placeholder=" "
              disabled={isLoading}
            />
            <label
              htmlFor="org-gst"
              className="pointer-events-none absolute left-4 z-10 origin-left bg-white px-1 text-xs text-gray-500 transition-all
              top-1/2 -translate-y-1/2
              peer-focus:-top-3 peer-focus:translate-y-0 peer-focus:text-[#260559]
              peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2
              peer-not-placeholder-shown:-top-3 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-[#260559]"
            >
              GST Number
            </label>
            {errors.gst && (
              <span className="absolute right-4 top-2 text-xs font-medium text-red-600 bg-white px-1">
                {errors.gst}
              </span>
            )}
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

