'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { withAcademyAuth } from '@/components/auth/withAcademyAuth';
import { Button, Icon } from '@/components/ui';
import SubscriptionRenewalModal from '@/components/subscription/SubscriptionRenewalModal';
import { getAcademySubscription, requestAcademyRenewal } from '@/services/subscriptionService';
import type { SubscriptionRenewalRequest, SubscriptionResponse } from '@/types/subscription.types';

const resolvePlanSelection = (planType?: string, subscriptionPeriod?: string | null): string => {
  if (planType === 'trial') return 'trial';
  if (planType === 'custom') return 'custom';

  if (planType === 'term') {
    if (subscriptionPeriod === 'quarterly') return 'quarterly';
    if (subscriptionPeriod === 'semi_annual') return 'semi_annual';
    if (subscriptionPeriod === 'annual') return 'annual';
    return 'monthly';
  }

  return 'monthly';
};

function SubscriptionPage() {
  const { user } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [renewalOpen, setRenewalOpen] = useState(false);
  const [renewalSubmitting, setRenewalSubmitting] = useState(false);

  const loadSubscription = async () => {
    setLoading(true);
    try {
      const data = await getAcademySubscription();
      setSubscriptionData(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscription();
  }, []);

  const getDaysRemaining = () => {
    const days = subscriptionData?.subscription?.days_remaining ?? null;
    if (days === null || Number.isNaN(days)) return 0;
    return Math.max(0, Math.ceil(days));
  };

  const getSeatsPercentage = () => {
    const used = subscriptionData?.subscription?.seats_used ?? 0;
    const limit = subscriptionData?.subscription?.seats_limit;
    if (!limit || limit <= 0) return 0;
    return Math.round((used / limit) * 100);
  };

  const getStoragePercentage = () => {
    return subscriptionData?.subscription?.storage?.percentage ?? 0;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const daysRemaining = getDaysRemaining();
  const seatsPercentage = getSeatsPercentage();
  const storagePercentage = getStoragePercentage();
  const subscription = subscriptionData?.subscription;
  const storage = subscription?.storage;
  const pendingRequest = subscriptionData?.pending_request;
  const currentPlanSelection = resolvePlanSelection(subscription?.plan_type, subscription?.subscription_period);

  const getStatusColor = () => {
    if (subscription?.is_trial) return 'blue';
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

  const handleRenewalSubmit = async (payload: SubscriptionRenewalRequest) => {
    setRenewalSubmitting(true);
    try {
      await requestAcademyRenewal(payload);
      setRenewalOpen(false);
      await loadSubscription();
    } finally {
      setRenewalSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="academy" user={user || undefined}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Icon name="id-card" className="text-primary" />
            اشتراك الأكاديمية
          </h1>
        </div>

        {loading && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-gray-300">
            جاري تحميل بيانات الاشتراك...
          </div>
        )}

        {pendingRequest && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
            <Icon name="hourglass-half" className="text-yellow-400 text-xl mt-1" />
            <div className="flex-1">
              <h3 className="text-yellow-400 font-bold mb-1">
                {pendingRequest.request_type === 'upgrade' ? 'طلب الترقية قيد المراجعة' : 'طلب التجديد قيد المراجعة'}
              </h3>
              <p className="text-gray-300 text-sm">
                {pendingRequest.request_type === 'upgrade'
                  ? 'تم إرسال طلب الترقية وسيظهر في لوحة الإدارة للموافقة أو الرفض.'
                  : 'تم إرسال طلب التجديد وسيظهر في لوحة الإدارة للموافقة.'}
              </p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-xl border ${
            subscription?.is_trial 
              ? 'bg-blue-500/10 border-blue-500/20' 
              : subscription?.status === 'active'
                ? 'bg-green-500/10 border-green-500/20'
                : 'bg-red-500/10 border-red-500/20'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${
                subscription?.is_trial ? 'text-blue-400' : subscription?.status === 'active' ? 'text-green-400' : 'text-red-400'
              }`}>حالة الاشتراك</span>
              <Icon name={
                subscription?.is_trial ? 'flask' : subscription?.status === 'active' ? 'check-circle' : 'times-circle'
              } className={
                subscription?.is_trial ? 'text-blue-400' : subscription?.status === 'active' ? 'text-green-400' : 'text-red-400'
              } />
            </div>
            <div className={`text-2xl font-bold ${
              subscription?.is_trial ? 'text-blue-400' : subscription?.status === 'active' ? 'text-green-400' : 'text-red-400'
            }`}>
              {subscription?.is_trial ? 'تجريبي' : subscription?.status === 'active' ? 'نشط' : 'منتهي'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-400">الأيام المتبقية</span>
              <Icon name="clock" className="text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-400">{daysRemaining} يوم</div>
          </div>

          <div className={`p-4 rounded-xl border ${
             seatsPercentage >= 90 ? 'bg-red-500/10 border-red-500/20' : 'bg-primary/10 border-primary/20'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${seatsPercentage >= 90 ? 'text-red-400' : 'text-primary'}`}>استهلاك الكراسي</span>
              <Icon name="chair" className={seatsPercentage >= 90 ? 'text-red-400' : 'text-primary'} />
            </div>
            <div className={`text-2xl font-bold ${seatsPercentage >= 90 ? 'text-red-400' : 'text-primary'}`}>
              {seatsPercentage}%
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${
             storagePercentage >= 90 ? 'bg-red-500/10 border-red-500/20' :
             storagePercentage >= 70 ? 'bg-orange-500/10 border-orange-500/20' :
             'bg-teal-500/10 border-teal-500/20'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${
                storagePercentage >= 90 ? 'text-red-400' :
                storagePercentage >= 70 ? 'text-orange-400' : 'text-teal-400'
              }`}>استهلاك التخزين</span>
              <Icon name="hdd" className={
                storagePercentage >= 90 ? 'text-red-400' :
                storagePercentage >= 70 ? 'text-orange-400' : 'text-teal-400'
              } />
            </div>
            <div className={`text-2xl font-bold ${
              storagePercentage >= 90 ? 'text-red-400' :
              storagePercentage >= 70 ? 'text-orange-400' : 'text-teal-400'
            }`}>
              {storage?.is_unlimited ? '∞' : `${storagePercentage}%`}
            </div>
          </div>
        </div>

        {/* Status Alert */}
        {subscription?.is_trial && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
            <Icon name="flask" className="text-blue-400 text-xl mt-1" />
            <div className="flex-1">
              <h3 className="text-blue-400 font-bold mb-1">أنتم في الفترة التجريبية</h3>
              <p className="text-gray-300 text-sm">
                يمكنكم إضافة عدد غير محدود من الطلاب حتى {subscription?.ends_at ? new Date(subscription.ends_at).toLocaleDateString('ar-EG') : 'غير محدد'}
              </p>
            </div>
          </div>
        )}

        {daysRemaining < 30 && !subscription?.is_trial && (
          <div className={`bg-${statusColor}-500/10 border border-${statusColor}-500/20 rounded-xl p-4 flex items-start gap-3`}>
            <Icon name="exclamation-triangle" className={`text-${statusColor}-400 text-xl mt-1`} />
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
          <DashboardCard title="تفاصيل الاشتراك" icon="info-circle">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400">الباقة</span>
                <span className="text-white font-bold">{subscription?.plan_label || 'غير محدد'}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400">تاريخ البداية</span>
                <span className="text-white font-bold">
                  {subscription?.starts_at ? new Date(subscription.starts_at).toLocaleDateString('ar-EG') : 'غير محدد'}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400">تاريخ الانتهاء</span>
                <span className="text-white font-bold">
                  {subscription?.ends_at ? new Date(subscription.ends_at).toLocaleDateString('ar-EG') : 'غير محدد'}
                </span>
              </div>
            </div>
          </DashboardCard>

          {/* Seats Card */}
          <DashboardCard title="الكراسي المتاحة" icon="chair">
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
                    {subscription?.is_unlimited ? '∞' : subscription?.seats_limit ?? 0}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400">الكراسي المستخدمة</span>
                  <span className="text-primary font-bold text-xl">{subscription?.seats_used ?? 0}</span>
                </div>
              </div>

              {/* Warning if low seats */}
              {!subscription?.is_trial && seatsPercentage >= 70 && (
                <div className={`bg-${seatsColor}-500/10 border border-${seatsColor}-500/20 rounded-lg p-3 text-center`}>
                  <Icon name="exclamation-circle" className={`text-${seatsColor}-400 mr-2`} />
                  <span className={`text-${seatsColor}-400 text-sm`}>
                    {seatsPercentage >= 90 ? 'الكراسي على وشك النفاد!' : 'اقتراب نفاد الكراسي'}
                  </span>
                </div>
              )}
            </div>
          </DashboardCard>
        </div>

        {/* Storage Card */}
        <DashboardCard title="مساحة التخزين" icon="hdd">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Storage Progress Circle */}
            <div className="text-center">
              <div className="relative inline-block">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-white/10" />
                  {!storage?.is_unlimited && (
                    <circle
                      cx="64" cy="64" r="56"
                      stroke="currentColor" strokeWidth="8" fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - (storagePercentage / 100))}`}
                      className={`${
                        storagePercentage >= 90 ? 'text-red-400' :
                        storagePercentage >= 70 ? 'text-orange-400' : 'text-teal-400'
                      } transition-all duration-1000`}
                      strokeLinecap="round"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${
                    storagePercentage >= 90 ? 'text-red-400' :
                    storagePercentage >= 70 ? 'text-orange-400' : 'text-teal-400'
                  }`}>
                    {storage?.is_unlimited ? '∞' : `${storagePercentage}%`}
                  </span>
                  <span className="text-xs text-gray-400">مستخدم</span>
                </div>
              </div>
            </div>

            {/* Storage Details */}
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400">الحد الأقصى</span>
                <span className="text-white font-bold" dir="ltr">
                  {storage?.is_unlimited ? 'غير محدود ∞' : `${storage?.limit_gb ?? 0} GB`}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400">المستخدم</span>
                <span className="text-teal-400 font-bold" dir="ltr">
                  {formatBytes(storage?.used_bytes ?? 0)}
                </span>
              </div>

              {!storage?.is_unlimited && (
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400">المتبقي</span>
                  <span className="text-green-400 font-bold" dir="ltr">
                    {formatBytes(storage?.remaining_bytes ?? 0)}
                  </span>
                </div>
              )}

              {!storage?.is_unlimited && storagePercentage >= 70 && (
                <div className={`rounded-lg p-3 text-center ${
                  storagePercentage >= 90 ? 'bg-red-500/10 border border-red-500/20' : 'bg-orange-500/10 border border-orange-500/20'
                }`}>
                  <Icon name="exclamation-circle" className={`${storagePercentage >= 90 ? 'text-red-400' : 'text-orange-400'} mr-2 inline`} />
                  <span className={`text-sm ${storagePercentage >= 90 ? 'text-red-400' : 'text-orange-400'}`}>
                    {storagePercentage >= 90 ? 'مساحة التخزين على وشك النفاد!' : 'اقتراب نفاد مساحة التخزين'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </DashboardCard>

        {/* Payment Info */}
        {!subscription?.is_trial && (
          <DashboardCard title="معلومات الدفع" icon="money-bill-wave">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white/5 rounded-lg text-center">
                <p className="text-gray-400 text-sm mb-2">سعر الكرسي</p>
                <p className="text-2xl font-bold text-white">{subscription?.price_per_seat ?? 0} ج.م</p>
              </div>

              <div className="p-4 bg-white/5 rounded-lg text-center">
                <p className="text-gray-400 text-sm mb-2">عدد الكراسي</p>
                <p className="text-2xl font-bold text-white">{subscription?.seats_limit ?? 0}</p>
              </div>

              <div className="p-4 bg-primary/10 rounded-lg text-center border border-primary/20">
                <p className="text-gray-400 text-sm mb-2">المبلغ المدفوع</p>
                <p className="text-2xl font-bold text-primary">{subscription?.amount_paid ?? 0} ج.م</p>
              </div>
            </div>
          </DashboardCard>
        )}

        {/* Info Note */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
          <Icon name="info-circle" className="text-blue-400 text-xl mt-1" />
          <div className="flex-1">
            <h3 className="text-blue-400 font-bold mb-1">ملاحظة</h3>
            <p className="text-gray-300 text-sm">
              الكراسي المشتراة تُستخدم لجميع المدرسين في الأكاديمية. عند إضافة طالب لأي مدرس، سيتم استهلاك كرسي من إجمالي كراسي الأكاديمية.
            </p>
          </div>
        </div>

        {/* Renew Button */}
        <div className="flex justify-center">
          <Button
            variant="primary"
            size="lg"
            className="px-8 py-4 bg-primary hover:bg-primary/80 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/20 transition-all flex items-center gap-3"
            onClick={() => setRenewalOpen(true)}
            disabled={!!pendingRequest || loading}
          >
            <Icon name="sync" />
            {pendingRequest
              ? (pendingRequest.request_type === 'upgrade' ? 'طلب الترقية قيد المراجعة' : 'طلب التجديد قيد المراجعة')
              : 'تجديد الاشتراك'}
          </Button>
        </div>

        <SubscriptionRenewalModal
          isOpen={renewalOpen}
          onClose={() => setRenewalOpen(false)}
          onSubmit={handleRenewalSubmit}
          planOptions={subscriptionData?.plan_options ?? []}
          currentPlanSelection={currentPlanSelection}
          currentPlanLabel={subscription?.plan_label ?? ''}
          currentSeatsLimit={subscription?.seats_limit ?? null}
          currentStorageLimitGb={storage?.limit_gb ?? null}
          pricePerSeat={subscription?.price_per_seat ?? 0}
          pricePerStorageGb={subscription?.price_per_storage_gb ?? 0}
          isLoading={renewalSubmitting}
        />
      </div>
    </DashboardLayout>
  );
}

export default withAcademyAuth(SubscriptionPage);
