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
  dotColor = 'currentColor',
}) => {
  const variantStyles: Record<string, string> = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    secondary: 'badge-secondary',
    default: 'badge-secondary',
    'outline-primary': 'badge-outline-primary',
    'outline-success': 'badge-outline-success',
    'outline-warning': 'badge-outline-warning',
    'outline-danger': 'badge-outline-danger',
    'outline-info': 'badge-outline-info',
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'badge-sm',
    md: '',
    lg: 'badge-lg',
  };

  const clickableStyles = clickable ? 'badge-clickable' : '';
  const pulseStyles = pulse ? 'badge-pulse' : '';
  const currentVariant = variantStyles[variant] || variantStyles.default;

  const iconElement = icon && (
    <i
      className={clsx(
        icon
      )}
    />
  );

  const dotElement = dot && (
    <span
      className={clsx(
        'badge-dot'
      )}
      style={{ backgroundColor: dotColor }}
    />
  );

  return (
    <span
      onClick={onClick}
      className={clsx(
        'badge',
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
    pending: { variant: 'warning', label: 'قيد الانتظار', icon: 'fas fa-clock' },
    suspended: { variant: 'danger', label: 'معلق', icon: 'fas fa-ban' },
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
  position?: 'ux-top-right' | 'ux-top-left' | 'ux-bottom-right' | 'ux-bottom-left';
  /** Additional className */
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count = 0,
  maxCount = 99,
  variant = 'danger',
  position = 'ux-top-right',
  className,
}) => {
  if (count <= 0) return null;

  const variantStyles = {
    primary: 'notification-badge-primary',
    danger: 'notification-badge-danger',
    warning: 'notification-badge-warning',
  };

  const positionStyles = {
    'ux-top-right': 'notification-badge-top-right',
    'ux-top-left': 'notification-badge-top-left',
    'ux-bottom-right': 'notification-badge-bottom-right',
    'ux-bottom-left': 'notification-badge-bottom-left',
  };

  const displayCount = count > maxCount ? `${maxCount}+` : count;

  return (
    <span
      className={clsx(
        'notification-badge',
        positionStyles[position],
        variantStyles[variant],
        className
      )}
    >
      {displayCount}
    </span>
  );
};

export default Badge;
