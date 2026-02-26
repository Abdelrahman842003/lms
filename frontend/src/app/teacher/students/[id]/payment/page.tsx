'use client';

import React, { useState, useEffect, use } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { LoadingSpinner, FormModal, Button, Icon, Input, Textarea, Badge } from '@/components/ui';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { getTeacherStudentDetails, getStudentActivationDetails, createTeacherStudentPayment } from '@/services/authService';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// Simple UUID generator
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Color generator for payment history
const getPaymentColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return {
    bg: `hsla(${hue}, 70%, 50%, 0.15)`,
    border: `hsla(${hue}, 70%, 50%, 0.3)`,
    text: `hsla(${hue}, 70%, 70%, 1)`
  };
};

// Get covered months from payment period
const getCoveredMonths = (start: string, end: string) => {
  const monthsList = [];
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  let current = new Date(startDate.getFullYear(), startDate.getMonth(), 15);
  
  while (current < endDate) {
    monthsList.push(new Intl.DateTimeFormat('ar-EG', { month: 'long' }).format(current));
    current.setMonth(current.getMonth() + 1);
  }
  
  return monthsList;
};

interface PaymentLog {
  id: string;
  amount: number;
  months: number;
  created_at: string;
  notes?: string;
  confirmation_code?: string;
  start_date?: string;
  end_date?: string;
}

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  
  const [student, setStudent] = useState<any>(null);
  const [activationDetails, setActivationDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Payment State
  const [months, setMonths] = useState<number>(1);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  
  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [studentData, detailsData] = await Promise.all([
          getTeacherStudentDetails(id),
          getStudentActivationDetails(id)
        ]);
        setStudent(studentData);
        setActivationDetails(detailsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('فشل تحميل بيانات الطالب');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  // Update startDate based on subscription_end
  useEffect(() => {
    const today = new Date();
    const subEnd = student?.subscription_end ? new Date(student.subscription_end) : null;
    
    if (subEnd && subEnd > today) {
      const nextDay = new Date(subEnd);
      nextDay.setDate(nextDay.getDate() + 1);
      setStartDate(nextDay);
    } else {
      setStartDate(today);
    }
  }, [student?.subscription_end]);

  // Calculations
  const getBasePrice = () => {
    if (!activationDetails?.pricing_options) return 0;
    const option = activationDetails.pricing_options.find((o: any) => o.is_default) || activationDetails.pricing_options[0];
    return option ? option.base_price : 0;
  };

  const getPriceLabel = () => {
    if (!activationDetails?.pricing_options) return 'سعر الاشتراك';
    const option = activationDetails.pricing_options.find((o: any) => o.is_default) || activationDetails.pricing_options[0];
    return option?.label || 'سعر الاشتراك';
  };

  const basePrice = getBasePrice();
  
  const subTotal = basePrice * months;
  const discountAmount = subTotal * (discount / 100);
  const teacherAmount = subTotal - discountAmount;
  
  // Platform fee removed - teacher pays via subscription system
  const totalRequired = teacherAmount;

  // Auto-generate notes
  useEffect(() => {
    if (!basePrice) return;

    const autoNotes = [];
    if (months > 1) {
      autoNotes.push(`عدد الأشهر: ${months}`);
    }
    if (discount > 0) {
      autoNotes.push(`خصم: ${discount}%`);
    }
    
    autoNotes.push(`السعر الأساسي: ${basePrice} × ${months} = ${subTotal} ج.م`);
    
    if (discountAmount > 0) {
      autoNotes.push(`المبلغ بعد الخصم: ${teacherAmount} ج.م`);
    }
    
    autoNotes.push(`الإجمالي المطلوب: ${totalRequired} ج.م`);
    
    setNotes(autoNotes.join(' | '));
  }, [months, discount, basePrice, subTotal, teacherAmount, totalRequired, discountAmount]);

  const handleSubmit = async () => {
    if (months < 1) {
      toast.error('يجب اختيار شهر واحد على الأقل');
      return;
    }

    try {
      setIsSubmitting(true);
      await createTeacherStudentPayment(id, {
        months: months,
        discount: discount,
        notes: notes,
        client_side_uuid: generateUUID(),
        start_date: startDate.toISOString().split('T')[0],
      });
      
      toast.success('تم تسجيل الدفعة بنجاح');
      router.push(`/teacher/students/${id}`);
    } catch (error: any) {
      console.error('Payment failed:', error);
      toast.error(error.message || 'فشل تسجيل الدفعة');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="teacher" user={user || undefined}>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  const paymentLogs: PaymentLog[] = student?.payment_logs || [];
  const subscriptionEnd = student?.subscription_end ? new Date(student.subscription_end) : null;

  return (
    <DashboardLayout role="teacher" user={user || undefined}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Icon name="money-bill-wave" className="text-primary" />
            تسجيل دفعة جديدة
          </h1>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <Icon name="arrow-right" />
            عودة
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Student Info Card */}
          <div className="md:col-span-1">
            <DashboardCard title="بيانات الطالب" icon="user">
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary text-2xl font-bold">
                  {student?.name?.charAt(0) || '؟'}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{student?.name}</h3>
                <p className="text-gray-400 text-sm">ID: {student?.id?.substring(0, 8)}</p>
                {activationDetails?.grade_name && (
                  <p className="text-gray-400 text-sm mt-2">
                    <Icon name="graduation-cap" className="ml-1 inline" />
                    {activationDetails.grade_name}
                  </p>
                )}
                {activationDetails?.group_name && (
                  <p className="text-gray-400 text-sm">
                    <Icon name="users" className="ml-1 inline" />
                    {activationDetails.group_name}
                  </p>
                )}
              </div>
            </DashboardCard>
          </div>

          {/* Payment Form */}
          <div className="md:col-span-2">
            <DashboardCard title="تفاصيل الدفع" icon="receipt">
              <div className="space-y-6">
                {/* Price Info */}
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400">{getPriceLabel()}</span>
                  <span className="text-white font-bold text-lg">{basePrice} ج.م</span>
                </div>

                {/* Months Selection */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">فترة الاشتراك</span>
                    <span className="text-primary font-bold">{months} شهور</span>
                  </div>
                  
                  {/* Month Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {(() => {
                      const today = new Date();
                      const subEnd = subscriptionEnd;
                      let effectiveStartDate = subEnd && subEnd > today ? subEnd : today;
                      
                      if (subEnd && subEnd > today) {
                        const nextDay = new Date(subEnd);
                        nextDay.setDate(nextDay.getDate() + 1);
                        effectiveStartDate = nextDay;
                      }
                      
                      const gridStart = new Date(today.getFullYear(), today.getMonth(), 1);
                      
                      // Pre-calculate data for all months
                      const monthsData = Array.from({ length: 12 }).map((_, i) => {
                        const date = new Date(gridStart.getFullYear(), gridStart.getMonth() + i, 1);
                        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
                        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                        
                        const isPaid = subEnd ? date < subEnd && monthEnd < subEnd : false;
                        
                        const paymentLog = isPaid ? paymentLogs.find(log => {
                          if (log.start_date && log.end_date) {
                            const logStart = new Date(log.start_date);
                            const logEnd = new Date(log.end_date);
                            return logStart <= monthEnd && logEnd >= monthStart;
                          }
                          return true;
                        }) : null;
                        
                        return { date, isPaid, paymentLog };
                      });

                      const buttons = [];
                      let i = 0;
                      while (i < 12) {
                        const data = monthsData[i];
                        const { date, isPaid, paymentLog } = data;
                        
                        let span = 1;
                        let label = new Intl.DateTimeFormat('ar-EG', { month: 'short' }).format(date);
                        
                        // If paid, check for connected months
                        if (isPaid && paymentLog) {
                          while (i + span < 12) {
                            const nextData = monthsData[i + span];
                            if (nextData.paymentLog?.id === paymentLog.id) {
                              span++;
                            } else {
                              break;
                            }
                          }
                          
                          if (span > 1) {
                            if (span <= 3) {
                              const monthNames = [];
                              for (let k = 0; k < span; k++) {
                                monthNames.push(new Intl.DateTimeFormat('ar-EG', { month: 'short' }).format(monthsData[i + k].date));
                              }
                              label = monthNames.join('، ');
                            } else {
                              const endDate = monthsData[i + span - 1].date;
                              label += ' - ' + new Intl.DateTimeFormat('ar-EG', { month: 'short' }).format(endDate);
                            }
                          }
                        }

                        const paymentEnd = new Date(effectiveStartDate);
                        paymentEnd.setMonth(paymentEnd.getMonth() + months);
                        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                        const isSelected = monthEnd <= paymentEnd && monthEnd >= effectiveStartDate;
                        
                        const colors = paymentLog ? getPaymentColor(paymentLog.id) : null;
                        
                        const colSpanClass = {
                          1: 'col-span-1',
                          2: 'col-span-2',
                          3: 'col-span-3',
                          4: 'col-span-4',
                        }[Math.min(span, 4)] || 'col-span-1';

                        buttons.push(
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              if (isPaid) {
                                setShowHistoryModal(true);
                                return;
                              }
                              
                              let diff = (date.getFullYear() - effectiveStartDate.getFullYear()) * 12 + (date.getMonth() - effectiveStartDate.getMonth());
                              setMonths(Math.max(1, diff + 1));
                            }}
                            style={isPaid && colors ? {
                              backgroundColor: colors.bg,
                              borderColor: colors.border,
                              color: colors.text
                            } : undefined}
                            className={`
                              relative p-2 text-sm font-medium transition-all border w-full rounded-lg
                              ${colSpanClass}
                              ${isPaid
                                ? 'cursor-not-allowed opacity-90'
                                : isSelected
                                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'
                              }
                            `}
                          >
                            <div className="flex flex-col items-center">
                              <span>{label}</span>
                              <span className="text-[10px] opacity-70">{date.getFullYear()}</span>
                            </div>
                            
                            {isPaid && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full flex items-center justify-center text-[10px] text-white">
                                <Icon name="check" className="text-xs" />
                              </div>
                            )}
                          </button>
                        );
                        
                        i += span;
                      }
                      return buttons;
                    })()}
                  </div>
                  
                  {/* Manual Counter */}
                  <div className="flex justify-center mt-2">
                    <div className="flex items-center gap-4 bg-white/5 rounded-lg p-1">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setMonths(Math.max(1, months - 1))}
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                      >
                        <Icon name="minus" className="text-xs" />
                      </Button>
                      <span className="text-white font-bold w-8 text-center text-sm">{months}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setMonths(months + 1)}
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                      >
                        <Icon name="plus" className="text-xs" />
                      </Button>
                    </div>
                  </div>

                  {/* Subscription End Date Display */}
                  <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10 flex justify-between items-center">
                    <span className="text-gray-400 text-sm">سينتهي الاشتراك في:</span>
                    <span className="text-white font-bold dir-ltr">
                      {(() => {
                        const end = new Date(startDate);
                        end.setMonth(end.getMonth() + months);
                        return new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }).format(end);
                      })()}
                    </span>
                  </div>
                </div>

                {/* Discount Input */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">خصم (%)</span>
                  <div className="relative w-32">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={discount}
                      onChange={(e) => {
                        const val = isNaN(parseFloat(e.target.value)) ? 0 : parseFloat(e.target.value);
                        if (val >= 0 && val <= 100) setDiscount(val);
                      }}
                      className="w-full p-3 bg-white/10 border-white/10 rounded-lg text-center font-bold"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                  </div>
                </div>

                <div className="h-px bg-white/10 my-4"></div>

                {/* Total */}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-300 font-medium text-lg">الإجمالي</span>
                  <div className="text-right">
                    {discount > 0 && (
                      <div className="text-sm text-gray-500 line-through mb-1">
                        {basePrice * months} ج.م
                      </div>
                    )}
                    <span className="text-primary font-bold text-3xl">{totalRequired} ج.م</span>
                  </div>
                </div>



                {/* Notes */}
                <div>
                  <label className="block text-gray-300 text-sm mb-2">ملاحظات (اختياري)</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="ملاحظات إضافية..."
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="button"
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  variant="primary"
                  size="lg"
                  className="w-full py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/20"
                >
                  <Icon name="check-circle" />
                  تأكيد وتفعيل
                </Button>
              </div>
            </DashboardCard>
          </div>
        </div>
      </div>

      {/* History Modal */}
      <FormModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        onSubmit={() => setShowHistoryModal(false)}
        title="سجل الدفعات"
        submitText="إغلاق"
        cancelText=""
        maxWidth="500px"
      >
        {paymentLogs.length > 0 ? (
                paymentLogs.map((log) => (
                  <div key={log.id} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:border-primary/30 transition-all duration-300 group">
                    {/* Header: Amount & Date */}
                    <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                          <i className="fas fa-receipt text-lg"></i>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-white flex items-center gap-2">
                            {log.amount} ج.م
                            {log.notes && log.notes.includes('خصم') && (
                              <Badge variant="danger" size="sm">خصم</Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 flex items-center gap-2">
                            <i className="far fa-clock"></i>
                            {new Date(log.created_at).toLocaleDateString('ar-EG', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>
                      <Badge variant="success" size="sm">مكتمل</Badge>
                    </div>

                    {/* Details Grid */}
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                        <div className="text-xs text-gray-500 mb-1">عدد الأشهر</div>
                        <div className="text-white font-bold flex items-center gap-2">
                          <i className="fas fa-calendar-check text-primary/70"></i>
                          {log.months} شهور
                        </div>
                      </div>
                      <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                        <div className="text-xs text-gray-500 mb-1">كود التأكيد</div>
                        <div className="text-white font-bold flex items-center gap-2 font-mono">
                          <i className="fas fa-hashtag text-primary/70"></i>
                          {log.confirmation_code || '---'}
                        </div>
                      </div>
                    </div>

                    {/* Period Info */}
                    {log.start_date && log.end_date && (
                      <div className="px-4 pb-4">
                        <div className="bg-black/20 rounded-lg p-3 border border-white/5 flex items-center justify-between">
                          <div className="text-xs text-gray-500">الفترة المغطاة</div>
                          <div className="text-white font-bold flex items-center gap-2 text-sm">
                            <i className="fas fa-calendar-alt text-primary/70"></i>
                            <span dir="ltr">
                              {new Date(log.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} 
                              {' - '}
                              {new Date(log.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        
                        {/* List of Months */}
                        <div className="mt-2 bg-black/20 rounded-lg p-3 border border-white/5">
                          <div className="text-xs text-gray-500 mb-1">الأشهر المدفوعة</div>
                          <div className="text-white text-sm leading-relaxed">
                            {getCoveredMonths(log.start_date, log.end_date).map((month, idx) => (
                              <span key={idx} className="inline-block bg-white/10 px-2 py-0.5 rounded text-xs mx-0.5 mb-1">
                                {month}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {log.notes && (
                      <div className="px-4 pb-4">
                        <div className="bg-black/40 rounded-lg p-3 border border-white/5 text-xs text-gray-300 leading-relaxed">
                          <div className="flex items-center gap-2 text-gray-500 mb-2 border-b border-white/5 pb-1">
                            <i className="fas fa-info-circle"></i>
                            تفاصيل العملية
                          </div>
                          {log.notes.split('|').map((note, idx) => (
                            <div key={idx} className="mb-1 last:mb-0 flex items-start gap-2">
                              <span className="w-1 h-1 rounded-full bg-gray-500 mt-1.5 shrink-0"></span>
                              <span>{note.trim()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
          </div>
        ))
      ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-file-invoice text-2xl opacity-50"></i>
            </div>
            <p>لا يوجد سجل دفعات</p>
          </div>
        )}
      </FormModal>
    </DashboardLayout>
  );
}
