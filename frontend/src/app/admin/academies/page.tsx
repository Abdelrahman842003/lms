'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getAcademies, 
  createAcademy, 
  updateAcademy, 
  toggleAcademyStatus,
  getDashboardStats,
  getAcademySubscription,
  updateAcademySubscription
} from '@/services/authService';
import { toast } from 'react-hot-toast';
import { Avatar } from '@/components/ui';



// Billing Modal Component
const AcademyBillingModal = ({ 
  isOpen, 
  onClose, 
  academy, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  academy: any; 
  onSuccess: () => void; 
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (academy && isOpen) {
      fetchSubscription();
    }
  }, [academy, selectedMonth, isOpen]);

  const fetchSubscription = async () => {
    setFetching(true);
    setFetchError('');
    try {
      const response = await getAcademySubscription(academy.id, selectedMonth);
      setSubscriptionData(response);
      setPaymentAmount(0);
    } catch (error: any) {
      console.error('Failed to fetch subscription', error);
      setFetchError(error.message || 'فشل جلب البيانات. تأكد من تشغيل الترحيل (Migration) لقاعدة البيانات.');
      if (!error.message) {
          toast.error('فشل جلب بيانات الاشتراك');
      }
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateAcademySubscription(academy.id, {
        month: selectedMonth,
        amount: paymentAmount
      });
      toast.success('تم تحديث الاشتراك بنجاح');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to update subscription', error);
      toast.error('فشل تحديث الاشتراك');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#1e1e2d] rounded-xl border border-white/10 w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">اشتراك الأكاديمية</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">الشهر</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-[#151521] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
            />
          </div>

          {fetching ? (
            <div className="text-center py-4 text-gray-400">جاري جلب البيانات...</div>
          ) : fetchError ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
              {fetchError}
            </div>
          ) : subscriptionData ? (
            <>
              <div className="bg-white/5 rounded-lg p-4 space-y-2">

                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">عدد الاشتراكات:</span>
                  <span className="text-white font-medium">{subscriptionData.student_count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">حالة الدفع:</span>
                  <span className={`font-medium ${
                    subscriptionData.status === 'paid' ? 'text-green-400' : 
                    subscriptionData.status === 'partial' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {subscriptionData.status === 'paid' ? 'مدفوع' : 
                     subscriptionData.status === 'partial' ? 'مدفوع جزئياً' : 'غير مدفوع'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">المبلغ المستحق:</span>
                  <span className="text-white font-medium">${subscriptionData.amount_due}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">المبلغ المدفوع:</span>
                  <span className="text-green-400 font-medium">${subscriptionData.amount_paid}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                  <span className="text-gray-400">المتبقي:</span>
                  <span className="text-red-400 font-medium">${subscriptionData.remaining}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">مبلغ الدفع</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    min="0"
                    max={subscriptionData.remaining}
                    className="w-full bg-[#151521] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                    placeholder="أدخل المبلغ..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={loading || paymentAmount <= 0}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'جاري الحفظ...' : 'تأكيد الدفع'}
                  </button>
                </div>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};


export default function AdminAcademiesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [academies, setAcademies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [selectedAcademy, setSelectedAcademy] = useState<any>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    academyId: string | null;
    academyName: string;
    isActive: boolean;
  }>({
    isOpen: false,
    academyId: null,
    academyName: '',
    isActive: false
  });
  const [editingAcademy, setEditingAcademy] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    password: '',
    password_confirmation: '',
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    phone?: string;
    address?: string;
    password?: string;
    password_confirmation?: string;
  }>({});
  const [touched, setTouched] = useState<{
    name: boolean;
    phone: boolean;
    address: boolean;
    password: boolean;
    password_confirmation: boolean;
  }>({
    name: false,
    phone: false,
    address: false,
    password: false,
    password_confirmation: false,
  });
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const itemsPerPage = 10;

  const filterRef = useRef<HTMLDivElement>(null);

  // Real-time validation function
  const validateField = (name: string, value: string): string | undefined => {
    if (name === 'name') {
      if (!value.trim()) return 'الاسم مطلوب';
      if (value.length < 3) return `الاسم قصير (${value.length}/3 أحرف)`;
    }
    
    if (name === 'phone') {
      if (!value.trim()) return 'رقم الهاتف مطلوب';
      if (value.length > 0 && !value.startsWith('01')) return 'يجب أن يبدأ بـ 01';
      if (value.length > 2 && !/^01[0125]/.test(value)) return 'كود الشركة غير صحيح (010, 011, 012, 015)';
      if (value.length > 0 && value.length < 11) return `رقم غير مكتمل (${value.length}/11)`;
      if (value.length > 11) return 'رقم الهاتف أكثر من 11 رقم';
    }
    
    if (name === 'password') {
      if (!editingAcademy && !value) return 'كلمة المرور مطلوبة';
      if (value && value.length < 6) return `كلمة المرور قصيرة (${value.length}/6 أحرف)`;
    }
    
    if (name === 'password_confirmation') {
      if (formData.password && value !== formData.password) return 'كلمة المرور غير متطابقة';
    }
    
    return undefined;
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};
    
    const nameError = validateField('name', formData.name);
    const phoneError = validateField('phone', formData.phone);
    const passwordError = validateField('password', formData.password);
    const confirmError = validateField('password_confirmation', formData.password_confirmation);
    
    if (nameError) errors.name = nameError;
    if (phoneError) errors.phone = phoneError;
    if (passwordError) errors.password = passwordError;
    if (confirmError) errors.password_confirmation = confirmError;
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilter(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => {
      fetchAcademies(1);
      setIsFiltering(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters, searchQuery]);

  const fetchAcademies = async (page = 1) => {
    try {
      setIsLoading(true);
      const activeFilters = {
        search: searchQuery,
        status: filters.status !== 'all' ? filters.status : undefined,
      };
      
      const [academiesRes, statsRes] = await Promise.all([
        getAcademies(page, itemsPerPage, activeFilters),
        getDashboardStats()
      ]);

      console.log('Fetched academies:', academiesRes);
      setAcademies(academiesRes.academies.data || []);
      setTotalPages(academiesRes.academies.last_page || 1);
      setTotalItems(academiesRes.academies.total || 0);
      setCurrentPage(academiesRes.academies.current_page || 1);

      // Set stats
      if (statsRes) {
        setTotalTeachers(statsRes.teachers_count || 0);
        setTotalRevenue(statsRes.total_revenue || 0);
      }

    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademies();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // For phone field, only allow numbers
    if (name === 'phone') {
      processedValue = value.replace(/[^0-9]/g, '').slice(0, 11);
    }
    
    setFormData({ ...formData, [name]: processedValue });
    setError('');
    
    // Real-time validation
    const fieldError = validateField(name, processedValue);
    setValidationErrors(prev => ({ ...prev, [name]: fieldError }));
    
    // Mark as touched
    if (processedValue.length > 0) {
      setTouched(prev => ({ ...prev, [name]: true }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const fieldError = validateField(name, value);
    setValidationErrors(prev => ({ ...prev, [name]: fieldError }));
  };

  const openAddModal = () => {
    setEditingAcademy(null);
    setFormData({ name: '', phone: '', address: '', password: '', password_confirmation: '' });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (academy: any) => {
    setEditingAcademy(academy);
    setFormData({
      name: academy.name,
      phone: academy.phone || '',
      address: academy.address || '',
      password: '',
      password_confirmation: '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const openBillingModal = (academy: any) => {
    setSelectedAcademy(academy);
    setIsBillingModalOpen(true);
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Mark all fields as touched
    setTouched({ name: true, phone: true, address: true, password: true, password_confirmation: true });
    
    // Validate before submit
    if (!validateForm()) {
      return;
    }

    setSubmitLoading(true);

    try {
      if (editingAcademy) {
        await updateAcademy(editingAcademy.id, formData);
      } else {
        await createAcademy(formData);
      }
      await fetchAcademies(currentPage);
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', address: '', password: '', password_confirmation: '' });
      setEditingAcademy(null);
      toast.success(editingAcademy ? 'تم تحديث الأكاديمية بنجاح' : 'تم إضافة الأكاديمية بنجاح');
    } catch (err: any) {
      setError(err.response?.data?.message || (editingAcademy ? 'فشل تحديث بيانات الأكاديمية' : 'فشل إضافة الأكاديمية'));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleStatus = (academy: any) => {
    setConfirmModal({
      isOpen: true,
      academyId: academy.id,
      academyName: academy.name,
      isActive: academy.is_active
    });
  };

  const confirmToggleStatus = async () => {
    if (!confirmModal.academyId) return;

    try {
      await toggleAcademyStatus(confirmModal.academyId);
      toast.success(`تم ${confirmModal.isActive ? 'تعطيل' : 'تفعيل'} الأكاديمية بنجاح`);
      await fetchAcademies(currentPage);
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error('Failed to toggle academy status', error);
      toast.error('فشل تغيير حالة الأكاديمية');
    }
  };

  const tableColumns = [{
      key: 'id',
      label: '#',
      className: 'hidden sm:table-cell',
      render: (_: any, __: any, index: number) => {
        return (currentPage - 1) * itemsPerPage + index + 1;
      }
    },
    {
      key: 'name',
      label: 'الاسم',
      sortable: true,
      render: (value: string, row: any) => (
        <div className="flex items-center gap-3">
          <Avatar name={value} src={row.logo} size="sm" />
          <span className="font-medium text-white">{value}</span>
        </div>
      ),
    },
    {
      key: 'teachers_count',
      label: 'عدد المدرسين',
      sortable: true,
      className: 'hidden sm:table-cell',
    },
    {
      key: 'total_enrollments_count',
      label: 'عدد الارتباطات',
      sortable: true,
      className: 'hidden sm:table-cell',
    },
    {
      key: 'secretaries_count',
      label: 'عدد السكرتارية',
      sortable: true,
      className: 'hidden md:table-cell',
    },
    {
      key: 'phone',
      label: 'الهاتف',
      sortable: true,
      className: 'hidden lg:table-cell',
    },
    {
      key: 'created_at',
      label: 'تاريخ الإنشاء',
      sortable: true,
      className: 'hidden xl:table-cell',
      render: (value: string) => new Date(value).toLocaleDateString('ar-EG'),
    },
    {
      key: 'status',
      label: 'الحالة',
      sortable: true,
      render: (_: string, row: any) => (
        <span className={row.is_active ? 'badge badge-success' : 'badge badge-danger'}>
          {row.is_active ? 'نشط' : 'معطل'}
        </span>
      ),
    },
  ];

  const tableActions = [
    {
      label: 'عرض التفاصيل',
      icon: 'fas fa-eye',
      onClick: (row: any) => {
        router.push(`/admin/academies/${row.id}`);
      },
    },

    {
      label: 'تعديل البيانات',
      icon: 'fas fa-edit',
      onClick: (row: any) => openEditModal(row),
    },
    {
      label: (row: any) => row.is_active ? 'تعطيل الأكاديمية' : 'تفعيل الأكاديمية',
      icon: (row: any) => row.is_active ? 'fas fa-ban' : 'fas fa-check-circle',
      variant: (row: any) => row.is_active ? 'danger' : 'success',
      onClick: (row: any) => handleToggleStatus(row),
    },
    {
      label: 'دفع الاشتراك',
      icon: 'fas fa-money-bill-wave',
      variant: 'success' as const,
      onClick: (row: any) => openBillingModal(row),
    },
  ];

  return (
    <DashboardLayout
      role="admin"
      user={user || undefined}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-8">
        <StatCard
          title="إجمالي الأكاديميات"
          value={totalItems}
          icon="fas fa-building"
          color="primary"
          variant="centered"
        />

        <StatCard
          title="أكاديميات نشطة"
          value={academies.filter(a => a.is_active).length}
          icon="fas fa-check-circle"
          color="success"
          variant="centered"
        />

        <StatCard
          title="إجمالي المدرسين"
          value={totalTeachers}
          icon="fas fa-chalkboard-teacher"
          color="warning"
          variant="centered"
        />

        <StatCard
          title="إجمالي الإيرادات"
          value={totalRevenue}
          icon="fas fa-dollar-sign"
          color="danger"
          prefix="$"
          variant="centered"
        />
      </div>

      {/* Academies Table */}
      <DashboardCard
        title="قائمة الأكاديميات"
        icon="fas fa-table"
        action={
          <div className="flex gap-3 flex-wrap">
            <button className="btn btn-primary" onClick={openAddModal}>
              <i className="fas fa-plus"></i>
              <span>إضافة أكاديمية جديدة</span>
            </button>

            <div className="relative" ref={filterRef}>
              <button 
                className={`btn btn-sm ${showFilter ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setShowFilter(!showFilter)}
              >
                <i className="fas fa-filter"></i>
                <span>تصفية</span>
              </button>
              
              {showFilter && (
                <div className="absolute top-full left-0 mt-2 bg-[#1a1f37] border border-white/10 rounded-xl p-5 z-[100] w-[320px] shadow-[0_10px_25px_rgba(0,0,0,0.5)] backdrop-blur-md">
                  <div className="mb-4">
                    <label className="block text-gray-light mb-2 text-[0.9rem]">الحالة</label>
                    <select 
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value})}
                      className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-white outline-none"
                    >
                      <option value="all" className="bg-[#1a1f37]">الكل</option>
                      <option value="active" className="bg-[#1a1f37]">نشط</option>
                      <option value="inactive" className="bg-[#1a1f37]">معطل</option>
                    </select>
                  </div>

                  <div className="flex gap-2.5">
                    <button 
                      className="btn btn-primary btn-sm flex-1"
                      onClick={() => setShowFilter(false)}
                    >
                      تطبيق
                    </button>
                    <button 
                      className="btn btn-outline btn-sm flex-1"
                      onClick={() => setFilters({ status: 'all' })}
                    >
                      إعادة تعيين
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        }>
        
        {isLoading || isFiltering ? (
          <div className="data-table-wrapper overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  {tableColumns.map((col) => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    {tableColumns.map((_, index) => (
                      <td key={index}>
                        <div className={`skeleton-item ${index === 0 ? 'w-10' : index === 1 ? 'w-[120px]' : 'w-20'}`}></div>
                      </td>
                    ))}
                    <td>
                      <div className="skeleton-item w-20"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <DataTable
            columns={tableColumns}
            data={academies}
            actions={tableActions}
            searchable={true}
            onSearch={setSearchQuery}
            pagination={true}
            itemsPerPage={itemsPerPage}
            isLoading={false}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={(page) => fetchAcademies(page)}
          />
        )}
      </DashboardCard>

      {/* Add/Edit Academy Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-[#1a1f37] p-5 rounded-2xl w-full max-w-md border border-white/10">
            <h2 className="text-white mb-4 text-xl font-bold">
              {editingAcademy ? 'تعديل بيانات الأكاديمية' : 'إضافة أكاديمية جديدة'}
            </h2>
            
            {error && (
              <div className="bg-danger/10 text-danger p-2.5 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-300 mb-1.5 text-sm">الاسم</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full p-2.5 bg-white/5 border rounded-lg text-white outline-none focus:ring-1 transition-all text-sm ${
                    touched.name && validationErrors.name 
                      ? 'border-danger focus:border-danger focus:ring-danger' 
                      : 'border-white/10 focus:border-primary focus:ring-primary'
                  }`}
                  required
                />
                {touched.name && validationErrors.name && (
                  <p className="text-danger text-xs mt-1 flex items-center gap-1">
                    <i className="fas fa-exclamation-circle"></i>
                    {validationErrors.name}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-gray-300 mb-1.5 text-sm">رقم الهاتف</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full p-2.5 bg-white/5 border rounded-lg text-white outline-none focus:ring-1 transition-all text-sm ${
                    touched.phone && validationErrors.phone 
                      ? 'border-danger focus:border-danger focus:ring-danger' 
                      : 'border-white/10 focus:border-primary focus:ring-primary'
                  }`}
                  placeholder="01xxxxxxxxx"
                  inputMode="numeric"
                  required
                />
                {touched.phone && validationErrors.phone && (
                  <p className="text-danger text-xs mt-1 flex items-center gap-1">
                    <i className="fas fa-exclamation-circle"></i>
                    {validationErrors.phone}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-gray-300 mb-1.5 text-sm">العنوان</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                  rows={3}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-300 mb-1.5 text-sm">
                  {editingAcademy ? 'كلمة المرور (اتركها فارغة إذا لم ترد التغيير)' : 'كلمة المرور'}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full p-2.5 bg-white/5 border rounded-lg text-white outline-none focus:ring-1 transition-all text-sm ${
                    touched.password && validationErrors.password 
                      ? 'border-danger focus:border-danger focus:ring-danger' 
                      : 'border-white/10 focus:border-primary focus:ring-primary'
                  }`}
                  required={!editingAcademy}
                  minLength={6}
                />
                {touched.password && validationErrors.password && (
                  <p className="text-danger text-xs mt-1 flex items-center gap-1">
                    <i className="fas fa-exclamation-circle"></i>
                    {validationErrors.password}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-gray-300 mb-1.5 text-sm">تأكيد كلمة المرور</label>
                <input
                  type="password"
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full p-2.5 bg-white/5 border rounded-lg text-white outline-none focus:ring-1 transition-all text-sm ${
                    touched.password_confirmation && validationErrors.password_confirmation 
                      ? 'border-danger focus:border-danger focus:ring-danger' 
                      : 'border-white/10 focus:border-primary focus:ring-primary'
                  }`}
                  required={!editingAcademy}
                  minLength={6}
                />
                {touched.password_confirmation && validationErrors.password_confirmation && (
                  <p className="text-danger text-xs mt-1 flex items-center gap-1">
                    <i className="fas fa-exclamation-circle"></i>
                    {validationErrors.password_confirmation}
                  </p>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-white/10">
                <button
                  type="button"
                  className="px-4 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-all text-sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitLoading}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all flex items-center gap-2 text-sm"
                  disabled={submitLoading}
                >
                  {submitLoading ? 'جاري الحفظ...' : (editingAcademy ? 'حفظ التغييرات' : 'إضافة الأكاديمية')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Billing Modal Component*/}
      <AcademyBillingModal
        isOpen={isBillingModalOpen}
        onClose={() => {
          setIsBillingModalOpen(false);
          setSelectedAcademy(null);
        }}
        academy={selectedAcademy}
        onSuccess={() => fetchAcademies(currentPage)}
      />

{/* Billing Modal */}


      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-[#1a1f37] p-6 rounded-2xl w-full max-w-sm border border-white/10 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmModal.isActive ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
              <i className={`fas ${confirmModal.isActive ? 'fa-ban' : 'fa-check'} text-3xl`}></i>
            </div>
            
            <h3 className="text-white text-xl font-bold mb-2">
              {confirmModal.isActive ? 'تعطيل الأكاديمية' : 'تفعيل الأكاديمية'}
            </h3>
            
            <p className="text-gray-400 mb-6">
              هل أنت متأكد من {confirmModal.isActive ? 'تعطيل' : 'تفعيل'} الأكاديمية <span className="text-white font-bold">{confirmModal.academyName}</span>؟
            </p>

            <div className="flex gap-3 justify-center">
              <button
                className="px-6 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-all"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              >
                إلغاء
              </button>
              <button
                className={`px-6 py-2 rounded-lg text-white transition-all ${confirmModal.isActive ? 'bg-danger hover:bg-danger/90' : 'bg-success hover:bg-success/90'}`}
                onClick={confirmToggleStatus}
              >
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
