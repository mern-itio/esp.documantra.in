import React from 'react';
import { Building2, Globe, ExternalLink, Users, ShieldCheck, ArrowUpRight } from 'lucide-react';
import type { Organization } from '../../types/organization';

interface SharedOrganizationCardProps {
  organization: Organization;
  role?: string;
  onClick?: () => void;
}

export const SharedOrganizationCard: React.FC<SharedOrganizationCardProps> = ({
  organization,
  role = 'Member',
  onClick,
}) => {
  const initials = organization.name
    ? organization.name.slice(0, 2).toUpperCase()
    : '??';

  const isVerified = organization.isVerified === true;

  return (
    <div
      onClick={onClick}
      className="group bg-card text-card-foreground rounded-2xl border border-border hover:border-blue-500/50 dark:hover:border-blue-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
    >
      {/* Top accent — blue for shared */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500" />

      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Logo / Avatar */}
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm">
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
              <h3 className="text-base font-bold text-foreground truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {organization.name}
              </h3>
              {organization.website ? (
                <a
                  href={organization.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors mt-0.5"
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

          {/* Arrow indicator */}
          <div className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground/50 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-colors">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
            <Users className="w-3 h-3" />
            {role}
          </span>

          {isVerified && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
              <ShieldCheck className="w-3 h-3" />
              Verified
            </span>
          )}
        </div>

        {/* Meta */}
        <div className="flex-1 space-y-2 mb-4">
          {organization.gst && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-muted-foreground/80 uppercase tracking-wide text-[10px]">GST</span>
              <span className="font-mono text-foreground">{organization.gst}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="w-3.5 h-3.5" />
            <span>Shared organization</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3.5 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">You have member access</span>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 flex items-center gap-1 transition-colors">
            View
            <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
