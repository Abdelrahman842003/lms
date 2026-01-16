'use client';

import React, { useState, useEffect } from 'react';

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import * as academyService from '@/services/academyService';
import { Group } from '@/services/groupService'; // Using Group type from groupService
import { Grade } from '@/services/gradeService';

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
        console.error('Failed to fetch teachers:', error);
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
          setGrades(response.data?.data || []);
        } catch (error) {
          console.error('Failed to fetch teacher grades:', error);
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
  const totalStudents = groups.reduce((sum, group) => sum + (group.students_count || 0), 0);
  const activeGroups = groups.filter(g => (g.students_count || 0) > 0).length;
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
      setGroups(response.data.data);
      setTotalPages(response.data.meta.last_page);
      setTotalItems(response.data.meta.total);
      setCurrentPage(response.data.meta.current_page);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
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
      console.error('Failed to save group:', error);
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
      className: 'font-bold',
    },
    {
      key: 'teacher',
      label: 'المدرس',
      sortable: true,
      className: 'hidden md:table-cell',
      render: (value: any, row: Group) => row.teacher?.name || '-',
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
      icon: 'fas fa-eye',
      onClick: (row: Group) => handleViewClick(row),
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
          <button onClick={handleAddClick} className="btn btn-primary">
            <i className="fas fa-plus"></i>
            <span>إضافة مجموعة</span>
          </button>
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
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-[#1e1e2d] rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">{isEditing ? 'تعديل المجموعة' : 'مجموعة جديدة'}</h3>
              <button className="text-gray-400 hover:text-white transition-colors" onClick={() => setShowModal(false)}>
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                {/* Teacher Selection */}
                <div>
                  <label htmlFor="teacher_id" className="block text-gray-light mb-2 text-sm">المدرس</label>
                  <select
                    id="teacher_id"
                    className={`w-full p-3 bg-white/5 border rounded-lg text-white focus:ring-1 outline-none transition-all ${
                      touched.teacher_id && validationErrors.teacher_id 
                        ? 'border-danger focus:border-danger focus:ring-danger' 
                        : 'border-white/10 focus:border-primary focus:ring-primary'
                    }`}
                    value={formData.teacher_id}
                    onChange={(e) => handleInputChange('teacher_id', e.target.value)}
                    onBlur={() => handleBlur('teacher_id')}
                    disabled={isEditing}
                    required
                  >
                    <option value="" className="bg-[#1a1f37]">اختر المدرس</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id} className="bg-[#1a1f37]">
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                  {touched.teacher_id && validationErrors.teacher_id && (
                    <p className="text-danger text-xs mt-1 flex items-center gap-1">
                      <i className="fas fa-exclamation-circle"></i>
                      {validationErrors.teacher_id}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="name" className="block text-gray-light mb-2 text-sm">اسم المجموعة</label>
                  <input
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
                      <i className="fas fa-exclamation-circle"></i>
                      {validationErrors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="grade_id" className="block text-gray-light mb-2 text-sm">الصف الدراسي (اختياري)</label>
                  <select
                    id="grade_id"
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    value={formData.grade_id || ''}
                    onChange={(e) => setFormData({ ...formData, grade_id: e.target.value || null })}
                    disabled={!formData.teacher_id} // Disable if no teacher selected
                  >
                    <option value="" className="bg-[#1a1f37]">لا يوجد</option>
                    {grades.map((grade) => (
                      <option key={grade.id} value={grade.id} className="bg-[#1a1f37]">
                        {grade.name}
                      </option>
                    ))}
                  </select>
                  {!formData.teacher_id && (
                    <p className="text-gray-500 text-xs mt-1">يرجى اختيار المدرس أولاً لعرض الصفوف</p>
                  )}
                </div>
                <div>
                  <label htmlFor="time" className="block text-gray-light mb-2 text-sm">الموعد (اختياري)</label>
                  <input
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
                  <select
                    id="type"
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'general' | 'private' })}
                  >
                    <option value="general" className="bg-[#1a1f37]">عامة (سعر الصف)</option>
                    <option value="private" className="bg-[#1a1f37]">خاصة (سعر مخصص)</option>
                  </select>
                </div>
                {formData.type === 'private' && (
                  <div>
                    <label htmlFor="price" className="block text-gray-light mb-2 text-sm">سعر الاشتراك الشهري</label>
                    <input
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
                        <i className="fas fa-exclamation-circle"></i>
                        {validationErrors.price}
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <label htmlFor="days" className="block text-gray-light mb-2 text-sm">الأيام (اختياري)</label>
                  <input
                    type="text"
                    id="days"
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    value={formData.days || ''}
                    onChange={(e) => setFormData({ ...formData, days: e.target.value })}
                    placeholder="مثال: سبت وثلاثاء"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-white/10 bg-white/5">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                >
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الحفظ...' : isEditing ? 'حفظ التعديلات' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-[#1e1e2d] rounded-2xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">تأكيد الحذف</h3>
              <button className="text-gray-400 hover:text-white transition-colors" onClick={() => setShowDeleteModal(false)}>
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-300">هل أنت متأكد من حذف المجموعة "{selectedGroup.name}"؟</p>
              <p className="text-red-500 mt-2 text-sm">
                سيتم حذف جميع البيانات المرتبطة بهذه المجموعة.
              </p>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-white/10 bg-white/5">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={isSubmitting}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'جاري الحذف...' : 'حذف'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailsModal && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetailsModal(false)}>
          <div className="w-full max-w-[600px] bg-[#1e1e2d] rounded-xl shadow-2xl border border-white/10 animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white m-0">تفاصيل المجموعة</h3>
              <button 
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors" 
                onClick={() => setShowDetailsModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Header Info */}
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl">
                  <i className="fas fa-layer-group"></i>
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
                      <i className="fas fa-user"></i>
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
              <button
                type="button"
                className="px-6 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all duration-200 font-medium"
                onClick={() => setShowDetailsModal(false)}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
