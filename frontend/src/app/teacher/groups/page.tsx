'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { Button, LoadingSpinner, Icon, Input } from '@/components/ui';
import { Select } from '@/components/ui/Select';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import FormModal from '@/components/ui/FormModal';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { getGroups, createGroup, updateGroup, deleteGroup, Group, CreateGroupData } from '@/services/groupService';
import { getGrades, Grade as GradeType } from '@/services/gradeService';
import toast from 'react-hot-toast';

export default function GroupsPage() {
  const router = useRouter();
  const { user, selectedAcademy, isLoading: authLoading } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [grades, setGrades] = useState<GradeType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateGroupData>({
    name: '',
    grade_id: null,
    time: '',
    days: '',
    type: 'general',
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
      if (!strVal.trim()) return 'اسم المجموعة مطلوب';
      if (strVal.length < 2) return `الاسم قصير (${strVal.length}/2 أحرف)`;
    }
    
    if (name === 'price' && formData.type === 'private') {
      const numVal = Number(value);
      if (isNaN(numVal) || numVal < 0) return 'السعر يجب أن يكون رقماً موجباً';
    }
    
    return undefined;
  };

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};
    
    const nameError = validateField('name', formData.name);
    const priceError = formData.type === 'private' && formData.price !== undefined 
      ? validateField('price', formData.price) 
      : undefined;
    
    if (nameError) errors.name = nameError;
    if (priceError) errors.price = priceError;
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (name: string, value: string | number | null) => {
    setFormData({ ...formData, [name]: value });
    if (typeof value === 'string' || typeof value === 'number') {
      const error = validateField(name, value);
      setValidationErrors(prev => ({ ...prev, [name]: error }));
      if (String(value).length > 0) {
        setTouched(prev => ({ ...prev, [name]: true }));
      }
    }
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const value = formData[name as keyof typeof formData];
    if (typeof value === 'string' || typeof value === 'number') {
      const error = validateField(name, value);
      setValidationErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // Stats
  const totalGroups = totalItems;
  const totalStudents = groups.reduce((sum, group) => sum + group.students_count, 0);
  const activeGroups = groups.filter(g => g.students_count > 0).length;
  const avgStudentsPerGroup = totalGroups > 0 ? Math.round(totalStudents / totalGroups) : 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGroups(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    // Fetch grades when auth is ready, regardless of academy mode
    if (!authLoading) {
      fetchGrades();
    }
  }, [selectedAcademy?.id, authLoading]);

  const fetchGroups = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await getGroups(page, itemsPerPage, { search: searchQuery });
      setGroups(response.data);
      setTotalPages(response.meta.last_page);
      setTotalItems(response.meta.total);
      setCurrentPage(response.meta.current_page);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await getGrades();
      setGrades(response.data);
    } catch (error) {
      console.error('Failed to fetch grades:', error);
    }
  };

  const handleAddClick = () => {
    setIsEditing(false);
    setFormData({ name: '', grade_id: null, time: '', days: '', type: 'general', price: 0 });
    setShowModal(true);
  };

  const handleEditClick = (group: Group) => {
    setIsEditing(true);
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      grade_id: group.grade_id,
      time: group.time || '',
      days: group.days || '',
      type: group.type || 'general',
      price: group.price || 0,
    });
    setShowModal(true);
  };

  const handleDeleteClick = (group: Group) => {
    setSelectedGroup(group);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit called', formData);
    setTouched({ name: true, price: true });
    
    if (!validateForm()) {
      console.log('Validation failed', validationErrors);
      return;
    }
    
    setIsSubmitting(true);

    try {
      if (isEditing && selectedGroup) {
        await updateGroup(selectedGroup.id, formData);
        toast.success('تم تحديث المجموعة بنجاح');
      } else {
        console.log('Creating group with data:', formData);
        await createGroup(formData);
        toast.success('تم إضافة المجموعة بنجاح');
      }
      setShowModal(false);
      setTouched({ name: false, price: false });
      setValidationErrors({});
      fetchGroups(currentPage);
    } catch (error: any) {
      console.error('Failed to save group:', error);
      toast.error(error.message || 'فشل حفظ المجموعة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedGroup) return;

    setIsSubmitting(true);
    try {
      await deleteGroup(selectedGroup.id);
      setShowDeleteModal(false);
      fetchGroups(currentPage);
    } catch (error) {
      console.error('Failed to delete group:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tableColumns = [
    {
      key: 'name',
      label: 'اسم المجموعة',
      sortable: true,
    },
    {
      key: 'grade_name',
      label: 'الصف الدراسي',
      sortable: true,
      render: (value: string | null) => value || '-',
    },
    {
      key: 'type',
      label: 'النوع',
      sortable: true,
      render: (value: string) => value === 'private' ? 'خاصة' : 'عامة',
    },
    {
      key: 'price',
      label: 'السعر',
      sortable: true,
      render: (value: number | null, row: Group) => row.type === 'private' ? `${value} ج.م` : '-',
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
      label: 'عرض التفاصيل',
      icon: 'fas fa-eye',
      onClick: (row: Group) => router.push(`/teacher/groups/${row.id}`),
    },
    {
      label: 'تعديل',
      icon: 'fas fa-edit',
      onClick: (row: Group) => handleEditClick(row),
    },
    {
      label: 'حذف',
      icon: 'fas fa-trash',
      variant: 'danger' as const,
      onClick: (row: Group) => handleDeleteClick(row),
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
          title="إجمالي المجموعات"
          value={totalGroups}
          icon="fas fa-layer-group"
          color="primary"
        />
        <StatCard
          title="إجمالي الطلاب"
          value={totalStudents}
          icon="fas fa-user-graduate"
          color="success"
        />
        <StatCard
          title="المجموعات النشطة"
          value={activeGroups}
          icon="fas fa-check-circle"
          color="warning"
        />
        <StatCard
          title="متوسط الطلاب لكل مجموعة"
          value={avgStudentsPerGroup}
          icon="fas fa-chart-line"
          color="danger"
        />
      </div>

      {/* Groups Table */}
      <DashboardCard
        title="جميع المجموعات"
        icon="fas fa-layer-group"
        action={
          <Button onClick={handleAddClick}>
            <Icon name="plus" className="ml-2" />
            <span>إضافة مجموعة</span>
          </Button>
        }
      >
        <DataTable
          columns={tableColumns}
          data={groups}
          actions={tableActions}
          searchable={true}
          onSearch={setSearchQuery}
          pagination={true}
          itemsPerPage={itemsPerPage}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={(page) => fetchGroups(page)}
        />
      </DashboardCard>

      {/* Add/Edit Modal */}
      <FormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={isEditing ? 'تعديل المجموعة' : 'مجموعة جديدة'}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        submitText={isSubmitting ? 'جاري الحفظ...' : isEditing ? 'حفظ التعديلات' : 'إضافة'}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-gray-light mb-2 text-sm">اسم المجموعة</label>
            <Input
              type="text"
              id="name"
              className={`w-full p-3 bg-white/5 border rounded-lg text-white focus:ring-1 outline-none transition-all ${
                touched.name && validationErrors.name
                  ? 'border-danger focus:border-danger focus:ring-danger'
                  : 'border-white/10 focus:border-primary focus:ring-primary'
              }`}
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              required
            />
            {touched.name && validationErrors.name && (
              <p className="text-danger text-xs mt-1 flex items-center gap-1">
                <Icon name="exclamation-circle" />
                {validationErrors.name}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="grade_id" className="block text-gray-light mb-2 text-sm">الصف الدراسي (اختياري)</label>
            <Select
              options={[
                { value: '', label: 'لا يوجد' },
                ...grades.map(g => ({ value: g.id, label: g.name }))
              ]}
              value={formData.grade_id || ''}
              onChange={(value) => setFormData({ ...formData, grade_id: value || null })}
              placeholder="اختر الصف الدراسي"
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="time" className="block text-gray-light mb-2 text-sm">الموعد (اختياري)</label>
            <Input
              type="text"
              id="time"
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              value={formData.time || ''}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              placeholder="مثال: 4:00 عصراً"
            />
          </div>
          <div>
            <label htmlFor="type" className="block text-gray-light mb-2 text-sm">نوع المجموعة</label>
            <Select
              options={[
                { value: 'general', label: 'عامة (سعر الصف)' },
                { value: 'private', label: 'خاصة (سعر مخصص)' }
              ]}
              value={formData.type}
              onChange={(value) => setFormData({ ...formData, type: value as 'general' | 'private' })}
              placeholder="اختر نوع المجموعة"
              className="w-full"
            />
          </div>
          {formData.type === 'private' && (
            <div>
              <label htmlFor="price" className="block text-gray-light mb-2 text-sm">سعر الاشتراك الشهري</label>
              <Input
                type="number"
                id="price"
                className={`w-full p-3 bg-white/5 border rounded-lg text-white focus:ring-1 outline-none transition-all ${
                  touched.price && validationErrors.price
                    ? 'border-danger focus:border-danger focus:ring-danger'
                    : 'border-white/10 focus:border-primary focus:ring-primary'
                }`}
                value={formData.price}
                onChange={(e) => handleInputChange('price', Number(e.target.value))}
                onBlur={() => handleBlur('price')}
                min="0"
                placeholder="0"
              />
              {touched.price && validationErrors.price && (
                <p className="text-danger text-xs mt-1 flex items-center gap-1">
                  <Icon name="exclamation-circle" />
                  {validationErrors.price}
                </p>
              )}
            </div>
          )}
          <div>
            <label htmlFor="days" className="block text-gray-light mb-2 text-sm">الأيام (اختياري)</label>
            <Input
              type="text"
              id="days"
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              value={formData.days || ''}
              onChange={(e) => setFormData({ ...formData, days: e.target.value })}
              placeholder="مثال: سبت وثلاثاء"
            />
          </div>
        </div>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="تأكيد الحذف"
        message={
          <div>
            <p className="text-gray-300">هل أنت متأكد من حذف المجموعة "{selectedGroup?.name}"؟</p>
            <p className="text-red-500 mt-2 text-sm">
              سيتم حذف جميع البيانات المرتبطة بهذه المجموعة.
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
