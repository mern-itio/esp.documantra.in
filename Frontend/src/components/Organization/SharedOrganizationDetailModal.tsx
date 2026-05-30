import React, { useEffect, useState } from 'react';
import {
  X, Building2, Globe, ExternalLink, ShieldCheck, CheckCircle2,
  Clock, Users, FileText, FolderOpen, Share2, Settings,
  UserPlus, AlertCircle, Calendar, Loader2,
} from 'lucide-react';
import { organizationApi } from '../../services/apiHelper';
import type { Organization } from '../../types/organization';

interface PermissionSet {
  ENVELOPE_CREATE: boolean;
  ENVELOPE_SHARE: boolean;
  FOLDER_CREATE: boolean;
  FOLDER_SHARE: boolean;
  ORG_SHARE: boolean;
  ORG_SETTINGS_EDIT: boolean;
}

interface OrgDetailResponse {
  name: string;
  logo?: string;
  website?: string;
  gst?: string;
  status?: boolean;
  isVerified?: boolean;
  verificationStatus?: string;
  createdAt?: string;
  access: {
    isOwner: boolean;
    role: { name: string };
  };
  permissions?: {
    permissions?: PermissionSet;
  } | PermissionSet;
}

interface SharedOrganizationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization;
}

const PERMISSION_CONFIG: {
  key: keyof PermissionSet;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    key: 'ENVELOPE_CREATE',
    label: 'Create Documents',
    description: 'Upload & create new envelopes',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    key: 'ENVELOPE_SHARE',
    label: 'Share Documents',
    description: 'Send & share envelopes',
    icon: <Share2 className="w-4 h-4" />,
  },
  {
    key: 'FOLDER_CREATE',
    label: 'Create Folders',
    description: 'Create folders in workspace',
    icon: <FolderOpen className="w-4 h-4" />,
  },
  {
    key: 'FOLDER_SHARE',
    label: 'Share Folders',
    description: 'Share folders with members',
    icon: <Share2 className="w-4 h-4" />,
  },
  {
    key: 'ORG_SHARE',
    label: 'Invite Members',
    description: 'Add people to the org',
    icon: <UserPlus className="w-4 h-4" />,
  },
  {
    key: 'ORG_SETTINGS_EDIT',
    label: 'Edit Settings',
    description: 'Modify organization settings',
    icon: <Settings className="w-4 h-4" />,
  },
];

function resolvePermissions(raw: OrgDetailResponse['permissions']): PermissionSet | null {
  if (!raw || typeof raw !== 'object') return null;
  if ('permissions' in raw && raw.permissions && typeof raw.permissions === 'object') {
    return raw.permissions as PermissionSet;
  }
  if ('ENVELOPE_CREATE' in raw) {
    return raw as PermissionSet;
  }
  return null;
}

export const SharedOrganizationDetailModal: React.FC<SharedOrganizationDetailModalProps> = ({
  isOpen,
  onClose,
  organization,
}) => {
  const [detail, setDetail] = useState<OrgDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !organization._id) return;
    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      setError(null);
      setDetail(null);
      try {
        const res = await organizationApi.get(
          `/api/organization/details-and-permission/${organization._id}`
        );
        if (!cancelled) {
          setDetail(res.data?.organization ?? null);
        }
      } catch {
        if (!cancelled) setError('Failed to load organization details.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [isOpen, organization._id]);

  if (!isOpen) return null;

  const org = detail ?? organization as unknown as OrgDetailResponse;
  const isActive = typeof org.status === 'boolean' ? org.status : org.status === true;
  const isVerified = org.isVerified === true;
  const roleName =
    detail?.access?.role?.name ??
    (organization as Organization & { role?: string }).role ??
    'Member';
  const permissions = detail ? resolvePermissions(detail.permissions) : null;
  const enabledCount = permissions
    ? Object.values(permissions).filter(Boolean).length
    : 0;

  const initials = organization.name
    ? organization.name.slice(0, 2).toUpperCase()
    : '??';

  const formatDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60 backdrop-blur-sm p-4">
      <div
        className="bg-card text-card-foreground border border-border rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Blue accent top bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-emerald-500 flex-shrink-0" />

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-sm">
              {organization.logo ? (
                <img
                  src={organization.logo}
                  alt={organization.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <span className="text-lg font-bold text-white">{initials}</span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground leading-tight">{organization.name}</h2>
              {organization.website ? (
                <a
                  href={organization.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-1 transition-colors"
                >
                  <Globe className="w-3 h-3" />
                  <span>{organization.website.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ) : (
                <span className="text-xs text-muted-foreground mt-1 block">No website</span>
              )}
              {/* Status badges */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-muted text-muted-foreground border-border'
                }`}>
                  {isActive ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {isActive ? 'Active' : 'Inactive'}
                </span>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                  <Users className="w-3 h-3" />
                  {roleName}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0 mt-0.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">

          {loading && (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="w-7 h-7 animate-spin mb-3 text-blue-600 dark:text-blue-400" />
              <p className="text-sm">Loading details…</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200 dark:bg-red-950/40 dark:border-red-900">
              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {!loading && (
            <>
              {/* Organization details */}
              <section>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Organization Details
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {org.createdAt && (
                    <div className="flex items-start gap-2.5 bg-muted/50 rounded-xl border border-border p-3.5">
                      <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Created</p>
                        <p className="text-sm font-medium text-foreground mt-0.5">{formatDate(org.createdAt)}</p>
                      </div>
                    </div>
                  )}
                  {organization.gst && (
                    <div className="flex items-start gap-2.5 bg-muted/50 rounded-xl border border-border p-3.5">
                      <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">GST</p>
                        <p className="text-sm font-mono font-medium text-foreground mt-0.5">{organization.gst}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2.5 bg-muted/50 rounded-xl border border-border p-3.5">
                    <ShieldCheck className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Verification</p>
                      <p className={`text-sm font-semibold mt-0.5 ${
                        org.verificationStatus === 'APPROVED'
                          ? 'text-blue-600 dark:text-blue-400'
                          : org.verificationStatus === 'PENDING'
                          ? 'text-amber-600 dark:text-amber-400'
                          : org.verificationStatus === 'REJECTED'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-muted-foreground'
                      }`}>
                        {org.verificationStatus
                          ? org.verificationStatus.charAt(0) + org.verificationStatus.slice(1).toLowerCase()
                          : 'Not requested'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 bg-muted/50 rounded-xl border border-border p-3.5">
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Status</p>
                      <p className={`text-sm font-semibold mt-0.5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Your access */}
              <section>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Your Access
                </p>
                <div className="bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">{roleName}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-300 mt-0.5">
                      {permissions
                        ? `${enabledCount} of ${PERMISSION_CONFIG.length} permissions enabled`
                        : 'Shared organization member'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-card border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                      <Share2 className="w-3 h-3" />
                      Shared
                    </span>
                  </div>
                </div>
              </section>

              {/* Permissions */}
              {permissions ? (
                <section>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Your Permissions
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {PERMISSION_CONFIG.map(({ key, label, description, icon }) => {
                      const allowed = permissions[key] === true;
                      return (
                        <div
                          key={key}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                            allowed
                              ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
                              : 'bg-muted/50 border-border opacity-80 dark:opacity-70'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            allowed ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
                          }`}>
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold truncate ${
                              allowed ? 'text-emerald-800 dark:text-emerald-200' : 'text-muted-foreground'
                            }`}>
                              {label}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">{description}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                            allowed ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-muted-foreground/40'
                          }`}>
                            {allowed ? (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ) : !error && (
                <section>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Your Permissions
                  </p>
                  <div className="bg-muted/50 rounded-xl border border-border p-5 text-center text-sm text-muted-foreground">
                    Permission details not available for this organization.
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex-shrink-0 flex items-center justify-between bg-muted/40">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            You are a member of this organization
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-foreground bg-background border border-border rounded-lg hover:bg-accent transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
