import React from 'react';

interface LoginCardProps {
  children: React.ReactNode;
  title: React.ReactNode;
  subtitle: string;
  icon?: React.ReactNode;
}

export const LoginCard: React.FC<LoginCardProps> = ({ children, title, subtitle, icon }) => {
  return (
    <div className="p-[50px_45px] rounded-[24px] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.3)] transition-all duration-300 hover:backdrop-blur-[3px] hover:border-[0.5px] hover:border-[#4163eb2e]">
      <div className="text-center mb-[35px]">
        {icon && (
          <div className="w-[110px] h-[110px] mx-auto mb-5 flex items-center justify-center">
            {icon}
          </div>
        )}
        <h1 className="text-[2rem] font-[800] mb-3 bg-[linear-gradient(to_right,#fff_40%,var(--secondary)_100%)] bg-clip-text text-transparent">
          {title}
        </h1>
        <p className="text-[1rem] text-[#E9ECEF] leading-[1.6]">{subtitle}</p>
      </div>
      {children}
    </div>
  );
};
