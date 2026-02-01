'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { FeatureCard } from '@/components/dashboard/FeatureCard';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { withAdminAuth } from '@/components/auth/withAdminAuth';

function UsersPage() {
  const { user } = useAuth();

  return (
    <DashboardLayout
      role="admin"
      user={user || undefined}
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
        <FeatureCard
          title="الأدوار (Roles)"
          description="إدارة أدوار المستخدمين في النظام"
          icon="fas fa-user-tag"
          href="/admin/users/roles"
          color="primary"
        />
        
        <FeatureCard
          title="الصلاحيات (Permissions)"
          description="إدارة صلاحيات الوصول للنظام"
          icon="fas fa-key"
          href="/admin/users/permissions"
          color="secondary"
        />
      </div>
    </DashboardLayout>
  );
}

export default withAdminAuth(UsersPage);
