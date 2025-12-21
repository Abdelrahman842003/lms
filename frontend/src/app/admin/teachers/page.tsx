'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/AuthContext';
import { getTeachers, createTeacher, updateTeacher, toggleTeacherStatus, loginAsTeacher, getDashboardStats } from '@/services/authService';
import { toast } from 'react-hot-toast';

import { Avatar } from '@/components/ui';

export default function AdminTeachersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
        // Calculate revenue with fallback
        const calculatedRevenue = statsRes.total_revenue || (statsRes.students_count * (statsRes.price_per_student || 0));
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');

    if (formData.password !== formData.password_confirmation) {
      setError('كلمة المرور غير متطابقة');
      setSubmitLoading(false);
      return;
    }

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
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-300 mb-1.5 text-sm">رقم الهاتف</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                  required
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
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                  required={!editingTeacher}
                  minLength={6}
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-300 mb-1.5 text-sm">تأكيد كلمة المرور</label>
                <input
                  type="password"
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleInputChange}
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                  required={!editingTeacher}
                  minLength={6}
                />
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
