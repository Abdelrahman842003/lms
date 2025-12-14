'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { withAdminAuth } from '@/components/auth/withAdminAuth';
import { getPermissions, Permission } from '@/services/roles';
import { Skeleton } from '@/components/ui';

function PermissionsPage() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await getPermissions();
        setPermissions(response.data);
      } catch (error) {
        console.error('Failed to fetch permissions', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout role="admin" user={user || undefined}>
        <div className="bg-[#1e1e2d] rounded-xl shadow-lg border border-white/5">
          <div className="p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 mb-4">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="admin"
      user={user || undefined}
    >
      <div className="bg-[#1e1e2d] rounded-xl shadow-lg border border-white/5">
        <div className="dashboard-card-header">
          <div className="dashboard-card-title">
            <i className="fas fa-key"></i>
            <h2>قائمة الصلاحيات</h2>
          </div>
          <div className="badge badge-primary">
            {permissions.length} صلاحية
          </div>
        </div>
        
        <div className="p-6">
          {permissions.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
              {permissions.map((permission) => (
                <div 
                  key={permission.id}
                  className="bg-white/3 border border-white/5 rounded-xl p-4 transition-all duration-200 hover:bg-white/5 hover:border-primary/30"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-white text-base font-semibold">{permission.name}</h4>
                    <code className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[0.8rem]">
                      {permission.guard_name}
                    </code>
                  </div>
                  <p className="text-gray-400 text-[0.9rem] leading-relaxed">
                    {/* Description is not available in API yet */}
                    صلاحية النظام
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 p-5">
              لا توجد صلاحيات
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAdminAuth(PermissionsPage);
