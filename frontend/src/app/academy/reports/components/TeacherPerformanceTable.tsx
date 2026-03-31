'use client';

import React, { useState } from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { Icon, LoadingSpinner, Badge } from '@/components/ui';
import type { TeacherPerformanceResponse } from '@/types/academyReport.types';

interface TeacherPerformanceTableProps {
  data: TeacherPerformanceResponse | null;
  loading?: boolean;
  onSort: (column: string, direction: string) => void;
  onPageChange: (page: number) => void;
}

export default function TeacherPerformanceTable({ data, loading, onSort, onPageChange }: TeacherPerformanceTableProps) {
  if (loading) {
    return (
      <DashboardCard title="أداء المعلمين" icon="chalkboard-teacher" className="mb-6">
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" color="primary" />
        </div>
      </DashboardCard>
    );
  }

  if (!data) return null;

  const trendBadge = (trend: string) => {
    if (trend === 'up') return <Badge variant="success">↑ تحسن</Badge>;
    if (trend === 'down') return <Badge variant="danger">↓ تراجع</Badge>;
    return <Badge variant="default">→ ثابت</Badge>;
  };

  return (
    <DashboardCard title="أداء المعلمين" icon="chalkboard-teacher" className="mb-6">
      <DataTable
        columns={[
          {
            key: 'teacher_name',
            label: 'المعلم',
            sortable: true,
          },
          {
            key: 'linked_students',
            label: 'الطلاب المرتبطين',
            sortable: true,
            render: (value: number) => <span className="font-semibold">{value}</span>,
          },
          {
            key: 'active_students',
            label: 'النشطين',
            sortable: true,
            render: (value: number) => <span className="text-green-400 font-semibold">{value}</span>,
          },
          {
            key: 'attendance_pct',
            label: 'نسبة الحضور',
            sortable: true,
            render: (value: number) => (
              <span className={`font-semibold ${value >= 80 ? 'text-green-400' : value >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                {value}%
              </span>
            ),
          },
          {
            key: 'groups_count',
            label: 'المجموعات',
            sortable: true,
          },
          {
            key: 'delivered_sessions',
            label: 'الحصص المقدمة',
            sortable: true,
          },
          {
            key: 'trend',
            label: 'الاتجاه',
            render: (value: string) => trendBadge(value),
          },
        ]}
        data={data.data}
        isLoading={false}
        searchable={true}
        pagination={true}
        itemsPerPage={data.pagination.per_page}
        totalItems={data.pagination.total}
        currentPage={data.pagination.page}
        onPageChange={onPageChange}
      />
    </DashboardCard>
  );
}
