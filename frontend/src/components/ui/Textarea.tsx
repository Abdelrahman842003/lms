/**
 * Textarea Component
 * Standardized textarea component with label, error handling, and loading state
 */

import React from 'react';
import { clsx } from 'clsx';
import { Skeleton } from './Skeleton';
import { Icon } from './Icon';

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows'> {
  /** Textarea label */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Number of rows */
  rows?: number;
  /** Loading state - shows skeleton instead of textarea */
  isLoading?: boolean;
  /** Maximum character count */
  maxLength?: number;
  /** Show character counter */
  showCounter?: boolean;
  /** Additional wrapper className */
  wrapperClassName?: string;
  /** Label className */
  labelClassName?: string;
  /** Error message className */
  errorClassName?: string;
  /** Character counter className */
  counterClassName?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  rows = 4,
  isLoading = false,
  maxLength,
  showCounter = false,
  className,
  wrapperClassName,
  labelClassName,
  errorClassName,
  counterClassName,
  disabled,
  id,
  value,
  onChange,
  ...props
}) => {
  const textareaId = id || props.name || Math.random().toString(36).substring(7);
  const currentLength = typeof value === 'string' ? value.length : 0;

  const baseTextareaStyles = [
    'w-full',
    'min-h-[80px]',
    'bg-white/5',
    'border',
    'border-white/10',
    'rounded-lg',
    'px-4',
    'py-3',
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
    'resize-y',
  ];

  const errorStyles = error
    ? [
        '!border-red-500',
        'focus:!border-red-500',
        'focus:!ring-red-500/50',
        'hover:!border-red-500/70',
      ]
    : [];

  return (
    <div className={clsx('flex flex-col gap-1.5', wrapperClassName)}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={textareaId}
            className={clsx(
              'text-sm font-medium text-gray-300',
              'mb-1',
              labelClassName
            )}
          >
            {label}
          </label>
          {showCounter && maxLength && (
            <span
              className={clsx(
                'text-xs text-gray-500',
                currentLength > maxLength && 'text-red-500',
                counterClassName
              )}
            >
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      )}

      <div className="relative">
        {isLoading ? (
          <Skeleton
            height={`${rows * 24}px`}
            minHeight="80px"
            borderRadius="8px"
            className="w-full"
          />
        ) : (
          <textarea
            id={textareaId}
            rows={rows}
            disabled={disabled || isLoading}
            maxLength={maxLength}
            value={value}
            onChange={onChange}
            className={clsx(
              baseTextareaStyles,
              errorStyles,
              className
            )}
            {...props}
          />
        )}
      </div>

      {/* Show counter below if no label */}
      {showCounter && maxLength && !label && (
        <div className="flex justify-end">
          <span
            className={clsx(
              'text-xs text-gray-500',
              currentLength > maxLength && 'text-red-500',
              counterClassName
            )}
          >
            {currentLength}/{maxLength}
          </span>
        </div>
      )}

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
 * Auto-resizing Textarea Component
 * Automatically adjusts height based on content
 */
export interface AutoResizeTextareaProps extends Omit<TextareaProps, 'rows'> {
  /** Minimum number of rows */
  minRows?: number;
  /** Maximum number of rows */
  maxRows?: number;
}

export const AutoResizeTextarea: React.FC<AutoResizeTextareaProps> = ({
  minRows = 2,
  maxRows = 10,
  onChange,
  ...props
}) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate new height
      const lineHeight = 24; // Approximate line height
      const maxHeight = maxRows * lineHeight;
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      const minHeight = minRows * lineHeight;
      
      textarea.style.height = `${Math.max(newHeight, minHeight)}px`;
    }
    onChange?.(e);
  };

  return (
    <Textarea
      rows={minRows}
      onChange={handleChange}
      className={clsx('overflow-hidden', props.className)}
      {...props}
    />
  );
};

export default Textarea;
