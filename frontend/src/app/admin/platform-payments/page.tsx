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
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    month: 0,
    year: new Date().getFullYear(),
  });

  const fetchPayments = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await platformPaymentService.getPlatformPayments(page, 15, {
        search: filters.search,
        month: filters.month > 0 ? filters.month : undefined,
        year: filters.year,
      });
      setPayments(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        total: response.data.total,
      });
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
      fetchPayments(pagination.current_page);
      fetchStats();
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      toast.error('فشل تأكيد الدفع');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments(1);
  };

  return (
    <DashboardLayout role="admin">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">مدفوعات المنصة (InstaPay)</h1>
          <p className="text-gray-400">إدارة وتأكيد مدفوعات الأكاديميات عبر InstaPay</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <DashboardCard title="طلبات معلقة" icon="fas fa-clock">
              <div className="text-2xl font-bold text-warning">{stats.pending_count}</div>
              <div className="text-sm text-gray-400">{stats.pending_amount} ج.م</div>
            </DashboardCard>
            <DashboardCard title="تم تأكيده هذا الشهر" icon="fas fa-check-circle">
              <div className="text-2xl font-bold text-success">{stats.confirmed_this_month}</div>
              <div className="text-sm text-gray-400">{stats.confirmed_amount_this_month} ج.م</div>
            </DashboardCard>
          </div>
        )}

        {/* Filters */}
        <DashboardCard className="mb-6">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="بحث بكود الدفع أو اسم الأكاديمية..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary"
            />
            <select
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
              className="p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary"
            >
              <option value="0">كل الشهور</option>
              <option value="1">يناير</option>
              <option value="2">فبراير</option>
              <option value="3">مارس</option>
              <option value="4">أبريل</option>
              <option value="5">مايو</option>
              <option value="6">يونيو</option>
              <option value="7">يوليو</option>
              <option value="8">أغسطس</option>
              <option value="9">سبتمبر</option>
              <option value="10">أكتوبر</option>
              <option value="11">نوفمبر</option>
              <option value="12">ديسمبر</option>
            </select>
            <input
              type="number"
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
              className="p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary"
            />
            <button type="submit" className="btn btn-primary">
              <i className="fas fa-search ml-2"></i>
              بحث
            </button>
          </form>
        </DashboardCard>

        {/* Payments Table */}
        <DashboardCard title="قائمة المدفوعات">
          <DataTable
            columns={[
              { key: 'payment_key', label: 'كود الدفع' },
              { key: 'academy_name', label: 'الأكاديمية' },
              { key: 'month_name', label: 'الشهر' },
              { key: 'year', label: 'السنة' },
              { key: 'total_cost', label: 'المبلغ', render: (val: number) => `${val} ج.م` },
              { key: 'payment_initiated_at', label: 'تاريخ الطلب' },
              {
                key: 'status',
                label: 'الحالة',
                render: (val: string) => (
                  <span className={`badge ${val === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                    {val === 'paid' ? 'مدفوع' : 'معلق'}
                  </span>
                ),
              },
              {
                key: 'actions',
                label: 'إجراءات',
                render: (_: any, row: any) => (
                  row.status === 'pending' && (
                    <button
                      onClick={() => handleConfirm(row.id)}
                      className="btn btn-sm btn-success"
                      title="تأكيد الدفع"
                    >
                      <i className="fas fa-check"></i> تأكيد
                    </button>
                  )
                ),
              },
            ]}
            data={payments}
            isLoading={isLoading}
            pagination
            currentPage={pagination.current_page}
            totalPages={pagination.last_page}
            onPageChange={fetchPayments}
          />
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
}

export default withAdminAuth(PlatformPaymentsPage);
