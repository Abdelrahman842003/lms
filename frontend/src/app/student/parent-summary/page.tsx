'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { fetchApi } from '@/services/authService';

interface LectureItem {
  id: string;
  title: string;
  date: string;
  time: string;
  status: 'present' | 'absent' | 'not_recorded';
}

interface ExamItem {
  id: string;
  title: string;
  subject: string;
  score: number | null;
  max_score: number;
  percentage: number | null;
  status: string;
  date: string;
}

interface TeacherSummary {
  teacher: {
    id: string;
    name: string;
    avatar: string | null;
  };
  grade: string | null;
  group: string | null;
  period: {
    type: string;
    start: string;
    end: string;
  };
  attendance: {
    total_lectures: number;
    present: number;
    absent: number;
    rate: number;
    list: LectureItem[];
  };
  exams: {
    list: ExamItem[];
    total: number;
    taken: number;
    average: number;
  };
  points: {
    total: number;
    weekly: number;
  };
  mistakes: {
    pending: number;
  };
  subscription: {
    is_active: boolean;
    end_date: string | null;
    days_left: number | null;
  };
}

interface SummaryData {
  student: {
    id: string;
    name: string;
  };
  date: string;
  period: string;
  teachers: TeacherSummary[];
}

export default function ParentSummaryPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SummaryData | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState<'day' | 'month'>('day');
  const [expandedTeachers, setExpandedTeachers] = useState<Set<string>>(new Set());
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('all');

  useEffect(() => {
    loadSummary();
  }, [selectedDate, period]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const response = await fetchApi(`/student/parent-summary?date=${selectedDate}&period=${period}`);
      setData(response);
    } catch (error) {
      console.error('Failed to load parent summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (teacherId: string) => {
    setExpandedTeachers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teacherId)) {
        newSet.delete(teacherId);
      } else {
        newSet.add(teacherId);
      }
      return newSet;
    });
  };

  const mockUser = {
    name: user?.name || 'الطالب',
    avatar: user?.avatar || '',
  };

  const getStatusBadge = (subscription: TeacherSummary['subscription']) => {
    if (subscription.is_active) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400">
          فعال {subscription.days_left !== null && `(${subscription.days_left} يوم)`}
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400">
        منتهي
      </span>
    );
  };

  const getAttendanceStatusIcon = (status: string) => {
    if (status === 'present') {
      return <i className="fas fa-check-circle text-green-400"></i>;
    } else if (status === 'absent') {
      return <i className="fas fa-times-circle text-red-400"></i>;
    }
    return <i className="fas fa-question-circle text-gray-400"></i>;
  };

  return (
    <DashboardLayout role="student" user={mockUser}>
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            <i className="fas fa-user-friends text-primary ml-3"></i>
            ولي الأمر
          </h1>
          <p className="text-gray-400">ملخص شامل لمستوى الطالب عبر جميع المدرسين</p>
        </div>

        {/* Filters */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm text-gray-400 mb-2">التاريخ</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm text-gray-400 mb-2">الفترة</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPeriod('day')}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                    period === 'day'
                      ? 'bg-primary text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  يومي
                </button>
                <button
                  onClick={() => setPeriod('month')}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                    period === 'month'
                      ? 'bg-primary text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  شهري
                </button>
              </div>
            </div>
            {/* Teacher Filter */}
            {data && data.teachers.length > 1 && (
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm text-gray-400 mb-2">اختر مدرسك</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => {
                    setSelectedTeacherId(e.target.value);
                    if (e.target.value !== 'all') {
                      // Scroll to the teacher card
                      setTimeout(() => {
                        const element = document.getElementById(`teacher-${e.target.value}`);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }
                  }}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary focus:outline-none"
                >
                  <option value="all" className="bg-gray-900">جميع المدرسين</option>
                  {data.teachers.map((t) => (
                    <option key={t.teacher.id} value={t.teacher.id} className="bg-gray-900">
                      {t.teacher.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {/* No Data State */}
        {!loading && (!data || data.teachers.length === 0) && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-inbox text-3xl text-gray-500"></i>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">لا توجد بيانات</h3>
            <p className="text-gray-400">لم يتم العثور على مدرسين مشتركين</p>
          </div>
        )}

        {/* Teacher Cards */}
        {!loading && data && data.teachers.length > 0 && (
          <div className="grid grid-cols-1 gap-6">
            {data.teachers
              .filter((t) => selectedTeacherId === 'all' || t.teacher.id === selectedTeacherId)
              .map((teacher) => {
              const isExpanded = expandedTeachers.has(teacher.teacher.id);
              
              return (
                <div
                  key={teacher.teacher.id}
                  id={`teacher-${teacher.teacher.id}`}
                  className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden scroll-mt-24"
                >
                  {/* Teacher Header - Always Visible */}
                  <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {teacher.teacher.avatar ? (
                        <img
                          src={teacher.teacher.avatar}
                          alt={teacher.teacher.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-primary/50"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                          <i className="fas fa-user text-xl text-primary"></i>
                        </div>
                      )}
                      <div>
                        <h2 className="text-xl font-bold text-white">{teacher.teacher.name}</h2>
                        <p className="text-sm text-gray-400">
                          {teacher.grade && <span>{teacher.grade}</span>}
                          {teacher.grade && teacher.group && <span> • </span>}
                          {teacher.group && <span>{teacher.group}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(teacher.subscription)}
                    </div>
                  </div>

                  {/* Stats Grid - Always Visible */}
                  <div className="px-6 pb-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Attendance */}
                      <div className="bg-white/5 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-white mb-1">
                          {teacher.attendance.rate}%
                        </div>
                        <div className="text-xs text-gray-400">نسبة الحضور</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {teacher.attendance.present}/{teacher.attendance.total_lectures}
                        </div>
                      </div>

                      {/* Exams Average */}
                      <div className="bg-white/5 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-white mb-1">
                          {teacher.exams.average}%
                        </div>
                        <div className="text-xs text-gray-400">متوسط الدرجات</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {teacher.exams.taken}/{teacher.exams.total}
                        </div>
                      </div>

                      {/* Points */}
                      <div className="bg-white/5 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-primary mb-1">
                          {teacher.points.total}
                        </div>
                        <div className="text-xs text-gray-400">النقاط</div>
                        <div className="text-xs text-gray-500 mt-1">
                          +{teacher.points.weekly}
                        </div>
                      </div>

                      {/* Mistakes */}
                      <div className="bg-white/5 rounded-xl p-4 text-center">
                        <div className={`text-2xl font-bold mb-1 ${
                          teacher.mistakes.pending > 0 ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {teacher.mistakes.pending}
                        </div>
                        <div className="text-xs text-gray-400">أخطاء</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {teacher.mistakes.pending === 0 ? 'ممتاز!' : 'معلقة'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expand/Collapse Button */}
                  <div className="px-6 pb-4">
                    <button
                      onClick={() => toggleExpanded(teacher.teacher.id)}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <span>{isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}</span>
                      <i className={`fas fa-chevron-down transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
                    </button>
                  </div>

                  {/* Expandable Details with Animation */}
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-6 pb-6 border-t border-white/10 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Lectures List */}
                        {teacher.attendance.list && teacher.attendance.list.length > 0 && (
                          <div>
                            <h3 className="text-lg font-bold text-white mb-3">
                              <i className="fas fa-book-open text-primary ml-2"></i>
                              المحاضرات
                            </h3>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                              {teacher.attendance.list.map((lecture) => (
                                <div
                                  key={lecture.id}
                                  className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                                >
                                  <div className="flex items-center gap-3">
                                    {getAttendanceStatusIcon(lecture.status)}
                                    <div>
                                      <div className="font-medium text-white">{lecture.title}</div>
                                      <div className="text-xs text-gray-400">{lecture.date} - {lecture.time}</div>
                                    </div>
                                  </div>
                                  <span className={`text-xs font-bold ${
                                    lecture.status === 'present' ? 'text-green-400' :
                                    lecture.status === 'absent' ? 'text-red-400' : 'text-gray-400'
                                  }`}>
                                    {lecture.status === 'present' ? 'حاضر' :
                                     lecture.status === 'absent' ? 'غائب' : 'غير مسجل'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Exams List */}
                        {teacher.exams.list && teacher.exams.list.length > 0 && (
                          <div>
                            <h3 className="text-lg font-bold text-white mb-3">
                              <i className="fas fa-file-alt text-primary ml-2"></i>
                              الامتحانات
                            </h3>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                              {teacher.exams.list.map((exam) => (
                                <div
                                  key={exam.id}
                                  className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                                >
                                  <div>
                                    <div className="font-medium text-white">{exam.title}</div>
                                    <div className="text-xs text-gray-400">{exam.date}</div>
                                  </div>
                                  <div className="text-left">
                                    {exam.score !== null ? (
                                      <>
                                        <div className={`font-bold ${
                                          (exam.percentage ?? 0) >= 50 ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                          {exam.score}/{exam.max_score}
                                        </div>
                                        <div className="text-xs text-gray-400">{exam.percentage}%</div>
                                      </>
                                    ) : (
                                      <span className="text-gray-500 text-sm">لم يُمتحن</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

