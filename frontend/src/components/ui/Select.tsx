'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';

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
  searchable?: boolean;
  onSearchChange?: (value: string) => void;
  disableLocalFilter?: boolean;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'اختر...',
  className = '',
  icon,
  disabled = false,
  searchable = false,
  onSearchChange,
  disableLocalFilter = false
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) {
      setSearchTerm('');
      if (onSearchChange) onSearchChange('');
    }
  }, [isOpen, searchable]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
    if (onSearchChange) onSearchChange('');
  };

  const filteredOptions = disableLocalFilter 
    ? options 
    : options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      );

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
          {icon && <Icon name={icon.replace('fas fa-', '')} className="text-primary/80" />}
          <span className={`text-sm ${!selectedOption ? 'text-gray-400' : ''}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <Icon name="chevron-down" size="xs" className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden bg-[#1e1e2d] border border-white/10 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-100">
          {searchable && (
            <div className="p-2 border-b border-white/10">
              <div className="relative">
                <Icon name="search" size="xs" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-md py-1.5 pr-8 pl-3 text-sm text-white focus:outline-none focus:border-primary/50 placeholder:text-gray-500"
                  placeholder="بحث..."
                  value={searchTerm}
                  onChange={handleSearch}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
          <div className="max-h-[240px] overflow-y-auto py-1 custom-scrollbar">
            {filteredOptions.map((option) => (
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
                {option.value === value && <Icon name="check" size="xs" />}
              </div>
            ))}
            {filteredOptions.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                {searchTerm ? 'لا توجد نتائج' : 'لا توجد خيارات'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
