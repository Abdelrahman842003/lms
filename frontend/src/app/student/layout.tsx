'use client';

import { StudentTeacherProvider } from '@/contexts/StudentTeacherContext';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { isTeacherAccessible } from '@/utils/studentTeacherAccess';

export default function StudentLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, refreshUser } = useAuth();
  const [isRefreshingUser, setIsRefreshingUser] = useState(false);
  const syncedStudentIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    if (user?.userType !== 'student') {
      syncedStudentIdRef.current = null;
      return;
    }

    if (!user?.id || syncedStudentIdRef.current === user.id) {
      return;
    }

    syncedStudentIdRef.current = user.id;

    let cancelled = false;

    const syncStudent = async () => {
      setIsRefreshingUser(true);
      try {
        await refreshUser();
      } catch (error) {
        console.error('Student layout: failed to refresh current user', error);
      } finally {
        if (!cancelled) {
          setIsRefreshingUser(false);
        }
      }
    };

    void syncStudent();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.userType]);

  // Wait for the current student snapshot before deciding access state.
  if (isLoading || isRefreshingUser) {
    return null;
  }

  const hasTeachers = !!user?.teachers?.length;
  const hasAccessibleTeacher = user?.teachers?.some((teacher) => isTeacherAccessible(teacher));
  const isDisabled = user?.userType === 'student' && hasTeachers && !hasAccessibleTeacher;

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
