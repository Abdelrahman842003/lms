/**
 * Input Component
 * Standardized input component with label, error handling, icon support, and loading state
 */

import React from 'react';
import { clsx } from 'clsx';
import { Skeleton } from './Skeleton';
import { Icon } from './Icon';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input label */
  label?: string;
  /** Error message to display */
  error?: string;
  /** FontAwesome icon class (e.g., 'fas fa-user') */
  icon?: string;
  /** Loading state - shows skeleton instead of input */
  isLoading?: boolean;
  /** Input size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional wrapper className */
  wrapperClassName?: string;
  /** Label className */
  labelClassName?: string;
  /** Error message className */
  errorClassName?: string;
  /** Icon className */
  iconClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  isLoading = false,
  size = 'md',
  className,
  wrapperClassName,
  labelClassName,
  errorClassName,
  iconClassName,
  disabled,
  id,
  ...props
}) => {
  const inputId = id || props.name || Math.random().toString(36).substring(7);

  // Size variants
  const sizeStyles = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-base',
    lg: 'h-14 px-5 text-lg',
  };

  // Padding adjustments for icon
  const iconPadding = {
    sm: icon ? 'pr-10' : 'pr-3',
    md: icon ? 'pr-12' : 'pr-4',
    lg: icon ? 'pr-14' : 'pr-5',
  };

  const baseInputStyles = [
    'w-full',
    'bg-white/5',
    'border',
    'border-white/10',
    'rounded-lg',
    'text-white',
    'placeholder:text-gray-500',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:border-primary/50',
    'focus:ring-1',
    'focus:ring-primary/50',
    'hover:border-white/20',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
  ];

  const errorStyles = error
    ? [
        '!border-red-500',
        'focus:!border-red-500',
        'focus:!ring-red-500/50',
        'hover:!border-red-500/70',
      ]
    : [];

  const iconErrorStyles = error ? 'text-red-500' : 'text-gray-400';

  return (
    <div className={clsx('flex flex-col gap-1.5', wrapperClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className={clsx(
            'text-sm font-medium text-gray-300',
            'mb-1',
            labelClassName
          )}
        >
          {label}
        </label>
      )}

      <div className="relative">
        {isLoading ? (
          <Skeleton
            height={size === 'sm' ? '36px' : size === 'lg' ? '56px' : '44px'}
            borderRadius="8px"
            className="w-full"
          />
        ) : (
          <>
            {icon && (
              <Icon
                name={icon.replace('fas fa-', '')}
                className={clsx(
                  'absolute right-4 top-1/2 -translate-y-1/2',
                  'transition-colors duration-200',
                  iconErrorStyles,
                  size === 'sm' && 'text-sm',
                  size === 'md' && 'text-base',
                  size === 'lg' && 'text-lg',
                  iconClassName
                )}
              />
            )}
            <input
              id={inputId}
              disabled={disabled || isLoading}
              className={clsx(
                baseInputStyles,
                sizeStyles[size],
                iconPadding[size],
                errorStyles,
                className
              )}
              {...props}
            />
          </>
        )}
      </div>

      {error && !isLoading && (
        <span
          className={clsx(
            'text-red-500 text-sm mt-1 font-medium',
            'flex items-center gap-1.5',
            errorClassName
          )}
        >
          <Icon name="exclamation-circle" size="xs" />
          {error}
        </span>
      )}
    </div>
  );
};

/**
 * Input Group Component
 * For grouping multiple inputs horizontally
 */
export interface InputGroupProps {
  children: React.ReactNode;
  className?: string;
  gap?: 'sm' | 'md' | 'lg';
}

export const InputGroup: React.FC<InputGroupProps> = ({
  children,
  className,
  gap = 'md',
}) => {
  const gapStyles = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  return (
    <div className={clsx('flex flex-col md:flex-row', gapStyles[gap], className)}>
      {children}
    </div>
  );
};

export default Input;
