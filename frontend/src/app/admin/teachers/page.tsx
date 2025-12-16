'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/AuthContext';
import { getTeachers, createTeacher } from '@/services/authService';

import { Avatar } from '@/components/ui';

export default function AdminTeachersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
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
      const response = await getTeachers(page, itemsPerPage, activeFilters);
      setTeachers(response.data);
      setTotalPages(response.meta.last_page);
      setTotalItems(response.meta.total);
      setCurrentPage(response.meta.current_page);
    } catch (error) {
      console.error('Failed to fetch teachers', error);
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
      await createTeacher(formData);
      await fetchTeachers();
      setIsModalOpen(false);
      setFormData({ name: '', password: '', password_confirmation: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل إضافة المدرس');
    } finally {
      setSubmitLoading(false);
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
      render: (value: string) => (
        <span className={value === 'نشط' ? 'badge badge-success' : 'badge badge-danger'}>
          {value}
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
      onClick: (row: any) => console.log('Login as', row),
    },
    {
      label: 'تعديل البيانات',
      icon: 'fas fa-edit',
      onClick: (row: any) => console.log('Edit', row),
    },
    {
      label: 'تعليق الحساب',
      icon: 'fas fa-ban',
      variant: 'danger' as const,
      onClick: (row: any) => console.log('Suspend', row),
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
          value={0}
          icon="fas fa-users"
          color="warning"
          variant="centered"
        />

        <StatCard
          title="إجمالي الإيرادات"
          value={0}
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
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <i className="fas fa-plus"></i>
              <span>إضافة مدرس جديد</span>
            </button>
            <button className="btn btn-sm btn-outline">
              <i className="fas fa-download"></i>
              <span>تصدير Excel</span>
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

      {/* Add Teacher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-[#1a1f37] p-5 rounded-2xl w-full max-w-md border border-white/10">
            <h2 className="text-white mb-4 text-xl font-bold">إضافة مدرس جديد</h2>
            
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
                <label className="block text-gray-300 mb-1.5 text-sm">كلمة المرور</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                  required
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
                  required
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
                  {submitLoading ? 'جاري الإضافة...' : 'إضافة المدرس'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
