'use client';

import React from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import type { StudentActivityTableRow } from '@/types/teacher-report.types';

interface StudentActivityTableProps {
  students: StudentActivityTableRow[];
}

const stateBadge = (state: string) => {
  if (state === 'active') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
        نشط
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
      غير نشط
    </span>
  );
};

export default function StudentActivityTable({ students }: StudentActivityTableProps) {
  if (!students || students.length === 0) return null;

  return (
    <DashboardCard title="جدول نشاط الطلاب" icon="list" className="mb-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-right py-3 px-4 text-gray-400 font-medium">اسم الطالب</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">المجموعة</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">الحالة</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">آخر نشاط</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 px-4 text-white">{student.student_name}</td>
                <td className="py-3 px-4 text-gray-300">{student.group_name}</td>
                <td className="py-3 px-4">{stateBadge(student.activity_state)}</td>
                <td className="py-3 px-4 text-gray-400">
                  {student.last_activity_date ? new Date(student.last_activity_date).toLocaleDateString('ar-EG') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}
