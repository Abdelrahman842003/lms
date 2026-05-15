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
  const [subject, setSubject] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState(60);
  const [totalMarks, setTotalMarks] = useState(100);
  const [actualQuestionCount, setActualQuestionCount] = useState(0); // Questions shown in actual exam
  
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
          getGrades(),
          getGroups(1, 100)
        ]);
        setGrades(gradesData.data || []);
        setGroups(groupsData.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

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
    
    // Initialize with one empty question if empty
    if (questions.length === 0) {
      setQuestions([{
        id: crypto.randomUUID(),
        text: '',
        type: 'mcq',
        options: ['', '', '', ''],
        correct_answer: '',
        duration: 60
      }]);
    }
    setStep('questions');
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
        type: 'mcq',
        options: ['', '', '', ''],
        correct_answer: '',
        duration: 60
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
            <div className="premium-glass p-8 md:p-10 rounded-[2.5rem] border-white/5">
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
                    className="h-14 px-10 rounded-2xl font-bold text-gray-light hover:text-white"
                  >
                    إلغاء والعودة
                  </Button>

                  <Button type="submit" variant="primary" className="h-14 px-12 rounded-2xl font-black gap-2 shadow-xl shadow-primary/20">
                    <span>التالي: إضافة الأسئلة</span>
                    <Icon name="arrow-left" />
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

            <div className="premium-glass p-8 md:p-10 rounded-[2.5rem] border-white/5">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl premium-border shadow-2xl shadow-primary/20">
                        {currentQuestionIndex + 1}
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-white">محرر الأسئلة</h3>
                        <p className="text-xs font-bold text-gray-light/30 uppercase tracking-widest mt-1">أضف السؤال والخيارات المتاحة</p>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => handleQuestionChange('type', 'mcq')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${questions[currentQuestionIndex].type === 'mcq' ? 'bg-primary text-white shadow-lg' : 'text-gray-light/30 hover:text-white'}`}
                      >
                        اختياري
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuestionChange('type', 'true_false')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${questions[currentQuestionIndex].type === 'true_false' ? 'bg-primary text-white shadow-lg' : 'text-gray-light/30 hover:text-white'}`}
                      >
                        صح وخطأ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuestionChange('type', 'ordering')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${questions[currentQuestionIndex].type === 'ordering' ? 'bg-primary text-white shadow-lg' : 'text-gray-light/30 hover:text-white'}`}
                      >
                        ترتيب
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuestionChange('type', 'matching')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${questions[currentQuestionIndex].type === 'matching' ? 'bg-primary text-white shadow-lg' : 'text-gray-light/30 hover:text-white'}`}
                      >
                        توصيل
                      </button>
                    </div>
                    
                    <div className="w-px h-6 bg-white/10 mx-1" />

                    <label className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest px-2">وقت السؤال (ث)</label>
                    <Input
                      type="number"
                      className="h-10 w-20 bg-white/10 border-none rounded-xl text-center font-bold text-primary focus:ring-0"
                      value={questions[currentQuestionIndex].duration || 60}
                      onChange={(e) => handleQuestionChange('duration', parseInt(e.target.value))}
                    />
                  </div>
               </div>

               <div className="space-y-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest px-2">نص السؤال العلمي</label>
                    <textarea
                      className="w-full min-h-[120px] bg-white/5 border border-white/5 rounded-3xl p-6 font-bold text-lg text-white focus:bg-white/10 focus:border-primary/30 focus:ring-0 transition-all placeholder:text-gray-light/10 leading-relaxed"
                      value={questions[currentQuestionIndex].text}
                      onChange={(e) => handleQuestionChange('text', e.target.value)}
                      placeholder="اكتب السؤال هنا بوضوح..."
                      autoFocus
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest px-2">
                      {questions[currentQuestionIndex].type === 'true_false' ? 'حدد الإجابة الصحيحة' : 
                       questions[currentQuestionIndex].type === 'ordering' ? 'اكتب العناصر بالترتيب الصحيح (من الأول للأخير)' :
                       questions[currentQuestionIndex].type === 'matching' ? 'أضف أزواج التوصيل الصحيحة' :
                       'خيارات الإجابة (اضغط لتحديد الإجابة الصحيحة)'}
                    </label>

                    {(questions[currentQuestionIndex].type === 'mcq' || questions[currentQuestionIndex].type === 'true_false') && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {questions[currentQuestionIndex].options.map((option, oIndex) => {
                          const isCorrect = questions[currentQuestionIndex].correct_answer === option && option !== '';
                          const isTrueFalse = questions[currentQuestionIndex].type === 'true_false';
                          return (
                            <div 
                              key={oIndex} 
                              onClick={() => handleQuestionChange('correct_answer', option)}
                              className={`group relative flex items-center gap-4 p-5 rounded-2xl cursor-pointer border-2 transition-all duration-300
                                ${isCorrect 
                                  ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                                  : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                            >
                               <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-xs transition-all border
                                 ${isCorrect ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white/5 text-gray-light/20 border-white/5 group-hover:border-white/10'}`}>
                                 {isCorrect ? <Icon name="check" /> : String.fromCharCode(65 + oIndex)}
                               </div>
                               
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
                          <div key={oIndex} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
                             <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs border border-primary/20">
                               {oIndex + 1}
                             </div>
                             <Input
                               type="text"
                               className="flex-1 bg-transparent border-none p-0 font-bold text-white shadow-none focus:ring-0 placeholder:text-gray-light/5"
                               value={option}
                               onChange={(e) => {
                                 const newOptions = [...questions[currentQuestionIndex].options];
                                 newOptions[oIndex] = e.target.value;
                                 handleQuestionChange('options', newOptions);
                                 handleQuestionChange('correct_answer', newOptions.join('|||'));
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
                                 className="text-red-400/50 hover:text-red-400"
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
                         <div className="grid grid-cols-2 gap-4 px-4 text-[10px] font-black text-gray-light/20 uppercase tracking-widest">
                            <div>العمود الأول (أ)</div>
                            <div>العمود الثاني (ب) - المقابل له</div>
                         </div>
                        {questions[currentQuestionIndex].options.map((pair: {a: string, b: string}, oIndex: number) => (
                          <div key={oIndex} className="flex items-center gap-4">
                             <div className="flex-1 grid grid-cols-2 gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
                               <Input
                                 type="text"
                                 className="bg-transparent border-none p-0 font-bold text-white shadow-none focus:ring-0 placeholder:text-gray-light/5 border-l border-white/10 rounded-none"
                                 value={pair.a}
                                 onChange={(e) => {
                                   const newOptions = [...questions[currentQuestionIndex].options];
                                   newOptions[oIndex] = { ...newOptions[oIndex], a: e.target.value };
                                   handleQuestionChange('options', newOptions);
                                   handleQuestionChange('correct_answer', newOptions.map(p => `${p.a}===${p.b}`).join('|||'));
                                 }}
                                 placeholder="العنصر أ"
                               />
                               <Input
                                 type="text"
                                 className="bg-transparent border-none p-0 font-bold text-white shadow-none focus:ring-0 placeholder:text-gray-light/5"
                                 value={pair.b}
                                 onChange={(e) => {
                                   const newOptions = [...questions[currentQuestionIndex].options];
                                   newOptions[oIndex] = { ...newOptions[oIndex], b: e.target.value };
                                   handleQuestionChange('options', newOptions);
                                   handleQuestionChange('correct_answer', newOptions.map(p => `${p.a}===${p.b}`).join('|||'));
                                 }}
                                 placeholder="العنصر ب المقابل"
                               />
                             </div>
                             {questions[currentQuestionIndex].options.length > 2 && (
                               <button 
                                 type="button"
                                 onClick={() => {
                                   const newOptions = questions[currentQuestionIndex].options.filter((_: any, i: number) => i !== oIndex);
                                   handleQuestionChange('options', newOptions);
                                   handleQuestionChange('correct_answer', newOptions.map(p => `${p.a}===${p.b}`).join('|||'));
                                 }}
                                 className="text-red-400/50 hover:text-red-400"
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

               <div className="pt-10 border-t border-white/5 flex flex-col lg:flex-row justify-between gap-6">
                  <div className="flex items-center gap-3 w-full lg:w-auto">
                    <Button
                      type="button"
                      onClick={() => setShowPreviewModal(true)}
                      variant="ghost"
                      className="flex-1 lg:flex-none h-14 px-6 rounded-2xl bg-white/5 border border-white/5 font-bold gap-2 hover:bg-white/10"
                    >
                      <Icon name="sort" />
                      <span>معاينة وترتيب</span>
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setStep('details')}
                      variant="ghost"
                      className="flex-1 lg:flex-none h-14 px-6 rounded-2xl bg-white/5 border border-white/5 font-bold gap-2 hover:bg-white/10"
                    >
                      <Icon name="cog" />
                      <span>الإعدادات</span>
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    {currentQuestionIndex > 0 && (
                      <Button
                        type="button"
                        onClick={handlePrevQuestion}
                        variant="ghost"
                        className="h-14 px-6 rounded-2xl font-bold text-gray-light"
                      >
                        السابق
                      </Button>
                    )}
                    
                    <Button
                      type="button"
                      onClick={handleNextQuestion}
                      variant="secondary"
                      className="w-full sm:w-auto h-14 px-8 rounded-2xl font-bold gap-2"
                    >
                      <Icon name="plus" />
                      <span>سؤال جديد</span>
                    </Button>

                    <Button
                      type="button"
                      onClick={handleSubmit}
                      variant="primary"
                      className="w-full sm:w-auto h-14 px-12 rounded-2xl font-black gap-2 shadow-xl shadow-primary/20"
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
      <FormModal
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        onSubmit={(e) => { e.preventDefault(); handleFinalSubmit(); }}
        title="إعدادات النشر النهائية"
        isLoading={loading}
        submitText={loading ? 'جاري الحفظ...' : 'تأكيد ونشر الامتحان'}
        cancelText="رجوع للتعديل"
        maxWidth="500px"
      >
        <div className="space-y-8 py-2">
           <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                 <Icon name="magic" size="xl" />
              </div>
              <div className="space-y-1">
                 <h4 className="text-sm font-black text-white">العشوائية الذكية</h4>
                 <p className="text-[11px] font-bold text-gray-light/40 leading-relaxed">يمكنك اختيار عدد أسئلة أقل ليتم توزيعها عشوائياً لكل طالب من بنك الأسئلة الذي أنشأته.</p>
              </div>
           </div>

           <div className="space-y-3">
             <label className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest px-2">عدد الأسئلة لكل طالب</label>
             <div className="flex items-center gap-4">
                <Input
                  type="number"
                  className="h-14 flex-1 bg-white/5 border-white/5 rounded-2xl px-5 font-black text-xl text-center text-primary"
                  value={actualQuestionCount}
                  onChange={(e) => setActualQuestionCount(parseInt(e.target.value))}
                  min="1"
                  max={questions.length}
                />
                <div className="text-left min-w-[80px]">
                   <p className="text-[10px] font-black text-gray-light/20 uppercase tracking-widest leading-none mb-1">الإجمالي</p>
                   <p className="text-xl font-black text-white leading-none">{questions.length}</p>
                </div>
             </div>
           </div>
        </div>
      </FormModal>

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
