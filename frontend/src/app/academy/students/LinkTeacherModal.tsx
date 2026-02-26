import React, { useState, useEffect } from 'react';
import { Filter } from '@/components/Filter';
import { getTeachers, getGrades, getGroups, createAcademyStudent } from '@/services/academyService';
import toast from 'react-hot-toast';
import { FormModal, LoadingSpinner, Icon } from '@/components/ui';
interface LinkTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  onSuccess: () => void;
}

export const LinkTeacherModal: React.FC<LinkTeacherModalProps> = ({
  isOpen,
  onClose,
  student,
  onSuccess,
}) => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    teacher_id: '',
    grade_id: '',
    group_id: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
      // Reset form
      setFormData({
        teacher_id: '',
        grade_id: '',
        group_id: '',
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.teacher_id) {
      fetchGrades(formData.teacher_id);
    } else {
      setGrades([]);
      setFormData(prev => ({ ...prev, grade_id: '', group_id: '' }));
    }
  }, [formData.teacher_id]);

  const fetchGrades = async (teacherId: string) => {
    try {
      // toast.loading('جاري تحميل الصفوف...', { id: 'loading-grades' });
      console.log('Fetching grades for teacher:', teacherId);
      
      const [gradesData, groupsData] = await Promise.all([
        getGrades(1, 100, { teacher_id: teacherId }),
        getGroups(1, 100, { teacher_id: teacherId })
      ]);
      
      // Robust extraction for grades
      let gradesList = [];
      if (gradesData?.data?.data && Array.isArray(gradesData.data.data)) {
        gradesList = gradesData.data.data;
      } else if (gradesData?.data && Array.isArray(gradesData.data)) {
        gradesList = gradesData.data;
      } else if (Array.isArray(gradesData)) {
        gradesList = gradesData;
      }

      // Robust extraction for groups
      let groupsList = [];
      if (groupsData?.data?.data && Array.isArray(groupsData.data.data)) {
        groupsList = groupsData.data.data;
      } else if (groupsData?.data && Array.isArray(groupsData.data)) {
        groupsList = groupsData.data;
      } else if (Array.isArray(groupsData)) {
        groupsList = groupsData;
      }
      
      toast.dismiss('loading-grades');
      // toast.success(`تم العثور على ${gradesList.length} صف دراسي و ${groupsList.length} مجموعة`);
      
      setGrades(gradesList);
      setGroups(groupsList);
    } catch (error) {
      console.error('Failed to fetch grades:', error);
      toast.error('فشل تحميل الصفوف الدراسية');
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [teachersData, groupsData] = await Promise.all([
        getTeachers(1, 100, '', 'active'),
        getGroups(1, 100),
      ]);

      setTeachers(teachersData.data || []);
      
      // Robust extraction for groups
      let groupsList = [];
      if (groupsData?.data && Array.isArray(groupsData.data)) groupsList = groupsData.data;
      else if (Array.isArray(groupsData)) groupsList = groupsData;
      else if (groupsData?.groups) groupsList = groupsData.groups;
      setGroups(groupsList);

    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('فشل تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce search
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleSearchTeachers = (search: string) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    
    const timeout = setTimeout(async () => {
      try {
        // toast.loading('جاري البحث...', { id: 'search-teachers' });
        const teachersData = await getTeachers(1, 100, search, 'active');
        setTeachers(teachersData.data || []);
        // toast.dismiss('search-teachers');
      } catch (error) {
        console.error('Failed to search teachers:', error);
      }
    }, 500); // 500ms debounce

    setSearchTimeout(timeout);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teacher_id || !formData.grade_id || !formData.group_id) {
      toast.error('جميع الحقول مطلوبة');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // We use createAcademyStudent which calls the store endpoint.
      // The store endpoint handles "enroll existing student" logic.
      // We need to pass the student's phone to identify them.
      
      await createAcademyStudent({
        name: student.name,
        phone: student.phone,
        grade_id: formData.grade_id,
        group_id: formData.group_id,
        teacher_id: formData.teacher_id,
      });

      toast.success('تم ربط الطالب بالمدرس بنجاح');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Link teacher error:', error);
      const msg = error.response?.data?.message || error.message || 'فشل ربط الطالب';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter groups by grade
  const filteredGroups = groups.filter(g => g.grade_id == formData.grade_id);

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="ربط الطالب بمدرس"
      isLoading={isSubmitting}
      submitText="ربط"
      cancelText="إلغاء"
      maxWidth="450px"
    >
      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="sm" color="primary" />
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">الطالب</label>
            <div className="p-3 bg-white/5 rounded-lg text-white font-medium">
              {student.name}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">المدرس <span className="text-red-500">*</span></label>
            <Filter
              options={teachers
                .filter(t => !student.teachers?.some((st: any) => st.id === t.id))
                .map(t => ({ value: t.id, label: t.name }))}
              value={formData.teacher_id}
              onChange={(val) => setFormData({ ...formData, teacher_id: val })}
              placeholder="اختر المدرس"
              searchable={true}
              onSearchChange={handleSearchTeachers}
              disableLocalFilter={true}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">الصف الدراسي <span className="text-red-500">*</span></label>
            <Filter
              options={grades
                .filter(g => g?.id)
                .map(g => ({ value: g.id.toString(), label: g.name || 'Unknown' }))}
              value={formData.grade_id}
              onChange={(val) => setFormData({ ...formData, grade_id: val, group_id: '' })}
              placeholder="اختر الصف"
              disabled={!formData.teacher_id}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">المجموعة <span className="text-red-500">*</span></label>
            <Filter
              options={filteredGroups.map(g => ({ value: g.id.toString(), label: g.name }))}
              value={formData.group_id}
              onChange={(val) => setFormData({ ...formData, group_id: val })}
              placeholder="اختر المجموعة"
              disabled={!formData.grade_id}
            />
          </div>
        </div>
      )}
    </FormModal>
  );
};
