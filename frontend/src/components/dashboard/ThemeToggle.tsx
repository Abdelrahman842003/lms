'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import { Icon } from '@/components/ui/Icon';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getThemeIcon = () => {
    switch (theme) {
      case 'dark':
        return <Icon name="moon" className="text-indigo-600 dark:text-indigo-400 text-base md:text-lg" />;
      case 'light':
        return <Icon name="sun" className="text-amber-600 dark:text-amber-400 text-base md:text-lg" />;
      case 'system':
      default:
        return <Icon name="desktop" className="text-blue-600 dark:text-blue-400 text-base md:text-lg" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'dark':
        return 'الوضع الداكن';
      case 'light':
        return 'الوضع الفاتح';
      case 'system':
      default:
        return 'تلقائي (النظام)';
    }
  };

  const options: { value: Theme; icon: string; label: string; iconColor: string }[] = [
    {
      value: 'system',
      icon: 'desktop',
      label: 'تلقائي (النظام)',
      iconColor: 'text-blue-500',
    },
    {
      value: 'dark',
      icon: 'moon',
      label: 'الوضع الداكن',
      iconColor: 'text-indigo-500',
    },
    {
      value: 'light',
      icon: 'sun',
      label: 'الوضع الفاتح',
      iconColor: 'text-amber-500',
    },
  ];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-text-secondary hover:text-primary hover:bg-surface-secondary border border-border-secondary transition-all relative focus:outline-none"
        title={getThemeLabel()}
        aria-label={getThemeLabel()}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {getThemeIcon()}
      </button>

      {isOpen && (
        <div className="theme-toggle-dropdown absolute top-12 right-0 mt-2 z-[2005] border border-border-theme-primary rounded-xl shadow-xl p-1 flex flex-col gap-0.5 w-40 md:w-44 animate-in fade-in-50 zoom-in-95 duration-200">
          {options.map((opt) => {
            const isActive = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setTheme(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-lg flex items-center gap-3 text-xs md:text-sm transition-all focus:outline-none text-right ${
                  isActive
                    ? 'bg-surface-secondary text-primary font-bold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                }`}
              >
                <Icon name={opt.icon} className={`text-sm ${opt.iconColor}`} />
                <span className="flex-1">{opt.label}</span>
                {isActive && (
                  <Icon name="check" className="text-xs text-primary mr-auto" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
