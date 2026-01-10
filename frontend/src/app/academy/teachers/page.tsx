'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DataTable } from '@/components/dashboard/DataTable';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { ConfirmationModal } from '@/components/ui';
import { Filter } from '@/components/Filter';
import { useAuth } from '@/contexts/AuthContext';
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
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
  });

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
        data = data.filter((t: any) => 
          statusFilter === 'active' ? t.status === 'نشط' : t.status !== 'نشط'
        );
      }
      
      setTeachers(data);
    } catch (error) {
      console.error('Failed to fetch teachers', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTeacher = async () => {
    if (!formData.name || !formData.phone || !formData.password) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }
    
    try {
      setIsProcessing(true);
      await academyService.addTeacher(formData);
      toast.success('تم إضافة المدرس بنجاح');
      setShowAddModal(false);
      setFormData({ name: '', phone: '', password: '' });
      fetchTeachers();
    } catch (error: any) {
      console.error('Failed to add teacher', error);
      toast.error(error.response?.data?.message || 'فشل إضافة المدرس');
    } finally {
      setIsProcessing(false);
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
      key: 'students_count',
      label: 'عدد الطلاب',
      sortable: true,
      className: 'hidden md:table-cell',
    },
    {
      key: 'status',
      label: 'الحالة',
      sortable: true,
      render: (value: string) => (
        <span className={`badge ${value === 'نشط' ? 'badge-success' : 'badge-danger'}`}>
          {value}
        </span>
      ),
    },
  ];

  const actions = [
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
                  { value: 'inactive', label: 'غير نشط' }
                ]}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                className="w-full sm:w-auto min-w-[150px]"
              />
              <button 
                onClick={() => setShowAddModal(true)}
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-[#1a1f37] p-5 rounded-2xl w-full max-w-md border border-white/10">
            <h2 className="text-white mb-4 text-xl font-bold">
              إضافة مدرس جديد
            </h2>
            
            <form onSubmit={(e) => { e.preventDefault(); handleAddTeacher(); }}>
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
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                  placeholder="01xxxxxxxxx"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-300 mb-1.5 text-sm">كلمة المرور</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                  placeholder="******"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-white/10">
                <button
                  type="button"
                  className="px-4 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-all text-sm"
                  onClick={() => setShowAddModal(false)}
                  disabled={isProcessing}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all flex items-center gap-2 text-sm"
                  disabled={!formData.name || !formData.phone || !formData.password || isProcessing}
                >
                  {isProcessing ? 'جاري الحفظ...' : 'إضافة المدرس'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
