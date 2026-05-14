'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { withAcademyAuth } from '@/components/auth/withAcademyAuth';
import { Button, Icon } from '@/components/ui';
import SubscriptionRenewalModal from '@/components/subscription/SubscriptionRenewalModal';
import { SubscriptionUsageGauges } from '@/components/subscription/SubscriptionUsageGauges';
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
    } catch (error) {
      console.error('Failed to load academy subscription:', error);
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
    return subscriptionData?.subscription?.storage?.storage_percentage ?? 0;
  };

  const getDeliveryPercentage = () => {
    return subscriptionData?.subscription?.storage?.delivery_percentage ?? 0;
  };


  const daysRemaining = getDaysRemaining();
  const seatsPercentage = getSeatsPercentage();
  const storagePercentage = getStoragePercentage();
  const deliveryPercentage = getDeliveryPercentage();
  const subscription = subscriptionData?.subscription;
  const storage = subscription?.storage;
  const pendingRequest = subscriptionData?.pending_request;
  const currentPlanSelection = resolvePlanSelection(subscription?.plan_type, subscription?.subscription_period);

  const getStatusConfig = () => {
    if (subscription?.is_trial) return { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', label: 'تجريبي', icon: 'flask' };
    if (daysRemaining < 7) return { color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20', label: 'منتهي قريباً', icon: 'exclamation-triangle' };
    if (subscription?.status === 'active') return { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', label: 'نشط', icon: 'check-circle' };
    return { color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/20', label: 'غير نشط', icon: 'times-circle' };
  };

  const statusConfig = getStatusConfig();

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
      <div className="max-w-6xl mx-auto space-y-8 px-4 py-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20">
                <Icon name="school" className="text-primary text-2xl" />
              </div>
              اشتراك الأكاديمية
            </h1>
            <p className="text-gray-light/40 font-bold mr-16">إدارة الحصص الاستيعابية والموارد التعليمية لمنظومتكم</p>
          </div>

          <div className={`px-6 py-3 rounded-2xl border ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color} flex items-center gap-3 backdrop-blur-xl shadow-xl shadow-black/20`}>
            <Icon name={statusConfig.icon as any} className="text-xl" />
            <span className="font-black tracking-wide uppercase text-sm">{statusConfig.label}</span>
          </div>
        </div>

        {loading ? (
          <div className="premium-glass premium-border rounded-[2.5rem] p-12 flex flex-col items-center justify-center gap-4 text-center">
             <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
             <p className="text-gray-light/60 font-bold text-lg">جاري تحميل بيانات اشتراك الأكاديمية...</p>
          </div>
        ) : (
          <>
            {pendingRequest && (
              <div className="premium-glass border-amber-500/20 rounded-[2rem] p-6 flex items-start gap-5 shadow-2xl shadow-amber-500/5 animate-pulse">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/20">
                  <Icon name="hourglass-half" className="text-amber-400 text-xl" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-amber-400 font-black text-lg">
                    {pendingRequest.request_type === 'upgrade' ? 'طلب الترقية قيد المراجعة' : 'طلب التجديد قيد المراجعة'}
                  </h3>
                  <p className="text-gray-light/60 text-sm font-medium leading-relaxed">
                    تم إرسال طلبكم للإدارة وهو الآن قيد المراجعة. سيتم تطبيق التغييرات فور الموافقة عليها.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Days Left */}
              <div className="premium-glass premium-border rounded-[2rem] p-6 space-y-4 hover:translate-y-[-4px] transition-all duration-500 group">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                    <Icon name="calendar-alt" className="text-purple-400" />
                  </div>
                  <span className="text-xs font-black text-purple-400/40 uppercase tracking-widest">الصلاحية</span>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white">{daysRemaining} <span className="text-sm text-gray-light/40">يوم</span></h3>
                  <p className="text-[10px] font-bold text-gray-light/30 mt-1">حتى تاريخ {subscription?.ends_at ? new Date(subscription.ends_at).toLocaleDateString('ar-EG') : '---'}</p>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-1000" style={{ width: `${Math.min(100, (daysRemaining / 365) * 100)}%` }}></div>
                </div>
              </div>

              {/* Seats Stat */}
              <div className="premium-glass premium-border rounded-[2rem] p-6 space-y-4 hover:translate-y-[-4px] transition-all duration-500 group">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${seatsPercentage >= 90 ? 'bg-rose-500/10 border-rose-500/10 group-hover:bg-rose-500/20' : 'bg-primary/10 border-primary/10 group-hover:bg-primary/20'}`}>
                    <Icon name="users" className={seatsPercentage >= 90 ? 'text-rose-400' : 'text-primary'} />
                  </div>
                  <span className={`text-xs font-black uppercase tracking-widest ${seatsPercentage >= 90 ? 'text-rose-400/40' : 'text-primary/40'}`}>كراسي الطلاب</span>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white">{subscription?.seats_used} <span className="text-sm text-gray-light/40">/ {subscription?.is_unlimited ? '∞' : subscription?.seats_limit}</span></h3>
                  <p className="text-[10px] font-bold text-gray-light/30 mt-1">تم استهلاك {seatsPercentage}% من إجمالي السعة</p>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${seatsPercentage >= 90 ? 'bg-rose-500' : 'bg-primary'}`} style={{ width: `${seatsPercentage}%` }}></div>
                </div>
              </div>

              {/* Storage Stat */}
              <div className="premium-glass premium-border rounded-[2rem] p-6 space-y-4 hover:translate-y-[-4px] transition-all duration-500 group">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${storagePercentage >= 90 ? 'bg-rose-500/10 border-rose-500/10 group-hover:bg-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/10 group-hover:bg-emerald-500/20'}`}>
                    <Icon name="database" className={storagePercentage >= 90 ? 'text-rose-400' : 'text-emerald-400'} />
                  </div>
                  <span className={`text-xs font-black uppercase tracking-widest ${storagePercentage >= 90 ? 'text-rose-400/40' : 'text-emerald-400/40'}`}>سعة التخزين</span>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white">{storage?.storage_used_minutes} <span className="text-sm text-gray-light/40">/ {storage?.storage_limit_minutes} د</span></h3>
                  <p className="text-[10px] font-bold text-gray-light/30 mt-1">تم استخدام {storagePercentage}% من سعة التخزين</p>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${storagePercentage >= 90 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${storagePercentage}%` }}></div>
                </div>
              </div>

              {/* Delivery Stat (New) */}
              <div className="premium-glass premium-border rounded-[2rem] p-6 space-y-4 hover:translate-y-[-4px] transition-all duration-500 group">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${deliveryPercentage >= 90 ? 'bg-rose-500/10 border-rose-500/10 group-hover:bg-rose-500/20' : 'bg-blue-500/10 border-blue-500/10 group-hover:bg-blue-500/20'}`}>
                    <Icon name="play-circle" className={deliveryPercentage >= 90 ? 'text-rose-400' : 'text-blue-400'} />
                  </div>
                  <span className={`text-xs font-black uppercase tracking-widest ${deliveryPercentage >= 90 ? 'text-rose-400/40' : 'text-blue-400/40'}`}>باقة المشاهدة</span>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white">{storage?.delivery_used_minutes} <span className="text-sm text-gray-light/40">/ {storage?.delivery_limit_minutes} د</span></h3>
                  <p className="text-[10px] font-bold text-gray-light/30 mt-1">تم استهلاك {deliveryPercentage}% من باقة المشاهدة</p>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${deliveryPercentage >= 90 ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${deliveryPercentage}%` }}></div>
                </div>
              </div>

              {/* Amount Paid */}
              <div className="premium-glass premium-border rounded-[2rem] p-6 space-y-4 hover:translate-y-[-4px] transition-all duration-500 group">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                    <Icon name="file-invoice-dollar" className="text-amber-400" />
                  </div>
                  <span className="text-xs font-black text-amber-400/40 uppercase tracking-widest">الاستثمار</span>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white">{subscription?.amount_paid ?? 0} <span className="text-sm text-gray-light/40">ج.م</span></h3>
                  <p className="text-[10px] font-bold text-gray-light/30 mt-1">بناءً على {subscription?.seats_limit} كرسي مفعل</p>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>

            {/* Usage Analysis Gauges */}
            <SubscriptionUsageGauges 
              seats={{
                used: subscription?.seats_used ?? 0,
                limit: subscription?.seats_limit ?? 0,
                percentage: seatsPercentage,
                isUnlimited: subscription?.is_unlimited
              }}
              storage={{
                used: storage?.storage_used_minutes ?? 0,
                limit: storage?.storage_limit_minutes ?? 0,
                percentage: storagePercentage
              }}
              delivery={{
                used: storage?.delivery_used_minutes ?? 0,
                limit: storage?.delivery_limit_minutes ?? 0,
                percentage: deliveryPercentage
              }}
            />

            {/* Detailed Info Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Plan Info */}
                <div className="premium-glass premium-border rounded-[2.5rem] p-8 space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                      <Icon name="info-circle" className="text-primary" />
                      تفاصيل خطة الأكاديمية
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5 space-y-1 hover:bg-white/10 transition-colors">
                      <span className="text-[10px] font-black text-gray-light/20 uppercase">نوع الباقة</span>
                      <p className="text-lg font-bold text-white leading-tight">{subscription?.plan_label || '---'}</p>
                    </div>
                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5 space-y-1 hover:bg-white/10 transition-colors">
                      <span className="text-[10px] font-black text-gray-light/20 uppercase">تاريخ تفعيل الاشتراك</span>
                      <p className="text-lg font-bold text-white leading-tight">{subscription?.starts_at ? new Date(subscription.starts_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }) : '---'}</p>
                    </div>
                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5 space-y-1 hover:bg-white/10 transition-colors">
                      <span className="text-[10px] font-black text-gray-light/20 uppercase">تاريخ التجديد القادم</span>
                      <p className="text-lg font-bold text-rose-400 leading-tight">{subscription?.ends_at ? new Date(subscription.ends_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }) : '---'}</p>
                    </div>
                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5 space-y-1 hover:bg-white/10 transition-colors">
                      <span className="text-[10px] font-black text-gray-light/20 uppercase">النظام المالي</span>
                      <p className="text-lg font-bold text-primary leading-tight">
                        {subscription?.subscription_period === 'monthly' ? 'دفع شهري' : 
                         subscription?.subscription_period === 'quarterly' ? 'دفع ربع سنوي' :
                         subscription?.subscription_period === 'annual' ? 'دفع سنوي' : 'باقة مخصصة'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info Note */}
                <div className="premium-glass premium-border rounded-[2.5rem] p-8 flex items-start gap-6 bg-gradient-to-br from-primary/5 to-purple-500/5">
                  <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20 shrink-0">
                    <Icon name="lightbulb" className="text-primary text-2xl" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-white">كيف تعمل كراسي الأكاديمية؟</h3>
                    <p className="text-sm text-gray-light/60 font-medium leading-relaxed">
                      الكراسي المشتراة تُمثل الطاقة الاستيعابية الإجمالية للأكاديمية. عند قيام أي مدرس تابع للأكاديمية بإضافة طالب جديد، يتم حجز كرسي من رصيد الأكاديمية الموحد. هذا يمنحكم مرونة كاملة في توزيع الموارد بين مدرسيكم.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Sidebar */}
              <div className="space-y-6">
                <div className="premium-glass premium-border rounded-[2.5rem] p-8 text-center space-y-8 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-600"></div>
                  
                  <div className="space-y-4">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/5 mx-auto group-hover:scale-110 transition-transform duration-500">
                      <Icon name="rocket" className="text-primary text-3xl" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white">توسيع المنظومة</h3>
                      <p className="text-gray-light/40 text-sm font-bold mt-2">قم بزيادة الكراسي أو مساحة التخزين لدعم نمو أكاديميتك</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center justify-between px-6 py-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-xs font-bold text-gray-light/40">سعر الكرسي</span>
                        <span className="font-black text-white">{subscription?.price_per_seat} ج.م</span>
                     </div>
                     <div className="flex items-center justify-between px-6 py-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-xs font-bold text-gray-light/40">سعر دقيقة التخزين</span>
                        <span className="font-black text-white">{subscription?.price_per_storage_minute} ج.م</span>
                     </div>
                     <div className="flex items-center justify-between px-6 py-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-xs font-bold text-gray-light/40">سعر دقيقة المشاهدة</span>
                        <span className="font-black text-white">{subscription?.price_per_delivery_minute} ج.م</span>
                     </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full py-6 rounded-2xl text-lg font-black shadow-2xl shadow-primary/40 relative overflow-hidden group/btn"
                    onClick={() => setRenewalOpen(true)}
                    disabled={!!pendingRequest || loading}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 group-hover/btn:scale-105 transition-transform duration-500"></div>
                    <div className="relative flex items-center justify-center gap-3 text-white">
                      <Icon name="plus-circle" />
                      <span>{pendingRequest ? 'الطلب قيد المعالجة' : 'تطوير الأكاديمية'}</span>
                    </div>
                  </Button>

                  <p className="text-[10px] text-gray-light/20 font-bold leading-relaxed px-4">
                    * سيتم مراجعة طلب الترقية وإرسال إشعار لكم فور تفعيل الموارد الجديدة.
                  </p>
                </div>

                {/* Support Contact */}
                <div className="premium-glass premium-border rounded-[2.5rem] p-6 flex flex-col items-center text-center gap-4 hover:bg-white/5 transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-primary/20 transition-all">
                    <Icon name="headset" className="text-gray-light/60 group-hover:text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">دعم الأكاديميات المخصص</h4>
                    <p className="text-[10px] font-bold text-gray-light/40 mt-1">هل تحتاج لباقة مخصصة لأكثر من 5000 طالب؟ تواصل معنا مباشرة.</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <SubscriptionRenewalModal
          isOpen={renewalOpen}
          onClose={() => setRenewalOpen(false)}
          onSubmit={handleRenewalSubmit}
          planOptions={subscriptionData?.plan_options ?? []}
          currentPlanSelection={currentPlanSelection}
          currentPlanLabel={subscription?.plan_label ?? ''}
          currentSeatsLimit={subscription?.seats_limit ?? null}
          currentStorageLimitMinutes={storage?.storage_limit_minutes ?? 0}
          currentDeliveryLimitMinutes={storage?.delivery_limit_minutes ?? 0}
          pricePerSeat={subscription?.price_per_seat ?? 0}
          pricePerStorageMinute={subscription?.price_per_storage_minute ?? 0}
          pricePerDeliveryMinute={subscription?.price_per_delivery_minute ?? 0}
          isLoading={renewalSubmitting}
        />
      </div>
    </DashboardLayout>
  );
}

export default withAcademyAuth(SubscriptionPage);
