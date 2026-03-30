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
  if (!raw) return null;
  // nested: { permissions: { ENVELOPE_CREATE: ... } }
  if ('permissions' in (raw as any) && typeof (raw as any).permissions === 'object') {
    return (raw as any).permissions as PermissionSet;
  }
  // flat: { ENVELOPE_CREATE: ... }
  if ('ENVELOPE_CREATE' in (raw as any)) {
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
  const roleName = detail?.access?.role?.name ?? (organization as any).role ?? 'Member';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Blue accent top bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-500 flex-shrink-0" />

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm">
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
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{organization.name}</h2>
              {organization.website ? (
                <a
                  href={organization.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 mt-1 transition-colors"
                >
                  <Globe className="w-3 h-3" />
                  <span>{organization.website.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ) : (
                <span className="text-xs text-gray-400 mt-1 block">No website</span>
              )}
              {/* Status badges */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}>
                  {isActive ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {isActive ? 'Active' : 'Inactive'}
                </span>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Users className="w-3 h-3" />
                  {roleName}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0 mt-0.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">

          {loading && (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Loader2 className="w-7 h-7 animate-spin mb-3 text-blue-500" />
              <p className="text-sm">Loading details…</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!loading && (
            <>
              {/* Organization details */}
              <section>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                  Organization Details
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {org.createdAt && (
                    <div className="flex items-start gap-2.5 bg-gray-50 rounded-xl border border-gray-100 p-3.5">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Created</p>
                        <p className="text-sm font-medium text-gray-800 mt-0.5">{formatDate(org.createdAt)}</p>
                      </div>
                    </div>
                  )}
                  {organization.gst && (
                    <div className="flex items-start gap-2.5 bg-gray-50 rounded-xl border border-gray-100 p-3.5">
                      <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">GST</p>
                        <p className="text-sm font-mono font-medium text-gray-800 mt-0.5">{organization.gst}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2.5 bg-gray-50 rounded-xl border border-gray-100 p-3.5">
                    <ShieldCheck className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Verification</p>
                      <p className={`text-sm font-semibold mt-0.5 ${
                        org.verificationStatus === 'APPROVED'
                          ? 'text-blue-600'
                          : org.verificationStatus === 'PENDING'
                          ? 'text-amber-600'
                          : org.verificationStatus === 'REJECTED'
                          ? 'text-red-600'
                          : 'text-gray-500'
                      }`}>
                        {org.verificationStatus
                          ? org.verificationStatus.charAt(0) + org.verificationStatus.slice(1).toLowerCase()
                          : 'Not requested'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 bg-gray-50 rounded-xl border border-gray-100 p-3.5">
                    <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status</p>
                      <p className={`text-sm font-semibold mt-0.5 ${isActive ? 'text-emerald-600' : 'text-gray-500'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Your access */}
              <section>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                  Your Access
                </p>
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-indigo-900">{roleName}</p>
                    <p className="text-xs text-indigo-600 mt-0.5">
                      {permissions
                        ? `${enabledCount} of ${PERMISSION_CONFIG.length} permissions enabled`
                        : 'Shared organization member'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-indigo-200 text-indigo-700">
                      <Share2 className="w-3 h-3" />
                      Shared
                    </span>
                  </div>
                </div>
              </section>

              {/* Permissions */}
              {permissions ? (
                <section>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
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
                              ? 'bg-emerald-50 border-emerald-200'
                              : 'bg-gray-50 border-gray-200 opacity-60'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            allowed ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400'
                          }`}>
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold truncate ${
                              allowed ? 'text-emerald-800' : 'text-gray-500'
                            }`}>
                              {label}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">{description}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                            allowed ? 'bg-emerald-500' : 'bg-gray-300'
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
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                    Your Permissions
                  </p>
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 text-center text-sm text-gray-400">
                    Permission details not available for this organization.
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 flex items-center justify-between bg-gray-50">
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            You are a member of this organization
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
