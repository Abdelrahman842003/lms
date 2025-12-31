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
}) => {
  const isActive = lecture.is_active;

  return (
    <div 
      className={`relative rounded-2xl p-6 transition-all duration-500 ease-in-out flex flex-col ${
        isActive 
          ? 'bg-gradient-to-br from-[rgba(46,204,113,0.15)] to-[rgba(46,204,113,0.05)] border-2 border-[#2ecc71] shadow-[0_0_30px_rgba(46,204,113,0.3)]' 
          : 'bg-[#101426]/15 border border-white/10 hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:-translate-y-[1px] hover:backdrop-blur-[20px] hover:border-[#1bc5f8]/50'
      }`}
    >
      {/* Top Section: Menu and Status */}
      <div className="flex justify-between items-start mb-6">
        {/* Status Badge */}
        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
          lecture.status === 'جاري الآن' ? 'bg-[#2ecc71]/20 text-[#2ecc71] border border-[#2ecc71]/30' : 
          lecture.status === 'اليوم' ? 'bg-[#f39c12]/20 text-[#f39c12] border border-[#f39c12]/30' : 
          lecture.status === 'منتهية' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' : 
          'bg-primary/20 text-primary border border-primary/30'
        }`}>
          {lecture.status}
        </span>

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
            <div className="absolute left-0 top-full mt-2 w-56 bg-[#1a1f37] border border-white/10 rounded-xl shadow-2xl z-10 overflow-hidden backdrop-blur-xl">
              <div className="p-1">
                <button
                  className="w-full px-4 py-2.5 text-right text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3 mb-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewAttendees();
                  }}
                >
                  <i className="fas fa-eye w-5 text-primary"></i>
                  <span className="text-sm font-medium">عرض التفاصيل</span>
                </button>
                <button
                  className="w-full px-4 py-2.5 text-right text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3 mb-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <i className="fas fa-edit w-5 text-primary"></i>
                  <span className="text-sm font-medium">تعديل</span>
                </button>
                <button
                  className="w-full px-4 py-2.5 text-right text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3 mb-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy();
                  }}
                >
                  <i className="fas fa-copy w-5 text-primary"></i>
                  <span className="text-sm font-medium">نسخ المحاضرة</span>
                </button>
                <div className="h-px bg-white/10 my-1"></div>
                <button
                  className="w-full px-4 py-2.5 text-right text-[#ff6b6b] hover:bg-[#ff6b6b]/10 rounded-lg transition-colors flex items-center gap-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <i className="fas fa-trash w-5"></i>
                  <span className="text-sm font-medium">حذف</span>
                </button>
              </div>
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
        {lecture.description || 'New topic'}
      </p>

      {/* Lecture Info */}
      <div className="grid gap-3.5 mb-6">
        <div className="flex items-center gap-3 text-sm text-gray-light">
          <i className="fas fa-calendar w-5 text-primary text-base"></i>
          <span>{lecture.date}</span>
        </div>
        {lecture.grade && (
          <div className="flex items-center gap-3 text-sm text-gray-light">
            <i className="fas fa-graduation-cap w-5 text-primary text-base"></i>
            <span>{lecture.grade.name}</span>
          </div>
        )}
        <div className="flex items-center gap-3 text-sm text-gray-light">
          <i className="fas fa-clock w-5 text-primary text-base"></i>
          <span>{lecture.time} ({lecture.duration})</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-light">
          <i className="fas fa-users w-5 text-primary text-base"></i>
          <span>{lecture.enrolled} طالب مسجل</span>
        </div>
      </div>

      {/* Action Buttons */}
      {lecture.status !== 'منتهية' && (
        <div className="mt-auto grid gap-3">
          {!isActive ? (
            <button 
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#ff6b6b] to-[#ee5a6f] hover:from-[#ff5252] hover:to-[#e94560] text-white font-semibold text-base flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]" 
              onClick={onActivate}
            >
              <i className="fas fa-play-circle text-lg"></i>
              <span>إنعاش</span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button 
                className="py-3 rounded-xl bg-[rgba(66,99,235,0.15)] hover:bg-[rgba(66,99,235,0.25)] text-primary border border-primary/30 hover:border-primary/50 font-medium text-sm flex flex-col items-center justify-center gap-1.5 transition-all" 
                onClick={onScan}
              >
                <i className="fas fa-qrcode text-base"></i>
                <span className="text-xs">مسح QR طالب</span>
              </button>
              <button 
                className="py-3 rounded-xl bg-[rgba(66,99,235,0.15)] hover:bg-[rgba(66,99,235,0.25)] text-primary border border-primary/30 hover:border-primary/50 font-medium text-sm flex flex-col items-center justify-center gap-1.5 transition-all" 
                onClick={onQRCode}
              >
                <i className="fas fa-qrcode text-base"></i>
                <span className="text-xs">QR Code</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
