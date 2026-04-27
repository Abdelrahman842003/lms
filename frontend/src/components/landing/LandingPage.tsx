'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/services/authService';
import LandingNavbar from './LandingNavbar';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { LoginContainer } from '@/components/auth/LoginContainer';
import { LoginCard } from '@/components/auth/LoginCard';
import { UserTypeSelector } from '@/components/auth/UserTypeSelector';
import { Input } from '@/components/ui/Input';
import { Button, ConfirmationModal, Icon } from '@/components/ui';
import { toast } from 'react-hot-toast';

export default function LandingPage() {
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'login' | null>(null);
  const router = useRouter();

  // Login related state
  const { login, user, isLoading: authLoading } = useAuth();
  const { settings } = useSettings();
  const [userType, setUserType] = useState<'teacher' | 'student' | 'secretary' | 'parent' | 'academy'>('teacher');
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<any>({});
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

  const contactAdminNumber = (
    settings.whatsappNumber ||
    settings.support_phone ||
    settings.supportPhone ||
    ''
  ).trim();

  const hasContactNumber = contactAdminNumber.replace(/[^0-9]/g, '').length > 0;

  const handleContactAdmin = () => {
    const rawPhone = contactAdminNumber.replace(/[^0-9]/g, '');
    if (!rawPhone) {
      toast.error('رقم التواصل مع الإدارة غير متاح حالياً.');
      return;
    }

    const message = `السلام عليكم، أنا ${audienceByUserType[userType]} وأحتاج مساعدة في استرجاع كلمة المرور.`;
    const waUrl = `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setIsForgotPasswordOpen(false);
  };

  // Login logic functions
  const validateField = (name: string, value: string): string | undefined => {
    if (name === 'phone') {
      if (!value.trim()) return 'رقم الهاتف مطلوب';
      if (value.length > 0 && !value.startsWith('0')) return 'رقم الهاتف يجب أن يبدأ بـ 0';
      if (value.length > 1 && !value.startsWith('01')) return 'رقم الهاتف يجب أن يبدأ بـ 01';
      if (value.length > 2 && !/^01[0125]/.test(value)) return 'كود الشركة غير صحيح (010, 011, 012, 015)';
      if (value.length > 0 && value.length < 11) return `رقم الهاتف غير مكتمل (${value.length}/11 رقم)`;
      if (value.length > 11) return 'رقم الهاتف أكثر من 11 رقم';
    }
    if (name === 'password') {
      if (!value) return 'كلمة المرور مطلوبة';
      if (value.length < 6) return `كلمة المرور قصيرة (${value.length}/6 أحرف)`;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const errors: any = {};
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
    setTouched({ phone: true, password: true });
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      await login(formData.phone, formData.password, userType);
      if (userType === 'student') router.push('/student/teachers');
      else if (userType === 'parent') router.push('/parent/children');
      else if (userType === 'academy') router.push('/academy/dashboard');
      else {
        const dashboardPath = userType === 'secretary' ? '/teacher/dashboard' : `/${userType}/dashboard`;
        router.push(dashboardPath);
      }
    } catch (err: any) {
      setIsLoading(false);
      const status = err?.statusCode ?? err?.status;
      const errorData = err?.data;
      if (status === 401) {
        setError('بيانات الدخول غير صحيحة. تأكد من رقم الهاتف وكلمة المرور.');
      } else if (status === 429) {
        const retryAfter = Math.max(0, errorData?.retry_after || 60);
        setIsBanned(true);
        setCountdown(retryAfter);
        setError(`تم حظرك مؤقتاً بسبب محاولات تسجيل دخول فاشلة متعددة`);
      } else {
        setError(err.message || 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === 'phone') processedValue = value.replace(/[^0-9]/g, '').slice(0, 11);
    setFormData({ ...formData, [name]: processedValue });
    if (error) setError('');
    const fieldError = validateField(name, processedValue);
    setValidationErrors((prev: any) => ({ ...prev, [name]: fieldError }));
    if (processedValue.length > 0) setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const fieldError = validateField(name, value);
    setValidationErrors((prev: any) => ({ ...prev, [name]: fieldError }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) return;
    if (!/^[0-9]$/.test(e.key)) e.preventDefault();
  };

  useEffect(() => {
    if (!isBanned || countdown <= 0) return;
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
  }, [isBanned, countdown]);

  useEffect(() => {
    setValidationErrors({});
    setTouched({ phone: false, password: false });
    setError('');
  }, [userType]);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, []);

  const useInView = (threshold = 0.15) => {
    const ref = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setInView(true); },
        { threshold }
      );
      obs.observe(el);
      return () => obs.disconnect();
    }, [threshold]);
    return { ref, inView };
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await fetchApi('/api/v1/public-settings', { method: 'GET' }) as any;
        if (data?.whatsappNumber) {
          setWhatsappNumber(data.whatsappNumber);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    fetchSettings();

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const buildWhatsAppUrl = (rawNumber: string): string | null => {
    if (!rawNumber) return null;
    const normalized = rawNumber.replace(/[^0-9]/g, '');
    if (!normalized) return null;
    return `https://wa.me/${normalized}?text=${encodeURIComponent('السلام عليكم، أريد الاستفسار عن المنصة')}`;
  };

  const waUrl = buildWhatsAppUrl(whatsappNumber);

  const heroAnim = useInView(0.1);
  const ctaAnim = useInView(0.2);

  return (
    <>
      <div className="min-h-screen relative overflow-x-hidden text-white font-[Tajawal] selection:bg-[#3249A9] selection:text-white">
      
      <LandingNavbar onLoginClick={() => setActiveModal('login')} />

      <section className="relative pt-32 pb-0 md:pt-40" style={{ perspective: '1500px' }}>
        <div
          ref={heroAnim.ref}
          className={`max-w-[1200px] mx-auto px-6 text-center transition-all duration-[1200ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
            heroAnim.inView ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transformOrigin: 'center 80%',
            transform: heroAnim.inView ? 'translateY(0) scale(1) rotateX(0)' : 'translateY(100px) scale(0.9) rotateX(20deg)'
          }}
        >
          <div className="inline-flex items-center gap-2 px-5 py-2 mb-8 rounded-full border border-white/10 bg-white/[0.03] text-gray-400 text-[0.85rem]">
            <span>نقدم لكم نيتاق</span>
          </div>

          <h1 className="text-[2.5rem] sm:text-[3.2rem] md:text-[4rem] lg:text-[4.5rem] font-extrabold leading-[1.15] mb-6 tracking-tight">
            النظام الذي يفهم التعليم
            <br />
            <span className="text-white">كما تفهمه أنت.</span>
          </h1>

          <p className="text-[1.05rem] md:text-[1.15rem] text-gray-400 max-w-[580px] mx-auto mb-10 leading-relaxed">
            بعيداً عن الأدوات التقليدية، نيتاق هو نظام تشغيل متكامل مصمم خصيصاً للمؤسسات التعليمية.
          </p>

          <div className="flex items-center justify-center gap-4 mb-16 md:mb-20 flex-wrap">
            <button
              onClick={() => router.push('/login')}
              className="group flex items-center gap-2 px-7 py-3.5 bg-[#3249A9] hover:bg-[#283d8f] text-white font-bold rounded-full transition-all duration-300 text-[0.95rem] shadow-[0_0_30px_rgba(50,73,169,0.25)]"
            >
              <span>ابدأ تجربة مجانية</span>
              <svg className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </button>
            <button
              onClick={() => {
                if (waUrl) window.open(waUrl, '_blank');
                else {
                  const el = document.getElementById('contact');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="group flex items-center gap-2 px-7 py-3.5 text-gray-300 hover:text-white font-semibold transition-all duration-300 text-[0.95rem]"
            >
              <span>الأسعار</span>
              <svg className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </button>
          </div>

          <div className="relative max-w-[1000px] mx-auto mt-16 sm:mt-24 mb-10 w-full h-[400px] sm:h-[450px] md:h-[550px] z-20 pointer-events-none">
            <div className="absolute inset-0 transition-transform duration-100 ease-out" style={{ transform: `rotateX(${-mousePos.y * 12}deg) rotateY(${mousePos.x * 12}deg)`, transformStyle: 'preserve-3d' }}>
              <div className="absolute inset-0 bg-[#3249A9] rounded-full blur-[120px] opacity-10" style={{ transform: 'translateZ(-100px)' }} />
              <div className="absolute left-1/2 top-1/2 w-[95%] md:w-[85%] aspect-square sm:aspect-[4/3] lg:aspect-[16/10] max-w-[850px] rounded-2xl md:rounded-3xl border border-white/10 bg-[#0c0f1a] backdrop-blur-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)]" style={{ transform: 'translate(-50%, -50%) translateZ(0px)' }}>
                <div className="absolute top-0 left-0 right-0 h-8 md:h-10 bg-[#15192b] border-b border-white/5 flex items-center px-4 gap-2 z-30">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#ff5f56]"></div>
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#ffbd2e]"></div>
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#27c93f]"></div>
                </div>
                <div className="absolute top-8 md:top-10 left-0 right-0 bottom-0 flex bg-[#0c0f1a] z-10 overflow-hidden font-sans" dir="rtl">
                  <div className="w-[30%] md:w-[22%] h-full bg-[#111524] border-l border-white/5 flex flex-col pt-4 md:pt-6 pb-2 md:pb-4 shrink-0">
                    <div className="px-3 md:px-5 mb-6 md:mb-8 flex items-center justify-start gap-2">
                       <div className="w-5 h-5 md:w-6 md:h-6 rounded-md bg-[#3249A9]/20 flex items-center justify-center shrink-0">
                         <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-[#3249A9] rounded-sm"></div>
                       </div>
                       <span className="font-bold text-[10px] md:text-sm text-white hidden sm:block">نيتاق التعليمية</span>
                    </div>
                    <div className="flex flex-col gap-1 px-2 md:px-3 flex-1 overflow-hidden">
                      <div className="px-2 md:px-3 py-1.5 md:py-2 mx-1 md:mx-0 bg-white/5 rounded-lg text-[#27c93f] text-[9px] md:text-xs font-semibold flex items-center justify-center sm:justify-start gap-2 cursor-pointer transition-colors shadow-inner">
                        <svg className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        <span className="hidden sm:block">لوحة القيادة</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col bg-[#080b14] relative overflow-hidden">
                    <div className="h-10 md:h-12 border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0 bg-[#0c0f1a]/50">
                       <div className="flex-1 max-w-[150px] md:max-w-xs">
                         <div className="w-full h-6 md:h-8 bg-[#15192b] border border-white/5 hover:border-white/20 transition-colors rounded-full flex items-center px-2 md:px-3 gap-2 cursor-text">
                           <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                           <div className="text-[8px] md:text-[10px] text-gray-500 truncate">بحث عن طالب أو دورة...</div>
                         </div>
                       </div>
                    </div>
                    <div className="flex-1 p-3 md:p-5 overflow-hidden flex flex-col gap-3 md:gap-5">
                       <div className="flex items-center justify-between shrink-0">
                         <div className="flex flex-col">
                           <h3 className="text-xs md:text-sm font-bold text-white">لوحة قيادة إدارة الطلاب</h3>
                         </div>
                         <button className="px-2 py-1 md:px-3 md:py-1.5 bg-[#27c93f]/10 hover:bg-[#27c93f]/20 text-[#27c93f] text-[8px] md:text-[10px] font-bold rounded-lg transition-colors border border-[#27c93f]/20">
                            + إضافة طالب
                         </button>
                       </div>
                       <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4 shrink-0">
                         <div className="bg-[#111524] border border-white/5 rounded-xl p-2.5 md:p-3.5 flex flex-col gap-2 hover:border-[#27c93f]/30 transition-all cursor-pointer">
                           <div className="flex items-center justify-between">
                             <span className="text-[8px] md:text-[10px] text-gray-400">إجمالي الطلاب</span>
                           </div>
                           <div className="flex items-end gap-1.5 md:gap-2">
                             <div className="text-sm md:text-lg font-bold text-white">1,245</div>
                           </div>
                         </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-20 md:py-28" style={{ perspective: '1500px' }}>
        <div className="w-[90%] md:w-[75%] max-w-[1000px] mx-auto">
          <div
            ref={ctaAnim.ref}
            className={`relative rounded-[2rem] overflow-hidden border border-white/[0.06] p-10 md:p-16 transition-all duration-[1200ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] flex flex-col items-center justify-center text-center ${
              ctaAnim.inView ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="absolute top-0 right-1/2 translate-x-1/2 w-[300px] h-[300px] bg-[#3249A9] rounded-full blur-[180px] opacity-[0.06] pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center w-full">
              <h2 className="text-[1.9rem] md:text-[2.6rem] font-extrabold leading-[1.3] mb-8">
                وفّر ٢٠٪ من وقتك في المهام الروتينية.
              </h2>
              <button
                onClick={() => router.push('/login')}
                className="group inline-flex items-center gap-2 px-7 py-3.5 bg-[#3249A9] hover:bg-[#283d8f] text-white font-bold rounded-full transition-all duration-300 text-[0.95rem] shadow-[0_0_30px_rgba(50,73,169,0.25)]"
              >
                <span>ابدأ تجربة مجانية</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative py-6 z-20 mt-10 border-t border-white/[0.04]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
               <img src="/logo.png" alt="Neetaq Logo" className="w-[1.2rem] h-[1.2rem] object-contain" />
               <span className="text-white font-bold tracking-wide text-sm">نيتاق</span>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-3 text-[0.85rem] text-gray-400">
              <a href="#" className="hover:text-[#3249A9] transition-colors">عن نيتاق</a>
              <button onClick={() => setActiveModal('privacy')} className="hover:text-[#3249A9] transition-colors">سياسة الخصوصية</button>
              <button onClick={() => setActiveModal('terms')} className="hover:text-[#3249A9] transition-colors">الشروط والأحكام</button>
            </div>
          </div>
        </div>
      </footer>

      {activeModal === 'login' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0c0f1a]/80 backdrop-blur-md" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-[450px] animate-in fade-in zoom-in duration-300">
             <LoginContainer>
                <LoginCard
                  title={userType === 'teacher' ? 'مرحبا بك مدرسي العزيز' : 'مرحبا بك'}
                  subtitle="سجل دخولك لإدارة فصولك الدراسية"
                  icon={<img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />}
                >
                  <UserTypeSelector userType={userType} onChange={setUserType} />
                  <form onSubmit={handleSubmit} className="flex flex-col mt-4">
                    <Input id="phone" name="phone" type="tel" label="رقم الهاتف" value={formData.phone} onChange={handleInputChange} icon="fas fa-phone" required />
                    <Input id="password" name="password" type="password" label="كلمة المرور" value={formData.password} onChange={handleInputChange} icon="fas fa-lock" required />
                    <Button type="submit" loading={isLoading} className="w-full mt-4 bg-[#3249A9] hover:bg-[#283d8f] py-4 rounded-xl font-bold">دخول المنصة</Button>
                  </form>
                </LoginCard>
             </LoginContainer>
          </div>
        </div>
      )}

      {activeModal && activeModal !== 'login' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0c0f1a]/80 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
          <div className="relative bg-[#15192b] border border-white/10 rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">{activeModal === 'privacy' ? 'سياسة الخصوصية' : 'الشروط والأحكام'}</h3>
            <div className="text-gray-300 text-sm leading-relaxed space-y-4">
              <p>محتوى تعريفي خاص بالمنصة وفقاً للشروط المتبعة.</p>
            </div>
            <div className="mt-8 flex justify-end">
              <button onClick={() => setActiveModal(null)} className="px-6 py-2.5 bg-[#3249A9] hover:bg-[#283d8f] text-white font-medium rounded-lg transition-colors text-sm">موافق وإغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
