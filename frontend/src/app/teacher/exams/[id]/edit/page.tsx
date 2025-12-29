'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/AuthContext';
import { getExam, updateExam } from '@/services/authService';
import { getGrades } from '@/services/authService';
import { toast } from 'react-hot-toast';

interface Question {
  id?: number;
  text: string;
  options: string[];
  correct_answer: string;
}

export default function EditExamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  
  const [grades, setGrades] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    grade_id: '',
    date: '',
    duration: 60,
    max_score: 100,
    actual_question_count: 10,
    time_per_question: 60,
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchExamData();
    fetchGrades();
  }, [examId]);

  const fetchExamData = async () => {
    try {
      setIsLoading(true);
      const data = await getExam(examId);
      
      // Parse date for datetime-local input
      let formattedDate = '';
      if (data.date) {
        const date = new Date(data.date);
        formattedDate = date.toISOString().slice(0, 16);
      }

      setFormData({
        title: data.title || '',
        subject: data.subject || '',
        grade_id: data.grade?.id ? String(data.grade.id) : '',
        date: formattedDate,
        duration: data.duration || 60,
        max_score: data.max_score || 100,
        actual_question_count: data.actual_question_count || 10,
        time_per_question: data.time_per_question || 60,
      });

      // Parse questions
      if (data.questions && Array.isArray(data.questions)) {
        const parsedQuestions = data.questions.map((q: any) => ({
          id: q.id,
          text: q.text || '',
          options: parseOptions(q.options),
          correct_answer: q.correct_answer || '',
        }));
        setQuestions(parsedQuestions);
      }
    } catch (error) {
      console.error('Failed to fetch exam data:', error);
      setFormErrors({ submit: 'فشل تحميل بيانات الامتحان' });
    } finally {
      setIsLoading(false);
    }
  };

  const parseOptions = (options: any): string[] => {
    if (Array.isArray(options)) {
      return options;
    }
    if (typeof options === 'string') {
      try {
        const parsed = JSON.parse(options);
        return Array.isArray(parsed) ? parsed : ['', '', '', ''];
      } catch {
        return ['', '', '', ''];
      }
    }
    return ['', '', '', ''];
  };

  const fetchGrades = async () => {
    try {
      const gradesData = await getGrades();
      setGrades(gradesData.data || []);
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'عنوان الامتحان مطلوب';
    }

    if (!formData.subject.trim()) {
      errors.subject = 'المادة مطلوبة';
    }

    if (!formData.grade_id) {
      errors.grade_id = 'الصف الدراسي مطلوب';
    }

    if (!formData.date) {
      errors.date = 'تاريخ الامتحان مطلوب';
    }

    if (formData.duration < 1) {
      errors.duration = 'المدة يجب أن تكون أكبر من 0';
    }

    if (formData.max_score < 1) {
      errors.max_score = 'الدرجة الكلية يجب أن تكون أكبر من 0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});
    setSuccessMessage('');

    try {
      const submitData = {
        title: formData.title,
        subject: formData.subject,
        grade_id: formData.grade_id,
        date: formData.date,
        duration: formData.duration,
        total_marks: formData.max_score,
        actual_question_count: formData.actual_question_count,
        time_per_question: formData.time_per_question,
        questions: questions,
      };

      const response = await updateExam(examId, submitData);
      
      setSuccessMessage('تم تحديث بيانات الامتحان بنجاح!');
      toast.success('تم تحديث الامتحان بنجاح');
      
      // عرض التحذير إذا وجد تعارض محتمل
      if (response?.warning) {
        toast(response.warning, {
          icon: '⚠️',
          duration: 6000,
          style: {
            background: '#f59e0b',
            color: '#1f2937',
          },
        });
      }
      
      // Redirect to exam details after 1.5 seconds
      setTimeout(() => {
        router.push(`/teacher/exams/${examId}`);
      }, 1500);
    } catch (error: any) {
      console.error('Failed to update exam:', error);
      setFormErrors({ submit: error.message || 'حدث خطأ أثناء تحديث بيانات الامتحان' });
      toast.error('حدث خطأ أثناء تحديث الامتحان');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/teacher/exams/${examId}`);
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

  return (
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={user || undefined}
    >
      <DashboardCard
        title="تعديل بيانات الامتحان"
        icon="fas fa-edit"
      >
        <form onSubmit={handleSubmit}>
          {successMessage && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-lg mb-6 flex items-center gap-3">
              <i className="fas fa-check-circle text-xl"></i>
              <span>{successMessage}</span>
            </div>
          )}

          {formErrors.submit && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg mb-6 flex items-center gap-3">
              <i className="fas fa-exclamation-circle text-xl"></i>
              <span>{formErrors.submit}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-gray-light mb-2 text-[0.95rem]">
                عنوان الامتحان <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                className={`w-full p-3 bg-white/5 border rounded-lg text-white text-[1rem] focus:ring-1 outline-none transition-all ${
                  formErrors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-primary focus:ring-primary'
                }`}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="أدخل عنوان الامتحان"
                disabled={isSubmitting}
              />
              {formErrors.title && <span className="text-red-500 text-sm mt-1 block">{formErrors.title}</span>}
            </div>

            <div>
              <label htmlFor="subject" className="block text-gray-light mb-2 text-[0.95rem]">
                المادة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="subject"
                className={`w-full p-3 bg-white/5 border rounded-lg text-white text-[1rem] focus:ring-1 outline-none transition-all ${
                  formErrors.subject ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-primary focus:ring-primary'
                }`}
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="أدخل اسم المادة"
                disabled={isSubmitting}
              />
              {formErrors.subject && <span className="text-red-500 text-sm mt-1 block">{formErrors.subject}</span>}
            </div>

            <div>
              <label htmlFor="grade_id" className="block text-gray-light mb-2 text-[0.95rem]">
                الصف الدراسي <span className="text-red-500">*</span>
              </label>
              <select
                id="grade_id"
                className={`w-full p-3 bg-white/5 border rounded-lg text-white text-[1rem] focus:ring-1 outline-none transition-all ${
                  formErrors.grade_id ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-primary focus:ring-primary'
                }`}
                value={formData.grade_id}
                onChange={(e) => setFormData({ ...formData, grade_id: e.target.value })}
                disabled={isSubmitting}
              >
                <option value="" className="bg-[#1a1f37]">اختر الصف الدراسي</option>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id} className="bg-[#1a1f37]">
                    {grade.name}
                  </option>
                ))}
              </select>
              {formErrors.grade_id && <span className="text-red-500 text-sm mt-1 block">{formErrors.grade_id}</span>}
            </div>

            <div>
              <label htmlFor="date" className="block text-gray-light mb-2 text-[0.95rem]">
                تاريخ الامتحان <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="date"
                className={`w-full p-3 bg-white/5 border rounded-lg text-white text-[1rem] focus:ring-1 outline-none transition-all ${
                  formErrors.date ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-primary focus:ring-primary'
                }`}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                disabled={isSubmitting}
              />
              {formErrors.date && <span className="text-red-500 text-sm mt-1 block">{formErrors.date}</span>}
            </div>

            <div>
              <label htmlFor="duration" className="block text-gray-light mb-2 text-[0.95rem]">
                المدة (دقيقة) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="duration"
                className={`w-full p-3 bg-white/5 border rounded-lg text-white text-[1rem] focus:ring-1 outline-none transition-all ${
                  formErrors.duration ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-primary focus:ring-primary'
                }`}
                value={formData.duration || ''}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                min="1"
                disabled={isSubmitting}
              />
              {formErrors.duration && <span className="text-red-500 text-sm mt-1 block">{formErrors.duration}</span>}
            </div>

            <div>
              <label htmlFor="max_score" className="block text-gray-light mb-2 text-[0.95rem]">
                الدرجة الكلية <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="max_score"
                className={`w-full p-3 bg-white/5 border rounded-lg text-white text-[1rem] focus:ring-1 outline-none transition-all ${
                  formErrors.max_score ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-primary focus:ring-primary'
                }`}
                value={formData.max_score || ''}
                onChange={(e) => setFormData({ ...formData, max_score: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                min="1"
                disabled={isSubmitting}
              />
              {formErrors.max_score && <span className="text-red-500 text-sm mt-1 block">{formErrors.max_score}</span>}
            </div>

            <div>
              <label htmlFor="actual_question_count" className="block text-gray-light mb-2 text-[0.95rem]">
                عدد الأسئلة الفعلية في الامتحان
              </label>
              <input
                type="number"
                id="actual_question_count"
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white text-[1rem] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                value={formData.actual_question_count || ''}
                onChange={(e) => setFormData({ ...formData, actual_question_count: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                min="1"
                disabled={isSubmitting}
              />
              <span className="text-gray-light text-sm mt-1 block">
                سيتم اختيار هذا العدد عشوائياً من بنك الأسئلة
              </span>
            </div>

            <div>
              <label htmlFor="time_per_question" className="block text-gray-light mb-2 text-[0.95rem]">
                مدة كل سؤال (ثانية)
              </label>
              <input
                type="number"
                id="time_per_question"
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white text-[1rem] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                value={formData.time_per_question || ''}
                onChange={(e) => setFormData({ ...formData, time_per_question: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                min="10"
                max="600"
                disabled={isSubmitting}
              />
              <span className="text-gray-light text-sm mt-1 block">
                من 10 ثانية إلى 10 دقائق
              </span>
            </div>
          </div>

          {/* Questions Editor */}
          {questions.length > 0 && (
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <i className="fas fa-question-circle text-primary"></i>
                  تعديل الأسئلة ({questions.length} سؤال)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowQuestionEditor(!showQuestionEditor)}
                  className="btn btn-outline btn-sm"
                >
                  <i className={`fas fa-${showQuestionEditor ? 'chevron-up' : 'chevron-down'}`}></i>
                  <span>{showQuestionEditor ? 'إخفاء' : 'عرض'}</span>
                </button>
              </div>

              {showQuestionEditor && (
                <div className="space-y-6">
                  {/* Question Navigation */}
                  <div className="flex flex-wrap gap-2 p-4 bg-white/5 rounded-lg">
                    {questions.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`w-10 h-10 rounded-lg font-bold transition-all ${
                          currentQuestionIndex === index
                            ? 'bg-primary text-white'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>

                  {/* Current Question Editor */}
                  <div className="bg-[#1a1f37] p-6 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold">
                        {currentQuestionIndex + 1}
                      </span>
                      <h4 className="text-white font-medium">السؤال {currentQuestionIndex + 1} من {questions.length}</h4>
                    </div>

                    <div className="form-group mb-6">
                      <label className="block text-gray-light mb-2 text-[0.95rem]">نص السؤال</label>
                      <input
                        type="text"
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white text-[1rem] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        value={questions[currentQuestionIndex]?.text || ''}
                        onChange={(e) => handleQuestionChange('text', e.target.value)}
                        placeholder="اكتب السؤال هنا..."
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="block text-gray-light mb-2 text-[0.95rem]">الخيارات (اختر الإجابة الصحيحة)</label>
                      <div className="grid grid-cols-1 gap-3">
                        {questions[currentQuestionIndex]?.options.map((option, oIndex) => (
                          <div 
                            key={oIndex} 
                            className={`flex items-center gap-3 p-3 rounded-lg border ${
                              questions[currentQuestionIndex].correct_answer === option && option !== '' 
                                ? 'border-green-500/50 bg-green-500/10' 
                                : 'border-white/10 bg-white/5'
                            }`}
                          >
                            <div 
                              className="relative flex items-center justify-center cursor-pointer"
                              onClick={() => handleQuestionChange('correct_answer', option)}
                            >
                              <div className={`w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                                questions[currentQuestionIndex].correct_answer === option && option !== ''
                                  ? 'bg-green-500 border-green-500' 
                                  : 'bg-white/5 border-gray-500 hover:border-green-500'
                              }`}>
                                {questions[currentQuestionIndex].correct_answer === option && option !== '' && (
                                  <i className="fas fa-check text-white text-xs"></i>
                                )}
                              </div>
                            </div>
                            <input
                              type="text"
                              className="flex-1 p-2 bg-transparent border-none text-white focus:outline-none"
                              value={option}
                              onChange={(e) => handleOptionChange(oIndex, e.target.value)}
                              placeholder={`الخيار ${oIndex + 1}`}
                              disabled={isSubmitting}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Question Navigation Buttons */}
                    <div className="flex justify-between mt-6 pt-4 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        className={`btn btn-outline ${currentQuestionIndex === 0 ? 'invisible' : ''}`}
                        disabled={isSubmitting}
                      >
                        <i className="fas fa-arrow-right"></i>
                        <span>السابق</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                        className={`btn btn-outline ${currentQuestionIndex === questions.length - 1 ? 'invisible' : ''}`}
                        disabled={isSubmitting}
                      >
                        <span>التالي</span>
                        <i className="fas fa-arrow-left"></i>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <i className="fas fa-times"></i>
              <span>إلغاء</span>
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  <span>حفظ التعديلات</span>
                </>
              )}
            </button>
          </div>
        </form>
      </DashboardCard>
    </DashboardLayout>
  );
}
