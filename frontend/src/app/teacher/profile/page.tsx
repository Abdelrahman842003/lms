'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/AuthContext';
import { uploadAvatar, deleteAvatar, getAvatarUrl } from '@/services/avatarService';
import { ImageCropModal, ConfirmationModal, Skeleton } from '@/components/ui';
import toast from 'react-hot-toast';

export default function TeacherProfile() {
  const { user, isLoading, updateUser } = useAuth();
  const [isEditing, setIsEditing] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(user?.avatar || null);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Crop modal state
  const [showCropModal, setShowCropModal] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  
  const [formData, setFormData] = React.useState({
    name: user?.name || '',
    username: user?.username || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Update form data and avatar when user data is available
  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        username: user.username || '',
      }));
      // Sync avatarUrl with user.avatar if avatarUrl is not set locally yet or to ensure sync
      if (user.avatar) {
        setAvatarUrl(user.avatar);
      }
    }
  }, [user]);

  // Load avatar on mount - fallback if user.avatar is not yet available or to get fresh URL
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
        // Also update context if needed
        if (updateUser) {
            updateUser({ avatar: response.data.url });
        }
      }
    } catch (err) {
      // Silently handle - it's ok if no avatar exists
      console.log('No avatar found or error loading avatar');
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
    setIsUploadingAvatar(true);

    try {
      // Convert blob to file
      const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
      
      const response = await uploadAvatar(file);
      if (response.success && response.data?.url) {
        setAvatarUrl(response.data.url);
        if (updateUser) {
            updateUser({ avatar: response.data.url });
        }
        toast.success('تم تحديث الصورة الشخصية بنجاح');
      }
    } catch (err: any) {
      const message = err.message || 'فشل رفع الصورة';
      toast.error(message);
      
      // Handle session expiry specifically
      if (message.includes('انتهت صلاحية الجلسة')) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
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
      if (updateUser) {
        updateUser({ avatar: null });
      }
      setShowDeleteModal(false);
      toast.success('تم حذف الصورة الشخصية بنجاح');
    } catch (err: any) {
      const message = err.message || 'فشل حذف الصورة';
      toast.error(message);
      
      if (message.includes('انتهت صلاحية الجلسة')) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement profile update
    console.log('Update profile:', formData);
    toast.success('تم حفظ التغييرات بنجاح');
    setIsEditing(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }
    // TODO: Implement password change
    console.log('Change password');
    toast.success('تم تغيير كلمة المرور بنجاح');
  };

  if (isLoading) {
    return (
      <DashboardLayout
        role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
        user={user || undefined}
      >
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
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={user || undefined}
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Profile Info Card */}
        <DashboardCard
          title="المعلومات الشخصية"
          icon="fas fa-user"
          className="mb-8"
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
                className={`w-[120px] h-[120px] rounded-full flex items-center justify-center text-5xl font-bold text-white relative overflow-hidden ${!avatarUrl ? 'bg-gradient-to-br from-primary to-secondary' : ''}`}
              >
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.name?.charAt(0) || 'U'
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-8 h-8 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {user?.name || 'مستخدم'}
                </h3>
                <p className="text-base text-gray-light mb-2">
                  {user?.userType === 'teacher' ? 'مدرس' : (user?.userType === 'secretary' ? 'سكرتير' : user?.userType || '')}
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
                    className={`form-input w-full font-tajawal ${!isEditing ? 'opacity-70' : ''}`}
                  />
                </div>

                <div>
                  <label className="block text-gray-light text-sm mb-2 font-semibold">
                    اسم المستخدم
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    disabled={!isEditing}
                    className={`form-input w-full font-tajawal ${!isEditing ? 'opacity-70' : ''}`}
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
                    className="form-input w-full font-tajawal"
                  />
                </div>

                <div>
                  <label className="block text-gray-light text-sm mb-2 font-semibold">
                    كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="form-input w-full font-tajawal"
                  />
                </div>

                <div>
                  <label className="block text-gray-light text-sm mb-2 font-semibold">
                    تأكيد كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="form-input w-full font-tajawal"
                  />
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
        {/* Notification Settings Card */}
        
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
