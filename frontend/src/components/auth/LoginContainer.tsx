import React from 'react';

interface LoginContainerProps {
  children: React.ReactNode;
}

export const LoginContainer: React.FC<LoginContainerProps> = ({ children }) => {
  return (
    <div className="min-h-screen pt-[120px] pb-[60px] flex items-center justify-center relative">
      <div className="max-w-[520px] w-full mx-auto">
        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
};
