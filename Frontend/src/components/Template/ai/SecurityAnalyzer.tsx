import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Lock, FileText, Users, Database } from 'lucide-react';

interface SecurityIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'access_control' | 'data_protection' | 'compliance' | 'authentication' | 'encryption';
  title: string;
  description: string;
  recommendation: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  autoFixable: boolean;
}

interface SecurityAnalysis {
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  issues: SecurityIssue[];
  compliance: {
    gdpr: number;
    hipaa: number;
    sox: number;
    iso27001: number;
  };
  recommendations: Array<{
    priority: 'immediate' | 'short_term' | 'long_term';
    action: string;
    impact: string;
  }>;
}

interface SecurityAnalyzerProps {
  templateId: string;
  templateData: any;
  onSecurityUpdate: (fixes: string[]) => void;
}

export const SecurityAnalyzer: React.FC<SecurityAnalyzerProps> = ({
  templateId,
  templateData:_templateData,
  onSecurityUpdate
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<SecurityAnalysis | null>(null);
  const [selectedFixes, setSelectedFixes] = useState<string[]>([]);
  const [analysisMode, setAnalysisMode] = useState<'basic' | 'comprehensive' | 'compliance'>('basic');

  const runSecurityAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI security analysis
    await new Promise(resolve => setTimeout(resolve, 3000));

    const mockAnalysis: SecurityAnalysis = {
      overallScore: 78.4,
      riskLevel: 'medium',
      issues: [
        {
          id: 'issue_1',
          severity: 'high',
          category: 'access_control',
          title: 'Insufficient Access Controls',
          description: 'Template allows unrestricted access to sensitive fields without proper role-based permissions',
          recommendation: 'Implement role-based field access controls with granular permissions',
          impact: 'Unauthorized users may access confidential information',
          effort: 'medium',
          autoFixable: true
        },
        {
          id: 'issue_2',
          severity: 'critical',
          category: 'data_protection',
          title: 'Unencrypted Sensitive Data',
          description: 'Personal identifiable information (PII) fields are not encrypted at rest',
          recommendation: 'Enable field-level encryption for PII data using AES-256',
          impact: 'Data breach could expose sensitive personal information',
          effort: 'high',
          autoFixable: false
        },
        {
          id: 'issue_3',
          severity: 'medium',
          category: 'compliance',
          title: 'Missing GDPR Consent Tracking',
          description: 'Template does not include mechanisms for tracking user consent for data processing',
          recommendation: 'Add consent tracking fields and audit trail for GDPR compliance',
          impact: 'Non-compliance with GDPR regulations',
          effort: 'medium',
          autoFixable: true
        },
        {
          id: 'issue_4',
          severity: 'medium',
          category: 'authentication',
          title: 'Weak Signature Authentication',
          description: 'Signature fields use basic authentication without multi-factor verification',
          recommendation: 'Implement multi-factor authentication for signature fields',
          impact: 'Potential signature forgery or unauthorized signing',
          effort: 'low',
          autoFixable: true
        },
        {
          id: 'issue_5',
          severity: 'low',
          category: 'encryption',
          title: 'Weak Password Requirements',
          description: 'Template access passwords do not meet security best practices',
          recommendation: 'Enforce strong password policy with complexity requirements',
          impact: 'Increased risk of unauthorized access through weak passwords',
          effort: 'low',
          autoFixable: true
        }
      ],
      compliance: {
        gdpr: 72.3,
        hipaa: 85.7,
        sox: 68.9,
        iso27001: 79.2
      },
      recommendations: [
        {
          priority: 'immediate',
          action: 'Enable encryption for all PII fields',
          impact: 'Prevents data exposure in case of breach'
        },
        {
          priority: 'short_term',
          action: 'Implement role-based access controls',
          impact: 'Reduces unauthorized access to sensitive data'
        },
        {
          priority: 'long_term',
          action: 'Establish comprehensive audit logging',
          impact: 'Improves compliance and incident response capabilities'
        }
      ]
    };

    setAnalysis(mockAnalysis);
    setIsAnalyzing(false);
  };

  const toggleFix = (issueId: string) => {
    setSelectedFixes(prev => 
      prev.includes(issueId)
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId]
    );
  };

  const applySecurityFixes = () => {
    onSecurityUpdate(selectedFixes);
    setSelectedFixes([]);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'access_control':
        return <Users className="w-4 h-4" />;
      case 'data_protection':
        return <Database className="w-4 h-4" />;
      case 'compliance':
        return <FileText className="w-4 h-4" />;
      case 'authentication':
        return <Lock className="w-4 h-4" />;
      case 'encryption':
        return <Shield className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'critical':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center mr-4">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">AI Security Analyzer</h2>
          <p className="text-sm text-gray-600">Comprehensive security analysis and threat detection</p>
        </div>
      </div>

      {/* Analysis Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <select
            value={analysisMode}
            onChange={(e) => setAnalysisMode(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="basic">Basic Security Scan</option>
            <option value="comprehensive">Comprehensive Analysis</option>
            <option value="compliance">Compliance Focused</option>
          </select>
          <div className="text-sm text-gray-600">
            Template: <span className="font-mono text-gray-900">{templateId}</span>
          </div>
        </div>
        <button
          onClick={runSecurityAnalysis}
          disabled={isAnalyzing}
          className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Analyzing...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Run Security Analysis
            </>
          )}
        </button>
      </div>

      {/* Security Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Security Overview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-900 mb-4">Security Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                  {analysis.overallScore.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Security Score</div>
              </div>
              <div className="text-center">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelColor(analysis.riskLevel)}`}>
                  {analysis.riskLevel.toUpperCase()}
                </div>
                <div className="text-sm text-gray-600 mt-1">Risk Level</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {analysis.issues.filter(i => i.severity === 'critical' || i.severity === 'high').length}
                </div>
                <div className="text-sm text-gray-600">Critical/High Issues</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analysis.issues.filter(i => i.autoFixable).length}
                </div>
                <div className="text-sm text-gray-600">Auto-Fixable</div>
              </div>
            </div>
          </div>

          {/* Compliance Scores */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-900 mb-4">Compliance Assessment</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`text-xl font-bold ${getScoreColor(analysis.compliance.gdpr)}`}>
                  {analysis.compliance.gdpr.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">GDPR</div>
              </div>
              <div className="text-center">
                <div className={`text-xl font-bold ${getScoreColor(analysis.compliance.hipaa)}`}>
                  {analysis.compliance.hipaa.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">HIPAA</div>
              </div>
              <div className="text-center">
                <div className={`text-xl font-bold ${getScoreColor(analysis.compliance.sox)}`}>
                  {analysis.compliance.sox.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">SOX</div>
              </div>
              <div className="text-center">
                <div className={`text-xl font-bold ${getScoreColor(analysis.compliance.iso27001)}`}>
                  {analysis.compliance.iso27001.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">ISO 27001</div>
              </div>
            </div>
          </div>

          {/* Security Issues */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-gray-900">
                Security Issues ({analysis.issues.length})
              </h3>
              {selectedFixes.length > 0 && (
                <button
                  onClick={applySecurityFixes}
                  className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Apply Fixes ({selectedFixes.length})
                </button>
              )}
            </div>

            <div className="space-y-3">
              {analysis.issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`border rounded-lg p-4 ${
                    selectedFixes.includes(issue.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {issue.autoFixable && (
                        <input
                          type="checkbox"
                          checked={selectedFixes.includes(issue.id)}
                          onChange={() => toggleFix(issue.id)}
                          className="mt-1"
                        />
                      )}
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(issue.category)}
                        <h4 className="font-medium text-gray-900">{issue.title}</h4>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getSeverityColor(issue.severity)}`}>
                        {issue.severity}
                      </span>
                      {issue.autoFixable && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                          Auto-fixable
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{issue.description}</p>

                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Impact:</span>
                      <span className="text-red-600 ml-2">{issue.impact}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Recommendation:</span>
                      <span className="text-gray-600 ml-2">{issue.recommendation}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Effort:</span>
                      <span className="text-gray-600 ml-2 capitalize">{issue.effort}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-md font-medium text-gray-900 mb-4">Priority Recommendations</h3>
            <div className="space-y-3">
              {analysis.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                  <div className={`w-3 h-3 rounded-full mt-2 ${
                    rec.priority === 'immediate' ? 'bg-red-500' :
                    rec.priority === 'short_term' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}></div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{rec.action}</div>
                    <div className="text-sm text-gray-600 mt-1">{rec.impact}</div>
                    <div className="text-xs text-gray-500 mt-1 capitalize">{rec.priority.replace('_', ' ')} priority</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!analysis && !isAnalyzing && (
        <div className="text-center text-gray-400 py-12">
          <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Ready to Analyze</h3>
          <p className="text-sm">Click "Run Security Analysis" to identify potential security vulnerabilities</p>
        </div>
      )}
    </div>
  );
};