'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getGrades, createExam } from '@/services/authService';
import { toast } from 'react-hot-toast';

interface Question {
  text: string;
  options: string[];
  correct_answer: string;
}

export default function AddExamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
  const [questionCount, setQuestionCount] = useState(50); // Total questions in pool
  const [actualQuestionCount, setActualQuestionCount] = useState(10); // Questions shown in actual exam
  const [timePerQuestion, setTimePerQuestion] = useState(60); // Seconds per question

  // Questions State
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      const gradesData = await getGrades();
      setGrades(gradesData.data || []);
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  const handleStartQuestions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subject || !gradeId || !date || !duration || !totalMarks || questionCount < 1 || actualQuestionCount < 1 || timePerQuestion < 10) {
      toast.error('يرجى ملء جميع البيانات الأساسية');
      return;
    }
    if (actualQuestionCount > questionCount) {
      toast.error('عدد الأسئلة الفعلية يجب أن يكون أقل من أو يساوي عدد الأسئلة الكلي');
      return;
    }
    
    // Initialize questions array
    setQuestions(
      Array(questionCount).fill(null).map(() => ({
        text: '',
        options: ['', '', '', ''],
        correct_answer: ''
      }))
    );
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
      await createExam({
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
      toast.success('تم إنشاء الامتحان بنجاح');
      router.push('/teacher/exams');
    } catch (error) {
      console.error('Error creating exam:', error);
      toast.error('حدث خطأ أثناء إنشاء الامتحان');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={{ name: user?.name || 'المدرس', avatar: user?.avatar || '' }}
    >
      <div className="bg-[#1e1e2d] rounded-xl shadow-lg border border-white/5">
        <div className="dashboard-card-header">
          <div className="dashboard-card-title">
            <i className="fas fa-plus-circle"></i>
            <h2>إنشاء امتحان جديد</h2>
          </div>
          {step === 'questions' && (
            <div className="text-sm font-bold text-blue-600">
              سؤال {currentQuestionIndex + 1} من {questions.length}
            </div>
          )}
        </div>

        <div className="p-6">
          {step === 'details' ? (
            <form onSubmit={handleStartQuestions}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                    {grades.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="block text-sm font-medium text-white mb-2">تاريخ الامتحان</label>
                  <input
                    type="datetime-local"
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

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => router.push('/teacher/exams')}
                  className="btn btn-secondary px-8 py-3 text-lg"
                >
                  <i className="fas fa-arrow-right ml-2"></i>
                  رجوع
                </button>

                <button type="submit" className="btn btn-primary px-8 py-3 text-lg">
                  التالي: إضافة الأسئلة
                  <i className="fas fa-arrow-left mr-2"></i>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-8">
              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2.5 mb-6">
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                ></div>
              </div>

              <div className="bg-[#1e1e2d] rounded-xl shadow-lg border border-white/5">
                <div className="dashboard-card-header">
                  <div className="dashboard-card-title">
                    <h4 className="font-bold text-lg">سؤال {currentQuestionIndex + 1}</h4>
                    <span className="text-sm text-gray-500 mr-2">من {questions.length}</span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="form-group mb-6">
                    <label className="block text-sm font-medium mb-2">نص السؤال</label>
                    <input
                      type="text"
                      className="form-input w-full"
                      value={questions[currentQuestionIndex].text}
                      onChange={(e) => handleQuestionChange('text', e.target.value)}
                      required
                      placeholder="اكتب السؤال هنا..."
                      autoFocus
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium mb-2">الخيارات (اختر الإجابة الصحيحة)</label>
                    <div className="grid grid-cols-1 gap-4">
                      {questions[currentQuestionIndex].options.map((option, oIndex) => (
                        <div key={oIndex} className={`flex items-center gap-3 p-3 rounded-lg ${questions[currentQuestionIndex].correct_answer === option && option !== '' ? 'border border-primary bg-primary/10' : ''}`}>
                          <div 
                            className="relative flex items-center justify-center cursor-pointer"
                            onClick={() => handleQuestionChange('correct_answer', option)}
                          >
                            <div className={`w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                              questions[currentQuestionIndex].correct_answer === option && option !== ''
                                ? 'bg-primary border-primary' 
                                : 'bg-white border-gray-300 hover:border-primary'
                            }`}>
                              {questions[currentQuestionIndex].correct_answer === option && option !== '' && (
                                <i className="fas fa-check text-white text-xs"></i>
                              )}
                            </div>
                          </div>
                          <input
                            type="text"
                            className="form-input w-full border-none shadow-none focus:ring-0"
                            value={option}
                            onChange={(e) => handleOptionChange(oIndex, e.target.value)}
                            required
                            placeholder={`الخيار ${oIndex + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={handlePrevQuestion}
                  className={`btn btn-secondary px-6 ${currentQuestionIndex === 0 ? 'invisible' : ''}`}
                >
                  <i className="fas fa-arrow-right ml-2"></i>
                  السابق
                </button>

                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="btn btn-primary px-6"
                  >
                    التالي
                    <i className="fas fa-arrow-left mr-2"></i>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="btn btn-success px-8 bg-green-600 hover:bg-green-700 text-white"
                    disabled={loading}
                  >
                    {loading ? 'جاري الحفظ...' : 'حفظ وإنهاء'}
                    <i className="fas fa-check mr-2"></i>
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
