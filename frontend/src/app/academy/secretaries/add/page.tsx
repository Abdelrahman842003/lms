'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import academyService from '@/services/academyService';
import { getAcademyPermissions, Permission } from '@/services/roles';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AddSecretaryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isCustomPermissions, setIsCustomPermissions] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [existingSecretary, setExistingSecretary] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    permissions: [] as string[],
  });

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const response = await getAcademyPermissions();
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

  const checkPhone = async (phone: string) => {
    if (!phone || phone.length < 11) return;
    
    setIsCheckingPhone(true);
    try {
      const response = await academyService.checkPhoneAvailability(phone);
      if (response.exists && response.secretary) {
        setExistingSecretary(response.secretary);
        setFormData(prev => ({
          ...prev,
          name: response.secretary.name,
          // Keep password empty or whatever, it won't be used
        }));
        toast.success('هذا السكرتير موجود بالفعل، سيتم إضافته لقائمتك');
      } else {
        setExistingSecretary(null);
        // Don't clear name if user already typed it
      }
    } catch (error) {
      console.error('Failed to check phone:', error);
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = 'الاسم مطلوب';
    
    if (!formData.phone.trim()) {
      errors.phone = 'رقم الهاتف مطلوب';
    } else if (!/^01[0125][0-9]{8}$/.test(formData.phone)) {
      errors.phone = 'رقم الهاتف يجب أن يكون رقم مصري صحيح';
    }

    // Password is required only if it's a NEW secretary
    if (!existingSecretary) {
      if (!formData.password) {
        errors.password = 'كلمة المرور مطلوبة';
      } else if (formData.password.length < 6) {
        errors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      }
    }

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
      const permissionsToSubmit = isCustomPermissions 
        ? formData.permissions 
        : availablePermissions.map(p => p.name);

      await academyService.createSecretary({
        ...formData,
        permissions: permissionsToSubmit
      });
      toast.success(existingSecretary ? 'تم إضافة السكرتير بنجاح' : 'تم إنشاء حساب السكرتير بنجاح');
      router.push('/academy/secretaries');
    } catch (error: any) {
      console.error('Failed to create secretary:', error);
      setFormErrors({ submit: error.message || 'فشل إضافة السكرتير' });
      toast.error(error.message || 'فشل إضافة السكرتير');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      role="academy"
      user={user || undefined}
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
              <label htmlFor="phone" className="block text-gray-light mb-2 text-sm">رقم الهاتف <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="tel"
                  id="phone"
                  className={`w-full p-3 bg-white/5 border rounded-lg text-white focus:ring-1 outline-none transition-all ${
                    formErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-primary focus:ring-primary'
                  }`}
                  value={formData.phone}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^0-9]/g, '');
                    if (value.length > 11) value = value.slice(0, 11);
                    
                    setFormData({ ...formData, phone: value });

                    // Real-time validation
                    if (value.length > 0) {
                      if (!value.startsWith('01')) {
                        setFormErrors(prev => ({ ...prev, phone: 'يجب أن يبدأ الرقم ب 01' }));
                      } else if (value.length === 11 && !/^01[0125][0-9]{8}$/.test(value)) {
                        setFormErrors(prev => ({ ...prev, phone: 'رقم الهاتف غير صحيح' }));
                      } else {
                        setFormErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.phone;
                          return newErrors;
                        });
                      }
                    } else {
                        setFormErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.phone;
                          return newErrors;
                        });
                    }

                    if (value.length === 11 && /^01[0125][0-9]{8}$/.test(value)) {
                        checkPhone(value);
                    } else {
                        setExistingSecretary(null);
                    }
                  }}
                  onBlur={() => checkPhone(formData.phone)}
                  placeholder="أدخل رقم الهاتف"
                  disabled={isSubmitting}
                />
                {isCheckingPhone && (
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <i className="fas fa-spinner fa-spin text-primary"></i>
                  </div>
                )}
              </div>
              {formErrors.phone && <span className="text-red-500 text-sm mt-1 block">{formErrors.phone}</span>}
            </div>

            <div>
              <label htmlFor="name" className="block text-gray-light mb-2 text-sm">الاسم <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="name"
                className={`w-full p-3 bg-white/5 border rounded-lg text-white focus:ring-1 outline-none transition-all ${
                  formErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-primary focus:ring-primary'
                } ${existingSecretary ? 'opacity-70 cursor-not-allowed' : ''}`}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="أدخل اسم السكرتير"
                disabled={isSubmitting || !!existingSecretary}
                readOnly={!!existingSecretary}
              />
              {formErrors.name && <span className="text-red-500 text-sm mt-1 block">{formErrors.name}</span>}
              {existingSecretary && <span className="text-green-500 text-xs mt-1 block">تم العثور على حساب موجود بهذا الاسم</span>}
            </div>

            {!existingSecretary && (
              <div className="animate-fadeIn">
                <label htmlFor="password" className="block text-gray-light mb-2 text-sm">كلمة المرور <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  id="password"
                  className={`w-full p-3 bg-white/5 border rounded-lg text-white focus:ring-1 outline-none transition-all ${
                    formErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-primary focus:ring-primary'
                  }`}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="أدخل كلمة المرور"
                  disabled={isSubmitting}
                />
                {formErrors.password && <span className="text-red-500 text-sm mt-1 block">{formErrors.password}</span>}
              </div>
            )}

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
