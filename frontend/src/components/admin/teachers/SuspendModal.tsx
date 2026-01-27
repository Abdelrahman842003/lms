import React, { useState } from 'react';
import FormModal from '@/components/ui/FormModal';
import { toggleTeacherStatus, toggleIndependentStatus, toggleTeacherAcademyStatus } from '@/services/authService';
import { toast } from 'react-hot-toast';

interface SuspendModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: any;
  onSuccess: () => void;
}

export default function SuspendModal({ isOpen, onClose, teacher, onSuccess }: SuspendModalProps) {
  const [processing, setProcessing] = useState<string | null>(null);

  if (!teacher) return null;

  const handleGlobalToggle = async () => {
    setProcessing('global');
    try {
      await toggleTeacherStatus(teacher.id);
      toast.success('تم تغيير حالة الحساب بنجاح');
      onSuccess();
    } catch (error) {
      console.error('Failed to toggle global status', error);
      toast.error('فشل تغيير حالة الحساب');
    } finally {
      setProcessing(null);
    }
  };

  const handleIndependentToggle = async () => {
    setProcessing('independent');
    try {
      await toggleIndependentStatus(teacher.id);
      toast.success('تم تغيير حالة المستقل بنجاح');
      onSuccess();
    } catch (error) {
      console.error('Failed to toggle independent status', error);
      toast.error('فشل تغيير حالة المستقل');
    } finally {
      setProcessing(null);
    }
  };

  const handleAcademyToggle = async (academyId: string) => {
    setProcessing(`academy-${academyId}`);
    try {
      await toggleTeacherAcademyStatus(teacher.id, academyId);
      toast.success('تم تغيير حالة المدرس في الأكاديمية بنجاح');
      onSuccess();
    } catch (error) {
      console.error('Failed to toggle academy status', error);
      toast.error('فشل تغيير حالة المدرس في الأكاديمية');
    } finally {
      setProcessing(null);
    }
  };

  const isGlobalSuspended = teacher.status_key === 'suspended';
  const isIndependentActive = teacher.is_independent_active;
  const hasIndependent = teacher.affiliation === 'independent' || teacher.affiliation === 'both';
  const academies = teacher.academies || [];

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => e.preventDefault()}
      title="إدارة حالة المدرس"
      submitText="إغلاق"
      maxWidth="500px"
    >
      <div className="space-y-6">
        {/* Global Status */}
        <div className="bg-white/5 p-4 rounded-lg border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-white font-medium">الحساب العام</h4>
              <p className="text-gray-400 text-xs">تعليق الحساب بالكامل (يمنع الدخول للنظام)</p>
            </div>
            <button
              type="button"
              onClick={handleGlobalToggle}
              disabled={!!processing}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isGlobalSuspended
                  ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20'
                  : 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20'
              }`}
            >
              {processing === 'global' ? 'جاري التنفيذ...' : (isGlobalSuspended ? 'تنشيط الحساب' : 'تعليق الحساب')}
            </button>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4">
          <h4 className="text-gray-300 text-sm font-medium mb-3">التعليق الجزئي (حسب الجهة)</h4>
          
          <div className="space-y-3">
            {/* Independent Status */}
            {hasIndependent && (
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                    <i className="fas fa-user"></i>
                  </div>
                  <span className="text-gray-200">مدرس مستقل</span>
                </div>
                <button
                  type="button"
                  onClick={handleIndependentToggle}
                  disabled={!!processing || isGlobalSuspended}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    !isIndependentActive
                      ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20'
                      : 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20'
                  } ${isGlobalSuspended ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {processing === 'independent' ? '...' : (!isIndependentActive ? 'تنشيط' : 'تعليق')}
                </button>
              </div>
            )}

            {/* Academies Status */}
            {academies.map((academy: any) => (
              <div key={academy.id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500">
                    <i className="fas fa-university"></i>
                  </div>
                  <span className="text-gray-200">{academy.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAcademyToggle(academy.id)}
                  disabled={!!processing || isGlobalSuspended}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    !academy.pivot.is_active
                      ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20'
                      : 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20'
                  } ${isGlobalSuspended ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {processing === `academy-${academy.id}` ? '...' : (!academy.pivot.is_active ? 'تنشيط' : 'تعليق')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FormModal>
  );
}
