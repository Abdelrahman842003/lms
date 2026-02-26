'use client';
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { Button, Icon, Input } from '@/components/ui';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { getTeacherStudentDetails, updateTeacherStudent, updateTeacherStudentPermissions } from '@/services/authService';
import { getGrades, Grade } from '@/services/gradeService';
import { getGroups, Group } from '@/services/groupService';
import { getTeacherPermissions, Permission } from '@/services/roles';
import { useRouter, useParams } from 'next/navigation';

export default function EditStudentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  
  const [grades, setGrades] = useState<Grade[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    parent_phone: '',
    gender: 'male',
    education_type: '',
    grade_id: '',
    group_id: '',
    location: '',
    permissions: [] as string[],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchStudentData();
    fetchGradesAndGroupsAndPermissions();
  }, [studentId]);

  const fetchStudentData = async () => {
    try {
      setIsLoading(true);
      const data = await getTeacherStudentDetails(studentId);
      setFormData({
        name: data.name || '',
        parent_phone: data.parent_phone || '',
        gender: data.gender || 'male',
        education_type: data.education_type || '',
        grade_id: data.grade_id ? String(data.grade_id) : '',
        group_id: data.group_id ? String(data.group_id) : '',
        location: data.location || '',
        permissions: data.permissions || [],
      });
    } catch (error) {
      console.error('Failed to fetch student data:', error);
      setFormErrors({ submit: 'فشل تحميل بيانات الطالب' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGradesAndGroupsAndPermissions = async () => {
    try {
      const [gradesData, groupsData, permissionsData] = await Promise.all([
        getGrades(),
        getGroups(),
        getTeacherPermissions(),
      ]);
      setGrades(gradesData.data || []);
      setGroups(groupsData.data || []);
      // Filter permissions for 'student' guard
      const permissionsList = permissionsData.data || [];
      const studentPermissions = permissionsList.filter(
        (p: Permission) => p.guard_name === 'student'
      );
      setAvailablePermissions(studentPermissions);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'الاسم مطلوب';
    }



    if (!formData.gender) {
      errors.gender = 'النوع مطلوب';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePermissionChange = (permissionName: string) => {
    setFormData(prev => {
      const newPermissions = prev.permissions.includes(permissionName)
        ? prev.permissions.filter(p => p !== permissionName)
        : [...prev.permissions, permissionName];
      return { ...prev, permissions: newPermissions };
    });
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

      await updateTeacherStudent(studentId, submitData);
      await updateTeacherStudentPermissions(studentId, formData.permissions);
      
      setSuccessMessage('تم تحديث بيانات الطالب والصلاحيات بنجاح!');
      
      // Redirect to student details after 1.5 seconds
      setTimeout(() => {
        router.push(`/teacher/students/${studentId}`);
      }, 1500);
    } catch (error: any) {
      console.error('Failed to update student:', error);
      setFormErrors({ submit: error.message || 'حدث خطأ أثناء تحديث بيانات الطالب' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/teacher/students/${studentId}`);
  };

  if (isLoading) {
    return (
      null
    );
  }

  return (
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={user || undefined}
    
    >
      <DashboardCard
        title="تعديل بيانات الطالب"
        icon="fas fa-user-edit"
      >
        <form onSubmit={handleSubmit}>
          {successMessage && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-lg mb-6 flex items-center gap-3">
              <Icon name="check-circle" className="text-xl" />
              <span>{successMessage}</span>
            </div>
          )}

          {formErrors.submit && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg mb-6 flex items-center gap-3">
              <Icon name="exclamation-circle" className="text-xl" />
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
                options={[
                  { value: 'male', label: 'ذكر' },
                  { value: 'female', label: 'أنثى' }
                ]}
                value={formData.gender}
                onChange={(value) => setFormData({ ...formData, gender: value })}
                disabled={isSubmitting}
              />
              {formErrors.gender && <span className="text-red-500 text-sm mt-1 block">{formErrors.gender}</span>}
            </div>

            <div>
              <label htmlFor="education_type" className="block text-gray-light mb-2 text-[0.95rem]">نوع التعليم</label>
              <Select
                options={[
                  { value: 'general', label: 'عام' },
                  { value: 'azhar', label: 'أزهري' }
                ]}
                value={formData.education_type}
                onChange={(value) => setFormData({ ...formData, education_type: value })}
                placeholder="اختر نوع التعليم"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="grade_id" className="block text-gray-light mb-2 text-[0.95rem]">الصف الدراسي</label>
              <Select
                options={grades.map((grade) => ({ value: grade.id, label: grade.name }))}
                value={formData.grade_id}
                onChange={(value) => setFormData({ ...formData, grade_id: value })}
                placeholder="اختر الصف الدراسي"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="group_id" className="block text-gray-light mb-2 text-[0.95rem]">المجموعة</label>
              <Select
                options={groups.map((group) => ({ value: group.id, label: `${group.name} ${group.grade_name ? `(${group.grade_name})` : ''}` }))}
                value={formData.group_id}
                onChange={(value) => setFormData({ ...formData, group_id: value })}
                placeholder="اختر المجموعة"
                disabled={isSubmitting}
              />
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

            {/* Permissions Section */}
            <div className="md:col-span-2">
              <label className="block text-gray-light mb-2 text-[0.95rem]">الصلاحيات</label>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 p-4 bg-white/5 rounded-lg mt-2">
                {availablePermissions.length > 0 ? (
                  availablePermissions.map((permission) => (
                    <label key={permission.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission.name)}
                        onChange={() => handlePermissionChange(permission.name)}
                        disabled={isSubmitting}
                        className="w-[18px] h-[18px] rounded border-white/10 bg-white/5 text-primary focus:ring-primary"
                      />
                      <span className="text-white">{permission.name}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-gray-light col-span-full text-center">
                    لا توجد صلاحيات متاحة للطلاب
                  </p>
                )}
              </div>
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
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              <Icon name="save" />
              <span>حفظ التعديلات</span>
            </Button>
          </div>
        </form>
      </DashboardCard>
    </DashboardLayout>
  );
}
