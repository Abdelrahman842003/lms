import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface TeacherSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: any[];
  onConfirm: (teacherId: string) => Promise<void>;
  title: string;
  message: string;
  confirmText: string;
  variant: 'danger' | 'success';
}

export const TeacherSelectionModal: React.FC<TeacherSelectionModalProps> = ({
  isOpen,
  onClose,
  teachers,
  onConfirm,
  title,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const handleToggle = async (teacherId: string) => {
    setProcessingId(teacherId);
    try {
      await onConfirm(teacherId);
    } catch (error) {
      console.error('Error toggling status:', error);
    } finally {
      setProcessingId(null);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1E1E2D] border border-white/10 rounded-xl shadow-2xl w-full max-w-[500px] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* General Account Section - Optional or Placeholder if needed */}
          {/* For now, we focus on the list of teachers as requested */}
          
          <div className="">
            <h4 className="text-gray-300 text-sm font-medium mb-3">التعليق الجزئي (حسب المدرس)</h4>
            
            <div className="space-y-3">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold text-xs">
                      {teacher.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-200 text-sm font-medium">{teacher.name}</span>
                      <span className="text-gray-500 text-[10px]">{teacher.grade_name} - {teacher.group_name}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle(teacher.id)}
                    disabled={!!processingId}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      !teacher.is_active
                        ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20'
                        : 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20'
                    }`}
                  >
                    {processingId === teacher.id ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      !teacher.is_active ? 'تنشيط' : 'تعليق'
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="btn btn-outline px-6"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
