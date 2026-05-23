import React from 'react';
import { Lecture } from '@/services/lectureService';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/utils';

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
  showTeacher?: boolean;
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
  showTeacher = true,
}) => {
  const isActive = lecture.is_active;
  const [timeLeft, setTimeLeft] = React.useState<string>('');

  const getTimezoneOffsetMs = React.useCallback((timeZone: string) => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
    const parts = formatter.formatToParts(now).reduce<Record<string, string>>((acc, part) => {
      if (part.type !== 'literal') acc[part.type] = part.value;
      return acc;
    }, {});
    const zonedTimeMs = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
    return zonedTimeMs - now.getTime();
  }, []);

  React.useEffect(() => {
    if (!isActive || !lecture.current_session_end_time) { setTimeLeft(''); return; }
    const calculateTimeLeft = () => {
      if (!isActive || !lecture.current_session_end_time) { setTimeLeft(''); return; }
      const end = new Date(lecture.current_session_end_time!).getTime();
      const now = new Date().getTime();
      let difference = end - now;
      if (lecture.is_recurring && typeof lecture.duration_minutes === 'number' && difference > (lecture.duration_minutes + 10) * 60 * 1000) {
        const cairoOffsetMs = getTimezoneOffsetMs('Africa/Cairo');
        const correctedDifference = difference - cairoOffsetMs;
        if (correctedDifference >= -60_000 && correctedDifference <= (lecture.duration_minutes + 10) * 60 * 1000) difference = correctedDifference;
      }
      if (difference <= 0) { setTimeLeft('00:00:00'); return; }
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [isActive, lecture.current_session_end_time, lecture.is_recurring, lecture.duration_minutes, getTimezoneOffsetMs]);

  const getStatusConfig = () => {
    if (lecture.status === 'جاري الآن') return { variant: 'success' as const, label: 'مباشر الآن', glow: 'bg-success/20' };
    if (lecture.status === 'اليوم') return { variant: 'warning' as const, label: 'تبدأ اليوم', glow: 'bg-warning/20' };
    if (lecture.status === 'منتهية') return { variant: 'secondary' as const, label: 'انتهت', glow: 'bg-white/5' };
    return { variant: 'primary' as const, label: lecture.status, glow: 'bg-primary/20' };
  };

  const status = getStatusConfig();

  const ARABIC_DAYS: Record<string, string> = {
    Sunday: 'الأحد',
    Monday: 'الإثنين',
    Tuesday: 'الثلاثاء',
    Wednesday: 'الأربعاء',
    Thursday: 'الخميس',
    Friday: 'الجمعة',
    Saturday: 'السبت',
  };

  const formatRecurrenceDays = (days?: string[] | null) => {
    if (!days || days.length === 0) return 'متكررة';
    return days.map(d => ARABIC_DAYS[d] || d).join('، ');
  };

  const getNextOccurrenceString = () => {
    if (!lecture.is_recurring || !lecture.recurrence_days || lecture.recurrence_days.length === 0) {
      return null;
    }
    
    const now = new Date();
    const dayMap: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
    };
    
    let minDiff = 8;
    let nextDate: Date | null = null;
    
    const timeStr = lecture.recurrence_time || '00:00';
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    lecture.recurrence_days.forEach(dayStr => {
      const dayNum = dayMap[dayStr.toLowerCase()];
      if (dayNum === undefined) return;
      
      const temp = new Date(now);
      temp.setHours(hours || 0, minutes || 0, 0, 0);
      
      let diff = dayNum - now.getDay();
      if (diff < 0 || (diff === 0 && temp.getTime() <= now.getTime())) {
        diff += 7;
      }
      
      if (diff < minDiff) {
        minDiff = diff;
        temp.setDate(now.getDate() + diff);
        nextDate = temp;
      }
    });
    
    if (!nextDate) return null;
    
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    };
    const formattedDate = nextDate.toLocaleDateString('ar-EG', options);
    
    let formattedTime = '';
    if (lecture.recurrence_time) {
      const [h, m] = lecture.recurrence_time.split(':');
      const hour = parseInt(h);
      const suffix = hour >= 12 ? 'م' : 'ص';
      const displayHour = hour % 12 || 12;
      formattedTime = `الساعة ${displayHour.toString().padStart(2, '0')}:${m} ${suffix}`;
    }
    
    return `${formattedDate} ${formattedTime}`.trim();
  };

  const nextOccurrence = getNextOccurrenceString();

  return (
    <div className={cn(
      "group relative flex flex-col transition-all duration-500 hover:-translate-y-3",
      isMenuOpen ? 'z-[100]' : ''
    )}>
      {/* Background & Clipping Layer - Ultra Premium Glass */}
      <div className={cn(
        "absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl transition-all duration-500 group-hover:shadow-primary/20",
        isActive && "border-success/50 shadow-[0_0_50px_rgba(16,185,129,0.15)] ring-1 ring-success/30"
      )}>
         <div className={cn(
            "absolute -top-20 -right-20 w-40 h-40 blur-[70px] rounded-full opacity-40 transition-all duration-700 group-hover:opacity-70 group-hover:scale-150",
            status.glow
         )}></div>
         {isActive && (
            <div className="absolute -bottom-20 -left-20 w-40 h-40 blur-[70px] rounded-full bg-success/30 opacity-40 animate-pulse"></div>
         )}
      </div>

      {/* Real Content */}
      <div className="relative z-10 flex flex-col p-6 h-full">
         {/* Top Section */}
         <div className="flex justify-between items-start mb-5">
            <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
               <span className={cn("w-2 h-2 rounded-full", isActive ? 'bg-success shadow-[0_0_10px_var(--success)] animate-pulse' : status.variant === 'warning' ? 'bg-warning' : 'bg-gray-400')}></span>
               <span className={cn("text-[11px] font-bold tracking-wide", isActive ? "text-success" : "text-white/70")}>{status.label}</span>
            </div>

            <div className="relative">
               <Button 
                 variant="ghost" size="sm" 
                 className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 text-white transition-all p-0 flex items-center justify-center group-hover:rotate-90 duration-300"
                 onClick={onMenuToggle}
               >
                  <Icon name="ellipsis-v" />
               </Button>
               
               {isMenuOpen && (
                  <div className="absolute left-0 mt-2 w-48 rounded-2xl bg-[#0f1121]/95 backdrop-blur-2xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-[999] py-2 flex flex-col animate-in fade-in zoom-in duration-200">
                     <button className="flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors w-full text-right" onClick={(e) => { e.stopPropagation(); onViewAttendees(); }}>
                        <Icon name="clipboard-list" className="w-4 h-4 text-primary" /> <span>سجل الحضور</span>
                     </button>
                     {isActive && (
                        <button className="flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors w-full text-right" onClick={(e) => { e.stopPropagation(); onManualAttendance(); }}>
                           <Icon name="user-check" className="w-4 h-4 text-success" /> <span>حضور يدوي</span>
                        </button>
                     )}
                     <div className="h-px bg-white/5 my-1 w-[90%] mx-auto"></div>
                     <button className="flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors w-full text-right" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                        <Icon name="edit" className="w-4 h-4 text-warning" /> <span>تعديل المحاضرة</span>
                     </button>
                     <button className="flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors w-full text-right" onClick={(e) => { e.stopPropagation(); onCopy(); }}>
                        <Icon name="copy" className="w-4 h-4 text-info" /> <span>نسخ البيانات</span>
                     </button>
                     <div className="h-px bg-white/5 my-1 w-[90%] mx-auto"></div>
                     <button className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full text-right" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                        <Icon name="trash" className="w-4 h-4" /> <span>حذف المحاضرة</span>
                     </button>
                  </div>
               )}
            </div>
         </div>

         {/* Teacher & Title Section */}
         <div className="mb-5">
            <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-primary transition-colors line-clamp-2">{lecture.title}</h3>
            <div className="flex items-center gap-2 text-white/50 text-xs font-medium">
               <Icon name="align-right" size="xs" />
               <span className="truncate">{lecture.current_session?.description || lecture.description || 'بدون وصف إضافي'}</span>
            </div>
         </div>

         {showTeacher && (
           <div className="flex items-center gap-3 mb-6 bg-black/20 p-2.5 rounded-2xl border border-white/5 backdrop-blur-sm">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-inner">
                 <Icon name="chalkboard-teacher" />
              </div>
              <div className="flex flex-col overflow-hidden">
                 <span className="text-[10px] text-white/40 font-semibold">المحاضر</span>
                 <span className="text-sm text-white font-bold truncate tracking-wide">أ. {lecture.teacher?.name || 'غير محدد'}</span>
              </div>
           </div>
         )}

         {/* Active Countdown Box - Redesigned to be smaller and sleek */}
         {isActive && (
            <div className="mb-5 p-3 rounded-2xl bg-gradient-to-r from-success/10 to-transparent border-r-2 border-success flex items-center justify-between shadow-lg relative overflow-hidden group/timer">
               <div className="absolute inset-0 bg-success/5 animate-pulse"></div>
               <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center border border-success/30">
                    <Icon name="hourglass-half" className="text-success animate-spin-slow" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-success/80 font-bold uppercase tracking-wider">ينتهي بعد</span>
                    <span className="text-xl font-black text-white font-mono tracking-widest drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">{timeLeft || '00:00:00'}</span>
                  </div>
               </div>
            </div>
         )}

         {/* Info Grid - Minimalist glass cells */}
         <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="flex items-center gap-3 bg-white/[0.04] p-3 rounded-2xl border border-white/[0.08] hover:bg-white/[0.08] transition-colors">
               <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><Icon name="calendar-alt" size="sm" className="text-blue-400" /></div>
               <div className="flex flex-col overflow-hidden">
                  <span className="text-[10px] text-white/40 font-medium">النوع</span>
                  <span className="text-xs text-white font-bold truncate">{lecture.is_recurring ? 'متكررة' : 'فردية'}</span>
               </div>
            </div>
            <div className="flex items-center gap-3 bg-white/[0.04] p-3 rounded-2xl border border-white/[0.08] hover:bg-white/[0.08] transition-colors">
               <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center"><Icon name="clock" size="sm" className="text-orange-400" /></div>
               <div className="flex flex-col">
                  <span className="text-[10px] text-white/40 font-medium">الوقت</span>
                  <span className="text-xs text-white font-bold">{lecture.time}</span>
               </div>
            </div>
            <div className="flex items-center gap-3 bg-white/[0.04] p-3 rounded-2xl border border-white/[0.08] hover:bg-white/[0.08] transition-colors">
               <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center"><Icon name="users" size="sm" className="text-purple-400" /></div>
               <div className="flex flex-col overflow-hidden">
                  <span className="text-[10px] text-white/40 font-medium">المجموعة</span>
                  <span className="text-xs text-white font-bold truncate">{lecture.group?.name || '-'}</span>
               </div>
            </div>
            <div className="flex items-center gap-3 bg-white/[0.04] p-3 rounded-2xl border border-white/[0.08] hover:bg-white/[0.08] transition-colors">
               <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center"><Icon name="user-check" size="sm" className="text-pink-400" /></div>
               <div className="flex flex-col">
                  <span className="text-[10px] text-white/40 font-medium">الحضور</span>
                  <span className="text-xs text-white font-bold">{lecture.enrolled} طالب</span>
               </div>
            </div>
         </div>

         {/* Recurrence Schedule details */}
         {lecture.is_recurring && (
            <div className="mb-4 flex items-center gap-3 bg-teal-500/5 border border-teal-500/10 p-2.5 rounded-xl">
               <Icon name="redo" size="xs" className="text-teal-400 ml-1" />
               <span className="text-xs text-teal-100 font-medium truncate">{formatRecurrenceDays(lecture.recurrence_days)}</span>
            </div>
         )}

         {/* Next Occurrence details for recurring lectures */}
         {lecture.is_recurring && nextOccurrence && (
            <div className="mb-6 flex items-center justify-between bg-primary/5 border border-primary/10 p-3 rounded-xl">
               <span className="text-[10px] text-primary/70 font-bold uppercase">القادمة</span>
               <span className="text-xs text-white font-bold truncate">{nextOccurrence}</span>
            </div>
         )}

         {/* Date for single lectures */}
         {!lecture.is_recurring && (
            <div className="mb-6 flex items-center justify-between bg-primary/5 border border-primary/10 p-3 rounded-xl">
               <span className="text-[10px] text-primary/70 font-bold uppercase">التاريخ</span>
               <span className="text-xs text-white font-bold truncate">{lecture.date}</span>
            </div>
         )}

         {/* Footer Actions */}
         {lecture.status !== 'منتهية' && (
            <div className="mt-auto pt-4 border-t border-white/10">
               {!isActive ? (
                  <Button onClick={onActivate} className="w-full h-11 rounded-xl bg-white/10 hover:bg-primary hover:text-white text-white font-bold text-xs gap-2 transition-all duration-300 border border-white/10 hover:border-primary hover:shadow-[0_0_20px_rgba(66,99,235,0.4)]">
                     <Icon name="power-off" /> <span>بدء المحاضرة يدوياً</span>
                  </Button>
               ) : (
                  <div className="flex items-center gap-2">
                     <Button onClick={onScan} className="flex-1 h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 text-white font-bold text-xs gap-2 transition-all">
                        <Icon name="camera" /> <span>مسح</span>
                     </Button>
                     <Button onClick={onQRCode} className="w-12 h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center transition-all">
                        <Icon name="qrcode" />
                     </Button>
                     <Button onClick={onEnd} className="w-12 h-11 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500 hover:text-white text-red-500 flex items-center justify-center transition-all duration-300 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                        <Icon name="stop" />
                     </Button>
                  </div>
               )}
            </div>
         )}
      </div>
    </div>
  );
};
