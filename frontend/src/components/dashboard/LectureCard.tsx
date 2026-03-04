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
      className={`ux-relative ux-rounded-2xl ux-p-6 ux-transition-all ux-duration-500 ux-ease-in-out ux-flex ux-flex-col ${isMenuOpen ? 'ux-z-10' : ''} ${
        isActive
          ? 'ux-bg-101426-15 ux-border-2 ux-border-primary ux-shadow-0-0-30px-rgba-66-99-235-0dot3'
          : 'ux-bg-101426-15 ux-border ux-border-white-10 ux-hover-shadow-0-12px-40px-rgba-0-0-0-0dot3 ux-hover-translate-y-1px ux-hover-backdrop-blur-20px ux-hover-border-1bc5f8-50'
      }`}
    >
      {/* Top Section: Menu and Status */}
      <div className="ux-flex ux-justify-between ux-items-start ux-mb-6">
        {/* Status Badge */}
        <div className="ux-flex ux-gap-2 ux-flex-wrap">
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
        <div className="ux-relative">
          <Button 
            variant="ghost"
            size="sm"
            className="ux-w-10 ux-h-10 ux-rounded-xl ux-bg-rgba-16-20-38-0dot8 ux-hover-bg-rgba-66-99-235-0dot2 ux-border ux-border-white-10 ux-hover-border-primary-50 ux-flex ux-items-center ux-justify-center ux-transition-all ux-p-0"
            onClick={onMenuToggle}
          >
            <Icon name="ellipsis-v" color="inherit" />
          </Button>
          
          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="actions-menu show actions-menu-card">
              <button
                className="actions-menu-item ux-w-full"
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
                  className="actions-menu-item ux-w-full"
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
                className="actions-menu-item ux-w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Icon name="edit" size="sm" />
                <span>تعديل</span>
              </button>
              <button
                className="actions-menu-item ux-w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy();
                }}
              >
                <Icon name="copy" size="sm" />
                <span>نسخ المحاضرة</span>
              </button>
              <button
                className="actions-menu-item danger ux-w-full"
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
                  className="actions-menu-item ux-w-full"
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
                  className="actions-menu-item danger ux-w-full"
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
      <h3 className="ux-text-2xl ux-font-bold ux-text-white ux-mb-3 ux-leading-tight">
        {lecture.title}
      </h3>

      {/* Description */}
      <p className="ux-text-sm text-gray-light/80 ux-mb-6 ux-line-clamp-2 ux-min-h-40px">
        {lecture.current_session?.description || lecture.description || 'New topic'}
      </p>

      {/* Lecture Info */}
      <div className="ux-grid ux-gap-3dot5 ux-mb-6">
        <div className="ux-flex ux-items-center ux-gap-3 ux-text-sm ux-text-gray-light">
          <Icon name="calendar" className="ux-w-5 ux-text-primary ux-text-base" />
          {lecture.is_recurring && lecture.recurrence_days && lecture.recurrence_days.length > 0 ? (
            <div className="ux-flex ux-flex-wrap ux-gap-1">
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
                  <div key={day} className="ux-flex ux-items-center">
                    {index > 0 && <span className="ux-mx-1 ux-text-gray-500">-</span>}
                    <span className="ux-text-sm">
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
          <div className="ux-flex ux-items-center ux-gap-3 ux-text-sm ux-text-gray-light">
            <Icon name="user-tie" className="ux-w-5 ux-text-primary ux-text-base" />
            <span>{lecture.teacher.name}</span>
          </div>
        )}
        {lecture.grade && (
          <div className="ux-flex ux-items-center ux-gap-3 ux-text-sm ux-text-gray-light">
            <Icon name="graduation-cap" className="ux-w-5 ux-text-primary ux-text-base" />
            <span>{lecture.grade.name}</span>
          </div>
        )}
        {lecture.group && (
          <div className="ux-flex ux-items-center ux-gap-3 ux-text-sm ux-text-gray-light">
            <Icon name="users" className="ux-w-5 ux-text-primary ux-text-base" />
            <span>{lecture.group.name}</span>
          </div>
        )}
        <div className="ux-flex ux-items-center ux-gap-3 ux-text-sm ux-text-gray-light">
          <Icon name="clock" className="ux-w-5 ux-text-primary ux-text-base" />
          <span>{lecture.time} ({lecture.duration})</span>
        </div>

        <div className="ux-flex ux-items-center ux-gap-3 ux-text-sm ux-text-gray-light">
          <Icon name="user-check" className="ux-w-5 ux-text-primary ux-text-base" />
          <span>{lecture.enrolled} طالب مسجل</span>
        </div>
      </div>

      {/* Action Buttons */}
      {lecture.status !== 'منتهية' && (
        <div className="ux-mt-auto ux-grid ux-gap-3">
          {!isActive ? (
            <div className="ux-flex ux-items-center ux-gap-3">
              <Button 
                variant="ghost"
                className="ux-flex-1 ux-py-3 ux-rounded-xl ux-text-gray-light ux-hover-text-white ux-hover-bg-white-5 ux-transition-all ux-flex ux-items-center ux-justify-center ux-gap-2"
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
            <div className="ux-flex ux-items-center ux-gap-2">
              <Button 
                variant="outline"
                className="ux-flex-1 ux-py-3 ux-rounded-xl ux-bg-rgba-66-99-235-0dot15 ux-hover-bg-rgba-66-99-235-0dot25 ux-text-primary ux-border-primary-30 ux-hover-border-primary-50 ux-font-medium ux-text-xs ux-flex ux-flex-col ux-items-center ux-justify-center ux-gap-1dot5 ux-transition-all ux-h-auto"
                onClick={onScan}
              >
                <Icon name="qrcode" size="sm" />
                <span>مسح QR</span>
              </Button>
              <Button 
                variant="outline"
                className="ux-flex-1 ux-py-3 ux-rounded-xl ux-bg-rgba-66-99-235-0dot15 ux-hover-bg-rgba-66-99-235-0dot25 ux-text-primary ux-border-primary-30 ux-hover-border-primary-50 ux-font-medium ux-text-xs ux-flex ux-flex-col ux-items-center ux-justify-center ux-gap-1dot5 ux-transition-all ux-h-auto"
                onClick={onQRCode}
              >
                <Icon name="qrcode" size="sm" />
                <span>QR Code</span>
              </Button>
              <Button 
                variant="destructive"
                className="ux-flex-1 ux-py-3 ux-rounded-xl ux-bg-red-500-10 ux-hover-bg-red-500-20 ux-text-red-500 ux-border-red-500-30 ux-hover-border-red-500-50 ux-font-medium ux-text-xs ux-flex ux-flex-col ux-items-center ux-justify-center ux-gap-1dot5 ux-transition-all ux-h-auto"
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
