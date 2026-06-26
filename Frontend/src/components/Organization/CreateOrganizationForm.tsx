import { useState } from 'react';
import { APP_NAME } from '../constants/appConfig';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Globe,
  FileText,
  Link2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Shield,
  Users,
  Zap,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import type { CreateOrganizationRequest, Organization } from '../../types/organization';
import { organizationApi } from '../../services/apiHelper';

interface CreateOrganizationFormProps {
  onSuccess?: (organization: Organization) => void;
}

const FEATURES = [
  {
    icon: Shield,
    title: 'Verified Credentials',
    desc: 'Build trust with a verified organization badge.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    desc: 'Invite members and manage roles with ease.',
  },
  {
    icon: Zap,
    title: 'Workflow Automation',
    desc: 'Streamline signing and approval workflows.',
  },
];

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
    gst: '',
  });

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Organization name is required';
        if (value.trim().length < 2) return 'Must be at least 2 characters';
        return '';
      case 'website':
        if (value.trim()) {
          const urlPattern = /^https?:\/\/.+\..+/i;
          if (!urlPattern.test(value.trim())) return 'Enter a valid URL (e.g. https://example.com)';
        }
        return '';
      case 'logo':
        if (value.trim()) {
          const urlPattern = /^https?:\/\/.+\..+/i;
          if (!urlPattern.test(value.trim())) return 'Enter a valid logo URL';
        }
        return '';
      default:
        return '';
    }
  };

  const validateAll = (): boolean => {
    const nextErrors: { [key: string]: string } = {};
    (['name', 'logo', 'website', 'gst'] as const).forEach((field) => {
      const error = validateField(field, formData[field] || '');
      if (error) nextErrors[field] = error;
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (name === 'logo') {
      setLogoPreview(value || null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccess(false);
    if (!validateAll()) return;
    setIsLoading(true);
    try {
      const response = await organizationApi.post('/api/organization/create', {
        name: formData.name,
        logo: formData.logo || undefined,
        website: formData.website || undefined,
        gst: formData.gst || undefined,
      });
      setSuccess(true);
      window.dispatchEvent(new CustomEvent('organizations-updated'));
      if (onSuccess) {
        onSuccess(response.data.data);
      } else {
        setTimeout(() => navigate('/organizations'), 2000);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setFormError(
        e.response?.data?.message || e.message || 'Failed to create organization. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const initials = formData.name
    ? formData.name.slice(0, 2).toUpperCase()
    : null;

  return (
    <div className="w-full mx-auto">
      <div className="bg-card text-card-foreground rounded-2xl shadow-xl border border-border overflow-hidden flex flex-col lg:flex-row min-h-[580px]">

        {/* ── Left Panel ── */}
        <div
          className="relative lg:w-[38%] flex-shrink-0 flex flex-col justify-between p-8 overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #1a0340 0%, #260559 45%, #3d1a7a 100%)' }}
        >
          {/* decorative circles */}
          <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
          <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #1B6B57, transparent)' }} />

          <div className="relative z-10">
            {/* Brand mark */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-[#F7F3EE]/15 flex items-center justify-center backdrop-blur-sm border border-white/20">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">{APP_NAME}</span>
            </div>

            {/* Headline */}
            <h2 className="text-2xl font-bold text-white leading-snug mb-3">
              Set up your<br />
              <span className="text-purple-300">organization</span>
            </h2>
            <p className="text-purple-200 text-sm leading-relaxed mb-10">
              Create your workspace in seconds and unlock powerful document, signing, and team management tools.
            </p>

            {/* Feature list */}
            <div className="space-y-5">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F7F3EE]/10 flex items-center justify-center flex-shrink-0 border border-white/15">
                    <Icon className="w-4 h-4 text-purple-300" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{title}</p>
                    <p className="text-purple-300 text-xs leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom step indicator */}
          {/* <div className="relative z-10 mt-10">
            <div className="flex items-center gap-2">
              <div className="w-6 h-1.5 rounded-full bg-[#F7F3EE]" />
              <div className="w-2 h-1.5 rounded-full bg-[#F7F3EE]/30" />
              <div className="w-2 h-1.5 rounded-full bg-[#F7F3EE]/30" />
            </div>
            <p className="text-purple-300 text-xs mt-2">Step 1 of 3 — Organization Setup</p>
          </div> */}
        </div>

        {/* ── Right Panel ── */}
        <div className="flex-1 flex flex-col p-8 lg:p-10">

          {/* Header */}
          <div className="mb-8">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">New Organization</p>
            <h1 className="text-2xl font-bold text-foreground">Organization Details</h1>
            <p className="text-muted-foreground text-sm mt-1">Fill in the information below to create your organization profile.</p>
          </div>

          {/* Alerts */}
          {success && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Organization created!</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">Redirecting you to your organizations…</p>
              </div>
            </div>
          )}
          {formError && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-900">
              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{formError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 gap-5">

            {/* Organization Name */}
            <FieldWrapper
              label="Organization Name"
              required
              error={errors.name}
            >
              <InputBase
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Acme Corporation"
                icon={<Building2 className="w-4 h-4" />}
                hasError={!!errors.name}
              />
            </FieldWrapper>

            {/* Two-column row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FieldWrapper label="Website URL" error={errors.website}>
                <InputBase
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  icon={<Globe className="w-4 h-4" />}
                  hasError={!!errors.website}
                />
              </FieldWrapper>

              <FieldWrapper label="GST Number" hint="Optional">
                <InputBase
                  type="text"
                  id="gst"
                  name="gst"
                  value={formData.gst}
                  onChange={handleInputChange}
                  placeholder="22AAAAA0000A1Z5"
                  icon={<FileText className="w-4 h-4" />}
                  hasError={false}
                />
              </FieldWrapper>
            </div>

            {/* Logo URL */}
            <FieldWrapper label="Logo URL" error={errors.logo} hint="Optional — paste a public image link">
              <div className="flex gap-3 items-start">
                <div className="flex-1">
                  <InputBase
                    type="url"
                    id="logo"
                    name="logo"
                    value={formData.logo}
                    onChange={handleInputChange}
                    placeholder="https://example.com/logo.png"
                    icon={<Link2 className="w-4 h-4" />}
                    hasError={!!errors.logo}
                  />
                </div>

                {/* Logo preview / placeholder */}
                <div className="w-12 h-12 rounded-xl border-2 border-dashed border-border flex-shrink-0 overflow-hidden flex items-center justify-center bg-muted">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-contain"
                      onError={() => setLogoPreview(null)}
                    />
                  ) : initials ? (
                    <span className="text-sm font-bold text-primary select-none">{initials}</span>
                  ) : (
                    <Building2 className="w-5 h-5 text-muted-foreground/50" />
                  )}
                </div>
              </div>
            </FieldWrapper>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 text-sm font-semibold text-foreground bg-muted rounded-xl hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading || success}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  isLoading || success
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:bg-primary/90 active:scale-[0.98]'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating…
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Created Successfully
                  </>
                ) : (
                  <>
                    Create Organization
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Footer note */}
          <p className="text-xs text-muted-foreground mt-6 flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3" />
            You can verify your organization after creation to unlock additional features.
          </p>
        </div>
      </div>
    </div>
  );
};

/* ─── Small Reusable Sub-components ─── */

interface FieldWrapperProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

const FieldWrapper: React.FC<FieldWrapperProps> = ({ label, required, hint, error, children }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <label className="text-sm font-semibold text-foreground">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
    {children}
    {error && (
      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
        <AlertCircle className="w-3 h-3 flex-shrink-0" />
        {error}
      </p>
    )}
  </div>
);

interface InputBaseProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
  hasError: boolean;
}

const InputBase: React.FC<InputBaseProps> = ({ icon, hasError, className, ...props }) => (
  <div className="relative group">
    <span
      className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
        hasError ? 'text-red-400' : 'text-muted-foreground group-focus-within:text-primary'
      }`}
    >
      {icon}
    </span>
    <input
      {...props}
      className={`w-full pl-10 pr-4 py-2.5 text-sm bg-muted/50 border rounded-xl transition-all duration-200 outline-none text-foreground placeholder:text-muted-foreground focus:bg-background ${
        hasError
          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
          : 'border-border hover:border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/20'
      } ${className ?? ''}`}
    />
  </div>
);
