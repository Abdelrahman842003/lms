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
}

interface Student {
  id: string;
  name: string;
  enrolled_teachers?: Teacher[];
}

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

                      {/* Months Input */}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">عدد الأشهر</span>
                        <div className="flex items-center gap-4 bg-white/5 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => setMonths(Math.max(1, months - 1))}
                            className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                          >
                            <i className="fas fa-minus"></i>
                          </button>
                          <span className="text-white font-bold w-8 text-center text-lg">{months}</span>
                          <button
                            type="button"
                            onClick={() => setMonths(months + 1)}
                            className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                          >
                            <i className="fas fa-plus"></i>
                          </button>
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
    </DashboardLayout>
  );
}

export default withAcademyAuth(PaymentPage);
