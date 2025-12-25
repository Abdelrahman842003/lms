'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

interface MaintenanceGuardProps {
  children: React.ReactNode;
  maintenanceMode: boolean;
}

export default function MaintenanceGuard({ children, maintenanceMode }: MaintenanceGuardProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  // If maintenance mode is active, and we are NOT on an admin route
  if (maintenanceMode && !isAdminRoute) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f111a] text-white p-4 text-center">
        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <i className="fas fa-tools text-4xl text-primary"></i>
        </div>
        <h1 className="text-3xl font-bold mb-4">الموقع تحت الصيانة</h1>
        <p className="text-gray-400 max-w-md mb-8">
          نحن نقوم ببعض التحسينات حالياً. سنعود للعمل قريباً جداً. شكراً لصبركم.
        </p>
        <div className="text-sm text-gray-600">
          System Maintenance
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
