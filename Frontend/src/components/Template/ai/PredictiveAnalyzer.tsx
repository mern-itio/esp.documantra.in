import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';

interface PerformancePrediction {
  templateId: string;
  templateName: string;
  predictedMetrics: {
    completionRate: number;
    averageCompletionTime: string;
    userSatisfaction: number;
    errorRate: number;
    adoptionRate: number;
  };
  confidenceInterval: {
    completionRate: { lower: number; upper: number };
    averageTime: { lower: string; upper: string };
    userSatisfaction: { lower: number; upper: number };
  };
  factors: Array<{
    factor: string;
    impact: number;
    direction: 'positive' | 'negative';
    description: string;
  }>;
  recommendations: Array<{
    type: 'optimization' | 'warning' | 'enhancement';
    priority: 'high' | 'medium' | 'low';
    description: string;
    expectedImpact: string;
    implementation: string;
  }>;
}

interface PredictiveAnalyzerProps {
  templateId?: string;
  templateData?: any;
  onPredictionUpdate: (prediction: PerformancePrediction) => void;
}

export const PredictiveAnalyzer: React.FC<PredictiveAnalyzerProps> = ({
  templateId,
  templateData,
  onPredictionUpdate
}) => {
  const [prediction, setPrediction] = useState<PerformancePrediction | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'completion' | 'satisfaction' | 'errors' | 'adoption'>('completion');

  useEffect(() => {
    if (templateId || templateData) {
      generatePrediction();
    }
  }, [templateId, templateData]);

  const generatePrediction = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI prediction analysis
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockPrediction: PerformancePrediction = {
      templateId: templateId || 'template_001',
      templateName: 'Employment Contract Template',
      predictedMetrics: {
        completionRate: 94.7,
        averageCompletionTime: '6.8 minutes',
        userSatisfaction: 4.6,
        errorRate: 3.2,
        adoptionRate: 87.3
      },
      confidenceInterval: {
        completionRate: { lower: 92.1, upper: 97.3 },
        averageTime: { lower: '5.9 minutes', upper: '7.7 minutes' },
        userSatisfaction: { lower: 4.3, upper: 4.9 }
      },
      factors: [
        {
          factor: 'Field Complexity',
          impact: 23.4,
          direction: 'negative',
          description: 'Complex field arrangements may reduce completion rates'
        },
        {
          factor: 'Mobile Optimization',
          impact: 18.7,
          direction: 'positive',
          description: 'Good mobile experience increases user satisfaction'
        },
        {
          factor: 'Instructions Clarity',
          impact: 15.3,
          direction: 'positive',
          description: 'Clear instructions improve completion rates'
        },
        {
          factor: 'Form Length',
          impact: 12.8,
          direction: 'negative',
          description: 'Longer forms tend to have higher abandonment rates'
        },
        {
          factor: 'Validation Feedback',
          impact: 11.2,
          direction: 'positive',
          description: 'Real-time validation reduces errors'
        }
      ],
      recommendations: [
        {
          type: 'optimization',
          priority: 'high',
          description: 'Simplify salary input field to improve completion rate',
          expectedImpact: '+4.2% completion rate',
          implementation: 'Replace complex dropdown with simple text input with currency formatting'
        },
        {
          type: 'enhancement',
          priority: 'medium',
          description: 'Add clearer instructions for benefits section',
          expectedImpact: '+2.1% user satisfaction',
          implementation: 'Include tooltip explanations for each benefit option'
        },
        {
          type: 'warning',
          priority: 'high',
          description: 'High abandonment risk at signature section',
          expectedImpact: '-8.3% completion rate if not addressed',
          implementation: 'Add progress indicator and simplify signature process'
        },
        {
          type: 'optimization',
          priority: 'medium',
          description: 'Optimize for mobile devices',
          expectedImpact: '+6.7% mobile completion rate',
          implementation: 'Adjust field sizes and spacing for mobile screens'
        }
      ]
    };

    setPrediction(mockPrediction);
    onPredictionUpdate(mockPrediction);
    setIsAnalyzing(false);
  };

  const getMetricColor = (value: number, type: 'percentage' | 'rating' | 'error') => {
    if (type === 'error') {
      if (value <= 5) return 'text-green-600';
      if (value <= 10) return 'text-yellow-600';
      return 'text-red-600';
    } else if (type === 'rating') {
      if (value >= 4.5) return 'text-green-600';
      if (value >= 4.0) return 'text-blue-600';
      if (value >= 3.5) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (value >= 90) return 'text-green-600';
      if (value >= 80) return 'text-blue-600';
      if (value >= 70) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'optimization':
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'enhancement':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Target className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'optimization':
        return 'border-blue-200 bg-blue-50';
      case 'warning':
        return 'border-red-200 bg-red-50';
      case 'enhancement':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-4">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Predictive Performance Analyzer</h2>
          <p className="text-sm text-gray-600">AI-powered template performance predictions and optimization</p>
        </div>
      </div>

      {/* Analysis Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="completion">Completion Analysis</option>
            <option value="satisfaction">Satisfaction Prediction</option>
            <option value="errors">Error Rate Forecast</option>
            <option value="adoption">Adoption Prediction</option>
          </select>
        </div>
        <button
          onClick={generatePrediction}
          disabled={isAnalyzing}
          className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Analyzing...
            </>
          ) : (
            <>
              <BarChart3 className="w-4 h-4 mr-2" />
              Analyze Performance
            </>
          )}
        </button>
      </div>

      {/* Prediction Results */}
      {prediction && (
        <div className="space-y-6">
          {/* Predicted Metrics */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-900 mb-4">Predicted Performance Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getMetricColor(prediction.predictedMetrics.completionRate, 'percentage')}`}>
                  {prediction.predictedMetrics.completionRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Completion Rate</div>
                <div className="text-xs text-gray-500 mt-1">
                  {prediction.confidenceInterval.completionRate.lower.toFixed(1)}% - {prediction.confidenceInterval.completionRate.upper.toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {prediction.predictedMetrics.averageCompletionTime}
                </div>
                <div className="text-sm text-gray-600">Avg. Time</div>
                <div className="text-xs text-gray-500 mt-1">
                  {prediction.confidenceInterval.averageTime.lower} - {prediction.confidenceInterval.averageTime.upper}
                </div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getMetricColor(prediction.predictedMetrics.userSatisfaction, 'rating')}`}>
                  {prediction.predictedMetrics.userSatisfaction.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Satisfaction</div>
                <div className="text-xs text-gray-500 mt-1">
                  {prediction.confidenceInterval.userSatisfaction.lower.toFixed(1)} - {prediction.confidenceInterval.userSatisfaction.upper.toFixed(1)}
                </div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getMetricColor(prediction.predictedMetrics.errorRate, 'error')}`}>
                  {prediction.predictedMetrics.errorRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Error Rate</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getMetricColor(prediction.predictedMetrics.adoptionRate, 'percentage')}`}>
                  {prediction.predictedMetrics.adoptionRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Adoption Rate</div>
              </div>
            </div>
          </div>

          {/* Impact Factors */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Performance Impact Factors</h3>
            <div className="space-y-3">
              {prediction.factors.map((factor, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900">{factor.factor}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        factor.direction === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {factor.direction === 'positive' ? '+' : '-'}{factor.impact.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{factor.description}</p>
                  </div>
                  <div className="w-16 text-right">
                    <div className={`text-lg font-bold ${
                      factor.direction === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {factor.direction === 'positive' ? '↗' : '↘'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">AI Optimization Recommendations</h3>
            <div className="space-y-3">
              {prediction.recommendations.map((rec, index) => (
                <div key={index} className={`border rounded-lg p-4 ${getRecommendationColor(rec.type)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getRecommendationIcon(rec.type)}
                      <span className="font-medium text-gray-900">{rec.description}</span>
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getPriorityColor(rec.priority)}`}>
                      {rec.priority}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Expected Impact:</strong> {rec.expectedImpact}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Implementation:</strong> {rec.implementation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Confidence Metrics */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-md font-medium text-gray-900 mb-4">Prediction Confidence</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">94.2%</div>
                <div className="text-sm text-gray-600">Model Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">87.6%</div>
                <div className="text-sm text-gray-600">Data Quality</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">91.3%</div>
                <div className="text-sm text-gray-600">Prediction Confidence</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!prediction && !isAnalyzing && (
        <div className="text-center text-gray-400 py-12">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Ready to Analyze</h3>
          <p className="text-sm">Click "Analyze Performance" to generate AI-powered predictions</p>
        </div>
      )}
    </div>
  );
};