'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/AuthContext';
import { getTeachers, createTeacher, updateTeacher, toggleTeacherStatus, loginAsTeacher, getDashboardStats, updateTeacherSubscription, getTeacherSubscription } from '@/services/authService';
import { toast } from 'react-hot-toast';

import { Avatar } from '@/components/ui';

// Subscription Modal Component

const SubscriptionModal = ({ 
  isOpen, 
  onClose, 
  teacher, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  teacher: any; 
  onSuccess: () => void; 
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (teacher && isOpen) {
      fetchSubscription();
    }
  }, [teacher, selectedMonth, isOpen]);

  const fetchSubscription = async () => {
    setFetching(true);
    setFetchError('');
    try {
      const response = await getTeacherSubscription(teacher.id, selectedMonth);
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
      await updateTeacherSubscription(teacher.id, {
        month: selectedMonth,
        payment_amount: paymentAmount
      });
      toast.success('تم تحديث بيانات الاشتراك بنجاح');
      await fetchSubscription(); // Refresh data
      onSuccess();
    } catch (error) {
      console.error('Failed to update subscription', error);
      toast.error('فشل تحديث بيانات الاشتراك');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !teacher) return null;

  const amountDue = subscriptionData?.amount_due || 0;
  const amountPaid = subscriptionData?.amount_paid || 0;
  const remaining = amountDue - amountPaid - paymentAmount;
  const isPaid = subscriptionData?.status === 'paid';

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#1a1f37] p-6 rounded-2xl w-full max-w-md border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-white mb-6 text-xl font-bold flex items-center gap-3">
          <i className="fas fa-money-bill-wave text-success"></i>
          <span>دفع اشتراك المدرس</span>
        </h2>

        <div className="mb-6">
          <label className="block text-gray-300 mb-2 text-sm">اختر الشهر</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
          />
        </div>

        {fetching ? (
          <div className="text-center py-8 text-gray-400">جاري التحميل...</div>
        ) : fetchError ? (
          <div className="text-center py-8">
            <div className="text-danger mb-2">
              <i className="fas fa-exclamation-circle text-2xl"></i>
            </div>
            <p className="text-danger text-sm">{fetchError}</p>
            <button 
              onClick={fetchSubscription}
              className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                <Avatar name={teacher.name} src={teacher.avatar} size="md" />
                <div>
                  <h3 className="text-white font-bold">{teacher.name}</h3>
                  <p className="text-gray-400 text-sm">{teacher.phone}</p>
                </div>
              </div>
              
              {/* Check if month is before teacher joined */}
              {(() => {
                const selectedDate = new Date(selectedMonth + '-01');
                const teacherDate = new Date(teacher.created_at);
                const teacherMonthStart = new Date(teacherDate.getFullYear(), teacherDate.getMonth(), 1);
                
                if (selectedDate < teacherMonthStart) {
                  return (
                    <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg text-center">
                      <p className="text-warning text-sm font-bold">
                        <i className="fas fa-info-circle ml-2"></i>
                        المدرس لم يكن مشتركا في هذا الشهر
                      </p>
                    </div>
                  );
                }
                
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="block text-gray-400 mb-1">عدد الطلاب (في هذا الشهر)</span>
                        <span className="text-white font-bold">{subscriptionData?.student_count || 0}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 mb-1">المبلغ المستحق</span>
                        <span className="text-primary font-bold">${amountDue}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm pt-3 border-t border-white/10">
                      <div>
                        <span className="block text-gray-400 mb-1">المبلغ المدفوع</span>
                        <span className="text-success font-bold text-lg">${amountPaid}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 mb-1">المبلغ المتبقي</span>
                        <span className={`font-bold text-lg ${remaining > 0 ? 'text-danger' : 'text-success'}`}>
                          ${Math.max(0, remaining)}
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
              
              <div className="mt-3 pt-3 border-t border-white/10 text-center">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isPaid ? 'bg-success/20 text-success' : 
                  subscriptionData?.status === 'partial' ? 'bg-warning/20 text-warning' : 
                  'bg-danger/20 text-danger'
                }`}>
                  {isPaid ? 'تم الدفع بالكامل' : 
                   subscriptionData?.status === 'partial' ? 'مدفوع جزئياً' : 
                   'غير مدفوع'}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Payment Form - Only show if subscribed */}
        {(() => {
            const selectedDate = new Date(selectedMonth + '-01');
            const teacherDate = new Date(teacher.created_at);
            const teacherMonthStart = new Date(teacherDate.getFullYear(), teacherDate.getMonth(), 1);
            
            if (selectedDate >= teacherMonthStart && !fetching && !fetchError && !isPaid) {
              return (
                <form onSubmit={handleSubmit} className="mt-6 pt-6 border-t border-white/10">
                  <div className="mb-4">
                    <label className="block text-gray-300 mb-2 text-sm">مبلغ الدفع الحالي</label>
                    <input
                      type="number"
                      min="0"
                      max={amountDue - amountPaid}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      className="px-4 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-all text-sm"
                      onClick={onClose}
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-success text-white hover:bg-success/90 transition-all flex items-center gap-2 text-sm"
                      disabled={loading || paymentAmount <= 0}
                    >
                      {loading ? 'جاري الحفظ...' : 'حفظ الدفع'}
                    </button>
                  </div>
                </form>
              );
            }
            return null;
        })()}
            
        {isPaid && (
          <div className="flex justify-end pt-3 border-t border-white/10 mt-4">
            <button
              type="button"
              className="px-4 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-all text-sm"
              onClick={onClose}
            >
              إغلاق
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function AdminTeachersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    teacherId: string | null;
    teacherName: string;
    isSuspended: boolean;
  }>({
    isOpen: false,
    teacherId: null,
    teacherName: '',
    isSuspended: false
  });
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    phone?: string;
    password?: string;
    password_confirmation?: string;
  }>({});
  const [touched, setTouched] = useState<{
    name: boolean;
    phone: boolean;
    password: boolean;
    password_confirmation: boolean;
  }>({
    name: false,
    phone: false,
    password: false,
    password_confirmation: false,
  });
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
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
      if (!editingTeacher && !value) return 'كلمة المرور مطلوبة';
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
      fetchTeachers(1);
      setIsFiltering(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters, searchQuery]);

  const fetchTeachers = async (page = 1) => {
    try {
      setIsLoading(true);
      const activeFilters = {
        search: searchQuery,
        status: filters.status !== 'all' ? filters.status : undefined,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined
      };
      
      const [teachersRes, statsRes] = await Promise.all([
        getTeachers(page, itemsPerPage, activeFilters),
        getDashboardStats()
      ]);

      console.log('Fetched teachers:', teachersRes.data);
      setTeachers(teachersRes.data);
      setTotalPages(teachersRes.meta.last_page);
      setTotalItems(teachersRes.meta.total);
      setCurrentPage(teachersRes.meta.current_page);

      // Set stats
      if (statsRes) {
        setTotalStudents(statsRes.students_count || 0);
        
        // Calculate total revenue by summing each teacher's revenue
        // This ensures accurate calculation: sum of (each teacher's students × price)
        const sumOfTeacherRevenues = teachersRes.data.reduce((sum: number, teacher: any) => {
          return sum + (teacher.revenue || 0);
        }, 0);
        
        // Use sum of teacher revenues if available, otherwise fall back to API stats
        const calculatedRevenue = sumOfTeacherRevenues > 0 
          ? sumOfTeacherRevenues 
          : (statsRes.total_revenue || (statsRes.students_count * (statsRes.price_per_student || 0)));
        setTotalRevenue(calculatedRevenue);
      }

    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const fieldError = validateField(name, value);
    setValidationErrors(prev => ({ ...prev, [name]: fieldError }));
  };

  const openAddModal = () => {
    setEditingTeacher(null);
    setFormData({ name: '', phone: '', password: '', password_confirmation: '' });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (teacher: any) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      phone: teacher.phone || '',
      password: '',
      password_confirmation: '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const openSubscriptionModal = (teacher: any) => {
    setSelectedTeacher(teacher);
    setIsSubscriptionModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Mark all fields as touched
    setTouched({ name: true, phone: true, password: true, password_confirmation: true });
    
    // Validate before submit
    if (!validateForm()) {
      return;
    }

    setSubmitLoading(true);

    try {
      if (editingTeacher) {
        await updateTeacher(editingTeacher.id, formData);
      } else {
        await createTeacher(formData);
      }
      await fetchTeachers(currentPage);
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', password: '', password_confirmation: '' });
      setEditingTeacher(null);
    } catch (err: any) {
      setError(err.response?.data?.message || (editingTeacher ? 'فشل تحديث بيانات المدرس' : 'فشل إضافة المدرس'));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleStatus = (teacher: any) => {
    setConfirmModal({
      isOpen: true,
      teacherId: teacher.id,
      teacherName: teacher.name,
      isSuspended: teacher.is_suspended
    });
  };

  const confirmToggleStatus = async () => {
    if (!confirmModal.teacherId) return;

    try {
      await toggleTeacherStatus(confirmModal.teacherId);
      toast.success(`تم ${confirmModal.isSuspended ? 'تفعيل' : 'تعليق'} حساب المدرس بنجاح`);
      await fetchTeachers(currentPage);
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error('Failed to toggle teacher status', error);
      toast.error('فشل تغيير حالة المدرس');
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
          <Avatar name={value} src={row.avatar} size="sm" />
          <button 
            onClick={() => router.push(`/admin/teachers/${row.id}`)}
            className="font-medium text-white hover:text-primary transition-colors text-right"
          >
            {value}
          </button>
        </div>
      ),
    },
    {
      key: 'students_count',
      label: 'عدد الطلاب',
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
      key: 'revenue',
      label: 'الإيرادات',
      sortable: true,
      className: 'hidden xl:table-cell',
      render: (value: number) => `$${value.toLocaleString()}`,
    },
    {
      key: 'joined',
      label: 'تاريخ الانضمام',
      sortable: true,
      className: 'hidden lg:table-cell',
    },
    {
      key: 'status',
      label: 'الحالة',
      sortable: true,
      render: (_: string, row: any) => (
        <span className={!row.is_suspended ? 'badge badge-success' : 'badge badge-danger'}>
          {!row.is_suspended ? 'نشط' : 'معلق'}
        </span>
      ),
    },
  ];

  const tableActions = [
    {
      label: 'دفع الاشتراك',
      icon: 'fas fa-money-bill-wave',
      variant: 'success' as const,
      onClick: (row: any) => openSubscriptionModal(row),
    },
    {
      label: 'عرض التفاصيل',
      icon: 'fas fa-eye',
      onClick: (row: any) => {
        router.push(`/admin/teachers/${row.id}`);
      },
    },
    {
      label: 'الدخول للوحة التحكم',
      icon: 'fas fa-sign-in-alt',
      onClick: async (row: any) => {
        try {
          const response = await loginAsTeacher(row.id);
          
          // Clear admin session
          localStorage.clear();
          
          // Set teacher session
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          localStorage.setItem('userType', 'teacher');
          
          // Set cookies
          document.cookie = "auth_state=true; path=/; max-age=2592000; SameSite=Lax";
          document.cookie = "user_role=teacher; path=/; max-age=2592000; SameSite=Lax";
          
          // Force reload to apply new auth state
          window.location.href = '/teacher/dashboard';
          
        } catch (error) {
          console.error('Failed to login as teacher', error);
          toast.error('فشل الدخول لحساب المدرس');
        }
      },
    },
    {
      label: 'تعديل البيانات',
      icon: 'fas fa-edit',
      onClick: (row: any) => openEditModal(row),
    },
    {
      label: (row: any) => row.is_suspended ? 'تفعيل الحساب' : 'تعليق الحساب',
      icon: (row: any) => row.is_suspended ? 'fas fa-check-circle' : 'fas fa-ban',
      variant: (row: any) => row.is_suspended ? 'success' : 'danger',
      onClick: (row: any) => handleToggleStatus(row),
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
          title="إجمالي المدرسين"
          value={teachers.length}
          icon="fas fa-chalkboard-teacher"
          color="primary"
          variant="centered"
        />

        <StatCard
          title="مدرسين نشطين"
          value={teachers.length}
          icon="fas fa-user-check"
          color="success"
          variant="centered"
        />

        <StatCard
          title="إجمالي الطلاب"
          value={totalStudents}
          icon="fas fa-users"
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

      {/* Teachers Table */}
      <DashboardCard
        title="قائمة المدرسين"
        icon="fas fa-table"
        action={
          <div className="flex gap-3 flex-wrap">
            <button className="btn btn-primary" onClick={openAddModal}>
              <i className="fas fa-plus"></i>
              <span>إضافة مدرس جديد</span>
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
                      <option value="نشط" className="bg-[#1a1f37]">نشط</option>
                      <option value="غير نشط" className="bg-[#1a1f37]">غير نشط</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-light mb-2 text-[0.9rem]">تاريخ الانضمام (من)</label>
                    <input 
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                      className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-white color-scheme-dark"
                    />
                  </div>

                  <div className="mb-5">
                    <label className="block text-gray-light mb-2 text-[0.9rem]">تاريخ الانضمام (إلى)</label>
                    <input 
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                      className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-white color-scheme-dark"
                    />
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
                      onClick={() => setFilters({ status: 'all', dateFrom: '', dateTo: '' })}
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
            data={teachers}
            actions={tableActions}
            searchable={true}
            onSearch={setSearchQuery}
            pagination={true}
            itemsPerPage={itemsPerPage}
            isLoading={false}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={(page) => fetchTeachers(page)}
          />
        )}
      </DashboardCard>

      {/* Add/Edit Teacher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-[#1a1f37] p-5 rounded-2xl w-full max-w-md border border-white/10">
            <h2 className="text-white mb-4 text-xl font-bold">
              {editingTeacher ? 'تعديل بيانات المدرس' : 'إضافة مدرس جديد'}
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
                <label className="block text-gray-300 mb-1.5 text-sm">
                  {editingTeacher ? 'كلمة المرور (اتركها فارغة إذا لم ترد التغيير)' : 'كلمة المرور'}
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
                  required={!editingTeacher}
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
                  required={!editingTeacher}
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
                  {submitLoading ? 'جاري الحفظ...' : (editingTeacher ? 'حفظ التغييرات' : 'إضافة المدرس')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => {
          setIsSubscriptionModalOpen(false);
          setSelectedTeacher(null);
        }}
        teacher={selectedTeacher}
        onSuccess={() => fetchTeachers(currentPage)}
      />

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-[#1a1f37] p-6 rounded-2xl w-full max-w-sm border border-white/10 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmModal.isSuspended ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
              <i className={`fas ${confirmModal.isSuspended ? 'fa-check' : 'fa-ban'} text-3xl`}></i>
            </div>
            
            <h3 className="text-white text-xl font-bold mb-2">
              {confirmModal.isSuspended ? 'تفعيل حساب المدرس' : 'تعليق حساب المدرس'}
            </h3>
            
            <p className="text-gray-400 mb-6">
              هل أنت متأكد من {confirmModal.isSuspended ? 'تفعيل' : 'تعليق'} حساب المدرس <span className="text-white font-bold">{confirmModal.teacherName}</span>؟
            </p>

            <div className="flex gap-3 justify-center">
              <button
                className="px-6 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-all"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              >
                إلغاء
              </button>
              <button
                className={`px-6 py-2 rounded-lg text-white transition-all ${confirmModal.isSuspended ? 'bg-success hover:bg-success/90' : 'bg-danger hover:bg-danger/90'}`}
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
