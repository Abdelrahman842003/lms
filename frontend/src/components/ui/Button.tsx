/**
 * Button Component
 * Reusable button component with multiple variants and sizes
 */

import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xs' | 'xl';
  isLoading?: boolean;
  loading?: boolean; // Keep for backward compatibility
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,
  disabled,
  className,
  children,
  ...props
}) => {
  const isButtonLoading = isLoading || loading;

  const variantStyles = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    destructive: 'btn-danger',
    outline: 'btn-outline border border-white/10 hover:bg-white/5',
  };

  const sizeStyles = {
    xs: 'btn-xs text-[10px] px-2 py-1',
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
    xl: 'btn-xl h-14 text-lg',
  };

  const buttonClasses = clsx(
    'btn',
    variantStyles[variant as keyof typeof variantStyles] || variantStyles.primary,
    sizeStyles[size as keyof typeof sizeStyles] || '',
    className
  );

  return (
    <button
      className={buttonClasses}
      disabled={disabled || isButtonLoading}
      {...props}
    >
      {isButtonLoading && (
        <svg className="btn-loading-icon" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle
            className="ux-opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="ux-opacity-75"
            fill="currentColor"
            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;