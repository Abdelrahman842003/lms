'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import StudentAttendanceSection from '@/components/dashboard/StudentAttendanceSection';

export default function AcademyAttendancePage() {
  const { user } = useAuth();

  return (
    <DashboardLayout
      role="academy"
      user={{
        name: user?.name || 'الأكاديمية',
        avatar: user?.avatar || '',
      }}
    >
      {/* Student Attendance Section */}
      <StudentAttendanceSection />
    </DashboardLayout>
  );
}
