'use client';
import React, { useState, useEffect, use } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { getAcademyStudentDetails, updateAcademyStudent, getGrades, getGroups, getExamTeachers } from '@/services/academyService';
import { useRouter } from 'next/navigation';

import { Button, Icon, Input, Select, LoadingSpinner } from '@/components/ui';
interface Grade {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
  grade_id: string | null;
  grade_name: string | null;
}

export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  
  const [teachers, setTeachers] = useState<any[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    parent_phone: '',
    gender: 'male',
    education_type: '',
    teacher_id: '',
    grade_id: '',
    group_id: '',
    location: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [studentData, teachersData] = await Promise.all([
          getAcademyStudentDetails(id),
          getExamTeachers()
        ]);
        
        setTeachers(teachersData || []);
        
        const tId = studentData.group?.teacher_id || studentData.grade?.teacher_id || '';
        const gId = studentData.grade_id ? String(studentData.grade_id) : '';
        const grId = studentData.group_id ? String(studentData.group_id) : '';

        setFormData({
          name: studentData.name || '',
          parent_phone: studentData.parent_phone || '',
          gender: studentData.gender || 'male',
          education_type: studentData.education_type || '',
          teacher_id: tId,
          grade_id: gId,
          group_id: grId,
          location: studentData.location || '',
        });

        // Fetch Grades for this teacher
        if (tId) {
          try {
            const gradesData = await getGrades(1, 100, { teacher_id: tId });
            
            // Robust data extraction for Grades
            let gradesList: Grade[] = [];
            if (gradesData?.data?.data && Array.isArray(gradesData.data.data)) {
              gradesList = gradesData.data.data;
            } else if (gradesData?.data && Array.isArray(gradesData.data)) {
              gradesList = gradesData.data;
            } else if (Array.isArray(gradesData)) {
              gradesList = gradesData;
            } else if (gradesData?.grades && Array.isArray(gradesData.grades)) {
              gradesList = gradesData.grades;
            }
            
            setGrades(gradesList);
          } catch (e) {
            console.error('Error fetching grades:', e);
          }
        }

        // Fetch Groups for this grade
        if (gId) {
          try {
            const groupsData = await getGroups(1, 100, { grade_id: gId });
            
            // Robust data extraction for Groups
            let groupsList: Group[] = [];
            if (groupsData?.data?.data && Array.isArray(groupsData.data.data)) {
              groupsList = groupsData.data.data;
            } else if (groupsData?.data && Array.isArray(groupsData.data)) {
              groupsList = groupsData.data;
            } else if (Array.isArray(groupsData)) {
              groupsList = groupsData;
            } else if (groupsData?.groups && Array.isArray(groupsData.groups)) {
              groupsList = groupsData.groups;
            }
            
            setGroups(groupsList);
          } catch (e) {
            console.error('Error fetching groups:', e);
          }
        }
        
        setInitialLoadComplete(true);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setFormErrors({ submit: 'فشل تحميل بيانات الطالب' });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  // Fetch Grades when Teacher changes (after initial load)
  useEffect(() => {
    if (!initialLoadComplete) return;

    const fetchGrades = async () => {
      if (!formData.teacher_id) {
        setGrades([]);
        setFormData(prev => ({ ...prev, grade_id: '' }));
        return;
      }
      
      try {
        const gradesData = await getGrades(1, 100, { teacher_id: formData.teacher_id });
        
        // Robust data extraction for Grades
        let gradesList: Grade[] = [];
        if (gradesData?.data?.data && Array.isArray(gradesData.data.data)) {
          gradesList = gradesData.data.data;
        } else if (gradesData?.data && Array.isArray(gradesData.data)) {
          gradesList = gradesData.data;
        } else if (Array.isArray(gradesData)) {
          gradesList = gradesData;
        } else if (gradesData?.grades && Array.isArray(gradesData.grades)) {
          gradesList = gradesData.grades;
        }
        
        setGrades(gradesList);
      } catch (error) {
        console.error('Error fetching grades:', error);
      }
    };
    
    fetchGrades();
    setFormData(prev => ({ ...prev, grade_id: '' })); // Reset grade when teacher changes
  }, [formData.teacher_id, initialLoadComplete]);

  // Fetch Groups when Grade changes (after initial load)
  useEffect(() => {
    if (!initialLoadComplete) return;

    const fetchGroups = async () => {
      if (!formData.grade_id) {
        setGroups([]);
        setFormData(prev => ({ ...prev, group_id: '' }));
        return;
      }
      
      try {
        const groupsData = await getGroups(1, 100, { grade_id: formData.grade_id });
        
        // Robust data extraction for Groups
        let groupsList: Group[] = [];
        if (groupsData?.data?.data && Array.isArray(groupsData.data.data)) {
          groupsList = groupsData.data.data;
        } else if (groupsData?.data && Array.isArray(groupsData.data)) {
          groupsList = groupsData.data;
        } else if (Array.isArray(groupsData)) {
          groupsList = groupsData;
        } else if (groupsData?.groups && Array.isArray(groupsData.groups)) {
          groupsList = groupsData.groups;
        }
        
        setGroups(groupsList);
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
    };
    
    fetchGroups();
    setFormData(prev => ({ ...prev, group_id: '' })); // Reset group when grade changes
  }, [formData.grade_id, initialLoadComplete]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'الاسم مطلوب';
    }

    if (!formData.teacher_id) {
      errors.teacher_id = 'المدرس مطلوب';
    }

    if (!formData.gender) {
      errors.gender = 'النوع مطلوب';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});
    setSuccessMessage('');

    try {
      const submitData: any = {
        name: formData.name,
        parent_phone: formData.parent_phone || null,
        gender: formData.gender,
        education_type: formData.education_type || null,
        grade_id: formData.grade_id || null,
        group_id: formData.group_id || null,
        location: formData.location || null,
      };

      await updateAcademyStudent(id, submitData);
      
      setSuccessMessage('تم تحديث بيانات الطالب بنجاح!');
      
      // Redirect to student details after 1.5 seconds
      setTimeout(() => {
        router.push(`/academy/students/${id}`);
      }, 1500);
    } catch (error: any) {
      console.error('Failed to update student:', error);
      setFormErrors({ submit: error.message || 'حدث خطأ أثناء تحديث بيانات الطالب' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/academy/students/${id}`);
  };

  if (isLoading) {
    return (
      <DashboardLayout
        role="academy"
        user={{
          name: user?.name || 'الأكاديمية',
          avatar: user?.avatar || '',
        }}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <LoadingSpinner size="sm" color="primary" />
            <p className="text-gray-light">جاري التحميل...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="academy"
      user={{
        name: user?.name || 'الأكاديمية',
        avatar: user?.avatar || '',
      }}
    >
      <DashboardCard
        title="تعديل بيانات الطالب"
        icon="user-edit"
      >
        <form onSubmit={handleSubmit}>
          {successMessage && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-lg mb-6 flex items-center gap-3">
              <Icon name="check-circle" size="lg" />
              <span>{successMessage}</span>
            </div>
          )}

          {formErrors.submit && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg mb-6 flex items-center gap-3">
              <Icon name="exclamation-circle" size="lg" />
              <span>{formErrors.submit}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-gray-light mb-2 text-[0.95rem]">
                الاسم <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                id="name"
                className={formErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="أدخل اسم الطالب"
                disabled={isSubmitting}
              />
              {formErrors.name && <span className="text-red-500 text-sm mt-1 block">{formErrors.name}</span>}
            </div>

            <div>
              <label htmlFor="parent_phone" className="block text-gray-light mb-2 text-[0.95rem]">رقم هاتف ولي الأمر</label>
              <Input
                type="tel"
                id="parent_phone"
                value={formData.parent_phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setFormData({ ...formData, parent_phone: value });
                }}
                placeholder="أدخل رقم هاتف ولي الأمر (أرقام فقط)"
                pattern="[0-9]*"
                inputMode="numeric"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="gender" className="block text-gray-light mb-2 text-[0.95rem]">
                النوع <span className="text-red-500">*</span>
              </label>
              <Select
                id="gender"
                className={formErrors.gender ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                disabled={isSubmitting}
              >
                <option value="male" className="bg-[#1a1f37]">ذكر</option>
                <option value="female" className="bg-[#1a1f37]">أنثى</option>
              </Select>
              {formErrors.gender && <span className="text-red-500 text-sm mt-1 block">{formErrors.gender}</span>}
            </div>

            <div>
              <label htmlFor="teacher_id" className="block text-gray-light mb-2 text-[0.95rem]">المدرس</label>
              <Select
                id="teacher_id"
                className={formErrors.teacher_id ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                value={formData.teacher_id}
                onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                disabled={isSubmitting}
              >
                <option value="" className="bg-[#1a1f37]">اختر المدرس</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id} className="bg-[#1a1f37]">
                    {teacher.name}
                  </option>
                ))}
              </Select>
              {formErrors.teacher_id && <span className="text-red-500 text-sm mt-1 block">{formErrors.teacher_id}</span>}
            </div>

            <div>
              <label htmlFor="education_type" className="block text-gray-light mb-2 text-[0.95rem]">نوع التعليم</label>
              <Select
                id="education_type"
                value={formData.education_type}
                onChange={(e) => setFormData({ ...formData, education_type: e.target.value })}
                disabled={isSubmitting}
              >
                <option value="" className="bg-[#1a1f37]">اختر نوع التعليم</option>
                <option value="general" className="bg-[#1a1f37]">عام</option>
                <option value="azhar" className="bg-[#1a1f37]">أزهري</option>
              </Select>
            </div>

            <div>
              <label htmlFor="grade_id" className="block text-gray-light mb-2 text-[0.95rem]">الصف الدراسي</label>
              <Select
                id="grade_id"
                value={formData.grade_id}
                onChange={(e) => setFormData({ ...formData, grade_id: e.target.value, group_id: '' })}
                disabled={isSubmitting || !formData.teacher_id}
              >
                <option value="" className="bg-[#1a1f37]">{!formData.teacher_id ? 'اختر المدرس أولاً' : 'اختر الصف الدراسي'}</option>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id} className="bg-[#1a1f37]">
                    {grade.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="group_id" className="block text-gray-light mb-2 text-[0.95rem]">المجموعة</label>
              <Select
                id="group_id"
                value={formData.group_id}
                onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                disabled={isSubmitting || !formData.grade_id}
              >
                <option value="" className="bg-[#1a1f37]">{!formData.grade_id ? 'اختر الصف أولاً' : 'اختر المجموعة'}</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id} className="bg-[#1a1f37]">
                    {group.name} {group.grade_name && `(${group.grade_name})`}
                  </option>
                ))}
              </Select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="location" className="block text-gray-light mb-2 text-[0.95rem]">الموقع</label>
              <Input
                type="text"
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="أدخل موقع الطالب"
                disabled={isSubmitting}
              />
              <span className="text-gray-light text-sm mt-1 block flex items-center gap-1">
                <Icon name="map-marker-alt" />
                مكان إقامة الطالب
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <Icon name="times" />
              <span>إلغاء</span>
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" color="primary" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Icon name="save" />
                  <span>حفظ التعديلات</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DashboardCard>
    </DashboardLayout>
  );
}
