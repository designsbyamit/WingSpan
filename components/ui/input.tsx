// components/ui/input.tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--text-secondary)] font-jakarta"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'w-full rounded-lg border bg-[var(--surface-dim)] px-4 py-3',
            'text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
            'border-[var(--border-ws)] outline-none',
            'focus:border-[#B6FF2E] focus:ring-2 focus:ring-[#B6FF2E]/20',
            'transition-colors duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-400 font-jakarta">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
