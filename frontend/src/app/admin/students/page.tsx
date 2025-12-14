'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { withAdminAuth } from '@/components/auth/withAdminAuth';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { getStudents, updateStudent } from '@/services/authService';

// ... existing imports

function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    username: '',
    password: '',
    password_confirmation: ''
  });
  
  // Filter State
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Click outside for filter
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

  // Filter effect
  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => {
      fetchStudents(1);
      setIsFiltering(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters, searchQuery]);

  const fetchStudents = async (page = 1) => {
    try {
      setIsLoading(true);
      const activeFilters = {
        search: searchQuery,
        status: filters.status !== 'all' ? filters.status : undefined,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined
      };
      const response = await getStudents(page, itemsPerPage, activeFilters);
      setStudents(response.data);
      setTotalPages(response.meta.last_page);
      setTotalItems(response.meta.total);
      setCurrentPage(response.meta.current_page);
    } catch (error) {
      console.error('Failed to fetch students', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleEditClick = (student: any) => {
    setSelectedStudent(student);
    setEditFormData({
      name: student.name,
      username: student.username,
      password: '',
      password_confirmation: ''
    });
    setIsEditModalOpen(true);
    setIsDetailsModalOpen(false); // Close details if open
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      setIsLoading(true);
      await updateStudent(selectedStudent.id, editFormData);
      setIsEditModalOpen(false);
      fetchStudents(currentPage); // Refresh data
      alert('تم تحديث بيانات الطالب بنجاح');
    } catch (error: any) {
      console.error('Failed to update student', error);
      alert(error.message || 'فشل تحديث البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    {
      key: 'id',
      label: '#',
      render: (_: any, __: any, index: number) => {
        return (currentPage - 1) * itemsPerPage + index + 1;
      }
    },
    { key: 'name', label: 'الاسم', sortable: true },
    { key: 'username', label: 'اسم المستخدم', sortable: true },
    { 
      key: 'teacher', 
      label: 'المدرس', 
      sortable: true,
      render: (teacher: any) => teacher?.name || '-'
    },
    { 
      key: 'status', 
      label: 'الحالة', 
      sortable: true,
      render: () => (
        <span className="badge badge-success">
          نشط
        </span>
      )
    },
    { key: 'joined', label: 'تاريخ الانضمام', sortable: true },
  ];

  const actions = [
    {
      label: 'عرض التفاصيل',
      icon: 'fas fa-eye',
      onClick: (row: any) => {
        setSelectedStudent(row);
        setIsDetailsModalOpen(true);
      },
    },
    {
      label: 'تعديل',
      icon: 'fas fa-edit',
      onClick: (row: any) => handleEditClick(row),
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
          title="إجمالي الطلاب"
          value={totalItems}
          icon="fas fa-user-graduate"
          color="primary"
          variant="centered"
        />

        <StatCard
          title="طلاب نشطين"
          value={totalItems}
          icon="fas fa-user-check"
          color="success"
          variant="centered"
        />

        <StatCard
          title="حسابات معلقة"
          value={0}
          icon="fas fa-user-slash"
          color="danger"
          variant="centered"
        />

        <StatCard
          title="انضموا هذا الشهر"
          value={0}
          icon="fas fa-user-plus"
          color="warning"
          variant="centered"
        />
      </div>

      <DashboardCard
        title="قائمة الطلاب"
        icon="fas fa-user-graduate"
        action={
          <div className="flex gap-3 flex-wrap">
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <i className="fas fa-plus"></i>
              <span>إضافة طالب جديد</span>
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
                      <option value="active" className="bg-[#1a1f37]">نشط</option>
                      <option value="suspended" className="bg-[#1a1f37]">معلق</option>
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
        }
      >
        <DataTable
          columns={columns}
          data={students}
          actions={actions}
          searchable={true}
          onSearch={setSearchQuery}
          pagination={true}
          itemsPerPage={itemsPerPage}
          isLoading={isLoading || isFiltering}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={(page) => fetchStudents(page)}
        />
      </DashboardCard>

      {/* Add Student Modal Placeholder */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <div className="bg-[#1a1f37] p-8 rounded-2xl w-full max-w-[500px] border border-white/10">
            <h2 className="text-white mb-6 text-2xl">إضافة طالب جديد</h2>
            <p className="text-gray-light mb-6">نموذج إضافة طالب (قيد التطوير)</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setIsModalOpen(false)}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsModalOpen(false)}
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {isDetailsModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <div className="bg-[#1a1f37] p-8 rounded-2xl w-full max-w-[600px] border border-white/10 relative">
            <button 
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute top-5 left-5 bg-transparent border-none text-gray-light text-xl cursor-pointer hover:text-white transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>

            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 text-2xl text-white font-bold">
                {selectedStudent.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-white mb-2 text-2xl">{selectedStudent.name}</h2>
              <p className="text-gray-light">تاريخ الانضمام: {selectedStudent.joined}</p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-white/5 p-5 rounded-xl text-center">
                <i className="fas fa-chalkboard-teacher text-2xl text-primary mb-3"></i>
                <h3 className="text-white text-xl mb-1">{selectedStudent.teacher?.name || '-'}</h3>
                <p className="text-gray-light text-[0.9rem] m-0">المدرس</p>
              </div>
              <div className="bg-white/5 p-5 rounded-xl text-center">
                <i className="fas fa-id-card text-2xl text-warning mb-3"></i>
                <h3 className="text-white text-[1.1rem] mb-1 break-all">{selectedStudent.username}</h3>
                <p className="text-gray-light text-[0.9rem] m-0">اسم المستخدم</p>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button className="btn btn-primary" onClick={() => handleEditClick(selectedStudent)}>
                <i className="fas fa-edit"></i>
                <span>تعديل البيانات</span>
              </button>
              <button className="btn btn-outline" onClick={() => console.log('Login as', selectedStudent)}>
                <i className="fas fa-sign-in-alt"></i>
                <span>الدخول للوحة التحكم</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {isEditModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <div className="bg-[#1a1f37] p-8 rounded-2xl w-full max-w-[500px] border border-white/10">
            <h2 className="text-white mb-6 text-2xl">تعديل بيانات الطالب</h2>
            <form onSubmit={handleUpdateStudent}>
              <div className="mb-4">
                <label className="block text-gray-light mb-2">الاسم</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-light mb-2">اسم المستخدم</label>
                <input
                  type="text"
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-light mb-2">كلمة المرور (اختياري)</label>
                <input
                  type="password"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="اتركه فارغاً إذا لم ترد التغيير"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-light mb-2">تأكيد كلمة المرور</label>
                <input
                  type="password"
                  value={editFormData.password_confirmation}
                  onChange={(e) => setEditFormData({...editFormData, password_confirmation: e.target.value})}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default withAdminAuth(StudentsPage);
