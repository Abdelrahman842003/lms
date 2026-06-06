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

        const source = examData.type === 'dynamic' ? 'dynamic' : 'manual';
        setQuestionSource(source);
        if (examData.dynamic_settings) {
          const settings = typeof examData.dynamic_settings === 'string' ? JSON.parse(examData.dynamic_settings) : examData.dynamic_settings;
          setEasyCount(settings.easy || 0);
          setMediumCount(settings.medium || 0);
          setHardCount(settings.hard || 0);
        }
        
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
            let gradesList = [];
            if (gradesData?.data?.data && Array.isArray(gradesData.data.data)) {
              gradesList = gradesData.data.data;
            } else if (gradesData?.data && Array.isArray(gradesData.data)) {
              gradesList = gradesData.data;
            } else if (Array.isArray(gradesData)) {
              gradesList = gradesData;
            }
            setGrades(gradesList);
          } catch (e) {
            console.error('Error fetching grades:', e);
          }
        }

        // Fetch Groups for this grade
        if (gId) {
          try {
            const groupsData = await getGroups(1, 100, { grade_id: gId });
            let groupsList = [];
            if (groupsData?.data?.data && Array.isArray(groupsData.data.data)) {
              groupsList = groupsData.data.data;
            } else if (groupsData?.data && Array.isArray(groupsData.data)) {
              groupsList = groupsData.data;
            } else if (Array.isArray(groupsData)) {
              groupsList = groupsData;
            }
            setGroups(groupsList);
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
              type: q.type || 'mcq',
              options: Array.isArray(options) ? options : ['', '', '', ''],
              correct_answer: q.correct_answer || '',
              duration: q.duration || 60,
              difficulty: q.difficulty || 'medium'
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
      const response = await updateAcademyExam(id, {
        title,
        subject,
        teacher_id: teacherId,
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
        type: 'manual',
        questions: questions.map(q => ({
          ...q,
          difficulty: q.difficulty || 'medium'
        }))
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
                <div className="form-group md:col-span-2 space-y-4">
                  <label className="block text-sm font-medium text-white mb-2">مصدر ونوع الأسئلة</label>
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
                  {questionSource === 'dynamic' ? 'حفظ ونشر التعديلات' : 'التالي: تعديل الأسئلة'}
                  <Icon name={questionSource === 'dynamic' ? 'check' : 'arrow-left'} className="mr-2" />
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
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 gap-4">
                      <div className="flex items-center gap-4">
                        <label className="block text-sm font-medium">نص السؤال</label>
                        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/5">
                          <button
                            type="button"
                            onClick={() => handleQuestionChange('type', 'mcq')}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${questions[currentQuestionIndex]?.type === 'mcq' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                          >
                            اختياري
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuestionChange('type', 'true_false')}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${questions[currentQuestionIndex]?.type === 'true_false' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                          >
                            صح وخطأ
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuestionChange('type', 'ordering')}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${questions[currentQuestionIndex]?.type === 'ordering' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                          >
                            ترتيب
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuestionChange('type', 'matching')}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${questions[currentQuestionIndex]?.type === 'matching' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                          >
                            توصيل
                          </button>
                        </div>
                      </div>
                      
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

                      <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleQuestionChange('difficulty', 'easy')}
                          className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${questions[currentQuestionIndex]?.difficulty === 'easy' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                        >
                          سهل
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuestionChange('difficulty', 'medium')}
                          className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${!questions[currentQuestionIndex]?.difficulty || questions[currentQuestionIndex]?.difficulty === 'medium' ? 'bg-amber-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                        >
                          متوسط
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuestionChange('difficulty', 'hard')}
                          className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${questions[currentQuestionIndex]?.difficulty === 'hard' ? 'bg-rose-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                        >
                          صعب
                        </button>
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
                    <label className="block text-sm font-medium mb-2">
                      {questions[currentQuestionIndex]?.type === 'true_false' ? 'حدد الإجابة الصحيحة' : 
                       questions[currentQuestionIndex]?.type === 'ordering' ? 'اكتب العناصر بالترتيب الصحيح' :
                       questions[currentQuestionIndex]?.type === 'matching' ? 'أضف أزواج التوصيل الصحيحة' :
                       'الخيارات (اختر الإجابة الصحيحة)'}
                    </label>

                    {(questions[currentQuestionIndex]?.type === 'mcq' || questions[currentQuestionIndex]?.type === 'true_false') && (
                      <div className="grid grid-cols-1 gap-4">
                        {questions[currentQuestionIndex]?.options?.map((option: string, oIndex: number) => {
                          const isTrueFalse = questions[currentQuestionIndex]?.type === 'true_false';
                          return (
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
                                readOnly={isTrueFalse}
                                className={`border-none shadow-none focus:ring-0 ${isTrueFalse ? 'cursor-pointer' : ''}`}
                                value={option}
                                onChange={(e) => handleOptionChange(oIndex, e.target.value)}
                                required
                                placeholder={`الخيار ${oIndex + 1}`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {questions[currentQuestionIndex]?.type === 'ordering' && (
                      <div className="space-y-3">
                        {questions[currentQuestionIndex].options.map((option: string, oIndex: number) => (
                          <div key={oIndex} className="flex items-center gap-4 p-3 bg-white/5 border border-white/10 rounded-xl">
                             <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                               {oIndex + 1}
                             </div>
                             <Input
                               type="text"
                               className="flex-1 bg-transparent border-none p-0 font-bold text-white shadow-none focus:ring-0"
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
                                 className="text-red-400 hover:text-red-300"
                               >
                                 <Icon name="trash" />
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
                          className="w-full h-10 border-dashed border-2 bg-transparent"
                        >
                          <Icon name="plus" className="ml-2" />
                          إضافة عنصر جديد
                        </Button>
                      </div>
                    )}

                    {questions[currentQuestionIndex]?.type === 'matching' && (
                      <div className="space-y-4">
                        {questions[currentQuestionIndex].options.map((pair: {a: string, b: string}, oIndex: number) => (
                          <div key={oIndex} className="flex items-center gap-4">
                             <div className="flex-1 grid grid-cols-2 gap-4 p-3 bg-white/5 border border-white/10 rounded-xl">
                               <Input
                                 type="text"
                                 className="bg-transparent border-none p-0 font-bold text-white shadow-none focus:ring-0"
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
                                 <Input
                                 type="text"
                                 className="bg-transparent border-none p-0 font-bold text-white shadow-none focus:ring-0"
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
                                 />                             </div>
                             {questions[currentQuestionIndex].options.length > 2 && (
                               <button 
                                 type="button"
                                 onClick={() => {
                                   const newOptions = questions[currentQuestionIndex].options.filter((_: any, i: number) => i !== oIndex);
                                   handleQuestionChange('options', newOptions);
                                   handleQuestionChange('correct_answer', newOptions.map(p => `${p.a}===${p.b}`).join('|||'));
                                 }}
                                 className="text-red-400 hover:text-red-300"
                               >
                                 <Icon name="trash" />
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
                          className="w-full h-10 border-dashed border-2 bg-transparent"
                        >
                          <Icon name="plus" className="ml-2" />
                          إضافة زوج توصيل جديد
                        </Button>
                      </div>
                    )}
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
