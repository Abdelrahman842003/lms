'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/contexts/SettingsContext';
import LandingLayout from './LandingLayout';

interface LandingContent {
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    description: string;
    cta_primary: string;
    cta_secondary: string;
  };
  features: Array<{ icon: string; title: string; description: string }>;
  stats: Array<{ label: string; value: string }>;
  testimonials: Array<{ name: string; role: string; quote: string }>;
}

export default function LandingPage() {
  const { settings } = useSettings();
  const [activeView, setActiveView] = useState(0);
  const router = useRouter();

  const landingContent = useMemo(() => {
    if (!settings.landing_page_content) return null;
    try {
      return JSON.parse(settings.landing_page_content) as LandingContent;
    } catch (e) {
      console.error('Failed to parse landing page content', e);
      return null;
    }
  }, [settings.landing_page_content]);

  // Smooth mouse tracking for 3D tilt effect
  const mousePos = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const [isTransitioning, setIsTransitioning] = useState(false);

  // Rotating Dashboard View Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveView((prev) => (prev + 1) % 3);
        setIsTransitioning(false);
      }, 400);
    }, 6000);
    return () => clearInterval(interval);
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

  const buildWhatsAppUrl = (rawNumber: string): string | null => {
    if (!rawNumber) return null;
    const normalized = rawNumber.replace(/[^0-9]/g, '');
    return normalized ? `https://wa.me/${normalized}?text=${encodeURIComponent('السلام عليكم، أريد الاستفسار عن المنصة')}` : null;
  };

  const waUrl = buildWhatsAppUrl(settings.whatsappNumber);
  const heroAnim = useInView(0.1);
  const ctaAnim = useInView(0.2);

  // Dashboard View Data
  const dashboardData = [
    {
      subtitle: 'مرحباً بك مجدداً، إليك ملخص اليوم.',
      stats: [
        { label: 'إجمالي الطلاب', value: '1,245', trend: '+12.5%', color: '#27c93f' },
        { label: 'المعلمين', value: '84', trend: '+2', color: '#3249A9' },
      ],
      chartTitle: 'نشاط الطلاب الأسبوعي',
      updates: [
        { user: 'أحمد علي', action: 'تم تسجيل دفع رسوم الترم', time: 'منذ 5 د', color: '#27c93f' },
        { user: 'سارة محمد', action: 'انضمت لدورة الفيزياء', time: 'منذ 12 د', color: '#3249A9' },
        { user: 'خالد عمر', action: 'أكمل اختبار الكيمياء', time: 'منذ ساعة', color: '#ffbd2e' },
       
      ]
    },
    {
      subtitle: 'فيديوهات، اختبارات، ومحتوى تعليمي متقدم.',
      stats: [
        { label: 'دروس مرئية', value: '450+', trend: 'متجدد', color: '#3249A9' },
        { label: 'اختبارات قصيرة', value: '1,200', trend: '+15', color: '#27c93f' },
       
      ],
      chartTitle: 'معدل إكمال الدروس',
      updates: [
        { user: 'المعلم مروان', action: 'أضاف درس "الوراثة" الجديد', time: 'منذ 5 د', color: '#3249A9' },
        { user: 'نظام الامتحانات', action: 'تم تحديث بنك الأسئلة', time: 'منذ ساعة', color: '#27c93f' },
        { user: 'مكتبة النطاق', action: 'رفع ملخص الوحدة الثالثة', time: 'منذ 3 ساعات', color: '#ffbd2e' },
      ]
    },
    {
      subtitle: 'تعلم، تفاعل، واصعد في لوحة الصدارة.',
      stats: [
        { label: 'نقاط الخبرة XP', value: '125K', trend: '+500', color: '#3249A9' },
        { label: 'الأوسمة الممنوحة', value: '3,842', trend: '+45', color: '#27c93f' },
        { label: 'المستوى العام', value: 'Lv. 42', trend: 'خبير', color: '#ffbd2e' },
      ],
      chartTitle: 'نقاط التفاعل الأسبوعية',
      updates: [
        { user: 'ياسين محمود', action: 'حصل على وسام "ملك الفيزياء"', time: 'منذ دقيقتين', color: '#27c93f' },
        { user: 'سناء يوسف', action: 'قفزت للمركز الأول عالمياً', time: 'منذ 15 د', color: '#ffbd2e' },
        { user: 'نظام الجوائز', action: 'فتح تحدي "ماراثون القراءة"', time: 'منذ ساعة', color: '#3249A9' },
      ]
    }
  ];

  // Default content
  const content: LandingContent = landingContent || {
    hero: {
      badge: ' عزيزي الطالب، إذا كنت غير قادر على دفع الاشتراك الشهري للمنصة او للسنتر ، يرجى التواصل معنا من فضلك',
      title: 'النظام الذي يفهم التعليم',
      subtitle: 'كما تفهمه أنت.',
      description: 'بعيداً عن الأدوات التقليدية، نطاق هو نظام تشغيل متكامل مصمم خصيصاً للمؤسسات التعليمية.',
      cta_primary: 'ابدأ تجربة مجانية',
      cta_secondary: 'الأسعار',
    },
    features: [],
    stats: [],
    testimonials: []
  };

  return (
    <LandingLayout>
      <section className="relative pt-12 pb-0 md:pt-20" style={{ perspective: '1500px' }}>
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
            <span className="w-1.5 h-1.5 rounded-full bg-[#3249A9] animate-pulse"></span>
            <span>{content.hero.badge}</span>
          </div>

          <h1 className="text-[2.2rem] sm:text-[3.2rem] md:text-[4rem] lg:text-[4.5rem] font-extrabold leading-[1.15] mb-6 tracking-tight">
            {content.hero.title}
            <br />
            <span className="text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40">{content.hero.subtitle}</span>
          </h1>

          <p className="text-[0.95rem] md:text-[1.15rem] text-gray-400 max-w-[580px] mx-auto mb-10 leading-relaxed px-4">
            {content.hero.description}
          </p>

          <div className="flex items-center justify-center gap-4 mb-16 md:mb-20 flex-wrap px-4">
            <button
              onClick={() => router.push('/login')}
              className="group flex items-center gap-2 px-7 py-3.5 bg-[#3249A9] hover:bg-[#283d8f] text-white font-bold rounded-full transition-all duration-300 text-[0.95rem] shadow-[0_10px_30px_rgba(50,73,169,0.25)] hover:shadow-[0_15px_40px_rgba(50,73,169,0.35)] hover:-translate-y-0.5"
            >
              <span>{content.hero.cta_primary}</span>
              <svg className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </button>
            <button
              onClick={() => {
                if (waUrl) window.open(waUrl, '_blank');
                else router.push('/contact');
              }}
              className="group flex items-center gap-2 px-7 py-3.5 text-gray-300 hover:text-white font-semibold transition-all duration-300 text-[0.95rem] hover:bg-white/5 rounded-full"
            >
              <span>{content.hero.cta_secondary}</span>
              <svg className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </button>
          </div>

          {/* Product Showcase Section */}
          <div className="mt-16 sm:mt-24 mb-10 w-full relative z-20">
            {/* Showcase Container */}
            <div className={`max-w-[1200px] mx-auto transition-all duration-500 ${isTransitioning ? 'opacity-0 scale-[0.98] blur-sm' : 'opacity-100 scale-100 blur-0'}`}>
              <div className="bg-[#0B0F1A] rounded-[2rem] sm:rounded-[3rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.6)] overflow-hidden">
                {/* Header/Top Bar */}
                <div className="h-10 sm:h-14 bg-white/[0.03] border-b border-white/10 flex items-center px-6 sm:px-10 justify-between">
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500 font-bold tracking-[0.2em] hidden xs:block">SYSTEM.NIFAQ.EDU</div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/5 border border-white/10"></div>
                  </div>
                </div>

                <div className="p-4 sm:p-10 lg:p-14">
                  <div className={`transition-all duration-500 ${isTransitioning ? 'opacity-0 translate-y-4 blur-md' : 'opacity-100 translate-y-0 blur-0'}`}>
                    
                    {/* VIEW 0: PERFORMANCE OVERVIEW (Modern Hub Style) */}
                    {activeView === 0 && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8">
                        {/* Main Summary Hero */}
                        <div className="lg:col-span-12 bg-gradient-to-r from-[#3249A9]/20 to-transparent border border-white/10 rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 md:p-12 flex flex-col md:flex-row items-center gap-6 sm:gap-10">
                           <div className="relative w-28 h-28 sm:w-48 sm:h-48 shrink-0">
                              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.05" />
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#27c93f" strokeWidth="8" strokeDasharray="283" strokeDashoffset="40" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(39,201,63,0.5)]" />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xl sm:text-4xl font-black text-white">85%</span>
                                <span className="text-[8px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest">معدل النمو</span>
                              </div>
                           </div>
                           <div className="flex-1 text-center md:text-right">
                              <h3 className="text-xl sm:text-4xl font-black text-white mb-3 sm:mb-4">أداء استثنائي اليوم</h3>
                              <p className="text-gray-400 text-xs sm:text-lg max-w-xl md:ml-0 md:mr-0 mx-auto">لقد حققت المنصة زيادة بنسبة 12% في تفاعل الطلاب مقارنة بالأسبوع الماضي. جميع الأنظمة تعمل بكفاءة تامة.</p>
                              <div className="flex gap-3 sm:gap-4 mt-6 sm:mt-8 justify-center md:justify-start flex-wrap">
                                 {dashboardData[0].stats.slice(0, 3).map((s, i) => (
                                   <div key={i} className="px-3 sm:px-5 py-2 sm:py-2.5 bg-white/5 rounded-lg sm:rounded-xl border border-white/5 flex items-center gap-2 sm:gap-3">
                                      <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full" style={{ backgroundColor: s.color }}></div>
                                      <span className="text-white font-bold text-[10px] sm:text-sm whitespace-nowrap">{s.label}: {s.value}</span>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>

                        {/* Recent Activity Wall */}
                        <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-6">
                           <span className="text-lg sm:text-xl font-black text-white">نبض المنصة</span>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                             {dashboardData[0].updates.map((u, i) => (
                               <div key={i} className="bg-[#111524] border border-white/5 p-4 sm:p-5 rounded-[1.5rem] sm:rounded-3xl hover:bg-white/[0.04] transition-all group">
                                  <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center text-[10px] sm:text-xs font-black text-white" style={{ border: `2px solid ${u.color}` }}>{u.user[0]}</div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-white font-bold text-[11px] sm:text-sm truncate">{u.user}</span>
                                      <span className="text-gray-500 text-[8px] sm:text-[10px]">{u.time}</span>
                                    </div>
                                  </div>
                                  <p className="text-gray-400 text-[10px] sm:text-xs leading-relaxed line-clamp-2">{u.action}</p>
                               </div>
                             ))}
                           </div>
                        </div>

                        {/* Quick Stats Column */}
                        <div className="lg:col-span-5 bg-[#111524] border border-white/5 rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 flex flex-col gap-6 sm:gap-8">
                           <span className="text-lg sm:text-xl font-black text-white">إحصائيات سريعة</span>
                           <div className="flex flex-col gap-5 sm:gap-6">
                             {dashboardData[0].stats.map((s, i) => (
                               <div key={i} className="flex flex-col gap-2 sm:gap-3">
                                  <div className="flex justify-between items-end">
                                    <span className="text-gray-500 text-[9px] sm:text-xs font-bold uppercase">{s.label}</span>
                                    <span className="text-white font-black text-base sm:text-xl">{s.value}</span>
                                  </div>
                                  <div className="w-full h-1.5 sm:h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: s.trend.includes('+') ? '75%' : '40%', backgroundColor: s.color }}></div>
                                  </div>
                               </div>
                             ))}
                           </div>
                        </div>
                      </div>
                    )}

                    {/* VIEW 1: INTERACTIVE LEARNING (Videos & Exams) */}
                    {activeView === 1 && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                        {/* Video Player Preview */}
                        <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-6">
                           <div className="relative aspect-video bg-[#0c0f1a] rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden border border-white/10 group cursor-pointer shadow-2xl">
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
                              <img src="https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop" alt="Lesson" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
                              <div className="absolute inset-0 flex items-center justify-center z-20">
                                 <div className="w-14 h-14 sm:w-20 sm:h-20 bg-[#3249A9] rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(50,73,169,0.5)] group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                 </div>
                              </div>
                              <div className="absolute bottom-4 sm:bottom-8 right-4 sm:right-8 left-4 sm:left-8 z-20 flex flex-col xs:flex-row justify-between items-start xs:items-end gap-3">
                                 <div className="flex flex-col gap-1.5 sm:gap-2">
                                    <span className="bg-[#3249A9] text-white text-[8px] sm:text-[10px] font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-full w-fit">محاضرة جارية</span>
                                    <h4 className="text-white text-sm sm:text-2xl font-black line-clamp-1">المراجعة النهائية: قوانين الفيزياء الحديثة</h4>
                                 </div>
                                 <span className="text-white/60 text-[10px] sm:text-sm font-bold">45:20 / 60:00</span>
                              </div>
                           </div>
                        </div>

                        {/* Interactive Exams Sidebar */}
                        <div className="lg:col-span-4 flex flex-col gap-6">
                           <div className="bg-gradient-to-br from-[#111524] to-[#0c0f1a] border border-white/5 rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-8">
                              <h3 className="text-base sm:text-lg font-black text-white mb-6">الاختبارات القادمة</h3>
                              <div className="flex flex-col gap-5 sm:gap-6">
                                 {[
                                   { title: 'كيمياء عضوية', date: 'غداً، 10:00 ص', students: 120, difficulty: 'متوسط' },
                                   { title: 'رياضيات بحتة', date: 'الأحد، 12:00 م', students: 85, difficulty: 'صعب' },
                                 ].map((exam, i) => (
                                   <div key={i} className="flex flex-col gap-2.5 sm:gap-3 group cursor-pointer">
                                      <div className="flex justify-between items-start">
                                         <span className="text-white font-black text-[13px] sm:text-sm group-hover:text-blue-400 transition-colors">{exam.title}</span>
                                         <span className={`text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded ${exam.difficulty === 'صعب' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>{exam.difficulty}</span>
                                      </div>
                                      <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-gray-500 font-bold">
                                         <div className="flex items-center gap-2"><span>📅 {exam.date}</span></div>
                                         <div className="flex items-center gap-2"><span>👥 {exam.students} طالب</span></div>
                                      </div>
                                      <div className="w-full h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                                         <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: i === 0 ? '60%' : '40%' }}></div>
                                      </div>
                                   </div>
                                 ))}
                              </div>
                              <button className="w-full mt-6 sm:mt-8 py-2.5 sm:py-3 bg-white/5 hover:bg-white/10 text-white text-[11px] sm:text-xs font-black rounded-lg sm:rounded-xl transition-all border border-white/5">فتح بنك الأسئلة</button>
                           </div>

                           {/* Course Progress Card */}
                           <div className="bg-[#3249A9] rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 text-white relative overflow-hidden group shadow-2xl shadow-[#3249A9]/20">
                              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
                              <div className="relative z-10">
                                 <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-60">تقدم المنهج العام</span>
                                 <div className="flex items-end gap-2 sm:gap-3 my-3 sm:my-4">
                                    <span className="text-2xl sm:text-4xl font-black">78%</span>
                                    <span className="text-[9px] sm:text-xs font-bold mb-1 opacity-80">+5% هذا الأسبوع</span>
                                 </div>
                                 <div className="w-full h-1.5 sm:h-2 bg-white/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: '78%' }}></div>
                                 </div>
                              </div>
                           </div>
                        </div>
                      </div>
                    )}

                    {/* VIEW 2: GAMIFICATION (XP, Levels, Badges) */}
                    {activeView === 2 && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                        {/* Profile XP & Level (The "Gamer" Card) */}
                        <div className="lg:col-span-5 flex flex-col gap-6">
                           <div className="bg-[#111524] border border-white/10 rounded-[1.5rem] sm:rounded-[3rem] p-6 sm:p-10 flex flex-col items-center text-center relative overflow-hidden group shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
                              <div className="absolute inset-0 bg-gradient-to-b from-[#3249A9]/10 to-transparent"></div>
                              {/* Glowing Level Circle */}
                              <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-6 sm:mb-8">
                                 <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="46" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.05" />
                                    <circle cx="50" cy="50" r="46" fill="none" stroke="#ffbd2e" strokeWidth="6" strokeDasharray="289" strokeDashoffset="80" strokeLinecap="round" className="drop-shadow-[0_0_10px_rgba(255,189,46,0.6)]" />
                                 </svg>
                                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl sm:text-4xl font-black text-white">42</span>
                                    <span className="text-[8px] sm:text-[10px] text-gray-500 font-black uppercase">Level</span>
                                 </div>
                              </div>
                              <h3 className="text-lg sm:text-2xl font-black text-white mb-2">ياسين محمود</h3>
                              <div className="flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 bg-white/5 rounded-full border border-white/10 mb-6 sm:mb-8">
                                 <span className="text-[#ffbd2e] text-[10px] sm:text-xs font-black">⚡ 1,250 XP للمستوى التالي</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
                                 <div className="bg-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5">
                                    <span className="text-gray-500 text-[8px] sm:text-[10px] font-black block mb-1">نقاط التفاعل</span>
                                    <span className="text-white font-black text-sm sm:text-lg">12.4K</span>
                                 </div>
                                 <div className="bg-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5">
                                    <span className="text-gray-500 text-[8px] sm:text-[10px] font-black block mb-1">ترتيبك الحالي</span>
                                    <span className="text-[#27c93f] font-black text-sm sm:text-lg">#3</span>
                                 </div>
                              </div>
                           </div>

                           {/* Daily Challenges */}
                           <div className="bg-[#111524] border border-white/5 rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 flex flex-col gap-4 sm:gap-6">
                              <div className="flex justify-between items-center">
                                 <span className="text-white font-black text-sm sm:text-base">تحديات اليوم</span>
                                 <span className="text-gray-500 text-[10px] sm:text-xs font-bold">1/3 منجز</span>
                              </div>
                              {[
                                { t: 'شاهد فيديو تعليمي كامل', xp: 50, done: true },
                                { t: 'حل اختبار قصير بدون أخطاء', xp: 150, done: false },
                                { t: 'تفاعل مع درس مباشر', xp: 100, done: false },
                              ].map((c, i) => (
                                <div key={i} className="flex items-center gap-3 sm:gap-4 bg-white/[0.02] p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5">
                                   <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center ${c.done ? 'bg-[#27c93f] border-[#27c93f]' : 'border-white/10'}`}>
                                      {c.done && <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                                   </div>
                                   <span className={`text-[11px] sm:text-xs font-bold flex-1 ${c.done ? 'text-gray-500 line-through' : 'text-white'}`}>{c.t}</span>
                                   <span className="text-[#ffbd2e] text-[8px] sm:text-[10px] font-black whitespace-nowrap">+{c.xp} XP</span>
                                </div>
                              ))}
                           </div>
                        </div>

                        {/* Badges & Leaderboard */}
                        <div className="lg:col-span-7 flex flex-col gap-6 sm:gap-8">
                           <div className="bg-[#111524] border border-white/5 rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-10 flex-1">
                              <h3 className="text-base sm:text-xl font-black text-white mb-6 sm:mb-8">لوحة الصدارة (Global)</h3>
                              <div className="flex flex-col gap-3 sm:gap-4">
                                 {[
                                   { r: 1, n: 'سناء يوسف', xp: '158,400', img: 'S' },
                                   { r: 2, n: 'أحمد علي', xp: '142,200', img: 'A' },
                                   { r: 3, n: 'ياسين محمود', xp: '125,000', img: 'Y', me: true },
                                 ].map((user, i) => (
                                   <div key={i} className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all ${user.me ? 'bg-[#3249A9] border-[#3249A9] shadow-lg shadow-[#3249A9]/20 scale-[1.02]' : 'bg-white/[0.02] border border-white/5 hover:bg-white/[0.04]'}`}>
                                      <span className={`text-sm sm:text-lg font-black w-5 sm:w-6 text-center ${user.r === 1 ? 'text-[#ffbd2e]' : user.r === 2 ? 'text-gray-400' : user.r === 3 && !user.me ? 'text-orange-400' : 'text-gray-600'}`}>{user.r}</span>
                                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center font-black text-white border border-white/10 text-xs sm:text-sm">{user.img}</div>
                                      <span className="text-white font-black text-[11px] sm:text-sm flex-1 truncate">{user.n} {user.me && <span className="mr-1 text-[8px] sm:text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">(أنت)</span>}</span>
                                      <span className="text-white/60 font-black text-[10px] sm:text-sm whitespace-nowrap">{user.xp} XP</span>
                                   </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section Dynamic */}
      {content.stats.length > 0 && (
        <section className="py-10 md:py-20 bg-white/[0.01] border-y border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#3249A9]/5 to-transparent animate-pulse"></div>
          <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-2 md:grid-cols-3 gap-12 text-center relative z-10">
            {content.stats.map((stat, idx) => (
              <div key={idx} className="flex flex-col gap-3 group">
                <span className="text-4xl md:text-5xl font-black text-[#3249A9] group-hover:scale-110 transition-transform duration-500 tracking-tighter">{stat.value}</span>
                <span className="text-gray-400 font-bold text-sm md:text-base uppercase tracking-[0.2em]">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Features Section Dynamic */}
      {content.features.length > 0 && (
        <section className="py-20 md:py-32">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-right">
              {content.features.map((feature, idx) => (
                <div key={idx} className="group bg-[#15192B] p-10 rounded-[2.5rem] border border-white/5 hover:border-[#3249A9]/30 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#3249A9]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-16 h-16 bg-[#3249A9]/10 rounded-2xl flex items-center justify-center mb-8 text-[#3249A9] group-hover:bg-[#3249A9] group-hover:text-white transition-all duration-500 shadow-xl">
                    <i className={`text-2xl ${feature.icon.includes('heroicon') ? 'fas fa-rocket' : feature.icon}`}></i>
                  </div>
                  <h3 className="text-2xl font-black mb-4 text-white group-hover:text-[#3249A9] transition-colors">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm md:text-base font-medium">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 md:py-32" style={{ perspective: '1500px' }}>
        <div className="w-[92%] md:w-[80%] max-w-[1100px] mx-auto">
          <div
            ref={ctaAnim.ref}
            className={`relative rounded-[3rem] overflow-hidden border border-white/[0.08] p-12 md:p-24 transition-all duration-[1200ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] flex flex-col items-center justify-center text-center bg-[#0c0f1a] ${
              ctaAnim.inView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#3249A9]/10 to-transparent"></div>
            <div className="absolute top-0 right-1/2 translate-x-1/2 w-[400px] h-[400px] bg-[#3249A9] rounded-full blur-[200px] opacity-[0.1] pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center w-full">
              <h2 className="text-[2rem] md:text-[3.5rem] font-black leading-[1.2] mb-10 tracking-tight">
                جاهز للارتقاء بمؤسستك <br className="hidden md:block" /> التعليمية للمستوى القادم؟
              </h2>
              <button
                onClick={() => router.push('/login')}
                className="group inline-flex items-center gap-3 px-10 py-5 bg-[#3249A9] hover:bg-[#283d8f] text-white font-black rounded-full transition-all duration-300 text-[1.1rem] shadow-[0_20px_50px_rgba(50,73,169,0.3)] hover:shadow-[0_25px_60px_rgba(50,73,169,0.4)] hover:-translate-y-1"
              >
                <span>ابدأ الآن مجاناً</span>
                <svg className="w-5 h-5 rtl:rotate-180 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
}
