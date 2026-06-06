'use client';

import React, { useState, useEffect } from 'react';

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { Filter } from '@/components/Filter';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import * as academyService from '@/services/academyService';
import { Group } from '@/services/groupService'; // Using Group type from groupService
import { Grade } from '@/services/gradeService';
import { Button, Icon, Input, Badge, LoadingSpinner, FormModal, ConfirmationModal } from '@/components/ui';

interface CreateGroupData {
  name: string;
  teacher_id: string;
  grade_id: string | null;
  time: string;
  days: string;
  type: 'general' | 'private';
  price: number;
}

export default function AcademyGroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
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
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateGroupData>({
    name: '',
    teacher_id: '',
    grade_id: null,
    time: '',
    days: '',
    type: 'general',
    price: 0,
  });
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    teacher_id?: string;
    price?: string;
  }>({});
  const [touched, setTouched] = useState<{
    name: boolean;
    teacher_id: boolean;
    price: boolean;
  }>({
    name: false,
    teacher_id: false,
    price: false,
  });

  // Fetch teachers for dropdown
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await academyService.getLectureTeachers();
        setTeachers(response.data?.teachers || []);
      } catch (error) {
        setTeachers([]);
      }
    };
    fetchTeachers();
  }, []);

  // Fetch grades when teacher is selected
  useEffect(() => {
    if (formData.teacher_id) {
      const fetchTeacherGrades = async () => {
        try {
          const response = await academyService.getGrades(1, 100, { teacher_id: formData.teacher_id });
          let gradesList = [];
          if (response?.data?.data && Array.isArray(response.data.data)) {
            gradesList = response.data.data;
          } else if (response?.data && Array.isArray(response.data)) {
            gradesList = response.data;
          } else if (Array.isArray(response)) {
            gradesList = response;
          }
          setGrades(gradesList);
        } catch (error) {
          setGrades([]);
        }
      };
      fetchTeacherGrades();
    } else {
      setGrades([]);
    }
  }, [formData.teacher_id]);

  // Real-time validation
  const validateField = (name: string, value: string | number): string | undefined => {
    if (name === 'name') {
      const strVal = String(value);
      if (!strVal.trim()) return 'اسم المجموعة مطلوب';
      if (strVal.length < 2) return `الاسم قصير (${strVal.length}/2 أحرف)`;
    }
    
    if (name === 'teacher_id') {
      if (!String(value).trim()) return 'يجب اختيار المدرس';
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
    const teacherError = validateField('teacher_id', formData.teacher_id);
    const priceError = formData.type === 'private' && formData.price !== undefined 
      ? validateField('price', formData.price) 
      : undefined;
    
    if (nameError) errors.name = nameError;
    if (teacherError) errors.teacher_id = teacherError;
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
  const totalStudents = (groups || []).reduce((sum, group) => sum + (group.students_count || 0), 0);
  const activeGroups = (groups || []).filter(g => (g.students_count || 0) > 0).length;
  const avgStudentsPerGroup = totalGroups > 0 ? Math.round(totalStudents / totalGroups) : 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGroups(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchGroups = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await academyService.getGroups(page, itemsPerPage, { search: searchQuery });
      setGroups(response.data || []);
      setTotalPages(response.meta?.last_page || 1);
      setTotalItems(response.meta?.total || 0);
      setCurrentPage(response.meta?.current_page || 1);
    } catch (error) {
      // Error handled silently
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClick = () => {
    setIsEditing(false);
    setFormData({ 
      name: '', 
      teacher_id: '', 
      grade_id: null, 
      time: '', 
      days: '', 
      type: 'general', 
      price: 0 
    });
    setShowModal(true);
  };

  const handleEditClick = (group: Group) => {
    setIsEditing(true);
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      teacher_id: group.teacher?.id || '',
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
    setTouched({ name: true, teacher_id: true, price: true });
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      if (isEditing && selectedGroup) {
        await academyService.updateGroup(selectedGroup.id, formData);
      } else {
        await academyService.createGroup(formData);
      }
      setShowModal(false);
      setTouched({ name: false, teacher_id: false, price: false });
      setValidationErrors({});
      fetchGroups(currentPage);
    } catch (error) {
      // Error handled silently
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedGroup) return;

    setIsSubmitting(true);
    try {
      await academyService.deleteGroup(selectedGroup.id);
      setShowDeleteModal(false);
      fetchGroups(currentPage);
    } catch (error) {
      // Error handled silently
    } finally {
      setIsSubmitting(false);
    }
  };

  const tableColumns = [
    {
      key: 'name',
      label: 'اسم المجموعة',
      sortable: true,
      className: 'font-bold',
    },
    {
      key: 'teacher',
      label: 'المدرس',
      sortable: true,
      className: 'hidden md:table-cell',
      render: (_value: any, row: Group) => row.teacher?.name || '-',
    },
    {
      key: 'grade_name',
      label: 'الصف الدراسي',
      sortable: true,
      className: 'hidden sm:table-cell',
      render: (value: string | null) => value || '-',
    },
    {
      key: 'type',
      label: 'النوع',
      sortable: true,
      className: 'hidden lg:table-cell',
      render: (value: string) => value === 'private' ? 'خاصة' : 'عامة',
    },
    {
      key: 'price',
      label: 'السعر',
      sortable: true,
      className: 'hidden xl:table-cell',
      render: (value: number | null, row: Group) => row.type === 'private' ? `${value} ج.م` : '-',
    },
    {
      key: 'created_at',
      label: 'تاريخ الإنشاء',
      sortable: true,
      className: 'hidden 2xl:table-cell',
      render: (value: string) => new Date(value).toLocaleDateString('ar-EG'),
    },
  ];

  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleViewClick = (group: Group) => {
    setSelectedGroup(group);
    setShowDetailsModal(true);
  };

  const tableActions = [
    {
      label: 'عرض التفاصيل',
      icon: 'eye',
      onClick: (row: Group) => handleViewClick(row),
    },
    {
      label: 'تعديل',
      icon: 'edit',
      onClick: (row: Group) => handleEditClick(row),
    },
    {
      label: 'حذف',
      icon: 'trash',
      variant: 'danger' as const,
      onClick: (row: Group) => handleDeleteClick(row),
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
          title="إجمالي المجموعات"
          value={totalGroups}
          icon="layer-group"
          color="primary"
        />
        <StatCard
          title="إجمالي الطلاب"
          value={totalStudents}
          icon="user-graduate"
          color="success"
        />
        <StatCard
          title="المجموعات النشطة"
          value={activeGroups}
          icon="check-circle"
          color="warning"
        />
        <StatCard
          title="متوسط الطلاب لكل مجموعة"
          value={avgStudentsPerGroup}
          icon="chart-line"
          color="danger"
        />
      </div>

      {/* Groups Table */}
      <DashboardCard
        title="جميع المجموعات"
        icon="layer-group"
        action={
          <Button variant="primary" onClick={handleAddClick}>
            <Icon name="plus" />
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
        onSubmit={handleSubmit}
        title={isEditing ? 'تعديل المجموعة' : 'مجموعة جديدة'}
        isLoading={isSubmitting}
        submitText={isSubmitting ? 'جاري الحفظ...' : isEditing ? 'حفظ التعديلات' : 'إضافة'}
        cancelText="إلغاء"
        maxWidth="500px"
      >
        {/* Teacher Selection */}
        <div>
          <label htmlFor="teacher_id" className="block text-gray-light mb-2 text-sm">المدرس</label>
          <Filter
            options={[
              { value: '', label: 'اختر المدرس' },
              ...teachers.map((teacher) => ({ value: teacher.id, label: teacher.name }))
            ]}
            value={formData.teacher_id}
            onChange={(value) => {
              handleInputChange('teacher_id', value);
            }}
            placeholder="اختر المدرس"
            disabled={isEditing}
            className={touched.teacher_id && validationErrors.teacher_id ? 'border-danger' : ''}
          />
          {touched.teacher_id && validationErrors.teacher_id && (
            <p className="text-danger text-xs mt-1 flex items-center gap-1">
              <Icon name="exclamation-circle" />
              {validationErrors.teacher_id}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="name" className="block text-gray-light mb-2 text-sm">اسم المجموعة</label>
          <Input
            type="text"
            id="name"
            className={touched.name && validationErrors.name ? 'border-danger' : ''}
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
          <Filter
            options={[
              { value: '', label: 'لا يوجد' },
              ...grades.map((grade) => ({ value: grade.id, label: grade.name }))
            ]}
            value={formData.grade_id || ''}
            onChange={(value) => setFormData({ ...formData, grade_id: value || null })}
            placeholder="لا يوجد"
            disabled={!formData.teacher_id}
          />
          {!formData.teacher_id && (
            <p className="text-gray-500 text-xs mt-1">يرجى اختيار المدرس أولاً لعرض الصفوف</p>
          )}
        </div>
        <div>
          <label htmlFor="time" className="block text-gray-light mb-2 text-sm">الموعد (اختياري)</label>
          <Input
            type="text"
            id="time"
            value={formData.time || ''}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            placeholder="مثال: 4:00 عصراً"
          />
        </div>
        <div>
          <label htmlFor="type" className="block text-gray-light mb-2 text-sm">نوع المجموعة</label>
          <Filter
            options={[
              { value: 'general', label: 'عامة (سعر الصف)' },
              { value: 'private', label: 'خاصة (سعر مخصص)' }
            ]}
            value={formData.type}
            onChange={(value) => setFormData({ ...formData, type: value as 'general' | 'private' })}
            placeholder="اختر نوع المجموعة"
          />
        </div>
        {formData.type === 'private' && (
          <div>
            <label htmlFor="price" className="block text-gray-light mb-2 text-sm">سعر الاشتراك الشهري</label>
            <Input
              type="number"
              id="price"
              className={touched.price && validationErrors.price ? 'border-danger' : ''}
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
            value={formData.days || ''}
            onChange={(e) => setFormData({ ...formData, days: e.target.value })}
            placeholder="مثال: سبت وثلاثاء"
          />
        </div>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal && !!selectedGroup}
        title="تأكيد الحذف"
        message={
          <div>
            <p className="text-gray-300">هل أنت متأكد من حذف المجموعة &quot;{selectedGroup?.name}&quot;؟</p>
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

      {/* View Details Modal */}
      {showDetailsModal && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetailsModal(false)}>
          <div className="w-full max-w-[600px] bg-[#1e1e2d] rounded-xl shadow-2xl border border-white/10 animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white m-0">تفاصيل المجموعة</h3>
              <Button
                variant="ghost"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors p-0"
                onClick={() => setShowDetailsModal(false)}
              >
                <Icon name="times" />
              </Button>
            </div>
            <div className="p-6 space-y-6">
              {/* Header Info */}
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl">
                  <Icon name="layer-group" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">{selectedGroup.name}</h4>
                  <p className="text-gray-400 text-sm">تاريخ الإنشاء: {new Date(selectedGroup.created_at).toLocaleDateString('ar-EG')}</p>
                </div>
                <div className="mr-auto flex flex-col items-end gap-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                    selectedGroup.type === 'private' 
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {selectedGroup.type === 'private' ? 'مجموعة خاصة' : 'مجموعة عامة'}
                  </span>
                  {selectedGroup.type === 'private' && selectedGroup.price && (
                    <span className="text-sm text-gray-400">{selectedGroup.price} ج.م</span>
                  )}
                </div>
              </div>

              {/* Teacher Info */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-400">المدرس المسؤول</h5>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                  {selectedGroup.teacher?.avatar ? (
                    <img src={selectedGroup.teacher.avatar} alt={selectedGroup.teacher.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                      <Icon name="user" />
                    </div>
                  )}
                  <span className="text-white font-medium">{selectedGroup.teacher?.name || 'غير محدد'}</span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-sm text-gray-400 mb-1">الصف الدراسي</div>
                  <div className="text-white font-medium">{selectedGroup.grade_name || 'غير محدد'}</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-sm text-gray-400 mb-1">عدد الطلاب</div>
                  <div className="text-white font-medium">{selectedGroup.students_count || 0} طالب</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-sm text-gray-400 mb-1">الأيام</div>
                  <div className="text-white font-medium">{selectedGroup.days || '-'}</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-sm text-gray-400 mb-1">الموعد</div>
                  <div className="text-white font-medium">{selectedGroup.time || '-'}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end p-6 border-t border-white/10 bg-black/20 rounded-b-xl">
              <Button
                type="button"
                variant="primary"
                className="px-6 py-2.5 rounded-lg shadow-lg shadow-primary/20 transition-all duration-200 font-medium"
                onClick={() => setShowDetailsModal(false)}
              >
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
