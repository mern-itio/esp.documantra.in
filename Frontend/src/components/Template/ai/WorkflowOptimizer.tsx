import React, { useState } from 'react';
import { Zap, TrendingUp, Clock, Target, AlertTriangle, CheckCircle, Settings, BarChart3 } from 'lucide-react';

interface WorkflowStep {
  id: string;
  name: string;
  type: 'trigger' | 'action' | 'condition' | 'delay';
  duration: number;
  successRate: number;
  bottleneck: boolean;
  optimization?: {
    suggestion: string;
    expectedImprovement: string;
    confidence: number;
  };
}

interface WorkflowAnalysis {
  totalDuration: number;
  overallSuccessRate: number;
  bottlenecks: string[];
  optimizationPotential: number;
  recommendations: Array<{
    type: 'performance' | 'reliability' | 'efficiency';
    priority: 'high' | 'medium' | 'low';
    description: string;
    impact: string;
    implementation: string;
  }>;
}

interface WorkflowOptimizerProps {
  workflowId: string;
  onOptimizationApplied: (optimizations: any[]) => void;
}

export const WorkflowOptimizer: React.FC<WorkflowOptimizerProps> = ({
  workflowId,
  onOptimizationApplied
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<WorkflowAnalysis | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [selectedOptimizations, setSelectedOptimizations] = useState<string[]>([]);

  const analyzeWorkflow = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI workflow analysis
    await new Promise(resolve => setTimeout(resolve, 2500));

    const mockSteps: WorkflowStep[] = [
      {
        id: 'step_1',
        name: 'Template Generation',
        type: 'action',
        duration: 2.3,
        successRate: 98.7,
        bottleneck: false,
        optimization: {
          suggestion: 'Cache frequently used template components',
          expectedImprovement: '-0.8s processing time',
          confidence: 89.2
        }
      },
      {
        id: 'step_2',
        name: 'Data Validation',
        type: 'condition',
        duration: 5.7,
        successRate: 94.1,
        bottleneck: true,
        optimization: {
          suggestion: 'Implement parallel validation for independent fields',
          expectedImprovement: '-2.1s processing time, +3.2% success rate',
          confidence: 94.6
        }
      },
      {
        id: 'step_3',
        name: 'Document Assembly',
        type: 'action',
        duration: 3.2,
        successRate: 99.2,
        bottleneck: false,
        optimization: {
          suggestion: 'Optimize PDF generation engine',
          expectedImprovement: '-0.5s processing time',
          confidence: 76.3
        }
      },
      {
        id: 'step_4',
        name: 'Email Notification',
        type: 'action',
        duration: 1.8,
        successRate: 96.8,
        bottleneck: false,
        optimization: {
          suggestion: 'Implement email queue batching',
          expectedImprovement: '+2.1% reliability',
          confidence: 87.4
        }
      },
      {
        id: 'step_5',
        name: 'Database Update',
        type: 'action',
        duration: 4.1,
        successRate: 97.3,
        bottleneck: true,
        optimization: {
          suggestion: 'Use asynchronous database writes',
          expectedImprovement: '-1.9s processing time',
          confidence: 91.8
        }
      }
    ];

    const mockAnalysis: WorkflowAnalysis = {
      totalDuration: 17.1,
      overallSuccessRate: 96.2,
      bottlenecks: ['Data Validation', 'Database Update'],
      optimizationPotential: 23.7,
      recommendations: [
        {
          type: 'performance',
          priority: 'high',
          description: 'Implement parallel processing for validation steps',
          impact: '-35% processing time',
          implementation: 'Refactor validation logic to process independent fields simultaneously'
        },
        {
          type: 'reliability',
          priority: 'high',
          description: 'Add retry mechanism for failed database operations',
          impact: '+4.2% success rate',
          implementation: 'Implement exponential backoff retry strategy with circuit breaker'
        },
        {
          type: 'efficiency',
          priority: 'medium',
          description: 'Cache template components and reuse across workflows',
          impact: '-15% resource usage',
          implementation: 'Implement Redis-based caching layer for template components'
        },
        {
          type: 'performance',
          priority: 'medium',
          description: 'Optimize document generation pipeline',
          impact: '-20% generation time',
          implementation: 'Use streaming PDF generation instead of in-memory processing'
        }
      ]
    };

    setWorkflowSteps(mockSteps);
    setAnalysis(mockAnalysis);
    setIsAnalyzing(false);
  };

  const toggleOptimization = (stepId: string) => {
    setSelectedOptimizations(prev => 
      prev.includes(stepId)
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const applyOptimizations = () => {
    const optimizations = workflowSteps
      .filter(step => selectedOptimizations.includes(step.id))
      .map(step => ({
        stepId: step.id,
        optimization: step.optimization
      }));

    onOptimizationApplied(optimizations);
    setSelectedOptimizations([]);
  };

  const getStepTypeIcon = (type: string) => {
    switch (type) {
      case 'trigger':
        return <Zap className="w-4 h-4 text-green-600" />;
      case 'action':
        return <Target className="w-4 h-4 text-blue-600" />;
      case 'condition':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'delay':
        return <Clock className="w-4 h-4 text-purple-600" />;
      default:
        return <Settings className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'performance':
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'reliability':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'efficiency':
        return <BarChart3 className="w-4 h-4 text-purple-600" />;
      default:
        return <Settings className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-4">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">AI Workflow Optimizer</h2>
          <p className="text-sm text-gray-600">Analyze and optimize workflow performance with AI</p>
        </div>
      </div>

      {/* Analysis Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-600">
          Workflow ID: <span className="font-mono text-gray-900">{workflowId}</span>
        </div>
        <button
          onClick={analyzeWorkflow}
          disabled={isAnalyzing}
          className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md font-medium disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Analyzing...
            </>
          ) : (
            <>
              <BarChart3 className="w-4 h-4 mr-2" />
              Analyze Workflow
            </>
          )}
        </button>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Overall Metrics */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-900 mb-4">Workflow Performance Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analysis.totalDuration.toFixed(1)}s</div>
                <div className="text-sm text-gray-600">Total Duration</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analysis.overallSuccessRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{analysis.bottlenecks.length}</div>
                <div className="text-sm text-gray-600">Bottlenecks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{analysis.optimizationPotential.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Optimization Potential</div>
              </div>
            </div>
          </div>

          {/* Workflow Steps Analysis */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-gray-900">Step-by-Step Analysis</h3>
              {selectedOptimizations.length > 0 && (
                <button
                  onClick={applyOptimizations}
                  className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Apply Selected ({selectedOptimizations.length})
                </button>
              )}
            </div>

            <div className="space-y-3">
              {workflowSteps.map((step) => (
                <div
                  key={step.id}
                  className={`border rounded-lg p-4 ${
                    step.bottleneck ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  } ${
                    selectedOptimizations.includes(step.id) ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedOptimizations.includes(step.id)}
                        onChange={() => toggleOptimization(step.id)}
                        className="rounded"
                      />
                      {getStepTypeIcon(step.type)}
                      <div>
                        <h4 className="font-medium text-gray-900">{step.name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Duration: {step.duration.toFixed(1)}s</span>
                          <span>Success: {step.successRate.toFixed(1)}%</span>
                          {step.bottleneck && (
                            <span className="text-red-600 font-medium">Bottleneck</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {step.optimization && (
                    <div className="ml-8 p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-blue-900">AI Optimization Suggestion</h5>
                        <span className="text-xs text-blue-600">{step.optimization.confidence.toFixed(0)}% confidence</span>
                      </div>
                      <p className="text-sm text-blue-800 mb-2">{step.optimization.suggestion}</p>
                      <div className="text-sm text-green-700 font-medium">
                        Expected Improvement: {step.optimization.expectedImprovement}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Optimization Recommendations */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">AI Optimization Recommendations</h3>
            <div className="space-y-3">
              {analysis.recommendations.map((rec, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getRecommendationIcon(rec.type)}
                      <h4 className="font-medium text-gray-900">{rec.description}</h4>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityColor(rec.priority)}`}>
                      {rec.priority}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Expected Impact:</strong> {rec.impact}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Implementation:</strong> {rec.implementation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Visualization */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-md font-medium text-gray-900 mb-4">Performance Visualization</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700">Workflow Timeline</span>
                <span className="text-sm text-gray-600">Total: {analysis.totalDuration.toFixed(1)}s</span>
              </div>
              <div className="space-y-2">
                {workflowSteps.map((step) => (
                  <div key={step.id} className="flex items-center">
                    <div className="w-24 text-xs text-gray-600 truncate">{step.name}</div>
                    <div className="flex-1 mx-3">
                      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${step.bottleneck ? 'bg-red-500' : 'bg-blue-500'}`}
                          style={{ width: `${(step.duration / analysis.totalDuration) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-16 text-xs text-gray-600 text-right">{step.duration.toFixed(1)}s</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!analysis && !isAnalyzing && (
        <div className="text-center text-gray-400 py-12">
          <Zap className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Ready to Optimize</h3>
          <p className="text-sm">Click "Analyze Workflow" to get AI-powered optimization recommendations</p>
        </div>
      )}
    </div>
  );
};