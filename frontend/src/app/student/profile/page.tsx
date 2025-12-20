'use client';

import React from 'react';
import { DashboardLayout, DashboardCard } from '@/components/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { uploadAvatar, deleteAvatar, getAvatarUrl } from '@/services/avatarService';
import { ImageCropModal, ConfirmationModal, Skeleton } from '@/components/ui';
import { AuthInput } from '@/components/auth/AuthInput';
import NotificationSettings from '@/components/NotificationSettings';

export default function StudentProfilePage() {
  const { user, isLoading } = useAuth();
  const [isEditing, setIsEditing] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Crop modal state
  const [showCropModal, setShowCropModal] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formData, setFormData] = React.useState({
    name: user?.name || '-',
    phone: user?.phone || '-',
    parent_phone: user?.parent_phone || '-',
    location: user?.location || '-',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Update form data when user data is available
  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '-',
        phone: user.phone || '-',
        parent_phone: user.parent_phone || '-',
        location: user.location || '-',
      }));
    }
  }, [user]);

  // Load avatar on mount
  React.useEffect(() => {
    loadAvatar();
  }, []);

  const loadAvatar = async () => {
    try {
      // Check if user is authenticated first
      const token = localStorage.getItem('token');
      if (!token) {
        return; // No token, skip loading avatar
      }

      const response = await getAvatarUrl();
      if (response.success && response.data?.url) {
        setAvatarUrl(response.data.url);
      }
    } catch (err) {
      // Silently handle - it's ok if no avatar exists
      // No avatar found - silently handle
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار صورة صحيحة');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الصورة يجب أن لا يتجاوز 5 ميغابايت');
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
    setIsUploadingAvatar(true);

    try {
      // Convert blob to file
      const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
      
      const response = await uploadAvatar(file);
      if (response.success && response.data?.url) {
        setAvatarUrl(response.data.url);
      }
    } catch (err: any) {
      alert(err.message || 'فشل رفع الصورة');
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
      setShowDeleteModal(false);
    } catch (err: any) {
      alert(err.message || 'فشل حذف الصورة');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement profile update
    // TODO: Implement profile update API call
    setIsEditing(false);
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
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
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

    // TODO: Implement password change
    // TODO: Implement password change API call
    // Clear errors on success (mock)
    setErrors({});
  };

  return (
    <DashboardLayout
      role="student"
      user={user || undefined}
    >
      <div className="max-w-[1200px] mx-auto flex flex-col gap-8">
        {/* Profile Info Card */}
        <DashboardCard
          title="المعلومات الشخصية"
          icon="fas fa-user"
          action={
            isLoading ? null : (
              <button
                className="btn btn-primary"
                onClick={() => setIsEditing(!isEditing)}
              >
                <i className={isEditing ? 'fas fa-times' : 'fas fa-edit'}></i>
                <span>{isEditing ? 'إلغاء' : 'تعديل'}</span>
              </button>
            )
          }
        >

          <div className="py-6">
            {/* Profile Avatar */}
            <div className="flex flex-col md:flex-row items-center gap-6 mb-8 text-center md:text-right">
              {isLoading ? (
                <Skeleton className="h-[120px] w-[120px] rounded-full shrink-0" />
              ) : (
                <div
                  className={`w-[120px] h-[120px] rounded-full flex items-center justify-center text-[3rem] font-bold text-white relative overflow-hidden shrink-0 ${avatarUrl ? 'bg-transparent' : 'bg-gradient-to-br from-primary to-secondary'}`}
                >
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user?.name?.charAt(0) || 'S'
                  )}
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-8 h-8 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex flex-col items-center md:items-start w-full md:w-auto">
                {isLoading ? (
                  <div className="flex flex-col items-center md:items-start gap-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {user?.name || 'طالب'}
                    </h3>
                    <p className="text-base text-gray-light mb-2">
                      طالب
                    </p>
                    {isEditing && (
                      <div className="flex gap-2 mt-3 justify-center md:justify-start">
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
                  </>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
                <div>
                  <AuthInput
                    id="name"
                    label="الاسم"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={true}
                    isLoading={isLoading}
                    className="w-full p-3 bg-white/2 border border-white/10 rounded-lg text-white text-[0.95rem] font-tajawal !text-center"
                  />
                </div>



                <div>
                  <AuthInput
                    id="phone"
                    label="رقم الهاتف"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={true}
                    isLoading={isLoading}
                    className="w-full p-3 bg-white/2 border border-white/10 rounded-lg text-white text-[0.95rem] font-tajawal !text-center"
                  />
                </div>

                <div>
                  <AuthInput
                    id="parent_phone"
                    label="رقم ولي الأمر"
                    value={formData.parent_phone}
                    onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                    disabled={true}
                    isLoading={isLoading}
                    className="w-full p-3 bg-white/2 border border-white/10 rounded-lg text-white text-[0.95rem] font-tajawal !text-center"
                  />
                </div>

                <div className="full-width">
                  <AuthInput
                    id="location"
                    label="الموقع"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    disabled={!isEditing}
                    isLoading={isLoading}
                    className={`!w-[93%] mx-auto md:!w-full p-3 border border-white/10 rounded-lg text-white text-[0.95rem] font-tajawal !text-center ${isEditing ? 'bg-white/5' : 'bg-white/2'}`}
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

        {/* Notification Settings Card */}
        <NotificationSettings />

        {/* Change Password Card */}
        <DashboardCard
          title="تغيير كلمة المرور"
          icon="fas fa-lock"
        >

          <div className="py-6">
            <form onSubmit={handlePasswordChange}>
              <div className="grid gap-6 max-w-[600px] mx-auto">
                <div>
                  <AuthInput
                    id="currentPassword"
                    type="password"
                    label="كلمة المرور الحالية"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    error={errors.currentPassword}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white text-[0.95rem] font-tajawal !text-center"
                  />
                </div>

                <div>
                  <AuthInput
                    id="newPassword"
                    type="password"
                    label="كلمة المرور الجديدة"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    error={errors.newPassword}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white text-[0.95rem] font-tajawal !text-center"
                  />
                </div>

                <div>
                  <AuthInput
                    id="confirmPassword"
                    type="password"
                    label="تأكيد كلمة المرور الجديدة"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    error={errors.confirmPassword}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white text-[0.95rem] font-tajawal !text-center"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-center">
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
