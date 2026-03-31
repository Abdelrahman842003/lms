'use client';

import React from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { Icon, LoadingSpinner, Badge } from '@/components/ui';
import type { SubscriptionUsage as SubscriptionUsageType } from '@/types/academyReport.types';

interface SubscriptionUsageCardProps {
  data: SubscriptionUsageType | null;
  loading?: boolean;
}

export default function SubscriptionUsageCard({ data, loading }: SubscriptionUsageCardProps) {
  if (loading) {
    return (
      <DashboardCard title="استخدام الاشتراك" icon="credit-card" className="mb-6">
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" color="primary" />
        </div>
      </DashboardCard>
    );
  }

  if (!data) return null;

  const usageColor = data.usage_percentage > 90 ? 'bg-red-500' :
    data.usage_percentage > 70 ? 'bg-yellow-500' : 'bg-green-500';

  const statusLabel = (status: string) => {
    switch (status) {
      case 'active': return { text: 'نشط', variant: 'success' as const };
      case 'pending': return { text: 'معلق', variant: 'warning' as const };
      case 'paid': return { text: 'مدفوع', variant: 'success' as const };
      case 'free': return { text: 'مجاني', variant: 'default' as const };
      default: return { text: status, variant: 'default' as const };
    }
  };

  const status = statusLabel(data.subscription_status);

  return (
    <DashboardCard title="استخدام الاشتراك" icon="credit-card" className="mb-6">
      <div className="space-y-5">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-white text-lg font-bold">{data.plan_name}</h3>
            <span className="text-gray-400 text-sm">{data.plan_price.toLocaleString()} ج.م</span>
          </div>
          <Badge variant={status.variant}>{status.text}</Badge>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300 text-sm">الاستخدام</span>
            <span className="text-white font-bold text-sm">
              {data.used_slots} / {data.student_limit === -1 ? '∞' : data.student_limit} طالب
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-4">
            <div
              className={`${usageColor} h-4 rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(data.usage_percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-gray-500 text-xs">{data.usage_percentage}% مستخدم</span>
            {data.student_limit > 0 && (
              <span className="text-gray-500 text-xs">
                متبقي {data.student_limit - data.used_slots} مقعد
              </span>
            )}
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
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
