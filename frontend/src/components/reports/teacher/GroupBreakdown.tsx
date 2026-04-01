'use client';

import React from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import type { GroupBreakdownRow } from '@/types/teacher-report.types';
import { directionIcon, directionColor } from '@/components/reports/utils';

interface GroupBreakdownProps {
  groups: GroupBreakdownRow[];
}

export default function GroupBreakdown({ groups }: GroupBreakdownProps) {
  if (!groups || groups.length === 0) return null;

  return (
    <DashboardCard title="تفصيل المجموعات" icon="layer-group" className="mb-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-right py-3 px-4 text-gray-400 font-medium">المجموعة</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">الطلاب</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">النشطين</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">الحضور %</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">الحصص</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">الدخل</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">الاتجاه</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 px-4 text-white">{group.group_name}</td>
                <td className="py-3 px-4 text-gray-300">{group.students_count}</td>
                <td className="py-3 px-4 text-gray-300">{group.active_students}</td>
                <td className="py-3 px-4 text-gray-300">{group.attendance_rate}%</td>
                <td className="py-3 px-4 text-gray-300">{group.delivered_sessions}</td>
                <td className="py-3 px-4 text-white font-medium">{group.income_contribution.toLocaleString()} ج.م</td>
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
