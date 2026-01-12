import React from 'react'
import { cn } from '@/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
  style?: React.CSSProperties
}

export function Card({ children, className, onClick, hover = false, style }: CardProps) {
  return (
    <div
      className={cn(
        'glass-effect rounded-xl p-6 transition-all duration-300',
        hover && 'card-hover cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  change?: {
    value: string
    type: 'positive' | 'negative'
  }
  className?: string
  onClick?: () => void
  style?: React.CSSProperties
}

export function StatCard({ title, value, icon, change, className, onClick, style }: StatCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)} onClick={onClick} hover={!!onClick} style={style}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-300 mb-2">{title}</h3>
          <p className="text-3xl font-bold text-white mb-2">{value}</p>
          {change && (
            <div className={cn(
              'flex items-center gap-1 text-sm font-medium',
              change.type === 'positive' ? 'text-success' : 'text-danger'
            )}>
              <svg
                className={cn(
                  'w-4 h-4',
                  change.type === 'positive' ? 'rotate-0' : 'rotate-180'
                )}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 4.414 6.707 7.707a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{change.value}</span>
            </div>
          )}
        </div>
        <div className="text-primary text-4xl opacity-80">
          {icon}
        </div>
      </div>
    </Card>
  )
}

interface AvatarProps {
  src?: string
  alt?: string
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Avatar({ src, alt, name, size = 'md', className }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
  }

  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold',
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt || name}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  )
}

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  const variantClasses = {
    default: 'bg-gray-500/20 text-gray-300',
    success: 'bg-success/20 text-success',
    warning: 'bg-warning/20 text-warning',
    danger: 'bg-danger/20 text-danger'
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  )
}

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className,
  type = 'button'
}: ButtonProps) {
  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90',
    secondary: 'bg-gray-600 text-white hover:bg-gray-500',
    outline: 'border border-primary text-primary hover:bg-primary hover:text-white',
    ghost: 'text-primary hover:bg-primary/10'
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-dark',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            className="opacity-25"
          />
          <path
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            className="opacity-75"
          />
        </svg>
      )}
      {children}
    </button>
  )
}

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-700/50', className)}
      style={style}
    />
  )
}

export { default as AvatarUpload } from './AvatarUpload'
export { default as ConfirmationModal } from './ConfirmationModal'
export { default as ImageCropModal } from './ImageCropModal'
export { MonthDropdown } from './MonthDropdown'
