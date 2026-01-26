'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { withAdminAuth } from '@/components/auth/withAdminAuth';
import { toast } from 'react-hot-toast';
import * as platformPaymentService from '@/services/platformPaymentService';

import ConfirmationModal from '@/components/ui/ConfirmationModal';

function PlatformPaymentsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [confirmedPayments, setConfirmedPayments] = useState<any[]>([]);
  const [isConfirmedLoading, setIsConfirmedLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState<'academy' | 'teacher'>('academy');
  const [isConfirming, setIsConfirming] = useState(false);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const response = await platformPaymentService.getPlatformPayments(1, 50, { status: 'pending' });
      setPayments(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      toast.error('فشل تحميل المدفوعات');
    } finally {
      setIsLoading(false);
    }
  };

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
    fetchPayments();
    fetchConfirmedPayments();
    fetchStats();
  }, []);

  const openConfirmModal = (id: string, type: 'academy' | 'teacher') => {
    setSelectedPaymentId(id);
    setSelectedPaymentType(type);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPaymentId) return;

    setIsConfirming(true);
    try {
      await platformPaymentService.confirmPlatformPayment(selectedPaymentId, selectedPaymentType);
      toast.success('تم تأكيد الدفع بنجاح');
      fetchPayments();
      fetchConfirmedPayments();
      fetchStats();
      setIsConfirmModalOpen(false);
      setSelectedPaymentId(null);
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      toast.error('فشل تأكيد الدفع');
    } finally {
      setIsConfirming(false);
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
        <DashboardCard title="طلبات معلقة" icon="fas fa-clock" className="mb-6">
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
                      onClick={() => openConfirmModal(row.id, row.type)}
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

        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          title="تأكيد الدفع"
          message="هل أنت متأكد من تأكيد هذا الدفع؟ لا يمكن التراجع عن هذا الإجراء."
          confirmText="تأكيد الدفع"
          cancelText="إلغاء"
          onConfirm={handleConfirmPayment}
          onCancel={() => setIsConfirmModalOpen(false)}
          isProcessing={isConfirming}
          variant="success"
        />
      </div>
    </DashboardLayout>
  );
}

export default withAdminAuth(PlatformPaymentsPage);
