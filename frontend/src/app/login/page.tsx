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

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (authLoading) return;
    
    if (user) {
      // User is already logged in, redirect to appropriate dashboard
      const dashboardPath = user.userType === 'admin' 
        ? '/admin/dashboard'
        : user.userType === 'secretary' 
          ? '/teacher/dashboard'
          : `/${user.userType}/dashboard`;
      router.replace(dashboardPath);
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Pass userType to login function
      await login(formData.username, formData.password, userType);
      
      // Students go to teacher selection page first
      if (userType === 'student') {
        router.push('/student/teachers');
      } else {
        // Redirect based on user type
        const dashboardPath = userType === 'secretary' ? '/teacher/dashboard' : `/${userType}/dashboard`;
        router.push(dashboardPath);
      }
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول. يرجى التحقق من البيانات والمحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

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

              <form onSubmit={handleSubmit} className="flex flex-col">
                {error && (
                  <div className="flex items-center gap-[10px] p-[12px_16px] bg-[#FF5B5B1A] border border-[#FF5B5B4D] rounded-[10px] text-danger text-[0.9rem]">
                    <i className="fas fa-exclamation-circle text-[1.1rem]"></i>
                    <span>{error}</span>
                  </div>
                )}

                <AuthInput
                  id="username"
                  name="username"
                  label={userType === 'student' || userType === 'teacher' ? 'رقم الهاتف' : 'اسم المستخدم'}
                  placeholder={userType === 'student' || userType === 'teacher' ? 'أدخل رقم الهاتف' : 'أدخل اسم المستخدم'}
                  value={formData.username}
                  onChange={handleInputChange}
                  iconClass={userType === 'student' ? 'fas fa-phone' : 'fas fa-user'}
                  required
                />

                <AuthInput
                  id="password"
                  name="password"
                  type="password"
                  label="كلمة المرور"
                  placeholder="أدخل كلمة المرور"
                  value={formData.password}
                  onChange={handleInputChange}
                  iconClass="fas fa-lock"
                  required
                />

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
