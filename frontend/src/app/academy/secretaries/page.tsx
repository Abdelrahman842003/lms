'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { ConfirmationModal } from '@/components/ui';
import { Filter } from '@/components/Filter';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { useRouter } from 'next/navigation';
import academyService from '@/services/academyService';
import toast from 'react-hot-toast';

export default function AcademySecretariesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [secretaries, setSecretaries] = useState<any[]>([]);
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

  // Redirect if not authenticated or not academy
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.userType !== 'academy')) {
      router.push('/login');
    }
  }, [isAuthenticated, user, authLoading, router]);

  useEffect(() => {
    if (user?.userType === 'academy') {
      fetchSecretaries();
    }
  }, [user, searchQuery, statusFilter]);

  const fetchSecretaries = async () => {
    try {
      setIsLoading(true);
      const response = await academyService.getSecretaries(1, 100, searchQuery);
      console.log('Secretaries API Response:', response);
      
      let data = [];
      if (Array.isArray(response.data?.data)) {
        data = response.data.data;
      } else if (Array.isArray(response.data)) {
        data = response.data;
      } else if (Array.isArray(response.data?.secretaries?.data)) {
        data = response.data.secretaries.data;
      }
      
      if (statusFilter) {
        data = data.filter((s: any) => 
          statusFilter === 'active' ? s.is_active : !s.is_active
        );
      }
      
      setSecretaries(data);
    } catch (error) {
      console.error('Failed to fetch secretaries', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = (secretary: any) => {
    const isActive = secretary.is_active;
    setModalConfig({
      title: isActive ? 'تعطيل حساب السكرتير' : 'تفعيل حساب السكرتير',
      message: `هل أنت متأكد من ${isActive ? 'تعطيل' : 'تفعيل'} حساب السكرتير "${secretary.name}"؟`,
      confirmText: isActive ? 'تعطيل' : 'تفعيل',
      variant: isActive ? 'danger' : 'success',
      onConfirm: async () => {
        try {
          setIsProcessing(true);
          await academyService.toggleSecretaryStatus(secretary.id);
          toast.success(`تم ${isActive ? 'تعطيل' : 'تفعيل'} الحساب بنجاح`);
          setModalOpen(false);
          fetchSecretaries();
        } catch (error) {
          console.error('Failed to toggle secretary status:', error);
          toast.error(`فشل ${isActive ? 'تعطيل' : 'تفعيل'} الحساب`);
        } finally {
          setIsProcessing(false);
        }
      },
      showCancel: true,
    });
    setModalOpen(true);
  };

  const handleDelete = (secretary: any) => {
    setModalConfig({
      title: 'حذف السكرتير',
      message: `هل أنت متأكد من حذف السكرتير "${secretary.name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'حذف',
      variant: 'danger',
      onConfirm: async () => {
        try {
          setIsProcessing(true);
          await academyService.removeSecretary(secretary.id);
          toast.success('تم حذف السكرتير بنجاح');
          setModalOpen(false);
          fetchSecretaries();
        } catch (error) {
          console.error('Failed to delete secretary:', error);
          toast.error('فشل حذف السكرتير');
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
      label: 'الاسم',
      sortable: true,
      render: (value: string, row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm">
            {row.avatar ? (
              <img src={row.avatar} alt={row.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <i className="fas fa-user-tie"></i>
            )}
          </div>
          <div className="flex flex-col">
            <span className={`font-semibold ${row.is_active ? 'text-white' : 'text-gray-400'}`}>
              {value}
            </span>
            <span className="text-xs text-gray-500">{row.phone}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'تاريخ الإضافة',
      sortable: true,
      render: (value: string) => value ? new Date(value).toLocaleDateString('ar-EG') : '-',
    },
    {
      key: 'is_active',
      label: 'الحالة',
      sortable: true,
      render: (value: boolean) => (
        <span className={`badge ${value ? 'badge-success' : 'badge-danger'}`}>
          {value ? 'نشط' : 'غير نشط'}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: (row: any) => row.is_active ? 'تعطيل' : 'تفعيل',
      icon: (row: any) => row.is_active ? 'fas fa-ban' : 'fas fa-check',
      variant: (row: any) => row.is_active ? 'danger' : 'success',
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
    <DashboardLayout role="academy" user={user}>
      <DashboardCard
        title="إدارة السكرتيرات"
        icon="fas fa-users-cog"
      >
        <DataTable
          columns={tableColumns}
          data={secretaries}
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
                onClick={() => router.push('/academy/secretaries/add')}
                className="btn btn-primary w-full sm:w-auto justify-center"
              >
                <i className="fas fa-plus ml-2"></i>
                إضافة سكرتير
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
    </DashboardLayout>
  );
}
