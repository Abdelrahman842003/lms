'use client';


import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { getGrades, createGrade, updateGrade, deleteGrade, Grade, CreateGradeData } from '@/services/gradeService';

export default function GradesPage() {
  const { user } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    const error = validateField(name, value);
    setValidationErrors(prev => ({ ...prev, [name]: error }));
  };

  // Stats
  const totalGrades = totalItems;
  const totalGroups = grades.reduce((sum, grade) => sum + grade.groups_count, 0);
  const totalStudents = grades.reduce((sum, grade) => sum + grade.students_count, 0);
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
      const response = await getGrades(page, itemsPerPage, { search: searchQuery });
      setGrades(response.data);
      setTotalPages(response.meta.last_page);
      setTotalItems(response.meta.total);
      setCurrentPage(response.meta.current_page);
    } catch (error) {
      console.error('Failed to fetch grades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClick = () => {
    setIsEditing(false);
    setFormData({ name: '', price: 0 });
    setShowModal(true);
  };

  const handleEditClick = (grade: Grade) => {
    setIsEditing(true);
    setSelectedGrade(grade);
    setFormData({
      name: grade.name,
      price: grade.price || 0,
    });
    setShowModal(true);
  };

  const handleDeleteClick = (grade: Grade) => {
    setSelectedGrade(grade);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, price: true });
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      if (isEditing && selectedGrade) {
        await updateGrade(selectedGrade.id, formData);
      } else {
        await createGrade(formData);
      }
      setShowModal(false);
      setTouched({ name: false, price: false });
      setValidationErrors({});
      fetchGrades(currentPage);
    } catch (error) {
      console.error('Failed to save grade:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedGrade) return;

    setIsSubmitting(true);
    try {
      await deleteGrade(selectedGrade.id);
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
    },
    {
      key: 'price',
      label: 'سعر الاشتراك',
      sortable: true,
      render: (value: number) => `${value} ج.م`,
    },
    {
      key: 'groups_count',
      label: 'عدد المجموعات',
      sortable: true,
    },
    {
      key: 'students_count',
      label: 'عدد الطلاب',
      sortable: true,
    },
    {
      key: 'created_at',
      label: 'تاريخ الإنشاء',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('ar-EG'),
    },
  ];

  const tableActions = [
    {
      label: 'تعديل',
      icon: 'fas fa-edit',
      onClick: (row: Grade) => handleEditClick(row),
    },
    {
      label: 'حذف',
      icon: 'fas fa-trash',
      variant: 'danger' as const,
      onClick: (row: Grade) => handleDeleteClick(row),
    },
  ];

  return (
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={{
        name: user?.name || 'المدرس',
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-[500px] bg-[#1e1e2d] rounded-xl shadow-2xl border border-white/10 animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white m-0">{isEditing ? 'تعديل الصف الدراسي' : 'صف دراسي جديد'}</h3>
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
                <div className="space-y-2">
                  <label htmlFor="price" className="block text-sm font-medium text-gray-300">سعر الاشتراك الشهري</label>
                  <input
                    type="number"
                    id="price"
                    className={`w-full p-3 bg-[#151521] border rounded-lg text-white focus:ring-1 outline-none transition-all ${
                      touched.price && validationErrors.price 
                        ? 'border-danger focus:border-danger focus:ring-danger' 
                        : 'border-white/10 focus:border-primary focus:ring-primary'
                    }`}
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', Number(e.target.value))}
                    onBlur={() => handleBlur('price')}
                    min="0"
                    required
                    placeholder="0"
                  />
                  {touched.price && validationErrors.price && (
                    <p className="text-danger text-xs mt-1 flex items-center gap-1">
                      <i className="fas fa-exclamation-circle"></i>
                      {validationErrors.price}
                    </p>
                  )}
                </div>
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
                  {isSubmitting ? 'جاري الحفظ...' : isEditing ? 'حفظ التعديلات' : 'إضافة'}
                </button>
              </div>
            </form>
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
              <p className="text-gray-300 text-lg mb-2">هل أنت متأكد من حذف الصف "{selectedGrade.name}"؟</p>
              <p className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                <i className="fas fa-exclamation-triangle ml-2"></i>
                سيتم حذف جميع المجموعات والبيانات المرتبطة بهذا الصف.
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
