'use client';

import React, { useState, useEffect, use } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { LoadingSpinner, Button, Icon, Badge } from '@/components/ui';
import { useAuth } from '@/contexts/EnhancedAuthContext';
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
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
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
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={user || undefined}
    >
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-10">
        <div className="space-y-4 flex-1">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
          >
            <Icon name="arrow-right" />
          </Button>
          
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
               <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary premium-border">
                  <Icon name="file-alt" size="xl" />
               </div>
               <div>
                  <h2 className="text-3xl font-black text-white tracking-tight">{exam.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                     <p className="text-gray-light/40 font-bold uppercase tracking-widest text-[11px]">{exam.subject} | {exam.grade?.name || '-'}</p>
                     <div className="w-1 h-1 rounded-full bg-white/10" />
                     {getStatusBadge()}
                  </div>
               </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {!exam.ended_at && (
            <Button
              onClick={handleToggleStatus}
              disabled={isProcessing}
              variant={exam.is_active ? 'secondary' : 'primary'}
              className="h-12 px-6 rounded-2xl font-bold gap-2"
            >
              <Icon name={exam.is_active ? 'toggle-on' : 'toggle-off'} />
              <span>{exam.is_active ? 'إلغاء التفعيل' : 'تفعيل الآن'}</span>
            </Button>
          )}
          
          {exam.is_active && !exam.ended_at && (
            <Button
              onClick={() => setIsEndModalOpen(true)}
              disabled={isProcessing}
              variant="secondary"
              className="h-12 px-6 rounded-2xl font-bold gap-2 border-amber-500/20 text-amber-500 bg-amber-500/5 hover:bg-amber-500/10"
            >
              <Icon name="stop-circle" />
              <span>إنهاء الامتحان</span>
            </Button>
          )}

          <div className="flex items-center gap-2">
             <Link href={`/teacher/exams/${exam.id}/edit`} className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-light hover:text-white hover:bg-white/10 transition-all">
                <Icon name="edit" />
             </Link>
             <Button
               onClick={() => setIsDeleteModalOpen(true)}
               disabled={isProcessing}
               variant="ghost"
               className="h-12 w-12 rounded-2xl bg-rose-500/5 border border-rose-500/5 flex items-center justify-center text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all"
             >
               <Icon name="trash" />
             </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard title="الأسئلة" value={exam.questions?.length || 0} icon="question-circle" color="primary" />
        <StatCard title="المحاولات" value={exam.stats?.total_attempts || 0} icon="users" color="success" />
        <StatCard title="المتوسط" value={exam.stats?.average_score || 0} icon="chart-line" color="warning" suffix="%" />
        <StatCard title="الدرجة الكلية" value={exam.max_score} icon="star" color="danger" />
      </div>

      {/* Details & Questions Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Details */}
        <div className="xl:col-span-1 space-y-6">
           <div className="premium-glass p-6 rounded-[2.5rem] border-white/5 space-y-6">
              <div className="flex items-center gap-3 mb-2 px-2">
                 <Icon name="info-circle" className="text-primary" />
                 <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">البيانات الأساسية</h3>
              </div>

              <div className="space-y-3">
                 {[
                    { label: 'عنوان الامتحان', value: exam.title, icon: 'heading', color: 'primary' },
                    { label: 'المادة الدراسية', value: exam.subject, icon: 'book', color: 'amber' },
                    { label: 'الصف الدراسي', value: exam.grade?.name || '-', icon: 'layer-group', color: 'indigo' },
                    { label: 'تاريخ الامتحان', value: new Date(exam.date).toLocaleDateString('ar-EG'), icon: 'calendar-alt', color: 'emerald' },
                    { label: 'مدة الامتحان', value: `${exam.duration} دقيقة`, icon: 'clock', color: 'rose' },
                    { label: 'الدرجة الكلية', value: `${exam.max_score} درجة`, icon: 'star', color: 'warning' },
                    { label: 'وقت كل سؤال', value: exam.time_per_question ? `${exam.time_per_question} ثانية` : 'تلقائي', icon: 'stopwatch', color: 'sky' }
                 ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 group hover:border-white/10 transition-all">
                       <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg bg-${item.color}-500/10 flex items-center justify-center text-${item.color}-500`}>
                             <Icon name={item.icon} size="sm" />
                          </div>
                          <span className="text-[10px] font-bold text-gray-light/30 uppercase tracking-wider">{item.label}</span>
                       </div>
                       <span className="text-sm font-black text-white">{item.value}</span>
                    </div>
                 ))}
              </div>
           </div>

           {/* Quick Stats/Progress Card */}
           <div className="premium-glass p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
              <div className="relative z-10 space-y-6">
                 <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-white uppercase tracking-widest">تغطية الأسئلة</h4>
                    <span className="text-primary font-black">{exam.questions?.length || 0} سؤال</span>
                 </div>
                 <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(66,99,235,0.4)]" style={{ width: '100%' }} />
                 </div>
                 <p className="text-[11px] font-medium text-gray-light/30 leading-relaxed">هذا الامتحان يحتوي على {exam.questions?.length} أسئلة مضافة مسبقاً، يمكنك تعديلها أو إضافة أسئلة جديدة من خلال محرر الامتحانات.</p>
              </div>
           </div>
        </div>

        {/* Right Column: Questions */}
        <div className="xl:col-span-2 space-y-6">
           <div className="premium-glass p-8 rounded-[2.5rem] border-white/5">
              <div className="flex items-center justify-between mb-10">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary premium-border">
                       <Icon name="question-circle" size="xl" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-white">الأسئلة المضافة</h3>
                       <p className="text-xs font-bold text-gray-light/30 uppercase tracking-widest mt-1">مراجعة محتوى الامتحان العلمي</p>
                    </div>
                 </div>

                 <Button
                   onClick={() => setShowQuestions(!showQuestions)}
                   variant="outline"
                   className="h-11 px-5 rounded-xl font-bold gap-2"
                 >
                   <Icon name={showQuestions ? 'eye-slash' : 'eye'} />
                   <span>{showQuestions ? 'إخفاء الأسئلة' : 'عرض الأسئلة'}</span>
                 </Button>
              </div>

              {exam.questions && exam.questions.length > 0 ? (
                <>
                  {showQuestions ? (
                    <div className="space-y-6">
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
                          <div key={question.id || index} className="group/q p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-primary/20 transition-all">
                            <div className="flex items-start gap-4 mb-6">
                              <span className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-sm font-black shrink-0 border border-primary/20">
                                {index + 1}
                              </span>
                              <p className="text-lg font-bold text-white leading-relaxed pt-1">{question.text}</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-0 md:pl-14">
                              {options.map((option, oIndex) => {
                                const isCorrect = isCorrectOption(option);
                                const optionText = getOptionText(option);
                                return (
                                  <div
                                    key={oIndex}
                                    className={`p-4 rounded-2xl border transition-all flex items-center gap-3
                                      ${isCorrect
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                                        : 'border-white/5 bg-white/5 text-gray-light/60 hover:bg-white/[0.08]'
                                      }`}
                                  >
                                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border
                                      ${isCorrect ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white/5 border-white/10'}`}>
                                      {isCorrect ? <Icon name="check" size="xs" /> : <span className="text-[10px] font-black">{String.fromCharCode(65 + oIndex)}</span>}
                                    </div>
                                    <span className="text-sm font-medium">{optionText}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-white/[0.02] rounded-[2rem] border border-dashed border-white/10">
                       <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-gray-light/20">
                          <Icon name="lock" size="2x" />
                       </div>
                       <div className="space-y-2">
                          <h4 className="text-lg font-bold text-white">الأسئلة مخفية حالياً</h4>
                          <p className="text-sm text-gray-light/30 font-medium">اضغط على زر "عرض الأسئلة" لمراجعة المحتوى العلمي للامتحان</p>
                       </div>
                       <Button onClick={() => setShowQuestions(true)} variant="primary" className="h-11 px-8 rounded-xl font-bold">عرض الآن</Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                   <p className="text-gray-light/40 font-bold">لا توجد أسئلة مضافة لهذا الامتحان بعد.</p>
                </div>
              )}
           </div>
        </div>
      </div>

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
