'use client';
import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/ui';

interface CodeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (code: string) => Promise<void>;
  lectureTitle: string;
}

const CodeEntryModal: React.FC<CodeEntryModalProps> = ({ isOpen, onClose, onSubmit, lectureTitle }) => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCode(''); // Reset code when opened
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;

    setIsSubmitting(true);
    try {
      await onSubmit(code);
      // Let the parent close the modal on success
    } catch (error) {
      // Parent should handle error toasts, just reset submitting state
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
      {/* Bright immersive backdrop for light mode, dark for dark mode */}
      <div 
        className="absolute inset-0 bg-black/40 dark:bg-[#0f1121]/80 backdrop-blur-xl animate-in fade-in duration-700"
        onClick={!isSubmitting ? onClose : undefined}
      />

      {/* Premium Modal Card */}
      <div className="relative w-full max-w-lg bg-[#ffffff] dark:bg-[#13162b] border border-gray-200 dark:border-[#ffffff]/10 rounded-[2.5rem] shadow-[0_20px_80px_-10px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_80px_-10px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 fade-in duration-500">
        
        {/* Animated Glow Elements */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 dark:bg-primary/30 blur-[100px] rounded-full animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 dark:bg-secondary/20 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="p-8 sm:p-10 flex flex-col items-center relative z-10">
          
          {/* Titles */}
          <h3 className="text-2xl sm:text-3xl font-black text-text-theme-primary tracking-tight text-center mb-3 line-clamp-2 leading-tight">
            {lectureTitle}
          </h3>
          <div className="flex items-center gap-2 mb-10 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <span className="text-primary text-[11px] font-black uppercase tracking-[0.2em]">أدخل كود الحضور</span>
          </div>

          <form onSubmit={handleSubmit} className="w-full">
            {/* 6-Digit Code Display */}
            <div className="relative w-full mb-10">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 dark:from-primary/20 dark:via-secondary/20 dark:to-primary/20 blur-xl rounded-full opacity-50" />
              
              <div className="relative bg-gray-50 dark:bg-black/40 p-6 sm:p-8 rounded-[2rem] shadow-inner border border-gray-200 dark:border-[#ffffff]/5 flex justify-center items-center overflow-hidden">
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ffffff]/50 dark:via-[#ffffff]/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                
                <div className="relative flex gap-2 sm:gap-3 dir-ltr">
                  {/* The visible boxes */}
                  {[0, 1, 2, 3, 4, 5].map((index) => {
                    const digit = code[index] || '';
                    const isActive = index === code.length;
                    return (
                      <div 
                        key={index}
                        className={`w-10 sm:w-14 h-14 sm:h-20 bg-[#ffffff] dark:bg-[#1e2243] rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg flex items-center justify-center transition-all duration-300 ${isActive ? 'border-2 border-primary ring-4 ring-primary/20 scale-105' : 'border border-[#000000]/30 dark:border-[#ffffff]/10'}`}
                      >
                        <span className="text-3xl sm:text-5xl font-black text-[#000000] dark:text-[#ffffff] font-mono">
                          {digit}
                        </span>
                      </div>
                    );
                  })}

                  {/* Hidden Input capturing everything */}
                  <input
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-text text-transparent outline-none z-10"
                    autoFocus
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={code.length !== 6 || isSubmitting}
              className="group relative w-full h-16 mb-4 rounded-2xl bg-gradient-to-r from-primary to-secondary overflow-hidden transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 hover:shadow-primary/40"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative text-white font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                {isSubmitting ? <Icon name="spinner" spin /> : <Icon name="check" />} 
                {isSubmitting ? 'جاري التحقق...' : 'تأكيد الحضور'}
              </span>
            </button>
          </form>

          {/* Cancel Button */}
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-gray-100 dark:bg-surface-secondary hover:bg-gray-200 dark:hover:bg-surface-tertiary text-gray-900 dark:text-text-theme-primary font-black text-xs border border-gray-300 dark:border-border-theme-primary transition-all active:scale-95 disabled:opacity-50 uppercase tracking-[0.2em]"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodeEntryModal;
