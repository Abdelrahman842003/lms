'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import academyService from '@/services/academyService';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';

import { Button, Icon, LoadingSpinner, Badge } from '@/components/ui';
export default function TeacherDetailsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const teacherId = params.id as string;

  const [teacherData, setTeacherData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'groups' | 'grades' | 'attendance'>('overview');

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.userType !== 'academy')) {
      router.push('/login');
    }
  }, [isAuthenticated, user, authLoading, router]);

  useEffect(() => {
    if (user?.userType === 'academy' && teacherId) {
      fetchTeacherDetails();
    }
  }, [user, teacherId]);

  const fetchTeacherDetails = async () => {
    try {
      setIsLoading(true);
      const response = await academyService.getTeacher(teacherId);
      if (response.status) {
        setTeacherData(response.data);
      } else {
        toast.error('فشل تحميل بيانات المدرس');
      }
    } catch (error) {
      console.error('Failed to fetch teacher details', error);
      toast.error('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f111a]">
        <div className="text-center">
          <LoadingSpinner size="sm" color="primary" />
          <p className="text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!teacherData) {
    return (
      <DashboardLayout role="academy" user={user || undefined}>
        <div className="text-center py-10">
          <p className="text-red-400">لم يتم العثور على بيانات المدرس</p>
          <Button onClick={() => router.back()} variant="primary" className="mt-4">
            عودة
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const { teacher, stats, groups, grades, attendance_logs } = teacherData;

  // Columns for Groups Table
  const groupColumns = [
    { key: 'name', label: 'اسم المجموعة', sortable: true },
    { key: 'students_count', label: 'عدد الطلاب', sortable: true },
    { 
      key: 'days', 
      label: 'الأيام', 
      render: (days: string[]) => days ? days.join('، ') : '-' 
    },
    { key: 'time', label: 'الموعد' },
  ];

  // Columns for Grades Table
  const gradeColumns = [
    { key: 'name', label: 'الصف الدراسي', sortable: true },
    { key: 'students_count', label: 'عدد الطلاب', sortable: true },
  ];

  // Columns for Attendance Table
  const attendanceColumns = [
    { 
      key: 'date', 
      label: 'التاريخ', 
      sortable: true,
      render: (date: string) => new Date(date).toLocaleDateString('ar-EG')
    },
    { 
      key: 'check_in', 
      label: 'وقت الحضور',
      render: (time: string) => time ? new Date(time).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '-'
    },
    { 
      key: 'check_out', 
      label: 'وقت الانصراف',
      render: (time: string) => time ? new Date(time).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '-'
    },
    { 
      key: 'duration_minutes', 
      label: 'المدة (دقيقة)',
      render: (duration: number) => duration ? `${duration} د` : '-'
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (status: string) => {
        const statusMap: any = {
          'checked_out': { label: 'حضور مكتمل', class: 'badge-success' },
          'checked_in': { label: 'حاضر الآن', class: 'badge-primary' },
          'absent': { label: 'غائب', class: 'badge-danger' },
        };
        const info = statusMap[status] || { label: status, class: 'badge-secondary' };
        return <span className={`badge ${info.class}`}>{info.label}</span>;
      }
    }
  ];

  return (
    <DashboardLayout role="academy" user={user || undefined}>
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => router.back()} 
            variant="ghost"
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all"
          >
            <Icon name="arrow-right" />
          </Button>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center overflow-hidden shrink-0 text-white text-2xl font-bold border-2 border-primary/20">
            {teacher.avatar ? (
              <img src={teacher.avatar} alt={teacher.name} className="w-full h-full object-cover" />
            ) : (
              <span>{teacher.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{teacher.name}</h1>
            <div className="flex items-center gap-3 text-gray-400 text-sm">
              <span><Icon name="phone" className="ml-1" />{teacher.phone}</span>
              {teacher.subject && (
                <span><Icon name="book" className="ml-1" />{teacher.subject}</span>
              )}
              <Badge variant={teacher.status === 'active' ? 'success' : 'danger'} size="sm">
                {teacher.status === 'active' ? 'نشط' : teacher.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="عدد الطلاب"
          value={stats.students_count || 0}
          icon="users"
          color="primary"
        />
        <StatCard
          title="المجموعات"
          value={groups?.length || 0}
          icon="layer-group"
          color="secondary"
        />
        <StatCard
          title="الصفوف الدراسية"
          value={grades?.length || 0}
          icon="graduation-cap"
          color="success"
        />
        <StatCard
          title="ساعات العمل (الشهر الحالي)"
          value={stats.total_duration_formatted || '0h 0m'}
          icon="clock"
          color="warning"
        />
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-2 mb-6 border-b border-white/10 pb-1">
        {[
          { id: 'overview', label: 'نظرة عامة', icon: 'chart-pie' },
          { id: 'groups', label: 'المجموعات', icon: 'users-class' },
          { id: 'grades', label: 'الصفوف الدراسية', icon: 'book' },
          { id: 'attendance', label: 'سجل الحضور', icon: 'calendar-check' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 rounded-t-xl flex items-center gap-2 transition-all whitespace-nowrap font-medium outline-none focus:outline-none focus:ring-0 ${
              activeTab === tab.id
                ? 'bg-[#101426]/15 text-primary'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon name={tab.icon} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardCard title="أحدث المجموعات" icon="layer-group">
              {groups && groups.length > 0 ? (
                <div className="space-y-4">
                  {groups.slice(0, 5).map((group: any) => (
                    <div key={group.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                      <div>
                        <h4 className="text-white font-bold mb-1">{group.name}</h4>
                        <p className="text-xs text-gray-400 flex items-center gap-2">
                          <span className="bg-white/5 px-2 py-0.5 rounded flex items-center gap-1">
                            <Icon name="clock" className="text-primary/70" />
                            {group.time}
                          </span>
                          <span>{group.days ? group.days.join('، ') : ''}</span>
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-primary/20 text-primary text-sm font-bold rounded-lg">
                        {group.students_count} طالب
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Icon name="layer-group" className="text-4xl mb-3 opacity-30" />
                  <p>لا توجد مجموعات</p>
                </div>
              )}
            </DashboardCard>

            <DashboardCard title="آخر نشاط حضور" icon="history">
              {attendance_logs && attendance_logs.length > 0 ? (
                <div className="space-y-4">
                  {attendance_logs.slice(0, 5).map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                      <div>
                        <p className="text-white font-bold mb-1">
                          {new Date(log.date).toLocaleDateString('ar-EG')}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-2">
                          <span className="bg-white/5 px-2 py-0.5 rounded">
                            {log.check_in ? new Date(log.check_in).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '-'} 
                          </span>
                          <Icon name="arrow-left" className="text-gray-600 text-[10px]" />
                          <span className="bg-white/5 px-2 py-0.5 rounded">
                            {log.check_out ? new Date(log.check_out).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </span>
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-bold rounded-lg ${
                        log.status === 'checked_out' ? 'bg-green-500/20 text-green-400' : 
                        log.status === 'absent' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {log.status === 'checked_out' ? 'مكتمل' : log.status === 'absent' ? 'غائب' : 'حاضر'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Icon name="history" className="text-4xl mb-3 opacity-30" />
                  <p>لا يوجد سجل حضور</p>
                </div>
              )}
            </DashboardCard>
          </div>
        )}

        {activeTab === 'groups' && (
          <DashboardCard title={`المجموعات (${groups?.length || 0})`} icon="layer-group">
            <DataTable
              columns={groupColumns}
              data={groups || []}
              searchable={true}
            />
          </DashboardCard>
        )}

        {activeTab === 'grades' && (
          <DashboardCard title={`الصفوف الدراسية (${grades?.length || 0})`} icon="graduation-cap">
            <DataTable
              columns={gradeColumns}
              data={grades || []}
              searchable={true}
            />
          </DashboardCard>
        )}

        {activeTab === 'attendance' && (
          <DashboardCard title="سجل الحضور والانصراف" icon="calendar-alt">
            <DataTable
              columns={attendanceColumns}
              data={attendance_logs || []}
              searchable={false}
            />
          </DashboardCard>
        )}
      </div>
    </DashboardLayout>
  );
}
