import React, { useState } from 'react';
import { BarChart3, TrendingUp, Target, Zap } from 'lucide-react';

interface ComplexityMetrics {
  overallComplexity: number;
  fieldComplexity: number;
  structuralComplexity: number;
  logicalComplexity: number;
  userExperienceComplexity: number;
  maintenanceComplexity: number;
}

interface ComplexityAnalysis {
  metrics: ComplexityMetrics;
  level: 'simple' | 'moderate' | 'complex' | 'very_complex';
  recommendations: Array<{
    type: 'simplification' | 'optimization' | 'restructuring';
    priority: 'high' | 'medium' | 'low';
    description: string;
    impact: string;
    effort: string;
  }>;
  factors: Array<{
    factor: string;
    contribution: number;
    description: string;
    suggestion: string;
  }>;
}

interface TemplateComplexityAnalyzerProps {
  templateData: any;
  onAnalysisComplete: (analysis: ComplexityAnalysis) => void;
}

export const TemplateComplexityAnalyzer: React.FC<TemplateComplexityAnalyzerProps> = ({
  templateData:_templateData,
  onAnalysisComplete
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ComplexityAnalysis | null>(null);

  const analyzeComplexity = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI complexity analysis
    await new Promise(resolve => setTimeout(resolve, 2500));

    const mockAnalysis: ComplexityAnalysis = {
      metrics: {
        overallComplexity: 7.2,
        fieldComplexity: 6.8,
        structuralComplexity: 7.9,
        logicalComplexity: 8.1,
        userExperienceComplexity: 6.5,
        maintenanceComplexity: 7.4
      },
      level: 'complex',
      recommendations: [
        {
          type: 'simplification',
          priority: 'high',
          description: 'Reduce the number of conditional logic branches',
          impact: '-2.1 complexity points',
          effort: 'Medium'
        },
        {
          type: 'optimization',
          priority: 'high',
          description: 'Consolidate similar field types into groups',
          impact: '-1.8 complexity points',
          effort: 'Low'
        },
        {
          type: 'restructuring',
          priority: 'medium',
          description: 'Break down large sections into smaller, focused components',
          impact: '-1.5 complexity points',
          effort: 'High'
        },
        {
          type: 'simplification',
          priority: 'medium',
          description: 'Simplify validation rules and error messages',
          impact: '-1.2 complexity points',
          effort: 'Low'
        },
        {
          type: 'optimization',
          priority: 'low',
          description: 'Optimize field ordering for logical flow',
          impact: '-0.8 complexity points',
          effort: 'Low'
        }
      ],
      factors: [
        {
          factor: 'Conditional Logic Depth',
          contribution: 23.4,
          description: 'Multiple nested conditional statements increase cognitive load',
          suggestion: 'Flatten conditional logic or use decision tables'
        },
        {
          factor: 'Field Count and Variety',
          contribution: 18.7,
          description: 'High number of different field types creates complexity',
          suggestion: 'Group related fields and use consistent field types'
        },
        {
          factor: 'Validation Rules',
          contribution: 15.3,
          description: 'Complex validation logic affects user experience',
          suggestion: 'Simplify validation rules and provide clear feedback'
        },
        {
          factor: 'Section Structure',
          contribution: 12.8,
          description: 'Deep nesting and unclear section hierarchy',
          suggestion: 'Flatten structure and improve section organization'
        },
        {
          factor: 'Cross-field Dependencies',
          contribution: 11.2,
          description: 'Fields that depend on multiple other fields',
          suggestion: 'Reduce dependencies or make them more explicit'
        },
        {
          factor: 'Dynamic Content',
          contribution: 9.8,
          description: 'Content that changes based on user input',
          suggestion: 'Minimize dynamic content or provide clear previews'
        },
        {
          factor: 'Integration Points',
          contribution: 8.8,
          description: 'Multiple external system integrations',
          suggestion: 'Consolidate integrations or make them optional'
        }
      ]
    };

    setAnalysis(mockAnalysis);
    onAnalysisComplete(mockAnalysis);
    setIsAnalyzing(false);
  };

  const getComplexityColor = (level: string) => {
    switch (level) {
      case 'simple':
        return 'text-green-600 bg-green-100';
      case 'moderate':
        return 'text-blue-600 bg-blue-100';
      case 'complex':
        return 'text-orange-600 bg-orange-100';
      case 'very_complex':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getMetricColor = (value: number) => {
    if (value <= 3) return 'text-green-600';
    if (value <= 5) return 'text-blue-600';
    if (value <= 7) return 'text-yellow-600';
    if (value <= 8) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'simplification':
        return <Target className="w-4 h-4 text-green-600" />;
      case 'optimization':
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'restructuring':
        return <Zap className="w-4 h-4 text-[#155E4B]" />;
      default:
        return <BarChart3 className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mr-4">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Template Complexity Analyzer</h2>
          <p className="text-sm text-gray-600">AI-powered complexity assessment and optimization recommendations</p>
        </div>
      </div>

      {/* Analysis Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-600">
          Analyzing template structure, logic, and user experience complexity
        </div>
        <button
          onClick={analyzeComplexity}
          disabled={isAnalyzing}
          className="flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md font-medium disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Analyzing...
            </>
          ) : (
            <>
              <BarChart3 className="w-4 h-4 mr-2" />
              Analyze Complexity
            </>
          )}
        </button>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Overall Complexity */}
          <div className="bg-[#F5F2EE] rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-gray-900">Complexity Assessment</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getComplexityColor(analysis.level)}`}>
                {analysis.level.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getMetricColor(analysis.metrics.overallComplexity)}`}>
                  {analysis.metrics.overallComplexity.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Overall Complexity</div>
                <div className="text-xs text-gray-500 mt-1">Scale: 1-10</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analysis.recommendations.length}
                </div>
                <div className="text-sm text-gray-600">Recommendations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analysis.recommendations.reduce((sum, rec) => 
                    sum + parseFloat(rec.impact.match(/-?([\d.]+)/)?.[1] || '0'), 0
                  ).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Potential Reduction</div>
              </div>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Complexity Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(analysis.metrics).map(([key, value]) => {
                if (key === 'overallComplexity') return null;
                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                return (
                  <div key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{label}</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className={`h-2 rounded-full ${
                            value <= 3 ? 'bg-green-500' :
                            value <= 5 ? 'bg-blue-500' :
                            value <= 7 ? 'bg-yellow-500' :
                            value <= 8 ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${(value / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className={`text-lg font-bold ml-4 ${getMetricColor(value)}`}>
                      {value.toFixed(1)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Complexity Factors */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Contributing Factors</h3>
            <div className="space-y-3">
              {analysis.factors.map((factor, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{factor.factor}</h4>
                    <span className="text-sm font-medium text-orange-600">
                      {factor.contribution.toFixed(1)}% contribution
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{factor.description}</p>
                  <div className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
                    <strong>Suggestion:</strong> {factor.suggestion}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optimization Recommendations */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Optimization Recommendations</h3>
            <div className="space-y-3">
              {analysis.recommendations.map((rec, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(rec.type)}
                      <h4 className="font-medium text-gray-900">{rec.description}</h4>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityColor(rec.priority)}`}>
                      {rec.priority}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Expected Impact:</span>
                      <span className="text-green-600 ml-2">{rec.impact}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Implementation Effort:</span>
                      <span className="text-gray-600 ml-2">{rec.effort}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Complexity Visualization */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-md font-medium text-gray-900 mb-4">Complexity Visualization</h3>
            <div className="bg-[#F5F2EE] rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Complexity Distribution</h4>
                  <div className="space-y-2">
                    {Object.entries(analysis.metrics).filter(([key]) => key !== 'overallComplexity').map(([key, value]) => {
                      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                      return (
                        <div key={key} className="flex items-center">
                          <div className="w-20 text-xs text-gray-600 truncate">{label}</div>
                          <div className="flex-1 mx-3">
                            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  value <= 3 ? 'bg-green-500' :
                                  value <= 5 ? 'bg-blue-500' :
                                  value <= 7 ? 'bg-yellow-500' :
                                  value <= 8 ? 'bg-orange-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${(value / 10) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="w-8 text-xs text-gray-600 text-right">{value.toFixed(1)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Optimization Impact</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Current Complexity:</span>
                      <span className={`font-medium ${getMetricColor(analysis.metrics.overallComplexity)}`}>
                        {analysis.metrics.overallComplexity.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Potential After Optimization:</span>
                      <span className="font-medium text-green-600">
                        {(analysis.metrics.overallComplexity - 
                          analysis.recommendations.reduce((sum, rec) => 
                            sum + parseFloat(rec.impact.match(/-?([\d.]+)/)?.[1] || '0'), 0
                          )
                        ).toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Improvement:</span>
                      <span className="font-medium text-blue-600">
                        {analysis.recommendations.reduce((sum, rec) => 
                          sum + parseFloat(rec.impact.match(/-?([\d.]+)/)?.[1] || '0'), 0
                        ).toFixed(1)} points
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!analysis && !isAnalyzing && (
        <div className="text-center text-gray-400 py-12">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Ready to Analyze</h3>
          <p className="text-sm">Click "Analyze Complexity" to assess template complexity and get optimization recommendations</p>
        </div>
      )}
    </div>
  );
};