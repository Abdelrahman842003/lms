'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { TeacherInfo } from '@/services/authService';

export default function StudentTeachersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
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

  const handleSelectTeacher = (teacherId: string) => {
    const teacher = teachers.find(t => t.teacher_id === teacherId);
    if (teacher?.is_suspended) {
      toast.error(`ممنوع الدخول علي المدرس ${teacher.teacher_name} في الوقت الحالي`);
      return;
    }
    setSelectedTeacher(teacherId);
    // Store selected teacher in localStorage
    localStorage.setItem('selectedTeacherId', teacherId);
    // Navigate to dashboard
    router.push('/student/dashboard');
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
        <div className="w-[50px] h-[50px] border-[3px] border-white/10 border-t-primary rounded-full animate-spin"></div>
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
        <div className="text-center mb-10">
          <h1 className="text-[2rem] text-white flex items-center justify-center gap-3 mb-2">
            <i className="fas fa-chalkboard-teacher text-primary"></i>
            اختر المدرس
          </h1>
          <p className="text-gray-light text-base">اختر المدرس الذي تريد عرض بياناته</p>
        </div>

        {teachers.length === 0 ? (
          <div className="text-center p-[60px_20px] bg-white/3 rounded-2xl border border-white/5">
            <i className="fas fa-user-slash text-[4rem] text-gray-light mb-5"></i>
            <h2 className="text-white mb-2.5">لا توجد اشتراكات</h2>
            <p className="text-gray-light">لم تقم بالاشتراك مع أي مدرس بعد. تواصل مع مدرسك للاشتراك.</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
            {teachers.map((teacher) => (
              <div
                key={teacher.teacher_id}
                className={`group bg-white/3 border border-white/8 rounded-2xl p-6 transition-all duration-300 flex flex-col items-center text-center relative 
                  ${teacher.is_suspended 
                    ? 'opacity-60 cursor-not-allowed grayscale' 
                    : 'cursor-pointer hover:-translate-y-1 hover:border-primary hover:shadow-[0_10px_40px_rgba(66,99,235,0.2)]'
                  } 
                  ${selectedTeacher === teacher.teacher_id ? 'border-primary bg-primary/10' : ''}`}
                onClick={() => handleSelectTeacher(teacher.teacher_id)}
              >
                <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-[3px] border-white/10">
                  {teacher.teacher_avatar ? (
                    <img src={teacher.teacher_avatar} alt={teacher.teacher_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary text-white text-[2rem]">
                      <i className="fas fa-user"></i>
                    </div>
                  )}
                </div>
                {teacher.is_suspended && (
                  <div className="absolute top-4 right-4 text-red-500 bg-white/10 p-2 rounded-full">
                    <i className="fas fa-ban"></i>
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-white text-xl mb-2">{teacher.teacher_name}</h3>
                  {teacher.grade_name && (
                    <p className="text-gray-light text-sm flex items-center justify-center gap-1.5 mb-1">
                      <i className="fas fa-graduation-cap"></i>
                      {teacher.grade_name}
                    </p>
                  )}
                  {teacher.group_name && (
                    <p className="text-gray-light text-sm flex items-center justify-center gap-1.5 mb-1">
                      <i className="fas fa-users"></i>
                      {teacher.group_name}
                    </p>
                  )}
                </div>
                <div className="bg-[rgba(0,214,143,0.1)] rounded-xl p-[12px_20px] flex flex-col items-center mb-3">
                  <span className="text-xs text-gray-light">الرصيد</span>
                  <span className="text-xl font-bold text-success">{teacher.balance} ج.م</span>
                </div>
                <div className="absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <i className="fas fa-arrow-left"></i>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


    </DashboardLayout>
  );
}
