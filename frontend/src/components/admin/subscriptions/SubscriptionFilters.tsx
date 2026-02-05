import React from 'react';

interface SubscriptionFiltersProps {
  searchTerm: string;
  statusFilter: string;
  typeFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
}

export const SubscriptionFilters: React.FC<SubscriptionFiltersProps> = ({
  searchTerm,
  statusFilter,
  typeFilter,
  onSearchChange,
  onStatusChange,
  onTypeChange,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Search */}
      <div className="relative">
        <i className="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
        <input
          type="text"
          placeholder="بحث بالاسم أو رقم الهاتف أو المدرس..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pr-10 p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary transition-all"
        />
      </div>

      {/* Status Filter */}
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary transition-all"
      >
        <option value="all">جميع الحالات</option>
        <option value="active">نشط</option>
        <option value="trial">تجريبي</option>
        <option value="expired">منتهي</option>
      </select>

      {/* Entity Type Filter */}
      <select
        value={typeFilter}
        onChange={(e) => onTypeChange(e.target.value)}
        className="p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary transition-all"
      >
        <option value="all">الكل</option>
        <option value="teacher">المدرسين</option>
        <option value="academy">الأكاديميات</option>
      </select>
    </div>
  );
};
