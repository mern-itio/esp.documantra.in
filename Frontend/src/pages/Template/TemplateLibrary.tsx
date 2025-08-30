import React, { useState } from 'react';
import { Search, Grid, List, Plus, Eye, Edit, Trash2, Copy, Star } from 'lucide-react';

export const TemplateLibrary: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Templates', count: 247 },
    { id: 'legal', name: 'Legal Documents', count: 56 },
    { id: 'hr', name: 'HR Documents', count: 42 },
    { id: 'business', name: 'Business Contracts', count: 89 },
    { id: 'forms', name: 'Forms', count: 34 },
    { id: 'invoices', name: 'Invoices', count: 26 } 
  ];

  const templates = [
    {
      id: '1',
      name: 'Employment Contract Template',
      category: 'HR Documents',
      description: 'Comprehensive employment agreement with standard terms and conditions',
      lastModified: '2024-01-15',
      usage: 145,
      status: 'published',
      rating: 4.8,
      isStarred: true
    },
    {
      id: '2',
      name: 'Non-Disclosure Agreement',
      category: 'Legal Documents',
      description: 'Standard NDA template for protecting confidential information',
      lastModified: '2024-01-12',
      usage: 203,
      status: 'published',
      rating: 4.9,
      isStarred: false
    },
    {
      id: '3',
      name: 'Sales Proposal Template',
      category: 'Business Contracts',
      description: 'Professional sales proposal with pricing and terms sections',
      lastModified: '2024-01-10',
      usage: 87,
      status: 'draft',
      rating: 4.6,
      isStarred: true
    },
    {
      id: '4',
      name: 'Invoice Template',
      category: 'Invoices',
      description: 'Clean and professional invoice template with automatic calculations',
      lastModified: '2024-01-08',
      usage: 234,
      status: 'published',
      rating: 4.7,
      isStarred: false
    },
    {
      id: '5',
      name: 'Customer Feedback Form',
      category: 'Forms',
      description: 'Interactive form for collecting customer feedback and ratings',
      lastModified: '2024-01-05',
      usage: 76,
      status: 'published',
      rating: 4.5,
      isStarred: false
    },
    {
      id: '6',
      name: 'Vendor Agreement',
      category: 'Business Contracts',
      description: 'Comprehensive vendor partnership agreement template',
      lastModified: '2024-01-03',
      usage: 45,
      status: 'published',
      rating: 4.4,
      isStarred: true
    }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           template.category.toLowerCase().includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Template Library</h1>
          <p className="text-gray-600">Manage and organize your document templates</p>
        </div>
        <button className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search templates..."
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
              <option key={category.id} value={category.id}>
                {category.name} ({category.count})
              </option>
            ))}
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

      {/* Templates Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {template.category}
                    </span>
                  </div>
                  <button className={`p-1 rounded ${template.isStarred ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}>
                    <Star className={`w-4 h-4 ${template.isStarred ? 'fill-current' : ''}`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{template.usage} uses</span>
                  <span className="flex items-center">
                    <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                    {template.rating}
                  </span>
                  <span>{template.lastModified}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    template.status === 'published' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {template.status}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modified</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTemplates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <button className={`mr-3 ${template.isStarred ? 'text-yellow-400' : 'text-gray-300'}`}>
                          <Star className={`w-4 h-4 ${template.isStarred ? 'fill-current' : ''}`} />
                        </button>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{template.name}</div>
                          <div className="text-sm text-gray-500">{template.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {template.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{template.usage}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                        <span className="text-sm text-gray-900">{template.rating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        template.status === 'published' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {template.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.lastModified}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-400 hover:text-gray-600">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};