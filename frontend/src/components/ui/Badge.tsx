/**
 * Badge Component
 * Standardized badge component with multiple variants and sizes
 * Replaces raw <span className="...badge..."> usages
 */

import React from 'react';
import { clsx } from 'clsx';

export type BadgeVariant = 
  | 'primary' 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'info' 
  | 'secondary' 
  | 'default' 
  | 'outline-primary'
  | 'outline-success'
  | 'outline-warning'
  | 'outline-danger'
  | 'outline-info';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  /** Badge content */
  children: React.ReactNode;
  /** Visual style variant */
  variant?: BadgeVariant;
  /** Size of the badge */
  size?: BadgeSize;
  /** Optional icon (FontAwesome class) */
  icon?: string;
  /** Icon position */
  iconPosition?: 'left' | 'right';
  /** Whether badge is clickable */
  clickable?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional className */
  className?: string;
  /** Whether badge is pulsing (for notifications) */
  pulse?: boolean;
  /** Whether badge has a dot indicator */
  dot?: boolean;
  /** Custom dot color (tailwind class) */
  dotColor?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  iconPosition = 'right',
  clickable = false,
  onClick,
  className,
  pulse = false,
  dot = false,
  dotColor = 'bg-current',
}) => {
  // Solid variant styles
  const solidVariants: Record<string, string[]> = {
    primary: ['bg-primary/20', 'text-primary', 'border-primary/30'],
    success: ['bg-success/20', 'text-success', 'border-success/30'],
    warning: ['bg-warning/20', 'text-warning', 'border-warning/30'],
    danger: ['bg-danger/20', 'text-danger', 'border-danger/30'],
    info: ['bg-blue-500/20', 'text-blue-400', 'border-blue-500/30'],
    secondary: ['bg-gray-500/20', 'text-gray-300', 'border-gray-500/30'],
    default: ['bg-white/10', 'text-gray-300', 'border-white/10'],
  };

  // Outline variant styles
  const outlineVariants: Record<string, string[]> = {
    'outline-primary': ['bg-transparent', 'text-primary', 'border-primary/50'],
    'outline-success': ['bg-transparent', 'text-success', 'border-success/50'],
    'outline-warning': ['bg-transparent', 'text-warning', 'border-warning/50'],
    'outline-danger': ['bg-transparent', 'text-danger', 'border-danger/50'],
    'outline-info': ['bg-transparent', 'text-blue-400', 'border-blue-500/50'],
  };

  // Combine all variants
  const variantStyles: Record<string, string[]> = {
    ...solidVariants,
    ...outlineVariants,
  };

  const sizeStyles = {
    sm: ['px-2', 'py-0.5', 'text-xs'],
    md: ['px-3', 'py-1', 'text-sm'],
    lg: ['px-4', 'py-1.5', 'text-base'],
  };

  const baseStyles = [
    'inline-flex',
    'items-center',
    'gap-1.5',
    'rounded-full',
    'font-medium',
    'border',
    'transition-all',
    'duration-200',
  ];

  const clickableStyles = clickable
    ? ['cursor-pointer', 'hover:opacity-80', 'active:scale-95']
    : [];

  const pulseStyles = pulse ? ['animate-pulse'] : [];

  const isOutline = variant.startsWith('outline-');
  const currentVariant = variantStyles[variant] || variantStyles.default;

  const iconElement = icon && (
    <i
      className={clsx(
        icon,
        size === 'sm' && 'text-[10px]',
        size === 'md' && 'text-xs',
        size === 'lg' && 'text-sm'
      )}
    />
  );

  const dotElement = dot && (
    <span
      className={clsx(
        'w-1.5',
        'h-1.5',
        'rounded-full',
        dotColor
      )}
    />
  );

  return (
    <span
      onClick={onClick}
      className={clsx(
        baseStyles,
        currentVariant,
        sizeStyles[size],
        clickableStyles,
        pulseStyles,
        className
      )}
    >
      {iconPosition === 'left' && iconElement}
      {dotElement}
      {children}
      {iconPosition === 'right' && iconElement}
    </span>
  );
};

/**
 * Status Badge Component
 * Pre-configured badges for common status values
 */
export interface StatusBadgeProps extends Omit<BadgeProps, 'variant' | 'children'> {
  /** Status value */
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'failed' | 'processing' | string;
  /** Custom status label */
  label?: string;
  /** Custom status mapping */
  statusMap?: Record<string, { variant: BadgeVariant; label: string; icon?: string }>;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  statusMap,
  ...props
}) => {
  const defaultStatusMap: Record<string, { variant: BadgeVariant; label: string; icon?: string }> = {
    active: { variant: 'success', label: 'نشط', icon: 'fas fa-check-circle' },
    inactive: { variant: 'danger', label: 'غير نشط', icon: 'fas fa-times-circle' },
    pending: { variant: 'warning', label: 'معلق', icon: 'fas fa-clock' },
    completed: { variant: 'success', label: 'مكتمل', icon: 'fas fa-check' },
    failed: { variant: 'danger', label: 'فاشل', icon: 'fas fa-exclamation-circle' },
    processing: { variant: 'primary', label: 'جاري المعالجة', icon: 'fas fa-spinner fa-spin' },
    paid: { variant: 'success', label: 'مدفوع', icon: 'fas fa-check' },
    unpaid: { variant: 'danger', label: 'غير مدفوع', icon: 'fas fa-times' },
    partial: { variant: 'warning', label: 'مدفوع جزئياً', icon: 'fas fa-minus-circle' },
    checked_in: { variant: 'success', label: 'حاضر', icon: 'fas fa-check' },
    checked_out: { variant: 'primary', label: 'حضور مكتمل', icon: 'fas fa-check-double' },
    absent: { variant: 'danger', label: 'غائب', icon: 'fas fa-times' },
    present: { variant: 'success', label: 'حاضر', icon: 'fas fa-check' },
    trial: { variant: 'warning', label: 'فترة تجريبية', icon: 'fas fa-flask' },
    expired: { variant: 'danger', label: 'منتهي', icon: 'fas fa-exclamation-triangle' },
    grace_period: { variant: 'warning', label: 'فترة سماح', icon: 'fas fa-clock' },
  };

  const map = { ...defaultStatusMap, ...statusMap };
  const statusInfo = map[status.toLowerCase()] || { variant: 'default' as BadgeVariant, label: status };

  return (
    <Badge
      variant={statusInfo.variant}
      icon={statusInfo.icon}
      {...props}
    >
      {label || statusInfo.label}
    </Badge>
  );
};

/**
 * Notification Badge Component
 * Small badge for showing counts (e.g., notification count)
 */
export interface NotificationBadgeProps {
  /** The count to display */
  count?: number;
  /** Maximum count before showing "+" */
  maxCount?: number;
  /** Badge color variant */
  variant?: 'primary' | 'danger' | 'warning';
  /** Position relative to parent */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Additional className */
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count = 0,
  maxCount = 99,
  variant = 'danger',
  position = 'top-right',
  className,
}) => {
  if (count <= 0) return null;

  const variantStyles = {
    primary: 'bg-primary',
    danger: 'bg-red-500',
    warning: 'bg-warning',
  };

  const positionStyles = {
    'top-right': '-top-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
    'bottom-left': '-bottom-1 -left-1',
  };

  const displayCount = count > maxCount ? `${maxCount}+` : count;

  return (
    <span
      className={clsx(
        'absolute',
        positionStyles[position],
        'min-w-[18px]',
        'h-[18px]',
        'flex',
        'items-center',
        'justify-center',
        'px-1',
        'text-[10px]',
        'font-bold',
        'text-white',
        'rounded-full',
        variantStyles[variant],
        className
      )}
    >
      {displayCount}
    </span>
  );
};

export default Badge;
