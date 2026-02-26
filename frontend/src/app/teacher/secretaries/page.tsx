'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { Button, Icon } from '@/components/ui';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Filter } from '@/components/Filter';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { getSecretaries, deleteSecretary, toggleSecretaryStatus } from '@/services/authService';
import { Secretary } from '@/services/secretaryService';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function SecretariesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [secretaries, setSecretaries] = useState<Secretary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // ...



  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    confirmText: '',
    variant: 'danger' as 'danger' | 'success',
    onConfirm: () => {},
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchSecretaries();
  }, [currentPage, searchQuery, statusFilter]);

  const fetchSecretaries = async () => {
    try {
      setIsLoading(true);
      const response = await getSecretaries(currentPage, searchQuery, statusFilter);
      setSecretaries(response.data);
      setTotalPages(response.last_page);
      setTotalItems(response.total);
    } catch (error) {
      console.error('Failed to fetch secretaries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (secretary: Secretary) => {
    setModalConfig({
      title: 'حذف السكرتير',
      message: `هل أنت متأكد من حذف السكرتير "${secretary.name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'حذف',
      variant: 'danger',
      onConfirm: async () => {
        try {
          setIsProcessing(true);
          await deleteSecretary(secretary.id);
          setModalOpen(false);
          fetchSecretaries();
        } catch (error) {
          console.error('Failed to delete secretary:', error);
          toast.error('فشل حذف السكرتير');
        } finally {
          setIsProcessing(false);
        }
      },
    });
    setModalOpen(true);
  };

  const handleToggleStatus = (secretary: Secretary) => {
    const isDisabling = secretary.is_active;
    setModalConfig({
      title: isDisabling ? 'تعطيل الحساب' : 'تفعيل الحساب',
      message: `هل أنت متأكد من ${isDisabling ? 'تعطيل' : 'تفعيل'} حساب السكرتير "${secretary.name}"؟`,
      confirmText: isDisabling ? 'تعطيل' : 'تفعيل',
      variant: isDisabling ? 'danger' : 'success',
      onConfirm: async () => {
        try {
          setIsProcessing(true);
          await toggleSecretaryStatus(secretary.id);
          setModalOpen(false);
          fetchSecretaries();
        } catch (error) {
          console.error('Failed to toggle secretary status:', error);
          toast.error(`فشل ${isDisabling ? 'تعطيل' : 'تفعيل'} الحساب`);
        } finally {
          setIsProcessing(false);
        }
      },
    });
    setModalOpen(true);
  };

  const columns = [
    {
      key: 'name',
      label: 'الاسم',
      sortable: true,
      render: (value: string, row: Secretary) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm">
            {row.avatar ? (
              <img src={row.avatar} alt={row.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <Icon name="user-tie" />
            )}
          </div>

          <span className={`font-semibold ${row.is_active ? 'text-inherit' : 'text-gray-light'}`}>
            {value} {row.is_active ? '' : '(معطل)'}
          </span>
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'تاريخ الإضافة',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('ar-EG'),
    },
  ];

  const actions = [
    {
      label: 'تعديل',
      icon: 'fas fa-edit',
      onClick: (row: Secretary) => router.push(`/teacher/secretaries/${row.id}/edit`),
      hidden: (row: Secretary) => !row.is_active,
    },
    {
      label: 'حذف',
      icon: 'fas fa-trash',
      variant: 'danger' as 'danger',
      onClick: (row: Secretary) => handleDelete(row),
    },
    {
      label: (row: Secretary) => row.is_active ? 'إلغاء التفعيل' : 'تفعيل الحساب',
      icon: (row: Secretary) => row.is_active ? 'fas fa-ban' : 'fas fa-check-circle',
      variant: (row: Secretary) => row.is_active ? 'danger' : 'success',
      onClick: (row: Secretary) => handleToggleStatus(row),
    },
  ];

  return (
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={{
        name: user?.name || 'المدرس',
        avatar: user?.avatar || '',
      }}
      headerActions={null}
    >
      <DashboardCard
        title="إدارة السكرتارية"
        icon="fas fa-users-cog"
      >
        <DataTable
          columns={columns}
          data={secretaries}
          actions={actions}
          isLoading={isLoading}
          pagination={true}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          onSearch={setSearchQuery}
          headerActions={
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Filter
                options={[
                  { value: '', label: 'كل السكرتارية' },
                  { value: 'active', label: 'السكرتارية النشطين' },
                  { value: 'inactive', label: 'السكرتارية المعطلين' }
                ]}
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto min-w-[150px]"
              />
              <Link href="/teacher/secretaries/add">
                <Button className="w-full sm:w-auto justify-center">
                  <Icon name="plus" className="ml-2" />
                  <span>إضافة سكرتير</span>
                </Button>
              </Link>
            </div>
          }

          rowClassName={(row) => row.is_active ? '' : 'bg-red-500/5 text-gray-500'}
        />
      </DashboardCard>
      
      <ConfirmationModal
        isOpen={modalOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        variant={modalConfig.variant}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalOpen(false)}
        isProcessing={isProcessing}
      />
    </DashboardLayout>
  );
}
