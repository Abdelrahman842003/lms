import React from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const AuthButton: React.FC<AuthButtonProps> = ({ isLoading, loadingText = 'جاري التحميل...', children, className, ...props }) => {
  return (
    <button
      {...props}
      className={`submit-btn ${className || ''}`}
      disabled={isLoading || props.disabled}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" color="white" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};
