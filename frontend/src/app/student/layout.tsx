'use client';

import { StudentTeacherProvider } from '@/contexts/StudentTeacherContext';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { ReactNode } from 'react';

export default function StudentLayout({ children }: { children: ReactNode }) {
  const { user, selectedTeacher, isLoading } = useAuth();

  // Show loading state or children while loading
  if (isLoading) {
    return <>{children}</>;
  }

  // Check if student is disabled by all teachers
  // Condition: User is student, has teachers enrolled, but no teacher is selected (meaning all are invalid/inactive)
  const isDisabled = user?.userType === 'student' && 
                     user?.teachers && 
                     user.teachers.length > 0 && 
                     !selectedTeacher;

  if (isDisabled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8 relative z-10">
        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 backdrop-blur-sm border border-white/10">
          <i className="fas fa-user-slash text-4xl text-gray-400"></i>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">
          عذراً، لا يمكنك الوصول للمنصة حالياً
        </h2>
        <p className="text-gray-400 max-w-md mx-auto text-lg">
          تم تعطيل حسابك من قبل جميع المدرسين المشترك معهم. يرجى التواصل مع مدرسك لتفعيل الاشتراك.
        </p>
      </div>
    );
  }

  return (
    <StudentTeacherProvider>
      {children}
    </StudentTeacherProvider>
  );
}
