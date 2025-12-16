import React from 'react';
import { Building, Globe, FileText, CheckCircle2, Clock, MoreVertical, Settings, Users, ExternalLink } from 'lucide-react';
import type { Organization } from '../../types/organization';

interface MyOrganizationCardProps {
  organization: Organization;
  onClick?: () => void;
}

export const MyOrganizationCard: React.FC<MyOrganizationCardProps> = ({ organization, onClick }) => {
  const getStatusColor = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'SUSPENDED':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const status = organization.status || 'PENDING';

  return (
    <div
      onClick={onClick}
      className="group relative bg-white rounded-xl border-2 border-gray-200 hover:border-[#3E2B66] hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Gradient Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#260559] to-[#3E2B66]"></div>

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4 flex-1">
            {/* Logo */}
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#260559] to-[#3E2B66] flex items-center justify-center shadow-md flex-shrink-0 overflow-hidden">
              {organization.logo ? (
                <img
                  src={organization.logo}
                  alt={organization.name}
                  className="w-full  rounded-lg object-cover"
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
              <h3 className="text-xl font-bold text-gray-900 mb-1 truncate group-hover:text-[#3E2B66] transition-colors">
                {organization.name}
              </h3>
              {organization.website && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Globe className="w-4 h-4" />
                  <a
                    href={organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-[#3E2B66] truncate flex items-center gap-1"
                  >
                    {organization.website.replace(/^https?:\/\//, '')}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Handle menu click
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(status)}`}>
            {getStatusIcon(status)}
            <span>{status}</span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {organization.gst && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="truncate">GST: {organization.gst}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4 text-gray-400" />
            <span>Owner</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Handle settings
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-[#3E2B66] hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Handle manage team
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-[#3E2B66] hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Team</span>
          </button>
        </div>
      </div>
    </div>
  );
};

