'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import * as academyService from '@/services/academyService';
import { Grade } from '@/services/gradeService';



export default function GradeDetailsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const gradeName = decodeURIComponent(params.gradeName as string);

  const [grades, setGrades] = useState<Grade[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch teachers for dropdown
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await academyService.getLectureTeachers();
        setTeachers(response.data.teachers || []);
      } catch (error) {
        console.error('Failed to fetch teachers:', error);
      }
    };
    fetchTeachers();
  }, []);

  // Fetch grades for this specific name
  const fetchGrades = async (page = 1) => {
    try {
      setIsLoading(true);
      // Pass the name as a filter to get detailed list
      const response = await academyService.getGrades(page, itemsPerPage, { name: gradeName });
      console.log('DEBUG GRADES:', response.data.data);
      setGrades(response.data.data);
      setTotalPages(response.data.meta.last_page);
      setTotalItems(response.data.meta.total);
      setCurrentPage(response.data.meta.current_page);
    } catch (error) {
      console.error('Failed to fetch grades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades(1);
  }, [gradeName]);

  // Stats
  const totalTeachers = grades.length;
  const totalGroups = grades.reduce((sum, grade) => sum + (grade.groups_count || 0), 0);
  const totalStudents = grades.reduce((sum, grade) => sum + (grade.students_count || 0), 0);
  const avgPrice = grades.length > 0 
    ? Math.round(grades.reduce((sum, grade) => sum + (grade.price || 0), 0) / grades.length) 
    : 0;

  const [searchQuery, setSearchQuery] = useState('');

  // Filter teachers based on search
  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddClick = () => {
    setSearchQuery('');
    setShowModal(true);
  };

  const handleAddTeacher = async (teacherId: string) => {
    if (!teacherId) {
      alert('خطأ: معرف المدرس غير موجود');
      console.error('Teacher ID is missing');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        name: gradeName,
        price: 0, // Default price
        teacher_id: teacherId
      };
      console.log('Adding teacher payload:', payload);

      await academyService.createGrade(payload);
      setShowModal(false);
      fetchGrades(currentPage);
    } catch (error) {
      console.error('Failed to add teacher:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (grade: Grade) => {
    setSelectedGrade(grade);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedGrade) return;

    setIsSubmitting(true);
    try {
      console.log('Deleting grade with ID:', selectedGrade.id);
      await academyService.deleteGrade(selectedGrade.id);
      setShowDeleteModal(false);
      fetchGrades(currentPage);
    } catch (error) {
      console.error('Failed to delete grade:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tableColumns = [
    {
      key: 'teacher',
      label: 'المدرس',
      sortable: true,
      className: 'font-bold',
      render: (_: any, row: Grade) => (
        <div className="flex items-center gap-3">
          {row.teacher?.avatar ? (
            <img src={row.teacher.avatar} alt={row.teacher.name} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-xs">
              <i className="fas fa-user"></i>
            </div>
          )}
          <span>{row.teacher?.name || (row.teacher_id ? 'جاري التحميل...' : 'عام (بدون مدرس)')}</span>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'سعر الاشتراك',
      sortable: true,
      render: (value: number) => `${value || 0} ج.م`,
    },
    {
      key: 'groups_count',
      label: 'عدد المجموعات',
      sortable: true,
      className: 'hidden sm:table-cell',
      render: (value: number) => value || 0,
    },
    {
      key: 'students_count',
      label: 'عدد الطلاب',
      sortable: true,
      className: 'hidden sm:table-cell',
      render: (value: number) => value || 0,
    },
    {
      key: 'created_at',
      label: 'تاريخ الإضافة',
      sortable: true,
      className: 'hidden md:table-cell',
      render: (value: string) => new Date(value).toLocaleDateString('ar-EG'),
    },
  ];

  const tableActions = [
    {
      label: 'حذف',
      icon: 'fas fa-trash',
      variant: 'danger' as const,
      onClick: (row: Grade) => handleDeleteClick(row),
    },
  ];

  return (
    <DashboardLayout
      role="academy"
      user={{
        name: user?.name || 'الأكاديمية',
        avatar: user?.avatar || '',
      }}
      headerActions={null}
    >
      <div className="mb-6 flex items-center gap-4">
        <button 
          onClick={() => router.back()} 
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
        >
          <i className="fas fa-arrow-right"></i>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">{gradeName}</h1>
          <p className="text-gray-400 text-sm">تفاصيل المدرسين والطلاب لهذا الصف</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 mb-8">
        <StatCard
          title="عدد المدرسين"
          value={totalTeachers}
          icon="fas fa-chalkboard-teacher"
          color="primary"
        />
        <StatCard
          title="إجمالي المجموعات"
          value={totalGroups}
          icon="fas fa-layer-group"
          color="success"
        />
        <StatCard
          title="إجمالي الطلاب"
          value={totalStudents}
          icon="fas fa-user-graduate"
          color="warning"
        />
        <StatCard
          title="متوسط السعر"
          value={`${avgPrice} ج.م`}
          icon="fas fa-tag"
          color="info"
        />
      </div>

      {/* Teachers Table */}
      <DashboardCard
        title={`مدرسين ${gradeName}`}
        icon="fas fa-chalkboard-teacher"
        action={
          <button onClick={handleAddClick} className="btn btn-primary">
            <i className="fas fa-plus"></i>
            <span>إضافة مدرس للصف</span>
          </button>
        }
      >
        <DataTable
          columns={tableColumns}
          data={grades}
          actions={tableActions}
          searchable={false}
          pagination={true}
          itemsPerPage={itemsPerPage}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={(page) => fetchGrades(page)}
        />
      </DashboardCard>

      {/* Add Teacher Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-[500px] bg-[#1e1e2d] rounded-xl shadow-2xl border border-white/10 animate-scaleIn flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white m-0">إضافة مدرس للصف</h3>
              <button 
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors" 
                onClick={() => setShowModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="p-4 border-b border-white/10">
              <div className="relative">
                <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="ابحث عن مدرس..."
                  className="w-full p-3 pr-10 bg-[#151521] border border-white/10 rounded-lg text-white focus:border-primary focus:ring-primary outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => (
                  <div key={teacher.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 overflow-hidden">
                        {teacher.avatar ? (
                          <img src={teacher.avatar} alt={teacher.name} className="w-full h-full object-cover" />
                        ) : (
                          <i className="fas fa-user"></i>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{teacher.name}</p>
                        <p className="text-gray-400 text-xs">{teacher.phone || 'لا يوجد رقم هاتف'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddTeacher(teacher.id)}
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary hover:text-white transition-all text-sm font-medium"
                    >
                      إضافة
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <i className="fas fa-search mb-2 text-2xl opacity-50 block"></i>
                  لا يوجد مدرسين بهذا الاسم
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedGrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}>
          <div className="w-full max-w-[500px] bg-[#1e1e2d] rounded-xl shadow-2xl border border-white/10 animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white m-0">تأكيد الحذف</h3>
              <button 
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors" 
                onClick={() => setShowDeleteModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-300 text-lg mb-2">
                هل أنت متأكد من حذف هذا السجل 
                {selectedGrade.teacher ? ` للمدرس "${selectedGrade.teacher.name}"` : ' (الصف العام)'}؟
              </p>
              <p className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                <i className="fas fa-exclamation-triangle ml-2"></i>
                سيتم حذف جميع المجموعات والبيانات المرتبطة بهذا السجل.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-black/20 rounded-b-xl">
              <button
                type="button"
                className="px-6 py-2.5 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-all duration-200 font-medium"
                onClick={() => setShowDeleteModal(false)}
                disabled={isSubmitting}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="px-6 py-2.5 rounded-lg bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all duration-200 font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                onClick={confirmDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'جاري الحذف...' : 'حذف'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
