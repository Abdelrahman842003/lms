import React from 'react';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  submitText?: string;
  cancelText?: string;
  maxWidth?: string;
}

export default function FormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  isLoading = false,
  submitText = 'حفظ',
  cancelText = 'إلغاء',
  maxWidth = '600px'
}: FormModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" 
      onClick={onClose}
    >
      <div 
        className="w-full bg-[#1e1e2d] rounded-xl shadow-2xl border border-white/10 animate-scaleIn" 
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white m-0">{title}</h3>
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors" 
            onClick={onClose}
            type="button"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={onSubmit}>
          {/* Body */}
          <div className="p-6 space-y-4">
            {children}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-black/20 rounded-b-xl">
            {cancelText && (
              <button
                type="button"
                className="px-6 py-2.5 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-all duration-200 font-medium"
                onClick={onClose}
                disabled={isLoading}
              >
                {cancelText}
              </button>
            )}
            <button 
              type="submit" 
              className="px-6 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all duration-200 font-medium disabled:opacity-70 disabled:cursor-not-allowed" 
              disabled={isLoading}
            >
              {isLoading ? 'جاري المعالجة...' : submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
