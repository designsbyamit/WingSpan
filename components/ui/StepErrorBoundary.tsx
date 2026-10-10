'use client'
import { Component, type ReactNode } from 'react'

/** Keeps one broken Blueprint step from taking down the whole page. */
export class StepErrorBoundary extends Component<{ children: ReactNode; label: string }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: unknown) { console.error(`Blueprint step "${this.props.label}" failed to render:`, error) }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] p-6 text-center">
        <p className="text-sm text-[var(--text-primary)] mb-1">This section couldn't be shown.</p>
        <p className="text-xs text-[var(--text-muted)]">The rest of your Blueprint is fine. Use the other steps, or run the analysis again.</p>
      </div>
    )
  }
}
