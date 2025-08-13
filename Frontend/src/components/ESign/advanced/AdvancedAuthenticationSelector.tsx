import React, { useState } from 'react';
import { 
  Shield, 
  Smartphone, 
  CreditCard, 
  Video, 
  Fingerprint, 
  Eye, 
  Phone,
  Lock,
  AlertTriangle,
  CheckCircle,
  Clock,
  User
} from 'lucide-react';

interface AuthMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  securityLevel: 'low' | 'medium' | 'high' | 'maximum';
  estimatedTime: string;
  cost: 'free' | 'low' | 'medium' | 'high';
  compliance: string[];
  available: boolean;
}

interface AdvancedAuthenticationSelectorProps {
  selectedMethods: string[];
  onMethodsChange: (methods: string[]) => void;
  riskLevel: 'low' | 'medium' | 'high';
  complianceRequirements?: string[];
}

const AdvancedAuthenticationSelector: React.FC<AdvancedAuthenticationSelectorProps> = ({
  selectedMethods,
  onMethodsChange,
  riskLevel,
  complianceRequirements = []
}) => {
  const [activeTab, setActiveTab] = useState('recommended');

  const authMethods: AuthMethod[] = [
    {
      id: 'email',
      name: 'Email Verification',
      description: 'Send verification link to recipient email',
      icon: Shield,
      securityLevel: 'low',
      estimatedTime: '1-2 minutes',
      cost: 'free',
      compliance: ['esign', 'ueta'],
      available: true
    },
    {
      id: 'sms',
      name: 'SMS Verification',
      description: 'Send verification code via text message',
      icon: Smartphone,
      securityLevel: 'medium',
      estimatedTime: '30 seconds',
      cost: 'low',
      compliance: ['esign', 'ueta'],
      available: true
    },
    {
      id: 'knowledge_based',
      name: 'Knowledge-Based Authentication',
      description: 'Answer questions based on personal history',
      icon: User,
      securityLevel: 'high',
      estimatedTime: '3-5 minutes',
      cost: 'medium',
      compliance: ['esign', 'ueta', 'eidas'],
      available: true
    },
    {
      id: 'government_id',
      name: 'Government ID Verification',
      description: 'Upload and verify government-issued ID',
      icon: CreditCard,
      securityLevel: 'high',
      estimatedTime: '2-4 minutes',
      cost: 'medium',
      compliance: ['esign', 'ueta', 'eidas', 'kyc'],
      available: true
    },
    {
      id: 'biometric',
      name: 'Biometric Authentication',
      description: 'Fingerprint, face, or voice recognition',
      icon: Fingerprint,
      securityLevel: 'maximum',
      estimatedTime: '30 seconds',
      cost: 'high',
      compliance: ['esign', 'ueta', 'eidas', 'fido2'],
      available: true
    },
    {
      id: 'video_id',
      name: 'Video ID Verification',
      description: 'Live video call with identity verification',
      icon: Video,
      securityLevel: 'maximum',
      estimatedTime: '5-10 minutes',
      cost: 'high',
      compliance: ['esign', 'ueta', 'eidas', 'kyc'],
      available: true
    },
    {
      id: 'digital_certificate',
      name: 'Digital Certificate',
      description: 'PKI-based digital certificate authentication',
      icon: Lock,
      securityLevel: 'maximum',
      estimatedTime: '1 minute',
      cost: 'high',
      compliance: ['esign', 'ueta', 'eidas', 'qes'],
      available: true
    },
    {
      id: 'phone',
      name: 'Phone Call Verification',
      description: 'Automated phone call with verification code',
      icon: Phone,
      securityLevel: 'medium',
      estimatedTime: '2-3 minutes',
      cost: 'medium',
      compliance: ['esign', 'ueta'],
      available: true
    }
  ];

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-yellow-600 bg-yellow-100';
      case 'medium': return 'text-blue-600 bg-blue-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'maximum': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'free': return 'text-green-600';
      case 'low': return 'text-blue-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRecommendedMethods = () => {
    const riskBasedMethods = {
      low: ['email', 'sms'],
      medium: ['sms', 'knowledge_based'],
      high: ['knowledge_based', 'government_id', 'biometric']
    };
    
    return authMethods.filter(method => 
      riskBasedMethods[riskLevel].includes(method.id) ||
      complianceRequirements.some(req => method.compliance.includes(req))
    );
  };

  const toggleMethod = (methodId: string) => {
    if (selectedMethods.includes(methodId)) {
      onMethodsChange(selectedMethods.filter(id => id !== methodId));
    } else {
      onMethodsChange([...selectedMethods, methodId]);
    }
  };

  const renderMethodCard = (method: AuthMethod, isRecommended = false) => {
    const isSelected = selectedMethods.includes(method.id);
    const Icon = method.icon;

    return (
      <div
        key={method.id}
        className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
          isSelected
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
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
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
                <span className={`font-medium ${getCostColor(method.cost)}`}>
                  {method.cost.charAt(0).toUpperCase() + method.cost.slice(1)}
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Authentication Methods</h3>
          <p className="text-gray-600">Select authentication methods for recipients</p>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle className={`w-4 h-4 ${
            riskLevel === 'high' ? 'text-red-500' : 
            riskLevel === 'medium' ? 'text-yellow-500' : 'text-green-500'
          }`} />
          <span className="text-gray-600">Risk Level:</span>
          <span className={`font-medium ${
            riskLevel === 'high' ? 'text-red-600' : 
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
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'recommended'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Recommended ({getRecommendedMethods().length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            All Methods ({authMethods.length})
          </button>
        </nav>
      </div>

      {/* Selected Methods Summary */}
      {selectedMethods.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">
              {selectedMethods.length} method{selectedMethods.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedMethods.map(methodId => {
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
    </div>
  );
};

export default AdvancedAuthenticationSelector;