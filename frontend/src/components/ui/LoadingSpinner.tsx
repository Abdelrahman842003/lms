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
  const sizeStyles = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const colorStyles = {
    blue: 'text-blue-600',
    white: 'text-white',
    gray: 'text-gray-400',
    primary: 'text-primary',
  };

  const SpinnerSVG = (
    <svg
      className={clsx(
        'animate-spin',
        sizeStyles[size],
        colorStyles[color],
        className
      )}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // Full page spinner with overlay
  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50">
        {SpinnerSVG}
        {text && (
          <p className="mt-4 text-white text-lg">{text}</p>
        )}
      </div>
    );
  }

  // Overlay spinner (for cards/sections)
  if (overlay) {
    return (
      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10">
        {SpinnerSVG}
        {text && (
          <p className="mt-2 text-white text-sm">{text}</p>
        )}
      </div>
    );
  }

  // Inline spinner with optional text
  if (text) {
    if (textPosition === 'right') {
      return (
        <div className="flex items-center gap-2">
          {SpinnerSVG}
          <span>{text}</span>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-2">
        {SpinnerSVG}
        <span>{text}</span>
      </div>
    );
  }

  // Simple inline spinner
  return SpinnerSVG;
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
    <div
      className={clsx(
        'flex flex-col items-center justify-center',
        className
      )}
      style={{ minHeight }}
    >
      <LoadingSpinner size={size} color={color} />
      {text && (
        <p className="mt-4 text-gray-400">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
