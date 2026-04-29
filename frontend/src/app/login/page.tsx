'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageTransition } from '@/components/shared/PageTransition';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { UserTypeSelector } from '@/components/auth/UserTypeSelector';
import { Input } from '@/components/ui/Input';
import { Button, ConfirmationModal, Icon } from '@/components/ui';
import { toast } from 'react-hot-toast';
import LandingLayout from '@/components/landing/LandingLayout';

interface ValidationState {
  phone: { error: string; isValid: boolean };
  password: { error: string; isValid: boolean };
}

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isLoading: authLoading } = useAuth();
  const { settings } = useSettings();
  const [userType, setUserType] = useState<'teacher' | 'student' | 'secretary' | 'parent' | 'academy'>('teacher');
  const [formData, setFormData] = useState({ phone: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [validation, setValidation] = useState<ValidationState>({
    phone: { error: '', isValid: false },
    password: { error: '', isValid: false },
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

  const contactAdminNumber = (settings.whatsappNumber || settings.support_phone || '').trim();
  const hasContactNumber = contactAdminNumber.replace(/[^0-9]/g, '').length > 0;

  const validatePhone = (val: string) => {
    const phone = val.replace(/[^0-9]/g, '');
    if (!phone) return { error: 'رقم الهاتف مطلوب', isValid: false };
    if (!phone.startsWith('01')) return { error: 'يجب أن يبدأ بـ 01', isValid: false };
    if (!/^01[0125]/.test(phone)) return { error: 'كود الشركة غير صحيح', isValid: false };
    if (phone.length !== 11) return { error: `مطلوب 11 رقم`, isValid: false };
    return { error: '', isValid: true };
  };

  const validatePassword = (val: string) => {
    if (!val) return { error: 'كلمة المرور مطلوبة', isValid: false };
    if (val.length < 6) return { error: 'ضعيفة جداً', isValid: false };
    return { error: '', isValid: true };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let val = value;
    if (name === 'phone') {
      val = value.replace(/[^0-9]/g, '').slice(0, 11);
      setValidation(prev => ({ ...prev, phone: validatePhone(val) }));
    } else {
      setValidation(prev => ({ ...prev, password: validatePassword(val) }));
    }
    setFormData(prev => ({ ...prev, [name]: val }));
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneV = validatePhone(formData.phone);
    const passV = validatePassword(formData.password);
    setValidation({ phone: phoneV, password: passV });

    if (!phoneV.isValid || !passV.isValid) {
      toast.error('يرجى تصحيح الأخطاء أولاً');
      return;
    }

    setIsLoading(true);
    setServerError('');

    try {
      await login(formData.phone, formData.password, userType);
      const paths: Record<string, string> = { student: '/student/teachers', parent: '/parent/children', academy: '/academy/dashboard' };
      router.push(paths[userType] || (userType === 'secretary' ? '/teacher/dashboard' : `/${userType}/dashboard`));
    } catch (err: any) {
      setIsLoading(false);
      const status = err?.statusCode ?? err?.status;
      if (status === 401) setServerError('بيانات الدخول غير صحيحة');
      else if (status === 429) {
        setIsBanned(true);
        setCountdown(err?.data?.retry_after || 60);
        setServerError('تم حظرك مؤقتاً');
      } else setServerError(err.message || 'حدث خطأ غير متوقع');
    }
  };

  useEffect(() => {
    if (user && !authLoading) {
      const paths: Record<string, string> = { teacher: '/teacher/dashboard', student: '/student/dashboard', academy: '/academy/dashboard', parent: '/parent/children' };
      router.replace(paths[user.userType] || '/');
    }
  }, [user, authLoading]);

  return (
    <LandingLayout>
      <PageTransition>
        <div className="relative min-h-[calc(100vh-200px)] flex items-center justify-center py-16 px-6">
          
          <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Side: Creative Text (Hidden on mobile or centered) */}
            <div className="hidden lg:block text-right space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] text-gray-400 text-sm">
                <span>أهلاً بك مجدداً في نيتاق</span>
              </div>
              <h1 className="text-[3.5rem] font-extrabold leading-[1.1] tracking-tight">
                ابدأ رحلتك
                <br />
                <span className="text-[#3249A9]">التعليمية الآن.</span>
              </h1>
              <p className="text-gray-400 text-xl max-w-[450px] leading-relaxed">
                ادخل إلى عالم من الابتكار، حيث نجمع لك كل ما تحتاجه للنجاح في مكان واحد.
              </p>
            </div>

            {/* Right Side: Integrated Form */}
            <div className="w-full max-w-[480px] mx-auto lg:mr-auto lg:ml-0">
              <div className="space-y-10">
                
                {/* Mobile Heading */}
                <div className="lg:hidden text-center space-y-4 mb-10">
                   <h1 className="text-4xl font-extrabold tracking-tight">
                     ابدأ رحلتك <span className="text-[#3249A9]">الآن</span>
                   </h1>
                </div>

                {/* User Type Selector Area */}
                <div className="space-y-4">
                  <UserTypeSelector userType={userType} onChange={setUserType} />
                </div>

                <form onSubmit={handleSubmit} className="space-y-8" noValidate>
                  {serverError && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                      <Icon name="exclamation-circle" />
                      <span>{serverError}</span>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="space-y-2 group">
                      <div className="flex justify-between items-center px-1">
                        <span className={`text-[0.75rem] font-medium ${validation.phone.error ? 'text-red-400' : 'text-green-500'}`}>
                          {validation.phone.error || (validation.phone.isValid ? '✓ جاهز' : '')}
                        </span>
                        <label className="text-sm font-bold text-gray-400">رقم الهاتف</label>
                      </div>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="01xxxxxxxxx"
                        value={formData.phone}
                        onChange={handleInputChange}
                        icon="fas fa-phone"
                        required
                        className={`
                          bg-transparent border-b-2 border-t-0 border-x-0 border-white/10 rounded-none px-0 py-5 text-xl
                          focus:border-[#3249A9] focus:ring-0 transition-all duration-500
                          ${validation.phone.error ? 'border-red-500/50' : ''}
                        `}
                      />
                    </div>

                    <div className="space-y-2 group">
                      <div className="flex justify-between items-center px-1">
                        <span className={`text-[0.75rem] font-medium ${validation.password.error ? 'text-red-400' : 'text-green-500'}`}>
                          {validation.password.error || (validation.password.isValid ? '✓ جاهز' : '')}
                        </span>
                        <label className="text-sm font-bold text-gray-400">كلمة المرور</label>
                      </div>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleInputChange}
                        icon="fas fa-lock"
                        required
                        className={`
                          bg-transparent border-b-2 border-t-0 border-x-0 border-white/10 rounded-none px-0 py-5 text-xl
                          focus:border-[#3249A9] focus:ring-0 transition-all duration-500
                          ${validation.password.error ? 'border-red-500/50' : ''}
                        `}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(true)}
                      className="text-sm text-gray-500 hover:text-[#3249A9] transition-colors font-bold"
                    >
                      نسيت كلمة السر؟
                    </button>
                  </div>

                  <Button
                    type="submit"
                    loading={isLoading}
                    disabled={isBanned}
                    className={`
                      w-full py-5 text-white font-black rounded-2xl transition-all shadow-[0_20px_40px_rgba(50,73,169,0.2)] text-lg
                      ${isBanned ? 'bg-gray-800' : 'bg-[#3249A9] hover:bg-[#283d8f] hover:-translate-y-1 active:translate-y-0'}
                    `}
                  >
                    {isBanned ? `انتظر ${countdown} ثانية` : 'دخول المنصة'}
                  </Button>
                </form>

                <div className="text-center">
                   <p className="text-gray-500 text-sm">
                     تحتاج مساعدة؟ <button onClick={() => setIsForgotPasswordOpen(true)} className="text-[#3249A9] font-bold hover:underline">تواصل معنا</button>
                   </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </PageTransition>

      <ConfirmationModal
        isOpen={isForgotPasswordOpen}
        title="استرجاع الحساب"
        message={
          <div className="text-right text-sm leading-relaxed text-gray-300">
            عزيزي {audienceByUserType[userType]}، لتغيير كلمة المرور يرجى التواصل مع إدارة المنصة مباشرة عبر الواتساب.
            {hasContactNumber && (
              <div className="mt-4 p-4 rounded-2xl bg-[#3249A9]/10 border border-[#3249A9]/20 font-bold text-[#3249A9] text-center text-lg">
                {contactAdminNumber}
              </div>
            )}
          </div>
        }
        confirmText="تواصل واتساب"
        cancelText="إغلاق"
        onConfirm={() => {
           if (hasContactNumber) {
             const msg = `السلام عليكم، أنا ${audienceByUserType[userType]} وأحتاج مساعدة في الدخول لحسابي.`;
             window.open(`https://wa.me/${contactAdminNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
           }
           setIsForgotPasswordOpen(false);
        }}
        onCancel={() => setIsForgotPasswordOpen(false)}
        showCancel
        variant="primary"
      />
    </LandingLayout>
  );
}
