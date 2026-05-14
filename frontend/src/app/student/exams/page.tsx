'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { fetchApi } from '@/services/authService';
import { Skeleton, Button, Icon } from '@/components/ui/index';

export default function StudentExamsPage() {
  const { user, selectedTeacher } = useAuth();
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExams = async () => {
      if (!selectedTeacher) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await fetchApi(`/student/exams?teacher_id=${selectedTeacher.teacher_id}`);
        if (response) {
          setExams(response.data || []);
        }
      } catch (error) {
        console.error('Failed to load exams:', error);
      } finally {
        setLoading(false);
      }
    };

    loadExams();
  }, [selectedTeacher]);

  // Available = not completed, Completed = has result
  const availableExams = exams.filter(e => !e.is_completed);
  const completedExams = exams.filter(e => e.is_completed);




  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  return (
    <DashboardLayout
      role="student"
      user={user || undefined}
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Premium Page Header */}
        <div className="relative mb-12 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] premium-glass premium-border overflow-hidden">
          {/* Background Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 blur-[120px] -translate-y-1/2 translate-x-1/3 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 blur-[120px] translate-y-1/2 -translate-x-1/3"></div>

          <div className="relative flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-right">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-primary text-4xl shadow-2xl premium-border">
                <Icon name="file-alt" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">مركز الامتحانات</h2>
                <p className="text-gray-light/60 text-lg font-medium">اختبر معلوماتك وتابع نتائجك وتطور مستواك الدراسي</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="flex flex-col items-center md:items-end">
                  <span className="text-[10px] font-black text-gray-light/30 uppercase tracking-[0.2em] mb-1">المعلم الحالي</span>
                  <span className="text-xl font-black text-white">
                    {selectedTeacher?.teacher_name || (selectedTeacher as any)?.name || 'اختر مدرساً'}
                  </span>
               </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-12">
          <StatCard
            title="إجمالي الامتحانات"
            value={exams.length}
            icon="fas fa-file-alt"
            color="primary"
            variant="centered"
          />
          <StatCard
            title="امتحانات مكتملة"
            value={exams.filter(e => e.score !== undefined || e.is_completed).length}
            icon="fas fa-check-circle"
            color="success"
            variant="centered"
          />
          <StatCard
            title="متوسط الدرجات"
            value={exams.filter(e => e.score !== undefined).length > 0 ? Math.round(exams.reduce((acc, curr) => acc + (curr.score || 0), 0) / (exams.filter(e => e.score !== undefined).length || 1)) : 0}
            suffix="%"
            icon="fas fa-star"
            color="warning"
            variant="centered"
          />
        </div>

        {/* Available Exams */}
        {/* Section: Available Exams */}
        <div className="mb-16">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10 px-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3 text-primary mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-lg shadow-primary/5">
                  <Icon name="pen-nib" className="text-lg" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] opacity-50">الاختبارات الحالية</h3>
              </div>
              <h2 className="text-3xl font-black text-white">امتحانات بانتظارك</h2>
            </div>
            
            <div className="flex items-center gap-4 bg-white/5 p-1.5 rounded-2xl border border-white/10 premium-glass">
              <div className="px-5 py-2.5 rounded-xl bg-primary shadow-lg shadow-primary/20 text-white text-xs font-black">الكل ({availableExams.length})</div>
              <div className="px-5 py-2.5 rounded-xl hover:bg-white/5 text-gray-light/40 text-xs font-black transition-all cursor-pointer">مفعلة</div>
              <div className="px-5 py-2.5 rounded-xl hover:bg-white/5 text-gray-light/40 text-xs font-black transition-all cursor-pointer">قادمة</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-80 rounded-[2.5rem] premium-glass premium-border animate-pulse" />
              ))
            ) : availableExams.length > 0 ? (
              availableExams.map((exam) => (
                <div
                  key={exam.id}
                  className="group relative h-full rounded-[2.5rem] premium-glass premium-border hover:bg-white/5 transition-all duration-700 overflow-hidden flex flex-col"
                >
                  {/* Glass Header with Subject */}
                  <div className="p-8 pb-4">
                    <div className="flex justify-between items-center mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary text-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                        <Icon name="scroll" />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-gray-light/30 uppercase tracking-widest mb-1">المادة</span>
                        <span className="text-sm font-bold text-gray-light/80">{exam.subject}</span>
                      </div>
                    </div>

                    <h4 className="text-xl font-black text-white mb-2 leading-tight group-hover:text-primary transition-colors duration-500">{exam.title}</h4>
                    <p className="text-gray-light/40 text-xs font-medium line-clamp-2 mb-6">اختبار شامل يغطي أهم نقاط المنهج لقياس مدى استيعابك للمعلومات</p>
                  </div>

                  {/* Stats Grid - Inset */}
                  <div className="mx-6 p-5 rounded-3xl bg-white/[0.03] border border-white/5 grid grid-cols-2 gap-4 mb-8">
                    <div className="space-y-1">
                      <span className="block text-[8px] font-black text-gray-light/20 uppercase tracking-widest">الوقت</span>
                      <div className="flex items-center gap-2 text-white">
                        <Icon name="clock" className="text-xs text-primary/60" />
                        <span className="text-xs font-black">{exam.time_per_question || 60} ث/س</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[8px] font-black text-gray-light/20 uppercase tracking-widest">الأسئلة</span>
                      <div className="flex items-center gap-2 text-white">
                        <Icon name="list-ol" className="text-xs text-secondary/60" />
                        <span className="text-xs font-black">{exam.actual_question_count || 10} سؤال</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-auto p-6 pt-0">
                    {exam.is_active ? (
                      <Button
                        variant="primary"
                        className="w-full rounded-[1.5rem] h-14 font-black text-sm shadow-xl shadow-primary/10 hover:shadow-primary/30 group-hover:scale-[1.03] transition-all flex items-center justify-center gap-3 overflow-hidden group/btn"
                        onClick={() => router.push(`/student/exams/${exam.id}/take`)}
                      >
                        <span>دخول الامتحان</span>
                        <Icon name="arrow-left" className="group-hover/btn:translate-x-[-4px] transition-transform" />
                      </Button>
                    ) : (
                      <div className="w-full h-14 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-gray-light/30 font-black text-sm gap-3 grayscale">
                        <Icon name="lock" />
                        قيد التفعيل
                      </div>
                    )}
                  </div>

                  {/* Decorative element */}
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/5 blur-3xl -mr-12 -mb-12 group-hover:bg-primary/10 transition-all duration-700" />
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 premium-glass premium-border rounded-[3rem] text-center">
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 text-gray-light/20 text-4xl shadow-inner">
                  <Icon name="wind" />
                </div>
                <h4 className="text-2xl font-black text-white mb-3">هدوء تام..</h4>
                <p className="text-gray-light/40 font-medium max-w-sm mx-auto">لا توجد امتحانات مضافة حالياً في جدولك الدراسي، استغل الوقت في المراجعة!</p>
              </div>
            )}
          </div>
        </div>

        {/* Section: Completed Exams */}
        <div className="mb-20">
          <div className="flex items-center gap-5 mb-10 px-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 text-xl shadow-lg shadow-emerald-500/5">
              <Icon name="check-double" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">سجل الإنجازات</h3>
              <p className="text-gray-light/40 text-sm font-medium tracking-wide">تاريخك المشرف في الامتحانات السابقة</p>
            </div>
          </div>

          <div className="space-y-5">
            {completedExams.length > 0 ? (
              completedExams.map((exam) => (
                <div
                  key={exam.id}
                  className="group relative p-6 md:p-8 rounded-[2.5rem] premium-glass premium-border hover:bg-white/5 transition-all duration-500 flex flex-col md:flex-row justify-between items-center gap-8 overflow-hidden"
                >
                  <div className="flex items-center gap-8 w-full md:w-auto relative z-10">
                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ${
                      (exam.student_score / exam.max_score) >= 0.8 ? 'bg-emerald-500/10 text-emerald-500 shadow-lg shadow-emerald-500/5' :
                      (exam.student_score / exam.max_score) >= 0.5 ? 'bg-amber-500/10 text-amber-500 shadow-lg shadow-amber-500/5' : 'bg-rose-500/10 text-rose-500 shadow-lg shadow-rose-500/5'
                    }`}>
                      <Icon name="medal" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-white mb-2">{exam.title}</h4>
                      <div className="flex flex-wrap items-center gap-4 text-gray-light/40 text-[11px] font-black uppercase tracking-widest">
                        <span className="flex items-center gap-2">
                           <Icon name="book" className="text-primary/60" />
                           {exam.subject}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        <span className="flex items-center gap-2">
                           <Icon name="calendar-alt" className="text-secondary/60" />
                           {formatDate(exam.date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-12 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-6 md:pt-0 relative z-10">
                    <div className="text-center md:text-right">
                      <span className="block text-[9px] font-black text-gray-light/20 uppercase tracking-[0.2em] mb-2">الدرجة المحققة</span>
                      <div className="flex items-baseline justify-center md:justify-end gap-1">
                        <span className={`text-3xl font-black ${
                          (exam.student_score / exam.max_score) >= 0.8 ? 'text-emerald-500' :
                          (exam.student_score / exam.max_score) >= 0.5 ? 'text-amber-500' : 'text-rose-500'
                        }`}>
                          {exam.student_score}
                        </span>
                        <span className="text-gray-light/20 text-sm font-black">/ {exam.max_score}</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="rounded-2xl border-white/10 hover:border-primary hover:bg-primary/10 px-8 h-12 font-black group-hover:scale-105 transition-all text-xs"
                      onClick={() => router.push(`/student/exams/${exam.id}/results`)}
                    >
                      عرض التفاصيل
                      <Icon name="chevron-left" className="mr-3 text-[10px]" />
                    </Button>
                  </div>
                  
                  {/* Decorative subtle gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                </div>
              ))
            ) : (
              <div className="py-16 premium-glass premium-border rounded-[2.5rem] text-center">
                <p className="text-gray-light/30 font-black uppercase tracking-widest text-xs">سجل الامتحان فارغ تماماً</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
