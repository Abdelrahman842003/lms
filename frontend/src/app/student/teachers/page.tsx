'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { TeacherInfo } from '@/services/authService';
import { LoadingSpinner, Icon } from '@/components/ui/index';

export default function StudentTeachersPage() {
  const router = useRouter();
  const { user, selectedTeacher, selectTeacher, isLoading: authLoading } = useAuth();
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  const [suspendedTeacher, setSuspendedTeacher] = useState<TeacherInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.replace('/login');
      return;
    }

    // Load teachers from localStorage
    try {
      const storedTeachers = localStorage.getItem('studentTeachers');
      if (storedTeachers) {
        setTeachers(JSON.parse(storedTeachers));
      }
    } catch (error) {
      console.error('Failed to load teachers:', error);
    }
    setIsLoading(false);
  }, [user, authLoading, router]);

  const handleSelectTeacher = (teacher: TeacherInfo) => {
    if (teacher.is_suspended) {
      setSuspendedTeacher(teacher);
      return;
    }
    selectTeacher(teacher);
    router.push('/student/dashboard');
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
        <LoadingSpinner size="lg" className="w-12 h-12" />
        <p>جاري التحميل...</p>
      </div>
    );
  }

  return (
    <DashboardLayout
      role="student"
      user={{ name: user?.name || 'الطالب', avatar: user?.avatar || '' }}
    >
      <div className="p-5">
      {/* Page Header */}
      <div className="relative mb-12 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] premium-glass premium-border overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 blur-[120px] -translate-y-1/2 translate-x-1/3 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/10 blur-[120px] translate-y-1/2 -translate-x-1/3"></div>

        <div className="relative flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-right">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-primary text-4xl shadow-2xl premium-border">
              <Icon name="chalkboard-teacher" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">قائمة المعلمين</h2>
              <p className="text-gray-light/60 text-lg font-medium">اختر المعلم الذي ترغب في متابعة محاضراته وامتحاناته</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-center md:items-end">
                <span className="text-[10px] font-black text-gray-light/30 uppercase tracking-[0.2em] mb-1">عدد الاشتراكات</span>
                <span className="text-xl font-black text-white">{teachers.length} معلم</span>
             </div>
          </div>
        </div>
      </div>

        {teachers.length === 0 ? (
          <div className="text-center p-[60px_20px] bg-white/3 rounded-2xl border border-white/5">
            <Icon name="user-slash" size="2x" className="text-[4rem] text-gray-light mb-5" />
            <h2 className="text-white mb-2.5">لا توجد اشتراكات</h2>
            <p className="text-gray-light">لم تقم بالاشتراك مع أي مدرس بعد. تواصل مع مدرسك للاشتراك.</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
            {teachers.map((teacher) => {
              const isSelected = selectedTeacher
                ? (selectedTeacher.enrollment_id && teacher.enrollment_id
                    ? selectedTeacher.enrollment_id === teacher.enrollment_id
                    : (selectedTeacher.teacher_id === teacher.teacher_id &&
                       selectedTeacher.grade_name === teacher.grade_name &&
                       selectedTeacher.group_name === teacher.group_name))
                : false;
              return (
                <div
                  key={teacher.enrollment_id || `${teacher.teacher_id}_${teacher.grade_name || ''}_${teacher.group_name || ''}`}
                  className={`group bg-white/3 border border-white/8 rounded-2xl p-6 transition-all duration-300 flex flex-col items-center text-center relative 
                    ${teacher.is_suspended 
                      ? 'opacity-60 cursor-not-allowed grayscale' 
                      : 'cursor-pointer hover:-translate-y-1 hover:border-primary hover:shadow-[0_10px_40px_rgba(66,99,235,0.2)]'
                    } 
                    ${isSelected ? 'border-primary bg-primary/10' : ''}`}
                  onClick={() => handleSelectTeacher(teacher)}
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-[3px] border-white/10">
                    {teacher.teacher_avatar ? (
                      <img src={teacher.teacher_avatar} alt={teacher.teacher_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary text-white text-[2rem]">
                        <Icon name="user" />
                      </div>
                    )}
                  </div>
                  {teacher.is_suspended && (
                    <div className="absolute top-4 right-4 text-red-500 bg-white/10 p-2 rounded-full">
                      <Icon name="ban" />
                    </div>
                  )}
                  <div className="mb-4">
                    <h3 className="text-white text-xl mb-2">{teacher.teacher_name}</h3>
                    {teacher.grade_name && (
                      <p className="text-gray-light text-sm flex items-center justify-center gap-1.5 mb-1">
                        <Icon name="graduation-cap" />
                        {teacher.grade_name}
                      </p>
                    )}
                    {teacher.group_name && (
                      <p className="text-gray-light text-sm flex items-center justify-center gap-1.5 mb-1">
                        <Icon name="users" />
                        {teacher.group_name}
                      </p>
                    )}
                  </div>
                  <div className="bg-[rgba(0,214,143,0.1)] rounded-xl p-[12px_20px] flex flex-col items-center mb-3">
                    <span className="text-xs text-gray-light">الرصيد</span>
                    <span className="text-xl font-bold text-success">{teacher.balance} ج.م</span>
                  </div>
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <Icon name="arrow-left" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <ConfirmationModal
        isOpen={!!suspendedTeacher}
        title="تنبيه"
        message={
          <div className="text-center">
            <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="exclamation-triangle" size="lg" className="text-warning" />
            </div>
            <p className="text-lg font-medium text-white mb-2">
              عفواً، هذا المدرس ({suspendedTeacher?.teacher_name}) معلق حالياً
            </p>
            <p className="text-gray-400 text-sm">
              لا يمكن الدخول إلى لوحة التحكم الخاصة بهذا المدرس في الوقت الحالي. يرجى التواصل مع الإدارة للمزيد من التفاصيل.
            </p>
          </div>
        }
        confirmText="حسناً"
        onConfirm={() => setSuspendedTeacher(null)}
        onCancel={() => setSuspendedTeacher(null)}
        showCancel={false}
        variant="warning"
      />
    </DashboardLayout>
  );
}
