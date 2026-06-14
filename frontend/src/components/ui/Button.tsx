import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant
  size?:     Size
  loading?:  boolean
  icon?:     string  // Material Symbol name
  iconRight?: string
  fullWidth?: boolean
}

const variantStyles: Record<Variant, string> = {
  primary:   'bg-primary-container text-on-primary hover:opacity-90 active:scale-[0.98]',
  secondary: 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest active:scale-[0.98]',
  ghost:     'bg-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
  danger:    'bg-error text-on-error hover:opacity-90',
  outline:   'bg-transparent border border-outline-variant text-on-surface hover:bg-surface-container',
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-4 py-1.5 text-sm gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-8 py-3.5 text-base gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconRight,
    fullWidth = false,
    className,
    children,
    disabled,
    ...props
  }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
        ) : icon ? (
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        ) : null}
        {children}
        {iconRight && !loading && (
          <span className="material-symbols-outlined text-[18px]">{iconRight}</span>
        )}
      </button>
    )
  },
)

Button.displayName = 'Button'
