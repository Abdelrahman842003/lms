'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ParentDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/parent/children');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-400">جاري التحويل...</p>
      </div>
    </div>
  );
}
