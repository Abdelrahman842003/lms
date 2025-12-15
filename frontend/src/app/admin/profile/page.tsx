'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { withAdminAuth } from '@/components/auth/withAdminAuth';
import { useAuth } from '@/contexts/AuthContext';
import { updateAdminProfile, changeAdminPassword } from '@/services/authService';
import { Skeleton } from '@/components/ui';
import NotificationSettings from '@/components/NotificationSettings';

function AdminProfile() {
  const { user, updateUser, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
  });

  // Update form data when user data is available
  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
      });
    }
  }, [user]);
  
  // Password Change State
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await updateAdminProfile(formData);
      
      // Update user in context and localStorage
      updateUser({
        name: response.user.name,
        username: response.user.username,
      });

      setMessage({ type: 'success', text: 'تم حفظ التعديلات بنجاح!' });
      setIsEditing(false);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'فشل حفظ التعديلات. حاول مرة أخرى.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      setMessage({ type: 'error', text: 'كلمة المرور الجديدة غير متطابقة' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      await changeAdminPassword(passwordData);

      setMessage({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح!' });
      setIsChangingPassword(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'فشل تغيير كلمة المرور' });
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
    setMessage(null);
  };

  const handleCancelPassword = () => {
    setPasswordData({
      current_password: '',
      new_password: '',
      new_password_confirmation: '',
    });
    setIsChangingPassword(false);
    setMessage(null);
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
        <DashboardCard className="mb-4 md:mb-6">
          <div className="text-center py-6">
            <div className="w-[80px] h-[80px] md:w-[120px] md:h-[120px] rounded-full bg-gradient-to-br from-[#4263EB] to-[#3730A3] flex items-center justify-center text-[2rem] md:text-[3rem] font-bold text-white mx-auto mb-4 md:mb-6 shadow-[0_10px_30px_rgba(66,99,235,0.3)] overflow-hidden transition-all duration-300">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getInitials(user?.name || 'Admin')
              )}
            </div>
            <h2 className="text-[1.4rem] md:text-[1.8rem] font-bold text-white mb-2 transition-all duration-300">
              {user?.name || 'مدير النظام'}
            </h2>
            <div className="inline-block mt-4 px-4 py-2 bg-[#4263EB]/15 rounded-lg text-primary text-[0.9rem] font-semibold">
              <i className="fas fa-shield-alt ml-2"></i>
              مدير النظام
            </div>
          </div>
        </DashboardCard>

        {/* Message Alert */}
        {message && (
          <div
            className={`p-4 rounded-xl mb-6 flex items-center gap-3 border ${
              message.type === 'success' 
                ? 'bg-success/15 border-success/30' 
                : 'bg-danger/15 border-danger/30'
            }`}
          >
            <i
              className={`${message.type === 'success' ? 'fas fa-check-circle text-success' : 'fas fa-exclamation-circle text-danger'} text-[1.2rem]`}
            ></i>
            <span className="text-white flex-1">{message.text}</span>
          </div>
        )}

        {/* Profile Form Card */}
        <DashboardCard
          title="المعلومات الشخصية"
          icon="fas fa-user"
          className="mb-4 md:mb-6"
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
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white text-[1rem] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
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
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white text-[1rem] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
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
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white text-[1rem] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
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
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white text-[1rem] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
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
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white text-[1rem] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
            </div>
          )}
        </DashboardCard>
        {/* Notification Settings Card */}
        <div className="mb-4 md:mb-6">
          <NotificationSettings />
        </div>
      </div>
    </DashboardLayout>
  );
}

// Export protected component
export default withAdminAuth(AdminProfile);
