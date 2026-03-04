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
    <div ref={dropdownRef} className="ux-relative">
      <label className="ux-block ux-text-gray-300 ux-mb-2 ux-font-semibold">
        <Icon name="calendar" className="ux-ml-2 ux-text-primary" />
        {label}
      </label>
      
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="ux-w-full ux-p-3 ux-bg-dark-lighter ux-border-2 ux-border-gray-700 ux-rounded-lg ux-text-white ux-hover-border-primary ux-transition-all ux-cursor-pointer ux-flex ux-items-center ux-justify-between"
      >
        <span>{selectedMonth?.label || 'اختر الشهر'}</span>
        <Icon name="chevron-down" className={`ux-transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="ux-fixed ux-inset-0 ux-z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="ux-absolute ux-top-full ux-left-0 ux-right-0 ux-mt-2 ux-bg-0d1120 ux-border ux-border-white-10 ux-rounded-lg ux-shadow-2xl ux-z-50 ux-max-h-80 ux-overflow-y-auto">
            {months.map((month) => (
              <div
                key={month.value}
                onClick={() => handleSelect(month.value)}
                className={`ux-px-4 ux-py-3 ux-cursor-pointer ux-transition-colors ${
                  value === month.value
                    ? 'ux-bg-primary-20 ux-text-primary'
                    : 'ux-hover-bg-white-5 ux-text-white'
                }`}
              >
                <div className="ux-flex ux-items-center ux-justify-between">
                  <span>{month.label}</span>
                  {value === month.value && (
                    <Icon name="check" className="ux-text-primary" />
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
