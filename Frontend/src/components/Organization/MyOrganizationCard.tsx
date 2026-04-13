import React, { useState, useRef, useEffect } from 'react';

import {
  Building2, Globe, ExternalLink, CheckCircle2, Clock,
  Edit, Trash2, ShieldCheck, Info, Users,
  Settings, PersonStanding, ChevronRight, AlertCircle, X, LayoutDashboard,
} from 'lucide-react';
import type { Organization } from '../../types/organization';
import { useNavigate } from 'react-router-dom';

interface MyOrganizationCardProps {
  organization: Organization;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSettings?: () => void;
  onTeams?: () => void;
  onVerify?: () => void;
  onViewDetails?: () => void;
}

export const MyOrganizationCard: React.FC<MyOrganizationCardProps> = ({
  organization,
  onClick,
  onEdit,
  onDelete,
  onTeams,
  onVerify,
  onViewDetails,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showVerificationTooltip, setShowVerificationTooltip] = useState(false);
  const [verifyTooltip, setVerifyTooltip] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = typeof organization.status === 'boolean'
    ? organization.status
    : organization.status === true;

  const isVerified = organization.isVerified === true;
  const verificationStatus = organization.verificationStatus;
  const isVerificationRequested = organization.isverifcationRequested === true;
  const hasRemark = !!organization.remark;

  const initials = organization.name
    ? organization.name.slice(0, 2).toUpperCase()
    : '??';

  return (
    <div
      onClick={onClick}
      className="group bg-card text-card-foreground rounded-2xl border border-border hover:border-primary/40 dark:hover:border-primary/50 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
    >
      {/* Top accent */}
      <div className="h-1 w-full bg-gradient-to-r from-[#260559] to-[#6d3fc0]" />

      <div className="p-5 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Logo / Avatar */}
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#260559] to-[#6d3fc0] flex items-center justify-center shadow-sm">
              {organization.logo ? (
                <img
                  src={organization.logo}
                  alt={organization.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-sm font-bold text-white">{initials}</span>
              )}
            </div>

            {/* Name + website */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
                {organization.name}
              </h3>
              {organization.website ? (
                <a
                  href={organization.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors truncate mt-0.5"
                >
                  <Globe className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{organization.website.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                </a>
              ) : (
                <span className="text-xs text-muted-foreground mt-0.5 block">No website</span>
              )}
            </div>
          </div>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {/* Active / Inactive */}
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
            isActive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-muted text-muted-foreground border-border'
          }`}>
            {isActive ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {isActive ? 'Active' : 'Inactive'}
          </span>

          {/* Owner */}
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
            <Building2 className="w-3 h-3" />
            Owner
          </span>

          {/* Verified */}
          {isVerified && verificationStatus === 'APPROVED' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
              <ShieldCheck className="w-3 h-3" />
              Verified
            </span>
          )}

          {/* Pending verification */}
          {!isVerified && isVerificationRequested && verificationStatus === 'PENDING' && (
            <div
              className="relative"
              onMouseEnter={() => setShowVerificationTooltip(true)}
              onMouseLeave={() => setShowVerificationTooltip(false)}
            >
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 cursor-help">
                <Clock className="w-3 h-3" />
                Pending
              </span>
              {showVerificationTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-popover text-popover-foreground border border-border shadow-md text-xs rounded-lg whitespace-nowrap pointer-events-none z-50">
                  Verification request submitted
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover" />
                </div>
              )}
            </div>
          )}

          {/* Rejected — click to see reason */}
          {verificationStatus === 'REJECTED' && hasRemark && (
            <div
              className="relative"
              onMouseEnter={() => setVerifyTooltip(true)}
              onMouseLeave={() => setVerifyTooltip(false)}
            >
              <button
                onClick={(e) => { e.stopPropagation(); setShowRejectionModal(true); }}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-950/60 transition-colors"
              >
                <Info className="w-3 h-3" />
                Rejected
              </button>
              {verifyTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground border border-border shadow-md text-xs rounded-lg max-w-xs whitespace-normal z-50 pointer-events-none">
                  {organization.remark}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Meta info */}
        <div className="flex-1 space-y-2 mb-4">
          {organization.gst && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-muted-foreground/80 uppercase tracking-wide text-[10px]">GST</span>
              <span className="font-mono text-foreground">{organization.gst}</span>
            </div>
          )}
        </div>

        {/* Footer action bar */}
        <div className="pt-3.5 border-t border-border flex items-center gap-1 flex-wrap">
          {/* View Details */}
          <button
            onClick={(e) => { e.stopPropagation(); onViewDetails?.(); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            View
          </button>

          {/* Get Verified */}
          {!isVerified && !isVerificationRequested && (
            <button
              onClick={(e) => { e.stopPropagation(); onVerify?.(); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Verify
            </button>
          )}

          {/* Team */}
          <button
            onClick={(e) => { e.stopPropagation(); if (!isActive) return; onTeams?.(); }}
            disabled={!isActive}
            title={!isActive ? 'Organization is inactive' : undefined}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              isActive
                ? 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                : 'text-muted-foreground/40 dark:text-muted-foreground/25 cursor-not-allowed'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Team
          </button>

          {/* Settings dropdown */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isActive) return;
                setSettingsOpen((v) => !v);
              }}
              disabled={!isActive}
              title={!isActive ? 'Organization is inactive' : undefined}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                isActive
                  ? 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                  : 'text-muted-foreground/40 dark:text-muted-foreground/25 cursor-not-allowed'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>

            {settingsOpen && isActive && (
              <div className="absolute left-0 bottom-full mb-2 w-52 bg-popover text-popover-foreground rounded-sm shadow-lg border border-border z-[100] py-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setSettingsOpen(false); onEdit?.(); }}
                  className="w-full flex border-b border-border items-center gap-2.5 px-3.5 py-2 text-xs text-popover-foreground hover:bg-accent transition-colors"
                >
                
                  <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                  Edit Organization
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSettingsOpen(false);
                    navigate(`/organization/roles/${organization._id}`);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-popover-foreground hover:bg-accent transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <PersonStanding className="w-3.5 h-3.5 text-muted-foreground" />
                    Manage Roles
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
                </button>
                <div className="border-t border-border my-1" />
                <button
                  onClick={(e) => { e.stopPropagation(); setSettingsOpen(false); onDelete?.(); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Organization
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rejection reason modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60 backdrop-blur-sm">
          <div className="bg-card text-card-foreground rounded-xl shadow-2xl border border-border w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Verification Rejected</h2>
              </div>
              <button
                onClick={() => setShowRejectionModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <p className="text-sm font-semibold text-muted-foreground mb-3">Request Status</p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 border border-red-200 dark:bg-red-950/40 dark:border-red-900">
                  <div className="w-2 h-2 rounded-full bg-red-600 dark:bg-red-500" />
                  <span className="text-sm font-semibold text-red-700 dark:text-red-400">Rejected</span>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-semibold text-muted-foreground mb-3">Rejection Reason</p>
                <div className="bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-900 rounded-lg p-4">
                  <p className="text-sm text-foreground leading-relaxed">{organization.remark}</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Please review the rejection reason and submit again with the required information.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRejectionModal(false)}
                  className="px-6 py-2.5 text-foreground bg-muted rounded-lg font-semibold hover:bg-muted/80 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => { setShowRejectionModal(false); onVerify?.(); }}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Resubmit Verification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
