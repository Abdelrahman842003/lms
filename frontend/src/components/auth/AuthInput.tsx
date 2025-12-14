import React from 'react';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  iconClass?: string;
  error?: string;
}

export const AuthInput: React.FC<AuthInputProps> = ({ label, iconClass, error, className, ...props }) => {
  return (
    <div className="flex flex-col gap-4 mb-5">
      <label htmlFor={props.id} className="text-[0.95rem] font-semibold text-white mr-[5px]">
        {label}
      </label>
      <div className="input-wrapper">
        {iconClass && <i className={`${iconClass} ${error ? 'text-red-500' : ''}`}></i>}
        <input
          {...props}
          className={`${className || ''} ${!iconClass ? '!pr-[18px]' : ''} ${error ? '!border-red-500 focus:!border-red-500 focus:!shadow-[0_0_0_3px_rgba(239,68,68,0.2)]' : ''}`}
        />
      </div>
      {error && (
        <span className="text-red-500 text-sm mt-1 mr-1 font-medium flex items-center gap-1">
          <i className="fas fa-exclamation-circle text-xs"></i>
          {error}
        </span>
      )}
    </div>
  );
};
