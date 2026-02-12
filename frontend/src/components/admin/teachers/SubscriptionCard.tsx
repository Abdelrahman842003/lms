'use client';

import React from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface SubscriptionCardProps {
  teacher: {
    plan_type: 'trial' | 'term' | 'custom' | null;
    plan_expires_at?: string;
    plan_max_students?: number;
    is_unlimited_students: boolean;
    students_count: number;
  };
}

export function SubscriptionCard({ teacher }: SubscriptionCardProps) {
  const getPlanTypeLabel = (type: string | null) => {
    switch (type) {
      case 'trial':
        return { label: 'تجريبي', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
      case 'term':
        return { label: 'مدة ثابتة', color: 'bg-green-500/10 text-green-400 border-green-500/20' };
      case 'custom':
        return { label: 'مخصصة', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
      default:
        return { label: 'غير محدد', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
    }
  };

  const planInfo = getPlanTypeLabel(teacher.plan_type);
  
  const isExpired = teacher.plan_expires_at && new Date(teacher.plan_expires_at) < new Date();
  const statusLabel = isExpired ? 'منتهي' : teacher.plan_type === 'trial' ? 'تجريبي' : 'فعال';
  const statusColor = isExpired 
    ? 'bg-red-500/10 text-red-400 border-red-500/20' 
    : 'bg-green-500/10 text-green-400 border-green-500/20';

  const remainingTime = teacher.plan_expires_at 
    ? formatDistanceToNow(new Date(teacher.plan_expires_at), { addSuffix: false, locale: ar })
    : null;

  // Calculate student progress
  const studentProgress = teacher.plan_max_students && !teacher.is_unlimited_students
    ? (teacher.students_count / teacher.plan_max_students) * 100
    : 0;

  const isNearLimit = studentProgress >= 80 && studentProgress < 100;
  const isOverLimit = studentProgress >= 100;

  return (
    <DashboardCard title="الباقة والاشتراك" icon="fas fa-id-card" className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
        {/* Plan Type */}
        <div className="bg-[#151521] rounded-xl p-4 border border-white/5">
          <p className="text-gray-400 text-sm mb-2">نوع الباقة</p>
          <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium border ${planInfo.color}`}>
            {planInfo.label}
          </span>
        </div>

        {/* Status */}
        <div className="bg-[#151521] rounded-xl p-4 border border-white/5">
          <p className="text-gray-400 text-sm mb-2">الحالة</p>
          <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium border ${statusColor}`}>
            {statusLabel}
          </span>
        </div>

        {/* Expiration Date */}
        <div className="bg-[#151521] rounded-xl p-4 border border-white/5">
          <p className="text-gray-400 text-sm mb-2">تاريخ الانتهاء</p>
          <p className="text-white font-medium">
            {teacher.plan_expires_at 
              ? new Date(teacher.plan_expires_at).toLocaleDateString('ar-EG')
              : 'غير محدد'
            }
          </p>
          {remainingTime && (
            <p className={`text-sm mt-1 ${isExpired ? 'text-red-400' : 'text-primary'}`}>
              {isExpired ? 'انتهى منذ ' : 'متبقي '}{remainingTime}
            </p>
          )}
        </div>

        {/* Student Count */}
        <div className="bg-[#151521] rounded-xl p-4 border border-white/5">
          <p className="text-gray-400 text-sm mb-2">الطلاب</p>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-xl">{teacher.students_count}</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-300">
              {teacher.is_unlimited_students ? 'لا نهائي' : teacher.plan_max_students || '-'}
            </span>
          </div>
          {teacher.plan_max_students && !teacher.is_unlimited_students && (
            <div className="mt-2">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-orange-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(studentProgress, 100)}%` }}
                />
              </div>
              {isOverLimit && (
                <p className="text-red-400 text-xs mt-1">⚠️ تجاوز الحد المسموح!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardCard>
  );
}
