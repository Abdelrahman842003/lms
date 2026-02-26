import React, { useState } from 'react';
import { FormModal, LoadingSpinner, Button, Icon } from '@/components/ui';
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

  const handleToggle = async (teacherId: string) => {
    setProcessingId(teacherId);
    try {
      await onConfirm(teacherId);
    } catch (error) {
      // Error handled silently
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => { e.preventDefault(); onClose(); }}
      title={title}
      submitText=""
      cancelText="إغلاق"
      maxWidth="500px"
    >
      <div className="space-y-6">
        <div>
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
                    <LoadingSpinner size="sm" color="primary" />
                  ) : (
                    !teacher.is_active ? 'تنشيط' : 'تعليق'
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FormModal>
  );
};
