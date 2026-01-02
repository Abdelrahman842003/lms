'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/AuthContext';
import { getAttendees, exportAttendeesPDF, AttendeesResponse } from '@/services/lectureService';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function LectureAttendancePage() {
  const { user } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const lectureId = params.id as string;
  const groupId = searchParams.get('group_id') || undefined;

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AttendeesResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await getAttendees(lectureId, groupId);
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
  }, [lectureId, groupId]);

  const handleExportPDF = async () => {
    try {
      await exportAttendeesPDF(lectureId);
      toast.success('تم تحميل التقرير بنجاح');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast.error('فشل تحميل التقرير');
    }
  };

  return (
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={{
        name: user?.name || 'المدرس',
        avatar: user?.avatar || '',
      }}
    >
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
          >
            <i className="fas fa-arrow-right"></i>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">سجل الحضور</h1>
            <p className="text-gray-400 text-sm">
              {data?.lecture?.title ? `محاضرة: ${data.lecture.title}` : 'جاري التحميل...'}
            </p>
          </div>
        </div>
        <button 
          onClick={handleExportPDF}
          className="btn btn-primary"
          disabled={isLoading || !data}
        >
          <i className="fas fa-file-pdf"></i>
          <span>تصدير PDF</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#101426]/40 border border-white/5 rounded-2xl p-6 flex items-center justify-between relative overflow-hidden group hover:border-green-500/30 transition-all duration-300">
              <div className="relative z-10">
                <p className="text-gray-400 text-sm font-medium mb-1">عدد الحضور</p>
                <h3 className="text-3xl font-bold text-white">{data.total_present}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 text-xl group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-check"></i>
              </div>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-colors duration-300"></div>
            </div>

            <div className="bg-[#101426]/40 border border-white/5 rounded-2xl p-6 flex items-center justify-between relative overflow-hidden group hover:border-red-500/30 transition-all duration-300">
              <div className="relative z-10">
                <p className="text-gray-400 text-sm font-medium mb-1">عدد الغياب</p>
                <h3 className="text-3xl font-bold text-white">{data.total_absent}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 text-xl group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-times"></i>
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
                  {data.attendees.map((attendee) => (
                    <tr key={attendee.id} className="hover:bg-white/5 transition-colors">
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
                        <i className="fas fa-users-slash text-4xl mb-3 opacity-50"></i>
                        <p>لا يوجد طلاب في هذه القائمة</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </DashboardCard>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>حدث خطأ أثناء تحميل البيانات</p>
        </div>
      )}
    </DashboardLayout>
  );
}
