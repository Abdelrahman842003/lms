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

  // Real-time Phone Validation (Egyptian Style)
  const validatePhone = (val: string) => {
    const phone = val.replace(/[^0-9]/g, '');
    if (!phone) return { error: 'رقم الهاتف مطلوب', isValid: false };
    if (!phone.startsWith('01')) return { error: 'يجب أن يبدأ بـ 01', isValid: false };
    if (!/^01[0125]/.test(phone)) return { error: 'كود الشركة غير صحيح', isValid: false };
    if (phone.length !== 11) return { error: `مطلوب 11 رقم (حالياً ${phone.length})`, isValid: false };
    return { error: '', isValid: true };
  };

  // Real-time Password Validation
  const validatePassword = (val: string) => {
    if (!val) return { error: 'كلمة المرور مطلوبة', isValid: false };
    if (val.length < 6) return { error: 'يجب أن تكون 6 أحرف على الأقل', isValid: false };
    return { error: '', isValid: true };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let val = value;
    
    if (name === 'phone') {
      val = value.replace(/[^0-9]/g, '').slice(0, 11);
      const v = validatePhone(val);
      setValidation(prev => ({ ...prev, phone: v }));
    } else {
      const v = validatePassword(val);
      setValidation(prev => ({ ...prev, password: v }));
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
      const paths: Record<string, string> = { 
        student: '/student/teachers', 
        parent: '/parent/children', 
        academy: '/academy/dashboard' 
      };
      router.push(paths[userType] || (userType === 'secretary' ? '/teacher/dashboard' : `/${userType}/dashboard`));
    } catch (err: any) {
      setIsLoading(false);
      const status = err?.statusCode ?? err?.status;
      if (status === 401) setServerError('بيانات الدخول غير صحيحة، تأكد من الرقم وكلمة المرور');
      else if (status === 429) {
        setIsBanned(true);
        setCountdown(err?.data?.retry_after || 60);
        setServerError('تم حظرك مؤقتاً لكثرة المحاولات');
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
        <div className="flex-1 flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-[#080b14]/50">
          <div className="w-full max-w-[460px] relative">
            {/* Animated Glow behind card */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#3249A9] to-blue-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            
            <div className="relative bg-[#111524]/90 backdrop-blur-2xl border border-white/10 p-6 md:p-10 rounded-[2.2rem] shadow-2xl overflow-hidden">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10 shadow-[inset_0_0_15px_rgba(255,255,255,0.05)]">
                  <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2">تسجيل الدخول</h2>
                <p className="text-gray-400 text-sm md:text-base">مرحباً بك في منصة نيتاق التعليمية</p>
              </div>

              <div className="mb-8">
                <p className="text-right text-[0.8rem] text-gray-500 mb-3 px-1">اختر نوع الحساب:</p>
                <UserTypeSelector userType={userType} onChange={setUserType} />
              </div>

              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {serverError && (
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm animate-shake">
                    <Icon name="exclamation-circle" />
                    <span>{serverError}</span>
                  </div>
                )}

                <div className="space-y-1 group">
                  <div className="flex justify-between items-center px-1">
                    <span className={`text-[0.7rem] ${validation.phone.error ? 'text-red-400' : 'text-gray-500'}`}>
                      {validation.phone.error || (validation.phone.isValid ? 'رقم صحيح ✓' : '')}
                    </span>
                    <label className="text-sm font-medium text-gray-300">رقم الهاتف</label>
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
                      bg-white/[0.03] border-white/10 text-white text-base py-4 rounded-xl
                      focus:bg-white/[0.06] transition-all duration-300
                      ${validation.phone.error ? 'border-red-500/50 focus:border-red-500' : 'focus:border-[#3249A9]'}
                      ${validation.phone.isValid ? 'border-green-500/30' : ''}
                    `}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center px-1">
                     <span className={`text-[0.7rem] ${validation.password.error ? 'text-red-400' : 'text-gray-500'}`}>
                      {validation.password.error || (validation.password.isValid ? 'كلمة مرور مقبولة ✓' : '')}
                    </span>
                    <label className="text-sm font-medium text-gray-300">كلمة المرور</label>
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
                      bg-white/[0.03] border-white/10 text-white text-base py-4 rounded-xl
                      focus:bg-white/[0.06] transition-all duration-300
                      ${validation.password.error ? 'border-red-500/50 focus:border-red-500' : 'focus:border-[#3249A9]'}
                      ${validation.password.isValid ? 'border-green-500/30' : ''}
                    `}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-xs text-gray-400 hover:text-[#3249A9] transition-colors font-medium"
                  >
                    نسيت كلمة السر؟
                  </button>
                </div>

                <Button
                  type="submit"
                  loading={isLoading}
                  disabled={isBanned || (!validation.phone.isValid && formData.phone.length > 0)}
                  className={`
                    w-full py-4 text-white font-bold rounded-2xl transition-all shadow-xl text-base flex items-center justify-center gap-3
                    ${isBanned ? 'bg-gray-700' : 'bg-[#3249A9] hover:bg-[#283d8f] hover:scale-[1.02] active:scale-[0.98] shadow-[#3249A9]/20'}
                  `}
                >
                  {isBanned ? (
                    `انتظر ${countdown} ثانية`
                  ) : (
                    <>
                      <span>دخول المنصة</span>
                      <Icon name="arrow-left" size="sm" />
                    </>
                  )}
                </Button>
              </form>
              
              <div className="mt-8 pt-6 border-t border-white/5 text-center">
                 <p className="text-gray-500 text-xs">
                   تواجه مشكلة؟ <button onClick={() => setIsForgotPasswordOpen(true)} className="text-[#3249A9] hover:underline">تواصل مع الدعم الفني</button>
                 </p>
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
