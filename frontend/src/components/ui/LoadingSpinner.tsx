/**
 * Loading Spinner Component
 * Single source of truth for all loading states across the application
 * Supports: sizes (sm/md/lg/xl), colors (blue/white/gray/primary), overlay, and fullPage modes
 */

import React from 'react';
import { clsx } from 'clsx';

export interface LoadingSpinnerProps {
  /** Spinner size - sm: 16px, md: 24px, lg: 32px, xl: 48px */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Spinner color */
  color?: 'blue' | 'white' | 'gray' | 'primary';
  /** Additional CSS classes */
  className?: string;
  /** Show spinner with overlay background */
  overlay?: boolean;
  /** Full page spinner with centered overlay */
  fullPage?: boolean;
  /** Optional loading text to display below spinner */
  text?: string;
  /** Text position relative to spinner */
  textPosition?: 'right' | 'bottom';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'blue',
  className,
  overlay = false,
  fullPage = false,
  text,
  textPosition = 'bottom',
}) => {
  const sizeStyles: Record<NonNullable<LoadingSpinnerProps['size']>, number> = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  };

  const colorStyles: Record<NonNullable<LoadingSpinnerProps['color']>, string> = {
    blue: '#2563eb',
    white: '#ffffff',
    gray: '#9ca3af',
    primary: 'var(--primary)',
  };

  const spinnerStyle: React.CSSProperties = {
    width: sizeStyles[size],
    height: sizeStyles[size],
    borderWidth: Math.max(2, Math.round(sizeStyles[size] / 8)),
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderTopColor: colorStyles[color],
  };

  const spinner = <span className={clsx('spinner', className)} style={spinnerStyle} aria-hidden="true" />;

  if (fullPage) {
    return (
      <div className="loading-fullpage">
        {spinner}
        {text && <p style={{ color: 'white' }}>{text}</p>}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="loading-overlay">
        {spinner}
        {text && <p style={{ color: 'white' }}>{text}</p>}
      </div>
    );
  }

  if (text) {
    if (textPosition === 'right') {
      return (
        <div className="loading-state" style={{ flexDirection: 'row' }}>
          {spinner}
          <span>{text}</span>
        </div>
      );
    }
    return (
      <div className="loading-state">
        {spinner}
        <span>{text}</span>
      </div>
    );
  }

  return spinner;
};

/**
 * Loading State Component - For full page/section loading states
 * Combines spinner with centered container
 */
export interface LoadingStateProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'white' | 'gray' | 'primary';
  text?: string;
  className?: string;
  minHeight?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  size = 'lg',
  color = 'primary',
  text = 'جاري التحميل...',
  className,
  minHeight = '400px',
}) => {
  return (
    <div className={clsx('loading-state', className)} style={{ minHeight }}>
      <LoadingSpinner size={size} color={color} />
      {text && <p style={{ color: 'var(--gray-light)' }}>{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
