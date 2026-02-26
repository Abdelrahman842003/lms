'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';

interface MonthDropdownProps {
  value: number;
  onChange: (month: number) => void;
  label?: string;
}

export const MonthDropdown: React.FC<MonthDropdownProps> = ({ value, onChange, label = 'الشهر' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const months = [
    { value: 0, label: 'الكل' },
    ...Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: new Date(2000, i).toLocaleDateString('ar-EG', { month: 'long' })
    }))
  ];

  const selectedMonth = months.find(m => m.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const handleSelect = (monthValue: number) => {
    onChange(monthValue);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <label className="block text-gray-300 mb-2 font-semibold">
        <Icon name="calendar" className="ml-2 text-primary" />
        {label}
      </label>
      
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 bg-dark-lighter border-2 border-gray-700 rounded-lg text-white hover:border-primary transition-all cursor-pointer flex items-center justify-between"
      >
        <span>{selectedMonth?.label || 'اختر الشهر'}</span>
        <Icon name="chevron-down" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#0D1120] border border-white/10 rounded-lg shadow-2xl z-50 max-h-80 overflow-y-auto">
            {months.map((month) => (
              <div
                key={month.value}
                onClick={() => handleSelect(month.value)}
                className={`px-4 py-3 cursor-pointer transition-colors ${
                  value === month.value
                    ? 'bg-primary/20 text-primary'
                    : 'hover:bg-white/5 text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{month.label}</span>
                  {value === month.value && (
                    <Icon name="check" className="text-primary" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
