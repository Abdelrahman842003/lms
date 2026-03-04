import React from 'react';
import { Icon, Button } from '.';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  minDate?: string;
  maxDate?: string;
}

export const CreativeDatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  minDate,
  maxDate,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [, setSelectedDate] = React.useState(value || '');

  const monthsArabic = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'اختر التاريخ';
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = monthsArabic[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  return (
    <div className="ux-relative">
      {label && (
        <label className="ux-block ux-text-gray-300 ux-mb-2 ux-font-semibold">
          <Icon name="calendar-alt" className="ux-ml-2 ux-text-primary" />
          {label}
        </label>
      )}
      
      <div className="ux-relative">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="ux-w-full ux-px-4 ux-py-3 ux-bg-dark-lighter ux-border-2 ux-border-gray-700 ux-rounded-lg ux-text-white ux-text-right ux-hover-border-primary ux-transition-all ux-duration-200 ux-flex ux-items-center ux-justify-between group"
        >
          <span className={value ? 'ux-text-white' : 'ux-text-gray-400'}>
            {formatDate(value)}
          </span>
          <Icon name="calendar-alt" className="ux-text-primary ux-group-hover-scale-110 ux-transition-transform ux-duration-200" />
        </Button>

        {/* Native date input (hidden but functional) */}
        <input
          type="date"
          value={value}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            onChange(e.target.value);
            setIsOpen(false);
          }}
          min={minDate}
          max={maxDate}
          className="ux-absolute ux-inset-0 ux-w-full ux-h-full ux-opacity-0 ux-cursor-pointer"
        />
      </div>

      {/* Modern overlay indicator */}
      <div className="ux-absolute ux-left-3 ux-top-1-2 transform ux-translate-y-1-2 ux-pointer-events-none">
        <div className="ux-w-2 ux-h-2 ux-bg-primary ux-rounded-full ux-animate-pulse"></div>
      </div>
    </div>
  );
};
