import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle,
  Clock,
  X,
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
  compact?: boolean;
  /** Admin-enabled Aadhaar eSign — shown like other auth options; applies to the envelope. */
  vsignAvailable?: boolean;
  vsignSelected?: boolean;
  onVSignChange?: (enabled: boolean) => void;
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
  allowMultiple = true, // Default to multi-select
  compact = false,
  vsignAvailable = false,
  vsignSelected = false,
  onVSignChange,
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
      case 'low':
        return 'border border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-100';
      case 'medium':
        return 'border border-primary/30 bg-primary/10 text-primary';
      case 'high':
        return 'border border-orange-500/40 bg-orange-500/15 text-orange-900 dark:text-orange-200';
      case 'maximum':
        return 'border border-success/35 bg-success/10 text-success';
      default:
        return 'border border-border bg-muted text-muted-foreground';
    }
  };

  const getCostColor = (cost: number) => {
    if (cost <= 2) return 'text-success';
    if (cost > 2 && cost < 5) return 'text-primary';
    if (cost >= 5 && cost < 8) return 'text-amber-700 dark:text-amber-300';
    if (cost >= 8) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getRecommendedMethods = () => {


    return authMethods.filter(method =>
      // is recommended based on backend flag
      (method as any).isRecommended
    );
  };

  const renderMethodCard = (method: AuthMethod, isRecommended = false) => {
    const isSelected = localSelectedMethods.includes(method.id);
    const IconName = method.icon || 'Shield';
    const Icon = (LucideIcons as any)[IconName];
    const cardPadding = compact ? 'p-3' : 'p-6';
    const iconSize = compact ? 'h-9 w-9' : 'h-12 w-12';
    const iconInner = compact ? 'h-4 w-4' : 'h-6 w-6';
    const titleSize = compact ? 'text-sm' : 'text-lg';
    const descSize = compact ? 'text-xs mb-2 line-clamp-2' : 'mb-4';
    return (
      <div
        key={method.id}
        className={`relative cursor-pointer rounded-xl border-2 transition-all duration-200 ${cardPadding} ${isSelected
            ? 'border-primary bg-primary/10 shadow-sm'
            : 'border-border bg-card hover:border-primary/40'
          }`}
        onClick={() => toggleMethod(method.id)}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleMethod(method.id);
          }
        }}
      >
        <div
          className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
            isSelected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-muted text-muted-foreground'
          }`}
          aria-hidden
        >
          {isSelected ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
        </div>

        {isRecommended && (
          <div className={`absolute rounded-full bg-success font-medium text-success-foreground ${compact ? '-right-1 -top-1 px-1.5 py-0.5 text-[10px]' : '-right-2 -top-2 px-2 py-1 text-xs'}`}>
            Recommended
          </div>
        )}

        <div className={`flex items-start ${compact ? 'gap-2.5' : 'space-x-4'}`}>
          <div
            className={`flex ${iconSize} flex-shrink-0 items-center justify-center rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
          >
            <Icon className={iconInner} />
          </div>

          <div className="min-w-0 flex-1 pr-5">
            <div className={`mb-1 flex items-center justify-between ${compact ? '' : 'mb-2'}`}>
              <h3 className={`font-semibold text-foreground ${titleSize}`}>{method.name}</h3>
            </div>

            <p className={`text-muted-foreground ${descSize}`}>{method.description}</p>

            <div className={compact ? 'space-y-1' : 'space-y-2'}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Security:</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getSecurityLevelColor(method.securityLevel)}`}>
                  {method.securityLevel.charAt(0).toUpperCase() + method.securityLevel.slice(1)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Time:</span>
                <span className="flex items-center gap-1 text-foreground">
                  <Clock className="h-3 w-3" />
                  {method.estimatedTime}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Cost:</span>
                <span className={`font-medium ${getCostColor(Number(method.cost))}`}>
                  {Number(method.cost)} Credits
                </span>
              </div>

              {!compact && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Compliance:</span>
                  <div className="flex gap-1">
                    {method.compliance.slice(0, 2).map(comp => (
                      <span key={comp} className="rounded bg-muted px-1 py-0.5 text-xs text-muted-foreground">
                        {comp.toUpperCase()}
                      </span>
                    ))}
                    {method.compliance.length > 2 && (
                      <span className="rounded bg-muted px-1 py-0.5 text-xs text-muted-foreground">
                        +{method.compliance.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              )}
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
          <h3 className="text-lg font-semibold text-foreground">Authentication Methods</h3>
          <p className="text-muted-foreground">Select authentication methods for recipients</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle
            className={`h-4 w-4 ${riskLevel === 'high'
              ? 'text-destructive'
              : riskLevel === 'medium'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-success'
              }`}
          />
          <span className="text-muted-foreground">Risk Level:</span>
          <span
            className={`font-medium ${riskLevel === 'high'
              ? 'text-destructive'
              : riskLevel === 'medium'
                ? 'text-amber-700 dark:text-amber-300'
                : 'text-success'
              }`}
          >
            {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
          </span>
        </div>
      </div>

      {/* Aadhaar eSign (VSign) — admin must enable; sender opts in like other auth */}
      {vsignAvailable && (
        <div
          className={`relative cursor-pointer rounded-xl border-2 transition-all duration-200 ${compact ? 'p-3' : 'p-6'} ${
            vsignSelected
              ? 'border-[#155E4B] bg-[#155E4B]/10 shadow-sm'
              : 'border-border bg-card hover:border-[#155E4B]/40'
          }`}
          onClick={() => onVSignChange?.(!vsignSelected)}
          role="button"
          tabIndex={0}
          aria-pressed={vsignSelected}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onVSignChange?.(!vsignSelected);
            }
          }}
        >
          <div
            className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
              vsignSelected
                ? 'border-[#155E4B] bg-[#155E4B] text-white'
                : 'border-border bg-muted text-muted-foreground'
            }`}
            aria-hidden
          >
            {vsignSelected ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          </div>
          <div className={`flex items-start ${compact ? 'gap-2.5' : 'space-x-4'}`}>
            <div
              className={`flex ${compact ? 'h-9 w-9' : 'h-12 w-12'} flex-shrink-0 items-center justify-center rounded-lg ${
                vsignSelected ? 'bg-[#155E4B] text-white' : 'bg-muted text-muted-foreground'
              }`}
            >
              <LucideIcons.Fingerprint className={compact ? 'h-4 w-4' : 'h-6 w-6'} />
            </div>
            <div className="min-w-0 flex-1 pr-5">
              <h3 className={`font-semibold text-foreground ${compact ? 'text-sm' : 'text-lg'}`}>
                Aadhaar eSign (VSign)
              </h3>
              <p className={`text-muted-foreground ${compact ? 'text-xs mb-2' : 'mb-4'}`}>
                Signer draws a signature, then verifies with Aadhaar OTP. Only applies if you select it for this send.
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Security:</span>
                <span className="rounded-full border border-[#155E4B]/30 bg-[#155E4B]/10 px-2 py-0.5 text-[10px] font-medium text-[#155E4B]">
                  Maximum
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('recommended')}
            className={`border-b-2 px-1 py-2 text-sm font-medium transition-colors ${activeTab === 'recommended'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            Recommended ({getRecommendedMethods().length})


          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`border-b-2 px-1 py-2 text-sm font-medium transition-colors ${activeTab === 'all'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            All Methods ({authMethods.length})
          </button>
        </nav>
      </div>

      {/* Selected Methods Summary (multi-select) */}
      {localSelectedMethods.length > 0 && (
        <div className="rounded-lg border border-primary/25 bg-primary/10 p-4">
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            <span className="font-medium text-primary">
              {localSelectedMethods.length} Method{localSelectedMethods.length !== 1 ? 's' : ''} Selected
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {localSelectedMethods.map(methodId => {
              const method = authMethods.find(m => m.id === methodId);
              return method ? (
                <span key={methodId} className="rounded-full bg-primary/15 px-3 py-1 text-sm text-primary">
                  {method.name}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Methods Grid */}
      <div className={`grid gap-3 ${compact ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 gap-6'}`}>
        {(activeTab === 'recommended' ? getRecommendedMethods() : authMethods).map(method =>
          renderMethodCard(method, activeTab === 'recommended')
        )}
      </div>

      {/* Compliance Notice */}
      {complianceRequirements.length > 0 && (
        <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700 dark:text-amber-300" />
            <div>
              <h4 className="font-medium text-amber-950 dark:text-amber-100">Compliance Requirements</h4>
              <p className="mt-1 text-sm text-amber-900/90 dark:text-amber-200/90">
                This envelope requires compliance with: {complianceRequirements.join(', ').toUpperCase()}
              </p>
              <p className="mt-1 text-sm text-amber-900/90 dark:text-amber-200/90">
                Please ensure selected authentication methods meet these requirements.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      {showSaveButton && (
        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
};

export default AdvancedAuthenticationSelector;
