'use client';

import React from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';

export function BillingClient() {

  return (
    <div className="space-y-6">
      <DashboardCard title="الاشتراك الحالي" icon="fas fa-credit-card">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-right">
            <h3 className="text-xl font-bold text-white">باقة الأكاديمية</h3>
            <p className="text-gray-400">اشتراك شهري شامل جميع المميزات</p>
            <div className="flex items-center gap-2 text-primary">
              <i className="fas fa-check-circle"></i>
              <span>نشط حالياً</span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">500 ج.م</div>
            <div className="text-sm text-gray-400">شهرياً</div>
          </div>

        </div>
      </DashboardCard>

    </div>
  );
}
