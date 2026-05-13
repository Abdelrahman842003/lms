'use client';

import React, { useState, useEffect, use } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { LoadingSpinner, FormModal, Button, Icon, Input, Textarea, Badge } from '@/components/ui';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { getTeacherStudentDetails, getStudentActivationDetails, createTeacherStudentPayment } from '@/services/authService';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { cn } from '@/utils';

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const getPaymentColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash % 360);
  return { bg: `hsla(${hue}, 70%, 50%, 0.15)`, border: `hsla(${hue}, 70%, 50%, 0.3)`, text: `hsla(${hue}, 70%, 70%, 1)` };
};

const getCoveredMonths = (start: string, end: string) => {
  const monthsList = [];
  const current = new Date(new Date(start).getFullYear(), new Date(start).getMonth(), 15);
  const endDate = new Date(end);
  while (current < endDate) {
    monthsList.push(new Intl.DateTimeFormat('ar-EG', { month: 'long' }).format(current));
    current.setMonth(current.getMonth() + 1);
  }
  return monthsList;
};

interface PaymentLog {
  id: string; amount: number; months: number; created_at: string; notes?: string; confirmation_code?: string; start_date?: string; end_date?: string;
}

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  
  const [student, setStudent] = useState<any>(null);
  const [activationDetails, setActivationDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [months, setMonths] = useState<number>(1);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [studentData, detailsData] = await Promise.all([getTeacherStudentDetails(id), getStudentActivationDetails(id)]);
        setStudent(studentData);
        setActivationDetails(detailsData);
      } catch { toast.error('فشل تحميل البيانات'); } finally { setIsLoading(false); }
    };
    if (id) fetchData();
  }, [id]);

  useEffect(() => {
    const today = new Date();
    const subEnd = student?.subscription_end ? new Date(student.subscription_end) : null;
    if (subEnd && subEnd > today) {
      const nextDay = new Date(subEnd);
      nextDay.setDate(nextDay.getDate() + 1);
      setStartDate(nextDay);
    } else { setStartDate(today); }
  }, [student?.subscription_end]);

  const basePrice = (() => {
    if (!activationDetails?.pricing_options) return 0;
    const option = activationDetails.pricing_options.find((o: any) => o.is_default) || activationDetails.pricing_options[0];
    return option ? option.base_price : 0;
  })();

  const subTotal = basePrice * months;
  const teacherAmount = subTotal - (subTotal * (discount / 100));

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await createTeacherStudentPayment(id, { months, discount, notes, client_side_uuid: generateUUID(), start_date: startDate.toISOString().split('T')[0] });
      toast.success('تم تسجيل الدفعة بنجاح');
      router.push(`/teacher/students/${id}`);
    } catch (error: any) { toast.error(error.message || 'فشل التسجيل'); } finally { setIsSubmitting(false); }
  };

  if (isLoading) return <DashboardLayout role="teacher" user={user || undefined}><div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div></DashboardLayout>;

  return (
    <DashboardLayout role="teacher" user={user || undefined}>
      <div className="space-y-8 animate-in fade-in duration-700">
        
        {/* Header */}
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-2xl">
                <Icon name="money-check-alt" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tighter">تفعيل اشتراك الطالب</h1>
                <p className="text-[10px] font-bold text-gray-light/20 uppercase tracking-widest">إدارة الدفعات والمديونيات بشكل مالي دقيق</p>
              </div>
           </div>
           <Button onClick={() => router.back()} variant="outline" className="h-10 px-6 rounded-xl border-white/5 font-black uppercase tracking-widest text-[10px]">
              <Icon name="arrow-right" className="ml-2" /> عودة
           </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Student Side Card */}
           <div className="lg:col-span-1 space-y-6">
              <div className="p-8 rounded-[2.5rem] premium-glass premium-border text-center space-y-6 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                 <div className="w-24 h-24 rounded-[2rem] bg-white/5 border-2 border-white/10 flex items-center justify-center mx-auto text-3xl font-black text-white relative z-10">
                   {student?.name?.charAt(0) || '؟'}
                 </div>
                 <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">{student?.name}</h3>
                    <p className="text-[10px] font-black text-gray-light/20 uppercase tracking-widest mt-1">ID: {student?.id?.substring(0, 8)}</p>
                 </div>
                 <div className="space-y-2 pt-4 border-t border-white/5">
                    {activationDetails?.grade_name && (
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-gray-light/20 uppercase">الصف</span>
                        <span className="text-white">{activationDetails.grade_name}</span>
                      </div>
                    )}
                    {activationDetails?.group_name && (
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-gray-light/20 uppercase">المجموعة</span>
                        <span className="text-white">{activationDetails.group_name}</span>
                      </div>
                    )}
                 </div>
                 <Button onClick={() => setShowHistoryModal(true)} variant="outline" className="w-full h-10 rounded-xl border-white/5 text-[10px] font-black uppercase tracking-widest">
                   سجل الدفعات السابقة
                 </Button>
              </div>

              {/* Pricing Context */}
              <div className="p-6 rounded-[2rem] premium-glass premium-border flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center text-xs">
                     <Icon name="tag" />
                   </div>
                   <span className="text-[10px] font-black text-gray-light/20 uppercase">سعر الاشتراك</span>
                 </div>
                 <div className="text-xl font-black text-white">{basePrice} <span className="text-xs opacity-40">ج.م</span></div>
              </div>
           </div>

           {/* Payment Main Form */}
           <div className="lg:col-span-2 space-y-6">
              <div className="p-8 md:p-10 rounded-[2.5rem] premium-glass premium-border space-y-10">
                 
                 {/* Period Selector Grid */}
                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                       <h4 className="text-xs font-black text-gray-light/30 uppercase tracking-widest">اختر فترة التفعيل</h4>
                       <span className="text-primary font-black text-xs">{months} شهر</span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {(() => {
                        const today = new Date();
                        const subEnd = student?.subscription_end ? new Date(student.subscription_end) : null;
                        const effStart = subEnd && subEnd > today ? new Date(new Date(subEnd).setDate(new Date(subEnd).getDate() + 1)) : today;
                        const gridStart = new Date(today.getFullYear(), today.getMonth(), 1);

                        return Array.from({ length: 12 }).map((_, i) => {
                          const date = new Date(gridStart.getFullYear(), gridStart.getMonth() + i, 1);
                          const mEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                          const isPaid = subEnd ? mEnd <= subEnd : false;
                          const pEnd = new Date(effStart); pEnd.setMonth(pEnd.setMonth(pEnd.getMonth()) + months); // simplified
                          const isSelected = mEnd <= new Date(new Date(effStart).setMonth(effStart.getMonth() + months)) && mEnd >= effStart;

                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                if (isPaid) return setShowHistoryModal(true);
                                const diff = (date.getFullYear() - effStart.getFullYear()) * 12 + (date.getMonth() - effStart.getMonth());
                                setMonths(Math.max(1, diff + 1));
                              }}
                              className={cn(
                                "relative p-3 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1",
                                isPaid ? "border-success/20 bg-success/5 cursor-not-allowed opacity-60" :
                                isSelected ? "border-primary bg-primary text-white shadow-xl shadow-primary/30" :
                                "border-white/5 bg-white/5 hover:border-white/20 text-gray-light/40"
                              )}
                            >
                              <span className="text-xs font-black">{new Intl.DateTimeFormat('ar-EG', { month: 'short' }).format(date)}</span>
                              <span className="text-[9px] opacity-40 font-bold">{date.getFullYear()}</span>
                              {isPaid && <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-success text-white flex items-center justify-center text-[8px]"><Icon name="check" /></div>}
                            </button>
                          );
                        });
                      })()}
                    </div>
                 </div>

                 {/* Advanced Controls */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/5">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-light/20 uppercase tracking-widest px-2">الخصم المقدم (%)</label>
                       <div className="relative">
                         <Input 
                            type="number" min="0" max="100" value={discount} 
                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                            className="h-12 bg-white/5 border-white/10 rounded-xl text-center font-black text-lg text-primary"
                         />
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-light/20 font-black">%</span>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-light/20 uppercase tracking-widest px-2">ملاحظات التحصيل</label>
                       <Textarea 
                          value={notes} onChange={(e) => setNotes(e.target.value)}
                          placeholder="مثلاً: تم استلام المبلغ نقداً..."
                          className="h-12 min-h-[48px] bg-white/5 border-white/10 rounded-xl py-3"
                       />
                    </div>
                 </div>

                 {/* Checkout Summary */}
                 <div className="p-8 rounded-[2rem] bg-white/5 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-right">
                       <div className="text-[10px] font-black text-gray-light/20 uppercase tracking-widest mb-1">المبلغ الإجمالي المطلوب</div>
                       <div className="flex items-baseline gap-2 justify-center md:justify-start">
                          <span className="text-4xl font-black text-white">{teacherAmount}</span>
                          <span className="text-sm font-bold text-gray-light/40">ج.م</span>
                          {discount > 0 && <span className="text-xs text-danger line-through ml-2 opacity-50">{subTotal} ج.م</span>}
                       </div>
                    </div>
                    <Button 
                      onClick={handleSubmit} loading={isSubmitting} disabled={isSubmitting}
                      className="w-full md:w-auto h-14 px-12 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-2xl shadow-primary/30"
                    >
                      <Icon name="check-circle" className="ml-3 text-lg" />
                      تأكيد وتفعيل الاشتراك
                    </Button>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <FormModal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} onSubmit={() => setShowHistoryModal(false)} title="سجل الدفعات" submitText="إغلاق" cancelText="" maxWidth="500px">
        <div className="space-y-4">
          {student?.payment_logs?.length > 0 ? student.payment_logs.map((log: any) => (
            <div key={log.id} className="p-5 rounded-2xl premium-glass premium-border flex justify-between items-center group">
               <div className="space-y-2">
                  <div className="text-sm font-black text-white">{log.amount} ج.م</div>
                  <div className="text-[10px] font-bold text-gray-light/20 uppercase tracking-widest flex items-center gap-2">
                     <Icon name="calendar" className="text-primary/50" />
                     {new Date(log.created_at).toLocaleDateString('ar-EG')}
                  </div>
               </div>
               <Badge variant="success" size="sm" className="font-black uppercase scale-90">{log.months} شهور</Badge>
            </div>
          )) : <div className="py-12 text-center opacity-30 text-xs font-black uppercase tracking-widest">لا توجد سجلات حالياً</div>}
        </div>
      </FormModal>
    </DashboardLayout>
  );
}
