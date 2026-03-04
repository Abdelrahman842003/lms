import React from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';

interface Exam {
  id: number | string;
  title: string;
  subject: string;
  grade?: { id: string; name: string };
  group?: { id: string; name: string };
  teacher?: { id: string; name: string };
  date: string;
  duration: number;
  max_score: number;
  is_active: boolean;
  activated_at?: string | null;
  ended_at?: string | null;
  attended_students?: Array<{
    student_id: string;
    student_name: string;
    score: number;
    percentage: number;
  }>;
}

interface ExamCardProps {
  exam: Exam;
  isMenuOpen: boolean;
  onMenuToggle: (e: React.MouseEvent) => void;
  onViewDetails: () => void;
  onViewResults: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onEnd: () => void;
}

export const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  isMenuOpen,
  onMenuToggle,
  onViewDetails,
  onViewResults,
  onEdit,
  onCopy,
  onDelete,
  onToggleStatus,
  onEnd,
}) => {
  const isActive = exam.is_active;
  const isEnded = !!exam.ended_at;
  const examDate = new Date(exam.date);
  const now = new Date();
  const isUpcoming = examDate > now && !isActive && !isEnded;
  
  const [timeLeft, setTimeLeft] = React.useState<string>('');

  // Calculate time remaining for active exams
  React.useEffect(() => {
    if (!isActive || !exam.activated_at) {
      setTimeLeft('');
      return;
    }

    const calculateTimeLeft = () => {
      if (!isActive || !exam.activated_at) {
        setTimeLeft('');
        return;
      }

      const activatedAt = new Date(exam.activated_at).getTime();
      const endTime = activatedAt + (exam.duration * 60 * 1000); // duration in minutes
      const now = new Date().getTime();
      const difference = endTime - now;

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
  }, [isActive, exam.activated_at, exam.duration]);

  // Get status badge variant
  const getStatusVariant = () => {
    if (isEnded) return 'secondary';
    if (isActive) return 'success';
    if (isUpcoming) return 'primary';
    return 'warning';
  };

  const getStatusText = () => {
    if (isEnded) return 'منتهي';
    if (isActive) return 'نشط الآن';
    if (isUpcoming) return 'قادم';
    return 'غير نشط';
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
            {getStatusText()}
          </Badge>

          {exam.teacher && (
            <Badge variant="info" size="sm" icon="chalkboard-teacher">
              {exam.teacher.name}
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
                  onViewDetails();
                }}
              >
                <Icon name="eye" size="sm" />
                <span>عرض التفاصيل</span>
              </button>
              
              <button
                className="actions-menu-item ux-w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewResults();
                }}
              >
                <Icon name="chart-bar" size="sm" />
                <span>نتائج الطلاب</span>
              </button>

              {!isEnded && (
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
              )}
              
              <button
                className="actions-menu-item ux-w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy();
                }}
              >
                <Icon name="copy" size="sm" />
                <span>نسخ الامتحان</span>
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
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="ux-text-2xl ux-font-bold ux-text-white ux-mb-3 ux-leading-tight">
        {exam.title}
      </h3>

      {/* Subject */}
      <p className="ux-text-sm text-gray-light/80 ux-mb-6 ux-line-clamp-2 ux-min-h-40px">
        {exam.subject || 'مادة الامتحان'}
      </p>

      {/* Exam Info */}
      <div className="ux-grid ux-gap-3dot5 ux-mb-6">
        <div className="ux-flex ux-items-center ux-gap-3 ux-text-sm ux-text-gray-light">
          <Icon name="calendar" className="ux-w-5 ux-text-primary ux-text-base" />
          <span>{examDate.toLocaleDateString('ar-EG')}</span>
        </div>
        <div className="ux-flex ux-items-center ux-gap-3 ux-text-sm ux-text-gray-light">
          <Icon name="clock" className="ux-w-5 ux-text-primary ux-text-base" />
          <span>{examDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} ({exam.duration} دقيقة)</span>
        </div>
        {exam.teacher && (
          <div className="ux-flex ux-items-center ux-gap-3 ux-text-sm ux-text-gray-light">
            <Icon name="chalkboard-teacher" className="ux-w-5 ux-text-primary ux-text-base" />
            <span>{exam.teacher.name}</span>
          </div>
        )}
        {exam.grade && (
          <div className="ux-flex ux-items-center ux-gap-3 ux-text-sm ux-text-gray-light">
            <Icon name="graduation-cap" className="ux-w-5 ux-text-primary ux-text-base" />
            <span>{exam.grade.name}</span>
          </div>
        )}
        {exam.group && (
          <div className="ux-flex ux-items-center ux-gap-3 ux-text-sm ux-text-gray-light">
            <Icon name="users" className="ux-w-5 ux-text-primary ux-text-base" />
            <span>{exam.group.name}</span>
          </div>
        )}
        <div className="ux-flex ux-items-center ux-gap-3 ux-text-sm ux-text-gray-light">
          <Icon name="star" className="ux-w-5 ux-text-primary ux-text-base" />
          <span>الدرجة الكلية: {exam.max_score}</span>
        </div>
        {exam.attended_students && exam.attended_students.length > 0 && (
          <div className="ux-flex ux-items-center ux-gap-3 ux-text-sm ux-text-gray-light">
            <Icon name="user-check" className="ux-w-5 ux-text-primary ux-text-base" />
            <span>{exam.attended_students.length} طالب حضر</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!isEnded && (
        <div className="ux-mt-auto ux-grid ux-gap-3">
          {!isActive ? (
            <div className="ux-flex ux-items-center ux-gap-3">
              <Button 
                variant="ghost"
                className="ux-flex-1 ux-py-3 ux-rounded-xl ux-text-gray-light ux-hover-text-white ux-hover-bg-white-5 ux-transition-all ux-flex ux-items-center ux-justify-center ux-gap-2"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onToggleStatus();
                }}
              >
                <Icon name="power-off" size="sm" />
                <span>تفعيل الامتحان</span>
              </Button>
            </div>
          ) : (
            <div className="ux-flex ux-items-center ux-gap-2">
              <Button 
                variant="outline"
                className="ux-flex-1 ux-py-3 ux-rounded-xl ux-bg-rgba-66-99-235-0dot15 ux-hover-bg-rgba-66-99-235-0dot25 ux-text-primary ux-border-primary-30 ux-hover-border-primary-50 ux-font-medium ux-text-xs ux-flex ux-flex-col ux-items-center ux-justify-center ux-gap-1dot5 ux-transition-all ux-h-auto"
                onClick={onViewResults}
              >
                <Icon name="chart-bar" size="sm" />
                <span>النتائج</span>
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
