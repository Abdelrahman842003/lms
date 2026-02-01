'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import StudentAttendanceSection from '@/components/dashboard/StudentAttendanceSection';

export default function StudentLecturesPage() {
  const { user } = useAuth();

  return (
    <DashboardLayout
      role="academy"
      user={{
        name: user?.name || 'الأكاديمية',
        avatar: user?.avatar || '',
      }}
    >
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">محاضرات الطلاب</h1>
        <p className="text-gray-400">إدارة محاضرات الطلاب وتسجيل الحضور</p>
      </div>

      {/* Student Attendance Section */}
      <StudentAttendanceSection />
    </DashboardLayout>
  );
}
