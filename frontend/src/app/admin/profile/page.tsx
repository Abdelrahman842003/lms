'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { withAdminAuth } from '@/components/auth/withAdminAuth';
import { useAuth } from '@/contexts/AuthContext';
import { updateAdminProfile, changeAdminPassword } from '@/services/authService';
import { uploadAvatar, deleteAvatar, getAvatarUrl } from '@/services/avatarService';
import { Skeleton, ImageCropModal, ConfirmationModal } from '@/components/ui';
import NotificationSettings from '@/components/NotificationSettings';
import toast from 'react-hot-toast';

function AdminProfile() {
  const { user, updateUser, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
  });

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar || null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Crop modal state
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Update form data and avatar when user data is available
  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
      });
      // Sync avatarUrl with user.avatar
      if (user.avatar) {
        setAvatarUrl(user.avatar);
      }
    }
  }, [user]);
  
  // Load avatar on mount
  React.useEffect(() => {
    loadAvatar();
  }, []);

  const loadAvatar = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await getAvatarUrl();
      if (response.success && response.data?.url) {
        setAvatarUrl(response.data.url);
        if (updateUser) {
            updateUser({ avatar: response.data.url });
        }
      }
    } catch (err) {
      console.log('No avatar found or error loading avatar');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار صورة صحيحة');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن لا يتجاوز 5 ميغابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropModal(false);
    setSelectedImage(null);
    setIsUploadingAvatar(true);

    try {
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
  
  // Password Change State
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await updateAdminProfile(formData);
      
      // Update user in context and localStorage
      updateUser({
        name: response.user.name,
        username: response.user.username,
      });

      toast.success('تم حفظ التعديلات بنجاح!');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || 'فشل حفظ التعديلات. حاول مرة أخرى.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      toast.error('كلمة المرور الجديدة غير متطابقة');
      return;
    }

    setIsSaving(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      await changeAdminPassword(passwordData);

      toast.success('تم تغيير كلمة المرور بنجاح!');
      setIsChangingPassword(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'فشل تغيير كلمة المرور');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      username: user?.username || '',
    });
    setIsEditing(false);
  };

  const handleCancelPassword = () => {
    setPasswordData({
      current_password: '',
      new_password: '',
      new_password_confirmation: '',
    });
    setIsChangingPassword(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <DashboardLayout
        role="admin"
        user={user || undefined}
      >
        <div className="max-w-[800px] mx-auto">
          {/* Profile Header Card Skeleton */}
          <div className="bg-[#1e1e2d] rounded-xl shadow-lg mb-6 p-6">
            <div className="flex flex-col items-center">
              <Skeleton className="h-32 w-32 rounded-full mb-6" />
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>

          {/* Profile Form Card Skeleton */}
          <div className="bg-[#1e1e2d] rounded-xl shadow-lg mb-6 p-6">
            <div className="flex justify-between items-center mb-6">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-8 w-20" />
            </div>
            <div className="flex flex-col gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <Skeleton className="h-5 w-24 mb-2" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="admin"
      user={user || undefined}
    >
      <div className="max-w-[800px] mx-auto">
        {/* Profile Header Card */}
        <DashboardCard className="mb-8">
          <div className="text-center py-6">
            <div className="relative w-[120px] h-[120px] mx-auto mb-6">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-[#4263EB] to-[#3730A3] flex items-center justify-center text-[3rem] font-bold text-white shadow-[0_10px_30px_rgba(66,99,235,0.3)] overflow-hidden">
                {avatarUrl ? (
                    <img
                    src={avatarUrl}
                    alt={user?.name}
                    className="w-full h-full rounded-full object-cover"
                    />
                ) : (
                    getInitials(user?.name || 'Admin')
                )}
                </div>
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                    <div className="w-8 h-8 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                )}
                
                {isEditing && (
                  <div className="absolute -bottom-2 -right-2 flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <button 
                      className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      title="تغيير الصورة"
                    >
                      <i className="fas fa-camera text-sm"></i>
                    </button>
                    {avatarUrl && (
                      <button 
                        className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                        onClick={handleAvatarDelete}
                        disabled={isUploadingAvatar}
                        title="حذف الصورة"
                      >
                        <i className="fas fa-trash text-sm"></i>
                      </button>
                    )}
                  </div>
                )}
            </div>
            
            <h2 className="text-[1.8rem] font-bold text-white mb-2">
              {user?.name || 'مدير النظام'}
            </h2>
            <div className="inline-block mt-4 px-4 py-2 bg-[#4263EB]/15 rounded-lg text-primary text-[0.9rem] font-semibold">
              <i className="fas fa-shield-alt ml-2"></i>
              مدير النظام
            </div>
          </div>
        </DashboardCard>

        {/* Profile Form Card */}
        <DashboardCard
          title="المعلومات الشخصية"
          icon="fas fa-user"
          className="mb-8"
          action={
            !isEditing ? (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setIsEditing(true)}
                disabled={isChangingPassword}
              >
                <i className="fas fa-edit"></i>
                <span>تعديل</span>
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  className="btn btn-success btn-sm"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      <span>حفظ</span>
                    </>
                  )}
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <i className="fas fa-times"></i>
                  <span>إلغاء</span>
                </button>
              </div>
            )
          }
        >

          <div className="p-6 flex flex-col gap-6">
            {/* Name Field */}
            <div>
              <label className="block mb-2 text-[0.95rem] font-semibold text-gray-light">
                الاسم الكامل
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input w-full"
                />
              ) : (
                <div className="p-3 bg-white/3 rounded-lg text-white text-[1rem]">
                  {user?.name || '-'}
                </div>
              )}
            </div>

            {/* Username Field */}
            <div>
              <label className="block mb-2 text-[0.95rem] font-semibold text-gray-light">
                اسم المستخدم
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="form-input w-full"
                />
              ) : (
                <div className="p-3 bg-white/3 rounded-lg text-white text-[1rem]">
                  {user?.username || '-'}
                </div>
              )}
            </div>

            {/* Account Created */}
            <div>
              <label className="block mb-2 text-[0.95rem] font-semibold text-gray-light">
                تاريخ الإنشاء
              </label>
              <div className="p-3 bg-white/3 rounded-lg text-white text-[1rem]">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-EG') : '-'}
              </div>
            </div>
          </div>
        </DashboardCard>

        {/* Password Change Card */}
        <DashboardCard
          title="تغيير كلمة المرور"
          icon="fas fa-lock"
          noPadding={true}
          action={
            !isChangingPassword ? (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setIsChangingPassword(true)}
                disabled={isEditing}
              >
                <i className="fas fa-key"></i>
                <span>تغيير</span>
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  className="btn btn-success btn-sm"
                  onClick={handleSavePassword}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      <span>حفظ</span>
                    </>
                  )}
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={handleCancelPassword}
                  disabled={isSaving}
                >
                  <i className="fas fa-times"></i>
                  <span>إلغاء</span>
                </button>
              </div>
            )
          }
        >

          {isChangingPassword && (
            <div className="p-6 flex flex-col gap-6">
              {/* Current Password */}
              <div>
                <label className="block mb-2 text-[0.95rem] font-semibold text-gray-light">
                  كلمة المرور الحالية
                </label>
                <input
                  type="password"
                  name="current_password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  className="form-input w-full"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block mb-2 text-[0.95rem] font-semibold text-gray-light">
                  كلمة المرور الجديدة
                </label>
                <input
                  type="password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  className="form-input w-full"
                />
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block mb-2 text-[0.95rem] font-semibold text-gray-light">
                  تأكيد كلمة المرور الجديدة
                </label>
                <input
                  type="password"
                  name="new_password_confirmation"
                  value={passwordData.new_password_confirmation}
                  onChange={handlePasswordChange}
                  className="form-input w-full"
                />
              </div>
            </div>
          )}
        </DashboardCard>
        {/* Notification Settings Card */}
        <div className="mb-6">
          <NotificationSettings />
        </div>
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

// Export protected component
export default withAdminAuth(AdminProfile);
