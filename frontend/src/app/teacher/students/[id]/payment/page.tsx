'use client';

import React, { useState, useEffect, use } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/AuthContext';
import { getTeacherStudentDetails, getStudentActivationDetails, createTeacherStudentPayment } from '@/services/authService';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// Simple UUID generator to avoid external dependency
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
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
  const [selectedMonths, setSelectedMonths] = useState<number>(1);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');
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

  // Calculations
  const getBasePrice = () => {
    if (!activationDetails?.pricing_options) return 0;
    // Use the default option or the first one
    const option = activationDetails.pricing_options.find((o: any) => o.is_default) || activationDetails.pricing_options[0];
    return option ? option.base_price : 0;
  };

  const basePrice = getBasePrice();
  const platformFee = activationDetails?.platform_fee || 0;
  
  const subTotal = basePrice * selectedMonths;
  const discountAmount = subTotal * (discount / 100);
  const teacherAmount = subTotal - discountAmount;
  const totalCommission = platformFee * selectedMonths;
  const totalRequired = teacherAmount + totalCommission;

  const handleSubmit = async () => {
    if (selectedMonths < 1) {
      toast.error('يجب اختيار شهر واحد على الأقل');
      return;
    }

    try {
      setIsSubmitting(true);
      await createTeacherStudentPayment(id, {
        months: selectedMonths,
        discount: discount,
        notes: notes,
        client_side_uuid: generateUUID(),
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
          <i className="fas fa-spinner fa-spin text-4xl text-primary"></i>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="teacher" user={user || undefined}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="btn btn-outline btn-sm">
            <i className="fas fa-arrow-right"></i>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">تسجيل دفعة جديدة</h1>
            <p className="text-gray-400 text-sm">
              الطالب: <span className="text-primary font-bold">{student?.name}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Month Selection */}
            <DashboardCard title="فترة الاشتراك" icon="fas fa-calendar-alt">
              <div className="p-4">
                <div className="flex items-center justify-between mb-6 bg-white/5 p-4 rounded-xl">
                  <span className="text-gray-300">عدد الشهور</span>
                  <div className="flex items-center gap-4">
                    <button 
                      className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl transition-colors"
                      onClick={() => setSelectedMonths(Math.max(1, selectedMonths - 1))}
                    >
                      -
                    </button>
                    <span className="text-2xl font-bold text-white w-8 text-center">{selectedMonths}</span>
                    <button 
                      className="w-10 h-10 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary flex items-center justify-center text-xl transition-colors"
                      onClick={() => setSelectedMonths(Math.min(12, selectedMonths + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Visual Representation (Optional) */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div 
                      key={i}
                      className={`
                        p-3 rounded-lg text-center text-sm font-medium border transition-all
                        ${i < selectedMonths 
                          ? 'bg-primary/20 border-primary text-primary' 
                          : 'bg-transparent border-white/10 text-gray-500'}
                      `}
                    >
                      شهر {i + 1}
                    </div>
                  ))}
                </div>
              </div>
            </DashboardCard>

            {/* Discount & Notes */}
            <DashboardCard title="تفاصيل إضافية" icon="fas fa-tag">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">نسبة الخصم (%)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100"
                    value={discount}
                    onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">ملاحظات</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                    placeholder="أي ملاحظات إضافية..."
                  />
                </div>
              </div>
            </DashboardCard>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <DashboardCard title="ملخص الدفع" icon="fas fa-receipt">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">سعر الشهر</span>
                  <span className="text-white font-mono">{basePrice} ج.م</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">عدد الشهور</span>
                  <span className="text-white font-mono">× {selectedMonths}</span>
                </div>
                <div className="border-t border-white/10 my-2"></div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">المجموع الفرعي</span>
                  <span className="text-white font-mono">{subTotal} ج.م</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between items-center text-sm text-warning">
                    <span>خصم ({discount}%)</span>
                    <span className="font-mono">-{discountAmount} ج.م</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">صافي للمدرس</span>
                  <span className="text-white font-mono">{teacherAmount} ج.م</span>
                </div>

                <div className="bg-white/5 p-3 rounded-lg mt-2">
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="text-gray-400">رسوم المنصة</span>
                    <span className="text-gray-300 font-mono">{platformFee} × {selectedMonths}</span>
                  </div>
                  <div className="flex justify-between items-center font-medium">
                    <span className="text-gray-300">إجمالي الرسوم</span>
                    <span className="text-white font-mono">{totalCommission} ج.م</span>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-lg font-bold text-white">الإجمالي المطلوب</span>
                  </div>
                  <div className="text-3xl font-bold text-primary font-mono text-left" dir="ltr">
                    {totalRequired} <span className="text-sm text-gray-400">EGP</span>
                  </div>
                </div>

                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="btn btn-primary w-full py-3 text-lg font-bold mt-4 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                >
                  {isSubmitting ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <>
                      <i className="fas fa-check-circle"></i>
                      <span>تأكيد وتسجيل الدفعة</span>
                    </>
                  )}
                </button>
              </div>
            </DashboardCard>

            {/* History Link */}
            <div 
              onClick={() => setShowHistoryModal(true)}
              className="bg-[#1a1f37] border border-white/5 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <i className="fas fa-history text-gray-400 group-hover:text-primary"></i>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">سجل المدفوعات</h3>
                  <p className="text-xs text-gray-400">عرض العمليات السابقة</p>
                </div>
              </div>
              <i className="fas fa-chevron-left text-gray-500 group-hover:text-white transition-colors"></i>
            </div>
          </div>
        </div>

        {/* History Modal */}
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1a1f37] w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">سجل مدفوعات الطالب</h3>
                <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-white">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-4">
                {student?.payment_logs && student.payment_logs.length > 0 ? (
                  <div className="space-y-3">
                    {student.payment_logs.map((log: any) => (
                      <div key={log.id} className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-bold text-white text-lg">{log.amount} ج.م</div>
                            <div className="text-xs text-gray-400 mt-1">
                              <i className="fas fa-clock ml-1"></i>
                              {new Date(log.created_at).toLocaleDateString('ar-EG')}
                            </div>
                          </div>
                          <span className="badge badge-success">مكتمل</span>
                        </div>
                        <div className="text-sm text-gray-300 bg-black/20 p-2 rounded mt-2">
                          {log.notes}
                        </div>
                        <div className="flex gap-2 mt-3 text-xs text-gray-400">
                          <span className="bg-white/5 px-2 py-1 rounded">
                            {log.months} شهور
                          </span>
                          <span className="bg-white/5 px-2 py-1 rounded font-mono">
                            {log.confirmation_code}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    لا يوجد سجل مدفوعات
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
