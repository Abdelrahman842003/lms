import React from 'react';
import { Button } from './Button';
import { Icon } from './Icon';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Select } from './Select';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  formData: {
    title: string;
    message: string;
    recipient_type: string;
    grade_id?: string;
    group_id?: string;
  };
  setFormData: (data: any) => void;
  isLoading?: boolean;
  isDeveloperMode?: boolean;
  grades?: Array<{ id: string; name: string }>;
  groups?: Array<{ id: string; name: string }>;
}

export default function NotificationModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  formData,
  setFormData,
  isLoading = false,
  isDeveloperMode = false,
  grades = [],
  groups = []
}: NotificationModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" 
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[600px] bg-[#1e1e2d] rounded-xl shadow-2xl border border-white/10 animate-scaleIn" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white m-0">{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            onClick={onClose}
          >
            <Icon name="times" size="sm" />
          </Button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="p-6 space-y-4">
            {/* Title Field */}
            <Input
              id="notification-title"
              label="العنوان"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
              placeholder={isDeveloperMode ? "مثال: طلب تعديل، إبلاغ عن مشكلة..." : "مثال: تنبيه هام"}
            />
            
            {/* Message Field */}
            <Textarea
              id="notification-message"
              label="الرسالة"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              required
              rows={4}
              placeholder="اكتب رسالتك هنا..."
            />

            {/* Recipient Type (only for non-developer mode) */}
            {!isDeveloperMode && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">المستقبلين</label>
                <Select
                  value={formData.recipient_type}
                  onChange={(value) => setFormData({...formData, recipient_type: value, grade_id: '', group_id: ''})}
                  options={[
                    { value: 'all', label: 'جميع الطلاب' },
                    { value: 'grade', label: 'صف دراسي معين' },
                    { value: 'group', label: 'مجموعة معينة' }
                  ]}
                />
              </div>
            )}

            {/* Grade Selection */}
            {formData.recipient_type === 'grade' && grades.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">اختر الصف</label>
                <Select
                  value={formData.grade_id || ''}
                  onChange={(value) => setFormData({...formData, grade_id: value})}
                  options={[
                    { value: '', label: 'اختر صف...' },
                    ...grades.map((grade) => ({ value: grade.id, label: grade.name }))
                  ]}
                />
              </div>
            )}

            {/* Group Selection */}
            {formData.recipient_type === 'group' && groups.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">اختر المجموعة</label>
                <Select
                  value={formData.group_id || ''}
                  onChange={(value) => setFormData({...formData, group_id: value})}
                  options={[
                    { value: '', label: 'اختر مجموعة...' },
                    ...groups.map((group) => ({ value: group.id, label: group.name }))
                  ]}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-black/20 rounded-b-xl">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
            >
              إرسال
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
