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
    <div className={`premium-glass rounded-2xl border border-white/5 overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          {(title || icon) && (
            <div className="flex items-center gap-3">
              {icon && (
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <i className={icon}></i>
                </div>
              )}
              {title && <h2 className="text-lg font-bold text-white m-0">{title}</h2>}
            </div>
          )}
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
};
