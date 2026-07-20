import React from 'react'

type Props = {
  children: React.ReactNode
  fallback?: React.ReactNode
}

type State = { hasError: boolean }

/** Soft boundary so a Recharts crash cannot blank the whole dashboard route. */
export class ChartErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('Chart render failed:', error?.message || error)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-[12rem] items-center justify-center rounded-xl border border-border bg-muted/30 px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">Chart unavailable right now.</p>
          </div>
        )
      )
    }
    return this.props.children
  }
}

/** Concrete colors — Recharts color/scale helpers can crash on CSS `var(--*)` values. */
export const CHART_HEX = {
  chart1: '#0f766e',
  chart2: '#0369a1',
  chart3: '#a16207',
  chart4: '#7c3aed',
  chart5: '#be123c',
  grid: '#e2e8f0',
  axis: '#64748b',
  muted: '#f1f5f9',
} as const
