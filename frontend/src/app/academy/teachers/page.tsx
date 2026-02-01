'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DataTable } from '@/components/dashboard/DataTable';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { ConfirmationModal } from '@/components/ui';
import { Filter } from '@/components/Filter';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import academyService from '@/services/academyService';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AcademyTeachersPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '' as React.ReactNode,
    confirmText: '',
    variant: 'danger' as 'danger' | 'success' | 'primary',
    onConfirm: () => {},
    showCancel: true,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Add Teacher Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState<'phone' | 'link' | 'create'>('phone');
  const [phoneToCheck, setPhoneToCheck] = useState('');
  const [existingTeacher, setExistingTeacher] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    subject: '',
  });

  const handleCheckPhone = React.useCallback(async () => {
    if (!phoneToCheck || phoneToCheck.length < 11) {
      return;
    }

    try {
      setIsProcessing(true);
      const response = await academyService.checkTeacherPhone(phoneToCheck);
      
      if (response.data.exists) {
        const teacher = response.data.teacher;
        
        // Check if teacher is already in this academy
        const isAlreadyLinked = teachers.some(t => t.id === teacher.id);
        
        if (isAlreadyLinked) {
          toast.error('هذا المدرس موجود بالفعل في الأكاديمية');
          setPhoneToCheck('');
          return;
        }
        
        // Teacher exists - show link option
        setExistingTeacher(teacher);
        setAddStep('link');
      } else {
        // Teacher doesn't exist - show create form
        setFormData(prev => ({ ...prev, phone: phoneToCheck }));
        setAddStep('create');
      }
    } catch (error: any) {
      console.error('Failed to check phone', error);
      toast.error(error.response?.data?.message || 'فشل التحقق من رقم الهاتف');
    } finally {
      setIsProcessing(false);
    }
  }, [phoneToCheck, teachers]);

  // Auto-check phone when user types 11 digits
  useEffect(() => {
    if (phoneToCheck.length === 11 && addStep === 'phone') {
      const timer = setTimeout(() => {
        handleCheckPhone();
      }, 500); // Debounce 500ms
      
      return () => clearTimeout(timer);
    }
  }, [phoneToCheck, addStep, handleCheckPhone]);

  const handleLinkTeacher = async () => {
    if (!existingTeacher) return;
    
    try {
      setIsProcessing(true);
      const response = await academyService.addTeacher(existingTeacher.id);
      toast.success('تم ربط المدرس بنجاح');
      setShowAddModal(false);
      resetAddModal();
      
      // Add the linked teacher to the list directly from response
      if (response.data?.teacher) {
        setTeachers(prev => [response.data.teacher, ...prev]);
      } else {
        // Fallback to refetch if no teacher in response
        fetchTeachers();
      }
    } catch (error: any) {
      console.error('Failed to link teacher', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'فشل ربط المدرس';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddTeacher = async () => {
    if (!formData.name || !formData.phone || !formData.password) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }
    
    try {
      setIsProcessing(true);
      const response = await academyService.addTeacher(formData);
      toast.success('تم إضافة المدرس بنجاح - في انتظار موافقة الإدارة');
      setShowAddModal(false);
      resetAddModal();
      
      // Add the new teacher to the list directly from response
      if (response.data?.teacher) {
        setTeachers(prev => [response.data.teacher, ...prev]);
      } else {
        // Fallback to refetch if no teacher in response
        fetchTeachers();
      }
    } catch (error: any) {
      console.error('Failed to add teacher', error);
      toast.error(error.response?.data?.message || 'فشل إضافة المدرس');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAddModal = () => {
    setAddStep('phone');
    setPhoneToCheck('');
    setExistingTeacher(null);
    setFormData({ name: '', phone: '', password: '', subject: '' });
  };

  // Redirect if not authenticated or not academy
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.userType !== 'academy')) {
      router.push('/login');
    }
  }, [isAuthenticated, user, authLoading, router]);

  useEffect(() => {
    if (user?.userType === 'academy') {
      fetchTeachers();
    }
  }, [user, searchQuery, statusFilter]);

  const fetchTeachers = async () => {
    try {
      setIsLoading(true);
      const response = await academyService.getTeachers(1, 100, searchQuery);
      console.log('Teachers API Response:', response);
      
      let data = [];
      if (Array.isArray(response.data?.data)) {
        data = response.data.data;
      } else if (Array.isArray(response.data)) {
        data = response.data;
      } else if (Array.isArray(response.data?.teachers?.data)) {
        data = response.data.teachers.data;
      }
      
      console.log('Extracted Teachers Data:', data);
      
      // Client-side filtering for status if backend doesn't support it directly in this endpoint
      if (statusFilter) {
        data = data.filter((t: any) => {
          if (statusFilter === 'active') return t.status === 'نشط';
          if (statusFilter === 'suspended') return t.status === 'معلق';
          if (statusFilter === 'pending') return t.status === 'في انتظار الموافقة';
          return true;
        });
      }
      
      setTeachers(data);
    } catch (error) {
      console.error('Failed to fetch teachers', error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleDelete = (teacher: any) => {
    setModalConfig({
      title: 'حذف المدرس',
      message: `هل أنت متأكد من حذف المدرس "${teacher.name}" من الأكاديمية؟`,
      confirmText: 'حذف',
      variant: 'danger',
      onConfirm: async () => {
        try {
          setIsProcessing(true);
          await academyService.removeTeacher(teacher.id);
          toast.success('تم حذف المدرس بنجاح');
          setModalOpen(false);
          fetchTeachers();
        } catch (error) {
          console.error('Failed to delete teacher:', error);
          toast.error('فشل حذف المدرس');
        } finally {
          setIsProcessing(false);
        }
      },
      showCancel: true,
    });
    setModalOpen(true);
  };

  const handleToggleStatus = (teacher: any) => {
    const isActive = teacher.status === 'نشط';
    setModalConfig({
      title: isActive ? 'تعطيل حساب المدرس' : 'تفعيل حساب المدرس',
      message: `هل أنت متأكد من ${isActive ? 'تعطيل' : 'تفعيل'} حساب المدرس "${teacher.name}"؟`,
      confirmText: isActive ? 'تعطيل' : 'تفعيل',
      variant: isActive ? 'danger' : 'success',
      onConfirm: async () => {
        try {
          setIsProcessing(true);
          await academyService.toggleTeacherStatus(teacher.id);
          toast.success(`تم ${isActive ? 'تعطيل' : 'تفعيل'} الحساب بنجاح`);
          setModalOpen(false);
          fetchTeachers();
        } catch (error) {
          console.error('Failed to toggle teacher status:', error);
          toast.error(`فشل ${isActive ? 'تعطيل' : 'تفعيل'} الحساب`);
        } finally {
          setIsProcessing(false);
        }
      },
      showCancel: true,
    });
    setModalOpen(true);
  };

  if (authLoading || !user || user.userType !== 'academy') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const tableColumns = [
    {
      key: 'name',
      label: 'اسم المدرس',
      sortable: true,
      render: (value: string, row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center overflow-hidden shrink-0 text-white font-bold">
            {row.avatar ? (
              <img src={row.avatar} alt={row.name} className="w-full h-full object-cover" />
            ) : (
              <span>{value.charAt(0)}</span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-white">{value}</span>
            <span className="text-xs text-gray-400">{row.phone}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'subject',
      label: 'المادة',
      sortable: true,
      render: (value: string) => (
        <span className="text-gray-300">
          {value || '-'}
        </span>
      ),
    },
    {
      key: 'students_count',
      label: 'عدد الطلاب',
      sortable: true,
      // className: 'hidden md:table-cell',
    },
    {
      key: 'status',
      label: 'الحالة',
      sortable: true,
      render: (value: string) => {
        let badgeClass = 'badge-success';
        if (value === 'في انتظار الموافقة') {
          badgeClass = 'badge-warning';
        } else if (value === 'غير نشط') {
          badgeClass = 'badge-danger';
        } else if (value === 'معلق') {
          badgeClass = 'badge-danger';
        }
        
        return (
          <span className={`badge ${badgeClass}`}>
            {value}
          </span>
        );
      },
    },
  ];

  const actions = [
    {
      label: 'التفاصيل',
      icon: 'fas fa-eye',
      variant: 'default' as 'default',
      onClick: (row: any) => router.push(`/academy/teachers/${row.id}`),
    },
    {
      label: (row: any) => row.status === 'نشط' ? 'تعطيل' : 'تفعيل',
      icon: (row: any) => row.status === 'نشط' ? 'fas fa-ban' : 'fas fa-check',
      variant: (row: any) => row.status === 'نشط' ? 'danger' : 'success',
      onClick: (row: any) => handleToggleStatus(row),
    },
    {
      label: 'حذف',
      icon: 'fas fa-trash',
      variant: 'danger' as 'danger',
      onClick: (row: any) => handleDelete(row),
    },
  ];

  return (
    <DashboardLayout
      role="academy"
      user={user}
    >
      <DashboardCard
        title={`المدرسين (${teachers.length})`}
        icon="fas fa-chalkboard-teacher"
      >
        {/* Debug Info */}
        <div className="mb-4 p-2 bg-red-500/20 text-red-200 text-xs rounded hidden">
          Debug: Loaded {teachers.length} teachers
        </div>
        <DataTable
          columns={tableColumns}
          data={teachers}
          actions={actions}
          isLoading={isLoading}
          searchable={true}
          onSearch={setSearchQuery}
          headerActions={
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Filter
                options={[
                  { value: '', label: 'الكل' },
                  { value: 'active', label: 'نشط' },
                  { value: 'suspended', label: 'معلق' },
                  { value: 'pending', label: 'ننتظر الموافقة' }
                ]}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                className="w-full sm:w-auto min-w-[150px]"
              />
              <button 
                onClick={() => {
                  setAddStep('phone');
                  setShowAddModal(true);
                }}
                className="btn btn-primary w-full sm:w-auto justify-center"
              >
                <i className="fas fa-plus"></i>
                <span>إضافة مدرس</span>
              </button>
            </div>
          }
        />
      </DashboardCard>

      <ConfirmationModal
        isOpen={modalOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        variant={modalConfig.variant as any}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalOpen(false)}
        isProcessing={isProcessing}
        showCancel={modalConfig.showCancel}
      />

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[#1e1e2d] rounded-xl border border-white/10 w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {addStep === 'phone' ? 'إضافة مدرس جديد' : 
                 addStep === 'link' ? 'ربط مدرس موجود' : 
                 'بيانات المدرس الجديد'}
              </h2>
              <button 
                onClick={() => { setShowAddModal(false); resetAddModal(); }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Step 1: Check Phone (Only for Add) */}
            {addStep === 'phone' && (
              <>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-1.5 text-sm">رقم الهاتف</label>
                  <input
                    type="text"
                    value={phoneToCheck}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // Only numbers
                      setPhoneToCheck(value);
                    }}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm pr-10"
                    placeholder="01xxxxxxxxx"
                    maxLength={11}
                    autoFocus
                  />
                  {isProcessing && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <i className="fas fa-spinner fa-spin text-primary"></i>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {phoneToCheck.length === 11 
                      ? isProcessing 
                        ? 'جاري التحقق من الرقم...' 
                        : 'سيتم التحقق تلقائياً'
                      : 'أدخل رقم هاتف المدرس (11 رقم)'}
                  </p>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleCheckPhone}
                    disabled={phoneToCheck.length < 11 || isProcessing}
                    className="btn btn-primary w-full justify-center"
                  >
                    {isProcessing ? 'جاري التحقق...' : 'تحقق ومتابعة'}
                  </button>
                </div>
              </>
            )}

            {/* Step 2: Link Existing Teacher (Only for Add) */}
            {addStep === 'link' && existingTeacher && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto mb-3 text-2xl">
                    <i className="fas fa-user-check"></i>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1">{existingTeacher.name}</h3>
                  <p className="text-gray-400 text-sm">{existingTeacher.phone}</p>
                </div>
                
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-6 text-sm text-blue-300">
                  <i className="fas fa-info-circle ml-2"></i>
                  هذا المدرس مسجل بالفعل في النظام. هل تريد إضافته إلى الأكاديمية؟
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setAddStep('phone'); setExistingTeacher(null); }}
                    className="btn btn-outline flex-1 justify-center"
                  >
                    رجوع
                  </button>
                  <button
                    onClick={handleLinkTeacher}
                    disabled={isProcessing}
                    className="btn btn-primary flex-1 justify-center"
                  >
                    {isProcessing ? 'جاري الربط...' : (
                      <>
                        <i className="fas fa-link"></i>
                        <span>ربط المدرس</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Create New Teacher */}
            {addStep === 'create' && (
              <>
                <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-300">
                  <i className="fas fa-info-circle mr-1"></i>
                  المدرس سيتم إضافته بحالة "في انتظار الموافقة" ولن يتمكن من الدخول حتى تتم الموافقة عليه من الإدارة
                </div>

                <form onSubmit={(e) => { 
                  e.preventDefault(); 
                  handleAddTeacher(); 
                }}>
                  <div className="mb-4">
                    <label className="block text-gray-300 mb-1.5 text-sm">الاسم</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                      placeholder="أدخل اسم المدرس"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-300 mb-1.5 text-sm">رقم الهاتف</label>
                    <input
                      type="text"
                      value={formData.phone}
                      readOnly={true}
                      className={`w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm text-gray-400 cursor-not-allowed`}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-300 mb-1.5 text-sm">المادة</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                      placeholder="مثال: رياضيات، عربي، إنجليزي"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-300 mb-1.5 text-sm">
                      كلمة المرور
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                      placeholder="******"
                      required={addStep === 'create'}
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-3 border-t border-white/10">
                    <button
                      type="button"
                      className="px-4 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-all text-sm"
                      onClick={() => { setShowAddModal(false); resetAddModal(); }}
                      disabled={isProcessing}
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all flex items-center gap-2 text-sm"
                      disabled={!formData.name || !formData.password || isProcessing}
                    >
                      {isProcessing ? 'جاري الحفظ...' : (
                        <>
                          <i className="fas fa-plus"></i>
                          <span>إضافة المدرس</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
