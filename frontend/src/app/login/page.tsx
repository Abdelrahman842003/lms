'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageTransition } from '@/components/shared/PageTransition';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { LoginContainer } from '@/components/auth/LoginContainer';
import { LoginCard } from '@/components/auth/LoginCard';
import { UserTypeSelector } from '@/components/auth/UserTypeSelector';
import { Input } from '@/components/ui/Input';
import { Button, ConfirmationModal, Icon } from '@/components/ui';

interface ValidationErrors {
  phone?: string;
  password?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isLoading: authLoading } = useAuth();
  const [userType, setUserType] = useState<'teacher' | 'student' | 'secretary' | 'parent' | 'academy'>('teacher');
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
  const [countdown, setCountdown] = useState<number>(0);
  const [isBanned, setIsBanned] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const audienceByUserType: Record<typeof userType, string> = {
    teacher: 'مدرسي العزيز',
    student: 'طالبي العزيز',
    secretary: 'سكرتيري العزيز',
    parent: 'ولي الأمر العزيز',
    academy: 'إدارة الأكاديمية',
  };


  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (authLoading) return;
    
    if (user) {
      const dashboardByRole: Record<string, string> = {
        teacher: '/teacher/dashboard',
        student: '/student/dashboard',
        secretary: '/teacher/dashboard',
        parent: '/parent/children',
        academy: '/academy/dashboard',
      };

      const dashboardPath = dashboardByRole[user.userType];

      // Guard against unsupported/legacy roles (e.g. admin) that don't exist in Next frontend routes.
      if (dashboardPath) {
        router.replace(dashboardPath);
      }
    }
  }, [user, authLoading, router]);

  // Countdown timer for ban
  useEffect(() => {
    if (!isBanned || countdown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsBanned(false);
          setError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBanned]); // Run when isBanned changes to true

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
    
    setIsLoading(true);

    try {
      await login(formData.phone, formData.password, userType);
      
      // Keep loading active - don't set to false, let navigation happen
      if (userType === 'student') {
        router.push('/student/teachers');
      } else if (userType === 'parent') {
        router.push('/parent/children');
      } else if (userType === 'academy') {
        router.push('/academy/dashboard');
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
        // Check if there are remaining attempts info
        const attemptsRemaining = err.data?.attempts_remaining;
        if (attemptsRemaining !== undefined) {
          setError(`بيانات الدخول غير صحيحة - متبقي ${attemptsRemaining} محاولات`);
        } else {
          setError('بيانات الدخول غير صحيحة. تأكد من رقم الهاتف وكلمة المرور.');
        }
        
        // Notify if device was removed
        if (err.data?.device_removed) {
          setError(prev => prev + '\n(تم تسجيل خروجك من جهاز قديم)');
        }
      } else if (err.status === 422) {
        // Check if there's a specific message for phone (suspension) or general errors
        const specificError = err.errors?.phone?.[0] || err.message;
        setError(specificError || 'البيانات المدخلة غير صحيحة.');
      } else if (err.status === 429) {
        // Handle login ban with countdown
        const retryAfter = Math.max(0, err.data?.retry_after || 60);
        if (retryAfter > 0) {
          setIsBanned(true);
          setCountdown(retryAfter);
        }
        setError(`تم حظرك مؤقتاً بسبب محاولات تسجيل دخول فاشلة متعددة`);
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
                userType === 'academy' ? 'مرحبا بك في الأكاديمية' :
                userType === 'parent' ? 'مرحبا بك ولي الأمر العزيز' :
                'مرحبا بك سكرتيري العزيز'
              }
              subtitle="سجل دخولك لإدارة فصولك الدراسية"
              icon={<img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />}
            >
              <UserTypeSelector userType={userType} onChange={setUserType} />

              <form onSubmit={handleSubmit} className="flex flex-col" noValidate>
                {error && (
                  <div className={`flex items-center gap-[10px] p-[12px_16px] rounded-[10px] text-[0.9rem] mb-4 ${
                    isBanned
                      ? 'bg-[#FF8C001A] border border-[#FF8C004D] text-[#FF8C00]'
                      : 'bg-[#FF5B5B1A] border border-[#FF5B5B4D] text-danger'
                  }`}>
                    <Icon name={isBanned ? 'clock' : 'exclamation-circle'} size="md" className="text-[1.1rem]" />
                    <div className="flex flex-col">
                      <span>{error}</span>
                      {isBanned && countdown > 0 && (
                        <span className="text-[0.85rem] mt-1 font-semibold">
                          يمكنك المحاولة مرة أخرى بعد: {countdown} ثانية
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <Input
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
                    icon="fas fa-phone"
                    required
                    wrapperClassName="mb-0"
                  />
                  {touched.phone && validationErrors.phone && (
                    <p className="text-danger text-sm mt-1 flex items-center gap-1">
                      <Icon name="exclamation-circle" size="xs" />
                      {validationErrors.phone}
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    label="كلمة المرور"
                    placeholder="أدخل كلمة المرور"
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    icon="fas fa-lock"
                    required
                    wrapperClassName="mb-0"
                  />
                  {touched.password && validationErrors.password && (
                    <p className="text-danger text-sm mt-1 flex items-center gap-1">
                      <Icon name="exclamation-circle" size="xs" />
                      {validationErrors.password}
                    </p>
                  )}
                </div>

                <div className="flex justify-end items-center -mt-[5px] mb-1">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-[0.9rem] text-[#C8D1E4] hover:text-white transition-colors"
                  >
                    نسيت كلمة السر؟
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isLoading}
                  disabled={isBanned}
                  className="flex items-center justify-center gap-[10px] p-4 bg-primary text-white border-none rounded-[12px] text-[1.05rem] font-bold font-tajawal cursor-pointer transition-all duration-300 mt-[10px] shadow-[0_5px_15px_rgba(66,99,235,0.3)] hover:bg-[#4263eb]/90 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(66,99,235,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isBanned ? (
                    <>
                      <Icon name="clock" size="md" className="text-[1rem]" />
                      <span>انتظر {countdown} ثانية</span>
                    </>
                  ) : (
                    <>
                      <span>تسجيل الدخول</span>
                      <Icon name="arrow-left" size="md" className="text-[1rem]" />
                    </>
                  )}
                </Button>
              </form>
            </LoginCard>
          </div>
        </LoginContainer>
      </PageTransition>

      <ConfirmationModal
        isOpen={isForgotPasswordOpen}
        title="استرجاع كلمة المرور"
        message={
          <p className="leading-7">
            عزيزي {audienceByUserType[userType]}،
            <br />
            يرجى التواصل مع إدارة المنصة لتغيير كلمة المرور الخاصة بك.
            <br />
            شكرًا لتفهمك.
          </p>
        }
        confirmText="تم"
        onConfirm={() => setIsForgotPasswordOpen(false)}
        onCancel={() => setIsForgotPasswordOpen(false)}
        showCancel={false}
        variant="primary"
      />
    </>
  );
}
