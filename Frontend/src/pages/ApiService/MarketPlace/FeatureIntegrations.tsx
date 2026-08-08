import React, { useState } from 'react'
import { 
  Search, 
  Filter, 
  Star, 
  Download, 
  ExternalLink, 
  Tag, 
  Users, 
  Zap, 
  Shield, 
  Code,
  Verified,
  TrendingUp,
  Heart,
  Eye,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { mockIntegrations } from '../../../data/mockAPIData'
import { BRAND } from '../../../config/brand'
import { useBrandSettings } from '../../../hooks/useBrandSettings'

export const FeatureInterations: React.FC = () => {
  const { name: brandName } = useBrandSettings();
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedProvider, setSelectedProvider] = useState('all')
  const [sortBy, setSortBy] = useState('featured')
  const [showFilters, setShowFilters] = useState(false)

  const categories = [
    { id: 'all', name: 'All Categories', count: mockIntegrations.length },
    { id: 'crm', name: 'CRM', count: mockIntegrations.filter(i => i.category === 'CRM').length },
    { id: 'communication', name: 'Communication', count: mockIntegrations.filter(i => i.category === 'Communication').length },
    { id: 'storage', name: 'Storage', count: mockIntegrations.filter(i => i.category === 'Storage').length },
    { id: 'automation', name: 'Automation', count: mockIntegrations.filter(i => i.category === 'Automation').length },
    { id: 'productivity', name: 'Productivity', count: 8 },
    { id: 'security', name: 'Security', count: 5 }
  ]

  const providers = [
    { id: 'all', name: 'All Providers' },
    { id: 'draftn', name: brandName },
    { id: 'community', name: 'Community' },
    { id: 'partner', name: 'Partners' },
    { id: 'verified', name: 'Verified Only' }
  ]

  const sortOptions = [
    { id: 'featured', name: 'Featured' },
    { id: 'popular', name: 'Most Popular' },
    { id: 'newest', name: 'Newest' },
    { id: 'rating', name: 'Highest Rated' },
    { id: 'downloads', name: 'Most Downloaded' }
  ]

  const filteredIntegrations = mockIntegrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || 
                           integration.category.toLowerCase() === selectedCategory.toLowerCase()
    
    const matchesProvider = selectedProvider === 'all' || 
                           integration.provider.toLowerCase() === selectedProvider.toLowerCase()
    
    return matchesSearch && matchesCategory && matchesProvider
  }).sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.downloads - a.downloads
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'rating':
        return b.rating - a.rating
      case 'downloads':
        return b.downloads - a.downloads
      case 'featured':
      default:
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
    }
  })

  const featuredIntegrations = mockIntegrations.filter(i => i.featured).slice(0, 3)

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Featured Integrations */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Integrations</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {featuredIntegrations.map((integration) => (
            <div key={integration.id} className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 border border-primary-200">
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={integration.logo}
                  alt={integration.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{integration.provider}</span>
                    {integration.provider === BRAND.name && (
                      <Verified className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                </div>
              </div>
              <p className="text-gray-700 mb-4 line-clamp-2">{integration.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span>{integration.rating}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Download className="h-4 w-4" />
                    <span>{integration.downloads.toLocaleString()}</span>
                  </div>
                </div>
                <button className="btn btn-primary text-sm">
                  Install
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#F7F3EE] rounded-lg border border-gray-200 p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>

            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {sortOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  Sort by {option.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-outline flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {showFilters ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Rating</h4>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <label key={rating} className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: rating }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                        ))}
                        {Array.from({ length: 5 - rating }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-gray-300" />
                        ))}
                        <span className="text-sm text-gray-600">& up</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Features</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-700">Real-time sync</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-700">Two-way integration</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-700">Bulk operations</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-700">Custom fields</span>
                  </label>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Pricing</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-700">Free</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-700">Freemium</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-700">Paid</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-700">Enterprise</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Integration Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map((integration) => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>

      {/* Empty State */}
      {filteredIntegrations.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No integrations found</h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your search criteria or browse all integrations
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('all')
              setSelectedProvider('all')
            }}
            className="btn btn-primary"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Load More */}
      {filteredIntegrations.length > 0 && (
        <div className="text-center mt-12">
          <button className="btn btn-outline">
            Load More Integrations
          </button>
        </div>
      )}
    </div>
  )
}

const IntegrationCard: React.FC<{ integration: any }> = ({ integration }) => {
  const [isInstalled, setIsInstalled] = useState(false)

  const handleInstall = () => {
    setIsInstalled(true)
    // Simulate installation process
    setTimeout(() => {
      // Installation complete
    }, 2000)
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'crm':
        return Users
      case 'communication':
        return Zap
      case 'storage':
        return Shield
      case 'automation':
        return Code
      default:
        return Tag
    }
  }

  const CategoryIcon = getCategoryIcon(integration.category)

  return (
    <div className="bg-[#F7F3EE] rounded-lg border border-gray-200 p-6 hover:border-gray-300 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <img
            src={integration.logo}
            alt={integration.name}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{integration.provider}</span>
              {integration.provider === BRAND.name && (
                <Verified className="h-4 w-4 text-blue-500" />
              )}
            </div>
          </div>
        </div>
        {integration.featured && (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
            Featured
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-gray-600 mb-4 line-clamp-3">{integration.description}</p>

      {/* Category and Tags */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <CategoryIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">{integration.category}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {integration.tags.slice(0, 3).map((tag:any) => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
            >
              {tag}
            </span>
          ))}
          {integration.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
              +{integration.tags.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
            <span>{integration.rating}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Download className="h-4 w-4" />
            <span>{integration.downloads.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-1 text-gray-400 hover:text-red-500 transition-colors">
            <Heart className="h-4 w-4" />
          </button>
          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handleInstall}
          disabled={isInstalled}
          className={`flex-1 btn ${
            isInstalled 
              ? 'bg-green-100 text-green-800 cursor-not-allowed' 
              : 'btn-primary'
          }`}
        >
          {isInstalled ? 'Installed' : 'Install'}
        </button>
        <button className="btn btn-outline">
          <Eye className="h-4 w-4" />
        </button>
      </div>

      {/* Quick Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Updated {new Date(integration.createdAt).toLocaleDateString()}</span>
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-3 w-3" />
            <span>Trending</span>
          </div>
        </div>
      </div>
    </div>
  )
}