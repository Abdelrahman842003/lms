'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getGrades, getExam, updateExam } from '@/services/authService';
import { toast } from 'react-hot-toast';

interface Question {
  text: string;
  options: string[];
  correct_answer: string;
}

export default function EditExamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState<any[]>([]);
  
  // Wizard State
  const [step, setStep] = useState<'details' | 'questions'>('details');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Exam Basic Info
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState(60);
  const [totalMarks, setTotalMarks] = useState(100);
  const [questionCount, setQuestionCount] = useState(50);
  const [actualQuestionCount, setActualQuestionCount] = useState(10);
  const [timePerQuestion, setTimePerQuestion] = useState(60);

  // Questions State
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [gradesData, examData] = await Promise.all([
        getGrades(),
        getExam(params.id as string)
      ]);
      setGrades(gradesData.data || []);
      
      // Populate form
      setTitle(examData.title);
      setSubject(examData.subject);
      setGradeId(examData.grade_id);
      setDate(examData.date.split('T')[0]); // Format date for input
      setDuration(examData.duration);
      setTotalMarks(examData.max_score);
      setQuestions(examData.questions);
      setQuestionCount(examData.questions.length);
      setActualQuestionCount(examData.actual_question_count || examData.questions.length);
      setTimePerQuestion(examData.time_per_question || 60);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuestions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subject || !gradeId || !date || !duration || !totalMarks || questionCount < 1 || actualQuestionCount < 1 || timePerQuestion < 10) {
      toast.error('يرجى ملء جميع البيانات الأساسية وتحديد عدد الأسئلة');
      return;
    }
    if (actualQuestionCount > questionCount) {
      toast.error('عدد الأسئلة الفعلية يجب أن يكون أقل من أو يساوي عدد الأسئلة الكلي');
      return;
    }
    
    // If question count changed, adjust array
    if (questions.length !== questionCount) {
      if (questionCount > questions.length) {
        // Add new empty questions
        const newQuestions = [...questions];
        for (let i = questions.length; i < questionCount; i++) {
          newQuestions.push({
            text: '',
            options: ['', '', '', ''],
            correct_answer: ''
          });
        }
        setQuestions(newQuestions);
      } else {
        // Truncate
        setQuestions(questions.slice(0, questionCount));
      }
    }
    
    setStep('questions');
  };

  const handleQuestionChange = (field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[currentQuestionIndex] = { ...newQuestions[currentQuestionIndex], [field]: value };
    setQuestions(newQuestions);
  };

  const handleOptionChange = (oIndex: number, value: string) => {
    const newQuestions = [...questions];
    const newOptions = [...newQuestions[currentQuestionIndex].options];
    newOptions[oIndex] = value;
    newQuestions[currentQuestionIndex].options = newOptions;
    setQuestions(newQuestions);
  };

  const handleNextQuestion = () => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ.text || currentQ.options.some(o => !o) || !currentQ.correct_answer) {
      toast.error('يرجى إكمال السؤال الحالي قبل الانتقال للتالي');
      return;
    }
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ.text || currentQ.options.some(o => !o) || !currentQ.correct_answer) {
      toast.error('يرجى إكمال السؤال الحالي قبل الحفظ');
      return;
    }

    setLoading(true);
    try {
      await updateExam(params.id as string, {
        title,
        subject,
        grade_id: gradeId,
        date,
        duration,
        total_marks: totalMarks,
        actual_question_count: actualQuestionCount,
        time_per_question: timePerQuestion,
        questions
      });
      toast.success('تم تحديث الامتحان بنجاح');
      router.push('/teacher/exams');
    } catch (error) {
      console.error('Error updating exam:', error);
      toast.error('حدث خطأ أثناء تحديث الامتحان');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={{ name: user?.name || 'المدرس', avatar: user?.avatar || '' }}
      headerActions={null}
    >
      <div className="bg-[#1e1e2d] rounded-xl shadow-lg border border-white/5">
        <div className="dashboard-card-header">
          <div className="dashboard-card-title">
            <i className="fas fa-edit"></i>
            <h2>تعديل الامتحان</h2>
          </div>
        </div>

        <div className="p-6">
          {step === 'details' ? (
            <form onSubmit={handleStartQuestions}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="block text-sm font-medium text-white mb-2">عنوان الامتحان</label>
                  <input
                    type="text"
                    className="form-input w-full"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-white mb-2">المادة</label>
                  <input
                    type="text"
                    className="form-input w-full"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-white mb-2">الصف الدراسي</label>
                  <select
                    className="form-input w-full"
                    value={gradeId}
                    onChange={(e) => setGradeId(e.target.value)}
                    required
                  >
                    <option value="">اختر الصف</option>
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-white mb-2">تاريخ الامتحان</label>
                  <input
                    type="date"
                    className="form-input w-full"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-white mb-2">المدة (دقيقة)</label>
                  <input
                    type="number"
                    className="form-input w-full"
                    value={duration || ''}
                    onChange={(e) => setDuration(e.target.value === '' ? 0 : parseInt(e.target.value))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-white mb-2">الدرجة الكلية</label>
                  <input
                    type="number"
                    className="form-input w-full"
                    value={totalMarks || ''}
                    onChange={(e) => setTotalMarks(e.target.value === '' ? 0 : parseInt(e.target.value))}
                    required
                  />
                </div>



                <div className="form-group">
                  <label className="block text-sm font-medium text-white mb-2">عدد الأسئلة الكلي (بنك الأسئلة)</label>
                  <input
                    type="number"
                    className="form-input w-full"
                    value={questionCount || ''}
                    onChange={(e) => setQuestionCount(e.target.value === '' ? 0 : parseInt(e.target.value))}
                    min="1"
                    required
                  />
                  <small className="text-gray-500 text-xs mt-1 block">العدد الكلي للأسئلة التي ستضيفها</small>
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-white mb-2">عدد الأسئلة الفعلية في الامتحان</label>
                  <input
                    type="number"
                    className="form-input w-full"
                    value={actualQuestionCount || ''}
                    onChange={(e) => setActualQuestionCount(e.target.value === '' ? 0 : parseInt(e.target.value))}
                    min="1"
                    max={questionCount}
                    required
                  />
                  <small className="text-gray-500 text-xs mt-1 block">سيتم اختيار هذا العدد عشوائياً من بنك الأسئلة لكل طالب</small>
                </div>

                <div className="form-group md:col-span-2">
                  <label className="block text-sm font-medium text-white mb-2">مدة كل سؤال (ثانية)</label>
                  <input
                    type="number"
                    className="form-input w-full"
                    value={timePerQuestion || ''}
                    onChange={(e) => setTimePerQuestion(e.target.value === '' ? 0 : parseInt(e.target.value))}
                    min="10"
                    max="600"
                    required
                  />
                  <small className="text-gray-500 text-xs mt-1 block">الوقت المتاح للإجابة على كل سؤال (من 10 ثانية إلى 10 دقائق)</small>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={() => router.push('/teacher/exams')}
                  className="btn btn-secondary px-8 py-3 text-lg"
                >
                  <i className="fas fa-arrow-right ml-2"></i>
                  إلغاء
                </button>

                <button type="submit" className="btn btn-primary px-8 py-3 text-lg">
                  التالي: تعديل الأسئلة
                  <i className="fas fa-arrow-left mr-2"></i>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  السؤال {currentQuestionIndex + 1} من {questions.length}
                </h3>
                <div className="text-sm text-gray-400">
                  التقدم: {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%
                </div>
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-white mb-2">نص السؤال</label>
                <textarea
                  className="form-input w-full h-32 resize-none"
                  value={questions[currentQuestionIndex].text}
                  onChange={(e) => handleQuestionChange('text', e.target.value)}
                  placeholder="اكتب نص السؤال هنا..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {questions[currentQuestionIndex].options.map((option, index) => (
                  <div key={index} className="form-group">
                    <label className="block text-sm font-medium text-white mb-2">
                      الخيار {index + 1}
                      <span className="text-xs text-gray-500 mr-2">
                        (اضغط على الدائرة لتحديد الإجابة الصحيحة)
                      </span>
                    </label>
                    <div className="flex items-center gap-3">
                      <div 
                        onClick={() => handleQuestionChange('correct_answer', option)}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${
                          questions[currentQuestionIndex].correct_answer === option && option !== ''
                            ? 'bg-blue-600 border-blue-600 text-white' 
                            : 'bg-white border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {questions[currentQuestionIndex].correct_answer === option && option !== '' && (
                          <i className="fas fa-check text-sm"></i>
                        )}
                      </div>
                      <input
                        type="text"
                        className={`form-input w-full ${
                          questions[currentQuestionIndex].correct_answer === option && option !== '' 
                            ? 'border-blue-500 ring-1 ring-blue-500' 
                            : ''
                        }`}
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`الخيار ${index + 1}`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-8 pt-6 border-t border-border">
                <button
                  onClick={handlePrevQuestion}
                  disabled={currentQuestionIndex === 0}
                  className={`btn btn-secondary px-6 py-2 ${currentQuestionIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <i className="fas fa-arrow-right ml-2"></i>
                  السابق
                </button>

                {currentQuestionIndex === questions.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    className="btn btn-success px-8 py-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <i className="fas fa-save ml-2"></i>
                    حفظ التعديلات
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="btn btn-primary px-6 py-2"
                  >
                    التالي
                    <i className="fas fa-arrow-left mr-2"></i>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
