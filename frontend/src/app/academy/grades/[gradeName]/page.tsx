'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import * as academyService from '@/services/academyService';
import { Grade } from '@/services/gradeService';
import { Button, Icon, Input, Badge, LoadingSpinner, FormModal, ConfirmationModal } from '@/components/ui';



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

  // Filter out grades without teachers (General/System grades)
  const visibleGrades = grades.filter(grade => grade.teacher_id);

  // Stats
  const totalTeachers = visibleGrades.length;
  const totalGroups = visibleGrades.reduce((sum, grade) => sum + (grade.groups_count || 0), 0);
  const totalStudents = visibleGrades.reduce((sum, grade) => sum + (grade.students_count || 0), 0);

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
              <Icon name="user" />
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

  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', price: 0 });

  const handleEditClick = (grade: Grade) => {
    setSelectedGrade(grade);
    setEditFormData({
      name: grade.name,
      price: grade.price || 0
    });
    setShowEditModal(true);
  };

  const handleUpdateGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrade) return;

    setIsSubmitting(true);
    try {
      await academyService.updateGrade(selectedGrade.id, editFormData);
      
      // Show success message
      if (typeof window !== 'undefined') {
        const toast = await import('react-hot-toast');
        toast.default.success('تم تحديث بيانات الصف بنجاح');
      }

      setShowEditModal(false);
      fetchGrades(currentPage);
      
      // If name changed, we might need to redirect or refresh parent
      if (editFormData.name !== gradeName) {
        router.push(`/academy/grades/${encodeURIComponent(editFormData.name)}`);
      }
    } catch (error: any) {
      console.error('Failed to update grade:', error);
      if (typeof window !== 'undefined') {
        const toast = await import('react-hot-toast');
        toast.default.error(error.response?.data?.message || 'فشل تحديث بيانات الصف');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const tableActions = [
    {
      label: 'تعديل',
      icon: 'edit',
      variant: 'default' as const,
      onClick: (row: Grade) => handleEditClick(row),
    },
    {
      label: 'حذف',
      icon: 'trash',
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
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors p-0"
        >
          <Icon name="arrow-right" />
        </Button>
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
          icon="chalkboard-teacher"
          color="primary"
        />
        <StatCard
          title="إجمالي المجموعات"
          value={totalGroups}
          icon="layer-group"
          color="success"
        />
        <StatCard
          title="إجمالي الطلاب"
          value={totalStudents}
          icon="user-graduate"
          color="warning"
        />
      </div>

      {/* Teachers Table */}
      <DashboardCard
        title={`مدرسين ${gradeName}`}
        icon="chalkboard-teacher"
        action={
          <Button variant="primary" onClick={handleAddClick}>
            <Icon name="plus" />
            <span>إضافة مدرس للصف</span>
          </Button>
        }
      >
        <DataTable
          columns={tableColumns}
          data={visibleGrades}
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

      {/* Edit Grade Modal */}
      <FormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdateGrade}
        title="تعديل بيانات الصف"
        isLoading={isSubmitting}
        submitText={isSubmitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        cancelText="إلغاء"
        maxWidth="500px"
      >
        <Input
          label="اسم الصف"
          value={editFormData.name}
          disabled
          className="!bg-[#151521]/50 !border-white/5 !text-gray-400 !cursor-not-allowed"
        />
        <Input
          type="number"
          label="سعر الاشتراك"
          value={editFormData.price}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditFormData({...editFormData, price: Number(e.target.value)})}
          min="0"
          required
        />
      </FormModal>

      {/* Add Teacher Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-[500px] bg-[#1e1e2d] rounded-xl shadow-2xl border border-white/10 animate-scaleIn flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white m-0">إضافة مدرس للصف</h3>
              <Button
                variant="ghost"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors p-0"
                onClick={() => setShowModal(false)}
              >
                <Icon name="times" />
              </Button>
            </div>
            
            <div className="p-4 border-b border-white/10">
              <Input
                placeholder="ابحث عن مدرس..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              />
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
                          <Icon name="user" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{teacher.name}</p>
                        <p className="text-gray-400 text-xs">{teacher.phone || 'لا يوجد رقم هاتف'}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleAddTeacher(teacher.id)}
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary hover:text-white transition-all text-sm font-medium"
                    >
                      إضافة
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Icon name="search" className="mb-2 text-2xl opacity-50 block" />
                  لا يوجد مدرسين بهذا الاسم
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal && !!selectedGrade}
        title="تأكيد الحذف"
        message={
          <div>
            <p className="text-gray-300 text-lg mb-2">
              هل أنت متأكد من حذف هذا السجل
              {selectedGrade?.teacher ? ` للمدرس "${selectedGrade.teacher.name}"` : ' (الصف العام)'}؟
            </p>
            <p className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
              <Icon name="exclamation-triangle" className="ml-2 inline" />
              سيتم حذف جميع المجموعات والبيانات المرتبطة بهذا السجل.
            </p>
          </div>
        }
        confirmText={isSubmitting ? 'جاري الحذف...' : 'حذف'}
        cancelText="إلغاء"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        isProcessing={isSubmitting}
        variant="danger"
      />
    </DashboardLayout>
  );
}
