'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { updateTeacherPlan } from '@/services/authService';
import { useSettings } from '@/contexts/SettingsContext';
import { generateInvoicePDF } from '@/utils/generateInvoicePDF';

interface SubscriptionPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: any;
  onSuccess: () => void;
}

export default function SubscriptionPlanModal({
  isOpen,
  onClose,
  teacher,
  onSuccess
}: SubscriptionPlanModalProps) {
  const { settings } = useSettings();
  const pricePerStudent = parseFloat(settings.pricePerStudent || '15');
  
  const [activeTab, setActiveTab] = useState<'trial' | 'term' | 'custom'>('trial');
  const [loading, setLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  
  // Form State
  const [days, setDays] = useState(14);
  const [termDuration, setTermDuration] = useState<6 | 12>(6);
  const [maxStudents, setMaxStudents] = useState<number | ''>(50);
  const [isUnlimitedStudents, setIsUnlimitedStudents] = useState(false);

  useEffect(() => {
    if (isOpen && teacher) {
      // Initialize with teacher's current plan if available
      if (teacher.plan_type) {
         if (teacher.plan_type === 'trial') {
             setActiveTab('trial');
             // Try to calculate remaining days or default? Default is safer.
         } else if (teacher.plan_type === 'term') {
             setActiveTab('term');
             // Infer duration? defaulting to 6 is fine.
         } else {
             setActiveTab('custom');
         }
      }
      
      if (teacher.plan_max_students) {
          setMaxStudents(teacher.plan_max_students);
          setIsUnlimitedStudents(false);
      } else if (teacher.is_unlimited_students) {
          setIsUnlimitedStudents(true);
      }
    }
  }, [isOpen, teacher]);

  // Calculate current plan financial info
  const getCurrentPlanFinancials = () => {
    if (!teacher?.plan_type || !teacher?.plan_expires_at || !teacher?.created_at) {
      return null;
    }

    const today = new Date();
    const expiresAt = new Date(teacher.plan_expires_at);
    const createdAt = new Date(teacher.created_at);
    
    // Calculate total months of the plan
    const totalMonths = Math.round((expiresAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    // Calculate remaining months
    const remainingDays = Math.max(0, Math.ceil((expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    const remainingMonths = Math.floor(remainingDays / 30);
    
    // Calculate costs
    const studentsCount = teacher.is_unlimited_students ? 0 : (teacher.plan_max_students || 50);
    const totalPaid = totalMonths * studentsCount * pricePerStudent;
    const remainingValue = remainingMonths * studentsCount * pricePerStudent;
    
    return {
      totalMonths,
      remainingMonths,
      remainingDays,
      studentsCount,
      totalPaid,
      remainingValue
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        type: activeTab,
        is_unlimited_students: isUnlimitedStudents,
        max_students: isUnlimitedStudents ? null : (maxStudents === '' ? 0 : Number(maxStudents))
      };

      if (activeTab === 'trial' || activeTab === 'custom') {
        payload.days = Number(days);
      } else if (activeTab === 'term') {
        payload.months = termDuration;
      }

      await updateTeacherPlan(teacher.id, payload);
      toast.success('تم تحديث نظام الباقة بنجاح');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل تحديث الباقة');
    } finally {
      setLoading(false);
    }
  };

  const handleExportInvoice = async () => {
    if (!teacher) return;
    
    setExportingPdf(true);
    try {
      const hasExistingPlan = teacher?.plan_type !== null && teacher?.plan_type !== undefined;
      const months = activeTab === 'term' ? termDuration : (days / 30);
      const studentsCount = isUnlimitedStudents ? 0 : (maxStudents === '' ? 50 : Number(maxStudents));
      const baseCost = studentsCount * months * pricePerStudent;
      
      // Get discount from current plan
      const financials = getCurrentPlanFinancials();
      const discount = financials?.remainingValue || 0;
      const finalCost = Math.max(0, baseCost - discount);
      
      let durationText = '';
      if (activeTab === 'trial') {
        durationText = `${days} يوم (تجريبي)`;
      } else if (activeTab === 'term') {
        durationText = `${termDuration} شهر`;
      } else {
        durationText = `${days} يوم`;
      }
      
      const invoiceData = {
        teacher_name: teacher.name,
        teacher_email: teacher.email,
        teacher_phone: teacher.phone,
        plan_type: activeTab,
        duration_text: durationText,
        students_count: studentsCount,
        expires_at: new Date(Date.now() + (days * 24 * 60 * 60 * 1000)).toLocaleDateString('ar-EG'),
        total_paid: baseCost,
        base_cost: baseCost,
        discount: discount,
        final_cost: finalCost,
        is_current: false,
        // Old plan data
        old_plan: hasExistingPlan ? {
          plan_type: teacher.plan_type,
          duration_months: financials?.totalMonths || 0,
          remaining_months: financials?.remainingMonths || 0,
          students_count: financials?.studentsCount || 0,
          total_paid: financials?.totalPaid || 0,
          remaining_value: financials?.remainingValue || 0,
          expires_at: teacher.plan_expires_at,
        } : null,
      };

      await generateInvoicePDF(teacher.id, invoiceData);
      toast.success('جاري تحميل الفاتورة...');
      setTimeout(() => {
        toast('💡 نصيحة: في نافذة الطباعة، قم بإلغاء تحديد "Headers and footers" لإخفاء العنوان والتاريخ', {
          duration: 6000,
          icon: '📄',
        });
      }, 1000);
    } catch (error: any) {
      toast.error('فشل تصدير الفاتورة');
    } finally {
      setTimeout(() => setExportingPdf(false), 1000);
    }
  };

  if (!isOpen) return null;

  const hasExistingPlan = teacher?.plan_type !== null && teacher?.plan_type !== undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#1e1e2d] rounded-xl border border-white/10 w-full max-w-lg p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">
            {hasExistingPlan ? 'تعديل الباقة' : 'إعدادات الباقة'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Current Plan Info - Show only if plan exists */}
        {hasExistingPlan && (() => {
          const financials = getCurrentPlanFinancials();
          return (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <i className="fas fa-info-circle text-blue-400"></i>
                <h4 className="text-blue-400 font-semibold">الباقة الحالية</h4>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-400">النوع:</span>
                  <p className="text-white font-medium">
                    {teacher.plan_type === 'trial' ? 'تجريبية' : 
                     teacher.plan_type === 'term' ? 'مدة ثابتة' : 'مخصصة'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">عدد الطلاب:</span>
                  <p className="text-white font-medium">
                    {teacher.is_unlimited_students ? 'لا نهائي' : teacher.plan_max_students || 50}
                  </p>
                </div>
                {teacher.plan_expires_at && (
                  <div className="col-span-2">
                    <span className="text-gray-400">تنتهي في:</span>
                    <p className="text-white font-medium">
                      {new Date(teacher.plan_expires_at).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                )}
                
                {/* Financial Information */}
                {financials && financials.studentsCount > 0 && (
                  <>
                    <div className="col-span-2 border-t border-blue-500/20 pt-3 mt-2">
                      <span className="text-gray-400">المبلغ المدفوع:</span>
                      <p className="text-green-400 font-bold text-lg">
                        {Math.round(financials.totalPaid).toLocaleString()} ج.م
                      </p>
                    </div>
                    
                    {financials.remainingMonths > 0 && (
                      <>
                        <div>
                          <span className="text-gray-400">المدة المتبقية:</span>
                          <p className="text-yellow-400 font-medium">
                            {financials.remainingMonths} شهر
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">القيمة المتبقية:</span>
                          <p className="text-orange-400 font-bold">
                            {Math.round(financials.remainingValue).toLocaleString()} ج.م
                          </p>
                        </div>
                        <div className="col-span-2 bg-orange-500/10 border border-orange-500/30 rounded p-2 text-xs text-orange-300">
                          <i className="fas fa-info-circle mr-1"></i>
                          سيتم خصم القيمة المتبقية من الباقة الجديدة
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* Section Header for New Plan when editing */}
        {hasExistingPlan && (
          <div className="mb-4">
            <h4 className="text-white font-semibold flex items-center gap-2">
              <i className="fas fa-edit text-primary"></i>
              الباقة الجديدة
            </h4>
            <p className="text-gray-400 text-sm mt-1">اختر إعدادات الباقة الجديدة</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-[#151521] p-1 rounded-lg mb-6">
          <button
            onClick={() => {
              setActiveTab('trial');
              setDays(14);
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'trial' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            تجريبي
          </button>
          <button
            onClick={() => setActiveTab('term')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'term' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            مدة ثابتة
          </button>
          <button
            onClick={() => {
              setActiveTab('custom');
              setDays(90);
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'custom' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            مخصص
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {activeTab === 'trial' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                المدة (بالأيام)
              </label>
              <input
                type="number"
                min="1"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full bg-[#151521] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
              />
            </div>
          )}

          {activeTab === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                مدة الاشتراك
              </label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full bg-[#151521] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none appearance-none"
              >
                <option value={90}>3 شهور</option>
                <option value={180}>6 شهور</option>
                <option value={365}>سنة</option>
                <option value={548}>سنة ونصف</option>
                <option value={730}>سنتين</option>
              </select>
            </div>
          )}

          {/* Term Duration Selection */}
          {activeTab === 'term' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                مدة الاشتراك
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTermDuration(6)}
                  className={`py-3 px-4 rounded-lg border text-center transition-all ${
                    termDuration === 6
                      ? 'border-primary bg-primary/10 text-white'
                      : 'border-white/10 bg-[#151521] text-gray-400 hover:border-white/30'
                  }`}
                >
                  6 شهور
                </button>
                <button
                  type="button"
                  onClick={() => setTermDuration(12)}
                  className={`py-3 px-4 rounded-lg border text-center transition-all ${
                    termDuration === 12
                      ? 'border-primary bg-primary/10 text-white'
                      : 'border-white/10 bg-[#151521] text-gray-400 hover:border-white/30'
                  }`}
                >
                  سنة (12 شهر)
                </button>
              </div>
            </div>
          )}

          {/* Max Students Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-400">
                الحد الأقصى للطلاب
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={isUnlimitedStudents}
                  onChange={(e) => setIsUnlimitedStudents(e.target.checked)}
                  className="rounded border-gray-600 bg-[#151521] text-primary focus:ring-primary"
                />
                <span className="text-xs text-gray-400">عدد لا نهائي</span>
              </label>
            </div>
            
            <input
              type="number"
              min="0"
              value={maxStudents}
              onChange={(e) => setMaxStudents(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={isUnlimitedStudents}
              className={`w-full bg-[#151521] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none ${
                isUnlimitedStudents ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              placeholder={isUnlimitedStudents ? 'لا نهائي' : 'أدخل العدد'}
            />
          </div>

          {/* Calculated Price Display (For Term & Custom) */}
          {(activeTab === 'term' || activeTab === 'custom') && !isUnlimitedStudents && maxStudents !== '' && (() => {
            const months = activeTab === 'term' ? termDuration : (days / 30);
            const baseCost = Number(maxStudents) * months * pricePerStudent;
            const financials = getCurrentPlanFinancials();
            const discount = financials?.remainingValue || 0;
            const finalCost = Math.max(0, baseCost - discount);
            
            return (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-blue-400 text-sm">تكلفة الباقة الجديدة:</span>
                  <span className="text-white font-bold text-lg">
                    {Math.round(baseCost).toLocaleString()} ج.م
                  </span>
                </div>
                
                {discount > 0 && (
                  <>
                    <div className="flex justify-between items-center text-sm border-t border-blue-500/20 pt-2">
                      <span className="text-green-400">خصم القيمة المتبقية:</span>
                      <span className="text-green-400 font-bold">
                        - {Math.round(discount).toLocaleString()} ج.م
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center border-t border-blue-500/30 pt-2">
                      <span className="text-blue-300 font-medium">المبلغ النهائي:</span>
                      <span className="text-white font-bold text-xl">
                        {Math.round(finalCost).toLocaleString()} ج.م
                      </span>
                    </div>
                  </>
                )}
                
                {discount === 0 && (
                  <span className="text-xs text-gray-400 block">
                    (بناءً على {pricePerStudent}ج/طالب/شهر)
                  </span>
                )}
              </div>
            );
          })()}

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              إلغاء
            </button>
            {(activeTab === 'term' || activeTab === 'custom') && !isUnlimitedStudents && maxStudents !== '' && (
              <button
                type="button"
                onClick={handleExportInvoice}
                disabled={exportingPdf}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <i className="fas fa-file-pdf"></i>
                {exportingPdf ? 'جاري التصدير...' : 'تصدير فاتورة'}
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
