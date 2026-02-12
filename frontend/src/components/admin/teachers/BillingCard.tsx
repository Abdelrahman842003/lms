'use client';

import React from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useRouter } from 'next/navigation';

interface BillingCardProps {
  teacher: {
    id: string;
    subscription_fee: number;
    paid_amount: number;
    students_count: number;
    is_unlimited_students: boolean;
  };
}

export function BillingCard({ teacher }: BillingCardProps) {
  const router = useRouter();

  // Calculate amounts
  const pricePerStudent = teacher.subscription_fee || 100; // Default 100 EGP
  const amountDue = teacher.is_unlimited_students 
    ? pricePerStudent 
    : (teacher.students_count * pricePerStudent);
  const amountPaid = teacher.paid_amount || 0;
  const remaining = Math.max(0, amountDue - amountPaid);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const hasOverdue = remaining > 0;

  return (
    <DashboardCard title="الفوترة والمدفوعات" icon="fas fa-file-invoice-dollar" className="mb-6">
      <div className="p-4">
        {/* Amount Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Amount Due */}
          <div className={`rounded-xl p-4 border ${
            hasOverdue 
              ? 'bg-red-500/5 border-red-500/20' 
              : 'bg-[#151521] border-white/5'
          }`}>
            <p className="text-gray-400 text-sm mb-2">المبلغ المستحق</p>
            <p className={`text-2xl font-bold ${hasOverdue ? 'text-red-400' : 'text-white'}`}>
              {formatCurrency(amountDue)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {teacher.is_unlimited_students 
                ? 'باقة شاملة' 
                : `${teacher.students_count} طالب × ${formatCurrency(pricePerStudent)}`
              }
            </p>
          </div>

          {/* Amount Paid */}
          <div className="bg-[#151521] rounded-xl p-4 border border-white/5">
            <p className="text-gray-400 text-sm mb-2">المبلغ المدفوع</p>
            <p className="text-2xl font-bold text-green-400">
              {formatCurrency(amountPaid)}
            </p>
          </div>

          {/* Remaining */}
          <div className={`rounded-xl p-4 border ${
            remaining > 0
              ? 'bg-orange-500/5 border-orange-500/20'
              : 'bg-green-500/5 border-green-500/20'
          }`}>
            <p className="text-gray-400 text-sm mb-2">المتبقي</p>
            <p className={`text-2xl font-bold ${
              remaining > 0 ? 'text-orange-400' : 'text-green-400'
            }`}>
              {formatCurrency(remaining)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.push(`/admin/subscriptions?teacher_id=${teacher.id}`)}
            className="flex-1 min-w-[200px] bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <i className="fas fa-external-link-alt" />
            <span>إدارة الاشتراك</span>
          </button>
          
          <button
            onClick={() => router.push(`/admin/subscriptions?teacher_id=${teacher.id}&action=invoice`)}
            className="flex-1 min-w-[200px] bg-[#151521] hover:bg-[#1e1e2d] border border-white/10 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <i className="fas fa-file-invoice" />
            <span>عرض الفواتير</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-gray-400 text-xs">السعر لكل طالب</p>
            <p className="text-white font-medium">{formatCurrency(pricePerStudent)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">عدد الطلاب</p>
            <p className="text-white font-medium">{teacher.students_count}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">نسبة الدفع</p>
            <p className={`font-medium ${amountPaid >= amountDue ? 'text-green-400' : 'text-orange-400'}`}>
              {amountDue > 0 ? Math.round((amountPaid / amountDue) * 100) : 0}%
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">نوع الباقة</p>
            <p className="text-white font-medium">
              {teacher.is_unlimited_students ? 'شاملة' : 'حسب الطالب'}
            </p>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}
