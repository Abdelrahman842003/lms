import React from 'react';

interface LoginContainerProps {
  children: React.ReactNode;
}

export const LoginContainer: React.FC<LoginContainerProps> = ({ children }) => {
  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div>{children}</div>
      </div>
    </div>
  );
};
