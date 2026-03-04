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

  const sizeStyles = {
    sm: 'ui-input-sm',
    md: '',
    lg: 'ui-input-lg',
  };

  return (
    <div className={clsx('form-group ui-form-group', wrapperClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className={clsx(labelClassName)}
        >
          {label}
        </label>
      )}

      <div className="ui-input-container">
        {isLoading ? (
          <Skeleton
            height={size === 'sm' ? '36px' : size === 'lg' ? '56px' : '44px'}
            borderRadius="8px"
            className="ux-w-full"
          />
        ) : (
          <>
            {icon && (
              <Icon
                name={icon.replace('fas fa-', '')}
                className={clsx(
                  'ui-input-icon',
                  error && 'input-error-icon',
                  iconClassName
                )}
              />
            )}
            <input
              id={inputId}
              disabled={disabled || isLoading}
              className={clsx(
                'form-input',
                sizeStyles[size],
                icon && 'ui-input-with-icon',
                error && 'error',
                className
              )}
              {...props}
            />
          </>
        )}
      </div>

      {error && !isLoading && (
        <span className={clsx('error-message', errorClassName)}>
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
  const gapStyles: Record<NonNullable<InputGroupProps['gap']>, string> = {
    sm: '8px',
    md: '16px',
    lg: '24px',
  };

  return (
    <div
      className={clsx('input-group', className)}
      style={{
        gap: gapStyles[gap],
      }}
    >
      {children}
    </div>
  );
};

export default Input;
