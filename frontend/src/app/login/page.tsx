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

import { Turnstile } from '@marsidev/react-turnstile';

interface ValidationErrors {
  phone?: string;
  password?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isLoading: authLoading } = useAuth();
  const [userType, setUserType] = useState<'teacher' | 'student' | 'secretary'>('teacher');
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ phone: boolean; password: boolean }>({
    phone: false,
    password: false,
  });
  const [isVerified, setIsVerified] = useState(false);

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
    if (name === 'phone') {
      if (!value.trim()) {
        return 'رقم الهاتف مطلوب';
      }
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
    
    const phoneError = validateField('phone', formData.phone);
    const passwordError = validateField('password', formData.password);
    
    if (phoneError) errors.phone = phoneError;
    if (passwordError) errors.password = passwordError;
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Mark all fields as touched
    setTouched({ phone: true, password: true });
    
    // Validate before submit
    if (!validateForm()) {
      return;
    }

    if (!isVerified) {
      setError('يرجى التحقق من أنك لست روبوت');
      return;
    }
    
    setIsLoading(true);

    try {
      await login(formData.phone, formData.password, userType);
      
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
        // Check if there's a specific message for phone (suspension) or general errors
        const specificError = err.errors?.phone?.[0] || err.message;
        setError(specificError || 'البيانات المدخلة غير صحيحة.');
      } else if (err.status === 429) {
        setError('تم تجاوز عدد المحاولات المسموحة. حاول مرة أخرى بعد قليل.');
      } else {
        // Show the actual error message if available, otherwise generic
        setError(err.message || 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // For phone field, only allow numbers and max 11 digits
    if (name === 'phone') {
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
    setTouched({ phone: false, password: false });
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
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    label="رقم الهاتف"
                    placeholder="أدخل رقم الهاتف"
                    value={formData.phone}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    iconClass="fas fa-phone"
                    required
                  />
                  {touched.phone && validationErrors.phone && (
                    <p className="text-danger text-sm mt-1 flex items-center gap-1">
                      <i className="fas fa-exclamation-circle text-xs"></i>
                      {validationErrors.phone}
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

                <div className="my-4 flex justify-center items-center min-h-[65px] w-full bg-white/5 rounded-lg p-2">
                  <Turnstile
                    siteKey="0x4AAAAAAACJEKS0EfFec1vOk"
                    onSuccess={() => setIsVerified(true)}
                    onError={() => setIsVerified(false)}
                    onExpire={() => setIsVerified(false)}
                  />
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

