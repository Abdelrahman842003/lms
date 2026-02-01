'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import MaintenancePage from '@/app/maintenance/page';

export default function MaintenanceGuard({ 
  children, 
  maintenanceMode 
}: { 
  children: React.ReactNode;
  maintenanceMode: boolean;
}) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const pathname = usePathname();
  const [isMaintenance, setIsMaintenance] = useState(maintenanceMode);

  useEffect(() => {
    setIsMaintenance(maintenanceMode);
  }, [maintenanceMode]);

  if (isAuthLoading) {
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
