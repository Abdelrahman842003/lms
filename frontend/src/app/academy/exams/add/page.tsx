'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { createAcademyExam, getExamTeachers, getGrades, getGroups } from '@/services/academyService';
import { toast } from 'react-hot-toast';
import { Filter } from '@/components/Filter';

import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Question {
  id: string;
  text: string;
  options: string[];
  correct_answer: string;
  duration: number;
}

interface SortableItemProps {
  id: string;
  text: string;
  duration: number;
  onRemove: () => void;
}

function SortableItem(props: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({id: props.id});
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="p-3 mb-2 bg-white/5 rounded border border-white/10 flex items-center gap-3 cursor-move touch-none">
      <i className="fas fa-grip-vertical text-gray-400"></i>
      <div className="flex-1">
        <p className="font-medium text-white truncate">{props.text || 'سؤال جديد'}</p>
        <span className="text-xs text-gray-400">{props.duration} ثانية</span>
      </div>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          props.onRemove();
        }} 
        className="text-red-400 hover:text-red-300 p-2"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <i className="fas fa-trash"></i>
      </button>
    </div>
  );
}

export default function AddAcademyExamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  
  // Wizard State
  const [step, setStep] = useState<'details' | 'questions'>('details');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Exam Basic Info
  const [teacherId, setTeacherId] = useState('');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState(60);
  const [totalMarks, setTotalMarks] = useState(100);
  const [actualQuestionCount, setActualQuestionCount] = useState(0);
  
  // Final Modal State
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const {active, over} = event;
    
    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  
  // Form Validation Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Questions State
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const teachersData = await getExamTeachers();
        setTeachers(teachersData || []);
      } catch (error) {
        console.error('Error fetching teachers:', error);
        toast.error('حدث خطأ أثناء تحميل قائمة المدرسين');
      }
    };
    fetchTeachers();
  }, []);

  // Fetch Grades when Teacher changes
  useEffect(() => {
    const fetchGrades = async () => {
      if (!teacherId) {
        setGrades([]);
        setGradeId('');
        return;
      }
      
      try {
        const gradesData = await getGrades(1, 100, { teacher_id: teacherId });
        setGrades(gradesData.data?.data || []);
      } catch (error) {
        console.error('Error fetching grades:', error);
        toast.error('حدث خطأ أثناء تحميل الصفوف الدراسية');
      }
    };
    
    fetchGrades();
    setGradeId(''); // Reset grade when teacher changes
  }, [teacherId]);

  // Fetch Groups when Grade changes
  useEffect(() => {
    const fetchGroups = async () => {
      if (!gradeId) {
        setGroups([]);
        setGroupId('');
        return;
      }
      
      try {
        const groupsData = await getGroups(1, 100, { grade_id: gradeId });
        setGroups(groupsData.data?.data || []);
      } catch (error) {
        console.error('Error fetching groups:', error);
        toast.error('حدث خطأ أثناء تحميل المجموعات');
      }
    };
    
    fetchGroups();
    setGroupId(''); // Reset group when grade changes
  }, [gradeId]);

  const validateDetails = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!teacherId) errors.teacherId = 'يجب اختيار المدرس';
    if (!title.trim()) errors.title = 'عنوان الامتحان مطلوب';
    if (!subject.trim()) errors.subject = 'المادة مطلوبة';
    if (!gradeId) errors.gradeId = 'الصف الدراسي مطلوب';
    if (!date) errors.date = 'تاريخ الامتحان مطلوب';
    if (!duration || duration < 1) errors.duration = 'مدة الامتحان مطلوبة (دقيقة واحدة على الأقل)';
    if (!totalMarks || totalMarks < 1) errors.totalMarks = 'الدرجة الكلية مطلوبة';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStartQuestions = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateDetails()) {
      toast.error('يرجى ملء جميع البيانات المطلوبة');
      return;
    }
    
    // Initialize with one empty question if empty
    if (questions.length === 0) {
      setQuestions([{
        id: crypto.randomUUID(),
        text: '',
        options: ['', '', '', ''],
        correct_answer: '',
        duration: 60
      }]);
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
    } else {
      // Add new question
      setQuestions([...questions, {
        id: crypto.randomUUID(),
        text: '',
        options: ['', '', '', ''],
        correct_answer: '',
        duration: 60
      }]);
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    // Validate current question before finishing
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ.text || currentQ.options.some(o => !o) || !currentQ.correct_answer) {
      toast.error('يرجى إكمال السؤال الحالي قبل الحفظ');
      return;
    }

    // Open modal to confirm actual question count
    setActualQuestionCount(questions.length);
    setShowFinishModal(true);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const response = await createAcademyExam({
        teacher_id: teacherId,
        title,
        subject,
        grade_id: gradeId,
        group_id: groupId || undefined,
        date,
        duration,
        total_marks: totalMarks,
        actual_question_count: actualQuestionCount,
        time_per_question: 60,
        questions
      });
      
      toast.success('تم إنشاء الامتحان بنجاح');
      
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
      
      router.push('/academy/exams');
    } catch (error: any) {
      console.error('Error creating exam:', error);
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء إنشاء الامتحان');
    } finally {
      setLoading(false);
      setShowFinishModal(false);
    }
  };

  return (
    <DashboardLayout
      role="academy"
      user={{ name: user?.name || 'الأكاديمية', avatar: user?.avatar || '' }}
    >

      
      <div className="rounded-xl shadow-lg border border-white/5 p-6">
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

        <div className="p-4 md:p-6">
          {step === 'details' ? (
            <form onSubmit={handleStartQuestions}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Teacher Selection - Required for Academy */}
                <div className="form-group md:col-span-2">
                  <label className="block text-sm font-medium text-white mb-2">المدرس <span className="text-red-500">*</span></label>
                  <Filter
                    options={teachers.map(t => ({ value: t.id, label: t.name }))}
                    value={teacherId}
                    onChange={(value) => setTeacherId(value)}
                    placeholder="اختر المدرس"
                    className={formErrors.teacherId ? 'border-red-500' : ''}
                  />
                  {formErrors.teacherId && <span className="text-red-500 text-xs mt-1 block"><i className="fas fa-exclamation-circle ml-1"></i>{formErrors.teacherId}</span>}
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-white mb-2">عنوان الامتحان <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className={`form-input w-full ${formErrors.title ? 'border-red-500' : ''}`}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  {formErrors.title && <span className="text-red-500 text-xs mt-1 block"><i className="fas fa-exclamation-circle ml-1"></i>{formErrors.title}</span>}
                </div>
                <div className="form-group">
                  <label className="block text-sm font-medium text-white mb-2">المادة <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className={`form-input w-full ${formErrors.subject ? 'border-red-500' : ''}`}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                  {formErrors.subject && <span className="text-red-500 text-xs mt-1 block"><i className="fas fa-exclamation-circle ml-1"></i>{formErrors.subject}</span>}
                </div>
                <div className="form-group">
                  <label className="block text-sm font-medium text-white mb-2">الصف الدراسي <span className="text-red-500">*</span></label>
                  <Filter
                    options={grades.map(g => ({ value: g.id, label: g.name }))}
                    value={gradeId}
                    onChange={(value) => setGradeId(value)}
                    placeholder={!teacherId ? 'اختر المدرس أولاً' : 'اختر الصف'}
                    className={formErrors.gradeId ? 'border-red-500' : ''}
                    disabled={!teacherId}
                  />
                  {formErrors.gradeId && <span className="text-red-500 text-xs mt-1 block"><i className="fas fa-exclamation-circle ml-1"></i>{formErrors.gradeId}</span>}
                </div>
                <div className="form-group">
                  <label className="block text-sm font-medium text-white mb-2">المجموعة (اختياري)</label>
                  <Filter
                    options={[
                      { value: '', label: 'كل المجموعات' },
                      ...groups.map(g => ({ value: g.id, label: g.name }))
                    ]}
                    value={groupId}
                    onChange={(value) => setGroupId(value)}
                    placeholder={!gradeId ? 'اختر الصف أولاً' : 'كل المجموعات'}
                    disabled={!gradeId}
                  />
                </div>
                <div className="form-group">
                  <label className="block text-sm font-medium text-white mb-2">تاريخ الامتحان <span className="text-red-500">*</span></label>
                  <input
                    type="datetime-local"
                    className={`form-input w-full ${formErrors.date ? 'border-red-500' : ''}`}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                  {formErrors.date && <span className="text-red-500 text-xs mt-1 block"><i className="fas fa-exclamation-circle ml-1"></i>{formErrors.date}</span>}
                </div>
                <div className="form-group">
                  <label className="block text-sm font-medium text-white mb-2">المدة (دقيقة) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    className={`form-input w-full ${formErrors.duration ? 'border-red-500' : ''}`}
                    value={duration || ''}
                    onChange={(e) => setDuration(e.target.value === '' ? 0 : parseInt(e.target.value))}
                  />
                  {formErrors.duration && <span className="text-red-500 text-xs mt-1 block"><i className="fas fa-exclamation-circle ml-1"></i>{formErrors.duration}</span>}
                </div>
                <div className="form-group">
                  <label className="block text-sm font-medium text-white mb-2">الدرجة الكلية <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    className={`form-input w-full ${formErrors.totalMarks ? 'border-red-500' : ''}`}
                    value={totalMarks || ''}
                    onChange={(e) => setTotalMarks(e.target.value === '' ? 0 : parseInt(e.target.value))}
                  />
                  {formErrors.totalMarks && <span className="text-red-500 text-xs mt-1 block"><i className="fas fa-exclamation-circle ml-1"></i>{formErrors.totalMarks}</span>}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => router.push('/academy/exams')}
                  className="btn btn-secondary px-8 py-3 text-lg w-full sm:w-auto"
                >
                  <i className="fas fa-arrow-right ml-2"></i>
                  رجوع
                </button>

                <button type="submit" className="btn btn-primary px-8 py-3 text-lg w-full sm:w-auto">
                  التالي: إضافة الأسئلة
                  <i className="fas fa-arrow-left mr-2"></i>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-8">
              {/* Progress Bar */}
              <div className="w-full rounded-full h-2.5 mb-6">
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                ></div>
              </div>

              <div className="">
                <div className="dashboard-card-header">
                  <div className="dashboard-card-title">
                    <h4 className="font-bold text-lg">سؤال {currentQuestionIndex + 1}</h4>
                    <span className="text-sm text-gray-500 mr-2">من {questions.length}</span>
                  </div>
                </div>
                
                <div>
                  <div className="form-group mb-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 gap-2 md:gap-0">
                      <label className="block text-sm font-medium">نص السؤال</label>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-400">مدة السؤال (ثانية):</label>
                        <input
                          type="number"
                          className="form-input w-20 py-1 px-2 text-sm"
                          value={questions[currentQuestionIndex].duration || 60}
                          onChange={(e) => handleQuestionChange('duration', parseInt(e.target.value))}
                          min="10"
                          max="600"
                        />
                      </div>
                    </div>
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

              <div className="flex flex-col lg:flex-row lg:justify-between gap-4 mt-8">
                <div className="flex flex-col sm:flex-row gap-3 order-1 lg:order-2 w-full lg:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(true)}
                    className="btn btn-secondary px-6 w-full sm:w-auto flex-1 lg:flex-none justify-center"
                  >
                    معاينة وترتيب
                    <i className="fas fa-sort mr-2"></i>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 order-3 lg:order-3 w-full lg:w-auto">
                    <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="btn btn-primary px-6 w-full sm:w-auto flex-1 lg:flex-none justify-center"
                    >
                    سؤال جديد
                    <i className="fas fa-plus mr-2"></i>
                    </button>

                    <button
                    type="button"
                    onClick={handleSubmit}
                    className="btn btn-success px-8 bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto flex-1 lg:flex-none justify-center"
                    disabled={loading}
                    >
                    إنهاء
                    <i className="fas fa-check mr-2"></i>
                    </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Finish Modal */}
      {showFinishModal && (
        <div className="modal-overlay" onClick={() => setShowFinishModal(false)}>
          <div className="modal-content w-[95%] max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>إعدادات الامتحان النهائية</h3>
              <button className="modal-close" onClick={() => setShowFinishModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="block text-sm font-medium text-white mb-2">
                  عدد الأسئلة التي ستظهر للطالب
                </label>
                <input
                  type="number"
                  className="form-input w-full"
                  value={actualQuestionCount}
                  onChange={(e) => setActualQuestionCount(parseInt(e.target.value))}
                  min="1"
                  max={questions.length}
                />
                <p className="text-xs text-gray-400 mt-2">
                  لديك {questions.length} سؤال في بنك الأسئلة.
                  يمكنك اختيار عدد أقل ليتم اختيار الأسئلة عشوائياً لكل طالب.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowFinishModal(false)}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleFinalSubmit}
                disabled={loading}
              >
                {loading ? 'جاري الحفظ...' : 'حفظ ونشر الامتحان'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview & Reorder Modal */}
      {showPreviewModal && (
        <div className="modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="modal-content w-[95%] max-w-2xl h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>معاينة وترتيب الأسئلة</h3>
              <button className="modal-close" onClick={() => setShowPreviewModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body flex-1 overflow-y-auto">
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={questions.map(q => q.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {questions.map((question) => (
                    <SortableItem 
                      key={question.id} 
                      id={question.id} 
                      text={question.text} 
                      duration={question.duration}
                      onRemove={() => {
                        if (questions.length > 1) {
                          setQuestions(questions.filter(q => q.id !== question.id));
                          if (currentQuestionIndex >= questions.length - 1) {
                            setCurrentQuestionIndex(Math.max(0, questions.length - 2));
                          }
                        } else {
                          toast.error('يجب أن يحتوي الامتحان على سؤال واحد على الأقل');
                        }
                      }}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowPreviewModal(false)}
              >
                حفظ الترتيب
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
