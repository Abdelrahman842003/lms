import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Filter } from '@/components/Filter';
import { getTeachers, getGrades, getGroups, createAcademyStudent } from '@/services/academyService';
import toast from 'react-hot-toast';

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
        name: student.name, // Required by validation but won't change existing student
        phone: student.phone, // Used to find the student
        gender: student.gender || 'male', // Required validation
        grade_id: formData.grade_id,
        group_id: formData.group_id,
        teacher_id: formData.teacher_id,
        // Optional fields to satisfy validation if needed
        parent_phone: student.parent_phone, 
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

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1E1E2D] border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">ربط الطالب بمدرس</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <i className="fas fa-spinner fa-spin text-2xl text-primary"></i>
            </div>
          ) : (
            <>
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
            </>
          )}

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-outline justify-center"
              disabled={isSubmitting}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex-1 btn btn-primary justify-center"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-link"></i>}
              <span className="mr-2">ربط</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
