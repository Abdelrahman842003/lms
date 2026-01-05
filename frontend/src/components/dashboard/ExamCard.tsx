import React from 'react';

interface Exam {
  id: number | string;
  title: string;
  subject: string;
  grade?: { id: string; name: string };
  group?: { id: string; name: string };
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

  // Get status badge
  const getStatusBadge = () => {
    if (isEnded) {
      return { text: 'منتهي', className: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' };
    }
    if (isActive) {
      return { text: 'نشط الآن', className: 'bg-[#2ecc71]/20 text-[#2ecc71] border border-[#2ecc71]/30' };
    }
    if (isUpcoming) {
      return { text: 'قادم', className: 'bg-primary/20 text-primary border border-primary/30' };
    }
    return { text: 'غير نشط', className: 'bg-[#f39c12]/20 text-[#f39c12] border border-[#f39c12]/30' };
  };

  const status = getStatusBadge();

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
        <div className="flex gap-2">
          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${status.className}`}>
            {status.text}
          </span>
          
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
                  onViewDetails();
                }}
              >
                <i className="fas fa-eye"></i>
                <span>عرض التفاصيل</span>
              </button>
              
              <button
                className="actions-menu-item w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewResults();
                }}
              >
                <i className="fas fa-chart-bar"></i>
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
                  <i className="fas fa-edit"></i>
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
                <i className="fas fa-copy"></i>
                <span>نسخ الامتحان</span>
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
          <i className="fas fa-calendar w-5 text-primary text-base"></i>
          <span>{examDate.toLocaleDateString('ar-EG')}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-light">
          <i className="fas fa-clock w-5 text-primary text-base"></i>
          <span>{examDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} ({exam.duration} دقيقة)</span>
        </div>
        {exam.grade && (
          <div className="flex items-center gap-3 text-sm text-gray-light">
            <i className="fas fa-graduation-cap w-5 text-primary text-base"></i>
            <span>{exam.grade.name}</span>
          </div>
        )}
        {exam.group && (
          <div className="flex items-center gap-3 text-sm text-gray-light">
            <i className="fas fa-users w-5 text-primary text-base"></i>
            <span>{exam.group.name}</span>
          </div>
        )}
        <div className="flex items-center gap-3 text-sm text-gray-light">
          <i className="fas fa-star w-5 text-primary text-base"></i>
          <span>الدرجة الكلية: {exam.max_score}</span>
        </div>
        {exam.attended_students && exam.attended_students.length > 0 && (
          <div className="flex items-center gap-3 text-sm text-gray-light">
            <i className="fas fa-user-check w-5 text-primary text-base"></i>
            <span>{exam.attended_students.length} طالب حضر</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!isEnded && (
        <div className="mt-auto grid gap-3">
          {!isActive ? (
            <div className="flex items-center gap-3">
              <button 
                className="flex-1 py-3 rounded-xl text-gray-light hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2" 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStatus();
                }}
              >
                <i className="fas fa-power-off"></i>
                <span>تفعيل الامتحان</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                className="flex-1 py-3 rounded-xl bg-[rgba(66,99,235,0.15)] hover:bg-[rgba(66,99,235,0.25)] text-primary border border-primary/30 hover:border-primary/50 font-medium text-xs flex flex-col items-center justify-center gap-1.5 transition-all" 
                onClick={onViewResults}
              >
                <i className="fas fa-chart-bar text-sm"></i>
                <span>النتائج</span>
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
