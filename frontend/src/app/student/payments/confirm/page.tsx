'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  confirmPayment,
  getStudentPendingPayments,
} from '@/services/paymentService';

export default function PaymentConfirmPage() {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<
    Array<{
      id: string;
      amount: number;
      teacher_name: string;
      created_at: string;
      expires_at: string;
      days_until_expiration: number;
    }>
  >([]);
  const [confirmationResult, setConfirmationResult] = useState<{
    message: string;
    amount: number;
    teacher_name: string;
    subscription_end: string;
    days_left: number;
  } | null>(null);

  // Fetch pending payments
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const payments = await getStudentPendingPayments();
        setPendingPayments(payments);
      } catch {
        // Ignore errors
      }
    };
    fetchPending();
  }, []);

  // Format code as user types (XXXX-XXXX)
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length > 4) {
      value = value.slice(0, 4) + '-' + value.slice(4, 8);
    }
    setCode(value);
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length !== 9) {
      toast.error('أدخل كود صحيح (XXXX-XXXX)');
      return;
    }

    setIsLoading(true);
    try {
      const result = await confirmPayment(code);
      setConfirmationResult(result);
      toast.success('تم تأكيد الدفع بنجاح!');
      setCode('');
      // Refresh pending
      const payments = await getStudentPendingPayments();
      setPendingPayments(payments);
    } catch (error: any) {
      if (error.status === 429) {
        toast.error('تم تجاوز عدد المحاولات. حاول لاحقاً.');
      } else {
        toast.error(error.message || 'كود غير صحيح');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout
      role="student"
      user={{
        name: user?.name || 'الطالب',
        avatar: user?.avatar || '',
      }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Success Message */}
        {confirmationResult && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 mb-6 text-center">
            <i className="fas fa-check-circle text-5xl text-green-400 mb-4"></i>
            <h2 className="text-2xl font-bold text-white mb-2">
              تم تأكيد الدفع بنجاح!
            </h2>
            <p className="text-gray-400 mb-4">
              تم تفعيل اشتراكك مع {confirmationResult.teacher_name}
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-sm">المبلغ</p>
                <p className="text-xl font-bold text-primary">
                  {confirmationResult.amount} ج.م
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-sm">ينتهي في</p>
                <p className="text-xl font-bold text-white">
                  {confirmationResult.days_left} يوم
                </p>
              </div>
            </div>
            <button
              onClick={() => setConfirmationResult(null)}
              className="mt-4 text-primary hover:underline"
            >
              تأكيد دفعة أخرى
            </button>
          </div>
        )}

        {/* Confirmation Form */}
        {!confirmationResult && (
          <DashboardCard title="تأكيد الدفع" icon="fas fa-receipt">
            <div className="text-center mb-6">
              <p className="text-gray-400">
                أدخل الكود الذي استلمته من المدرس/السكرتير لتأكيد الدفع
              </p>
            </div>

            <form onSubmit={handleSubmit} className="max-w-sm mx-auto">
              {/* Code Input */}
              <div className="mb-6">
                <input
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="XXXX-XXXX"
                  maxLength={9}
                  className="w-full p-4 bg-white/5 border-2 border-white/10 rounded-xl text-white text-3xl text-center font-mono tracking-widest focus:border-primary outline-none transition-colors"
                  dir="ltr"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || code.length !== 9}
                className="w-full py-4 bg-primary text-white rounded-xl text-lg font-medium hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span>
                    <i className="fas fa-spinner fa-spin ml-2"></i>
                    جاري التحقق...
                  </span>
                ) : (
                  <span>
                    <i className="fas fa-check ml-2"></i>
                    تأكيد الدفع
                  </span>
                )}
              </button>

              {/* Note */}
              <p className="text-center text-gray-500 text-sm mt-4">
                <i className="fas fa-info-circle ml-1"></i>
                الكود صالح لمدة 7 أيام من تاريخ الإصدار
              </p>
            </form>
          </DashboardCard>
        )}

        {/* Pending Payments Info */}
        {pendingPayments.length > 0 && !confirmationResult && (
          <DashboardCard
            title="دفعات في انتظار التأكيد"
            icon="fas fa-clock"
          >
            <div className="space-y-3">
              {pendingPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex justify-between items-center p-4 bg-white/5 rounded-lg"
                >
                  <div>
                    <p className="text-white font-medium">{payment.teacher_name}</p>
                    <p className="text-gray-400 text-sm">
                      {new Date(payment.created_at).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-primary font-bold">{payment.amount} ج.م</p>
                    <p className="text-yellow-400 text-xs">
                      متبقي {payment.days_until_expiration} يوم
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>
        )}
      </div>
    </DashboardLayout>
  );
}
