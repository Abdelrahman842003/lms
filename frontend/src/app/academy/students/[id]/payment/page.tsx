'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/AuthContext';
import { withAcademyAuth } from '@/components/auth/withAcademyAuth';
import { fetchApi } from '@/services/authService';
import { getAcademyStudentDetails } from '@/services/academyService';
import toast from 'react-hot-toast';

interface Teacher {
  id: string;
  name: string;
  grade_name?: string;
  group_name?: string;
  group_price?: number;
  grade_price?: number;
  subscription_end?: string;
}

interface PaymentLog {
  id: string;
  amount: number;
  months: number;
  created_at: string;
  teacher?: { id: string; name: string };
  notes?: string;
  payment_method?: string;
  confirmation_code?: string;
  start_date?: string;
  end_date?: string;
}

interface Student {
  id: string;
  name: string;
  enrolled_teachers?: Teacher[];
  subscription_history?: PaymentLog[];
}


  
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



const getCoveredMonths = (start: string, end: string) => {
  const monthsList = [];
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  // Start from the month of the start date
  let current = new Date(startDate.getFullYear(), startDate.getMonth(), 15); // Middle of month to be safe
  
  while (current < endDate) {
    monthsList.push(new Intl.DateTimeFormat('ar-EG', { month: 'long' }).format(current));
    current.setMonth(current.getMonth() + 1);
  }
  
  return monthsList;
};

function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Payment State
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [months, setMonths] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [academyStudentPrice, setAcademyStudentPrice] = useState(0);

  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [teacherHistory, setTeacherHistory] = useState<PaymentLog[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());

  // Fetch Student & Settings
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch Student Details
        const studentData = await getAcademyStudentDetails(id);
        setStudent(studentData);

        // Fetch Settings
        const settings = await fetchApi('/public-settings');
        if (settings.academy_student_price) {
          setAcademyStudentPrice(parseFloat(settings.academy_student_price));
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('فشل تحميل بيانات الطالب');
        router.push('/academy/students');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, router]);

  // Update startDate when selectedTeacher changes
  useEffect(() => {
    const today = new Date();
    const subEnd = selectedTeacher?.subscription_end ? new Date(selectedTeacher.subscription_end) : null;
    
    if (subEnd && subEnd > today) {
      const nextDay = new Date(subEnd);
      nextDay.setDate(nextDay.getDate() + 1);
      setStartDate(nextDay);
    } else {
      setStartDate(today);
    }
  }, [selectedTeacher]);

  // Calculate price and total
  const getPrice = () => {
    if (!selectedTeacher) return 0;
    // Priority: Group Price > Grade Price
    if (selectedTeacher.group_price && selectedTeacher.group_price > 0) {
      return selectedTeacher.group_price;
    }
    return selectedTeacher.grade_price || 0;
  };

  const getPriceLabel = () => {
    if (!selectedTeacher) return '';
    if (selectedTeacher.group_price && selectedTeacher.group_price > 0) {
      return 'سعر المجموعة';
    }
    return 'سعر الصف';
  };

  const price = getPrice();
  const subTotal = price * months;
  const total = subTotal * (1 - discount / 100);
  const commission = academyStudentPrice * months;
  const grandTotal = total + commission;

  // Auto-generate notes
  useEffect(() => {
    if (!selectedTeacher) return;

    const autoNotes = [];
    if (months > 1) {
      autoNotes.push(`عدد الأشهر: ${months}`);
    }
    if (discount > 0) {
      autoNotes.push(`خصم: ${discount}%`);
    }
    
    autoNotes.push(`السعر الأساسي: ${price} × ${months} = ${subTotal} ج.م`);
    
    if (discount > 0) {
      autoNotes.push(`المبلغ بعد الخصم: ${total} ج.م`);
    }
    
    if (commission > 0) {
      autoNotes.push(`حساب المنصة: ${commission} ج.م`);
    }
    
    autoNotes.push(`الإجمالي المطلوب: ${grandTotal} ج.م`);
    
    setNotes(autoNotes.join(' | '));
  }, [months, discount, price, subTotal, total, commission, grandTotal, selectedTeacher]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTeacher) {
      toast.error('اختر المدرس');
      return;
    }

    if (months < 1) {
      toast.error('عدد الأشهر يجب أن يكون 1 على الأقل');
      return;
    }

    setIsSubmitting(true);
    try {
      await fetchApi('/api/academy/payments', {
        method: 'POST',
        body: JSON.stringify({
          student_id: id,
          teacher_id: selectedTeacher.id,
          months: months,
          discount: discount,
          notes: notes || undefined,
          client_side_uuid: crypto.randomUUID(),
          start_date: startDate.toISOString().split('T')[0],
        }),
      });

      toast.success('تم تسجيل الدفعة بنجاح');
      router.push('/academy/students');
    } catch (error: any) {
      toast.error(error.message || 'فشل في تسجيل الدفعة');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="academy" user={user || undefined}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!student) return null;

  return (
    <DashboardLayout role="academy" user={user || undefined}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <i className="fas fa-money-bill-wave text-primary"></i>
            تسجيل دفعة جديدة
          </h1>
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <i className="fas fa-arrow-right"></i>
            عودة
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Student Info Card */}
          <div className="md:col-span-1">
            <DashboardCard title="بيانات الطالب" icon="fas fa-user">
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary text-2xl font-bold">
                  {student.name.charAt(0)}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{student.name}</h3>
                <p className="text-gray-400 text-sm">ID: {student.id.substring(0, 8)}</p>
              </div>
            </DashboardCard>
          </div>

          {/* Payment Form */}
          <div className="md:col-span-2">
            <DashboardCard title="تفاصيل الدفع" icon="fas fa-receipt">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Teacher Selection */}
                <div>
                  <label className="block text-gray-300 text-sm mb-3">اختر المدرس</label>
                  <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                    {student.enrolled_teachers && student.enrolled_teachers.length > 0 ? (
                      student.enrolled_teachers.map((teacher) => (
                        <button
                          key={teacher.id}
                          type="button"
                          onClick={() => setSelectedTeacher(teacher)}
                          className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between group ${
                            selectedTeacher?.id === teacher.id
                              ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary/10'
                              : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/10'
                          }`}
                        >
                          <div className="flex flex-col items-start gap-1">
                            <span className="font-bold text-lg">{teacher.name}</span>
                            <div className="flex items-center gap-2 text-xs opacity-70">
                              <span className="bg-white/10 px-2 py-0.5 rounded">{teacher.group_name || 'بدون مجموعة'}</span>
                              <span className="bg-white/10 px-2 py-0.5 rounded">{teacher.grade_name || 'بدون صف'}</span>
                            </div>
                          </div>
                          {selectedTeacher?.id === teacher.id && (
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-lg">
                              <i className="fas fa-check"></i>
                            </div>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500 bg-white/5 rounded-xl border border-white/5 border-dashed">
                        <i className="fas fa-chalkboard-teacher text-3xl mb-2 opacity-50"></i>
                        <p>الطالب غير مرتبط بأي مدرس</p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedTeacher && (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-6">
                    <div className="bg-white/5 rounded-xl p-6 border border-white/5 space-y-5">
                      {/* Price Info */}
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-400">{getPriceLabel()}</span>
                        <span className="text-white font-bold text-lg">{price} ج.م</span>
                      </div>

                      {/* Months Selection */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">فترة الاشتراك</span>
                          <span className="text-primary font-bold">{months} شهور</span>
                        </div>
                        
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {(() => {
                            const today = new Date();
                            const subEnd = selectedTeacher.subscription_end ? new Date(selectedTeacher.subscription_end) : null;
                            let startDate = subEnd && subEnd > today ? subEnd : today;
                            
                            // If subEnd exists, start from next day
                            if (subEnd && subEnd > today) {
                              const nextDay = new Date(subEnd);
                              nextDay.setDate(nextDay.getDate() + 1);
                              startDate = nextDay;
                            }
                            const gridStart = new Date(today.getFullYear(), today.getMonth(), 1);
                            
                            // Pre-calculate data for all months to handle connections
                            const monthsData = Array.from({ length: 12 }).map((_, i) => {
                              const date = new Date(gridStart.getFullYear(), gridStart.getMonth() + i, 1);
                              const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
                              const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                              
                              const isPaid = subEnd ? date < subEnd && monthEnd < subEnd : false;
                              
                              const paymentLog = isPaid ? student.subscription_history?.find(log => {
                                if (log.teacher?.id !== selectedTeacher.id) return false;
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

                              const paymentEnd = new Date(startDate);
                              paymentEnd.setMonth(paymentEnd.getMonth() + months);
                              const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                              const isSelected = monthEnd <= paymentEnd && monthEnd >= startDate;
                              
                              const colors = paymentLog ? getPaymentColor(paymentLog.id) : null;
                              
                              const colSpanClass = {
                                1: 'col-span-1',
                                2: 'col-span-2',
                                3: 'col-span-3',
                                4: 'col-span-4',
                                5: 'col-span-5',
                                6: 'col-span-6',
                                7: 'col-span-7',
                                8: 'col-span-8',
                                9: 'col-span-9',
                                10: 'col-span-10',
                                11: 'col-span-11',
                                12: 'col-span-12',
                              }[span] || 'col-span-1';

                              buttons.push(
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    if (isPaid) {
                                      const history = student.subscription_history?.filter(log => {
                                        if (log.teacher?.id !== selectedTeacher.id) return false;
                                        if (log.start_date && log.end_date) {
                                          const logStart = new Date(log.start_date);
                                          const logEnd = new Date(log.end_date);
                                          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
                                          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                                          return logStart <= monthEnd && logEnd >= monthStart;
                                        }
                                        return true;
                                      }) || [];
                                      setTeacherHistory(history);
                                      setShowHistoryModal(true);
                                      return;
                                    }
                                    
                                    // Calculate effective start date to match grid logic
                                    const today = new Date();
                                    const subEnd = selectedTeacher.subscription_end ? new Date(selectedTeacher.subscription_end) : null;
                                    let effectiveStartDate = subEnd && subEnd > today ? subEnd : today;
                                    
                                    if (subEnd && subEnd > today) {
                                      const nextDay = new Date(subEnd);
                                      nextDay.setDate(nextDay.getDate() + 1);
                                      effectiveStartDate = nextDay;
                                    }
                                    
                                    const targetEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
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
                                      <i className="fas fa-check"></i>
                                    </div>
                                  )}
                                </button>
                              );
                              
                              i += span;
                            }
                            return buttons;
                          })()}
                        </div>
                        
                        {/* Manual Counter Fallback */}
                        <div className="flex justify-center mt-2">
                           <div className="flex items-center gap-4 bg-white/5 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => setMonths(Math.max(1, months - 1))}
                                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                              >
                                <i className="fas fa-minus text-xs"></i>
                              </button>
                              <span className="text-white font-bold w-8 text-center text-sm">{months}</span>
                              <button
                                type="button"
                                onClick={() => setMonths(months + 1)}
                                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                              >
                                <i className="fas fa-plus text-xs"></i>
                              </button>
                            </div>
                        </div>

                        {/* Subscription End Date Display */}
                        <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10 flex justify-between items-center">
                          <span className="text-gray-400 text-sm">سينتهي الاشتراك في:</span>
                          <span className="text-white font-bold dir-ltr">
                            {(() => {
                                const today = new Date();
                                const subEnd = selectedTeacher.subscription_end ? new Date(selectedTeacher.subscription_end) : null;
                                const startDate = subEnd && subEnd > today ? subEnd : today;
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
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={discount}
                            onChange={(e) => {
                              const val = isNaN(parseFloat(e.target.value)) ? 0 : parseFloat(e.target.value);
                              if (val >= 0 && val <= 100) setDiscount(val);
                            }}
                            className="w-full p-3 bg-white/10 border border-white/10 rounded-lg text-center text-white outline-none focus:border-primary font-bold"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                        </div>
                      </div>

                      <div className="h-px bg-white/10 my-4"></div>

                      {/* Commission Info */}
                      <div className="flex justify-between items-center text-sm p-3 bg-warning/10 rounded-lg border border-warning/10">
                        <span className="text-warning">حساب المنصة</span>
                        <span className="text-warning font-bold">{commission} ج.م</span>
                      </div>

                      {/* Total */}
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-gray-300 font-medium text-lg">الإجمالي (للمدرس)</span>
                        <div className="text-right">
                          {discount > 0 && (
                            <div className="text-sm text-gray-500 line-through mb-1">
                              {price * months} ج.م
                            </div>
                          )}
                          <span className="text-primary font-bold text-3xl">{total} ج.م</span>
                        </div>
                      </div>

                      {/* Grand Total */}
                      <div className="flex justify-between items-center pt-4 border-t border-white/10 mt-4">
                        <span className="text-white font-bold text-xl">الإجمالي المطلوب من الطالب</span>
                        <span className="text-white font-bold text-3xl">{grandTotal} ج.م</span>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">ملاحظات (اختياري)</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="ملاحظات إضافية..."
                        rows={3}
                        className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary outline-none resize-none transition-all focus:bg-white/10"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-primary text-white rounded-xl hover:bg-primary/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
                    >
                      {isSubmitting ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          جاري التسجيل...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check-circle"></i>
                          تسجيل الدفعة
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </DashboardCard>
          </div>
        </div>
      </div>
      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1e1e2d] rounded-xl border border-white/10 w-full max-w-lg overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <i className="fas fa-history text-primary"></i>
                سجل الدفعات - {selectedTeacher?.name}
              </h3>
              <button 
                onClick={() => setShowHistoryModal(false)} 
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-4 space-y-4">
              {teacherHistory.length > 0 ? (
                teacherHistory.map((log) => (
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
                              <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">خصم</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 flex items-center gap-2">
                            <i className="far fa-clock"></i>
                            {new Date(log.created_at).toLocaleDateString('ar-EG', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                         <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                           log.payment_method === 'cash' || !log.payment_method
                             ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                             : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                         }`}>
                           {log.payment_method === 'cash' || !log.payment_method ? 'نقدي' : log.payment_method}
                         </span>
                      </div>
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
                  <p>لا يوجد سجل دفعات لهذا المدرس</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-white/10 bg-white/5">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default withAcademyAuth(PaymentPage);
