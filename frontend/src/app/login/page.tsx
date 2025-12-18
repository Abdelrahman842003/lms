'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageTransition } from '@/components/shared/PageTransition';
import { useAuth } from '@/contexts/AuthContext';
import { LoginContainer } from '@/components/auth/LoginContainer';
import { LoginCard } from '@/components/auth/LoginCard';
import { UserTypeSelector } from '@/components/auth/UserTypeSelector';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';

interface ValidationErrors {
  username?: string;
  password?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isLoading: authLoading } = useAuth();
  const [userType, setUserType] = useState<'teacher' | 'student' | 'secretary'>('teacher');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ username: boolean; password: boolean }>({
    username: false,
    password: false,
  });

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (authLoading) return;
    
    if (user) {
      const dashboardPath = user.userType === 'admin' 
        ? '/admin/dashboard'
        : user.userType === 'secretary' 
          ? '/teacher/dashboard'
          : `/${user.userType}/dashboard`;
      router.replace(dashboardPath);
    }
  }, [user, authLoading, router]);

  // Validation function - Real-time Egyptian phone validation
  const validateField = (name: string, value: string): string | undefined => {
    if (name === 'username') {
      if (!value.trim()) {
        return userType === 'secretary' ? 'اسم المستخدم مطلوب' : 'رقم الهاتف مطلوب';
      }
      // Phone number validation for teacher/student
      if (userType !== 'secretary') {
        // Egyptian phone must start with 01
        if (value.length > 0 && !value.startsWith('0')) {
          return 'رقم الهاتف يجب أن يبدأ بـ 0';
        }
        if (value.length > 1 && !value.startsWith('01')) {
          return 'رقم الهاتف يجب أن يبدأ بـ 01';
        }
        // Check operator code (010, 011, 012, 015)
        if (value.length > 2 && !/^01[0125]/.test(value)) {
          return 'كود الشركة غير صحيح (010, 011, 012, 015)';
        }
        // Check if complete and valid
        if (value.length > 0 && value.length < 11) {
          return `رقم الهاتف غير مكتمل (${value.length}/11 رقم)`;
        }
        if (value.length > 11) {
          return 'رقم الهاتف أكثر من 11 رقم';
        }
      } else {
        // Username validation for secretary
        if (value.trim().length < 3) {
          return 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
        }
      }
    }
    
    if (name === 'password') {
      if (!value) {
        return 'كلمة المرور مطلوبة';
      }
      if (value.length < 6) {
        return `كلمة المرور قصيرة (${value.length}/6 أحرف)`;
      }
    }
    
    return undefined;
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    const usernameError = validateField('username', formData.username);
    const passwordError = validateField('password', formData.password);
    
    if (usernameError) errors.username = usernameError;
    if (passwordError) errors.password = passwordError;
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Mark all fields as touched
    setTouched({ username: true, password: true });
    
    // Validate before submit
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      await login(formData.username, formData.password, userType);
      
      // Keep loading active - don't set to false, let navigation happen
      if (userType === 'student') {
        router.push('/student/teachers');
      } else {
        const dashboardPath = userType === 'secretary' ? '/teacher/dashboard' : `/${userType}/dashboard`;
        router.push(dashboardPath);
      }
      // Don't set isLoading to false here - keep it loading until page changes
    } catch (err: any) {
      // Only stop loading on error
      setIsLoading(false);
      
      // Show user-friendly error message
      if (err.status === 401) {
        setError('بيانات الدخول غير صحيحة. تأكد من رقم الهاتف وكلمة المرور.');
      } else if (err.status === 422) {
        setError('البيانات المدخلة غير صحيحة.');
      } else if (err.status === 429) {
        setError('تم تجاوز عدد المحاولات المسموحة. حاول مرة أخرى بعد قليل.');
      } else {
        setError('فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // For phone field (teacher/student), only allow numbers and max 11 digits
    if (name === 'username' && userType !== 'secretary') {
      processedValue = value.replace(/[^0-9]/g, '').slice(0, 11);
    }
    
    setFormData({
      ...formData,
      [name]: processedValue,
    });
    
    // Clear general error when user types
    if (error) setError('');
    
    // Real-time validation - always validate on change
    const fieldError = validateField(name, processedValue);
    setValidationErrors(prev => ({
      ...prev,
      [name]: fieldError,
    }));
    
    // Mark as touched when user starts typing
    if (processedValue.length > 0) {
      setTouched(prev => ({ ...prev, [name]: true }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const fieldError = validateField(name, value);
    setValidationErrors(prev => ({
      ...prev,
      [name]: fieldError,
    }));
  };

  // Prevent non-numeric input for phone field
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, arrows
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    
    if (allowedKeys.includes(e.key)) {
      return;
    }
    
    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (e.ctrlKey || e.metaKey) {
      return;
    }
    
    // Block any non-numeric key
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  // Reset validation when user type changes
  useEffect(() => {
    setValidationErrors({});
    setTouched({ username: false, password: false });
    setError('');
  }, [userType]);

  return (
    <>
      <PageTransition>
        <LoginContainer>
          <div className="login-wrapper">
            <LoginCard
              title={
                userType === 'teacher' ? 'مرحبا بك مدرسي العزيز' :
                userType === 'student' ? 'مرحبا بك طالبي العزيز' :
                'مرحبا بك سكرتيري العزيز'
              }
              subtitle="سجل دخولك لإدارة فصولك الدراسية"
              icon={<img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />}
            >
              <UserTypeSelector userType={userType} onChange={setUserType} />

              <form onSubmit={handleSubmit} className="flex flex-col" noValidate>
                {error && (
                  <div className="flex items-center gap-[10px] p-[12px_16px] bg-[#FF5B5B1A] border border-[#FF5B5B4D] rounded-[10px] text-danger text-[0.9rem] mb-4">
                    <i className="fas fa-exclamation-circle text-[1.1rem]"></i>
                    <span>{error}</span>
                  </div>
                )}

                <div className="mb-4">
                  <AuthInput
                    id="username"
                    name="username"
                    type={userType !== 'secretary' ? 'tel' : 'text'}
                    inputMode={userType !== 'secretary' ? 'numeric' : 'text'}
                    pattern={userType !== 'secretary' ? '[0-9]*' : undefined}
                    label={userType === 'student' || userType === 'teacher' ? 'رقم الهاتف' : 'اسم المستخدم'}
                    placeholder={userType === 'student' || userType === 'teacher' ? 'أدخل رقم الهاتف' : 'أدخل اسم المستخدم'}
                    value={formData.username}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    onKeyDown={userType !== 'secretary' ? handleKeyDown : undefined}
                    iconClass={userType === 'student' ? 'fas fa-phone' : 'fas fa-user'}
                    required
                  />
                  {touched.username && validationErrors.username && (
                    <p className="text-danger text-sm mt-1 flex items-center gap-1">
                      <i className="fas fa-exclamation-circle text-xs"></i>
                      {validationErrors.username}
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <AuthInput
                    id="password"
                    name="password"
                    type="password"
                    label="كلمة المرور"
                    placeholder="أدخل كلمة المرور"
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    iconClass="fas fa-lock"
                    required
                  />
                  {touched.password && validationErrors.password && (
                    <p className="text-danger text-sm mt-1 flex items-center gap-1">
                      <i className="fas fa-exclamation-circle text-xs"></i>
                      {validationErrors.password}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center -mt-[5px]">
                  <label className="flex items-center gap-2 cursor-pointer text-[0.9rem] text-[#E9ECEF]">
                    <input type="checkbox" className="w-[18px] h-[18px] cursor-pointer accent-primary" />
                    <span>تذكرني</span>
                  </label>
                </div>

                <AuthButton isLoading={isLoading} loadingText="جاري تسجيل الدخول...">
                  <span>تسجيل الدخول</span>
                  <i className="fas fa-arrow-left text-[1rem]"></i>
                </AuthButton>
              </form>
            </LoginCard>
          </div>
        </LoginContainer>
      </PageTransition>
    </>
  );
}

