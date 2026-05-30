'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Icon } from '@/components/ui/Icon';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-gray-light/40 hover:text-primary hover:bg-white/10 transition-all relative overflow-hidden group focus:outline-none"
      title={theme === 'dark' ? 'الوضع المضيء' : 'الوضع المظلم'}
      aria-label={theme === 'dark' ? 'الوضع المضيء' : 'الوضع المظلم'}
    >
      {/* Background glow on hover */}
      <span className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />

      <div className="relative w-5 h-5 flex items-center justify-center">
        {theme === 'dark' ? (
          <div className="transform transition-all duration-300 rotate-0 scale-100 opacity-100 flex items-center justify-center">
            <Icon name="sun" className="text-amber-400 text-lg md:text-xl" />
          </div>
        ) : (
          <div className="transform transition-all duration-300 rotate-90 scale-100 opacity-100 flex items-center justify-center">
            <Icon name="moon" className="text-indigo-600 text-lg md:text-xl" />
          </div>
        )}
      </div>
    </button>
  );
};
