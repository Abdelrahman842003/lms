'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DataTable } from '@/components/dashboard/DataTable';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { ConfirmationModal } from '@/components/ui';
import { Filter } from '@/components/Filter';
import { useAuth } from '@/contexts/AuthContext';
import { getTeacherStudents, deleteTeacherStudent, activateTeacherStudent, toggleTeacherStudentStatus, getStudentActivationDetails } from '@/services/authService';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function StudentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '' as React.ReactNode,
    confirmText: '',
    variant: 'danger' as 'danger' | 'success',
    onConfirm: () => {},
    showCancel: true,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [currentPage, statusFilter, searchQuery]);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const response = await getTeacherStudents(currentPage, 10, searchQuery, statusFilter);
      // Assuming response structure matches what we saw in secretaryService
      // If getTeacherStudents returns the 'students' object directly:
      setStudents(response.data || []);
      setTotalPages(response.last_page || 1);
      setTotalItems(response.total || 0);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async (student: any) => {
    try {
      setIsProcessing(true);
      const details = await getStudentActivationDetails(student.id);
      setIsProcessing(false);

      // Helper component for the modal content to manage state
      const ActivationContent = ({ details, onConfirm }: { details: any, onConfirm: (source: string, price: number) => void }) => {
        const options = details.pricing_options || [];
        const [selectedOption, setSelectedOption] = useState(options.find((o: any) => o.is_default) || options[0] || null);

        if (!selectedOption) {
           return <div className="text-red-500">خطأ في تحميل تفاصيل الدفع. يرجى المحاولة مرة أخرى.</div>;
        }

        return (
          <div className="space-y-4">
            <p className="text-gray-300">هل أنت متأكد من تفعيل اشتراك الطالب <span className="text-white font-bold">{details.student_name}</span> لمدة شهر؟</p>
            
            <div className="bg-white/5 p-4 rounded-lg border border-white/10 space-y-3">
              <div className="space-y-2">
                <label className="text-sm text-gray-400 block mb-2">اختر نظام الدفع:</label>
                {details.pricing_options.map((option: any) => (
                  <label 
                    key={option.key}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedOption.key === option.key 
                        ? 'bg-primary/10 border-primary' 
                        : 'bg-transparent border-white/10 hover:bg-white/5'
                    }`}
                    onClick={() => setSelectedOption(option)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedOption.key === option.key ? 'border-primary' : 'border-gray-500'
                      }`}>
                        {selectedOption.key === option.key && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                      </div>
                      <span className={selectedOption.key === option.key ? 'text-white' : 'text-gray-400'}>
                        {option.label}
                      </span>
                    </div>
                    <span className="font-mono text-white">{option.base_price} ج.م</span>
                  </label>
                ))}
              </div>

              <div className="pt-3 border-t border-white/10 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">سعر الاشتراك:</span>
                  <span className="text-white font-mono">{selectedOption.base_price} ج.م</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">رسوم المنصة:</span>
                  <span className="text-white font-mono">{details.platform_fee} ج.م</span>
                </div>
                <div className="border-t border-white/10 pt-2 mt-2 flex justify-between items-center font-bold text-lg">
                  <span className="text-primary">الإجمالي المطلوب:</span>
                  <span className="text-primary font-mono">{selectedOption.total_price} ج.م</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                className="btn btn-outline"
                onClick={() => setModalOpen(false)}
              >
                إلغاء
              </button>
              <button 
                className="btn btn-success"
                onClick={() => onConfirm(selectedOption.key, selectedOption.total_price)}
              >
                تأكيد وتفعيل
              </button>
            </div>
          </div>
        );
      };

      setModalConfig({
        title: 'تفعيل الاشتراك',
        message: <ActivationContent 
          details={details} 
          onConfirm={async (source, price) => {
            try {
              setIsProcessing(true);
              await activateTeacherStudent(student.id, price, source);
              setModalOpen(false);
              fetchStudents();
            } catch (error) {
              console.error('Failed to activate student:', error);
              toast.error('فشل تفعيل الاشتراك');
            } finally {
              setIsProcessing(false);
            }
          }} 
        />,
        confirmText: '', // Handled inside component
        variant: 'success',
        onConfirm: () => {}, // Handled inside component
        showCancel: false // Handled inside component
      });
      setModalOpen(true);
    } catch (error) {
      console.error('Failed to get activation details:', error);
      toast.error('فشل جلب تفاصيل الاشتراك');
      setIsProcessing(false);
    }
  };

  const handleDelete = (student: any) => {
    setModalConfig({
      title: 'إلغاء ربط الطالب',
      message: `هل أنت متأكد من إلغاء ربط الطالب "${student.name}"؟ سيتم إزالة الطالب من قائمتك ولكن لن يتم حذفه من النظام.`,
      confirmText: 'إلغاء الربط',
      variant: 'danger',
      onConfirm: async () => {
        try {
          setIsProcessing(true);
          await deleteTeacherStudent(student.id);
          setModalOpen(false);
          fetchStudents();
        } catch (error) {
          console.error('Failed to delete student:', error);
          toast.error('فشل حذف الطالب');
        } finally {
          setIsProcessing(false);
        }
      },
      showCancel: true,
    });
    setModalOpen(true);
  };

  const handleToggleStatus = (student: any) => {
    const isDisabling = student.is_active;
    setModalConfig({
      title: isDisabling ? 'تعطيل الحساب' : 'تفعيل الحساب',
      message: `هل أنت متأكد من ${isDisabling ? 'تعطيل' : 'تفعيل'} حساب الطالب "${student.name}"؟`,
      confirmText: isDisabling ? 'تعطيل' : 'تفعيل',
      variant: isDisabling ? 'danger' : 'success',
      onConfirm: async () => {
        try {
          setIsProcessing(true);
          await toggleTeacherStudentStatus(student.id);
          setModalOpen(false);
          fetchStudents();
        } catch (error) {
          console.error('Failed to toggle student status:', error);
          toast.error(`فشل ${isDisabling ? 'تعطيل' : 'تفعيل'} الحساب`);
        } finally {
          setIsProcessing(false);
        }
      },
      showCancel: true,
    });
    setModalOpen(true);
  };

  const columns = [
    {
      key: 'name',
      label: 'الاسم',
      sortable: true,
      render: (value: string, row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4263EB] to-[#3730A3] flex items-center justify-center overflow-hidden shrink-0">
            {row.avatar ? (
              <img src={row.avatar} alt={row.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-[0.9rem]">
                {value.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <span className={`font-semibold ${row.is_active ? '' : 'text-gray-light'}`}>
              {value}
            </span>
            <div className="flex items-center gap-2 text-xs">
              {row.status === 'active' && <span className="text-success">نشط ({row.days_left} يوم)</span>}
              {row.status === 'grace_period' && <span className="text-warning">فترة سماح ({row.days_left} يوم)</span>}
              {row.status === 'expired' && <span className="text-danger">منتهي</span>}
              {row.status === 'inactive' && <span className="text-gray-400">غير مفعل</span>}
              {!row.is_active && <span className="text-danger ml-1">(معطل يدوياً)</span>}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'رقم الطالب',
      sortable: true,
      className: 'd-none-md',
    },
    {
      key: 'grade',
      label: 'الصف الدراسي',
      sortable: true,
      className: 'd-none-lg',
      render: (value: any) => value?.name || '-',
    },
    {
      key: 'group',
      label: 'المجموعة',
      sortable: true,
      className: 'd-none-md',
      render: (value: any) => value?.name || '-',
    },
    {
      key: 'attendance_stats',
      label: 'الحضور (الشهر)',
      className: 'd-none-lg',
      render: (stats: any) => (
        <div className="flex flex-col gap-1">
          <span>{stats?.present_count || 0} / {stats?.total_lectures || 0}</span>
          <span className="text-[0.8em] text-gray-light">
            {stats?.average || 0}%
          </span>
        </div>
      ),
    },
  ];

  const actions = [
    {
      label: 'تفعيل الاشتراك',
      icon: 'fas fa-bolt',
      variant: 'success' as 'success',
      onClick: (row: any) => handleActivate(row),
      hidden: (row: any) => row.status === 'active',
    },
    {
      label: 'عرض التفاصيل',
      icon: 'fas fa-eye',
      onClick: (row: any) => router.push(`/teacher/students/${row.id}`),
      hidden: (row: any) => !row.is_active,
    },
    {
      label: 'تعديل',
      icon: 'fas fa-edit',
      onClick: (row: any) => router.push(`/teacher/students/${row.id}/edit`),
      hidden: (row: any) => !row.is_active,
    },
    {
      label: 'إلغاء الربط',
      icon: 'fas fa-unlink',
      variant: 'danger' as 'danger',
      onClick: (row: any) => handleDelete(row),
    },
    {
      label: (row: any) => row.is_active ? 'تعطيل الحساب' : 'تفعيل الحساب',
      icon: (row: any) => row.is_active ? 'fas fa-ban' : 'fas fa-check-circle',
      variant: (row: any) => row.is_active ? 'danger' : 'success',
      onClick: (row: any) => handleToggleStatus(row),
    },
  ];

  return (
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={{
        name: user?.name || 'المدرس',
        avatar: user?.avatar || '',
      }}
    >
      <DashboardCard
        title="جدول الطلاب"
        icon="fas fa-table"
      >
        <DataTable
          columns={columns}
          data={students}
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
                  { value: '', label: 'كل الطلاب' },
                  { value: 'active', label: 'الطلاب النشطين' },
                  { value: 'inactive', label: 'الطلاب المعطلين' }
                ]}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                className="w-full sm:w-auto min-w-[150px]"
              />
              <Link href="/teacher/students/add" className="btn btn-primary w-full sm:w-auto justify-center">
                <i className="fas fa-plus"></i>
                <span>إضافة طالب جديد</span>
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
        showCancel={modalConfig.showCancel}
      />
    </DashboardLayout>
  );
}
