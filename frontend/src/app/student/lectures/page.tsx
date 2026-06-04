'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { fetchApi } from '@/services/authService';
import { Skeleton, Button, Icon } from '@/components/ui/index';
import { Lecture, markStudentAttendance } from '@/services/lectureService';
import { CodeEntryModal } from '@/components/dashboard';
import toast from 'react-hot-toast';

// Extend Lecture type to include iso properties if they are missing in the base type
interface ExtendedLecture extends Lecture {
  iso_start_time?: string;
  iso_end_time?: string;
  display_title?: string;
  display_description?: string | null;
}

export default function StudentLecturesPage() {
  const { user, selectedTeacher } = useAuth();
  const [lectures, setLectures] = useState<ExtendedLecture[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Code Entry State
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [selectedLectureForCode, setSelectedLectureForCode] = useState<Lecture | null>(null);

  const handleCodeSubmit = async (code: string) => {
    if (!selectedLectureForCode) return;

    try {
      const response = await markStudentAttendance(code);
      toast.success(`تم تسجيل الحضور بنجاح في محاضرة: ${response.lecture}`);
      
      // Update local attendance state to reflect change immediately
      setAttendance(prev => [...prev, {
        id: Date.now().toString(), // Temporary ID
        lecture_id: selectedLectureForCode.id,
        status: 'present',
        created_at: new Date().toISOString(),
        lecture: selectedLectureForCode
      }]);

      setShowCodeModal(false);
    } catch (error: any) {
      console.error('Failed to record attendance:', error);
      toast.error(error.message || 'فشل تسجيل الحضور');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!selectedTeacher) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const [lecturesRes, attendanceRes] = await Promise.all([
          fetchApi<{ data: ExtendedLecture[] }>(`/student/lectures?teacher_id=${selectedTeacher.teacher_id}`),
          fetchApi<{ data: any[] }>(`/student/attendance?teacher_id=${selectedTeacher.teacher_id}`)
        ]);
        
        setLectures(lecturesRes.data || []);
        setAttendance(attendanceRes.data || []);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedTeacher]);

  const now = new Date();
  
  // Filter Lectures
  const activeLectures = lectures.filter(l => l.is_active);
  const otherLectures = lectures.filter(l => !l.is_active);

  // Attendance Stats
  // Attendance Stats
  const presentCount = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
  
  // Calculate absent count based on finished lectures that are NOT attended
  const absentCount = lectures.filter(lecture => {
    const isFinished = lecture.iso_end_time ? new Date(lecture.iso_end_time) < now : false;
    const isAttended = attendance.some(a => a.lecture_id === lecture.id && (a.status === 'present' || a.status === 'late'));
    return isFinished && !isAttended;
  }).length;

  // Total finished lectures (for rate calculation)
  const totalFinishedLectures = lectures.filter(l => l.iso_end_time && new Date(l.iso_end_time) < now).length;
  
  const attendanceRate = totalFinishedLectures > 0 ? Math.round((presentCount / totalFinishedLectures) * 100) : 0;

  return (
    <DashboardLayout role="student" user={user || undefined}>
      {/* Page Header */}
      <div className="relative mb-12 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] premium-glass premium-border overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 blur-[120px] -translate-y-1/2 translate-x-1/3 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 blur-[120px] translate-y-1/2 -translate-x-1/3"></div>

        <div className="relative flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-right">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-primary text-4xl shadow-2xl premium-border">
              <Icon name="video" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">قاعة المحاضرات</h2>
              <p className="text-gray-light/60 text-lg font-medium">تابع حصصك الأسبوعية وقم بتسجيل حضورك بكل سهولة</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-center md:items-end">
                <span className="text-[10px] font-black text-gray-light/30 uppercase tracking-[0.2em] mb-1">المعلم الحالي</span>
                <span className="text-xl font-black text-white">{selectedTeacher?.teacher_name || (selectedTeacher as any)?.name || 'اختر مدرساً'}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-10">
        <StatCard
          title="نسبة الحضور"
          value={attendanceRate}
          suffix="%"
          icon="fas fa-chart-line"
          color="success"
          variant="centered"
        />
        <StatCard
          title="تم حضورها"
          value={presentCount}
          icon="fas fa-check-double"
          color="primary"
          variant="centered"
        />
        <StatCard
          title="عدد الغياب"
          value={absentCount}
          icon="fas fa-times-circle"
          color="danger"
          variant="centered"
        />
        <StatCard
          title="إجمالي المحاضرات"
          value={lectures.length}
          icon="fas fa-book-open"
          color="info"
          variant="centered"
        />
      </div>

      {/* Active Lectures Section */}
      {activeLectures.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-3 px-6 mb-6">
             <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
             <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em]">بث مباشر - جاري الآن</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeLectures.map((lecture) => {
              const isAttended = attendance.some(a => a.lecture_id === lecture.id && (a.status === 'present' || a.status === 'late'));
              return (
                <div key={lecture.id} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 to-primary/20 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative premium-glass p-8 rounded-[2.5rem] border-rose-500/30 bg-rose-500/[0.02] flex flex-col h-full border-2">
                    <div className="flex justify-between items-start mb-6">
                      <div className="px-4 py-1.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest animate-pulse">LIVE</div>
                      <div className="flex items-center gap-2 text-gray-light/40">
                         <Icon name="clock" size="sm" />
                         <span className="text-xs font-bold">{lecture.duration} دقيقة</span>
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-3 group-hover:text-rose-500 transition-colors">{lecture.display_title || lecture.title}</h3>
                    <p className="text-gray-light/40 text-sm font-medium mb-8 line-clamp-2">{lecture.display_description ?? lecture.description}</p>
                    
                    <div className="mt-auto">
                      {isAttended ? (
                        <div className="w-full h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center gap-3 text-emerald-500 font-black">
                           <Icon name="check-circle" />
                           <span>تم تسجيل الحضور بنجاح</span>
                        </div>
                      ) : (
                        <Button 
                          onClick={() => { setSelectedLectureForCode(lecture); setShowCodeModal(true); }}
                          className="w-full h-14 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black shadow-xl shadow-rose-500/20 gap-3"
                        >
                          <Icon name="dialpad" />
                          <span>تسجيل الحضور</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Lectures Section */}
      <div>
        <div className="flex items-center gap-3 px-6 mb-8">
           <Icon name="calendar-alt" className="text-primary" />
           <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">سجل المحاضرات</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 rounded-[2rem] bg-white/5 border border-white/5 animate-pulse" />
            ))
          ) : (
            otherLectures.map((lecture) => {
              const isFinished = lecture.iso_end_time ? new Date(lecture.iso_end_time) < now : false;
              const isAttended = attendance.some(a => a.lecture_id === lecture.id && (a.status === 'present' || a.status === 'late'));
              
              let statusColor = 'text-primary';
              let statusBg = 'bg-primary/5';
              let statusBorder = 'border-primary/20';
              let statusText = 'قادمة';

              if (isFinished) {
                if (isAttended) {
                  statusColor = 'text-emerald-500';
                  statusBg = 'bg-emerald-500/10';
                  statusBorder = 'border-emerald-500/20';
                  statusText = 'تم الحضور';
                } else {
                  statusColor = 'text-rose-500';
                  statusBg = 'bg-rose-500/10';
                  statusBorder = 'border-rose-500/20';
                  statusText = 'غائب';
                }
              }

              return (
                <div key={lecture.id} className="premium-glass p-7 rounded-[2rem] border-white/5 group hover:border-white/10 transition-all flex flex-col h-full relative overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                     <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${statusColor} ${statusBg} ${statusBorder}`}>
                        {statusText}
                     </div>
                     <div className="flex items-center gap-2 text-gray-light/20">
                        <Icon name="clock" size="xs" />
                        <span className="text-[10px] font-bold">{lecture.duration}د</span>
                     </div>
                  </div>

                  <h4 className="text-white font-bold text-lg mb-3 line-clamp-1 group-hover:text-primary transition-colors">{lecture.display_title || lecture.title}</h4>
                  <p className="text-gray-light/30 text-xs font-medium mb-6 line-clamp-2 leading-relaxed">{lecture.display_description ?? lecture.description}</p>
                  
                  <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-primary">
                           <Icon name="calendar-day" size="xs" />
                        </div>
                        <span className="text-xs font-black text-white">{lecture.date}</span>
                     </div>
                     <span className="text-[11px] font-bold text-gray-light/40">{lecture.time}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {!loading && otherLectures.length === 0 && (
          <div className="premium-glass py-20 rounded-[3rem] border-white/5 text-center flex flex-col items-center justify-center">
             <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-light/20 mb-4">
                <Icon name="calendar-times" size="xl" />
             </div>
             <p className="text-gray-light/40 font-medium">لا توجد محاضرات في السجل حالياً</p>
          </div>
        )}
      </div>

      <CodeEntryModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        onSubmit={handleCodeSubmit}
        lectureTitle={(selectedLectureForCode as ExtendedLecture | null)?.display_title || selectedLectureForCode?.title || ''}
      />
    </DashboardLayout>
  );
}
