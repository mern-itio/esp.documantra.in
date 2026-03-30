import React, { useEffect, useState } from 'react';
import {
  X, Building2, Globe, ExternalLink, ShieldCheck, CheckCircle2,
  Clock, Users, FolderOpen, Shield, FileText, Loader2, AlertCircle,
  Info, UserCheck, UserX, Calendar,
} from 'lucide-react';
import { organizationApi } from '../../services/apiHelper';
import type { Organization } from '../../types/organization';

/* ─── Types ─── */
interface Member {
  _id: string;
  name?: string;
  email?: string;
  status: 'ACTIVE' | 'PENDING' | 'DISABLED' | 'REJECTED';
  roleId?: { _id: string; name: string; description?: string } | null;
  createdAt?: string;
}

interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions?: { permissions?: Record<string, boolean> };
}

interface Folder {
  _id: string;
  name: string;
  createdAt?: string;
  docCount?: number;
}

interface OrganizationOwnerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization;
}

/* ─── Helpers ─── */
const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const statusConfig = {
  ACTIVE:    { label: 'Active',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <UserCheck className="w-3 h-3" /> },
  PENDING:   { label: 'Pending',   cls: 'bg-amber-50  text-amber-700  border-amber-200',  icon: <Clock      className="w-3 h-3" /> },
  DISABLED:  { label: 'Disabled',  cls: 'bg-gray-100  text-gray-500   border-gray-200',   icon: <UserX      className="w-3 h-3" /> },
  REJECTED:  { label: 'Rejected',  cls: 'bg-red-50    text-red-600    border-red-200',    icon: <UserX      className="w-3 h-3" /> },
} as const;

/* ─── Component ─── */
export const OrganizationOwnerDetailModal: React.FC<OrganizationOwnerDetailModalProps> = ({
  isOpen,
  onClose,
  organization,
}) => {
  const [members, setMembers]   = useState<Member[]>([]);
  const [roles, setRoles]       = useState<Role[]>([]);
  const [folders, setFolders]   = useState<Folder[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'roles' | 'folders'>('members');

  const orgId = organization._id ?? '';

  useEffect(() => {
    if (!isOpen || !orgId) return;
    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        /* All three in parallel */
        const [membersRes, rolesRes, foldersRes] = await Promise.all([
          organizationApi.get(`/api/organization/members/${orgId}`),
          organizationApi.get(`/api/organization/fetch-roles/${orgId}`),
          organizationApi.get('/api/organization/fetch-organization-folders', {
            headers: {
              'x-account-type': 'organization',
              'x-organization-id': orgId,
            },
          }).catch(() => ({ data: { data: [] } })), // folders may fail if not in org context
        ]);

        if (cancelled) return;

        const rawMembers: Member[] = membersRes.data?.data ?? membersRes.data ?? [];
        const rawRoles:   Role[]   = rolesRes.data?.data   ?? rolesRes.data   ?? [];
        const rawFolders: Folder[] = foldersRes.data?.data ?? foldersRes.data ?? [];

        setMembers(rawMembers);
        setRoles(rawRoles);

        /* Fetch document count per folder in parallel */
        const foldersWithCounts = await Promise.all(
          rawFolders.map(async (folder: Folder) => {
            try {
              const envRes = await organizationApi.get(
                `/api/organization/fetch-folder-envelopes/${folder._id}`,
                { headers: { 'x-account-type': 'organization', 'x-organization-id': orgId } }
              );
              const docs: unknown[] = envRes.data?.data ?? envRes.data ?? [];
              return { ...folder, docCount: Array.isArray(docs) ? docs.length : 0 };
            } catch {
              return { ...folder, docCount: 0 };
            }
          })
        );

        if (!cancelled) setFolders(foldersWithCounts);
      } catch {
        if (!cancelled) setError('Failed to load organization details.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [isOpen, orgId]);

  if (!isOpen) return null;

  const initials = organization.name?.slice(0, 2).toUpperCase() ?? '??';
  const isActive = typeof organization.status === 'boolean' ? organization.status : organization.status === true;
  const isVerified = organization.isVerified === true;
  const activeMembers = members.filter((m) => m.status === 'ACTIVE').length;
  const totalDocs = folders.reduce((s, f) => s + (f.docCount ?? 0), 0);

  const tabs = [
    { id: 'members' as const, label: 'Members', count: members.length, icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'roles'   as const, label: 'Roles',   count: roles.length,   icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'folders' as const, label: 'Folders', count: folders.length, icon: <FolderOpen className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Purple accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#260559] to-[#6d3fc0] flex-shrink-0" />

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 flex-shrink-0 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#260559] to-[#6d3fc0] flex items-center justify-center shadow-sm">
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
                  className="inline-flex items-center gap-1 text-xs text-[#260559] hover:text-[#34106a] mt-1 transition-colors"
                >
                  <Globe className="w-3 h-3" />
                  <span>{organization.website.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ) : (
                <span className="text-xs text-gray-400 mt-1 block">No website</span>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                  isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}>
                  {isActive ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#260559]/8 text-[#260559] border border-[#260559]/20">
                  <Building2 className="w-3 h-3" />
                  Owner
                </span>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats strip */}
        {!loading && !error && (
          <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100 flex-shrink-0">
            {[
              { label: 'Members',  value: members.length,  sub: `${activeMembers} active`,   color: 'text-[#260559]', bg: 'bg-[#260559]/6'  },
              { label: 'Roles',    value: roles.length,    sub: 'defined',                    color: 'text-violet-600', bg: 'bg-violet-50'    },
              { label: 'Folders',  value: folders.length,  sub: 'created',                    color: 'text-amber-600',  bg: 'bg-amber-50'     },
              { label: 'Documents',value: totalDocs,        sub: 'across folders',             color: 'text-emerald-600',bg: 'bg-emerald-50'   },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center py-3.5 px-2">
                <span className={`text-2xl font-extrabold ${s.color}`}>{s.value}</span>
                <span className="text-[11px] font-semibold text-gray-700 mt-0.5">{s.label}</span>
                <span className="text-[10px] text-gray-400">{s.sub}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        {!loading && !error && (
          <div className="flex gap-0 border-b border-gray-100 flex-shrink-0 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors mr-1 ${
                  activeTab === tab.id
                    ? 'border-[#260559] text-[#260559]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                {tab.label}
                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                  activeTab === tab.id ? 'bg-[#260559] text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-7 h-7 animate-spin mb-3 text-[#260559]" />
              <p className="text-sm">Loading organization data…</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center gap-3 m-6 p-4 bg-red-50 rounded-xl border border-red-200">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="p-6">

              {/* ── Members tab ── */}
              {activeTab === 'members' && (
                <div className="space-y-2">
                  {members.length === 0 ? (
                    <EmptyTabState icon={<Users className="w-8 h-8 text-gray-300" />} text="No members yet" />
                  ) : (
                    members.map((member) => {
                      const cfg = statusConfig[member.status] ?? statusConfig.PENDING;
                      return (
                        <div
                          key={member._id}
                          className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-200 transition-colors"
                        >
                          {/* Avatar initials */}
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#260559] to-[#6d3fc0] flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-white">
                              {(member.name ?? member.email ?? '?').slice(0, 2).toUpperCase()}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {member.name || 'Unnamed'}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{member.email ?? '—'}</p>
                          </div>

                          {/* Role */}
                          {member.roleId && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#260559]/6 text-[#260559] border border-[#260559]/15 flex-shrink-0">
                              <Shield className="w-2.5 h-2.5" />
                              {member.roleId.name}
                            </span>
                          )}

                          {/* Status */}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border flex-shrink-0 ${cfg.cls}`}>
                            {cfg.icon}
                            {cfg.label}
                          </span>

                          {/* Joined date */}
                          {member.createdAt && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-1 flex-shrink-0">
                              <Calendar className="w-2.5 h-2.5" />
                              {formatDate(member.createdAt)}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ── Roles tab ── */}
              {activeTab === 'roles' && (
                <div className="space-y-2">
                  {roles.length === 0 ? (
                    <EmptyTabState icon={<Shield className="w-8 h-8 text-gray-300" />} text="No roles defined" />
                  ) : (
                    roles.map((role) => {
                      const perms = role.permissions?.permissions ?? {};
                      const enabled = Object.values(perms).filter(Boolean).length;
                      const total   = Object.keys(perms).length || 6;
                      return (
                        <div
                          key={role._id}
                          className="flex items-center gap-3.5 p-3.5 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-200 transition-colors"
                        >
                          <div className="w-9 h-9 rounded-xl bg-[#260559]/8 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-4 h-4 text-[#260559]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{role.name}</p>
                            <p className="text-xs text-gray-400 truncate">
                              {role.description || 'No description'}
                            </p>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border flex-shrink-0 ${
                            enabled > 0
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-gray-100 text-gray-500 border-gray-200'
                          }`}>
                            <CheckCircle2 className="w-3 h-3" />
                            {enabled} / {total} permissions
                          </span>

                          {/* Members using this role */}
                          {(() => {
                            const count = members.filter(
                              (m) => m.roleId && (m.roleId as any)._id?.toString() === role._id
                            ).length;
                            return count > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 flex-shrink-0">
                                <Users className="w-2.5 h-2.5" />
                                {count} member{count !== 1 ? 's' : ''}
                              </span>
                            ) : null;
                          })()}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ── Folders tab ── */}
              {activeTab === 'folders' && (
                <div className="space-y-2">
                  {folders.length === 0 ? (
                    <EmptyTabState icon={<FolderOpen className="w-8 h-8 text-gray-300" />} text="No folders created yet" />
                  ) : (
                    folders.map((folder) => (
                      <div
                        key={folder._id}
                        className="flex items-center gap-3.5 p-3.5 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-200 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                          <FolderOpen className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{folder.name}</p>
                          {folder.createdAt && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-2.5 h-2.5" />
                              Created {formatDate(folder.createdAt)}
                            </p>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border flex-shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                          <FileText className="w-3 h-3" />
                          {folder.docCount ?? 0} doc{(folder.docCount ?? 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 flex items-center justify-between bg-gray-50">
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            {organization.gst ? `GST: ${organization.gst}` : 'No GST registered'}
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

/* ─── Empty tab state ─── */
const EmptyTabState: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
      {icon}
    </div>
    <p className="text-sm">{text}</p>
  </div>
);
