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
                  <span className="text-xl font-black text-white">{selectedTeacher?.name || 'اختر مدرساً'}</span>
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
        <DashboardCard
          title="الامتحانات المتاحة"
          icon="fas fa-pen-alt"
        >
          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-5 bg-white/5 rounded-xl border border-white/10"
                >
                  <Skeleton width="60%" height="24px" className="mb-3" />
                  <Skeleton width="100%" height="16px" className="mb-2" />
                  <Skeleton width="80%" height="16px" className="mb-4" />
                  <div className="flex flex-col gap-2">
                    <Skeleton width="40%" height="16px" />
                    <Skeleton width="40%" height="16px" />
                    <Skeleton width="40%" height="16px" />
                  </div>
                </div>
              ))
            ) : (
              availableExams.map((exam) => (
              <div
                key={exam.id}
                className={`p-4 md:p-5 bg-white/5 rounded-xl border border-white/10 ${
                  exam.is_completed ? 'border-r-success' : 'border-r-primary'
                } border-r-4 relative overflow-hidden group hover:border-white/20 transition-all`}
              >
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="flex justify-between items-start mb-3 relative z-10">
                  <h3 className="text-[1.05rem] font-bold text-white">
                    {exam.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-md text-xs font-bold border ${
                    exam.is_completed ? 'bg-success/10 text-success border-success/20' : 'bg-primary/10 text-primary border-primary/20'
                  }`}>
                    {exam.is_completed ? 'مكتمل' : 'متاح'}
                  </span>
                </div>
                
                <div className="flex flex-col gap-2 mb-4 text-[0.85rem] relative z-10">
                <div className="flex gap-2 text-light">
                  <Icon name="clock" className="w-4 text-primary" />
                  <span>{exam.time_per_question || 60} ثانية لكل سؤال</span>
                </div>
                <div className="flex gap-2 text-light">
                  <Icon name="list-ol" className="w-4 text-info" />
                  <span>{exam.actual_question_count || 10} سؤال</span>
                </div>
                <div className="flex gap-2 text-light">
                  <Icon name="star" className="w-4 text-warning" />
                  <span>{exam.max_score} درجة</span>
                </div>
                {exam.student_score !== null && exam.student_score !== undefined && (
                  <div className="flex gap-2 text-success">
                    <Icon name="check-circle" className="w-4" />
                    <span>الدرجة: {exam.student_score}/{exam.max_score} ({exam.student_percentage}%)</span>
                  </div>
                )}
              </div>

              {!exam.is_completed && (
                exam.is_active ? (
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all relative z-10"
                    onClick={() => router.push(`/student/exams/${exam.id}/take`)}
                  >
                    <Icon name="play" className="ml-2" />
                    بدء الامتحان
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full opacity-70 cursor-not-allowed relative z-10"
                    disabled
                  >
                    <Icon name="lock" className="ml-2" />
                    في انتظار التفعيل
                  </Button>
                )
              )}
              </div>
            ))
            )}
            {!loading && availableExams.length === 0 && (
              <div className="col-span-full text-center p-10 text-gray-light">
                لا توجد امتحانات متاحة
              </div>
            )}
          </div>
        </DashboardCard>

        {/* Completed Exams */}
        <DashboardCard
          title="سجل الامتحانات"
          icon="fas fa-history"
        >
          <div className="flex flex-col gap-4">
            {completedExams.map((exam) => (
              <div
                key={exam.id}
                className="p-4 bg-white/3 rounded-xl border border-white/5 flex justify-between items-center flex-wrap gap-4"
              >
                <div>
                  <h3 className="text-base font-semibold text-white mb-1.5">
                    {exam.title}
                  </h3>
                  <p className="text-[0.85rem] text-gray-light">
                    {exam.subject} • {formatDate(exam.date)}
                  </p>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <span className="block text-xs text-gray-light mb-1">الدرجة</span>
                    <span 
                      className={`text-[1.2rem] font-bold ${
                        (exam.student_score || 0) >= (exam.max_score * 0.8) ? 'text-success' : 
                        (exam.student_score || 0) >= (exam.max_score * 0.5) ? 'text-warning' : 'text-danger'
                      }`}
                    >
                      {exam.student_score}/{exam.max_score}
                    </span>
                  </div>

                </div>
              </div>
            ))}
            {completedExams.length === 0 && (
              <div className="text-center p-10 text-gray-light">
                لم تقم بأداء أي امتحانات بعد
              </div>
            )}
          </div>
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
}
