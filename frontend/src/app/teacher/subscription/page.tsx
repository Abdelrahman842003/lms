'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button, Icon } from '@/components/ui';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { withTeacherAuth } from '@/components/auth/withTeacherAuth';
import SubscriptionRenewalModal from '@/components/subscription/SubscriptionRenewalModal';
import { getTeacherSubscription, requestTeacherRenewal } from '@/services/subscriptionService';
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
  const router = useRouter();
  const { user, selectedAcademy, isLoading: authLoading } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [renewalOpen, setRenewalOpen] = useState(false);
  const [renewalSubmitting, setRenewalSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && selectedAcademy?.id && selectedAcademy.id !== 'independent') {
      router.replace('/academy/subscription');
    }
  }, [authLoading, selectedAcademy, router]);

  const loadSubscription = async () => {
    if (selectedAcademy?.id && selectedAcademy.id !== 'independent') {
      return;
    }
    setLoading(true);
    try {
      const data = await getTeacherSubscription();
      setSubscriptionData(data);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (!selectedAcademy?.id || selectedAcademy.id === 'independent')) {
      loadSubscription();
    }
  }, [authLoading, selectedAcademy]);

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
      await requestTeacherRenewal(payload);
      setRenewalOpen(false);
      await loadSubscription();
    } finally {
      setRenewalSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="teacher" user={user || undefined}>
      <div className="max-w-6xl mx-auto space-y-8 px-4 py-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20">
                <Icon name="crown" className="text-primary text-2xl" />
              </div>
              إدارة الاشتراك
            </h1>
            <p className="text-gray-light/40 font-bold mr-16">تحكم في باقتك، الكراسي، ومساحة التخزين الخاصة بك</p>
          </div>

          <div className={`px-6 py-3 rounded-2xl border ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color} flex items-center gap-3 backdrop-blur-xl shadow-xl shadow-black/20`}>
            <Icon name={statusConfig.icon as any} className="text-xl" />
            <span className="font-black tracking-wide uppercase text-sm">{statusConfig.label}</span>
          </div>
        </div>

        {loading ? (
          <div className="premium-glass premium-border rounded-[2.5rem] p-12 flex flex-col items-center justify-center gap-4 text-center">
             <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
             <p className="text-gray-light/60 font-bold text-lg">جاري تحميل بيانات اشتراكك الحالية...</p>
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
                    لقد قمنا باستلام طلبك وهو الآن قيد المراجعة من قبل الإدارة. سيتم تحديث حالة اشتراكك فور الموافقة.
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
                  <p className="text-[10px] font-bold text-gray-light/30 mt-1">متبقي حتى تاريخ {subscription?.ends_at ? new Date(subscription.ends_at).toLocaleDateString('ar-EG') : '---'}</p>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-1000" style={{ width: `${Math.min(100, (daysRemaining / 365) * 100)}%` }}></div>
                </div>
              </div>

              {/* Seats Stat */}
              <div className="premium-glass premium-border rounded-[2rem] p-6 space-y-4 hover:translate-y-[-4px] transition-all duration-500 group">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${seatsPercentage >= 90 ? 'bg-rose-500/10 border-rose-500/10 group-hover:bg-rose-500/20' : 'bg-primary/10 border-primary/10 group-hover:bg-primary/20'}`}>
                    <Icon name="user-graduate" className={seatsPercentage >= 90 ? 'text-rose-400' : 'text-primary'} />
                  </div>
                  <span className={`text-xs font-black uppercase tracking-widest ${seatsPercentage >= 90 ? 'text-rose-400/40' : 'text-primary/40'}`}>الكراسي</span>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white">{subscription?.seats_used} <span className="text-sm text-gray-light/40">/ {subscription?.is_unlimited ? '∞' : subscription?.seats_limit}</span></h3>
                  <p className="text-[10px] font-bold text-gray-light/30 mt-1">تم استخدام {seatsPercentage}% من طاقتك الاستيعابية</p>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${seatsPercentage >= 90 ? 'bg-rose-500' : 'bg-primary'}`} style={{ width: `${seatsPercentage}%` }}></div>
                </div>
              </div>

              {/* Storage Stat */}
              <div className="premium-glass premium-border rounded-[2rem] p-6 space-y-4 hover:translate-y-[-4px] transition-all duration-500 group">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${storagePercentage >= 90 ? 'bg-rose-500/10 border-rose-500/10 group-hover:bg-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/10 group-hover:bg-emerald-500/20'}`}>
                    <Icon name="cloud-upload-alt" className={storagePercentage >= 90 ? 'text-rose-400' : 'text-emerald-400'} />
                  </div>
                  <span className={`text-xs font-black uppercase tracking-widest ${storagePercentage >= 90 ? 'text-rose-400/40' : 'text-emerald-400/40'}`}>التخزين</span>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white">{storage?.is_unlimited ? '∞' : `${storagePercentage}%`}</h3>
                  <p className="text-[10px] font-bold text-gray-light/30 mt-1">مستخدم {formatBytes(storage?.used_bytes ?? 0)} من أصل {storage?.limit_gb ?? 0}GB</p>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${storagePercentage >= 90 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${storagePercentage}%` }}></div>
                </div>
              </div>

              {/* Amount Paid */}
              <div className="premium-glass premium-border rounded-[2rem] p-6 space-y-4 hover:translate-y-[-4px] transition-all duration-500 group">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                    <Icon name="wallet" className="text-amber-400" />
                  </div>
                  <span className="text-xs font-black text-amber-400/40 uppercase tracking-widest">الدفع</span>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white">{subscription?.amount_paid ?? 0} <span className="text-sm text-gray-light/40">ج.م</span></h3>
                  <p className="text-[10px] font-bold text-gray-light/30 mt-1">التكلفة لكل كرسي: {subscription?.price_per_seat} ج.م</p>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>

            {/* Detailed Info Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Plan Details */}
              <div className="lg:col-span-2 space-y-8">
                <div className="premium-glass premium-border rounded-[2.5rem] p-8 space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                      <Icon name="id-card" className="text-primary" />
                      بيانات الباقة الحالية
                    </h2>
                    <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-gray-light/60 uppercase tracking-tighter">
                      نظام {subscription?.plan_type === 'term' ? 'اشتراك مدفوع' : 'باقة خاصة'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5 space-y-1 hover:bg-white/10 transition-colors">
                      <span className="text-[10px] font-black text-gray-light/20 uppercase">اسم الباقة</span>
                      <p className="text-lg font-bold text-white leading-tight">{subscription?.plan_label || '---'}</p>
                    </div>
                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5 space-y-1 hover:bg-white/10 transition-colors">
                      <span className="text-[10px] font-black text-gray-light/20 uppercase">تاريخ البداية</span>
                      <p className="text-lg font-bold text-white leading-tight">{subscription?.starts_at ? new Date(subscription.starts_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }) : '---'}</p>
                    </div>
                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5 space-y-1 hover:bg-white/10 transition-colors">
                      <span className="text-[10px] font-black text-gray-light/20 uppercase">تاريخ الانتهاء المتوقع</span>
                      <p className="text-lg font-bold text-rose-400 leading-tight">{subscription?.ends_at ? new Date(subscription.ends_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }) : '---'}</p>
                    </div>
                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5 space-y-1 hover:bg-white/10 transition-colors">
                      <span className="text-[10px] font-black text-gray-light/20 uppercase">دورة الاشتراك</span>
                      <p className="text-lg font-bold text-primary leading-tight">
                        {subscription?.subscription_period === 'monthly' ? 'شهري' : 
                         subscription?.subscription_period === 'quarterly' ? 'ربع سنوي' :
                         subscription?.subscription_period === 'annual' ? 'سنوي' : 'مخصص'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Storage Analysis */}
                <div className="premium-glass premium-border rounded-[2.5rem] p-8 space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                      <Icon name="hdd" className="text-emerald-400" />
                      تحليل مساحة التخزين
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-3xl border border-white/5 text-center space-y-2">
                       <span className="text-[10px] font-black text-gray-light/20 uppercase tracking-widest">الإجمالي</span>
                       <span className="text-2xl font-black text-white tracking-tighter">{storage?.is_unlimited ? '∞' : `${storage?.limit_gb}GB`}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-3xl border border-white/5 text-center space-y-2">
                       <span className="text-[10px] font-black text-gray-light/20 uppercase tracking-widest">المستخدم</span>
                       <span className="text-2xl font-black text-emerald-400 tracking-tighter">{formatBytes(storage?.used_bytes ?? 0)}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-3xl border border-white/5 text-center space-y-2">
                       <span className="text-[10px] font-black text-gray-light/20 uppercase tracking-widest">المتبقي</span>
                       <span className="text-2xl font-black text-primary tracking-tighter">{storage?.is_unlimited ? '∞' : formatBytes(storage?.remaining_bytes ?? 0)}</span>
                    </div>
                  </div>

                  {!storage?.is_unlimited && storagePercentage >= 70 && (
                    <div className={`rounded-2xl p-5 border flex items-center gap-4 ${storagePercentage >= 90 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                      <Icon name="exclamation-circle" className="text-2xl" />
                      <p className="text-sm font-bold leading-relaxed">
                        {storagePercentage >= 90 
                          ? 'تحذير: لقد تجاوزت 90% من مساحة التخزين. قد لا تتمكن من رفع فيديوهات جديدة قريباً.' 
                          : 'تنبيه: مساحة التخزين تقترب من النفاد. يرجى مراجعة ملفاتك أو ترقية باقتك.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar: Renew Action */}
              <div className="space-y-6">
                <div className="premium-glass premium-border rounded-[2.5rem] p-8 text-center space-y-8 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-600"></div>
                  
                  <div className="space-y-4">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/5 mx-auto group-hover:scale-110 transition-transform duration-500">
                      <Icon name="sync" className="text-primary text-3xl animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white">تجديد أو ترقية</h3>
                      <p className="text-gray-light/40 text-sm font-bold mt-2">اختر الباقة المناسبة لنمو عملك التعليمي</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center justify-between px-6 py-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-xs font-bold text-gray-light/40">سعر الكرسي</span>
                        <span className="font-black text-white">{subscription?.price_per_seat} ج.م</span>
                     </div>
                     <div className="flex items-center justify-between px-6 py-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-xs font-bold text-gray-light/40">سعر الـ GB</span>
                        <span className="font-black text-white">{subscription?.price_per_storage_gb} ج.م</span>
                     </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full py-6 rounded-2xl text-lg font-black shadow-2xl shadow-primary/40 relative overflow-hidden group/btn"
                    onClick={() => setRenewalOpen(true)}
                    disabled={!!pendingRequest || loading}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 group-hover/btn:scale-105 transition-transform duration-500"></div>
                    <div className="relative flex items-center justify-center gap-3">
                      <Icon name="magic" />
                      <span>{pendingRequest ? 'الطلب قيد المراجعة' : 'تطوير اشتراكي الآن'}</span>
                    </div>
                  </Button>

                  <p className="text-[10px] text-gray-light/20 font-bold leading-relaxed">
                    * عند التجديد المبكر، يتم إضافة المدة الجديدة إلى مدة اشتراكك الحالية تلقائياً دون ضياع أي يوم.
                  </p>
                </div>

                {/* Support Card */}
                <div className="premium-glass premium-border rounded-[2.5rem] p-6 flex items-center gap-4 hover:bg-white/5 transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-primary/20 group-hover:border-primary/20 transition-all">
                    <Icon name="headset" className="text-gray-light/60 group-hover:text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">هل تحتاج للمساعدة؟</h4>
                    <p className="text-xs font-bold text-gray-light/40">تواصل مع الدعم الفني للاستفسارات</p>
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
          currentStorageLimitGb={storage?.limit_gb ?? null}
          pricePerSeat={subscription?.price_per_seat ?? 0}
          pricePerStorageGb={subscription?.price_per_storage_gb ?? 0}
          isLoading={renewalSubmitting}
        />
      </div>
    </DashboardLayout>
  );
}

export default withTeacherAuth(SubscriptionPage);
