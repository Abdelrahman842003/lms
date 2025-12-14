import React from 'react';
import Link from 'next/link';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  color?: 'primary' | 'secondary' | 'warning' | 'success' | 'danger' | 'info';
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  href,
  color = 'primary',
}) => {
  const colorMap: Record<string, { bg: string; text: string; shadow: string }> = {
    primary: { 
      bg: 'bg-gradient-to-br from-[#4263EB] to-[#3730A3]', 
      text: 'text-white',
      shadow: 'shadow-[0_8px_16px_rgba(66,99,235,0.2)]'
    },
    secondary: { 
      bg: 'bg-gradient-to-br from-[#00D68F] to-[#00B074]', 
      text: 'text-white',
      shadow: 'shadow-[0_8px_16px_rgba(0,214,143,0.2)]'
    },
    warning: { 
      bg: 'bg-gradient-to-br from-[#FFAA00] to-[#FF8C00]', 
      text: 'text-white',
      shadow: 'shadow-[0_8px_16px_rgba(255,170,0,0.2)]'
    },
    success: { 
      bg: 'bg-gradient-to-br from-[#10B981] to-[#059669]', 
      text: 'text-white',
      shadow: 'shadow-[0_8px_16px_rgba(16,185,129,0.2)]'
    },
    danger: { 
      bg: 'bg-gradient-to-br from-[#EF4444] to-[#DC2626]', 
      text: 'text-white',
      shadow: 'shadow-[0_8px_16px_rgba(239,68,68,0.2)]'
    },
    info: { 
      bg: 'bg-gradient-to-br from-[#3B82F6] to-[#2563EB]', 
      text: 'text-white',
      shadow: 'shadow-[0_8px_16px_rgba(59,130,246,0.2)]'
    },
  };

  const theme = colorMap[color] || colorMap.primary;

  return (
    <Link href={href} className="bg-[#101426]/15 rounded-2xl p-6 border border-white/10 transition-all duration-500 ease-in-out hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:-translate-y-[1px] hover:backdrop-blur-[20px] hover:border-[#1bc5f8]/50 overflow-hidden no-underline group block">
      <div className="flex items-start gap-5">
        <div className={`w-[60px] h-[60px] rounded-2xl ${theme.bg} flex items-center justify-center ${theme.shadow} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          <i className={`${icon} text-[1.75rem] ${theme.text}`}></i>
        </div>
        <div>
          <h3 className="text-[1.25rem] font-bold text-white mb-2 group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-gray-400 text-[0.95rem]">{description}</p>
        </div>
      </div>
    </Link>
  );
};
