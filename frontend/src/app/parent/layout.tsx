'use client';

import { useAuth } from '@/contexts/EnhancedAuthContext';
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ParentLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, children: childrenList } = useAuth();
  const router = useRouter();

  // Redirect if not a parent
  useEffect(() => {
    if (!isLoading && user && user.userType !== 'parent') {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  // Show loading state while loading
  if (isLoading) {
    return <>{children}</>;
  }

  // Check if parent has no children
  const hasNoChildren = !childrenList || childrenList.length === 0;

  if (hasNoChildren && user?.userType === 'parent') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8 relative z-10">
        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 backdrop-blur-sm border border-white/10">
          <i className="fas fa-user-slash text-4xl text-gray-400"></i>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">
          لا يوجد أبناء مسجلين
        </h2>
        <p className="text-gray-400 max-w-md mx-auto text-lg">
          لم يتم تسجيل أي طالب برقم هاتفك كولي أمر. يرجى التواصل مع المدرس لتسجيل رقمك.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
