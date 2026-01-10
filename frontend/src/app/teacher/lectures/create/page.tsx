'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { createLecture, CreateLectureData } from '@/services/lectureService';
import { getGrades } from '@/services/gradeService';
import { getGroups, Group } from '@/services/groupService';
import { Filter } from '@/components/Filter';
import toast from 'react-hot-toast';

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

  return (
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={{
        name: user?.name || 'المدرس',
        avatar: user?.avatar || '',
      }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <i className="fas fa-arrow-right"></i>
            <span>رجوع</span>
          </button>
          <h1 className="text-3xl font-bold text-white">محاضرة جديدة</h1>
          <p className="text-gray-400 mt-2">أضف محاضرة جديدة للطلاب</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-gray-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
          <div className="space-y-6">
            {/* Title */}
            <div className="form-group">
              <label htmlFor="title" className="block text-white mb-2">عنوان المحاضرة</label>
              <input
                type="text"
                id="title"
                className="form-input w-full"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="مثال: مراجعة الفصل الأول"
              />
            </div>

            {/* Grade */}
            <div className="form-group">
              <label htmlFor="grade" className="block text-white mb-2">الصف الدراسي</label>
              <Filter
                options={grades.map((grade) => ({ value: String(grade.id), label: grade.name }))}
                value={String(formData.grade_id || '')}
                onChange={(value) => setFormData({ ...formData, grade_id: value })}
                placeholder="اختر الصف"
                className="w-full"
              />
            </div>

            {/* Group */}
            <div className="form-group">
              <label htmlFor="group" className="block text-white mb-2">المجموعة (اختياري)</label>
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
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="description" className="block text-white mb-2">الوصف (اختياري)</label>
              <textarea
                id="description"
                className="form-input w-full"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف مختصر للمحاضرة..."
                rows={3}
              />
            </div>

            {/* Lecture Type */}
            <div className="form-group">
              <label htmlFor="lecture_type" className="block text-white mb-2">نوع المحاضرة</label>
              <Filter
                options={[
                  { value: 'extra', label: 'محاضرة إضافية' },
                  { value: 'basic', label: 'محاضرة أساسية (متكررة)' }
                ]}
                value={formData.is_recurring ? 'basic' : 'extra'}
                onChange={(value) => {
                  const isBasic = value === 'basic';
                  setFormData({ 
                    ...formData, 
                    is_recurring: isBasic,
                    date: isBasic ? '' : formData.date,
                    recurrence_days: isBasic ? formData.recurrence_days : [],
                  });
                }}
                placeholder="اختر نوع المحاضرة"
                className="w-full"
              />
            </div>

            {/* Recurring Lecture Fields */}
            {formData.is_recurring ? (
              <>
                <div className="form-group">
                  <label className="block text-white mb-2">أيام التكرار</label>
                  <div className="flex flex-wrap gap-2">
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                      <label 
                        key={day} 
                        className={`px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                          formData.recurrence_days?.includes(day) 
                            ? 'bg-primary text-white border-primary' 
                            : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/20'
                        }`}
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="recurrence_time" className="block text-white mb-2">وقت المحاضرة</label>
                    <input
                      type="time"
                      id="recurrence_time"
                      className="form-input w-full"
                      value={formData.recurrence_time}
                      onChange={(e) => setFormData({ ...formData, recurrence_time: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="duration_minutes" className="block text-white mb-2">المدة (دقيقة)</label>
                    <input
                      type="number"
                      id="duration_minutes"
                      className="form-input w-full"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                      min="1"
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="date" className="block text-white mb-2">تاريخ المحاضرة</label>
                  <input
                    type="date"
                    id="date"
                    className="form-input w-full"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="recurrence_time" className="block text-white mb-2">وقت المحاضرة</label>
                    <input
                      type="time"
                      id="recurrence_time"
                      className="form-input w-full"
                      value={formData.recurrence_time}
                      onChange={(e) => setFormData({ ...formData, recurrence_time: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="duration_minutes" className="block text-white mb-2">المدة (دقيقة)</label>
                    <input
                      type="number"
                      id="duration_minutes"
                      className="form-input w-full"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                      min="1"
                      required
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-secondary flex-1"
              disabled={isSubmitting}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin ml-2"></i>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <i className="fas fa-plus ml-2"></i>
                  إضافة المحاضرة
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
