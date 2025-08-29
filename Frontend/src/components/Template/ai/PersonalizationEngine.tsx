import React, { useState, useEffect } from 'react';
import { User, Settings, Sparkles, TrendingUp, Clock, Target } from 'lucide-react';

interface UserProfile {
  id: string;
  preferences: {
    templateStyle: 'modern_minimal' | 'classic_formal' | 'creative_bold';
    fieldComplexity: 'simple' | 'intermediate' | 'advanced';
    industryFocus: string;
    languagePreference: string;
    colorScheme: 'light' | 'dark' | 'auto';
  };
  behaviorPatterns: {
    preferredFieldTypes: string[];
    averageTemplateComplexity: number;
    mostUsedSections: string[];
    completionTimePattern: 'fast_completer' | 'thorough_reviewer' | 'gradual_builder';
    peakUsageHours: string[];
  };
  adaptationHistory: Array<{
    timestamp: string;
    adaptation: string;
    trigger: string;
    impact: string;
  }>;
}

interface PersonalizationSuggestion {
  id: string;
  type: 'layout' | 'content' | 'workflow' | 'ui';
  title: string;
  description: string;
  confidence: number;
  expectedImpact: string;
  implementation: string;
}

interface PersonalizationEngineProps {
  userProfile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
  onApplyPersonalization: (suggestions: PersonalizationSuggestion[]) => void;
}

export const PersonalizationEngine: React.FC<PersonalizationEngineProps> = ({
  userProfile,
  onProfileUpdate,
  onApplyPersonalization
}) => {
  const [suggestions, setSuggestions] = useState<PersonalizationSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'suggestions' | 'history'>('profile');

  useEffect(() => {
    generatePersonalizationSuggestions();
  }, [userProfile]);

  const generatePersonalizationSuggestions = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI personalization analysis
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockSuggestions: PersonalizationSuggestion[] = [
      {
        id: 'suggestion_1',
        type: 'layout',
        title: 'Optimize Field Layout for Your Workflow',
        description: 'Based on your usage patterns, rearranging fields in a single-column layout would improve your completion speed',
        confidence: 89.3,
        expectedImpact: '+15.2% completion speed',
        implementation: 'Automatically adjust new templates to use single-column layout with larger field spacing'
      },
      {
        id: 'suggestion_2',
        type: 'content',
        title: 'Customize Default Field Types',
        description: 'You frequently use text and dropdown fields. We can pre-populate these as defaults in new templates',
        confidence: 94.7,
        expectedImpact: '+23.1% template creation speed',
        implementation: 'Set text and dropdown as primary field types in the element library'
      },
      {
        id: 'suggestion_3',
        type: 'workflow',
        title: 'Smart Template Suggestions',
        description: 'Enable AI-powered template recommendations based on your industry focus and recent projects',
        confidence: 87.6,
        expectedImpact: '+18.4% template discovery efficiency',
        implementation: 'Show personalized template recommendations on dashboard and in template library'
      },
      {
        id: 'suggestion_4',
        type: 'ui',
        title: 'Simplified Interface Mode',
        description: 'Your usage pattern suggests you prefer streamlined interfaces. Enable simplified mode for faster navigation',
        confidence: 91.2,
        expectedImpact: '+12.7% navigation efficiency',
        implementation: 'Hide advanced features by default and show them on demand'
      },
      {
        id: 'suggestion_5',
        type: 'content',
        title: 'Industry-Specific Templates',
        description: 'Prioritize technology industry templates in your library based on your focus area',
        confidence: 96.1,
        expectedImpact: '+28.3% relevant template discovery',
        implementation: 'Filter and sort templates to show technology-focused options first'
      }
    ];

    setSuggestions(mockSuggestions);
    setIsAnalyzing(false);
  };

  const toggleSuggestion = (suggestionId: string) => {
    setSelectedSuggestions(prev => 
      prev.includes(suggestionId)
        ? prev.filter(id => id !== suggestionId)
        : [...prev, suggestionId]
    );
  };

  const applySelectedSuggestions = () => {
    const selected = suggestions.filter(s => selectedSuggestions.includes(s.id));
    onApplyPersonalization(selected);
    
    // Add to adaptation history
    const newAdaptations = selected.map(suggestion => ({
      timestamp: new Date().toISOString(),
      adaptation: suggestion.title,
      trigger: 'user_applied_suggestion',
      impact: suggestion.expectedImpact
    }));

    onProfileUpdate({
      ...userProfile,
      adaptationHistory: [...userProfile.adaptationHistory, ...newAdaptations]
    });

    setSelectedSuggestions([]);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-100';
    if (confidence >= 80) return 'text-blue-600 bg-blue-100';
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'layout':
        return <Settings className="w-4 h-4" />;
      case 'content':
        return <Target className="w-4 h-4" />;
      case 'workflow':
        return <TrendingUp className="w-4 h-4" />;
      case 'ui':
        return <User className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'layout':
        return 'bg-blue-100 text-blue-700';
      case 'content':
        return 'bg-green-100 text-green-700';
      case 'workflow':
        return 'bg-purple-100 text-purple-700';
      case 'ui':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'suggestions', label: 'Suggestions', icon: Sparkles },
    { id: 'history', label: 'History', icon: Clock }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mr-4">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Personalization Engine</h2>
          <p className="text-sm text-gray-600">AI-powered template personalization and optimization</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">User Preferences</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template Style</label>
                <select
                  value={userProfile.preferences.templateStyle}
                  onChange={(e) => onProfileUpdate({
                    ...userProfile,
                    preferences: { ...userProfile.preferences, templateStyle: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="modern_minimal">Modern Minimal</option>
                  <option value="classic_formal">Classic Formal</option>
                  <option value="creative_bold">Creative Bold</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Field Complexity</label>
                <select
                  value={userProfile.preferences.fieldComplexity}
                  onChange={(e) => onProfileUpdate({
                    ...userProfile,
                    preferences: { ...userProfile.preferences, fieldComplexity: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="simple">Simple</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry Focus</label>
                <input
                  type="text"
                  value={userProfile.preferences.industryFocus}
                  onChange={(e) => onProfileUpdate({
                    ...userProfile,
                    preferences: { ...userProfile.preferences, industryFocus: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select
                  value={userProfile.preferences.languagePreference}
                  onChange={(e) => onProfileUpdate({
                    ...userProfile,
                    preferences: { ...userProfile.preferences, languagePreference: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="english_us">English (US)</option>
                  <option value="english_uk">English (UK)</option>
                  <option value="spanish">Spanish</option>
                  <option value="french">French</option>
                  <option value="german">German</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Behavior Patterns</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700">Preferred Field Types</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {userProfile.behaviorPatterns.preferredFieldTypes.join(', ')}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Completion Pattern</div>
                  <div className="text-sm text-gray-600 mt-1 capitalize">
                    {userProfile.behaviorPatterns.completionTimePattern.replace('_', ' ')}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Template Complexity</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {userProfile.behaviorPatterns.averageTemplateComplexity.toFixed(1)}/10
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Peak Usage Hours</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {userProfile.behaviorPatterns.peakUsageHours.join(', ')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-medium text-gray-900">Personalization Suggestions</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={generatePersonalizationSuggestions}
                disabled={isAnalyzing}
                className="flex items-center px-3 py-1 text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-md"
              >
                {isAnalyzing ? (
                  <div className="w-3 h-3 mr-1 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Sparkles className="w-3 h-3 mr-1" />
                )}
                Refresh
              </button>
              {selectedSuggestions.length > 0 && (
                <button
                  onClick={applySelectedSuggestions}
                  className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium"
                >
                  Apply Selected ({selectedSuggestions.length})
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedSuggestions.includes(suggestion.id)
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleSuggestion(suggestion.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedSuggestions.includes(suggestion.id)}
                      onChange={() => toggleSuggestion(suggestion.id)}
                      className="mt-1"
                    />
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTypeColor(suggestion.type)}`}>
                      {getTypeIcon(suggestion.type)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                    {suggestion.confidence.toFixed(0)}%
                  </div>
                </div>
                <div className="ml-11 space-y-2">
                  <div className="text-sm">
                    <span className="font-medium text-green-600">Expected Impact:</span>
                    <span className="text-gray-600 ml-2">{suggestion.expectedImpact}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Implementation:</span>
                    <span className="text-gray-600 ml-2">{suggestion.implementation}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900">Adaptation History</h3>
          <div className="space-y-3">
            {userProfile.adaptationHistory.map((adaptation, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{adaptation.adaptation}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Trigger: {adaptation.trigger.replace('_', ' ')}
                  </div>
                  <div className="text-sm text-green-600 mt-1">
                    Impact: {adaptation.impact}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(adaptation.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};