'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { PageTransition } from '@/components/shared/PageTransition';
import { fetchApi } from '@/services/authService';
import { Filter } from '@/components/Filter';

interface LectureItem {
  id: string;
  title: string;
  date: string;
  time: string;
  status: 'present' | 'absent' | 'not_recorded';
}

interface ExamItem {
  id: string;
  title: string;
  subject: string;
  score: number | null;
  max_score: number;
  percentage: number | null;
  status: string;
  date: string;
}

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
    list: LectureItem[];
  };
  exams: {
    list: ExamItem[];
    total: number;
    taken: number;
    average: number;
  };
  ranking: {
    position: number | null;
    total: number;
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
  const [period, setPeriod] = useState<'day' | 'month'>('month');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null);

  const child = children.find(c => c.id === resolvedParams.childId);

  useEffect(() => {
    if (child) {
      fetchSummary();
    }
  }, [child, date, period]); // Removed selectedTeacherId from dependency

  const fetchSummary = async () => {
    if (!child) return;
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        date,
        period,
        // Removed teacher_id param to get all teachers for global stats
      });
      
      const data = await fetchApi(`/parent/children/${child.id}/summary?${params}`);
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate overall statistics (Global - across ALL teachers)
  const overallStats = summary?.teachers.reduce(
    (acc, t) => ({
      attendanceRate: acc.attendanceRate + t.attendance.rate,
      examAverage: acc.examAverage + t.exams.average,
      teacherCount: acc.teacherCount + 1,
    }),
    { attendanceRate: 0, examAverage: 0, teacherCount: 0 }
  );

  const avgAttendance = overallStats && overallStats.teacherCount > 0 
    ? Math.round(overallStats.attendanceRate / overallStats.teacherCount) 
    : 0;
  const avgExams = overallStats && overallStats.teacherCount > 0 
    ? Math.round(overallStats.examAverage / overallStats.teacherCount) 
    : 0;

  // Filter teachers for display based on selection
  const displayedTeachers = summary?.teachers.filter(t => 
    !selectedTeacherId || t.teacher.id === selectedTeacherId
  ) || [];

  const getAttendanceStatusStyle = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'absent':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getAttendanceStatusLabel = (status: string) => {
    switch (status) {
      case 'present':
        return 'حاضر';
      case 'absent':
        return 'غائب';
      default:
        return 'غير مسجل';
    }
  };

  if (!child) {
    return (
      <PageTransition>
        <DashboardLayout
          role="parent"
          user={{ name: user?.name || 'ولي الأمر', avatar: user?.avatar }}
        >
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-user-slash text-3xl text-gray-400"></i>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">الابن غير موجود</h3>
              <button
                onClick={() => router.push('/parent/children')}
                className="mt-4 text-primary hover:underline"
              >
                العودة لقائمة الأبناء
              </button>
            </div>
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
        <div className="max-w-[1200px] mx-auto space-y-8">
          {/* Header with child info */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => router.push('/parent/children')}
                  className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <i className="fas fa-arrow-right text-lg"></i>
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white text-2xl font-bold border-2 border-white/10 shadow-lg shadow-primary/20">
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
                    <h1 className="text-3xl font-bold text-white mb-2">تقارير {child.name}</h1>
                    <p className="text-gray-400 text-sm flex items-center gap-2">
                      <i className="fas fa-chalkboard-teacher text-primary"></i>
                      {child.teachers.length} مدرس
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <DashboardCard title="" icon="">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
              {/* Date Filter */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-3">التاريخ</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#0D1120] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              {/* Period Filter */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-3">الفترة</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPeriod('day')}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                      period === 'day'
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'bg-[#0D1120] text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    يومي
                  </button>
                  <button
                    onClick={() => setPeriod('month')}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
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
                <label className="block text-gray-400 text-sm font-medium mb-3">المدرس</label>
                <Filter
                  options={[
                    { value: '', label: 'جميع المدرسين' },
                    ...child.teachers.map((teacher) => ({
                      value: teacher.id,
                      label: teacher.name,
                    })),
                  ]}
                  value={selectedTeacherId || ''}
                  onChange={(value) => setSelectedTeacherId(value || null)}
                  className="w-full"
                />
              </div>
            </div>
          </DashboardCard>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}

          {/* Overall Statistics */}
          {!isLoading && summary && summary.teachers.length > 0 && (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-8">
              <StatCard
                title="نسبة الحضور"
                value={avgAttendance}
                suffix="%"
                icon="fas fa-check-circle"
                color="success"
              />
              <StatCard
                title="متوسط الدرجات"
                value={avgExams}
                suffix="%"
                icon="fas fa-chart-line"
                color="info"
              />
            </div>
          )}

          {/* Teacher Summaries */}
          {!isLoading && summary && (
            <div className="space-y-8">
              {displayedTeachers.map((teacherData) => (
                <DashboardCard
                  key={teacherData.teacher.id}
                  title=""
                  icon=""
                >
                  {/* Teacher Header */}
                  <div className="flex items-center justify-between mb-6 pb-6 border-b p-6 border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center overflow-hidden border-2 border-white/5">
                        {teacherData.teacher.avatar ? (
                          <img src={teacherData.teacher.avatar} alt={teacherData.teacher.name} className="w-full h-full object-cover" />
                        ) : (
                          <i className="fas fa-chalkboard-teacher text-white text-xl"></i>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{teacherData.teacher.name}</h3>
                        {teacherData.grade && (
                          <p className="text-gray-400 text-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary/50"></span>
                            {teacherData.grade}
                            {teacherData.group && ` - ${teacherData.group}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide ${
                      teacherData.subscription.is_active
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {teacherData.subscription.is_active ? 'فعال' : 'غير فعال'}
                    </span>
                  </div>

                  {/* Stats Grid - Teacher Dashboard Style */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                    {/* Attendance */}
                    <div className="bg-[#0D1120] rounded-2xl p-6 text-center border border-white/5 hover:border-white/10 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                        <i className="fas fa-check text-green-400 text-lg"></i>
                      </div>
                      <p className="text-2xl font-bold text-white mb-1">{teacherData.attendance.rate}%</p>
                      <p className="text-gray-400 text-sm font-medium">نسبة الحضور</p>
                      <p className="text-gray-500 text-xs mt-2 bg-white/5 py-1 px-3 rounded-full inline-block">
                        {teacherData.attendance.present}/{teacherData.attendance.total_lectures} محاضرة
                      </p>
                    </div>

                    {/* Exams */}
                    <div className="bg-[#0D1120] rounded-2xl p-6 text-center border border-white/5 hover:border-white/10 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                        <i className="fas fa-file-alt text-blue-400 text-lg"></i>
                      </div>
                      <p className="text-2xl font-bold text-white mb-1">{teacherData.exams.average}%</p>
                      <p className="text-gray-400 text-sm font-medium">متوسط الدرجات</p>
                      <p className="text-gray-500 text-xs mt-2 bg-white/5 py-1 px-3 rounded-full inline-block">
                        {teacherData.exams.taken}/{teacherData.exams.total} امتحان
                      </p>
                    </div>

                    {/* Ranking */}
                    <div className="bg-[#0D1120] rounded-2xl p-6 text-center border border-white/5 hover:border-white/10 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
                        <i className="fas fa-trophy text-purple-400 text-lg"></i>
                      </div>
                      <p className="text-2xl font-bold text-white mb-1">
                        {teacherData.ranking.position ? `#${teacherData.ranking.position}` : '-'}
                      </p>
                      <p className="text-gray-400 text-sm font-medium">الترتيب</p>
                      <p className="text-gray-500 text-xs mt-2 bg-white/5 py-1 px-3 rounded-full inline-block">
                        من {teacherData.ranking.total} طالب
                      </p>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  <button
                    onClick={() => setExpandedTeacher(expandedTeacher === teacherData.teacher.id ? null : teacherData.teacher.id)}
                    className="w-full py-3 text-primary text-sm font-bold hover:bg-primary/5 rounded-xl transition-colors flex items-center justify-center gap-2 group"
                  >
                    <span>{expandedTeacher === teacherData.teacher.id ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}</span>
                    <i className={`fas fa-chevron-down transition-transform duration-300 group-hover:translate-y-0.5 ${expandedTeacher === teacherData.teacher.id ? 'rotate-180' : ''}`}></i>
                  </button>

                  <div className={`grid transition-[grid-template-rows,margin,opacity] duration-300 ease-in-out ${
                    expandedTeacher === teacherData.teacher.id ? 'grid-rows-[1fr] mt-8 opacity-100' : 'grid-rows-[0fr] mt-0 opacity-0'
                  }`}>
                    <div className="overflow-hidden">
                      <div className="space-y-8">
                        {/* Lectures List */}
                        <div>
                          <h4 className="text-white font-bold mb-4 flex items-center gap-3 text-lg">
                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                              <i className="fas fa-book-open text-primary text-sm"></i>
                            </div>
                            المحاضرات ({teacherData.attendance.list.length})
                          </h4>
                          {teacherData.attendance.list.length === 0 ? (
                            <div className="bg-[#0D1120] rounded-xl p-8 text-center border border-dashed border-white/10">
                              <p className="text-gray-500 text-sm">لا توجد محاضرات في هذه الفترة</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto rounded-xl border border-white/5">
                              <table className="w-full text-right">
                                <thead className="bg-white/5">
                                  <tr className="text-gray-400 text-sm">
                                    <th className="py-4 px-6 font-medium">المحاضرة</th>
                                    <th className="py-4 px-6 font-medium">التاريخ</th>
                                    <th className="py-4 px-6 font-medium">الوقت</th>
                                    <th className="py-4 px-6 font-medium">الحالة</th>
                                  </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-white/5">
                                  {teacherData.attendance.list.map((lecture) => (
                                    <tr key={lecture.id} className="hover:bg-white/5 transition-colors">
                                      <td className="py-4 px-6 text-white font-medium">{lecture.title}</td>
                                      <td className="py-4 px-6 text-gray-400">{lecture.date}</td>
                                      <td className="py-4 px-6 text-gray-400">{lecture.time}</td>
                                      <td className="py-4 px-6">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getAttendanceStatusStyle(lecture.status)}`}>
                                          {getAttendanceStatusLabel(lecture.status)}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* Exams List */}
                        <div>
                          <h4 className="text-white font-bold mb-4 flex items-center gap-3 text-lg">
                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                              <i className="fas fa-file-alt text-primary text-sm"></i>
                            </div>
                            الامتحانات ({teacherData.exams.list.length})
                          </h4>
                          {teacherData.exams.list.length === 0 ? (
                            <div className="bg-[#0D1120] rounded-xl p-8 text-center border border-dashed border-white/10">
                              <p className="text-gray-500 text-sm">لا توجد امتحانات في هذه الفترة</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto rounded-xl border border-white/5">
                              <table className="w-full text-right">
                                <thead className="bg-white/5">
                                  <tr className="text-gray-400 text-sm">
                                    <th className="py-4 px-6 font-medium">الامتحان</th>
                                    <th className="py-4 px-6 font-medium">التاريخ</th>
                                    <th className="py-4 px-6 font-medium">الدرجة</th>
                                    <th className="py-4 px-6 font-medium">النسبة</th>
                                    <th className="py-4 px-6 font-medium">الحالة</th>
                                  </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-white/5">
                                  {teacherData.exams.list.map((exam) => (
                                    <tr key={exam.id} className="hover:bg-white/5 transition-colors">
                                      <td className="py-4 px-6 text-white font-medium">{exam.title}</td>
                                      <td className="py-4 px-6 text-gray-400">{exam.date}</td>
                                      <td className="py-4 px-6 text-white font-bold">
                                        {exam.score !== null ? `${exam.score}/${exam.max_score}` : '-'}
                                      </td>
                                      <td className="py-4 px-6">
                                        {exam.percentage !== null ? (
                                          <span className={`font-bold ${exam.percentage >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                            {exam.percentage}%
                                          </span>
                                        ) : '-'}
                                      </td>
                                      <td className="py-4 px-6">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                          exam.percentage !== null
                                            ? exam.percentage >= 50
                                              ? 'bg-green-500/20 text-green-400'
                                              : 'bg-red-500/20 text-red-400'
                                            : 'bg-gray-500/20 text-gray-400'
                                        }`}>
                                          {exam.percentage !== null ? (exam.percentage >= 50 ? 'ناجح' : 'راسب') : 'لم يختبر'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </DashboardCard>
              ))}

              {/* No Data */}
              {displayedTeachers.length === 0 && (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                  <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                    <i className="fas fa-filter text-4xl text-gray-400"></i>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">لا توجد بيانات للمدرس المحدد</h3>
                  <p className="text-gray-400">جرب اختيار مدرس آخر أو عرض جميع المدرسين</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </PageTransition>
  );
}
