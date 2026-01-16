import React from 'react';
import { Lecture } from '@/services/lectureService';

interface LectureCardProps {
  lecture: Lecture;
  isMenuOpen: boolean;
  onMenuToggle: (e: React.MouseEvent) => void;
  onViewAttendees: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onActivate: () => void;
  onScan: () => void;
  onQRCode: () => void;
  onEnd: () => void;
  onManualAttendance: () => void;
  onCancelSession?: () => void;
  onManageSessions?: () => void;
}

export const LectureCard: React.FC<LectureCardProps> = ({
  lecture,
  isMenuOpen,
  onMenuToggle,
  onViewAttendees,
  onEdit,
  onCopy,
  onDelete,
  onActivate,
  onScan,
  onQRCode,
  onEnd,
  onManualAttendance,
  onCancelSession,
  onManageSessions,
}) => {
  const isActive = lecture.is_active;
  const [timeLeft, setTimeLeft] = React.useState<string>('');

  React.useEffect(() => {
    if (!isActive || !lecture.current_session_end_time) {
      setTimeLeft('');
      return;
    }

    const calculateTimeLeft = () => {
      if (!isActive || !lecture.current_session_end_time) {
        setTimeLeft('');
        return;
      }

      const end = new Date(lecture.current_session_end_time!).getTime();
      const now = new Date().getTime();
      const difference = end - now;

      if (difference <= 0) {
        setTimeLeft('00:00:00');
        return;
      }

      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [isActive, lecture.current_session_end_time]);

  return (
    <div 
      className={`relative rounded-2xl p-6 transition-all duration-500 ease-in-out flex flex-col ${isMenuOpen ? 'z-10' : ''} ${
        isActive 
          ? 'bg-[#101426]/15 border-2 border-primary shadow-[0_0_30px_rgba(66,99,235,0.3)]' 
          : 'bg-[#101426]/15 border border-white/10 hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:-translate-y-[1px] hover:backdrop-blur-[20px] hover:border-[#1bc5f8]/50'
      }`}
    >
      {/* Top Section: Menu and Status */}
      <div className="flex justify-between items-start mb-6">
        {/* Status Badge */}
        <div className="flex gap-2 flex-wrap">
          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
            lecture.status === 'جاري الآن' ? 'bg-[#2ecc71]/20 text-[#2ecc71] border border-[#2ecc71]/30' : 
            lecture.status === 'اليوم' ? 'bg-[#f39c12]/20 text-[#f39c12] border border-[#f39c12]/30' : 
            lecture.status === 'منتهية' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' : 
            'bg-primary/20 text-primary border border-primary/30'
          }`}>
            {lecture.status}
          </span>

          {lecture.teacher && (
            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
              <i className="fas fa-chalkboard-teacher text-[10px]"></i>
              {lecture.teacher.name}
            </span>
          )}
          
          {isActive && timeLeft && (
            <span className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
              {timeLeft}
            </span>
          )}
        </div>

        {/* Three-dot Menu */}
        <div className="relative">
          <button 
            className="w-10 h-10 rounded-xl bg-[rgba(16,20,38,0.8)] hover:bg-[rgba(66,99,235,0.2)] border border-white/10 hover:border-primary/50 flex items-center justify-center transition-all"
            onClick={onMenuToggle}
          >
            <i className="fas fa-ellipsis-v text-white"></i>
          </button>
          
          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="actions-menu show" style={{ minWidth: '200px', left: '0', right: 'auto', position: 'absolute', top: '100%', marginTop: '8px' }}>
              <button
                className="actions-menu-item w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewAttendees();
                }}
              >
                <i className="fas fa-clipboard-list"></i>
                <span>سجل الحضور</span>
              </button>
              
              {isActive && (
                <button
                  className="actions-menu-item w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onManualAttendance();
                  }}
                >
                  <i className="fas fa-user-check"></i>
                  <span>حضور يدوي</span>
                </button>
              )}

              <button
                className="actions-menu-item w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <i className="fas fa-edit"></i>
                <span>تعديل</span>
              </button>
              <button
                className="actions-menu-item w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy();
                }}
              >
                <i className="fas fa-copy"></i>
                <span>نسخ المحاضرة</span>
              </button>
              <button
                className="actions-menu-item danger w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <i className="fas fa-trash"></i>
                <span>حذف</span>
              </button>

              {lecture.is_recurring && (
                <button
                  className="actions-menu-item w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onManageSessions?.();
                  }}
                >
                  <i className="fas fa-calendar-alt"></i>
                  <span>إدارة الجلسات</span>
                </button>
              )}

              {lecture.is_recurring && !isActive && lecture.status !== 'منتهية' && (
                <button
                  className="actions-menu-item danger w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancelSession?.();
                  }}
                >
                  <i className="fas fa-ban"></i>
                  <span>إلغاء محاضرة اليوم</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-white mb-3 leading-tight">
        {lecture.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-light/80 mb-6 line-clamp-2 min-h-[40px]">
        {lecture.current_session?.description || lecture.description || 'New topic'}
      </p>

      {/* Lecture Info */}
      <div className="grid gap-3.5 mb-6">
        <div className="flex items-center gap-3 text-sm text-gray-light">
          <i className="fas fa-calendar w-5 text-primary text-base"></i>
          {lecture.is_recurring && lecture.recurrence_days && lecture.recurrence_days.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {lecture.recurrence_days.map((day, index) => {
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
                  <div key={day} className="flex items-center">
                    {index > 0 && <span className="mx-1 text-gray-500">-</span>}
                    <span className="text-sm">
                      {dayLabels[day] || day}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <span>{lecture.date}</span>
          )}
        </div>
        {lecture.teacher && (
          <div className="flex items-center gap-3 text-sm text-gray-light">
            <i className="fas fa-user-tie w-5 text-primary text-base"></i>
            <span>{lecture.teacher.name}</span>
          </div>
        )}
        {lecture.grade && (
          <div className="flex items-center gap-3 text-sm text-gray-light">
            <i className="fas fa-graduation-cap w-5 text-primary text-base"></i>
            <span>{lecture.grade.name}</span>
          </div>
        )}
        {lecture.group && (
          <div className="flex items-center gap-3 text-sm text-gray-light">
            <i className="fas fa-users w-5 text-primary text-base"></i>
            <span>{lecture.group.name}</span>
          </div>
        )}
        <div className="flex items-center gap-3 text-sm text-gray-light">
          <i className="fas fa-clock w-5 text-primary text-base"></i>
          <span>{lecture.time} ({lecture.duration})</span>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-light">
          <i className="fas fa-user-check w-5 text-primary text-base"></i>
          <span>{lecture.enrolled} طالب مسجل</span>
        </div>
      </div>

      {/* Action Buttons */}
      {lecture.status !== 'منتهية' && (
        <div className="mt-auto grid gap-3">
          {!isActive ? (
            <div className="flex items-center gap-3">
              <button 
                className="flex-1 py-3 rounded-xl text-gray-light hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2" 
                onClick={(e) => {
                  e.stopPropagation();
                  onActivate();
                }}
              >
                <i className="fas fa-power-off"></i>
                <span>تفعيل المحاضرة</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                className="flex-1 py-3 rounded-xl bg-[rgba(66,99,235,0.15)] hover:bg-[rgba(66,99,235,0.25)] text-primary border border-primary/30 hover:border-primary/50 font-medium text-xs flex flex-col items-center justify-center gap-1.5 transition-all" 
                onClick={onScan}
              >
                <i className="fas fa-qrcode text-sm"></i>
                <span>مسح QR</span>
              </button>
              <button 
                className="flex-1 py-3 rounded-xl bg-[rgba(66,99,235,0.15)] hover:bg-[rgba(66,99,235,0.25)] text-primary border border-primary/30 hover:border-primary/50 font-medium text-xs flex flex-col items-center justify-center gap-1.5 transition-all" 
                onClick={onQRCode}
              >
                <i className="fas fa-qrcode text-sm"></i>
                <span>QR Code</span>
              </button>
              <button 
                className="flex-1 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 hover:border-red-500/50 font-medium text-xs flex flex-col items-center justify-center gap-1.5 transition-all" 
                onClick={onEnd}
              >
                <i className="fas fa-stop-circle text-sm"></i>
                <span>إنهاء</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
