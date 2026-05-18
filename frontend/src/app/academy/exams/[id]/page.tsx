'use client';

import React, { useState, useEffect, use } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { getAcademyExam, toggleAcademyExamStatus, endAcademyExam, deleteAcademyExam } from '@/services/academyService';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { toast } from 'react-hot-toast';

import { Button, Icon, Input, Textarea, Select, LoadingSpinner, Badge } from '@/components/ui';
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
  group?: { id: string; name: string };
  teacher?: { id: string; name: string };
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

export default function AcademyExamDetailsPage({ params }: { params: Promise<{ id: string }> }) {
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
        const data = await getAcademyExam(id);
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
      return <Badge variant="danger">منتهي</Badge>;
    }
    return (
      <Badge variant={exam.is_active ? 'success' : 'warning'}>
        {exam.is_active ? 'نشط' : 'غير نشط'}
      </Badge>
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
      const data = await getAcademyExam(id);
      setExam(data);
    } catch (err) {
      console.error('Failed to refresh exam:', err);
    }
  };

  const handleToggleStatus = async () => {
    if (!exam) return;
    setIsProcessing(true);
    try {
      await toggleAcademyExamStatus(exam.id.toString());
      toast.success(exam.is_active ? 'تم إلغاء تفعيل الامتحان' : 'تم تفعيل الامتحان');
      refreshExam();
    } catch (error: any) {
      console.error('Error toggling exam status:', error);
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء تغيير حالة الامتحان');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmEndExam = async () => {
    if (!exam) return;
    setIsProcessing(true);
    try {
      await endAcademyExam(exam.id.toString());
      toast.success('تم إنهاء الامتحان بنجاح');
      refreshExam();
      setIsEndModalOpen(false);
    } catch (error: any) {
      console.error('Error ending exam:', error);
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء إنهاء الامتحان');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDeleteExam = async () => {
    if (!exam) return;
    setIsProcessing(true);
    try {
      await deleteAcademyExam(exam.id.toString());
      toast.success('تم حذف الامتحان بنجاح');
      router.push('/academy/exams');
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
        role="academy"
        user={user || undefined}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <LoadingSpinner size="sm" color="primary" />
            <p className="text-gray-light">جاري التحميل...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !exam) {
    return (
      <DashboardLayout
        role="academy"
        user={user || undefined}
      >
        <div className="alert alert-danger mb-4">
          <Icon name="exclamation-circle" />
          <span>{error || 'الامتحان غير موجود'}</span>
        </div>
        <Button variant="secondary" onClick={() => router.back()}>
          <Icon name="arrow-right" />
          <span>عودة</span>
        </Button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="academy"
      user={user || undefined}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-8">
        <StatCard
          title="عدد الأسئلة"
          value={exam.questions?.length || 0}
          icon="question-circle"
          color="primary"
          variant="centered"
        />

        <StatCard
          title="عدد المحاولات"
          value={exam.stats?.total_attempts || 0}
          icon="users"
          color="success"
          variant="centered"
        />

        <StatCard
          title="متوسط الدرجات"
          value={exam.stats?.average_score || 0}
          icon="chart-line"
          color="warning"
          suffix="%"
          variant="centered"
        />

        <StatCard
          title="الدرجة الكلية"
          value={exam.max_score}
          icon="star"
          color="danger"
          variant="centered"
        />
      </div>

      {/* Header Section */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-2xl">
            <Icon name="file-alt" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white m-0">{exam.title}</h2>
            <p className="m-0 text-gray-light text-sm">
              {exam.subject} | {exam.grade?.name || '-'}
              {exam.teacher && <span className="mr-2">| المدرس: {exam.teacher.name}</span>}
            </p>
          </div>
          {getStatusBadge()}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="outline" onClick={() => router.back()}>
            <Icon name="arrow-right" />
            <span>عودة</span>
          </Button>
          
          {/* Toggle Status Button */}
          {!exam.ended_at && (
            <Button
              onClick={handleToggleStatus}
              disabled={isProcessing}
              variant={exam.is_active ? 'primary' : 'primary'}
              className={exam.is_active ? 'bg-warning hover:bg-warning' : ''}
            >
              <Icon name={exam.is_active ? 'toggle-on' : 'toggle-off'} />
              <span>{exam.is_active ? 'إلغاء التفعيل' : 'تفعيل'}</span>
            </Button>
          )}
          
          {/* End Exam Button */}
          {exam.is_active && !exam.ended_at && (
            <Button
              onClick={() => setIsEndModalOpen(true)}
              disabled={isProcessing}
              variant="outline"
              className="border-danger text-danger hover:bg-danger hover:text-white"
            >
              <Icon name="stop-circle" />
              <span>إنهاء الامتحان</span>
            </Button>
          )}
          
          {/* Results Button */}
          <Link href={`/academy/exams/${exam.id}/results`} className="inline-flex">
            <Button variant="primary">
              <Icon name="poll" />
              <span>النتائج</span>
            </Button>
          </Link>
          
          {/* Edit Button */}
          <Link href={`/academy/exams/${exam.id}/edit`} className="inline-flex">
            <Button variant="primary">
              <Icon name="edit" />
              <span>تعديل</span>
            </Button>
          </Link>
          
          {/* Delete Button */}
          <Button
            onClick={() => setIsDeleteModalOpen(true)}
            disabled={isProcessing}
            variant="outline"
            className="border-danger text-danger hover:bg-danger hover:text-white"
          >
            <Icon name="trash" />
            <span>حذف</span>
          </Button>
        </div>
      </div>

      {/* Basic Data Section */}
      <DashboardCard
        title="البيانات الأساسية"
        icon="info-circle"
      >
        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
          <div className="bg-[#1a1f37] flex justify-between items-center p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors">
            <span className="text-white font-semibold">{exam.title}</span>
            <div className="flex items-center gap-2 text-gray-light">
              <span>عنوان الامتحان</span>
              <Icon name="heading" />
            </div>
          </div>

          <div className="bg-[#1a1f37] flex justify-between items-center p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors">
            <span className="text-white font-semibold">{exam.subject}</span>
            <div className="flex items-center gap-2 text-gray-light">
              <span>المادة</span>
              <Icon name="book" />
            </div>
          </div>

          <div className="bg-[#1a1f37] flex justify-between items-center p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors">
            <span className="text-white font-semibold">{exam.teacher?.name || '-'}</span>
            <div className="flex items-center gap-2 text-gray-light">
              <span>المدرس</span>
              <Icon name="chalkboard-teacher" />
            </div>
          </div>

          <div className="bg-[#1a1f37] flex justify-between items-center p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors">
            <span className="text-white font-semibold">{exam.grade?.name || '-'}</span>
            <div className="flex items-center gap-2 text-gray-light">
              <span>الصف الدراسي</span>
              <Icon name="layer-group" />
            </div>
          </div>

          <div className="bg-[#1a1f37] flex justify-between items-center p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors">
            <span className="text-white font-semibold">{new Date(exam.date).toLocaleDateString('ar-EG')}</span>
            <div className="flex items-center gap-2 text-gray-light">
              <span>تاريخ الامتحان</span>
              <Icon name="calendar-alt" />
            </div>
          </div>

          <div className="bg-[#1a1f37] flex justify-between items-center p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors">
            <span className="text-white font-semibold">{exam.duration} دقيقة</span>
            <div className="flex items-center gap-2 text-gray-light">
              <span>المدة</span>
              <Icon name="clock" />
            </div>
          </div>

          <div className="bg-[#1a1f37] flex justify-between items-center p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors">
            <span className="text-white font-semibold">{exam.max_score}</span>
            <div className="flex items-center gap-2 text-gray-light">
              <span>الدرجة الكلية</span>
              <Icon name="star" />
            </div>
          </div>

          {exam.actual_question_count && (
            <div className="bg-[#1a1f37] flex justify-between items-center p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors">
              <span className="text-white font-semibold">{exam.actual_question_count}</span>
              <div className="flex items-center gap-2 text-gray-light">
                <span>عدد الأسئلة الفعلية</span>
                <Icon name="list-ol" />
              </div>
            </div>
          )}

          {exam.time_per_question && (
            <div className="bg-[#1a1f37] flex justify-between items-center p-5 rounded-xl border border-white/5 hover:border-primary/50 transition-colors">
              <span className="text-white font-semibold">{exam.time_per_question} ثانية</span>
              <div className="flex items-center gap-2 text-gray-light">
                <span>وقت كل سؤال</span>
                <Icon name="stopwatch" />
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
            icon="question-circle"
            action={
              <Button
                onClick={() => setShowQuestions(!showQuestions)}
                variant="outline"
                size="sm"
              >
                <Icon name={showQuestions ? 'eye-slash' : 'eye'} />
                <span>{showQuestions ? 'إخفاء' : 'عرض'}</span>
              </Button>
            }
          >
            {showQuestions ? (
              <div className="space-y-4">
                {exam.questions.map((question, index) => {
                  const options = parseOptions(question.options);
                  const isCorrectOption = (opt: any) => {
                    if (typeof opt === 'object' && opt !== null && 'a' in opt && 'b' in opt) {
                      return true; // For matching questions, all listed options are correct pairs
                    }
                    return opt === question.correct_answer;
                  };
                  const getOptionText = (opt: any) => {
                    if (typeof opt === 'object' && opt !== null) {
                      if ('a' in opt && 'b' in opt) {
                        return `${opt.a} ↔ ${opt.b}`;
                      }
                      return JSON.stringify(opt);
                    }
                    return String(opt);
                  };
                  return (
                    <div key={question.id || index} className="bg-[#1a1f37] p-5 rounded-xl border border-white/5">
                      <div className="flex items-start gap-3 mb-4">
                        <span className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
                          {index + 1}
                        </span>
                        <p className="text-white font-medium text-lg m-0">{question.text}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-11">
                        {options.map((option, oIndex) => {
                          const isCorrect = isCorrectOption(option);
                          const optionText = getOptionText(option);
                          return (
                            <div
                              key={oIndex}
                              className={`p-3 rounded-lg border ${
                                isCorrect
                                  ? 'border-green-500/50 bg-green-500/10 text-green-400'
                                  : 'border-white/10 bg-white/5 text-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isCorrect && (
                                  <Icon name="check-circle" className="text-green-400" />
                                )}
                                <span>{optionText}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-light">
                <Icon name="eye-slash" size="2x" className="mb-3 opacity-50" />
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
