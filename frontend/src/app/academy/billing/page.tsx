'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { BillingClient } from './BillingClient';
import { Button, Icon, Input, Textarea, Select, LoadingSpinner, Badge } from '@/components/ui';

export default function BillingPage() {
  const { user } = useAuth();

  return (
    <DashboardLayout
      role="academy"
      user={user || undefined}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Icon name="file-invoice-dollar" color="primary" />
          الفواتير والاشتراكات
        </h1>
        <p className="text-gray-400">
          إدارة اشتراك الأكاديمية والمدفوعات
        </p>
      </div>

      <BillingClient />
    </DashboardLayout>
  );
}
