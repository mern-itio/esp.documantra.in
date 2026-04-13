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
  selectedCategory?: string;
}

export const ToolsGrid: React.FC<ToolsGridProps> = ({
  tools,
  onToolSelect,
  favoriteTools,
  onToggleFavorite,
  recentTools,
  searchQuery,
  selectedCategory
}) => {
  const recentToolIds = new Set(recentTools.map(tool => tool.id));

  // Resolve tool slug -> Mongo ObjectId map and current plan toolCosts
  let toolIdMap: Record<string, string> = {};
  let planToolCosts: Array<{ toolId: string; credits: number }> = [];
  try {
    const raw = localStorage.getItem('toolCatalogIdMap');
    toolIdMap = raw ? JSON.parse(raw) : {};
  } catch {}
  try {
    const rawPlan = localStorage.getItem('userSubscriptionPlan');
    const parsed = rawPlan ? JSON.parse(rawPlan) : null;
    planToolCosts = parsed?.toolCosts || [];
  } catch {}

  const getCategoryDisplayName = (category?: string) => {
    switch (category) {
      case 'conversion':
        return 'PDF Conversion Tools';
      case 'editing':
        return 'PDF Editing Tools';
      case 'pages':
        return 'PDF Page Management Tools';
      case 'security':
        return 'PDF Security Tools';
      case 'optimization':
        return 'PDF Optimization Tools';
      case 'ocr':
        return 'PDF OCR & Text Tools';
      case 'forms':
        return 'PDF Forms Tools';
      case 'utilities':
        return 'PDF Utility Tools';
      default:
        return 'PDF Tools';
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.FileText;
  };

  const getBadgeColor = (badge: string) => {
    switch (badge.toLowerCase()) {
      case 'popular':
        return 'bg-success text-success-foreground';
      case 'new':
        return 'bg-primary text-primary-foreground';
      case 'ai':
        return 'bg-primary text-primary-foreground';
      case 'batch':
        return 'bg-warning text-warning-foreground';
      case 'security':
        return 'bg-destructive text-destructive-foreground';
      case 'legal':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="h-screen bg-background space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {getCategoryDisplayName(selectedCategory)}
            {searchQuery && (
              <span className="text-base font-normal text-muted-foreground ml-2">
                - Results for "{searchQuery}"
              </span>
            )}
          </h2>
          <p className="text-muted-foreground mt-1">
            Choose from {tools.length} professional PDF processing tools
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tools.map((tool) => {
          const Icon = getIcon(tool.icon || 'FileText');
          const isRecent = recentToolIds.has(tool.id || '');
          const isFavorite = favoriteTools.has(tool.id || '');

          // Determine required credits for this tool from plan
          let requiredCredits = 0;
          try {
            const toolKey = (tool.id ?? '').toString();
            const objId = toolKey ? (toolIdMap[toolKey] || null) : null;
            if (objId) {
              requiredCredits = planToolCosts.find(tc => String(tc.toolId) === String(objId))?.credits || 0;
            }
          } catch {}

          return (
            <div
              key={tool.id}
              className="bg-card rounded-xl border border-border p-6 hover:shadow-lg hover:border-primary transition-all duration-200 cursor-pointer group relative"
              onClick={() => onToolSelect(tool)}
            >
              {/* Premium Badge */}
              {tool.premium && (
                <div className="absolute -top-2 -right-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-warning to-warning-foreground rounded-full flex items-center justify-center">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center group-hover:bg-primary/90 transition-colors">
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
                
                <div className="flex items-center space-x-1">
                  {isRecent && (
                    <div className="p-1">
                      <Clock className="w-4 h-4 text-warning" />
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(tool.id || '');
                    }}
                    className="p-1 hover:bg-muted rounded transition-colors"
                  >
                    <Star className={clsx(
                      'w-4 h-4',
                      isFavorite ? 'text-warning fill-current' : 'text-muted-foreground'
                    )} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
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
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {tool.description}
                  </p>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-1">
                  {(tool.features || []).slice(0, 2).map((feature) => (
                    <span
                      key={feature}
                      className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded"
                    >
                      {feature.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {(tool.features || []).length > 2 && (
                    <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                      +{(tool.features || []).length - 2} more
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center space-x-2">
                    <div className={clsx(
                      'px-2 py-1 text-xs font-medium rounded',
                      getComplexityColor(tool.complexity || 'medium')
                    )}>
                      {tool.complexity || 'medium'}
                    </div>
                    <div className={clsx(
                      'flex items-center text-xs font-medium',
                      getPopularityColor(tool.popularity || 50)
                    )}>
                      <Zap className="w-3 h-3 mr-1" />
                      {tool.popularity || 50}%
                    </div>
                    <div className="px-2 py-1 text-xs font-medium text-warning">
                      Cost: {requiredCredits} credit
                    </div>
                  </div>
                  
                  {tool.avgProcessingTime && (
                    <div className="text-xs text-muted-foreground">
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
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
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