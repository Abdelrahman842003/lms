import React from 'react';

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
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors" 
            onClick={onClose}
            type="button"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="p-6 space-y-4">
            {/* Title Field */}
            <div className="space-y-2">
              <label htmlFor="notification-title" className="block text-sm font-medium text-gray-300">
                العنوان
              </label>
              <input
                type="text"
                id="notification-title"
                className="w-full p-3 bg-[#151521] border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
                placeholder={isDeveloperMode ? "مثال: طلب تعديل، إبلاغ عن مشكلة..." : "مثال: تنبيه هام"}
              />
            </div>
            
            {/* Message Field */}
            <div className="space-y-2">
              <label htmlFor="notification-message" className="block text-sm font-medium text-gray-300">
                الرسالة
              </label>
              <textarea
                id="notification-message"
                className="w-full p-3 bg-[#151521] border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all min-h-[120px] resize-y"
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                required
                rows={4}
                placeholder="اكتب رسالتك هنا..."
              />
            </div>

            {/* Recipient Type (only for non-developer mode) */}
            {!isDeveloperMode && (
              <div className="space-y-2">
                <label htmlFor="recipient-type" className="block text-sm font-medium text-gray-300">
                  المستقبلين
                </label>
                <select
                  id="recipient-type"
                  className="w-full p-3 bg-[#151521] border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer appearance-none"
                  value={formData.recipient_type}
                  onChange={(e) => setFormData({...formData, recipient_type: e.target.value, grade_id: '', group_id: ''})}
                >
                  <option value="all" className="bg-[#1a1f37]">جميع الطلاب</option>
                  <option value="grade" className="bg-[#1a1f37]">صف دراسي معين</option>
                  <option value="group" className="bg-[#1a1f37]">مجموعة معينة</option>
                </select>
              </div>
            )}

            {/* Grade Selection */}
            {formData.recipient_type === 'grade' && grades.length > 0 && (
              <div className="space-y-2">
                <label htmlFor="grade-select" className="block text-sm font-medium text-gray-300">
                  اختر الصف
                </label>
                <select
                  id="grade-select"
                  className="w-full p-3 bg-[#151521] border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer appearance-none"
                  value={formData.grade_id || ''}
                  onChange={(e) => setFormData({...formData, grade_id: e.target.value})}
                  required
                >
                  <option value="" className="bg-[#1a1f37]">اختر صف...</option>
                  {grades.map((grade) => (
                    <option key={grade.id} value={grade.id} className="bg-[#1a1f37]">
                      {grade.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Group Selection */}
            {formData.recipient_type === 'group' && groups.length > 0 && (
              <div className="space-y-2">
                <label htmlFor="group-select" className="block text-sm font-medium text-gray-300">
                  اختر المجموعة
                </label>
                <select
                  id="group-select"
                  className="w-full p-3 bg-[#151521] border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer appearance-none"
                  value={formData.group_id || ''}
                  onChange={(e) => setFormData({...formData, group_id: e.target.value})}
                  required
                >
                  <option value="" className="bg-[#1a1f37]">اختر مجموعة...</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id} className="bg-[#1a1f37]">
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-black/20 rounded-b-xl">
            <button
              type="button"
              className="px-6 py-2.5 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-all duration-200 font-medium"
              onClick={onClose}
              disabled={isLoading}
            >
              إلغاء
            </button>
            <button 
              type="submit" 
              className="px-6 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all duration-200 font-medium disabled:opacity-70 disabled:cursor-not-allowed" 
              disabled={isLoading}
            >
              {isLoading ? 'جاري الإرسال...' : 'إرسال'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
