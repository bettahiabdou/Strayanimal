import type { HTMLAttributes } from 'react'
import { cn } from './cn'

type Tone = 'urgent' | 'injured' | 'stray' | 'resolved' | 'pending' | 'primary'

const toneStyles: Record<Tone, string> = {
  urgent: 'bg-[var(--color-urgent-bg)] text-[var(--color-urgent)]',
  injured: 'bg-[var(--color-injured-bg)] text-[var(--color-injured)]',
  stray: 'bg-[var(--color-stray-bg)] text-[var(--color-stray)]',
  resolved: 'bg-[var(--color-resolved-bg)] text-[var(--color-resolved)]',
  pending: 'bg-[var(--color-pending-bg)] text-[var(--color-pending)]',
  primary: 'bg-primary-100 text-primary-700',
}

type BadgeProps = HTMLAttributes<HTMLSpanElement> & { tone?: Tone }

export function Badge({ tone = 'pending', className, ...rest }: BadgeProps) {
  return (
    <span
      {...rest}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        toneStyles[tone],
        className,
      )}
    />
  )
}
