'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { Filter } from '@/components/Filter';
import { useAuth } from '@/contexts/AuthContext';
import { createAcademyStudent, searchAcademyStudentByPhone, getGrades, getGroups, getTeachers } from '@/services/academyService';
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
  const [teachers, setTeachers] = useState<any[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [isPhoneChecked, setIsPhoneChecked] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [existingStudentFound, setExistingStudentFound] = useState(false);
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    parent_phone: '',
    gender: 'male',
    education_type: '',
    teacher_id: '',
    grade_id: '',
    group_id: '',
    location: '',
  });
  const [parentName, setParentName] = useState('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Extract parent name from student name (last 2 words)
  const extractParentName = (studentName: string): string => {
    const trimmedName = studentName.trim();
    if (!trimmedName) return '';
    
    const words = trimmedName.split(/\s+/);
    if (words.length === 1) return words[0];
    if (words.length === 2) return words[1];
    
    // Take last 2 words for names with 3+ words
    return words.slice(-2).join(' ');
  };

  // Auto-update parent name when student name changes
  useEffect(() => {
    setParentName(extractParentName(formData.name));
  }, [formData.name]);

  // Calculate password strength
  const getPasswordStrength = (password: string): { level: 'weak' | 'medium' | 'strong'; text: string; color: string } => {
    if (!password) return { level: 'weak', text: '', color: '' };
    
    let strength = 0;
    
    // Length check
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    
    // Contains number
    if (/\d/.test(password)) strength++;
    
    // Contains letter
    if (/[a-zA-Zء-ي]/.test(password)) strength++;
    
    // Contains special character or mixed case
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password) || /[A-Z]/.test(password)) strength++;
    
    if (strength <= 2) return { level: 'weak', text: 'ضعيفة', color: 'text-red-500' };
    if (strength <= 3) return { level: 'medium', text: 'متوسطة', color: 'text-yellow-500' };
    return { level: 'strong', text: 'قوية', color: 'text-green-500' };
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const isPasswordWeak = Boolean(!existingStudentFound && formData.password && passwordStrength.level === 'weak');

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await getTeachers();
        // Extract teachers from response
        const teachersData = response?.data?.data || response?.data || [];
        setTeachers(teachersData);
      } catch (error) {
        console.error('Error fetching teachers:', error);
      }
    };
    fetchTeachers();
  }, []);

  // Fetch Grades when Teacher changes
  useEffect(() => {
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
  }, [formData.teacher_id]);

  // Fetch Groups when Grade changes
  useEffect(() => {
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
  }, [formData.grade_id]);

  // Filter groups based on selected grade (already handled by useEffect, but keeping for safety if groups contains more)
  const filteredGroups = groups;

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
      const result = await searchAcademyStudentByPhone(phone);
      
      // The API returns { status: true, data: { found: true, ... } }
      // So we need to check result.data.found
      const searchData = result.data || {};
      
      if (searchData.found) {
        setExistingStudentFound(true);
        setAlreadyEnrolled(searchData.already_enrolled);
        setIsPhoneChecked(true); // Valid check
        
        // Auto-fill data
        setFormData(prev => ({
          ...prev,
          name: searchData.student.name,
          parent_phone: searchData.student.parent_phone || '',
          gender: searchData.student.gender || 'male',
          education_type: searchData.student.education_type || '',
          grade_id: searchData.student.grade_id || '', // Auto-fill grade
          teacher_id: '', // Reset teacher to force selection? Or try to deduce?
          group_id: '', // Always clear group for teacher to select
          location: searchData.student.location || '',
          phone: phone,
        }));
        
        if (searchData.already_enrolled) {
          setFormErrors({ phone: 'هذا الطالب مسجل بالفعل' });
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

    // Password is required only for new students
    if (!existingStudentFound && !formData.password.trim()) {
      errors.password = 'كلمة المرور مطلوبة';
    } else if (!existingStudentFound && formData.password.length < 6) {
      errors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    } else if (!existingStudentFound && passwordStrength.level === 'weak') {
      errors.password = 'كلمة المرور ضعيفة جداً - أضف أرقام وأحرف';
    }

    if (!formData.gender) {
      errors.gender = 'النوع مطلوب';
    }

    // Additional fields required for new students
    if (!existingStudentFound) {
      if (!formData.parent_phone.trim()) {
        errors.parent_phone = 'رقم ولي الأمر مطلوب';
      } else if (!/^01[0125][0-9]{8}$/.test(formData.parent_phone)) {
        errors.parent_phone = 'رقم ولي الأمر يجب أن يكون رقم مصري صحيح';
      }

      if (!formData.education_type) {
        errors.education_type = 'نوع التعليم مطلوب';
      }

      if (!formData.teacher_id) {
        errors.teacher_id = 'المدرس مطلوب';
      }

      if (!formData.grade_id) {
        errors.grade_id = 'الصف الدراسي مطلوب';
      }

      if (!formData.group_id) {
        errors.group_id = 'المجموعة مطلوبة';
      }

      // Location is optional
      // if (!formData.location.trim()) {
      //   errors.location = 'الموقع مطلوب';
      // }
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
      const submitData: Record<string, any> = {
        name: formData.name,
        phone: formData.phone,
        gender: formData.gender,
      };
      
      // Add password only for new students
      if (!existingStudentFound && formData.password) {
        submitData.password = formData.password;
      }
      
      // Only add optional fields if they have values
      if (formData.parent_phone) submitData.parent_phone = formData.parent_phone;
      if (parentName) submitData.parent_name = parentName; // Send guardian name
      if (formData.education_type) submitData.education_type = formData.education_type;
      if (formData.teacher_id) submitData.teacher_id = formData.teacher_id;
      if (formData.grade_id) submitData.grade_id = formData.grade_id;
      if (formData.group_id) submitData.group_id = formData.group_id;
      if (formData.location) submitData.location = formData.location;

      console.log('Submitting student data:', submitData);
      
      await createAcademyStudent(submitData);
      setSuccessMessage('تم إضافة الطالب بنجاح!');
      
      // Redirect to students list after 1.5 seconds
      setTimeout(() => {
        router.push('/academy/students');
      }, 1500);
    } catch (error: any) {
      console.error('Failed to create student:', error);
      console.error('Error status:', error.status);
      console.error('Error message:', error.message);
      const errorMessage = error.message || 'حدث خطأ أثناء إضافة الطالب';
      setFormErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/academy/students');
  };

  return (
    <DashboardLayout
      role="academy"
      user={{
        name: user?.name || 'الأكاديمية',
        avatar: user?.avatar || '',
      }}
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
              <span>هذا الطالب مسجل بالفعل.</span>
            </div>
          )}

          {/* Missing Required Fields Alert */}
          {!existingStudentFound && Object.keys(formErrors).length > 0 && Object.keys(formErrors).some(k => ['education_type', 'grade_id', 'group_id', 'parent_phone', 'password'].includes(k)) && (
            <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-2 mb-2">
                <i className="fas fa-info-circle text-lg"></i>
                <span className="font-bold">يرجى استكمال البيانات التالية:</span>
              </div>
              <ul className="list-disc list-inside text-sm space-y-1 mr-6">
                {formErrors.password && <li>{formErrors.password}</li>}
                {formErrors.parent_phone && <li>رقم ولي الأمر مطلوب</li>}
                {formErrors.education_type && <li>نوع التعليم مطلوب (عام / أزهري)</li>}
                {formErrors.teacher_id && <li>المدرس مطلوب</li>}
                {formErrors.grade_id && <li>الصف الدراسي مطلوب</li>}
                {formErrors.group_id && <li>المجموعة مطلوبة</li>}
              </ul>
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

            {/* Auto-extracted Parent Name - Editable */}
            {!existingStudentFound && parentName && (
              <div className="md:col-span-2">
                <label htmlFor="parent_name" className="block text-gray-light mb-2 text-[0.95rem]">
                  اسم ولي الأمر <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="parent_name"
                  className={`w-full p-3 bg-transparent border rounded-lg text-white text-[1rem] focus:ring-1 outline-none transition-all ${
                    formErrors.parent_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-primary focus:ring-primary'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="اسم ولي الأمر الكامل"
                  disabled={isSubmitting || !isPhoneChecked}
                />
                <span className="text-gray-light text-sm mt-1 block flex items-center gap-1">
                  <i className="fas fa-info-circle"></i>
                  تم استخراج الاسم تلقائياً - يمكنك تعديله
                </span>
              </div>
            )}

            <div>
              <label htmlFor="parent_phone" className="block text-gray-light mb-2 text-[0.95rem]">
                رقم هاتف ولي الأمر {!existingStudentFound && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                id="parent_phone"
                className={`w-full p-3 bg-transparent border rounded-lg text-white text-[1rem] focus:ring-1 outline-none transition-all ${
                  formErrors.parent_phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-primary focus:ring-primary'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
                value={formData.parent_phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setFormData({ ...formData, parent_phone: value });
                }}
                placeholder="010xxxxxxxx"
                disabled={isSubmitting || !isPhoneChecked || existingStudentFound}
                readOnly={existingStudentFound}
              />
              {formErrors.parent_phone && <span className="text-red-500 text-sm mt-1 block">{formErrors.parent_phone}</span>}
            </div>



            {/* Password Field - Only show for new students */}
            {!existingStudentFound && (
              <div>
                <label htmlFor="password" className="block text-gray-light mb-2 text-[0.95rem]">
                  كلمة المرور (للطالب و ولي الأمر) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className={`w-full p-3 pe-12 bg-transparent border rounded-lg text-white text-[1rem] focus:ring-1 outline-none transition-all ${
                      formErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-primary focus:ring-primary'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="أدخل كلمة المرور للطالب"
                    disabled={isSubmitting || !isPhoneChecked}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-light hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-lg`}></i>
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      <div className={`h-1 flex-1 rounded ${passwordStrength.level === 'weak' ? 'bg-red-500' : passwordStrength.level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                      <div className={`h-1 flex-1 rounded ${passwordStrength.level === 'medium' || passwordStrength.level === 'strong' ? (passwordStrength.level === 'medium' ? 'bg-yellow-500' : 'bg-green-500') : 'bg-white/10'}`}></div>
                      <div className={`h-1 flex-1 rounded ${passwordStrength.level === 'strong' ? 'bg-green-500' : 'bg-white/10'}`}></div>
                    </div>
                    <span className={`text-sm ${passwordStrength.color}`}>
                      كلمة المرور: {passwordStrength.text}
                    </span>
                  </div>
                )}
                
                {formErrors.password && <span className="text-red-500 text-sm mt-1 block">{formErrors.password}</span>}
                
                {/* Shared Password Info */}
                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-3 rounded-lg mt-2 text-sm flex items-start gap-2">
                  <i className="fas fa-info-circle mt-0.5"></i>
                  <span>سيتم استخدام نفس كلمة المرور لحساب الطالب وولي الأمر</span>
                </div>
                
                {/* Password Requirements */}
                <div className="text-gray-light text-xs mt-2 space-y-1">
                  <p className={formData.password.length >= 6 ? 'text-green-500' : ''}>
                    <i className={`fas ${formData.password.length >= 6 ? 'fa-check' : 'fa-circle'} me-1 text-[0.5rem]`}></i>
                    6 أحرف على الأقل
                  </p>
                  <p className={/\d/.test(formData.password) ? 'text-green-500' : ''}>
                    <i className={`fas ${/\d/.test(formData.password) ? 'fa-check' : 'fa-circle'} me-1 text-[0.5rem]`}></i>
                    تحتوي على أرقام
                  </p>
                  <p className={/[a-zA-Z\u0621-\u064a]/.test(formData.password) ? 'text-green-500' : ''}>
                    <i className={`fas ${/[a-zA-Z\u0621-\u064a]/.test(formData.password) ? 'fa-check' : 'fa-circle'} me-1 text-[0.5rem]`}></i>
                    تحتوي على أحرف
                  </p>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="gender" className="block text-gray-light mb-2 text-[0.95rem]">
                النوع <span className="text-red-500">*</span>
              </label>
              <Filter
                options={[
                  { value: 'male', label: 'ذكر' },
                  { value: 'female', label: 'أنثى' }
                ]}
                value={formData.gender}
                onChange={(value) => setFormData({ ...formData, gender: value })}
                placeholder="اختر النوع"
                className={formErrors.gender ? 'border-red-500' : ''}
                disabled={isSubmitting || !isPhoneChecked || existingStudentFound}
              />
              {formErrors.gender && <span className="text-red-500 text-sm mt-1 block">{formErrors.gender}</span>}
            </div>

            <div>
              <label htmlFor="education_type" className="block text-gray-light mb-2 text-[0.95rem]">
                نوع التعليم {!existingStudentFound && <span className="text-red-500">*</span>}
              </label>
              <Filter
                options={[
                  { value: 'general', label: 'عام' },
                  { value: 'azhar', label: 'أزهري' }
                ]}
                value={formData.education_type}
                onChange={(value) => setFormData({ ...formData, education_type: value })}
                placeholder="اختر نوع التعليم"
                className={formErrors.education_type ? 'border-red-500' : ''}
                disabled={isSubmitting || !isPhoneChecked || existingStudentFound}
              />
              {formErrors.education_type && <span className="text-red-500 text-sm mt-1 block"><i className="fas fa-exclamation-circle ml-1"></i>{formErrors.education_type}</span>}
            </div>

            <div>
              <label htmlFor="teacher_id" className="block text-gray-light mb-2 text-[0.95rem]">المدرس {!existingStudentFound && <span className="text-red-500">*</span>}</label>
              <Filter
                options={teachers.map(t => ({ value: t.id, label: t.name }))}
                value={formData.teacher_id}
                onChange={(value) => setFormData({ ...formData, teacher_id: value })}
                placeholder="اختر المدرس"
                className={formErrors.teacher_id ? 'border-red-500' : ''}
                disabled={isSubmitting || !isPhoneChecked}
              />
              {formErrors.teacher_id && <span className="text-red-500 text-sm mt-1 block"><i className="fas fa-exclamation-circle ml-1"></i>{formErrors.teacher_id}</span>}
            </div>

            <div>

              <label htmlFor="grade_id" className="block text-gray-light mb-2 text-[0.95rem]">الصف الدراسي {!existingStudentFound && <span className="text-red-500">*</span>}</label>
              <Filter
                options={grades.filter(g => g?.id).map(g => ({ value: g.id.toString(), label: g.name }))}
                value={formData.grade_id}
                onChange={(value) => setFormData({ ...formData, grade_id: value, group_id: '' })}
                placeholder={!formData.teacher_id ? 'اختر المدرس أولاً' : 'اختر الصف الدراسي'}
                className={formErrors.grade_id ? 'border-red-500' : ''}
                disabled={isSubmitting || !isPhoneChecked || !formData.teacher_id}
              />
              {formErrors.grade_id && <span className="text-red-500 text-sm mt-1 block"><i className="fas fa-exclamation-circle ml-1"></i>{formErrors.grade_id}</span>}
            </div>

            <div>

              <label htmlFor="group_id" className="block text-gray-light mb-2 text-[0.95rem]">المجموعة {!existingStudentFound && <span className="text-red-500">*</span>}</label>
              <Filter
                options={filteredGroups.filter(g => g?.id).map(g => ({ value: g.id.toString(), label: g.name }))}
                value={formData.group_id}
                onChange={(value) => setFormData({ ...formData, group_id: value })}
                placeholder={!formData.grade_id 
                  ? 'اختر الصف الدراسي أولاً' 
                  : filteredGroups.length === 0 
                    ? 'لا توجد مجموعات لهذا الصف' 
                    : 'اختر المجموعة'}
                className={formErrors.group_id ? 'border-red-500' : ''}
                disabled={isSubmitting || !isPhoneChecked || !formData.grade_id}
              />
              {formErrors.group_id && <span className="text-red-500 text-sm mt-1 block"><i className="fas fa-exclamation-circle ml-1"></i>{formErrors.group_id}</span>}
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
                className={`w-full p-3 bg-transparent border rounded-lg text-white text-[1rem] focus:ring-1 outline-none transition-all ${
                  formErrors.location ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-primary focus:ring-primary'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="أدخل موقع الطالب"
                disabled={isSubmitting || !isPhoneChecked || existingStudentFound}
                readOnly={existingStudentFound}
              />
              {formErrors.location && <span className="text-red-500 text-sm mt-1 block">{formErrors.location}</span>}
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
              disabled={isSubmitting || alreadyEnrolled || !isPhoneChecked || isPasswordWeak}
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
