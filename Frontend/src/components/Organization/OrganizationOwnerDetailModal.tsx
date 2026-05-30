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
  ACTIVE:    { label: 'Active',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800', icon: <UserCheck className="w-3 h-3" /> },
  PENDING:   { label: 'Pending',   cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',  icon: <Clock      className="w-3 h-3" /> },
  DISABLED:  { label: 'Disabled',  cls: 'bg-muted text-muted-foreground border-border',   icon: <UserX      className="w-3 h-3" /> },
  REJECTED:  { label: 'Rejected',  cls: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900',    icon: <UserX      className="w-3 h-3" /> },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60 backdrop-blur-sm p-4">
      <div
        className="bg-card text-card-foreground border border-border rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Purple accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#260559] to-[#6d3fc0] flex-shrink-0" />

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 flex-shrink-0 border-b border-border">
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
              <h2 className="text-xl font-bold text-foreground leading-tight">{organization.name}</h2>
              {organization.website ? (
                <a
                  href={organization.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/90 mt-1 transition-colors"
                >
                  <Globe className="w-3 h-3" />
                  <span>{organization.website.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ) : (
                <span className="text-xs text-muted-foreground mt-1 block">No website</span>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                  isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800' : 'bg-muted text-muted-foreground border-border'
                }`}>
                  {isActive ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                  <Building2 className="w-3 h-3" />
                  Owner
                </span>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats strip */}
        {!loading && !error && (
          <div className="grid grid-cols-4 divide-x divide-border border-b border-border flex-shrink-0">
            {[
              { label: 'Members',  value: members.length,  sub: `${activeMembers} active`,   color: 'text-primary' },
              { label: 'Roles',    value: roles.length,    sub: 'defined',                    color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Folders',  value: folders.length,  sub: 'created',                    color: 'text-amber-600 dark:text-amber-400' },
              { label: 'Documents',value: totalDocs,        sub: 'across folders',             color: 'text-emerald-600 dark:text-emerald-400' },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center py-3.5 px-2">
                <span className={`text-2xl font-extrabold ${s.color}`}>{s.value}</span>
                <span className="text-[11px] font-semibold text-foreground mt-0.5">{s.label}</span>
                <span className="text-[10px] text-muted-foreground">{s.sub}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        {!loading && !error && (
          <div className="flex gap-0 border-b border-border flex-shrink-0 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors mr-1 ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.icon}
                {tab.label}
                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                  activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
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
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="w-7 h-7 animate-spin mb-3 text-primary" />
              <p className="text-sm">Loading organization data…</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center gap-3 m-6 p-4 bg-red-50 rounded-xl border border-red-200 dark:bg-red-950/40 dark:border-red-900">
              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="p-6">

              {/* ── Members tab ── */}
              {activeTab === 'members' && (
                <div className="space-y-2">
                  {members.length === 0 ? (
                    <EmptyTabState icon={<Users className="w-8 h-8 text-muted-foreground/40" />} text="No members yet" />
                  ) : (
                    members.map((member) => {
                      const cfg = statusConfig[member.status] ?? statusConfig.PENDING;
                      return (
                        <div
                          key={member._id}
                          className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-muted/40 hover:bg-card hover:border-border transition-colors"
                        >
                          {/* Avatar initials */}
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#260559] to-[#6d3fc0] flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-white">
                              {(member.name ?? member.email ?? '?').slice(0, 2).toUpperCase()}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {member.name || 'Unnamed'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{member.email ?? '—'}</p>
                          </div>

                          {/* Role */}
                          {member.roleId && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 flex-shrink-0">
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
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 flex-shrink-0">
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
                    <EmptyTabState icon={<Shield className="w-8 h-8 text-muted-foreground/40" />} text="No roles defined" />
                  ) : (
                    roles.map((role) => {
                      const perms = role.permissions?.permissions ?? {};
                      const enabled = Object.values(perms).filter(Boolean).length;
                      const total   = Object.keys(perms).length || 6;
                      return (
                        <div
                          key={role._id}
                          className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border bg-muted/40 hover:bg-card hover:border-border transition-colors"
                        >
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{role.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {role.description || 'No description'}
                            </p>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border flex-shrink-0 ${
                            enabled > 0
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-muted text-muted-foreground border-border'
                          }`}>
                            <CheckCircle2 className="w-3 h-3" />
                            {enabled} / {total} permissions
                          </span>

                          {/* Members using this role */}
                          {(() => {
                            const count = members.filter(
                              (m) => m.roleId && String(m.roleId._id) === String(role._id)
                            ).length;
                            return count > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground flex-shrink-0">
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
                    <EmptyTabState icon={<FolderOpen className="w-8 h-8 text-muted-foreground/40" />} text="No folders created yet" />
                  ) : (
                    folders.map((folder) => (
                      <div
                        key={folder._id}
                        className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border bg-muted/40 hover:bg-card hover:border-border transition-colors"
                      >
                        <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0">
                          <FolderOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{folder.name}</p>
                          {folder.createdAt && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Calendar className="w-2.5 h-2.5" />
                              Created {formatDate(folder.createdAt)}
                            </p>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border flex-shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
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
        <div className="px-6 py-4 border-t border-border flex-shrink-0 flex items-center justify-between bg-muted/40">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            {organization.gst ? `GST: ${organization.gst}` : 'No GST registered'}
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

/* ─── Empty tab state ─── */
const EmptyTabState: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
      {icon}
    </div>
    <p className="text-sm">{text}</p>
  </div>
);
