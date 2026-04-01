'use client';

import React from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { LoadingSpinner, Badge } from '@/components/ui';
import type { TimeComparison as TimeComparisonType } from '@/types/academyReport.types';
import { directionIcon, directionColor } from '@/components/reports/utils';

interface TimeComparisonPanelProps {
  data: TimeComparisonType | null;
  loading?: boolean;
}

export default function TimeComparisonPanel({ data, loading }: TimeComparisonPanelProps) {
  if (loading) {
    return (
      <DashboardCard title="مقارنة الفترات" icon="clock" className="mb-6">
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" color="primary" />
        </div>
      </DashboardCard>
    );
  }

  if (!data || data.changes.length === 0) return null;

  const modeLabel = (mode: string) => {
    switch (mode) {
      case 'previous_period': return 'الفترة السابقة';
      case 'same_period_last_year': return 'نفس الفترة العام الماضي';
      default: return mode;
    }
  };

  return (
    <DashboardCard title="مقارنة الفترات" icon="clock" className="mb-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge className="text-xs">
            مقارنة بـ: {modeLabel(data.comparison_mode)}
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-white/5 text-gray-400">
              <tr>
                <th className="p-3 font-medium text-sm">المؤشر</th>
                <th className="p-3 font-medium text-sm">الحالي</th>
                <th className="p-3 font-medium text-sm">السابق</th>
                <th className="p-3 font-medium text-sm">التغير</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.changes.map((change, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="p-3 text-gray-300 text-sm">{change.label}</td>
                  <td className="p-3 text-white font-semibold text-sm">
                    {typeof change.current === 'number' && change.current % 1 !== 0
                      ? `${change.current}%`
                      : change.current}
                  </td>
                  <td className="p-3 text-gray-400 text-sm">
                    {typeof change.previous === 'number' && change.previous % 1 !== 0
                      ? `${change.previous}%`
                      : change.previous}
                  </td>
                  <td className="p-3">
                    <span className={`font-semibold text-sm ${directionColor(change.direction)}`}>
                      {directionIcon(change.direction)}
                      {change.change_pct !== null ? ` ${Math.abs(change.change_pct).toFixed(1)}%` : ' -'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardCard>
  );
}
