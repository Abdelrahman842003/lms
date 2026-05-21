'use client';

import React from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { Select, Button, Icon } from '@/components/ui';
import type { AcademyReportFilters } from '@/types/academyReport.types';

interface ReportFiltersBarProps {
  filters: AcademyReportFilters;
  onFiltersChange: (filters: AcademyReportFilters) => void;
  onApply: () => void;
  loading?: boolean;
}

const PERIOD_PRESETS = [
  { value: 'this_month', label: 'هذا الشهر' },
  { value: 'last_month', label: 'الشهر الماضي' },
  { value: 'last_7_days', label: 'آخر 7 أيام' },
  { value: 'last_3_months', label: 'آخر 3 أشهر' },
  { value: 'this_year', label: 'هذا العام' },
  { value: 'custom_range', label: 'نطاق مخصص' },
];

export default function ReportFiltersBar({ filters, onFiltersChange, onApply, loading }: ReportFiltersBarProps) {
  const isCustom = filters.preset === 'custom_range';

  return (
    <DashboardCard title="خيارات التصفية" icon="filter" className="mb-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-300 mb-2 font-semibold text-sm">الفترة</label>
            <Select
              value={filters.preset || 'this_month'}
              onChange={(value) => onFiltersChange({ ...filters, preset: value as any })}
              options={PERIOD_PRESETS}
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2 font-semibold text-sm">حالة الطلاب</label>
            <Select
              value={filters.student_status || ''}
              onChange={(value) => onFiltersChange({ ...filters, student_status: value || undefined })}
              options={[
                { value: '', label: 'الكل' },
                { value: 'active', label: 'نشط' },
                { value: 'inactive', label: 'غير نشط' },
              ]}
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2 font-semibold text-sm">حالة الحصص</label>
            <Select
              value={filters.session_status || ''}
              onChange={(value) => onFiltersChange({ ...filters, session_status: value || undefined })}
              options={[
                { value: '', label: 'الكل' },
                { value: 'completed', label: 'مكتملة' },
                { value: 'cancelled', label: 'ملغية' },
                { value: 'postponed', label: 'مؤجلة' },
              ]}
            />
          </div>
        </div>

        {isCustom && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-4">
            <div>
              <label className="block text-gray-300 mb-2 font-semibold text-sm">من تاريخ</label>
              <input
                type="date"
                value={filters.start_at || ''}
                onChange={(e) => onFiltersChange({ ...filters, start_at: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2 font-semibold text-sm">إلى تاريخ</label>
              <input
                type="date"
                value={filters.end_at || ''}
                onChange={(e) => onFiltersChange({ ...filters, end_at: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button
            onClick={onApply}
            disabled={loading}
            variant="primary"
            className="px-6 py-2.5 flex items-center gap-2"
          >
            <Icon name="refresh" />
            {loading ? 'جاري التحديث...' : 'تحديث التقرير'}
          </Button>
        </div>
      </div>
    </DashboardCard>
  );
}
