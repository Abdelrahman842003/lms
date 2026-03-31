'use client';

import React from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { Select, Button, Input, Icon } from '@/components/ui';
import type { TeacherReportFilters } from '@/services/teacherReportService';

interface ReportFiltersProps {
  filters: TeacherReportFilters;
  onFiltersChange: (filters: TeacherReportFilters) => void;
  onApply: () => void;
  loading?: boolean;
}

const PERIOD_PRESETS = [
  { value: 'this_month', label: 'هذا الشهر' },
  { value: 'last_month', label: 'الشهر الماضي' },
  { value: 'last_7_days', label: 'آخر 7 أيام' },
  { value: 'last_3_months', label: 'آخر 3 أشهر' },
  { value: 'this_year', label: 'هذا العام' },
  { value: 'today', label: 'اليوم' },
  { value: 'custom', label: 'مخصص' },
];

export default function ReportFilters({ filters, onFiltersChange, onApply, loading }: ReportFiltersProps) {
  const isCustom = filters.preset === 'custom';

  return (
    <DashboardCard title="خيارات التصفية" icon="filter" className="mb-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-300 mb-2 font-semibold text-sm">الفترة</label>
            <Select
              value={filters.preset || 'this_month'}
              onChange={(value) =>
                onFiltersChange({ ...filters, preset: value as TeacherReportFilters['preset'] })
              }
              options={PERIOD_PRESETS}
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2 font-semibold text-sm">حالة النشاط</label>
            <Select
              value={filters.student_activity_state || ''}
              onChange={(value) =>
                onFiltersChange({
                  ...filters,
                  student_activity_state: (value || undefined) as TeacherReportFilters['student_activity_state'],
                })
              }
              options={[
                { value: '', label: 'الكل' },
                { value: 'active', label: 'نشط' },
                { value: 'inactive', label: 'غير نشط' },
              ]}
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2 font-semibold text-sm">وضع المقارنة</label>
            <Select
              value={filters.comparison_mode || ''}
              onChange={(value) =>
                onFiltersChange({
                  ...filters,
                  comparison_mode: (value || undefined) as TeacherReportFilters['comparison_mode'],
                })
              }
              options={[
                { value: '', label: 'بدون مقارنة' },
                { value: 'previous_period', label: 'الفترة السابقة' },
                { value: 'same_period_last_year', label: 'نفس الفترة العام الماضي' },
              ]}
            />
          </div>
        </div>

        {isCustom && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
            <div>
              <label className="block text-gray-400 mb-2 text-sm">من تاريخ</label>
              <Input
                type="date"
                value={filters.start_at || ''}
                onChange={(e) => onFiltersChange({ ...filters, start_at: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2 text-sm">إلى تاريخ</label>
              <Input
                type="date"
                value={filters.end_at || ''}
                onChange={(e) => onFiltersChange({ ...filters, end_at: e.target.value })}
                className="w-full"
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
