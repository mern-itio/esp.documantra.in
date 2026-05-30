import { useState } from 'react';
import { 
  Lightbulb, 
  TrendingUp, 
  Users, 
  FileText, 
  // Clock, 
  Star,
  ArrowRight,
  Search,
  Brain
} from 'lucide-react';
import { Button } from '../ui/button';
import { formatDate } from '../../common/lib/utils';

interface DocumentRecommendation {
  id: string;
  title: string;
  type: string;
  relevanceScore: number;
  reason: string;
  lastModified: string;
  author: string;
  tags: string[];
}

interface TrendingTopic {
  id: string;
  topic: string;
  documentCount: number;
  growthRate: number;
  relatedDocuments: string[];
}

interface ExpertRecommendation {
  id: string;
  name: string;
  email: string;
  avatar: string;
  expertise: string[];
  documentCount: number;
  collaborationScore: number;
}

interface DiscoveryEngineProps {
  currentDocumentId?: string;
  userInterests: string[];
  onDocumentSelect: (documentId: string) => void;
  onExpertContact: (expertId: string) => void;
}

const mockRecommendations: DocumentRecommendation[] = [
  {
    id: 'rec-1',
    title: 'Q3 Financial Analysis - Similar Methodology',
    type: 'pdf',
    relevanceScore: 0.92,
    reason: 'Similar financial analysis methodology and data patterns',
    lastModified: '2024-06-15T10:30:00Z',
    author: 'Sarah Johnson',
    tags: ['finance', 'analysis', 'quarterly']
  },
  {
    id: 'rec-2',
    title: 'Market Research Template - Updated Version',
    type: 'docx',
    relevanceScore: 0.87,
    reason: 'Updated version of template you frequently use',
    lastModified: '2024-06-20T14:45:00Z',
    author: 'Mike Chen',
    tags: ['template', 'market-research', 'analysis']
  },
  {
    id: 'rec-3',
    title: 'Compliance Guidelines 2024',
    type: 'pdf',
    relevanceScore: 0.83,
    reason: 'Related to your recent compliance document reviews',
    lastModified: '2024-06-25T09:15:00Z',
    author: 'Legal Team',
    tags: ['compliance', 'guidelines', 'legal']
  }
];

const mockTrendingTopics: TrendingTopic[] = [
  {
    id: 'trend-1',
    topic: 'AI Integration',
    documentCount: 45,
    growthRate: 156,
    relatedDocuments: ['doc-1', 'doc-2', 'doc-3']
  },
  {
    id: 'trend-2',
    topic: 'Remote Work Policies',
    documentCount: 32,
    growthRate: 89,
    relatedDocuments: ['doc-4', 'doc-5']
  },
  {
    id: 'trend-3',
    topic: 'Sustainability Reporting',
    documentCount: 28,
    growthRate: 67,
    relatedDocuments: ['doc-6', 'doc-7', 'doc-8']
  }
];

const mockExperts: ExpertRecommendation[] = [
  {
    id: 'expert-1',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@example.com',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop',
    expertise: ['Financial Analysis', 'Market Research', 'Data Science'],
    documentCount: 127,
    collaborationScore: 0.94
  },
  {
    id: 'expert-2',
    name: 'Mike Chen',
    email: 'mike.chen@example.com',
    avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop',
    expertise: ['Legal Compliance', 'Risk Management', 'Policy Development'],
    documentCount: 89,
    collaborationScore: 0.87
  },
  {
    id: 'expert-3',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@example.com',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop',
    expertise: ['Project Management', 'Process Optimization', 'Team Leadership'],
    documentCount: 156,
    collaborationScore: 0.91
  }
];

export function DiscoveryEngine({
  // currentDocumentId,
  // userInterests,
  onDocumentSelect,
  onExpertContact
}: DiscoveryEngineProps) {
  const [activeTab, setActiveTab] = useState<'recommendations' | 'trending' | 'experts'>('recommendations');

  const tabs = [
    {
      id: 'recommendations' as const,
      label: 'Recommendations',
      icon: Lightbulb,
      count: mockRecommendations.length
    },
    {
      id: 'trending' as const,
      label: 'Trending',
      icon: TrendingUp,
      count: mockTrendingTopics.length
    },
    {
      id: 'experts' as const,
      label: 'Experts',
      icon: Users,
      count: mockExperts.length
    }
  ];

  return (
    <div className="bg-[#F7F3EE] rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="w-5 h-5 text-[#155E4B]" />
          <h3 className="text-lg font-semibold text-gray-900">Intelligent Discovery</h3>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#F7F3EE] text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">
                Personalized Recommendations
              </h4>
              <Button variant="ghost" size="sm">
                <Search className="w-4 h-4 mr-2" />
                Refine
              </Button>
            </div>
            
            <div className="space-y-3">
              {mockRecommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer"
                  onClick={() => onDocumentSelect(rec.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h5 className="text-sm font-medium text-gray-900 mb-1">
                        {rec.title}
                      </h5>
                      <p className="text-xs text-gray-600 mb-2">
                        {rec.reason}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>by {rec.author}</span>
                        <span>{formatDate(rec.lastModified)}</span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span>{Math.round(rec.relevanceScore * 100)}% match</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {rec.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'trending' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">
                Trending Topics
              </h4>
              <span className="text-xs text-gray-500">Last 30 days</span>
            </div>
            
            <div className="space-y-3">
              {mockTrendingTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium text-gray-900">
                      {topic.topic}
                    </h5>
                    <div className="flex items-center space-x-1 text-green-600">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-xs font-medium">+{topic.growthRate}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <FileText className="w-3 h-3" />
                      <span>{topic.documentCount} documents</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                    >
                      Explore
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'experts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">
                Subject Matter Experts
              </h4>
              <Button variant="ghost" size="sm">
                <Users className="w-4 h-4 mr-2" />
                View All
              </Button>
            </div>
            
            <div className="space-y-3">
              {mockExperts.map((expert) => (
                <div
                  key={expert.id}
                  className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <img
                      src={expert.avatar}
                      alt={expert.name}
                      className="w-10 h-10 rounded-full flex-shrink-0"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="text-sm font-medium text-gray-900">
                          {expert.name}
                        </h5>
                        <div className="flex items-center space-x-1 text-blue-600">
                          <Star className="w-3 h-3" />
                          <span className="text-xs font-medium">
                            {Math.round(expert.collaborationScore * 100)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-2">
                        {expert.expertise.slice(0, 2).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {expert.expertise.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{expert.expertise.length - 2} more
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {expert.documentCount} documents
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onExpertContact(expert.id)}
                          className="h-6 px-2 text-xs"
                        >
                          Contact
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}