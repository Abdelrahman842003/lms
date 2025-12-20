'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  getPayments,
  getPaymentStatistics,
  cancelPayment,
  PaymentLog,
  PaymentStatistics,
} from '@/services/paymentService';

// Components
import NewPaymentModal from '@/components/payments/NewPaymentModal';
import PaymentCodeDisplay from '@/components/payments/PaymentCodeDisplay';

type PaymentStatus = 'all' | 'pending' | 'confirmed' | 'expired' | 'cancelled';

export default function StudentPaymentsPage() {
  const { user } = useAuth();

  // State
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [statistics, setStatistics] = useState<PaymentStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showNewPaymentModal, setShowNewPaymentModal] = useState(false);
  const [showCodeDisplay, setShowCodeDisplay] = useState(false);
  const [createdPaymentCode, setCreatedPaymentCode] = useState('');
  const [createdPaymentAmount, setCreatedPaymentAmount] = useState(0);
  const [createdStudentName, setCreatedStudentName] = useState('');

  // Fetch data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [paymentsRes, statsRes] = await Promise.all([
        getPayments({
          status: statusFilter === 'all' ? undefined : statusFilter,
          search: searchQuery || undefined,
        }),
        getPaymentStatistics(),
      ]);

      setPayments(paymentsRes.payments);
      setStatistics(statsRes);
    } catch (error) {
      toast.error('فشل في تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  // Handle payment created
  const handlePaymentCreated = (code: string, amount: number, studentName: string) => {
    setCreatedPaymentCode(code);
    setCreatedPaymentAmount(amount);
    setCreatedStudentName(studentName);
    setShowNewPaymentModal(false);
    setShowCodeDisplay(true);
    fetchData();
  };

  // Handle cancel payment
  const handleCancelPayment = async (paymentId: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذه الدفعة؟')) return;

    try {
      await cancelPayment(paymentId);
      toast.success('تم إلغاء الدفعة');
      fetchData();
    } catch {
      toast.error('فشل في إلغاء الدفعة');
    }
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      pending: { label: 'في الانتظار', className: 'bg-yellow-500/20 text-yellow-400' },
      confirmed: { label: 'مؤكد', className: 'bg-green-500/20 text-green-400' },
      expired: { label: 'منتهي', className: 'bg-red-500/20 text-red-400' },
      cancelled: { label: 'ملغي', className: 'bg-gray-500/20 text-gray-400' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={{
        name: user?.name || 'المدرس',
        avatar: user?.avatar || '',
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">إدارة مدفوعات الطلاب</h1>
        <button
          onClick={() => setShowNewPaymentModal(true)}
          className="btn btn-primary"
        >
          <i className="fas fa-plus ml-2"></i>
          تسجيل دفعة جديدة
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-6">
        <StatCard
          title="إجمالي المدفوعات"
          value={statistics?.total || 0}
          icon="fas fa-receipt"
          color="primary"
        />
        <StatCard
          title="في انتظار التأكيد"
          value={statistics?.pending || 0}
          icon="fas fa-clock"
          color="warning"
        />
        <StatCard
          title="مؤكدة"
          value={statistics?.confirmed || 0}
          icon="fas fa-check-circle"
          color="secondary"
        />
        <StatCard
          title="إجمالي المبالغ المؤكدة"
          value={`${statistics?.total_amount || 0} ج.م`}
          icon="fas fa-coins"
          color="primary"
        />
      </div>

      {/* Filters */}
      <DashboardCard title="المدفوعات" icon="fas fa-list">
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Status Filter */}
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'الكل' },
              { value: 'pending', label: 'في الانتظار' },
              { value: 'confirmed', label: 'مؤكدة' },
              { value: 'expired', label: 'منتهية' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value as PaymentStatus)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  statusFilter === filter.value
                    ? 'bg-primary text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="بحث بالاسم أو الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary outline-none"
            />
            <button type="submit" className="btn btn-primary">
              <i className="fas fa-search"></i>
            </button>
          </form>
        </div>

        {/* Payments Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <i className="fas fa-inbox text-5xl opacity-30 mb-4"></i>
            <p>لا توجد مدفوعات</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">الطالب</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">المبلغ</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">الكود</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">الحالة</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">التاريخ</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-white font-medium">{payment.student?.name}</p>
                        <p className="text-gray-400 text-sm">{payment.student?.phone}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-white font-medium">
                      {payment.amount} ج.م
                    </td>
                    <td className="py-4 px-4">
                      <code className="bg-white/10 px-2 py-1 rounded text-primary font-mono">
                        {payment.confirmation_code}
                      </code>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-sm">
                      {new Date(payment.created_at).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {payment.status === 'pending' && (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setCreatedPaymentCode(payment.confirmation_code);
                              setCreatedPaymentAmount(payment.amount);
                              setCreatedStudentName(payment.student?.name || '');
                              setShowCodeDisplay(true);
                            }}
                            className="text-primary hover:text-primary/80"
                            title="عرض الكود"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            onClick={() => handleCancelPayment(payment.id)}
                            className="text-red-400 hover:text-red-300"
                            title="إلغاء"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>

      {/* New Payment Modal */}
      {showNewPaymentModal && (
        <NewPaymentModal
          onClose={() => setShowNewPaymentModal(false)}
          onSuccess={handlePaymentCreated}
        />
      )}

      {/* Code Display Modal */}
      {showCodeDisplay && (
        <PaymentCodeDisplay
          code={createdPaymentCode}
          amount={createdPaymentAmount}
          studentName={createdStudentName}
          onClose={() => setShowCodeDisplay(false)}
        />
      )}
    </DashboardLayout>
  );
}
