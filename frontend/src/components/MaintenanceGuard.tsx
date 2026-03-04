'use client';

import React from 'react';
import { Icon } from '@/components/ui';

interface MaintenanceGuardProps {
  children: React.ReactNode;
  maintenanceMode: boolean;
}

export default function MaintenanceGuard({ children, maintenanceMode }: MaintenanceGuardProps) {
  // If maintenance mode is active, show maintenance page for all routes
  if (maintenanceMode) {
    return (
      <div className="ux-min-h-screen ux-flex ux-flex-col ux-items-center ux-justify-center ux-bg-0f111a ux-text-white ux-p-4 ux-text-center">
        <div className="ux-w-24 ux-h-24 ux-bg-primary-20 ux-rounded-full ux-flex ux-items-center ux-justify-center ux-mb-6 ux-animate-pulse">
          <Icon name="tools" size="4x" color="primary" />
        </div>
        <h1 className="ux-text-3xl ux-font-bold ux-mb-4">الموقع تحت الصيانة</h1>
        <p className="ux-text-gray-400 ux-max-w-md ux-mb-8">
          نحن نقوم ببعض التحسينات حالياً. سنعود للعمل قريباً جداً. شكراً لصبركم.
        </p>
        <div className="ux-text-sm ux-text-gray-600">
          System Maintenance
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
