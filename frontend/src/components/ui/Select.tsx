import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

export interface SelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  icon?: string;
  disabled?: boolean;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'اختر...',
  className = '',
  icon,
  disabled = false
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className={`
          flex items-center justify-between gap-2 px-4 py-2.5 
          bg-white/5 border border-white/10 rounded-lg 
          text-white cursor-pointer transition-all duration-200
          hover:bg-white/10 hover:border-white/20
          ${isOpen ? 'border-primary/50 ring-1 ring-primary/50' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <i className={`${icon} text-primary/80`}></i>}
          <span className={`text-sm ${!selectedOption ? 'text-gray-400' : ''}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <i className={`fas fa-chevron-down text-xs text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}></i>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden bg-[#1e1e2d] border border-white/10 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-[240px] overflow-y-auto py-1 custom-scrollbar">
            {options.map((option) => (
              <div
                key={option.value}
                className={`
                  px-4 py-2.5 text-sm cursor-pointer transition-colors
                  flex items-center justify-between
                  ${option.value === value ? 'bg-primary/10 text-primary' : 'text-gray-300 hover:bg-white/5 hover:text-white'}
                `}
                onClick={() => handleSelect(option.value)}
              >
                <span>{option.label}</span>
                {option.value === value && <i className="fas fa-check text-xs"></i>}
              </div>
            ))}
            {options.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                لا توجد خيارات
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
