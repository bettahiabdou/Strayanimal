import type { HTMLAttributes } from 'react'
import { cn } from './cn'

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn(
        'bg-white rounded-[var(--radius-card)] border border-slate-200 shadow-sm',
        className,
      )}
    />
  )
}
