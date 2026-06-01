import React from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

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
  showTeacher?: boolean;
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
  showTeacher = true,
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
      className={`group relative transition-all duration-500 ease-out ${isMenuOpen ? 'z-[100]' : 'z-10 hover:z-20'}`}
      style={{ perspective: '1000px' }}
    >
      {/* Visual Background Layer - Handles clipping and glass effects */}
      <div className={`absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none transition-all duration-500 
        ${isActive 
          ? 'bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border-2 border-primary/30 shadow-[0_0_40px_rgba(66,99,235,0.15)]' 
          : 'bg-surface-primary dark:bg-[#101426]/40 backdrop-blur-md border border-border-theme-primary group-hover:border-primary/20 shadow-2xl'
        }`}
      >
        {/* Animated Glow Effect */}
        <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(66,99,235,0.08)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      </div>

      {/* Content Layer - No overflow hidden to allow menu to pop out */}
      <div className="relative p-7 flex flex-col h-full min-h-[320px]">
        {/* Top Header: Badge & Menu */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-wrap gap-2">
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md border
              ${isEnded ? 'bg-white/5 text-gray-400 border-white/5' : 
                isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 
                'bg-primary/10 text-primary border-primary/20'}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${isEnded ? 'bg-gray-400' : isActive ? 'bg-emerald-400 animate-pulse' : 'bg-primary'}`} />
              {getStatusText()}
            </div>

            {isActive && timeLeft && (
              <div className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-black font-mono tracking-tighter animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                {timeLeft}
              </div>
            )}
          </div>

          <div className="relative">
            <Button 
              variant="ghost"
              size="sm"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border
                ${isMenuOpen 
                  ? 'bg-primary text-white border-primary shadow-[0_0_20px_rgba(66,99,235,0.4)] rotate-90' 
                  : 'bg-white/5 text-gray-light border-white/10 hover:border-white/30 hover:bg-white/10'
                }`}
              onClick={onMenuToggle}
            >
              <Icon name="ellipsis-v" />
            </Button>
            
            {isMenuOpen && (
              <div className="actions-menu show actions-menu-card !bg-[#0f1121] !opacity-100 !visible !translate-y-0 !z-[999] !shadow-2xl">
                <button className="actions-menu-item ux-w-full" onClick={(e) => { e.stopPropagation(); onViewDetails(); }}>
                  <Icon name="eye" size="sm" /> <span>عرض التفاصيل</span>
                </button>
                <button className="actions-menu-item ux-w-full" onClick={(e) => { e.stopPropagation(); onViewResults(); }}>
                  <Icon name="chart-bar" size="sm" /> <span>نتائج الطلاب</span>
                </button>
                {!isEnded && (
                  <button className="actions-menu-item ux-w-full" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                    <Icon name="edit" size="sm" /> <span>تعديل الامتحان</span>
                  </button>
                )}
                <button className="actions-menu-item ux-w-full" onClick={(e) => { e.stopPropagation(); onCopy(); }}>
                  <Icon name="copy" size="sm" /> <span>نسخ الامتحان</span>
                </button>
                <div className="h-px bg-white/5 my-2"></div>
                <button className="actions-menu-item danger ux-w-full" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                  <Icon name="trash" size="sm" /> <span>حذف الامتحان</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Exam Title & Subject */}
        <div className="mb-6">
          <h3 className="text-xl font-black text-white mb-2 leading-tight group-hover:text-primary transition-colors line-clamp-1">
            {exam.title}
          </h3>
          <div className="flex justify-between items-center text-gray-light/40">
             <div className="flex items-center gap-2">
                <div className="w-4 h-[1px] bg-primary/30" />
                <p className="text-[11px] font-bold uppercase tracking-widest">{exam.subject || 'مادة الامتحان'}</p>
             </div>
             {showTeacher && exam.teacher?.name && (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 backdrop-blur-md">
                   <Icon name="chalkboard-teacher" size="xs" className="ml-1" />
                   <span>أ. {exam.teacher.name}</span>
                </div>
             )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
           <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 group-hover:bg-white/[0.08] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                 <Icon name="calendar" size="sm" />
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-gray-light/40 uppercase leading-none mb-1">التاريخ والوقت</span>
                 <span className="text-[11px] font-bold text-white whitespace-nowrap">
                   {examDate.toLocaleDateString('ar-EG')} | {examDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true })}
                 </span>
              </div>
           </div>

           <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 group-hover:bg-white/[0.08] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                 <Icon name="clock" size="sm" />
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-gray-light/40 uppercase leading-none mb-1">الوقت</span>
                 <span className="text-[11px] font-bold text-white whitespace-nowrap">{exam.duration} دقيقة</span>
              </div>
           </div>

           <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 group-hover:bg-white/[0.08] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                 <Icon name="star" size="sm" />
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-gray-light/40 uppercase leading-none mb-1">الدرجة</span>
                 <span className="text-[11px] font-bold text-white whitespace-nowrap">{exam.max_score} درجة</span>
              </div>
           </div>

           <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 group-hover:bg-white/[0.08] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                 <Icon name="users" size="sm" />
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-gray-light/40 uppercase leading-none mb-1">المجموعة</span>
                 <span className="text-[11px] font-bold text-white line-clamp-1">{exam.group?.name || 'عام'}</span>
              </div>
           </div>
        </div>

        {/* Footer Actions */}
        {!isEnded && (
          <div className="mt-auto pt-4 border-t border-white/5">
            {!isActive ? (
              <Button 
                variant="primary"
                className="w-full h-11 rounded-xl font-bold gap-2 shadow-[0_0_20px_rgba(66,99,235,0.2)] hover:shadow-[0_0_30px_rgba(66,99,235,0.4)] transition-all"
                onClick={(e) => { e.stopPropagation(); onToggleStatus(); }}
              >
                <Icon name="power-off" size="sm" />
                <span>تفعيل الامتحان الآن</span>
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  className="flex-1 h-11 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 font-bold gap-2"
                  onClick={(e) => { e.stopPropagation(); onViewResults(); }}
                >
                  <Icon name="chart-bar" size="sm" />
                  <span>النتائج</span>
                </Button>
                <Button 
                  variant="destructive"
                  className="flex-1 h-11 rounded-xl font-bold gap-2"
                  onClick={(e) => { e.stopPropagation(); onEnd(); }}
                >
                  <Icon name="stop-circle" size="sm" />
                  <span>إنهاء</span>
                </Button>
              </div>
            )}
          </div>
        )}

        {isEnded && (
          <div className="mt-auto">
             <Button 
               variant="outline"
               className="w-full h-11 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 font-bold gap-2 text-gray-light"
               onClick={(e) => { e.stopPropagation(); onViewResults(); }}
             >
               <Icon name="chart-bar" size="sm" />
               <span>عرض النتائج النهائية</span>
             </Button>
          </div>
        )}
      </div>
    </div>
  );
};
