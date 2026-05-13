import React from 'react';
import { Lecture } from '@/services/lectureService';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
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

  const getTimezoneOffsetMs = React.useCallback((timeZone: string) => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(now).reduce<Record<string, string>>((acc, part) => {
      if (part.type !== 'literal') {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});

    const zonedTimeMs = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second)
    );

    return zonedTimeMs - now.getTime();
  }, []);

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
      let difference = end - now;

      if (
        lecture.is_recurring
        && typeof lecture.duration_minutes === 'number'
        && difference > (lecture.duration_minutes + 10) * 60 * 1000
      ) {
        const cairoOffsetMs = getTimezoneOffsetMs('Africa/Cairo');
        const correctedDifference = difference - cairoOffsetMs;

        if (correctedDifference >= -60_000 && correctedDifference <= (lecture.duration_minutes + 10) * 60 * 1000) {
          difference = correctedDifference;
        }
      }

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
  }, [isActive, lecture.current_session_end_time, lecture.is_recurring, lecture.duration_minutes, getTimezoneOffsetMs]);

  const getStatusConfig = () => {
    if (lecture.status === 'جاري الآن') return { variant: 'success' as const, label: 'مباشر الآن', glow: 'bg-success/20' };
    if (lecture.status === 'اليوم') return { variant: 'warning' as const, label: 'تبدأ اليوم', glow: 'bg-warning/20' };
    if (lecture.status === 'منتهية') return { variant: 'secondary' as const, label: 'انتهت', glow: 'bg-white/5' };
    return { variant: 'primary' as const, label: lecture.status, glow: 'bg-primary/20' };
  };

  const status = getStatusConfig();

  return (
    <div
      className={cn(
        "group relative flex flex-col p-7 rounded-[2rem] premium-glass premium-border transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden",
        isActive && "border-primary/50 shadow-[0_0_40px_rgba(66,99,235,0.2)]",
        isMenuOpen ? 'z-10' : ''
      )}
    >
      {/* Background Mesh Glow */}
      <div className={cn(
        "absolute -top-12 -right-12 w-32 h-32 blur-[60px] rounded-full opacity-40 transition-all duration-700 group-hover:opacity-60",
        status.glow
      )}></div>

      {/* Top Section */}
      <div className="flex justify-between items-start mb-6 z-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              status.variant === 'success' ? 'bg-success shadow-[0_0_8px_var(--success)]' : 
              status.variant === 'warning' ? 'bg-warning' : 'bg-gray-400'
            )}></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
              {status.label}
            </span>
          </div>
          
          {isActive && timeLeft && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
              <Icon name="clock" size="xs" className="text-red-500 animate-pulse" />
              <span className="text-xs font-black text-red-500 font-mono tracking-wider">{timeLeft}</span>
            </div>
          )}
        </div>

        {/* Action Menu */}
        <div className="relative">
          <Button 
            variant="ghost"
            size="sm"
            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 hover:bg-primary/20 hover:border-primary/50 text-white transition-all p-0"
            onClick={onMenuToggle}
          >
            <Icon name="ellipsis-v" />
          </Button>
          
          {isMenuOpen && (
            <div className="absolute left-0 top-full mt-2 min-w-[200px] rounded-2xl bg-[#0f1221]/95 backdrop-blur-2xl border border-white/10 p-2 shadow-2xl z-20 animate-in fade-in slide-in-from-top-2">
              <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/5 text-sm text-gray-light transition-all" onClick={onViewAttendees}>
                <Icon name="clipboard-list" size="sm" className="text-primary" />
                <span>سجل الحضور</span>
              </button>
              {isActive && (
                <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/5 text-sm text-gray-light transition-all" onClick={onManualAttendance}>
                  <Icon name="user-check" size="sm" className="text-success" />
                  <span>حضور يدوي</span>
                </button>
              )}
              <div className="h-px bg-white/5 my-2"></div>
              <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/5 text-sm text-gray-light transition-all" onClick={onEdit}>
                <Icon name="edit" size="sm" />
                <span>تعديل المحاضرة</span>
              </button>
              <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/5 text-sm text-gray-light transition-all" onClick={onCopy}>
                <Icon name="copy" size="sm" />
                <span>نسخ البيانات</span>
              </button>
              <div className="h-px bg-white/5 my-2"></div>
              <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-500/10 text-sm text-red-400 transition-all" onClick={onDelete}>
                <Icon name="trash" size="sm" />
                <span>حذف المحاضرة</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="mb-6 z-10">
        <h3 className="text-2xl font-black text-white mb-2 leading-tight group-hover:text-primary transition-colors">
          {lecture.title}
        </h3>
        <div className="flex items-center gap-2 text-gray-light/60 text-xs font-medium">
          <Icon name="bookmark" size="xs" />
          <span className="truncate">{lecture.current_session?.description || lecture.description || 'بدون وصف إضافي'}</span>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8 z-10">
        <div className="flex items-center gap-3 bg-white/[0.03] p-3 rounded-2xl border border-white/5 transition-all hover:bg-white/5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon name="calendar" size="sm" className="text-primary" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[10px] text-gray-light/40 font-bold uppercase">التاريخ</span>
            <span className="text-xs text-white font-bold truncate">
              {lecture.is_recurring && lecture.recurrence_days?.length ? 'يومي' : lecture.date}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/[0.03] p-3 rounded-2xl border border-white/5 transition-all hover:bg-white/5">
          <div className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center">
            <Icon name="clock" size="sm" className="text-secondary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-light/40 font-bold uppercase">الوقت</span>
            <span className="text-xs text-white font-bold">{lecture.time}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/[0.03] p-3 rounded-2xl border border-white/5 transition-all hover:bg-white/5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Icon name="users" size="sm" className="text-purple-500" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[10px] text-gray-light/40 font-bold uppercase">المجموعة</span>
            <span className="text-xs text-white font-bold truncate">{lecture.group?.name || '-'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/[0.03] p-3 rounded-2xl border border-white/5 transition-all hover:bg-white/5">
          <div className="w-8 h-8 rounded-xl bg-warning/10 flex items-center justify-center">
            <Icon name="user-check" size="sm" className="text-warning" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-light/40 font-bold uppercase">المسجلين</span>
            <span className="text-xs text-white font-bold">{lecture.enrolled} طالب</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      {lecture.status !== 'منتهية' && (
        <div className="mt-auto pt-6 border-t border-white/5 z-10">
          {!isActive ? (
            <Button 
              onClick={onActivate}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-secondary hover:shadow-[0_8px_20px_rgba(66,99,235,0.4)] text-white font-black uppercase tracking-widest text-xs gap-2 transition-all border-none"
            >
              <Icon name="power-off" />
              <span>تفعيل المحاضرة الآن</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                onClick={onScan}
                className="flex-1 h-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs gap-2 transition-all"
              >
                <Icon name="camera" />
                <span>مسح</span>
              </Button>
              <Button 
                onClick={onQRCode}
                className="flex-1 h-12 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary font-bold text-xs gap-2 transition-all"
              >
                <Icon name="qrcode" />
                <span>QR</span>
              </Button>
              <Button 
                onClick={onEnd}
                className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-all"
              >
                <Icon name="stop" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
