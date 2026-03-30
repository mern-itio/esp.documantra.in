import React, { useState, useEffect } from 'react';
import { Building, Globe, FileText, Upload, X, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Organization, VerifyOrganizationRequest } from '../../types/organization';
import { organizationApi } from '../../services/apiHelper';

interface VerifyOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization | null;
  onSuccess: () => void;
}

export const VerifyOrganizationModal: React.FC<VerifyOrganizationModalProps> = ({
  isOpen,
  onClose,
  organization,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<VerifyOrganizationRequest>({
    name: '',
    logo: '',
    website: '',
    gst: '',
    documents: []
  });
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [documentPreviews, setDocumentPreviews] = useState<(string | null)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (organization && isOpen) {
      setFormData({
        name: organization.name || '',
        logo: organization.logo || '',
        website: organization.website || '',
        gst: organization.gst || organization.gstNumber || '',
        documents: []
      });
      setDocumentFiles([]);
      setDocumentPreviews([]);
      setErrors({});
      setFormError('');
      setSuccess(false);
      if (organization.logo) {
        setLogoPreview(organization.logo);
      }
    }
  }, [organization, isOpen]);

  useEffect(() => {
    return () => {
      documentPreviews.forEach((previewUrl) => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      });
    };
  }, [documentPreviews]);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Organization name is required';
        if (value.trim().length < 2) return 'Organization name must be at least 2 characters';
        return '';
      case 'website':
        if (!value.trim()) return 'Website URL is required';
        const urlPattern = /^https?:\/\/.+\..+/i;
        if (!urlPattern.test(value.trim())) return 'Please enter a valid website URL';
        return '';
      case 'gst':
        if (!value.trim()) return 'GST number is required';
        if (value.trim().length < 10) return 'GST number must be at least 10 characters';
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
    const nextErrors: Record<string, string> = {};
    
    ['name', 'website', 'gst'].forEach((field) => {
      const error = validateField(field, (formData as any)[field] || '');
      if (error) nextErrors[field] = error;
    });

    if (formData.logo) {
      const logoError = validateField('logo', formData.logo);
      if (logoError) nextErrors.logo = logoError;
    }

    if (documentFiles.length === 0) {
      nextErrors['documents'] = 'At least one verification document is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    
    if (name === 'logo' && value) {
      setLogoPreview(value);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    let invalidFile = false;
    const nextPreviews: (string | null)[] = [];

    for (const file of files) {
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      const isAllowedType = allowedMimeTypes.includes(file.type) || ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'].includes(extension);

      if (!isAllowedType) {
        invalidFile = true;
        setFormError('Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG');
        setErrors((prev) => ({ ...prev, documents: 'Invalid file type selected' }));
        break;
      }

      if (file.size > 10 * 1024 * 1024) {
        invalidFile = true;
        setFormError('Each file must be 10MB or smaller');
        setErrors((prev) => ({ ...prev, documents: 'File exceeds maximum size (10MB)' }));
        break;
      }

      if (file.type.startsWith('image/') || file.type === 'application/pdf' || extension === 'pdf') {
        nextPreviews.push(URL.createObjectURL(file));
      } else {
        nextPreviews.push(null);
      }
    }

    if (invalidFile) {
      return;
    }

    if (files.length > 0) {
      // clean previous preview URLs
      documentPreviews.forEach((previewUrl) => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      });

      setDocumentFiles(files);
      setDocumentPreviews(nextPreviews);

      if (errors['documents']) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next['documents'];
          return next;
        });
      }

      setFormError('');
    }
  };

  const removeDocument = (index: number) => {
    setDocumentFiles((prev) => prev.filter((_, i) => i !== index));
    setDocumentPreviews((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed);
      return prev.filter((_, i) => i !== index);
    });

    if (errors['documents']) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next['documents'];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccess(false);

    if (!validateAll() || !organization?._id) {
      return;
    }

    setIsLoading(true);

    try {
      const formDataPayload = new FormData();

      // Append JSON fields
      formDataPayload.append(
        'organization',
        JSON.stringify({
          name: formData.name,
          logo: formData.logo || undefined,
          website: formData.website,
          gst: formData.gst
        })
      );

      // Append all document files
      documentFiles.forEach(file => {
        formDataPayload.append('documents', file);
      });

      const response = await organizationApi.post(
        `/api/organization/verify/${organization._id}`,
        formDataPayload
      );
      console.log(response);
      setSuccess(true);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error verifying organization:', err);
      setFormError(err.response?.data?.message || err.message || 'Failed to submit verification request. Please try again.');
    } finally {
      setIsLoading(false);
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
            <h2 className="text-2xl font-bold text-gray-900">Verify Organization</h2>
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
          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-green-800 text-sm font-medium">
                Verification request submitted successfully! Your request is pending review.
              </p>
            </div>
          )}

          {/* Error Message */}
          {formError && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-600 text-sm font-medium">{formError}</p>
            </div>
          )}

          {/* Organization Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Organization Name <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <Building className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors duration-300 ${
                errors.name ? 'text-red-500' : 'text-gray-400 group-focus-within:text-[#3E2B66]'
              }`} />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 text-sm border-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#3E2B66]/20 ${
                  errors.name
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-gray-300 focus:border-[#3E2B66] hover:border-gray-400'
                }`}
                placeholder="Acme Corporation"
                disabled={isLoading}
                required
              />
            </div>
            {errors.name && (
              <p className="text-red-600 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Website URL <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <Globe className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors duration-300 ${
                errors.website ? 'text-red-500' : 'text-gray-400 group-focus-within:text-[#3E2B66]'
              }`} />
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 text-sm border-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#3E2B66]/20 ${
                  errors.website
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-gray-300 focus:border-[#3E2B66] hover:border-gray-400'
                }`}
                placeholder="https://www.example.com"
                disabled={isLoading}
                required
              />
            </div>
            {errors.website && (
              <p className="text-red-600 text-xs mt-1">{errors.website}</p>
            )}
          </div>

          {/* GST Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              GST Number <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <FileText className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors duration-300 ${
                errors.gst ? 'text-red-500' : 'text-gray-400 group-focus-within:text-[#3E2B66]'
              }`} />
              <input
                type="text"
                name="gst"
                value={formData.gst}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 text-sm border-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#3E2B66]/20 ${
                  errors.gst
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-gray-300 focus:border-[#3E2B66] hover:border-gray-400'
                }`}
                placeholder="GST123456789"
                disabled={isLoading}
                required
              />
            </div>
            {errors.gst && (
              <p className="text-red-600 text-xs mt-1">{errors.gst}</p>
            )}
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Organization Logo URL
            </label>
            <div className="relative group">
              <Upload className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors duration-300 ${
                errors.logo ? 'text-red-500' : 'text-gray-400 group-focus-within:text-[#3E2B66]'
              }`} />
              <input
                type="url"
                name="logo"
                value={formData.logo}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 text-sm border-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#3E2B66]/20 ${
                  errors.logo
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-gray-300 focus:border-[#3E2B66] hover:border-gray-400'
                }`}
                placeholder="https://www.example.com/logo.png"
                disabled={isLoading}
              />
            </div>
            {errors.logo && (
              <p className="text-red-600 text-xs mt-1">{errors.logo}</p>
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

          {/* Verification Documents */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Verification Documents <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#3E2B66] transition-colors duration-300">
              <input
                type="file"
                id="documents"
                name="documents"
                onChange={handleFileChange}
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                disabled={isLoading}
              />
              <label
                htmlFor="documents"
                className={`cursor-pointer flex flex-col items-center gap-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-gray-500">
                  PDF, DOC, DOCX, JPG, PNG (Max 10MB each)
                </span>
              </label>
            </div>
            {errors.documents && (
              <p className="text-red-600 text-xs mt-1">{errors.documents}</p>
            )}
            
            {/* Selected Files */}
            {documentFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {documentFiles.map((file, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument(index)}
                        className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {documentPreviews[index] && (
                      <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                        {file.type.startsWith('image/') ? (
                          <img
                            src={documentPreviews[index] as string}
                            alt="Document preview"
                            className="w-full h-40 object-contain"
                          />
                        ) : file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') ? (
                          <embed
                            src={documentPreviews[index] as string}
                            type="application/pdf"
                            className="w-full h-40"
                          />
                        ) : (
                          <div className="p-3 text-xs text-gray-500">Preview not available for this document type.</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

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
              disabled={isLoading || success}
            >
              {isLoading ? 'Submitting...' : success ? 'Submitted' : 'Submit Verification Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

