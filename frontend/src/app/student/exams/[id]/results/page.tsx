'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { fetchApi } from '@/services/authService';
import { toast } from 'react-hot-toast';
import { Icon, Button, LoadingSpinner, Badge } from '@/components/ui';

interface ResultData {
  score: number;
  max_score: number;
  percentage: number;
  correct_answers: number;
  total_questions: number;
  terminated: boolean;
  terminated_reason: string | null;
}

interface ExamData {
  id: string;
  title: string;
  subject: string;
  max_score: number;
}

export default function StudentExamResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('attempt_id');

  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ResultData | null>(null);
  const [exam, setExam] = useState<ExamData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const resultUrl = attemptId 
          ? `/student/exams/${id}/result?attempt_id=${attemptId}`
          : `/student/exams/${id}/result`;

        // We need both the result and the exam details
        const [resultRes, examRes] = await Promise.all([
          fetchApi(resultUrl),
          fetchApi(`/student/exams/${id}`)
        ]);
        
        setResult(resultRes);
        setExam(examRes.exam);
      } catch (error: any) {
        console.error('Error fetching result:', error);
        toast.error('حدث خطأ أثناء تحميل النتيجة');
        router.push('/student/exams');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, attemptId, router]);

  if (loading) {
    return (
      <DashboardLayout role="student" user={user || undefined}>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" color="primary" />
          <p className="text-gray-light/40 mt-4 font-black animate-pulse">جاري جلب نتائجك المبهرة...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!result || !exam) return null;

  return (
    <DashboardLayout role="student" user={user || undefined}>
      <div className="max-w-[900px] mx-auto py-10 px-4">
        {/* Header Section */}
        <div className="text-center mb-16 relative">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-2xl bg-white/5 border border-white/10 premium-glass mb-6">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-black text-gray-light/60 uppercase tracking-[0.2em]">تم الانتهاء من الاختبار بنجاح</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
             {exam.title}
          </h1>
          <p className="text-gray-light/40 font-bold text-lg">{exam.subject}</p>
          
          {/* Decorative glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 blur-[100px] -z-10" />
        </div>

        {/* Score Card Section */}
        <div className="relative group mb-12">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-emerald-500/20 to-primary/20 rounded-[3rem] blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative premium-glass premium-border rounded-[3rem] p-10 md:p-16 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              {/* Score Chart Circle */}
              <div className="flex justify-center">
                <div className="relative w-56 h-56 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="112"
                      cy="112"
                      r="100"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      className="text-white/5"
                    />
                    <circle
                      cx="112"
                      cy="112"
                      r="100"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 100}
                      strokeDashoffset={2 * Math.PI * 100 * (1 - result.percentage / 100)}
                      strokeLinecap="round"
                      className={`${
                        result.percentage >= 80 ? 'text-emerald-500' : 
                        result.percentage >= 50 ? 'text-amber-500' : 'text-rose-500'
                      } transition-all duration-1000 ease-out`}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-6xl font-black text-white">{result.percentage}%</span>
                    <span className="text-xs font-black text-gray-light/30 uppercase tracking-widest mt-2">معدل النجاح</span>
                  </div>
                </div>
              </div>

              {/* Score Details */}
              <div className="space-y-8">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                  <span className="block text-[10px] font-black text-gray-light/30 uppercase tracking-[0.2em] mb-4">النتيجة بالأرقام</span>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-black text-white">{result.score}</span>
                    <span className="text-gray-light/20 text-2xl font-black">/ {exam.max_score}</span>
                  </div>
                  <p className="text-gray-light/40 text-sm font-medium">لقد حققت تقدير {
                    result.percentage >= 90 ? 'ممتاز' :
                    result.percentage >= 80 ? 'جيد جداً' :
                    result.percentage >= 65 ? 'جيد' :
                    result.percentage >= 50 ? 'مقبول' : 'ضعيف'
                  } في هذا الاختبار</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center gap-3 text-emerald-500 mb-2">
                      <Icon name="check-circle" />
                      <span className="text-[10px] font-black uppercase">صحيحة</span>
                    </div>
                    <span className="text-2xl font-black text-white">{result.correct_answers}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center gap-3 text-rose-500 mb-2">
                      <Icon name="times-circle" />
                      <span className="text-[10px] font-black uppercase">خاطئة</span>
                    </div>
                    <span className="text-2xl font-black text-white">{result.total_questions - result.correct_answers}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="premium-glass premium-border p-8 rounded-[2.5rem] flex items-center gap-6 group hover:bg-white/5 transition-all">
             <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl group-hover:scale-110 transition-all">
                <Icon name="stopwatch" />
             </div>
             <div>
                <span className="block text-[9px] font-black text-gray-light/20 uppercase tracking-widest mb-1">الزمن المستغرق</span>
                <span className="text-xl font-black text-white">غير محدد</span>
             </div>
          </div>
          <div className="premium-glass premium-border p-8 rounded-[2.5rem] flex items-center gap-6 group hover:bg-white/5 transition-all">
             <div className="w-14 h-14 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary text-xl group-hover:scale-110 transition-all">
                <Icon name="award" />
             </div>
             <div>
                <span className="block text-[9px] font-black text-gray-light/20 uppercase tracking-widest mb-1">النقاط المكتسبة</span>
                <span className="text-xl font-black text-white">+{Math.floor(result.score * 10)}</span>
             </div>
          </div>
          <div className="premium-glass premium-border p-8 rounded-[2.5rem] flex items-center gap-6 group hover:bg-white/5 transition-all">
             <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 text-xl group-hover:scale-110 transition-all">
                <Icon name="medal" />
             </div>
             <div>
                <span className="block text-[9px] font-black text-gray-light/20 uppercase tracking-widest mb-1">الترتيب</span>
                <span className="text-xl font-black text-white">#1</span>
             </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-6">
          <Button
            variant="primary"
            className="flex-1 rounded-[1.5rem] h-16 font-black text-lg shadow-xl shadow-primary/10 hover:shadow-primary/30 group"
            onClick={() => router.push('/student/mistakes')}
          >
            <Icon name="book-open" className="ml-3 group-hover:rotate-12 transition-all" />
            مراجعة الأخطاء في كراستك
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-[1.5rem] h-16 font-black text-lg premium-glass hover:bg-white/5 border-white/10 group"
            onClick={() => router.push('/student/exams')}
          >
            <Icon name="arrow-right" className="ml-3 group-hover:translate-x-1 transition-all" />
            العودة لقائمة الامتحانات
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
