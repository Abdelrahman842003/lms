'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/AuthContext';
import { secretaryService } from '@/services/secretaryService';
import { getTeacherPermissions, Permission } from '@/services/roles';
import { useRouter } from 'next/navigation';

export default function AddSecretaryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isCustomPermissions, setIsCustomPermissions] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    permissions: [] as string[],
  });

  useEffect(() => {
    fetchPermissions();
  }, []);

  // Auto-generate password when name and phone are provided
  useEffect(() => {
    if (formData.name && formData.phone) {
      const nameSlug = formData.name.trim().toLowerCase().replace(/\s+/g, '-');
      const generatedPassword = `${nameSlug}${formData.phone}`;
      
      setFormData(prev => ({
        ...prev,
        password: generatedPassword
      }));
    }
  }, [formData.name, formData.phone]);

  const fetchPermissions = async () => {
    try {
      const response = await getTeacherPermissions();
      // Safely extract permissions array handling different response structures
      const permissionsList = Array.isArray(response.data) 
        ? response.data 
        : (Array.isArray(response) ? response : []);
        
      const secretaryPermissions = permissionsList.filter(
        (p: Permission) => p.guard_name === 'secretary'
      );
      setAvailablePermissions(secretaryPermissions);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = 'الاسم مطلوب';
    if (!formData.phone.trim()) errors.phone = 'رقم الهاتف مطلوب';
    if (!formData.password || formData.password.length < 6) errors.password = 'كلمة المرور مطلوبة (6 أحرف على الأقل)';

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
    try {
      // If custom permissions is NOT enabled, assign ALL available permissions
      const permissionsToSubmit = isCustomPermissions 
        ? formData.permissions 
        : availablePermissions.map(p => p.name);

      await secretaryService.createSecretary({
        ...formData,
        permissions: permissionsToSubmit
      });
      router.push('/teacher/secretaries');
    } catch (error: any) {
      console.error('Failed to create secretary:', error);
      setFormErrors({ submit: error.message || 'فشل إضافة السكرتير' });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        title="إضافة سكرتير جديد"
        icon="fas fa-user-plus"
      >
        <form onSubmit={handleSubmit}>
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
              <label htmlFor="password" className="block text-gray-light mb-2 text-sm">كلمة المرور (تلقائي)</label>
              <input
                type="text"
                id="password"
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white/50 cursor-not-allowed"
                value={formData.password}
                readOnly
                disabled
              />
            </div>

            <div className="md:col-span-2 mt-5">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex flex-col gap-1">
                  <label className="m-0 text-base text-white">صلاحيات السكرتير</label>
                  <span className="text-sm text-gray-light">
                    {isCustomPermissions ? 'قم بتحديد الصلاحيات المطلوبة' : 'سيتم منح جميع الصلاحيات تلقائياً'}
                  </span>
                </div>
                
                <button
                  type="button"
                  onClick={() => setIsCustomPermissions(!isCustomPermissions)}
                  className={`px-4 py-2 rounded-lg text-sm cursor-pointer flex items-center gap-2 transition-all duration-300 font-inherit ${
                    isCustomPermissions 
                      ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                      : 'bg-primary/10 text-primary border border-primary/20'
                  }`}
                >
                  <i className={`fas ${isCustomPermissions ? 'fa-sliders-h' : 'fa-check-double'}`}></i>
                  {isCustomPermissions ? 'تخصيص الصلاحيات (مفعل)' : 'تفعيل جميع الصلاحيات'}
                </button>
              </div>

              <div className={`rounded-xl border border-white/5 p-5 transition-all duration-300 ${
                isCustomPermissions ? 'opacity-100 pointer-events-auto filter-none' : 'opacity-70 pointer-events-none grayscale-[0.5]'
              }`}>
                {!isCustomPermissions && (
                  <div className="text-center p-5 text-green-500 flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-2xl">
                      <i className="fas fa-check"></i>
                    </div>
                    <p className="m-0 text-base">جميع الصلاحيات مفعلة افتراضياً</p>
                  </div>
                )}

                <div className={`gap-3 animate-fadeIn ${isCustomPermissions ? 'grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))]' : 'hidden'}`}>
                  {availablePermissions.length > 0 ? (
                    availablePermissions.map((permission) => {
                      const isSelected = formData.permissions.includes(permission.name);
                      return (
                        <label 
                          key={permission.id} 
                          className={`flex items-center gap-3 cursor-pointer px-4 py-3 rounded-lg transition-all duration-200 select-none ${
                            isSelected 
                              ? 'bg-primary/10 border border-primary' 
                              : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                            isSelected 
                              ? 'border-primary bg-primary' 
                              : 'border-gray-light bg-transparent'
                          }`}>
                            {isSelected && <i className="fas fa-check text-[0.7rem] text-white"></i>}
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handlePermissionChange(permission.name)}
                            disabled={isSubmitting}
                            className="hidden"
                          />
                          <span className={`text-[0.95rem] ${isSelected ? 'text-white' : 'text-gray-light'}`}>{permission.name}</span>
                        </label>
                      );
                    })
                  ) : (
                    <p className="text-gray-light col-span-full text-center">
                      لا توجد صلاحيات متاحة للسكرتارية
                    </p>
                  )}
                </div>
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
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </DashboardCard>
    </DashboardLayout>
  );
}
