import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { subscriptionApi } from '../../../services/apiHelper';
import * as LucideIcons from 'lucide-react';

interface AuthMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  securityLevel: 'low' | 'medium' | 'high' | 'maximum';
  estimatedTime: string;
  cost: number;
  compliance: string[];
  available: boolean;
}

interface AdvancedAuthenticationSelectorProps {
  selectedMethods?: string[];
  onMethodsChange?: (methods: string[]) => void;
  onMethodSelect?: (methodId: string | null | string[]) => void; // Updated to support array
  onSave?: (methodId: string | null | string[]) => void; // Updated to support array
  onSelectionChange?: (methodIds: string[]) => void; // Updated to always pass array
  riskLevel: 'low' | 'medium' | 'high';
  complianceRequirements?: string[];
  showSaveButton?: boolean;
  allowMultiple?: boolean; // New prop to enable multi-select
}

const AdvancedAuthenticationSelector: React.FC<AdvancedAuthenticationSelectorProps> = ({
  selectedMethods = [],
  onMethodsChange,
  onMethodSelect,
  onSave,
  onSelectionChange,
  riskLevel,
  complianceRequirements = [],
  showSaveButton = false,
  allowMultiple = true // Default to multi-select
}) => {
  const [activeTab, setActiveTab] = useState('recommended');
  const [authMethods, setAuthMethods] = useState<AuthMethod[]>([]);
  // multi-select mode: keep array of selected method ids
  const [localSelectedMethods, setLocalSelectedMethods] = useState<string[]>(
    selectedMethods || []
  );

  useEffect(() => {
    fetchAvailableAuthMethods();
  }, []);

  // Update localSelectedMethods when selectedMethods prop changes
  useEffect(() => {
    if (selectedMethods && Array.isArray(selectedMethods)) {
      setLocalSelectedMethods(selectedMethods);
    } else {
      setLocalSelectedMethods([]);
    }
  }, [selectedMethods]);

  const fetchAvailableAuthMethods = async () => {
    try {
      const response = await subscriptionApi.get('/user/available/auth/methods');
      if (response.status === 200) {
        setAuthMethods(response.data.data.methods);
      }
    } catch (error) {
      console.error('Error fetching available auth methods:', error);
    }
  };

  // multi-select toggle: add or remove method from selection
  const toggleMethod = (methodId: string) => {
    let newSelected: string[];
    const isCurrentlySelected = localSelectedMethods.includes(methodId);
    
    if (allowMultiple) {
      // Multi-select mode: toggle the method in the array
      if (isCurrentlySelected) {
        newSelected = localSelectedMethods.filter(id => id !== methodId);
      } else {
        newSelected = [...localSelectedMethods, methodId];
      }
    } else {
      // Single-select mode (for backward compatibility)
      newSelected = isCurrentlySelected ? [] : [methodId];
    }
    
    setLocalSelectedMethods(newSelected);
    // Notify parent of selection change
    onMethodsChange?.(newSelected);
    // Notify parent of selection change (for temporary state when using external save button)
    onSelectionChange?.(newSelected);
    
    // Only call onMethodSelect immediately if we're NOT using a save button (legacy behavior)
    if (!showSaveButton && !onSelectionChange) {
      // Legacy behavior: when no save button and no onSelectionChange, call onMethodSelect immediately
      if (allowMultiple) {
        onMethodSelect?.(newSelected.length > 0 ? newSelected : null);
      } else {
        onMethodSelect?.(newSelected.length > 0 ? newSelected[0] : null);
      }
    }
    // Otherwise, wait for the save button to be clicked (either external or internal)
  };

  // Handle save button click
  const handleSave = () => {
    if (onSave) {
      if (allowMultiple) {
        onSave(localSelectedMethods.length > 0 ? localSelectedMethods : null);
      } else {
        onSave(localSelectedMethods.length > 0 ? localSelectedMethods[0] : null);
      }
    } else if (onMethodSelect) {
      // Fallback to onMethodSelect if onSave is not provided
      if (allowMultiple) {
        onMethodSelect(localSelectedMethods.length > 0 ? localSelectedMethods : null);
      } else {
        onMethodSelect(localSelectedMethods.length > 0 ? localSelectedMethods[0] : null);
      }
    }
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-yellow-600 bg-yellow-100';
      case 'medium': return 'text-blue-600 bg-blue-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'maximum': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCostColor = (cost: number) => {
    if (cost <= 2) return 'text-green-600';
    if (cost > 2 && cost < 5) return 'text-blue-600';
    if (cost >= 5 && cost < 8) return 'text-yellow-600';
    if (cost >= 8) return 'text-red-600';
    return 'text-gray-600';
  };

  const getRecommendedMethods = () => {


    return authMethods.filter(method =>
      // is recommended based on backend flag
      (method as any).isRecommended
    );
  };

  const renderMethodCard = (method: AuthMethod, isRecommended = false) => {
    console.log('Rendering method:', method);
    const isSelected = localSelectedMethods.includes(method.id);
    const IconName = method.icon || 'Shield';
    const Icon = (LucideIcons as any)[IconName];
    return (
      <div
        key={method.id}
        className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${isSelected
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        onClick={() => toggleMethod(method.id)}
      >
        {isRecommended && (
          <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            Recommended
          </div>
        )}

        <div className="flex items-start space-x-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
            <Icon className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{method.name}</h3>
              {isSelected && <CheckCircle className="w-5 h-5 text-blue-600" />}
            </div>

            <p className="text-gray-600 mb-4">{method.description}</p>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Security Level:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSecurityLevelColor(method.securityLevel)}`}>
                  {method.securityLevel.charAt(0).toUpperCase() + method.securityLevel.slice(1)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Estimated Time:</span>
                <span className="text-gray-900 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {method.estimatedTime}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Cost:</span>
                <span className={`font-medium ${getCostColor(Number(method.cost))}`}>
                  {Number(method.cost)} Credits
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Compliance:</span>
                <div className="flex gap-1">
                  {method.compliance.slice(0, 2).map(comp => (
                    <span key={comp} className="px-1 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      {comp.toUpperCase()}
                    </span>
                  ))}
                  {method.compliance.length > 2 && (
                    <span className="px-1 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      +{method.compliance.length - 2}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Authentication Methods</h3>
          <p className="text-gray-600">Select authentication methods for recipients</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle className={`w-4 h-4 ${riskLevel === 'high' ? 'text-red-500' :
              riskLevel === 'medium' ? 'text-yellow-500' : 'text-green-500'
            }`} />
          <span className="text-gray-600">Risk Level:</span>
          <span className={`font-medium ${riskLevel === 'high' ? 'text-red-600' :
              riskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
            }`}>
            {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('recommended')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'recommended'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            Recommended ({getRecommendedMethods().length})


          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            All Methods ({authMethods.length})
          </button>
        </nav>
      </div>

      {/* Selected Methods Summary (multi-select) */}
      {localSelectedMethods.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">
              {localSelectedMethods.length} Method{localSelectedMethods.length !== 1 ? 's' : ''} Selected
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {localSelectedMethods.map(methodId => {
              const method = authMethods.find(m => m.id === methodId);
              return method ? (
                <span key={methodId} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {method.name}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(activeTab === 'recommended' ? getRecommendedMethods() : authMethods).map(method =>
          renderMethodCard(method, activeTab === 'recommended')
        )}
      </div>

      {/* Compliance Notice */}
      {complianceRequirements.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900">Compliance Requirements</h4>
              <p className="text-yellow-700 text-sm mt-1">
                This envelope requires compliance with: {complianceRequirements.join(', ').toUpperCase()}
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                Please ensure selected authentication methods meet these requirements.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      {showSaveButton && (
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-[#3E2B66] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
};

export default AdvancedAuthenticationSelector;
