import React from 'react';
import { cn } from '@/utils';
import BaseButton from './Button';
import { Badge as BaseBadge } from './Badge';
import BaseSkeleton from './Skeleton';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  style?: React.CSSProperties;
}

export function Card({ children, className, onClick, hover = false, style }: CardProps) {
  return (
    <div
      className={cn(
        'glass-effect',
        hover && 'card-hover',
        onClick && 'card-hover',
        className
      )}
      onClick={onClick}
      style={{ padding: '24px', ...style }}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: string;
    type: 'positive' | 'negative';
  };
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function StatCard({ title, value, icon, change, className, onClick, style }: StatCardProps) {
  return (
    <div className={cn('stat-card', className)} onClick={onClick} style={style}>
      <div className="stat-card-header">
        <div className="stat-card-info">
          <h3>{title}</h3>
          <div className="stat-card-value">{value}</div>
        </div>
        <div className="stat-card-icon">{icon}</div>
      </div>
      {change && (
        <div className={cn('stat-card-trend', change.type === 'positive' ? 'positive' : 'negative')}>
          <span>{change.value}</span>
        </div>
      )}
    </div>
  );
}

interface AvatarProps {
  src?: string;
  alt?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ src, alt, name, size = 'md', className }: AvatarProps) {
  const sizeMap: Record<NonNullable<AvatarProps['size']>, number> = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  };

  const initials = name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn('table-avatar-circle', className)}
      style={{ width: sizeMap[size], height: sizeMap[size] }}
    >
      {src ? <img src={src} alt={alt || name} className="table-avatar-img" /> : <span className="table-avatar-placeholder">{initials}</span>}
    </div>
  );
}

export const Button = BaseButton;
export const Badge = BaseBadge;
export const Skeleton = BaseSkeleton;

// Export all UI components
export { default as AvatarUpload } from './AvatarUpload';
export { default as ConfirmationModal } from './ConfirmationModal';
export { default as ImageCropModal } from './ImageCropModal';
export { default as FormModal } from './FormModal';
export { MonthDropdown } from './MonthDropdown';
export { LoadingSpinner, LoadingState } from './LoadingSpinner';

// Re-export Button from Button.tsx (preferred implementation)
export { BaseButton as ButtonV2, BaseButton as ButtonComponent };

// Re-export Select from Select.tsx
export { Select, type SelectProps } from './Select';

// New standardized components
export { Input, InputGroup, type InputProps, type InputGroupProps } from './Input';
export { Textarea, AutoResizeTextarea, type TextareaProps, type AutoResizeTextareaProps } from './Textarea';
export {
  Badge as BadgeV2,
  StatusBadge,
  NotificationBadge,
  type BadgeProps,
  type BadgeVariant,
  type BadgeSize,
  type StatusBadgeProps,
  type NotificationBadgeProps
} from './Badge';
export {
  Icon,
  IconButton,
  IconText,
  IconStack,
  IconAvatar,
  type IconProps,
  type IconName,
  type IconSet,
  type IconButtonProps,
  type IconTextProps,
  type IconStackProps,
  type IconAvatarProps
} from './Icon';
export { Skeleton as SkeletonV2, type SkeletonProps } from './Skeleton';
