'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button, Icon, Input } from '@/components/ui';
import { Skeleton } from '@/components/ui/Skeleton';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { uploadAvatar, deleteAvatar, getAvatarUrl } from '@/services/avatarService';
import { getAuthToken } from '@/services/authService';
import { getVersionedApiUrl } from '@/config/api-config';
import ImageCropModal from '@/components/ui/ImageCropModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { toast } from 'react-hot-toast';
import { cn } from '@/utils';

export default function TeacherProfile() {
  const { user, isLoading, updateUser } = useAuth();
  const [isEditing, setIsEditing] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [showCropModal, setShowCropModal] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  
  const [formData, setFormData] = React.useState({
    name: user?.name || '',
    trialPeriodDays: String(user?.trial_period_days ?? user?.effective_trial_period_days ?? 4),
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

  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        trialPeriodDays: String(user.trial_period_days ?? user.effective_trial_period_days ?? 4),
      }));
      if (user.avatar) setAvatarUrl(user.avatar);
    }
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setSelectedImage(reader.result as string); setShowCropModal(true); };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropModal(false);
    const previewUrl = URL.createObjectURL(croppedBlob);
    setAvatarPreview(previewUrl);
    updateUser({ avatar: previewUrl });
    setIsUploadingAvatar(true);

    try {
      const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
      const response = await uploadAvatar(file);
      if (response.success && response.data?.url) {
        setAvatarPreview(null);
        setAvatarUrl(response.data.url);
        updateUser({ avatar: response.data.url });
        toast.success('تم تحديث الصورة بنجاح');
      }
    } catch (err: any) {
      setAvatarPreview(null);
      updateUser({ avatar: avatarUrl || undefined });
      toast.error(err.message || 'فشل رفع الصورة');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const confirmDelete = async () => {
    setIsUploadingAvatar(true);
    try {
      await deleteAvatar();
      setAvatarUrl(null);
      setAvatarPreview(null);
      updateUser({ avatar: undefined });
      setShowDeleteModal(false);
      toast.success('تم حذف الصورة بنجاح');
    } catch (err: any) {
      toast.error(err.message || 'فشل الحذف');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      const API_URL = getVersionedApiUrl();
      const response = await fetch(`${API_URL}/teacher/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: formData.name, trial_period_days: Number(formData.trialPeriodDays) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      toast.success('تم التحديث بنجاح');
      setIsEditing(false);
      if (data.data?.user) updateUser(data.data.user);
    } catch (err: any) { toast.error(err.message); }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }
    try {
      const token = getAuthToken();
      const API_URL = getVersionedApiUrl();
      const response = await fetch(`${API_URL}/teacher/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          current_password: formData.currentPassword,
          new_password: formData.newPassword,
          new_password_confirmation: formData.confirmPassword,
        }),
      });
      if (!response.ok) throw new Error('فشل تغيير كلمة المرور');
      toast.success('تم تغيير كلمة المرور بنجاح');
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err: any) { toast.error(err.message); }
  };

  if (isLoading) {
    return (
      <DashboardLayout role={user?.userType as any} user={user || undefined}>
        <div className="space-y-6 animate-pulse">
           <Skeleton className="h-48 w-full rounded-[2.5rem]" />
           <Skeleton className="h-64 w-full rounded-[2.5rem]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={user?.userType as any} user={user || undefined}>
      <div className="space-y-8 animate-in fade-in duration-700">
        
        {/* Immersive Profile Hero Card */}
        <div className="relative rounded-[2.5rem] premium-glass premium-border p-8 md:p-12 overflow-hidden">
          {/* Backdrop Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 blur-[100px] translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
             {/* Avatar Section */}
             <div className="relative group">
                <div className={cn(
                  "w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] p-1.5 border-2 transition-all duration-500",
                  isUploadingAvatar ? "border-primary animate-pulse" : "border-white/10 group-hover:border-primary/50"
                )}>
                  <div className="w-full h-full rounded-[2rem] overflow-hidden bg-white/5 flex items-center justify-center text-4xl font-black text-white">
                    {(avatarPreview || avatarUrl) ? (
                      <img src={avatarPreview || avatarUrl || ''} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.charAt(0).toUpperCase() || '?'
                    )}
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-[2rem]">
                        <LoadingSpinner size="sm" color="primary" />
                      </div>
                    )}
                  </div>
                </div>
                
                {isEditing && (
                  <div className="absolute -bottom-2 -right-2 flex gap-2">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-10 h-10 rounded-xl bg-primary text-white shadow-xl shadow-primary/30 flex items-center justify-center"
                    >
                      <Icon name="camera" size="sm" />
                    </button>
                    {avatarUrl && (
                      <button 
                        onClick={() => setShowDeleteModal(true)}
                        className="w-10 h-10 rounded-xl bg-red-500 text-white shadow-xl shadow-red-500/30 flex items-center justify-center"
                      >
                        <Icon name="trash" size="sm" />
                      </button>
                    )}
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
             </div>

             {/* User Info Section */}
             <div className="flex-1 text-center md:text-right space-y-4">
                <div>
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter">{user?.name}</h2>
                    <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                      {user?.userType === 'teacher' ? 'مدرس' : 'سكرتارية'}
                    </span>
                  </div>
                  <p className="text-gray-light/40 font-bold uppercase tracking-widest text-[10px]">الملف الشخصي وإعدادات الحساب</p>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <div className="flex items-center gap-2 text-xs text-gray-light/60">
                    <Icon name="envelope" className="text-primary" />
                    <span>{user?.email || 'لا يوجد بريد'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-light/60">
                    <Icon name="phone" className="text-primary" />
                    <span>{user?.phone || 'لا يوجد هاتف'}</span>
                  </div>
                </div>

                <div className="pt-2">
                   <Button 
                    onClick={() => setIsEditing(!isEditing)} 
                    variant={isEditing ? "outline" : "primary"}
                    className="h-11 px-8 rounded-xl font-black uppercase tracking-widest"
                   >
                     <Icon name={isEditing ? 'times' : 'edit'} className="ml-2" />
                     {isEditing ? 'إلغاء التعديل' : 'تعديل البيانات'}
                   </Button>
                </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* General Settings */}
           <div className="rounded-[2.5rem] premium-glass premium-border p-8 space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-primary">
                  <Icon name="cog" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-widest">الإعدادات العامة</h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-light/20 uppercase tracking-widest px-2">الاسم الكامل</label>
                   <Input 
                     value={formData.name} 
                     onChange={(e) => setFormData({...formData, name: e.target.value})} 
                     disabled={!isEditing}
                     className="h-12 bg-white/5 border-white/10 rounded-xl text-sm font-bold"
                   />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-light/20 uppercase tracking-widest px-2">الفترة التجريبية (أيام)</label>
                   <Input 
                     type="number"
                     value={formData.trialPeriodDays} 
                     onChange={(e) => setFormData({...formData, trialPeriodDays: e.target.value})} 
                     disabled={!isEditing}
                     className="h-12 bg-white/5 border-white/10 rounded-xl text-sm font-bold"
                   />
                 </div>
                 {isEditing && (
                   <Button type="submit" className="w-full h-12 rounded-xl bg-success text-white font-black uppercase tracking-widest shadow-xl shadow-success/20">
                     <Icon name="save" /> حفظ التغييرات
                   </Button>
                 )}
              </form>
           </div>

           {/* Security Settings */}
           <div className="rounded-[2.5rem] premium-glass premium-border p-8 space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-secondary">
                  <Icon name="shield-alt" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-widest">تأمين الحساب</h3>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-6">
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-light/20 uppercase tracking-widest px-2">كلمة المرور الحالية</label>
                   <Input 
                     type="password"
                     value={formData.currentPassword} 
                     onChange={(e) => setFormData({...formData, currentPassword: e.target.value})} 
                     className="h-12 bg-white/5 border-white/10 rounded-xl"
                   />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-light/20 uppercase tracking-widest px-2">كلمة المرور الجديدة</label>
                   <Input 
                     type="password"
                     value={formData.newPassword} 
                     onChange={(e) => setFormData({...formData, newPassword: e.target.value})} 
                     className="h-12 bg-white/5 border-white/10 rounded-xl"
                   />
                   {formData.newPassword && (
                     <div className="flex gap-1 h-1 mt-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={cn("flex-1 rounded-full transition-all", i <= passwordStrength ? "bg-primary shadow-[0_0_8px_rgba(66,99,235,0.5)]" : "bg-white/5")} />
                        ))}
                     </div>
                   )}
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-light/20 uppercase tracking-widest px-2">تأكيد كلمة المرور</label>
                   <Input 
                     type="password"
                     value={formData.confirmPassword} 
                     onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
                     className="h-12 bg-white/5 border-white/10 rounded-xl"
                   />
                 </div>
                 <Button type="submit" className="w-full h-12 rounded-xl bg-secondary text-white font-black uppercase tracking-widest shadow-xl shadow-secondary/20">
                   <Icon name="key" /> تحديث كلمة المرور
                 </Button>
              </form>
           </div>
        </div>
      </div>

      {showCropModal && selectedImage && (
        <ImageCropModal 
          image={selectedImage} 
          onCropComplete={handleCropComplete} 
          onCancel={() => setShowCropModal(false)} 
        />
      )}
      <ConfirmationModal isOpen={showDeleteModal} title="حذف الصورة" message="هل أنت متأكد من حذف صورتك الشخصية؟" confirmText="حذف" cancelText="إلغاء" onConfirm={confirmDelete} onCancel={() => setShowDeleteModal(false)} isProcessing={isUploadingAvatar} />
    </DashboardLayout>
  );
}
