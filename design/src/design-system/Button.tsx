import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'xl'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm',
  accent: 'bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 shadow-sm',
  secondary: 'bg-white text-primary-700 border border-primary-200 hover:bg-primary-50',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
}

const sizeStyles: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-base gap-2',
  lg: 'h-13 px-6 text-base gap-2',
  xl: 'h-16 px-8 text-lg gap-3',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  leftIcon,
  rightIcon,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={cn(
        'inline-flex items-center justify-center rounded-[var(--radius-button)] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className,
      )}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  )
}
