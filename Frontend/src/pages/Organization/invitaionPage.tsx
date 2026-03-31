import React, { useEffect, useState, useCallback } from 'react';
import {
  Check,
  ExternalLink,
  Handshake,
  Loader2,
  Mail,
  Shield,
  User,
  X,
  AlertCircle,
  ArrowRight,
  FileText,
  UserCircle,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { organizationApi } from '../../services/apiHelper';
import Swal from 'sweetalert2';

interface OrgDetails {
  _id?: string;
  name: string;
  logo?: string;
  website?: string;
  gst?: string;
}

interface InvitedBy {
  name: string | null;
  email: string | null;
}

interface Invitation {
  _id: string;
  name: string;
  email: string;
  status: 'PENDING' | 'ACTIVE' | 'DISABLED' | 'REJECTED';
  /** Populated from OrganizationRole */
  roleId?: { name: string; description?: string };
  /** Legacy shape if API ever sends `role` */
  role?: { name: string };
  organizationId: OrgDetails | string;
  invitedBy?: InvitedBy | null;
}

const STATUS_CONFIG: Record<
  Invitation['status'],
  { label: string; description: string; className: string; dotClass: string }
> = {
  PENDING: {
    label: 'Pending your response',
    description: 'Accept to join the organization or decline if you prefer not to.',
    className: 'bg-amber-50 text-amber-900 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  ACTIVE: {
    label: 'Accepted',
    description: 'You are a member of this organization. Open Organizations to continue.',
    className: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  DISABLED: {
    label: 'Invitation disabled',
    description: 'This link is no longer valid. Contact the organization admin if you need access.',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    dotClass: 'bg-gray-400',
  },
  REJECTED: {
    label: 'Declined',
    description: 'You chose not to join. You can close this page.',
    className: 'bg-red-50 text-red-900 border-red-200',
    dotClass: 'bg-red-500',
  },
};

function orgInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
  return name.slice(0, 2).toUpperCase() || 'OR';
}

const InvitationPage: React.FC = () => {
  const invitationid = useParams<{ invUserId: string }>().invUserId;
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<'accept' | 'reject' | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);

  const getInvitationDetails = useCallback(async (id: string) => {
    if (!id) {
      setInvitation(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await organizationApi.get(`/api/organization/invitation/${id}`);
      if (result.status === 200) {
        setInvitation(result.data?.data ?? null);
        setLogoFailed(false);
      } else {
        setInvitation(null);
      }
    } catch {
      setInvitation(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getInvitationDetails(invitationid ?? '');
  }, [invitationid, getInvitationDetails]);

  useEffect(() => {
    setLogoFailed(false);
  }, [invitation?.organizationId]);

  const redirectToOrganizations = () => {
    window.location.href = '/organizations';
  };

  const handleAccept = async (id: string) => {
    setActionLoading('accept');
    try {
      const result = await organizationApi.post(`/api/organization/invitation/accept/${id}`);
      if (result.status === 200) {
        await Swal.fire({
          title: 'Welcome aboard',
          text: 'You have joined the organization.',
          icon: 'success',
          confirmButtonText: 'Go to organizations',
          confirmButtonColor: '#260559',
        });
        redirectToOrganizations();
      }
    } catch {
      await Swal.fire({
        title: 'Something went wrong',
        text: 'We could not accept this invitation. Please try again.',
        icon: 'error',
        confirmButtonColor: '#260559',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading('reject');
    try {
      const result = await organizationApi.post(`/api/organization/invitation/reject/${id}`);
      if (result.status === 200) {
        await Swal.fire({
          title: 'Invitation declined',
          text: 'You have declined this invitation.',
          icon: 'info',
          confirmButtonText: 'OK',
          confirmButtonColor: '#260559',
        }).then((r) => {
          if (r.isConfirmed) redirectToOrganizations();
        });
      }
    } catch {
      await Swal.fire({
        title: 'Something went wrong',
        text: 'We could not update this invitation. Please try again.',
        icon: 'error',
        confirmButtonColor: '#260559',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const statusConfig = invitation ? STATUS_CONFIG[invitation.status] : null;

  const org: OrgDetails | null =
    invitation && typeof invitation.organizationId === 'object'
      ? invitation.organizationId
      : null;

  const orgName = org?.name ?? '—';
  const roleName = invitation?.roleId?.name ?? invitation?.role?.name ?? '';
  // const roleDescription = invitation?.roleId?.description;

  return (
    <div className=" bg-gradient-to-br from-slate-50 via-purple-50/40 to-gray-100 flex items-center justify-center">
      <div className="w-full max-w-6xl">
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-purple-900/5 p-8 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-[#260559] animate-spin" aria-hidden />
            <p className="text-sm font-medium text-gray-600">Loading invitation…</p>
          </div>
        ) : !invitation ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#260559] to-[#6d3fc0]" />
            <div className="p-10 text-center">
              <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-gray-500" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-purple-700 mb-2">Invitation</p>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Unable to load invitation</h1>
              <p className="text-sm text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                This link may be invalid, expired, or you may not have permission to view it.
              </p>
              <button
                type="button"
                onClick={redirectToOrganizations}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-lg hover:opacity-95 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #260559 0%, #4c1d95 100%)' }}
              >
                Back to organizations
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-purple-900/5 overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#260559] via-[#4c1d95] to-[#6d3fc0]" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-0">
              {/* Organization hero — large logo & org details */}
              <div
                className="lg:col-span-5 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-100"
                style={{ background: 'linear-gradient(180deg, #faf8ff 0%, #f4f0ff 55%, #ffffff 100%)' }}
              >
                <div className="flex flex-1 flex-col items-center justify-center p-8 sm:p-10 min-h-[280px] lg:min-h-[420px]">
                  <div className="w-full max-w-[280px] aspect-square max-h-[min(52vw,280px)] lg:max-h-[320px] rounded-2xl border-2 border-white shadow-lg bg-white flex items-center justify-center p-6 sm:p-8">
                    {org?.logo && !logoFailed ? (
                      <img
                        src={org.logo}
                        alt={`${orgName} logo`}
                        className="max-w-full max-h-full w-auto h-auto object-contain"
                        onError={() => setLogoFailed(true)}
                      />
                    ) : (
                      <div
                        className="w-full h-full min-h-[160px] rounded-xl flex items-center justify-center text-4xl sm:text-5xl font-bold text-white shadow-inner"
                        style={{ background: 'linear-gradient(145deg, #260559 0%, #6d3fc0 100%)' }}
                      >
                        {orgInitials(orgName)}
                      </div>
                    )}
                  </div>

                  <div className="mt-8 text-center w-full max-w-md px-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-purple-800/70 mb-2">
                      Organization
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{orgName}</h2>

                    {org?.website ? (
                      <a
                        href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 mt-3 text-sm font-semibold text-[#260559] hover:text-[#34106a] break-all"
                      >
                        <span className="break-all">{org.website.replace(/^https?:\/\//, '')}</span>
                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                      </a>
                    ) : null}

                    {org?.gst ? (
                      <p className="mt-4 text-sm text-gray-600 flex flex-wrap items-center justify-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/80 border border-gray-200">
                          <FileText className="w-3.5 h-3.5 text-gray-500" />
                          <span className="font-mono text-gray-800 tracking-wide break-all">{org.gst}</span>
                        </span>
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Invitation details & actions */}
              <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col">
                <div className="flex items-start gap-4 mb-8">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-white/20"
                    style={{ background: 'linear-gradient(145deg, #260559 0%, #5b21b6 100%)' }}
                  >
                    <Handshake className="w-6 h-6 text-white" aria-hidden />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-purple-700 mb-1">
                      Collaboration invitation
                    </p>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                      Join <span className="text-[#260559]">{orgName}</span>
                    </h1>
                  </div>
                </div>

                {/* Invited by */}
                <div className="rounded-2xl border border-gray-200 bg-gray-50/90 p-5 mb-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                    Invited by
                  </p>
                  {invitation.invitedBy?.name || invitation.invitedBy?.email ? (
                    <div className="flex items-start gap-4">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-bold text-white"
                        style={{ background: 'linear-gradient(145deg, #3730a3 0%, #6366f1 100%)' }}
                      >
                        {invitation.invitedBy?.name
                          ? orgInitials(invitation.invitedBy.name)
                          : (invitation.invitedBy.email?.slice(0, 2).toUpperCase() ?? '?')}
                      </div>
                      <div className="min-w-0 flex-1">
                        {invitation.invitedBy.name ? (
                          <p className="text-base font-bold text-gray-900 break-words">
                            {invitation.invitedBy.name}
                          </p>
                        ) : null}
                        {invitation.invitedBy.email ? (
                          <p className="text-sm text-gray-600 mt-1 break-all flex items-start gap-2">
                            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                            {invitation.invitedBy.email}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <UserCircle className="w-4 h-4" />
                      Organization administrator (details not available)
                    </p>
                  )}
                </div>

                {/* Your invitation */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 mb-6 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                    Your invitation
                  </p>

                  <div className="grid gap-4 sm:grid-cols-3">

                    {/* Name */}
                    <div className="flex items-start gap-2.5 min-w-0">
                      <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          Name
                        </p>
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {invitation.name}
                        </p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-start gap-2.5 min-w-0">
                      <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          Email
                        </p>
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {invitation.email}
                        </p>
                      </div>
                    </div>

                    {/* Role */}
                    {roleName && (
                      <div className="flex items-start gap-2.5 min-w-0">
                        <Shield className="w-4 h-4 text-[#260559] mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            Role
                          </p>
                          <span className="inline-flex mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#260559]/10 text-[#260559] border border-[#260559]/20">
                            {roleName}
                          </span>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {statusConfig && (
                  <div
                    className={`rounded-xl border px-4 py-3.5 mb-8 ${statusConfig.className}`}
                    role="status"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${statusConfig.dotClass}`} />
                      <p className="text-sm font-semibold">{statusConfig.label}</p>
                    </div>
                    <p className="text-xs leading-relaxed opacity-90 pl-4">{statusConfig.description}</p>
                  </div>
                )}

                {invitation.status === 'PENDING' ? (
                  <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                    <button
                      type="button"
                      disabled={!!actionLoading}
                      onClick={() => handleAccept(invitation._id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                      style={{ background: 'linear-gradient(135deg, #260559 0%, #4c1d95 100%)' }}
                    >
                      {actionLoading === 'accept' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Accept invitation
                    </button>
                    <button
                      type="button"
                      disabled={!!actionLoading}
                      onClick={() => handleReject(invitation._id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      {actionLoading === 'reject' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      Decline
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-2 mt-auto">
                    <p className="text-sm text-gray-600">
                      No further action is required for this invitation.
                    </p>
                    <button
                      type="button"
                      onClick={redirectToOrganizations}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#260559] hover:text-[#34106a]"
                    >
                      Go to my organizations
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitationPage;
