'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { useRouter } from 'next/navigation';
import * as academyService from '@/services/academyService';

import QRCode from 'react-qr-code';
import AttendanceDetailsModal from '@/components/dashboard/AttendanceDetailsModal';
import { Button, Icon, Input, Textarea, Select, LoadingSpinner, Badge, FormModal } from '@/components/ui';

export default function AttendancePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrValue, setQrValue] = useState('');
  const [qrType, setQrType] = useState<'check_in' | 'check_out'>('check_in');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.userType !== 'academy')) {
      router.push('/login');
    }
  }, [isAuthenticated, user, authLoading, router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showQrModal && user?.id) {
      const updateQr = () => {
        setQrValue(JSON.stringify({
          academy_id: user.id,
          type: qrType,
          timestamp: Date.now(),
          valid_until: Date.now() + 5000
        }));
      };

      // Initial value
      updateQr();

      // Update every 5 seconds
      interval = setInterval(updateQr, 5000);
    }
    return () => clearInterval(interval);
  }, [showQrModal, user, qrType]);

  const openQrModal = (type: 'check_in' | 'check_out') => {
    setQrType(type);
    setShowQrModal(true);
  };

  // Fetch today's attendance
  const fetchTodayAttendance = async () => {
    try {
      const response = await academyService.getTodayAttendance();
      // Backend returns { status: true, data: { data: [...] } }
      // response.data is { data: [...] }
      // response.data.data is the array
      let data = [];
      if (Array.isArray(response.data?.data)) {
        data = response.data.data;
      } else if (Array.isArray(response.data)) {
        data = response.data;
      }
      setTodayAttendance(data);
    } catch (error) {
      // Error handled silently
    }
  };

  // Fetch attendance logs
  const fetchAttendanceLogs = async () => {
    try {
      setIsLoading(true);
      const response = await academyService.getAttendanceLogs({
        date_from: selectedDate,
        date_to: selectedDate,
        per_page: 50,
      });
      
      let data = [];
      // API returns { status: true, data: [...] }
      // Axios wraps this in response.data
      // So response.data.data is the array we need
      if (Array.isArray(response.data?.data)) {
        data = response.data.data;
      } 
      // Fallback: check if response.data is already an array
      else if (Array.isArray(response.data)) {
        data = response.data;
      }
      
      setAttendanceLogs(data);
    } catch (error) {
      // Error handled silently
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    if (!selectedDate) return;
    
    try {
      const response = await academyService.getAttendanceStats(selectedDate, selectedDate);
      setStats(response.data);
    } catch (error) {
      // Error handled silently
    }
  };

  useEffect(() => {
    if (user?.userType === 'academy') {
      fetchTodayAttendance();
      
      // Set default date (today)
      const now = new Date();
      setSelectedDate(now.toISOString().split('T')[0]);
    }
  }, [user]);

  useEffect(() => {
    if (selectedDate) {
      fetchAttendanceLogs();
      fetchStats();
    }
  }, [selectedDate]);

  if (authLoading || !user || user.userType !== 'academy') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="sm" color="primary" />
          <p className="text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const tableColumns = [
    {
      key: 'teacher.name',
      label: 'المدرس',
      sortable: true,
      render: (_: any, row: any) => row.teacher?.name || '-',
    },
    {
      key: 'date',
      label: 'التاريخ',
      sortable: true,
      className: 'hidden sm:table-cell', // Hide on mobile
    },
    {
      key: 'checked_in_at',
      label: 'الحضور',
      render: (value: any) => value ? new Date(value).toLocaleTimeString('ar-EG') : '-',
    },
    {
      key: 'checked_out_at',
      label: 'الانصراف',
      render: (value: any) => value ? new Date(value).toLocaleTimeString('ar-EG') : '-',
      className: 'hidden md:table-cell', // Hide on small screens
    },
    {
      key: 'duration_formatted',
      label: 'المدة',
      className: 'hidden lg:table-cell', // Hide on medium and small screens
    },
  ];

  return (
    <DashboardLayout role="academy" user={user}>
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            الحضور والانصراف
          </h1>
          <p className="text-gray-400">
            متابعة حضور وانصراف المدرسين
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="primary"
            onClick={() => openQrModal('check_in')}
            className="flex items-center gap-2"
          >
            <Icon name="qrcode" />
            <span>عرض QR الحضور</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => openQrModal('check_out')}
            className="flex items-center gap-2 border-danger text-danger hover:bg-danger hover:text-white"
          >
            <Icon name="sign-out-alt" />
            <span>عرض QR الانصراف</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-8">
          <StatCard
            title="إجمالي الحضور"
            value={stats.summary?.total_present || 0}
            icon="check-circle"
            color="success"
          />
          <StatCard
            title="إجمالي الغياب"
            value={stats.summary?.total_absent || 0}
            icon="times-circle"
            color="danger"
          />
          <StatCard
            title="متوسط ساعات العمل"
            value={Math.floor((stats.summary?.average_duration_minutes || 0) / 60) + 'h'}
            icon="clock"
            color="primary"
          />
        </div>
      )}

      {/* Today's Attendance */}
      <DashboardCard title="الحضور اليوم" className="mb-6">
        {todayAttendance.length > 0 ? (
          <div className="grid gap-4">
            {todayAttendance.map((log: any) => (
              <div
                key={log.id}
                className="flex justify-between items-center p-4 border-b border-white/5 last:border-0"
              >
                <div>
                  <h3 className="text-white font-semibold">{log.teacher?.name}</h3>
                  <p className="text-gray-400 text-sm">
                    {log.status === 'checked_in' ? 'حضر الساعة' : 'انصرف الساعة'}{' '}
                    {log.checked_in_at ? new Date(log.checked_in_at).toLocaleTimeString('ar-EG') : ''}
                  </p>
                </div>
                <Badge
                  variant={log.status === 'checked_in' ? 'success' : 'danger'}
                >
                  {log.status === 'checked_in' ? 'حاضر' : 'انصرف'}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">
            لا يوجد حضور لليوم
          </p>
        )}
      </DashboardCard>

      {/* Date Filter */}
      <div className="mb-6 bg-gray-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-gray-400 text-sm mb-2">التاريخ</label>
            <div className="relative">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Logs Table */}
      <DashboardCard title="سجلات الحضور" noPadding className="!bg-transparent !border-none !shadow-none">
        <DataTable
          columns={tableColumns}
          data={attendanceLogs}
          isLoading={isLoading}
          searchable={false}
          onRowClick={(row) => setSelectedLog(row)}
        />
      </DashboardCard>

      {/* QR Code Modal */}
      <FormModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        onSubmit={(e) => { e.preventDefault(); setShowQrModal(false); }}
        title={qrType === 'check_in' ? 'رمز الحضور (QR)' : 'رمز الانصراف (QR)'}
        submitText=""
        cancelText="إغلاق"
        maxWidth="400px"
      >
        <div className="text-center">
          <p className="text-gray-400 mb-6 text-sm">
            اطلب من المدرس مسح الرمز لتسجيل {qrType === 'check_in' ? 'الحضور' : 'الانصراف'}
          </p>
          
          <div className="bg-white p-4 rounded-xl inline-block mb-6">
            <QRCode
              value={qrValue}
              size={200}
              level="H"
            />
          </div>
          
          <div className="flex items-center justify-center gap-2 text-primary text-sm animate-pulse">
            <LoadingSpinner size="sm" color="primary" />
            <span>يتم تحديث الرمز تلقائياً</span>
          </div>
        </div>
      </FormModal>

      {/* Attendance Details Modal */}
      <AttendanceDetailsModal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        attendance={selectedLog}
      />
    </DashboardLayout>
  );
}
