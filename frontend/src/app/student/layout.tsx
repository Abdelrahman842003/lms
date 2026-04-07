'use client';

import { StudentTeacherProvider } from '@/contexts/StudentTeacherContext';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { isTeacherAccessible } from '@/utils/studentTeacherAccess';
import QuickLogoutButton from '@/components/auth/QuickLogoutButton';

export default function StudentLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, refreshUser } = useAuth();
  const [hasSynced, setHasSynced] = useState(false);
  const syncedStudentIdRef = useRef<string | number | null>(null);
  const refreshUserRef = useRef(refreshUser);

  useEffect(() => {
    refreshUserRef.current = refreshUser;
  }, [refreshUser]);

  useEffect(() => {
    // Not a student — no sync needed
    if (!isLoading && user?.userType !== 'student') {
      setHasSynced(true);
      return;
    }

    // Still loading core auth — wait
    if (isLoading || !user?.id) {
      return;
    }

    // Already synced this student id
    if (syncedStudentIdRef.current === user.id) {
      setHasSynced(true);
      return;
    }

    setHasSynced(false);
    syncedStudentIdRef.current = user.id;

    const syncStudent = async () => {
      const fallbackTimer = window.setTimeout(() => {
        setHasSynced(true);
      }, 4000);

      try {
        await refreshUserRef.current();
      } catch (error) {
        console.error('Student layout: failed to refresh current user', error);
      } finally {
        window.clearTimeout(fallbackTimer);
        setHasSynced(true);
      }
    };

    void syncStudent();
  }, [isLoading, user?.id, user?.userType]);

  // Wait until core auth AND the fresh /me call are both done
  if (isLoading || !hasSynced) {
    return null;
  }

  const hasTeachers = !!user?.teachers?.length;
  const hasAccessibleTeacher = user?.teachers?.some((teacher) => isTeacherAccessible(teacher));
  const hasNoTeachers = user?.userType === 'student' && !hasTeachers;
  const isDisabled = user?.userType === 'student' && hasTeachers && !hasAccessibleTeacher;

  if (hasNoTeachers) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8 relative z-10">
        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 backdrop-blur-sm border border-white/10">
          <i className="fas fa-user-plus text-4xl text-gray-400"></i>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">
          أنت لست مضمومًا إلى أي مدرس حالياً
        </h2>
        <p className="text-gray-400 max-w-md mx-auto text-lg">
          يرجى التواصل مع الإدارة أو المدرس لإضافتك إلى مجموعة دراسية حتى تتمكن من استخدام المنصة.
        </p>
        <QuickLogoutButton />
      </div>
    );
  }

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
        <QuickLogoutButton />
      </div>
    );
  }

  return (
    <StudentTeacherProvider>
      {children}
    </StudentTeacherProvider>
  );
}
