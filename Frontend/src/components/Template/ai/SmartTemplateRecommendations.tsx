import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, Users, Clock, Filter, Search, Sparkles } from 'lucide-react';

interface TemplateRecommendation {
  id: string;
  name: string;
  description: string;
  category: string;
  relevanceScore: number;
  reason: string;
  usage: number;
  rating: number;
  completionTime: string;
  thumbnail?: string;
  tags: string[];
  aiInsights: {
    similarityMatch: number;
    userBehaviorMatch: number;
    industryTrend: number;
    successProbability: number;
  };
}

interface SmartTemplateRecommendationsProps {
  userProfile?: {
    industry: string;
    role: string;
    recentTemplates: string[];
    preferences: string[];
  };
  onTemplateSelect: (template: TemplateRecommendation) => void;
}

export const SmartTemplateRecommendations: React.FC<SmartTemplateRecommendationsProps> = ({
  userProfile,
  onTemplateSelect
}) => {
  const [recommendations, setRecommendations] = useState<TemplateRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'popularity' | 'rating'>('relevance');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', name: 'All Recommendations', count: 0 },
    { id: 'similar_usage', name: 'Similar to Your Usage', count: 0 },
    { id: 'trending', name: 'Trending Now', count: 0 },
    { id: 'industry_specific', name: 'Industry Specific', count: 0 },
    { id: 'ai_suggested', name: 'AI Suggested', count: 0 }
  ];

  useEffect(() => {
    generateRecommendations();
  }, [userProfile]);

  const generateRecommendations = async () => {
    setLoading(true);
    
    // Simulate AI recommendation generation
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockRecommendations: TemplateRecommendation[] = [
      {
        id: 'rec_1',
        name: 'Advanced Employment Contract',
        description: 'Comprehensive employment agreement with modern clauses for tech companies',
        category: 'similar_usage',
        relevanceScore: 94.2,
        reason: 'Based on your recent HR template usage and industry focus',
        usage: 2456,
        rating: 4.8,
        completionTime: '6.2 minutes',
        tags: ['employment', 'tech', 'remote-work', 'equity'],
        aiInsights: {
          similarityMatch: 96.5,
          userBehaviorMatch: 91.8,
          industryTrend: 94.2,
          successProbability: 89.3
        }
      },
      {
        id: 'rec_2',
        name: 'SaaS Service Agreement',
        description: 'Modern SaaS agreement template with subscription and data protection clauses',
        category: 'trending',
        relevanceScore: 89.7,
        reason: 'Trending in your industry with high success rates',
        usage: 1834,
        rating: 4.9,
        completionTime: '8.1 minutes',
        tags: ['saas', 'subscription', 'data-protection', 'api'],
        aiInsights: {
          similarityMatch: 87.2,
          userBehaviorMatch: 85.4,
          industryTrend: 98.1,
          successProbability: 92.6
        }
      },
      {
        id: 'rec_3',
        name: 'Remote Work Policy Template',
        description: 'Comprehensive remote work policy with productivity and security guidelines',
        category: 'ai_suggested',
        relevanceScore: 87.3,
        reason: 'AI detected this matches your company size and remote work patterns',
        usage: 1567,
        rating: 4.7,
        completionTime: '5.8 minutes',
        tags: ['remote-work', 'policy', 'security', 'productivity'],
        aiInsights: {
          similarityMatch: 89.1,
          userBehaviorMatch: 88.7,
          industryTrend: 85.9,
          successProbability: 86.4
        }
      },
      {
        id: 'rec_4',
        name: 'Vendor Partnership Agreement',
        description: 'Strategic partnership template for technology vendors and suppliers',
        category: 'industry_specific',
        relevanceScore: 84.6,
        reason: 'Popular among technology companies similar to yours',
        usage: 1298,
        rating: 4.6,
        completionTime: '7.4 minutes',
        tags: ['partnership', 'vendor', 'technology', 'integration'],
        aiInsights: {
          similarityMatch: 82.3,
          userBehaviorMatch: 79.8,
          industryTrend: 91.2,
          successProbability: 84.7
        }
      },
      {
        id: 'rec_5',
        name: 'Data Processing Agreement',
        description: 'GDPR-compliant data processing agreement for EU operations',
        category: 'ai_suggested',
        relevanceScore: 82.1,
        reason: 'AI analysis suggests high relevance based on your compliance needs',
        usage: 987,
        rating: 4.8,
        completionTime: '9.2 minutes',
        tags: ['gdpr', 'data-processing', 'compliance', 'privacy'],
        aiInsights: {
          similarityMatch: 78.9,
          userBehaviorMatch: 83.4,
          industryTrend: 87.6,
          successProbability: 88.9
        }
      },
      {
        id: 'rec_6',
        name: 'Freelancer Agreement Template',
        description: 'Flexible freelancer agreement with IP protection and payment terms',
        category: 'trending',
        relevanceScore: 79.8,
        reason: 'Trending template with high completion rates in your industry',
        usage: 2134,
        rating: 4.5,
        completionTime: '4.6 minutes',
        tags: ['freelancer', 'contractor', 'ip-protection', 'payment'],
        aiInsights: {
          similarityMatch: 76.2,
          userBehaviorMatch: 81.5,
          industryTrend: 93.4,
          successProbability: 82.1
        }
      }
    ];

    setRecommendations(mockRecommendations);
    setLoading(false);
  };

  const filteredRecommendations = recommendations
    .filter(rec => {
      if (selectedCategory !== 'all' && rec.category !== selectedCategory) return false;
      if (searchQuery && !rec.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !rec.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !rec.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return b.usage - a.usage;
        case 'rating':
          return b.rating - a.rating;
        default:
          return b.relevanceScore - a.relevanceScore;
      }
    });

  const getRelevanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'similar_usage':
        return <Users className="w-4 h-4" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4" />;
      case 'ai_suggested':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'similar_usage':
        return 'bg-blue-100 text-blue-700';
      case 'trending':
        return 'bg-green-100 text-green-700';
      case 'ai_suggested':
        return 'bg-purple-100 text-purple-700';
      case 'industry_specific':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center mr-4">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Smart Template Recommendations</h2>
          <p className="text-sm text-gray-600">AI-powered suggestions based on your usage patterns</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search recommendations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="relevance">Sort by Relevance</option>
            <option value="popularity">Sort by Popularity</option>
            <option value="rating">Sort by Rating</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Generating personalized recommendations...</p>
        </div>
      )}

      {/* Recommendations Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecommendations.map((recommendation) => (
            <div
              key={recommendation.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onTemplateSelect(recommendation)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">{recommendation.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{recommendation.description}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRelevanceColor(recommendation.relevanceScore)}`}>
                  {recommendation.relevanceScore.toFixed(0)}%
                </div>
              </div>

              <div className="flex items-center space-x-2 mb-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(recommendation.category)}`}>
                  {getCategoryIcon(recommendation.category)}
                  <span className="ml-1 capitalize">{recommendation.category.replace('_', ' ')}</span>
                </span>
              </div>

              <div className="text-sm text-gray-600 mb-3">
                <div className="flex items-center text-blue-600 mb-1">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {recommendation.reason}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                <div className="flex items-center">
                  <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                  <span>{recommendation.rating}</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-3 h-3 mr-1" />
                  <span>{recommendation.usage.toLocaleString()}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>{recommendation.completionTime}</span>
                </div>
              </div>

              {/* AI Insights */}
              <div className="border-t border-gray-100 pt-3">
                <div className="text-xs text-gray-500 mb-2">AI Insights:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span>Similarity:</span>
                    <span className="font-medium">{recommendation.aiInsights.similarityMatch.toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Behavior:</span>
                    <span className="font-medium">{recommendation.aiInsights.userBehaviorMatch.toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trend:</span>
                    <span className="font-medium">{recommendation.aiInsights.industryTrend.toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success:</span>
                    <span className="font-medium text-green-600">{recommendation.aiInsights.successProbability.toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mt-3">
                {recommendation.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    {tag}
                  </span>
                ))}
                {recommendation.tags.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    +{recommendation.tags.length - 3}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredRecommendations.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Recommendations Found</h3>
          <p className="text-sm">Try adjusting your search or category filters</p>
        </div>
      )}
    </div>
  );
};