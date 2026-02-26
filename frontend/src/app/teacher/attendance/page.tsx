'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { Button, LoadingSpinner, Icon, Badge } from '@/components/ui';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { useRouter } from 'next/navigation';
import ScanAttendanceModal from '@/components/dashboard/ScanAttendanceModal';
import * as teacherService from '@/services/teacherService';

export default function TeacherAttendancePage() {
  const { user, isAuthenticated, isLoading: authLoading, selectedAcademy } = useAuth();
  const router = useRouter();
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.userType !== 'teacher')) {
      router.push('/login');
    }
  }, [isAuthenticated, user, authLoading, router]);

  // Fetch today's attendance status
  const fetchTodayStatus = async () => {
    try {
      setIsLoading(true);
      const response = await teacherService.getTodayAttendanceStatus();
      if (response.status && response.data) {
        setTodayLogs(Array.isArray(response.data.logs) ? response.data.logs : []);
      }
    } catch (error) {
      console.error('Failed to fetch attendance status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.userType === 'teacher' && selectedAcademy?.id) {
      fetchTodayStatus();
    }
  }, [user, selectedAcademy]);

  const handleScanSuccess = () => {
    // Refresh the attendance logs
    fetchTodayStatus();
  };

  if (authLoading || !user || user.userType !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-400 mt-4">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // If teacher is not in Academy Mode
  if (!selectedAcademy?.id) {
    return (
      <DashboardLayout role="teacher" user={user}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md">
            <Icon name="university" size="3x" className="text-gray-600 mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">
              هذه الميزة متاحة فقط للمدرسين في الأكاديميات
            </h2>
            <p className="text-gray-400 mb-6">
              يرجى اختيار أكاديمية من القائمة المنسدلة في الأعلى للوصول إلى صفحة الحضور والانصراف
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate stats
  const latestLog = todayLogs.length > 0 ? todayLogs[0] : null;
  const isCheckedIn = latestLog?.status === 'checked_in';
  const totalHours = todayLogs.reduce((sum, log) => {
    if (log.duration_formatted) {
      const hours = parseInt(log.duration_formatted.split('h')[0] || '0');
      return sum + hours;
    }
    return sum;
  }, 0);

  return (
    <DashboardLayout role="teacher" user={user}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          الحضور والانصراف
        </h1>
        <p className="text-gray-400">
          سجل حضورك وانصرافك من خلال مسح رمز QR الخاص بالأكاديمية
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="الحالة الحالية"
          value={isCheckedIn ? 'حاضر' : 'منصرف'}
          icon={isCheckedIn ? 'fas fa-check-circle' : 'fas fa-times-circle'}
          color={isCheckedIn ? 'success' : 'danger'}
        />
        <StatCard
          title="عدد مرات الحضور اليوم"
          value={todayLogs.length}
          icon="fas fa-calendar-check"
          color="primary"
        />
        <StatCard
          title="إجمالي الساعات اليوم"
          value={`${totalHours}h`}
          icon="fas fa-clock"
          color="warning"
        />
      </div>

      {/* Scan Button */}
      <div className="mb-8">
        <Button
          onClick={() => setIsScanModalOpen(true)}
          variant="primary"
          size="lg"
        >
          <Icon name="qrcode" className="ml-2" />
          مسح رمز QR للحضور/الانصراف
        </Button>
      </div>

      {/* Today's Attendance Logs */}
      <DashboardCard title="سجل الحضور اليوم">
        {isLoading ? (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : todayLogs.length > 0 ? (
          <div className="space-y-4">
            {todayLogs.map((log, index) => (
              <div
                key={log.id || index}
                className="flex justify-between items-center p-4 bg-white/5 rounded-lg border border-white/10"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge
                      variant={log.status === 'checked_in' ? 'success' : 'danger'}
                    >
                      {log.status === 'checked_in' ? 'حضور' : 'انصراف'}
                    </Badge>
                    <span className="text-white font-semibold">
                      {log.academy?.name || selectedAcademy.name}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    <Icon name="clock" className="mr-2" />
                    الحضور: {log.checked_in_at ? new Date(log.checked_in_at).toLocaleTimeString('ar-EG') : '-'}
                    {log.checked_out_at && (
                      <>
                        <span className="mx-2">|</span>
                        الانصراف: {new Date(log.checked_out_at).toLocaleTimeString('ar-EG')}
                      </>
                    )}
                  </div>
                </div>
                {log.duration_formatted && (
                  <div className="text-right">
                    <div className="text-primary font-bold text-lg">
                      {log.duration_formatted}
                    </div>
                    <div className="text-xs text-gray-400">المدة</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Icon name="calendar" size="2x" className="text-gray-600 mb-4" />
            <p className="text-gray-400">لا يوجد سجل حضور لليوم</p>
            <p className="text-sm text-gray-500 mt-2">
              قم بمسح رمز QR لتسجيل حضورك
            </p>
          </div>
        )}
      </DashboardCard>

      {/* Scan Attendance Modal */}
      <ScanAttendanceModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </DashboardLayout>
  );
}
