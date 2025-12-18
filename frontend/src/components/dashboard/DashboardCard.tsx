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
  className = '',
  noPadding = false
}) => {
  return (
    <div className={`bg-[#101426]/15 rounded-2xl border border-white/10 transition-all duration-500 ease-in-out hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:-translate-y-[1px] hover:backdrop-blur-[20px] hover:border-[#1bc5f8]/50 ${className}`}>
      {(title || action) && (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-[28px] pb-4 border-b border-white/10 mb-6">
          {(title || icon) && (
            <div className="flex items-center gap-3">
              {icon && <i className={`${icon} text-primary text-xl`}></i>}
              {title && <h2 className="text-[1.25rem] font-bold text-white m-0">{title}</h2>}
            </div>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-[28px] pt-0'}>
        {children}
      </div>
    </div>
  );
};
