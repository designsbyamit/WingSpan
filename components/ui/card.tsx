// components/ui/card.tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** When true, renders an indigo glowing border — used for selected state */
  selected?: boolean
  /** When true, adds a hover border highlight */
  hoverable?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, selected, hoverable = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border bg-[var(--surface)] p-5 transition-all duration-200',
          hoverable && 'hover:border-[#B6FF2E]/40 hover:bg-[var(--surface-dim)]',
          selected
            ? 'border-[#B6FF2E] shadow-[0_0_0_1px_#B6FF2E] bg-[#B6FF2E]/5'
            : 'border-[var(--border-ws)]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export { Card }
