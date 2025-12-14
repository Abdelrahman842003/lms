'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/AuthContext';
import { secretaryService } from '@/services/secretaryService';
import { getTeacherPermissions, Permission } from '@/services/roles';
import { useRouter, useParams } from 'next/navigation';

export default function EditSecretaryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const secretaryId = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    username: '',
    password: '',
    permissions: [] as string[],
  });

  useEffect(() => {
    fetchData();
  }, [secretaryId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [secretaryResponse, permissionsResponse] = await Promise.all([
        secretaryService.getSecretary(secretaryId),
        getTeacherPermissions(),
      ]);

      const secretary = secretaryResponse.secretary;
      const permissionsList = permissionsResponse.data || [];
      const secretaryPermissions = permissionsList.filter(
        (p: Permission) => p.guard_name === 'secretary'
      );

      setAvailablePermissions(secretaryPermissions);
      setFormData({
        name: secretary.name,
        phone: secretary.phone || '',
        username: secretary.username,
        password: '', // Don't show password
        permissions: secretary.permission_names || [],
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setFormErrors({ submit: 'فشل تحميل البيانات' });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = 'الاسم مطلوب';
    if (!formData.phone.trim()) errors.phone = 'رقم الهاتف مطلوب';
    if (!formData.username.trim()) errors.username = 'اسم المستخدم مطلوب';
    if (formData.password && formData.password.length < 6) errors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePermissionChange = (permissionName: string) => {
    setFormData(prev => {
      const newPermissions = prev.permissions.includes(permissionName)
        ? prev.permissions.filter(p => p !== permissionName)
        : [...prev.permissions, permissionName];
      return { ...prev, permissions: newPermissions };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSuccessMessage('');
    setFormErrors({});

    try {
      // Update details
      await secretaryService.updateSecretary(secretaryId, {
        name: formData.name,
        phone: formData.phone,
        username: formData.username,
        ...(formData.password && { password: formData.password }),
      });

      // Update permissions
      await secretaryService.updatePermissions(secretaryId, formData.permissions);

      setSuccessMessage('تم تحديث بيانات السكرتير بنجاح');
      setTimeout(() => {
        router.push('/teacher/secretaries');
      }, 1500);
    } catch (error: any) {
      console.error('Failed to update secretary:', error);
      setFormErrors({ submit: error.message || 'فشل تحديث البيانات' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      null
    );
  }

  return (
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={{
        name: user?.name || 'المدرس',
        avatar: user?.avatar || '',
      }}
      headerActions={null}
    >
      <DashboardCard
        title="تعديل بيانات السكرتير"
        icon="fas fa-user-edit"
      >
        <form onSubmit={handleSubmit}>
          {successMessage && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-lg mb-6 flex items-center gap-3">
              <i className="fas fa-check-circle text-xl"></i>
              <span>{successMessage}</span>
            </div>
          )}

          {formErrors.submit && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg mb-6 flex items-center gap-3">
              <i className="fas fa-exclamation-circle text-xl"></i>
              <span>{formErrors.submit}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-gray-light mb-2 text-sm">الاسم <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="name"
                className={`w-full p-3 bg-white/5 border rounded-lg text-white focus:ring-1 outline-none transition-all ${
                  formErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-primary focus:ring-primary'
                }`}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="أدخل اسم السكرتير"
                disabled={isSubmitting}
              />
              {formErrors.name && <span className="text-red-500 text-sm mt-1 block">{formErrors.name}</span>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-gray-light mb-2 text-sm">رقم الهاتف <span className="text-red-500">*</span></label>
              <input
                type="tel"
                id="phone"
                className={`w-full p-3 bg-white/5 border rounded-lg text-white focus:ring-1 outline-none transition-all ${
                  formErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-primary focus:ring-primary'
                }`}
                value={formData.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setFormData({ ...formData, phone: value });
                }}
                placeholder="أدخل رقم الهاتف"
                disabled={isSubmitting}
              />
              {formErrors.phone && <span className="text-red-500 text-sm mt-1 block">{formErrors.phone}</span>}
            </div>

            <div>
              <label htmlFor="username" className="block text-gray-light mb-2 text-sm">اسم المستخدم <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="username"
                className={`w-full p-3 bg-white/5 border rounded-lg text-white focus:ring-1 outline-none transition-all ${
                  formErrors.username ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-primary focus:ring-primary'
                }`}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="أدخل اسم المستخدم"
                disabled={isSubmitting}
              />
              {formErrors.username && <span className="text-red-500 text-sm mt-1 block">{formErrors.username}</span>}
            </div>

            <div>
              <label htmlFor="password" className="block text-gray-light mb-2 text-sm">كلمة المرور (اتركها فارغة إذا لم ترد التغيير)</label>
              <input
                type="password"
                id="password"
                className={`w-full p-3 bg-white/5 border rounded-lg text-white focus:ring-1 outline-none transition-all ${
                  formErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-primary focus:ring-primary'
                }`}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="أدخل كلمة المرور الجديدة"
                disabled={isSubmitting}
              />
              {formErrors.password && <span className="text-red-500 text-sm mt-1 block">{formErrors.password}</span>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-light mb-2 text-sm">الصلاحيات</label>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 p-4 bg-white/5 rounded-lg mt-2">
                {availablePermissions.length > 0 ? (
                  availablePermissions.map((permission) => (
                    <label key={permission.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission.name)}
                        onChange={() => handlePermissionChange(permission.name)}
                        disabled={isSubmitting}
                        className="w-[18px] h-[18px] rounded border-white/10 bg-white/5 text-primary focus:ring-primary"
                      />
                      <span className="text-white">{permission.name}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-gray-light col-span-full text-center">
                    لا توجد صلاحيات متاحة للسكرتارية
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </form>
      </DashboardCard>
    </DashboardLayout>
  );
}
