'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { fetchApi } from '@/services/authService';
import MaintenancePage from '@/app/maintenance/page';

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoading: isAuthLoading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const data = await fetchApi('/public-settings', { method: 'GET' });
        if (data) {
          setIsMaintenance(data.maintenanceMode === 'true');
        }
      } catch (error) {
        console.error('Failed to check maintenance status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkMaintenance();
  }, []);

  if (isLoading || isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0f111a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Allow access if:
  // 1. Not in maintenance mode
  // 2. Path starts with /admin (covers /admin/login and admin dashboard)
  // 3. User is admin (allows admins to view other pages if needed)
  if (!isMaintenance || pathname.startsWith('/admin') || user?.userType === 'admin') {
    return <>{children}</>;
  }

  return <MaintenancePage />;
}
