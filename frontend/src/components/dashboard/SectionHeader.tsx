import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <div className="flex justify-between items-end mb-6">
      <div>
        <h2 className="text-[1.25rem] font-bold text-white mb-1">{title}</h2>
        {subtitle && <p className="text-gray-400 text-[0.9rem]">{subtitle}</p>}
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
};
