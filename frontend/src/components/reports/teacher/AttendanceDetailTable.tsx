'use client';

import React from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import type { AttendanceGroupMetrics } from '@/types/teacher-report.types';
import { directionIcon, directionColor } from '@/components/reports/utils';

interface AttendanceDetailTableProps {
  groups: AttendanceGroupMetrics[];
}

const rateColor = (rate: number) => {
  if (rate >= 80) return 'text-green-400';
  if (rate >= 60) return 'text-yellow-400';
  return 'text-red-400';
};

export default function AttendanceDetailTable({ groups }: AttendanceDetailTableProps) {
  if (!groups || groups.length === 0) return null;

  return (
    <DashboardCard title="تفصيل الحضور حسب المجموعة" icon="table" className="mb-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-right py-3 px-4 text-gray-400 font-medium">المجموعة</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">عدد الطلاب</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">نسبة الحضور</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">الحصص</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">الاتجاه</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 px-4 text-white">{group.group_name}</td>
                <td className="py-3 px-4 text-gray-300">{group.students_count}</td>
                <td className="py-3 px-4">
                  <span className={`font-medium ${rateColor(group.attendance_rate)}`}>
                    {group.attendance_rate}%
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-300">{group.sessions_count}</td>
                <td className="py-3 px-4">
                  <span className={`text-lg ${directionColor(group.trend)}`}>
                    {directionIcon(group.trend)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}
