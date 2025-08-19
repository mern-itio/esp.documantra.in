import React from 'react';
import { Star, Clock, Zap, Crown } from 'lucide-react';
import * as Icons from 'lucide-react';
import type { PDFTool } from '../../types';
import { clsx, getComplexityColor, getPopularityColor } from '../../utils';

interface ToolsGridProps {
  tools: PDFTool[];
  onToolSelect: (tool: PDFTool) => void;
  favoriteTools: Set<string>;
  onToggleFavorite: (toolId: string) => void;
  recentTools: PDFTool[];
  searchQuery: string;
}

export const ToolsGrid: React.FC<ToolsGridProps> = ({
  tools,
  onToolSelect,
  favoriteTools,
  onToggleFavorite,
  recentTools,
  searchQuery
}) => {
  const recentToolIds = new Set(recentTools.map(tool => tool.id));

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.FileText;
  };

  const getBadgeColor = (badge: string) => {
    switch (badge.toLowerCase()) {
      case 'popular':
        return 'bg-green-100 text-green-800';
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'ai':
        return 'bg-purple-100 text-purple-800';
      case 'batch':
        return 'bg-orange-100 text-orange-800';
      case 'security':
        return 'bg-red-100 text-red-800';
      case 'legal':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            PDF Tools
            {searchQuery && (
              <span className="text-base font-normal text-gray-500 ml-2">
                - Results for "{searchQuery}"
              </span>
            )}
          </h2>
          <p className="text-gray-600 mt-1">
            Choose from {tools.length} professional PDF processing tools
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tools.map((tool) => {
          const Icon = getIcon(tool.icon);
          const isRecent = recentToolIds.has(tool.id);
          const isFavorite = favoriteTools.has(tool.id);

          return (
            <div
              key={tool.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer group relative"
              onClick={() => onToolSelect(tool)}
            >
              {/* Premium Badge */}
              {tool.premium && (
                <div className="absolute -top-2 -right-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                
                <div className="flex items-center space-x-1">
                  {isRecent && (
                    <div className="p-1">
                      <Clock className="w-4 h-4 text-orange-500" />
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(tool.id);
                    }}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Star className={clsx(
                      'w-4 h-4',
                      isFavorite ? 'text-yellow-500 fill-current' : 'text-gray-400'
                    )} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {tool.name}
                    </h3>
                    {tool.badge && (
                      <span className={clsx(
                        'px-2 py-0.5 text-xs font-medium rounded-full',
                        getBadgeColor(tool.badge)
                      )}>
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {tool.description}
                  </p>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-1">
                  {tool.features.slice(0, 2).map((feature) => (
                    <span
                      key={feature}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                    >
                      {feature.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {tool.features.length > 2 && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      +{tool.features.length - 2} more
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <div className={clsx(
                      'px-2 py-1 text-xs font-medium rounded',
                      getComplexityColor(tool.complexity)
                    )}>
                      {tool.complexity}
                    </div>
                    <div className={clsx(
                      'flex items-center text-xs font-medium',
                      getPopularityColor(tool.popularity)
                    )}>
                      <Zap className="w-3 h-3 mr-1" />
                      {tool.popularity}%
                    </div>
                  </div>
                  
                  {tool.avgProcessingTime && (
                    <div className="text-xs text-gray-500">
                      ~{tool.avgProcessingTime}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* No Results */}
      {tools.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icons.Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tools found</h3>
          <p className="text-gray-600">
            Try adjusting your search or browse different categories
          </p>
        </div>
      )}
    </div>
  );
};