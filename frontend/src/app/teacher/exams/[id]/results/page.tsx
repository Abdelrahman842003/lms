'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { toast } from 'react-hot-toast';
import axios from '@/lib/axios';

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
      const response = await axios.get(`/teacher/exams/${id}/results`);
      setExam(response.data.data.exam);
      setResults(response.data.data.results || []);
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

  // Loading state
  if (loading) {
    return (
      <DashboardLayout 
        role={user?.userType as 'teacher' | 'secretary' || 'teacher'} 
        user={{ name: user?.name || '', avatar: user?.avatar || '' }}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-400">جاري تحميل النتائج...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={{ name: user?.name || 'المدرس', avatar: user?.avatar || '' }}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2">
              <i className="fas fa-poll text-primary"></i>
              <span className="truncate">{exam?.title}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1 bg-gray-800/50 px-2 py-1 rounded">
                <i className="fas fa-book"></i>
                {exam?.subject}
              </span>
              <span className="flex items-center gap-1 bg-gray-800/50 px-2 py-1 rounded">
                <i className="fas fa-clock"></i>
                {exam?.duration} دقيقة
              </span>
              {exam?.date && (
                <span className="flex items-center gap-1 bg-gray-800/50 px-2 py-1 rounded">
                  <i className="fas fa-calendar"></i>
                  {new Date(exam.date).toLocaleDateString('ar-EG')}
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <i className="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard
          title="عدد الطلاب"
          value={totalStudents}
          icon="fas fa-users"
          color="primary"
        />
        <StatCard
          title="المتوسط"
          value={avgScore}
          suffix="%"
          icon="fas fa-chart-line"
          color="warning"
        />
        <StatCard
          title="الناجحين"
          value={passedStudents}
          icon="fas fa-check-circle"
          color="success"
        />
        <StatCard
          title="الراسبين"
          value={failedStudents}
          icon="fas fa-times-circle"
          color="danger"
        />
      </div>

      {/* Results Card */}
      <DashboardCard 
        title="نتائج الطلاب" 
        icon="fas fa-list-alt"
        action={
          <div className="text-sm text-gray-400">
            أعلى نتيجة: <span className="text-primary font-bold">{highestScore}%</span>
          </div>
        }
      >
        {results.length === 0 ? (
          // Empty State
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-inbox text-4xl text-gray-600"></i>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">لا توجد نتائج</h3>
            <p className="text-gray-400">لم يحضر أي طالب هذا الامتحان بعد</p>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="بحث بالاسم أو رقم الهاتف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input w-full pr-10"
                />
                <i className="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              </div>
            </div>

            {/* Results List */}
            <div className="space-y-3">
              {filteredResults.map((result) => (
                <div
                  key={result.id}
                  onClick={() => setSelectedStudent(result)}
                  className="bg-white/5 rounded-xl p-4 border border-gray-800 hover:border-primary/50 cursor-pointer transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    {/* Student Info */}
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getScoreBgColor(Number(result.percentage))}/20`}>
                        <i className={`fas fa-user ${getScoreColor(Number(result.percentage))}`}></i>
                      </div>
                      <div>
                        <div className="font-medium text-white">{result.student.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <i className="fas fa-phone text-[10px]"></i>
                          {result.student.phone}
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-left">
                      <div className={`text-xl font-bold ${getScoreColor(Number(result.percentage))}`}>
                        {result.percentage}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {result.score}/{exam?.max_score}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${getScoreBgColor(Number(result.percentage))}`}
                        style={{ width: `${result.percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className={`badge badge-sm ${Number(result.percentage) >= 50 ? 'badge-success' : 'badge-danger'}`}>
                      {Number(result.percentage) >= 50 ? 'ناجح' : 'راسب'}
                    </span>
                    <span className="text-gray-500 flex items-center gap-1">
                      {result.failed_questions.length > 0 ? (
                        <>
                          <i className="fas fa-times-circle text-warning"></i>
                          {result.failed_questions.length} أخطاء
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check-circle text-green-500"></i>
                          بدون أخطاء
                        </>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Footer */}
            <div className="mt-4 pt-4 border-t border-gray-800 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-400">
              <div className="flex items-center gap-4">
                <span>الإجمالي: <strong className="text-white">{totalStudents}</strong></span>
                <span className="text-green-500">✓ {passedStudents}</span>
                <span className="text-red-500">✗ {failedStudents}</span>
              </div>
              <div>
                نسبة النجاح: <strong className="text-primary">{totalStudents > 0 ? ((passedStudents / totalStudents) * 100).toFixed(0) : 0}%</strong>
              </div>
            </div>
          </>
        )}
      </DashboardCard>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => setSelectedStudent(null)}
        >
          <div 
            className="bg-gray-900 w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-hidden border-2 border-primary/50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary/20 to-transparent p-6 border-b border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
                <span className={`badge ${Number(selectedStudent.percentage) >= 50 ? 'badge-success' : 'badge-danger'}`}>
                  {Number(selectedStudent.percentage) >= 50 ? 'ناجح' : 'راسب'}
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getScoreBgColor(Number(selectedStudent.percentage))}/20 border-2 border-current`}>
                  <i className={`fas fa-user-graduate text-2xl ${getScoreColor(Number(selectedStudent.percentage))}`}></i>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedStudent.student.name}</h2>
                  <p className="text-gray-400 flex items-center gap-2">
                    <i className="fas fa-phone text-xs"></i>
                    {selectedStudent.student.phone}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Score Section */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/5 rounded-xl p-4 text-center border border-gray-800">
                  <div className={`text-3xl font-bold ${getScoreColor(Number(selectedStudent.percentage))}`}>
                    {selectedStudent.percentage}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">النسبة المئوية</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center border border-gray-800">
                  <div className="text-3xl font-bold text-primary">
                    {selectedStudent.score}<span className="text-lg text-gray-500">/{exam?.max_score}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">الدرجة</div>
                </div>
              </div>

              {/* Comparison with Average */}
              <div className="bg-white/5 rounded-xl p-4 mb-6 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">مقارنة بالمتوسط</span>
                  <span className="text-sm font-medium">
                    {Number(selectedStudent.percentage) > Number(avgScore) ? (
                      <span className="text-green-500">
                        <i className="fas fa-arrow-up ml-1"></i>
                        أعلى من المتوسط
                      </span>
                    ) : Number(selectedStudent.percentage) < Number(avgScore) ? (
                      <span className="text-red-500">
                        <i className="fas fa-arrow-down ml-1"></i>
                        أقل من المتوسط
                      </span>
                    ) : (
                      <span className="text-yellow-500">
                        <i className="fas fa-equals ml-1"></i>
                        يساوي المتوسط
                      </span>
                    )}
                  </span>
                </div>
                
                {/* Student Score Bar */}
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">درجة الطالب</div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-full rounded-full ${getScoreBgColor(Number(selectedStudent.percentage))}`}
                        style={{ width: `${selectedStudent.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className={`text-lg font-bold w-12 text-left ${getScoreColor(Number(selectedStudent.percentage))}`}>
                    {selectedStudent.percentage}%
                  </div>
                </div>
                
                {/* Average Bar */}
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">متوسط الفصل</div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${avgScore}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-primary w-12 text-left">
                    {avgScore}%
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/5 rounded-lg p-3 border border-gray-800">
                  <div className="text-xs text-gray-500">الامتحان</div>
                  <div className="text-sm font-medium text-white mt-1">{exam?.title}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-gray-800">
                  <div className="text-xs text-gray-500">المادة</div>
                  <div className="text-sm font-medium text-white mt-1">{exam?.subject}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-gray-800">
                  <div className="text-xs text-gray-500">عدد الأخطاء</div>
                  <div className={`text-sm font-medium mt-1 ${selectedStudent.failed_questions.length > 0 ? 'text-warning' : 'text-green-500'}`}>
                    {selectedStudent.failed_questions.length > 0 ? `${selectedStudent.failed_questions.length} أسئلة` : 'لا توجد أخطاء'}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-gray-800">
                  <div className="text-xs text-gray-500">الترتيب</div>
                  <div className="text-sm font-medium text-white mt-1">
                    {getStudentRank(selectedStudent.id)} / {totalStudents}
                  </div>
                </div>
              </div>

              {/* Failed Questions */}
              {selectedStudent.failed_questions.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-warning mb-3 flex items-center gap-2">
                    <i className="fas fa-exclamation-triangle"></i>
                    الأسئلة التي أخطأ فيها
                  </h3>
                  <div className="space-y-3">
                    {selectedStudent.failed_questions.map((failed, idx) => (
                      <div 
                        key={failed.id} 
                        className="bg-white/5 rounded-xl p-4 border border-gray-800"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-warning/20 text-warning flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <p className="text-sm text-white">{failed.question_text}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2 mr-9">
                          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                            <div className="flex items-center gap-1 mb-1">
                              <i className="fas fa-check-circle text-green-500 text-xs"></i>
                              <span className="text-xs text-green-500">الإجابة الصحيحة</span>
                            </div>
                            <span className="text-sm text-white">{failed.correct_answer}</span>
                          </div>
                          
                          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                            <div className="flex items-center gap-1 mb-1">
                              <i className="fas fa-times-circle text-red-500 text-xs"></i>
                              <span className="text-xs text-red-500">إجابة الطالب</span>
                            </div>
                            <span className="text-sm text-white">
                              {failed.student_answer || 'لم يجب'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-800 bg-gray-900">
              <button 
                onClick={() => setSelectedStudent(null)}
                className="btn btn-primary w-full"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
