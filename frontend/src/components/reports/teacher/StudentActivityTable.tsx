'use client';

import React from 'react';
import type { StudentActivityTableRow } from '@/types/teacher-report.types';
import { Icon, Badge } from '@/components/ui';
import { cn } from '@/utils';

interface StudentActivityTableProps {
  students: StudentActivityTableRow[];
}

export default function StudentActivityTable({ students }: StudentActivityTableProps) {
  if (!students || students.length === 0) return null;

  return (
    <div className="premium-glass premium-border rounded-[2rem] overflow-hidden mb-8">
      <div className="p-6 border-b border-white/5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Icon name="users-viewfinder" size="sm" />
        </div>
        <h3 className="font-black text-white text-sm uppercase tracking-widest">تحليل نشاط الطلاب</h3>
      </div>
      
      <div className="overflow-x-auto scrollbar-none">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="bg-white/5">
              <th className="text-right py-4 px-6 text-[10px] font-black text-gray-light/30 uppercase tracking-widest">الطالب</th>
              <th className="text-right py-4 px-6 text-[10px] font-black text-gray-light/30 uppercase tracking-widest">المجموعة</th>
              <th className="text-right py-4 px-6 text-[10px] font-black text-gray-light/30 uppercase tracking-widest">الحالة</th>
              <th className="text-right py-4 px-6 text-[10px] font-black text-gray-light/30 uppercase tracking-widest">آخر ظهور</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {students.map((student, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors group">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-light/20 font-black text-[10px] group-hover:bg-primary/10 group-hover:text-primary transition-all">
                      {student.student_name.charAt(0)}
                    </div>
                    <span className="text-xs font-bold text-white">{student.student_name}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-xs font-medium text-gray-light/40">{student.group_name}</td>
                <td className="py-4 px-6">
                  <Badge variant={student.activity_state === 'active' ? 'success' : 'danger'} size="sm" className="font-black uppercase tracking-tighter scale-90">
                    {student.activity_state === 'active' ? 'نشط حالياً' : 'غير نشط'}
                  </Badge>
                </td>
                <td className="py-4 px-6 text-xs font-medium text-gray-light/20 italic">
                  {student.last_activity_date ? new Date(student.last_activity_date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
