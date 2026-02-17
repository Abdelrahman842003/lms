'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { getTeachers, createTeacher, updateTeacher, toggleTeacherStatus, loginAsTeacher, getDashboardStats, updateTeacherSubscription, getTeacherSubscription, approveTeacher, enableIndependent, disableIndependent, addToAcademy, removeFromAcademy, deleteTeacher, getAuthToken } from '@/services/authService';
import { toast } from 'react-hot-toast';
import { Avatar } from '@/components/ui';
import { Filter } from '@/components/Filter';
import AffiliationModal from '@/components/admin/teachers/AffiliationModal';
import SuspendModal from '@/components/admin/teachers/SuspendModal';
import SubscriptionPlanModal from '@/components/admin/teachers/SubscriptionPlanModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

// ... existing imports

// Subscription logic removed based on user request to keep only Plan Settings


export default function AdminTeachersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [affiliationModalOpen, setAffiliationModalOpen] = useState(false);
  const [selectedTeacherForAffiliation, setSelectedTeacherForAffiliation] = useState<any>(null);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [teacherToSuspend, setTeacherToSuspend] = useState<any>(null);
  
  // Subscription Plan Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedTeacherForPlan, setSelectedTeacherForPlan] = useState<any>(null);



  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    password_confirmation: '',
    subject: '',
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    phone?: string;
    password?: string;
    password_confirmation?: string;
    subject?: string;
  }>({});
  const [touched, setTouched] = useState<{
    name: boolean;
    phone: boolean;
    password: boolean;
    password_confirmation: boolean;
    subject: boolean;
  }>({
    name: false,
    phone: false,
    password: false,
    password_confirmation: false,
    subject: false,
  });

  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    payment_status: 'all',
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
  const [pendingTeachers, setPendingTeachers] = useState(0);
  const itemsPerPage = 10;
  
  // Delete Confirmation State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);


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
    setIsFiltering(true);
    const timer = setTimeout(() => {
      fetchTeachers(1);
      setIsFiltering(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters, searchQuery]);

  // Populate form data when editing
  useEffect(() => {
    if (isModalOpen) {
      if (selectedTeacher) {
        setEditingTeacher(selectedTeacher);
        setFormData({
          name: selectedTeacher.name || '',
          phone: selectedTeacher.phone || '',
          password: '',
          password_confirmation: '',
          subject: selectedTeacher.subject || '',
        });
      } else {
        setEditingTeacher(null);
        setFormData({
          name: '',
          phone: '',
          password: '',
          password_confirmation: '',
          subject: '',
        });
      }
      // Reset validation state
      setTouched({
        name: false,
        phone: false,
        password: false,
        password_confirmation: false,
        subject: false,
      });
      setValidationErrors({});
    }
  }, [isModalOpen, selectedTeacher]);

  const fetchTeachers = async (page = 1) => {
    try {
      setIsLoading(true);
      const activeFilters: any = {
        search: searchQuery,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
        type: filters.type !== 'all' ? filters.type : undefined,
        payment_status: filters.payment_status !== 'all' ? filters.payment_status : undefined
      };
      
      // Don't send status filter to backend, we'll filter client-side
      // if (filters.status && filters.status !== 'all') {
      //   activeFilters.status = filters.status;
      // }
      
      const [teachersRes, statsRes] = await Promise.all([
        getTeachers(page, itemsPerPage, activeFilters),
        getDashboardStats()
      ]);
      
      // Apply client-side status filtering
      let filteredTeachers = teachersRes.data;
      if (filters.status && filters.status !== 'all') {
        filteredTeachers = teachersRes.data.filter((t: any) => {
          if (filters.status === 'active') return t.status_key === 'active';
          if (filters.status === 'suspended') return t.status_key === 'suspended';
          if (filters.status === 'pending') return t.status_key === 'pending';
          return true;
        });
      }
      
      setTeachers(filteredTeachers);
      setTotalPages(teachersRes.meta.last_page);
      setTotalItems(teachersRes.meta.total);
      setCurrentPage(teachersRes.meta.current_page);

      // Update selected teacher for affiliation modal if open
      if (selectedTeacherForAffiliation) {
        const updatedTeacher = filteredTeachers.find((t: any) => t.id === selectedTeacherForAffiliation.id);
        if (updatedTeacher) {
          setSelectedTeacherForAffiliation(updatedTeacher);
        }
      }

      // Set stats
      if (statsRes) {
        setTotalStudents(statsRes.students_count || 0);
        setPendingTeachers(statsRes.pending_teachers_count || 0);
        
        // Calculate total revenue by summing each teacher's revenue
        // This ensures accurate calculation: sum of (each teacher's students × price)
        const sumOfTeacherRevenues = filteredTeachers.reduce((sum: number, teacher: any) => {
          return sum + (teacher.revenue || 0);
        }, 0);
        
        // Use sum of teacher revenues if available, otherwise fall back to API stats
        const calculatedRevenue = sumOfTeacherRevenues > 0 
          ? sumOfTeacherRevenues 
          : (statsRes.total_revenue || (statsRes.students_count * (statsRes.price_per_student || 0)));
        setTotalRevenue(calculatedRevenue);
      }

    } catch (error) {
      // Error handled silently
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





  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Mark all fields as touched
    setTouched({ name: true, phone: true, password: true, password_confirmation: true, subject: true });
    
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
      setFormData({ name: '', phone: '', password: '', password_confirmation: '', subject: '' });
      setEditingTeacher(null);
    } catch (err: any) {
      setError(err.response?.data?.message || (editingTeacher ? 'فشل تحديث بيانات المدرس' : 'فشل إضافة المدرس'));
    } finally {
      setSubmitLoading(false);
    }
  };



  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };



  const handleToggleStatus = async (teacher: any) => {
    // Check if teacher has multiple affiliations
    const hasIndependent = teacher.affiliation === 'independent' || teacher.affiliation === 'both';
    const hasAcademies = teacher.academies && teacher.academies.length > 0;
    
    // If they have multiple contexts (Independent + Academy OR Multiple Academies), open modal
    // Also open if they are just independent but we want to show the new modal style?
    // Let's stick to the plan: Open modal if multiple affiliations OR if we want granular control.
    // Actually, even for single affiliation, the new modal provides a clear "Global" vs "Context" distinction.
    // But to avoid annoyance for simple cases, maybe only if multiple?
    // User request: "when he belongs to more than one academy... a popup appears"
    
    if ((hasIndependent && hasAcademies) || (teacher.academies && teacher.academies.length > 1)) {
      setTeacherToSuspend(teacher);
      setSuspendModalOpen(true);
      return;
    }

    // Default behavior for single affiliation (or just global toggle)
    try {
      await toggleTeacherStatus(teacher.id);
      toast.success('تم تغيير حالة المدرس بنجاح');
      await fetchTeachers(currentPage);
    } catch (error) {
      toast.error('فشل تغيير حالة المدرس');
    }
  };
  const handleApprove = async (teacher: any) => {
    try {
      await approveTeacher(teacher.id);
      toast.success('تمت الموافقة على المدرس بنجاح');
      await fetchTeachers(currentPage);
    } catch (error) {
      toast.error('فشل الموافقة على المدرس');
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
      className: 'hidden sm:table-cell',
    },
    {
      key: 'secretaries_count',
      label: 'عدد السكرتارية',
      sortable: true,
      className: 'hidden md:table-cell',
    },

    {
      key: 'joined',
      label: 'تاريخ الانضمام',
      sortable: true,
      className: 'hidden lg:table-cell',
    },
    {
      key: 'affiliation',
      label: 'التبعية',
      sortable: false,
      render: (_: any, row: any) => {
        return (
          <div className="flex flex-wrap gap-2">
            {/* Independent Badge */}
            {(row.affiliation === 'independent' || row.affiliation === 'both') && (
              <span 
                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  row.is_independent_active 
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                    : 'bg-red-500/10 text-red-400 border-red-500 cursor-not-allowed opacity-75'
                }`}
              >
                {row.is_independent_active ? 'مستقل' : 'مستقل (معطل)'}
              </span>
            )}
            
            {/* Academy Badges */}
            {row.academies && row.academies.map((academy: any) => (
              <span 
                key={academy.id} 
                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  academy.pivot?.is_active
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500 cursor-not-allowed opacity-75'
                }`}
              >
                {academy.pivot?.is_active ? academy.name : `${academy.name} (معطل)`}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'subscription_status',
      label: 'حالة الباقة',
      sortable: false,
      render: (_: any, row: any) => {
        // Only show for independent or both, OR if filtering by independent
        if (filters.type !== 'independent' && row.affiliation === 'academy') return <span className="text-gray-400">-</span>;

        // Check if teacher has a plan
        if (row.plan_type) {
          if (row.plan_type === 'trial') {
            return <span className="px-2 py-1 rounded text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">تجريبي</span>;
          } else if (row.plan_type === 'term') {
            return <span className="px-2 py-1 rounded text-xs bg-green-500/10 text-green-400 border border-green-500/20">مدة ثابتة</span>;
          } else if (row.plan_type === 'custom') {
            return <span className="px-2 py-1 rounded text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20">مخصصة</span>;
          }
        }

        // Fallback to old subscription status
        const status = row.subscription_status || 'pending';
        let badgeClass = 'badge-danger';
        let text = 'غير مدفوع';

        if (status === 'paid') {
          badgeClass = 'badge-success';
          text = 'مدفوع';
        } else if (status === 'partial') {
          badgeClass = 'badge-warning';
          text = 'مدفوع جزئياً';
        }

        return <span className={`badge ${badgeClass}`}>{text}</span>;
      },
    },
    {
      key: 'status',
      label: 'الحالة',
      sortable: true,
      render: (_: string, row: any) => {
        // Determine badge class based on status
        let badgeClass = 'badge-success';
        let statusText = 'نشط';
        
        if (row.status_key === 'pending') {
          badgeClass = 'badge-warning';
          statusText = 'في انتظار الموافقة';
        } else if (row.status_key === 'suspended') {
          badgeClass = 'badge-danger'; // Red color
          statusText = 'معلق';
        } else if (row.status_key === 'active') {
          badgeClass = 'badge-success';
          statusText = 'نشط';
        }
        
        return (
          <span className={`badge ${badgeClass}`}>
            {statusText}
          </span>
        );
      },
    },
  ];

  const handleManageAffiliation = (teacher: any) => {
    setSelectedTeacherForAffiliation(teacher);
    setAffiliationModalOpen(true);
  };

  const handleDelete = (teacher: any) => {
    setTeacherToDelete(teacher);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!teacherToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteTeacher(teacherToDelete.id);
      toast.success('تم حذف المدرس بنجاح');
      fetchTeachers(currentPage);
      setDeleteModalOpen(false);
      setTeacherToDelete(null);
    } catch (error) {
      toast.error('فشل حذف المدرس');
    } finally {
      setIsDeleting(false);
    }
  };

  const tableActions = [
    {
      label: 'موافقة',
      icon: 'fas fa-check',
      variant: 'success' as const,
      onClick: (row: any) => handleApprove(row),
      hidden: (row: any) => row.status_key !== 'pending',
    },
    {
      label: 'إدارة التبعيات',
      icon: 'fas fa-network-wired',
      variant: 'default' as const,
      onClick: (row: any) => handleManageAffiliation(row),
    },
    {
      label: 'إعدادات الباقة',
      icon: 'fas fa-box-open',
      variant: 'default' as const,
      onClick: (row: any) => openPlanModal(row),
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
          
          // Store admin session
          localStorage.setItem('adminToken', getAuthToken() || '');
          localStorage.setItem('adminUser', localStorage.getItem('user') || '');
          localStorage.setItem('adminUserType', localStorage.getItem('userType') || '');

          // Clear current session
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userType');
          
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
          toast.error('فشل الدخول لحساب المدرس');
        }
      },
    },
    {
      label: (row: any) => row.status_key === 'suspended' ? 'تنشيط' : 'تعليق',
      icon: (row: any) => row.status_key === 'suspended' ? 'fas fa-play' : 'fas fa-pause',
      variant: (row: any) => row.status_key === 'suspended' ? 'success' : 'warning',
      onClick: (row: any) => handleToggleStatus(row),
      hidden: (row: any) => row.status_key === 'pending',
    },
    {
      label: 'تعديل',
      icon: 'fas fa-edit',
      variant: 'default' as const,
      onClick: (row: any) => {
        setSelectedTeacher(row);
        setIsModalOpen(true);
      },
    },
    {
      label: 'حذف',
      icon: 'fas fa-trash-alt',
      variant: 'danger' as const,
      onClick: (row: any) => handleDelete(row),
    },

  ];




  const openPlanModal = (teacher: any) => {
    setSelectedTeacherForPlan(teacher);
    setIsPlanModalOpen(true);
  };

  return (
    <DashboardLayout
      role="admin"
      user={user || undefined}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">المدرسين</h1>
            <p className="text-gray-400">إدارة المدرسين وحساباتهم</p>
          </div>
          <button
            onClick={() => {
              setSelectedTeacher(null);
              setIsModalOpen(true);
            }}
            className="btn btn-primary"
          >
            <i className="fas fa-plus ml-2"></i>
            إضافة مدرس جديد
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="إجمالي المدرسين"
            value={totalItems}
            icon="fas fa-chalkboard-teacher"
            color="primary"
            variant="centered"
          />
          <StatCard
            title="في انتظار الموافقة"
            value={pendingTeachers}
            icon="fas fa-clock"
            color="warning"
            variant="centered"
          />
          <StatCard
            title="إجمالي الطلاب"
            value={totalStudents}
            icon="fas fa-users"
            color="success"
            variant="centered"
          />

        </div>

        <DashboardCard title="قائمة المدرسين" icon="fas fa-table">

          
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
              headerActions={
                <div className="flex flex-wrap gap-2">
                  <Filter
                    options={[
                      { value: 'all', label: 'الكل' },
                      { value: 'active', label: 'نشط' },
                      { value: 'suspended', label: 'معلق' },
                      { value: 'pending', label: 'ننتظر الموافقة' },
                    ]}
                    value={filters.status || 'all'}
                    onChange={(value) => handleFilterChange('status', value)}
                    className="w-full sm:w-[150px]"
                  />
                  <Filter
                    options={[
                      { value: 'all', label: 'كل الأنواع' },
                      { value: 'independent', label: 'مستقل' },
                      { value: 'academy', label: 'أكاديمية' },
                    ]}
                    value={filters.type || 'all'}
                    onChange={(value) => handleFilterChange('type', value)}
                    className="w-full sm:w-[150px]"
                  />
                  <Filter
                    options={[
                      { value: 'all', label: 'حالة الدفع' },
                      { value: 'paid', label: 'مدفوع' },
                      { value: 'partial', label: 'مدفوع جزئياً' },
                      { value: 'unpaid', label: 'غير مدفوع' },
                    ]}
                    value={filters.payment_status || 'all'}
                    onChange={(value) => handleFilterChange('payment_status', value)}
                    className="w-full sm:w-[180px]"
                  />
                </div>
              }
              pagination={false}
              itemsPerPage={itemsPerPage}
              isLoading={false}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={(page) => fetchTeachers(page)}
            />
          )}
        </DashboardCard>



        {/* Affiliation Modal */}
        <AffiliationModal
          isOpen={affiliationModalOpen}
          onClose={() => {
            setAffiliationModalOpen(false);
            setSelectedTeacherForAffiliation(null);
          }}
          teacher={selectedTeacherForAffiliation}
          onSuccess={() => fetchTeachers(currentPage)}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={deleteModalOpen}
          onCancel={() => {
            setDeleteModalOpen(false);
            setTeacherToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="حذف المدرس"
          message={`هل أنت متأكد من حذف المدرس "${teacherToDelete?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
          confirmText="حذف"
          cancelText="إلغاء"
          variant="danger"
          isProcessing={isDeleting}
        />

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
                  <label className="block text-gray-300 mb-1.5 text-sm">المادة</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                    placeholder="مثال: رياضيات، عربي، إنجليزي"
                  />
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
        {/* Suspend Modal */}
        <SuspendModal
          isOpen={suspendModalOpen}
          onClose={() => {
            setSuspendModalOpen(false);
            setTeacherToSuspend(null);
          }}
          teacher={teacherToSuspend}
          onSuccess={() => {
            fetchTeachers(currentPage);
            // Don't close immediately if we want to allow multiple toggles?
            // Usually modals close on success. But here we might want to keep it open?
            // The modal itself calls onSuccess. Let's keep it open or close it?
            // If I close it, they have to reopen to toggle another thing.
            // If I keep it open, I need to refresh the teacher data inside the modal.
            // For now, let's close it to be simple, or update the teacher object.
            // To update teacher object, I need to fetch it again or update local state.
            // Let's close it for now.
            setSuspendModalOpen(false);
            setTeacherToSuspend(null);
          }}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={deleteModalOpen}
          onCancel={() => {
            setDeleteModalOpen(false);
            setTeacherToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="حذف المدرس"
          message={`هل أنت متأكد من حذف المدرس "${teacherToDelete?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmText="حذف"
          cancelText="إلغاء"
          variant="danger"
          isProcessing={isDeleting}
        />
      </div>
      <SubscriptionPlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        teacher={selectedTeacherForPlan}
        onSuccess={() => fetchTeachers(currentPage)}
      />
    </DashboardLayout>
  );
}
