import React from 'react';
import { clsx } from 'clsx';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  color?: 'blue' | 'white' | 'gray' | 'primary' | 'gradient';
  className?: string;
  overlay?: boolean;
  fullPage?: boolean;
  text?: string;
  textPosition?: 'right' | 'bottom';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'gradient',
  className,
  overlay = false,
  fullPage = false,
  text,
  textPosition = 'bottom',
}) => {
  const sizeMap: Record<string, string> = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-24 h-24',
  };

  const spinner = (
    <div className={clsx('relative flex items-center justify-center', sizeMap[size], className)}>
      {/* Outer Ring */}
      <div className={clsx(
        'absolute inset-0 rounded-full border-2 opacity-20',
        color === 'gradient' ? 'border-primary' : 'border-current'
      )}></div>
      
      {/* Animated Ring */}
      <svg
        className="absolute inset-0 w-full h-full animate-spin"
        viewBox="0 0 50 50"
      >
        <circle
          className={clsx(
            'opacity-100',
            color === 'gradient' ? 'stroke-primary' : 'stroke-current'
          )}
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="30, 150"
          style={{
            stroke: color === 'gradient' ? 'url(#loading-gradient)' : undefined,
            filter: 'drop-shadow(0 0 8px currentColor)'
          }}
        />
        {color === 'gradient' && (
          <defs>
            <linearGradient id="loading-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="var(--secondary)" />
            </linearGradient>
          </defs>
        )}
      </svg>

      {/* Inner Glowing Dot */}
      <div className={clsx(
        'w-1/4 h-1/4 rounded-full animate-pulse blur-[2px]',
        color === 'gradient' ? 'bg-primary' : 'bg-current'
      )}></div>
    </div>
  );

  const containerClasses = clsx(
    'flex flex-col items-center justify-center gap-4 transition-all duration-500',
    fullPage && 'fixed inset-0 z-[9999] bg-dark/80 backdrop-blur-xl',
    overlay && 'absolute inset-0 z-50 bg-dark/40 backdrop-blur-md rounded-inherit',
    textPosition === 'right' && 'flex-row'
  );

  if (fullPage || overlay || text) {
    return (
      <div className={containerClasses}>
        {spinner}
        {text && (
          <p className={clsx(
            'font-black tracking-widest uppercase text-xs sm:text-sm animate-pulse',
            fullPage ? 'text-white' : 'text-gray-light'
          )}>
            {text}
          </p>
        )}
      </div>
    );
  }

  return spinner;
};

export interface LoadingStateProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'white' | 'gray' | 'primary' | 'gradient';
  text?: string;
  className?: string;
  minHeight?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  size = 'xl',
  color = 'gradient',
  text = 'جاري التحميل...',
  className,
  minHeight = '400px',
}) => {
  return (
    <div className={clsx('flex flex-col items-center justify-center animate-fade-in', className)} style={{ minHeight }}>
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
        <LoadingSpinner size={size} color={color} />
      </div>
      {text && (
        <p className="mt-8 text-gray-light font-black text-sm tracking-[0.2em] uppercase opacity-50 animate-pulse text-center">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
