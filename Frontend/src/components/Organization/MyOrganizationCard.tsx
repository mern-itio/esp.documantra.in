import React, { useState, useRef, useEffect } from 'react';
import { Building, Globe, FileText, CheckCircle2, Clock, MoreVertical, Settings, Users, ExternalLink, Edit, Trash2, Bell, Shield, Mail, Info, ShieldCheck, PersonStanding } from 'lucide-react';
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
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showSettingsTooltip, setShowSettingsTooltip] = useState(false);
  const [showTeamTooltip, setShowTeamTooltip] = useState(false);
  const [showVerificationTooltip, setShowVerificationTooltip] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const verificationRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenuDropdown(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettingsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Determine status - can be boolean or string
  const statusValue = organization.status;
  const isActive = typeof statusValue === 'boolean' ? statusValue : statusValue === true ;
  const isDisabled = !isActive;
  
  // Verification status
  const isVerified = organization.isverified === true;
  const isVerificationRequested = organization.isverifcationRequested === true;
  const hasRemark = !!organization.remark;

  return (
    <div
      onClick={onClick}
      className="group relative bg-white rounded-xl border-2 border-gray-200 hover:border-[#3E2B66] hover:shadow-xl transition-all duration-300 cursor-pointer"
    >
      {/* Gradient Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#260559] to-[#3E2B66] rounded-t-xl"></div>

      <div className="p-6 overflow-hidden">
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
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenuDropdown(!showMenuDropdown);
                setShowSettingsDropdown(false);
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* Dropdown Menu */}
            {showMenuDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenuDropdown(false);
                      onEdit?.();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenuDropdown(false);
                      onDelete?.();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status and Verification Badge */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {/* Status Badge */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            isActive 
              ? 'bg-green-100 text-green-700 border-green-200' 
              : 'bg-gray-100 text-gray-700 border-gray-200'
          }`}>
            {isActive ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
            <span>{isActive ? 'Active' : 'Inactive'}</span>
          </div>

          {/* Verification Status Icons */}
          {isVerified && (
            <div className="relative" ref={verificationRef}>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                <ShieldCheck className="h-4 w-4" />
                <span>Verified</span>
              </div>
            </div>
          )}
          
          {!isVerified && isVerificationRequested && !hasRemark && (
            <div 
              className="relative" 
              ref={verificationRef}
              onMouseEnter={() => setShowVerificationTooltip(true)}
              onMouseLeave={() => setShowVerificationTooltip(false)}
            >
              <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200 cursor-help">
                <Info className="h-4 w-4" />
              </div>
              {showVerificationTooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap pointer-events-none z-50">
                  Request submitted
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                    <div className="border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {hasRemark && (
            <div 
              className="relative" 
              ref={verificationRef}
              onMouseEnter={() => setShowVerificationTooltip(true)}
              onMouseLeave={() => setShowVerificationTooltip(false)}
            >
              <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 border border-red-200 cursor-help">
                <Info className="h-4 w-4" />
              </div>
              {showVerificationTooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap pointer-events-none z-50 max-w-xs">
                  Rejected Verification: {organization.remark}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                    <div className="border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              )}
            </div>
          )}
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
        <div className="flex items-center gap-2 pt-4 border-t border-gray-100 relative flex-wrap">
          {/* Get Verified Button */}
          {!isVerified && !isVerificationRequested && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onVerify?.();
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Get Verified</span>
            </button>
          )}
          
          <div className="relative" ref={settingsRef}>
            <div className="relative" style={isDisabled ? { cursor: 'not-allowed' } : {}}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isDisabled) return;
                  setShowSettingsDropdown(!showSettingsDropdown);
                  setShowMenuDropdown(false);
                }}
                disabled={isDisabled}
                onMouseEnter={() => {
                  if (isDisabled) {
                    setShowSettingsTooltip(true);
                  }
                }}
                onMouseLeave={() => {
                  setShowSettingsTooltip(false);
                }}
                style={isDisabled ? { cursor: 'not-allowed', pointerEvents: 'auto' } : {}}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isDisabled
                    ? 'text-gray-400 opacity-60'
                    : 'text-gray-700 hover:text-[#3E2B66] hover:bg-gray-50'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
              
              {/* Tooltip for disabled state */}
              {isDisabled && showSettingsTooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap pointer-events-none z-50"
                     onMouseEnter={() => setShowSettingsTooltip(true)}
                     onMouseLeave={() => setShowSettingsTooltip(false)}>
                  Organization is not active
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                    <div className="border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Settings Dropdown */}
            {showSettingsDropdown && isActive && (
              <div className="absolute left-0 bottom-full mb-3 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-[100]">
                <div className="py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSettingsDropdown(false);
                      onEdit?.();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Organization</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSettingsDropdown(false);
                      onDelete?.();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Organization</span>
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSettingsDropdown(false);
                      // Handle notifications
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Notifications</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSettingsDropdown(false);
                      // Handle permissions
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Permissions</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSettingsDropdown(false);
                      // Handle invitations
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Invitations</span>
                  </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSettingsDropdown(false);
                    navigate(`/organization/roles/${organization._id}`);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <PersonStanding className="w-4 h-4" />
                  <span>Roles</span>
                </button>
                </div>
              </div>
            )}
          </div>
          <div className="relative" style={isDisabled ? { cursor: 'not-allowed' } : {}}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isDisabled) return;
                onTeams?.();
              }}
              disabled={isDisabled}
              onMouseEnter={() => {
                if (isDisabled) {
                  setShowTeamTooltip(true);
                }
              }}
              onMouseLeave={() => {
                setShowTeamTooltip(false);
              }}
              style={isDisabled ? { cursor: 'not-allowed', pointerEvents: 'auto' } : {}}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isDisabled
                  ? 'text-gray-400 opacity-60'
                  : 'text-gray-700 hover:text-[#3E2B66] hover:bg-gray-50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Team</span>
            </button>
            
            {/* Tooltip for disabled state */}
            {isDisabled && showTeamTooltip && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap pointer-events-none z-50"
                   onMouseEnter={() => setShowTeamTooltip(true)}
                   onMouseLeave={() => setShowTeamTooltip(false)}>
                Organization is not active
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                  <div className="border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

