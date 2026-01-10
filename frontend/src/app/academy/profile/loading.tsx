import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Skeleton } from '@/components/ui';

export default function Loading() {
  return (
    <DashboardLayout role="academy" user={{ name: '...' }}>
      <div className="max-w-[1200px] mx-auto">
        {/* Profile Info Card Skeleton */}
        <div className="dashboard-card mb-6 p-6">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="flex items-center gap-6 mb-8">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
            <div>
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
            <div>
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
