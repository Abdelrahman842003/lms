'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { LoadingSpinner, FormModal, Button, Icon, Input, Badge } from '@/components/ui';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { toast } from 'react-hot-toast';
import { fetchApi } from '@/services/authService';

// Types
interface FailedQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  student_answer: string;
}

interface StudentResult {
  id: string;
  student: {
    id: string;
    name: string;
    phone: string;
  };
  score: number;
  percentage: number;
  failed_questions: FailedQuestion[];
}

interface ExamData {
  id: string;
  title: string;
  subject: string;
  max_score: number;
  date: string;
  duration: number;
}

// Helper functions
const getScoreColor = (pct: number): string => {
  if (pct >= 80) return 'text-green-500';
  if (pct >= 60) return 'text-blue-500';
  if (pct >= 50) return 'text-yellow-500';
  return 'text-red-500';
};

const getScoreBgColor = (pct: number): string => {
  if (pct >= 80) return 'bg-green-500';
  if (pct >= 60) return 'bg-blue-500';
  if (pct >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
};

export default function ExamResultsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  
  // State
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<ExamData | null>(null);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const hasFetched = React.useRef(false);

  // Fetch results on mount
  useEffect(() => {
    if (id && !hasFetched.current) {
      hasFetched.current = true;
      fetchResults();
    }
  }, [id]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      console.log('Fetching results for exam ID:', id);
      const response = await fetchApi<{ exam: ExamData; results: StudentResult[] }>(`/teacher/exams/${id}/results`);
      setExam(response?.exam ?? null);
      setResults(response?.results || []);
    } catch (error: any) {
      console.error('Error fetching exam results:', error);
      console.error('Exam ID requested:', id);
      console.error('Response status:', error?.response?.status);
      console.error('Response message:', error?.response?.data?.message);
      
      if (error?.response?.status === 404 || error?.response?.status === 403) {
        toast.error(`خطأ: ${error?.response?.data?.message || 'الامتحان غير موجود أو غير مصرح'}`);
        router.push('/teacher/exams');
        return;
      }
      toast.error('حدث خطأ أثناء تحميل النتائج');
    } finally {
      setLoading(false);
    }
  };

  // Computed values
  const totalStudents = results.length;
  const avgScore = totalStudents > 0 
    ? (results.reduce((sum, r) => sum + Number(r.percentage), 0) / totalStudents).toFixed(1)
    : '0';
  const passedStudents = results.filter(r => Number(r.percentage) >= 50).length;
  const failedStudents = totalStudents - passedStudents;
  const highestScore = totalStudents > 0 
    ? Math.max(...results.map(r => Number(r.percentage)))
    : 0;

  // Filter results
  const filteredResults = results.filter(result => 
    result.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    result.student.phone.includes(searchQuery)
  );

  // Get student rank
  const getStudentRank = (studentId: string): number => {
    const sorted = [...results].sort((a, b) => Number(b.percentage) - Number(a.percentage));
    return sorted.findIndex(r => r.id === studentId) + 1;
  };

  return (
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={{ name: user?.name || 'المدرس', avatar: user?.avatar || '' }}
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-4">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
          >
            <Icon name="arrow-right" />
          </Button>
          
          <div className="space-y-2">
            <div className="flex items-center gap-3">
               <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 premium-border">
                  <Icon name="chart-bar" size="xl" />
               </div>
               <div>
                  <h2 className="text-3xl font-black text-white tracking-tight">نتائج الطلاب</h2>
                  <p className="text-gray-light/40 font-medium px-1">{exam?.title || 'جاري تحميل البيانات...'}</p>
               </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/5 p-4 rounded-2xl">
           <div className="text-left">
              <p className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest leading-none mb-1">أعلى درجة</p>
              <p className="text-xl font-black text-primary leading-none">{highestScore}%</p>
           </div>
           <div className="w-px h-8 bg-white/10" />
           <div className="text-left">
              <p className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest leading-none mb-1">المادة</p>
              <p className="text-sm font-bold text-white leading-none">{exam?.subject || '---'}</p>
           </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="عدد الطلاب" value={totalStudents} icon="users" color="primary" />
        <StatCard title="المتوسط" value={avgScore} suffix="%" icon="chart-line" color="warning" />
        <StatCard title="الناجحين" value={passedStudents} icon="check-circle" color="success" />
        <StatCard title="الراسبين" value={failedStudents} icon="times-circle" color="danger" />
      </div>

      {/* Results Section */}
      <div className="space-y-6">
        {/* Filter & Search Bar */}
        <div className="premium-glass p-4 rounded-[2rem] border-white/5">
           <div className="relative group">
              <Icon name="search" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-light/20 group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder="ابحث عن طالب بالاسم أو رقم الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 bg-white/5 border-white/5 group-hover:border-white/10 rounded-2xl pr-12 font-bold placeholder:text-gray-light/10 transition-all focus:bg-white/10"
              />
           </div>
        </div>

        {loading && results.length === 0 ? (
          <div className="grid grid-cols-1 gap-4">
             {[1,2,3,4].map(i => (
                <div key={i} className="h-24 bg-white/5 rounded-2xl border border-white/5 animate-pulse" />
             ))}
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="premium-glass p-20 rounded-[3rem] border-white/5 flex flex-col items-center justify-center text-center">
             <div className="w-24 h-24 rounded-[2rem] bg-white/5 flex items-center justify-center text-gray-light/10 mb-8 premium-border">
                <Icon name="user-slash" size="3x" />
             </div>
             <h3 className="text-2xl font-black text-white mb-3">لا توجد نتائج مطابقة</h3>
             <p className="text-gray-light/30 max-w-md font-medium">لم نجد أي طلاب يطابقون بحثك. تأكد من كتابة الاسم أو الرقم بشكل صحيح.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredResults.map((result, index) => {
               const rank = getStudentRank(result.id);
               const isTop3 = rank <= 3;
               return (
                 <div
                   key={result.id}
                   onClick={() => setSelectedStudent(result)}
                   className="group relative transition-all duration-300"
                 >
                   <div className={`absolute inset-0 rounded-3xl transition-all duration-300 pointer-events-none 
                     ${isTop3 ? 'bg-primary/5 border-2 border-primary/20 shadow-[0_0_30px_rgba(66,99,235,0.1)]' : 'bg-[#101426]/40 border border-white/5 group-hover:border-white/20'}`}
                   />
                   
                   <div className="relative p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer">
                     {/* Left: Rank & Info */}
                     <div className="flex items-center gap-5">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 border
                         ${rank === 1 ? 'bg-amber-500/20 text-amber-500 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 
                           rank === 2 ? 'bg-slate-300/20 text-slate-300 border-slate-300/30' : 
                           rank === 3 ? 'bg-orange-400/20 text-orange-400 border-orange-400/30' : 
                           'bg-white/5 text-gray-light/20 border-white/5'}`}
                       >
                         {rank}
                       </div>
                       
                       <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <h4 className="text-lg font-black text-white group-hover:text-primary transition-colors">{result.student.name}</h4>
                             {isTop3 && <Icon name="crown" size="xs" className="text-amber-500" />}
                          </div>
                          <div className="flex items-center gap-4 text-[11px] font-bold text-gray-light/40 uppercase tracking-widest">
                             <span className="flex items-center gap-1.5"><Icon name="phone" className="text-[10px]" /> {result.student.phone}</span>
                             <span className="flex items-center gap-1.5"><Icon name="question-circle" className="text-[10px]" /> {result.failed_questions.length} أخطاء</span>
                          </div>
                       </div>
                     </div>

                     {/* Right: Scores */}
                     <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                       <div className="flex flex-col md:items-end">
                          <span className="text-[10px] font-black text-gray-light/20 uppercase tracking-widest mb-1">الدرجة</span>
                          <div className="flex items-baseline gap-1">
                             <span className="text-2xl font-black text-white">{result.score}</span>
                             <span className="text-sm font-bold text-gray-light/30">/ {exam?.max_score}</span>
                          </div>
                       </div>

                       <div className="flex flex-col md:items-end min-w-[100px]">
                          <span className="text-[10px] font-black text-gray-light/20 uppercase tracking-widest mb-1">النسبة</span>
                          <div className={`text-2xl font-black ${getScoreColor(Number(result.percentage))}`}>
                             {result.percentage}%
                          </div>
                       </div>
                       
                       <div className="hidden md:flex w-12 h-12 rounded-xl bg-white/5 items-center justify-center text-gray-light/20 group-hover:text-primary group-hover:bg-primary/10 transition-all border border-white/5">
                          <Icon name="chevron-left" />
                       </div>
                     </div>
                   </div>
                 </div>
               );
            })}
          </div>
        )}
      </div>

      {/* Student Details Modal */}
      <FormModal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onSubmit={(e) => { e.preventDefault(); setSelectedStudent(null); }}
        title="تحليل نتيجة الطالب"
        cancelText="إغلاق النافذة"
        maxWidth="700px"
      >
        {selectedStudent && (
          <div className="space-y-8 py-2">
            {/* Header Analysis */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-[2rem] bg-white/5 border border-white/5 relative overflow-hidden">
               <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 ${getScoreBgColor(Number(selectedStudent.percentage))}`} />
               
               <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shrink-0 border-2 relative z-10
                 ${getScoreBgColor(Number(selectedStudent.percentage))}/20 border-${getScoreColor(Number(selectedStudent.percentage)).split('-')[1]}-500/30 shadow-2xl`}>
                 <Icon name="user-graduate" size="2x" className={getScoreColor(Number(selectedStudent.percentage))} />
               </div>
               
               <div className="flex-1 text-center sm:text-right space-y-1 relative z-10">
                 <div className="flex items-center justify-center sm:justify-start gap-3">
                    <h2 className="text-2xl font-black text-white">{selectedStudent.student.name}</h2>
                    <Badge variant={Number(selectedStudent.percentage) >= 50 ? 'success' : 'danger'} size="sm" className="font-black">
                       {Number(selectedStudent.percentage) >= 50 ? 'ناجح' : 'راسب'}
                    </Badge>
                 </div>
                 <p className="text-gray-light/40 font-bold flex items-center justify-center sm:justify-start gap-2">
                   <Icon name="phone" size="xs" />
                   {selectedStudent.student.phone}
                 </p>
               </div>

               <div className="text-center sm:text-left relative z-10">
                  <div className={`text-4xl font-black ${getScoreColor(Number(selectedStudent.percentage))} tracking-tighter`}>
                    {selectedStudent.percentage}%
                  </div>
                  <p className="text-[10px] font-black text-gray-light/30 uppercase tracking-[0.2em]">النسبة النهائية</p>
               </div>
            </div>

            {/* Performance Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
               <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                     <Icon name="award" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-light/30 uppercase mb-1">الترتيب</span>
                  <span className="text-lg font-black text-white">{getStudentRank(selectedStudent.id)} / {totalStudents}</span>
               </div>

               <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 mb-3">
                     <Icon name="times-circle" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-light/30 uppercase mb-1">الأخطاء</span>
                  <span className="text-lg font-black text-white">{selectedStudent.failed_questions.length} أسئلة</span>
               </div>

               <div className="col-span-2 md:col-span-1 p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-3">
                     <Icon name="check-double" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-light/30 uppercase mb-1">الدرجة</span>
                  <span className="text-lg font-black text-white">{selectedStudent.score} / {exam?.max_score}</span>
               </div>
            </div>

            {/* Comparison Analysis */}
            <div className="space-y-4">
               <h3 className="text-xs font-black text-gray-light/30 uppercase tracking-widest px-2">تحليل الأداء مقارنة بالمتوسط</h3>
               <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 space-y-6">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs
                          ${Number(selectedStudent.percentage) >= Number(avgScore) ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                           <Icon name={Number(selectedStudent.percentage) >= Number(avgScore) ? 'trending-up' : 'trending-down'} />
                        </div>
                        <span className="text-sm font-bold text-white">
                           {Number(selectedStudent.percentage) > Number(avgScore) ? 'أداء أعلى من متوسط الطلاب' : 
                             Number(selectedStudent.percentage) < Number(avgScore) ? 'أداء أقل من متوسط الطلاب' : 'أداء مساوٍ للمتوسط'}
                        </span>
                     </div>
                     <span className={`text-sm font-black ${Number(selectedStudent.percentage) >= Number(avgScore) ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {Math.abs(Number(selectedStudent.percentage) - Number(avgScore)).toFixed(1)}% {Number(selectedStudent.percentage) >= Number(avgScore) ? 'فارق إيجابي' : 'فارق سلبي'}
                     </span>
                  </div>
                  
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black text-gray-light/40 uppercase tracking-widest">
                           <span>مستوى الطالب</span>
                           <span>{selectedStudent.percentage}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                           <div className={`h-full rounded-full transition-all duration-1000 ${getScoreBgColor(Number(selectedStudent.percentage))}`} style={{ width: `${selectedStudent.percentage}%` }} />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black text-gray-light/40 uppercase tracking-widest">
                           <span>متوسط الفصل</span>
                           <span>{avgScore}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                           <div className="h-full rounded-full bg-primary/40 transition-all duration-1000" style={{ width: `${avgScore}%` }} />
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Failed Questions Breakdown */}
            {selectedStudent.failed_questions.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-black text-rose-500/50 uppercase tracking-widest px-2 flex items-center gap-2">
                  <Icon name="exclamation-triangle" />
                  مراجعة الأخطاء العلمية
                </h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedStudent.failed_questions.map((failed, idx) => (
                    <div
                      key={failed.id}
                      className="group/q p-5 rounded-2xl bg-[#0f1121]/50 border border-white/5 hover:border-rose-500/20 transition-all"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <span className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-xs font-black shrink-0 border border-rose-500/20">
                          {idx + 1}
                        </span>
                        <p className="text-sm font-bold text-white leading-relaxed pt-1">{failed.question_text}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-12">
                        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                          <p className="text-[10px] font-black text-emerald-500/40 uppercase mb-1">الإجابة الصحيحة</p>
                          <p className="text-xs font-bold text-emerald-400">{failed.correct_answer}</p>
                        </div>
                        
                        <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                          <p className="text-[10px] font-black text-rose-500/40 uppercase mb-1">إجابة الطالب</p>
                          <p className="text-xs font-bold text-rose-400">{failed.student_answer || 'لم يتم الإجابة'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </FormModal>
    </DashboardLayout>
  );
}
