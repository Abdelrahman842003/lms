import React from 'react';

import { Skeleton } from '@/components/ui/Skeleton';

/**
 * @deprecated Use the canonical Input component from '@/components/ui/Input' instead.
 * AuthInput is kept for backwards compatibility but should not be used in new code.
 * Migration guide:
 * - `iconClass` → `icon`
 * - `isLoading` → `isLoading`
 * - `error` → `error`
 * - `label` → `label`
 * All other props are compatible.
 */
interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  iconClass?: string;
  error?: string;
  isLoading?: boolean;
}

/**
 * @deprecated Use the canonical Input component from '@/components/ui/Input' instead.
 */
export const AuthInput: React.FC<AuthInputProps> = ({ label, iconClass, error, className, isLoading, ...props }) => {
  return (
    <div className="form-group">
      <label htmlFor={props.id}>
        {label}
      </label>
      <div className="input-wrapper">
        {isLoading ? (
          <Skeleton className="ux-w-full" height="50px" borderRadius="12px" />
        ) : (
          <>
            {iconClass && <i className={`${iconClass} ${error ? 'text-red-500' : ''}`}></i>}
            <input
              {...props}
              className={`${className || ''} ${!iconClass ? 'ui-auth-no-icon' : ''} ${error ? 'input-error' : ''}`}
            />
          </>
        )}
      </div>
      {error && !isLoading && (
        <span className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </span>
      )}
    </div>
  );
};
