'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { getAcademyExam, updateAcademyExam, getGrades, getGroups, getExamTeachers } from '@/services/academyService';
import { toast } from 'react-hot-toast';
import { Filter } from '@/components/Filter';
import { Button, Icon, Input, LoadingSpinner, FormModal } from '@/components/ui';

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
      <Icon name="grip-vertical" className="text-gray-400" />
      <div className="flex-1">
        <p className="font-medium text-white truncate">{props.text || 'سؤال جديد'}</p>
        <span className="text-xs text-gray-400">{props.duration} ثانية</span>
      </div>
      <Button
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          props.onRemove();
        }}
        className="text-red-400 hover:text-red-300 p-2"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Icon name="trash" />
      </Button>
    </div>
  );
}

export default function EditAcademyExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Wizard State
  const [step, setStep] = useState<'details' | 'questions'>('details');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Exam Basic Info
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [teacherId, setTeacherId] = useState('');
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
    const fetchData = async () => {
      try {
        setInitialLoading(true);
        const [examData, teachersData] = await Promise.all([
          getAcademyExam(id),
          getExamTeachers()
        ]);
        
        setTeachers(teachersData || []);

        // Set exam data
        setTitle(examData.title || '');
        setSubject(examData.subject || '');
        setDuration(examData.duration || 60);
        setTotalMarks(examData.max_score || 100);
        setActualQuestionCount(examData.actual_question_count || 0);
        
        const tId = examData.teacher_id || examData.grade?.teacher_id || '';
        const gId = examData.grade?.id || examData.grade_id || '';
        const grId = examData.group?.id || examData.group_id || '';

        setTeacherId(tId);
        setGradeId(gId);
        setGroupId(grId);

        // Fetch Grades for this teacher
        if (tId) {
          try {
            const gradesData = await getGrades(1, 100, { teacher_id: tId });
            setGrades(gradesData.data?.data || []);
          } catch (e) {
            console.error('Error fetching grades:', e);
          }
        }

        // Fetch Groups for this grade
        if (gId) {
          try {
            const groupsData = await getGroups(1, 100, { grade_id: gId });
            setGroups(groupsData.data?.data || []);
          } catch (e) {
            console.error('Error fetching groups:', e);
          }
        }
        
        // Format date for datetime-local input
        if (examData.date) {
          const examDate = new Date(examData.date);
          const formattedDate = examDate.toISOString().slice(0, 16);
          setDate(formattedDate);
        }
        
        // Set questions with proper IDs
        if (examData.questions && examData.questions.length > 0) {
          const formattedQuestions = examData.questions.map((q: any) => {
            let options = q.options;
            if (typeof options === 'string') {
              try {
                options = JSON.parse(options);
              } catch {
                options = [];
              }
            }
            return {
              id: q.id?.toString() || crypto.randomUUID(),
              text: q.text || '',
              options: Array.isArray(options) ? options : ['', '', '', ''],
              correct_answer: q.correct_answer || '',
              duration: q.duration || 60
            };
          });
          setQuestions(formattedQuestions);
        }
        
        setInitialLoadComplete(true);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('حدث خطأ أثناء تحميل بيانات الامتحان');
        router.push('/academy/exams');
      } finally {
        setInitialLoading(false);
      }
    };
    
    if (id) {
      fetchData();
    }
  }, [id, router]);

  // Fetch Grades when Teacher changes (after initial load)
  useEffect(() => {
    if (!initialLoadComplete) return;

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
  }, [teacherId, initialLoadComplete]);

  // Fetch Groups when Grade changes (after initial load)
  useEffect(() => {
    if (!initialLoadComplete) return;

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
  }, [gradeId, initialLoadComplete]);

  const validateDetails = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!title.trim()) errors.title = 'عنوان الامتحان مطلوب';
    if (!subject.trim()) errors.subject = 'المادة مطلوبة';
    if (!teacherId) errors.teacherId = 'المدرس مطلوب';
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
    setActualQuestionCount(actualQuestionCount || questions.length);
    setShowFinishModal(true);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const response = await updateAcademyExam(id, {
        title,
        subject,
        teacher_id: teacherId,
        grade_id: gradeId,
        group_id: groupId || undefined,
        date,
        duration,
        total_marks: totalMarks,
        actual_question_count: actualQuestionCount,
        time_per_question: 60,
        questions
      });
      
      toast.success('تم تحديث الامتحان بنجاح');
      
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
      console.error('Error updating exam:', error);
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء تحديث الامتحان');
    } finally {
      setLoading(false);
      setShowFinishModal(false);
    }
  };

  if (initialLoading) {
    return (
      <DashboardLayout
        role="academy"
        user={{ name: user?.name || 'الأكاديمية', avatar: user?.avatar || '' }}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <LoadingSpinner size="sm" color="primary" />
            <p className="text-gray-light">جاري تحميل بيانات الامتحان...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="academy"
      user={{ name: user?.name || 'الأكاديمية', avatar: user?.avatar || '' }}
    >
      <div className="rounded-xl shadow-lg border border-white/5 p-6">
        <div className="dashboard-card-header">
          <div className="dashboard-card-title">
            <Icon name="edit" />
            <h2>تعديل الامتحان</h2>
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
                <div className="form-group md:col-span-2">
                  <label className="block text-sm font-medium text-white mb-2">المدرس <span className="text-red-500">*</span></label>
                  <Filter
                    options={teachers.map(t => ({ value: t.id, label: t.name }))}
                    value={teacherId}
                    onChange={(value) => setTeacherId(value)}
                    placeholder="اختر المدرس"
                    className={formErrors.teacherId ? 'border-red-500' : ''}
                  />
                  {formErrors.teacherId && <span className="text-red-500 text-xs mt-1 block"><Icon name="exclamation-circle" className="ml-1 inline" />{formErrors.teacherId}</span>}
                </div>
                <div className="form-group">
                  <label className="block text-sm font-medium text-white mb-2">عنوان الامتحان <span className="text-red-500">*</span></label>
                  <Input
                    type="text"
                    className={formErrors.title ? 'border-red-500' : ''}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  {formErrors.title && <span className="text-red-500 text-xs mt-1 block"><Icon name="exclamation-circle" className="ml-1 inline" />{formErrors.title}</span>}
                </div>
                <div className="form-group">
                  <label className="block text-sm font-medium text-white mb-2">المادة <span className="text-red-500">*</span></label>
                  <Input
                    type="text"
                    className={formErrors.subject ? 'border-red-500' : ''}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                  {formErrors.subject && <span className="text-red-500 text-xs mt-1 block"><Icon name="exclamation-circle" className="ml-1 inline" />{formErrors.subject}</span>}
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
                  {formErrors.gradeId && <span className="text-red-500 text-xs mt-1 block"><Icon name="exclamation-circle" className="ml-1 inline" />{formErrors.gradeId}</span>}
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
                  <Input
                    type="datetime-local"
                    className={formErrors.date ? 'border-red-500' : ''}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                  {formErrors.date && <span className="text-red-500 text-xs mt-1 block"><Icon name="exclamation-circle" className="ml-1 inline" />{formErrors.date}</span>}
                </div>
                <div className="form-group">
                  <label className="block text-sm font-medium text-white mb-2">المدة (دقيقة) <span className="text-red-500">*</span></label>
                  <Input
                    type="number"
                    className={formErrors.duration ? 'border-red-500' : ''}
                    value={duration || ''}
                    onChange={(e) => setDuration(e.target.value === '' ? 0 : parseInt(e.target.value))}
                  />
                  {formErrors.duration && <span className="text-red-500 text-xs mt-1 block"><Icon name="exclamation-circle" className="ml-1 inline" />{formErrors.duration}</span>}
                </div>
                <div className="form-group">
                  <label className="block text-sm font-medium text-white mb-2">الدرجة الكلية <span className="text-red-500">*</span></label>
                  <Input
                    type="number"
                    className={formErrors.totalMarks ? 'border-red-500' : ''}
                    value={totalMarks || ''}
                    onChange={(e) => setTotalMarks(e.target.value === '' ? 0 : parseInt(e.target.value))}
                  />
                  {formErrors.totalMarks && <span className="text-red-500 text-xs mt-1 block"><Icon name="exclamation-circle" className="ml-1 inline" />{formErrors.totalMarks}</span>}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 mt-8">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push('/academy/exams')}
                  className="px-8 py-3 text-lg w-full sm:w-auto"
                >
                  <Icon name="arrow-right" className="ml-2" />
                  رجوع
                </Button>

                <Button type="submit" variant="primary" className="px-8 py-3 text-lg w-full sm:w-auto">
                  التالي: تعديل الأسئلة
                  <Icon name="arrow-left" className="mr-2" />
                </Button>
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
                        <Input
                          type="number"
                          className="w-20 py-1 px-2 text-sm"
                          value={questions[currentQuestionIndex]?.duration || 60}
                          onChange={(e) => handleQuestionChange('duration', parseInt(e.target.value))}
                          min="10"
                          max="600"
                        />
                      </div>
                    </div>
                    <Input
                      type="text"
                      value={questions[currentQuestionIndex]?.text || ''}
                      onChange={(e) => handleQuestionChange('text', e.target.value)}
                      required
                      placeholder="اكتب السؤال هنا..."
                      autoFocus
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium mb-2">الخيارات (اختر الإجابة الصحيحة)</label>
                    <div className="grid grid-cols-1 gap-4">
                      {questions[currentQuestionIndex]?.options?.map((option, oIndex) => (
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
                                <Icon name="check" className="text-white text-xs" />
                              )}
                            </div>
                          </div>
                          <Input
                            type="text"
                            className="border-none shadow-none focus:ring-0"
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
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowPreviewModal(true)}
                    className="px-6 w-full sm:w-auto flex-1 lg:flex-none justify-center"
                  >
                    معاينة وترتيب
                    <Icon name="sort" className="mr-2" />
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 order-3 lg:order-3 w-full lg:w-auto">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleNextQuestion}
                    className="px-6 w-full sm:w-auto flex-1 lg:flex-none justify-center"
                  >
                    سؤال جديد
                    <Icon name="plus" className="mr-2" />
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleSubmit}
                    className="px-8 bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto flex-1 lg:flex-none justify-center"
                    disabled={loading}
                  >
                    حفظ التعديلات
                    <Icon name="check" className="mr-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Finish Modal */}
      <FormModal
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        onSubmit={(e) => { e.preventDefault(); handleFinalSubmit(); }}
        title="إعدادات الامتحان النهائية"
        isLoading={loading}
        submitText="حفظ التعديلات"
        cancelText="إلغاء"
        maxWidth="450px"
      >
        <div className="form-group">
          <label className="block text-sm font-medium text-white mb-2">
            عدد الأسئلة التي ستظهر للطالب
          </label>
          <Input
            type="number"
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
      </FormModal>

      {/* Preview & Reorder Modal */}
      <FormModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onSubmit={(e) => { e.preventDefault(); setShowPreviewModal(false); }}
        title="معاينة وترتيب الأسئلة"
        submitText="حفظ الترتيب"
        cancelText=""
        maxWidth="700px"
      >
        <div className="max-h-[50vh] overflow-y-auto">
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
      </FormModal>
    </DashboardLayout>
  );
}
