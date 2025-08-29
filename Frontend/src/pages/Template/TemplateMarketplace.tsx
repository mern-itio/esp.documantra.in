import React, { useState } from 'react';
import { 
  Search, 
  Star, 
  Download, 
  Eye, 
  Heart, 
  Crown, 
  Grid,
  List,
  TrendingUp,
  Award,
  Users
} from 'lucide-react';

export const TemplateMarketplace: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceFilter, setPriceFilter] = useState('all');

  const categories = [
    { id: 'all', name: 'All Categories', count: 1247 },
    { id: 'legal', name: 'Legal Documents', count: 356 },
    { id: 'business', name: 'Business Contracts', count: 289 },
    { id: 'hr', name: 'HR Documents', count: 142 },
    { id: 'finance', name: 'Finance & Accounting', count: 198 },
    { id: 'marketing', name: 'Marketing Materials', count: 167 },
    { id: 'forms', name: 'Forms & Surveys', count: 95 }
  ];

  const templates = [
    {
      id: '1',
      name: 'Professional Employment Contract',
      description: 'Comprehensive employment agreement template with industry-standard clauses and legal protections.',
      category: 'HR Documents',
      creator: 'LegalPro Templates',
      price: 'free',
      rating: 4.9,
      downloads: 12456,
      reviews: 234,
      isPremium: false,
      isFeatured: true,
      tags: ['employment', 'contract', 'hr', 'legal'],
      image: 'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: '2',
      name: 'Modern NDA Template Suite',
      description: 'Complete set of non-disclosure agreement templates for various business scenarios.',
      category: 'Legal Documents',
      creator: 'Business Legal Hub',
      price: '$29',
      rating: 4.8,
      downloads: 8934,
      reviews: 156,
      isPremium: true,
      isFeatured: true,
      tags: ['nda', 'confidentiality', 'legal', 'business'],
      image: 'https://images.pexels.com/photos/4427430/pexels-photo-4427430.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: '3',
      name: 'Sales Proposal Template Pack',
      description: 'Professional sales proposal templates with pricing tables and terms sections.',
      category: 'Business Contracts',
      creator: 'Sales Template Co.',
      price: '$19',
      rating: 4.7,
      downloads: 6721,
      reviews: 89,
      isPremium: true,
      isFeatured: false,
      tags: ['sales', 'proposal', 'business', 'pricing'],
      image: 'https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: '4',
      name: 'Invoice & Billing Templates',
      description: 'Clean and professional invoice templates with automatic calculations.',
      category: 'Finance & Accounting',
      creator: 'FinanceForm Studios',
      price: 'free',
      rating: 4.6,
      downloads: 15234,
      reviews: 456,
      isPremium: false,
      isFeatured: false,
      tags: ['invoice', 'billing', 'finance', 'accounting'],
      image: 'https://images.pexels.com/photos/6863183/pexels-photo-6863183.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: '5',
      name: 'Customer Feedback Forms',
      description: 'Interactive forms for collecting customer feedback and satisfaction ratings.',
      category: 'Forms & Surveys',
      creator: 'FormCraft Design',
      price: '$15',
      rating: 4.5,
      downloads: 4567,
      reviews: 78,
      isPremium: true,
      isFeatured: false,
      tags: ['feedback', 'survey', 'customer', 'forms'],
      image: 'https://images.pexels.com/photos/3184431/pexels-photo-3184431.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: '6',
      name: 'Marketing Proposal Templates',
      description: 'Complete marketing proposal templates with campaign strategies and budgets.',
      category: 'Marketing Materials',
      creator: 'Marketing Pros',
      price: '$39',
      rating: 4.9,
      downloads: 3456,
      reviews: 67,
      isPremium: true,
      isFeatured: true,
      tags: ['marketing', 'proposal', 'campaign', 'strategy'],
      image: 'https://images.pexels.com/photos/7413915/pexels-photo-7413915.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || 
                           template.category.toLowerCase().includes(selectedCategory);
    const matchesPrice = priceFilter === 'all' || 
                        (priceFilter === 'free' && template.price === 'free') ||
                        (priceFilter === 'paid' && template.price !== 'free');
    return matchesSearch && matchesCategory && matchesPrice;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Template Marketplace</h1>
        <p className="text-gray-600">Discover and download professional templates created by the community</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Crown className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Templates</p>
              <p className="text-lg font-semibold text-gray-900">1,247</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Download className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Downloads</p>
              <p className="text-lg font-semibold text-gray-900">45.6K</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Creators</p>
              <p className="text-lg font-semibold text-gray-900">156</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Award className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <p className="text-lg font-semibold text-gray-900">4.7</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-80"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.count})
              </option>
            ))}
          </select>
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Prices</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md ${
              viewMode === 'grid' 
                ? 'bg-gray-100 text-gray-900' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md ${
              viewMode === 'list' 
                ? 'bg-gray-100 text-gray-900' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {filteredTemplates.map((template) => (
          <div key={template.id} className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${
            viewMode === 'list' ? 'flex p-4' : 'p-0 overflow-hidden'
          }`}>
            {viewMode === 'grid' ? (
              <>
                {/* Image */}
                <div className="relative">
                  <img
                    src={template.image}
                    alt={template.name}
                    className="w-full h-48 object-cover"
                  />
                  {template.isFeatured && (
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Featured
                      </span>
                    </div>
                  )}
                  {template.isPremium && (
                    <div className="absolute top-3 right-3">
                      <Crown className="w-5 h-5 text-yellow-500" />
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3">
                    <button className="p-2 bg-white/90 hover:bg-white rounded-full shadow-sm">
                      <Heart className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{template.name}</h3>
                    <span className={`text-lg font-bold ${
                      template.price === 'free' ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {template.price === 'free' ? 'FREE' : template.price}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                      {template.category}
                    </span>
                    <span>by {template.creator}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                      <span>{template.rating}</span>
                      <span className="mx-1">•</span>
                      <span>{template.reviews} reviews</span>
                    </div>
                    <div className="flex items-center">
                      <Download className="w-4 h-4 mr-1" />
                      <span>{template.downloads.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </button>
                    <button className="px-3 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-md">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* List View */}
                <img
                  src={template.image}
                  alt={template.name}
                  className="w-24 h-24 object-cover rounded-lg mr-4"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                          {template.category}
                        </span>
                        <span>by {template.creator}</span>
                        <div className="flex items-center">
                          <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                          <span>{template.rating}</span>
                        </div>
                        <div className="flex items-center">
                          <Download className="w-3 h-3 mr-1" />
                          <span>{template.downloads.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold mb-2 ${
                        template.price === 'free' ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        {template.price === 'free' ? 'FREE' : template.price}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium">
                          Download
                        </button>
                        <button className="p-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-md">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center mt-12">
        <button className="px-6 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-md font-medium">
          Load More Templates
        </button>
      </div>
    </div>
  );
};