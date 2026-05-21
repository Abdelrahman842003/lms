'use client';

import React from 'react';
import { Select, Button, Icon } from '@/components/ui';
import type { TeacherReportFilters } from '@/types/teacher-report.types';
import { cn } from '@/utils';

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
  { value: 'custom_range', label: 'مخصص' },
];

export default function ReportFilters({ filters, onFiltersChange, onApply, loading }: ReportFiltersProps) {
  const isCustom = filters.preset === 'custom_range';

  return (
    <div className="flex flex-col gap-2 w-full md:w-auto relative z-50">
      <div className="p-1 rounded-2xl premium-glass premium-border flex flex-col md:flex-row items-center gap-2">
        <div className="w-full md:w-36">
          <Select
            value={filters.preset || 'this_month'}
            onChange={(value) =>
              onFiltersChange({ ...filters, preset: value as TeacherReportFilters['preset'] })
            }
            options={PERIOD_PRESETS}
            className="h-10 border-transparent bg-transparent text-[10px] font-black uppercase"
          />
        </div>

        <div className="hidden md:block w-px h-5 bg-white/10" />

        <div className="w-full md:w-36">
          <Select
            value={filters.student_activity_state || ''}
            onChange={(value) =>
              onFiltersChange({
                ...filters,
                student_activity_state: (value || undefined) as TeacherReportFilters['student_activity_state'],
              })
            }
            options={[
              { value: '', label: 'كل الحالات' },
              { value: 'active', label: 'نشط' },
              { value: 'inactive', label: 'غير نشط' },
            ]}
            className="h-10 border-transparent bg-transparent text-[10px] font-black uppercase"
          />
        </div>

        <Button
          onClick={onApply}
          disabled={loading}
          variant="primary"
          className="w-full md:w-auto h-10 px-6 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-lg"
        >
          <Icon name={loading ? 'sync' : 'refresh'} className={cn(loading && 'animate-spin')} />
          <span>تحديث</span>
        </Button>
      </div>

      {isCustom && (
        <div className="grid grid-cols-2 gap-2 p-2 rounded-xl premium-glass premium-border animate-in slide-in-from-top-2">
          <input
            type="date"
            value={filters.start_at || ''}
            onChange={(e) => onFiltersChange({ ...filters, start_at: e.target.value })}
            className="h-8 bg-white/5 border border-white/5 rounded-lg text-[9px] text-white px-3 outline-none"
          />
          <input
            type="date"
            value={filters.end_at || ''}
            onChange={(e) => onFiltersChange({ ...filters, end_at: e.target.value })}
            className="h-8 bg-white/5 border border-white/5 rounded-lg text-[9px] text-white px-3 outline-none"
          />
        </div>
      )}
    </div>
  );
}
