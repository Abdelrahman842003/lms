'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { LoadingSpinner, Button, Icon } from '@/components/ui';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { getAttendees, AttendeesResponse } from '@/services/lectureService';
import { Filter } from '@/components/Filter';
import toast from 'react-hot-toast';


export default function LectureAttendancePage() {
  const { user } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const lectureId = params.id as string;
  const groupId = searchParams.get('group_id') || undefined;

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AttendeesResponse | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await getAttendees(lectureId, groupId, {
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined
        });
        setData(response);
      } catch (error) {
        console.error('Failed to fetch attendees:', error);
        toast.error('فشل جلب بيانات الحضور');
      } finally {
        setIsLoading(false);
      }
    };

    if (lectureId) {
      fetchData();
    }
  }, [lectureId, groupId, dateFrom, dateTo]);

  // ... existing imports

  const handleDateFilterChange = (value: string) => {
    setSelectedDateFilter(value);
    if (value === 'all') {
      setDateFrom('');
      setDateTo('');
    } else if (value === 'last_month') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      const offset = firstDay.getTimezoneOffset();
      const firstDayLocal = new Date(firstDay.getTime() - (offset*60*1000));
      const lastDayLocal = new Date(lastDay.getTime() - (offset*60*1000));
      
      setDateFrom(firstDayLocal.toISOString().split('T')[0]);
      setDateTo(lastDayLocal.toISOString().split('T')[0]);
    } else {
      setDateFrom(value);
      setDateTo(value);
    }
  };

  const dayLabels: Record<string, string> = {
    'Sunday': 'الأحد',
    'Monday': 'الاثنين',
    'Tuesday': 'الثلاثاء',
    'Wednesday': 'الأربعاء',
    'Thursday': 'الخميس',
    'Friday': 'الجمعة',
    'Saturday': 'السبت',
  };

  // Helper to get status of selected date
  const getSelectedDateStatus = () => {
    if (!data?.available_dates || selectedDateFilter === 'all' || selectedDateFilter === 'last_month') return null;
    const dateObj = data.available_dates.find(d => d.date === selectedDateFilter);
    return dateObj ? dateObj.status : null;
  };

  const selectedDateStatus = getSelectedDateStatus();

  return (
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={{
        name: user?.name || 'المدرس',
        avatar: user?.avatar || '',
      }}
    >
      <div className="mb-6 flex justify-between items-center max-md:flex-col max-md:items-start max-md:gap-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
          >
            <Icon name="arrow-right" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">سجل الحضور</h1>
            <div className="flex flex-wrap items-center gap-2 text-gray-400 text-sm">
              <span>{data?.lecture?.title || 'جاري التحميل...'}</span>
              {data?.lecture?.group_name && (
                <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs">
                  {data.lecture.group_name}
                </span>
              )}
              {data?.lecture?.is_recurring && data.lecture.recurrence_days && (
                <span className="text-primary text-xs flex items-center gap-1">
                  <Icon name="redo" />
                  {data.lecture.recurrence_days.map(d => dayLabels[d]).join('، ')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="w-full md:w-1/3">
          <Filter
            options={[
              { value: 'all', label: 'كل التواريخ' },
              { value: 'last_month', label: 'الشهر الماضي' },
              ...(data?.available_dates?.map((dateObj) => ({
                value: dateObj.date,
                label: `${new Date(dateObj.date).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}${dateObj.status === 'cancelled' ? ' (ملغاة)' : ''}${dateObj.status === 'not_activated' ? ' (لم تفعل)' : ''}`
              })) || [])
            ]}
            value={selectedDateFilter}
            onChange={(value) => handleDateFilterChange(value)}
            placeholder="تصفية حسب التاريخ"
            className="w-full"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {selectedDateStatus === 'not_activated' ? (
            <div className="flex flex-col items-center justify-center py-16 bg-[#101426]/40 border border-white/5 rounded-2xl">
              <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
                <Icon name="exclamation-triangle" className="text-3xl text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">لم يتم تفعيل المحاضرة</h3>
              <p className="text-gray-400 text-center max-w-md">
                لم يتم تفعيل المحاضرة في هذا التاريخ، لذلك لا توجد سجلات حضور.
              </p>
            </div>
          ) : selectedDateStatus === 'cancelled' ? (
            <div className="flex flex-col items-center justify-center py-16 bg-[#101426]/40 border border-white/5 rounded-2xl">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <Icon name="ban" className="text-3xl text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">تم إلغاء المحاضرة</h3>
              <p className="text-gray-400 text-center max-w-md">
                تم إلغاء المحاضرة في هذا التاريخ.
              </p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#101426]/40 border border-white/5 rounded-2xl p-6 flex items-center justify-between relative overflow-hidden group hover:border-green-500/30 transition-all duration-300">
                  <div className="relative z-10">
                    <p className="text-gray-400 text-sm font-medium mb-1">عدد الحضور</p>
                    <h3 className="text-3xl font-bold text-white">{data.total_present}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 text-xl group-hover:scale-110 transition-transform duration-300">
                    <Icon name="check" />
                  </div>
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-colors duration-300"></div>
                </div>

                <div className="bg-[#101426]/40 border border-white/5 rounded-2xl p-6 flex items-center justify-between relative overflow-hidden group hover:border-red-500/30 transition-all duration-300">
                  <div className="relative z-10">
                    <p className="text-gray-400 text-sm font-medium mb-1">عدد الغياب</p>
                    <h3 className="text-3xl font-bold text-white">{data.total_absent}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 text-xl group-hover:scale-110 transition-transform duration-300">
                    <Icon name="times" />
                  </div>
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors duration-300"></div>
                </div>
              </div>

              {/* Attendees Table */}
              <DashboardCard title="قائمة الطلاب" icon="fas fa-users">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">الطالب</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">رقم الهاتف</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-400">الحالة</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">وقت الحضور</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.attendees.map((attendee, index) => (
                        <tr key={attendee.id ?? attendee.student_id ?? `${attendee.student_phone}-${index}`} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-white font-medium">{attendee.student_name}</td>
                          <td className="px-6 py-4 text-gray-300 font-mono" dir="ltr">{attendee.student_phone}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              attendee.status === 'present' 
                                ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                                : 'bg-red-500/10 text-red-500 border border-red-500/20'
                            }`}>
                              {attendee.status === 'present' ? 'حاضر' : 'غائب'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-sm" dir="ltr">
                            {attendee.attended_at ? new Date(attendee.attended_at).toLocaleString('ar-EG', {
                              year: 'numeric',
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            }) : '-'}
                          </td>
                        </tr>
                      ))}
                      {data.attendees.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                            <Icon name="users-slash" className="text-4xl mb-3 opacity-50" />
                            <p>لا يوجد طلاب في هذه القائمة</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </DashboardCard>
            </>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>حدث خطأ أثناء تحميل البيانات</p>
        </div>
      )}
    </DashboardLayout>
  );
}
