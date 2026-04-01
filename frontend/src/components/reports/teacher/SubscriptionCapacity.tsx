'use client';

import React from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { Icon } from '@/components/ui';
import type { SubscriptionCapacity as SubscriptionCapacityType } from '@/types/teacher-report.types';

interface SubscriptionCapacityProps {
  data: SubscriptionCapacityType;
}

const statusBadge = (status: string) => {
  if (status === 'active') return 'bg-green-500/20 text-green-400';
  if (status === 'expired') return 'bg-red-500/20 text-red-400';
  if (status === 'near_limit') return 'bg-yellow-500/20 text-yellow-400';
  return 'bg-gray-500/20 text-gray-400';
};

const statusLabel = (status: string) => {
  if (status === 'active') return 'نشط';
  if (status === 'expired') return 'منتهي';
  if (status === 'near_limit') return 'قريب من الحد';
  return status;
};

export default function SubscriptionCapacity({ data }: SubscriptionCapacityProps) {
  const barColor =
    data.usage_percentage > 90
      ? 'bg-red-500'
      : data.usage_percentage > 70
        ? 'bg-yellow-500'
        : 'bg-green-500';

  const daysUntilRenewal = data.renewal_date
    ? Math.max(0, Math.ceil((new Date(data.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <DashboardCard title="الاشتراك والسعة" icon="credit-card" className="mb-6">
      <div className="space-y-5">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-white text-lg font-bold">{data.plan_name}</h3>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusBadge(data.status)}`}>
            {statusLabel(data.status)}
          </span>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300 text-sm">الاستخدام</span>
            <span className="text-white font-bold text-sm">
              {data.used_slots} / {data.student_limit ?? '∞'} طالب
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-4">
            <div
              className={`${barColor} h-4 rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(data.usage_percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-gray-500 text-xs">{data.usage_percentage}% مستخدم</span>
            <span className="text-gray-500 text-xs">متبقي {data.remaining_capacity} مقعد</span>
          </div>
        </div>

        {data.renewal_date && (
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
            <Icon name="calendar" className="text-primary" />
            <div>
              <span className="text-gray-400 text-xs block">تاريخ التجديد</span>
              <span className="text-white font-semibold text-sm">
                {new Date(data.renewal_date).toLocaleDateString('ar-EG')}
              </span>
            </div>
            {daysUntilRenewal !== null && (
              <div className="mr-auto">
                <span className="text-gray-400 text-xs block">متبقي</span>
                <span className="text-white font-semibold text-sm">{daysUntilRenewal} يوم</span>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
