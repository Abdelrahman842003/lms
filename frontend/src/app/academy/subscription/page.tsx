'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { withAcademyAuth } from '@/components/auth/withAcademyAuth';

// Mock data - will be replaced with real API call
const mockSubscription = {
  status: 'active',
  is_trial: false,
  seats_purchased: 200,
  seats_used: 180,
  starts_at: '2026-01-15',
  ends_at: '2027-01-15',
  plan_name: 'باقة سنة',
  price_per_seat: 18,
  total_paid: 3600,
};

function SubscriptionPage() {
  const { user } = useAuth();

  const getDaysRemaining = () => {
    const today = new Date();
    const endDate = new Date(mockSubscription.ends_at);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getSeatsPercentage = () => {
    return Math.round((mockSubscription.seats_used / mockSubscription.seats_purchased) * 100);
  };

  const daysRemaining = getDaysRemaining();
  const seatsPercentage = getSeatsPercentage();

  const getStatusColor = () => {
    if (mockSubscription.is_trial) return 'blue';
    if (daysRemaining < 7) return 'red';
    if (daysRemaining < 30) return 'warning';
    return 'green';
  };

  const getSeatsColor = () => {
    if (seatsPercentage >= 90) return 'red';
    if (seatsPercentage >= 70) return 'warning';
    return 'primary';
  };

  const statusColor = getStatusColor();
  const seatsColor = getSeatsColor();

  return (
    <DashboardLayout role="academy" user={user || undefined}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <i className="fas fa-id-card text-primary"></i>
            اشتراك الأكاديمية
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-xl border ${
            mockSubscription.is_trial 
              ? 'bg-blue-500/10 border-blue-500/20' 
              : mockSubscription.status === 'active'
                ? 'bg-green-500/10 border-green-500/20'
                : 'bg-red-500/10 border-red-500/20'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${
                mockSubscription.is_trial ? 'text-blue-400' : mockSubscription.status === 'active' ? 'text-green-400' : 'text-red-400'
              }`}>حالة الاشتراك</span>
              <i className={`fas ${
                mockSubscription.is_trial ? 'fa-flask' : mockSubscription.status === 'active' ? 'fa-check-circle' : 'fa-times-circle'
              } ${
                mockSubscription.is_trial ? 'text-blue-400' : mockSubscription.status === 'active' ? 'text-green-400' : 'text-red-400'
              }`}></i>
            </div>
            <div className={`text-2xl font-bold ${
              mockSubscription.is_trial ? 'text-blue-400' : mockSubscription.status === 'active' ? 'text-green-400' : 'text-red-400'
            }`}>
              {mockSubscription.is_trial ? 'تجريبي' : mockSubscription.status === 'active' ? 'نشط' : 'منتهي'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-400">الأيام المتبقية</span>
              <i className="fas fa-clock text-purple-400"></i>
            </div>
            <div className="text-2xl font-bold text-purple-400">{daysRemaining} يوم</div>
          </div>

          <div className={`p-4 rounded-xl border ${
             seatsPercentage >= 90 ? 'bg-red-500/10 border-red-500/20' : 'bg-primary/10 border-primary/20'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${seatsPercentage >= 90 ? 'text-red-400' : 'text-primary'}`}>استهلاك الكراسي</span>
              <i className={`fas fa-chair ${seatsPercentage >= 90 ? 'text-red-400' : 'text-primary'}`}></i>
            </div>
            <div className={`text-2xl font-bold ${seatsPercentage >= 90 ? 'text-red-400' : 'text-primary'}`}>
              {seatsPercentage}%
            </div>
          </div>
        </div>

        {/* Status Alert */}
        {mockSubscription.is_trial && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
            <i className="fas fa-flask text-blue-400 text-xl mt-1"></i>
            <div className="flex-1">
              <h3 className="text-blue-400 font-bold mb-1">أنتم في الفترة التجريبية</h3>
              <p className="text-gray-300 text-sm">
                يمكنكم إضافة عدد غير محدود من الطلاب حتى {new Date(mockSubscription.ends_at).toLocaleDateString('ar-EG')}
              </p>
            </div>
          </div>
        )}

        {daysRemaining < 30 && !mockSubscription.is_trial && (
          <div className={`bg-${statusColor}-500/10 border border-${statusColor}-500/20 rounded-xl p-4 flex items-start gap-3`}>
            <i className={`fas fa-exclamation-triangle text-${statusColor}-400 text-xl mt-1`}></i>
            <div className="flex-1">
              <h3 className={`text-${statusColor}-400 font-bold mb-1`}>
                {daysRemaining < 7 ? 'اشتراككم على وشك الانتهاء!' : 'تنبيه: اقتراب انتهاء الاشتراك'}
              </h3>
              <p className="text-gray-300 text-sm">
                متبقي {daysRemaining} يوم على انتهاء اشتراككم. يرجى التجديد قريباً.
              </p>
            </div>
          </div>
        )}

        {/* Subscription Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Info Card */}
          <DashboardCard title="تفاصيل الاشتراك" icon="fas fa-info-circle">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400">الباقة</span>
                <span className="text-white font-bold">{mockSubscription.plan_name}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400">تاريخ البداية</span>
                <span className="text-white font-bold">
                  {new Date(mockSubscription.starts_at).toLocaleDateString('ar-EG')}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400">تاريخ الانتهاء</span>
                <span className="text-white font-bold">
                  {new Date(mockSubscription.ends_at).toLocaleDateString('ar-EG')}
                </span>
              </div>
            </div>
          </DashboardCard>

          {/* Seats Card */}
          <DashboardCard title="الكراسي المتاحة" icon="fas fa-chair">
            <div className="space-y-6">
              {/* Seats Progress */}
              <div className="text-center">
                <div className="relative inline-block">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-white/10"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - seatsPercentage / 100)}`}
                      className={`text-${seatsColor} transition-all duration-1000`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white">{seatsPercentage}%</span>
                    <span className="text-xs text-gray-400">مستخدم</span>
                  </div>
                </div>
              </div>

              {/* Seats Details */}
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400">إجمالي الكراسي</span>
                  <span className="text-white font-bold text-xl">
                    {mockSubscription.is_trial ? '∞' : mockSubscription.seats_purchased}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400">الكراسي المستخدمة</span>
                  <span className="text-primary font-bold text-xl">{mockSubscription.seats_used}</span>
                </div>
              </div>

              {/* Warning if low seats */}
              {!mockSubscription.is_trial && seatsPercentage >= 70 && (
                <div className={`bg-${seatsColor}-500/10 border border-${seatsColor}-500/20 rounded-lg p-3 text-center`}>
                  <i className={`fas fa-exclamation-circle text-${seatsColor}-400 mr-2`}></i>
                  <span className={`text-${seatsColor}-400 text-sm`}>
                    {seatsPercentage >= 90 ? 'الكراسي على وشك النفاد!' : 'اقتراب نفاد الكراسي'}
                  </span>
                </div>
              )}
            </div>
          </DashboardCard>
        </div>

        {/* Payment Info */}
        {!mockSubscription.is_trial && (
          <DashboardCard title="معلومات الدفع" icon="fas fa-money-bill-wave">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white/5 rounded-lg text-center">
                <p className="text-gray-400 text-sm mb-2">سعر الكرسي</p>
                <p className="text-2xl font-bold text-white">{mockSubscription.price_per_seat} ج.م</p>
              </div>

              <div className="p-4 bg-white/5 rounded-lg text-center">
                <p className="text-gray-400 text-sm mb-2">عدد الكراسي</p>
                <p className="text-2xl font-bold text-white">{mockSubscription.seats_purchased}</p>
              </div>

              <div className="p-4 bg-primary/10 rounded-lg text-center border border-primary/20">
                <p className="text-gray-400 text-sm mb-2">المبلغ المدفوع</p>
                <p className="text-2xl font-bold text-primary">{mockSubscription.total_paid} ج.م</p>
              </div>
            </div>
          </DashboardCard>
        )}

        {/* Info Note */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
          <i className="fas fa-info-circle text-blue-400 text-xl mt-1"></i>
          <div className="flex-1">
            <h3 className="text-blue-400 font-bold mb-1">ملاحظة</h3>
            <p className="text-gray-300 text-sm">
              الكراسي المشتراة تُستخدم لجميع المدرسين في الأكاديمية. عند إضافة طالب لأي مدرس، سيتم استهلاك كرسي من إجمالي كراسي الأكاديمية.
            </p>
          </div>
        </div>

        {/* Renew Button */}
        <div className="flex justify-center">
          <button className="px-8 py-4 bg-primary hover:bg-primary/80 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/20 transition-all flex items-center gap-3">
            <i className="fas fa-sync"></i>
            تجديد الاشتراك
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAcademyAuth(SubscriptionPage);
