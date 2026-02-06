import React from 'react';
import { Building, Globe, Users, Shield, ExternalLink, ArrowRight } from 'lucide-react';
import type { Organization } from '../../types/organization';

interface SharedOrganizationCardProps {
  organization: Organization;
  role?: string;
  onClick?: () => void;
}

export const SharedOrganizationCard: React.FC<SharedOrganizationCardProps> = ({ organization, role = 'Member', onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group relative bg-white rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Blue Accent Bar for Shared */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4 flex-1">
            {/* Logo */}
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md flex-shrink-0 overflow-hidden">
              {organization.logo ? (
                <img
                  src={organization.logo}
                  alt={organization.name}
                  className="w-full h-full rounded-lg object-fit"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : null}
              {(!organization.logo || organization.logo === '') && (
                <Building className="w-8 h-8 text-white" />
              )}
            </div>

            {/* Organization Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {organization.name}
                </h3>
                <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" />
              </div>
              {organization.website && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Globe className="w-4 h-4" />
                  <a
                    href={organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-blue-600 truncate flex items-center gap-1"
                  >
                    {organization.website.replace(/^https?:\/\//, '')}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Role Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Users className="w-3.5 h-3.5" />
            <span>{role}</span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4 text-gray-400" />
            <span>Shared Organization</span>
          </div>
          {organization.gst && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Globe className="w-4 h-4 text-gray-400" />
              <span className="truncate">GST: {organization.gst}</span>
            </div>
          )}
        </div>

        {/* Footer - View Access */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">You have access to this organization</span>
          <div className="flex items-center gap-1 text-sm font-medium text-blue-600 group-hover:text-blue-700">
            <span>View</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </div>
  );
};

