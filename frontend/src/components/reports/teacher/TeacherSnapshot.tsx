'use client';

import React from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { LoadingSpinner } from '@/components/ui';
import KpiCard from '@/components/reports/KpiCard';
import type { TeacherReportKpi } from '@/types/teacher-report.types';

interface TeacherSnapshotProps {
  kpis: TeacherReportKpi[] | null;
  loading?: boolean;
  onDrilldown?: (key: string) => void;
}

const kpiIcons: Record<string, string> = {
  total_students: 'users',
  active_students: 'user-check',
  active_groups: 'layer-group',
  attendance_rate: 'check-circle',
  income_this_month: 'money-bill-wave',
  income_last_month: 'money-bill',
  ytd_income: 'chart-line',
  plan_usage: 'credit-card',
};

export default function TeacherSnapshot({ kpis, loading, onDrilldown }: TeacherSnapshotProps) {
  if (loading) {
    return (
      <DashboardCard title="نظرة عامة" icon="chart-bar" className="mb-6">
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" color="primary" />
        </div>
      </DashboardCard>
    );
  }

  if (!kpis || kpis.length === 0) return null;

  return (
    <DashboardCard title="نظرة عامة" icon="chart-bar" className="mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.key}
            title={kpi.title}
            currentValue={kpi.current_value}
            baselineValue={kpi.baseline_value}
            changePct={kpi.change_pct}
            direction={kpi.direction}
            statusColor={kpi.status_color}
            note={kpi.note}
            drilldownKey={kpi.drilldown_key}
            onDrilldown={onDrilldown}
            icon={kpiIcons[kpi.key] || 'chart-bar'}
          />
        ))}
      </div>
    </DashboardCard>
  );
}
