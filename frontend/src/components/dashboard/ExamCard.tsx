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
                  onViewDetails();
                }}
              >
                <Icon name="eye" size="sm" />
                <span>عرض التفاصيل</span>
              </button>
              
              <button
                className="actions-menu-item w-full"
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
                  className="actions-menu-item w-full"
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
                className="actions-menu-item w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy();
                }}
              >
                <Icon name="copy" size="sm" />
                <span>نسخ الامتحان</span>
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
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-white mb-3 leading-tight">
        {exam.title}
      </h3>

      {/* Subject */}
      <p className="text-sm text-gray-light/80 mb-6 line-clamp-2 min-h-[40px]">
        {exam.subject || 'مادة الامتحان'}
      </p>

      {/* Exam Info */}
      <div className="grid gap-3.5 mb-6">
        <div className="flex items-center gap-3 text-sm text-gray-light">
          <Icon name="calendar" className="w-5 text-primary text-base" />
          <span>{examDate.toLocaleDateString('ar-EG')}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-light">
          <Icon name="clock" className="w-5 text-primary text-base" />
          <span>{examDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} ({exam.duration} دقيقة)</span>
        </div>
        {exam.teacher && (
          <div className="flex items-center gap-3 text-sm text-gray-light">
            <Icon name="chalkboard-teacher" className="w-5 text-primary text-base" />
            <span>{exam.teacher.name}</span>
          </div>
        )}
        {exam.grade && (
          <div className="flex items-center gap-3 text-sm text-gray-light">
            <Icon name="graduation-cap" className="w-5 text-primary text-base" />
            <span>{exam.grade.name}</span>
          </div>
        )}
        {exam.group && (
          <div className="flex items-center gap-3 text-sm text-gray-light">
            <Icon name="users" className="w-5 text-primary text-base" />
            <span>{exam.group.name}</span>
          </div>
        )}
        <div className="flex items-center gap-3 text-sm text-gray-light">
          <Icon name="star" className="w-5 text-primary text-base" />
          <span>الدرجة الكلية: {exam.max_score}</span>
        </div>
        {exam.attended_students && exam.attended_students.length > 0 && (
          <div className="flex items-center gap-3 text-sm text-gray-light">
            <Icon name="user-check" className="w-5 text-primary text-base" />
            <span>{exam.attended_students.length} طالب حضر</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!isEnded && (
        <div className="mt-auto grid gap-3">
          {!isActive ? (
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost"
                className="flex-1 py-3 rounded-xl text-gray-light hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
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
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                className="flex-1 py-3 rounded-xl bg-[rgba(66,99,235,0.15)] hover:bg-[rgba(66,99,235,0.25)] text-primary border-primary/30 hover:border-primary/50 font-medium text-xs flex flex-col items-center justify-center gap-1.5 transition-all h-auto"
                onClick={onViewResults}
              >
                <Icon name="chart-bar" size="sm" />
                <span>النتائج</span>
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
