import React, { useState, useEffect } from 'react';
import { Lecture } from '@/services/lectureService';
import * as academyService from '@/services/academyService';
import toast from 'react-hot-toast';

interface LectureSession {
  id: string;
  lecture_id: string;
  date: string;
  title?: string;
  description?: string;
  is_cancelled: boolean;
}

interface AcademyLectureSessionsModalProps {
  lecture: Lecture;
  onClose: () => void;
}

export const AcademyLectureSessionsModal: React.FC<AcademyLectureSessionsModalProps> = ({ lecture, onClose }) => {
  const [sessions, setSessions] = useState<LectureSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [saving, setSaving] = useState(false);

  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [displayedDates, setDisplayedDates] = useState<string[]>([]);

  const [limit, setLimit] = useState(10);

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

      const getLocalDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      if (filter === 'upcoming') {
        // Generate next occurrences based on limit
        let current = new Date(today);
        let count = 0;
        while (count < limit) {
          if (targetDays.includes(current.getDay())) {
            dates.push(getLocalDateString(current));
            count++;
          }
          current.setDate(current.getDate() + 1);
        }
      } else {
        // Generate past occurrences (last 3 months)
        // But NOT before the lecture was created
        let current = new Date(today);
        current.setDate(current.getDate() - 1); // Start from yesterday
        
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const createdAt = new Date(lecture.created_at);
        createdAt.setHours(0, 0, 0, 0);
        
        while (current >= threeMonthsAgo && current >= createdAt) {
          if (targetDays.includes(current.getDay())) {
            dates.push(getLocalDateString(current));
          }
          current.setDate(current.getDate() - 1);
        }
      }
      setDisplayedDates(dates);
    }
  }, [lecture, filter, limit]);

  useEffect(() => {
    fetchSessions();
  }, [lecture.id]);

  const fetchSessions = async () => {
    try {
      const response = await academyService.getLectureSessions(lecture.id);
      setSessions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      toast.error('فشل تحميل الجلسات');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (date: string) => {
    const session = sessions.find(s => s.date.startsWith(date) || s.date.split('T')[0] === date);
    setEditingDate(date);
    setEditForm({
      title: session?.title || '',
      description: session?.description || ''
    });
  };

  const handleSave = async (date: string) => {
    try {
      setSaving(true);
      await academyService.updateLectureSession(lecture.id, {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1a1f37] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white">إدارة جلسات المحاضرة</h3>
          <div className="flex bg-black/20 rounded-lg p-1">
            <button
              onClick={() => { setFilter('upcoming'); setLimit(10); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                filter === 'upcoming' 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              القادمة
            </button>
            <button
              onClick={() => { setFilter('past'); setLimit(10); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                filter === 'past' 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              الماضية
            </button>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedDates.map(date => {
                const session = sessions.find(s => s.date.startsWith(date) || s.date.split('T')[0] === date);
                const isEditing = editingDate === date;
                const dateObj = new Date(date);
                const dayName = dateObj.toLocaleDateString('ar-EG', { weekday: 'long' });

                return (
                  <div key={date} className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-primary font-bold">{dayName}</span>
                          <span className="text-gray-400 text-sm">{date}</span>
                          {session?.is_cancelled && (
                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs">ملغاة</span>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-3 mt-3">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">عنوان مخصص (اختياري)</label>
                              <input
                                type="text"
                                value={editForm.title}
                                onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-primary focus:outline-none"
                                placeholder="عنوان الجلسة"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">وصف مخصص</label>
                              <textarea
                                value={editForm.description}
                                onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-primary focus:outline-none"
                                rows={2}
                                placeholder="وصف الجلسة..."
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingDate(null)}
                                className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white text-sm"
                                disabled={saving}
                              >
                                إلغاء
                              </button>
                              <button
                                onClick={() => handleSave(date)}
                                className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm hover:bg-primary/90 disabled:opacity-50"
                                disabled={saving}
                              >
                                {saving ? 'جاري الحفظ...' : 'حفظ'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2">
                            {session?.title && (
                              <div className="text-white font-medium mb-1">{session.title}</div>
                            )}
                            {session?.description ? (
                              <p className="text-gray-300 text-sm">{session.description}</p>
                            ) : (
                              <p className="text-gray-500 text-sm italic">لا يوجد وصف مخصص</p>
                            )}
                          </div>
                        )}
                      </div>

                      {!isEditing && (
                        <button
                          onClick={() => handleEdit(date)}
                          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {filter === 'upcoming' && (
                <div className="flex justify-center pt-2">
                    <button 
                        onClick={() => setLimit(prev => prev + 1)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-all text-sm flex items-center gap-2"
                    >
                        <span>عرض المزيد</span>
                        <i className="fas fa-chevron-down"></i>
                    </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
