'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import * as academyService from '@/services/academyService';

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
      console.error('Failed to fetch grades:', error);
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
      const response = await academyService.createGrade(formData);
      console.log('Grade created successfully:', response);
      
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
      console.error('Failed to save grade:', error);
      console.error('Error response:', error.response?.data);
      
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
      console.error('Failed to rename grade:', error);
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
      console.error('Failed to delete grade:', error);
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
      icon: 'fas fa-eye',
      onClick: (row: GroupedGrade) => handleViewClick(row),
    },
    {
      label: 'تعديل الاسم',
      icon: 'fas fa-edit',
      onClick: (row: GroupedGrade) => handleEditClick(row),
    },
    {
      label: 'حذف الصف',
      icon: 'fas fa-trash',
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
          icon="fas fa-graduation-cap"
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
          title="متوسط الطلاب لكل صف"
          value={avgStudentsPerGrade}
          icon="fas fa-chart-bar"
          color="danger"
        />
      </div>

      {/* Grades Table */}
      <DashboardCard
        title="جميع الصفوف"
        icon="fas fa-graduation-cap"
        action={
          <button onClick={handleAddClick} className="btn btn-primary">
            <i className="fas fa-plus"></i>
            <span>صف جديد</span>
          </button>
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
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-[500px] bg-[#1e1e2d] rounded-xl shadow-2xl border border-white/10 animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white m-0">صف دراسي جديد</h3>
              <button 
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors" 
                onClick={() => setShowModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300">اسم الصف الدراسي</label>
                  <input
                    type="text"
                    id="name"
                    className={`w-full p-3 bg-[#151521] border rounded-lg text-white focus:ring-1 outline-none transition-all ${
                      touched.name && validationErrors.name 
                        ? 'border-danger focus:border-danger focus:ring-danger' 
                        : 'border-white/10 focus:border-primary focus:ring-primary'
                    }`}
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    onBlur={() => handleBlur('name')}
                    required
                    placeholder="مثال: الصف الأول الثانوي"
                  />
                  {touched.name && validationErrors.name && (
                    <p className="text-danger text-xs mt-1 flex items-center gap-1">
                      <i className="fas fa-exclamation-circle"></i>
                      {validationErrors.name}
                    </p>
                  )}
                </div>
                {/* Price field removed as per user request - defaults to 0 */}
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-black/20 rounded-b-xl">
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-all duration-200 font-medium"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all duration-200 font-medium disabled:opacity-70 disabled:cursor-not-allowed" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowRenameModal(false)}>
          <div className="w-full max-w-[500px] bg-[#1e1e2d] rounded-xl shadow-2xl border border-white/10 animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white m-0">تعديل اسم الصف</h3>
              <button 
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors" 
                onClick={() => setShowRenameModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleRenameSubmit}>
              <div className="p-6 space-y-4">
                <p className="text-gray-400 text-sm">سيتم تغيير اسم الصف لجميع المدرسين المرتبطين به.</p>
                <div className="space-y-2">
                  <label htmlFor="newName" className="block text-sm font-medium text-gray-300">الاسم الجديد</label>
                  <input
                    type="text"
                    id="newName"
                    className="w-full p-3 bg-[#151521] border border-white/10 rounded-lg text-white focus:border-primary focus:ring-primary outline-none transition-all"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-black/20 rounded-b-xl">
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-all duration-200 font-medium"
                  onClick={() => setShowRenameModal(false)}
                  disabled={isSubmitting}
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all duration-200 font-medium disabled:opacity-70 disabled:cursor-not-allowed" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedGradeName && (
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
              <p className="text-gray-300 text-lg mb-2">هل أنت متأكد من حذف الصف "{selectedGradeName}"؟</p>
              <p className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                <i className="fas fa-exclamation-triangle ml-2"></i>
                سيتم حذف هذا الصف من جميع المدرسين، وحذف جميع المجموعات والطلاب المرتبطين به.
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
