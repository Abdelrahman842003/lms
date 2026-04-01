'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import type { AttendancePerformance } from '@/types/teacher-report.types';
import { directionIcon, directionColor } from '@/components/reports/utils';

interface AttendancePerformanceProps {
  data: AttendancePerformance;
}

export default function AttendancePerformanceCard({ data }: AttendancePerformanceProps) {
  return (
    <DashboardCard title="أداء الحضور" icon="check-circle" className="mb-6">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <span className="text-gray-400 text-xs block mb-1">نسبة الحضور الكلية</span>
            <div className="flex items-center gap-2">
              <span className="text-white text-2xl font-bold">{data.overall_rate}%</span>
              <span className={`text-lg ${directionColor(data.overall_direction)}`}>
                {directionIcon(data.overall_direction)}
              </span>
            </div>
          </div>
          <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/30">
            <span className="text-gray-400 text-xs block mb-1">أفضل مجموعة</span>
            <span className="text-green-400 text-lg font-bold">{data.best_group}</span>
          </div>
          <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/30">
            <span className="text-gray-400 text-xs block mb-1">أضعف مجموعة</span>
            <span className="text-red-400 text-lg font-bold">{data.worst_group}</span>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <span className="text-gray-400 text-xs block mb-1">التغيير عن السابق</span>
            <span className={`text-2xl font-bold ${data.change_from_previous !== null ? (data.change_from_previous >= 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-400'}`}>
              {data.change_from_previous !== null ? `${data.change_from_previous >= 0 ? '+' : ''}${data.change_from_previous.toFixed(1)}%` : '—'}
            </span>
          </div>
        </div>

        {data.by_group.length > 0 && (
          <div className="h-64" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.by_group} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="group_name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  formatter={(value: number) => [`${value}%`, 'نسبة الحضور']}
                />
                <Bar dataKey="attendance_rate" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
