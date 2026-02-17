'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { uploadAvatar, deleteAvatar, getAvatarUrl } from '@/services/avatarService';
import { getAuthToken } from '@/services/authService';
import { ImageCropModal, ConfirmationModal, Skeleton } from '@/components/ui';
import { toast } from 'react-hot-toast';

export default function AcademyProfilePage() {
  const { user, isLoading, updateUser } = useAuth();
  const [isEditing, setIsEditing] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Crop modal state
  const [showCropModal, setShowCropModal] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  
  const [formData, setFormData] = React.useState({
    name: '',
    phone: '',
    location: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [passwordStrength, setPasswordStrength] = React.useState(0);

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 1;
    if (password.match(/\d/)) strength += 1;
    if (password.match(/[^a-zA-Z\d]/)) strength += 1;
    return strength;
  };

  React.useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(formData.newPassword));
  }, [formData.newPassword]);

  // Update form data when user data is available
  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || '',
        location: user.location || '',
      }));
    }
  }, [user]);

  // Load avatar on mount and when user changes
  React.useEffect(() => {
    // If user has avatar in context, use it
    if (user?.avatar) {
      setAvatarUrl(user.avatar);
    } else {
      // Otherwise, try to load from API
      loadAvatar();
    }
  }, [user?.avatar]);

  const loadAvatar = async () => {
    try {
      // Check if user is authenticated first
      const token = getAuthToken();
      if (!token) {
        return; // No token, skip loading avatar
      }

      const response = await getAvatarUrl();
      if (response.success && response.data?.url) {
        setAvatarUrl(response.data.url);
      }
    } catch (err) {
      // Silently handle - it's ok if no avatar exists
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار صورة صحيحة');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن لا يتجاوز 5 ميغابايت');
      return;
    }

    // Read file and show crop modal
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropModal(false);
    setSelectedImage(null);
    
    // Show preview immediately
    const previewUrl = URL.createObjectURL(croppedBlob);
    setAvatarPreview(previewUrl);
    
    // Update navbar immediately with preview
    updateUser({ avatar: previewUrl });
    setIsUploadingAvatar(true);

    try {
      // Convert blob to file
      const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
      
      const response = await uploadAvatar(file);
      if (response.success && response.data?.url) {
        // Clear preview and set actual URL
        setAvatarPreview(null);
        setAvatarUrl(response.data.url);
        // Update user avatar in AuthContext with actual URL
        updateUser({ avatar: response.data.url });
        toast.success('تم تحديث الصورة الشخصية بنجاح');
      }
    } catch (err: any) {
      // Clear preview on error
      setAvatarPreview(null);
      // Revert to previous avatar on error
      updateUser({ avatar: avatarUrl || undefined });
      toast.error(err.message || 'فشل رفع الصورة');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setSelectedImage(null);
  };

  const handleAvatarDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setIsUploadingAvatar(true);
    try {
      await deleteAvatar();
      setAvatarUrl(null);
      setAvatarPreview(null);
      // Update user avatar in AuthContext so it clears from navbar
      updateUser({ avatar: undefined });
      setShowDeleteModal(false);
      toast.success('تم حذف الصورة الشخصية بنجاح');
    } catch (err: any) {
      toast.error(err.message || 'فشل حذف الصورة');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = getAuthToken();
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

      const response = await fetch(`${API_URL}/academy/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          location: formData.location,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'فشل تحديث الملف الشخصي');
      }

      toast.success('تم تحديث الملف الشخصي بنجاح');
      setIsEditing(false);
      
      // Update local user state
      if (data.data?.user) {
         updateUser(data.data.user);
      }
    } catch (err: any) {
      toast.error(err.message || 'فشل تحديث الملف الشخصي');
    }
  };

  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'يرجى إدخال كلمة المرور الحالية';
      isValid = false;
    }
    if (!formData.newPassword) {
      newErrors.newPassword = 'يرجى إدخال كلمة المرور الجديدة';
      isValid = false;
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل';
      isValid = false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    try {
      const token = getAuthToken();
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

      const response = await fetch(`${API_URL}/academy/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          current_password: formData.currentPassword,
          new_password: formData.newPassword,
          new_password_confirmation: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'فشل تغيير كلمة المرور');
      }

      toast.success('تم تغيير كلمة المرور بنجاح');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      setErrors({});
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء تغيير كلمة المرور');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="academy" user={user || undefined}>
        <div className="max-w-[1200px] mx-auto">
          {/* Profile Info Card Skeleton */}
          <div className="dashboard-card mb-6 p-6">
            <div className="flex justify-between items-center mb-6">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-8 w-20" />
            </div>
            <div className="flex items-center gap-6 mb-8">
              <Skeleton className="h-32 w-32 rounded-full" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
              <div>
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
              <div>
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="academy" user={user || undefined}>
      <div className="max-w-[1200px] mx-auto">
        {/* Profile Info Card */}
        <DashboardCard
          title="المعلومات الشخصية"
          icon="fas fa-user"
          action={
            <button
              className="btn btn-primary"
              onClick={() => setIsEditing(!isEditing)}
            >
              <i className={isEditing ? 'fas fa-times' : 'fas fa-edit'}></i>
              <span>{isEditing ? 'إلغاء' : 'تعديل'}</span>
            </button>
          }
        >
          <div className="py-6">
            {/* Profile Avatar */}
            <div className="flex items-center gap-6 mb-8">
              <div
                className={`w-[120px] h-[120px] rounded-full flex items-center justify-center text-5xl font-bold text-white relative overflow-hidden ${(avatarPreview || avatarUrl) ? '' : 'bg-gradient-to-br from-primary to-secondary'}`}
              >
                {(avatarPreview || avatarUrl) ? (
                  <img 
                    src={avatarPreview || avatarUrl || ''} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.name?.charAt(0) || 'A'
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-8 h-8 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {user?.name || 'الأكاديمية'}
                </h3>
                <p className="text-base text-gray-light mb-2">
                  أكاديمية
                </p>
                {isEditing && (
                  <div className="flex gap-2 mt-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <button 
                      className="btn btn-sm btn-outline" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                    >
                      <i className="fas fa-camera"></i>
                      <span>{avatarUrl ? 'تغيير الصورة' : 'رفع صورة'}</span>
                    </button>
                    {avatarUrl && (
                      <button 
                        className="btn btn-sm btn-outline bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500/20" 
                        onClick={handleAvatarDelete}
                        disabled={isUploadingAvatar}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
                <div>
                  <label className="block text-gray-light text-sm mb-2 font-semibold">
                    الاسم
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border border-white/10 rounded-lg text-white text-[0.95rem] font-tajawal ${isEditing ? 'bg-white/5' : 'bg-white/2'}`}
                  />
                </div>

                <div>
                  <label className="block text-gray-light text-sm mb-2 font-semibold">
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border border-white/10 rounded-lg text-white text-[0.95rem] font-tajawal ${isEditing ? 'bg-white/5' : 'bg-white/2'}`}
                  />
                </div>

                <div>
                  <label className="block text-gray-light text-sm mb-2 font-semibold">
                    الموقع
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border border-white/10 rounded-lg text-white text-[0.95rem] font-tajawal ${isEditing ? 'bg-white/5' : 'bg-white/2'}`}
                  />
                </div>
              </div>

              {isEditing && (
                <div className="mt-6 flex gap-3 justify-end">
                  <button type="button" className="btn btn-outline" onClick={() => setIsEditing(false)}>
                    إلغاء
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i className="fas fa-save"></i>
                    <span>حفظ التغييرات</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </DashboardCard>

        {/* Change Password Card */}
        <DashboardCard
          title="تغيير كلمة المرور"
          icon="fas fa-lock"
        >
          <div className="py-6">
            <form onSubmit={handlePasswordChange}>
              <div className="grid gap-6 max-w-[600px]">
                <div>
                  <label className="block text-gray-light text-sm mb-2 font-semibold">
                    كلمة المرور الحالية
                  </label>
                  <input
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white text-[0.95rem] font-tajawal ${
                      errors.currentPassword ? 'border-red-500/50' : 'border-white/10'
                    }`}
                  />
                  {errors.currentPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.currentPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-light text-sm mb-2 font-semibold">
                    كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white text-[0.95rem] font-tajawal ${
                      errors.newPassword ? 'border-red-500/50' : 'border-white/10'
                    }`}
                  />
                  {errors.newPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
                  )}
                  {formData.newPassword && (
                    <div className="mt-2 flex gap-1 h-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-full flex-1 rounded-full transition-all duration-300 ${
                            i < passwordStrength
                              ? passwordStrength <= 2
                                ? 'bg-red-500'
                                : passwordStrength === 3
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                              : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-1 flex justify-between">
                    <span>ضعيف</span>
                    <span>قوي</span>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-light text-sm mb-2 font-semibold">
                    تأكيد كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white text-[0.95rem] font-tajawal ${
                      errors.confirmPassword || (formData.confirmPassword && formData.newPassword !== formData.confirmPassword)
                        ? 'border-red-500/50'
                        : formData.confirmPassword && formData.newPassword === formData.confirmPassword
                        ? 'border-green-500/50'
                        : 'border-white/10'
                    }`}
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                  )}
                  {formData.confirmPassword && (
                    <p className={`text-xs mt-1 ${
                      formData.newPassword === formData.confirmPassword ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {formData.newPassword === formData.confirmPassword ? 'كلمات المرور متطابقة' : 'كلمات المرور غير متطابقة'}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-key"></i>
                  <span>تغيير كلمة المرور</span>
                </button>
              </div>
            </form>
          </div>
        </DashboardCard>
      </div>

      {/* Image Crop Modal */}
      {showCropModal && selectedImage && (
        <ImageCropModal
          image={selectedImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="حذف الصورة الشخصية"
        message="هل أنت متأكد من رغبتك في حذف الصورة الشخصية؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        cancelText="إلغاء"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        isProcessing={isUploadingAvatar}
      />
    </DashboardLayout>
  );
}
