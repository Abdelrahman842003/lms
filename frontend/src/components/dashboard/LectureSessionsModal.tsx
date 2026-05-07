import React, { useState, useEffect } from 'react';
import { Lecture, getLectureSessions, updateLectureSession, LectureSession } from '@/services/lectureService';
import toast from 'react-hot-toast';

import { LoadingSpinner, Button, Icon } from '@/components/ui';
import { Badge } from '@/components/ui/Badge';
interface LectureSessionsModalProps {
  lecture: Lecture;
  onClose: () => void;
}

export const LectureSessionsModal: React.FC<LectureSessionsModalProps> = ({ lecture, onClose }) => {
  const [sessions, setSessions] = useState<LectureSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [saving, setSaving] = useState(false);

  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [displayedDates, setDisplayedDates] = useState<string[]>([]);

  const normalizeDate = (value: string): string => value.split('T')[0];

  const findSessionByDate = (date: string) => {
    return sessions.find((s) => normalizeDate(s.date) === date);
  };

  useEffect(() => {
    if (lecture.is_recurring && lecture.recurrence_days) {
      const dates: string[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const daysMap: Record<string, number> = {
        'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
        'Thursday': 4, 'Friday': 5, 'Saturday': 6
      };
      
      const targetDays = lecture.recurrence_days.map(d => daysMap[d]);

      if (filter === 'upcoming') {
        // Generate next 2 occurrences
        const current = new Date(today);
        let count = 0;
        while (count < 2) {
          if (targetDays.includes(current.getDay())) {
            dates.push(current.toISOString().split('T')[0]);
            count++;
          }
          current.setDate(current.getDate() + 1);
        }
      } else {
        // Generate past occurrences (last 3 months)
        const current = new Date(today);
        current.setDate(current.getDate() - 1); // Start from yesterday
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        while (current >= threeMonthsAgo) {
          if (targetDays.includes(current.getDay())) {
            dates.push(current.toISOString().split('T')[0]);
          }
          current.setDate(current.getDate() - 1);
        }
      }
      setDisplayedDates(dates);
    }
  }, [lecture, filter]);

  useEffect(() => {
    fetchSessions();
  }, [lecture.id]);

  const fetchSessions = async () => {
    try {
      const data = await getLectureSessions(lecture.id);
      setSessions(data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      toast.error('فشل تحميل الجلسات');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (date: string) => {
    const session = findSessionByDate(date);
    setEditingDate(date);
    setEditForm({
      title: session?.title || '',
      description: session?.description || ''
    });
  };

  const handleSave = async (date: string) => {
    try {
      setSaving(true);
      await updateLectureSession(lecture.id, {
        date,
        ...editForm
      });
      
      await fetchSessions();
      setEditingDate(null);
      toast.success('تم حفظ التغييرات');
    } catch (error) {
      console.error('Failed to save session:', error);
      toast.error('فشل حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ux-fixed ux-inset-0 ux-z-50 ux-flex ux-items-center ux-justify-center ux-p-4 ux-bg-black-50 ux-backdrop-blur-sm" onClick={onClose}>
      <div className="ux-bg-1a1f37 ux-border ux-border-white-10 ux-rounded-2xl ux-w-full ux-max-w-2xl ux-max-h-80vh ux-flex ux-flex-col ux-shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="ux-flex ux-items-center ux-justify-between ux-p-6 ux-border-b ux-border-white-10">
          <h3 className="ux-text-xl ux-font-bold ux-text-white">إدارة جلسات المحاضرة</h3>
          <div className="ux-flex ux-bg-black-20 ux-rounded-lg ux-p-1">
            <button
              onClick={() => setFilter('upcoming')}
              className={`ux-px-4 ux-py-1dot5 ux-rounded-md ux-text-sm ux-font-medium ux-transition-all ${
                filter === 'upcoming' 
                  ? 'ux-bg-primary ux-text-white ux-shadow-lg'
                  : 'ux-text-gray-400 ux-hover-text-white'
              }`}
            >
              القادمة
            </button>
            <button
              onClick={() => setFilter('past')}
              className={`ux-px-4 ux-py-1dot5 ux-rounded-md ux-text-sm ux-font-medium ux-transition-all ${
                filter === 'past' 
                  ? 'ux-bg-primary ux-text-white ux-shadow-lg'
                  : 'ux-text-gray-400 ux-hover-text-white'
              }`}
            >
              الماضية
            </button>
          </div>
          <button onClick={onClose} className="ux-text-gray-400 ux-hover-text-white ux-transition-colors">
            <Icon name="times" size="xl" />
          </button>
        </div>

        <div className="ux-flex-1 ux-overflow-y-auto ux-p-6">
          {loading ? (
            <div className="ux-flex ux-justify-center ux-py-8">
              <LoadingSpinner size="md" color="primary" />
            </div>
          ) : (
            <div className="ux-space-y-4">
              {displayedDates.map(date => {
                const session = findSessionByDate(date);
                const isEditing = editingDate === date;
                const dateObj = new Date(date);
                const dayName = dateObj.toLocaleDateString('ar-EG', { weekday: 'long' });

                return (
                  <div key={date} className="ux-bg-white-5 ux-rounded-xl ux-p-4 ux-border ux-border-white-5">
                    <div className="ux-flex ux-items-start ux-justify-between ux-gap-4">
                      <div className="ux-flex-1">
                        <div className="ux-flex ux-items-center ux-gap-2 ux-mb-2">
                          <span className="ux-text-primary ux-font-bold">{dayName}</span>
                          <span className="ux-text-gray-400 ux-text-sm">{date}</span>
                          {session?.is_cancelled && (
                            <Badge variant="danger" size="sm">ملغاة</Badge>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="ux-space-y-3 ux-mt-3">
                            <div>
                              <label className="ux-block ux-text-xs ux-text-gray-400 ux-mb-1">عنوان مخصص (اختياري)</label>
                              <input
                                type="text"
                                value={editForm.title}
                                onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                className="ux-w-full ux-bg-black-20 ux-border ux-border-white-10 ux-rounded-lg ux-px-3 ux-py-2 ux-text-white ux-text-sm ux-focus-border-primary ux-focus-outline-none"
                                placeholder="عنوان الجلسة"
                              />
                            </div>
                            <div>
                              <label className="ux-block ux-text-xs ux-text-gray-400 ux-mb-1">وصف مخصص</label>
                              <textarea
                                value={editForm.description}
                                onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                className="ux-w-full ux-bg-black-20 ux-border ux-border-white-10 ux-rounded-lg ux-px-3 ux-py-2 ux-text-white ux-text-sm ux-focus-border-primary ux-focus-outline-none"
                                rows={2}
                                placeholder="وصف الجلسة..."
                              />
                            </div>
                            <div className="ux-flex ux-justify-end ux-gap-2">
                              <Button
                                variant="ghost"
                                onClick={() => setEditingDate(null)}
                                disabled={saving}
                                size="sm"
                              >
                                إلغاء
                              </Button>
                              <Button
                                onClick={() => handleSave(date)}
                                disabled={saving}
                                size="sm"
                              >
                                {saving ? 'جاري الحفظ...' : 'حفظ'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="ux-mt-2">
                            {session?.title && (
                              <div className="ux-text-white ux-font-medium ux-mb-1">{session.title}</div>
                            )}
                            {session?.description ? (
                              <p className="ux-text-gray-300 ux-text-sm">{session.description}</p>
                            ) : (
                              <p className="ux-text-gray-500 ux-text-sm ux-italic">لا يوجد وصف مخصص</p>
                            )}
                          </div>
                        )}
                      </div>

                      {!isEditing && (
                        <button
                          onClick={() => handleEdit(date)}
                          className="ux-p-2 ux-rounded-lg ux-hover-bg-white-10 ux-text-gray-400 ux-hover-text-white ux-transition-colors"
                        >
                          <Icon name="edit" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
