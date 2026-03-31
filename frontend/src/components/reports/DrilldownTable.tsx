'use client';

import React from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import type { TeacherDrilldownResponse } from '@/types/teacher-report.types';

interface DrilldownTableProps {
  data: TeacherDrilldownResponse;
  onPageChange?: (page: number) => void;
  onClose?: () => void;
}

export default function DrilldownTable({ data, onPageChange, onClose }: DrilldownTableProps) {
  const { schema, rows, pagination } = data;
  const totalPages = Math.ceil(pagination.total / pagination.per_page);

  return (
    <DashboardCard title={data.title} icon="table" className="mb-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {schema.columns.map((col) => (
                <th key={col.key} className="text-right py-3 px-4 text-gray-400 font-medium">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={schema.columns.length} className="py-8 text-center text-gray-500">
                  لا توجد بيانات
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  {schema.columns.map((col) => (
                    <td key={col.key} className="py-3 px-4 text-gray-300">
                      {row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
        <span className="text-gray-400 text-sm">
          صفحة {pagination.current_page} من {totalPages || 1}
        </span>
        <div className="flex items-center gap-3">
          {onPageChange && pagination.current_page > 1 && (
            <button
              onClick={() => onPageChange(pagination.current_page - 1)}
              className="text-gray-400 hover:text-white text-sm px-3 py-1 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >
              السابق
            </button>
          )}
          {onPageChange && pagination.current_page < totalPages && (
            <button
              onClick={() => onPageChange(pagination.current_page + 1)}
              className="text-gray-400 hover:text-white text-sm px-3 py-1 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >
              التالي
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-sm px-3 py-1 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >
              إغلاق
            </button>
          )}
        </div>
      </div>
    </DashboardCard>
  );
}
