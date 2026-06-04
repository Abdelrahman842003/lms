'use client';
import React, { useEffect } from 'react';
import { Icon } from '@/components/ui';

interface AttendanceCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string | null;
  lectureTitle: string;
}

const AttendanceCodeModal: React.FC<AttendanceCodeModalProps> = ({ isOpen, onClose, code, lectureTitle }) => {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
      {/* Bright immersive backdrop for light mode, dark for dark mode */}
      <div 
        className="absolute inset-0 bg-black/40 dark:bg-[#0f1121]/80 backdrop-blur-xl animate-in fade-in duration-700"
        onClick={onClose}
      />

      {/* Premium Modal Card: Pure white in light mode, deep dark in dark mode */}
      <div className="relative w-full max-w-lg bg-[#ffffff] dark:bg-[#13162b] border border-gray-200 dark:border-[#ffffff]/10 rounded-[2.5rem] shadow-[0_20px_80px_-10px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_80px_-10px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 fade-in duration-500">
        
        {/* Animated Glow Elements */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 dark:bg-primary/30 blur-[100px] rounded-full animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 dark:bg-secondary/20 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="p-8 sm:p-10 flex flex-col items-center relative z-10">
          
          {/* Removed top section as per user request */}

          {/* 6-Digit Code Display */}
          <div className="relative w-full mb-10">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 dark:from-primary/20 dark:via-secondary/20 dark:to-primary/20 blur-xl rounded-full opacity-50" />
            
            <div className="relative bg-gray-50 dark:bg-black/40 p-6 sm:p-8 rounded-[2rem] shadow-inner border border-gray-200 dark:border-[#ffffff]/5 flex justify-center items-center overflow-hidden">
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ffffff]/50 dark:via-[#ffffff]/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              
              {code ? (
                <div className="flex gap-2 sm:gap-3" dir="ltr">
                  {code.split('').map((digit, index) => (
                    <div 
                      key={index}
                      className="w-10 sm:w-14 h-14 sm:h-20 bg-[#ffffff] dark:bg-[#1e2243] rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-[#000000]/30 dark:border-[#ffffff]/10 flex items-center justify-center transform animate-in slide-in-from-bottom-4 fade-in"
                      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                    >
                      <span className="text-3xl sm:text-5xl font-black text-[#000000] dark:text-[#ffffff] font-mono">
                        {digit}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full h-14 sm:h-20 flex items-center justify-center gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Offline indicator */}
          {typeof navigator !== 'undefined' && !navigator.onLine && (
            <div className="w-full mb-4 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs text-center font-medium flex items-center justify-center gap-2">
              <Icon name="wifi-slash" size="xs" />
              <span>أنت أوفلاين — الكود تم توليده محلياً وسيتم مزامنته لاحقاً</span>
            </div>
          )}

          <p className="text-gray-600 dark:text-text-theme-muted text-xs sm:text-sm text-center mb-10 px-4 leading-relaxed font-medium bg-gray-50 dark:bg-surface-secondary/50 p-4 rounded-xl border border-gray-200 dark:border-border-theme-secondary">
            شارك هذا الرقم مع الطلاب المتواجدين الآن.<br/>
            <span className="text-danger font-bold inline-flex items-center gap-1 mt-2">
              <Icon name="exclamation-circle" size="xs" /> سيتم إيقاف صلاحية الكود فور إغلاق هذه النافذة
            </span>
          </p>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="group relative w-full h-16 rounded-2xl bg-danger overflow-hidden transition-all active:scale-95 shadow-lg shadow-danger/20 hover:shadow-danger/40"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <span className="relative text-white font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3">
              <Icon name="times" /> إغلاق وإلغاء الكود
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCodeModal;
