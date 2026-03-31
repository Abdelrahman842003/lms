'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { Icon } from '@/components/ui';
import type { StudentActivityMetrics, IncomeTrendSeries } from '@/types/teacher-report.types';

interface StudentActivityProps {
  metrics: StudentActivityMetrics;
  trend?: IncomeTrendSeries[];
}

const metricCards = [
  { key: 'total_students' as const, label: 'إجمالي الطلاب', icon: 'users' },
  { key: 'active_students' as const, label: 'النشطين', icon: 'user-check' },
  { key: 'inactive_students' as const, label: 'غير النشطين', icon: 'user-minus' },
  { key: 'new_students' as const, label: 'الجدد', icon: 'user-plus' }
];

export default function StudentActivity({ metrics, trend }: StudentActivityProps) {
  const trendData = trend ?? metrics.activity_trend ?? [];

  return (
    <DashboardCard title="نشاط الطلاب" icon="users" className="mb-6">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metricCards.map((card) => (
            <div key={card.key} className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-xs">{card.label}</span>
                <Icon name={card.icon} className="text-primary text-lg" />
              </div>
              <span className="text-white text-2xl font-bold">{metrics[card.key]}</span>
            </div>
          ))}
        </div>

        {trendData.length > 0 && (
          <div className="h-64" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="label" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  formatter={(value: number) => [value, 'العدد']}
                />
                <Area type="monotone" dataKey="value" stroke="#6366f1" fill="rgba(99,102,241,0.2)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
