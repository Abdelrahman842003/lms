'use client';

import React, { useState, useEffect, use } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/AuthContext';
import { getExam, toggleExamStatus, endExam, deleteExam } from '@/services/authService';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { toast } from 'react-hot-toast';

interface Question {
  id: number;
  text: string;
  options: string[];
  correct_answer: string;
}

interface ExamDetails {
  id: number;
  title: string;
  subject: string;
  grade?: { id: string; name: string };
  date: string;
  duration: number;
  max_score: number;
  is_active: boolean;
  ended_at?: string | null;
  actual_question_count?: number;
  time_per_question?: number;
  questions?: Question[];
  stats?: {
    total_attempts: number;
    average_score: number;
    highest_score: number;
    lowest_score: number;
  };
}

export default function ExamDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [exam, setExam] = useState<ExamDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQuestions, setShowQuestions] = useState(false);
  
  // Modal State
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        setIsLoading(true);
        const data = await getExam(id);
        setExam(data);
      } catch (err: any) {
        console.error('Failed to fetch exam details:', err);
        setError(err.message || 'حدث خطأ أثناء جلب بيانات الامتحان');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchExamDetails();
    }
  }, [id]);

  const getStatusBadge = () => {
    if (!exam) return null;
    
    if (exam.ended_at) {
      return <span className="badge badge-danger">منتهي</span>;
    }
    return (
      <span className={`badge badge-${exam.is_active ? 'success' : 'warning'}`}>
        {exam.is_active ? 'نشط' : 'غير نشط'}
      </span>
    );
  };

  const parseOptions = (options: any): string[] => {
    if (Array.isArray(options)) {
      return options;
    }
    if (typeof options === 'string') {
      try {
        const parsed = JSON.parse(options);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const refreshExam = async () => {
    try {
      const data = await getExam(id);
      setExam(data);
    } catch (err) {
      console.error('Failed to refresh exam:', err);
    }
  };

  const handleToggleStatus = async () => {
    if (!exam) return;
    setIsProcessing(true);
    try {
      await toggleExamStatus(exam.id.toString());
      toast.success(exam.is_active ? 'تم إلغاء تفعيل الامتحان' : 'تم تفعيل الامتحان');
      refreshExam();
    } catch (error) {
      console.error('Error toggling exam status:', error);
      toast.error('حدث خطأ أثناء تغيير حالة الامتحان');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmEndExam = async () => {
    if (!exam) return;
    setIsProcessing(true);
    try {
      await endExam(exam.id.toString());
      toast.success('تم إنهاء الامتحان بنجاح');
      refreshExam();
      setIsEndModalOpen(false);
    } catch (error) {
      console.error('Error ending exam:', error);
      toast.error('حدث خطأ أثناء إنهاء الامتحان');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDeleteExam = async () => {
    if (!exam) return;
    setIsProcessing(true);
    try {
      await deleteExam(exam.id.toString());
      toast.success('تم حذف الامتحان بنجاح');
      router.push('/teacher/exams');
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast.error('حدث خطأ أثناء حذف الامتحان');
    } finally {
      setIsProcessing(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout
        role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
        user={user || undefined}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p className="text-gray-light">جاري التحميل...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !exam) {
    return (
      <DashboardLayout
        role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
        user={user || undefined}
      >
        <div className="alert alert-danger mb-4">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error || 'الامتحان غير موجود'}</span>
        </div>
        <button className="btn btn-secondary" onClick={() => router.back()}>
          <i className="fas fa-arrow-right"></i>
          <span>عودة</span>
        </button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={user || undefined}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-8">
        <StatCard
          title="عدد الأسئلة"
          value={exam.questions?.length || 0}
          icon="fas fa-question-circle"
          color="primary"
          variant="centered"
        />

        <StatCard
          title="عدد المحاولات"
          value={exam.stats?.total_attempts || 0}
          icon="fas fa-users"
          color="success"
          variant="centered"
        />

        <StatCard
          title="متوسط الدرجات"
          value={exam.stats?.average_score || 0}
          icon="fas fa-chart-line"
          color="warning"
          suffix="%"
          variant="centered"
        />

        <StatCard
          title="الدرجة الكلية"
          value={exam.max_score}
          icon="fas fa-star"
          color="danger"
          variant="centered"
        />
      </div>

      {/* Header Section */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-2xl">
            <i className="fas fa-file-alt"></i>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white m-0">{exam.title}</h2>
            <p className="m-0 text-gray-light text-sm">{exam.subject} | {exam.grade?.name || '-'}</p>
          </div>
          {getStatusBadge()}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button onClick={() => router.back()} className="btn btn-outline">
            <i className="fas fa-arrow-right"></i>
            <span>عودة</span>
          </button>
          
          {/* Toggle Status Button */}
          {!exam.ended_at && (
            <button 
              onClick={handleToggleStatus}
              disabled={isProcessing}
              className={`btn ${exam.is_active ? 'btn-warning' : 'btn-success'}`}
            >
              <i className={`fas fa-toggle-${exam.is_active ? 'on' : 'off'}`}></i>
              <span>{exam.is_active ? 'إلغاء التفعيل' : 'تفعيل'}</span>
            </button>
          )}
          
          {/* End Exam Button */}
          {exam.is_active && !exam.ended_at && (
            <button 
              onClick={() => setIsEndModalOpen(true)}
              disabled={isProcessing}
              className="btn btn-danger"
            >
              <i className="fas fa-stop-circle"></i>
              <span>إنهاء الامتحان</span>
            </button>
          )}
          
          {/* Edit Button */}
          <Link href={`/teacher/exams/${exam.id}/edit`} className="btn btn-primary">
            <i className="fas fa-edit"></i>
            <span>تعديل</span>
          </Link>
          
          {/* Delete Button */}
          <button 
            onClick={() => setIsDeleteModalOpen(true)}
            disabled={isProcessing}
            className="btn btn-danger"
          >
            <i className="fas fa-trash"></i>
            <span>حذف</span>
          </button>
        </div>
      </div>

      {/* Basic Data Section */}
      <DashboardCard
        title="البيانات الأساسية"
        icon="fas fa-info-circle"
      >
        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
          <div className="bg-[#1a1f37] flex justify-between items-center p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors">
            <span className="text-white font-semibold">{exam.title}</span>
            <div className="flex items-center gap-2 text-gray-light">
              <span>عنوان الامتحان</span>
              <i className="fas fa-heading"></i>
            </div>
          </div>

          <div className="bg-[#1a1f37] flex justify-between items-center p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors">
            <span className="text-white font-semibold">{exam.subject}</span>
            <div className="flex items-center gap-2 text-gray-light">
              <span>المادة</span>
              <i className="fas fa-book"></i>
            </div>
          </div>

          <div className="bg-[#1a1f37] flex justify-between items-center p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors">
            <span className="text-white font-semibold">{exam.grade?.name || '-'}</span>
            <div className="flex items-center gap-2 text-gray-light">
              <span>الصف الدراسي</span>
              <i className="fas fa-layer-group"></i>
            </div>
          </div>

          <div className="bg-[#1a1f37] flex justify-between items-center p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors">
            <span className="text-white font-semibold">{new Date(exam.date).toLocaleDateString('ar-EG')}</span>
            <div className="flex items-center gap-2 text-gray-light">
              <span>تاريخ الامتحان</span>
              <i className="fas fa-calendar-alt"></i>
            </div>
          </div>

          <div className="bg-[#1a1f37] flex justify-between items-center p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors">
            <span className="text-white font-semibold">{exam.duration} دقيقة</span>
            <div className="flex items-center gap-2 text-gray-light">
              <span>المدة</span>
              <i className="fas fa-clock"></i>
            </div>
          </div>

          <div className="bg-[#1a1f37] flex justify-between items-center p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors">
            <span className="text-white font-semibold">{exam.max_score}</span>
            <div className="flex items-center gap-2 text-gray-light">
              <span>الدرجة الكلية</span>
              <i className="fas fa-star"></i>
            </div>
          </div>

          {exam.actual_question_count && (
            <div className="bg-[#1a1f37] flex justify-between items-center p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors">
              <span className="text-white font-semibold">{exam.actual_question_count}</span>
              <div className="flex items-center gap-2 text-gray-light">
                <span>عدد الأسئلة الفعلية</span>
                <i className="fas fa-list-ol"></i>
              </div>
            </div>
          )}

          {exam.time_per_question && (
            <div className="bg-[#1a1f37] flex justify-between items-center p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors">
              <span className="text-white font-semibold">{exam.time_per_question} ثانية</span>
              <div className="flex items-center gap-2 text-gray-light">
                <span>وقت كل سؤال</span>
                <i className="fas fa-stopwatch"></i>
              </div>
            </div>
          )}
        </div>
      </DashboardCard>

      {/* Questions Section */}
      {exam.questions && exam.questions.length > 0 && (
        <div className="mt-8">
          <DashboardCard
            title="الأسئلة"
            icon="fas fa-question-circle"
            action={
              <button 
                onClick={() => setShowQuestions(!showQuestions)}
                className="btn btn-outline btn-sm"
              >
                <i className={`fas fa-${showQuestions ? 'eye-slash' : 'eye'}`}></i>
                <span>{showQuestions ? 'إخفاء' : 'عرض'}</span>
              </button>
            }
          >
            {showQuestions ? (
              <div className="space-y-4">
                {exam.questions.map((question, index) => {
                  const options = parseOptions(question.options);
                  return (
                    <div key={question.id || index} className="bg-[#1a1f37] p-5 rounded-xl border border-white/5">
                      <div className="flex items-start gap-3 mb-4">
                        <span className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
                          {index + 1}
                        </span>
                        <p className="text-white font-medium text-lg m-0">{question.text}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-11">
                        {options.map((option, oIndex) => (
                          <div
                            key={oIndex}
                            className={`p-3 rounded-lg border ${
                              option === question.correct_answer
                                ? 'border-green-500/50 bg-green-500/10 text-green-400'
                                : 'border-white/10 bg-white/5 text-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {option === question.correct_answer && (
                                <i className="fas fa-check-circle text-green-400"></i>
                              )}
                              <span>{option}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-light">
                <i className="fas fa-eye-slash text-4xl mb-3 opacity-50"></i>
                <p>اضغط على "عرض" لرؤية الأسئلة</p>
              </div>
            )}
          </DashboardCard>
        </div>
      )}

      {/* End Exam Modal */}
      <ConfirmationModal
        isOpen={isEndModalOpen}
        title="إنهاء الامتحان"
        message="هل أنت متأكد من إنهاء هذا الامتحان؟ سيتم إغلاقه على جميع الطلاب واحتساب النتائج فوراً. لا يمكن التراجع عن هذا الإجراء."
        confirmText="نعم، إنهاء الامتحان"
        cancelText="إلغاء"
        onConfirm={confirmEndExam}
        onCancel={() => setIsEndModalOpen(false)}
        isProcessing={isProcessing}
        variant="danger"
      />

      {/* Delete Exam Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="حذف الامتحان"
        message="هل أنت متأكد من حذف هذا الامتحان؟ سيتم حذف جميع البيانات المرتبطة به بما في ذلك نتائج الطلاب. لا يمكن التراجع عن هذا الإجراء."
        confirmText="نعم، حذف الامتحان"
        cancelText="إلغاء"
        onConfirm={confirmDeleteExam}
        onCancel={() => setIsDeleteModalOpen(false)}
        isProcessing={isProcessing}
        variant="danger"
      />
    </DashboardLayout>
  );
}
