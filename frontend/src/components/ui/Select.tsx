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
  className='',
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
    <div
      className={`select ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''} ${className}`}
      ref={dropdownRef}
    >
      <div
        className="select-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="select-value">
          {icon && <Icon name={icon.replace('fas fa-', '')} className="select-leading-icon" />}
          <span className={!selectedOption ? 'select-placeholder' : ''}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <Icon name="chevron-down" size="xs" className="select-chevron" />
      </div>

      {isOpen && (
        <div className="select-menu">
          {searchable && (
            <div className="select-search">
              <div className="ui-input-container">
                <Icon name="search" size="xs" className="select-search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="form-input ux-w-full"
                  placeholder="بحث..."
                  value={searchTerm}
                  onChange={handleSearch}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
          <div className="select-options custom-scrollbar">
            {filteredOptions.map((option) => (
              <div
                key={option.value}
                className={`select-option ${option.value === value ? 'selected' : ''}`}
                onClick={() => handleSelect(option.value)}
              >
                <span>{option.label}</span>
                {option.value === value && <Icon name="check" size="xs" />}
              </div>
            ))}
            {filteredOptions.length === 0 && (
              <div className="select-empty">
                {searchTerm ? 'لا توجد نتائج' : 'لا توجد خيارات'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
