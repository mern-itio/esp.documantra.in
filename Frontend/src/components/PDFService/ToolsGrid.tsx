import React from 'react';
import { Star, Clock, Zap, Crown, Search, Sparkles, ArrowUpRight, FileText } from 'lucide-react';
import * as Icons from 'lucide-react';
import type { PDFTool } from '../../types';
import { clsx, getComplexityColor, getPopularityColor } from '../../utils';
import { BRAND } from '../../config/brand';

interface ToolsGridProps {
  tools: PDFTool[];
  onToolSelect: (tool: PDFTool) => void;
  favoriteTools: Set<string>;
  onToggleFavorite: (toolId: string) => void;
  recentTools: PDFTool[];
  searchQuery: string;
  selectedCategory?: string;
  onSearchChange?: (query: string) => void;
  isLoading?: boolean;
}

export const ToolsGrid: React.FC<ToolsGridProps> = ({
  tools,
  onToolSelect,
  favoriteTools,
  onToggleFavorite,
  recentTools,
  searchQuery,
  selectedCategory,
  onSearchChange,
  isLoading = false,
}) => {
  const recentToolIds = new Set(recentTools.map((tool) => tool.id));

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
        return 'PDF Conversion';
      case 'editing':
        return 'PDF Editing';
      case 'pages':
        return 'Page Management';
      case 'security':
        return 'PDF Security';
      case 'optimization':
        return 'Optimization';
      case 'ocr':
        return 'OCR & Text';
      case 'forms':
        return 'PDF Forms';
      case 'utilities':
        return 'Utilities';
      default:
        return 'All PDF Tools';
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.FileText;
  };

  const getBadgeColor = (badge: string) => {
    switch (badge.toLowerCase()) {
      case 'popular':
        return 'bg-emerald-100 text-emerald-800';
      case 'new':
        return 'bg-primary/10 text-primary';
      case 'ai':
        return 'bg-[#260559]/10 text-[#260559]';
      case 'batch':
        return 'bg-amber-100 text-amber-800';
      case 'security':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-[#155E4B] via-[#1a6b55] to-[#260559] p-6 text-white shadow-xl shadow-primary/15 md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-8 h-40 w-40 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
              <Sparkles className="h-3.5 w-3.5" />
              {BRAND.name} PDF Suite
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
              {getCategoryDisplayName(selectedCategory)}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/85 md:text-base">
              {isLoading
                ? 'Loading your PDF toolkit...'
                : `${tools.length} professional tools for conversion, editing, security, and more.`}
            </p>
          </div>
          {onSearchChange && (
            <div className="relative w-full max-w-md shrink-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search tools..."
                className="w-full rounded-full border border-white/25 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/60 backdrop-blur-sm focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
          )}
        </div>
      </section>

      {searchQuery && (
        <p className="text-sm text-muted-foreground">
          Showing results for <span className="font-medium text-foreground">&ldquo;{searchQuery}&rdquo;</span>
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : tools.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tools.map((tool) => {
            const Icon = getIcon(tool.icon || 'FileText');
            const isRecent = recentToolIds.has(tool.id || '');
            const isFavorite = favoriteTools.has(tool.id || '');

            let requiredCredits = 0;
            try {
              const toolKey = (tool.id ?? '').toString();
              const objId = toolKey ? toolIdMap[toolKey] || null : null;
              if (objId) {
                requiredCredits =
                  planToolCosts.find((tc) => String(tc.toolId) === String(objId))?.credits || 0;
              }
            } catch {}

            return (
              <div
                key={tool.id}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                onClick={() => onToolSelect(tool)}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-[#260559] opacity-0 transition group-hover:opacity-100" />

                {tool.premium && (
                  <div className="absolute -right-1 -top-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm">
                      <Crown className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}

                <div className="mb-4 flex items-start justify-between gap-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-white shadow-sm transition group-hover:scale-105">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    {isRecent && <Clock className="h-4 w-4 text-amber-500" />}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(tool.id || '');
                      }}
                      className="rounded-lg p-1.5 transition hover:bg-secondary"
                    >
                      <Star
                        className={clsx(
                          'h-4 w-4',
                          isFavorite ? 'fill-current text-amber-500' : 'text-muted-foreground',
                        )}
                      />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground transition group-hover:text-primary">
                        {tool.name}
                      </h3>
                      {tool.badge && (
                        <span
                          className={clsx(
                            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                            getBadgeColor(tool.badge),
                          )}
                        >
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{tool.description}</p>
                  </div>

                  {(tool.features || []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(tool.features || []).slice(0, 2).map((feature) => (
                        <span
                          key={feature}
                          className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground"
                        >
                          {feature.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={clsx(
                          'rounded-md px-2 py-0.5 text-[11px] font-medium capitalize',
                          getComplexityColor(tool.complexity || 'medium'),
                        )}
                      >
                        {tool.complexity || 'medium'}
                      </span>
                      <span
                        className={clsx(
                          'flex items-center text-[11px] font-medium',
                          getPopularityColor(tool.popularity || 50),
                        )}
                      >
                        <Zap className="mr-0.5 h-3 w-3" />
                        {tool.popularity || 50}%
                      </span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
                  </div>

                  {(requiredCredits > 0 || tool.avgProcessingTime) && (
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      {requiredCredits > 0 && (
                        <span className="font-medium text-primary">{requiredCredits} credits</span>
                      )}
                      {tool.avgProcessingTime && <span>~{tool.avgProcessingTime}</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No tools found</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            {searchQuery
              ? 'Try a different search term or browse another category from the sidebar.'
              : 'PDF tools could not be loaded. Refresh the page or check that the admin service is running.'}
          </p>
        </div>
      )}
    </div>
  );
};
