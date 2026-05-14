'use client';

import React from 'react';
import type { AttendanceGroupMetrics } from '@/types/teacher-report.types';
import { directionIcon, directionColor } from '@/components/reports/utils';
import { Icon } from '@/components/ui';
import { cn } from '@/utils';

interface AttendanceDetailTableProps {
  groups: AttendanceGroupMetrics[];
}

const rateColor = (rate: number) => {
  if (rate >= 80) return 'text-success';
  if (rate >= 60) return 'text-warning';
  return 'text-danger';
};

export default function AttendanceDetailTable({ groups }: AttendanceDetailTableProps) {
  if (!groups || groups.length === 0) return null;

  return (
    <div className="premium-glass premium-border rounded-[2rem] overflow-hidden mb-8">
      <div className="p-6 border-b border-white/5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Icon name="calendar-check" size="sm" />
        </div>
        <h3 className="font-black text-white text-sm uppercase tracking-widest">تحليل الحضور حسب المجموعات</h3>
      </div>
      
      <div className="overflow-x-auto scrollbar-none">
        <table className="w-full min-w-[650px]">
          <thead>
            <tr className="bg-white/5">
              <th className="text-right py-4 px-6 text-[10px] font-black text-gray-light/30 uppercase tracking-widest">المجموعة</th>
              <th className="text-right py-4 px-6 text-[10px] font-black text-gray-light/30 uppercase tracking-widest">الطلاب</th>
              <th className="text-right py-4 px-6 text-[10px] font-black text-gray-light/30 uppercase tracking-widest">نسبة الحضور</th>
              <th className="text-right py-4 px-6 text-[10px] font-black text-gray-light/30 uppercase tracking-widest">الحصص</th>
              <th className="text-right py-4 px-6 text-[10px] font-black text-gray-light/30 uppercase tracking-widest text-center">الاتجاه</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {groups.map((group, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors group">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                    <span className="text-xs font-bold text-white">{group.group_name}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-xs font-black text-white">{group.students_count}</td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-white/5 rounded-full max-w-[40px] overflow-hidden">
                       <div 
                         className={cn("h-full rounded-full", rateColor(group.attendance_rate).replace('text-', 'bg-'))}
                         style={{ width: `${group.attendance_rate}%` }}
                       />
                    </div>
                    <span className={cn("text-xs font-black", rateColor(group.attendance_rate))}>
                      {group.attendance_rate}%
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6 text-xs font-medium text-gray-light/40">{group.sessions_count} حصة</td>
                <td className="py-4 px-6 text-center">
                  <span className={cn("text-xl", directionColor(group.trend))}>
                    {directionIcon(group.trend)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
