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
      className={`flex items-center justify-center gap-[10px] p-4 bg-primary text-white border-none rounded-[12px] text-[1.05rem] font-bold font-tajawal cursor-pointer transition-all duration-300 mt-[10px] shadow-[0_5px_15px_rgba(66,99,235,0.3)] hover:bg-[#4263eb]/90 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(66,99,235,0.4)] disabled:opacity-60 disabled:cursor-not-allowed ${className || ''}`}
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
