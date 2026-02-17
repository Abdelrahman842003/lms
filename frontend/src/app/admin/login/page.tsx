'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageTransition } from '@/components/shared/PageTransition';

import { LoginContainer } from '@/components/auth/LoginContainer';
import { LoginCard } from '@/components/auth/LoginCard';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';
import { getAuthToken } from '@/services/authService';

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [validationErrors, setValidationErrors] = useState<{ username?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ username: boolean; password: boolean }>({
    username: false,
    password: false,
  });

  // Check if admin is already logged in
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = getAuthToken();
        const userType = localStorage.getItem('userType');
        
        if (token && userType === 'admin') {
          // Admin is already logged in, redirect to dashboard
          router.replace('/admin/dashboard');
        } else {
          setIsCheckingAuth(false);
        }
      } catch (error) {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, [router]);

  // Show loading while checking auth
  if (isCheckingAuth) {
    return null;
  }

  // Real-time validation function
  const validateField = (name: string, value: string): string | undefined => {
    if (name === 'username') {
      if (!value.trim()) {
        return 'اسم المستخدم مطلوب';
      }
      if (value.length < 3) {
        return `اسم المستخدم قصير (${value.length}/3 أحرف)`;
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
    const errors: { username?: string; password?: string } = {};
    
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

      // Import loginAdmin from authService
      const { loginAdmin } = await import('@/services/authService');

      
      const response = await loginAdmin(formData.username, formData.password);

      
      // Store token and user data
      localStorage.setItem('token', response.token);
      localStorage.setItem('userType', 'admin');
      localStorage.setItem('user', JSON.stringify({
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        username: response.user.username,
        userType: 'admin',
        createdAt: response.user.created_at || new Date().toISOString(),
        updatedAt: response.user.updated_at || new Date().toISOString(),
      }));

      
      // Redirect to admin dashboard
      window.location.href = '/admin/dashboard';
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول. يرجى التحقق من البيانات والمحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear general error when user types
    if (error) setError('');
    
    // Real-time validation
    const fieldError = validateField(name, value);
    setValidationErrors(prev => ({
      ...prev,
      [name]: fieldError,
    }));
    
    // Mark as touched when user starts typing
    if (value.length > 0) {
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

  return (
    <>
      <PageTransition>
        <LoginContainer>
          <div className="login-wrapper">
            <LoginCard
              title="تسجيل دخول المدير"
              subtitle="سجل دخولك لإدارة النظام"
              icon={<i className="fas fa-shield-alt text-[2.5rem] text-white"></i>}
            >
              <form onSubmit={handleSubmit} className="flex flex-col">
                {error && (
                  <div className="flex items-center gap-[10px] p-[12px_16px] bg-[#FF5B5B1A] border border-[#FF5B5B4D] rounded-[10px] text-danger text-[0.9rem]">
                    <i className="fas fa-exclamation-circle text-[1.1rem]"></i>
                    <span>{error}</span>
                  </div>
                )}

                <div className="mb-4">
                  <AuthInput
                    id="username"
                    name="username"
                    label="اسم المستخدم"
                    placeholder="أدخل اسم المستخدم"
                    value={formData.username}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    iconClass="fas fa-user"
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
