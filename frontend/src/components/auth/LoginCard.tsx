import React from 'react';

interface LoginCardProps {
  children: React.ReactNode;
  title: React.ReactNode;
  subtitle: string;
  icon?: React.ReactNode;
}

export const LoginCard: React.FC<LoginCardProps> = ({ children, title, subtitle, icon }) => {
  return (
    <div className="login-card">
      <div className="login-header">
        {icon && (
          <div className="login-icon">
            {icon}
          </div>
        )}
        <h1 className="login-title">
          {title}
        </h1>
        <p className="login-subtitle">{subtitle}</p>
      </div>
      {children}
    </div>
  );
};
