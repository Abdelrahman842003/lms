'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import { getGroups, createGroup, updateGroup, deleteGroup, Group, CreateGroupData } from '@/services/groupService';
import { getGrades, Grade as GradeType } from '@/services/gradeService';

export default function GroupsPage() {
  const router = useRouter();
  const { user } = useAuth();
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
  });

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
    fetchGrades();
  }, []);

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
    setFormData({ name: '', grade_id: null, time: '', days: '' });
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
    });
    setShowModal(true);
  };

  const handleDeleteClick = (group: Group) => {
    setSelectedGroup(group);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditing && selectedGroup) {
        await updateGroup(selectedGroup.id, formData);
      } else {
        await createGroup(formData);
      }
      setShowModal(false);
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
                <div>
                  <label htmlFor="name" className="block text-gray-light mb-2 text-sm">اسم المجموعة</label>
                  <input
                    type="text"
                    id="name"
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="grade_id" className="block text-gray-light mb-2 text-sm">الصف الدراسي (اختياري)</label>
                  <select
                    id="grade_id"
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    value={formData.grade_id || ''}
                    onChange={(e) => setFormData({ ...formData, grade_id: e.target.value || null })}
                  >
                    <option value="" className="bg-[#1a1f37]">لا يوجد</option>
                    {grades.map((grade) => (
                      <option key={grade.id} value={grade.id} className="bg-[#1a1f37]">
                        {grade.name}
                      </option>
                    ))}
                  </select>
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
    </DashboardLayout>
  );
}
