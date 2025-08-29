import React, { useState } from 'react';
import { Sparkles, CheckCircle, AlertTriangle, TrendingUp, FileText, Zap, Target, Settings } from 'lucide-react';

interface ContentAnalysis {
  overallScore: number;
  readabilityScore: number;
  clarityScore: number;
  professionalismScore: number;
  complianceScore: number;
  accessibilityScore: number;
}

interface OptimizationSuggestion {
  id: string;
  type: 'grammar' | 'clarity' | 'tone' | 'compliance' | 'accessibility' | 'structure';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  originalText: string;
  suggestedText: string;
  impact: string;
  confidence: number;
}

interface ContentOptimizerProps {
  content: string;
  onContentUpdate: (optimizedContent: string) => void;
  onAnalysisComplete: (analysis: ContentAnalysis) => void;
}

export const ContentOptimizer: React.FC<ContentOptimizerProps> = ({
  content,
  onContentUpdate,
  onAnalysisComplete
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [optimizationMode, setOptimizationMode] = useState<'basic' | 'advanced' | 'legal'>('basic');

  const analyzeContent = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI content analysis
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockAnalysis: ContentAnalysis = {
      overallScore: 87.3,
      readabilityScore: 82.1,
      clarityScore: 91.5,
      professionalismScore: 89.7,
      complianceScore: 85.2,
      accessibilityScore: 88.9
    };

    const mockSuggestions: OptimizationSuggestion[] = [
      {
        id: 'suggestion_1',
        type: 'clarity',
        priority: 'high',
        title: 'Simplify Complex Sentence',
        description: 'This sentence is too complex and may confuse readers',
        originalText: 'The aforementioned employee shall be responsible for the execution of duties as prescribed herein.',
        suggestedText: 'The employee will perform the duties described in this contract.',
        impact: '+12.3% readability improvement',
        confidence: 94.2
      },
      {
        id: 'suggestion_2',
        type: 'grammar',
        priority: 'medium',
        title: 'Fix Grammar Error',
        description: 'Subject-verb disagreement detected',
        originalText: 'The benefits includes health insurance and vacation time.',
        suggestedText: 'The benefits include health insurance and vacation time.',
        impact: '+5.7% professionalism score',
        confidence: 98.1
      },
      {
        id: 'suggestion_3',
        type: 'compliance',
        priority: 'high',
        title: 'Add Required Legal Disclaimer',
        description: 'Employment contracts should include at-will employment clause',
        originalText: '',
        suggestedText: 'This employment is at-will and may be terminated by either party at any time.',
        impact: '+15.4% compliance score',
        confidence: 91.8
      },
      {
        id: 'suggestion_4',
        type: 'tone',
        priority: 'medium',
        title: 'Improve Professional Tone',
        description: 'Language could be more professional and formal',
        originalText: 'You will get paid every two weeks.',
        suggestedText: 'Compensation will be provided bi-weekly.',
        impact: '+8.2% professionalism score',
        confidence: 87.6
      },
      {
        id: 'suggestion_5',
        type: 'accessibility',
        priority: 'medium',
        title: 'Improve Accessibility',
        description: 'Add clearer section headings for screen readers',
        originalText: 'Section 1',
        suggestedText: 'Section 1: Employee Information and Contact Details',
        impact: '+11.1% accessibility score',
        confidence: 89.3
      }
    ];

    setAnalysis(mockAnalysis);
    setSuggestions(mockSuggestions);
    onAnalysisComplete(mockAnalysis);
    setIsAnalyzing(false);
  };

  const toggleSuggestion = (suggestionId: string) => {
    setSelectedSuggestions(prev => 
      prev.includes(suggestionId)
        ? prev.filter(id => id !== suggestionId)
        : [...prev, suggestionId]
    );
  };

  const applyOptimizations = () => {
    const selectedSuggestionObjects = suggestions.filter(s => selectedSuggestions.includes(s.id));
    let optimizedContent = content;

    selectedSuggestionObjects.forEach(suggestion => {
      if (suggestion.originalText) {
        optimizedContent = optimizedContent.replace(suggestion.originalText, suggestion.suggestedText);
      } else {
        optimizedContent += '\n\n' + suggestion.suggestedText;
      }
    });

    onContentUpdate(optimizedContent);
    setSelectedSuggestions([]);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'grammar':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'clarity':
        return <Target className="w-4 h-4 text-green-600" />;
      case 'tone':
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      case 'compliance':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'accessibility':
        return <Settings className="w-4 h-4 text-orange-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center mr-4">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">AI Content Optimizer</h2>
          <p className="text-sm text-gray-600">Enhance content quality with AI-powered suggestions</p>
        </div>
      </div>

      {/* Optimization Mode */}
      <div className="flex items-center space-x-4 mb-6">
        <label className="text-sm font-medium text-gray-700">Optimization Mode:</label>
        <select
          value={optimizationMode}
          onChange={(e) => setOptimizationMode(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="basic">Basic Enhancement</option>
          <option value="advanced">Advanced Optimization</option>
          <option value="legal">Legal Document Focus</option>
        </select>
        <button
          onClick={analyzeContent}
          disabled={isAnalyzing || !content}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Analyzing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Analyze Content
            </>
          )}
        </button>
      </div>

      {/* Content Analysis Scores */}
      {analysis && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-md font-medium text-gray-900 mb-4">Content Quality Analysis</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                {analysis.overallScore.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Overall Score</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(analysis.readabilityScore)}`}>
                {analysis.readabilityScore.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Readability</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(analysis.clarityScore)}`}>
                {analysis.clarityScore.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Clarity</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(analysis.professionalismScore)}`}>
                {analysis.professionalismScore.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Professionalism</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(analysis.complianceScore)}`}>
                {analysis.complianceScore.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Compliance</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(analysis.accessibilityScore)}`}>
                {analysis.accessibilityScore.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Accessibility</div>
            </div>
          </div>
        </div>
      )}

      {/* Optimization Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-medium text-gray-900">
              Optimization Suggestions ({suggestions.length})
            </h3>
            {selectedSuggestions.length > 0 && (
              <button
                onClick={applyOptimizations}
                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Apply Selected ({selectedSuggestions.length})
              </button>
            )}
          </div>

          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedSuggestions.includes(suggestion.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleSuggestion(suggestion.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedSuggestions.includes(suggestion.id)}
                      onChange={() => toggleSuggestion(suggestion.id)}
                      className="mt-1"
                    />
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(suggestion.type)}
                      <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityColor(suggestion.priority)}`}>
                      {suggestion.priority}
                    </span>
                    <span className="text-xs text-gray-500">{suggestion.confidence.toFixed(0)}% confidence</span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>

                {suggestion.originalText && (
                  <div className="space-y-2 mb-3">
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      <div className="text-xs font-medium text-red-700 mb-1">Original:</div>
                      <div className="text-sm text-red-800">{suggestion.originalText}</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded p-2">
                      <div className="text-xs font-medium text-green-700 mb-1">Suggested:</div>
                      <div className="text-sm text-green-800">{suggestion.suggestedText}</div>
                    </div>
                  </div>
                )}

                <div className="text-sm text-blue-600 font-medium">
                  Expected Impact: {suggestion.impact}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!analysis && !isAnalyzing && (
        <div className="text-center text-gray-400 py-12">
          <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Ready to Optimize</h3>
          <p className="text-sm">Add content and click "Analyze Content" to get AI-powered optimization suggestions</p>
        </div>
      )}
    </div>
  );
};