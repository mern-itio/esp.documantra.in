import React, { useState } from 'react';
import { Eye, Target, Zap, CheckCircle, AlertTriangle } from 'lucide-react';

interface DetectedField {
  id: string;
  type: 'signature' | 'date' | 'text' | 'email' | 'number' | 'checkbox';
  position: { x: number; y: number };
  confidence: number;
  label: string;
  required: boolean;
  validation?: string;
  suggestions?: string[];
}

interface FieldDetectionResult {
  detectedFields: DetectedField[];
  optimization: {
    placementScore: number;
    accessibilityScore: number;
    completionTimeEstimate: string;
    errorRiskScore: number;
  };
}

interface IntelligentFieldDetectorProps {
  documentContent?: string;
  onFieldsDetected: (fields: DetectedField[]) => void;
}

export const IntelligentFieldDetector: React.FC<IntelligentFieldDetectorProps> = ({
  documentContent:_documenContent,
  onFieldsDetected
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectionResult, setDetectionResult] = useState<FieldDetectionResult | null>(null);
  const [selectedField, setSelectedField] = useState<DetectedField | null>(null);
  const [autoOptimize, setAutoOptimize] = useState(true);

  const analyzeDocument = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI field detection
    await new Promise(resolve => setTimeout(resolve, 2500));

    const mockResult: FieldDetectionResult = {
      detectedFields: [
        {
          id: 'field_1',
          type: 'text',
          position: { x: 100, y: 150 },
          confidence: 96.8,
          label: 'Employee Name',
          required: true,
          validation: 'full_name',
          suggestions: ['Consider adding placeholder text', 'Make field wider for longer names']
        },
        {
          id: 'field_2',
          type: 'email',
          position: { x: 100, y: 200 },
          confidence: 94.2,
          label: 'Email Address',
          required: true,
          validation: 'email_format',
          suggestions: ['Add email validation', 'Include domain restrictions if needed']
        },
        {
          id: 'field_3',
          type: 'date',
          position: { x: 300, y: 150 },
          confidence: 89.5,
          label: 'Start Date',
          required: true,
          validation: 'future_date',
          suggestions: ['Set minimum date to today', 'Add date picker for better UX']
        },
        {
          id: 'field_4',
          type: 'signature',
          position: { x: 100, y: 500 },
          confidence: 98.1,
          label: 'Employee Signature',
          required: true,
          suggestions: ['Position near bottom of document', 'Add date field next to signature']
        },
        {
          id: 'field_5',
          type: 'signature',
          position: { x: 400, y: 500 },
          confidence: 97.3,
          label: 'Employer Signature',
          required: true,
          suggestions: ['Align with employee signature', 'Add title/name field below']
        },
        {
          id: 'field_6',
          type: 'number',
          position: { x: 100, y: 300 },
          confidence: 91.7,
          label: 'Annual Salary',
          required: true,
          validation: 'currency',
          suggestions: ['Format as currency', 'Add minimum/maximum validation']
        }
      ],
      optimization: {
        placementScore: 87.4,
        accessibilityScore: 94.1,
        completionTimeEstimate: '4.2 minutes',
        errorRiskScore: 12.3
      }
    };

    setDetectionResult(mockResult);
    setIsAnalyzing(false);
  };

  const applyOptimizations = () => {
    if (!detectionResult) return;

    // Simulate AI optimization
    const optimizedFields = detectionResult.detectedFields.map(field => ({
      ...field,
      position: {
        x: field.position.x,
        y: field.position.y + (Math.random() - 0.5) * 20 // Small adjustments
      },
      confidence: Math.min(field.confidence + 2, 100)
    }));

    setDetectionResult({
      ...detectionResult,
      detectedFields: optimizedFields,
      optimization: {
        ...detectionResult.optimization,
        placementScore: Math.min(detectionResult.optimization.placementScore + 5, 100),
        accessibilityScore: Math.min(detectionResult.optimization.accessibilityScore + 3, 100),
        errorRiskScore: Math.max(detectionResult.optimization.errorRiskScore - 2, 0)
      }
    });
  };

  const acceptFields = () => {
    if (detectionResult) {
      onFieldsDetected(detectionResult.detectedFields);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 95) return 'text-green-600 bg-green-100';
    if (confidence >= 85) return 'text-blue-600 bg-blue-100';
    if (confidence >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreColor = (score: number, isRisk = false) => {
    if (isRisk) {
      if (score <= 10) return 'text-green-600';
      if (score <= 20) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (score >= 90) return 'text-green-600';
      if (score >= 75) return 'text-blue-600';
      if (score >= 60) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  return (
    <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-4">
          <Target className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Intelligent Field Detection</h2>
          <p className="text-sm text-gray-600">AI-powered automatic field recognition and placement</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoOptimize}
              onChange={(e) => setAutoOptimize(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Auto-optimize placement</span>
          </label>
        </div>
        <button
          onClick={analyzeDocument}
          disabled={isAnalyzing}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Analyzing...
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Analyze Document
            </>
          )}
        </button>
      </div>

      {/* Detection Results */}
      {detectionResult && (
        <div className="space-y-6">
          {/* Optimization Scores */}
          <div className="bg-[#F5F2EE] rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-900 mb-3">Detection Analysis</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(detectionResult.optimization.placementScore)}`}>
                  {detectionResult.optimization.placementScore.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Placement Score</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(detectionResult.optimization.accessibilityScore)}`}>
                  {detectionResult.optimization.accessibilityScore.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Accessibility</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {detectionResult.optimization.completionTimeEstimate}
                </div>
                <div className="text-sm text-gray-600">Est. Time</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(detectionResult.optimization.errorRiskScore, true)}`}>
                  {detectionResult.optimization.errorRiskScore.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Error Risk</div>
              </div>
            </div>
          </div>

          {/* Detected Fields */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-gray-900">
                Detected Fields ({detectionResult.detectedFields.length})
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={applyOptimizations}
                  className="flex items-center px-3 py-1 text-sm bg-[#DCFCE7] hover:bg-purple-200 text-[#155E4B] rounded-md"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Optimize
                </button>
                <button
                  onClick={acceptFields}
                  className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept Fields
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {detectionResult.detectedFields.map((field) => (
                <div
                  key={field.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedField?.id === field.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedField(field)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        {field.type === 'signature' && <span className="text-blue-600 text-xs font-bold">SIG</span>}
                        {field.type === 'date' && <span className="text-blue-600 text-xs font-bold">DATE</span>}
                        {field.type === 'text' && <span className="text-blue-600 text-xs font-bold">TXT</span>}
                        {field.type === 'email' && <span className="text-blue-600 text-xs font-bold">@</span>}
                        {field.type === 'number' && <span className="text-blue-600 text-xs font-bold">#</span>}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{field.label}</div>
                        <div className="text-sm text-gray-500">
                          Position: ({field.position.x}, {field.position.y})
                          {field.required && <span className="text-red-500 ml-2">Required</span>}
                        </div>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(field.confidence)}`}>
                      {field.confidence.toFixed(1)}%
                    </div>
                  </div>

                  {field.suggestions && field.suggestions.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center text-sm text-amber-600 mb-1">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        AI Suggestions:
                      </div>
                      <ul className="space-y-1">
                        {field.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Field Details */}
          {selectedField && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Field Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field Label</label>
                  <input
                    type="text"
                    value={selectedField.label}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field Type</label>
                  <input
                    type="text"
                    value={selectedField.type}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-[#F5F2EE]"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">X Position</label>
                  <input
                    type="number"
                    value={selectedField.position.x}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Y Position</label>
                  <input
                    type="number"
                    value={selectedField.position.y}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedField.required}
                    className="mr-2"
                    readOnly
                  />
                  <span className="text-sm text-gray-700">Required field</span>
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!detectionResult && !isAnalyzing && (
        <div className="text-center text-gray-400 py-12">
          <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Ready to Analyze</h3>
          <p className="text-sm">Click "Analyze Document" to detect fields automatically using AI</p>
        </div>
      )}
    </div>
  );
};