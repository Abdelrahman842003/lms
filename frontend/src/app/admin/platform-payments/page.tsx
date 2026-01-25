'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { withAdminAuth } from '@/components/auth/withAdminAuth';
import { toast } from 'react-hot-toast';
import * as platformPaymentService from '@/services/platformPaymentService';

function PlatformPaymentsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const response = await platformPaymentService.getPlatformPayments(1, 50);
      setPayments(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      toast.error('فشل تحميل المدفوعات');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await platformPaymentService.getPlatformPaymentStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, []);

  const handleConfirm = async (id: string) => {
    if (!confirm('هل أنت متأكد من تأكيد هذا الدفع؟')) return;

    try {
      await platformPaymentService.confirmPlatformPayment(id);
      toast.success('تم تأكيد الدفع بنجاح');
      fetchPayments();
      fetchStats();
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      toast.error('فشل تأكيد الدفع');
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            <i className="fas fa-money-check-alt text-primary ml-2"></i>
            طلبات الدفع
          </h1>
          <p className="text-gray-400">إدارة وتأكيد طلبات الدفع من الأكاديميات عبر InstaPay</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <DashboardCard title="طلبات معلقة" icon="fas fa-clock">
              <div className="text-3xl font-bold text-warning mb-2">{stats.pending_count || 0}</div>
              <div className="text-sm text-gray-400">{stats.pending_amount || 0} ج.م</div>
            </DashboardCard>
            <DashboardCard title="تم تأكيده هذا الشهر" icon="fas fa-check-circle">
              <div className="text-3xl font-bold text-success mb-2">{stats.confirmed_this_month || 0}</div>
              <div className="text-sm text-gray-400">{stats.confirmed_amount_this_month || 0} ج.م</div>
            </DashboardCard>
          </div>
        )}

        {/* Payments Table */}
        <DashboardCard title="قائمة المدفوعات" icon="fas fa-list">
          <DataTable
            columns={[
              { key: 'payment_key', label: 'كود الدفع' },
              { key: 'academy_name', label: 'الأكاديمية' },
              { key: 'month_name', label: 'الشهر' },
              { key: 'year', label: 'السنة' },
              { 
                key: 'total_cost', 
                label: 'المبلغ',
                render: (value: number) => `${value} ج.م`
              },
              { 
                key: 'payment_initiated_at', 
                label: 'تاريخ الطلب',
                render: (value: string) => value ? new Date(value).toLocaleDateString('ar-EG') : '-'
              },
              {
                key: 'status',
                label: 'الحالة',
                render: (value: string) => (
                  <span className={`badge ${value === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                    {value === 'paid' ? 'مدفوع' : 'معلق'}
                  </span>
                ),
              },
              {
                key: 'actions',
                label: 'إجراءات',
                render: (_: any, row: any) =>
                  row.status === 'pending' ? (
                    <button
                      onClick={() => handleConfirm(row.id)}
                      className="btn btn-sm btn-success"
                      title="تأكيد الدفع"
                    >
                      <i className="fas fa-check ml-1"></i>
                      تأكيد
                    </button>
                  ) : null,
              },
            ]}
            data={payments}
            isLoading={isLoading}
          />
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
}

export default withAdminAuth(PlatformPaymentsPage);
