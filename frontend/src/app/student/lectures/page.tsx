'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { fetchApi } from '@/services/authService';
import { Skeleton, Button, Icon } from '@/components/ui/index';
import { Lecture, markStudentAttendance } from '@/services/lectureService';
import QRScannerModal from '@/components/dashboard/QRScannerModal';
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
  
  // Scanner State
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [selectedLectureForScan, setSelectedLectureForScan] = useState<Lecture | null>(null);

  const handleScanSuccess = async (decodedText: string) => {
    if (!selectedLectureForScan) return;

    try {
      // Extract token if decodedText is a URL
      let token = decodedText;
      try {
        const url = new URL(decodedText);
        const tokenParam = url.searchParams.get('token');
        if (tokenParam) {
          token = tokenParam;
        }
      } catch (e) {
        // Not a URL, treat as raw token
      }

      const response = await markStudentAttendance(token);
      toast.success(`تم تسجيل الحضور بنجاح في محاضرة: ${response.lecture}`);
      
      // Update local attendance state to reflect change immediately
      if (selectedLectureForScan) {
        setAttendance(prev => [...prev, {
          id: Date.now().toString(), // Temporary ID
          lecture_id: selectedLectureForScan.id,
          status: 'present',
          created_at: new Date().toISOString(),
          lecture: selectedLectureForScan
        }]);
      }

      setShowScannerModal(false);
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
    <DashboardLayout
      role="student"
      user={user || undefined}
    >
        
        {/* Consolidated Stats Grid */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-8">
          <StatCard
            title="نسبة الحضور"
            value={attendanceRate}
            suffix="%"
            icon="fas fa-user-check"
            color="success"
            variant="centered"
          />
          <StatCard
            title="تم حضورها"
            value={presentCount}
            icon="fas fa-check"
            color="primary"
            variant="centered"
          />
          <StatCard
            title="غياب"
            value={absentCount}
            icon="fas fa-times"
            color="danger"
            variant="centered"
          />
          <StatCard
            title="اجمالي المحاضرات"
            value={lectures.length}
            icon="fas fa-book-open"
            color="info"
            variant="centered"
          />
        </div>

        {/* Active Lectures Section */}
        {activeLectures.length > 0 && (
          <div className="bg-[#1e1e2d] rounded-xl shadow-lg mb-8 border-2 border-success bg-success/5">
            <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon name="broadcast-tower" className="text-success text-xl" />
                <h2 className="text-xl font-bold text-success m-0">محاضرات جارية الآن</h2>
              </div>
            </div>
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
              {activeLectures.map((lecture) => {
                const isAttended = attendance.some(a => a.lecture_id === lecture.id && (a.status === 'present' || a.status === 'late'));
                const lectureTitle = lecture.display_title || lecture.title;
                const lectureDescription = lecture.display_description ?? lecture.description;
                
                return (
                <div
                  key={lecture.id}
                  className="p-5 bg-white/5 rounded-xl border border-success"
                >
                  <h3 className="text-[1.05rem] font-bold text-white mb-2">
                    {lectureTitle}
                  </h3>
                  <p className="text-[0.85rem] text-gray-light mb-3">
                    {lectureDescription}
                  </p>
                  <div className="grid gap-3 mb-4">
                    <div className="flex items-center gap-2 text-[0.9rem] text-light">
                      <Icon name="clock" className="w-5 text-primary" />
                      <span>{lecture.time} ({lecture.duration} دقيقة)</span>
                    </div>
                  </div>

                  {isAttended ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full cursor-default bg-success/10 border-success text-success"
                      disabled
                    >
                      <Icon name="check-circle" className="ml-2" />
                      <span>تم التسجيل</span>
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setSelectedLectureForScan(lecture);
                        setShowScannerModal(true);
                      }}
                    >
                      <Icon name="qrcode" className="ml-2" />
                      <span>تسجيل حضور (Scan QR)</span>
                    </Button>
                  )}
                </div>
              )})}
              </div>
            </div>
          </div>
        )}

        {/* Other Lectures Grid */}
        <DashboardCard
          title="كل المحاضرات"
          icon="fas fa-calendar-alt"
        >
          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-5 bg-white/5 rounded-xl border border-white/10"
                >
                  <Skeleton width="60%" height="24px" className="mb-3" />
                  <Skeleton width="100%" height="16px" className="mb-2" />
                  <Skeleton width="80%" height="16px" className="mb-4" />
                </div>
              ))
            ) : (
              otherLectures.map((lecture) => {
                const isFinished = lecture.iso_end_time ? new Date(lecture.iso_end_time) < now : false;
                const isAttended = attendance.some(a => a.lecture_id === lecture.id && (a.status === 'present' || a.status === 'late'));
                const lectureTitle = lecture.display_title || lecture.title;
                const lectureDescription = lecture.display_description ?? lecture.description;
                
                let badgeClass = 'badge-warning';
                let badgeText = 'قادمة';

                if (isFinished) {
                  if (isAttended) {
                    badgeClass = 'bg-success/10 text-success border-success/20';
                    badgeText = 'تم الحضور';
                  } else {
                    badgeClass = 'bg-red-500/10 text-red-400 border-red-500/20';
                    badgeText = 'غائب';
                  }
                }

                return (
                <div
                  key={lecture.id}
                  className={`p-5 bg-white/5 rounded-xl border border-white/10 ${
                    isFinished 
                      ? (isAttended ? 'border-r-success' : 'border-r-danger')
                      : 'border-r-primary'
                  } border-r-4`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-[1.05rem] font-bold text-white">
                      {lectureTitle}
                    </h3>
                    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${badgeClass}`}>
                      {badgeText}
                    </span>
                  </div>
                  <p className="text-[0.85rem] text-gray-light mb-3">
                    {lectureDescription}
                  </p>
                  <div className="grid gap-3 mb-4">
                    <div className="flex items-center gap-2 text-[0.9rem] text-light">
                      <Icon name="calendar" className="w-5 text-primary" />
                      <span>{lecture.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[0.9rem] text-light">
                      <Icon name="clock" className="w-5 text-primary" />
                      <span>{lecture.time} ({lecture.duration} دقيقة)</span>
                    </div>
                  </div>
                </div>
                );
              })
            )}
            {!loading && otherLectures.length === 0 && (
              <div className="col-span-full text-center p-10 text-gray-light">
                لا توجد محاضرات أخرى
              </div>
            )}
          </div>
        </DashboardCard>

     
      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onScanSuccess={handleScanSuccess}
        lectureTitle={(selectedLectureForScan as ExtendedLecture | null)?.display_title || selectedLectureForScan?.title || ''}
        instructions="وجه الكاميرا نحو رمز QR الخاص بالمحاضرة لتسجيل الحضور"
      />
    </DashboardLayout>
  );
}
