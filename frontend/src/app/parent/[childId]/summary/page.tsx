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
        <div className="max-w-[1200px] mx-auto space-y-10 pb-20 px-4 md:px-0">
          {/* Premium Header Card */}
          <div className="relative p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] premium-glass premium-border overflow-hidden shadow-2xl">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[130px] -translate-y-1/2 translate-x-1/3 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 blur-[130px] translate-y-1/2 -translate-x-1/3"></div>

            <div className="relative flex flex-col lg:flex-row justify-between items-center gap-10">
              <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-right">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/parent/children')}
                  className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-gray-light/40 hover:bg-primary/10 hover:text-primary transition-all premium-border p-0 shadow-lg"
                >
                  <Icon name="arrow-right" size="lg" />
                </Button>
                
                <div className="relative group">
                   <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full ring-4 ring-white/10 overflow-hidden shadow-2xl bg-gradient-to-br from-primary/20 to-purple-500/20">
                    {child.avatar ? (
                      <img src={child.avatar} alt={child.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-black text-white bg-gradient-to-br from-primary to-purple-600">
                        {child.name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col md:flex-row items-center gap-3">
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">تقارير {child.name}</h1>
                    <div className="px-4 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest shadow-lg">التفوق الدراسي</div>
                  </div>
                  <p className="text-gray-light/40 text-lg font-medium flex items-center justify-center md:justify-start gap-3">
                    <Icon name="chalkboard-teacher" className="text-primary/60" />
                    <span>متابع لدى <span className="text-white">{child.teachers.length}</span> مدرسين معتمدين</span>
                  </p>
                </div>
              </div>

              {/* Overall Performance Badge */}
              {!isLoading && summary && (
                <div className="flex flex-col items-center lg:items-end gap-4">
                  <div className="premium-glass p-6 rounded-[2rem] border-white/5 shadow-2xl flex flex-col items-center lg:items-end">
                    <span className="text-[10px] font-black text-gray-light/20 uppercase tracking-[0.2em] mb-3">الأداء العام</span>
                    <div className="flex items-center gap-6">
                       <div className="text-center">
                          <div className="text-3xl font-black text-emerald-400 tabular-nums">{avgAttendance}%</div>
                          <div className="text-[8px] font-black text-gray-light/30 uppercase tracking-widest">الحضور</div>
                       </div>
                       <div className="w-px h-10 bg-white/10" />
                       <div className="text-center">
                          <div className="text-3xl font-black text-primary tabular-nums">{avgExams}%</div>
                          <div className="text-[8px] font-black text-gray-light/30 uppercase tracking-widest">الدرجات</div>
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Filters Bar */}
          <div className="relative z-20 premium-glass premium-border rounded-[2.5rem] p-4 md:p-6 shadow-xl flex flex-wrap items-center justify-center md:justify-between gap-6">
             <div className="flex flex-wrap items-center gap-4 justify-center">
                <div className="relative">
                  <Icon name="calendar-day" className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 pointer-events-none" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-2xl h-12 pr-12 pl-6 text-sm text-white font-bold focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  />
                </div>

                <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/10">
                  <button
                    onClick={() => setPeriod('day')}
                    className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${period === 'day' ? 'bg-primary text-white shadow-lg' : 'text-gray-light/30 hover:text-white'}`}
                  >
                    يومي
                  </button>
                  <button
                    onClick={() => setPeriod('month')}
                    className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${period === 'month' ? 'bg-primary text-white shadow-lg' : 'text-gray-light/30 hover:text-white'}`}
                  >
                    شهري
                  </button>
                </div>
             </div>

             <div className="w-full md:w-72">
                <Filter
                  icon="filter"
                  placeholder="جميع المدرسين"
                  options={[
                    { value: '', label: 'جميع المدرسين' },
                    ...child.teachers.map((t) => ({
                      value: t.id,
                      label: t.name,
                    })),
                  ]}
                  value={selectedTeacherId || ''}
                  onChange={(val) => setSelectedTeacherId(val || null)}
                  className="premium-filter"
                  searchable={child.teachers.length > 5}
                />
             </div>
          </div>

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
            <div className="space-y-12">
              {displayedTeachers.map((teacherData) => (
                <div
                  key={teacherData.teacher.id}
                  className="relative group"
                >
                  {/* Decorative Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-[3rem] blur-3xl opacity-50"></div>
                  
                  <div className="relative premium-glass premium-border rounded-[3rem] overflow-hidden shadow-xl">
                    {/* Teacher Header Section */}
                    <div className="p-8 md:p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 bg-white/[0.02]">
                      <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-right">
                        <div className="relative">
                           <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                           <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-purple-600 p-0.5 shadow-xl">
                             <div className="w-full h-full rounded-[0.9rem] bg-slate-900 overflow-hidden">
                               {teacherData.teacher.avatar ? (
                                 <img src={teacherData.teacher.avatar} alt={teacherData.teacher.name} className="w-full h-full object-cover" />
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center text-white/40"><Icon name="chalkboard-teacher" size="xl" /></div>
                               )}
                             </div>
                           </div>
                        </div>
                        <div className="space-y-2">
                           <h3 className="text-2xl font-black text-white">{teacherData.teacher.name}</h3>
                           <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                              <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-xs font-bold text-gray-light/40">{teacherData.grade || 'غير محدد'}</span>
                              <span className="text-gray-light/10">•</span>
                              <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-xs font-bold text-gray-light/40">{teacherData.group || 'مجموعة عامة'}</span>
                           </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                         <div className="flex flex-col items-center md:items-end">
                            <span className="text-[9px] font-black text-gray-light/20 uppercase tracking-[0.2em] mb-1">الحالة</span>
                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${teacherData.subscription.is_active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                               {teacherData.subscription.is_active ? 'فعال' : 'منتهي'}
                            </div>
                         </div>
                      </div>
                    </div>

                    {/* Performance Metrics Grid */}
                    <div className="p-8 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                       {/* Attendance Metric */}
                       <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group/metric">
                          <div className="flex justify-between items-start mb-4">
                             <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xl shadow-lg shadow-emerald-500/5 group-hover/metric:scale-110 transition-transform">
                                <Icon name="check-double" />
                             </div>
                             <div className="text-right">
                                <span className="block text-[8px] font-black text-gray-light/20 uppercase tracking-widest">الحضور</span>
                                <span className="text-2xl font-black text-white">{teacherData.attendance.rate}%</span>
                             </div>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${teacherData.attendance.rate}%` }}></div>
                          </div>
                          <p className="mt-3 text-[10px] font-bold text-gray-light/30">حضر {teacherData.attendance.present} من أصل {teacherData.attendance.total_lectures} محاضرة</p>
                       </div>

                       {/* Exams Metric */}
                       <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group/metric">
                          <div className="flex justify-between items-start mb-4">
                             <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl shadow-lg shadow-primary/5 group-hover/metric:scale-110 transition-transform">
                                <Icon name="chart-bar" />
                             </div>
                             <div className="text-right">
                                <span className="block text-[8px] font-black text-gray-light/20 uppercase tracking-widest">المعدل</span>
                                <span className="text-2xl font-black text-white">{teacherData.exams.average}%</span>
                             </div>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                             <div className="h-full bg-primary shadow-[0_0_10px_rgba(66,99,235,0.5)]" style={{ width: `${teacherData.exams.average}%` }}></div>
                          </div>
                          <p className="mt-3 text-[10px] font-bold text-gray-light/30">اجتاز {teacherData.exams.taken} من أصل {teacherData.exams.total} امتحانات</p>
                       </div>

                       {/* Ranking Metric */}
                       <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group/metric">
                          <div className="flex justify-between items-start mb-4">
                             <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 text-xl shadow-lg shadow-amber-500/5 group-hover/metric:scale-110 transition-transform">
                                <Icon name="trophy" />
                             </div>
                             <div className="text-right">
                                <span className="block text-[8px] font-black text-gray-light/20 uppercase tracking-widest">الترتيب</span>
                                <span className="text-2xl font-black text-white">{teacherData.ranking.position ? `#${teacherData.ranking.position}` : 'N/A'}</span>
                             </div>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                             <div className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" style={{ width: teacherData.ranking.total > 0 ? `${(1 - ((teacherData.ranking.position || 1) / teacherData.ranking.total)) * 100}%` : '0%' }}></div>
                          </div>
                          <p className="mt-3 text-[10px] font-bold text-gray-light/30">من إجمالي {teacherData.ranking.total} طالب في الدفعة</p>
                       </div>
                    </div>

                    {/* Expand/Collapse Trigger */}
                    <button
                      onClick={() => setExpandedTeacher(expandedTeacher === teacherData.teacher.id ? null : teacherData.teacher.id)}
                      className={`w-full py-6 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all border-t border-white/5 hover:bg-white/5 ${expandedTeacher === teacherData.teacher.id ? 'text-primary' : 'text-gray-light/30 hover:text-white'}`}
                    >
                      <span>{expandedTeacher === teacherData.teacher.id ? 'إغفاء السجلات التفصيلية' : 'عرض السجلات التفصيلية'}</span>
                      <Icon name="chevron-down" className={`transition-transform duration-500 ${expandedTeacher === teacherData.teacher.id ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Detailed Lists Section */}
                    {expandedTeacher === teacherData.teacher.id && (
                      <div className="p-8 md:p-10 bg-slate-900/50 space-y-12 animate-in fade-in slide-in-from-top-4 duration-500">
                        {/* Lectures Section */}
                        <div className="space-y-6">
                           <div className="flex items-center gap-3 px-2">
                              <Icon name="calendar-check" className="text-emerald-400" />
                              <h4 className="text-sm font-black text-white uppercase tracking-widest">سجل الحضور والمحاضرات</h4>
                           </div>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {teacherData.attendance.list.length === 0 ? (
                                <div className="col-span-full py-12 premium-glass border-dashed border-white/10 rounded-[2rem] text-center text-gray-light/20 font-bold">لا يوجد سجل محاضرات لهذه الفترة</div>
                              ) : (
                                teacherData.attendance.list.map((lecture, index) => (
                                  <div key={`${teacherData.teacher.id}-lecture-${lecture.id || index}`} className="premium-glass p-5 rounded-2xl border-white/5 flex items-center justify-between group/item hover:border-white/20 transition-all">
                                     <div className="space-y-1">
                                        <h5 className="text-white font-bold text-sm line-clamp-1">{lecture.title}</h5>
                                        <div className="flex items-center gap-3 text-[10px] text-gray-light/30 font-bold">
                                           <span>{lecture.date}</span>
                                           <span>•</span>
                                           <span>{lecture.time}</span>
                                        </div>
                                     </div>
                                     <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${lecture.status === 'present' ? 'bg-emerald-500/10 text-emerald-400' : lecture.status === 'absent' ? 'bg-rose-500/10 text-rose-400' : 'bg-white/5 text-gray-light/40'}`}>
                                        {lecture.status === 'present' ? 'حاضر' : lecture.status === 'absent' ? 'غائب' : 'لم يسجل'}
                                     </div>
                                  </div>
                                ))
                              )}
                           </div>
                        </div>

                        {/* Exams Section */}
                        <div className="space-y-6">
                           <div className="flex items-center gap-3 px-2">
                              <Icon name="file-invoice" className="text-primary" />
                              <h4 className="text-sm font-black text-white uppercase tracking-widest">نتائج الاختبارات والتقييمات</h4>
                           </div>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {teacherData.exams.list.length === 0 ? (
                                <div className="col-span-full py-12 premium-glass border-dashed border-white/10 rounded-[2rem] text-center text-gray-light/20 font-bold">لا يوجد سجل امتحانات لهذه الفترة</div>
                              ) : (
                                teacherData.exams.list.map((exam, index) => (
                                  <div key={`${teacherData.teacher.id}-exam-${exam.id || index}`} className="premium-glass p-6 rounded-2xl border-white/5 space-y-4 group/item hover:border-white/20 transition-all">
                                     <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                           <h5 className="text-white font-bold text-sm line-clamp-1">{exam.title}</h5>
                                           <p className="text-[10px] text-gray-light/30 font-bold uppercase tracking-widest">{exam.subject}</p>
                                        </div>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${(exam.percentage || 0) >= 80 ? 'bg-emerald-500/10 text-emerald-400' : (exam.percentage || 0) >= 50 ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                           {exam.percentage ? `${exam.percentage}%` : '-%'}
                                        </div>
                                     </div>
                                     
                                     <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex flex-col">
                                           <span className="text-[8px] font-black text-gray-light/20 uppercase tracking-widest mb-0.5">الدرجة</span>
                                           <span className="text-xs font-black text-white">{exam.score !== null ? `${exam.score}/${exam.max_score}` : 'لم يختبر'}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                           <span className="text-[8px] font-black text-gray-light/20 uppercase tracking-widest mb-0.5">التاريخ</span>
                                           <span className="text-xs font-bold text-gray-light/40">{exam.date}</span>
                                        </div>
                                     </div>
                                  </div>
                                ))
                              )}
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* No Data State */}
              {displayedTeachers.length === 0 && (
                <div className="py-24 premium-glass premium-border rounded-[3rem] text-center flex flex-col items-center justify-center">
                   <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-gray-light/10 mb-6 shadow-inner">
                      <Icon name="folder-open" size="3x" />
                   </div>
                   <h3 className="text-2xl font-black text-white mb-2 tracking-tight">لا تتوفر سجلات حالياً</h3>
                   <p className="text-gray-light/40 font-medium max-w-sm mx-auto leading-relaxed">لم يتم العثور على بيانات تطابق الفلاتر المحددة لهذه الفترة</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </PageTransition>
  );
}
