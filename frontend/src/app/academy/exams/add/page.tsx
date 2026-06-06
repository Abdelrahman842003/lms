'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { createAcademyExam, getExamTeachers, getGrades, getGroups } from '@/services/academyService';
import { toast } from 'react-hot-toast';
import { Filter } from '@/components/Filter';
import { Button, Icon, Input, FormModal } from '@/components/ui';

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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="p-3 mb-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3 cursor-move touch-none hover:bg-white/10 transition-colors">
      <Icon name="grip-vertical" className="text-gray-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{props.text || 'سؤال جديد'}</p>
        <span className="text-xs text-gray-light/45">{props.duration} ثانية</span>
      </div>
      <button
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          props.onRemove();
        }}
        className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
        onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
      >
        <Icon name="trash" />
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
        setSubject('');
        return;
      }

      // Auto-populate teacher's subject if available
      const selectedTeacher = teachers.find(t => String(t.id) === String(teacherId));
      if (selectedTeacher && selectedTeacher.subject) {
        setSubject(selectedTeacher.subject);
      }
      
      try {
        const gradesData = await getGrades(1, 100, { teacher_id: teacherId });
        let gradesList = [];
        if (gradesData?.data?.data && Array.isArray(gradesData.data.data)) {
          gradesList = gradesData.data.data;
        } else if (gradesData?.data && Array.isArray(gradesData.data)) {
          gradesList = gradesData.data;
        } else if (Array.isArray(gradesData)) {
          gradesList = gradesData;
        }
        setGrades(gradesList);
      } catch (error) {
        console.error('Error fetching grades:', error);
        toast.error('حدث خطأ أثناء تحميل الصفوف الدراسية');
      }
    };
    
    fetchGrades();
    setGradeId(''); // Reset grade when teacher changes
  }, [teacherId, teachers]);

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
        let groupsList = [];
        if (groupsData?.data?.data && Array.isArray(groupsData.data.data)) {
          groupsList = groupsData.data.data;
        } else if (groupsData?.data && Array.isArray(groupsData.data)) {
          groupsList = groupsData.data;
        } else if (Array.isArray(groupsData)) {
          groupsList = groupsData;
        }
        setGroups(groupsList);
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
      const response = await createAcademyExam({
        teacher_id: teacherId,
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
    }
  };

  const handleQuestionChange = (field: keyof Question, value: any) => {
    setQuestions(prev => {
      const newQuestions = [...prev];
      
      if (field === 'type') {
        let options: any[] = [];
        if (value === 'mcq') options = ['', '', '', ''];
        else if (value === 'true_false') options = ['صح', 'خطأ'];
        else if (value === 'ordering') options = ['', ''];
        else if (value === 'matching') options = [{ a: '', b: '' }, { a: '', b: '' }];

        newQuestions[currentQuestionIndex] = { 
          ...newQuestions[currentQuestionIndex], 
          [field]: value,
          options,
          correct_answer: ''
        };
      } else {
        newQuestions[currentQuestionIndex] = { ...newQuestions[currentQuestionIndex], [field]: value };
      }
      
      return newQuestions;
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
      toast.error('يرجى إكمال السؤال الحالي قبل الانتقال أو إضافة سؤال آخر');
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

  const handleSubmit = () => {
    // Validate current question before finishing
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ.text || currentQ.options.some(o => !o) || !currentQ.correct_answer) {
      toast.error('يرجى إكمال السؤال الحالي أولاً');
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
        type: 'manual',
        questions: questions.map(q => ({
          ...q,
          difficulty: q.difficulty || 'medium'
        }))
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
      {/* Step Indicator Header */}
      <div className="mb-6 premium-glass premium-border rounded-2xl p-4 flex items-center justify-center gap-3 md:gap-6 shadow-xl">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
            step === 'details'
              ? 'bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg shadow-primary/20 scale-105'
              : 'bg-green-500/20 text-green-400 border border-green-500/30'
          }`}>
            {step !== 'details' ? <Icon name="check" size="xs" /> : '١'}
          </div>
          <span className={`text-xs md:text-sm font-black transition-all ${step === 'details' ? 'text-white' : 'text-white/40'}`}>
            بيانات الامتحان
          </span>
        </div>
        
        <div className="w-12 md:w-20 h-0.5 bg-white/5 rounded-full overflow-hidden">
          <div className={`h-full bg-gradient-to-r from-primary to-purple-600 transition-all duration-500 ${
            step === 'questions' ? 'w-full' : 'w-0'
          }`} />
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
            step === 'questions'
              ? 'bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg shadow-primary/20 scale-105'
              : 'bg-white/5 text-white/20 border border-white/5'
          }`}>
            '٢'
          </div>
          <span className={`text-xs md:text-sm font-black transition-all ${step === 'questions' ? 'text-white' : 'text-white/20'}`}>
            الأسئلة والخيارات
          </span>
        </div>
      </div>

      <DashboardCard
        title={step === 'details' ? 'إدخال تفاصيل الامتحان' : 'محرر الأسئلة'}
        className="rounded-2xl shadow-2xl border border-white/5"
        noPadding
        action={step === 'questions' ? (
          <div className="text-xs font-black bg-primary/10 text-primary-light px-3 py-1.5 rounded-xl border border-primary/10 flex items-center gap-1.5 shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            السؤال {currentQuestionIndex + 1} من {questions.length}
          </div>
        ) : undefined}
      >
        <div className="p-4 md:p-6 lg:p-8">
          {step === 'details' ? (
            <form onSubmit={handleStartQuestions}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
                {/* Teacher Selection - Required for Academy */}
                <div className="form-group md:col-span-2">
                  <label className="block text-sm font-bold text-white mb-2">المدرس <span className="text-red-500">*</span></label>
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
                  <label className="block text-sm font-bold text-white mb-2">عنوان الامتحان <span className="text-red-500">*</span></label>
                  <Input
                    type="text"
                    className={formErrors.title ? 'border-red-500' : ''}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="امتحان شهر نوفمبر، الباب الأول..."
                  />
                  {formErrors.title && <span className="text-red-500 text-xs mt-1 block"><Icon name="exclamation-circle" className="ml-1 inline" />{formErrors.title}</span>}
                </div>

                <div className="form-group">
                  <label className="block text-sm font-bold text-white mb-2">المادة <span className="text-red-500">*</span></label>
                  <Input
                    type="text"
                    className={formErrors.subject ? 'border-red-500' : ''}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="الرياضيات، الفيزياء..."
                  />
                  {formErrors.subject && <span className="text-red-500 text-xs mt-1 block"><Icon name="exclamation-circle" className="ml-1 inline" />{formErrors.subject}</span>}
                </div>

                <div className="form-group">
                  <label className="block text-sm font-bold text-white mb-2">الصف الدراسي <span className="text-red-500">*</span></label>
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
                  <label className="block text-sm font-bold text-white mb-2">المجموعة (اختياري)</label>
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

                <div className="form-group md:col-span-2 space-y-4">
                  <label className="block text-sm font-bold text-white mb-2">مصدر ونوع الأسئلة</label>
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
                      <p className="text-[11px] text-white/50 leading-relaxed font-bold">
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
                      <p className="text-[11px] text-white/50 leading-relaxed font-bold">
                        حدد عدد الأسئلة المطلوبة من كل مستوى صعوبة، وسيقوم النظام بتوليد الامتحان تلقائياً من البنك.
                      </p>
                    </div>
                  </div>
                </div>

                {/* If From Question Bank (dynamic) */}
                {questionSource === 'dynamic' && (
                  <div className="form-group md:col-span-2 p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="cog" className="text-primary text-xs" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">تحديد أعداد وصعوبة الأسئلة</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest text-center">عدد الأسئلة السهلة</label>
                        <Input
                          type="number"
                          className="h-12 bg-white/5 border-white/5 rounded-xl px-4 font-bold text-center"
                          value={easyCount || ''}
                          onChange={(e) => setEasyCount(e.target.value === '' ? 0 : parseInt(e.target.value))}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest text-center">عدد الأسئلة المتوسطة</label>
                        <Input
                          type="number"
                          className="h-12 bg-white/5 border-white/5 rounded-xl px-4 font-bold text-center"
                          value={mediumCount || ''}
                          onChange={(e) => setMediumCount(e.target.value === '' ? 0 : parseInt(e.target.value))}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest text-center">عدد الأسئلة الصعبة</label>
                        <Input
                          type="number"
                          className="h-12 bg-white/5 border-white/5 rounded-xl px-4 font-bold text-center"
                          value={hardCount || ''}
                          onChange={(e) => setHardCount(e.target.value === '' ? 0 : parseInt(e.target.value))}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="pt-2 text-center">
                      <span className="text-xs font-bold text-white/40">
                        إجمالي الأسئلة في الامتحان: <strong className="text-primary font-black text-sm">{easyCount + mediumCount + hardCount}</strong> سؤال
                      </span>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="block text-sm font-bold text-white mb-2">تاريخ الامتحان <span className="text-red-500">*</span></label>
                  <Input
                    type="datetime-local"
                    className={formErrors.date ? 'border-red-500 animate-pulse' : ''}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                  {formErrors.date && <span className="text-red-500 text-xs mt-1 block"><Icon name="exclamation-circle" className="ml-1 inline" />{formErrors.date}</span>}
                </div>

                <div className="form-group">
                  <label className="block text-sm font-bold text-white mb-2">المدة (دقيقة) <span className="text-red-500">*</span></label>
                  <Input
                    type="number"
                    className={formErrors.duration ? 'border-red-500' : ''}
                    value={duration || ''}
                    onChange={(e) => setDuration(e.target.value === '' ? 0 : parseInt(e.target.value))}
                    placeholder="60"
                  />
                  {formErrors.duration && <span className="text-red-500 text-xs mt-1 block"><Icon name="exclamation-circle" className="ml-1 inline" />{formErrors.duration}</span>}
                </div>

                <div className="form-group">
                  <label className="block text-sm font-bold text-white mb-2">الدرجة الكلية <span className="text-red-500">*</span></label>
                  <Input
                    type="number"
                    className={formErrors.totalMarks ? 'border-red-500' : ''}
                    value={totalMarks || ''}
                    onChange={(e) => setTotalMarks(e.target.value === '' ? 0 : parseInt(e.target.value))}
                    placeholder="100"
                  />
                  {formErrors.totalMarks && <span className="text-red-500 text-xs mt-1 block"><Icon name="exclamation-circle" className="ml-1 inline" />{formErrors.totalMarks}</span>}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 mt-8 pt-6 border-t border-white/5">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push('/academy/exams')}
                  className="px-8 py-3 text-base w-full sm:w-auto justify-center"
                >
                  <Icon name="arrow-right" className="ml-2" />
                  رجوع لقائمة الامتحانات
                </Button>

                <Button type="submit" variant="primary" className="px-8 py-3 text-base w-full sm:w-auto justify-center bg-gradient-to-r from-primary to-purple-600">
                  {questionSource === 'dynamic' ? 'حفظ ونشر الامتحان' : 'التالي: إضافة الأسئلة'}
                  <Icon name={questionSource === 'dynamic' ? 'check' : 'arrow-left'} className={questionSource === 'dynamic' ? 'mr-2' : 'mr-2'} />
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Question Navigation Bubbles */}
              <div className="flex flex-col gap-2 p-4 bg-white/5 border border-white/5 rounded-2xl shadow-inner">
                <label className="text-xs text-white/50 font-black tracking-widest uppercase">الأسئلة المُضافة ({questions.length})</label>
                <div className="flex flex-wrap items-center gap-2 max-h-[140px] overflow-y-auto custom-scrollbar pt-1 pr-1">
                  {questions.map((q, idx) => {
                    const isActive = idx === currentQuestionIndex;
                    const isCompleted = q.text && q.options.every(o => (typeof o === 'object' ? (o.a && o.b) : o)) && q.correct_answer;
                    
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => {
                          // Validate current question before navigating
                          const currentQ = questions[currentQuestionIndex];
                          if (!currentQ.text || currentQ.options.some(o => (typeof o === 'object' ? (!o.a || !o.b) : !o)) || !currentQ.correct_answer) {
                            toast.error(`يرجى إكمال السؤال الحالي قبل الانتقال`);
                            return;
                          }
                          setCurrentQuestionIndex(idx);
                        }}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black transition-all duration-300 ${
                          isActive
                            ? 'bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg shadow-primary/30 scale-110 ring-2 ring-primary/40'
                            : isCompleted
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                            : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                  
                  {/* Append new question directly from bubbles list */}
                  <button
                    type="button"
                    onClick={() => {
                      const currentQ = questions[currentQuestionIndex];
                      if (!currentQ.text || currentQ.options.some(o => (typeof o === 'object' ? (!o.a || !o.b) : !o)) || !currentQ.correct_answer) {
                        toast.error('يرجى إكمال السؤال الحالي أولاً');
                        return;
                      }
                      const newId = crypto.randomUUID();
                      setQuestions([...questions, {
                        id: newId,
                        text: '',
                        type: 'mcq',
                        options: ['', '', '', ''],
                        correct_answer: '',
                        duration: 60
                      }]);
                      setCurrentQuestionIndex(questions.length);
                    }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:scale-105 transition-all"
                    title="سؤال جديد"
                  >
                    <Icon name="plus" size="xs" />
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="space-y-6">
                
                {/* Question Type and Duration Row */}
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
                    <label className="block text-sm font-bold text-white shrink-0">نوع السؤال:</label>
                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleQuestionChange('type', 'mcq')}
                        className={`px-3 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                          questions[currentQuestionIndex].type === 'mcq'
                            ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-md'
                            : 'text-white/50 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon name="list-ul" size="sm" />
                        <span>اختياري</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuestionChange('type', 'true_false')}
                        className={`px-3 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                          questions[currentQuestionIndex].type === 'true_false'
                            ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-md'
                            : 'text-white/50 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon name="check-double" size="sm" />
                        <span>صح وخطأ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuestionChange('type', 'ordering')}
                        className={`px-3 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                          questions[currentQuestionIndex].type === 'ordering'
                            ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-md'
                            : 'text-white/50 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon name="sort-amount-down" size="sm" />
                        <span>ترتيب</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuestionChange('type', 'matching')}
                        className={`px-3 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                          questions[currentQuestionIndex].type === 'matching'
                            ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-md'
                            : 'text-white/50 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon name="arrows-alt-h" size="sm" />
                        <span>توصيل</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-white/5 border border-white/5 px-4 py-2 rounded-xl w-full lg:w-auto justify-between lg:justify-start">
                    <label className="text-xs text-gray-light/45 font-black shrink-0">مدة السؤال (ثانية):</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        className="w-16 text-center py-1 px-1 bg-transparent border-none text-white font-black text-sm focus:ring-0"
                        value={questions[currentQuestionIndex].duration || 60}
                        onChange={(e) => handleQuestionChange('duration', parseInt(e.target.value) || 0)}
                        min="10"
                        max="600"
                      />
                      <span className="text-xs text-white/35">ثانية</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-white/5 border border-white/5 p-1 rounded-xl whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleQuestionChange('difficulty', 'easy')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${questions[currentQuestionIndex].difficulty === 'easy' ? 'bg-emerald-600 text-white shadow-md' : 'text-white/50 hover:text-white'}`}
                    >
                      سهل
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuestionChange('difficulty', 'medium')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${!questions[currentQuestionIndex].difficulty || questions[currentQuestionIndex].difficulty === 'medium' ? 'bg-amber-600 text-white shadow-md' : 'text-white/50 hover:text-white'}`}
                    >
                      متوسط
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuestionChange('difficulty', 'hard')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${questions[currentQuestionIndex].difficulty === 'hard' ? 'bg-rose-600 text-white shadow-md' : 'text-white/50 hover:text-white'}`}
                    >
                      صعب
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <div className="form-group">
                  <label className="block text-sm font-bold text-white mb-2">نص السؤال</label>
                  <textarea
                    value={questions[currentQuestionIndex].text}
                    onChange={(e) => handleQuestionChange('text', e.target.value)}
                    required
                    placeholder="اكتب تفاصيل السؤال هنا بوضوح..."
                    rows={3}
                    className="w-full form-input bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-white/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all text-base resize-none"
                    autoFocus
                  />
                </div>

                {/* Answer Options Section */}
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-white mb-2">
                    {questions[currentQuestionIndex].type === 'true_false' ? 'حدد الإجابة الصحيحة:' : 
                     questions[currentQuestionIndex].type === 'ordering' ? 'اكتب العناصر بالترتيب الصحيح (سيقوم النظام بلخبطتها تلقائياً):' :
                     questions[currentQuestionIndex].type === 'matching' ? 'أضف أزواج التوصيل المتطابقة (سيقوم النظام بلخبطتها تلقائياً):' :
                     'الخيارات (اكتب الخيارات واضغط على الدائرة لتحديد الإجابة الصحيحة):'}
                  </label>

                  {/* MCQ & True False Options */}
                  {(questions[currentQuestionIndex].type === 'mcq' || questions[currentQuestionIndex].type === 'true_false') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {questions[currentQuestionIndex].options.map((option: string, oIndex: number) => {
                        const isTrueFalse = questions[currentQuestionIndex].type === 'true_false';
                        const isSelected = questions[currentQuestionIndex].correct_answer === option && option !== '';
                        
                        return (
                          <div 
                            key={oIndex} 
                            className={`flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 border cursor-pointer select-none ${
                              isSelected
                                ? 'bg-gradient-to-r from-primary/10 to-purple-600/10 border-primary/50 shadow-lg'
                                : 'bg-white/5 border-white/10 hover:border-white/20'
                            }`}
                            onClick={() => {
                              if (option) {
                                handleQuestionChange('correct_answer', option);
                              } else {
                                toast.error('يرجى كتابة الخيار أولاً قبل اختياره كإجابة صحيحة');
                              }
                            }}
                          >
                            <div className="relative flex items-center justify-center shrink-0">
                              <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                                isSelected
                                  ? 'bg-gradient-to-r from-primary to-purple-600 border-transparent shadow-[0_0_10px_rgba(100,116,139,0.3)]'
                                  : 'border-white/20 hover:border-white/40'
                              }`}>
                                {isSelected && (
                                  <Icon name="check" className="text-white text-xs font-black" />
                                )}
                              </div>
                            </div>
                            <input
                              type="text"
                              readOnly={isTrueFalse}
                              className={`flex-1 bg-transparent border-none p-0 text-white placeholder-white/30 focus:ring-0 text-sm font-bold ${
                                isTrueFalse ? 'cursor-pointer' : ''
                              }`}
                              value={option}
                              onChange={(e) => handleOptionChange(oIndex, e.target.value)}
                              onClick={(e) => {
                                if (!isTrueFalse) {
                                  e.stopPropagation(); // Stop click propagating to option wrapper
                                }
                              }}
                              required
                              placeholder={isTrueFalse ? 'إجابة صح/خطأ' : `الخيار ${oIndex + 1}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Ordering Options */}
                  {questions[currentQuestionIndex].type === 'ordering' && (
                    <div className="space-y-3">
                      {questions[currentQuestionIndex].options.map((option: string, oIndex: number) => (
                        <div key={oIndex} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-all">
                           <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md">
                             {oIndex + 1}
                           </div>
                           <input
                             type="text"
                             className="flex-1 bg-transparent border-none p-0 font-bold text-white placeholder-white/30 focus:ring-0 text-sm"
                             value={option}
                             onChange={(e) => {
                               const val = e.target.value;
                               setQuestions(prev => {
                                 const newOptions = [...prev[currentQuestionIndex].options];
                                 newOptions[oIndex] = val;
                                 const updatedQuestions = [...prev];
                                 updatedQuestions[currentQuestionIndex] = {
                                   ...updatedQuestions[currentQuestionIndex],
                                   options: newOptions,
                                   correct_answer: newOptions.join('|||')
                                 };
                                 return updatedQuestions;
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
                               className="w-9 h-9 rounded-xl flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all shrink-0"
                             >
                               <Icon name="trash" size="sm" />
                             </button>
                           )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          const newOptions = [...questions[currentQuestionIndex].options, ''];
                          handleQuestionChange('options', newOptions);
                        }}
                        className="w-full h-12 border-dashed border-2 bg-transparent hover:bg-white/5 rounded-2xl text-white/80 hover:text-white justify-center"
                      >
                        <Icon name="plus" className="ml-2" />
                        إضافة عنصر جديد
                      </Button>
                    </div>
                  )}

                  {/* Matching Options - Fully Responsive Stacking */}
                  {questions[currentQuestionIndex].type === 'matching' && (
                    <div className="space-y-4">
                      {questions[currentQuestionIndex].options.map((pair: {a: string, b: string}, oIndex: number) => (
                        <div key={oIndex} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-all">
                           <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                             <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                               <span className="text-xs font-black text-primary shrink-0 bg-primary/10 w-6 h-6 rounded-lg flex items-center justify-center">أ</span>
                               <input
                                 type="text"
                                 className="w-full bg-transparent border-none p-0 text-sm font-bold text-white placeholder-white/30 focus:ring-0"
                                 value={pair.a}
                                 onChange={(e) => {
                                   const val = e.target.value;
                                   setQuestions(prev => {
                                     const newOptions = [...prev[currentQuestionIndex].options];
                                     newOptions[oIndex] = { ...newOptions[oIndex], a: val };
                                     const updatedQuestions = [...prev];
                                     updatedQuestions[currentQuestionIndex] = {
                                       ...updatedQuestions[currentQuestionIndex],
                                       options: newOptions,
                                       correct_answer: newOptions.map((p: any) => `${p.a}===${p.b}`).join('|||')
                                     };
                                     return updatedQuestions;
                                   });
                                 }}
                                 placeholder="العنصر أ"
                               />
                             </div>
                             <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                               <span className="text-xs font-black text-purple-400 shrink-0 bg-purple-500/10 w-6 h-6 rounded-lg flex items-center justify-center">ب</span>
                               <input
                                 type="text"
                                 className="w-full bg-transparent border-none p-0 text-sm font-bold text-white placeholder-white/30 focus:ring-0"
                                 value={pair.b}
                                 onChange={(e) => {
                                   const val = e.target.value;
                                   setQuestions(prev => {
                                     const newOptions = [...prev[currentQuestionIndex].options];
                                     newOptions[oIndex] = { ...newOptions[oIndex], b: val };
                                     const updatedQuestions = [...prev];
                                     updatedQuestions[currentQuestionIndex] = {
                                       ...updatedQuestions[currentQuestionIndex],
                                       options: newOptions,
                                       correct_answer: newOptions.map((p: any) => `${p.a}===${p.b}`).join('|||')
                                     };
                                     return updatedQuestions;
                                   });
                                 }}
                                 placeholder="العنصر ب المقابل"
                               />
                             </div>
                           </div>
                           {questions[currentQuestionIndex].options.length > 2 && (
                             <button 
                               type="button"
                               onClick={() => {
                                 const newOptions = questions[currentQuestionIndex].options.filter((_: any, i: number) => i !== oIndex);
                                 handleQuestionChange('options', newOptions);
                                 handleQuestionChange('correct_answer', newOptions.map(p => `${p.a}===${p.b}`).join('|||'));
                               }}
                               className="w-10 h-10 rounded-xl flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all shrink-0 self-end sm:self-center"
                             >
                               <Icon name="trash" size="sm" />
                             </button>
                           )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          const newOptions = [...questions[currentQuestionIndex].options, { a: '', b: '' }];
                          handleQuestionChange('options', newOptions);
                        }}
                        className="w-full h-12 border-dashed border-2 bg-transparent hover:bg-white/5 rounded-2xl text-white/80 hover:text-white justify-center"
                      >
                        <Icon name="plus" className="ml-2" />
                        إضافة زوج توصيل جديد
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Action Pagination Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-10 pt-6 border-t border-white/5">
                
                {/* Left Side: Back / Prev Question */}
                <div className="w-full md:w-auto">
                  {currentQuestionIndex > 0 ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                      className="px-6 py-2.5 w-full md:w-auto justify-center"
                    >
                      <Icon name="arrow-right" className="ml-2" />
                      السؤال السابق
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setStep('details')}
                      className="px-6 py-2.5 w-full md:w-auto justify-center"
                    >
                      <Icon name="cog" className="ml-2" />
                      تعديل البيانات الأساسية
                    </Button>
                  )}
                </div>

                {/* Center Side: Preview */}
                <div className="w-full md:w-auto flex justify-center">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowPreviewModal(true)}
                    className="px-6 py-2.5 w-full md:w-auto justify-center border-dashed"
                  >
                    معاينة وترتيب الأسئلة
                    <Icon name="sort" className="mr-2" />
                  </Button>
                </div>

                {/* Right Side: Next / Add / Finish */}
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  {currentQuestionIndex < questions.length - 1 ? (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleNextQuestion}
                      className="px-6 py-2.5 w-full sm:w-auto justify-center"
                    >
                      السؤال التالي
                      <Icon name="arrow-left" className="mr-2" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleNextQuestion}
                      className="px-6 py-2.5 w-full sm:w-auto justify-center"
                    >
                      إضافة سؤال جديد
                      <Icon name="plus" className="mr-2" />
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleSubmit}
                    className="px-8 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white w-full sm:w-auto justify-center shadow-lg shadow-emerald-950/20"
                    disabled={loading}
                  >
                    إنهاء وحفظ الامتحان
                    <Icon name="check" className="mr-2" />
                  </Button>
                </div>

              </div>
            </div>
          )}
        </div>
      </DashboardCard>

      {/* Finish Modal */}
      <FormModal
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        onSubmit={(e) => { e.preventDefault(); handleFinalSubmit(); }}
        title="إعدادات الامتحان النهائية"
        isLoading={loading}
        submitText="حفظ ونشر الامتحان"
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
            onChange={(e) => setActualQuestionCount(parseInt(e.target.value) || 0)}
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
        <div className="max-h-[50vh] overflow-y-auto pr-1">
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
