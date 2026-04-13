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
    } catch (error: unknown) {
      console.error('Error updating organization:', error);
      const e = error as { response?: { data?: { message?: string } } };
      setErrors({ submit: e?.response?.data?.message || 'Failed to update organization. Please try again.' });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60 backdrop-blur-sm">
      <div className="bg-card text-card-foreground border border-border rounded-md shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-3">

            <Building className="w-5 h-5 text-primary" />

            <h2 className="text-2xl  font-bold text-foreground">Edit Organization</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
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
              className={`peer w-full rounded-lg border px-2 py-2 bg-transparent text-foreground text-sm transition-all outline-none ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-input focus:border-primary'
                } focus:ring-2 focus:ring-primary/20`}
              placeholder=" "
              disabled={isLoading}
            />
            <label
              htmlFor="org-name"
              className="pointer-events-none absolute left-4 z-10 origin-left bg-card px-1 text-xs text-muted-foreground transition-all
              top-1/2 -translate-y-1/2
              peer-focus:-top-3 peer-focus:translate-y-0 peer-focus:text-primary
              peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2
              peer-not-placeholder-shown:-top-3 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-primary"            
            >

              Organization Name <span className="text-red-500">*</span>
            </label>
            {errors.name && (
              <span className="absolute right-4 top-2 text-xs font-medium text-red-600 bg-card px-1">
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
                className={`peer w-full rounded-lg border px-2 py-2 bg-transparent text-foreground transition-all outline-none ${errors.logo ? 'border-red-500 focus:border-red-500' : 'border-input focus:border-primary'
                  } focus:ring-2 focus:ring-primary/20`}
                placeholder=" "
                disabled={isLoading}
              />
              <label
                htmlFor="org-logo"
                className={`pointer-events-none absolute left-4 z-10 origin-left transition-all bg-card px-1 ${formData.logo ? '-top-3 text-xs text-primary' : 'top-4 text-sm text-muted-foreground'
                  } peer-focus:-top-3 peer-focus:text-xs peer-focus:text-primary`}
              >
                Logo URL
              </label>
              {errors.logo && (
                <span className="absolute right-4 top-2 text-xs font-medium text-red-600 bg-card px-1">
                  {errors.logo}
                </span>
              )}
            </div>

            <div className="w-24 h-24  overflow-hidden bg-muted border border-border shadow-sm">
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
                <div className="flex h-full w-full items-center justify-center bg-muted text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
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
              className={`peer w-full text-sm rounded-lg border px-2 py-2 bg-transparent text-foreground transition-all outline-none ${errors.website ? 'border-red-500 focus:border-red-500' : 'border-input focus:border-primary'
                } focus:ring-2 focus:ring-primary/20`}
              placeholder=" "
              disabled={isLoading}
            />
            <label
              htmlFor="org-website"
              className="pointer-events-none absolute left-4 z-10 origin-left bg-card px-1 text-xs text-muted-foreground transition-all
              top-1/2 -translate-y-1/2
              peer-focus:-top-3 peer-focus:translate-y-0 peer-focus:text-primary
              peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2
              peer-not-placeholder-shown:-top-3 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-primary"
            >
              Website
            </label>
            {errors.website && (
              <span className="absolute right-4 top-2 text-xs font-medium text-red-600 bg-card px-1">
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
              className="peer w-full text-xs rounded-lg border px-2 py-2 bg-transparent text-foreground transition-all outline-none border-input focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder=" "
              disabled={isLoading}
            />
            <label
              htmlFor="org-gst"
              className="pointer-events-none absolute left-4 z-10 origin-left bg-card px-1 text-xs text-muted-foreground transition-all
              top-1/2 -translate-y-1/2
              peer-focus:-top-3 peer-focus:translate-y-0 peer-focus:text-primary
              peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2
              peer-not-placeholder-shown:-top-3 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-primary"
            >
              GST Number
            </label>
            {errors.gst && (
              <span className="absolute right-4 top-2 text-xs font-medium text-red-600 bg-card px-1">
                {errors.gst}
              </span>
            )}
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-900 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-foreground bg-muted rounded-lg font-semibold hover:bg-muted/80 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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

