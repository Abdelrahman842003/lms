'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { withAdminAuth } from '@/components/auth/withAdminAuth';
import { toast } from 'react-hot-toast';
import * as platformPaymentService from '@/services/platformPaymentService';


function PlatformPaymentsPage() {
  const [confirmedPayments, setConfirmedPayments] = useState<any[]>([]);
  const [isConfirmedLoading, setIsConfirmedLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);


  const fetchConfirmedPayments = async () => {
    setIsConfirmedLoading(true);
    try {
      const response = await platformPaymentService.getPlatformPayments(1, 50, { status: 'paid' });
      setConfirmedPayments(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch confirmed payments:', error);
    } finally {
      setIsConfirmedLoading(false);
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
    fetchConfirmedPayments();
    fetchStats();
  }, []);


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
            <DashboardCard title="تم تأكيده هذا الشهر" icon="fas fa-check-circle">
              <div className="text-3xl font-bold text-success mb-2">{stats.confirmed_this_month || 0}</div>
              <div className="text-sm text-gray-400">{stats.confirmed_amount_this_month || 0} ج.م</div>
            </DashboardCard>
          </div>
        )}


        {/* Confirmed Payments Table */}
        <DashboardCard title="المدفوعات المؤكدة" icon="fas fa-check-double">
          <DataTable
            columns={[
              { key: 'payment_key', label: 'كود الدفع' },
              { key: 'entity_name', label: 'الجهة' },
              { key: 'month_name', label: 'الشهر' },
              { key: 'year', label: 'السنة' },
              { 
                key: 'total_cost', 
                label: 'المبلغ',
                render: (value: number) => `${value} ج.م`
              },
              { 
                key: 'paid_at', 
                label: 'تاريخ الدفع',
                render: (value: string) => value ? new Date(value).toLocaleDateString('ar-EG') : '-'
              },
              {
                key: 'status',
                label: 'الحالة',
                render: (value: string) => (
                  <span className="badge badge-success">
                    مدفوع
                  </span>
                ),
              },
            ]}
            data={confirmedPayments}
            isLoading={isConfirmedLoading}
          />
        </DashboardCard>

      </div>
    </DashboardLayout>
  );
}

export default withAdminAuth(PlatformPaymentsPage);
