'use client';

import React from 'react';
import type { MonthlyIncomeRow } from '@/types/teacher-report.types';
import { directionIcon, directionColor } from '@/components/reports/utils';
import { Icon } from '@/components/ui';
import { cn } from '@/utils';

interface MonthlyIncomeTableProps {
  data: MonthlyIncomeRow[];
}

export default function MonthlyIncomeTable({ data }: MonthlyIncomeTableProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="premium-glass premium-border rounded-[2rem] overflow-hidden mb-8">
      <div className="p-6 border-b border-white/5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Icon name="table" size="sm" />
        </div>
        <h3 className="font-black text-white text-sm uppercase tracking-widest">تفصيل الدخل الشهري</h3>
      </div>
      
      <div className="overflow-x-auto scrollbar-none">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="bg-white/5">
              <th className="text-right py-4 px-6 text-[10px] font-black text-gray-light/30 uppercase tracking-widest">الشهر</th>
              <th className="text-right py-4 px-6 text-[10px] font-black text-gray-light/30 uppercase tracking-widest">المبلغ</th>
              <th className="text-right py-4 px-6 text-[10px] font-black text-gray-light/30 uppercase tracking-widest">الشهر السابق</th>
              <th className="text-right py-4 px-6 text-[10px] font-black text-gray-light/30 uppercase tracking-widest">نسبة التغير</th>
              <th className="text-right py-4 px-6 text-[10px] font-black text-gray-light/30 uppercase tracking-widest text-center">الاتجاه</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors group">
                <td className="py-4 px-6 text-xs font-bold text-white">{row.month_name}</td>
                <td className="py-4 px-6 text-xs font-black text-white">{row.amount.toLocaleString()} ج.م</td>
                <td className="py-4 px-6 text-xs font-medium text-gray-light/40">
                  {row.previous_amount !== null ? `${row.previous_amount.toLocaleString()} ج.م` : '—'}
                </td>
                <td className="py-4 px-6">
                  {row.change_pct !== null ? (
                    <span className={cn("text-xs font-black", directionColor(row.direction))}>
                      {row.change_pct > 0 ? '+' : ''}{row.change_pct.toFixed(1)}%
                    </span>
                  ) : '—'}
                </td>
                <td className="py-4 px-6 text-center">
                  <span className={cn("text-xl", directionColor(row.direction))}>
                    {directionIcon(row.direction)}
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
