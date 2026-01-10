import React from 'react';

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
  const [selectedDate, setSelectedDate] = React.useState(value || '');

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
    <div className="relative">
      {label && (
        <label className="block text-gray-300 mb-2 font-semibold">
          <i className="fas fa-calendar-alt ml-2 text-primary"></i>
          {label}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 bg-dark-lighter border-2 border-gray-700 rounded-lg text-white text-right hover:border-primary transition-all duration-200 flex items-center justify-between group"
        >
          <span className={value ? 'text-white' : 'text-gray-400'}>
            {formatDate(value)}
          </span>
          <i className={`fas fa-calendar-alt text-primary group-hover:scale-110 transition-transform duration-200`}></i>
        </button>

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
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      {/* Modern overlay indicator */}
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};
