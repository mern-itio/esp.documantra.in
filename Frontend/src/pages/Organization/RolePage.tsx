import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Shield, Plus, Edit, ArrowLeft, CheckCircle2,
  XCircle, FileSignature, FolderOpen, Building2, Users,
} from 'lucide-react';
import type { Role } from '../../types/organization';
import { organizationApi } from '../../services/apiHelper';
import CreateRoleModal from '../../components/Organization/CreateRoleModal';

/* ─── permission metadata ─── */
const PERMISSION_META: Record<string, { label: string; icon: React.ReactNode; group: string }> = {
  ENVELOPE_CREATE:   { label: 'Create Envelopes',   icon: <FileSignature className="w-3 h-3" />, group: 'Documents' },
  ENVELOPE_SHARE:    { label: 'Share Envelopes',    icon: <FileSignature className="w-3 h-3" />, group: 'Documents' },
  FOLDER_CREATE:     { label: 'Create Folders',     icon: <FolderOpen    className="w-3 h-3" />, group: 'Folders'   },
  FOLDER_SHARE:      { label: 'Share Folders',      icon: <FolderOpen    className="w-3 h-3" />, group: 'Folders'   },
  ORG_SHARE:         { label: 'Share Organization', icon: <Building2     className="w-3 h-3" />, group: 'Org'       },
  ORG_SETTINGS_EDIT: { label: 'Edit Settings',      icon: <Building2     className="w-3 h-3" />, group: 'Org'       },
};

const RolePage: React.FC = () => {
  const navigate = useNavigate();
  const { orgId } = useParams<{ orgId: string }>();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const fetchRoles = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const response = await organizationApi.get(`/api/organization/fetch-roles/${orgId}`);
      setRoles(response.data?.data || response.data || []);
    } catch (err) {
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const openCreate = () => { setSelectedRole(null); setShowModal(true); };
  const openEdit   = (role: Role) => { setSelectedRole(role); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setSelectedRole(null); };

  const enabledCount = (role: Role) =>
    Object.values(role.permissions?.permissions || {}).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">

      {/* ── Page header ── */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-6">

          {/* Top row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
             
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Roles & Permissions</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Define what each role can do within your organization
                </p>
              </div>
            </div>

            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Role
            </button>
          </div>

          {/* Stats strip */}
          {!loading && (
            <div className="mt-6 flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                </span>
                <span className="font-semibold text-foreground">{roles.length}</span>
                <span className="text-muted-foreground">role{roles.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2 text-sm">
                <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </span>
                <span className="text-muted-foreground">Manage team access by assigning roles to members</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          /* Skeleton */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-muted" />
                  <div className="h-4 bg-muted rounded w-32" />
                </div>
                <div className="h-3 bg-muted/80 rounded w-3/4 mb-4" />
                <div className="flex gap-2 flex-wrap">
                  {[1,2,3].map(j => <div key={j} className="h-6 w-20 bg-muted rounded-full" />)}
                </div>
              </div>
            ))}
          </div>
        ) : roles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {roles.map((role) => (
              <RoleCard
                key={role._id}
                role={role}
                enabledCount={enabledCount(role)}
                onEdit={() => openEdit(role)}
              />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-5">
              <Shield className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No roles defined yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-6">
              Create roles to control what each team member can do inside your organization.
            </p>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create first role
            </button>
          </div>
        )}
      </div>

      <CreateRoleModal
        isOpen={showModal}
        onClose={closeModal}
        organizationId={orgId || ''}
        onCreated={fetchRoles}
        role={selectedRole || undefined}
      />
    </div>
  );
};

/* ─── Role card ─── */
interface RoleCardProps {
  role: Role;
  enabledCount: number;
  onEdit: () => void;
}

const GROUPS = ['Documents', 'Folders', 'Org'] as const;
const GROUP_COLORS: Record<string, string> = {
  Documents: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800',
  Folders:   'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  Org:       'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
};

const RoleCard: React.FC<RoleCardProps> = ({ role, enabledCount, onEdit }) => {
  const permissions = role.permissions?.permissions || {};
  const totalCount  = Object.keys(PERMISSION_META).length;

  /* Collect enabled permissions per group */
  const groupedEnabled: Record<string, string[]> = { Documents: [], Folders: [], Org: [] };
  Object.entries(permissions).forEach(([key, val]) => {
    if (val && PERMISSION_META[key]) {
      groupedEnabled[PERMISSION_META[key].group]?.push(key);
    }
  });

  return (
    <div className="bg-card text-card-foreground rounded-2xl border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
      {/* Top accent */}
      <div className="h-1 w-full bg-gradient-to-r from-primary to-primary/70" />

      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">{role.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {role.description || 'No description provided'}
              </p>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
            title="Edit role"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Permission count pill */}
        <div className="mb-4">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
            enabledCount > 0
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-muted text-muted-foreground border-border'
          }`}>
            {enabledCount > 0
              ? <CheckCircle2 className="w-3 h-3" />
              : <XCircle     className="w-3 h-3" />}
            {enabledCount} / {totalCount} permissions enabled
          </span>
        </div>

        {/* Grouped permission chips */}
        <div className="flex-1 space-y-2.5">
          {GROUPS.map((group) => {
            const keys = groupedEnabled[group];
            if (keys.length === 0) return null;
            return (
              <div key={group}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {group}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {keys.map((key) => (
                    <span
                      key={key}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${GROUP_COLORS[group]}`}
                    >
                      {PERMISSION_META[key]?.icon}
                      {PERMISSION_META[key]?.label}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
          {enabledCount === 0 && (
            <p className="text-xs text-muted-foreground italic">No permissions granted</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RolePage;
