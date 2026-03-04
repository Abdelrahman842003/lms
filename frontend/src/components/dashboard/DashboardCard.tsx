import React from 'react';

interface DashboardCardProps {
  title?: string;
  icon?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ 
  title, 
  icon,
  action, 
  children, 
  className='',
  noPadding = false
}) => {
  return (
    <div className={`dashboard-card ${className}`}>
      {(title || action) && (
        <div className="dashboard-card-header dashboard-card-header-row">
          {(title || icon) && (
            <div className="dashboard-card-title">
              {icon && <i className={icon}></i>}
              {title && <h2>{title}</h2>}
            </div>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'dashboard-card-content'}>
        {children}
      </div>
    </div>
  );
};
