'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/EnhancedAuthContext';

/**
 * Redirects the user to their role-specific notifications page.
 * Standardizes access via the /notifications path.
 */
export default function NotificationsRedirect() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login?redirect=/notifications');
      return;
    }

    const role = user?.userType;

    switch (role) {
      case 'teacher':
        router.replace('/teacher/notifications');
        break;
      case 'student':
        router.replace('/student/notifications');
        break;
      case 'academy':
        router.replace('/academy/notifications');
        break;
      case 'parent':
        router.replace('/parent/children');
        break;
      case 'secretary':
        router.replace('/teacher/notifications'); // Secretaries use teacher routes
        break;
      default:
        router.replace('/');
        break;
    }
  }, [user, isLoading, isAuthenticated, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f] text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 font-Tajawal">جاري تحويلك إلى الإخطارات...</p>
      </div>
    </div>
  );
}
