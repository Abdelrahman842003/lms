'use client';

import React from 'react';
import { Icon } from '@/components/ui/Icon';

interface UserTypeSelectorProps {
  userType: 'student' | 'teacher' | 'secretary' | 'parent' | 'academy';
  onChange: (type: 'student' | 'teacher' | 'secretary' | 'parent' | 'academy') => void;
}

export const UserTypeSelector: React.FC<UserTypeSelectorProps> = ({ userType, onChange }) => {
  const userTypes = [
    { type: 'teacher' as const, icon: 'chalkboard-teacher', label: 'مدرس' },
    { type: 'student' as const, icon: 'user-graduate', label: 'طالب' },
    { type: 'academy' as const, icon: 'building', label: 'أكاديمية' },
    { type: 'secretary' as const, icon: 'user-tie', label: 'سكرتير' },
    { type: 'parent' as const, icon: 'user-friends', label: 'ولي أمر' },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-2 md:gap-3 p-1">
      {userTypes.map((item) => {
        const active = userType === item.type;
        return (
          <button
            key={item.type}
            type="button"
            onClick={() => onChange(item.type)}
            className={`
              relative flex flex-col items-center justify-center min-w-[65px] md:min-w-[75px] p-2 md:p-3 rounded-xl md:rounded-2xl
              transition-all duration-300 border
              ${active 
                ? 'bg-[#3249A9] border-[#3249A9] shadow-lg shadow-[#3249A9]/20 scale-105 z-10' 
                : 'bg-white/[0.03] border-white/10 hover:border-white/20'
              }
            `}
          >
            {/* Icon */}
            <div className={`
              mb-1 transition-transform duration-300
              ${active ? 'text-white' : 'text-gray-400'}
            `}>
              <Icon 
                name={item.icon} 
                className="text-base md:text-lg" 
              />
            </div>

            {/* Label */}
            <span className={`
              text-[0.7rem] md:text-[0.75rem] font-bold
              ${active ? 'text-white' : 'text-gray-400'}
            `}>
              {item.label}
            </span>

            {/* Subtle Active Indicator */}
            {active && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-white rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
};
