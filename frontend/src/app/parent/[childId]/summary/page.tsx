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
import { Button, Icon, LoadingSpinner, BadgeV2 as Badge } from '@/components/ui';
import { Input } from '@/components/ui/Input';

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
      // Error handled silently
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

  const getAttendanceStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge variant="success" size="sm">حاضر</Badge>;
      case 'absent':
        return <Badge variant="danger" size="sm">غائب</Badge>;
      default:
        return <Badge variant="default" size="sm">غير مسجل</Badge>;
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
                <Icon name="user-slash" size="2x" className="text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">الابن غير موجود</h3>
              <Button
                variant="ghost"
                onClick={() => router.push('/parent/children')}
                className="mt-4"
              >
                العودة لقائمة الأبناء
              </Button>
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
                <Button
                  variant="ghost"
                  onClick={() => router.push('/parent/children')}
                  className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-colors p-0"
                >
                  <Icon name="arrow-right" size="lg" />
                </Button>
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
                      <Icon name="chalkboard-teacher" color="primary" />
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
                <Input
                  type="date"
                  label="التاريخ"
                  value={date}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
                />
              </div>

              {/* Period Filter */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-3">الفترة</label>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setPeriod('day')}
                    variant={period === 'day' ? 'primary' : 'outline'}
                    className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                  >
                    يومي
                  </Button>
                  <Button
                    onClick={() => setPeriod('month')}
                    variant={period === 'month' ? 'primary' : 'outline'}
                    className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                  >
                    شهري
                  </Button>
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
              <LoadingSpinner size="xl" color="primary" />
            </div>
          )}

          {/* Overall Statistics */}
          {!isLoading && summary && summary.teachers.length > 0 && (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-8">
              <StatCard
                title="نسبة الحضور"
                value={avgAttendance}
                suffix="%"
                icon="check-circle"
                color="success"
              />
              <StatCard
                title="متوسط الدرجات"
                value={avgExams}
                suffix="%"
                icon="chart-line"
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
                          <Icon name="chalkboard-teacher" className="text-white text-xl" />
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
                    <Badge variant={teacherData.subscription.is_active ? 'success' : 'danger'} size="sm">
                      {teacherData.subscription.is_active ? 'فعال' : 'غير فعال'}
                    </Badge>
                  </div>

                  {/* Stats Grid - Teacher Dashboard Style */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                    {/* Attendance */}
                    <div className="bg-[#0D1120] rounded-2xl p-6 text-center border border-white/5 hover:border-white/10 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                        <Icon name="check" className="text-green-400 text-lg" />
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
                        <Icon name="file-alt" className="text-blue-400 text-lg" />
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
                        <Icon name="trophy" className="text-purple-400 text-lg" />
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
                  <Button
                    onClick={() => setExpandedTeacher(expandedTeacher === teacherData.teacher.id ? null : teacherData.teacher.id)}
                    variant="ghost"
                    className="w-full py-3 text-primary text-sm font-bold hover:bg-primary/5 rounded-xl transition-colors flex items-center justify-center gap-2 group"
                  >
                    <span>{expandedTeacher === teacherData.teacher.id ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}</span>
                    <Icon name="chevron-down" className={`transition-transform duration-300 group-hover:translate-y-0.5 ${expandedTeacher === teacherData.teacher.id ? 'rotate-180' : ''}`} />
                  </Button>

                  <div className={`grid transition-[grid-template-rows,margin,opacity] duration-300 ease-in-out ${
                    expandedTeacher === teacherData.teacher.id ? 'grid-rows-[1fr] mt-8 opacity-100' : 'grid-rows-[0fr] mt-0 opacity-0'
                  }`}>
                    <div className="overflow-hidden">
                      <div className="space-y-8">
                        {/* Lectures List */}
                        <div>
                          <h4 className="text-white font-bold mb-4 flex items-center gap-3 text-lg">
                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                              <Icon name="book-open" className="text-primary text-sm" />
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
                                        {getAttendanceStatusBadge(lecture.status)}
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
                              <Icon name="file-alt" className="text-primary text-sm" />
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
                                        <Badge 
                                          variant={exam.percentage !== null ? (exam.percentage >= 50 ? 'success' : 'danger') : 'default'}
                                          size="sm"
                                        >
                                          {exam.percentage !== null ? (exam.percentage >= 50 ? 'ناجح' : 'راسب') : 'لم يختبر'}
                                        </Badge>
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
                    <Icon name="filter" size="3x" className="text-gray-400" />
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
