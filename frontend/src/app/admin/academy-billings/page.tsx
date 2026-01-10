'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function AcademyBillingsPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">فواتير الأكاديميات</h1>
          <p className="text-gray-400">إدارة الفواتير الشهرية للأكاديميات</p>
        </div>

        <div className="bg-[#1a1f2e] rounded-lg p-8 text-center">
          <i className="fas fa-file-invoice-dollar text-6xl text-primary mb-4"></i>
          <h2 className="text-xl font-bold text-white mb-2">قريباً</h2>
          <p className="text-gray-400">صفحة إدارة الفواتير قيد التطوير</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
