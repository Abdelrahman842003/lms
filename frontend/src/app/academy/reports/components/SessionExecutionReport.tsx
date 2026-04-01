'use client';

import React from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { Icon, LoadingSpinner, Badge } from '@/components/ui';
import type { SessionExecution as SessionExecutionType } from '@/types/academyReport.types';

interface SessionExecutionReportProps {
  data: SessionExecutionType | null;
  loading?: boolean;
  onPageChange: (page: number) => void;
}

export default function SessionExecutionReport({ data, loading, onPageChange }: SessionExecutionReportProps) {
  if (loading) {
    return (
      <DashboardCard title="تنفيذ الحصص" icon="book-open" className="mb-6">
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" color="primary" />
        </div>
      </DashboardCard>
    );
  }

  if (!data) return null;

  const { summary, sessions } = data;

  const statusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="success">مكتملة</Badge>;
      case 'cancelled': return <Badge variant="danger">ملغية</Badge>;
      case 'postponed': return <Badge variant="warning">مؤجلة</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  const deliveryRate = summary.scheduled > 0
    ? Math.round((summary.delivered / summary.scheduled) * 100)
    : 0;

  return (
    <DashboardCard title="تنفيذ الحصص" icon="book-open" className="mb-6">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
            <span className="text-gray-400 text-xs block">المجدولة</span>
            <span className="text-white text-xl font-bold">{summary.scheduled}</span>
          </div>
          <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20 text-center">
            <span className="text-gray-400 text-xs block">المقدمة</span>
            <span className="text-green-400 text-xl font-bold">{summary.delivered}</span>
          </div>
          <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-center">
            <span className="text-gray-400 text-xs block">الملغية</span>
            <span className="text-red-400 text-xl font-bold">{summary.canceled}</span>
          </div>
          <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20 text-center">
            <span className="text-gray-400 text-xs block">المؤجلة</span>
            <span className="text-yellow-400 text-xl font-bold">{summary.postponed}</span>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
            <span className="text-gray-400 text-xs block">متوسط الحضور</span>
            <span className="text-white text-xl font-bold">{summary.avg_attendance}%</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300 text-sm">معدل التنفيذ</span>
            <span className="text-primary font-bold">{deliveryRate}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-500"
              style={{ width: `${deliveryRate}%` }}
            />
          </div>
        </div>

        <DataTable
          columns={[
            {
              key: 'title',
              label: 'العنوان',
              sortable: true,
            },
            {
              key: 'teacher',
              label: 'المعلم',
            },
            {
              key: 'date',
              label: 'التاريخ',
              render: (value: string) => new Date(value).toLocaleDateString('ar-EG'),
            },
            {
              key: 'status',
              label: 'الحالة',
              render: (value: string) => statusBadge(value),
            },
            {
              key: 'attendance_count',
              label: 'الحاضرون',
              render: (value: number, row: any) => (
                <span>{value}/{row.total_students}</span>
              ),
            },
          ]}
          data={sessions.data}
          isLoading={false}
          searchable={true}
          pagination={true}
          itemsPerPage={sessions.pagination.per_page}
          totalItems={sessions.pagination.total}
          currentPage={sessions.pagination.page}
          onPageChange={onPageChange}
        />
      </div>
    </DashboardCard>
  );
}
