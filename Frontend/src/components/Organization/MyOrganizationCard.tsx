import React, { useState, useRef, useEffect } from 'react';
import {
  Building2, Globe, ExternalLink, CheckCircle2, Clock,
  Edit, Trash2, ShieldCheck, Info, Users,
  Settings, PersonStanding, ChevronRight,
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
}

export const MyOrganizationCard: React.FC<MyOrganizationCardProps> = ({
  organization,
  onClick,
  onEdit,
  onDelete,
  onTeams,
  onVerify,
}) => {
  const [_menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [verifyTooltip, setVerifyTooltip] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const statusValue = organization.status;
  const isActive = typeof statusValue === 'boolean' ? statusValue : statusValue === true;
  const isVerified = organization.isverified === true;
  const isVerificationRequested = organization.isverifcationRequested === true;
  const hasRemark = !!organization.remark;

  const initials = organization.name
    ? organization.name.slice(0, 2).toUpperCase()
    : '??';

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border border-gray-200 hover:border-[#260559]/40 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
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
              <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-[#260559] transition-colors">
                {organization.name}
              </h3>
              {organization.website ? (
                <a
                  href={organization.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#260559] transition-colors truncate mt-0.5"
                >
                  <Globe className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{organization.website.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                </a>
              ) : (
                <span className="text-xs text-gray-400 mt-0.5 block">No website</span>
              )}
            </div>
          </div>

        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {/* Status */}
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
            isActive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-gray-100 text-gray-500 border-gray-200'
          }`}>
            {isActive
              ? <CheckCircle2 className="w-3 h-3" />
              : <Clock className="w-3 h-3" />}
            {isActive ? 'Active' : 'Inactive'}
          </span>

          {/* Owner badge */}
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#260559]/8 text-[#260559] border border-[#260559]/20">
            <Building2 className="w-3 h-3" />
            Owner
          </span>

          {/* Verification */}
          {isVerified && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <ShieldCheck className="w-3 h-3" />
              Verified
            </span>
          )}

          {!isVerified && isVerificationRequested && !hasRemark && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-3 h-3" />
              Pending
            </span>
          )}

          {hasRemark && (
            <div
              className="relative"
              onMouseEnter={() => setVerifyTooltip(true)}
              onMouseLeave={() => setVerifyTooltip(false)}
            >
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-600 border border-red-200 cursor-help">
                <Info className="w-3 h-3" />
                Rejected
              </span>
              {verifyTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg max-w-xs whitespace-normal z-50 pointer-events-none">
                  {organization.remark}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Meta info */}
        <div className="flex-1 space-y-2 mb-4">
          {organization.gst && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="font-medium text-gray-400 uppercase tracking-wide text-[10px]">GST</span>
              <span className="font-mono text-gray-700">{organization.gst}</span>
            </div>
          )}
        </div>

        {/* Footer action bar */}
        <div className="pt-3.5 border-t border-gray-100 flex items-center gap-1 flex-wrap">
          {/* Get Verified */}
          {!isVerified && !isVerificationRequested && (
            <button
              onClick={(e) => { e.stopPropagation(); onVerify?.(); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Get Verified
            </button>
          )}

          {/* Team */}
          <button
            onClick={(e) => { e.stopPropagation(); if (!isActive) return; onTeams?.(); }}
            disabled={!isActive}
            title={!isActive ? 'Organization is inactive' : undefined}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              isActive
                ? 'text-gray-600 hover:text-[#260559] hover:bg-[#260559]/6'
                : 'text-gray-300 cursor-not-allowed'
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
                setMenuOpen(false);
              }}
              disabled={!isActive}
              title={!isActive ? 'Organization is inactive' : undefined}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                isActive
                  ? 'text-gray-600 hover:text-[#260559] hover:bg-[#260559]/6'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>

            {settingsOpen && isActive && (
              <div className="absolute left-0 bottom-full mb-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 z-[100] py-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setSettingsOpen(false); onEdit?.(); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5 text-gray-400" />
                  Edit Organization
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSettingsOpen(false);
                    navigate(`/organization/roles/${organization._id}`);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <PersonStanding className="w-3.5 h-3.5 text-gray-400" />
                    Manage Roles
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={(e) => { e.stopPropagation(); setSettingsOpen(false); onDelete?.(); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Organization
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
