import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { clsx } from '../../utils';

export const SectionLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={clsx('dm-section-label', className)}>
    <span className="dm-section-label-line" />
    <h2 className="dm-section-label-text">{children}</h2>
    <span className="dm-section-label-line bg-gradient-to-l from-border to-transparent" />
  </div>
);

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
  flush?: boolean;
};

export const PageShell: React.FC<PageShellProps> = ({ children, className, wide, flush }) => (
  <div className={clsx('dm-page', wide && 'dm-page--wide', flush && 'dm-page--flush', className)}>
    {children}
  </div>
);

type PageHeroProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  backTo?: string;
  backLabel?: string;
  action?: React.ReactNode;
  compact?: boolean;
  badge?: React.ReactNode;
};

export const PageHero: React.FC<PageHeroProps> = ({
  title,
  subtitle,
  backTo,
  backLabel = 'Back',
  action,
  compact,
  badge,
}) => {
  if (compact) {
    return (
      <section className="dm-hero dm-hero--compact dm-hero--gradient">
        <div className="pointer-events-none absolute inset-0 dm-hero-grid opacity-80" />
        <div className="relative flex flex-wrap items-start justify-between gap-4 p-5 md:p-6">
          <div className="flex min-w-0 items-start gap-3">
            {backTo && (
              <Link to={backTo} aria-label={backLabel} className="dm-back-btn shrink-0 border-white/20 bg-white/10 text-white hover:border-white/40 hover:bg-white/15 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            )}
            <div className="min-w-0">
              {badge && <div className="mb-2">{badge}</div>}
              <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-white/75">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </section>
    );
  }

  return (
    <section className="dm-hero dm-hero--gradient">
      <div className="pointer-events-none absolute inset-0 dm-hero-grid" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-300/15 blur-3xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-4 p-5 md:p-7">
        <div className="flex min-w-0 items-start gap-3">
          {backTo && (
            <Link to={backTo} aria-label={backLabel} className="dm-back-btn shrink-0 border-white/20 bg-white/10 text-white hover:border-white/40 hover:bg-white/15 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          )}
          <div className="min-w-0">
            {badge && <div className="mb-2">{badge}</div>}
            <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">{title}</h1>
            {subtitle && <p className="mt-1.5 max-w-xl text-sm text-white/75 md:text-[15px]">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </section>
  );
};

type PagePanelProps = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  noPadding?: boolean;
};

export const PagePanel: React.FC<PagePanelProps> = ({
  title,
  subtitle,
  children,
  headerAction,
  className,
  bodyClassName,
  noPadding,
}) => (
  <section className={clsx('dm-panel', className)}>
    {(title || headerAction) && (
      <div className="dm-panel-header flex flex-wrap items-center justify-between gap-3">
        <div>
          {title && <h2 className="text-lg font-bold text-foreground">{title}</h2>}
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {headerAction}
      </div>
    )}
    <div className={clsx(!noPadding && 'dm-panel-body', bodyClassName)}>{children}</div>
  </section>
);

type EmptyStateProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}) => (
  <div className={clsx('dm-empty', className)}>
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-[#260559]/10 shadow-inner">
      <Icon className="h-8 w-8 text-primary" />
    </div>
    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
    <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>
);

type StatTileProps = {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
  hint?: string;
};

export const StatTile: React.FC<StatTileProps> = ({ label, value, icon: Icon, accent, hint }) => (
  <div className="dm-stat-tile">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1.5 text-2xl font-bold tabular-nums text-foreground">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div
        className={clsx(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md',
          accent || 'from-[#155E4B] to-emerald-500',
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

type SelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export const SelectField: React.FC<SelectFieldProps> = ({ label, className, children, ...props }) => (
  <label className="block">
    {label && <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>}
    <select className={clsx('dm-input cursor-pointer py-2', className)} {...props}>
      {children}
    </select>
  </label>
);
