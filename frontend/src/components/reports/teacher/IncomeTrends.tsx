'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import type { IncomeTrendSummary, IncomeTrendSeries } from '@/types/teacher-report.types';

interface IncomeTrendsProps {
  data: IncomeTrendSummary;
  series: IncomeTrendSeries[];
}

const directionIcon = (direction: string) => {
  if (direction === 'up') return '↑';
  if (direction === 'down') return '↓';
  return '→';
};

const directionColor = (direction: string) => {
  if (direction === 'stable') return 'text-gray-400';
  return direction === 'up' ? 'text-green-400' : 'text-red-400';
};

export default function IncomeTrends({ data, series }: IncomeTrendsProps) {
  return (
    <DashboardCard title="اتجاه الدخل" icon="chart-line" className="mb-6">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <span className="text-gray-400 text-xs block mb-1">الدخل الحالي</span>
            <span className="text-white text-2xl font-bold">{data.current.toLocaleString()} ج.م</span>
            {data.change_pct !== null && (
              <span className={`text-sm mr-2 ${directionColor(data.direction)}`}>
                {directionIcon(data.direction)} {Math.abs(data.change_pct).toFixed(1)}%
              </span>
            )}
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <span className="text-gray-400 text-xs block mb-1">الفترة السابقة</span>
            <span className="text-white text-2xl font-bold">
              {data.baseline?.toLocaleString() ?? '—'} ج.م
            </span>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <span className="text-gray-400 text-xs block mb-1">التغيير</span>
            <span className={`text-2xl font-bold ${directionColor(data.direction)}`}>
              {directionIcon(data.direction)} {data.change_pct !== null ? `${Math.abs(data.change_pct).toFixed(1)}%` : '—'}
            </span>
          </div>
        </div>

        {series.length > 0 && (
          <div className="h-72" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="label" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  formatter={(value: number) => [`${value.toLocaleString()} ج.م`, 'الدخل']}
                />
                <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
