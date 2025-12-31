'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageTransition } from '@/components/shared/PageTransition';
import { fetchApi } from '@/services/authService';

interface TeacherSummary {
  teacher: {
    id: string;
    name: string;
    avatar: string | null;
  };
  grade: string | null;
  group: string | null;
  period: {
    type: string;
    start: string;
    end: string;
  };
  attendance: {
    total_lectures: number;
    present: number;
    absent: number;
    rate: number;
    list: any[];
  };
  exams: {
    list: any[];
    total: number;
    taken: number;
    average: number;
  };
  points: {
    total: number;
    weekly: number;
  };
  mistakes: {
    pending: number;
  };
  subscription: {
    is_active: boolean;
    end_date: string | null;
    days_left: number | null;
  };
}

interface SummaryData {
  child: {
    id: string;
    name: string;
    avatar: string | null;
  };
  date: string;
  period: string;
  teachers: TeacherSummary[];
}

export default function ChildSummaryPage({ params }: { params: Promise<{ childId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, children } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [period, setPeriod] = useState<'day' | 'month'>('day');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  const child = children.find(c => c.id === resolvedParams.childId);

  useEffect(() => {
    if (child) {
      fetchSummary();
    }
  }, [child, date, period, selectedTeacherId]);

  const fetchSummary = async () => {
    if (!child) return;
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        date,
        period,
        ...(selectedTeacherId && { teacher_id: selectedTeacherId }),
      });
      
      const data = await fetchApi(`/parent/children/${child.id}/summary?${params}`);
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!child) {
    return (
      <PageTransition>
        <DashboardLayout
          role="parent"
          user={{ name: user?.name || 'ولي الأمر', avatar: user?.avatar }}
          title="تقارير الابن"
        >
          <div className="p-6 text-center">
            <p className="text-gray-400">الابن غير موجود</p>
            <button
              onClick={() => router.push('/parent/children')}
              className="mt-4 text-primary hover:underline"
            >
              العودة لقائمة الأبناء
            </button>
          </div>
        </DashboardLayout>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <DashboardLayout
        role="parent"
        user={{ name: user?.name || 'ولي الأمر', avatar: user?.avatar }}
      >
        <div className="max-w-[1200px] mx-auto">
          {/* Header with child info */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/parent/children')}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <i className="fas fa-arrow-right"></i>
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white text-xl font-bold border-2 border-white/10">
                    {child.avatar ? (
                      <img
                        src={child.avatar}
                        alt={child.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      child.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-1">{child.name}</h1>
                    <p className="text-gray-400 text-sm flex items-center gap-2">
                      <i className="fas fa-chalkboard-teacher"></i>
                      {child.teachers.length} مدرس
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Filter */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">التاريخ</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#0D1120] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              {/* Period Filter */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">الفترة</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPeriod('day')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all $
                      period === 'day'
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'bg-[#0D1120] text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    يومي
                  </button>
                  <button
                    onClick={() => setPeriod('month')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      period === 'month'
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'bg-[#0D1120] text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    شهري
                  </button>
                </div>
              </div>

              {/* Teacher Filter */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">المدرس</label>
                <select
                  value={selectedTeacherId || ''}
                  onChange={(e) => setSelectedTeacherId(e.target.value || null)}
                  className="w-full bg-[#0D1120] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="">جميع المدرسين</option>
                  {child.teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}

          {/* Summary Cards */}
          {!isLoading && summary && (
            <div className="space-y-6">
              {summary.teachers.map((teacherData) => (
                <div key={teacherData.teacher.id} className="bg-[#1A1F2E] rounded-xl p-5">
                  {/* Teacher Header */}
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      {teacherData.teacher.avatar ? (
                        <img
                          src={teacherData.teacher.avatar}
                          alt={teacherData.teacher.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <i className="fas fa-chalkboard-teacher text-primary"></i>
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-bold">{teacherData.teacher.name}</h3>
                      <p className="text-gray-400 text-sm">
                        {teacherData.grade && `${teacherData.grade}`}
                        {teacherData.group && ` - ${teacherData.group}`}
                      </p>
                    </div>
                    <div className="mr-auto">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        teacherData.subscription.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {teacherData.subscription.is_active ? 'فعال' : 'غير فعال'}
                      </span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Attendance */}
                    <div className="bg-[#0D1120] rounded-lg p-4 text-center">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                        <i className="fas fa-check text-green-400"></i>
                      </div>
                      <p className="text-2xl font-bold text-white">{teacherData.attendance.rate}%</p>
                      <p className="text-gray-400 text-sm">نسبة الحضور</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {teacherData.attendance.present}/{teacherData.attendance.total_lectures} محاضرة
                      </p>
                    </div>

                    {/* Exams */}
                    <div className="bg-[#0D1120] rounded-lg p-4 text-center">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                        <i className="fas fa-file-alt text-blue-400"></i>
                      </div>
                      <p className="text-2xl font-bold text-white">{teacherData.exams.average}%</p>
                      <p className="text-gray-400 text-sm">متوسط الدرجات</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {teacherData.exams.taken}/{teacherData.exams.total} امتحان
                      </p>
                    </div>

                    {/* Points */}
                    <div className="bg-[#0D1120] rounded-lg p-4 text-center">
                      <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-2">
                        <i className="fas fa-star text-yellow-400"></i>
                      </div>
                      <p className="text-2xl font-bold text-white">{teacherData.points.total}</p>
                      <p className="text-gray-400 text-sm">النقاط الكلية</p>
                      <p className="text-gray-500 text-xs mt-1">
                        +{teacherData.points.weekly} هذا الأسبوع
                      </p>
                    </div>

                    {/* Mistakes */}
                    <div className="bg-[#0D1120] rounded-lg p-4 text-center">
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-2">
                        <i className="fas fa-book text-red-400"></i>
                      </div>
                      <p className="text-2xl font-bold text-white">{teacherData.mistakes.pending}</p>
                      <p className="text-gray-400 text-sm">أخطاء معلقة</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* No Data */}
              {summary.teachers.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-chart-bar text-2xl text-gray-400"></i>
                  </div>
                  <p className="text-gray-400">لا توجد بيانات للفترة المحددة</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </PageTransition>
  );
}
