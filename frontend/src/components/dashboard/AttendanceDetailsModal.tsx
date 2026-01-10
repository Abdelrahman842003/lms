import React from 'react';

interface AttendanceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendance: {
    teacher?: {
      name: string;
    };
    date: string;
    checked_in_at: string;
    checked_out_at: string;
    duration_formatted: string;
  } | null;
}

export default function AttendanceDetailsModal({
  isOpen,
  onClose,
  attendance
}: AttendanceDetailsModalProps) {
  if (!isOpen || !attendance) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" 
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-[#1e1e2d] rounded-xl shadow-2xl border border-white/10 animate-scaleIn" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white m-0">تفاصيل الحضور</h3>
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors" 
            onClick={onClose}
            type="button"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Teacher Name */}
          <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
            <span className="text-gray-400">المدرس</span>
            <span className="text-white font-semibold">{attendance.teacher?.name || '-'}</span>
          </div>

          {/* Date */}
          <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
            <span className="text-gray-400">التاريخ</span>
            <span className="text-white">{attendance.date || '-'}</span>
          </div>

          {/* Check In */}
          <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
            <span className="text-gray-400">وقت الحضور</span>
            <span className="text-white">
              {attendance.checked_in_at 
                ? new Date(attendance.checked_in_at).toLocaleTimeString('ar-EG')
                : '-'}
            </span>
          </div>

          {/* Check Out */}
          <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
            <span className="text-gray-400">وقت الانصراف</span>
            <span className="text-white">
              {attendance.checked_out_at 
                ? new Date(attendance.checked_out_at).toLocaleTimeString('ar-EG')
                : '-'}
            </span>
          </div>

          {/* Duration */}
          <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
            <span className="text-gray-400">المدة الإجمالية</span>
            <span className="text-white font-semibold text-primary">
              {attendance.duration_formatted || '0h 0m'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-black/20 rounded-b-xl">
          <button
            type="button"
            className="px-6 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all duration-200 font-medium"
            onClick={onClose}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
