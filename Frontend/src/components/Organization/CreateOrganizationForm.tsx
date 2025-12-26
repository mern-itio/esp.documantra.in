import React, { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Globe, FileText, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import type { CreateOrganizationRequest } from '../../types/organization';
import { organizationApi } from '../../services/apiHelper';

interface CreateOrganizationFormProps {
  onSuccess?: (organization: any) => void;
}

export const CreateOrganizationForm: React.FC<CreateOrganizationFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [success, setSuccess] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateOrganizationRequest>({
    name: '',
    logo: '',
    website: '',
    gst: ''
  });

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Organization name is required';
        if (value.trim().length < 2) return 'Organization name must be at least 2 characters';
        return '';
      case 'website':
        if (value.trim()) {
          const urlPattern = /^https?:\/\/.+\..+/i;
          if (!urlPattern.test(value.trim())) return 'Please enter a valid website URL';
        }
        return '';
      case 'gst':
        // GST is optional, no validation needed
        return '';
      case 'logo':
        if (value.trim()) {
          const urlPattern = /^https?:\/\/.+\..+/i;
          if (!urlPattern.test(value.trim())) return 'Please enter a valid logo URL';
        }
        return '';
      default:
        return '';
    }
  };

  const validateAll = (): boolean => {
    const nextErrors: { [key: string]: string } = {};
    
    ['name', 'logo', 'website', 'gst'].forEach((field) => {
      const error = validateField(field, (formData as any)[field] || '');
      if (error) nextErrors[field] = error;
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    
    // Update logo preview if logo URL changes
    if (name === 'logo' && value) {
      setLogoPreview(value);
    }
  };


const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setFormError('');
  setSuccess(false);

  if (!validateAll()) return;

  setIsLoading(true);

  try {
    // Send request with JSON payload (no documents needed for creation)
    const response = await organizationApi.post('/api/organization/create', {
      name: formData.name,
      logo: formData.logo || undefined,
      website: formData.website || undefined,
      gst: formData.gst || undefined
    });

    setSuccess(true);

    if (onSuccess) {
      onSuccess(response.data.data);
    } else {
      setTimeout(() => {
        navigate('/organization');
      }, 2000);
    }
  } catch (err: any) {
    console.error('Error creating organization:', err);
    setFormError(err.response?.data?.message || err.message || 'Failed to create organization. Please try again.');
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-[#260559] to-[#3E2B66] rounded-lg">
              <Building className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Create Organization</h1>
          </div>
          <p className="text-gray-600 text-sm">
            Set up your organization profile to get started. You can verify your organization later to unlock additional features.
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-green-800 text-sm font-medium">
              Organization created successfully! You can now verify your organization to unlock additional features.
            </p>
          </div>
        )}

        {/* Error Message */}
        {formError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-center gap-3 animate-shake">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-600 text-sm font-medium">{formError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Organization Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              Organization Name <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <Building className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors duration-300 ${
                errors.name ? 'text-red-500' : 'text-gray-400 group-focus-within:text-[#3E2B66]'
              }`} />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 text-sm border-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#3E2B66]/20 ${
                  errors.name
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-gray-300 focus:border-[#3E2B66] hover:border-gray-400'
                }`}
                placeholder="Acme Corporation"
                required
              />
            </div>
            {errors.name && (
              <p className="text-red-600 text-xs mt-1 animate-fade-in">{errors.name}</p>
            )}
          </div>

          {/* Website */}
          <div>
            <label htmlFor="website" className="block text-sm font-semibold text-gray-700 mb-2">
              Website URL
            </label>
            <div className="relative group">
              <Globe className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors duration-300 ${
                errors.website ? 'text-red-500' : 'text-gray-400 group-focus-within:text-[#3E2B66]'
              }`} />
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 text-sm border-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#3E2B66]/20 ${
                  errors.website
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-gray-300 focus:border-[#3E2B66] hover:border-gray-400'
                }`}
                placeholder="https://www.example.com"
              />
            </div>
            {errors.website && (
              <p className="text-red-600 text-xs mt-1 animate-fade-in">{errors.website}</p>
            )}
          </div>

          {/* GST Number */}
          <div>
            <label htmlFor="gst" className="block text-sm font-semibold text-gray-700 mb-2">
              GST Number
            </label>
            <div className="relative group">
              <FileText className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors duration-300 ${
                errors.gst ? 'text-red-500' : 'text-gray-400 group-focus-within:text-[#3E2B66]'
              }`} />
              <input
                type="text"
                id="gst"
                name="gst"
                value={formData.gst}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 text-sm border-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#3E2B66]/20 ${
                  errors.gst
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-gray-300 focus:border-[#3E2B66] hover:border-gray-400'
                }`}
                placeholder="GST123456789"
              />
            </div>
            {errors.gst && (
              <p className="text-red-600 text-xs mt-1 animate-fade-in">{errors.gst}</p>
            )}
          </div>

          {/* Logo URL */}
          <div>
            <label htmlFor="logo" className="block text-sm font-semibold text-gray-700 mb-2">
              Organization Logo URL
            </label>
            <div className="relative group">
              <Upload className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors duration-300 ${
                errors.logo ? 'text-red-500' : 'text-gray-400 group-focus-within:text-[#3E2B66]'
              }`} />
              <input
                type="url"
                id="logo"
                name="logo"
                value={formData.logo}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 text-sm border-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#3E2B66]/20 ${
                  errors.logo
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-gray-300 focus:border-[#3E2B66] hover:border-gray-400'
                }`}
                placeholder="https://www.example.com/logo.png"
              />
            </div>
            {errors.logo && (
              <p className="text-red-600 text-xs mt-1 animate-fade-in">{errors.logo}</p>
            )}
            
            {/* Logo Preview */}
            {logoPreview && (
              <div className="mt-3">
                <p className="text-xs text-gray-600 mb-2">Preview:</p>
                <div className="w-32 h-32 border border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="max-w-full max-h-full object-contain"
                    onError={() => setLogoPreview(null)}
                  />
                </div>
              </div>
            )}
          </div>


          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isLoading || success}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 ${
                isLoading || success
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#260559] to-[#3E2B66] hover:from-[#3E2B66] hover:to-[#260559] shadow-lg hover:shadow-xl'
              }`}
            >
              {isLoading ? 'Creating...' : success ? 'Created Successfully' : 'Create Organization'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

