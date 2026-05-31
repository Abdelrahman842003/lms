'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { getGrades, createExam } from '@/services/authService';
import { getGroups, Group } from '@/services/groupService';
import { toast } from 'react-hot-toast';
import { Filter } from '@/components/Filter';
import { FormModal, Button, Icon, Input } from '@/components/ui';

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
  type: 'mcq' | 'true_false' | 'ordering' | 'matching';
  options: any[];
  correct_answer: string;
  duration: number;
  difficulty?: 'easy' | 'medium' | 'hard';
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
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent drag start
          props.onRemove();
        }}
        className="text-red-400 hover:text-red-300 p-2"
        onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on button
      >
        <Icon name="trash" />
      </button>
    </div>
  );
}

export default function AddExamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [grades, setGrades] = useState<any[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  
  // Wizard State
  const [step, setStep] = useState<'details' | 'questions'>('details');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Exam Basic Info
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(user?.subject || '');
  const [gradeId, setGradeId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState(60);
  const [totalMarks, setTotalMarks] = useState(100);
  const [actualQuestionCount, setActualQuestionCount] = useState(0); // Questions shown in actual exam

  // Question Source and counts
  const [questionSource, setQuestionSource] = useState<'manual' | 'dynamic'>('manual');
  const [easyCount, setEasyCount] = useState(0);
  const [mediumCount, setMediumCount] = useState(0);
  const [hardCount, setHardCount] = useState(0);
  
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
        const [gradesData, groupsData] = await Promise.all([
          getGrades() as Promise<any>,
          getGroups(1, 100)
        ]);
        const fetchedGrades = Array.isArray(gradesData) 
          ? gradesData 
          : (gradesData?.data && Array.isArray(gradesData.data)) 
            ? gradesData.data 
            : [];
        setGrades(fetchedGrades);
        setGroups(groupsData.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (user?.subject) {
      setSubject(user.subject);
    }
  }, [user?.subject]);

  const validateDetails = (): boolean => {
    const errors: Record<string, string> = {};
    
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
    
    if (questionSource === 'dynamic') {
      const sum = easyCount + mediumCount + hardCount;
      if (sum <= 0) {
        toast.error('يرجى تحديد عدد الأسئلة (سؤال واحد على الأقل)');
        return;
      }
      handleDynamicSubmit();
    } else {
      // Initialize with one empty question if empty
      if (questions.length === 0) {
        setQuestions([{
          id: crypto.randomUUID(),
          text: '',
          type: 'mcq',
          options: ['', '', '', ''],
          correct_answer: '',
          duration: 60,
          difficulty: 'medium'
        }]);
      }
      setStep('questions');
    }
  };

  const handleDynamicSubmit = async () => {
    setLoading(true);
    try {
      const response = await createExam({
        title,
        subject,
        grade_id: gradeId,
        group_id: groupId || undefined,
        date,
        duration,
        total_marks: totalMarks,
        actual_question_count: easyCount + mediumCount + hardCount,
        time_per_question: 60,
        type: 'dynamic',
        dynamic_settings: {
          easy: easyCount,
          medium: mediumCount,
          hard: hardCount
        },
        questions: []
      } as any);
      
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
      
      router.push('/teacher/exams');
    } catch (error) {
      console.error('Error creating exam:', error);
      toast.error('حدث خطأ أثناء إنشاء الامتحان');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionChange = (field: keyof Question, value: any) => {
    setQuestions(prev => {
      const updatedQuestions = [...prev];
      
      if (field === 'type') {
        let options: any[] = [];
        if (value === 'mcq') options = ['', '', '', ''];
        else if (value === 'true_false') options = ['صح', 'خطأ'];
        else if (value === 'ordering') options = ['', ''];
        else if (value === 'matching') options = [{ a: '', b: '' }, { a: '', b: '' }];

        updatedQuestions[currentQuestionIndex] = {
          ...updatedQuestions[currentQuestionIndex],
          [field]: value,
          options,
          correct_answer: ''
        };
      } else {
        updatedQuestions[currentQuestionIndex] = {
          ...updatedQuestions[currentQuestionIndex],
          [field]: value
        };
      }
      
      return updatedQuestions;
    });
  };
  const handleOptionChange = (oIndex: number, value: string) => {
    setQuestions(prev => {
      const newQuestions = [...prev];
      const newOptions = [...newQuestions[currentQuestionIndex].options];
      newOptions[oIndex] = value;
      newQuestions[currentQuestionIndex] = { ...newQuestions[currentQuestionIndex], options: newOptions };
      return newQuestions;
    });
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
        type: 'mcq',
        options: ['', '', '', ''],
        correct_answer: '',
        duration: 60,
        difficulty: 'medium'
      }]);
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
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
    setActualQuestionCount(questions.length); // Default to total questions
    setShowFinishModal(true);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const response = await createExam({
        title,
        subject,
        grade_id: gradeId,
        group_id: groupId || undefined,
        date,
        duration,
        total_marks: totalMarks,
        actual_question_count: actualQuestionCount,
        time_per_question: 60, // Default, not used if questions have duration
        type: 'manual',
        questions: questions.map(q => ({
          ...q,
          difficulty: q.difficulty || 'medium'
        }))
      } as any);
      
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
      
      router.push('/teacher/exams');
    } catch (error) {
      console.error('Error creating exam:', error);
      toast.error('حدث خطأ أثناء إنشاء الامتحان');
    } finally {
      setLoading(false);
      setShowFinishModal(false);
    }
  };

  return (
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={{ name: user?.name || 'المدرس', avatar: user?.avatar || '' }}
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary premium-border">
                <Icon name="plus-circle" size="xl" />
             </div>
             <div>
                <h2 className="text-3xl font-black text-white tracking-tight">إنشاء امتحان جديد</h2>
                <p className="text-gray-light/40 font-medium px-1">قم بإعداد تفاصيل الامتحان وإضافة الأسئلة لطلابك</p>
             </div>
          </div>
        </div>
        
        {/* Step Indicator */}
        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/5 p-2 rounded-2xl">
           <div className={`px-4 py-2 rounded-xl transition-all font-black text-xs uppercase tracking-widest flex items-center gap-2
             ${step === 'details' ? 'bg-primary text-white shadow-lg' : 'text-gray-light/20'}`}>
              <span className={`w-5 h-5 rounded-lg flex items-center justify-center border ${step === 'details' ? 'border-white/20 bg-white/10' : 'border-white/5'}`}>1</span>
              <span>البيانات</span>
           </div>
           <div className="w-4 h-px bg-white/5" />
           <div className={`px-4 py-2 rounded-xl transition-all font-black text-xs uppercase tracking-widest flex items-center gap-2
             ${step === 'questions' ? 'bg-primary text-white shadow-lg' : 'text-gray-light/20'}`}>
              <span className={`w-5 h-5 rounded-lg flex items-center justify-center border ${step === 'questions' ? 'border-white/20 bg-white/10' : 'border-white/5'}`}>2</span>
              <span>الأسئلة</span>
           </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {step === 'details' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="premium-glass p-5 sm:p-8 md:p-10 rounded-3xl sm:rounded-[2.5rem] border-white/5">
              <div className="flex items-center gap-3 mb-10 px-2">
                 <Icon name="info-circle" className="text-primary" />
                 <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">البيانات الأساسية للامتحان</h3>
              </div>

              <form onSubmit={handleStartQuestions} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest px-2">عنوان الامتحان</label>
                    <Input
                      type="text"
                      className={`h-14 bg-white/5 border-white/5 rounded-2xl px-5 font-bold focus:bg-white/10 transition-all ${formErrors.title ? 'border-rose-500/50' : ''}`}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="مثلاً: اختبار نهاية الشهر - جبر"
                    />
                    {formErrors.title && <p className="text-[10px] font-bold text-rose-500 px-2">{formErrors.title}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest px-2">المادة الدراسية</label>
                    <Input
                      type="text"
                      className={`h-14 bg-white/5 border-white/5 rounded-2xl px-5 font-bold focus:bg-white/10 transition-all ${formErrors.subject ? 'border-rose-500/50' : ''}`}
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="أدخل اسم المادة"
                    />
                    {formErrors.subject && <p className="text-[10px] font-bold text-rose-500 px-2">{formErrors.subject}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest px-2">الصف الدراسي</label>
                    <Filter
                      options={grades.map(g => ({ value: g.id, label: g.name }))}
                      value={gradeId}
                      onChange={(value) => setGradeId(value)}
                      placeholder="اختر الصف"
                      className={`h-14 bg-white/5 border-white/5 rounded-2xl font-bold ${formErrors.gradeId ? 'border-rose-500/50' : ''}`}
                    />
                    {formErrors.gradeId && <p className="text-[10px] font-bold text-rose-500 px-2">{formErrors.gradeId}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest px-2">المجموعة المخصصة</label>
                    <Filter
                      options={[
                        { value: '', label: 'كل المجموعات' },
                        ...groups
                          .filter(g => !gradeId || g.grade_id === gradeId)
                          .map(g => ({ value: g.id, label: g.name }))
                      ]}
                      value={groupId}
                      onChange={(value) => setGroupId(value)}
                      placeholder="اختر المجموعة"
                      className="h-14 bg-white/5 border-white/5 rounded-2xl font-bold"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-4">
                    <label className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest px-2 block">مصدر ونوع الأسئلة</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Manual Option Card */}
                      <div 
                        onClick={() => setQuestionSource('manual')}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${questionSource === 'manual' ? 'bg-primary/10 border-primary shadow-lg shadow-primary/15' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${questionSource === 'manual' ? 'bg-primary text-white' : 'bg-white/10 text-gray-300'}`}>
                            <Icon name="pencil-alt" />
                          </div>
                          <span className="font-bold text-white text-sm">أسئلة جديدة (يدوياً)</span>
                        </div>
                        <p className="text-[11px] text-gray-light/45 leading-relaxed font-bold">
                          قم بإضافة الأسئلة وتحديد الخيارات والإجابات بنفسك خطوة بخطوة.
                        </p>
                      </div>

                      {/* Dynamic Option Card */}
                      <div 
                        onClick={() => setQuestionSource('dynamic')}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${questionSource === 'dynamic' ? 'bg-primary/10 border-primary shadow-lg shadow-primary/15' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${questionSource === 'dynamic' ? 'bg-primary text-white' : 'bg-white/10 text-gray-300'}`}>
                            <Icon name="database" />
                          </div>
                          <span className="font-bold text-white text-sm">من بنك الأسئلة (تلقائياً)</span>
                        </div>
                        <p className="text-[11px] text-gray-light/45 leading-relaxed font-bold">
                          حدد عدد الأسئلة المطلوبة من كل مستوى صعوبة، وسيقوم النظام بتوليد الامتحان تلقائياً من البنك.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* If From Question Bank (dynamic) */}
                  {questionSource === 'dynamic' && (
                    <div className="md:col-span-2 p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <Icon name="cog" className="text-primary text-xs" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">تحديد أعداد وصعوبة الأسئلة</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest px-2 block text-center">عدد الأسئلة السهلة</label>
                          <Input
                            type="number"
                            className="h-12 bg-white/5 border-white/5 rounded-xl px-4 font-bold focus:bg-white/10 text-center"
                            value={easyCount || ''}
                            onChange={(e) => setEasyCount(e.target.value === '' ? 0 : parseInt(e.target.value))}
                            placeholder="0"
                            min="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest px-2 block text-center">عدد الأسئلة المتوسطة</label>
                          <Input
                            type="number"
                            className="h-12 bg-white/5 border-white/5 rounded-xl px-4 font-bold focus:bg-white/10 text-center"
                            value={mediumCount || ''}
                            onChange={(e) => setMediumCount(e.target.value === '' ? 0 : parseInt(e.target.value))}
                            placeholder="0"
                            min="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest px-2 block text-center">عدد الأسئلة الصعبة</label>
                          <Input
                            type="number"
                            className="h-12 bg-white/5 border-white/5 rounded-xl px-4 font-bold focus:bg-white/10 text-center"
                            value={hardCount || ''}
                            onChange={(e) => setHardCount(e.target.value === '' ? 0 : parseInt(e.target.value))}
                            placeholder="0"
                            min="0"
                          />
                        </div>
                      </div>

                      <div className="pt-2 text-center">
                        <span className="text-xs font-bold text-gray-light/40">
                          إجمالي الأسئلة في الامتحان: <strong className="text-primary font-black text-sm">{easyCount + mediumCount + hardCount}</strong> سؤال
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest px-2">تاريخ ووقت الامتحان</label>
                    <Input
                      type="datetime-local"
                      className={`h-14 bg-white/5 border-white/5 rounded-2xl px-5 font-bold focus:bg-white/10 transition-all ${formErrors.date ? 'border-rose-500/50' : ''}`}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                    {formErrors.date && <p className="text-[10px] font-bold text-rose-500 px-2">{formErrors.date}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest px-2">المدة (دقيقة)</label>
                      <Input
                        type="number"
                        className="h-14 bg-white/5 border-white/5 rounded-2xl px-5 font-bold focus:bg-white/10 transition-all text-center"
                        value={duration || ''}
                        onChange={(e) => setDuration(e.target.value === '' ? 0 : parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest px-2">الدرجة الكلية</label>
                      <Input
                        type="number"
                        className="h-14 bg-white/5 border-white/5 rounded-2xl px-5 font-bold focus:bg-white/10 transition-all text-center"
                        value={totalMarks || ''}
                        onChange={(e) => setTotalMarks(e.target.value === '' ? 0 : parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex flex-col-reverse sm:flex-row justify-between gap-4">
                  <Button
                    type="button"
                    onClick={() => router.push('/teacher/exams')}
                    variant="ghost"
                    className="w-full sm:w-auto h-14 px-10 rounded-2xl font-bold text-gray-light hover:text-white justify-center"
                  >
                    إلغاء والعودة
                  </Button>

                  <Button type="submit" variant="primary" className="w-full sm:w-auto h-14 px-12 rounded-2xl font-black gap-2 shadow-xl shadow-primary/20 justify-center">
                    <span>{questionSource === 'dynamic' ? 'حفظ ونشر الامتحان' : 'التالي: إضافة الأسئلة'}</span>
                    <Icon name={questionSource === 'dynamic' ? 'check' : 'arrow-left'} />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Question Progress bar */}
            <div className="flex items-center gap-4 px-6">
               <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-primary/50 to-primary rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(66,99,235,0.3)]" 
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  />
               </div>
               <span className="text-[11px] font-black text-primary uppercase tracking-widest whitespace-nowrap">
                  السؤال {currentQuestionIndex + 1} / {questions.length}
               </span>
            </div>

             <div className="premium-glass p-4 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2.5rem] border-white/5">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 sm:gap-6 mb-6 sm:mb-10">
                   <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl sm:text-2xl premium-border shadow-2xl shadow-primary/20 shrink-0">
                         {currentQuestionIndex + 1}
                      </div>
                      <div>
                         <h3 className="text-lg sm:text-xl font-black text-white">محرر الأسئلة</h3>
                         <p className="text-[10px] sm:text-xs font-bold text-gray-light/30 uppercase tracking-widest mt-0.5 sm:mt-1">أضف السؤال والخيارات المتاحة</p>
                      </div>
                   </div>
                   
                   <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 bg-white/5 p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl border border-white/5 w-full xl:w-auto">
                     <div className="flex items-center gap-1 bg-white/5 rounded-lg sm:rounded-xl p-1 overflow-x-auto scrollbar-none whitespace-nowrap">
                       <button
                         type="button"
                         onClick={() => handleQuestionChange('type', 'mcq')}
                         className={`flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-md sm:rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${questions[currentQuestionIndex].type === 'mcq' ? 'bg-primary text-white shadow-lg' : 'text-gray-light/30 hover:text-white'}`}
                       >
                         <Icon name="list" className="ml-1.5 text-xs shrink-0" />
                         <span>اختياري</span>
                       </button>
                       <button
                         type="button"
                         onClick={() => handleQuestionChange('type', 'true_false')}
                         className={`flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-md sm:rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${questions[currentQuestionIndex].type === 'true_false' ? 'bg-primary text-white shadow-lg' : 'text-gray-light/30 hover:text-white'}`}
                       >
                         <Icon name="check-circle" className="ml-1.5 text-xs shrink-0" />
                         <span>صح وخطأ</span>
                       </button>
                       <button
                         type="button"
                         onClick={() => handleQuestionChange('type', 'ordering')}
                         className={`flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-md sm:rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${questions[currentQuestionIndex].type === 'ordering' ? 'bg-primary text-white shadow-lg' : 'text-gray-light/30 hover:text-white'}`}
                       >
                         <Icon name="sort" className="ml-1.5 text-xs shrink-0" />
                         <span>ترتيب</span>
                       </button>
                       <button
                         type="button"
                         onClick={() => handleQuestionChange('type', 'matching')}
                         className={`flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-md sm:rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${questions[currentQuestionIndex].type === 'matching' ? 'bg-primary text-white shadow-lg' : 'text-gray-light/30 hover:text-white'}`}
                       >
                         <Icon name="link" className="ml-1.5 text-xs shrink-0" />
                         <span>توصيل</span>
                       </button>
                     </div>
                     
                     <div className="hidden sm:block w-px h-6 bg-white/10 mx-1" />
 
                     <div className="flex items-center justify-between gap-3 sm:gap-2 px-2 py-1.5 bg-white/5 sm:bg-transparent rounded-lg sm:rounded-none">
                       <label className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest">وقت السؤال (ث)</label>
                       <Input
                         type="number"
                         className="h-9 w-18 sm:h-10 sm:w-20 bg-white/10 border-none rounded-lg sm:rounded-xl text-center font-bold text-primary focus:ring-0 text-xs sm:text-sm"
                         value={questions[currentQuestionIndex].duration || 60}
                         onChange={(e) => handleQuestionChange('duration', parseInt(e.target.value))}
                       />
                     </div>

                     <div className="hidden sm:block w-px h-6 bg-white/10 mx-1" />

                     <div className="flex items-center gap-1 bg-white/5 rounded-lg sm:rounded-xl p-1 whitespace-nowrap">
                       <button
                         type="button"
                         onClick={() => handleQuestionChange('difficulty', 'easy')}
                         className={`px-3 py-1.5 rounded-md text-[10px] font-black transition-all ${questions[currentQuestionIndex].difficulty === 'easy' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-light/30 hover:text-white'}`}
                       >
                         سهل
                       </button>
                       <button
                         type="button"
                         onClick={() => handleQuestionChange('difficulty', 'medium')}
                         className={`px-3 py-1.5 rounded-md text-[10px] font-black transition-all ${!questions[currentQuestionIndex].difficulty || questions[currentQuestionIndex].difficulty === 'medium' ? 'bg-amber-600 text-white shadow-md' : 'text-gray-light/30 hover:text-white'}`}
                       >
                         متوسط
                       </button>
                       <button
                         type="button"
                         onClick={() => handleQuestionChange('difficulty', 'hard')}
                         className={`px-3 py-1.5 rounded-md text-[10px] font-black transition-all ${questions[currentQuestionIndex].difficulty === 'hard' ? 'bg-rose-600 text-white shadow-md' : 'text-gray-light/30 hover:text-white'}`}
                       >
                         صعب
                       </button>
                     </div>
                    </div>
                 </div>

               <div className="space-y-6 sm:space-y-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest px-2">نص السؤال العلمي</label>
                    <textarea
                      className="w-full min-h-[90px] sm:min-h-[120px] bg-white/5 border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 font-bold text-base sm:text-lg text-white focus:bg-white/10 focus:border-primary/30 focus:ring-0 transition-all placeholder:text-gray-light/10 leading-relaxed"
                      value={questions[currentQuestionIndex].text}
                      onChange={(e) => handleQuestionChange('text', e.target.value)}
                      placeholder="اكتب السؤال هنا بوضوح..."
                      autoFocus
                    />
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <label className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest px-2">
                      {questions[currentQuestionIndex].type === 'true_false' ? 'حدد الإجابة الصحيحة' : 
                       questions[currentQuestionIndex].type === 'ordering' ? 'اكتب العناصر بالترتيب الصحيح (من الأول للأخير)' :
                       questions[currentQuestionIndex].type === 'matching' ? 'أضف أزواج التوصيل الصحيحة' :
                       'خيارات الإجابة (اضغط لتحديد الإجابة الصحيحة)'}
                    </label>

                    {(questions[currentQuestionIndex].type === 'mcq' || questions[currentQuestionIndex].type === 'true_false') && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        {questions[currentQuestionIndex].options.map((option, oIndex) => {
                          const isCorrect = questions[currentQuestionIndex].correct_answer === option && option !== '';
                          const isTrueFalse = questions[currentQuestionIndex].type === 'true_false';
                          return (
                            <div 
                              key={oIndex} 
                              onClick={() => handleQuestionChange('correct_answer', option)}
                              className={`group relative flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl sm:rounded-2xl cursor-pointer border-2 transition-all duration-300
                                ${isCorrect 
                                  ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                                  : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                            >
                               <button
                                 type="button"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleQuestionChange('correct_answer', option);
                                 }}
                                 className={`w-9 h-9 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-xs transition-all border
                                   ${isCorrect ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20' : 'bg-white/5 text-gray-light/40 border-white/10 group-hover:border-white/20'}`}
                               >
                                 {isCorrect ? <Icon name="check" /> : String.fromCharCode(65 + oIndex)}
                               </button>
                               
                               <Input
                                 type="text"
                                 readOnly={isTrueFalse}
                                 className={`flex-1 bg-transparent border-none p-0 font-bold text-white shadow-none focus:ring-0 placeholder:text-gray-light/5 ${isTrueFalse ? 'cursor-pointer' : ''}`}
                                 value={option}
                                 onChange={(e) => {
                                   e.stopPropagation();
                                   handleOptionChange(oIndex, e.target.value);
                                 }}
                                 onClick={(e) => e.stopPropagation()}
                                 placeholder={`الخيار ${String.fromCharCode(65 + oIndex)}`}
                               />
                               
                               {isCorrect && (
                                 <div className="absolute -top-2 -left-2 px-3 py-1 rounded-full bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest shadow-lg">
                                    صحيحة
                                 </div>
                               )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {questions[currentQuestionIndex].type === 'ordering' && (
                      <div className="space-y-3">
                        {questions[currentQuestionIndex].options.map((option: string, oIndex: number) => (
                          <div key={oIndex} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 border border-white/5 rounded-xl sm:rounded-2xl">
                             <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs border border-primary/20">
                               {oIndex + 1}
                             </div>
                             <Input
                               type="text"
                               className="flex-1 bg-transparent border-none p-0 font-bold text-white shadow-none focus:ring-0 placeholder:text-gray-light/5"
                               value={option}
                               onChange={(e) => {
                                 const val = e.target.value;
                                 setQuestions(prev => {
                                   const newQuestions = [...prev];
                                   const newOptions = [...newQuestions[currentQuestionIndex].options];
                                   newOptions[oIndex] = val;
                                   newQuestions[currentQuestionIndex] = {
                                     ...newQuestions[currentQuestionIndex],
                                     options: newOptions,
                                     correct_answer: newOptions.join('|||')
                                   };
                                   return newQuestions;
                                 });
                               }}
                               placeholder={`العنصر رقم ${oIndex + 1}`}
                             />
                             {questions[currentQuestionIndex].options.length > 2 && (
                               <button 
                                 type="button"
                                 onClick={() => {
                                   const newOptions = questions[currentQuestionIndex].options.filter((_: any, i: number) => i !== oIndex);
                                   handleQuestionChange('options', newOptions);
                                   handleQuestionChange('correct_answer', newOptions.join('|||'));
                                 }}
                                 className="w-9 h-9 rounded-xl flex items-center justify-center text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                               >
                                 <Icon name="trash" />
                               </button>
                             )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            const newOptions = [...questions[currentQuestionIndex].options, ''];
                            handleQuestionChange('options', newOptions);
                          }}
                          className="w-full h-12 rounded-2xl border-dashed border-2 border-white/5 text-gray-light/40 font-bold hover:bg-white/5"
                        >
                          <Icon name="plus" className="ml-2" />
                          إضافة عنصر جديد
                        </Button>
                      </div>
                    )}

                    {questions[currentQuestionIndex].type === 'matching' && (
                      <div className="space-y-4">
                         <div className="hidden sm:grid grid-cols-2 gap-4 px-4 text-[10px] font-black text-gray-light/20 uppercase tracking-widest">
                            <div>العمود الأول (أ)</div>
                            <div>العمود الثاني (ب) - المقابل له</div>
                         </div>
                        {questions[currentQuestionIndex].options.map((pair: {a: string, b: string}, oIndex: number) => (
                          <div key={oIndex} className="flex items-center gap-4">
                             <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
                               <Input
                                 type="text"
                                 className="bg-transparent border-none p-0 font-bold text-white shadow-none focus:ring-0 placeholder:text-gray-light/5 border-b border-white/10 sm:border-b-0 sm:border-l rounded-none pb-2 sm:pb-0"
                                 value={pair.a}
                                 onChange={(e) => {
                                   const val = e.target.value;
                                   setQuestions(prev => {
                                     const newQuestions = [...prev];
                                     const newOptions = [...newQuestions[currentQuestionIndex].options];
                                     newOptions[oIndex] = { ...newOptions[oIndex], a: val };
                                     newQuestions[currentQuestionIndex] = {
                                       ...newQuestions[currentQuestionIndex],
                                       options: newOptions,
                                       correct_answer: newOptions.map((p: any) => `${p.a}===${p.b}`).join('|||')
                                     };
                                     return newQuestions;
                                   });
                                 }}
                                 placeholder="العنصر أ"
                                 />
                                 <Input
                                 type="text"
                                 className="bg-transparent border-none p-0 font-bold text-white shadow-none focus:ring-0 placeholder:text-gray-light/5 pt-2 sm:pt-0"
                                 value={pair.b}
                                 onChange={(e) => {
                                   const val = e.target.value;
                                   setQuestions(prev => {
                                     const newQuestions = [...prev];
                                     const newOptions = [...newQuestions[currentQuestionIndex].options];
                                     newOptions[oIndex] = { ...newOptions[oIndex], b: val };
                                     newQuestions[currentQuestionIndex] = {
                                       ...newQuestions[currentQuestionIndex],
                                       options: newOptions,
                                       correct_answer: newOptions.map((p: any) => `${p.a}===${p.b}`).join('|||')
                                     };
                                     return newQuestions;
                                   });
                                 }}
                                 placeholder="العنصر ب المقابل"
                                 />                             </div>
                             {questions[currentQuestionIndex].options.length > 2 && (
                               <button 
                                 type="button"
                                 onClick={() => {
                                   const newOptions = questions[currentQuestionIndex].options.filter((_: any, i: number) => i !== oIndex);
                                   handleQuestionChange('options', newOptions);
                                   handleQuestionChange('correct_answer', newOptions.map(p => `${p.a}===${p.b}`).join('|||'));
                                 }}
                                 className="w-9 h-9 rounded-xl flex items-center justify-center text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0 self-center"
                               >
                                 <Icon name="trash" />
                               </button>
                             )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            const newOptions = [...questions[currentQuestionIndex].options, { a: '', b: '' }];
                            handleQuestionChange('options', newOptions);
                          }}
                          className="w-full h-12 rounded-2xl border-dashed border-2 border-white/5 text-gray-light/40 font-bold hover:bg-white/5"
                        >
                          <Icon name="plus" className="ml-2" />
                          إضافة زوج توصيل جديد
                        </Button>
                      </div>
                    )}
                  </div>
               </div>
 
                <div className="pt-6 sm:pt-10 border-t border-white/5 flex flex-col xl:flex-row justify-between gap-4 sm:gap-6 mt-4 sm:mt-8">
                   {/* Left Side: Meta Actions (Settings, Preview) */}
                   <div className="grid grid-cols-2 gap-3 w-full xl:w-auto">
                     <Button
                       type="button"
                       onClick={() => setShowPreviewModal(true)}
                       variant="ghost"
                       className="h-12 sm:h-14 px-3 sm:px-6 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 font-bold gap-2 hover:bg-white/10 justify-center text-xs sm:text-sm"
                     >
                       <Icon name="sort" />
                       <span>معاينة وترتيب</span>
                     </Button>
                     <Button
                       type="button"
                       onClick={() => setStep('details')}
                       variant="ghost"
                       className="h-12 sm:h-14 px-3 sm:px-6 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 font-bold gap-2 hover:bg-white/10 justify-center text-xs sm:text-sm"
                     >
                       <Icon name="cog" />
                       <span>الإعدادات</span>
                     </Button>
                   </div>
  
                   {/* Right Side: Navigation & Publish Actions */}
                   <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
                     <div className={`${currentQuestionIndex > 0 ? 'grid grid-cols-2' : 'flex'} gap-3 w-full sm:w-auto`}>
                       {currentQuestionIndex > 0 && (
                         <Button
                           type="button"
                           onClick={handlePrevQuestion}
                           variant="ghost"
                           className="h-12 sm:h-14 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-bold text-gray-light justify-center border border-white/5 bg-white/5 text-xs sm:text-sm"
                         >
                           <Icon name="arrow-right" className="ml-1" />
                           <span>السابق</span>
                         </Button>
                       )}
                       
                       <Button
                         type="button"
                         onClick={handleNextQuestion}
                         variant="secondary"
                         className="flex-1 sm:flex-initial h-12 sm:h-14 px-4 sm:px-8 rounded-xl sm:rounded-2xl font-bold gap-2 justify-center text-xs sm:text-sm"
                       >
                         <span>سؤال جديد</span>
                         <Icon name="plus" />
                       </Button>
                     </div>
  
                     <Button
                       type="button"
                       onClick={handleSubmit}
                       variant="primary"
                       className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-12 rounded-xl sm:rounded-2xl font-black gap-2 shadow-xl shadow-primary/20 justify-center text-xs sm:text-sm mt-1 sm:mt-0"
                       disabled={loading}
                     >
                       <span>حفظ ونشر</span>
                       <Icon name="check-double" />
                     </Button>
                   </div>
                </div>
            </div>
          </div>
        )}
      </div>

      {/* Finish Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-[480px] bg-black/95 dark:bg-[#0b0f19]/95 border border-white/10 rounded-[2.5rem] shadow-2xl dark:shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-300 relative">
            
            {/* Ambient Background Glows */}
            <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-primary/15 blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-purple-500/10 blur-[80px] pointer-events-none" />

            {/* Header */}
            <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between relative z-10 animate-in slide-in-from-top duration-300">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">نشر الامتحان</span>
                <h3 className="text-lg font-black text-white">إعدادات النشر النهائية</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFinishModal(false)}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-light/50 hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all duration-300"
              >
                <Icon name="times" size="sm" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleFinalSubmit(); }} className="relative z-10">
              {/* Body */}
              <div className="p-6 space-y-6">
                
                {/* Mode Selector (Segmented Control) */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-light/35 uppercase tracking-widest px-2">طريقة توزيع الأسئلة</label>
                  <div className="grid grid-cols-2 gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
                    <button
                      type="button"
                      onClick={() => setActualQuestionCount(questions.length)}
                      className={`h-11 rounded-xl font-bold text-xs transition-all duration-300 ${
                        actualQuestionCount === questions.length
                          ? 'bg-primary text-white shadow-lg'
                          : 'text-gray-light/40 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      كامل بنك الأسئلة ({questions.length})
                    </button>
                    <button
                      type="button"
                      disabled={questions.length <= 1}
                      onClick={() => setActualQuestionCount(Math.max(1, questions.length - 1))}
                      className={`h-11 rounded-xl font-bold text-xs transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none ${
                        actualQuestionCount < questions.length
                          ? 'bg-primary text-white shadow-lg'
                          : 'text-gray-light/40 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      العشوائية الذكية 🪄
                    </button>
                  </div>
                </div>

                {/* Smart Randomization Section */}
                <div className={`space-y-6 transition-all duration-500 overflow-hidden ${
                  actualQuestionCount < questions.length ? 'opacity-100 scale-100 h-auto' : 'opacity-30 pointer-events-none'
                }`}>
                  {/* Magic Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-all duration-500" />
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        <Icon name="magic" size="lg" className="animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-white">العشوائية الذكية مفعّلة</h4>
                          <span className="text-[8px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">توزيع ذكي</span>
                        </div>
                        <p className="text-[11px] font-bold text-gray-light/40 leading-relaxed">
                          سيتم سحب عدد عشوائي من الأسئلة لكل طالب من بنك الأسئلة بالكامل ({questions.length} أسئلة)، مما يضمن عدم تطابق نماذج الطلاب لمنع الغش تماماً!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Selector Slider & Counter */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-gray-light/35 uppercase tracking-widest">عدد الأسئلة المخصصة لكل طالب</label>
                      <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        {actualQuestionCount} من أصل {questions.length}
                      </span>
                    </div>

                    {/* Numeric Selector with + and - buttons */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setActualQuestionCount(Math.max(1, actualQuestionCount - 1))}
                        disabled={actualQuestionCount <= 1 || actualQuestionCount === questions.length}
                        className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-theme-secondary hover:text-theme-primary hover:bg-white/10 hover:border-white/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200"
                      >
                        <Icon name="minus" />
                      </button>

                      <div className="flex-1 relative">
                        <input
                          type="number"
                          value={actualQuestionCount}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) {
                              setActualQuestionCount(Math.min(questions.length, Math.max(1, val)));
                            }
                          }}
                          disabled={actualQuestionCount === questions.length}
                          min="1"
                          max={questions.length}
                          className="w-full h-14 bg-white/5 border-white/5 rounded-2xl px-5 font-black text-2xl text-center text-primary focus:bg-white/10 focus:border-primary/30 transition-all disabled:opacity-55"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-light/25 tracking-wider">سؤال</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActualQuestionCount(Math.min(questions.length - 1, actualQuestionCount + 1))}
                        disabled={actualQuestionCount >= questions.length - 1 || actualQuestionCount === questions.length}
                        className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-theme-secondary hover:text-theme-primary hover:bg-white/10 hover:border-white/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200"
                      >
                        <Icon name="plus" />
                      </button>
                    </div>

                    {/* Custom HTML5 Range Slider */}
                    {actualQuestionCount < questions.length && (
                      <div className="pt-2 px-1">
                        <input
                          type="range"
                          min="1"
                          max={questions.length - 1}
                          value={actualQuestionCount}
                          onChange={(e) => setActualQuestionCount(parseInt(e.target.value))}
                          className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-primary border border-white/5"
                        />
                        <div className="flex justify-between text-[9px] font-bold text-gray-light/20 mt-1">
                          <span>1 سؤال</span>
                          <span>{questions.length - 1} سؤال</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Total Stats Details */}
                <div className="grid grid-cols-3 gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="text-center space-y-1">
                    <p className="text-[8px] font-black text-gray-light/35 uppercase tracking-widest leading-none">بنك الأسئلة</p>
                    <p className="text-base font-black text-white">{questions.length}</p>
                  </div>
                  <div className="text-center space-y-1 border-x border-white/5">
                    <p className="text-[8px] font-black text-gray-light/35 uppercase tracking-widest leading-none">سيظهر للطالب</p>
                    <p className="text-base font-black text-primary">{actualQuestionCount}</p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-[8px] font-black text-gray-light/35 uppercase tracking-widest leading-none">العشوائية</p>
                    <p className="text-base font-black text-emerald-400">
                      {actualQuestionCount === questions.length ? 'إيقاف' : 'نشط 🪄'}
                    </p>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="p-6 bg-black/40 border-t border-white/5 flex flex-col gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-14 rounded-2xl font-black gap-2 shadow-[0_0_35px_rgba(66,99,235,0.35)] justify-center text-sm"
                  loading={loading}
                >
                  <span>تأكيد ونشر الامتحان</span>
                  <Icon name="paper-plane" />
                </Button>
                
                <button
                  type="button"
                  onClick={() => setShowFinishModal(false)}
                  className="w-full h-12 rounded-xl font-bold text-xs text-gray-light/40 hover:text-theme-primary hover:bg-white/5 transition-all duration-300"
                >
                  رجوع للتعديل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview & Reorder Modal */}
      <FormModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onSubmit={(e) => { e.preventDefault(); setShowPreviewModal(false); }}
        title="ترتيب وهيكلة الأسئلة"
        submitText="حفظ الترتيب الجديد"
        maxWidth="800px"
      >
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-3">
             <Icon name="info-circle" className="text-primary" />
             <p className="text-[11px] font-bold text-gray-light/40">اسحب الأسئلة لتغيير ترتيب ظهورها أو احذف الأسئلة غير المرغوب فيها.</p>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={questions.map(q => q.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
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
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </FormModal>
    </DashboardLayout>
  );
}
