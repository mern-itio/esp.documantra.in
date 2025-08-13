import React from 'react';
import { 
  PenTool, 
  Shield, 
  Award, 
  CheckCircle, 
  AlertCircle,
  Lock,
  Globe,
  Clock
} from 'lucide-react';

interface SignatureType {
  id: 'standard' | 'advanced' | 'qualified';
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  legalWeight: string;
  compliance: string[];
  features: string[];
  requirements: string[];
  cost: 'included' | 'premium' | 'enterprise';
  processingTime: string;
}

interface SignatureTypeSelectorProps {
  selectedType: 'standard' | 'advanced' | 'qualified';
  onTypeChange: (type: 'standard' | 'advanced' | 'qualified') => void;
  complianceRequirements?: string[];
  documentType?: string;
}

const SignatureTypeSelector: React.FC<SignatureTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  complianceRequirements = [],
  documentType
}) => {
  const signatureTypes: SignatureType[] = [
    {
      id: 'standard',
      name: 'Standard Electronic Signature',
      description: 'Basic electronic signature for everyday documents',
      icon: PenTool,
      legalWeight: 'Legally binding for most documents',
      compliance: ['ESIGN Act', 'UETA'],
      features: [
        'Email-based authentication',
        'Basic audit trail',
        'Standard encryption',
        'Mobile-friendly signing'
      ],
      requirements: [
        'Valid email address',
        'Intent to sign'
      ],
      cost: 'included',
      processingTime: 'Instant'
    },
    {
      id: 'advanced',
      name: 'Advanced Electronic Signature',
      description: 'Enhanced security with stronger authentication',
      icon: Shield,
      legalWeight: 'Higher legal weight with enhanced security',
      compliance: ['ESIGN Act', 'UETA', 'eIDAS AES'],
      features: [
        'Multi-factor authentication',
        'Enhanced audit trail',
        'Cryptographic binding',
        'Tamper-evident sealing',
        'Identity verification'
      ],
      requirements: [
        'Strong authentication',
        'Identity verification',
        'Secure signing environment'
      ],
      cost: 'premium',
      processingTime: '2-5 minutes'
    },
    {
      id: 'qualified',
      name: 'Qualified Electronic Signature',
      description: 'Highest security level, equivalent to handwritten signature',
      icon: Award,
      legalWeight: 'Equivalent to handwritten signature',
      compliance: ['ESIGN Act', 'UETA', 'eIDAS QES', 'ISO 14533'],
      features: [
        'Digital certificates (PKI)',
        'Qualified trust service provider',
        'Forensic audit trail',
        'Long-term validation',
        'Cross-border recognition',
        'Timestamping service'
      ],
      requirements: [
        'Digital certificate',
        'Qualified signature creation device',
        'Identity verification',
        'Secure key management'
      ],
      cost: 'enterprise',
      processingTime: '5-10 minutes'
    }
  ];

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'included': return 'text-green-600 bg-green-100';
      case 'premium': return 'text-blue-600 bg-blue-100';
      case 'enterprise': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRecommendedType = () => {
    if (complianceRequirements.includes('eidas_qes') || complianceRequirements.includes('iso_14533')) {
      return 'qualified';
    }
    if (complianceRequirements.includes('eidas_aes') || documentType === 'contract') {
      return 'advanced';
    }
    return 'standard';
  };

  const recommendedType = getRecommendedType();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Signature Type</h3>
        <p className="text-gray-600">Choose the appropriate signature type based on your legal and compliance requirements.</p>
      </div>

      {/* Recommendation Banner */}
      {recommendedType !== selectedType && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Recommendation</h4>
              <p className="text-blue-700 text-sm mt-1">
                Based on your compliance requirements and document type, we recommend using{' '}
                <strong>{signatureTypes.find(t => t.id === recommendedType)?.name}</strong>.
              </p>
              <button
                onClick={() => onTypeChange(recommendedType)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
              >
                Use Recommended Type
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Types */}
      <div className="space-y-4">
        {signatureTypes.map((type) => {
          const isSelected = selectedType === type.id;
          const isRecommended = recommendedType === type.id;
          const Icon = type.icon;

          return (
            <div
              key={type.id}
              className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
              onClick={() => onTypeChange(type.id)}
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
                    <h4 className="text-lg font-semibold text-gray-900">{type.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCostColor(type.cost)}`}>
                        {type.cost.charAt(0).toUpperCase() + type.cost.slice(1)}
                      </span>
                      {isSelected && <CheckCircle className="w-5 h-5 text-blue-600" />}
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4">{type.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1">
                        <Lock className="w-4 h-4" />
                        Legal Weight
                      </h5>
                      <p className="text-sm text-gray-600">{type.legalWeight}</p>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Processing Time
                      </h5>
                      <p className="text-sm text-gray-600">{type.processingTime}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Key Features</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {type.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Requirements</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {type.requirements.map((requirement, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <AlertCircle className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                            {requirement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      Compliance Standards
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {type.compliance.map((standard) => (
                        <span
                          key={standard}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            complianceRequirements.includes(standard.toLowerCase().replace(/\s+/g, '_'))
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {standard}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compliance Notice */}
      {complianceRequirements.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900">Compliance Requirements</h4>
              <p className="text-yellow-700 text-sm mt-1">
                This envelope must comply with: {complianceRequirements.join(', ').toUpperCase()}
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                The selected signature type must meet these compliance standards.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignatureTypeSelector;