'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/AuthContext';
import { createTeacherStudent, searchStudentByPhone } from '@/services/authService';
import { getGrades } from '@/services/gradeService';
import { getGroups } from '@/services/groupService';
import { useRouter } from 'next/navigation';

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

export default function AddStudentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [isPhoneChecked, setIsPhoneChecked] = useState(false); // New state
  const [successMessage, setSuccessMessage] = useState('');
  const [existingStudentFound, setExistingStudentFound] = useState(false);
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    parent_phone: '',
    gender: 'male',
    education_type: '',
    grade_id: '',
    group_id: '',
    location: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Generate password preview from name and phone
  const generateSlug = (name: string) => {
    let text = name.trim();
    
    // Specific replacements for common names/prefixes
    const replacements: Record<string, string> = {
      'عبدال': 'abdel',
      'عبد ال': 'abdel',
      'عيد': 'eid',
      'الله': 'allah',
      'ال': 'el',
    };

    Object.keys(replacements).forEach(key => {
      text = text.replace(new RegExp(key, 'g'), replacements[key]);
    });
    
    const arabicChars = [
      'ا', 'أ', 'إ', 'آ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي', 'ى', 'ة',
      '٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'
    ];
    
    const englishChars = [
      'a', 'a', 'e', 'a', 'b', 't', 'th', 'j', 'h', 'kh', 'd', 'th', 'r', 'z', 's', 'sh', 's', 'd', 't', 'z', 'a', 'gh', 'f', 'q', 'k', 'l', 'm', 'n', 'h', 'w', 'i', 'a', 'a',
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
    ];

    for (let i = 0; i < arabicChars.length; i++) {
      text = text.replace(new RegExp(arabicChars[i], 'g'), englishChars[i]);
    }

    return text
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove non-alphanumeric chars
      .replace(/\s+/g, '_')           // Replace spaces with underscores
      .toLowerCase();
  };

  const passwordPreview = formData.phone ? `${generateSlug(formData.name)}${formData.phone}` : generateSlug(formData.name);

  useEffect(() => {
    fetchGradesAndGroups();
  }, []);

  const fetchGradesAndGroups = async () => {
    try {
      const [gradesData, groupsData] = await Promise.all([
        getGrades(),
        getGroups(),
      ]);
      setGrades(gradesData.data || []);
      setGroups(groupsData.data || []);
    } catch (error) {
      console.error('Failed to fetch grades and groups:', error);
    }
  };

  // Filter groups based on selected grade
  const filteredGroups = formData.grade_id
    ? groups.filter((group) => group.grade_id === formData.grade_id)
    : groups;

  const handleCheckPhone = async (phoneToCheck?: string) => {
    const phone = phoneToCheck || formData.phone;
    
    if (!phone || phone.length < 10) {
      // Don't show error while typing, only if explicitly checked or invalid length on submit
      return;
    }

    setIsCheckingPhone(true);
    setFormErrors({});
    setSuccessMessage('');
    setExistingStudentFound(false);
    setAlreadyEnrolled(false);
    setIsPhoneChecked(false); // Reset check status

    try {
      const result = await searchStudentByPhone(phone);
      
      if (result.found) {
        setExistingStudentFound(true);
        setAlreadyEnrolled(result.already_enrolled);
        setIsPhoneChecked(true); // Valid check
        
        // Auto-fill data
        setFormData(prev => ({
          ...prev,
          name: result.student.name,
          parent_phone: result.student.parent_phone || '',
          gender: result.student.gender || 'male',
          education_type: result.student.education_type || '',
          grade_id: result.student.grade_id || '', // Auto-fill grade
          group_id: '', // Always clear group for teacher to select
          location: result.student.location || '',
          phone: phone,
        }));
        
        if (result.already_enrolled) {
          setFormErrors({ phone: 'هذا الطالب مسجل معك بالفعل' });
        } else {
          setSuccessMessage('تم العثور على الطالب. يمكنك استكمال البيانات لإضافته.');
        }
      } else {
        // Auto-check when length is 11
        if (phone.length === 11) {
             const egyptianPhoneRegex = /^01[0125][0-9]{8}$/;
             if (egyptianPhoneRegex.test(phone)) {
                 setSuccessMessage('رقم الهاتف غير مسجل من قبل. يمكنك إضافة طالب جديد.');
                 setIsPhoneChecked(true); // Valid check (new student)
             } else {
                 setFormErrors({ phone: 'رقم الهاتف يجب أن يكون رقم مصري صحيح (يبدأ بـ 010, 011, 012, 015)' });
             }
        }
      }
    } catch (error) {
      console.error('Check phone failed:', error);
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'الاسم مطلوب';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'رقم الهاتف مطلوب';
    } else if (!/^01[0125][0-9]{8}$/.test(formData.phone)) {
      errors.phone = 'رقم الهاتف يجب أن يكون رقم مصري صحيح';
    }

    if (!formData.gender) {
      errors.gender = 'النوع مطلوب';
    }
    
    if (alreadyEnrolled) {
      errors.submit = 'هذا الطالب مسجل بالفعل';
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
        phone: formData.phone,
        parent_phone: formData.parent_phone || null,
        gender: formData.gender,
        education_type: formData.education_type || null,
        grade_id: formData.grade_id || null,
        group_id: formData.group_id || null,
        location: formData.location || null,
      };

      await createTeacherStudent(submitData);
      setSuccessMessage('تم إضافة الطالب بنجاح!');
      
      // Redirect to students list after 1.5 seconds
      setTimeout(() => {
        router.push('/teacher/dashboard');
      }, 1500);
    } catch (error: any) {
      console.error('Failed to create student:', error);
      setFormErrors({ submit: error.message || 'حدث خطأ أثناء إضافة الطالب' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/teacher/dashboard');
  };

  return (
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={user || undefined}
    >

      <DashboardCard
        title="إضافة طالب جديد"
        icon="fas fa-user-plus"
      >
        <form onSubmit={handleSubmit}>
          {successMessage && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-lg mb-6 flex items-center gap-3">
              <i className="fas fa-check-circle text-xl"></i>
              <span>{successMessage}</span>
            </div>
          )}

          {formErrors.submit && (
            <div className="alert alert-danger">
              <i className="fas fa-exclamation-circle"></i>
              <span>{formErrors.submit}</span>
            </div>
          )}
          
          {alreadyEnrolled && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-4 rounded-lg mb-6 flex items-center gap-3">
              <i className="fas fa-exclamation-triangle text-xl"></i>
              <span>هذا الطالب مسجل بالفعل في إحدى مجموعاتك.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="phone" className="block text-gray-light mb-2 text-[0.95rem]">
                رقم الهاتف <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  id="phone"
                  className={`w-full p-3 pl-10 bg-transparent border rounded-lg text-white text-[1rem] focus:ring-1 outline-none transition-all ${
                    formErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-primary focus:ring-primary'
                  }`}
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    
                    // Prevent typing more than 11 digits
                    if (value.length > 11) return;

                    setFormData(prev => ({ ...prev, phone: value }));
                    
                    // Real-time Validation
                    if (value.length > 0) {
                      const prefix = value.substring(0, 3);
                      if (value.length >= 3 && !['010', '011', '012', '015'].includes(prefix)) {
                        setFormErrors(prev => ({ ...prev, phone: 'يجب أن يبدأ الرقم بـ 010 أو 011 أو 012 أو 015' }));
                      } else {
                        setFormErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.phone;
                          return newErrors;
                        });
                      }
                    } else {
                       setFormErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.phone;
                          return newErrors;
                        });
                    }
                    
                    // Reset found status when phone changes
                    if (existingStudentFound || isPhoneChecked) {
                      setExistingStudentFound(false);
                      setAlreadyEnrolled(false);
                      setSuccessMessage('');
                      setIsPhoneChecked(false);
                    }

                    // Auto-check when length is 11 (Egyptian mobile number length)
                    if (value.length === 11) {
                      const prefix = value.substring(0, 3);
                      if (['010', '011', '012', '015'].includes(prefix)) {
                          handleCheckPhone(value);
                      }
                    }
                  }}
                  onBlur={() => {
                    if (formData.phone.length >= 10 && !existingStudentFound && !isPhoneChecked) {
                      handleCheckPhone(formData.phone);
                    }
                  }}
                  placeholder="أدخل رقم الهاتف (أرقام فقط)"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  disabled={isSubmitting}
                />
                {isCheckingPhone && (
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">
                    <i className="fas fa-spinner fa-spin"></i>
                  </div>
                )}
                {!isCheckingPhone && isPhoneChecked && !formErrors.phone && (
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-success">
                    <i className="fas fa-check"></i>
                  </div>
                )}
              </div>
              {formErrors.phone && <span className="text-red-500 text-sm mt-1 block">{formErrors.phone}</span>}
              <span className="text-gray-light text-sm mt-1 block">
                سيتم فحص الرقم تلقائياً عند إدخال 11 رقم.
              </span>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-gray-light mb-2 text-[0.95rem]">
                الاسم <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                className={`w-full p-3 bg-transparent border rounded-lg text-white text-[1rem] focus:ring-1 outline-none transition-all ${
                  formErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-primary focus:ring-primary'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="أدخل اسم الطالب"
                disabled={isSubmitting || !isPhoneChecked || existingStudentFound}
                readOnly={existingStudentFound}
              />
              {formErrors.name && <span className="text-red-500 text-sm mt-1 block">{formErrors.name}</span>}
              {existingStudentFound && <span className="text-success text-sm mt-1 block">تم جلب الاسم تلقائياً</span>}
            </div>

            <div>
              <label htmlFor="parent_phone" className="block text-gray-light mb-2 text-[0.95rem]">رقم هاتف ولي الأمر</label>
              <input
                type="tel"
                id="parent_phone"
                className="w-full p-3 bg-transparent border border-white/10 rounded-lg text-white text-[1rem] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                value={formData.parent_phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setFormData({ ...formData, parent_phone: value });
                }}
                placeholder="أدخل رقم هاتف ولي الأمر (أرقام فقط)"
                pattern="[0-9]*"
                inputMode="numeric"
                disabled={isSubmitting || !isPhoneChecked || existingStudentFound}
                readOnly={existingStudentFound}
              />
            </div>



            {/* Auto-generated Password Field (readonly) */}
            <div>
              <label htmlFor="password" className="block text-gray-light mb-2 text-[0.95rem] flex justify-between">
                <span>كلمة المرور</span>
                <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  <i className="fas fa-magic"></i>
                  تلقائي
                </span>
              </label>
              <input
                type="text"
                id="password"
                className="w-full p-3 bg-transparent border border-white/10 rounded-lg text-white text-[1rem] outline-none cursor-default opacity-70"
                value={passwordPreview || 'سيتم التوليد تلقائياً'}
                readOnly
                disabled
              />
            </div>

            <div>
              <label htmlFor="gender" className="block text-gray-light mb-2 text-[0.95rem]">
                النوع <span className="text-red-500">*</span>
              </label>
              <select
                id="gender"
                className={`w-full p-3 bg-transparent border rounded-lg text-white text-[1rem] focus:ring-1 outline-none transition-all ${
                  formErrors.gender ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-primary focus:ring-primary'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                disabled={isSubmitting || !isPhoneChecked || existingStudentFound}
              >
                <option value="male" className="bg-[#1a1f37]">ذكر</option>
                <option value="female" className="bg-[#1a1f37]">أنثى</option>
              </select>
              {formErrors.gender && <span className="text-red-500 text-sm mt-1 block">{formErrors.gender}</span>}
            </div>

            <div>
              <label htmlFor="education_type" className="block text-gray-light mb-2 text-[0.95rem]">نوع التعليم</label>
              <select
                id="education_type"
                className="w-full p-3 bg-transparent border border-white/10 rounded-lg text-white text-[1rem] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                value={formData.education_type}
                onChange={(e) => setFormData({ ...formData, education_type: e.target.value })}
                disabled={isSubmitting || !isPhoneChecked || existingStudentFound}
              >
                <option value="" className="bg-[#1a1f37]">اختر نوع التعليم</option>
                <option value="general" className="bg-[#1a1f37]">عام</option>
                <option value="azhar" className="bg-[#1a1f37]">أزهري</option>
              </select>
            </div>

            <div>
              <label htmlFor="grade_id" className="block text-gray-light mb-2 text-[0.95rem]">الصف الدراسي</label>
              <select
                id="grade_id"
                className="w-full p-3 bg-transparent border border-white/10 rounded-lg text-white text-[1rem] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                value={formData.grade_id}
                onChange={(e) => setFormData({ ...formData, grade_id: e.target.value, group_id: '' })}
                disabled={isSubmitting || !isPhoneChecked || (existingStudentFound && !!formData.grade_id)}
              >
                <option value="" className="bg-[#1a1f37]">اختر الصف الدراسي</option>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id} className="bg-[#1a1f37]">
                    {grade.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="group_id" className="block text-gray-light mb-2 text-[0.95rem]">المجموعة</label>
              <select
                id="group_id"
                className="w-full p-3 bg-transparent border border-white/10 rounded-lg text-white text-[1rem] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                value={formData.group_id}
                onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                disabled={isSubmitting || !isPhoneChecked || !formData.grade_id}
              >
                <option value="" className="bg-[#1a1f37]">
                  {!formData.grade_id 
                    ? 'اختر الصف الدراسي أولاً' 
                    : filteredGroups.length === 0 
                      ? 'لا توجد مجموعات لهذا الصف' 
                      : 'اختر المجموعة'}
                </option>
                {filteredGroups.map((group) => (
                  <option key={group.id} value={group.id} className="bg-[#1a1f37]">
                    {group.name}
                  </option>
                ))}
              </select>
              {formData.grade_id && filteredGroups.length === 0 && (
                <span className="text-gray-light text-sm mt-1 block flex items-center gap-1">
                  <i className="fas fa-info-circle"></i>
                  لا توجد مجموعات متاحة لهذا الصف الدراسي
                </span>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="location" className="block text-gray-light mb-2 text-[0.95rem]">الموقع</label>
              <input
                type="text"
                id="location"
                className="w-full p-3 bg-transparent border border-white/10 rounded-lg text-white text-[1rem] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="أدخل موقع الطالب"
                disabled={isSubmitting || !isPhoneChecked || existingStudentFound}
                readOnly={existingStudentFound}
              />
              <span className="text-gray-light text-sm mt-1 block flex items-center gap-1">
                <i className="fas fa-map-marker-alt"></i>
                مكان إقامة الطالب
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <i className="fas fa-times"></i>
              <span>إلغاء</span>
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || alreadyEnrolled || !isPhoneChecked}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-plus"></i>
                  <span>{existingStudentFound ? 'إضافة الطالب للمجموعة' : 'إضافة طالب جديد'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </DashboardCard>
    </DashboardLayout>
  );
}
