'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import * as academyService from '@/services/academyService';
import { Button, Icon, Input, Badge, LoadingSpinner, FormModal, ConfirmationModal } from '@/components/ui';

interface CreateGradeData {
  name: string;
  price: number;
  teacher_id?: string;
}

// Interface for Grouped Grade from API
interface GroupedGrade {
  name: string;
  price: number;
  teachers_count: number;
  groups_count: number;
  students_count: number;
  created_at: string;
}

export default function AcademyGradesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [grades, setGrades] = useState<GroupedGrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form Data for Create
  const [formData, setFormData] = useState<CreateGradeData>({
    name: '',
    price: 0,
  });
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    price?: string;
  }>({});
  const [touched, setTouched] = useState<{
    name: boolean;
    price: boolean;
  }>({
    name: false,
    price: false,
  });

  // Real-time validation
  const validateField = (name: string, value: string | number): string | undefined => {
    if (name === 'name') {
      const strVal = String(value);
      if (!strVal.trim()) return 'اسم الصف مطلوب';
      if (strVal.length < 2) return `الاسم قصير (${strVal.length}/2 أحرف)`;
    }
    
    if (name === 'price') {
      const numVal = Number(value);
      if (isNaN(numVal) || numVal < 0) return 'السعر يجب أن يكون رقماً موجباً';
    }
    
    return undefined;
  };

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};
    
    const nameError = validateField('name', formData.name);
    const priceError = validateField('price', formData.price);
    
    if (nameError) errors.name = nameError;
    if (priceError) errors.price = priceError;
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (name: string, value: string | number) => {
    setFormData({ ...formData, [name]: value });
    const error = validateField(name, value);
    setValidationErrors(prev => ({ ...prev, [name]: error }));
    if (String(value).length > 0) {
      setTouched(prev => ({ ...prev, [name]: true }));
    }
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const value = formData[name as keyof typeof formData];
    // Ensure value is string or number for validation
    const valToValidate = value === undefined ? '' : value;
    const error = validateField(name, valToValidate);
    setValidationErrors(prev => ({ ...prev, [name]: error }));
  };

  // Stats
  const totalGrades = totalItems; // This is now unique grade names count
  const totalGroups = grades.reduce((sum, grade) => sum + (grade.groups_count || 0), 0);
  const totalStudents = grades.reduce((sum, grade) => sum + (grade.students_count || 0), 0);
  const avgStudentsPerGrade = totalGrades > 0 ? Math.round(totalStudents / totalGrades) : 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGrades(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchGrades = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await academyService.getGrades(page, itemsPerPage, searchQuery);
      // The API now returns grouped grades
      setGrades(response.data.data);
      setTotalPages(response.data.meta.last_page);
      setTotalItems(response.data.meta.total);
      setCurrentPage(response.data.meta.current_page);
    } catch (error) {
      // Error handled silently
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClick = () => {
    setFormData({ name: '', price: 0 });
    setShowModal(true);
  };

  const handleViewClick = (grade: GroupedGrade) => {
    // Navigate to details page
    router.push(`/academy/grades/${encodeURIComponent(grade.name)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, price: true });
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      await academyService.createGrade(formData);
      
      // Show success message
      if (typeof window !== 'undefined') {
        const toast = await import('react-hot-toast');
        toast.default.success('تم إضافة الصف الدراسي بنجاح');
      }
      
      setShowModal(false);
      setTouched({ name: false, price: false });
      setValidationErrors({});
      setFormData({ name: '', price: 0 });
      
      // Refresh from page 1 to see the new grade
      fetchGrades(1);
    } catch (error: any) {
      // Show error message
      if (typeof window !== 'undefined') {
        const toast = await import('react-hot-toast');
        const errorMessage = error.response?.data?.message || 'فشل إضافة الصف الدراسي';
        toast.default.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGradeName, setSelectedGradeName] = useState('');
  const [newName, setNewName] = useState('');

  const handleEditClick = (grade: GroupedGrade) => {
    setSelectedGradeName(grade.name);
    setNewName(grade.name);
    setShowRenameModal(true);
  };

  const handleDeleteClick = (grade: GroupedGrade) => {
    setSelectedGradeName(grade.name);
    setShowDeleteModal(true);
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    setIsSubmitting(true);
    try {
      await academyService.updateGradeName(selectedGradeName, newName);
      setShowRenameModal(false);
      fetchGrades(currentPage);
    } catch (error) {
      // Error handled silently
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedGradeName) return;

    setIsSubmitting(true);
    try {
      await academyService.deleteGradeByName(selectedGradeName);
      setShowDeleteModal(false);
      fetchGrades(currentPage);
    } catch (error) {
      // Error handled silently
    } finally {
      setIsSubmitting(false);
    }
  };

  const tableColumns = [
    {
      key: 'name',
      label: 'الصف الدراسي',
      sortable: true,
      className: 'font-bold',
    },
    {
      key: 'created_at',
      label: 'تاريخ الإنشاء',
      sortable: true,
      className: 'hidden xl:table-cell',
      render: (value: string) => new Date(value).toLocaleDateString('ar-EG'),
    },
  ];

  const tableActions = [
    {
      label: 'عرض التفاصيل',
      icon: 'eye',
      onClick: (row: GroupedGrade) => handleViewClick(row),
    },
    {
      label: 'تعديل الاسم',
      icon: 'edit',
      onClick: (row: GroupedGrade) => handleEditClick(row),
    },
    {
      label: 'حذف الصف',
      icon: 'trash',
      variant: 'danger' as const,
      onClick: (row: GroupedGrade) => handleDeleteClick(row),
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
      {/* Stats Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-8">
        <StatCard
          title="إجمالي الصفوف"
          value={totalGrades}
          icon="graduation-cap"
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
        <StatCard
          title="متوسط الطلاب لكل صف"
          value={avgStudentsPerGrade}
          icon="chart-bar"
          color="danger"
        />
      </div>

      {/* Grades Table */}
      <DashboardCard
        title="جميع الصفوف"
        icon="graduation-cap"
        action={
          <Button variant="primary" onClick={handleAddClick}>
            <Icon name="plus" />
            <span>صف جديد</span>
          </Button>
        }
      >
        <DataTable
          columns={tableColumns}
          data={grades}
          actions={tableActions}
          searchable={true}
          onSearch={setSearchQuery}
          pagination={true}
          itemsPerPage={itemsPerPage}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={(page) => fetchGrades(page)}
        />
      </DashboardCard>

      {/* Add Modal */}
      <FormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        title="صف دراسي جديد"
        isLoading={isSubmitting}
        submitText={isSubmitting ? 'جاري الحفظ...' : 'إضافة'}
        cancelText="إلغاء"
        maxWidth="500px"
      >
        <Input
          id="name"
          type="text"
          label="اسم الصف الدراسي"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          required
          placeholder="مثال: الصف الأول الثانوي"
          error={touched.name && validationErrors.name ? validationErrors.name : undefined}
        />
        {/* Price field removed as per user request - defaults to 0 */}
      </FormModal>

      {/* Rename Modal */}
      <FormModal
        isOpen={showRenameModal}
        onClose={() => setShowRenameModal(false)}
        onSubmit={handleRenameSubmit}
        title="تعديل اسم الصف"
        isLoading={isSubmitting}
        submitText={isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
        cancelText="إلغاء"
        maxWidth="500px"
      >
        <p className="text-gray-400 text-sm mb-4">سيتم تغيير اسم الصف لجميع المدرسين المرتبطين به.</p>
        <Input
          id="newName"
          type="text"
          label="الاسم الجديد"
          value={newName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
          required
        />
      </FormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal && !!selectedGradeName}
        title="تأكيد الحذف"
        message={
          <>
            <p className="text-gray-300 text-lg mb-2">هل أنت متأكد من حذف الصف "{selectedGradeName}"؟</p>
            <p className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
              <Icon name="exclamation-triangle" className="ml-2 inline" />
              سيتم حذف هذا الصف من جميع المدرسين، وحذف جميع المجموعات والطلاب المرتبطين به.
            </p>
          </>
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
