'use client';

import React from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { Icon, LoadingSpinner } from '@/components/ui';
import type { AcademySnapshot as AcademySnapshotType } from '@/types/academyReport.types';

interface AcademySnapshotProps {
  data: AcademySnapshotType | null;
  loading?: boolean;
}

const directionIcon = (direction: string) => {
  if (direction === 'up') return '↑';
  if (direction === 'down') return '↓';
  return '→';
};

const directionColor = (direction: string, key: string) => {
  if (direction === 'stable') return 'text-gray-400';
  if (key === 'inactive_students') {
    return direction === 'up' ? 'text-red-400' : 'text-green-400';
  }
  return direction === 'up' ? 'text-green-400' : 'text-red-400';
};

const kpiIcons: Record<string, string> = {
  total_students: 'users',
  active_students: 'user-check',
  new_students: 'user-plus',
  inactive_students: 'user-minus',
  total_teachers: 'chalkboard-teacher',
  active_groups: 'layer-group',
  sessions_delivered: 'book-open',
  attendance_rate: 'check-circle',
};

export default function AcademySnapshot({ data, loading }: AcademySnapshotProps) {
  if (loading) {
    return (
      <DashboardCard title="نظرة عامة على الأكاديمية" icon="chart-bar" className="mb-6">
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" color="primary" />
        </div>
      </DashboardCard>
    );
  }

  if (!data) return null;

  return (
    <DashboardCard title="نظرة عامة على الأكاديمية" icon="chart-bar" className="mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.kpis.map((kpi) => (
          <div
            key={kpi.key}
            className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs">{kpi.title}</span>
              <Icon name={kpiIcons[kpi.key] || 'chart-bar'} className="text-primary text-lg" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-white text-2xl font-bold">
                {typeof kpi.current_value === 'number' && kpi.key === 'attendance_rate'
                  ? `${kpi.current_value}%`
                  : kpi.current_value}
              </span>
              {kpi.change_pct !== null && (
                <span className={`text-sm font-medium ${directionColor(kpi.direction, kpi.key)}`}>
                  {directionIcon(kpi.direction)} {Math.abs(kpi.change_pct).toFixed(1)}%
                </span>
              )}
            </div>
            {kpi.baseline_value !== null && (
              <span className="text-gray-500 text-xs mt-1 block">
                السابق: {kpi.key === 'attendance_rate' ? `${kpi.baseline_value}%` : kpi.baseline_value}
              </span>
            )}
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
