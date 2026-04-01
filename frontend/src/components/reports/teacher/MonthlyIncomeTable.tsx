'use client';

import React from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import type { MonthlyIncomeRow } from '@/types/teacher-report.types';
import { directionIcon, directionColor } from '@/components/reports/utils';

interface MonthlyIncomeTableProps {
  data: MonthlyIncomeRow[];
}

export default function MonthlyIncomeTable({ data }: MonthlyIncomeTableProps) {
  if (!data || data.length === 0) return null;

  return (
    <DashboardCard title="تفصيل الدخل الشهري" icon="table" className="mb-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-right py-3 px-4 text-gray-400 font-medium">الشهر</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">المبلغ</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">السابق</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">التغيير %</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">الاتجاه</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 px-4 text-white">{row.month_name}</td>
                <td className="py-3 px-4 text-white font-medium">{row.amount.toLocaleString()} ج.م</td>
                <td className="py-3 px-4 text-gray-400">
                  {row.previous_amount !== null ? `${row.previous_amount.toLocaleString()} ج.م` : '—'}
                </td>
                <td className="py-3 px-4">
                  {row.change_pct !== null ? (
                    <span className={directionColor(row.direction)}>
                      {Math.abs(row.change_pct).toFixed(1)}%
                    </span>
                  ) : '—'}
                </td>
                <td className="py-3 px-4">
                  <span className={`text-lg ${directionColor(row.direction)}`}>
                    {directionIcon(row.direction)}
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
