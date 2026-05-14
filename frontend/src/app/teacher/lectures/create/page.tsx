'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { LoadingSpinner, Button, Icon, Input, Textarea } from '@/components/ui';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { createLecture, CreateLectureData } from '@/services/lectureService';
import { getGrades } from '@/services/gradeService';
import { getGroups, Group } from '@/services/groupService';
import { Filter } from '@/components/Filter';
import toast from 'react-hot-toast';
import { cn } from '@/utils';

export default function CreateLecturePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [grades, setGrades] = useState<any[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  
  const [formData, setFormData] = useState<CreateLectureData>({
    title: '',
    description: '',
    grade_id: '',
    group_id: '',
    date: '',
    is_recurring: false,
    recurrence_days: [],
    recurrence_time: '',
    duration_minutes: 120,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gradesResponse, groupsResponse] = await Promise.all([
          getGrades(1, 100),
          getGroups(1, 100)
        ]);
        setGrades(gradesResponse.data || []);
        setGroups(groupsResponse.data || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createLecture(formData);
      toast.success('تم إضافة المحاضرة بنجاح');
      router.push('/teacher/lectures');
    } catch (error: any) {
      console.error('Failed to create lecture:', error);
      toast.error(error.message || 'فشل إضافة المحاضرة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dayLabels: Record<string, string> = {
    'Sunday': 'الأحد',
    'Monday': 'الاثنين',
    'Tuesday': 'الثلاثاء',
    'Wednesday': 'الأربعاء',
    'Thursday': 'الخميس',
    'Friday': 'الجمعة',
    'Saturday': 'السبت',
  };

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={{
        name: user?.name || 'المدرس',
        avatar: user?.avatar || '',
      }}
    >
      <div className="max-w-4xl mx-auto py-4 md:py-8 px-4 md:px-0">
        {/* Header */}
        <div className="relative mb-8 md:mb-12 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] premium-glass premium-border overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -translate-y-1/2 translate-x-1/3"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8 text-center md:text-right">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-3xl md:text-4xl shadow-2xl">
              <Icon name="plus" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">محاضرة جديدة</h1>
              <p className="text-gray-light/60 text-sm md:text-lg font-medium mt-2">قم بتهيئة المحاضرة الجديدة وتحديد المجموعات المستهدفة</p>
            </div>
            
            {/* Mobile Back Button - Moved below to avoid overlap */}
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex md:hidden items-center gap-2 text-primary bg-primary/10 px-6 py-3 rounded-2xl text-sm font-bold mt-4 border border-primary/20"
            >
              <Icon name="arrow-right" size="sm" />
              <span>رجوع للقائمة</span>
            </Button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="relative z-10 space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            
            {/* Left Column: Main Info */}
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
              <div className="p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] premium-glass premium-border space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <Icon name="info-circle" className="text-primary" />
                  <h3 className="text-lg md:text-xl font-bold text-white">المعلومات الأساسية</h3>
                </div>

                <div className="form-group">
                  <label htmlFor="title" className="block text-[10px] md:text-sm font-black uppercase tracking-widest text-gray-light/40 mb-2 md:mb-3 mr-1">عنوان المحاضرة</label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="مثال: مراجعة الفصل الأول"
                    className="w-full bg-white/5 border-white/10 focus:border-primary/50 h-12 md:h-14 rounded-xl md:rounded-2xl px-5 md:px-6 text-base md:text-lg"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description" className="block text-[10px] md:text-sm font-black uppercase tracking-widest text-gray-light/40 mb-2 md:mb-3 mr-1">وصف المحاضرة (اختياري)</label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="اكتب نبذة مختصرة عن محتوى المحاضرة..."
                    rows={4}
                    className="w-full bg-white/5 border-white/10 focus:border-primary/50 rounded-xl md:rounded-2xl p-5 md:p-6 min-h-[100px] md:min-h-[120px] text-sm md:text-base"
                  />
                </div>
              </div>

              <div className="p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] premium-glass premium-border space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <Icon name="calendar-alt" className="text-secondary" />
                  <h3 className="text-lg md:text-xl font-bold text-white">الجدولة والوقت</h3>
                </div>

                <div className="form-group">
                  <label className="block text-[10px] md:text-sm font-black uppercase tracking-widest text-gray-light/40 mb-2 md:mb-3 mr-1">نوع المحاضرة</label>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_recurring: false })}
                      className={cn(
                        "flex flex-col items-center gap-2 md:gap-3 p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 transition-all duration-300",
                        !formData.is_recurring 
                          ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(66,99,235,0.15)]" 
                          : "bg-white/5 border-white/5 hover:border-white/20"
                      )}
                    >
                      <Icon name="calendar-day" className={cn("text-xl md:text-2xl", !formData.is_recurring ? "text-primary" : "text-gray-light/40")} />
                      <span className={cn("font-bold text-xs md:text-base", !formData.is_recurring ? "text-white" : "text-gray-light/60")}>إضافية</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_recurring: true })}
                      className={cn(
                        "flex flex-col items-center gap-2 md:gap-3 p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 transition-all duration-300",
                        formData.is_recurring 
                          ? "bg-secondary/10 border-secondary shadow-[0_0_15px_rgba(0,214,143,0.15)]" 
                          : "bg-white/5 border-white/5 hover:border-white/20"
                      )}
                    >
                      <Icon name="history" className={cn("text-xl md:text-2xl", formData.is_recurring ? "text-secondary" : "text-gray-light/40")} />
                      <span className={cn("font-bold text-xs md:text-base", formData.is_recurring ? "text-white" : "text-gray-light/60")}>أساسية</span>
                    </button>
                  </div>
                </div>

                {formData.is_recurring ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                    <div className="form-group">
                      <label className="block text-[10px] md:text-sm font-black uppercase tracking-widest text-gray-light/40 mb-3 md:mb-4 mr-1">أيام التكرار الأسبوعي</label>
                      <div className="flex flex-wrap gap-2 md:gap-3">
                        {days.map((day) => (
                          <label 
                            key={day} 
                            className={cn(
                              "relative px-3 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl border-2 cursor-pointer transition-all duration-300 font-bold text-[10px] md:text-sm",
                              formData.recurrence_days?.includes(day) 
                                ? "bg-secondary text-white border-secondary shadow-lg scale-105" 
                                : "bg-white/5 border-white/5 text-gray-light/40 hover:border-white/20"
                            )}
                          >
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={formData.recurrence_days?.includes(day)}
                              onChange={(e) => {
                                const newDays = e.target.checked
                                  ? [...(formData.recurrence_days || []), day]
                                  : (formData.recurrence_days || []).filter(d => d !== day);
                                setFormData({ ...formData, recurrence_days: newDays });
                              }}
                            />
                            {dayLabels[day]}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="form-group animate-in fade-in slide-in-from-top-4">
                    <label htmlFor="date" className="block text-[10px] md:text-sm font-black uppercase tracking-widest text-gray-light/40 mb-2 md:mb-3 mr-1">تاريخ المحاضرة</label>
                    <div className="relative">
                      <Icon name="calendar" className="absolute right-5 top-1/2 -translate-y-1/2 text-primary" />
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                        className="w-full bg-white/5 border-white/10 focus:border-primary/50 h-12 md:h-14 rounded-xl md:rounded-2xl pr-12 pl-5 md:pl-6 text-white"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="form-group">
                    <label htmlFor="recurrence_time" className="block text-[10px] md:text-sm font-black uppercase tracking-widest text-gray-light/40 mb-2 md:mb-3 mr-1">وقت البدء</label>
                    <div className="relative">
                      <Icon name="clock" className="absolute right-5 top-1/2 -translate-y-1/2 text-primary" />
                      <Input
                        id="recurrence_time"
                        type="time"
                        value={formData.recurrence_time}
                        onChange={(e) => setFormData({ ...formData, recurrence_time: e.target.value })}
                        required
                        className="w-full bg-white/5 border-white/10 focus:border-primary/50 h-12 md:h-14 rounded-xl md:rounded-2xl pr-12 pl-5 md:pl-6 text-white"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="duration_minutes" className="block text-[10px] md:text-sm font-black uppercase tracking-widest text-gray-light/40 mb-2 md:mb-3 mr-1">المدة (بالدقائق)</label>
                    <div className="relative">
                      <Icon name="hourglass-half" className="absolute right-5 top-1/2 -translate-y-1/2 text-primary" />
                      <Input
                        id="duration_minutes"
                        type="number"
                        value={formData.duration_minutes}
                        onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value, 10) || 0 })}
                        min="1"
                        required
                        className="w-full bg-white/5 border-white/10 focus:border-primary/50 h-12 md:h-14 rounded-xl md:rounded-2xl pr-12 pl-5 md:pl-6 text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Targeting */}
            <div className="space-y-6 md:space-y-8">
              <div className="p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] premium-glass premium-border space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <Icon name="users" className="text-warning" />
                  <h3 className="text-lg md:text-xl font-bold text-white">الجمهور المستهدف</h3>
                </div>

                <div className="form-group">
                  <label htmlFor="grade" className="block text-[10px] md:text-sm font-black uppercase tracking-widest text-gray-light/40 mb-2 md:mb-3 mr-1">الصف الدراسي</label>
                  <Filter
                    options={grades.map((grade) => ({ value: String(grade.id), label: grade.name }))}
                    value={String(formData.grade_id || '')}
                    onChange={(value) => setFormData({ ...formData, grade_id: value })}
                    placeholder="اختر الصف"
                    className="w-full"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="group" className="block text-[10px] md:text-sm font-black uppercase tracking-widest text-gray-light/40 mb-2 md:mb-3 mr-1">المجموعة</label>
                  <Filter
                    options={[
                      { value: '', label: 'كل المجموعات' },
                      ...groups
                        .filter(g => !formData.grade_id || String(g.grade_id) === String(formData.grade_id))
                        .map((group) => ({ value: String(group.id), label: group.name }))
                    ]}
                    value={String(formData.group_id || '')}
                    onChange={(value) => setFormData({ ...formData, group_id: value })}
                    placeholder="كل المجموعات"
                    className="w-full"
                  />
                  <p className="text-[10px] text-gray-light/30 mt-2 mr-1">اتركها "كل المجموعات" لتظهر لجميع طلاب الصف</p>
                </div>
              </div>

              {/* Submit Section */}
              <div className="p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] bg-white/5 border border-white/5 space-y-3">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 md:h-16 rounded-[1.2rem] md:rounded-[1.5rem] bg-gradient-to-r from-primary to-secondary hover:shadow-[0_10px_30px_rgba(66,99,235,0.4)] text-white font-black uppercase tracking-widest border-none gap-3 transition-all text-xs md:text-base"
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    <Icon name="check-circle" />
                  )}
                  <span>إضافة المحاضرة</span>
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.back()}
                  className="w-full h-10 md:h-12 rounded-[1.2rem] md:rounded-[1.5rem] text-gray-light hover:text-white transition-all text-xs"
                  disabled={isSubmitting}
                >
                  إلغاء العملية
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
