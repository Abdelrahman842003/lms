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
  const hasCustomWidth =
    typeof className === 'string' &&
    /(^|\s)!?(w|min-w|max-w)-|(^|\s)!?ux-(w|min-w|max-w)-/.test(className);

  return (
    <div className={clsx('form-group ui-form-group', wrapperClassName)}>
      {label && (
        <div className="ui-textarea-label-row">
          <label
            htmlFor={textareaId}
            className={clsx(labelClassName)}
          >
            {label}
          </label>
          {showCounter && maxLength && (
            <span
              className={clsx(
                currentLength > maxLength && 'textarea-counter-error',
                counterClassName
              )}
            >
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      )}

      <div className="ux-relative">
        {isLoading ? (
          <Skeleton
            height={`${rows * 24}px`}
            minHeight="80px"
            borderRadius="8px"
            className="ux-w-full"
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
              'form-input ui-textarea',
              !hasCustomWidth && 'ux-w-full',
              error && 'error',
              className
            )}
            {...props}
          />
        )}
      </div>

      {/* Show counter below if no label */}
      {showCounter && maxLength && !label && (
        <div className="ux-flex ux-justify-end">
          <span
            className={clsx(
              currentLength > maxLength && 'textarea-counter-error',
              counterClassName
            )}
          >
            {currentLength}/{maxLength}
          </span>
        </div>
      )}

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
      className={clsx('ui-textarea-auto', props.className)}
      {...props}
    />
  );
};

export default Textarea;
