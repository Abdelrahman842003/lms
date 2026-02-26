import React from 'react';
import { Lecture } from '@/services/lectureService';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';

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

  const getStatusVariant = () => {
    if (lecture.status === 'جاري الآن') return 'success';
    if (lecture.status === 'اليوم') return 'warning';
    if (lecture.status === 'منتهية') return 'secondary';
    return 'primary';
  };

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
          <Badge variant={getStatusVariant()} size="sm">
            {lecture.status}
          </Badge>

          {lecture.teacher && (
            <Badge variant="info" size="sm" icon="chalkboard-teacher">
              {lecture.teacher.name}
            </Badge>
          )}
          
          {isActive && timeLeft && (
            <Badge variant="danger" size="sm" pulse>
              {timeLeft}
            </Badge>
          )}
        </div>

        {/* Three-dot Menu */}
        <div className="relative">
          <Button 
            variant="ghost"
            size="sm"
            className="w-10 h-10 rounded-xl bg-[rgba(16,20,38,0.8)] hover:bg-[rgba(66,99,235,0.2)] border border-white/10 hover:border-primary/50 flex items-center justify-center transition-all p-0"
            onClick={onMenuToggle}
          >
            <Icon name="ellipsis-v" color="inherit" />
          </Button>
          
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
                <Icon name="clipboard-list" size="sm" />
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
                  <Icon name="user-check" size="sm" />
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
                <Icon name="edit" size="sm" />
                <span>تعديل</span>
              </button>
              <button
                className="actions-menu-item w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy();
                }}
              >
                <Icon name="copy" size="sm" />
                <span>نسخ المحاضرة</span>
              </button>
              <button
                className="actions-menu-item danger w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Icon name="trash" size="sm" />
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
                  <Icon name="calendar-alt" size="sm" />
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
                  <Icon name="ban" size="sm" />
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
          <Icon name="calendar" className="w-5 text-primary text-base" />
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
            <Icon name="user-tie" className="w-5 text-primary text-base" />
            <span>{lecture.teacher.name}</span>
          </div>
        )}
        {lecture.grade && (
          <div className="flex items-center gap-3 text-sm text-gray-light">
            <Icon name="graduation-cap" className="w-5 text-primary text-base" />
            <span>{lecture.grade.name}</span>
          </div>
        )}
        {lecture.group && (
          <div className="flex items-center gap-3 text-sm text-gray-light">
            <Icon name="users" className="w-5 text-primary text-base" />
            <span>{lecture.group.name}</span>
          </div>
        )}
        <div className="flex items-center gap-3 text-sm text-gray-light">
          <Icon name="clock" className="w-5 text-primary text-base" />
          <span>{lecture.time} ({lecture.duration})</span>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-light">
          <Icon name="user-check" className="w-5 text-primary text-base" />
          <span>{lecture.enrolled} طالب مسجل</span>
        </div>
      </div>

      {/* Action Buttons */}
      {lecture.status !== 'منتهية' && (
        <div className="mt-auto grid gap-3">
          {!isActive ? (
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost"
                className="flex-1 py-3 rounded-xl text-gray-light hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onActivate();
                }}
              >
                <Icon name="power-off" size="sm" />
                <span>تفعيل المحاضرة</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                className="flex-1 py-3 rounded-xl bg-[rgba(66,99,235,0.15)] hover:bg-[rgba(66,99,235,0.25)] text-primary border-primary/30 hover:border-primary/50 font-medium text-xs flex flex-col items-center justify-center gap-1.5 transition-all h-auto"
                onClick={onScan}
              >
                <Icon name="qrcode" size="sm" />
                <span>مسح QR</span>
              </Button>
              <Button 
                variant="outline"
                className="flex-1 py-3 rounded-xl bg-[rgba(66,99,235,0.15)] hover:bg-[rgba(66,99,235,0.25)] text-primary border-primary/30 hover:border-primary/50 font-medium text-xs flex flex-col items-center justify-center gap-1.5 transition-all h-auto"
                onClick={onQRCode}
              >
                <Icon name="qrcode" size="sm" />
                <span>QR Code</span>
              </Button>
              <Button 
                variant="destructive"
                className="flex-1 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/30 hover:border-red-500/50 font-medium text-xs flex flex-col items-center justify-center gap-1.5 transition-all h-auto"
                onClick={onEnd}
              >
                <Icon name="stop-circle" size="sm" />
                <span>إنهاء</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
